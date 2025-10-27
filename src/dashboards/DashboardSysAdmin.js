import { useState, useEffect } from 'react';
import { useSysAdminDashboard } from '../contexts/SysAdminDashboardContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient'; 
import Papa from 'papaparse'
import { PasswordUtils } from '../utils/PasswordUtils';
import { EmailService } from '../utils/EmailService';
import EmailProgressModal from '../components/EmailProgressModal';
import { Building2, CalendarDays } from 'lucide-react';


export default function DashboardSyAdmin() {

  const [sysAdminName, setSysAdminName] = useState('System Administrator');
  const { dashboardData, loading: contextLoading, refreshData } = useSysAdminDashboard();
  const navigate = useNavigate();
  const [setupCompleted, setSetupCompleted] = useState(false);
  const [showSetupDetails, setShowSetupDetails] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [assetsList, setAssetsList] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [editingOrgInfo, setEditingOrgInfo] = useState(false);
  const [editedOrgData, setEditedOrgData] = useState({});
  const [organizationTypes, setOrganizationTypes] = useState([]);
  const [countries, setCountries] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
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
    alert(`Email Summary:\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ ${successCount} emails sent successfully\nÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ÂÃƒÆ’Ã¢â‚¬Â¦ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ ${failedCount} emails failed\n\nYou may need to manually send credentials to failed recipients.`);
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

 
//fetch organization data directly from Supabase
const getOrganizationData = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) {
      return getDefaultOrgData();
    }

    // Get organization with JOINs to get type_name and country_name
    const { data: orgData, error: orgError } = await supabase
      .from('organizations')
      .select(`
        *,
        countries (country_name),
        organization_types (type_name)
      `)
      .eq('contact_email', userEmail)
      .single();

    if (orgError || !orgData) {
      console.log('Organization not found, using default');
      return getDefaultOrgData();
    }

    return {
      name: orgData.org_name,
      type: orgData.organization_types?.type_name || "Government Agency",
      typeId: orgData.org_type_id, // ADD THIS - store the ID too
      address: orgData.address || "Not specified",
      phone: orgData.phone || "Not specified",
      country: orgData.countries?.country_name || "Not specified",
      countryId: orgData.country_id, // ADD THIS - store the ID too
      website: orgData.website || "https://openfms.io",
      contactPerson: orgData.contact_person || "System Administrator",
      contactEmail: orgData.contact_email || userEmail,
      setupCompleted: orgData.setup_completed || false,  
      setupCompletedAt: orgData.setup_completed_at || null

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
  adminOfficials: 0,
  systemAdmins: 1,
  totalAssets: 0,
  systemHealthPercentage: 25,
  isUsersDataSkipped: false,
  isAssetsDataSkipped: false
});
  const [localDashboardData, setLocalDashboardData] = useState({
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

  const [personnelResult, standardUsersResult, adminOfficialsResult, systemAdminsResult, assetsResult] = await Promise.all([
  supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 3).in('user_status', ['active','pending_activation']),
  supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 4).in('user_status', ['active','pending_activation']),
  supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 2).in('user_status', ['active','pending_activation']),
  supabase.from('users').select('*', { count: 'exact' }).eq('organization_id', organizationId).eq('role_id', 1).in('user_status', ['active','pending_activation']),
  supabase.from('assets').select('*', { count: 'exact' }).eq('organization_id', organizationId).neq('asset_status', 'inactive_test')
]);

const personnel = personnelResult.count || 0;
const standardUsers = standardUsersResult.count || 0;
const adminOfficials = adminOfficialsResult.count || 0;
const systemAdmins = systemAdminsResult.count || 0;
const totalAssets = assetsResult.count || 0;

   const systemHealthPercentage = calculateSystemHealth(personnel + standardUsers + adminOfficials, totalAssets);

   return { personnel, standardUsers, adminOfficials, systemAdmins, totalAssets, systemHealthPercentage };

  } catch (error) {
    console.error('Error fetching stats:', error);
    return { personnel:0, standardUsers:0, heads:0, systemAdmins:1, totalAssets:0, systemHealthPercentage:25 };
  }
};

