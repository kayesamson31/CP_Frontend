import React from 'react';
import { Link } from 'react-router-dom';
import OpenFMSLogo from './assets/OpenFMSLogo.png'

function Header() {
  return (
  <header style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
    padding: '1rem 0',
    zIndex: 1000
      }}>

  <div style={{
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0 2rem'
        }}>

  <Link to="/" style={{ 
   textDecoration: 'none',
   display: 'flex',
   alignItems: 'center',
   gap: '0.5rem',
   height: '40px'
        }}>

  <div style={{
   fontSize: '1.5rem',
   fontWeight: '700',
   color: '#1a1a1a',
   display: 'flex',
   alignItems: 'center',
   gap: '0.5rem'
        }}>

  <img 
   src={OpenFMSLogo} 
   alt="OpenFMS Logo" 
   style={{ height: '100px', objectFit: 'contain' }} 
  />

  </div>
  </Link>

  <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
   <a href="#features" style={{
    textDecoration: 'none',
    color: '#4a5568',
    fontWeight: '500',
    transition: 'color 0.3s ease'
            }}>Features</a>

  <a href="#AboutUs" style={{
   textDecoration: 'none',
   color: '#4a5568',
   fontWeight: '500',
   transition: 'color 0.3s ease'
            }}>About</a>

  <a href="#ContactUs" style={{
   textDecoration: 'none',
   color: '#4a5568',
   fontWeight: '500',
   transition: 'color 0.3s ease'
            }}>Contact Us</a>

  <Link to="/login" style={{ textDecoration: 'none' }}>
  <button style={{
   background: 'linear-gradient(135deg, #F9F9F9FF 0%, #FFFFFFFF 100%)',
   color: '#1B4B8F',
   border: 'none',
   padding: '0.60rem 1rem',
   borderRadius: '8px',
   fontWeight: '600',
   cursor: 'pointer',
   transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            
  onMouseOver={(e) => {
   e.target.style.transform = 'translateY(-2px)';
   e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
            }}
  onMouseOut={(e) => {
   e.target.style.transform = 'translateY(0)';
   e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}>
              Log in
            </button>
            </Link>

  <Link to="/signup">
  <button style={{
    background: 'linear-gradient(135deg, #1B4B8F 0%, #1B4B8F 100%)',
    color: 'white',
    border: 'none',
    padding: '0.60rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
            }}
            
  onMouseOver={(e) => {
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.6)';
            }}

  onMouseOut={(e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
            }}>
              Sign Up
        </button>
        </Link>
        </div>
        </div> 
    </header>
  );
}

export default Header;
