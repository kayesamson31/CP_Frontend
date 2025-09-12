import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SidebarLayout from '../Layouts/SidebarLayout';

export default function DashboardSyAdmin() {
  const navigate = useNavigate();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // NEW: States for bulk upload modals
  const [showUserUploadModal, setShowUserUploadModal] = useState(false);
  const [showAssetUploadModal, setShowAssetUploadModal] = useState(false);
  const [selectedUserType, setSelectedUserType] = useState('');
  const [uploadingUsers, setUploadingUsers] = useState(false);
  const [uploadingAssets, setUploadingAssets] = useState(false);

const [assetPreviewData, setAssetPreviewData] = useState(null);
const [selectedAssetFile, setSelectedAssetFile] = useState(null);

  // Function to add new activity
const addActivity = (type, title, user = organizationData.contactPerson) => {
  const newActivity = {
    id: Date.now(), // Simple unique ID
    type: type,
    icon: getActivityIcon(type),
    title: title,
    user: user,
    timestamp: new Date().toISOString(), // Store actual timestamp
    color: getActivityColor(type)
  };

  setRecentActivities(prev => [newActivity, ...prev.slice(0, 9)]); // Keep only latest 10
};

// Helper function for activity icons
const getActivityIcon = (type) => {
  switch (type) {
    case 'csv_upload': return 'bi-upload';
    case 'user_added': return 'bi-person-plus';
    case 'asset_added': return 'bi-box-seam';
    case 'setup_completed': return 'bi-check-circle';
    case 'maintenance': return 'bi-gear';
    default: return 'bi-activity';
  }
};

// Helper function for activity colors
const getActivityColor = (type) => {
  switch (type) {
    case 'csv_upload': return 'info';
    case 'user_added': return 'primary';
    case 'asset_added': return 'success';
    case 'setup_completed': return 'success';
    case 'maintenance': return 'warning';
    default: return 'secondary';
  }
};

// Template download function
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

// Helper function to format timestamp to relative time
const getRelativeTime = (timestamp) => {
  const now = new Date();
  const activityTime = new Date(timestamp);
  const diffInSeconds = Math.floor((now - activityTime) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  
  return activityTime.toLocaleDateString();
};
  // Function to get dynamic organization data
// Replace your getOrganizationData function with this fixed version:

const getOrganizationData = () => {
  try {
    // First check if there's setup wizard data (most complete)
    const setupWizardData = localStorage.getItem('setupWizardData');
    if (setupWizardData) {
      const wizardData = JSON.parse(setupWizardData);
      if (wizardData.orgData) {
        // Calculate ACCUMULATED counts from ALL uploaded data
        let totalUsers = 0;
        let totalAssets = 0;
        let headsCount = 0;
        let personnelCount = 0;
        let standardUsersCount = 0;

        // Check if users were skipped
        const usersSkipped = wizardData.skippedSteps?.users === true;
        const assetsSkipped = wizardData.skippedSteps?.assets === true;

        if (wizardData.uploadedFiles && !usersSkipped) {
          // ACCUMULATE all uploads for each user type
          if (wizardData.uploadedFiles.heads) {
            // Sum all heads uploads if there are multiple
            if (Array.isArray(wizardData.uploadedFiles.heads)) {
              headsCount = wizardData.uploadedFiles.heads.reduce((sum, upload) => sum + (upload.count || 0), 0);
            } else {
              headsCount = wizardData.uploadedFiles.heads.count || 0;
            }
          }
          
          if (wizardData.uploadedFiles.personnel) {
            // Sum all personnel uploads if there are multiple
            if (Array.isArray(wizardData.uploadedFiles.personnel)) {
              personnelCount = wizardData.uploadedFiles.personnel.reduce((sum, upload) => sum + (upload.count || 0), 0);
            } else {
              personnelCount = wizardData.uploadedFiles.personnel.count || 0;
            }
          }
          
          if (wizardData.uploadedFiles.standardUsers) {
            // Sum all standard users uploads if there are multiple
            if (Array.isArray(wizardData.uploadedFiles.standardUsers)) {
              standardUsersCount = wizardData.uploadedFiles.standardUsers.reduce((sum, upload) => sum + (upload.count || 0), 0);
            } else {
              standardUsersCount = wizardData.uploadedFiles.standardUsers.count || 0;
            }
          }
          
          totalUsers = headsCount + personnelCount + standardUsersCount;
        }

        if (wizardData.uploadedFiles && !assetsSkipped) {
          // ACCUMULATE all asset uploads
          if (wizardData.uploadedFiles.assets) {
            if (Array.isArray(wizardData.uploadedFiles.assets)) {
              totalAssets = wizardData.uploadedFiles.assets.reduce((sum, upload) => sum + (upload.count || 0), 0);
            } else {
              totalAssets = wizardData.uploadedFiles.assets.count || 0;
            }
          }
        }

        // Rest of the function remains the same...
        let displayPersonnel, displayStandardUsers, displayHeads, displayAssets, displaySystemHealth;

        if (wizardData.completed === true) {
          displayPersonnel = personnelCount;
          displayStandardUsers = standardUsersCount;
          displayHeads = headsCount;
          displayAssets = totalAssets;
          displaySystemHealth = totalUsers > 0 || totalAssets > 0 ? 95 : 75;
        } else {
          if (usersSkipped) {
            displayPersonnel = 0;
            displayStandardUsers = 0;
            displayHeads = 0;
          } else {
            displayPersonnel = personnelCount;
            displayStandardUsers = standardUsersCount;
            displayHeads = headsCount;
          }

          if (assetsSkipped) {
            displayAssets = 0;
          } else {
            displayAssets = totalAssets;
          }

          displaySystemHealth = (totalUsers > 0 || totalAssets > 0) ? 75 : 25;
        }

        return {
          name: wizardData.orgData.name || "OpenFMS",
          type: wizardData.orgData.orgType || "Government Agency",
          address: wizardData.orgData.address || "Not specified",
          phone: wizardData.orgData.phone || "Not specified",
          country: wizardData.orgData.country || "Not specified",
          website: wizardData.orgData.website || "https://openfms.io",
          contactPerson: wizardData.orgData.contactPerson || "System Administrator",
          contactEmail: wizardData.orgData.email || wizardData.orgData.contactEmail || "admin@openfms.io",
          
          personnel: displayPersonnel,
          standardUsers: displayStandardUsers,
          heads: displayHeads,
          systemAdmins: Math.max(1, Math.floor(displayHeads * 0.1) + 1),
          totalAssets: displayAssets,
          systemHealthPercentage: displaySystemHealth,
          
          isUsersDataSkipped: usersSkipped && (headsCount === 0 && personnelCount === 0 && standardUsersCount === 0),
          isAssetsDataSkipped: assetsSkipped && totalAssets === 0
        };
      }
    }

    // Fallback logic remains the same...
    // ... rest of function
  } catch (error) {
    console.error('Error loading organization data:', error);
    // ... error fallback
  }
};

  // Make organizationData dynamic state
  const [organizationData, setOrganizationData] = useState(getOrganizationData());
  
  const [dashboardData, setDashboardData] = useState({
    totalUsers: 0,
    totalAssets: 0,
    setupStatus: {
      organizationInfo: false,
      usersUpload: false,
      assetsUpload: false
    },
    setupProgress: 0,
    systemHealth: 'Good'
  });

  // Sample data generation functions
  const generateSampleUsers = (count) => {
    const sampleUsers = [];
    for (let i = 1; i <= Math.min(count, 10); i++) {
      sampleUsers.push({
        id: i,
        name: `User ${i}`,
        email: `user${i}@${organizationData.name.toLowerCase().replace(/\s+/g, '')}.com`,
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

    if (wizardData.uploadedFiles) {
      // Count all user types
      if (wizardData.uploadedFiles.heads) userCount += wizardData.uploadedFiles.heads.count || 0;
      if (wizardData.uploadedFiles.personnel) userCount += wizardData.uploadedFiles.personnel.count || 0;
      if (wizardData.uploadedFiles.standardUsers) userCount += wizardData.uploadedFiles.standardUsers.count || 0;
      
      // Count assets
      if (wizardData.uploadedFiles.assets) assetCount = wizardData.uploadedFiles.assets.count || 0;

      // Legacy support for old structure
      if (wizardData.uploadedFiles.users && wizardData.userImportMethod === 'csv') {
        userCount = countCSVRows(wizardData.uploadedFiles.users.content);
      } else if (wizardData.userImportMethod === 'api' && wizardData.apiConfig) {
        userCount = wizardData.apiConfig.usersEndpoint ? 50 : 0;
      }
    }

    return { userCount, assetCount };
  };

  // Function to refresh organization data
  const refreshOrganizationData = () => {
    const updatedOrgData = getOrganizationData();
    setOrganizationData(updatedOrgData);
  };

// NEW: State for preview data
const [previewData, setPreviewData] = useState(null);
const [selectedFile, setSelectedFile] = useState(null);

// NEW: Function to preview CSV data
const handleFilePreview = (file, userType) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvContent = e.target.result;
      const rowCount = countCSVRows(csvContent);
      
      setPreviewData({
        userType,
        fileName: file.name,
        rowCount,
        csvContent
      });
      setSelectedFile(file);
    } catch (error) {
      alert('Error reading the file. Please check the file format.');
    }
  };
  reader.readAsText(file);
};

// MODIFIED: Function to actually process the upload
const handleBulkUserUpload = () => {
  if (!previewData || !selectedFile) {
    alert('No file selected for upload!');
    return;
  }

  setUploadingUsers(true);
  
  try {
    const { csvContent, rowCount, userType } = previewData;
    
    // Get or create setup wizard data
    let setupWizardData = localStorage.getItem('setupWizardData');
    let wizardData;
    
    if (setupWizardData) {
      wizardData = JSON.parse(setupWizardData);
    } else {
      wizardData = {
        orgData: {
          name: organizationData.name,
          email: organizationData.contactEmail
        },
        uploadedFiles: {},
        skippedSteps: {},
        completed: false
      };
    }

    if (!wizardData.uploadedFiles) {
      wizardData.uploadedFiles = {};
    }

    // NEW: Check if this user type already has uploads
    const newUpload = {
      content: csvContent,
      count: rowCount,
      fileName: selectedFile.name,
      uploadDate: new Date().toISOString()
    };

    if (wizardData.uploadedFiles[userType]) {
      // If already exists, convert to array and add new upload
      if (Array.isArray(wizardData.uploadedFiles[userType])) {
        wizardData.uploadedFiles[userType].push(newUpload);
      } else {
        // Convert existing single upload to array and add new one
        const existingUpload = wizardData.uploadedFiles[userType];
        wizardData.uploadedFiles[userType] = [existingUpload, newUpload];
      }
    } else {
      // First upload for this user type
      wizardData.uploadedFiles[userType] = newUpload;
    }

    // Mark this user type as no longer skipped
    if (wizardData.skippedSteps) {
      wizardData.skippedSteps[userType] = false;
      wizardData.skippedSteps.users = false;
    }

    localStorage.setItem('setupWizardData', JSON.stringify(wizardData));
     
    // Check if setup should be auto-completed
      const orgInfo = wizardData.orgData?.name && wizardData.orgData?.email;
      const hasUsers = Object.keys(wizardData.uploadedFiles || {}).some(key => 
        ['heads', 'personnel', 'standardUsers'].includes(key)
      );
      const hasAssets = wizardData.uploadedFiles?.assets;

     // Auto-complete setup ONLY if ALL conditions are met (users AND assets)
const hasAllRequiredData = orgInfo && hasUsers && hasAssets;
if (hasAllRequiredData && !wizardData.completed) {
  wizardData.completed = true;
  wizardData.completedDate = new Date().toISOString();
  localStorage.setItem('setupWizardData', JSON.stringify(wizardData));
  setSetupCompleted(true);
  localStorage.setItem('justCompleted', 'true');
  
  // Add completion activity
  addActivity(
    'setup_completed',
    `${organizationData.name} system setup completed automatically`,
    organizationData.contactPerson
  );
}
    // **CRITICAL: Force refresh organization data**
    const updatedOrgData = getOrganizationData();
    setOrganizationData(updatedOrgData);

    // Add activity log
    const userTypeDisplayName = userType === 'heads' ? 'Heads' : 
                               userType === 'personnel' ? 'Personnel' : 
                               'Standard Users';
    
    addActivity(
      'csv_upload',
      `${userTypeDisplayName} CSV uploaded: +${rowCount} records added (Total: ${updatedOrgData[userType]})`,
      organizationData.contactPerson
    );

    // Close modal and reset form
    setShowUserUploadModal(false);
    setSelectedUserType('');
    setPreviewData(null);
    setSelectedFile(null);
    
    alert(`${userTypeDisplayName} uploaded successfully! Added ${rowCount} records. Total ${userTypeDisplayName}: ${updatedOrgData[userType]}`);
    
  } catch (error) {
    console.error('Error processing user CSV:', error);
    alert('Error processing the CSV file. Please check the file format.');
  } finally {
    setUploadingUsers(false);
  }
};

// NEW: Function to preview asset CSV data
const handleAssetFilePreview = (file) => {
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const csvContent = e.target.result;
      const rowCount = countCSVRows(csvContent);
      
      setAssetPreviewData({
        fileName: file.name,
        rowCount,
        csvContent
      });
      setSelectedAssetFile(file);
    } catch (error) {
      alert('Error reading the file. Please check the file format.');
    }
  };
  reader.readAsText(file);
};

