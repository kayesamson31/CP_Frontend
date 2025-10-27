// Una, ini-import ko lahat ng kailangan kong dependencies at components.
// Kasama dito ang React, React Router (pang-routing ng mga pages),
// EmailService (pang-email notification), at ibaâ€™t ibang dashboard pages
// para sa ibaâ€™t ibang user roles (standard, personnel, admin, sysadmin).
import { supabase } from './supabaseClient'; // ✅ ADD THIS
import React, { useEffect } from 'react';
import { EmailService } from './utils/EmailService';
import PrivateRoute from './PrivateRoute'; 
import { SysAdminDashboardProvider } from './contexts/SysAdminDashboardContext';
import { AdminDashboardProvider } from './contexts/AdminDashboardContext';
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
import AssetOverview from './dashboards/SysadNav/AssetOverview';

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
  // ✅ FIRST: Restore Supabase session
  const initializeAuth = async () => {
    console.log('App: Checking for existing session...');
    
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('App: Session check error:', error);
    } else if (session) {
      console.log('App: Session restored for user:', session.user.email);
    } else {
      console.log('App: No active session found');
    }
  };

  initializeAuth();

  // ✅ SECOND: Listen to auth state changes
  const { data: authListener } = supabase.auth.onAuthStateChange(
    (event, session) => {
      console.log('Auth state changed:', event);
      
      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user?.email);
      }
      
      if (event === 'SIGNED_OUT') {
        console.log('User signed out');
      }
      
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }
    }
  );

  // ✅ THIRD: Initialize EmailJS
  console.log('Initializing EmailJS...');
  
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
  
  if (process.env.NODE_ENV === 'development') {
    EmailService.testConfiguration().then(result => {
      if (result.success) {
        console.log('✓ EmailJS configuration test passed');
      } else {
        console.error('✗ EmailJS configuration test failed:', result.error);
        console.log('Make sure your EmailJS service, template, and public key are correctly configured.');
      }
    });
  }

  // ✅ Cleanup auth listener on unmount
  return () => {
    authListener?.subscription.unsubscribe();
  };
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
       <AdminDashboardProvider>
      <SidebarLayout role="admin">
      <DashboardAdmin />
      </SidebarLayout>
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/profile" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <Profile role="admin" />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/notification" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <Notification role="admin" />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/WorkOrder" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <WorkOrder />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>

<Route 
  path="/dashboard-admin/MaintenanceTasks" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <MaintenanceTasks />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>

<Route 
  path="/dashboard-admin/ActivityTracking" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <ActivityTracking />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/Reports" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <Reports />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/UserManagement" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <UserManagement />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-admin/AssetManagement" 
  element={
    <PrivateRoute allowedRoles={['admin']}>
       <AdminDashboardProvider>
      <AssetManagement />
      </AdminDashboardProvider>
    </PrivateRoute>
  } 
/>
                             
        {/*SysAdmin*/}
       
       <Route 
  path="/dashboard-sysadmin" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <SidebarLayout role="sysadmin">
      <DashboardSysAdmin />
      </SidebarLayout>
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/profile" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <Profile role="sysadmin" />
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/notification" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <Notification role="sysadmin" />
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadUserManagement" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <SysadUserManagement />
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadReports" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <SysadReports />
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>
<Route 
  path="/dashboard-sysadmin/SysadAuditLogs" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <SysadAuditLogs />
      </SysAdminDashboardProvider>
    </PrivateRoute>
  } 
/>

<Route 
  path="/dashboard-sysadmin/AssetOverview" 
  element={
    <PrivateRoute allowedRoles={['sysadmin']}>
      <SysAdminDashboardProvider>
      <AssetOverview/>
      </SysAdminDashboardProvider>
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