import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';

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

useEffect(() => {
  // Get user info from localStorage
  const storedName = localStorage.getItem('userName') || '';
  const storedEmail = localStorage.getItem('userEmail') || '';
  const storedRole = localStorage.getItem('userRole') || 'Standard User';
  
  const userData = {
    name: storedName,
    email: storedEmail,
    role: storedRole,
  };
  
  setProfileData(prev => ({
    ...prev,
    ...userData
  }));
  
  setOriginalData(userData); // Store original data
}, []);

const handleChange = (field, value) => {
  const newData = { ...profileData, [field]: value };
  setProfileData(newData);
  setFormErrors(prev => ({ ...prev, [field]: '' }));
  if (showSuccess) setShowSuccess(false);
  
  // Check if there are actual changes
  const personalInfoChanged = newData.name !== originalData.name || newData.email !== originalData.email;
  const passwordChanged = newData.newPassword || newData.confirmPassword;
  setHasChanges(personalInfoChanged || passwordChanged);
};

const handleSaveChanges = () => {
  // Check if there are any changes
  if (!hasChanges) {
    return; // Do nothing if no changes
  }

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

  const isChangingPassword = profileData.newPassword || profileData.confirmPassword;

  // Validate password if changing
  if (isChangingPassword) {
    if (!profileData.newPassword) {
      errors.newPassword = 'New password is required';
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

  // Determine what was changed
  const personalInfoChanged = profileData.name !== originalData.name || profileData.email !== originalData.email;
  
  // Save updated name and email to localStorage
  localStorage.setItem('userName', profileData.name);
  localStorage.setItem('userEmail', profileData.email);

  // Simulate API call
  console.log('Saving profile changes:', profileData);

  // Update original data
  setOriginalData({
    name: profileData.name,
    email: profileData.email,
    role: profileData.role
  });

  // Clear password fields
  setProfileData(prev => ({
    ...prev,
    newPassword: '',
    confirmPassword: ''
  }));

  // Set appropriate success message
  if (isChangingPassword && personalInfoChanged) {
    setSuccessMessage('Profile and password updated successfully!');
  } else if (isChangingPassword) {
    setSuccessMessage('Password changed successfully!');
  } else if (personalInfoChanged) {
    setSuccessMessage('Profile updated successfully!');
  }

  setHasChanges(false);
  setShowSuccess(true);
  setTimeout(() => setShowSuccess(false), 3000);
};

  return (
    <SidebarLayout role={role}>
      <Container fluid style={{ backgroundColor: '#f8f9fa', minHeight: '100vh', padding: '20px 0' }}>
        <Row className="justify-content-center">
          <Col md={12} lg={10} xl={9}>
            {/* Page Header */}
            <div className="mb-4">
              <h2 className="fw-bold text-dark mb-1">Profile Settings</h2>
              <p className="text-muted">Manage your personal information and security settings</p>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div className="alert alert-success d-flex align-items-center mb-4" role="alert">
                <i className="bi bi-check-circle-fill me-2"></i>
                {successMessage}
              </div>
            )}

            {/* Profile Card */}
            <Card className="border-0 shadow-sm">
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
                    <span className="badge bg-white text-primary">{profileData.role}</span>
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
                  <p className="text-muted small mb-3">Leave blank to keep your current password</p>
                  
                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label className="fw-semibold">New Password</Form.Label>
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
                        <Form.Label className="fw-semibold">Confirm Password</Form.Label>
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
                    variant="primary"
                    onClick={handleSaveChanges}
                    disabled={!hasChanges}
                    className="px-5 py-2"
                    style={{ fontSize: '1rem' }}
                  >
                    <i className="bi bi-check2 me-2"></i>
                    Save Changes
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </SidebarLayout>
  );
}