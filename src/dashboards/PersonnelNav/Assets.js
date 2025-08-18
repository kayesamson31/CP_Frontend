// src/dashboards/PersonnelNav/Assets.js
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function Assets() {
  return (
    <SidebarLayout role="personnel">
      <div>
        <h3>Asset Management</h3>
        <div className="mb-4">
          <h5>Asset Overview</h5>
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
            <p>Track and manage all organizational assets</p>
          </div>
        </div>
        <div>
          <h5>Recent Asset Activities</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Asset maintenance scheduled</li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>New equipment added</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}