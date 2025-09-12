import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Card } from 'react-bootstrap';
import dashprofile from '../../assets/icons/DashProfile.png';
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
      <Container fluid style={{ 
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)', 
        minHeight: '100vh', 
        padding: '0.5rem 0' 
      }}>
        <Row className="justify-content-center">
          <Col md={12} lg={11} xl={10}>
            
            {/* Page Header */}
            <div className="mb-3">
              <div className="d-flex align-items-center mb-1">
                <div className="me-3" style={{
                  width: '3px',
                  height: '28px',
                  background: 'linear-gradient(135deg, #284CFF, #4c6ef5)',
                  borderRadius: '2px'
                }}></div>
                <div>
                  <h1 style={{ 
                    color: '#1e293b', 
                    marginBottom: '0', 
                    fontWeight: '700',
                    fontSize: '2rem'
                  }}>
                    Profile Settings
                  </h1>
                  <p className="text-muted mb-0" style={{ fontSize: '1.1rem' }}>
                    Manage your personal information and security settings
                  </p>
                </div>
              </div>
            </div>

            {/* Success Message */}
            {showSuccess && (
              <div 
                className="alert mb-4" 
                role="alert" 
                style={{ 
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  border: 'none',
                  borderRadius: '16px',
                  color: 'white',
                  padding: '1rem 1.5rem',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.3)',
                  fontSize: '1rem',
                  fontWeight: '500'
                }}
              >
                <div className="d-flex align-items-center">
                  <div className="me-3" style={{
                    width: '24px',
                    height: '24px',
                    backgroundColor: 'rgba(255,255,255,0.2)',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    ✓
                  </div>
                  {successMessage}
                </div>
              </div>
            )}

            {/* Profile Card */}
            <Card
              className="shadow-lg border-0"
              style={{
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)'
              }}
            >
              {/* Card Header with Profile Info */}
              <div style={{ 
                background: 'linear-gradient(135deg, #284CFF 0%, #4c6ef5 100%)',
                padding: '2rem 2.5rem 1.5rem',
                position: 'relative'
              }}>
                {/* Decorative elements */}
                <div style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  width: '100px',
                  height: '100px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  opacity: '0.3'
                }}></div>
                <div style={{
                  position: 'absolute',
                  bottom: '20px',
                  left: '20px',
                  width: '60px',
                  height: '60px',
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: '50%',
                  opacity: '0.5'
                }}></div>

                <div className="d-flex align-items-center">
                  <div className="position-relative me-4">
                    <img
                      src={dashprofile}
                      alt="Profile"
                      style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '6px solid rgba(255,255,255,0.3)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '5px',
                      right: '5px',
                      width: '24px',
                      height: '24px',
                      backgroundColor: '#10b981',
                      borderRadius: '50%',
                      border: '3px solid white'
                    }}></div>
                  </div>
                  <div>
                    <h2 style={{ 
                      margin: '0 0 8px 0', 
                      fontWeight: '700', 
                      color: 'white', 
                      fontSize: '2.2rem',
                      textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                    }}>
                      {profileData.name || 'Your Name'}
                    </h2>
                    <p style={{ 
                      color: 'rgba(255,255,255,0.9)', 
                      fontSize: '1.1rem', 
                      margin: '0 0 8px 0',
                      fontWeight: '500'
                    }}>
                      {profileData.email || 'your.email@example.com'}
                    </p>
                    <div style={{
                      background: 'rgba(255,255,255,0.2)',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      display: 'inline-block'
                    }}>
                      <span style={{ 
                        color: 'white', 
                        fontSize: '0.95rem',
                        fontWeight: '600'
                      }}>
                        {profileData.role}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Body with Form */}
              <Card.Body style={{ padding: '2rem' }}>
                
                {/* Personal Information Section */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-3">
                    <div style={{
                      width: '32px',
                      height: '32px',
                      background: 'linear-gradient(135deg, #284CFF, #4c6ef5)',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '12px'
                    }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>👤</span>
                    </div>
                    <h4 style={{ 
                      color: '#1e293b', 
                      marginBottom: '0',
                      fontWeight: '600',
                      fontSize: '1.4rem'
                    }}>
                      Personal Information
                    </h4>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label style={{ 
                          fontWeight: '600', 
                          color: '#374151',
                          marginBottom: '12px',
                          fontSize: '1rem'
                        }}>
                          Full Name
                        </Form.Label>
                        <Form.Control
                          type="text"
                          placeholder="Enter your full name"
                          value={profileData.name}
                          onChange={e => handleChange('name', e.target.value)}
                          isInvalid={!!formErrors.name}
                          style={{ 
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            padding: '12px 16px',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafbfc'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#284CFF';
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(40, 76, 255, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: '0.875rem' }}>
                          {formErrors.name}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-4">
                        <Form.Label style={{ 
                          fontWeight: '600', 
                          color: '#374151',
                          marginBottom: '12px',
                          fontSize: '1rem'
                        }}>
                          Email Address
                        </Form.Label>
                        <Form.Control
                          type="email"
                          placeholder="Enter your email address"
                          value={profileData.email}
                          onChange={e => handleChange('email', e.target.value)}
                          isInvalid={!!formErrors.email}
                          style={{ 
                            borderRadius: '12px',
                            border: '2px solid #e5e7eb',
                            padding: '12px 16px',
                            fontSize: '1rem',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafbfc'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#284CFF';
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(40, 76, 255, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: '0.875rem' }}>
                          {formErrors.email}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Divider */}
                <hr style={{ 
                  border: 'none',
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, #e5e7eb, transparent)',
                  margin: '0.5rem 0'
                }} />

                {/* Security Section */}
                <div className="mb-4">
                  <div className="d-flex align-items-center mb-4">
                    <div style={{
                      width: '40px',
                      height: '40px',
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px'
                    }}>
                      <span style={{ color: 'white', fontWeight: 'bold', fontSize: '1.2rem' }}>🔒</span>
                    </div>
                    <div>
                      <h4 style={{ 
                        color: '#1e293b', 
                        marginBottom: '4px',
                        fontWeight: '600',
                        fontSize: '1.4rem'
                      }}>
                        Security Settings
                      </h4>
                      <p style={{ 
                        color: '#6b7280', 
                        margin: '0',
                        fontSize: '0.9rem'
                      }}>
                        Leave blank to keep your current password
                      </p>
                    </div>
                  </div>

                  <Row>
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ 
                          fontWeight: '600', 
                          color: '#374151',
                          marginBottom: '8px',
                          fontSize: '0.9rem'
                        }}>
                          New Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Enter new password"
                          value={profileData.newPassword}
                          onChange={e => handleChange('newPassword', e.target.value)}
                          isInvalid={!!formErrors.newPassword}
                          style={{ 
                            borderRadius: '10px',
                            border: '2px solid #e5e7eb',
                            padding: '10px 14px',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafbfc'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#284CFF';
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(40, 76, 255, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: '0.8rem' }}>
                          {formErrors.newPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>

                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label style={{ 
                          fontWeight: '600', 
                          color: '#374151',
                          marginBottom: '8px',
                          fontSize: '0.9rem'
                        }}>
                          Confirm Password
                        </Form.Label>
                        <Form.Control
                          type="password"
                          placeholder="Confirm new password"
                          value={profileData.confirmPassword}
                          onChange={e => handleChange('confirmPassword', e.target.value)}
                          isInvalid={!!formErrors.confirmPassword}
                          style={{ 
                            borderRadius: '10px',
                            border: '2px solid #e5e7eb',
                            padding: '10px 14px',
                            fontSize: '0.9rem',
                            transition: 'all 0.3s ease',
                            backgroundColor: '#fafbfc'
                          }}
                          onFocus={(e) => {
                            e.target.style.borderColor = '#284CFF';
                            e.target.style.backgroundColor = '#ffffff';
                            e.target.style.boxShadow = '0 0 0 3px rgba(40, 76, 255, 0.1)';
                          }}
                          onBlur={(e) => {
                            e.target.style.borderColor = '#e5e7eb';
                            e.target.style.backgroundColor = '#fafbfc';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                        <Form.Control.Feedback type="invalid" style={{ fontSize: '0.8rem' }}>
                          {formErrors.confirmPassword}
                        </Form.Control.Feedback>
                      </Form.Group>
                    </Col>
                  </Row>
                </div>

                {/* Action Buttons */}
                <div className="d-flex justify-content-end mt-5 pt-3" style={{
                  borderTop: '1px solid #e5e7eb'
                }}>

                  <Button
                  onClick={handleSaveChanges}
                  disabled={!hasChanges}
                  style={{
                    background: hasChanges 
                      ? 'linear-gradient(135deg, #284CFF 0%, #4c6ef5 100%)'
                      : '#9ca3af',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 32px',
                    fontWeight: '600',
                    fontSize: '1rem',
                    boxShadow: hasChanges 
                      ? '0 10px 25px rgba(40, 76, 255, 0.3)'
                      : 'none',
                    transition: 'all 0.3s ease',
                    position: 'relative',
                    overflow: 'hidden',
                    cursor: hasChanges ? 'pointer' : 'not-allowed'
                  }}
                  onMouseEnter={(e) => {
                    if (hasChanges) {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 15px 35px rgba(40, 76, 255, 0.4)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (hasChanges) {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 10px 25px rgba(40, 76, 255, 0.3)';
                    }
                  }}
                >
                  <span style={{ position: 'relative', zIndex: 1 }}>
                    Save Changes
                  </span>
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