// MODIFIED: Function to actually process asset upload
const handleBulkAssetUpload = () => {
  if (!assetPreviewData || !selectedAssetFile) {
    alert('No file selected for upload!');
    return;
  }

  setUploadingAssets(true);
  
  try {
    const { csvContent, rowCount } = assetPreviewData;
    
    // Get or create setup wizard data
    let setupWizardData = localStorage.getItem('setupWizardData');
    let wizardData;
    
    if (setupWizardData) {
      wizardData = JSON.parse(setupWizardData);
    } else {
      wizardData = {
        orgData: {
          name: organizationData.name,
          email: organizationData.contactEmail
        },
        uploadedFiles: {},
        skippedSteps: {},
        completed: false
      };
    }

    if (!wizardData.uploadedFiles) {
      wizardData.uploadedFiles = {};
    }

    // NEW: Check if assets already have uploads
    const newUpload = {
      content: csvContent,
      count: rowCount,
      fileName: selectedAssetFile.name,
      uploadDate: new Date().toISOString()
    };

    if (wizardData.uploadedFiles.assets) {
      // If already exists, convert to array and add new upload
      if (Array.isArray(wizardData.uploadedFiles.assets)) {
        wizardData.uploadedFiles.assets.push(newUpload);
      } else {
        // Convert existing single upload to array and add new one
        const existingUpload = wizardData.uploadedFiles.assets;
        wizardData.uploadedFiles.assets = [existingUpload, newUpload];
      }
    } else {
      // First upload for assets
      wizardData.uploadedFiles.assets = newUpload;
    }

    // Mark assets as no longer skipped
    if (wizardData.skippedSteps) {
      wizardData.skippedSteps.assets = false;
    }

    localStorage.setItem('setupWizardData', JSON.stringify(wizardData));

    // **CRITICAL: Force refresh organization data**
    const updatedOrgData = getOrganizationData();
    setOrganizationData(updatedOrgData);

    // Generate sample assets for display (accumulate with existing)
    const existingAssets = assetsList.length;
    setAssetsList(prev => [...prev, ...generateSampleAssets(rowCount)]);

    // Add activity log
    addActivity(
      'csv_upload',
      `Assets CSV uploaded: +${rowCount} records added (Total: ${updatedOrgData.totalAssets})`,
      organizationData.contactPerson
    );

    // Close modal and reset
    setShowAssetUploadModal(false);
    setAssetPreviewData(null);
    setSelectedAssetFile(null);
    
    alert(`Assets uploaded successfully! Added ${rowCount} records. Total Assets: ${updatedOrgData.totalAssets}`);
    
  } catch (error) {
    console.error('Error processing asset CSV:', error);
    alert('Error processing the CSV file. Please check the file format.');
  } finally {
    setUploadingAssets(false);
  }
};

  // Function to handle CSV upload (existing function - keep for compatibility)
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
        
    // Check for actual uploaded data (not skipped)
