import React from 'react';
import {Link} from 'react-router-dom'; 
import LPimage from './assets/LPimage.png';
import WORicon from './assets/icons/worIcon.png';
import vehicleIcon from './assets/icons/VehicleIcon.png';
import NotifIcon from './assets/icons/NotificationIcon.png';
import FacilityIcon from './assets/icons/facility.png';
import assetIcon from './assets/icons/AssetIcon.png';
import ActIcon from './assets/icons/ActivityIcon.png';
import Layout from './Layout';


function LandingPage() {
  return (
    <Layout>
    <div style={{ fontFamily: "'Inter', 'Segoe UI', sans-serif", lineHeight: '1.6' }}>
    
      {/* Hero Section */}
      <section style={{
        background: 'linear-gradient(135deg, #3882CA 5%, #FFFFFFFF 50%)',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '80px'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '4rem',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: 'clamp(2.5rem, 5vw, 4rem)',
              fontWeight: '800',
              color: '#1a1a1a',
              marginBottom: '1.5rem',
              lineHeight: '1.1'
            }}>
              Track.<br />
              <span style={{ color: '#1B4B8F' }}>Reserve.</span><br />
              Maintain.
            </h1>
            <p style={{
              fontSize: '1.25rem',
              color: '#4a5568',
              marginBottom: '2rem',
              maxWidth: '500px'
            }}>
              OpenFMS provides a clear overview of all facility and vehicle activities, from work orders to reservations, helping you manage tasks efficiently.
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button style={{
                background: 'linear-gradient(135deg, #1B4B8F 0%, #1B4B8F 100%)',
                color: 'white',
                border: 'none',
                padding: '1rem 2rem',
                borderRadius: '12px',
                fontSize: '1.1rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                boxShadow: '0 8px 25px rgba(102, 126, 234, 0.4)'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-3px)';
                e.target.style.boxShadow = '0 12px 35px rgba(102, 126, 234, 0.6)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.4)';
              }}>
                Get Started
              </button>
              <a href="#AboutUs" style={{
                background: 'transparent',
                  color: '#1B4B8F',
                  border: '2px solid #1B4B8F',
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  fontSize: '1.1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
                onMouseOver={(e) => {
                  e.target.style.background = '#3882CA';
                  e.target.style.color = 'white';
                }}
                onMouseOut={(e) => {
                  e.target.style.background = 'transparent';
                  e.target.style.color = '#1B4B8F';
                }}>
                  Learn More
                </a>
            </div>
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img 
              src={LPimage} 
              alt="local Pic"
              style={{
                width: '100%',
                maxWidth: '600px',
                height: 'auto',
                borderRadius: '20px',
              }}
              onError={(e) => {
                e.target.style.display = 'flex';
                e.target.style.alignItems = 'center';
                e.target.style.justifyContent = 'center';
                e.target.style.color = 'white';
                e.target.style.fontSize = '1.2rem';
                e.target.style.fontWeight = '600';
              }}
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{
        padding: '6rem 0',
          background: 'linear-gradient(135deg, #B3D2EC 1%, #FFFFFFFF 14%)',
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
            <h2 style={{
              fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '1rem'
            }}>
              Key Features
            </h2>
            <p style={{
              fontSize: '1.2rem',
              color: '#1B4B8F',
              maxWidth: '600px',
              margin: '0 auto'
            }}>
              OpenFMS offers a comprehensive suite of tools designed to simplify your daily operations and enhance productivity.
            </p>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
            gap: '2rem'
          }}>
            {[
              {
                title: 'Work Order Management',
                description: 'Create, track, and manage work orders with ease, from request to completion.',
                color: '#667eea',
                icon: WORicon
              },
              {
                title: 'Facility Reservation',
                description: 'Monitor facility status, capacity, and manage reservations efficiently.',
                color: '#764ba2',
                icon: FacilityIcon
              
              },
              {
                title: 'Vehicle Reservation',
                description: 'Keep tabs on your vehicle fleet, maintenance schedules, and usage logs.',
                color: '#f093fb',
                icon: vehicleIcon
              },
              {
                title: 'Notification',
                description: 'Get real-time alerts for approvals, updates, and scheduled maintenance.',
                color: '#4facfe',
                icon: NotifIcon
              },
            {
                title: 'Asset management',
                description: 'Organize and otrack your physical assets, Location, status, and history all in a centralized database.',
                color: '#43e97b',
                icon: assetIcon
              },
              {
                title: 'Activity Tracking',
                description: ' Ensure accountability with user logs and audit trails across all actions in the system.',
                color: '#fa709a',
                icon: ActIcon
              }
            ].map((feature, index) => (
              <div key={index} style={{
                background: 'white',
                padding: '2.5rem',
                borderRadius: '16px',
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(0, 0, 0, 0.05)',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 20px 60px rgba(0, 0, 0, 0.15)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 40px rgba(0, 0, 0, 0.1)';
              }}>
                <div style={{
  width: '60px',
  height: '60px',
  background: `linear-gradient(135deg, ${feature.color} 0%, ${feature.color}aa 100%)`,
  borderRadius: '12px',
  marginBottom: '1.5rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}}>
  <img
    src={feature.icon}
    alt="feature icon"
    style={{
      width: '28px',
      height: '28px',
      objectFit: 'contain'
    }}
  />
</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: '600',
                  color: '#1a1a1a',
                  marginBottom: '1rem'
                }}>
                  {feature.title}
                </h3>
                <p style={{
                  color: '#4a5568',
                  fontSize: '1rem',
                  lineHeight: '1.6'
                }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      

      {/* Call to Action */}
      <section style={{
        background: 'linear-gradient(180deg, #FFFFFFFF 10%, #B3D2EC 100%)',
        padding: '6rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            color: '#1B4B8F',
            marginBottom: '1.5rem'
          }}>
            Ready to Transform Your Operations?
          </h2>
          <p style={{
            fontSize: '1.2rem',
            color: '#1B4B8F',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            margin: '0 auto 2.5rem'
          }}>
            Join countless businesses that are already benefiting from OpenFMS's intuitive and powerful management tools.
          </p>
          <button style={{
            background: 'white',
            color: '#1B4B8F',
            border: '2px solid #1B4B8F',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.2)'
          }}
          onMouseOver={(e) => {
            e.target.style.transform = 'translateY(-3px)';
            e.target.style.boxShadow = '0 12px 35px rgba(0, 0, 0, 0.3)';
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.2)';
          }}>
            Start Today
          </button>
        </div>
      </section>
{/* About Us*/}
      <section id="AboutUs" section style={{
        background: 'linear-gradient(180deg, #B3D2EC 3%, #3882CA 100%)',
        padding: '6rem 0',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 2rem'
        }}>
          <h2 style={{
            fontSize: 'clamp(2rem, 4vw, 3rem)',
            fontWeight: '700',
            color: '#1B4B8F',
            marginBottom: '1.5rem'
          }}>
            About Us
          </h2>
          <p style={{
            textAlign: 'justify',
            fontSize: '1rem',
            color: '#1B4B8F',
            marginBottom: '2.5rem',
            maxWidth: '600px',
            margin: '0 auto 2.5rem'
          }}>
            OpenFMS is a web-based Facilities Management System developed to help organizations digitize and streamline 
            their physical plant operations. Designed for schools, offices, parishes, and other institutions, 
            the system allows users to manage maintenance schedules, asset records, 
            work orders, and reservations in one place. Our goal is to make facility operations more organized, efficient, 
            and accessible, especially for organizations without dedicated management systems.
          </p>
          
        </div>
      </section>

    
    </div>
   </Layout>

   );
}

export default LandingPage;
