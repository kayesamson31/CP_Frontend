import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card, Alert } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import { PasswordUtils } from '../../utils/PasswordUtils';
import { AuditLogger } from '../../utils/AuditLogger';
export default function Profile({ role = 'standard' }) {
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [hasChanges, setHasChanges] = useState(false);
  const [originalData, setOriginalData] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [requirePasswordChange, setRequirePasswordChange] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [loading, setLoading] = useState(true);

useEffect(() => {
  const loadUserProfile = async () => {
    try {
      // Get current authenticated user from Supabase Auth
// Load user from localStorage (set during login)
const stored = localStorage.getItem('currentUser');
if (!stored) {
  console.error('No user found in localStorage. Please log in again.');
  setLoading(false);
  return;
}
const currentUser = JSON.parse(stored);
console.log('Profile loading for local user:', currentUser);

// ✅Query by user_id AND organization_id for isolation
const { data: userData, error: userError } = await supabase
  .from('users')
  .select(`
    *,
    organizations (
      org_name,
      address
    )
  `)
  .eq('user_id', currentUser.id)  //  Use user_id instead of email
  .eq('organization_id', currentUser.organizationId)  //  Filter by org
  .single();


      if (userError || !userData) {
        console.error('Failed to load user data:', userError);
        
        // Fallback to localStorage if database query fails
const fallbackData = {
  name: localStorage.getItem('userName') || '',
  email: localStorage.getItem('userEmail') || '',
  role: localStorage.getItem('userRole') || 'standard',
};

        
        setProfileData(prev => ({ ...prev, ...fallbackData }));
        setOriginalData(fallbackData);
        setLoading(false);
        return;
      }

      console.log('User data loaded:', userData);

      // Convert role_id to string
      let userRole = "";
      switch (userData.role_id) {
        case 1: userRole = "System Administrator"; break;
        case 2: userRole = "Admin Official"; break;
        case 3: userRole = "Personnel"; break;
        case 4: userRole = "Standard User"; break;
        default: userRole = "standard";
      }

     const profileInfo = {
  name: userData.full_name || '',
  email: userData.email || '',
  role: userRole,
  organizationName: userData.organizations?.org_name || 'No Organization',
  organizationAddress: userData.organizations?.address || 'Not specified',
};

      setProfileData(prev => ({ ...prev, ...profileInfo }));
      setOriginalData(profileInfo);

      // Check if password change is required
// ✅ System Admins don't need password change on first login
const needsPasswordChange = userData.first_login === true && userData.role_id !== 1;
      // Update localStorage to keep it in sync
      localStorage.setItem('userName', profileInfo.name);
      localStorage.setItem('userEmail', profileInfo.email);
      localStorage.setItem('userRole', userRole);
      
      if (needsPasswordChange) {
        localStorage.setItem('requirePasswordChange', 'true');
        setRequirePasswordChange(needsPasswordChange);
        setHasChanges(true); // Enable save button
      } else {
        localStorage.removeItem('requirePasswordChange');
        setRequirePasswordChange(false);
      }

    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  loadUserProfile();
}, []);

const handleChange = (field, value) => {
  const newData = { ...profileData, [field]: value };
  setProfileData(newData);
  setFormErrors(prev => ({ ...prev, [field]: '' }));
  if (showSuccess) setShowSuccess(false);
  
  // Check if there are actual changes
  const personalInfoChanged = newData.name !== originalData.name || newData.email !== originalData.email;
  const passwordChanged = newData.newPassword || newData.confirmPassword;
  setHasChanges(personalInfoChanged || passwordChanged || requirePasswordChange);
};

const handleSaveChanges = async () => {
  if (!hasChanges) return;

  const errors = {};

  // Validate name
  if (!profileData.name.trim()) {
    errors.name = 'Name is required';
  }

  // Validate email
  if (!profileData.email.trim()) {
    errors.email = 'Email is required';
  } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
    errors.email = 'Email is invalid';
  }

  const isChangingPassword = profileData.newPassword || profileData.confirmPassword || requirePasswordChange;

  // Validate password if changing or required
  if (isChangingPassword) {
    if (!profileData.newPassword) {
      errors.newPassword = requirePasswordChange ? 'You must set a new password' : 'New password is required';
    } else if (profileData.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!profileData.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (profileData.newPassword !== profileData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
  }

  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  setIsUpdating(true);

  try {
    // Get current authenticated user
// Get current user from localStorage
const stored = localStorage.getItem('currentUser');
if (!stored) {
  alert("Session expired. Please log in again.");
  setIsUpdating(false);
  return;
}
const currentUser = JSON.parse(stored);

    // Prepare update data
    const updateData = {
      full_name: profileData.name.trim(),
      email: profileData.email.toLowerCase().trim()
    };

// Add password update if needed
if (isChangingPassword) {
  updateData.password_hash = PasswordUtils.hashPassword(profileData.newPassword);
  updateData.first_login = false; // Mark as no longer first login
  
  // Also update Supabase Auth password if user has auth_uid
  if (currentUser.authUid) {
    const { error: authUpdateError } = await supabase.auth.updateUser({
      password: profileData.newPassword
    });
    
    if (authUpdateError) {
      console.error('Failed to update Supabase Auth password:', authUpdateError);
      alert('Failed to update authentication password. Please try again.');
      setIsUpdating(false);
      return;
    }
  }
}

console.log('Updating user profile for:', currentUser.email);

const { data, error: updateError } = await supabase
  .from('users')
  .update(updateData)
  .eq('email', currentUser.email)   // ✅ match by email
  .select()
  .single();


    if (updateError) {
      console.error('Database update error:', updateError);
      alert(`Failed to update profile: ${updateError.message}`);
      setIsUpdating(false);
      return;
    }

    console.log('Profile updated successfully:', data);
    // Build detailed action message
let actionDetails = [];

if (profileData.name !== originalData.name) {
  actionDetails.push(`name changed to "${profileData.name}"`);
}
if (profileData.email !== originalData.email) {
  actionDetails.push(`email changed to "${profileData.email}"`);
}
if (isChangingPassword) {
  actionDetails.push('password changed');
}

const actionMessage = actionDetails.length > 0 
  ? `Updated profile: ${actionDetails.join(', ')}`
  : 'Updated profile information';

await AuditLogger.logWithIP({
  userId: data.user_id,
  actionTaken: actionMessage,
  tableAffected: 'users',
  recordId: data.user_id,
  organizationId: currentUser.organizationId  // ✅ ADD THIS
});
    // Update localStorage
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userEmail', profileData.email);
    localStorage.removeItem('requirePasswordChange');

    // Update original data
    setOriginalData({
      name: profileData.name,
      email: profileData.email,
      role: profileData.role
    });

    // Clear password fields and flags
    setProfileData(prev => ({
      ...prev,
      newPassword: '',
      confirmPassword: ''
    }));

    setRequirePasswordChange(false);

    // Set success message
    const personalInfoChanged = profileData.name !== originalData.name || profileData.email !== originalData.email;
    
    if (isChangingPassword && personalInfoChanged) {
      setSuccessMessage('Profile and password updated successfully!');
    } else if (isChangingPassword) {
      setSuccessMessage('Password changed successfully! You can now use the system normally.');
    } else if (personalInfoChanged) {
      setSuccessMessage('Profile updated successfully!');
    }

    setHasChanges(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 5000);

  } catch (error) {
    console.error('Exception during profile update:', error);
    alert(`An error occurred: ${error.message}`);
  } finally {
    setIsUpdating(false);
  }
};

  if (loading) {
    return (
      <SidebarLayout role={role}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '50vh',
          flexDirection: 'column'
        }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p style={{ marginTop: '1rem', color: '#666' }}>Loading profile...</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role={role}>
        <Row className="justify-content-center">
          <Col md={12} lg={10} xl={9}>
            {/* Page Header */}
            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">Profile Settings</h2>
              <p className="text-muted">Manage your personal information and security settings</p>
            </div>

            {/* Password Change Required Alert */}
            {requirePasswordChange && (
              <Alert variant="warning" className="d-flex align-items-center mb-4">
                <i className="bi bi-exclamation-triangle-fill me-2"></i>
                <div>
                  <strong>Password Change Required!</strong>
                  <div className="mt-1">
                    You're using a temporary password. Please set a new password to continue using the system.
                  </div>
                </div>
              </Alert>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                {successMessage}
              </div>
            )}

            {/* Profile Card */}
            <Card className="border-1 shadow-sm">
              {/* Profile Header */}
              <Card.Header className="text-white border-0" style={{ padding: '20px', backgroundColor: '#284386' }}>
  <div className="d-flex align-items-center">
    <div 
      className="bg-white bg-opacity-25 rounded-circle d-flex align-items-center justify-content-center me-3"
      style={{ width: '100px', height: '100px' }}
    >
      <i className="bi bi-person-fill text-white" style={{ fontSize: '3rem' }}></i>
    </div>
    <div>
      <h3 className="mb-1 fw-bold">{profileData.name || 'Your Name'}</h3>
      <p className="mb-1 opacity-90">{profileData.email || 'your.email@example.com'}</p>
      <p className="mb-1 opacity-75 small">
        <i className="bi bi-building me-1"></i>
        {profileData.organizationName || 'No Organization'}
      </p>
      <p className="mb-1 opacity-75 small">
        <i className="bi bi-geo-alt me-1"></i>
        {profileData.organizationAddress || 'Not specified'}
      </p>
      <div className="d-flex align-items-center mt-2">
        <span className="badge bg-white text-primary me-2">{profileData.role}</span>
                      {requirePasswordChange && (
                        <span className="badge bg-warning text-dark">
                          <i className="bi bi-key-fill me-1"></i>Password Change Required
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Card.Header>

              <Card.Body style={{ padding: '40px' }}>
                
                {/* Personal Information */}
                <div className="mb-4">
                  <h5 className="text-dark mb-3">
                    <i className="bi bi-person-circle me-2 text-primary"></i>
                    Personal Information
                  </h5>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Full Name</Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your full name"
                          value={profileData.name}
                          onChange={e => handleChange('name', e.target.value)}
                          isInvalid={!!formErrors.name}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">Email Address</Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email"
                          value={profileData.email}
                          onChange={e => handleChange('email', e.target.value)}
                          isInvalid={!!formErrors.email}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                <hr />

                {/* Security Settings */}
                <div className="mb-4">
                  <h5 className="text-dark mb-3">
                    <i className="bi bi-shield-lock me-2 text-warning"></i>
                    Security Settings
                  </h5>
                  <p className="text-muted small mb-3">
                    {requirePasswordChange 
                      ? "You must set a new password to continue using the system." 
                      : "Leave blank to keep your current password"
                    }
                  </p>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          New Password {requirePasswordChange && <span className="text-danger">*</span>}
                        </Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter new password"
                          value={profileData.newPassword}
                          onChange={e => handleChange('newPassword', e.target.value)}
                          isInvalid={!!formErrors.newPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.newPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">
                          Confirm Password {requirePasswordChange && <span className="text-danger">*</span>}
                        </Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Confirm new password"
                          value={profileData.confirmPassword}
                          onChange={e => handleChange('confirmPassword', e.target.value)}
                          isInvalid={!!formErrors.confirmPassword}
                        />
                        <Form.Control.Feedback type="invalid">
                          {formErrors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Action Button */}
                <div className="d-flex justify-content-end pt-4 border-top">
                  <Button
                    variant={requirePasswordChange ? "warning" : "primary"}
                    onClick={handleSaveChanges}
                    disabled={!hasChanges || isUpdating}
                    className="px-5 py-2"
                    style={{ fontSize: '1rem' }}
                  >
                    {isUpdating ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Updating...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-check2 me-2"></i>
                        {requirePasswordChange ? "Set New Password" : "Save Changes"}
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
     
    </SidebarLayout>
  );
}