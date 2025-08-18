//SidebarLayout.js - Updated with new role configurations
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Container, Row, Col, Button, Nav } from 'react-bootstrap';
import dashboardlogo from '../assets/OpenFMSLogo.png';

// Icons
import dashvehicle from '../assets/icons/DashCar.png';
import dashfacility from '../assets/icons/Dashfacility.png';
import dashDash from '../assets/icons/DashDash.png';
import dashnotif from '../assets/icons/DashNotif.png';
import dashprofile from '../assets/icons/DashProfile.png';
import dashvehicleWhite from '../assets/icons/DashCarWhite.png';
import dashfacilityWhite from '../assets/icons/DashFacilityWhite.png';
import dashDashWhite from '../assets/icons/DashDashWhite.png';
import dashnotifWhite from '../assets/icons/DashNotifWhite.png';
import dashprofileWhite from '../assets/icons/DashProfileWhite.png';
import { 
   
  FaClipboardList, 
  FaUsers, 
  FaFileAlt,
  FaHistory 
} from "react-icons/fa";

// Updated menu configuration per role
const menuConfig = {
  // Standard User navigation
  standard: [
    { label: 'Dashboard', path: '/dashboard-user', icon: dashDash, iconActive: dashDashWhite },
    { label: 'Profile', path: '/profile', icon: dashprofile, iconActive: dashprofileWhite },
    { label: 'Notification', path: '/notification', icon: dashnotif, iconActive: dashnotifWhite },
    { label: 'Vehicle', path: '/vehicle', icon: dashvehicle, iconActive: dashvehicleWhite },
    { label: 'Facility', path: '/facility', icon: dashfacility, iconActive: dashfacilityWhite },
  ],

  // Personnel navigation
  personnel: [
    { label: 'Dashboard', path: '/dashboard-personnel', icon: dashDash, iconActive: dashDashWhite },
    { label: 'Profile', path: '/dashboard-personnel/profile', icon: dashprofile, iconActive: dashprofileWhite },
    { label: 'Notification', path: '/dashboard-personnel/notification', icon: dashnotif, iconActive: dashnotifWhite },
    { label: 'Assets', path: '/dashboard-personnel/Assets', icon: dashfacility, iconActive: dashfacilityWhite }
  ],

  // Admin Official navigation
  admin: [
    { label: 'Dashboard', path: '/dashboard-admin', icon: dashDash, iconActive: dashDashWhite },
    { label: 'Profile', path: '/dashboard-admin/profile', icon: dashprofile, iconActive: dashprofileWhite },
    { label: 'Notification', path: '/dashboard-admin/notification', icon: dashnotif, iconActive: dashnotifWhite },
    { label: 'Work Order', path: '/dashboard-admin/WorkOrder', icon: <FaClipboardList />, iconActive: <FaClipboardList style={{color: 'white'}} /> },
    { label: 'Facility', path: '/dashboard-admin/Facility', icon: dashfacility, iconActive: dashfacilityWhite },
    { label: 'Vehicle', path: '/dashboard-admin/Vehicle', icon: dashvehicle, iconActive: dashvehicleWhite },
    { label: 'User Management', path: '/dashboard-admin/UserManagement', icon: <FaUsers />, iconActive: <FaUsers style={{color: 'white'}} /> },
    { label: 'Activity Tracking', path: '/dashboard-admin/ActivityTracking', icon: <FaHistory />, iconActive: <FaHistory style={{color: 'white'}} /> },
    { label: 'Reports', path: '/dashboard-admin/reports', icon: <FaFileAlt />, iconActive: <FaFileAlt style={{color: 'white'}} /> }
  ],

  // System Administrator navigation
  sysadmin: [
    { label: 'Dashboard', path: '/dashboard-sysadmin', icon: dashDash, iconActive: dashDashWhite },
    { label: 'Notifications', path: '/dashboard-sysadmin/notification', icon: dashnotif, iconActive: dashnotifWhite },
    { label: 'Profile', path: '/dashboard-sysadmin/profile', icon: dashprofile, iconActive: dashprofileWhite },
    { label: 'User Management', path: '/dashboard-sysadmin/SysadUserManagement', icon: <FaUsers />, iconActive: <FaUsers style={{color: 'white'}} /> },
    { label: 'Report Tabs', path: '/dashboard-sysadmin/SysadReports', icon: <FaFileAlt />, iconActive: <FaFileAlt style={{color: 'white'}} /> },
    { label: 'Activity Tracking', path: '/dashboard-sysadmin/SysadActivityTracking', icon: <FaHistory />, iconActive: <FaHistory style={{color: 'white'}} /> }
  ]
};

export default function SidebarLayout({ children, role = 'standard' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeTab = location.pathname;

  const menus = menuConfig[role] || menuConfig.standard;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole'); // Also remove role if stored
    navigate('/login');
  };

  const renderIcon = (tab, isActive) => {
    // Handle React Icons (components)
    if (typeof tab.icon === 'object' && tab.icon.type) {
      return isActive ? tab.iconActive : tab.icon;
    }
    
    // Handle image icons
    return (
      <img
        src={isActive ? tab.iconActive : tab.icon}
        alt={`${tab.label} icon`}
        style={{ width: '20px', height: '20px', objectFit: 'contain' }}
      />
    );
  };

  return (
    <Container fluid style={{ backgroundColor: '#FFF', minHeight: '100vh', padding: 0 }}>
      <Row>
        {/* Sidebar */}
        <Col
          md={2}
          className="bg-white p-3 d-flex flex-column"
          style={{
            borderRight: '1.5px solid #B0D0E6',
            minHeight: '100vh',
            maxHeight: '100vh',
            position: 'fixed',
            top: 0,
            left: 0,
            zIndex: 1000,
            overflowY: 'auto'
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
                    fontWeight: '500'
                  }}
                >
                  {renderIcon(tab, isActive)}
                  {tab.label}
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
        </Col>

        {/* Main Content */}
        <Col md={10} style={{ marginLeft: '16.66667%', padding: '20px' }}>
          {children}
        </Col>
      </Row>
    </Container>
  );
}