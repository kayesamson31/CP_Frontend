// src/components/FacilityRequest.js
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function FacilityRequest() {
  return (
    <SidebarLayout role="standard">
      <div>
        <h3>Facility Request</h3>
        <div className="mb-4">
          <h5>Request Facility here</h5>
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
            <p>Under Maintenance</p>
          </div>
        </div>
        <div>
          <h5>Under Maintenance</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Facility </li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Facility</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}