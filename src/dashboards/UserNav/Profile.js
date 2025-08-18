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

  const [formErrors, setFormErrors] = useState({});
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    // Get user info from localStorage
    const storedName = localStorage.getItem('userName') || '';
    const storedEmail = localStorage.getItem('userEmail') || '';
    const storedRole = localStorage.getItem('userRole') || 'Standard User';
    
    setProfileData(prev => ({
      ...prev,
      name: storedName,
      email: storedEmail,
      role: storedRole,
    }));
  }, []);

  const handleChange = (field, value) => {
    setProfileData(prev => ({ ...prev, [field]: value }));
    setFormErrors(prev => ({ ...prev, [field]: '' }));
    if (showSuccess) setShowSuccess(false);
  };

  const handleSaveChanges = () => {
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

    // Save updated name and email to localStorage
    localStorage.setItem('userName', profileData.name);
    localStorage.setItem('userEmail', profileData.email);

    // Simulate API call
    console.log('Saving profile changes:', profileData);

    // Clear password fields
    setProfileData(prev => ({
      ...prev,
      newPassword: '',
      confirmPassword: ''
    }));

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
     <SidebarLayout role={role}>
    <Container fluid style={{ backgroundColor: '#FFFFFF', minHeight: '100vh', padding: 0 }}>
  <Row>
    <Col md={12} lg={12} className="p-4" style={{ backgroundColor: '#FFFFFF' }}>

          
          <div className="mb-4">
            <h2 style={{ color: '#284386', marginBottom: '5px' }}>Profile Settings</h2>
            <p className="text-muted mb-0">Manage your profile and password below.</p>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="alert alert-success mb-4" role="alert" style={{ maxWidth: '600px', width: '100%' }}>
              Changes saved successfully!
            </div>
          )}

          {/* Profile Form */}
          <Card
            className="shadow-sm"
            style={{
              maxWidth: '1200px',
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '2px solid #ECEBF0',
              borderRadius: '12px'
            }}
          >
            <Card.Body style={{ padding: '4rem 8rem' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
                <img
                  src={dashprofile}
                  alt="Profile Icon"
                  style={{
                    width: '90px',
                    height: '90px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: '30px'
                  }}
                />
                <div>
                  <h4 style={{ margin: 0, fontWeight: '500', color: '#000', fontSize: '1.75rem' }}>
                    {profileData.name}
                  </h4>
                  <p style={{ color: '#6c757d', fontSize: '1rem', margin: 0 }}>{profileData.email}</p>
                  <p style={{ color: '#284386', fontSize: '0.95rem', margin: 0 }}>
                    <strong>Role:</strong> {profileData.role}
                  </p>
                </div>
              </div>

              <hr />

              {/* Editable Fields */}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', color: '#284386' }}>Name</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Enter your name"
                    value={profileData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    isInvalid={!!formErrors.name}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.name}</Form.Control.Feedback>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', color: '#284386' }}>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={profileData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    isInvalid={!!formErrors.email}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                </Form.Group>

                <h5 style={{ color: '#284386', margin: '30px 0 20px' }}>Change Password</h5>

                {/* New Password */}
                <Form.Group className="mb-3">
                  <Form.Label style={{ fontWeight: '500', color: '#284386' }}>New Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Enter new password (leave blank to keep current)"
                    value={profileData.newPassword}
                    onChange={e => handleChange('newPassword', e.target.value)}
                    isInvalid={!!formErrors.newPassword}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.newPassword}</Form.Control.Feedback>
                </Form.Group>

                {/* Confirm Password */}
                <Form.Group className="mb-4">
                  <Form.Label style={{ fontWeight: '500', color: '#284386' }}>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm new password"
                    value={profileData.confirmPassword}
                    onChange={e => handleChange('confirmPassword', e.target.value)}
                    isInvalid={!!formErrors.confirmPassword}
                    style={{ borderRadius: '8px' }}
                  />
                  <Form.Control.Feedback type="invalid">{formErrors.confirmPassword}</Form.Control.Feedback>
                </Form.Group>

                {/* Save Button */}
                <div className="d-flex justify-content-end">
                  <Button
                    onClick={handleSaveChanges}
                    style={{
                      backgroundColor: '#284CFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '10px 30px',
                      fontWeight: '600'
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    </SidebarLayout>
  );
}