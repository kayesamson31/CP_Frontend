// src/components/SysadActivityTracking.js

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function SysadActivityTracking() {
  const [dateRange, setDateRange] = useState('today');
  const [actionFilter, setActionFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Sample activity data - replace with actual API calls
  const [activityData, setActivityData] = useState({
    totalActions: 1247,
    todayActions: 34,
    weekActions: 156,
    monthActions: 678,
    activities: [
      {
        id: 1,
        user: 'admin@system.com',
        userRole: 'Super Admin',
        action: 'Bulk upload - 150 users via CSV',
        category: 'User Management',
        timestamp: '2025-08-27 10:30:15',
        status: 'Success',
        details: 'Uploaded 150 new users from organizations_batch_27.csv'
      },
      {
        id: 2,
        user: 'admin2@system.com',
        userRole: 'Admin Official',
        action: 'Deactivated user: john.doe@org.com',
        category: 'User Management',
        timestamp: '2025-08-27 09:15:42',
        status: 'Success',
        details: 'User deactivated due to role change request'
      },
      {
        id: 3,
        user: 'admin@system.com',
        userRole: 'Super Admin',
        action: 'CSV upload - 75 assets',
        category: 'Asset Management',
        timestamp: '2025-08-26 16:45:30',
        status: 'Success',
        details: 'Asset batch upload: electrical_equipment_batch.csv'
      },
      {
        id: 4,
        user: 'superadmin@system.com',
        userRole: 'Super Admin',
        action: 'System settings updated',
        category: 'System Configuration',
        timestamp: '2025-08-26 14:20:18',
        status: 'Success',
        details: 'Updated backup schedule and notification settings'
      },
      {
        id: 5,
        user: 'admin3@system.com',
        userRole: 'Admin Official',
        action: 'API bulk import - Users',
        category: 'API Operations',
        timestamp: '2025-08-26 11:30:55',
        status: 'Partial',
        details: '245 users imported, 5 failed validation'
      },
      {
        id: 6,
        user: 'admin@system.com',
        userRole: 'Super Admin',
        action: 'Role changed: personnel@org.com to Admin',
        category: 'User Management',
        timestamp: '2025-08-26 10:15:22',
        status: 'Success',
        details: 'Promoted user from Personnel to Admin Official role'
       
      },
      {
        id: 7,
        user: 'admin2@system.com',
        userRole: 'Admin Official',
        action: 'Asset maintenance scheduled',
        category: 'Asset Management',
        timestamp: '2025-08-25 15:45:10',
        status: 'Success',
        details: 'Scheduled maintenance for 12 electrical assets'
      
      },
      {
        id: 8,
        user: 'superadmin@system.com',
        userRole: 'Super Admin',
        action: 'Database backup completed',
        category: 'System Maintenance',
        timestamp: '2025-08-25 02:00:00',
        status: 'Success',
        details: 'Automated daily backup completed successfully'
        
      },
      {
        id: 9,
        user: 'admin4@system.com',
        userRole: 'Admin Official',
        action: 'Login attempt - Failed',
        category: 'Security',
        timestamp: '2025-08-24 22:15:33',
        status: 'Failed',
        details: 'Failed login attempt - incorrect password (3rd attempt)'
       
      },
      {
        id: 10,
        user: 'admin@system.com',
        userRole: 'Super Admin',
        action: 'Organization registered',
        category: 'Organization Management',
        timestamp: '2025-08-24 14:30:45',
        status: 'Success',
        details: 'New organization: Barangay San Miguel registered'
    
      }
    ]
  });

  const getFilteredActivities = () => {
    return activityData.activities.filter(activity => {
      const matchesAction = actionFilter === 'all' || activity.category.toLowerCase().includes(actionFilter.toLowerCase());
      const matchesUser = userFilter === 'all' || activity.user === userFilter;
      return matchesAction && matchesUser;
    });
  };

  const getPaginatedActivities = () => {
    const filtered = getFilteredActivities();
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(getFilteredActivities().length / itemsPerPage);

  const getStatusBadge = (status) => {
    const badgeClass = {
      'Success': 'bg-success',
      'Failed': 'bg-danger',
      'Partial': 'bg-warning'
    };
    return `badge ${badgeClass[status] || 'bg-secondary'}`;
  };

  const getCategoryIcon = (category) => {
    const icons = {
      'User Management': 'fas fa-users',
      'Asset Management': 'fas fa-boxes',
      'System Configuration': 'fas fa-cogs',
      'API Operations': 'fas fa-cloud',
      'System Maintenance': 'fas fa-tools',
      'Security': 'fas fa-shield-alt',
      'Organization Management': 'fas fa-building'
    };
    return icons[category] || 'fas fa-info-circle';
  };

  const uniqueUsers = [...new Set(activityData.activities.map(a => a.user))];

  return (
    <SidebarLayout role="sysadmin">
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><i className="fas fa-history me-2"></i>Activity Tracking</h3>
          {loading && (
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
        </div>

       

        {/* Filters and Export */}
        <div className="card mb-4">
          <div className="card-header">
            <div className="row align-items-center">
              <div className="col-md-12">
                <h6 className="mb-0">Activity Filters</h6>
              </div>
            
            </div>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <label className="form-label">Date Range</label>
                <select 
                  className="form-select form-select-sm" 
                  value={dateRange} 
                  onChange={(e) => setDateRange(e.target.value)}
                >
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">Last 3 Months</option>
                  <option value="year">This Year</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Action Category</label>
                <select 
                  className="form-select form-select-sm" 
                  value={actionFilter} 
                  onChange={(e) => setActionFilter(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="user">User Management</option>
                  <option value="asset">Asset Management</option>
                  <option value="system">System Configuration</option>
                  <option value="api">API Operations</option>
                  <option value="security">Security</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">User</label>
                <select 
                  className="form-select form-select-sm" 
                  value={userFilter} 
                  onChange={(e) => setUserFilter(e.target.value)}
                >
                  <option value="all">All Users</option>
                  {uniqueUsers.map(user => (
                    <option key={user} value={user}>{user}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Search</label>
                <div className="input-group input-group-sm">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Search actions..."
                  />
                  <button className="btn btn-outline-secondary" type="button">
                    <i className="fas fa-search"></i>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Logs Table */}
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0">
              Activity Logs 
              <span className="badge bg-primary ms-2">{getFilteredActivities().length} records</span>
            </h6>
          </div>
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {getPaginatedActivities().map((activity) => (
                    <tr key={activity.id}>
                      <td>
                        <small className="text-muted">{activity.timestamp}</small>
                      </td>
                      <td>
                        <div>
                          <span className="badge bg-secondary">{activity.user}</span>
                          <br />
                          <small className="text-muted">{activity.userRole}</small>
                        </div>
                      </td>
                      <td>
                        <div>
                          <i className={`${getCategoryIcon(activity.category)} text-primary me-2`}></i>
                          {activity.action}
                        </div>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{activity.category}</span>
                      </td>
                      <td>
                        <span className={getStatusBadge(activity.status)}>{activity.status}</span>
                      </td>
                      <td>
                        <small className="text-muted">{activity.details}</small>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-between align-items-center mt-3">
                <small className="text-muted">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, getFilteredActivities().length)} of {getFilteredActivities().length} entries
                </small>
                <nav>
                  <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </button>
                    </li>
                    {[...Array(totalPages)].map((_, i) => (
                      <li key={i} className={`page-item ${currentPage === i + 1 ? 'active' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={() => setCurrentPage(i + 1)}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                      <button 
                        className="page-link" 
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>
    </SidebarLayout>
  );
}