// Import React hooks and other dependencies
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Layout from './Layout';
import OpenFMSLogo from './assets/OpenFMSLogo.png';
import { supabase } from './supabaseClient'; 
import { PasswordUtils } from './utils/PasswordUtils';
import { AuditLogger } from './utils/AuditLogger';

function LoginPage() {
  // State for input fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
 // Navigation hook to redirect user after login
  const navigate = useNavigate();

 // Main login handler
const handleLogin = async (e) => {
  e.preventDefault(); // Prevent page reload on form submit

  try {
    console.log('Starting login for:', email.toLowerCase());

    //Check if user exists in database
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email.toLowerCase())
      .single();

      // If no user found, stop here
if (userError || !userData) {
  console.log('User not found in database:', userError);
  alert("Invalid email or password");
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  console.log('🔍 Current user from localStorage:', currentUser); // ADD THIS
  
  const ipAddress = await AuditLogger.getClientIP();
  console.log('🔍 IP Address:', ipAddress); // ADD THIS
  
  const logResult = await AuditLogger.log({
    userId: null,
    actionTaken: `Failed login attempt - User not found: ${email.toLowerCase()}`,
    tableAffected: 'users',
    recordId: 0,
    ipAddress: ipAddress,
    organizationId: currentUser?.organizationId || null
  });
  
  console.log('🔍 Audit log result:', logResult); // ADD THIS
  return;
}

    console.log('User found:', userData.full_name, 'Has auth_uid:', !!userData.auth_uid);

    // If user has auth_uid, use Supabase Auth
    if (userData.auth_uid) {
      console.log('User has auth_uid, using Supabase Auth...');
      
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase(),
        password: password,
      });
      
      // Step 3: If no auth_uid, verify password from database hash
      if (authError) {
        console.log('Supabase Auth failed:', authError);
        alert("Invalid email or password");
        return;
      }

      console.log('Supabase Auth successful');
      handleSuccessfulLogin(userData);
      return;
    }

    // User has no auth_uid - verify database password
    console.log('User has no auth_uid, checking database password...');
    
if (!PasswordUtils.verifyPassword(password, userData.password_hash)) {
  console.log('Database password verification failed');
  
  await AuditLogger.log({  // ✅ Use .log instead of .logWithIP for consistency
    userId: userData.user_id,
    actionTaken: 'Failed login attempt - Incorrect password',
    tableAffected: 'users',
    recordId: userData.user_id,
    ipAddress: await AuditLogger.getClientIP(),
    organizationId: userData.organization_id  // ✅ ADD THIS
  });
  
  alert("Invalid email or password");
  return;
}

    console.log('Database password verified, creating Supabase Auth account...');

    // If verified, create a Supabase Auth account for user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: email.toLowerCase(),
      password: password,
      options: {
        data: {
          full_name: userData.full_name,
          role_id: userData.role_id,
          organization_id: userData.organization_id
        }
      }
    });

    if (signUpError) {
      console.error('Auth account creation failed:', signUpError);
      
      if (signUpError.message?.includes('already registered')) {
        console.log('Account exists, trying to sign in...');
        
        const { data: existingAuth, error: existingError } = await supabase.auth.signInWithPassword({
          email: email.toLowerCase(),
          password: password
        });

        if (!existingError && existingAuth?.user) {
          await supabase
            .from('users')
            .update({ 
              auth_uid: existingAuth.user.id,
              user_status: 'active'
            })
            .eq('email', email.toLowerCase());

          handleSuccessfulLogin({...userData, auth_uid: existingAuth.user.id});
          return;
        }
      }
       // If already exists, try logging in instead
      alert("Failed to create authentication account. Please contact support.");
      return;
    }

    if (!signUpData?.user) {
      alert("Account creation failed. Please try again.");
      return;
    }

    // Update database with new auth_uid
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        auth_uid: signUpData.user.id,
        user_status: 'active'
      })
      .eq('email', email.toLowerCase());

    if (updateError) {
      console.error('Failed to link auth account:', updateError);
      alert("Failed to complete account setup. Please try again.");
      return;
    }

    // Sign in with newly created account
    const { data: finalAuth, error: finalError } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase(),
      password: password
    });

    if (finalError || !finalAuth?.user) {
      alert("Account created successfully. Please try logging in again.");
      return;
    }

    handleSuccessfulLogin({...userData, auth_uid: finalAuth.user.id, user_status: 'active'});

  } catch (error) {
    console.error('Login error:', error);
    alert("Login failed. Please try again.");
  }
};

