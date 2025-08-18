
import React, { useState } from 'react';
import Layout from './Layout';

function SignUpPage() {
  
  const [orgInfo, setOrgInfo] = useState({
    orgName: '',
    orgType: '',
    website: '',
    address1: '',
    address2: '',
    city: '',
    province: '',
    postalCode: '',
    country: '',
    contactPerson: '',
    contactEmail: '',
    contactPhone: '',
    adminEmail: '',
    password: '',
    cpassword: '',
  });

  const [adminFile, setAdminFile] = useState(null);
  const [personnelFile, setPersonnelFile] = useState(null);
  const [standardFile, setStandardFile] = useState(null);
  const [agreed, setAgreed] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setOrgInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!agreed) {
      alert('Please agree to the Terms and Privacy Policy.');
      return;
    }
    console.log('Organization Info:', orgInfo);
    alert('Form submitted successfully! (Frontend simulation only)');
  };

  const formGroupStyle = {
    display: 'flex',
    flexDirection: 'column',
    marginBottom: '1.5rem',
    width: '48%',
  };

  const inputStyle = {
    width: '100%',
    padding: '8px',
    border: '1px solid #284386',
    borderRadius: '15px',
    marginBottom: '0.5rem',
    fontSize: '16px',
    outline: 'none',
  };

  const sectionHeaderStyle = {
    width: '100%',
    fontWeight: 'bold',
    fontSize: '1.2rem',
    color: '#284386',
    margin: '1.5rem 0 0.5rem',
    borderBottom: '2px solid #B0D0E6',
    paddingBottom: '0.3rem',
  };

  return (
    <Layout>
      <div style={{ background: 'linear-gradient(135deg, #B0D0E6 20%, #FFF 50%)', minHeight: '100vh', padding: '2rem 0' }}>
        <div style={{
          maxWidth: '700px',
          margin: '8rem auto',
          padding: '3rem',
          fontFamily: "'Inter', sans-serif",
          backgroundColor: '#FFFFFF',
          borderRadius: '30px',
          boxShadow: '0 0 10px #B0D0E6',
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '1rem', color: "#284386", fontSize: '2.5rem' }}>Sign Up</h1>
          <h2 style={{ textAlign: 'center', marginBottom: '2rem', fontSize: '1rem', color: '#555' }}>
            Complete the registration to access the system
          </h2>

          <form onSubmit={handleSubmit}>
            {/* Organization Details */}
            <div style={sectionHeaderStyle}>Organization Details</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={formGroupStyle}>
                <label>Organization Name <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="orgName" value={orgInfo.orgName} onChange={handleChange} required />
              </div>

{/* Organization Type */}
<div style={formGroupStyle}>
  <label>Organization Type <span style={{ color: 'red' }}>*</span></label>
  <select
    style={inputStyle}
    name="orgType"
    value={orgInfo.orgType}
    onChange={handleChange}
    required
  >
    <option value="">-- Select Organization Type --</option>
    <option value="School / Educational Institution">School / Educational Institution</option>
    <option value="Church / Religious Institution">Church / Religious Institution</option>
    <option value="Hospital / Healthcare Facility">Hospital / Healthcare Facility</option>
    <option value="Hotel / Hospitality">Hotel / Hospitality</option>
    <option value="Government Office">Government Office</option>
    <option value="Private Company / Business">Private Company / Business</option>
    <option value="Nonprofit Organization / NGO">Nonprofit Organization / NGO</option>
    <option value="Event Venue / Convention Center">Event Venue / Convention Center</option>
    <option value="Warehouse / Industrial Facility">Warehouse / Industrial Facility</option>
    <option value="Others">Others</option>
  </select>
</div>

{/* Website URL + Please Specify */}
<div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
  <div style={{ ...formGroupStyle, width: orgInfo.orgType === "Others" ? '48%' : '100%' }}>
    <label>Website URL <span style={{ color: 'gray' }}>(optional)</span></label>
    <input
      style={inputStyle}
      type="url"
      name="website"
      value={orgInfo.website}
      onChange={handleChange}
    />
  </div>

  {orgInfo.orgType === "Others" && (
    <div style={{ ...formGroupStyle, width: '48%' }}>
      <label>Please specify</label>
      <input
        style={inputStyle}
        type="text"
        name="otherOrgType"
        placeholder="Please specify"
        value={orgInfo.otherOrgType || ""}
        onChange={(e) =>
          setOrgInfo((prev) => ({ ...prev, otherOrgType: e.target.value }))
        }
      />
    </div>
  )}
</div>

            </div>

            {/* Address Information */}
            <div style={sectionHeaderStyle}>Address Information</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={formGroupStyle}>
                <label>Address Line 1 <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="address1" value={orgInfo.address1} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Address Line 2 <span style={{ color: 'gray' }}>(optional)</span></label>
                <input style={inputStyle} type="text" name="address2" value={orgInfo.address2} onChange={handleChange} />
              </div>

              <div style={formGroupStyle}>
                <label>City / Municipality <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="city" value={orgInfo.city} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Province / State / Region <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="province" value={orgInfo.province} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Postal Code</label>
                <input style={inputStyle} type="text" name="postalCode" value={orgInfo.postalCode} onChange={handleChange} />
              </div>

              <div style={formGroupStyle}>
                <label>Country <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="country" value={orgInfo.country} onChange={handleChange} required />
              </div>
            </div>

            {/* Contact Information */}
            <div style={sectionHeaderStyle}>Contact Information</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={formGroupStyle}>
                <label>Contact Person Name</label>
                <input style={inputStyle} type="text" name="contactPerson" value={orgInfo.contactPerson} onChange={handleChange} />
              </div>

              <div style={formGroupStyle}>
                <label>Contact Email <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="email" name="contactEmail" value={orgInfo.contactEmail} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Contact Phone Number <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="text" name="contactPhone" value={orgInfo.contactPhone} onChange={handleChange} required />
              </div>
            </div>

            {/* Account Credentials */}
            <div style={sectionHeaderStyle}>Account Credentials</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <div style={formGroupStyle}>
                <label>Admin Email <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="email" name="adminEmail" value={orgInfo.adminEmail} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Password <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="password" name="password" value={orgInfo.password} onChange={handleChange} required />
              </div>

              <div style={formGroupStyle}>
                <label>Confirm Password <span style={{ color: 'red' }}>*</span></label>
                <input style={inputStyle} type="password" name="cpassword" value={orgInfo.cpassword} onChange={handleChange} required />
              </div>
            </div>

            {/* CSV Uploads */}
            <div style={sectionHeaderStyle}>Optional Bulk User Uploads</div>
            <div style={{ marginBottom: '1.5rem' }}>
              <label>Upload Admin Users CSV</label><br />
              <input type="file" accept=".csv" onChange={(e) => setAdminFile(e.target.files[0])} /><br /><br />

              <label>Upload Personnel Users CSV</label><br />
              <input type="file" accept=".csv" onChange={(e) => setPersonnelFile(e.target.files[0])} /><br /><br />

              <label>Upload Standard Users CSV</label><br />
              <input type="file" accept=".csv" onChange={(e) => setStandardFile(e.target.files[0])} />
            </div>

            {/* Terms */}
            <div style={{ marginBottom: '1.5rem' }}>
              <label>
                <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />{' '}
                I agree to the Terms and Privacy Policy
              </label>
            </div>

            {/* Submit */}
            <button type="submit" style={{
              padding: '10px 20px',
              backgroundColor: '#007BFF',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '1rem'
            }}>
              Submit
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}

export default SignUpPage;
