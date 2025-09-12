// System Administrator Reports - Dynamic Data Implementation
import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
// Remove axios import since we're using mock data for now
// import axios from 'axios'; // Will be used later for real API calls

export default function SysadReports() {
  const [dateFrom, setDateFrom] = useState('2024-12-01');
  const [dateTo, setDateTo] = useState('2024-12-15');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // State for dynamic data
  const [systemSummary, setSystemSummary] = useState({
    successfulLogins: 0,
    failedLogins: 0,
    passwordResets: 0,
    accountLockouts: 0,
    suspiciousAttempts: 0
  });
  const [securityEvents, setSecurityEvents] = useState([]);
  const [error, setError] = useState(null);

  // Simulate API call with realistic data
  const fetchReportsData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate dynamic summary based on date range
      const daysDiff = Math.ceil((new Date(dateTo) - new Date(dateFrom)) / (1000 * 60 * 60 * 24));
      const baseMultiplier = Math.max(daysDiff, 1);
      
      // Realistic summary data that changes based on date range
      const mockSummaryData = {
        successfulLogins: Math.floor(150 * baseMultiplier + Math.random() * 100),
        failedLogins: Math.floor(12 * baseMultiplier + Math.random() * 20),
        passwordResets: Math.floor(3 * baseMultiplier + Math.random() * 5),
        accountLockouts: Math.floor(2 * baseMultiplier + Math.random() * 3),
        suspiciousAttempts: Math.floor(1 * baseMultiplier + Math.random() * 4)
      };

      // Generate realistic security events data
      const eventTypes = ['Failed Login', 'Successful Login', 'Account Lockout', 'Password Reset', 'Suspicious Login'];
      const users = [
        'john.doe@company.com',
        'jane.smith@company.com', 
        'admin.user@company.com',
        'test.account@company.com',
        'service.account@company.com',
        'mary.johnson@company.com',
        'bob.wilson@company.com',
        'sarah.brown@company.com'
      ];
      const ipAddresses = [
        '192.168.1.45', '10.0.0.23', '172.16.0.10', 
        '203.142.67.89', '192.168.1.100', '10.0.0.45',
        '172.16.0.25', '192.168.2.10'
      ];
      const statuses = ['Active', 'Resolved', 'Completed', 'Under Review'];
      
      const mockEventsData = [];
      const eventsCount = Math.min(50, Math.floor(20 * baseMultiplier));
      
      for (let i = 1; i <= eventsCount; i++) {
        const eventDate = new Date(dateFrom);
        eventDate.setDate(eventDate.getDate() + Math.floor(Math.random() * daysDiff));
        
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        const user = users[Math.floor(Math.random() * users.length)];
        const ip = ipAddresses[Math.floor(Math.random() * ipAddresses.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Generate realistic details based on event type
        let details = '';
        switch (eventType) {
          case 'Failed Login':
            details = `Multiple failed login attempts detected from ${ip}`;
            break;
          case 'Successful Login':
            details = `User successfully logged in from ${ip}`;
            break;
          case 'Account Lockout':
            details = `Account locked after ${Math.floor(Math.random() * 3) + 3} failed attempts`;
            break;
          case 'Password Reset':
            details = 'Password reset requested and completed successfully';
            break;
          case 'Suspicious Login':
            details = `Login from unusual location (${ip}) detected`;
            break;
          default:
            details = 'Security event logged';
        }
        
        mockEventsData.push({
          id: i,
          date: eventDate.toISOString().split('T')[0],
          time: `${String(Math.floor(Math.random() * 24)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
          eventType: eventType,
          user: user,
          ipAddress: ip,
          details: details,
          status: status,
          created_at: eventDate.toISOString()
        });
      }
      
      // Sort events by date (newest first)
      mockEventsData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // Update states with mock data
      setSystemSummary(mockSummaryData);
      setSecurityEvents(mockEventsData);
      
      // Simulate occasional API errors (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Simulated API error');
      }
      
    } catch (err) {
      console.error('Error fetching reports data:', err);
      setError('Failed to load reports data. Please try again.');
      
      // Fallback to empty data
      setSystemSummary({
        successfulLogins: 0,
        failedLogins: 0,
        passwordResets: 0,
        accountLockouts: 0,
        suspiciousAttempts: 0
      });
      setSecurityEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Alternative: Calculate summary from events data (for future use with real API)
  const calculateSummaryFromEvents = (events) => {
    const summary = {
      successfulLogins: 0,
      failedLogins: 0,
      passwordResets: 0,
      accountLockouts: 0,
      suspiciousAttempts: 0
    };

    events.forEach(event => {
      switch (event.eventType.toLowerCase()) {
        case 'successful login':
        case 'login success':
          summary.successfulLogins++;
          break;
        case 'failed login':
        case 'login failed':
          summary.failedLogins++;
          break;
        case 'password reset':
          summary.passwordResets++;
          break;
        case 'account lockout':
          summary.accountLockouts++;
          break;
        case 'suspicious login':
        case 'suspicious attempt':
          summary.suspiciousAttempts++;
          break;
        default:
          break;
      }
    });

    return summary;
  };

  // Fetch data on component mount and when date filters change
  useEffect(() => {
  fetchReportsData();
}, [dateFrom, dateTo]);

 const filteredEvents = securityEvents.filter(event => {
  const eventDate = new Date(event.date || event.created_at);
  const fromDate = new Date(dateFrom);
  const toDate = new Date(dateTo);
  
  const dateMatch = eventDate >= fromDate && eventDate <= toDate;
  const typeMatch = eventTypeFilter === 'all' || 
    event.eventType.toLowerCase().includes(eventTypeFilter.toLowerCase()) ||
    event.event_type?.toLowerCase().includes(eventTypeFilter.toLowerCase());
  
  // Add search functionality
  const searchMatch = searchTerm === '' || 
    (event.user || event.username || event.user_email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.ipAddress || event.ip_address || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.details || event.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (event.eventType || event.event_type || '').toLowerCase().includes(searchTerm.toLowerCase());
  
  return dateMatch && typeMatch && searchMatch;
});

  // Export function with real data
  const exportReport = (format) => {
    if (filteredEvents.length === 0) {
      alert('No data to export for the selected criteria.');
      return;
    }

    const timestamp = new Date().toISOString().split('T')[0];
    let content = '';
    
    if (format === 'csv') {
      const headers = ['Date', 'Time', 'Event Type', 'User', 'IP Address', 'Details', 'Status'];
      const rows = filteredEvents.map(event => [
        event.date || event.created_at?.split('T')[0],
        event.time || event.created_at?.split('T')[1]?.split('.')[0],
        event.eventType || event.event_type,
        event.user || event.username || event.user_email,
        event.ipAddress || event.ip_address,
        event.details || event.description,
        event.status
      ]);
      
      content = [
        ['System Administrator Security Report'],
        [`Generated: ${new Date().toLocaleString()}`],
        [`Period: ${dateFrom} to ${dateTo}`],
        [''],
        ['SUMMARY'],
        [`Successful Logins: ${systemSummary.successfulLogins}`],
        [`Failed Logins: ${systemSummary.failedLogins}`],
        [`Password Resets: ${systemSummary.passwordResets}`],
        [`Account Lockouts: ${systemSummary.accountLockouts}`],
        [`Suspicious Attempts: ${systemSummary.suspiciousAttempts}`],
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
  };

  // Refresh data manually
  const refreshData = () => {
    fetchReportsData();
  };

  // View details popup
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
                  <strong className="ms-2">{selectedEvent.eventType || selectedEvent.event_type}</strong>
                </div>
                <div className="col-12">
                  <strong>User:</strong> {selectedEvent.user || selectedEvent.username || selectedEvent.user_email}
                </div>
                <div className="col-12">
                  <strong>IP Address:</strong> {selectedEvent.ipAddress || selectedEvent.ip_address}
                </div>
                <div className="col-12">
                  <strong>Details:</strong> {selectedEvent.details || selectedEvent.description}
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
                <button 
                  className="btn btn-outline-success"
                  onClick={() => exportReport('csv')}
                  disabled={filteredEvents.length === 0}
                >
                  Export CSV
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={() => exportReport('pdf')}
                  disabled={filteredEvents.length === 0}
                >
                  Export PDF
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

        {/* System Reports Summary */}
        <div className="row mb-4">
          <div className="col">
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
          <div className="col">
            <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
              <div className="card-body text-center py-3">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-exclamation-triangle text-warning fs-5 me-1"></i>
                  <h4 className="text-warning mb-0">{systemSummary.failedLogins.toLocaleString()}</h4>
                </div>
                <small className="text-muted">Failed Logins</small>
              </div>
            </div>
          </div>
          <div className="col">
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
          <div className="col">
            <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
              <div className="card-body text-center py-3">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-lock text-danger fs-5 me-1"></i>
                  <h4 className="text-danger mb-0">{systemSummary.accountLockouts.toLocaleString()}</h4>
                </div>
                <small className="text-muted">Account Lockouts</small>
              </div>
            </div>
          </div>
          <div className="col">
            <div className="card border-2 h-100" style={{border: '4px solid #CACACCFF'}}>
              <div className="card-body text-center py-3">
                <div className="d-flex align-items-center justify-content-center mb-2">
                  <i className="fas fa-shield-alt text-danger fs-5 me-1"></i>
                  <h4 className="text-danger mb-0">{systemSummary.suspiciousAttempts.toLocaleString()}</h4>
                </div>
                <small className="text-muted">Suspicious Attempts</small>
              </div>
            </div>
          </div>
        </div>

      {/* Search and Filters */}
<div className="row mb-4">
  <div className="col-12">
    <div className="d-flex gap-3 align-items-end">
      <div className="flex-fill">
        <input 
          type="text" 
          className="form-control form-control-lg"
          placeholder="Search events by user, IP, or details..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            fontSize: '16px',
            padding: '12px 16px'
          }}
        />
      </div>
      <div style={{minWidth: '180px'}}>
        <select 
          className="form-select form-select-lg"
          value={eventTypeFilter}
          onChange={(e) => setEventTypeFilter(e.target.value)}
          style={{
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            fontSize: '16px',
            padding: '12px 16px'
          }}
        >
          <option value="all">All Events</option>
          <option value="failed">Failed Login</option>
          <option value="lockout">Account Lockout</option>
          <option value="reset">Password Reset</option>
          <option value="suspicious">Suspicious Login</option>
        </select>
      </div>
      <div style={{minWidth: '180px'}}>
        <select 
          className="form-select form-select-lg"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          style={{
            borderRadius: '8px',
            border: '1px solid #dee2e6',
            fontSize: '16px',
            padding: '12px 16px'
          }}
        >
          <option value="2024-12-01">Last 30 Days</option>
          <option value="2024-11-01">Last 60 Days</option>
          <option value="2024-10-01">Last 90 Days</option>
          <option value="2024-01-01">This Year</option>
        </select>
      </div>
    </div>
  </div>
</div>
        {/* Security Events Table */}
        <div className="row">
          <div className="col-12">
            <div className="card border-2">
              <div className="card-header bg-white border-0 py-3">
                <h5 className="mb-0">Security Events Summary</h5>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table table-hover">
                    <thead className="table-light">
                      <tr>
                        <th>Timestamp</th>
                        <th>Event Type</th>
                        <th>User</th>
                        <th>IP Address</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEvents.map((event) => (
                        <tr key={event.id}>
                         <td>
                        <small className="text-muted">
                          {new Date(event.created_at || `${event.date} ${event.time}`).toLocaleString()}
                        </small>
                      </td>
                         <td>
                          <strong>{event.eventType || event.event_type}</strong>
                        </td>
                          <td>{event.user || event.username || event.user_email}</td>
                          <td>{event.ipAddress || event.ip_address}</td>
                          <td>
                            <span className={`badge ${
                              event.status === 'Resolved' || event.status === 'Completed' ? 'bg-success' :
                              event.status === 'Under Review' ? 'bg-warning' :
                              'bg-secondary'
                            }`}>
                              {event.status}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => setSelectedEvent(event)}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {filteredEvents.length === 0 && !isLoading && (
                    <div className="text-center py-4">
                      <div className="text-muted">No security events found for the selected criteria.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* View Details Modal */}
        <ViewDetailsModal />
      </div>
    </SidebarLayout>
  );
}