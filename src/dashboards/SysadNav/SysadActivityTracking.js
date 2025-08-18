// src/components/SysadActivityTracking.js

import SidebarLayout from '../../Layouts/SidebarLayout';

export default function SysadActivityTracking() {
  return (
    <SidebarLayout role="sysadmin">
      <div>
        <h3>Activityyyy TRacking</h3>
        <div className="mb-4">
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
          </div>
        </div>
        <div>
          <h5>Page Under Develop</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Activityyy Tracking</li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Activity Trackings</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}