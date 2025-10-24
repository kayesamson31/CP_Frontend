// System Administrator Reports - Enhanced with Visual Analytics
import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function SysadReports() {
// ✅ Set to last 30 days dynamically
const [dateFrom, setDateFrom] = useState(() => {
  const date = new Date();
  date.setDate(date.getDate() - 30);
  return date.toISOString().split('T')[0];
});
const [dateTo, setDateTo] = useState(() => {
  return new Date().toISOString().split('T')[0] + 'T23:59:59';
});
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [dateRange, setDateRange] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  const [systemSummary, setSystemSummary] = useState({
    successfulLogins: 0,
    passwordResets: 0,
    totalUsers: 0, 
  });
  const [securityEvents, setSecurityEvents] = useState([]);
  const [error, setError] = useState(null);

  // NEW: Chart data states
  const [loginTrendData, setLoginTrendData] = useState([]);
  const [eventTypeDistribution, setEventTypeDistribution] = useState([]);
  const [topRolesData, setTopRolesData] = useState([]);

  const COLORS = ['#198754', '#dc3545', '#ffc107', '#0dcaf0', '#6c757d'];

  const fetchReportsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser || !currentUser.organizationId) {
        throw new Error('Session expired. Please log in again.');
      }
// ✅ NEW: Fetch total users count
const { count: userCount, error: userError } = await supabase
  .from('users')
  .select('*', { count: 'exact', head: true })
  .eq('organization_id', currentUser.organizationId)
  .eq('user_status', 'active');

if (userError) console.error('Error fetching user count:', userError);
const { data: auditData, error: auditError } = await supabase
  .from('audit_logs')
  .select(`
    audit_id,
    action_taken,
    timestamp,
    ip_address,
    organization_id,
    users (
      full_name,
      email,
      roles (
        role_name
      )
    )
  `)
  .eq('organization_id', currentUser.organizationId)  // ✅ Filter by audit_logs.organization_id
  .gte('timestamp', dateFrom)
  .lte('timestamp', dateTo)
  .order('timestamp', { ascending: false });

      if (auditError) throw auditError;

const events = auditData
.filter(log => log.users !== null)
.map(log => ({
  
  id: log.audit_id,
  date: log.timestamp.split('T')[0],
  time: log.timestamp.split('T')[1]?.split('.')[0],
  eventType: determineEventType(log.action_taken),
  user: log.users?.email || 'System Action',  // ✅ Handle NULL users
  role: log.users?.roles?.role_name || 'System',  // ✅ Handle NULL roles
  ipAddress: log.ip_address || 'N/A',
  details: log.action_taken,
  status: 'Completed',
  created_at: log.timestamp
}));

     const summary = calculateSummaryFromEvents(events);
summary.totalUsers = userCount || 0;  // ✅ ADD: Set total users count
      
      // NEW: Generate chart data
      const trendData = generateLoginTrendData(events);
      const distributionData = generateEventDistribution(events);
     const topRoles = generateTopRolesData(events);  // ✅ CHANGE FROM generateTopUsersData

      setSecurityEvents(events);
      setSystemSummary(summary);
      setLoginTrendData(trendData);
      setEventTypeDistribution(distributionData);
 setTopRolesData(topRoles);  // ✅ CHANGE FROM setTopUsersData
      
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data. Please try again.');
setSystemSummary({
  successfulLogins: 0,
  passwordResets: 0,
  totalUsers: 0  // ✅ CHANGE
});
      setSecurityEvents([]);
      setLoginTrendData([]);
      setEventTypeDistribution([]);
      setTopRolesData([]);
    } finally {
      setIsLoading(false);
    }
  };

