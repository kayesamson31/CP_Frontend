import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; 
import Layout from './Layout';
import OpenFMSLogo from './assets/OpenFMSLogo.png';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('standard'); 
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Save sa localStorage yung email at name
    localStorage.setItem('userEmail', email);
    
    // For now, dummy name (later backend na magsesend ng real name)
    localStorage.setItem('userName', email.split('@')[0]);     localStorage.setItem('userRole', role); // <--- eto idagdag mo
        // redirect based on role
        if (role === 'standard') navigate('/dashboard-user');
        else if (role === 'personnel') navigate('/dashboard-personnel');
        else if (role === 'admin') navigate('/dashboard-admin');
        else if (role === 'sysadmin') navigate('/dashboard-sysadmin');
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

          <label style={{ fontWeight: '500', color: '#1B4B8F' }}>Select Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{
              width: '100%',
              padding: '0.75rem',
              margin: '0.5rem 0 1.5rem',
              borderRadius: '10px',
              border: '1px solid #ccc',
              outline: 'none',
            }}
          >
            <option value="standard">Standard User</option>
            <option value="personnel">Personnel</option>
            <option value="admin">Admin Official</option>
            <option value="sysadmin">System Administration</option>
          </select>

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
