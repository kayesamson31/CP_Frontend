import React from 'react';
import { Navigate } from 'react-router-dom';

const PrivateRoute = ({ children, allowedRoles }) => {
  const userRole = localStorage.getItem('userRole'); // from login
  const isLoggedIn = !!localStorage.getItem('userEmail');

  if (!isLoggedIn) {
    return <Navigate to="/" />; // not logged in
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/unauthorized" />; // wrong role
  }

  return children;
};

export default PrivateRoute;
