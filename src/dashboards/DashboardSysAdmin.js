import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import Papa from 'papaparse'
import { PasswordUtils } from '../utils/PasswordUtils';
import { EmailService } from '../utils/EmailService';
import EmailProgressModal from '../components/EmailProgressModal';



export default function DashboardSyAdmin() {

  
  const navigate = useNavigate();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  
  // NEW: States for bulk upload modals
  const [showAssetUploadModal, setShowAssetUploadModal] = useState(false);
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

// Add this function to handle closing the email progress modal
const handleEmailProgressClose = () => {
  setEmailProgress(prev => ({ ...prev, isVisible: false }));
  
  // Show final summary if there were any failures
  const { successCount, failedCount } = emailProgress;
  if (failedCount > 0) {
    alert(`Email Summary:\nÃ¢Å“â€¦ ${successCount} emails sent successfully\nÃ¢ÂÅ’ ${failedCount} emails failed\n\nYou may need to manually send credentials to failed recipients.`);
  }
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

const safeNumber = (value) => {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Number(value);
};


const getRoleIdFromRole = (roleString) => {
  if (!roleString || typeof roleString !== 'string') {
    return 4; // Default to Standard user
  }
  
  // Normalize the input: trim whitespace and convert to lowercase
  const normalizedRole = roleString.trim().toLowerCase();
  
  const roleMap = {
    'admin official': 2,
    'system admin': 1,
    'sysadmin': 1,
    'sys admin': 1,
    'personnel': 3,
    'standard user': 4,
    'standard': 4,
    'user': 4
  };
  
  return roleMap[normalizedRole] || 4; // Default to Standard user
};

// Template download function
const downloadTemplate = (type) => {
  const templates = {
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

// REPLACEMENT: fetch organization data directly from Supabase
const getOrganizationData = async () => {
  try {
    // Replace localStorage check with Supabase auth
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) {
      return getDefaultOrgData();
    }

    // Get organization based on user email
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select('*')
      .eq('contact_email', userEmail)
      .single();

    if (orgError || !orgData) {
      console.log('Organization not found, using default');
      return getDefaultOrgData();
    }

    return {
      name: orgData.org_name,
      type: orgData.org_type || "Government Agency",
      address: orgData.address || "Not specified",
      phone: orgData.phone || "Not specified",
      country: orgData.country || "Not specified",
      website: orgData.website || "https://openfms.io",
      contactPerson: orgData.contact_person || "System Administrator",
      contactEmail: orgData.contact_email || userEmail
    };
  } catch (error) {
console.error('Error loading organization data:', error);
    return getDefaultOrgData();
  }
};


const getDefaultOrgData = () => ({
  name: "OpenFMS",
  type: "Government Agency",
  address: "Not specified",
  phone: "Not specified",
  country: "Not specified", 
  website: "https://openfms.io",
  contactPerson: "System Administrator",
  contactEmail: "admin@openfms.io"
});

  // Make organizationData dynamic state
const [organizationData, setOrganizationData] = useState({
  name: "OpenFMS",
  type: "Government Agency", 
  address: "Loading...",
  phone: "Loading...",
  country: "Loading...",
  website: "https://openfms.io",
  contactPerson: "System Administrator",
  contactEmail: "admin@openfms.io",
  personnel: 0,
  standardUsers: 0,
  heads: 0,
  systemAdmins: 1,
  totalAssets: 0,
  systemHealthPercentage: 25,
  isUsersDataSkipped: false,
  isAssetsDataSkipped: false
});  
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
  const [emailProgress, setEmailProgress] = useState({
  isVisible: false,
  progress: 0,
  total: 0,
  currentEmail: '',
  successCount: 0,
  failedCount: 0
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

  const calculateSystemHealth = (totalUsers, totalAssets) => {
    if (totalUsers === 0 && totalAssets === 0) return 25;
    if (totalUsers > 0 && totalAssets > 0) return 95;
    if (totalUsers > 0 || totalAssets > 0) return 75;
    return 50;
  };

// Replace your fetchDatabaseStats function in DashboardSysAdmin.js

// REPLACEMENT: Fetch stats directly from Supabase based on user auth
const fetchDatabaseStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) {
      console.log('No authenticated user found');
      return { personnel:0, standardUsers:0, heads:0, systemAdmins:1, totalAssets:0, systemHealthPercentage:25 };
    }

    // Get the organization ID from Supabase users table
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('email', userEmail)
      .single();

    const organizationId = userData?.organization_id;
    if (!organizationId) return { personnel:0, standardUsers:0, heads:0, systemAdmins:1, totalAssets:0, systemHealthPercentage:25 };

    // Fetch counts
    const [personnelResult, standardUsersResult, headsResult, systemAdminsResult, assetsResult] = await Promise.all([
      supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 3).in('user_status', ['active','pending_activation']),
      supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 4).in('user_status', ['active','pending_activation']),
      supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 2).in('user_status', ['active','pending_activation']),
      supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 1).in('user_status', ['active','pending_activation']),
      supabase.from('assets').select('*', { count: 'exact' }).eq('organization_id', organizationId).neq('asset_status', 'inactive_test')
    ]);

    const personnel = personnelResult.count || 0;
    const standardUsers = standardUsersResult.count || 0;
    const heads = (headsResult.count || 0) + (systemAdminsResult.count || 0); // include system admins
    const systemAdmins = systemAdminsResult.count || 0;
    const totalAssets = assetsResult.count || 0;

    const systemHealthPercentage = calculateSystemHealth(personnel + standardUsers + heads, totalAssets);

    return { personnel, standardUsers, heads, systemAdmins, totalAssets, systemHealthPercentage };

  } catch (error) {
    console.error('Error fetching stats:', error);
    return { personnel:0, standardUsers:0, heads:0, systemAdmins:1, totalAssets:0, systemHealthPercentage:25 };
  }
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