const fetchRecentAuditLogs = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;

    if (!userEmail) return [];

    // Get the organization ID
    const { data: userData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('email', userEmail)
      .single();

    const organizationId = userData?.organization_id;
    if (!organizationId) return [];

    // Fetch last 5 audit logs from the same organization
    const { data: auditLogs, error } = await supabase
      .from('audit_logs')
      .select(`
        audit_id,
        action_taken,
        timestamp,
        users!inner (
          full_name,
          email,
          organization_id
        )
      `)
      .eq('users.organization_id', organizationId)
      .order('timestamp', { ascending: false })
      .limit(5);

    if (error) throw error;

    // Transform to match the recentActivities format
    return auditLogs.map(log => ({
      id: log.audit_id,
      type: 'audit_log',
      icon: 'bi-clock-history',
      title: log.action_taken,
      user: log.users.full_name || log.users.email,
      timestamp: new Date(log.timestamp + 'Z').toISOString(), 
      color: 'info'
    }));

  } catch (error) {
    console.error('Error fetching recent audit logs:', error);
    return [];
  }
};
const fetchOrganizationTypes = async () => {
  try {
    const { data, error } = await supabase
      .from('organization_types')
      .select('org_type_id, type_name')
      .eq('is_active', true)
      .order('type_name');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching organization types:', error);
    return [];
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
    return data || [];
  } catch (error) {
    console.error('Error fetching countries:', error);
    return [];
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



const updateSetupProgress = async () => {
  try {
    // Get actual database counts
    const dbStats = await fetchDatabaseStats();
    
    // Check organization info from Supabase (not localStorage)
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;
    
    let hasOrganizationInfo = false;
    if (userEmail) {
      const { data: orgData } = await supabase
        .from('organizations')
        .select('org_name, contact_email')
        .eq('contact_email', userEmail)
        .single();
      
      hasOrganizationInfo = orgData?.org_name && orgData?.contact_email;
    }
    
    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Check if users exist (based on DATABASE, not localStorage)
    const hasUsers = (dbStats.personnel + dbStats.standardUsers + dbStats.adminOfficials) > 0;
    
    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ Check if assets exist (based on DATABASE, not localStorage)
    const hasAssets = dbStats.totalAssets > 0;
    
    const setupStatus = {
      organizationInfo: hasOrganizationInfo,
      usersUpload: hasUsers,
      assetsUpload: hasAssets
    };
    
    const completedSteps = Object.values(setupStatus).filter(Boolean).length;
    const newProgress = (completedSteps / 3) * 100;
    
    // Update dashboard data state
    setLocalDashboardData(prev => ({
      ...prev,
      setupStatus: setupStatus,
      setupProgress: newProgress,
      systemHealth: newProgress > 66 ? 'Good' : newProgress > 33 ? 'Warning' : 'Critical'
    }));
    
    // ÃƒÂ¢Ã…â€œÃ¢â‚¬Â¦ CRITICAL FIX: Automatically set setupCompleted to true when all requirements are met
    // Check if setup should be marked complete
    if (completedSteps === 3) {
      // Update database to mark setup as completed
      await markSetupAsCompleted();
      setSetupCompleted(true);
      localStorage.removeItem('setupWizardData');
    } else {
      setSetupCompleted(false);
    }
    
    console.log('Setup progress updated:', {
      setupStatus,
      progress: newProgress,
      dbStats,
      completed: completedSteps === 3
    });
    
  } catch (error) {
    console.error('Error updating setup progress:', error);
  }
};


const markSetupAsCompleted = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;
    
    if (!userEmail) return;

    // Get organization ID
    const { data: orgData } = await supabase
      .from('organizations')
      .select('organization_id, setup_completed')
      .eq('contact_email', userEmail)
      .single();

    if (!orgData) return;

    // Only update if not already completed (prevents repeated updates)
    if (!orgData.setup_completed) {
      const { error } = await supabase
        .from('organizations')
        .update({
          setup_completed: true,
          setup_completed_at: new Date().toISOString()
        })
        .eq('organization_id', orgData.organization_id);

      if (error) {
        console.error('Error marking setup as completed:', error);
      } else {
        console.log('Setup marked as completed in database');
        // Add audit log
        addActivity('setup_completed', 
          `${organizationData.name} system setup completed successfully`,
          organizationData.contactPerson
        );
      }
    }
  } catch (error) {
    console.error('Error in markSetupAsCompleted:', error);
  }
};

