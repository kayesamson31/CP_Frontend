import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';

const PrivateRoute = ({ children, allowedRoles }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        console.log('PrivateRoute Auth Check:', {
          authUser: authUser ? 'Found' : 'Not found',
          authUserId: authUser?.id || 'None'
        });
        
        if (authUser) {
          // Get user role from localStorage (stored during login) 
          // OR query database for role if localStorage is empty
          let role = localStorage.getItem('userRole');
          
          if (!role) {
            // Fallback: Get role from database
            const { data: userData } = await supabase
              .from('users')
              .select('role_id')
              .eq('auth_uid', authUser.id)
              .single();
              
            if (userData) {
              switch (userData.role_id) {
                case 1: role = "sysadmin"; break;
                case 2: role = "admin"; break;
                case 3: role = "personnel"; break;
                case 4: role = "standard"; break;
                default: role = "standard";
              }
              localStorage.setItem('userRole', role);
            }
          }
          
          setUser(authUser);
          setUserRole(role);
          
          console.log('PrivateRoute User Found:', {
            userId: authUser.id,
            email: authUser.email,
            role: role,
            allowedRoles: allowedRoles
          });
        } else {
          console.log('PrivateRoute: No authenticated user found');
        }
        
        setLoading(false);
      } catch (error) {
        console.error('PrivateRoute auth check error:', error);
        setLoading(false);
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('PrivateRoute Auth State Changed:', event, session ? 'Session exists' : 'No session');
      
      if (event === 'SIGNED_OUT' || !session) {
        setUser(null);
        setUserRole(null);
        localStorage.removeItem('userRole');
      } else if (session?.user) {
        setUser(session.user);
        const role = localStorage.getItem('userRole');
        setUserRole(role);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        fontFamily: 'Arial, sans-serif'
      }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p style={{ marginTop: '1rem', color: '#666' }}>Checking authentication...</p>
      </div>
    );
  }

  if (!user) {
    console.log('PrivateRoute: Redirecting to login - no user');
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    console.log(`PrivateRoute: Unauthorized - User role: ${userRole}, Required: ${allowedRoles}`);
    return <Navigate to="/unauthorized" replace />;
  }

  console.log('PrivateRoute: Access granted');
  return children;
};

export default PrivateRoute;