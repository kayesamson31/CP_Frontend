// DEBUG VERSION - SidebarLayout.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Nav } from 'react-bootstrap';
import dashboardlogo from '../assets/OpenFMSLogo.png';
import 'bootstrap-icons/font/bootstrap-icons.css';

const menuConfig = {
  standard: [
    { label: 'Dashboard', path: '/dashboard-user', icon: 'bi bi-speedometer2' },
    { label: 'Profile', path: '/profile', icon: 'bi bi-person' },
    { label: 'Notification', path: '/notification', icon: 'bi bi-bell' },
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
    { label: 'User Management', path: '/dashboard-admin/UserManagement', icon: 'bi bi-people' },
    { label: 'Asset Management', path: '/dashboard-admin/AssetManagement', icon: 'bi bi-box-seam' },
    { label: 'Activity Tracking', path: '/dashboard-admin/ActivityTracking', icon: 'bi bi-clock-history' },
    { label: 'Reports', path: '/dashboard-admin/reports', icon: 'bi bi-file-earmark-text' }
  ],
  sysadmin: [
    { label: 'Dashboard', path: '/dashboard-sysadmin', icon: 'bi bi-speedometer2' },
    { label: 'Notifications', path: '/dashboard-sysadmin/notification', icon: 'bi bi-bell' },
    { label: 'Profile', path: '/dashboard-sysadmin/profile', icon: 'bi bi-person' },
    { label: 'User Management', path: '/dashboard-sysadmin/SysadUserManagement', icon: 'bi bi-people' },
    { label: 'Report Tabs', path: '/dashboard-sysadmin/SysadReports', icon: 'bi bi-file-earmark-text' },
    { label: 'Audit Logs', path: '/dashboard-sysadmin/SysadAuditLogs', icon: 'bi bi-clock-history' }
  ]
};

export default function SidebarLayout({ children}) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;
  const [notificationCount, setNotificationCount] = useState(0);
  const role = localStorage.getItem('userRole') || 'standard';
  const menus = menuConfig[role] || menuConfig.standard;

  useEffect(() => {
    const updateNotificationCount = () => {
      const count = localStorage.getItem(`unreadCount_${role}`) || '0';
      setNotificationCount(parseInt(count));
    };
    
    updateNotificationCount();
    
    const handleStorageChange = () => {
      updateNotificationCount();
    };
    
    window.addEventListener('storage', handleStorageChange);
    const interval = setInterval(updateNotificationCount, 1000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [role]);

  const handleLogout = () => {
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userRole');
    localStorage.removeItem('user');
    localStorage.removeItem('orgDataFromSignup');
    navigate('/login');
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

 return (
  <div style={{ display: 'flex', minHeight: '100vh' }}>
    {/* Sidebar */}
    <div
      className="bg-white p-3 d-flex flex-column"
      style={{
        borderRight: '1.5px solid #B0D0E6',
        width: '336px',
        flexShrink: 0,
        overflowY: 'auto'
      }}
    >
      {/* All your existing sidebar content stays the same */}
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
      overflowX: 'hidden'
    }}>
      {children}
    </div>
  </div>
);
}