// Keep your existing handleSuccessfulLogin logic or use this:
const handleSuccessfulLogin = async (userData) => {
  // Your existing user role and redirect logic here
  let userRole = "";
  switch (userData.role_id) {
    case 1: userRole = "sysadmin"; break;
    case 2: userRole = "admin"; break; 
    case 3: userRole = "personnel"; break;
    case 4: userRole = "standard"; break;
    default: userRole = "standard";
  }

  // Store session data
  localStorage.setItem('currentUser', JSON.stringify({
    id: userData.user_id,
    email: userData.email,
    name: userData.full_name,
    role: userData.role_id,
    organizationId: userData.organization_id,
    authUid: userData.auth_uid
  }));
// ✅ Log successful login
await AuditLogger.log({
  userId: userData.user_id,
  actionTaken: 'User logged in successfully',
  tableAffected: 'users',
  recordId: userData.user_id,
  ipAddress: await AuditLogger.getClientIP(),
  organizationId: userData.organization_id  // ✅ ADD THIS
});

  // Your existing redirect logic
if (userData.first_login === true) {
    await supabase
      .from('users')
      .update({ 
        user_status: 'active',
      })
      .eq('user_id', userData.user_id);
    alert("Welcome! Please change your temporary password to continue.");
    switch (userRole) {
      case "sysadmin": navigate("/dashboard-sysadmin/profile"); return;
      case "admin": navigate("/dashboard-admin/profile"); return;
      case "personnel": navigate("/dashboard-personnel/profile"); return;
      case "standard": navigate("/dashboard-user/profile"); return;
      default: navigate("/dashboard-user/profile"); return;
    }
  }

  if (userData.user_status !== 'active') {
    alert("Your account is not active. Please contact the administrator.");
    return;
  }

  switch (userRole) {
    case "sysadmin": navigate("/dashboard-sysadmin"); break;
    case "admin": navigate("/dashboard-admin"); break;
    case "personnel": navigate("/dashboard-personnel"); break;
    case "standard": navigate("/dashboard-user"); break;
    default: navigate("/dashboard-user");
  }
};


  return (
    <Layout>
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '110vh',
        background: 'linear-gradient(135deg, #FFFFFFFF 30%, #B0D0E6 100%)',
        fontFamily: "'Inter', sans-serif",
        padding: '1rem',
      }}>
        <form onSubmit={handleLogin} style={{
          background: 'white',
          padding: '3rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '550px',
          minHeight: '350px',
        }}>
        
        <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
          <img 
            src={OpenFMSLogo}
            alt="OpenFMS Logo"
            style={{ width: '130px', height: '75px' }}
          />
          <h2 style={{ color: '#555', fontSize: '1.5rem', marginTop: '0.2rem' }}>
            Welcome Back
          </h2>
        </div>

        <label style={{ fontWeight: '500', color: '#1B4B8F' }}>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          placeholder="your@email.com"
          style={{
            width: '100%',
            padding: '0.75rem',
            margin: '0.5rem 0 1rem',
            borderRadius: '10px',
            border: '1px solid #ccc',
            outline: 'none',
          }}
        />

        <label style={{ fontWeight: '500', color: '#1B4B8F' }}>Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          placeholder="Enter Password"
          style={{
            width: '100%',
            padding: '0.75rem',
            margin: '0.5rem 0 1rem',
            borderRadius: '10px',
            border: '1px solid #ccc',
            outline: 'none',
          }}
        />

        <button
          type="submit"
          style={{
            background: '#1B4B8F',
            color: 'white',
            width: '100%',
            padding: '0.75rem',
            border: 'none',
            borderRadius: '10px',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'background 0.3s ease',
            boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
          }}
          onMouseOver={(e) => e.target.style.background = '#3882CA'}
          onMouseOut={(e) => e.target.style.background = '#1B4B8F'}
        >
          Log In
        </button>

        <p style={{
          textAlign: 'center',
          marginTop: '1rem',
          fontSize: '0.7rem',
          color: '#1B4B8F',
          cursor: 'pointer',
        }}>
          Forgot your password?
        </p>
        
        </form>
      </div>
    </Layout>
  );
}

export default LoginPage;