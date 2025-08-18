// src/components/SysadUserManagement.js

import SidebarLayout from '../../Layouts/SidebarLayout';

export default function SysadUserManagement() {
  return (
    <SidebarLayout role="sysadmin">
      <div>
        <h3>Userrrr Managementt</h3>
        <div className="mb-4">
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
          </div>
        </div>
        <div>
          <h5>Page Under Develop</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>User Management</li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>User Management</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}