import React from 'react';

function Footer() {
  return (
    <footer>
           < section id="ContactUs" style={{
        borderTop: '0.5px solid #11325FFF',
       background: '#11325FFF',
        color: 'white',
        padding: '0.5rem 0 2rem',
        textAlign: 'right'
      }}>
        <div style={{
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 2rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap', // for responsiveness
    fontSize: '0.9rem'
  }}>
    {/* Left content */}
    <div>
      <p><b>Contact Us</b></p>
      <p>Email: support@openfms.com</p>
      <p>Phone: +63 917 123 4567</p>
      
    </div>

    {/* Right content */}
    <div style={{ textAlign: 'right' }}>
      <p>&copy; 2025 OpenFMS. All rights reserved.</p>
      <p>Terms | Privacy Policy</p>
    </div>
  </div>
      </section>
    </footer>
  );
}

export default Footer;