const updateSetupProgress = () => {
  try {
    const setupWizardData = localStorage.getItem('setupWizardData');
    if (!setupWizardData) return;
    
    const wizardData = JSON.parse(setupWizardData);
    
    // Check organization info
    const hasOrganizationInfo = wizardData.orgData?.name && wizardData.orgData?.contactEmail;
    
    // Check if at least one user type has been uploaded (not skipped)
    const hasHeads = wizardData.uploadedFiles?.heads && !wizardData.skippedSteps?.heads;
    const hasPersonnel = wizardData.uploadedFiles?.personnel && !wizardData.skippedSteps?.personnel;
    const hasStandardUsers = wizardData.uploadedFiles?.standardUsers && !wizardData.skippedSteps?.standardUsers;
    const hasAnyUsers = hasHeads || hasPersonnel || hasStandardUsers;
    
    // Check if assets have been uploaded (not skipped)
    const hasAssets = wizardData.uploadedFiles?.assets && !wizardData.skippedSteps?.assets;
    
    const setupStatus = {
      organizationInfo: hasOrganizationInfo,
      usersUpload: hasAnyUsers,
      assetsUpload: hasAssets
    };
    
    const completedSteps = Object.values(setupStatus).filter(Boolean).length;
    const newProgress = (completedSteps / 3) * 100;
    
    // Update dashboard data state
    setDashboardData(prev => ({
      ...prev,
      setupStatus: setupStatus,
      setupProgress: newProgress,
      systemHealth: newProgress > 66 ? 'Good' : newProgress > 33 ? 'Warning' : 'Critical'
    }));
    
    // Check if setup is now complete
    if (completedSteps === 3) {
      setSetupCompleted(true);
    }
    
    console.log('Setup progress updated:', {
      setupStatus,
      progress: newProgress,
      completed: completedSteps === 3
    });
    
  } catch (error) {
    console.error('Error updating setup progress:', error);
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

// handleBulkAssetUpload function with this version
const handleBulkAssetUpload = async () => {
  if (!assetPreviewData || !selectedAssetFile) {
    alert('No file selected for upload!');
    return;
  }

  setUploadingAssets(true);
  
  try {
    // Get current user's organization ID
// Get current user directly from Supabase Auth
const { data: { user }, error: authError } = await supabase.auth.getUser();
if (!user || authError) {
  throw new Error('User not authenticated - please log in again.');
}

const userEmail = user.email;

// Get organization_id from database
const { data: userData, error: userDataError } = await supabase
  .from('users')
  .select('organization_id')
  .eq('email', userEmail)
  .single();



if (userDataError || !userData) {
  throw new Error('User data not found in database');
}


    const orgId = userData.organization_id;

    // Parse CSV content
    const { csvContent } = assetPreviewData;
    const parseResult = Papa.parse(csvContent, { 
      header: true, 
      skipEmptyLines: true,
      transformHeader: (header) => header.trim()
    });

    if (parseResult.errors.length > 0) {
      console.error('CSV Parse Errors:', parseResult.errors);
    }

    const csvRows = parseResult.data.filter(row => 
      row['Asset Name'] && row['Asset Name'].trim() !== '' && 
      row.Category && row.Category.trim() !== ''
    );

    if (csvRows.length === 0) {
      throw new Error('No valid asset data found in CSV');
    }

    // Get unique categories from CSV
    const uniqueCategories = [...new Set(csvRows.map(row => row.Category.trim()))];
    console.log('Categories to process:', uniqueCategories);

    // Create/get asset categories first
    const categoryMap = {};
    
    for (const categoryName of uniqueCategories) {
      try {
        // Try to get existing category first
        const { data: existingCategory } = await supabase
          .from('asset_categories')
          .select('category_id, category_name')
          .eq('category_name', categoryName)
          .single();

        if (existingCategory) {
          categoryMap[categoryName] = existingCategory.category_id;
        } else {
          // Create new category
          const { data: newCategory, error: categoryError } = await supabase
            .from('asset_categories')
            .insert([{ category_name: categoryName }])
            .select('category_id, category_name')
            .single();

          if (categoryError) {
            console.error(`Failed to create category ${categoryName}:`, categoryError);
            throw new Error(`Failed to create category: ${categoryName}`);
          }

          categoryMap[categoryName] = newCategory.category_id;
        }
      } catch (categoryError) {
        console.error(`Error processing category ${categoryName}:`, categoryError);
        throw new Error(`Error processing category: ${categoryName}`);
      }
    }

    console.log('Category mapping:', categoryMap);

    // Prepare assets for insertion
    const assetsToInsert = csvRows.map((row, index) => ({
      asset_code: `${row['Asset Name'].trim().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
      asset_category_id: categoryMap[row.Category.trim()],
      asset_status: (row.Status || 'operational').toLowerCase(),
      location: row.Location ? row.Location.trim() : 'Not specified',
      organization_id: orgId
    }));

    console.log('Assets to insert:', assetsToInsert);

    // Insert assets one by one to handle individual failures
    const insertedAssets = [];
    const failedAssets = [];

    for (const assetData of assetsToInsert) {
      try {
        const { data, error } = await supabase
          .from('assets')
          .insert([assetData])
          .select()
          .single();

        if (error) {
          console.error(`Failed to insert asset ${assetData.asset_code}:`, error);
          failedAssets.push({ asset_code: assetData.asset_code, error: error.message });
        } else {
          insertedAssets.push(data);
        }
      } catch (insertError) {
        console.error(`Error inserting asset ${assetData.asset_code}:`, insertError);
        failedAssets.push({ asset_code: assetData.asset_code, error: insertError.message });
      }
    }

    const insertedCount = insertedAssets.length;
    const failedCount = failedAssets.length;

    // Update localStorage for activity tracking
    let setupWizardData = localStorage.getItem('setupWizardData');
    let wizardData = setupWizardData ? JSON.parse(setupWizardData) : {
      orgData: { name: organizationData.name, email: organizationData.contactEmail },
      uploadedFiles: {},
      skippedSteps: {},
      completed: false
    };

    if (!wizardData.uploadedFiles) wizardData.uploadedFiles = {};
    
    const uploadRecord = {
      fileName: selectedAssetFile.name,
      uploadDate: new Date().toISOString(),
      recordsProcessed: insertedCount,
      recordsFailed: failedCount,
      source: 'database'
    };

    wizardData.uploadedFiles.assets = uploadRecord;
    
    // Mark assets as no longer skipped
    if (!wizardData.skippedSteps) wizardData.skippedSteps = {};
    wizardData.skippedSteps.assets = false;

    localStorage.setItem('setupWizardData', JSON.stringify(wizardData));

    // Refresh dashboard data from database
console.log('Refreshing asset counts...');
const dbStats = await fetchDatabaseStats();
setOrganizationData(prev => ({
  ...prev,
  ...dbStats
}));

// Also update dashboard data state for consistency
setDashboardData(prev => ({
  ...prev,
  totalUsers: dbStats.personnel + dbStats.standardUsers + dbStats.heads,
  totalAssets: dbStats.totalAssets
}));

console.log('Asset counts updated:', dbStats);
    // Add activity log
    addActivity(
      'csv_upload',
      `Assets CSV uploaded: ${insertedCount} inserted, ${failedCount} failed`,
      organizationData.contactPerson
    );

    // Update setup progress
    updateSetupProgress();

    // Close modal and reset
    setShowAssetUploadModal(false);
    setAssetPreviewData(null);
    setSelectedAssetFile(null);
    
    // Show detailed results
    let resultMessage = `Asset upload completed!\n\n`;
    resultMessage += `Ã¢Å“â€¦ Successfully inserted: ${insertedCount} assets\n`;
    if (failedCount > 0) resultMessage += `Ã¢ÂÅ’ Failed: ${failedCount} assets\n`;
    
    alert(resultMessage);
    
  } catch (error) {
    console.error('Error processing asset CSV:', error);
    alert(`Error: ${error.message}`);
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

useEffect(() => {
  const loadDashboardData = async () => {
    try {
      // Check if just completed setup or needs forced refresh
      const justCompleted = localStorage.getItem('setupJustCompleted');
      const forceRefresh = localStorage.getItem('forceRefreshDashboard');
      
      if (justCompleted === 'true' || forceRefresh === 'true') {
        // Small delay to ensure all database operations are complete
        await new Promise(resolve => setTimeout(resolve, 1000));
        localStorage.removeItem('setupJustCompleted');
        localStorage.removeItem('forceRefreshDashboard');
      }

      // Get organization info
      const baseOrgData = await getOrganizationData();
      
      // Get all statistics from database
      const dbStats = await fetchDatabaseStats();
      
      // Merge organization info with database statistics
      const mergedOrgData = {
        ...baseOrgData,
        ...dbStats
      };
      
      setOrganizationData(mergedOrgData);
      
      // Update dashboard data
      const totalUsers = dbStats.personnel + dbStats.standardUsers + dbStats.heads;
      setDashboardData(prev => ({
        ...prev,
        totalUsers: totalUsers,
        totalAssets: dbStats.totalAssets,
        systemHealth: dbStats.systemHealthPercentage > 80 ? 'Good' : 
                     dbStats.systemHealthPercentage > 50 ? 'Warning' : 'Critical'
      }));

      console.log('Dashboard loaded with stats:', dbStats);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Fallback to default values
      setOrganizationData(prev => ({
        ...prev,
        personnel: 0,
        standardUsers: 0,
        heads: 1,
        systemAdmins: 1,
        totalAssets: 0,
        systemHealthPercentage: 25
      }));
    }
    
    updateSetupProgress();
  };

  loadDashboardData();
}, []); // Remove dependency array issues

  
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

{/* Email Progress Modal */}
<EmailProgressModal
  isVisible={emailProgress.isVisible}
  progress={emailProgress.progress}
  total={emailProgress.total}
  currentEmail={emailProgress.currentEmail}
  successCount={emailProgress.successCount}
  failedCount={emailProgress.failedCount}
  onClose={handleEmailProgressClose}
/>

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
          {organizationData.isUsersDataSkipped ? '0' : safeNumber(organizationData.personnel).toLocaleString()}
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
          {organizationData.isUsersDataSkipped ? '0' : safeNumber(organizationData.standardUsers).toLocaleString()}
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
          {organizationData.isUsersDataSkipped ? '0' : safeNumber(organizationData.heads).toLocaleString()}
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
          {organizationData.isAssetsDataSkipped ? '0' : safeNumber(organizationData.totalAssets).toLocaleString()}
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
        <h5 className="fw-bold mb-1">{safeNumber(organizationData.systemAdmins).toLocaleString()}</h5>
        <p className="text-muted mb-0 small">System Administrators</p>
      </div>
    </div>
  </div>

  {/* System Health */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6'}}>
      <div className="card-body text-center">
        <i className="bi bi-heart-pulse-fill text-primary fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">{safeNumber(organizationData.systemHealthPercentage)}%</h5>
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
  );
}