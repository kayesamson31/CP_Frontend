import React from 'react';
import { Col} from 'react-bootstrap';
import SidebarLayout from '../Layouts/SidebarLayout';

export default function DashboardAdmin() {
  return (
        <SidebarLayout role="admin">
        {/* Main Content */}
        <Col md={10} className="p-4">
          <h3>Work Order Management</h3>
          <p>Approve, reject, or manage work orders here.</p>

          <h3>Reservation Management</h3>
          <p>Vehicle & Facility reservations overview.</p>

          <h3>User Management</h3>
          <p>View and manage system users.</p>

          <h3>Reports</h3>
          <p>Operational reports overview.</p>
        </Col>
          </SidebarLayout>
      
  );
}