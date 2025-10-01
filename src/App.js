// Una, ini-import ko lahat ng kailangan kong dependencies at components.
// Kasama dito ang React, React Router (pang-routing ng mga pages),
// EmailService (pang-email notification), at iba’t ibang dashboard pages
// para sa iba’t ibang user roles (standard, personnel, admin, sysadmin).

import React, { useEffect } from 'react';
import { EmailService } from './utils/EmailService';
import PrivateRoute from './PrivateRoute'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// Public pages (hindi kailangan ng login para ma-access)
import LandingPage from './LandingPage';
import SidebarLayout from './Layouts/SidebarLayout';
import LoginPage from './LoginPage';
import Signup from './Signup';
// Shared pages (pwede sa lahat ng roles pero may access restriction)
import Profile from './dashboards/UserNav/Profile';
import Notification from './dashboards/UserNav/Notification';
//Nav of each Users.
// standard usser
import DashboardUser from './dashboards/DashboardUser';
//Personnel
import DashboardPersonnel from './dashboards/DashboardPersonnel';
import Assets from './dashboards/PersonnelNav/Assets';
//Sysad
import DashboardSysAdmin from './dashboards/DashboardSysAdmin';
import SysadReports from './dashboards/SysadNav/SysadReports';
import SetupWizard from './dashboards/SysadNav/SetupWizard';
import SysadUserManagement from './dashboards/SysadNav/SysadUserManagement';
import SysadAuditLogs from './dashboards/SysadNav/SysadAuditLogs';

//AdminNav
import DashboardAdmin from './dashboards/DashboardAdmin';
import WorkOrder from './dashboards/AdminNav/WorkOrder';
import MaintenanceTasks from './dashboards/AdminNav/MaintenanceTasks';
//import Reservation from './dashboards/AdminNav/Reservation';
import Reports from './dashboards/AdminNav/Reports';
import ActivityTracking from './dashboards/AdminNav/ActivityTracking';
import UserManagement from './dashboards/AdminNav/UserManagement';
import AssetManagement from './dashboards/AdminNav/AssetManagement';

function App() {
   // Ginamit ko ang useEffect para i-initialize ang EmailJS service
  // sa tuwing maglo-load ang app. Para dito ko mache-check kung tama
  // ang mga environment variables (service ID, template ID, public key).
  useEffect(() => {
    console.log('Initializing EmailJS...');
    
    // Initialize EmailJS when app starts
    const emailInitResult = EmailService.init();
    if (emailInitResult) {
      console.log('EmailJS initialized successfully');
    } else {
      console.warn('Email service not configured properly. Check environment variables:', {
        serviceId: process.env.REACT_APP_EMAILJS_SERVICE_ID ? 'Set' : 'Missing',
        templateId: process.env.REACT_APP_EMAILJS_TEMPLATE_ID ? 'Set' : 'Missing',
        publicKey: process.env.REACT_APP_EMAILJS_PUBLIC_KEY ? 'Set' : 'Missing'
      });
    }
    
    // Ginawa ko ring optional test mode para sa development,
    // para macheck agad kung gumagana ang EmailJS configuration.
    if (process.env.NODE_ENV === 'development') {
      EmailService.testConfiguration().then(result => {
        if (result.success) {
          console.log('Ã¢Å“â€¦ EmailJS configuration test passed');
        } else {
          console.error('Ã¢ÂÅ’ EmailJS configuration test failed:', result.error);
          console.log('Make sure your EmailJS service, template, and public key are correctly configured.');
        }
      });
    }
  }, []); 
  return (
     // Ginamit ko ang BrowserRouter (Router) para sa navigation system ng buong app.
    // Lahat ng pages ay dinefine ko sa loob ng <Routes> at <Route>.
    <Router>
      <Routes>
         {/* PUBLIC ROUTES (kahit hindi naka-login) */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/setup-wizard" element={<SetupWizard />} />

        {/* STANDARD USER ROUTES */}
        {/* Gumamit ako ng PrivateRoute para masigurado na
            only "standard" role ang makaka-access sa mga routes na ito */}
        <Route 
        path="/dashboard-user" 
        element={
      <PrivateRoute allowedRoles={['standard']}>
      <SidebarLayout role="standard">
      <DashboardUser />
      </SidebarLayout>
      </PrivateRoute>
    } 
  />
<Route 
  path="/dashboard-user/profile" 
  element={
    <PrivateRoute allowedRoles={['standard']}>
      <Profile role="standard" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-user/notification" 
  element={
    <PrivateRoute allowedRoles={['standard']}>
      <Notification role="standard" />
    </PrivateRoute>
  } 
/>

  
      {/* Personnel - Change to separate routes */}
       <Route 
        path="/dashboard-personnel" 
        element={
      <PrivateRoute allowedRoles={['personnel']}>
      <SidebarLayout role="personnel">
      <DashboardPersonnel />
      </SidebarLayout>
      </PrivateRoute>
    } 
  />
<Route 
  path="/dashboard-personnel/profile" 
  element={
    <PrivateRoute allowedRoles={['personnel']}>
      <Profile role="personnel" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-personnel/notification" 
  element={
    <PrivateRoute allowedRoles={['personnel']}>
      <Notification role="personnel" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-personnel/Assets" 
  element={
    <PrivateRoute allowedRoles={['personnel']}>
      <Assets />
    </PrivateRoute>
  } 
/>

        {/* Admin official*/}
       <Route 
  path="/dashboard-admin" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <SidebarLayout role="admin">
      <DashboardAdmin />
      </SidebarLayout>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/profile" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <Profile role="admin" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/notification" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <Notification role="admin" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/WorkOrder" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <WorkOrder />
    </PrivateRoute>
  } 
/>

<Route 
  path="/dashboard-admin/MaintenanceTasks" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <MaintenanceTasks />
    </PrivateRoute>
  } 
/>

<Route 
  path="/dashboard-admin/ActivityTracking" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <ActivityTracking />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/Reports" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <Reports />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/UserManagement" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <UserManagement />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/AssetManagement" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
      <AssetManagement />
    </PrivateRoute>
  } 
/>
                             
        {/*SysAdmin*/}
       <Route 
  path="/dashboard-sysadmin" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SidebarLayout role="sysadmin">
      <DashboardSysAdmin />
      </SidebarLayout>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/profile" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <Profile role="sysadmin" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/notification" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <Notification role="sysadmin" />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadUserManagement" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysadUserManagement />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadReports" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysadReports />
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadAuditLogs" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysadAuditLogs />
    </PrivateRoute>
  } 
/>

{/* Keep this for later internal navigation */}
<Route 
  path="/dashboard-sysadmin/SetupWizard" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SetupWizard />
    </PrivateRoute>
  } 
/>

      </Routes>
      
    </Router>
  );
}

export default App;