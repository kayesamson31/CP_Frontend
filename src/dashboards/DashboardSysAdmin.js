import { useState, useEffect } from 'react';
import SidebarLayout from '../Layouts/SidebarLayout';

export default function DashboardSyAdmin() {
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalAssets: 0,
    setupStatus: {
      organizationInfo: false,
      usersUpload: false,
      assetsUpload: false
    },
    setupProgress: 0,
    systemHealth: 'Good' // Good, Warning, Critical
  });
  
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);

  // Sample data for demonstration
  const generateSampleUsers = (count) => {
    const sampleUsers = [];
    for (let i = 1; i <= Math.min(count, 10); i++) {
      sampleUsers.push({
        id: i,
        name: `User ${i}`,
        email: `user${i}@company.com`,
        department: ['IT', 'HR', 'Finance', 'Operations'][Math.floor(Math.random() * 4)],
        status: Math.random() > 0.1 ? 'Active' : 'Inactive',
        lastLogin: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toLocaleDateString()
      });
    }
    return sampleUsers;
  };

  const generateSampleAssets = (count) => {
    const sampleAssets = [];
    const assetTypes = ['Laptop', 'Desktop', 'Monitor', 'Printer', 'Server', 'Router', 'Phone'];
    const locations = ['Office A', 'Office B', 'Warehouse', 'Remote'];
    
    for (let i = 1; i <= Math.min(count, 10); i++) {
      sampleAssets.push({
        id: i,
        name: `${assetTypes[Math.floor(Math.random() * assetTypes.length)]} ${i}`,
        assetId: `AST-${String(i).padStart(4, '0')}`,
        type: assetTypes[Math.floor(Math.random() * assetTypes.length)],
        location: locations[Math.floor(Math.random() * locations.length)],
        status: Math.random() > 0.15 ? 'Operational' : 'Maintenance',
        assignedTo: Math.random() > 0.3 ? `User ${Math.floor(Math.random() * 20) + 1}` : 'Unassigned'
      });
    }
    return sampleAssets;
  };

  // Function to simulate API data fetching
  const fetchAPIData = async (endpoint, apiKey) => {
    try {
      if (endpoint.includes('users')) {
        return {
          data: generateSampleUsers(50),
          count: 50
        };
      } else if (endpoint.includes('assets')) {
        return {
          data: generateSampleAssets(30),
          count: 30
        };
      }
    } catch (error) {
      console.error('API fetch error:', error);
      return { data: [], count: 0 };
    }
  };

  // Function to count CSV rows
  const countCSVRows = (csvContent) => {
    if (!csvContent) return 0;
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    return Math.max(0, lines.length - 1);
  };

  // Function to parse uploaded CSV data
  const parseUploadedData = (wizardData) => {
    let userCount = 0;
    let assetCount = 0;

    if (wizardData.uploadedFiles && wizardData.uploadedFiles.users) {
      if (wizardData.userImportMethod === 'csv') {
        userCount = countCSVRows(wizardData.uploadedFiles.users.content);
      } else if (wizardData.userImportMethod === 'api' && wizardData.apiConfig) {
        userCount = wizardData.apiConfig.usersEndpoint ? 50 : 0;
      }
    }

    if (wizardData.uploadedFiles && wizardData.uploadedFiles.assets) {
      if (wizardData.assetImportMethod === 'csv') {
        assetCount = countCSVRows(wizardData.uploadedFiles.assets.content);
      } else if (wizardData.assetImportMethod === 'api' && wizardData.apiConfig) {
        assetCount = wizardData.apiConfig.assetsEndpoint ? 30 : 0;
      }
    }

    return { userCount, assetCount };
  };

  // Load dashboard data
  useEffect(() => {
    const setupWizardData = localStorage.getItem('setupWizardData');
    
    if (setupWizardData) {
      const wizardData = JSON.parse(setupWizardData);
      const isComplete = wizardData.completed;
      
      setSetupCompleted(isComplete);
      
      if (isComplete) {
        const { userCount, assetCount } = parseUploadedData(wizardData);
        
        setDashboardData({
          totalUsers: userCount,
          totalAssets: assetCount,
          setupStatus: {
            organizationInfo: true,
            usersUpload: !wizardData.skippedSteps.users,
            assetsUpload: !wizardData.skippedSteps.assets
          },
          setupProgress: 100,
          systemHealth: userCount > 0 || assetCount > 0 ? 'Good' : 'Warning',
          wizardData: wizardData
        });

        // Generate sample data for lists
        setUsersList(generateSampleUsers(userCount));
        setAssetsList(generateSampleAssets(assetCount));
      } else {
        const { userCount, assetCount } = parseUploadedData(wizardData);
           
        const completedSteps = Object.values({
          organizationInfo: wizardData.orgData.name && wizardData.orgData.email,
          usersUpload: !wizardData.skippedSteps.users && wizardData.uploadedFiles.users,
          assetsUpload: !wizardData.skippedSteps.assets && wizardData.uploadedFiles.assets
        }).filter(Boolean).length;
        
        setDashboardData(prev => ({
          ...prev,
          totalUsers: userCount,
          totalAssets: assetCount,
          setupProgress: (completedSteps / 3) * 100,
          setupStatus: {
            organizationInfo: wizardData.orgData.name && wizardData.orgData.email,
            usersUpload: !wizardData.skippedSteps.users && wizardData.uploadedFiles.users,
            assetsUpload: !wizardData.skippedSteps.assets && wizardData.uploadedFiles.assets
          },
          systemHealth: completedSteps > 0 ? 'Warning' : 'Critical',
          wizardData: wizardData,
          skippedSteps: wizardData.skippedSteps
        }));

        // Generate sample data for lists if data exists
        if (userCount > 0) setUsersList(generateSampleUsers(userCount));
        if (assetCount > 0) setAssetsList(generateSampleAssets(assetCount));
      }
    } else {
      setDashboardData(prev => ({
        ...prev,
        totalUsers: 0,
        totalAssets: 0,
        setupProgress: 0,
        systemHealth: 'Critical'
      }));
    }
  }, []);
  
  // Auto-dismiss completion message
  useEffect(() => {
    if (setupCompleted && localStorage.getItem('justCompleted') === 'true') {
      const timer = setTimeout(() => {
        localStorage.removeItem('justCompleted');
        setDashboardData(prev => ({...prev}));
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [setupCompleted]);

  const handleCompleteSetup = () => {
    const setupWizardData = localStorage.getItem('setupWizardData');
    let userCount = dashboardData.totalUsers;
    let assetCount = dashboardData.totalAssets;

    if (setupWizardData) {
      const wizardData = JSON.parse(setupWizardData);
      const parsedData = parseUploadedData(wizardData);
      userCount = parsedData.userCount || userCount;
      assetCount = parsedData.assetCount || assetCount;
      
      wizardData.completed = true;
      wizardData.completedDate = new Date().toISOString();
      localStorage.setItem('setupWizardData', JSON.stringify(wizardData));
    }

    localStorage.setItem('justCompleted', 'true');
    
    setSetupCompleted(true);
    setShowSetupDetails(false);
    
    setDashboardData({
      totalUsers: userCount,
      totalAssets: assetCount,
      setupStatus: {
        organizationInfo: true,
        usersUpload: true,
        assetsUpload: true
      },
      setupProgress: 100,
      systemHealth: 'Good'
    });

    // Generate sample data
    setUsersList(generateSampleUsers(userCount));
    setAssetsList(generateSampleAssets(assetCount));
  };

  // Function to handle CSV upload
  const handleCSVUpload = (file, type) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const csvContent = e.target.result;
      const rowCount = countCSVRows(csvContent);
      
      const setupWizardData = localStorage.getItem('setupWizardData');
      if (setupWizardData) {
        const wizardData = JSON.parse(setupWizardData);
        
        if (!wizardData.uploadedFiles) {
          wizardData.uploadedFiles = {};
        }
        
        wizardData.uploadedFiles[type] = {
          content: csvContent,
          count: rowCount,
          fileName: file.name,
          uploadDate: new Date().toISOString()
        };
        
        if (wizardData.skippedSteps) {
          wizardData.skippedSteps[type] = false;
        }
        
        localStorage.setItem('setupWizardData', JSON.stringify(wizardData));
        
        const completedSteps = Object.values({
          organizationInfo: wizardData.orgData.name && wizardData.orgData.email,
          usersUpload: wizardData.uploadedFiles.users,
          assetsUpload: wizardData.uploadedFiles.assets
        }).filter(Boolean).length;
        
        const newProgress = (completedSteps / 3) * 100;
        
        setDashboardData(prev => ({
          ...prev,
          [type === 'users' ? 'totalUsers' : 'totalAssets']: rowCount,
          setupStatus: {
            ...prev.setupStatus,
            [`${type}Upload`]: true
          },
          setupProgress: newProgress,
          systemHealth: newProgress > 66 ? 'Good' : newProgress > 33 ? 'Warning' : 'Critical',
          skippedSteps: wizardData.skippedSteps
        }));

        // Generate sample data for the uploaded type
        if (type === 'users') {
          setUsersList(generateSampleUsers(rowCount));
        } else {
          setAssetsList(generateSampleAssets(rowCount));
        }
        
        alert(`${type === 'users' ? 'Users' : 'Assets'} uploaded successfully! Found ${rowCount} records.`);
      }
    };
    reader.readAsText(file);
  };

  const getSystemHealthColor = (health) => {
    switch (health) {
      case 'Good': return 'success';
      case 'Warning': return 'warning';
      case 'Critical': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusBadgeClass = (status) => {
    if (status === 'Active' || status === 'Operational') return 'bg-success';
    if (status === 'Inactive' || status === 'Maintenance') return 'bg-warning';
    return 'bg-secondary';
  };

  return (
    <SidebarLayout role="sysadmin">
      <div>
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">System Administrator Dashboard</h2>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </small>
          </div>
          
          {/* Quick Actions - Top Right */}
          <div className="d-flex gap-2">
            <button className={`btn btn-primary btn-sm ${!setupCompleted ? 'disabled' : ''}`}>
              <i className="bi bi-person-plus me-1"></i>Add User
            </button>
            <button className={`btn btn-info btn-sm ${!setupCompleted ? 'disabled' : ''}`}>
              <i className="bi bi-plus-circle me-1"></i>Add Asset
            </button>
            <button className={`btn btn-success btn-sm ${!setupCompleted ? 'disabled' : ''}`}>
              <i className="bi bi-file-earmark-arrow-up me-1"></i>Bulk Import
            </button>
          </div>
        </div>

        {/* Setup Status Alert */}
        {!setupCompleted && (
          <div className="alert alert-warning mb-4" role="alert">
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Setup Required</strong>
                  <small>{Math.round(dashboardData.setupProgress)}% Complete</small>
                </div>
                <div className="progress mb-2" style={{height: '6px'}}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: `${dashboardData.setupProgress}%`}}
                  ></div>
                </div>
                <p className="mb-0">Complete the setup wizard to upload users and assets to your system.</p>
                
                {showSetupDetails && dashboardData.wizardData && (
                  <div className="mt-3 p-3 bg-light rounded">
                    <h6 className="mb-2">Pending Setup Items:</h6>
                    
                    {!dashboardData.setupStatus.organizationInfo && (
                      <div className="mb-2">
                        <i className="bi bi-circle text-danger me-2"></i>
                        <span>Organization Information</span>
                      </div>
                    )}
                    
                    {dashboardData.skippedSteps && dashboardData.skippedSteps.users && (
                      <div className="mb-3 ms-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-circle text-warning me-2"></i>
                          <span className="fw-semibold">Users Upload (Skipped)</span>
                        </div>
                        <div className="ms-4">
                          <p className="text-muted small mb-2">Choose upload method:</p>
                          <div className="mb-2">
                            <label className="form-label small">CSV Upload:</label>
                            <input 
                              type="file" 
                              accept=".csv" 
                              className="form-control form-control-sm"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleCSVUpload(e.target.files[0], 'users');
                                }
                              }}
                            />
                          </div>
                          <p className="text-muted small mb-0">OR use API integration if you have an existing system</p>
                        </div>
                      </div>
                    )}
                    
                    {dashboardData.skippedSteps && dashboardData.skippedSteps.assets && (
                      <div className="mb-3 ms-3">
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-circle text-warning me-2"></i>
                          <span className="fw-semibold">Assets Upload (Skipped)</span>
                        </div>
                        <div className="ms-4">
                          <p className="text-muted small mb-2">Choose upload method:</p>
                          <div className="mb-2">
                            <label className="form-label small">CSV Upload:</label>
                            <input 
                              type="file" 
                              accept=".csv" 
                              className="form-control form-control-sm"
                              onChange={(e) => {
                                if (e.target.files[0]) {
                                  handleCSVUpload(e.target.files[0], 'assets');
                                }
                              }}
                            />
                          </div>
                          <p className="text-muted small mb-0">OR use API integration if you have an existing system</p>
                        </div>
                      </div>
                    )}
             
                    {dashboardData.setupStatus.organizationInfo && 
                     dashboardData.setupStatus.usersUpload && 
                     dashboardData.setupStatus.assetsUpload && (
                      <div className="mt-3 text-center">
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={handleCompleteSetup}
                        >
                          <i className="bi bi-check-circle me-2"></i>
                          Complete Setup
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button 
                className="btn btn-warning btn-sm ms-3" 
                onClick={() => setShowSetupDetails(!showSetupDetails)}
              >
                {showSetupDetails ? 'Hide' : 'Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Congratulatory Message */}
        {setupCompleted && localStorage.getItem('justCompleted') === 'true' && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert">
            <div className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-4"></i>
              <div>
                <strong>Congratulations!</strong> Your organization's system setup has been completed successfully.
                <p className="mb-0 mt-1">You can now start managing users, assets, and system configurations.</p>
              </div>
            </div>
            <button 
              type="button" 
              className="btn-close" 
              onClick={() => localStorage.removeItem('justCompleted')}
              data-bs-dismiss="alert"
            ></button>
          </div>
        )}

        {/* Main Dashboard Cards */}
        <div className="row mb-4">
          {/* Total Users Card */}
          <div className="col-md-4 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="bg-primary rounded-circle p-3 me-3">
                      <i className="bi bi-people-fill text-white fs-4"></i>
                    </div>
                  </div>
                  <div className="text-end flex-grow-1">
                    <h6 className="card-title mb-1 text-muted">Total Users</h6>
                    <h4 className="mb-0">{dashboardData.totalUsers}</h4>
                    <small className="text-muted">Registered users</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Total Assets Card */}
          <div className="col-md-4 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className="bg-info rounded-circle p-3 me-3">
                      <i className="bi bi-building text-white fs-4"></i>
                    </div>
                  </div>
                  <div className="text-end flex-grow-1">
                    <h6 className="card-title mb-1 text-muted">Total Assets</h6>
                    <h4 className="mb-0">{dashboardData.totalAssets}</h4>
                    <small className="text-muted">Managed assets</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* System Health Card */}
          <div className="col-md-4 mb-3">
            <div className="card h-100 border-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <div className={`rounded-circle p-3 me-3 bg-${getSystemHealthColor(dashboardData.systemHealth)}`}>
                      <i className="bi bi-shield-check text-white fs-4"></i>
                    </div>
                  </div>
                  <div className="text-end flex-grow-1">
                    <h6 className="card-title mb-1 text-muted">System Health</h6>
                    <h4 className="mb-0">{dashboardData.systemHealth}</h4>
                    <small className={`text-${getSystemHealthColor(dashboardData.systemHealth)}`}>
                      {dashboardData.systemHealth === 'Good' ? 'All systems operational' : 
                       dashboardData.systemHealth === 'Warning' ? 'Needs attention' : 
                       'Setup required'}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>



        {/* Users and Assets Lists */}
        <div className="row">
          {/* Users List */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Users</h5>
                  <button className={`btn btn-primary btn-sm ${!setupCompleted ? 'disabled' : ''}`}>
                    <i className="bi bi-eye me-1"></i>View All
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {usersList.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Name</th>
                          <th className="border-0">Department</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Last Login</th>
                        </tr>
                      </thead>
                      <tbody>
                        {usersList.map((user) => (
                          <tr key={user.id}>
                            <td>
                              <div>
                                <div className="fw-semibold">{user.name}</div>
                                <small className="text-muted">{user.email}</small>
                              </div>
                            </td>
                            <td>{user.department}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(user.status)}`}>
                                {user.status}
                              </span>
                            </td>
                            <td>
                              <small className="text-muted">{user.lastLogin}</small>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-people fs-1 text-muted mb-3"></i>
                    <p className="text-muted">No users uploaded yet</p>
                    <p className="text-muted small">Complete setup wizard to import users</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Assets List */}
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-bottom">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="card-title mb-0">Recent Assets</h5>
                  <button className={`btn btn-info btn-sm ${!setupCompleted ? 'disabled' : ''}`}>
                    <i className="bi bi-eye me-1"></i>View All
                  </button>
                </div>
              </div>
              <div className="card-body p-0">
                {assetsList.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Asset</th>
                          <th className="border-0">Type</th>
                          <th className="border-0">Location</th>
                          <th className="border-0">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assetsList.map((asset) => (
                          <tr key={asset.id}>
                            <td>
                              <div>
                                <div className="fw-semibold">{asset.name}</div>
                                <small className="text-muted">{asset.assetId}</small>
                              </div>
                            </td>
                            <td>{asset.type}</td>
                            <td>{asset.location}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(asset.status)}`}>
                                {asset.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-building fs-1 text-muted mb-3"></i>
                    <p className="text-muted">No assets uploaded yet</p>
                    <p className="text-muted small">Complete setup wizard to import assets</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}