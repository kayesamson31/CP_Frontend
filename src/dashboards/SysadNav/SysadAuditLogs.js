// src/components/SystemAdminAuditLogs.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Card, Spinner, Alert, Dropdown, ButtonGroup } from "react-bootstrap";
import SidebarLayout from "../../Layouts/SidebarLayout";
import axios from 'axios';

// EXAMPLE HARDCODED DATA - Remove this when connecting to real API
const EXAMPLE_LOGS = [
  {
    id: 1,
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    user: "admin@dlsud.edu.ph",
    role: "System Administrator",
    category: "Security",
    actionTaken: "Failed login attempt detected from suspicious IP",
    severity: "Critical",
    ipAddress: "192.168.1.100",
    details: "Multiple failed login attempts (5) detected from IP address 192.168.1.100. Account temporarily locked for security.",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_abc123def456",
    beforeValue: { loginAttempts: 4, accountStatus: "active" },
    afterValue: { loginAttempts: 5, accountStatus: "locked" }
  },
  {
    id: 2,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    user: "maria.santos@dlsud.edu.ph",
    role: "Admin Official",
    category: "User Management",
    actionTaken: "Created new personnel account",
    severity: "Info",
    ipAddress: "192.168.1.50",
    details: "New personnel account created for Juan Dela Cruz (juan.delacruz@dlsud.edu.ph) with Personnel role.",
    userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
    sessionId: "sess_xyz789ghi012",
    beforeValue: null,
    afterValue: { 
      userId: "usr_456", 
      email: "juan.delacruz@dlsud.edu.ph", 
      role: "Personnel", 
      status: "active" 
    }
  },
  {
    id: 3,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
    user: "system.admin@dlsud.edu.ph",
    role: "System Administrator",
    category: "System Config",
    actionTaken: "Updated system configuration settings",
    severity: "Warning",
    ipAddress: "192.168.1.10",
    details: "Modified system backup retention policy from 30 days to 90 days. Previous configuration backed up automatically.",
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    sessionId: "sess_mno345pqr678",
    beforeValue: { backupRetentionDays: 30, autoBackup: true },
    afterValue: { backupRetentionDays: 90, autoBackup: true }
  },
  {
    id: 4,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    user: "external.auditor@pwc.com",
    role: "External Auditor",
    category: "Authentication",
    actionTaken: "Successful login from external network",
    severity: "Info",
    ipAddress: "203.177.12.45",
    details: "External auditor successfully authenticated for quarterly compliance review. VPN connection established.",
    userAgent: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
    sessionId: "sess_stu901vwx234",
    beforeValue: { lastLogin: "2024-08-15T10:30:00Z", loginCount: 15 },
    afterValue: { lastLogin: "2024-09-10T08:45:00Z", loginCount: 16 }
  },
  {
    id: 5,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(), // 8 hours ago
    user: "pedro.reyes@dlsud.edu.ph",
    role: "Personnel",
    category: "Role Management",
    actionTaken: "Role permission modification attempted",
    severity: "Critical",
    ipAddress: "192.168.1.75",
    details: "Personnel user attempted to modify their own role permissions. Action blocked by system security policy.",
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15",
    sessionId: "sess_yza567bcd890",
    beforeValue: { permissions: ["read", "create"], roleModifyAttempts: 0 },
    afterValue: { permissions: ["read", "create"], roleModifyAttempts: 1 }
  },
  {
    id: 6,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    user: "admin@dlsud.edu.ph",
    role: "System Administrator",
    category: "Security",
    actionTaken: "Database backup completed successfully",
    severity: "Info",
    ipAddress: "192.168.1.10",
    details: "Automated daily database backup completed. Backup file size: 2.4GB. Stored in encrypted cloud storage.",
    userAgent: "System/Automated",
    sessionId: "system_automated",
    beforeValue: { lastBackup: "2024-09-09T00:00:00Z", backupSize: "2.3GB" },
    afterValue: { lastBackup: "2024-09-10T00:00:00Z", backupSize: "2.4GB" }
  }
];