const hasHeads = wizardData.uploadedFiles?.heads && !wizardData.skippedSteps?.heads;
const hasPersonnel = wizardData.uploadedFiles?.personnel && !wizardData.skippedSteps?.personnel;  
const hasStandardUsers = wizardData.uploadedFiles?.standardUsers && !wizardData.skippedSteps?.standardUsers;
const hasAnyUsers = hasHeads || hasPersonnel || hasStandardUsers;

const hasAssets = wizardData.uploadedFiles?.assets && !wizardData.skippedSteps?.assets;

const setupStatus = {
  organizationInfo: wizardData.orgData?.name && wizardData.orgData?.email,
  usersUpload: hasAnyUsers,
  assetsUpload: hasAssets
};

const completedSteps = Object.values(setupStatus).filter(Boolean).length;
        
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
        
        // **KEY UPDATE**: Refresh organization data to reflect new CSV counts immediately
        const updatedOrgData = getOrganizationData();
        setOrganizationData(updatedOrgData);
        
        // Add activity log
addActivity(
  'csv_upload', 
  `${type === 'users' ? 'Users' : 'Assets'} CSV uploaded: ${rowCount} records processed`,
  organizationData.contactPerson
);

alert(`${type === 'users' ? 'Users' : 'Assets'} uploaded successfully! Found ${rowCount} records.`);
      }
    };
    reader.readAsText(file);
  };

  // Load dashboard data and update organization info
  useEffect(() => {
    // Refresh organization data on mount
    refreshOrganizationData();
    
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
      usersUpload: userCount > 0,
      assetsUpload: assetCount > 0
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
     
  // Check for actual uploaded data (not skipped)
  const hasHeads = wizardData.uploadedFiles?.heads && !wizardData.skippedSteps?.heads;
  const hasPersonnel = wizardData.uploadedFiles?.personnel && !wizardData.skippedSteps?.personnel;  
  const hasStandardUsers = wizardData.uploadedFiles?.standardUsers && !wizardData.skippedSteps?.standardUsers;
  const hasAnyUsers = hasHeads || hasPersonnel || hasStandardUsers;

  const hasAssets = wizardData.uploadedFiles?.assets && !wizardData.skippedSteps?.assets;

  const setupStatus = {
    organizationInfo: wizardData.orgData?.name && wizardData.orgData?.email,
    usersUpload: hasAnyUsers,
    assetsUpload: hasAssets
  };

  const completedSteps = Object.values(setupStatus).filter(Boolean).length;
  
  setDashboardData(prev => ({
    ...prev,
    totalUsers: userCount,
    totalAssets: assetCount,
    setupProgress: (completedSteps / 3) * 100,
    setupStatus: setupStatus,
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

  

// Save activities whenever they change
useEffect(() => {
  if (recentActivities.length > 0) {
    localStorage.setItem('recentActivities', JSON.stringify(recentActivities));
  }
}, [recentActivities]);
  
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

  // Migration effect to update old activities with timestamps
useEffect(() => {
  const savedActivities = localStorage.getItem('recentActivities');
  if (savedActivities) {
    const activities = JSON.parse(savedActivities);
    const updatedActivities = activities.map(activity => ({
      ...activity,
      timestamp: activity.timestamp || new Date().toISOString() // Add timestamp if missing
    }));
    setRecentActivities(updatedActivities);
  }
}, []);

const handleCompleteSetup = () => {
  const setupWizardData = localStorage.getItem('setupWizardData');
  
  if (!setupWizardData) {
    alert('Setup data not found. Please complete the setup wizard first.');
    return;
  }

  const wizardData = JSON.parse(setupWizardData);
  
  // STRICT VALIDATION: Check if required data exists
  const hasOrganizationInfo = wizardData.orgData?.name && wizardData.orgData?.email;
  
  // Check if at least one user type has been uploaded (not skipped)
  const hasHeads = wizardData.uploadedFiles?.heads && !wizardData.skippedSteps?.heads;
  const hasPersonnel = wizardData.uploadedFiles?.personnel && !wizardData.skippedSteps?.personnel;
  const hasStandardUsers = wizardData.uploadedFiles?.standardUsers && !wizardData.skippedSteps?.standardUsers;
  const hasAnyUsers = hasHeads || hasPersonnel || hasStandardUsers;
  
  // Check if assets have been uploaded (not skipped)
  const hasAssets = wizardData.uploadedFiles?.assets && !wizardData.skippedSteps?.assets;
  
  // VALIDATION: Prevent completion if requirements are not met
  if (!hasOrganizationInfo) {
    alert('Setup cannot be completed: Organization information is missing. Please complete the setup wizard first.');
    return;
  }
  
  if (!hasAnyUsers) {
    alert('Setup cannot be completed: At least one user type (Heads, Personnel, or Standard Users) must be uploaded. Please upload user data before completing setup.');
    return;
  }
  
  if (!hasAssets) {
    alert('Setup cannot be completed: Assets data must be uploaded. Please upload assets data before completing setup.');
    return;
  }
  
  // If all validations pass, proceed with completion
  const parsedData = parseUploadedData(wizardData);
  const userCount = parsedData.userCount;
  const assetCount = parsedData.assetCount;
  
  // Mark setup as completed
  wizardData.completed = true;
  wizardData.completedDate = new Date().toISOString();
  localStorage.setItem('setupWizardData', JSON.stringify(wizardData));
  localStorage.setItem('justCompleted', 'true');
  
  setSetupCompleted(true);
  setShowSetupDetails(false);
  
  // Add activity log for setup completion
  addActivity(
    'setup_completed',
    `${organizationData.name} system setup completed successfully`,
    organizationData.contactPerson
  );
  
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
  
  // Refresh organization data to get updated counts
  refreshOrganizationData();
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

  // Sample activity data with dynamic organization name
// Use dynamic activities or show default message if empty
// Limit to 5 most recent activities
const displayActivities = recentActivities.length > 0 ? recentActivities.slice(0, 5) : [
  {
    id: 1,
    type: 'system_start',
    icon: 'bi-info-circle',
    title: 'System initialized - No recent activities yet',
    user: 'System',
    timestamp: new Date().toISOString(),
    color: 'secondary'
  }
];

  return (
    <SidebarLayout role="sysadmin">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Welcome to {organizationData.name}!</h2>
            <small className="text-muted">
              <i className="bi bi-clock me-1"></i>
              Last updated: {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
            </small>
          </div>
          
          {/* Quick Actions */}
          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary" 
              style={{borderRadius: '12px'}}
              onClick={() => setShowUserUploadModal(true)}
              disabled={uploadingUsers}
            >
              <i className="bi bi-cloud-upload-fill me-2"></i>
              {uploadingUsers ? 'Uploading...' : 'Bulk Upload Users (CSV)'}
            </button>
            <button 
              className="btn btn-dark" 
              style={{borderRadius: '12px'}}
              onClick={() => setShowAssetUploadModal(true)}
              disabled={uploadingAssets}
            >
              <i className="bi bi-cloud-upload-fill me-2"></i>
              {uploadingAssets ? 'Uploading...' : 'Bulk Upload Assets (CSV)'}
            </button>
          </div>
        </div>

        {/* User Upload Modal */}
 {/* User Upload Modal */}
{showUserUploadModal && (
  <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content" style={{borderRadius: '16px'}}>
        <div className="modal-header" style={{borderRadius: '16px 16px 0 0', backgroundColor: '#284C9A', color: 'white'}}>
          <h5 className="modal-title fw-bold">
            <i className="bi bi-people-fill me-2"></i>
            Bulk Upload Users
          </h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => {
              setShowUserUploadModal(false);
              setSelectedUserType('');
              setPreviewData(null);
              setSelectedFile(null);
            }}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label htmlFor="userType" className="form-label fw-semibold">Select User Type:</label>
            <select 
              id="userType"
              className="form-select"
              value={selectedUserType}
              onChange={(e) => setSelectedUserType(e.target.value)}
              disabled={previewData !== null}
            >
              <option value="">Choose user type...</option>
              <option value="heads">Heads</option>
              <option value="personnel">Personnel</option>
              <option value="standardUsers">Standard Users</option>
            </select>
          </div>
          
{selectedUserType && !previewData && (
  <>
    <div className="mb-3">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          downloadTemplate(selectedUserType);
        }}
        className="btn btn-outline-primary btn-sm mb-3"
      >
        <i className="bi bi-download me-2"></i>
        Download Template
      </button>
    </div>
    
    <div className="mb-3">
      <label htmlFor="userCsvFile" className="form-label fw-semibold">Upload CSV File:</label>
      <input 
        type="file" 
        id="userCsvFile"
        className="form-control" 
        accept=".csv"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleFilePreview(e.target.files[0], selectedUserType);
          }
        }}
      />
      <div className="form-text">
        <i className="bi bi-info-circle me-1"></i>
        Please ensure your CSV file has proper headers and data format.
      </div>
    </div>
  </>
)}

          {/* Preview Section */}
          {previewData && (
            <div className="alert alert-info">
              <h6><i className="bi bi-eye me-2"></i>File Preview</h6>
              <p className="mb-1"><strong>File:</strong> {previewData.fileName}</p>
              <p className="mb-1"><strong>User Type:</strong> {previewData.userType === 'heads' ? 'Heads' : previewData.userType === 'personnel' ? 'Personnel' : 'Standard Users'}</p>
              <p className="mb-0"><strong>Records Found:</strong> {previewData.rowCount}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              setShowUserUploadModal(false);
              setSelectedUserType('');
              setPreviewData(null);
              setSelectedFile(null);
            }}
          >
            Cancel
          </button>
          
          {previewData && (
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleBulkUserUpload}
              disabled={uploadingUsers}
            >
              {uploadingUsers ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-2"></i>
                  Submit Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {/* Asset Upload Modal */}
     {/* Asset Upload Modal */}
{showAssetUploadModal && (
  <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
    <div className="modal-dialog modal-dialog-centered">
      <div className="modal-content" style={{borderRadius: '16px'}}>
        <div className="modal-header" style={{borderRadius: '16px 16px 0 0', backgroundColor: '#284C9A', color: 'white'}}>
          <h5 className="modal-title fw-bold">
            <i className="bi bi-box-seam-fill me-2"></i>
            Bulk Upload Assets
          </h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => {
              setShowAssetUploadModal(false);
              setAssetPreviewData(null);
              setSelectedAssetFile(null);
            }}
          ></button>
        </div>
        <div className="modal-body">
         {!assetPreviewData && (
  <>
    <div className="mb-3">
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          downloadTemplate('assets');
        }}
        className="btn btn-outline-primary btn-sm mb-3"
      >
        <i className="bi bi-download me-2"></i>
        Download Template
      </button>
    </div>
    
    <div className="mb-3">
      <label htmlFor="assetCsvFile" className="form-label fw-semibold">Upload Assets CSV File:</label>
      <input 
        type="file" 
        id="assetCsvFile"
        className="form-control" 
        accept=".csv"
        onChange={(e) => {
          if (e.target.files[0]) {
            handleAssetFilePreview(e.target.files[0]);
          }
        }}
      />
      <div className="form-text">
        <i className="bi bi-info-circle me-1"></i>
        Please ensure your CSV file has proper headers and data format for assets.
      </div>
    </div>
  </>
)}

          {/* Preview Section */}
          {assetPreviewData && (
            <div className="alert alert-info">
              <h6><i className="bi bi-eye me-2"></i>File Preview</h6>
              <p className="mb-1"><strong>File:</strong> {assetPreviewData.fileName}</p>
              <p className="mb-0"><strong>Records Found:</strong> {assetPreviewData.rowCount}</p>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={() => {
              setShowAssetUploadModal(false);
              setAssetPreviewData(null);
              setSelectedAssetFile(null);
            }}
          >
            Cancel
          </button>
          
          {assetPreviewData && (
            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleBulkAssetUpload}
              disabled={uploadingAssets}
            >
              {uploadingAssets ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="bi bi-cloud-upload me-2"></i>
                  Submit Upload
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  </div>
)}

        {/* Setup Status Alert */}
        {!setupCompleted && (
          <div className="alert alert-warning mb-4" role="alert" style={{borderRadius: '12px'}}>
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Setup Required</strong>
                  <small>{Math.round(dashboardData.setupProgress)}% Complete</small>
                </div>
                <div className="progress mb-2" style={{height: '6px', borderRadius: '6px'}}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: `${dashboardData.setupProgress}%`, borderRadius: '6px'}}
                  ></div>
                </div>
                <p className="mb-0">Complete the setup wizard to upload users and assets to your system.</p>
                
                {showSetupDetails && dashboardData.wizardData && (
  <div className="mt-3 p-3 bg-light rounded">
    <h6 className="mb-2">Setup Status:</h6>
    
    <div className="mb-2">
      <i className={`bi ${dashboardData.setupStatus.organizationInfo ? 'bi-check-circle text-success' : 'bi-circle text-danger'} me-2`}></i>
      <span>Organization Information {dashboardData.setupStatus.organizationInfo ? '(Complete)' : '(Required)'}</span>
    </div>
    
    <div className="mb-2">
      <i className={`bi ${dashboardData.setupStatus.usersUpload ? 'bi-check-circle text-success' : 'bi-circle text-warning'} me-2`}></i>
      <span>Users Upload {dashboardData.setupStatus.usersUpload ? '(Complete)' : '(Upload at least one user type)'}</span>
    </div>
    
    <div className="mb-3">
      <i className={`bi ${dashboardData.setupStatus.assetsUpload ? 'bi-check-circle text-success' : 'bi-circle text-warning'} me-2`}></i>
      <span>Assets Upload {dashboardData.setupStatus.assetsUpload ? '(Complete)' : '(Upload assets)'}</span>
    </div>
{(() => {
  const canComplete = dashboardData.setupStatus.organizationInfo && 
                     dashboardData.setupStatus.usersUpload && 
                     dashboardData.setupStatus.assetsUpload;
  
  return (
    <div className="mt-3 text-center">
      <button 
        className={`btn btn-sm ${canComplete ? 'btn-success' : 'btn-secondary'}`}
        onClick={canComplete ? handleCompleteSetup : undefined}
        disabled={!canComplete}
        title={!canComplete ? 'Please upload both users and assets data before completing setup' : 'Complete setup'}
      >
        <i className="bi bi-check-circle me-2"></i>
        Complete Setup
        {!canComplete && ' (Requirements Missing)'}
      </button>
      {!canComplete && (
        <div className="mt-2 text-danger small">
          <i className="bi bi-exclamation-triangle me-1"></i>
          Both users and assets data are required to complete setup
        </div>
      )}
    </div>
  );
})()}
  </div>
)}



              </div>
              <button 
                className="btn btn-warning btn-sm ms-3" 
                onClick={() => setShowSetupDetails(!showSetupDetails)}
                style={{borderRadius: '8px'}}
              >
                {showSetupDetails ? 'Hide' : 'Setup'}
              </button>
            </div>
          </div>
        )}

        {/* Congratulatory Message */}
        {setupCompleted && localStorage.getItem('justCompleted') === 'true' && (
          <div className="alert alert-success alert-dismissible fade show mb-4" role="alert" style={{borderRadius: '12px'}}>
            <div className="d-flex align-items-center">
              <i className="bi bi-check-circle-fill me-2 fs-4"></i>
              <div>
                <strong>Congratulations!</strong> Your {organizationData.name} system setup has been completed successfully.
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

        {/* Organization Information Card */}
        <div className="card mb-4 shadow-sm" style={{borderRadius: '16px', border: '1px solid #dee2e6'}}>
          <div className="card-header border-bottom" style={{
            borderRadius: '16px 16px 0 0',
            background: '#284C9A',
            color: 'white'
          }}>
            <h5 className="card-title mb-0 fw-bold">
              <i className="bi bi-building-fill me-2 text-white"></i>
              Organization Information
            </h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Organization Name</label>
                  <p className="mb-0 fw-bold">{organizationData.name}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Address</label>
                  <p className="mb-0">{organizationData.address}</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Organization Type</label>
                  <p className="mb-0">{organizationData.type}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Phone</label>
                  <p className="mb-0">{organizationData.phone}</p>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Country</label>
                  <p className="mb-0">{organizationData.country}</p>
                </div>
                <div className="mb-3">
                  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Official Website</label>
                  <p className="mb-0">
                    <a href={organizationData.website} className="text-decoration-none" target="_blank" rel="noopener noreferrer">
                      {organizationData.website}
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Cards Row */}
        <div className="row mb-4">
          
            {/* Personnel */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
      <div className="card-body text-center position-relative">
        {organizationData.isUsersDataSkipped && (
          <span className="badge bg-warning position-absolute top-0 end-0 mt-2 me-2" style={{fontSize: '0.6rem'}}>
            Not uploaded
          </span>
        )}
        <i className="bi bi-people-fill text-primary fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">
          {organizationData.isUsersDataSkipped ? '0' : organizationData.personnel.toLocaleString()}
        </h5>
        <p className="text-muted mb-0 small">Personnel</p>
      </div>
    </div>
  </div>

         {/* Standard Users */}
  <div className="col-lg-4 col-md-6 mb-3">
   <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
      <div className="card-body text-center position-relative">
        {organizationData.isUsersDataSkipped && (
          <span className="badge bg-warning position-absolute top-0 end-0 mt-2 me-2" style={{fontSize: '0.6rem'}}>
            Not uploaded
          </span>
        )}
        <i className="bi bi-person-fill text-info fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">
          {organizationData.isUsersDataSkipped ? '0' : organizationData.standardUsers.toLocaleString()}
        </h5>
        <p className="text-muted mb-0 small">Standard Users</p>
      </div>
    </div>
  </div>

          {/* Heads */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
      <div className="card-body text-center position-relative">
        {organizationData.isUsersDataSkipped && (
          <span className="badge bg-warning position-absolute top-0 end-0 mt-2 me-2" style={{fontSize: '0.6rem'}}>
            Not uploaded
          </span>
        )}
        <i className="bi bi-person-badge-fill text-warning fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">
          {organizationData.isUsersDataSkipped ? '0' : organizationData.heads}
        </h5>
        <p className="text-muted mb-0 small">Heads</p>
      </div>
    </div>
  </div>
</div>

        {/* Second Row Statistics */}
<div className="row mb-4">
  {/* Total Assets */}
  <div className="col-lg-4 col-md-6 mb-3">
   <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
      <div className="card-body text-center position-relative">
        {organizationData.isAssetsDataSkipped && (
          <span className="badge bg-warning position-absolute top-0 end-0 mt-2 me-2" style={{fontSize: '0.6rem'}}>
            Not uploaded
          </span>
        )}
        <i className="bi bi-box-seam-fill text-success fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">
          {organizationData.isAssetsDataSkipped ? '0' : organizationData.totalAssets.toLocaleString()}
        </h5>
        <p className="text-muted mb-0 small">Total Assets</p>
      </div>
    </div>
  </div>

          {/* System Administrators */}
          <div className="col-lg-4 col-md-6 mb-3">
           <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
              <div className="card-body text-center">
                <i className="bi bi-shield-fill-check text-danger fs-3 mb-2 d-block"></i>
                <h5 className="fw-bold mb-1">{organizationData.systemAdmins}</h5>
                <p className="text-muted mb-0 small">System Administrators</p>
              </div>
            </div>
          </div>

          {/* System Health */}
          <div className="col-lg-4 col-md-6 mb-3">
            <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
              <div className="card-body text-center">
                <i className="bi bi-heart-pulse-fill text-primary fs-3 mb-2 d-block"></i>
                <h5 className="fw-bold mb-1">{organizationData.systemHealthPercentage}%</h5>
                <p className="text-muted mb-0 small">System Health</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card mb-4 shadow-sm" style={{
  borderRadius: '16px',
  border: '1px solid #dee2e6',
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out'
  
}}


onMouseEnter={(e) => {
  e.currentTarget.style.transform = 'translateY(-2px)';
  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
}}
onMouseLeave={(e) => {
  e.currentTarget.style.transform = 'translateY(0)';
  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
}}>
  
  
         <div className="card-header bg-white border-bottom d-flex justify-content-between align-items-center" style={{borderRadius: '16px 16px 0 0'}}>
  <h5 className="card-title mb-0 fw-bold">
    <i className="bi bi-activity me-2 text-success"></i>
    Recent Activity
  </h5>
 
  {recentActivities.length > 5 && (
    <button 
      className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
      onClick={() => navigate('/dashboard-sysadmin/SysadAuditLogs')}
    >
      View All Activities
    </button>
  )}

</div>

          <div className="card-body">
           {displayActivities.map((activity) => (
              <div key={activity.id} className="d-flex align-items-center py-3 border-bottom last:border-bottom-0">
                <div className="flex-grow-1">
                  <p className="mb-1 fw-semibold">{activity.title}</p>
                  <small className="text-muted">by {activity.user}</small>
                </div>
                <small className="text-muted">{getRelativeTime(activity.timestamp)}</small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}