import React from 'react';
import SidebarLayout from '../Layouts/SidebarLayout';

export default function DashboardPersonnel() {
  return (
    <SidebarLayout role="personnel">
      
      {/* Main Content */}
      <h3>Calendar (Placeholder)</h3>
      <div className="bg-light p-5 mb-3 text-center">Calendar API Integration Here</div>

      <h5>My Tasks</h5>
      <ul>
        <li>Task Example 1</li>
        <li>Task Example 2</li>
      </ul>
    </SidebarLayout>
  );
}
