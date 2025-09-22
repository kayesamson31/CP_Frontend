import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirect, setRedirect] = useState('/login');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('PrivateRoute: Checking Supabase authentication...');
      
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) {
        console.log('PrivateRoute: No Supabase session found, redirecting to login');
        setRedirect('/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      console.log('PrivateRoute: Supabase session found for:', session.user.email);

      // Fetch role from users table
      const { data: userData, error } = await supabase
        .from('users')
        .select('role_id, user_status')
        .eq('auth_uid', session.user.id)
        .single();

      if (error || !userData) {
        console.log('PrivateRoute: User data not found in database:', error);
        setRedirect('/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      let userRole = '';
      switch(userData.role_id) {
        case 1: userRole = 'sysadmin'; break;
        case 2: userRole = 'admin'; break;
        case 3: userRole = 'personnel'; break;
        case 4: userRole = 'standard'; break;
        default: userRole = 'standard';
      }

      console.log('PrivateRoute: User role:', userRole, 'Required roles:', allowedRoles);

      if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log('PrivateRoute: Role not authorized');
        setRedirect('/unauthorized');
        setAuthorized(false);
      } else {
        console.log('PrivateRoute: Authorization successful');
        setAuthorized(true);
      }
      
      setLoading(false);
    };

    checkAuth();
  }, [allowedRoles]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    );
  }
  
  if (!authorized) {
    console.log('PrivateRoute: Redirecting to:', redirect);
    return <Navigate to={redirect} replace />;
  }
  
  return children;
};

export default PrivateRoute;