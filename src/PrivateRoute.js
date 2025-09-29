import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom'; // para sa redirecting ng users
import { supabase } from './supabaseClient'; // connection kay Supabase

// PrivateRoute component
// children = yung laman/page na gusto mong i-protect
// allowedRoles = list ng roles na pwedeng maka-access

const PrivateRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirect, setRedirect] = useState('/login');

  useEffect(() => {
    const checkAuth = async () => {
      console.log('PrivateRoute: Checking Supabase authentication...');

      // Kunin ang session (logged in user info) galing kay Supabase
      const { data: { session } } = await supabase.auth.getSession();

          // Kung walang session (hindi naka-login), redirect to login
      if (!session?.user) {
        console.log('PrivateRoute: No Supabase session found, redirecting to login');
        setRedirect('/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      console.log('PrivateRoute: Supabase session found for:', session.user.email);

      // Kunin ang role at status ng user mula sa "users" table sa database
      const { data: userData, error } = await supabase
        .from('users')
        .select('role_id, user_status')
        .eq('auth_uid', session.user.id)  // hahanapin gamit yung auth UID
        .single();

      // Kung walang user data sa DB o may error
      if (error || !userData) {
        console.log('PrivateRoute: User data not found in database:', error);
        setRedirect('/login');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // Convert role_id (number) into readable role string
      let userRole = '';
      switch(userData.role_id) {
        case 1: userRole = 'sysadmin'; break;
        case 2: userRole = 'admin'; break;
        case 3: userRole = 'personnel'; break;
        case 4: userRole = 'standard'; break;
        default: userRole = 'standard';
      }

      console.log('PrivateRoute: User role:', userRole, 'Required roles:', allowedRoles);
      
      // Check kung pasok yung role ng user sa allowedRoles
      if (allowedRoles && !allowedRoles.includes(userRole)) {
        console.log('PrivateRoute: Role not authorized');
        setRedirect('/unauthorized'); // redirect sa unauthorized page
        setAuthorized(false);
      } else {
        console.log('PrivateRoute: Authorization successful');
        setAuthorized(true);  // allow access
      }
      
      setLoading(false);  // tapos na ang checking
    };

    checkAuth();  // tawagin yung function pag-load ng component
  }, [allowedRoles]);

   // Habang chine-check pa yung authentication/authorization
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
  
  // Kung hindi authorized, redirect sa tamang page (login o unauthorized)
  if (!authorized) {
    console.log('PrivateRoute: Redirecting to:', redirect);
    return <Navigate to={redirect} replace />;
  }
  
   // Kung authorized, ibabalik yung children
  return children;
};

export default PrivateRoute;