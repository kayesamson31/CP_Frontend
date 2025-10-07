// Fixed SidebarLayout.js - Using Supabase instead of localStorage
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Nav } from 'react-bootstrap';
import dashboardlogo from '../assets/OpenFMSLogo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';
import { supabase } from '../supabaseClient';

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
  const [role, setRole] = useState('standard');
  const [loading, setLoading] = useState(true);
  const menus = menuConfig[role] || menuConfig.standard;

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

useEffect(() => {
  const fetchNotificationCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('user_id, role_id')
        .eq('email', user.email)
        .single();

      if (!userData) return;

      const roleId = userData.role_id;
      const userId = userData.user_id;

     // Get user's organization
const { data: orgData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('user_id', userId)
  .single();

const { data: notifications, error } = await supabase
  .from('notifications')
  .select('notification_id')
  .or(`target_roles.eq.${roleId},target_user_id.eq.${userId}`)
  .eq('organization_id', orgData?.organization_id)  // CRITICAL FIX
  .eq('is_active', true);

      if (error) throw error;

      const { data: readNotifs } = await supabase
        .from('notification_user_reads')
        .select('notification_id')
        .eq('user_id', userId);

      const readIds = (readNotifs || []).map(r => r.notification_id);
      const unreadCount = notifications.filter(n => !readIds.includes(n.notification_id)).length;

      console.log('Sidebar notification count:', unreadCount);
      setNotificationCount(unreadCount);

    } catch (error) {
      console.error('Error fetching notification count:', error);
      setNotificationCount(0);
    }
  };
  
  if (role && role !== 'standard') {
    fetchNotificationCount();
  } else if (role === 'standard') {
    fetchNotificationCount();
  }
  
  const interval = setInterval(fetchNotificationCount, 10000);
  
  const channel = supabase
    .channel('sidebar-notifications-' + role)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notifications'
      },
      () => {
        console.log('Notification change detected');
        fetchNotificationCount();
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notification_user_reads'
      },
      () => {
        console.log('Notification read change detected');
        fetchNotificationCount();
      }
    )
    .subscribe();
  
  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}, [role]);

  const handleLogout = async () => {
    try {
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
                
                {(tab.label === 'Notification' || tab.label === 'Notifications') && notificationCount > 0 && (
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