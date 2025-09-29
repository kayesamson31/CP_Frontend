import React from 'react';
import Header from './Header';
import Footer from './Footer';

// Gumagawa tayo ng Layout component
// Ginagamit niya ang "children" prop para ilagay kung ano man ang laman ng page
function Layout({ children }) {
  return (
    <>
      <Header />
      <main>{children}</main>
      <Footer />
    </>
  );
}

export default Layout;
