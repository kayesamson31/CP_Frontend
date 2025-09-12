import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, Download, Users, Building2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get org data from signup if available
  const getInitialOrgData = () => {
    try {
      const savedOrgData = localStorage.getItem('orgDataFromSignup');
      if (savedOrgData) {
        const parsed = JSON.parse(savedOrgData);
        return {
          name: parsed.name || '',
          email: parsed.email || '',
          phone: parsed.phone || '',
          address: parsed.address || '',
          orgType: parsed.orgType || '',
          country: parsed.country || '',
          website: parsed.website || '',
          contactPerson: parsed.contactPerson || '',
          contactEmail: parsed.contactEmail || '',
          password: '',
          confirmPassword: ''
        };
      }
    } catch (error) {
      console.log('No saved org data found');
    }
    return {
      name: '',
      email: '',
      phone: '',
      address: '',
      orgType: '',
      country: '',
      website: '',
      contactPerson: '',
      contactEmail: '',
      password: '',
      confirmPassword: ''
    };
  };

  const [orgData, setOrgData] = useState(getInitialOrgData());
  const [userImportMethod, setUserImportMethod] = useState(''); // Add this missing state
  const [assetImportMethod, setAssetImportMethod] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    heads: null,
    personnel: null,
    standardUsers: null,
    assets: null
  });
  const [skippedSteps, setSkippedSteps] = useState({
    heads: false,
    personnel: false,
    standardUsers: false,
    assets: false
  });
  const totalSteps = 4;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = (stepType) => {
    if (stepType === 'users') {
      // Skip all user types
      setSkippedSteps(prev => ({
        ...prev,
        heads: true,
        personnel: true,
        standardUsers: true
      }));
    } else {
      setSkippedSteps(prev => ({
        ...prev,
        [stepType]: true
      }));
    }
    setCurrentStep(currentStep + 1);
  };

  const handleFileUpload = (type, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));
    // Update skipped steps for user types
    if (['heads', 'personnel', 'standardUsers'].includes(type)) {
      setSkippedSteps(prev => ({ ...prev, [type]: false }));
      // Set user import method when any user file is uploaded
      setUserImportMethod('csv');
    } else if (type === 'assets') {
      setSkippedSteps(prev => ({ ...prev, assets: false }));
    }
  };

  // UPDATE downloadTemplate function:
  const downloadTemplate = (type) => {
    const templates = {
      heads: `Name,Email,Status,Role
John Admin,john.admin@company.com,active,Admin official
Jane Head,jane.head@company.com,active,system admin`,
      personnel: `Name,Email,Status,Role
Mike Staff,mike.staff@company.com,active,Personnel
Sarah Worker,sarah.worker@company.com,active,Personnel`,
      standardUsers: `Name,Email,Status,Role
Tom User,tom.user@company.com,active,Standard user
Lisa Member,lisa.member@company.com,active,Standard user`,
      assets: `Asset Name,Category,Status,Location
Laptop Dell XPS,Computer,Operational,Office Floor 1
Printer HP LaserJet,Office Equipment,Operational,Reception`
    };

    const blob = new Blob([templates[type]], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isSetupComplete = () => {
    const usersComplete = !skippedSteps.heads && uploadedFiles.heads &&
                         !skippedSteps.personnel && uploadedFiles.personnel &&
                         !skippedSteps.standardUsers && uploadedFiles.standardUsers;
    
    const assetsComplete = !skippedSteps.assets && uploadedFiles.assets;
    
    return usersComplete && assetsComplete && orgData.name && orgData.email;
  };

  const getUserImportMethodDisplay = () => {
    if (skippedSteps.heads && skippedSteps.personnel && skippedSteps.standardUsers) {
      return 'Skipped';
    }
    if (userImportMethod === 'csv' && (uploadedFiles.heads || uploadedFiles.personnel || uploadedFiles.standardUsers)) {
      return 'CSV Bulk Upload';
    }
    return 'Not configured';
  };

  const getAssetImportMethodDisplay = () => {
    if (skippedSteps.assets) {
      return 'Skipped';
    }
    if (assetImportMethod === 'csv' && uploadedFiles.assets) {
      return 'CSV Bulk Upload';
    }
    return 'Not configured';
  };

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Organization Setup';
      case 2: return 'Import Users';
      case 3: return 'Import Assets';
      case 4: return 'Summary';
      default: return 'Setup';
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '2rem 1rem'
    },
    primaryColor: '#284386',
    secondaryColor: '#284C9A',
    accentColor: '#337FCA',
    lightColor: '#B0D0E6',
    bgColor: '#ECEBF0'
  };

  const renderProgressBar = () => (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h2 fw-bold" style={{ color: styles.primaryColor }}>{getStepTitle()}</h1>
        <span 
          className="badge rounded-pill px-3 py-2 text-white"
          style={{ backgroundColor: styles.accentColor }}
        >
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="d-flex align-items-center mb-2">
        {[1, 2, 3, 4].map((step, index) => (
          <React.Fragment key={step}>
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
              style={{
                width: '32px',
                height: '32px',
                fontSize: '14px',
                backgroundColor: currentStep > step ? styles.accentColor : 
                               currentStep === step ? styles.secondaryColor : styles.bgColor,
                color: currentStep >= step ? 'white' : '#666'
              }}
            >
              {currentStep > step ? <CheckCircle size={16} /> : step}
            </div>
            {index < 3 && (
              <div 
                className="flex-fill mx-2"
                style={{
                  height: '3px',
                  backgroundColor: currentStep > step + 1 ? styles.accentColor :
                                 currentStep > step ? styles.secondaryColor : styles.bgColor
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="d-flex justify-content-between">
        <small className="text-muted">Organization</small>
        <small className="text-muted">Users</small>
        <small className="text-muted">Assets</small>
        <small className="text-muted">Summary</small>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <Building2 style={{ color: styles.accentColor }} className="mb-3" size={48} />
        <h2 className="display-6 fw-bold mb-2" style={{ color: styles.primaryColor }}>Welcome to OpenFMS</h2>
        <p className="text-muted fs-6">Let's set up your organization and get you started</p>
      </div>
      
      <div>
        <h3 className="h4 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>Organization Details</h3>
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Organization Name *
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Enter organization name"
              value={orgData.name}
              onChange={(e) => setOrgData({...orgData, name: e.target.value})}
            />
          </div>

           <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Organization Type
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Organization type"
              value={orgData.orgType}
              onChange={(e) => setOrgData({...orgData, orgType: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Official Website
            </label>
            <input
              type="url"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="https://example.com"
              value={orgData.website}
              onChange={(e) => setOrgData({...orgData, website: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Phone
            </label>
            <input
              type="tel"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Phone number"
              value={orgData.phone}
              onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
            />
          </div>

                <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Country
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Enter country"
              value={orgData.country}
              onChange={(e) => setOrgData({...orgData, country: e.target.value})}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Address
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Office address"
              value={orgData.address}
              onChange={(e) => setOrgData({...orgData, address: e.target.value})}
            />
          </div>
         
          
          
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="text-center mb-4">
        <Users style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Users</h2>
        <p className="text-muted">Add your team members to the system</p>
      </div>

      <div 
        className="p-3 rounded-3 mb-5"
        style={{ 
          borderLeft: `4px solid ${styles.accentColor}`,
          backgroundColor: '#f8f9ff'
        }}
      >
        <div className="d-flex">
          <AlertCircle style={{ color: styles.accentColor }} size={20} className="me-3 mt-1 flex-shrink-0" />
          <div>
            <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>Available User Roles:</h6>
            <ul className="mb-0 small text-muted">
              <li><strong>Standard user</strong> - Basic access to assigned assets</li>
              <li><strong>Personnel</strong> - Can manage assets and view reports</li>
              <li><strong>Admin official</strong> - Full management capabilities</li>
              <li><strong>System admin</strong> - Complete system control</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="h5 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>System Administrator</h3>
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Name *
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}
              placeholder="Administrator name"
              value={orgData.contactPerson || ''}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Email *
            </label>
            <input
              type="email"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}
              placeholder="admin@organization.com"
              value={orgData.email || ''}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Password *
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Create password"
              value={orgData.password}
              onChange={(e) => setOrgData({...orgData, password: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Confirm Password *
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Confirm password"
              value={orgData.confirmPassword}
              onChange={(e) => setOrgData({...orgData, confirmPassword: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Three CSV Upload Sections */}
      <div className="row g-4 mb-4">
        {/* Heads Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Heads</h5>
              <p className="text-muted small">Admin officials & System admins</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('heads')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('heads', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.heads && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.heads.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personnel Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Personnel</h5>
              <p className="text-muted small">Staff with asset management access</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('personnel')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('personnel', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.personnel && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.personnel.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Standard Users Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Standard Users</h5>
              <p className="text-muted small">Basic users with limited access</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('standardUsers')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('standardUsers', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.standardUsers && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.standardUsers.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <Database style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Assets</h2>
        <p className="text-muted">Add your organization's assets to the system</p>
      </div>

           <div className="row g-3">
        <div className="col-12">
          <div 
            className="p-3 rounded-3"
            style={{ 
              borderLeft: '4px solid #28a745',
              backgroundColor: '#f8fff9'
            }}
          >
            <div className="d-flex">
              <AlertCircle className="text-success me-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>Asset Status Options:</h6>
                <ul className="mb-0 small text-muted">
                  <li><strong>Operational</strong> - Asset is active and in use</li>
                  <li><strong>Retired</strong> - Asset is no longer in active use</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div 
            className="p-3 rounded-3"
            style={{ 
              borderLeft: '4px solid #ffc107',
              backgroundColor: '#fffef8'
            }}
          >
            <div className="d-flex">
              <AlertCircle className="text-warning me-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="mb-0 small text-muted">
                  <strong>Don't have your data ready?</strong> No worries! You can skip this step and add assets later from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

  <div className="row justify-content-center mb-4">
  <div className="col-lg-6 col-md-8 mt-4">     
   <div 
  className="p-3 border rounded-3"
  style={{
    cursor: 'pointer',
    borderColor: assetImportMethod === 'csv' ? styles.accentColor : styles.lightColor,
    borderWidth: '2px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    maxWidth: '500px',
    margin: '0 auto'
  }}
  onClick={() => setAssetImportMethod('csv')}
>
            <div className="text-center">
              <Upload style={{ color: styles.accentColor }} className="mb-3" size={28} />
              <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>CSV Upload</h4>
              <p className="text-muted mb-3">Upload a CSV file with your asset data</p>
            </div>
            
            
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate('assets');
                  }}
                  className="btn btn-sm mb-3 d-flex align-items-center mx-auto"
                  style={{
                    borderColor: styles.accentColor,
                    color: styles.accentColor,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Download size={16} className="me-2" />
                  Download Template
                </button>
                
                <div 
                  className="border border-2 border-dashed rounded p-3"
                  style={{ borderColor: styles.lightColor, backgroundColor: 'white'}}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload('assets', e.target.files[0])}
                    className="form-control form-control-sm"
                  />
                  {uploadedFiles.assets && (
                    <div className="d-flex align-items-center text-success small mt-2">
                      <CheckCircle size={16} className="me-2" />
                      {uploadedFiles.assets.name}
                    </div>
                  )}
                </div>
              </div>
           

            
          </div>
        </div>
      </div>

    </div>
  );

  const renderStep4 = () => (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
          style={{ 
            width: '80px', 
            height: '80px',
            backgroundColor: isSetupComplete() ? '#28a74520' : '#ffc10720'
          }}
        >
          <CheckCircle 
            className={isSetupComplete() ? 'text-success' : 'text-warning'} 
            size={40} 
          />
        </div>
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>
          {isSetupComplete() ? 'Setup Complete!' : 'Setup Incomplete'}
        </h2>
      
      </div>

            {isSetupComplete() && (
        <div 
          className="p-3 rounded-3 mb-4"
          style={{ 
            borderLeft: '4px solid #28a745',
            backgroundColor: '#f8fff9'
          }}
        >
          <div className="d-flex">
            <CheckCircle className="text-success me-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>🎉 Congratulations!</h6>
              <p className="mb-0 small text-muted">
                Your OpenFMS system has been successfully set up! All data has been imported and your system is now ready for full operation. 
                You'll be redirected to your System Admin dashboard where you can manage users, assets, and system settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isSetupComplete() && (
        <div 
          className="p-3 rounded-3"
          style={{ 
            borderLeft: '4px solid #17a2b8',
            backgroundColor: '#f8fdff'
          }}
        >
          <div className="d-flex">
            <AlertCircle className="text-info me-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="mb-0 small text-muted">
                You can complete the skipped steps later from your System Admin dashboard. The system is ready to use with basic configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="h5 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>Configuration Summary</h3>
        
        <div>
          {[
            { label: 'Organization:', value: orgData.name || 'Not specified' },
            { label: 'Organization Type:', value: orgData.orgType || 'Not specified' },
            { label: 'Country:', value: orgData.country || 'Not specified' },
            { label: 'Website:', value: orgData.website || 'Not specified' },
            { label: 'Address:', value: orgData.address || 'Not specified' },
            { label: 'Phone:', value: orgData.phone || 'Not specified' },
            { label: 'Admin Email:', value: orgData.email || 'Not specified' }
          ].map((item, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
              <span className="fw-medium text-muted">{item.label}</span>
              <span style={{ color: styles.primaryColor }}>{item.value}</span>
            </div>
          ))}
          
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
            <span className="fw-medium text-muted">User Import Method:</span>
            <span 
              className="badge text-white px-3 py-1"
              style={{
                backgroundColor: getUserImportMethodDisplay() === 'Skipped' ? '#ffc107' :
                              getUserImportMethodDisplay() === 'CSV Bulk Upload' ? '#28a745' :
                              '#6c757d'
              }}
            >
              {getUserImportMethodDisplay()}
            </span>
          </div>
          
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
            <span className="fw-medium text-muted">Asset Import Method:</span>
            <span 
              className="badge text-white px-3 py-1"
              style={{
                backgroundColor: getAssetImportMethodDisplay() === 'Skipped' ? '#ffc107' :
                              getAssetImportMethodDisplay() === 'CSV Bulk Upload' ? '#28a745' :
                              '#6c757d'
              }}
            >
              {getAssetImportMethodDisplay()}
            </span>
          </div>
          
          {(uploadedFiles.heads || uploadedFiles.personnel || uploadedFiles.standardUsers) && (
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
              <span className="fw-medium text-muted">Users CSV Files:</span>
              <div className="text-end">
                {uploadedFiles.heads && <div className="text-success fw-medium small">{uploadedFiles.heads.name}</div>}
                {uploadedFiles.personnel && <div className="text-success fw-medium small">{uploadedFiles.personnel.name}</div>}
                {uploadedFiles.standardUsers && <div className="text-success fw-medium small">{uploadedFiles.standardUsers.name}</div>}
              </div>
            </div>
          )}
          
          {uploadedFiles.assets && (
            <div className="d-flex justify-content-between align-items-center py-3">
              <span className="fw-medium text-muted">Assets CSV:</span>
              <span className="text-success fw-medium">{uploadedFiles.assets.name}</span>
            </div>
          )}
        </div>
      </div>


    </div>
  );

  return (
    <div style={styles.container}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {renderProgressBar()}
        
        <div style={{ paddingTop: '2rem' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          <div className="d-flex justify-content-between align-items-center mt-5 pt-4 border-top" style={{ borderColor: styles.lightColor }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn d-flex align-items-center px-4 py-2"
              style={{
                backgroundColor: currentStep === 1 ? styles.bgColor : styles.secondaryColor,
                color: currentStep === 1 ? '#666' : 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              <ChevronLeft size={16} className="me-2" />
              Previous
            </button>
            
            <div className="d-flex gap-3">
              {(currentStep === 2 || currentStep === 3) && (
                <button
                  onClick={() => handleSkip(currentStep === 2 ? 'users' : 'assets')}
                  className="btn px-4 py-2"
                  style={{
                    borderColor: styles.lightColor,
                    color: styles.primaryColor,
                    backgroundColor: 'transparent',
                    borderRadius: '8px'
                  }}
                >
                  Skip & Continue
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={currentStep === 2 && (!orgData.password || !orgData.confirmPassword || orgData.password !== orgData.confirmPassword)}
                  className="btn d-flex align-items-center px-4 py-2 text-white"
                  style={{
                    backgroundColor: (currentStep === 2 && (!orgData.password || !orgData.confirmPassword || orgData.password !== orgData.confirmPassword))
                      ? styles.bgColor
                      : styles.accentColor,
                    color: (currentStep === 1 && !orgData.name) ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Next
                  <ChevronRight size={16} className="ms-2" />
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Read uploaded CSV files and store their content
                    const processFileContent = (file, callback) => {
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => callback(e.target.result);
                        reader.readAsText(file);
                      } else {
                        callback(null);
                      }
                    };

                    // Process all user files
                    processFileContent(uploadedFiles.heads, (headsContent) => {
                      processFileContent(uploadedFiles.personnel, (personnelContent) => {
                        processFileContent(uploadedFiles.standardUsers, (standardUsersContent) => {
                          // Process assets file
                          processFileContent(uploadedFiles.assets, (assetsContent) => {
                            // Save setup wizard data for dashboard
                            const setupData = {
                              completed: isSetupComplete(),
                              skippedSteps: skippedSteps,
                              userImportMethod: userImportMethod,
                              assetImportMethod: assetImportMethod,
                              uploadedFiles: {
                                heads: uploadedFiles.heads ? {
                                  name: uploadedFiles.heads.name,
                                  content: headsContent,
                                  count: headsContent ? headsContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
                                } : null,
                                personnel: uploadedFiles.personnel ? {
                                  name: uploadedFiles.personnel.name,
                                  content: personnelContent,
                                  count: personnelContent ? personnelContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
                                } : null,
                                standardUsers: uploadedFiles.standardUsers ? {
                                  name: uploadedFiles.standardUsers.name,
                                  content: standardUsersContent,
                                  count: standardUsersContent ? standardUsersContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
                                } : null,
                                assets: uploadedFiles.assets ? {
                                  name: uploadedFiles.assets.name,
                                  content: assetsContent,
                                  count: assetsContent ? assetsContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
                                } : null
                              },
                              orgData: orgData,
                              completedDate: new Date().toISOString()
                            };
                            
                            localStorage.setItem('setupWizardData', JSON.stringify(setupData));
                            
                            if (isSetupComplete()) {
                              alert('Setup completed successfully! Redirecting to dashboard...');
                              localStorage.removeItem('orgDataFromSignup');
                              setTimeout(() => {
                                navigate('/dashboard-sysadmin');
                              }, 1500);
                            } else {
                              alert('Setup incomplete but you can continue. Redirecting to dashboard...');
                              localStorage.removeItem('orgDataFromSignup');
                              setTimeout(() => {
                                navigate('/dashboard-sysadmin');
                              }, 1500);
                            }
                          });
                        });
                      });
                    });
                  }}
                  className="btn d-flex align-items-center px-4 py-2 text-white"
                  style={{
                    backgroundColor: isSetupComplete() ? '#28a745' : styles.accentColor,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  {isSetupComplete() ? 'Complete Setup' : 'Skip & Continue'}
                  <CheckCircle size={16} className="ms-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}