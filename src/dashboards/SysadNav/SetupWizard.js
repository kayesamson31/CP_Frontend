import React, { useState } from 'react';
import { ChevronRight, ChevronLeft, Upload, Download, Users, Building2, Database, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
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
        address: parsed.address || ''
      };
    }
  } catch (error) {
    console.log('No saved org data found');
  }
  return {
    name: '',
    email: '',
    phone: '',
    address: ''
  };
};

const [orgData, setOrgData] = useState(getInitialOrgData());
  const [userImportMethod, setUserImportMethod] = useState('');
  const [assetImportMethod, setAssetImportMethod] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    users: null,
    assets: null
  });
  const [apiConfig, setApiConfig] = useState({
    usersEndpoint: '',
    assetsEndpoint: '',
    apiKey: ''
  });
  const [skippedSteps, setSkippedSteps] = useState({
    users: false,
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
    setSkippedSteps(prev => ({
      ...prev,
      [stepType]: true
    }));
    setCurrentStep(currentStep + 1);
  };

  const handleFileUpload = (type, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));
    if (type === 'users') {
      setSkippedSteps(prev => ({ ...prev, users: false }));
    } else if (type === 'assets') {
      setSkippedSteps(prev => ({ ...prev, assets: false }));
    }
  };

  const downloadTemplate = (type) => {
    const templates = {
      users: `Name,Email,Status,Role
John Doe,john.doe@company.com,active,Standard user
Jane Smith,jane.smith@company.com,active,Personnel
Mike Johnson,mike.johnson@company.com,inactive,Admin official
Sarah Wilson,sarah.wilson@company.com,active,system admin`,
      assets: `Asset Name,Category,Status,Location
Laptop Dell XPS,Computer,Operational,Office Floor 1
Printer HP LaserJet,Office Equipment,Operational,Reception
Server Rack,IT Infrastructure,Operational,Server Room
Office Chair,Furniture,Retired,Storage`
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
    const usersComplete = !skippedSteps.users && (
      (userImportMethod === 'csv' && uploadedFiles.users) ||
      (userImportMethod === 'api' && apiConfig.usersEndpoint && apiConfig.apiKey)
    );
    
    const assetsComplete = !skippedSteps.assets && (
      (assetImportMethod === 'csv' && uploadedFiles.assets) ||
      (assetImportMethod === 'api' && apiConfig.assetsEndpoint)
    );
    
    return usersComplete && assetsComplete && orgData.name && orgData.email;
  };

  const hasSkippedSteps = () => {
    return skippedSteps.users || skippedSteps.assets;
  };

  const getUserImportMethodDisplay = () => {
    if (skippedSteps.users) {
      return 'Skipped';
    }
    if (userImportMethod === 'csv' && uploadedFiles.users) {
      return 'CSV Bulk Upload';
    }
    if (userImportMethod === 'api' && apiConfig.usersEndpoint && apiConfig.apiKey) {
      return 'API Integration';
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
    if (assetImportMethod === 'api' && apiConfig.assetsEndpoint) {
      return 'API Integration';
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
              Admin Email *
            </label>
            <input
              type="email"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="admin@company.com"
              value={orgData.email}
              onChange={(e) => setOrgData({...orgData, email: e.target.value})}
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
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <Users style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Users</h2>
        <p className="text-muted">Add your team members to the system</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div 
            className="p-4 border rounded-3 h-100"
            style={{
              cursor: 'pointer',
              borderColor: userImportMethod === 'csv' ? styles.accentColor : styles.lightColor,
              borderWidth: '2px',
              backgroundColor: userImportMethod === 'csv' ? '#f8f9ff' : 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setUserImportMethod('csv')}
          >
            <Upload style={{ color: styles.accentColor }} className="mb-3" size={28} />
            <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>CSV Upload</h4>
            <p className="text-muted mb-3">Upload a CSV file with your user data</p>
            
            {userImportMethod === 'csv' && (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate('users');
                  }}
                  className="btn btn-sm mb-3 d-flex align-items-center"
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
                  style={{ borderColor: styles.lightColor, backgroundColor: styles.bgColor }}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload('users', e.target.files[0])}
                    className="form-control form-control-sm"
                  />
                  {uploadedFiles.users && (
                    <div className="d-flex align-items-center text-success small mt-2">
                      <CheckCircle size={16} className="me-2" />
                      {uploadedFiles.users.name}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div 
            className="p-4 border rounded-3 h-100"
            style={{
              cursor: 'pointer',
              borderColor: userImportMethod === 'api' ? styles.accentColor : styles.lightColor,
              borderWidth: '2px',
              backgroundColor: userImportMethod === 'api' ? '#f8f9ff' : 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              setUserImportMethod('api');
              setSkippedSteps(prev => ({ ...prev, users: false }));
            }}
          >
            <Wifi style={{ color: styles.accentColor }} className="mb-3" size={28} />
            <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>API Integration</h4>
            <p className="text-muted mb-3">Connect to your existing system</p>
            
            {userImportMethod === 'api' && (
              <div>
                <div className="mb-3">
                  <label className="form-label small fw-medium" style={{ color: styles.primaryColor }}>
                    API Endpoint
                  </label>
                  <input
                    type="url"
                    className="form-control form-control-sm"
                    style={{ borderColor: styles.lightColor }}
                    placeholder="https://api.yourcompany.com/users"
                    value={apiConfig.usersEndpoint}
                    onChange={(e) => setApiConfig({...apiConfig, usersEndpoint: e.target.value})}
                  />
                </div>
                <div>
                  <label className="form-label small fw-medium" style={{ color: styles.primaryColor }}>
                    API Key
                  </label>
                  <input
                    type="password"
                    className="form-control form-control-sm"
                    style={{ borderColor: styles.lightColor }}
                    placeholder="Your API Key"
                    value={apiConfig.apiKey}
                    onChange={(e) => setApiConfig({...apiConfig, apiKey: e.target.value})}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className="p-3 rounded-3"
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
    </div>
  );

  const renderStep3 = () => (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <Database style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Assets</h2>
        <p className="text-muted">Add your organization's assets to the system</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <div 
            className="p-4 border rounded-3 h-100"
            style={{
              cursor: 'pointer',
              borderColor: assetImportMethod === 'csv' ? styles.accentColor : styles.lightColor,
              borderWidth: '2px',
              backgroundColor: assetImportMethod === 'csv' ? '#f8f9ff' : 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={() => setAssetImportMethod('csv')}
          >
            <Upload style={{ color: styles.accentColor }} className="mb-3" size={28} />
            <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>CSV Upload</h4>
            <p className="text-muted mb-3">Upload a CSV file with your asset data</p>
            
            {assetImportMethod === 'csv' && (
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate('assets');
                  }}
                  className="btn btn-sm mb-3 d-flex align-items-center"
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
                  style={{ borderColor: styles.lightColor, backgroundColor: styles.bgColor }}
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
            )}
          </div>
        </div>

        <div className="col-md-6">
          <div 
            className="p-4 border rounded-3 h-100"
            style={{
              cursor: 'pointer',
              borderColor: assetImportMethod === 'api' ? styles.accentColor : styles.lightColor,
              borderWidth: '2px',
              backgroundColor: assetImportMethod === 'api' ? '#f8f9ff' : 'white',
              transition: 'all 0.3s ease'
            }}
            onClick={() => {
              setAssetImportMethod('api');
              setSkippedSteps(prev => ({ ...prev, assets: false }));
            }}
          >
            <Wifi style={{ color: styles.accentColor }} className="mb-3" size={28} />
            <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>API Integration</h4>
            <p className="text-muted mb-3">Connect to your existing asset management system</p>
            
            {assetImportMethod === 'api' && (
              <div>
                <label className="form-label small fw-medium" style={{ color: styles.primaryColor }}>
                  API Endpoint
                </label>
                <input
                  type="url"
                  className="form-control form-control-sm"
                  style={{ borderColor: styles.lightColor }}
                  placeholder="https://api.yourcompany.com/assets"
                  value={apiConfig.assetsEndpoint}
                  onChange={(e) => setApiConfig({...apiConfig, assetsEndpoint: e.target.value})}
                />
              </div>
            )}
          </div>
        </div>
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
        <p className="text-muted">
          {isSetupComplete() 
            ? 'Congratulations! Your system has been successfully configured and is ready to use.'
            : 'Some steps were skipped. You can complete them later from your dashboard.'
          }
        </p>
      </div>

      <div className="mb-4">
        <h3 className="h5 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>Configuration Summary</h3>
        
        <div>
          {[
            { label: 'Organization:', value: orgData.name || 'Not specified' },
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
                              (getUserImportMethodDisplay() === 'CSV Bulk Upload' || getUserImportMethodDisplay() === 'API Integration') ? '#28a745' :
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
                              (getAssetImportMethodDisplay() === 'CSV Bulk Upload' || getAssetImportMethodDisplay() === 'API Integration') ? '#28a745' :
                              '#6c757d'
              }}
            >
              {getAssetImportMethodDisplay()}
            </span>
          </div>
          
          {uploadedFiles.users && (
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
              <span className="fw-medium text-muted">Users CSV:</span>
              <span className="text-success fw-medium">{uploadedFiles.users.name}</span>
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
                  disabled={currentStep === 1 && (!orgData.name || !orgData.email)}
                  className="btn d-flex align-items-center px-4 py-2 text-white"
                  style={{
                    backgroundColor: (currentStep === 1 && (!orgData.name || !orgData.email))
                      ? styles.bgColor
                      : styles.accentColor,
                    color: (currentStep === 1 && (!orgData.name || !orgData.email)) ? '#666' : 'white',
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

  // Process users file
  processFileContent(uploadedFiles.users, (usersContent) => {
    // Process assets file
    processFileContent(uploadedFiles.assets, (assetsContent) => {
      // Save setup wizard data for dashboard
      const setupData = {
        completed: isSetupComplete(),
        skippedSteps: skippedSteps,
        userImportMethod: userImportMethod,
        assetImportMethod: assetImportMethod,
        uploadedFiles: {
          users: uploadedFiles.users ? {
            name: uploadedFiles.users.name,
            content: usersContent,
            count: usersContent ? usersContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
          } : null,
          assets: uploadedFiles.assets ? {
            name: uploadedFiles.assets.name,
            content: assetsContent,
            count: assetsContent ? assetsContent.split('\n').filter(line => line.trim() !== '').length - 1 : 0
          } : null
        },
        apiConfig: apiConfig,
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