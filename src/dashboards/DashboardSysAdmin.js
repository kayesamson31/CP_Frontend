import React from 'react';
import {Col } from 'react-bootstrap';
import SidebarLayout from '../Layouts/SidebarLayout';


export default function DashboardSysAdmin() {
  return (
    <SidebarLayout role="sysadmin">       
        {/* Main Content */}
        <Col md={10} className="p-4">
          <h3>System Health & Monitoring</h3>
          <p>Server load, uptime, and performance metrics.</p>

          <h3>User Roles & Permissions</h3>
          <p>Manage system-wide roles and access control.</p>

          <h3>System Logs</h3>
          <p>Track backend activities, errors, and changes.</p>

          <h3>Backend Configuration</h3>
          <p>API keys, integrations, and system settings.</p>
        </Col>
    </SidebarLayout>
  
  );
}