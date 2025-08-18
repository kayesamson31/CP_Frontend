// src/components/Facility.js
import React from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function Facility() {
  return (
    <SidebarLayout role="admin">
      <div>
        <h3>Facility</h3>
        <div className="mb-4">
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
          </div>
        </div>
        <div>
          <h5>Page Under Develop</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Facility</li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Facility</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}