const handleSaveOrgInfo = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userEmail = user?.email;
    
    if (!userEmail) {
      alert('User not authenticated');
      return;
    }

    // Get organization ID
    const { data: orgData, error: fetchError } = await supabase
      .from('organizations')
      .select('organization_id')
      .eq('contact_email', userEmail)
      .single();

    if (fetchError || !orgData) {
      console.error('Fetch error:', fetchError);
      alert('Organization not found for this user');
      return;
    }

    // Build update payload
    const updatePayload = {
      org_name: editedOrgData.name,
      address: editedOrgData.address,
      phone: editedOrgData.phone,
      website: editedOrgData.website
    };

    // Handle org_type_id - if type changed, look up the ID
    if (editedOrgData.type && editedOrgData.type !== organizationData.type) {
      const { data: typeData } = await supabase
        .from('organization_types')
        .select('org_type_id')
        .eq('type_name', editedOrgData.type)
        .single();
      
      if (typeData) {
        updatePayload.org_type_id = typeData.org_type_id;
      }
    } else if (organizationData.typeId) {
      // Keep existing type ID if not changed
      updatePayload.org_type_id = organizationData.typeId;
    }

    // Handle country_id - if country changed, look up the ID
    if (editedOrgData.country && editedOrgData.country !== organizationData.country) {
      const { data: countryData } = await supabase
        .from('countries')
        .select('country_id')
        .eq('country_name', editedOrgData.country)
        .single();
      
      if (countryData) {
        updatePayload.country_id = countryData.country_id;
      }
    } else if (organizationData.countryId) {
      // Keep existing country ID if not changed
      updatePayload.country_id = organizationData.countryId;
    }

    console.log('About to update with:', updatePayload);

    const { error } = await supabase
      .from('organizations')
      .update(updatePayload)
      .eq('organization_id', orgData.organization_id);

    if (error) {
      console.error('Update error:', error);
      alert('Database error: ' + error.message);
      return;
    }

    console.log('Update successful');
    const updatedData = await getOrganizationData();
    setOrganizationData(updatedData);
    setEditingOrgInfo(false);
    
    addActivity('maintenance', 'Organization information updated', organizationData.contactPerson);
    alert('Organization information updated successfully!');
    
  } catch (error) {
    console.error('Error updating organization:', error);
    alert('Failed to update organization info: ' + error.message);
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
        
       setLocalDashboardData(prev => ({
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
  if (dashboardData && !contextLoading) {
    setSysAdminName(dashboardData.sysAdminName);
    setOrganizationData(dashboardData.organizationData);
    setRecentActivities(dashboardData.recentActivities);
    setOrganizationTypes(dashboardData.organizationTypes);
    setCountries(dashboardData.countries);
    setIsDataLoaded(true);
    // Load setup completion status from database
    if (dashboardData.organizationData?.setupCompleted) {
      setSetupCompleted(true);
    }
    
    // Update setup progress
    updateSetupProgress();
  }
}, [dashboardData, contextLoading]);
  // Auto-dismiss completion message
  useEffect(() => {
    if (setupCompleted && localStorage.getItem('justCompleted') === 'true') {
      const timer = setTimeout(() => {
        localStorage.removeItem('justCompleted');
        setLocalDashboardData(prev => ({...prev}));
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
  
  setLocalDashboardData({
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
    title: 'No recent audit logs yet', 
    user: 'System',
    timestamp: new Date().toISOString(),
    color: 'secondary'
  }
];

 return (
  <>
    <style>{`
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      .spin {
        animation: spin 1s linear infinite;
      }
    `}</style>
    
    <div className="container-fluid">
        {/* Header */}
<div style={{
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #0d6efd',
  borderRadius: '12px',
  padding: '16px 24px',
  marginBottom: '30px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Building2 size={28} style={{ color: '#0d6efd' }} />
    <h1 style={{ margin: 0, fontWeight: '700', fontSize: '28px', color: '#1a1a1a' }}>
      Welcome back, {sysAdminName}!
    </h1>
  </div>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {/* ADD THIS REFRESH BUTTON */}
<button 
  onClick={async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      // Optional: show success message
      alert('✅ Dashboard updated successfully!');
    } catch (error) {
      console.error('Refresh error:', error);
      alert('❌ Failed to refresh. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }}
  className="btn btn-sm"
  disabled={isRefreshing}
  style={{
    backgroundColor: isRefreshing ? '#6c757d' : '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 12px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontWeight: '500',
    cursor: isRefreshing ? 'not-allowed' : 'pointer',
    opacity: isRefreshing ? 0.7 : 1
  }}
  title="Refresh dashboard data"
>
  <i className={`bi ${isRefreshing ? 'bi-arrow-clockwise spin' : 'bi-arrow-clockwise'}`}></i>
  {isRefreshing ? 'Refreshing...' : 'Refresh'}
</button>
    
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <CalendarDays size={18} style={{ color: '#6c757d' }} />
      <span style={{ color: '#6c757d', fontSize: '14px' }}>
        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
      </span>
    </div>
  </div>
</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', paddingLeft: '36px' }}>
    <span style={{ 
      backgroundColor: '#0d6efd15', 
      color: '#0d6efd', 
      padding: '4px 12px', 
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '600'
    }}>
      System Administrator
    </span>
    <span style={{ color: '#6c757d', fontSize: '14px' }}>|</span>
    <span style={{ color: '#495057', fontSize: '14px', fontWeight: '500' }}>{organizationData.name}</span>
  </div>
</div>



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
       {!setupCompleted && !organizationData.setupCompleted && (
          <div className="alert alert-warning mb-4" role="alert" style={{borderRadius: '12px'}}>
            <div className="d-flex align-items-center">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              <div className="flex-grow-1">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <strong>Setup Required</strong>
                  <small>{Math.round(localDashboardData.setupProgress)}% Complete</small>
                </div>
                <div className="progress mb-2" style={{height: '6px', borderRadius: '6px'}}>
                  <div 
                    className="progress-bar bg-warning" 
                    style={{width: `${localDashboardData.setupProgress}%`, borderRadius: '6px'}}
                  ></div>
                </div>
                <p className="mb-0">Complete the setup wizard to upload users and assets to your system.</p>
                
                {showSetupDetails && localDashboardData.wizardData &&(
  <div className="mt-3 p-3 bg-light rounded">
    <h6 className="mb-2">Setup Status:</h6>
    
    <div className="mb-2">
      <i className={`bi ${localDashboardData.setupStatus.organizationInfo ? 'bi-check-circle text-success' : 'bi-circle text-danger'} me-2`}></i>
      <span>Organization Information {localDashboardData.setupStatus.organizationInfo? '(Complete)' : '(Required)'}</span>
    </div>
    
    <div className="mb-2">
      <i className={`bi ${localDashboardData.setupStatus.usersUpload ? 'bi-check-circle text-success' : 'bi-circle text-warning'} me-2`}></i>
      <span>Users Upload {localDashboardData.setupStatus.usersUpload ? '(Complete)' : '(Upload at least one user type)'}</span>
    </div>
    
    <div className="mb-3">
      <i className={`bi ${dashboardData.setupStatus.assetsUpload ? 'bi-check-circle text-success' : 'bi-circle text-warning'} me-2`}></i>
      <span>Assets Upload {dashboardData.setupStatus.assetsUpload ? '(Complete)' : '(Upload assets)'}</span>
    </div>
{(() => {
  const canComplete = localDashboardData.setupStatus.organizationInfo && 
                    localDashboardData.setupStatus.usersUpload && 
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
       {setupCompleted && !organizationData.setupCompleted && (
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
         <div className="card-header border-bottom d-flex justify-content-between align-items-center" style={{
  borderRadius: '16px 16px 0 0',
  background: '#284C9A',
  color: 'white'
}}>
  <h5 className="card-title mb-0 fw-bold">
    <i className="bi bi-building-fill me-2 text-white"></i>
    Organization Information
  </h5>
  {!editingOrgInfo ? (
    <button 
      className="btn btn-light btn-sm"
      onClick={() => {
        setEditedOrgData({
          name: organizationData.name,
          type: organizationData.type,
          address: organizationData.address,
          phone: organizationData.phone,
          country: organizationData.country,
          website: organizationData.website
        });
        setEditingOrgInfo(true);
      }}
    >
      <i className="bi bi-pencil me-1"></i>
      Edit
    </button>
  ) : (
    <div>
      <button 
        className="btn btn-success btn-sm me-2"
        onClick={handleSaveOrgInfo}
      >
        <i className="bi bi-check me-1"></i>
        Save
      </button>
      <button 
        className="btn btn-secondary btn-sm"
        onClick={() => setEditingOrgInfo(false)}
      >
        Cancel
      </button>
    </div>
  )}
</div>
        <div className="card-body">
  <div className="row">
    <div className="col-md-4">
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Organization Name</label>
        {editingOrgInfo ? (
          <input 
            type="text" 
            className="form-control"
            value={editedOrgData.name}
            onChange={(e) => setEditedOrgData({...editedOrgData, name: e.target.value})}
          />
        ) : (
          <p className="mb-0 fw-bold">{organizationData.name}</p>
        )}
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Address</label>
        {editingOrgInfo ? (
          <textarea 
            className="form-control"
            rows="2"
            value={editedOrgData.address}
            onChange={(e) => setEditedOrgData({...editedOrgData, address: e.target.value})}
          />
        ) : (
          <p className="mb-0">
      {isDataLoaded ? organizationData.address : <small className="text-muted">Loading...</small>}
    </p>
        )}
      </div>
    </div>
    <div className="col-md-4">
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Organization Type</label>
       {editingOrgInfo ? (
  <select 
    className="form-control"
    value={editedOrgData.type || ''}
    onChange={(e) => setEditedOrgData({...editedOrgData, type: e.target.value})}
  >
    <option value="">Select Organization Type</option>
    {organizationTypes.map(type => (
      <option key={type.org_type_id} value={type.type_name}>
        {type.type_name}
      </option>
    ))}
  </select>
) : (
  <p className="mb-0">
  {isDataLoaded ? organizationData.type : <small className="text-muted">Loading...</small>}
</p>
)}
      </div>
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Phone</label>
        {editingOrgInfo ? (
          <input 
            type="text" 
            className="form-control"
            value={editedOrgData.phone}
            onChange={(e) => setEditedOrgData({...editedOrgData, phone: e.target.value})}
          />
        ) : (
         <p className="mb-0">
  {isDataLoaded ? organizationData.phone : <small className="text-muted">Loading...</small>}
</p>
        )}
      </div>
    </div>
    <div className="col-md-4">
<div className="mb-3">
  <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Country</label>
  {editingOrgInfo ? (
    <select 
      className="form-control"
      value={editedOrgData.country || ''}
      onChange={(e) => setEditedOrgData({...editedOrgData, country: e.target.value})}
    >
      <option value="">Select Country</option>
      {countries.map(country => (
        <option key={country.country_id} value={country.country_name}>
          {country.country_name}
        </option>
      ))}
    </select>
  ) : (
    <p className="mb-0">
  {isDataLoaded ? organizationData.country : <small className="text-muted">Loading...</small>}
</p>
  )}
</div>
      <div className="mb-3">
        <label className="form-label small fw-semibold" style={{color: '#284C9A'}}>Official Website</label>
        {editingOrgInfo ? (
          <input 
            type="url" 
            className="form-control"
            value={editedOrgData.website}
            onChange={(e) => setEditedOrgData({...editedOrgData, website: e.target.value})}
          />
        ) : (
          <p className="mb-0">
            <a href={organizationData.website} className="text-decoration-none" target="_blank" rel="noopener noreferrer">
              {organizationData.website}
            </a>
          </p>
        )}
      </div>
    </div>
  </div>
</div>
        </div>

{/* Statistics Cards Row */}
<div className="row mb-4">
 {/* Admin Officials */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6',cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s'
    }}
    onClick={() => navigate('/dashboard-sysadmin/SysadUserManagement')}  // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS
    onMouseEnter={(e) => {  // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS (optional hover effect)
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {  // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS (optional hover effect)
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}
    >
      <div className="card-body text-center position-relative">
        {organizationData.isUsersDataSkipped && (
          <span className="badge bg-warning position-absolute top-0 end-0 mt-2 me-2" style={{fontSize: '0.6rem'}}>
            Not uploaded
          </span>
        )}
        <i className="bi bi-person-badge-fill text-warning fs-3 mb-2 d-block"></i>
        <h5 className="fw-bold mb-1">
          {organizationData.isUsersDataSkipped ? '0' : safeNumber(organizationData.adminOfficials).toLocaleString()}
        </h5>
        <p className="text-muted mb-0 small">Admin Officials</p>
      </div>
    </div>
  </div>

  {/* Standard Users */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6',cursor: 'pointer',
      transition: 'transform 0.2s, box-shadow 0.2s'}}
      onClick={() => navigate('/dashboard-sysadmin/SysadUserManagement')}
       onMouseEnter={(e) => {  // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS (optional hover effect)
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {  // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS (optional hover effect)
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}
      >
        
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

 {/* Personnel */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6',
      cursor: 'pointer', 
      transition: 'transform 0.2s, box-shadow 0.2s'  
    }}
    onClick={() => navigate('/dashboard-sysadmin/SysadUserManagement')}  
    onMouseEnter={(e) => {  
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => { 
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}
    >
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
</div>

{/* Second Row Statistics */}
<div className="row mb-4">
  {/* Total Assets */}
  <div className="col-lg-4 col-md-6 mb-3">
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6',
       cursor: 'pointer',  transition: 'transform 0.2s, box-shadow 0.2s' 
    }}
    onClick={() => navigate('/dashboard-sysadmin/AssetOverview')}  
    onMouseEnter={(e) => {  
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {  
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}
    >
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
    <div className="card shadow-sm" style={{borderRadius: '16px', height: '120px', border: '1px solid #dee2e6',
     cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s' 
    }}
        onClick={() => navigate('/dashboard-sysadmin/SysadUserManagement')}  
    onMouseEnter={(e) => {  
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => { 
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '';
    }}
    
    >
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
  transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
  cursor: 'pointer' 
}}
onClick={() => navigate('/dashboard-sysadmin/SysadAuditLogs')}
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
 
  {recentActivities.length > 0 && (
    <button 
      className="btn btn-link text-primary fw-semibold text-decoration-none p-0"
       onClick={(e) => {
        e.stopPropagation(); // ÃƒÂ¢Ã¢â‚¬ Ã‚Â ADD THIS to prevent card click
        navigate('/dashboard-sysadmin/SysadAuditLogs');
      }}
    >
      View All Activities in Audit Logs 
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
  </>
);
}