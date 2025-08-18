// src/components/ActivityTracking.js
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function Activity() {
  return (
    <SidebarLayout role="admin">
      <div>
        <h3>WorkOrder</h3>
        <div className="mb-4">
          <div className="bg-light p-4 mb-3" style={{ borderRadius: '8px' }}>
          </div>
        </div>
        <div>
          <h5>Page Under Develop</h5>
          <ul className="list-unstyled">
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>Asset maintenance scheduled</li>
            <li className="mb-2 p-2 bg-light" style={{ borderRadius: '5px' }}>New equipment added</li>
          </ul>
        </div>
      </div>
    </SidebarLayout>
  );
}

