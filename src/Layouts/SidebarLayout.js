// Fixed SidebarLayout.js - Using Supabase instead of localStorage
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {Button, Nav } from 'react-bootstrap';
import dashboardlogo from '../assets/OpenFMSLogo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { supabase } from '../supabaseClient';
import { AuditLogger } from '../utils/AuditLogger';

const menuConfig = {
  standard: [
    { label: 'Dashboard', path: '/dashboard-user', icon: 'bi bi-speedometer2' },
    { label: 'Profile', path: '/dashboard-user/profile', icon: 'bi bi-person' },
    { label: 'Notification', path: '/dashboard-user/notification', icon: 'bi bi-bell' },
  ],

  personnel: [
    { label: 'Dashboard', path: '/dashboard-personnel', icon: 'bi bi-speedometer2' },
    { label: 'Profile', path: '/dashboard-personnel/profile', icon: 'bi bi-person' },
    { label: 'Notification', path: '/dashboard-personnel/notification', icon: 'bi bi-bell' },
    { label: 'Assets', path: '/dashboard-personnel/Assets', icon: 'bi bi-box-seam' }
  ],
  admin: [
    { label: 'Dashboard', path: '/dashboard-admin', icon: 'bi bi-speedometer2' },
    { label: 'Profile', path: '/dashboard-admin/profile', icon: 'bi bi-person' },
    { label: 'Notification', path: '/dashboard-admin/notification', icon: 'bi bi-bell' },
    { label: 'Work Order', path: '/dashboard-admin/WorkOrder', icon: 'bi bi-clipboard-check' },
    { label: 'Maintenance Tasks', path: '/dashboard-admin/MaintenanceTasks', icon: 'bi bi-gear'},
    { label: 'Asset Management', path: '/dashboard-admin/AssetManagement', icon: 'bi bi-box-seam' },
    { label: 'User Management', path: '/dashboard-admin/UserManagement', icon: 'bi bi-people' },
    { label: 'Activity Tracking', path: '/dashboard-admin/ActivityTracking', icon: 'bi bi-clock-history' },
    { label: 'Reports', path: '/dashboard-admin/reports', icon: 'bi bi-file-earmark-text' }
  ],
  sysadmin: [
    { label: 'Dashboard', path: '/dashboard-sysadmin', icon: 'bi bi-speedometer2' },
    { label: 'Profile', path: '/dashboard-sysadmin/profile', icon: 'bi bi-person' },
    { label: 'Notifications', path: '/dashboard-sysadmin/notification', icon: 'bi bi-bell' },
    { label: 'User Management', path: '/dashboard-sysadmin/SysadUserManagement', icon: 'bi bi-people' },
    { label: 'Asset Overview', path: '/dashboard-sysadmin/AssetOverview', icon: 'bi-clipboard-data' },
    { label: 'Audit Logs', path: '/dashboard-sysadmin/SysadAuditLogs', icon: 'bi bi-clock-history' },
    { label: 'Report Tabs', path: '/dashboard-sysadmin/SysadReports', icon: 'bi bi-file-earmark-text' }
  ]
};

export default function SidebarLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;
  const [notificationCount, setNotificationCount] = useState(0);
  const [workOrderToReviewCount, setWorkOrderToReviewCount] = useState(0); 
const [maintenanceToReviewCount, setMaintenanceToReviewCount] = useState(0); 
  const [role, setRole] = useState('standard');
  const [loading, setLoading] = useState(true);
  const menus = menuConfig[role] || menuConfig.standard;
  const [notificationsFetched, setNotificationsFetched] = useState(false);
  useEffect(() => {
    const getUserRoleFromSupabase = async () => {
      try {
        setLoading(true);
        
        // Get current authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError || !user) {
          console.log('No authenticated user found, defaulting to standard');
          setRole('standard');
          setLoading(false);
          return;
        }

        // Get user data from database using email
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('role_id')
          .eq('email', user.email)
          .single();

        if (userError || !userData) {
          console.log('User data not found in database, defaulting to standard');
          setRole('standard');
          setLoading(false);
          return;
        }

        // Convert role_id to role string
        let userRole = 'standard';
        switch (userData.role_id) {
          case 1: userRole = 'sysadmin'; break;
          case 2: userRole = 'admin'; break;
          case 3: userRole = 'personnel'; break;
          case 4: userRole = 'standard'; break;
          default: userRole = 'standard';
        }

        console.log('User role from Supabase:', userRole);
        setRole(userRole);

      } catch (error) {
        console.error('Error fetching user role:', error);
        setRole('standard');
      } finally {
        setLoading(false);
      }
    };

    getUserRoleFromSupabase();
  }, []);

  // Fetch Work Order "To Review" count
const fetchWorkOrderToReviewCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('user_id, role_id, organization_id')
      .eq('email', user.email)
      .single();

    if (!userData) return;

    // Get "To Review" status_id
    const { data: statusData } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'To Review')
      .eq('status_category', 'work_order')
      .single();

    if (!statusData) return;

    // Count work orders with "To Review" status
    const { count, error } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', userData.organization_id)
      .eq('status_id', statusData.status_id);

    if (error) throw error;

    setWorkOrderToReviewCount(count || 0);
    console.log('✅ Work Order To Review Count:', count);

  } catch (error) {
    console.error('Error fetching work order count:', error);
    setWorkOrderToReviewCount(0);
  }
};

// Fetch Maintenance Tasks "To Review" count
const fetchMaintenanceToReviewCount = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: userData } = await supabase
      .from('users')
      .select('user_id, organization_id')
      .eq('email', user.email)
      .single();

    if (!userData) return;

    // Count incidents with status_id = 4 (Reported) that DON'T have tasks yet
    const { data: incidents, error: incidentError } = await supabase
      .from('incident_reports')
      .select('incident_id')
      .eq('organization_id', userData.organization_id)
      .eq('status_id', 4); // Reported status

    if (incidentError) throw incidentError;

    // Get incidents that already have tasks
    const { data: existingTasks } = await supabase
      .from('maintenance_tasks')
      .select('incident_id')
      .not('incident_id', 'is', null);

    const assignedIncidentIds = new Set(existingTasks?.map(t => t.incident_id) || []);
    
    // Count unassigned incidents
    const unassignedCount = incidents?.filter(inc => !assignedIncidentIds.has(inc.incident_id)).length || 0;

    setMaintenanceToReviewCount(unassignedCount);
    console.log('✅ Maintenance To Review Count:', unassignedCount);

  } catch (error) {
    console.error('Error fetching maintenance count:', error);
    setMaintenanceToReviewCount(0);
  }
};
useEffect(() => {
  // Skip if role is still loading
  if (loading || !role) return;

  let channel = null;
  let userData = null; // ✅ Store user data for subscription filters
  
  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ✅ Store userData for use in subscription
      const { data: fetchedUserData } = await supabase
        .from('users')
        .select('user_id, role_id, organization_id')
        .eq('email', user.email)
        .single();

      if (!fetchedUserData) return;
      userData = fetchedUserData; // ✅ Save for later use

      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('notification_id, target_roles, target_user_id')
        .eq('organization_id', userData.organization_id) // ✅ Already filtered
        .eq('is_active', true);

      if (error) throw error;

      // Filter for this user's role
      const filteredNotifs = notifications.filter(n => {
        const targetRoles = n.target_roles?.split(',').map(r => r.trim()) || [];
        return targetRoles.includes(userData.role_id.toString()) || 
               n.target_user_id === userData.user_id;
      });

      const { data: readNotifs } = await supabase
        .from('notification_user_reads')
        .select('notification_id')
        .eq('user_id', userData.user_id);

      const readIds = (readNotifs || []).map(r => r.notification_id);
      const unreadCount = filteredNotifs.filter(n => !readIds.includes(n.notification_id)).length;

      setNotificationCount(unreadCount);
      setNotificationsFetched(true);

    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  };
  
  // ✅ Initial fetch
  fetchNotificationCount();
  fetchWorkOrderToReviewCount(); 
fetchMaintenanceToReviewCount();

  // ✅ Reduced polling to 10 seconds (from 30s) for faster fallback
 // ✅ Reduced polling to 10 seconds (from 30s) for faster fallback
const interval = setInterval(() => {
  fetchNotificationCount();
  fetchWorkOrderToReviewCount();  // ← ADD THIS
  fetchMaintenanceToReviewCount();  // ← ADD THIS
}, 10000);
  
  // ✅ Real-time subscription with ORG FILTER
  const setupSubscription = async () => {
    // Wait for userData to be available
    while (!userData) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('📡 Setting up sidebar subscription for org:', userData.organization_id);
    
    channel = supabase
      .channel('sidebar-notifications-' + userData.user_id)
      .on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'notifications',
    filter: `organization_id=eq.${userData.organization_id}`
  },
  (payload) => {
    console.log('🔔 Sidebar: Notification changed for my org');
    fetchNotificationCount();
  }
)
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'work_orders',
    filter: `organization_id=eq.${userData.organization_id}`
  },
  (payload) => {
    console.log('📋 Sidebar: Work order changed');
    fetchWorkOrderToReviewCount();
  }
)
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'incident_reports',
    filter: `organization_id=eq.${userData.organization_id}`
  },
  (payload) => {
    console.log('🔧 Sidebar: Incident report changed');
    fetchMaintenanceToReviewCount();
  }
)
.on(
  'postgres_changes',
  {
    event: '*',
    schema: 'public',
    table: 'maintenance_tasks'
  },
  (payload) => {
    console.log('🔧 Sidebar: Maintenance task changed');
    fetchMaintenanceToReviewCount();
  }
)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notification_user_reads',
          filter: `user_id=eq.${userData.user_id}` // ✅ CRITICAL FIX
        },
        (payload) => {
          console.log('📖 Sidebar: Read status changed');
          fetchNotificationCount();
        }
      )
      .subscribe((status) => {
        console.log('📡 Sidebar subscription status:', status);
      });
  };
  
  setupSubscription();
  
  return () => {
    clearInterval(interval);
    if (channel) supabase.removeChannel(channel);
  };
}, [role, loading]);

  const handleLogout = async () => {
    try {

      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
      await AuditLogger.logWithIP({
        userId: currentUser.id,
        actionTaken: 'User logged out',
        tableAffected: 'users',
        recordId: currentUser.id
      });
    }
      // Sign out from Supabase Auth
      await supabase.auth.signOut();
      
      // Clear any remaining localStorage (if any)
      localStorage.clear();
      
      // Redirect to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if logout fails
      navigate('/login');
    }
  };

  const renderIcon = (tab, isActive) => {
    return (
      <i 
        className={tab.icon} 
        style={{ 
          fontSize: '18px',
          color: isActive ? 'white' : '#000000FF'
        }}
      />
    );
  };

  // Show loading state while fetching user role
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div
        className="bg-white p-3 d-flex flex-column"
        style={{
          borderRight: '1.5px solid #B0D0E6',
          width: '336px',
          flexShrink: 0,
          overflowY: 'auto',
          position: 'fixed',     
          height: '100vh',        
          left: 0,                
          top: 0                  
        }}
      >
        <div className="mb-4 text-center">
          <img src={dashboardlogo} alt="Logo" style={{ width: '100%', maxWidth: '180px', height: 'auto' }} />
        </div>

        <Nav className="flex-column">
          {menus.map((tab) => {
            const isActive = activeTab === tab.path;
            return (
              <Nav.Link
                as={Link}
                to={tab.path}
                key={tab.path}
                style={{
                  backgroundColor: isActive ? '#284C9A' : 'transparent',
                  color: isActive ? 'white' : '#000',
                  borderRadius: '5px',
                  marginBottom: '5px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '10px',
                  fontWeight: '500',
                  position: 'relative'
                }}
              >
                {renderIcon(tab, isActive)}
                {tab.label}
                
                {(tab.label === 'Notification' || tab.label === 'Notifications') && (
  notificationsFetched ? (
    notificationCount > 0 && (
      <span
        style={{
          backgroundColor: '#DC3545',
          color: 'white',
          borderRadius: '50%',
          width: '20px',
          height: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          marginLeft: 'auto'
        }}
      >
        {notificationCount > 99 ? '99+' : notificationCount}
      </span>
    )
  ) : null
)}

{/* Orange badge for Work Order "To Review" */}
{tab.label === 'Work Order' && workOrderToReviewCount > 0 && (
  <span
    style={{
      backgroundColor: '#FF8C00',  // Orange color
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: 'auto'
    }}
  >
    {workOrderToReviewCount > 99 ? '99+' : workOrderToReviewCount}
  </span>
)}

{/* Orange badge for Maintenance Tasks "To Review" */}
{tab.label === 'Maintenance Tasks' && maintenanceToReviewCount > 0 && (
  <span
    style={{
      backgroundColor: '#FF8C00',  // Orange color
      color: 'white',
      borderRadius: '50%',
      width: '20px',
      height: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '12px',
      fontWeight: 'bold',
      marginLeft: 'auto'
    }}
  >
    {maintenanceToReviewCount > 99 ? '99+' : maintenanceToReviewCount}
  </span>
)}

              </Nav.Link>
            );
          })}
        </Nav>

        <div className="mt-auto">
          <Button
            className="w-100"
            style={{
              backgroundColor: '#FFF',
              color: '#FF0000',
              border: '1.5px solid #FF0000',
              borderRadius: '8px',
              fontWeight: '500',
              fontSize: '14px',
              padding: '2px 6px',
            }}
            onClick={handleLogout}
          >
            Log out
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1,
        padding: '20px',
        overflowX: 'hidden',
        marginLeft: '336px'  
      }}>
        {children}
      </div>
    </div>
  );
}