const determineEventType = (action) => {
  const actionLower = action.toLowerCase();
  
  // Login events - more flexible matching
  if (actionLower.includes('logged in') || 
      (actionLower.includes('login') && actionLower.includes('success'))) {
    return 'Successful Login';
  }
  
  if (actionLower.includes('failed login') || 
      actionLower.includes('incorrect password') ||
      (actionLower.includes('login') && actionLower.includes('failed'))) {
    return 'Failed Login';
  }
  
  if (actionLower.includes('logged out') || actionLower.includes('logout')) {
    return 'Logout';
  }
  
  // Password & Profile
  if (actionLower.includes('password')) {
    return 'Password Reset';
  }
  
  if (actionLower.includes('updated profile')) {
    return 'Profile Update';
  }
  
  // User Management
  if (actionLower.includes('created') && actionLower.includes('user')) {
    return 'User Created';
  }
  // Asset Management
  if (actionLower.includes('created') && actionLower.includes('asset')) {
    return 'Asset Created';
  }
  
  if (actionLower.includes('uploaded') && actionLower.includes('asset')) {
    return 'Asset Upload';
  }
  
  if (actionLower.includes('bulk') && actionLower.includes('asset')) {
    return 'Bulk Asset Upload';
  }
  if (actionLower.includes('updated') && actionLower.includes('user')) {
    return 'User Updated';
  }
  
  if (actionLower.includes('deleted') && actionLower.includes('user')) {
    return 'User Deleted';
  }
  
  // Security
  if (actionLower.includes('locked') || actionLower.includes('lockout')) {
    return 'Account Lockout';
  }
  
  if (actionLower.includes('suspicious')) {
    return 'Suspicious Login';
  }
  
  return 'System Activity';
};

