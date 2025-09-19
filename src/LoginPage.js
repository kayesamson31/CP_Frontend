import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Layout from './Layout';
import OpenFMSLogo from './assets/OpenFMSLogo.png';
import { supabase } from './supabaseClient'; 

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

const handleLogin = async (e) => {
  e.preventDefault();

  // Step 1: Supabase Auth login
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    alert(error.message);
    return;
  }

// Step 2: Get user role from your "users" table
const { data: userData, error: userError } = await supabase
  .from("users")
  .select("full_name, role_id")
  .eq("email", email)
  .single();

if (userError || !userData) {
  alert("User not found or role missing.");
  return;
}

// Step 3: Save in localStorage
localStorage.setItem("userEmail", email);
localStorage.setItem("userName", userData.full_name);

// Convert role_id → string role for consistency
let userRole = "";
switch (userData.role_id) {
  case 1: userRole = "sysadmin"; break;
  case 2: userRole = "admin"; break;
  case 3: userRole = "personnel"; break;
  case 4: userRole = "standard"; break;
  default: userRole = "standard";
}
localStorage.setItem("userRole", userRole);

// Step 4: Redirect based on role
switch (userRole) {
  case "sysadmin": navigate("/dashboard-sysadmin"); break;
  case "admin": navigate("/dashboard-admin"); break;
  case "personnel": navigate("/dashboard-personnel"); break;
  case "standard": navigate("/dashboard-user"); break;
  default: navigate("/dashboard-user");
}
};


    const handleGoogleSignIn = () => {
      alert('Google Sign-In Clicked (Mock only)');
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
          padding: '2rem',
          borderRadius: '16px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          width: '100%',
          maxWidth: '450px',
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
          
          <div style={{
            textAlign: 'center',
            margin: '1rem 0',
            color: '#999',
            fontSize: '0.85rem'
          }}>
            — or log in with google —
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'white',
              color: '#555',
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '0.65rem',
              width: '100%',
              marginBottom: '1.5rem',
              cursor: 'pointer',
              transition: '0.2s ease',
              fontWeight: '500'
            }}
            onMouseOver={(e) => e.target.style.background = '#f0f0f0'}
            onMouseOut={(e) => e.target.style.background = 'white'}
          >
            <img
              src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg"
              alt="Google"
              style={{ width: '20px', marginRight: '10px' }}
            />
            Sign in with Google
          </button>
        </form>
      </div>
    </Layout>
  );
}

export default LoginPage;
