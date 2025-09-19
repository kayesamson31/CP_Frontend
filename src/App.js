// src/App.jsx
import React from 'react';
import PrivateRoute from './PrivateRoute'; 
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//public
import LandingPage from './LandingPage';
import SidebarLayout from './Layouts/SidebarLayout';
import LoginPage from './LoginPage';
import Signup from './Signup';
//shared pages
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
//import Reservation from './dashboards/AdminNav/Reservation';
import Reports from './dashboards/AdminNav/Reports';
import ActivityTracking from './dashboards/AdminNav/ActivityTracking';
import UserManagement from './dashboards/AdminNav/UserManagement';
import AssetManagement from './dashboards/AdminNav/AssetManagement';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* ADD THIS: Standalone Setup Wizard (no authentication required) */}
        <Route path="/setup-wizard" element={<SetupWizard />} />

        {/* Standard User*/}
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

       {/*  <Route path="/dashboard-user/VehicleRequest" element={<VehicleRequest/>} /> */}
       {/*  <Route path="/dashboard-user/FacilityRequest" element={<FacilityRequest/>} /> */ }

        {/* Personnel*/}
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