export default function SysadAuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLog, setSelectedLog] = useState(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage] = useState(50);

  // Debounce search
  const [searchDebounce, setSearchDebounce] = useState("");
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchDebounce(search);
      setCurrentPage(1); // Reset to first page on search
    }, 500);
    
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAuditLogs();
  }, [currentPage, searchDebounce, dateRange, roleFilter, severityFilter, categoryFilter]);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      // EXAMPLE: Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // EXAMPLE: Use hardcoded data instead of API call
      let filteredLogs = [...EXAMPLE_LOGS];

      // Apply filters to example data
      if (searchDebounce) {
        const searchLower = searchDebounce.toLowerCase();
        filteredLogs = filteredLogs.filter(log => 
          log.user.toLowerCase().includes(searchLower) ||
          log.actionTaken.toLowerCase().includes(searchLower) ||
          log.category.toLowerCase().includes(searchLower) ||
          (log.ipAddress && log.ipAddress.includes(searchLower))
        );
      }

      if (roleFilter && roleFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.role === roleFilter);
      }

      if (severityFilter && severityFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.severity === severityFilter);
      }

      if (categoryFilter && categoryFilter !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.category === categoryFilter);
      }

      // Date range filter
      if (dateRange && dateRange !== 'all') {
        const now = new Date();
        const daysBack = parseInt(dateRange);
        const filterDate = new Date(now.getTime() - (daysBack * 24 * 60 * 60 * 1000));
        filteredLogs = filteredLogs.filter(log => new Date(log.timestamp) >= filterDate);
      }

      // EXAMPLE: Simulate pagination
      const startIndex = (currentPage - 1) * recordsPerPage;
      const endIndex = startIndex + recordsPerPage;
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

      setLogs(paginatedLogs);
      setTotalPages(Math.ceil(filteredLogs.length / recordsPerPage));
      setTotalRecords(filteredLogs.length);

    } catch (err) {
      console.error('Error fetching audit logs:', err);
      setError(err.response?.data?.message || err.message || "Failed to fetch audit logs.");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filterType, value) => {
    switch (filterType) {
      case 'dateRange':
        setDateRange(value);
        break;
      case 'role':
        setRoleFilter(value);
        break;
      case 'severity':
        setSeverityFilter(value);
        break;
      case 'category':
        setCategoryFilter(value);
        break;
    }
    setCurrentPage(1); // Reset to first page on filter change
  };

  const exportLogs = async (format, exportType = 'all') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
      // EXAMPLE: Use filtered example data for export
      let exportData = [...EXAMPLE_LOGS];
      
      // Apply current filters to export data
      if (searchDebounce) {
        const searchLower = searchDebounce.toLowerCase();
        exportData = exportData.filter(log => 
          log.user.toLowerCase().includes(searchLower) ||
          log.actionTaken.toLowerCase().includes(searchLower) ||
          log.category.toLowerCase().includes(searchLower) ||
          (log.ipAddress && log.ipAddress.includes(searchLower))
        );
      }

      if (exportType === 'Critical-csv') {
        exportData = exportData.filter(log => log.severity === 'Critical');
      } else if (exportType === 'security-csv') {
        exportData = exportData.filter(log => log.category === 'Security');
      }

      if (format === 'csv') {
        // Generate CSV content from example data
        const csvContent = [
          'Timestamp,User,Role,Category,Action,Severity,IP Address,Details',
          ...exportData.map(log => [
            `"${new Date(log.timestamp).toLocaleString()}"`,
            `"${log.user}"`,
            `"${log.role}"`,
            `"${log.category}"`,
            `"${log.actionTaken}"`,
            `"${log.severity}"`,
            `"${log.ipAddress || 'N/A'}"`,
            `"${log.details}"`
          ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `audit-logs-${exportType}-${timestamp}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
      } else {
        alert(`Export to ${format.toUpperCase()} functionality will be implemented here`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export audit logs. Please try again.');
    }
  };

  const exportSingleLog = (log) => {
    const csvContent = [
      'Timestamp,User,Role,Category,Action,Severity,IP Address,Details',
      [
        `"${new Date(log.timestamp).toLocaleString()}"`,
        `"${log.user}"`,
        `"${log.role}"`,
        `"${log.category}"`,
        `"${log.actionTaken}"`,
        `"${log.severity}"`,
        `"${log.ipAddress || 'N/A'}"`,
        `"${log.details}"`
      ].join(',')
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-log-${log.id}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#dc3545';
      case 'Warning': return '#fd7e14';
      case 'Info': return '#198754';
      default: return '#6c757d';
    }
  };

  // Simplified Pagination component
  const Pagination = () => {
    return (
      <div className="d-flex justify-content-between align-items-center mt-3">
        <div className="text-muted">
          Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} entries
        </div>
        <div className="d-flex gap-2">
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(1)}
          >
            First
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            Previous
          </Button>
          <span className="px-3 py-2 bg-light rounded">
            {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            Next
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(totalPages)}
          >
            Last
          </Button>
        </div>
      </div>
    );
  };

  return ( 
    <SidebarLayout role="sysadmin">
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1 fw-bold">Audit Logs</h2>
            <p className="text-muted mb-0">
              Security and compliance monitoring - Real-time audit trail
            </p>
          </div>
         <div className="d-flex gap-2 align-items-center">
          <button 
            className="btn btn-outline-success"
            onClick={() => exportLogs('csv')}
            disabled={logs.length === 0}
          >
            Export CSV
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => exportLogs('pdf')}
            disabled={logs.length === 0}
          >
            Export PDF
          </button>
        </div>
        </div>

        {/* Filters */}
       {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-4">
            <Form.Control
              type="text"
              placeholder="Search by user, action, category, IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="col-md-2">
            <Form.Select
              value={severityFilter}
              onChange={(e) => handleFilterChange('severity', e.target.value)}
            >
              <option value="all">All Levels</option>
              <option value="Critical">Critical</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </Form.Select>
          </div>

          <div className="col-md-2">
            <Form.Select
              value={categoryFilter}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="Authentication">Authentication</option>
              <option value="User Management">User Management</option>
              <option value="Role Management">Role Management</option>
              <option value="System Config">System Config</option>
              <option value="Security">Security</option>
            </Form.Select>
          </div>
          
          <div className="col-md-2">
            <Form.Select
              value={roleFilter}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="System Administrator">System Administrator</option>
              <option value="Admin Official">Admin Official</option>
              <option value="Personnel">Personnel</option>
              <option value="External Auditor">External Auditor</option>
            </Form.Select>
          </div>

          <div className="col-md-2">
            <Form.Select
              value={dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
            >
              <option value="all">All Time</option>
              <option value="1">Last 24 Hours</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </Form.Select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading audit logs...</p>
          </div>
        )}

        {/* Error */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Empty State */}
        {!loading && logs.length === 0 && !error && (
          <Alert variant="Info" className="text-center">
            <h5>No Audit Logs Found</h5>
            <p className="mb-0">
              {search || dateRange !== 'all' || roleFilter !== 'all' || severityFilter !== 'all' || categoryFilter !== 'all'
                ? 'No audit events match your current filters.'
                : 'No audit events have been recorded yet.'
              }
            </p>
          </Alert>
        )}

         {/* Audit Logs Table */}
        {!loading && !error && logs.length > 0 && (
          <>
            <div className="bg-white rounded shadow-sm">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Timestamp</th>
                      <th>Severity</th>
                      <th>User</th>
                      <th>Role</th>
                      <th>Action</th>
                      <th>IP Address</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr
                        key={log.id}
                        style={{ cursor: "pointer" }}
                        onClick={() => setSelectedLog(log)}
                      >
                        <td>
                        <small className="text-muted">
                          {new Date(log.timestamp).toLocaleString()}
                        </small>
                      </td>
                        <td>
                          <span 
                            className="fw-bold small"
                            style={{ color: getSeverityColor(log.severity) }}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td>
                          <div className="fw-semibold" title={log.user}>
                            {log.user}
                          </div>
                        </td>
                        <td>
                          <div className="text-muted small" title={log.role}>
                            {log.role}
                          </div>
                        </td>
                        <td>
                          <div title={log.actionTaken}>
                            {log.actionTaken}
                          </div>
                        </td>
                        <td>
                          <code className="text-muted small">
                            {log.ipAddress || 'N/A'}
                          </code>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            <Pagination />
          </>
        )}

        {/* Log Details Modal */}
        <Modal
          show={!!selectedLog}
          onHide={() => setSelectedLog(null)}
          centered
          size="lg"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <span className="me-2">📋</span>
              Audit Log Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedLog && (
              <div className="row g-3">
                <div className="col-12">
                  <div className="border rounded p-3 bg-light">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <div className="mb-2">
                          <strong className="text-primary">⏰ Timestamp:</strong>
                          <div>{new Date(selectedLog.timestamp).toLocaleString()}</div>
                        </div>
                        <div className="mb-2">
                          <strong className="text-primary">👤 User:</strong>
                          <div>{selectedLog.user}</div>
                        </div>
                        <div className="mb-2">
                          <strong className="text-primary">🛡️ Role:</strong>
                          <div>{selectedLog.role}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="mb-2">
                          <strong className="text-primary">⚠️ Severity:</strong>
                          <div>
                            <span 
                              className="fw-bold"
                              style={{ color: getSeverityColor(selectedLog.severity) }}
                            >
                              {selectedLog.severity.charAt(0).toUpperCase() + selectedLog.severity.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="mb-2">
                          <strong className="text-primary">🏷️ Category:</strong>
                          <div>{selectedLog.category}</div>
                        </div>
                        <div className="mb-2">
                          <strong className="text-primary">🌐 IP Address:</strong>
                          <div><code>{selectedLog.ipAddress || 'N/A'}</code></div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="mb-2">
                          <strong className="text-primary">⚡ Action Taken:</strong>
                          <div>{selectedLog.actionTaken}</div>
                        </div>
                        <div className="mb-2">
                          <strong className="text-primary">📝 Details:</strong>
                          <div className="bg-white p-2 rounded border">
                            {selectedLog.details}
                          </div>
                        </div>
                        {selectedLog.userAgent && (
                          <div className="mb-2">
                            <strong className="text-primary">🖥️ User Agent:</strong>
                            <div><small className="text-muted font-monospace">{selectedLog.userAgent}</small></div>
                          </div>
                        )}
                        {selectedLog.sessionId && (
                          <div className="mb-2">
                            <strong className="text-primary">🔒 Session ID:</strong>
                            <div><small className="text-muted font-monospace">{selectedLog.sessionId}</small></div>
                          </div>
                        )}
                        {selectedLog.beforeValue && (
                          <div className="mb-2">
                            <strong className="text-primary">📊 Previous State:</strong>
                            <div className="bg-white p-2 rounded border">
                              <pre className="mb-0 small">{JSON.stringify(selectedLog.beforeValue, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                        {selectedLog.afterValue && (
                          <div className="mb-2">
                            <strong className="text-primary">📈 New State:</strong>
                            <div className="bg-white p-2 rounded border">
                              <pre className="mb-0 small">{JSON.stringify(selectedLog.afterValue, null, 2)}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Close
            </Button>
            <Button variant="outline-primary" onClick={() => exportSingleLog(selectedLog)}>
              Export This Log
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </SidebarLayout>
  );
}