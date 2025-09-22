import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  try {
    const stored = localStorage.getItem('currentUser');
    if (!stored) {
      console.log('PrivateRoute: No currentUser in localStorage — redirecting to /login');
      return <Navigate to="/login" replace />;
    }

    const storedUser = JSON.parse(stored);

    if (!storedUser || !storedUser.role) {
      console.log('PrivateRoute: Invalid user in localStorage — redirecting to /login');
      return <Navigate to="/login" replace />;
    }

    // allowedRoles contains strings like 'admin', 'personnel', 'sysadmin', 'standard'
    if (allowedRoles && !allowedRoles.includes(storedUser.role)) {
      console.log(`PrivateRoute: Unauthorized — role ${storedUser.role} not in allowed ${allowedRoles}`);
      return <Navigate to="/unauthorized" replace />;
    }

    // Access granted
    return children;
  } catch (err) {
    console.error('PrivateRoute error reading localStorage:', err);
    return <Navigate to="/login" replace />;
  }
};

export default PrivateRoute;
