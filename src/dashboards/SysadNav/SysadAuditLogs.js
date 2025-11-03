// src/components/SystemAdminAuditLogs.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Card, Spinner, Alert, Dropdown, ButtonGroup } from "react-bootstrap";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { supabase } from '../../supabaseClient';


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
  const [recordsPerPage] = useState(17);

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
    user_full_name,
    user_email,
    user_role,
    users (
      full_name,
      email,
      roles (
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
// Apply role filter - Check both stored role and joined role
if (roleFilter && roleFilter !== 'all') {
  query = query.or(
    `user_role.ilike.${roleFilter},users.roles.role_name.ilike.${roleFilter}`
  );
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

// ✅ Accept all logs - we have user data stored directly now
const validData = (data || []);

const transformedLogs = validData.map(log => ({
  id: log.audit_id,
  timestamp: log.timestamp,
  // Use stored data first (for deleted users), fallback to joined data
  user: log.user_email || log.users?.email || 'deleted@system',
  userName: log.user_full_name || log.users?.full_name || 'Deleted User',
  role: log.user_role || log.users?.roles?.role_name || 'N/A',
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
    {new Date(new Date(log.timestamp).getTime() + (8 * 60 * 60 * 1000)).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
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
  {new Date(new Date(selectedLog.timestamp).getTime() + (8 * 60 * 60 * 1000)).toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
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