const calculateSummaryFromEvents = (events) => {
const summary = {
  successfulLogins: 0,
  passwordResets: 0,
  totalUsers: 0,  // ✅ CHANGE: accountLockouts -> totalUsers
};

  events.forEach(event => {
    const eventType = event.eventType.toLowerCase();
    const details = event.details.toLowerCase();
    
    // More flexible matching
    if (eventType.includes('successful login') || eventType.includes('logout')) {
      summary.successfulLogins++;
    }
    else if (eventType.includes('password') || details.includes('password')) {
      summary.passwordResets++;
    }
 
  
  });

  return summary;
};

  // NEW: Generate login trend data (daily aggregation)
  const generateLoginTrendData = (events) => {
    const dateMap = {};
    
    events.forEach(event => {
      const date = event.date;
      if (!dateMap[date]) {
     dateMap[date] = { date, successful: 0 };
      }
      
      if (event.eventType.toLowerCase().includes('successful')) {
        dateMap[date].successful++;
      } 
    
    });

    return Object.values(dateMap).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  // NEW: Generate event type distribution
  const generateEventDistribution = (events) => {
    const typeCount = {};
    
    events.forEach(event => {
      const type = event.eventType;
      typeCount[type] = (typeCount[type] || 0) + 1;
    });

    return Object.entries(typeCount).map(([name, value]) => ({ name, value }));
  };

  // NEW: Generate top users with most events
// NEW: Generate top roles with most events (instead of users)
const generateTopRolesData = (events) => {
  const roleCount = {};
  
  events.forEach(event => {
    const role = event.role || 'Unknown';
    roleCount[role] = (roleCount[role] || 0) + 1;
  });

  return Object.entries(roleCount)
    .map(([role, count]) => ({ role, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
};

  const saveReportMetadata = async (reportType, fileUrl = null) => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      
      const { data, error } = await supabase
        .from('reports')
        .insert({
          report_type: reportType,
          title: `Security Report - ${dateFrom} to ${dateTo}`,
          generated_by: currentUser.userId,
          file_path: fileUrl,
          status: 'completed'
        });

      if (error) throw error;
      
      console.log('Report metadata saved:', data);
    } catch (err) {
      console.error('Error saving report metadata:', err);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [dateFrom, dateTo]);

  const filteredEvents = securityEvents.filter(event => {
    const eventDate = new Date(event.date || event.created_at);
    const fromDate = new Date(dateFrom);
    const toDate = new Date(dateTo);
    
    const dateMatch = eventDate >= fromDate && eventDate <= toDate;
    const typeMatch = eventTypeFilter === 'all' || 
      event.eventType.toLowerCase().includes(eventTypeFilter.toLowerCase());
    
    const searchMatch = searchTerm === '' || 
      (event.user || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.ipAddress || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.details || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.eventType || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    return dateMatch && typeMatch && searchMatch;
  });

  const exportReport = async (format) => {
    if (filteredEvents.length === 0) {
      alert('No data to export for the selected criteria.');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    
    if (format === 'csv') {
      const headers = ['Date', 'Time', 'Event Type', 'User', 'IP Address', 'Details', 'Status'];
      const rows = filteredEvents.map(event => [
        event.date,
        event.time,
        event.eventType,
        event.user,
        event.ipAddress,
        event.details,
        event.status
      ]);
      
      content = [
        ['System Administrator Security Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Period: ${dateFrom} to ${dateTo}`],
        [''],
        ['SUMMARY'],
        [`Successful Logins: ${systemSummary.successfulLogins}`],
        [`Password Resets: ${systemSummary.passwordResets}`],
       [`Total System Users: ${systemSummary.totalUsers}`],
        [''],
        ['SECURITY EVENTS'],
        headers,
        ...rows
      ].map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
    }
    
    const blob = new Blob([content], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `security_report_${timestamp}.${format}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    await saveReportMetadata(`security_${format}`, null);
  };

  const refreshData = () => {
    fetchReportsData();
  };

  const ViewDetailsModal = () => {
    if (!selectedEvent) return null;
    
    return (
      <div className="modal show d-block" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Security Event Details</h5>
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setSelectedEvent(null)}
              ></button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12">
                  <strong>Timestamp:</strong> {new Date(selectedEvent.created_at || `${selectedEvent.date} ${selectedEvent.time}`).toLocaleString()}
                </div>
                <div className="col-12">
                  <strong>Event Type:</strong> 
                  <strong className="ms-2">{selectedEvent.eventType}</strong>
                </div>
                <div className="col-12">
                  <strong>User:</strong> {selectedEvent.user}
                </div>
                <div className="col-12">
                  <strong>IP Address:</strong> {selectedEvent.ipAddress}
                </div>
                <div className="col-12">
                  <strong>Details:</strong> {selectedEvent.details}
                </div>
                <div className="col-12">
                  <strong>Status:</strong> 
                  <span className={`ms-2 badge ${
                    selectedEvent.status === 'Resolved' || selectedEvent.status === 'Completed' ? 'bg-success' :
                    selectedEvent.status === 'Under Review' ? 'bg-warning' :
                    'bg-secondary'
                  }`}>
                    {selectedEvent.status}
                  </span>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => setSelectedEvent(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <SidebarLayout role="sysadmin">
        <div className="d-flex justify-content-center align-items-center" style={{height: '400px'}}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status"></div>
            <div className="mt-2">Loading security reports...</div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="sysadmin">
      <div className="container-fluid">
{/* Header */}
<div className="row mb-4">
  <div className="col-12">
    <div className="d-flex justify-content-between align-items-center">
      <div>
        <h2 className="mb-1">System Administrator Reports</h2>
        <p className="text-muted mb-0">Security and system activity monitoring</p>
      </div>
<div className="d-flex gap-2 align-items-center">
  {/* Date Range Filter */}
  <select 
    className="form-select"
    value={dateRange}
    onChange={(e) => {
      const value = e.target.value;
      const today = new Date();
      let newDateFrom = '';
      let newDateTo = ''; 
      
  switch(value) {
    case 'today':
      newDateFrom = today.toISOString().split('T')[0];
      newDateTo = today.toISOString().split('T')[0] + 'T23:59:59';  // ✅ ADD END OF DAY
      break;
    case 'weekly':
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      newDateFrom = weekAgo.toISOString().split('T')[0];
      newDateTo = today.toISOString().split('T')[0] + 'T23:59:59';  // ✅ ADD END OF DAY
      break;
    case 'monthly':
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      newDateFrom = monthAgo.toISOString().split('T')[0];
      newDateTo = today.toISOString().split('T')[0] + 'T23:59:59';  // ✅ ADD END OF DAY
      break;
    case 'yearly':
      const yearAgo = new Date();
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);
      newDateFrom = yearAgo.toISOString().split('T')[0];
      newDateTo = today.toISOString().split('T')[0] + 'T23:59:59';  // ✅ ADD END OF DAY
      break;
    default:
      newDateFrom = '2024-01-01';
      newDateTo = today.toISOString().split('T')[0] + 'T23:59:59';  // ✅ ADD END OF DAY
  }
  
  setDateFrom(newDateFrom);
  setDateTo(newDateTo);  // ✅ USE NEW VARIABLE
  setDateRange(value);
}}
    style={{ minWidth: '150px' }}
  >
    <option value="today">Today</option>
    <option value="weekly">Last 7 Days</option>
    <option value="monthly">Last 30 Days</option>
    <option value="yearly">Last Year</option>
  </select>

<button 
  className="btn btn-success d-flex align-items-center gap-2"
  onClick={() => exportReport('csv')}
  disabled={securityEvents.length === 0}
  style={{ whiteSpace: 'nowrap' }}
>
  <i className="fas fa-file-csv"></i>
  Export CSV
</button>
</div>
    </div>
  </div>
</div>

        {/* Error Message */}
        {error && (
          <div className="row mb-4">
            <div className="col-12">
              <div className="alert alert-danger d-flex align-items-center" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
                <button 
                  className="btn btn-sm btn-outline-danger ms-auto"
                  onClick={refreshData}
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        )}

{/* Summary Cards */}
<div className="row mb-4">
  <div className="col-md-4">
    <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
      <div className="card-body text-center py-3">
        <div className="d-flex align-items-center justify-content-center mb-2">
          <i className="fas fa-check-circle text-success fs-5 me-1"></i>
          <h4 className="text-success mb-0">{systemSummary.successfulLogins.toLocaleString()}</h4>
        </div>
        <small className="text-muted">Successful Logins</small>
      </div>
    </div>
  </div>
  <div className="col-md-4">
    <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
      <div className="card-body text-center py-3">
        <div className="d-flex align-items-center justify-content-center mb-2">
          <i className="fas fa-key text-info fs-5 me-1"></i>
          <h4 className="text-info mb-0">{systemSummary.passwordResets.toLocaleString()}</h4>
        </div>
        <small className="text-muted">Password Resets</small>
      </div>
    </div>
  </div>
<div className="col-md-4">
  <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
    <div className="card-body text-center py-3">
      <div className="d-flex align-items-center justify-content-center mb-2">
        <i className="fas fa-users text-primary fs-5 me-1"></i>
        <h4 className="text-primary mb-0">{systemSummary.totalUsers.toLocaleString()}</h4>
      </div>
      <small className="text-muted">Total System Users</small>
    </div>
  </div>
</div>
</div>

        {/* NEW: Visual Analytics Section */}
        <div className="row mb-4">
          {/* Login Trends Chart */}
          <div className="col-md-6 mb-4">
            <div className="card border-2 h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">Login Trends Over Time</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={loginTrendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="successful" stroke="#198754" name="Successful" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Event Type Distribution */}
          <div className="col-md-6 mb-4">
            <div className="card border-2 h-100">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">Event Type Distribution</h5>
              </div>
              <div className="card-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={eventTypeDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {eventTypeDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Top Users by Activity */}
{/* Top Roles by Activity */}
<div className="col-12">
  <div className="card border-2">
    <div className="card-header bg-white border-0 py-3">
      <h5 className="mb-0">Top 5 Most Active User Roles</h5>  {/* ✅ CHANGE TITLE */}
    </div>
    <div className="card-body">
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={topRolesData}>  {/* ✅ CHANGE FROM topUsersData */}
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="role" />  {/* ✅ CHANGE FROM "user" */}
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#0d6efd" name="Total Events" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
</div>
        </div>

        <ViewDetailsModal />
      </div>
    </SidebarLayout>
  );
}