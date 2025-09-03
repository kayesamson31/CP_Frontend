import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';

function SignUpPage() {
  const navigate = useNavigate();
  
  const [orgInfo, setOrgInfo] = useState({
    orgName: '',
    orgType: '',
    country: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
    confirmPassword: '',
  });

  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrgInfo((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!orgInfo.orgName.trim()) newErrors.orgName = 'Organization name is required';
    if (!orgInfo.orgType) newErrors.orgType = 'Organization type is required';
    if (!orgInfo.country.trim()) newErrors.country = 'Country is required';
    if (!orgInfo.contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required';
    if (!orgInfo.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(orgInfo.contactEmail)) newErrors.contactEmail = 'Please enter a valid email address';
    if (!orgInfo.password) newErrors.password = 'Password is required';
    else if (orgInfo.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!orgInfo.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (orgInfo.password !== orgInfo.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!agreed) newErrors.agreement = 'Please agree to the Terms and Privacy Policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

   try {
  console.log('Organization Registration:', orgInfo);
  
  // Save organization data for setup wizard
  const orgDataForWizard = {
    name: orgInfo.orgName,
    email: orgInfo.contactEmail,
    phone: orgInfo.contactPhone,
    address: '', // empty since wala sa signup form
    // Keep all signup data for reference
    orgType: orgInfo.orgType,
    country: orgInfo.country,
    website: orgInfo.website,
    contactPerson: orgInfo.contactPerson
  };
  
  const userData = {
    name: orgInfo.contactPerson,
    email: orgInfo.contactEmail,
    role: 'sysadmin',
    roleDisplay: 'System Administrator',
    isNewRegistration: true
  };
  
  // Store both user and org data
  localStorage.setItem('user', JSON.stringify(userData));
  localStorage.setItem('orgDataFromSignup', JSON.stringify(orgDataForWizard));
  
  alert('Registration successful! Set up your organization...');
  
  setTimeout(() => {
    navigate('/dashboard-sysadmin/SetupWizard', {
      state: { 
        isNewRegistration: true,
        role: 'System Administrator',
        userInfo: {
          name: orgInfo.contactPerson,
          email: orgInfo.contactEmail,
          role: 'System Administrator'
        },
        orgData: orgDataForWizard
      }
    });
  }, 1000);
  
} catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    }
  };

  const organizationTypes = [
    'School / Educational Institution',
    'Office / Corporate',
    'Church / Parish / Religious Institution',
    'Hospital / Healthcare Facility',
    'Hotel / Hospitality',
    'Government Office',
    'BPO / Call Center',
    'Nonprofit Organization / NGO',
    'Others'
  ];

  const containerStyle = {
    background: '#ffffff',
    minHeight: '100vh',
    padding: '3rem 1rem 2rem 1rem',
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    paddingTop: '120px'
  };

  const cardStyle = {
    backgroundColor: '#FFFFFFFF',
    border: '2px solid #B0D0E6',
    borderRadius: '16px',
    padding: '2rem',
    width: '100%',
    maxWidth: '750px',
    margin: '0 auto',
    position: 'relative',
    overflow: 'hidden'
  };

  const headerStyle = {
    textAlign: 'center',
    marginBottom: '2rem',
    paddingTop: '1rem'
  };

  const titleStyle = {
    fontSize: '1.75rem',
    fontWeight: '700',
    color: '#284386',
    marginBottom: '0.5rem',
    letterSpacing: '-0.025em'
  };

  const subtitleStyle = {
    fontSize: '0.9rem',
    color: '#284C9A',
    lineHeight: '1.4'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '1.25rem',
    marginBottom: '1.5rem'
  };

  const sectionStyle = {
    marginBottom: '1.5rem'
  };

  const sectionTitleStyle = {
    fontSize: '1rem',
    fontWeight: '600',
    color: '#284386',
    marginBottom: '1rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  };

  const sectionIconStyle = {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #284C9A, #337FCA)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '11px',
    fontWeight: 'bold'
  };

  const inputGroupStyle = {
    marginBottom: '0.875rem'
  };

  const labelStyle = {
    display: 'block',
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#284386',
    marginBottom: '0.375rem'
  };

  const inputStyle = {
    width: '100%',
    padding: '0.625rem 0.875rem',
    border: '2px solid #B0D0E6',
    borderRadius: '10px',
    fontSize: '0.8rem',
    outline: 'none',
    transition: 'all 0.2s ease-in-out',
    backgroundColor: '#ffffff',
    boxSizing: 'border-box'
  };

  const inputFocusStyle = {
    borderColor: '#337FCA',
    backgroundColor: '#ffffff',
    boxShadow: '0 0 0 3px rgba(51, 127, 202, 0.1)'
  };

  const errorInputStyle = {
    ...inputStyle,
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2'
  };

  const errorTextStyle = {
    color: '#ef4444',
    fontSize: '0.7rem',
    marginTop: '0.25rem',
    fontWeight: '500'
  };

  const checkboxContainerStyle = {
    backgroundColor: '#ffffff',
    border: '2px solid #B0D0E6',
    borderRadius: '10px',
    padding: '0.875rem',
    marginBottom: '1.25rem'
  };

  const checkboxLabelStyle = {
    display: 'flex',
    alignItems: 'flex-start',
    cursor: 'pointer',
    fontSize: '0.8rem',
    lineHeight: '1.4',
    color: '#284386'
  };

  const checkboxStyle = {
    marginRight: '0.625rem',
    marginTop: '0.125rem',
    transform: 'scale(1.1)',
    accentColor: '#337FCA'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.75rem 1.25rem',
    background: 'linear-gradient(135deg, #284386 0%, #337FCA 100%)',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '0.875rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  };

  const footerTextStyle = {
    textAlign: 'center',
    marginTop: '1.25rem',
    color: '#284C9A',
    fontSize: '0.75rem',
    lineHeight: '1.3'
  };

  return (
    <Layout>
      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <h1 style={titleStyle}>Create Organization Account</h1>
            <p style={subtitleStyle}>
              Register your organization and set up your System Administrator account
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Organization Details Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <span style={sectionIconStyle}>1</span>
                Organization Details
              </div>
              
              <div style={gridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Organization Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.orgName ? errorInputStyle : inputStyle}
                    type="text" 
                    name="orgName" 
                    value={orgInfo.orgName} 
                    onChange={handleChange}
                    placeholder="Enter organization name"
                    onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                    onBlur={(e) => {
                      e.target.style.borderColor = errors.orgName ? '#ef4444' : '#B0D0E6';
                      e.target.style.backgroundColor = errors.orgName ? '#fef2f2' : '#ffffff';
                      e.target.style.boxShadow = 'none';
                    }}
                  />
                  {errors.orgName && <span style={errorTextStyle}>{errors.orgName}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Organization Type <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    style={errors.orgType ? errorInputStyle : inputStyle}
                    name="orgType"
                    value={orgInfo.orgType}
                    onChange={handleChange}
                  >
                    <option value="">Select organization type</option>
                    {organizationTypes.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  {errors.orgType && <span style={errorTextStyle}>{errors.orgType}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Country <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.country ? errorInputStyle : inputStyle}
                    type="text" 
                    name="country" 
                    value={orgInfo.country} 
                    onChange={handleChange}
                    placeholder="Enter country"
                  />
                  {errors.country && <span style={errorTextStyle}>{errors.country}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Website URL <span style={{ color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <input 
                    style={inputStyle}
                    type="url" 
                    name="website" 
                    value={orgInfo.website} 
                    onChange={handleChange}
                    placeholder="https://example.com"
                  />
                </div>
              </div>
            </div>

            {/* Contact Information Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <span style={sectionIconStyle}>2</span>
                Contact Information
              </div>
              
              <div style={gridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Contact Person Name <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.contactPerson ? errorInputStyle : inputStyle}
                    type="text" 
                    name="contactPerson" 
                    value={orgInfo.contactPerson} 
                    onChange={handleChange}
                    placeholder="Full name of primary contact"
                  />
                  {errors.contactPerson && <span style={errorTextStyle}>{errors.contactPerson}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Contact Email <span style={{ color: '#ef4444' }}>*</span>
                    <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}> (Login email)</span>
                  </label>
                  <input 
                    style={errors.contactEmail ? errorInputStyle : inputStyle}
                    type="email" 
                    name="contactEmail" 
                    value={orgInfo.contactEmail} 
                    onChange={handleChange}
                    placeholder="admin@organization.com"
                  />
                  {errors.contactEmail && <span style={errorTextStyle}>{errors.contactEmail}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Phone Number <span style={{ color: '#9ca3af' }}>(optional)</span>
                  </label>
                  <input 
                    style={inputStyle}
                    type="tel" 
                    name="contactPhone" 
                    value={orgInfo.contactPhone} 
                    onChange={handleChange}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>
            </div>

            {/* Account Credentials Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <span style={sectionIconStyle}>3</span>
                Account Credentials
              </div>
              
              <div style={gridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.password ? errorInputStyle : inputStyle}
                    type="password" 
                    name="password" 
                    value={orgInfo.password} 
                    onChange={handleChange}
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && <span style={errorTextStyle}>{errors.password}</span>}
                </div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Confirm Password <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.confirmPassword ? errorInputStyle : inputStyle}
                    type="password" 
                    name="confirmPassword" 
                    value={orgInfo.confirmPassword} 
                    onChange={handleChange}
                    placeholder="Re-enter password"
                  />
                  {errors.confirmPassword && <span style={errorTextStyle}>{errors.confirmPassword}</span>}
                </div>
              </div>
            </div>

            {/* Terms Agreement */}
            <div style={checkboxContainerStyle}>
              <label style={checkboxLabelStyle}>
                <input 
                  type="checkbox" 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)}
                  style={checkboxStyle}
                />
                <span>
                  I agree to the <a href="/terms" style={{ color: '#337FCA', textDecoration: 'none', fontWeight: '500' }}>Terms of Service</a> and{' '}
                  <a href="/privacy" style={{ color: '#337FCA', textDecoration: 'none', fontWeight: '500' }}>Privacy Policy</a>
                </span>
              </label>
              {errors.agreement && <span style={{ ...errorTextStyle, marginLeft: '2rem' }}>{errors.agreement}</span>}
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              style={buttonStyle}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 20px rgba(40, 67, 134, 0.3)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = 'none';
              }}
            >
              Create Organization Account
            </button>

            <p style={footerTextStyle}>
              After registration, you'll be redirected to your System Admin Dashboard
              <br />to complete your organization setup and manage users.
            </p>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default SignUpPage;