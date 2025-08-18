import React from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function NotificationPersonnel() {
  return (
    <SidebarLayout userType="personnel">
      <div>
        <h3>Personnel Notifications</h3>
        <p>Personnel notifications and alerts...</p>
        {/* Add personnel-specific notification content */}
      </div>
    </SidebarLayout>
  );
}