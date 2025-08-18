// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
//public
import LandingPage from './LandingPage';
import LoginPage from './LoginPage';
import Signup from './Signup';
//shared pages
import Profile from './dashboards/UserNav/Profile';
import Notification from './dashboards/UserNav/Notification';
//Nav of each Users.
// Dashboard Components
import DashboardUser from './dashboards/DashboardUser';
//Personnel
import DashboardPersonnel from './dashboards/DashboardPersonnel';
import Assets from './dashboards/PersonnelNav/Assets';
//Sysad
import DashboardSysAdmin from './dashboards/DashboardSysAdmin';
import SysadReports from './dashboards/SysadNav/SysadReports';
import SysadUserManagement from './dashboards/SysadNav/SysadUserManagement';
import SysadActivityTracking from './dashboards/SysadNav/SysadActivityTracking';
//AdminNav
import DashboardAdmin from './dashboards/DashboardAdmin';
import WorkOrder from './dashboards/AdminNav/WorkOrder';
import Vehicle from './dashboards/AdminNav/Vehicle';
import Facility from './dashboards/AdminNav/Facility';
import Reports from './dashboards/AdminNav/Reports';
import ActivityTracking from './dashboards/AdminNav/ActivityTracking';
import UserManagement from './dashboards/AdminNav/UserManagement';




function App() {
  return (
    <Router>
      <Routes>
        {/* Public Pages */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<Signup />} />

      
                                              {/* Standard User*/}
        <Route path="/dashboard-user" element={<DashboardUser />} />

                                               {/* Personnel*/}
      {/* Personnel - Change to separate routes */}
        <Route path="/dashboard-personnel" element={<DashboardPersonnel />} />
        <Route path="/dashboard-personnel/profile" element={<Profile role="personnel" />} />
        <Route path="/dashboard-personnel/notification" element={<Notification role="personnel" />} />
        <Route path="/dashboard-personnel/Assets" element={<Assets />} />
        
                                                {/* Admin official*/}
        <Route path="/dashboard-admin" element={<DashboardAdmin />} />
        <Route path="/dashboard-admin/profile" element={<Profile role="admin" />} />
        <Route path="/dashboard-admin/notification" element={<Notification role="admin" />} />
        <Route path="/dashboard-admin/WorkOrder" element={<WorkOrder />} />
        <Route path="/dashboard-admin/ActivityTracking" element={<ActivityTracking />} />
        <Route path="/dashboard-admin/Facility" element={<Facility />} />
        <Route path="/dashboard-admin/Reports" element={<Reports />} />
        <Route path="/dashboard-admin/Vehicle" element={<Vehicle/>} />
        <Route path="/dashboard-admin/UserManagement" element={<UserManagement/>} />

                                        
                                                {/*SysAdmin*/}
        <Route path="/dashboard-sysadmin" element={<DashboardSysAdmin />} />
        <Route path="/dashboard-sysadmin/profile" element={<Profile role="sysadmin" />} />
        <Route path="/dashboard-sysadmin/notification" element={<Notification role="sysadmin" />} />
        <Route path="/dashboard-sysadmin/SysadUserManagement" element={<SysadUserManagement/>} />
        <Route path="/dashboard-sysadmin/SysadReports" element={<SysadReports/>} />
        <Route path="/dashboard-sysadmin/SysadActivityTracking" element={<SysadActivityTracking/>} />

                                                {/* Re-used for all users*/}
        <Route path="/profile" element={<Profile />} />
        <Route path="/notification" element={<Notification />} />
        
      </Routes>
      
    </Router>
  );
}

export default App;