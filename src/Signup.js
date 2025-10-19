import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { supabase } from './supabaseClient';
import { useEffect } from 'react';
//  SignUpPage component para gumawa ng bagong Organization Account
function SignUpPage() {
const navigate = useNavigate(); // Para makapag-redirect sa ibang page

 // State kung saan nakatago lahat ng organization info na tina-type ng user
  const [orgInfo, setOrgInfo] = useState({
    orgName: '',
    orgType: '',
    country: '',
    website: '',
    address: '',
    contactPerson: '',
    contactEmail: '',
  });

  // State para sa checkbox (terms agreement)
  const [agreed, setAgreed] = useState(false);
   // State para mag-store ng error messages
  const [errors, setErrors] = useState({});
   // State para ipakita na “loading” habang nagsa-submit
  const [loading, setLoading] = useState(false);
   // State para sa error galing server (Supabase)
  const [serverError, setServerError] = useState('');
const [organizationTypes, setOrganizationTypes] = useState([]);
const [countries, setCountries] = useState([]);
   //  Function na ina-update ang orgInfo habang nagta-type ang user
  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrgInfo((prev) => ({ ...prev, [name]: value }));
    
     // Kung may error dati sa field na ito, tanggalin kapag may bagong input
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

    // Function para i-check kung kompleto at tama ang form bago i-submit
  const validateForm = () => {
    const newErrors = {};
    
    if (!orgInfo.orgName.trim()) newErrors.orgName = 'Organization name is required';
    if (!orgInfo.orgType) newErrors.orgType = 'Organization type is required';
    if (!orgInfo.country.trim()) newErrors.country = 'Country is required';
    if (!orgInfo.address.trim()) newErrors.address = 'Address is required';
    if (!orgInfo.contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required';
    if (!orgInfo.contactEmail.trim()) newErrors.contactEmail = 'Contact email is required';
    else if (!/\S+@\S+\.\S+/.test(orgInfo.contactEmail)) newErrors.contactEmail = 'Please enter a valid email address';
    if (!agreed) newErrors.agreement = 'Please agree to the Terms and Privacy Policy';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;   // Kung walang laman = valid form
  };

    // Function na nagha-handle ng form submission
const handleSubmit = async (e) => {
  e.preventDefault(); // Para hindi mag-refresh ang page
  
    //Validate muna bago i-send sa Supabase
  if (!validateForm()) return;
  
  setLoading(true);
  setServerError('');
  setErrors({}); // Clear previous errors

  try {
   // Step 2: Gumawa ng bagong user sa Supabase Auth
      // Note: Gumagamit ng temporary password (hindi gagamitin) 
      // dahil email confirmation flow ang tunay na login process
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: orgInfo.contactEmail,
      password: 'temporary-password-123', // Required by Supabase, but won't be used
      options: { 
        emailRedirectTo: `${window.location.origin}/setup-wizard`,
        data: {
          full_name: orgInfo.contactPerson,
          organization_name: orgInfo.orgName,
          // Store org info temporarily sa user metadata
          org_data: {
            orgName: orgInfo.orgName,
            orgType: orgInfo.orgType,
            country: orgInfo.country,
            website: orgInfo.website,
            address: orgInfo.address,
            contactPerson: orgInfo.contactPerson,
          }
        }
      }
    });
        // Kung may error (halimbawa duplicate email)
    if (authError) {
      console.log("Auth error details:", authError);
      
      if (authError.status === 400 && authError.message.includes("already registered")) {
        setErrors({ contactEmail: "This email is already registered. Please log in instead." });
      } else {
        setServerError("Signup failed: " + authError.message);
      }
      setLoading(false);
      return;
    }

    console.log("Signup success:", authData);

   // Kapag successful, redirect sa setup wizard
    console.log("User created successfully:", authData.user);
    navigate("/setup-wizard");
    
  // Kung may ibang error (network o system)
  } catch (err) {   
    console.error("Registration error:", err.message);
    setServerError(err.message);
  } finally {
    setLoading(false);
  }
};
useEffect(() => {
  const fetchOrgTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_types')
        .select('org_type_id, type_name')
        .eq('is_active', true)
        .order('type_name');
      
      if (error) throw error;
      setOrganizationTypes(data || []);
    } catch (error) {
      console.error('Error fetching organization types:', error);
    }
  };

  const fetchCountries = async () => {
    try {
      const { data, error } = await supabase
        .from('countries')
        .select('country_id, country_name')
        .eq('is_active', true)
        .order('country_name');
      
      if (error) throw error;
      setCountries(data || []);
    } catch (error) {
      console.error('Error fetching countries:', error);
    }
  };

  fetchOrgTypes();
  fetchCountries();
}, []);


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

   // Styles (design only, pang-UI)
  // containerStyle, cardStyle, headerStyle... etc.
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

    {/*Server error alert here */}
    {serverError && (
      <div style={{ 
        background: '#fee2e2', 
        color: '#b91c1c', 
        padding: '0.75rem', 
        borderRadius: '8px', 
        marginBottom: '1rem',
        fontSize: '0.8rem',
        fontWeight: '500'
      }}>
        {serverError}
      </div>
    )}

       {/* Form kung saan nilalagay org details */}
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
      <option key={type.org_type_id} value={type.type_name}>
        {type.type_name}
      </option>
    ))}
  </select>
                  {errors.orgType && <span style={errorTextStyle}>{errors.orgType}</span>}
                </div>
<div style={inputGroupStyle}>
  <label style={labelStyle}>
    Country <span style={{ color: '#ef4444' }}>*</span>
  </label>
  <select
    style={errors.country ? errorInputStyle : inputStyle}
    name="country"
    value={orgInfo.country}
    onChange={handleChange}
  >
    <option value="">Select country</option>
    {countries.map((country) => (
      <option key={country.country_id} value={country.country_name}>
        {country.country_name}
      </option>
    ))}
  </select>
  {errors.country && <span style={errorTextStyle}>{errors.country}</span>}
</div>

                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Official Website <span style={{ color: '#9ca3af' }}>(optional)</span>
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

                <div style={{...inputGroupStyle, gridColumn: '1 / -1'}}>
                  <label style={labelStyle}>
                    Address <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input 
                    style={errors.address ? errorInputStyle : inputStyle}
                    type="text" 
                    name="address" 
                    value={orgInfo.address} 
                    onChange={handleChange}
                    placeholder="Enter complete address"
                  />
                  {errors.address && <span style={errorTextStyle}>{errors.address}</span>}
                </div>
              </div>
            </div>

            {/* Contact Person Section */}
            <div style={sectionStyle}>
              <div style={sectionTitleStyle}>
                <span style={sectionIconStyle}>2</span>
                Contact Person
              </div>
              
              <div style={gridStyle}>
                <div style={inputGroupStyle}>
                  <label style={labelStyle}>
                    Name <span style={{ color: '#ef4444' }}>*</span>
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
                    Email <span style={{ color: '#ef4444' }}>*</span>
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
  style={{
    ...buttonStyle,
    opacity: loading ? 0.6 : 1,
    cursor: loading ? "not-allowed" : "pointer"
  }}
  disabled={loading}
  onMouseOver={(e) => {
    if (!loading) {
      e.target.style.transform = "translateY(-2px)";
      e.target.style.boxShadow = "0 8px 20px rgba(40, 67, 134, 0.3)";
    }
  }}
  onMouseOut={(e) => {
    if (!loading) {
      e.target.style.transform = "translateY(0)";
      e.target.style.boxShadow = "none";
    }
  }}
>
  {loading ? "Creating Account..." : "Create Organization Account"}
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