// src/components/SystemAdminAuditLogs.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Card, Spinner, Alert, Dropdown, ButtonGroup } from "react-bootstrap";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { supabase } from '../../supabaseClient';

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
  const [actionFilter, setActionFilter] = useState("all");
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage] = useState(19);

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
}, [currentPage, searchDebounce, dateRange, roleFilter, actionFilter]);  // ✅ ADD actionFilter
const fetchAuditLogs = async () => {
  try {
    setLoading(true);
    setError(null);

    // ✅ Get current user's organization
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.organizationId) {
      throw new Error('Session expired. Please log in again.');
    }

    // ✅ Build query with filters
let query = supabase
  .from('audit_logs')
  .select(`
    audit_id,
    user_id,
    action_taken,
    table_affected,
    record_id,
    ip_address,
    timestamp,
    organization_id,
    users!inner (
      full_name,
      email,
      role_id,
      roles!inner (
        role_name
      )
    )
  `, { count: 'exact' })
  .eq('organization_id', currentUser.organizationId)
  .order('timestamp', { ascending: false });

   // Apply search filter
// Apply search filter - Works with nested joins
if (searchDebounce) {
  // Search in audit_logs table fields only
  query = query.or(
    `action_taken.ilike.%${searchDebounce}%,` +
    `table_affected.ilike.%${searchDebounce}%,` +
    `ip_address.ilike.%${searchDebounce}%`
  );
}

// Apply role filter 
// Apply role filter - Case insensitive
if (roleFilter && roleFilter !== 'all') {
  query = query.ilike('users.roles.role_name', roleFilter);
}
if (actionFilter && actionFilter !== 'all') {
  query = query.ilike('action_taken', `%${actionFilter}%`);
}
    // Apply date range filter
    if (dateRange && dateRange !== 'all') {
      const daysBack = parseInt(dateRange);
      const filterDate = new Date(Date.now() - (daysBack * 24 * 60 * 60 * 1000)).toISOString();
      query = query.gte('timestamp', filterDate);
    }

    // Apply pagination
    const startIndex = (currentPage - 1) * recordsPerPage;
    query = query.range(startIndex, startIndex + recordsPerPage - 1);

    // Execute query
// Execute query
    const { data, error: fetchError, count } = await query;

    if (fetchError) throw fetchError;

    // âœ… Filter out logs with missing user or role data
    const validData = (data || []).filter(log => 
      log.users && 
      log.users.roles && 
      log.users.roles.role_name
    );

    // âœ… Transform data to match existing UI format
    const transformedLogs = validData.map(log => ({
      id: log.audit_id,
      timestamp: log.timestamp,
      user: log.users.email,
      userName: log.users.full_name,
      role: log.users.roles.role_name,  // Safe na to kasi na-filter na
      actionTaken: log.action_taken,
      ipAddress: log.ip_address || 'N/A',
      details: `${log.action_taken} on ${log.table_affected} (Record ID: ${log.record_id})`,
      tableAffected: log.table_affected,
      recordId: log.record_id
    }));

    setLogs(transformedLogs);
    setTotalRecords(count || 0);
    setTotalPages(Math.ceil((count || 0) / recordsPerPage));

  } catch (err) {
    console.error('Error fetching audit logs:', err);
    setError(err.message || "Failed to fetch audit logs.");
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
    case 'action':  // ✅ ADD THIS
      setActionFilter(value);
      break;
  }
  setCurrentPage(1);
};

  const exportLogs = async (format, exportType = 'all') => {
    try {
      const timestamp = new Date().toISOString().split('T')[0];
      
// Use actual filtered logs from database
let exportData = [...logs];
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


  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'Critical': return '#dc3545';
      case 'Warning': return '#fd7e14';
      case 'Info': return '#198754';
      default: return '#6c757d';
    }
  };

  // Simplified Pagination component
// Simplified Pagination component with page numbers
const Pagination = () => {
  const maxPageButtons = 5; // Show max 5 page buttons at a time
  
  // Calculate page range to show
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  // Adjust if we're near the end
  if (endPage - startPage < maxPageButtons - 1) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top">
      <div className="text-muted">
        Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, totalRecords)} of {totalRecords} entries
      </div>
      <div className="d-flex gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </Button>
        
        {/* Page Number Buttons */}
        <div className="d-flex gap-1">
          {startPage > 1 && (
            <>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(1)}
              >
                1
              </Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button
                variant="outline-primary"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
              >
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
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
        </div>
        </div>

       {/* Filters */}
        <div className="row mb-4">
          <div className="col-md-4">
            <Form.Control
              type="text"
              placeholder="Search by action,IP address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
    
          
<div className="col-md-2">
  <Form.Select
    value={roleFilter}
    onChange={(e) => handleFilterChange('role', e.target.value)}
  >
    <option value="all">All Roles</option>
    <option value="System Admin">System Admin</option>  {/* ✅ FIXED - removed "istrator" */}
    <option value="Admin Official">Admin Official</option>
    <option value="Personnel">Personnel</option>
    <option value="Standard User">Standard User</option>
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
          
<div className="col-md-2">
    <Form.Select
      value={actionFilter}
      onChange={(e) => handleFilterChange('action', e.target.value)}
    >
      <option value="all">All Actions</option>
      <option value="logged in">User Login</option>
      <option value="logged out">User Logout</option>
      <option value="password changed">Password Changes</option>
      <option value="Created new user">User Creation</option>
      <option value="Updated user profile">Profile Updates</option>
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
{search || dateRange !== 'all' || roleFilter !== 'all'
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
                  <th>User</th>
                  <th>Action</th>
                   <th>Ip Address</th>
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
    {new Date(log.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })}, {new Date(log.timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })}
  </small>
</td>
                        <td>
  <div className="fw-semibold">{log.user}</div>
  <div className="text-muted small">{log.role}</div>
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
      <div className="col-md-6">
        <div className="mb-3">
          <strong className="text-primary">⏰ Timestamp:</strong>
         <div>
  {new Date(selectedLog.timestamp).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })} at {new Date(selectedLog.timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })}
</div>
        </div>
        <div className="mb-3">
          <strong className="text-primary">👤 User:</strong>
          <div>{selectedLog.userName}</div>
          <div className="text-muted small">{selectedLog.user}</div>
        </div>
        <div className="mb-3">
          <strong className="text-primary">🛡️ Role:</strong>
          <div>{selectedLog.role}</div>
        </div>
      </div>
      <div className="col-md-6">
        <div className="mb-3">
          <strong className="text-primary">⚡ Action:</strong>
          <div>{selectedLog.actionTaken}</div>
        </div>
        <div className="mb-3">
          <strong className="text-primary">📋 Table Affected:</strong>
          <div>{selectedLog.tableAffected}</div>
        </div>
        <div className="mb-3">
          <strong className="text-primary">🔢 Record ID:</strong>
          <div>{selectedLog.recordId}</div>
        </div>
        <div className="mb-3">
          <strong className="text-primary">🌐 IP Address:</strong>
          <div><code>{selectedLog.ipAddress}</code></div>
        </div>
      </div>
    </div>
  )}
</Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedLog(null)}>
              Close
            </Button>

          </Modal.Footer>
        </Modal>
      </div>
    </SidebarLayout>
  );
}