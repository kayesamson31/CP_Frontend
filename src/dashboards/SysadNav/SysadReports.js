// src/components/SysadReports.js

import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function SysadReports() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('monthly');
  const [loading, setLoading] = useState(false);

  // Sample data - replace with actual API calls
  const [reportData, setReportData] = useState({
    organizations: 25,
    users: {
      total: 1247,
      admins: 12,
      personnel: 185,
      standard: 1050,
      active: 1180,
      inactive: 67
    },
    assets: {
      total: 8450,
      electrical: 2340,
      plumbing: 1250,
      furniture: 2890,
      equipment: 1970,
      operational: 7820,
      maintenance: 450,
      disposal: 180
    },
    uploads: {
      csvUploads: 45,
      apiUploads: 128,
      lastUpload: '2025-08-25',
      totalRecords: 5670
    },
    activity: {
      dailyLogins: 234,
      weeklyLogins: 1456,
      monthlyLogins: 5680,
      recentActions: [
        { user: 'admin@system.com', action: 'Bulk upload - 150 users', timestamp: '2025-08-27 10:30:00' },
        { user: 'admin2@system.com', action: 'Deactivated user: john.doe@org.com', timestamp: '2025-08-27 09:15:00' },
        { user: 'admin@system.com', action: 'CSV upload - 75 assets', timestamp: '2025-08-26 16:45:00' },
        { user: 'superadmin@system.com', action: 'System settings updated', timestamp: '2025-08-26 14:20:00' }
      ]
    }
  });

  const handleExport = (format, dataType) => {
    setLoading(true);
    // Simulate export process
    setTimeout(() => {
      console.log(`Exporting ${dataType} as ${format}`);
      // Here you would implement actual export logic
      alert(`${dataType} exported as ${format} successfully!`);
      setLoading(false);
    }, 1500);
  };

  const StatCard = ({ title, value, subtitle, icon, color = 'primary' }) => (
    <div className="col-md-3 mb-3">
      <div className={`card border-${color} h-100`}>
        <div className="card-body text-center">
          <div className={`text-${color} mb-2`}>
            <i className={`fas fa-${icon} fa-2x`}></i>
          </div>
          <h4 className={`card-title text-${color}`}>{value}</h4>
          <p className="card-text">{title}</p>
          {subtitle && <small className="text-muted">{subtitle}</small>}
        </div>
      </div>
    </div>
  );

  const ExportButtons = ({ dataType }) => (
    <div className="mb-3">
      <div className="btn-group" role="group">
        <button 
          className="btn btn-outline-success btn-sm"
          onClick={() => handleExport('CSV', dataType)}
          disabled={loading}
        >
          <i className="fas fa-file-csv me-1"></i>
          Export CSV
        </button>
        <button 
          className="btn btn-outline-danger btn-sm"
          onClick={() => handleExport('PDF', dataType)}
          disabled={loading}
        >
          <i className="fas fa-file-pdf me-1"></i>
          Export PDF
        </button>
        <button 
          className="btn btn-outline-secondary btn-sm"
          onClick={() => handleExport('Print', dataType)}
          disabled={loading}
        >
          <i className="fas fa-print me-1"></i>
          Print
        </button>
      </div>
    </div>
  );

  const renderOverviewTab = () => (
    <div>
      <div className="row mb-4">
        <StatCard 
          title="Organizations Registered" 
          value={reportData.organizations} 
          icon="building" 
          color="primary"
        />
        <StatCard 
          title="Total Users" 
          value={reportData.users.total} 
          subtitle={`${reportData.users.active} active`}
          icon="users" 
          color="success"
        />
        <StatCard 
          title="Total Assets" 
          value={reportData.assets.total} 
          subtitle={`${reportData.assets.operational} operational`}
          icon="boxes" 
          color="info"
        />
        <StatCard 
          title="Upload Records" 
          value={reportData.uploads.totalRecords} 
          subtitle={`Last: ${reportData.uploads.lastUpload}`}
          icon="upload" 
          color="warning"
        />
      </div>

      <div className="row">
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">User Distribution</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-4">
                  <h5 className="text-danger">{reportData.users.admins}</h5>
                  <small>Admins</small>
                </div>
                <div className="col-4">
                  <h5 className="text-warning">{reportData.users.personnel}</h5>
                  <small>Personnel</small>
                </div>
                <div className="col-4">
                  <h5 className="text-info">{reportData.users.standard}</h5>
                  <small>Standard</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card mb-3">
            <div className="card-header">
              <h6 className="mb-0">Recent Activity</h6>
            </div>
            <div className="card-body">
              <div className="list-group list-group-flush">
                {reportData.activity.recentActions.slice(0, 3).map((action, index) => (
                  <div key={index} className="list-group-item px-0 py-2">
                    <div className="d-flex justify-content-between">
                      <small className="text-muted">{action.user}</small>
                      <small className="text-muted">{action.timestamp.split(' ')[1]}</small>
                    </div>
                    <div className="mt-1">
                      <small>{action.action}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUserReports = () => (
    <div>
      <ExportButtons dataType="User Reports" />
      
      <div className="row mb-4">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">User Statistics</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>User Type</th>
                      <th>Count</th>
                      <th>Percentage</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><span className="badge bg-danger">Admin Officials</span></td>
                      <td>{reportData.users.admins}</td>
                      <td>{((reportData.users.admins / reportData.users.total) * 100).toFixed(1)}%</td>
                      <td><span className="badge bg-success">Active</span></td>
                    </tr>
                    <tr>
                      <td><span className="badge bg-warning">Personnel</span></td>
                      <td>{reportData.users.personnel}</td>
                      <td>{((reportData.users.personnel / reportData.users.total) * 100).toFixed(1)}%</td>
                      <td><span className="badge bg-success">Active</span></td>
                    </tr>
                    <tr>
                      <td><span className="badge bg-info">Standard Users</span></td>
                      <td>{reportData.users.standard}</td>
                      <td>{((reportData.users.standard / reportData.users.total) * 100).toFixed(1)}%</td>
                      <td><span className="badge bg-success">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">User Status</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-6">
                  <h4 className="text-success">{reportData.users.active}</h4>
                  <small>Active Users</small>
                </div>
                <div className="col-6">
                  <h4 className="text-danger">{reportData.users.inactive}</h4>
                  <small>Inactive Users</small>
                </div>
              </div>
              <div className="mt-3">
                <div className="progress">
                  <div 
                    className="progress-bar bg-success" 
                    style={{ width: `${(reportData.users.active / reportData.users.total) * 100}%` }}
                  ></div>
                </div>
                <small className="text-muted">
                  {((reportData.users.active / reportData.users.total) * 100).toFixed(1)}% Active Rate
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAssetReports = () => (
    <div>
      <ExportButtons dataType="Asset Reports" />
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Assets by Category</h6>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-sm">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th>Count</th>
                      <th>Percentage</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td><i className="fas fa-bolt text-warning me-2"></i>Electrical</td>
                      <td>{reportData.assets.electrical}</td>
                      <td>{((reportData.assets.electrical / reportData.assets.total) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td><i className="fas fa-tint text-info me-2"></i>Plumbing</td>
                      <td>{reportData.assets.plumbing}</td>
                      <td>{((reportData.assets.plumbing / reportData.assets.total) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td><i className="fas fa-chair text-secondary me-2"></i>Furniture</td>
                      <td>{reportData.assets.furniture}</td>
                      <td>{((reportData.assets.furniture / reportData.assets.total) * 100).toFixed(1)}%</td>
                    </tr>
                    <tr>
                      <td><i className="fas fa-cogs text-primary me-2"></i>Equipment</td>
                      <td>{reportData.assets.equipment}</td>
                      <td>{((reportData.assets.equipment / reportData.assets.total) * 100).toFixed(1)}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Assets by Status</h6>
            </div>
            <div className="card-body">
              <div className="row text-center mb-3">
                <div className="col-4">
                  <h5 className="text-success">{reportData.assets.operational}</h5>
                  <small>Operational</small>
                </div>
                <div className="col-4">
                  <h5 className="text-warning">{reportData.assets.maintenance}</h5>
                  <small>Maintenance</small>
                </div>
                <div className="col-4">
                  <h5 className="text-danger">{reportData.assets.disposal}</h5>
                  <small>For Disposal</small>
                </div>
              </div>
              <div className="alert alert-info">
                <small>
                  <i className="fas fa-info-circle me-1"></i>
                  {reportData.assets.maintenance + reportData.assets.disposal} assets need attention
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystemUsage = () => (
    <div>
      <ExportButtons dataType="System Usage Reports" />
      
      <div className="row mb-4">
        <div className="col-md-4">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Login Activity</h6>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-12 mb-2">
                  <h4 className="text-primary">{reportData.activity.dailyLogins}</h4>
                  <small>Today</small>
                </div>
                <div className="col-6">
                  <h6 className="text-info">{reportData.activity.weeklyLogins}</h6>
                  <small>This Week</small>
                </div>
                <div className="col-6">
                  <h6 className="text-success">{reportData.activity.monthlyLogins}</h6>
                  <small>This Month</small>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h6 className="mb-0">Upload Statistics</h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <i className="fas fa-file-csv text-success fa-2x mb-2"></i>
                      <h5>{reportData.uploads.csvUploads}</h5>
                      <small>CSV Uploads</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body text-center">
                      <i className="fas fa-cloud-upload-alt text-primary fa-2x mb-2"></i>
                      <h5>{reportData.uploads.apiUploads}</h5>
                      <small>API Uploads</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );



  return (
    <SidebarLayout role="sysadmin">
      <div>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3><i className="fas fa-chart-bar me-2"></i>System Reports</h3>
          {loading && (
            <div className="spinner-border spinner-border-sm text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'overview' ? 'active' : ''}`}
              onClick={() => setActiveTab('overview')}
            >
              <i className="fas fa-tachometer-alt me-1"></i>
              Overview
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
              onClick={() => setActiveTab('users')}
            >
              <i className="fas fa-users me-1"></i>
              User Reports
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              <i className="fas fa-boxes me-1"></i>
              Asset Reports
            </button>
          </li>
          <li className="nav-item">
            <button 
              className={`nav-link ${activeTab === 'usage' ? 'active' : ''}`}
              onClick={() => setActiveTab('usage')}
            >
              <i className="fas fa-chart-line me-1"></i>
              System Usage
            </button>
          </li>

        </ul>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'users' && renderUserReports()}
          {activeTab === 'assets' && renderAssetReports()}
          {activeTab === 'usage' && renderSystemUsage()}
        </div>
      </div>
    </SidebarLayout>
  );
}