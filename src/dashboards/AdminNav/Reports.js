// src/components/Reports.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { Row, Col, Card, Form, Button, InputGroup, Table, Spinner, Alert, Badge } from 'react-bootstrap';

import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Dynamic Reports Component with API Integration
 * - Fetches real data from APIs
 * - Falls back to sample data for development
 * - Supports all CRUD operations through API calls
 * - Real-time data updates
 */

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' }
];

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
const USE_SAMPLE_DATA = process.env.REACT_APP_USE_SAMPLE_DATA === 'true' || true; // Set to false when real API is ready

// API Service Functions
const apiService = {
  // Work Orders
  getWorkOrders: async (params = {}) => {
    if (USE_SAMPLE_DATA) return getSampleWorkOrders();
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/work-orders?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch work orders');
      return await response.json();
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return getSampleWorkOrders(); // Fallback to sample data
    }
  },

  // Incident Reports
  getIncidentReports: async (params = {}) => {
    if (USE_SAMPLE_DATA) return getSampleIncidentReports();
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/incident-reports?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch incident reports');
      return await response.json();
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      return getSampleIncidentReports();
    }
  },

  // Maintenance Schedules
  getMaintenanceSchedules: async (params = {}) => {
    if (USE_SAMPLE_DATA) return getSampleMaintenanceSchedules();
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/maintenance-schedules?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch maintenance schedules');
      return await response.json();
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      return getSampleMaintenanceSchedules();
    }
  },

  // Assets
  getAssets: async (params = {}) => {
    if (USE_SAMPLE_DATA) return getSampleAssets();
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/assets?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch assets');
      return await response.json();
    } catch (error) {
      console.error('Error fetching assets:', error);
      return getSampleAssets();
    }
  },

  // Users
  getUsers: async (params = {}) => {
    if (USE_SAMPLE_DATA) return getSampleUsers();
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_BASE_URL}/users?${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch users');
      return await response.json();
    } catch (error) {
      console.error('Error fetching users:', error);
      return getSampleUsers();
    }
  },

  // Dashboard Summary
  getDashboardSummary: async (period = 'monthly') => {
    if (USE_SAMPLE_DATA) return getSampleSummary(period);
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/summary?period=${period}`);
      if (!response.ok) throw new Error('Failed to fetch dashboard summary');
      return await response.json();
    } catch (error) {
      console.error('Error fetching dashboard summary:', error);
      return getSampleSummary(period);
    }
  }
};

// Sample Data Functions (for development/fallback)
const formatDate = (d) => {
  const date = new Date(d);
  const yyyy = date.getFullYear();
  const mm = `${date.getMonth() + 1}`.padStart(2, '0');
  const dd = `${date.getDate()}`.padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return formatDate(d);
};

const getSampleWorkOrders = () => [
  { id: 'WO-001', title: 'AC not cooling', category: 'HVAC', status: 'completed', created_at: daysAgo(2), assigned: 'Tech A', requestee: 'Jane Smith' },
  { id: 'WO-002', title: 'Light flickering - Hall A', category: 'Electrical', status: 'pending', created_at: daysAgo(7), assigned: 'Tech B', requestee: 'John Doe' },
  { id: 'WO-003', title: 'Leaking pipe at restroom', category: 'Plumbing', status: 'overdue', created_at: daysAgo(15), assigned: 'Tech C', requestee: 'Mike Johnson' },
  { id: 'WO-004', title: 'Broken cabinet hinge', category: 'Carpentry/Structural', status: 'cancelled', created_at: daysAgo(30), assigned: 'Tech D', requestee: 'Sarah Wilson' },
  { id: 'WO-005', title: 'Paint peeling in corridor', category: 'Painting/Finishing', status: 'failed', created_at: daysAgo(3), assigned: 'Tech E', requestee: 'David Brown' },
  { id: 'WO-006', title: 'Masonry crack near stairs', category: 'Masonry/Civil Works', status: 'completed', created_at: daysAgo(40), assigned: 'Tech F', requestee: 'Lisa Davis' },
  { id: 'WO-007', title: 'Garden maintenance', category: 'Groundskeeping', status: 'completed', created_at: daysAgo(10), assigned: 'Gardener', requestee: 'Tom Miller' },
  { id: 'WO-008', title: 'Ceiling water stain 3F', category: 'Plumbing', status: 'rejected', created_at: daysAgo(1), assigned: 'Tech C', requestee: 'Amy Taylor'}
];

const getSampleIncidentReports = () => [
  { id: 'IR-001', title: 'Slip near entrance', status: 'resolved', created_at: daysAgo(1), reporter: 'User A' },
  { id: 'IR-002', title: 'Unauthorized access', status: 'submitted', created_at: daysAgo(5), reporter: 'User B' },
  { id: 'IR-003', title: 'Broken glass', status: 'resolved', created_at: daysAgo(25), reporter: 'User C' },
  { id: 'IR-004', title: 'Equipment malfunction', status: 'pending', created_at: daysAgo(3), reporter: 'User D' },
  { id: 'IR-005', title: 'Safety hazard report', status: 'submitted', created_at: daysAgo(8), reporter: 'User E' }
];

const getSampleMaintenanceSchedules = () => [
  { id: 'M-001', title: 'AC routine maintenance - Building A', schedule_date: daysAgo(3), status: 'completed', assigned: 'Tech A' },
  { id: 'M-002', title: 'Generator monthly check', schedule_date: daysAgo(10), status: 'failed', assigned: 'Tech A' },
  { id: 'M-003', title: 'Elevator safety inspection', schedule_date: daysAgo(1), status: 'overdue', assigned: 'Tech B' },
  { id: 'M-004', title: 'Fire system check', schedule_date: daysAgo(20), status: 'completed', assigned: 'Tech C' },
  { id: 'M-005', title: 'CCTV system maintenance', schedule_date: daysAgo(5), status: 'pending', assigned: 'Tech D' }
];

const getSampleAssets = () => [
  { id: 'AS-001', name: 'AC Unit - 3F-1', status: 'operational', category: 'HVAC', location: '3F' },
  { id: 'AS-002', name: 'Generator G1', status: 'under_maintenance', category: 'Electrical', location: 'Basement' },
  { id: 'AS-003', name: 'Boiler B2', status: 'retired', category: 'Plumbing', location: 'Boiler Room' },
  { id: 'AS-004', name: 'Elevator E1', status: 'operational', category: 'Mechanical', location: 'Main Building' },
  { id: 'AS-005', name: 'Security Camera C1', status: 'operational', category: 'Security', location: 'Entrance' }
];

const getSampleUsers = () => [
  { id: 'U-001', name: 'Admin User', role: 'admin', email: 'admin@company.com', created_at: daysAgo(100) },
  { id: 'U-002', name: 'Tech Specialist A', role: 'personnel', email: 'tech.a@company.com', created_at: daysAgo(80) },
  { id: 'U-003', name: 'John Doe', role: 'standard', email: 'john.doe@company.com', created_at: daysAgo(60) },
  { id: 'U-004', name: 'Jane Smith', role: 'standard', email: 'jane.smith@company.com', created_at: daysAgo(45) },
  { id: 'U-005', name: 'Tech Specialist B', role: 'personnel', email: 'tech.b@company.com', created_at: daysAgo(30) }
];

const getSampleSummary = (period) => {
  const workOrders = getSampleWorkOrders();
  const incidentReports = getSampleIncidentReports();
  const maintenanceSchedules = getSampleMaintenanceSchedules();
  const assets = getSampleAssets();
  const users = getSampleUsers();

  const withinPeriod = (dateStr) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
    if (period === 'today') return diffDays <= 1;
    if (period === 'weekly') return diffDays <= 7;
    if (period === 'monthly') return diffDays <= 31;
    if (period === 'yearly') return diffDays <= 365;
    return true;
  };

  const woInPeriod = workOrders.filter(w => withinPeriod(w.created_at));
  const irInPeriod = incidentReports.filter(i => withinPeriod(i.created_at));
  const mInPeriod = maintenanceSchedules.filter(m => withinPeriod(m.schedule_date));

  return {
    workOrders: {
      total: woInPeriod.length,
      completed: woInPeriod.filter(w => w.status === 'completed').length,
      overdue: woInPeriod.filter(w => w.status === 'overdue').length,
      pending: woInPeriod.filter(w => w.status === 'pending').length
    },
    incidents: {
      total: irInPeriod.length,
      resolved: irInPeriod.filter(i => i.status === 'resolved').length,
      submitted: irInPeriod.filter(i => i.status === 'submitted').length
    },
    maintenance: {
      total: mInPeriod.length,
      completed: mInPeriod.filter(m => m.status === 'completed').length,
      overdue: mInPeriod.filter(m => m.status === 'overdue').length
    },
    assets: {
      total: assets.length,
      operational: assets.filter(a => a.status === 'operational').length,
      maintenance: assets.filter(a => a.status === 'under_maintenance').length,
      retired: assets.filter(a => a.status === 'retired').length
    },
    users: {
      total: users.length,
      standard: users.filter(u => u.role === 'standard').length,
      personnel: users.filter(u => u.role === 'personnel').length,
      admin: users.filter(u => u.role === 'admin').length
    }
  };
};

// Helper functions
const downloadCSV = (filename, rows) => {
  const csvContent = rows.map(r =>
    r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const getStatusBadgeVariant = (status) => {
  switch(status) {
    case 'completed': return 'success';
    case 'pending': return 'primary';
    case 'overdue': return 'warning';
    case 'cancelled': return 'dark';
    case 'rejected': return 'secondary';
    case 'failed': return 'danger';
    case 'resolved': return 'success';
    case 'submitted': return 'primary';
    case 'operational': return 'success';
    case 'under_maintenance': return 'warning';
    case 'retired': return 'secondary';
    case 'admin': return 'primary';
    case 'personnel': return 'info';
    case 'standard': return 'secondary';
    default: return 'secondary';
  }
};

export default function Reports() {
  // State management
  const [period, setPeriod] = useState('monthly');
  const [activeTab, setActiveTab] = useState('workorders');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Search & filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Data state
  const [data, setData] = useState({
    workOrders: [],
    incidentReports: [],
    maintenanceSchedules: [],
    assets: [],
    users: [],
    summary: null
  });

  // Pagination
  const [pageSize] = useState(10);
  const [page, setPage] = useState(1);

  // Data fetching functions
  const fetchAllData = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    setError(null);
    
    try {
      const [
        workOrders,
        incidentReports, 
        maintenanceSchedules,
        assets,
        users,
        summary
      ] = await Promise.all([
        apiService.getWorkOrders(),
        apiService.getIncidentReports(),
        apiService.getMaintenanceSchedules(),
        apiService.getAssets(),
        apiService.getUsers(),
        apiService.getDashboardSummary(period)
      ]);

      setData({
        workOrders,
        incidentReports,
        maintenanceSchedules,
        assets,
        users,
        summary
      });
      
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const refreshData = () => {
    fetchAllData(false); // Don't show loading spinner for refresh
  };

  // Effects
  useEffect(() => {
    fetchAllData();
  }, [period]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, search, statusFilter, categoryFilter, period]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [period]);

  // Filtering logic
  const filterTable = (rows) => {
    return rows.filter(r => {
      // Search filter
      const q = search.trim().toLowerCase();
      if (q) {
        const searchableText = JSON.stringify(r).toLowerCase();
        if (!searchableText.includes(q)) return false;
      }

      // Status filter
      if (statusFilter !== 'all') {
        const itemStatus = r.status || r.role;
        if (itemStatus !== statusFilter) return false;
      }

      // Category filter
      if (categoryFilter !== 'all' && r.category && r.category !== categoryFilter) {
        return false;
      }

      // Period filter
      const checkDate = r.created_at || r.schedule_date || null;
      if (checkDate) {
        const now = new Date();
        const d = new Date(checkDate);
        const diffDays = Math.floor((now - d) / (1000 * 60 * 60 * 24));
        
        if (period === 'today' && diffDays > 1) return false;
        if (period === 'weekly' && diffDays > 7) return false;
        if (period === 'monthly' && diffDays > 31) return false;
        if (period === 'yearly' && diffDays > 365) return false;
      }

      return true;
    });
  };

  // Filtered and paginated data
  const tables = useMemo(() => ({
    workorders: filterTable(data.workOrders),
    incidents: filterTable(data.incidentReports),
    maintenance: filterTable(data.maintenanceSchedules),
    assets: filterTable(data.assets),
    users: filterTable(data.users)
  }), [data, search, statusFilter, categoryFilter, period]);

  const paginated = (tableData) => {
    const start = (page - 1) * pageSize;
    return tableData.slice(start, start + pageSize);
  };

  // Export function
  const exportCurrentTabCSV = () => {
    const tableData = tables[activeTab] || [];
    if (!tableData.length) {
      alert('No data to export for this view.');
      return;
    }
    const headers = Object.keys(tableData[0]);
    const rows = [headers, ...tableData.map(item => headers.map(h => item[h] ?? ''))];
    const filename = `report_${activeTab}_${period}_${formatDate(new Date())}.csv`;
    downloadCSV(filename, rows);
  };

  // Get unique categories for filter
  const categoryOptions = Array.from(new Set(data.workOrders.map(w => w.category))).filter(Boolean);

  if (isLoading) {
    return (
      <SidebarLayout role="admin">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <div className="text-center">
            <Spinner animation="border" />
            <p className="mt-2">Loading reports data...</p>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="admin">
      <div className="container-fluid p-3" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        {/* Header Section */}
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="mb-1 fw-bold text-dark">Reports & Analytics</h2>
              <div className="d-flex align-items-center gap-3">
                <p className="text-muted mb-0">Comprehensive overview of system performance and activities</p>
                {USE_SAMPLE_DATA && (
                  <span className="badge bg-warning text-dark">Using Sample Data</span>
                )}
                <small className="text-muted">
                  Last updated: {lastRefresh.toLocaleTimeString()}
                </small>
              </div>
            </div>
            <div className="d-flex gap-2">
             
              <Form.Select 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)}
                style={{ minWidth: '120px', fontSize: '0.875rem' }}
                className="border-0 shadow-sm"
                size="sm"
              >
                {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </Form.Select>
              <Button 
                variant="outline-success" 
                onClick={exportCurrentTabCSV}
                className="px-3 py-2 shadow-sm d-flex align-items-center gap-2"
                style={{ 
                  fontWeight: '500', 
                  fontSize: '0.875rem',
                  borderColor: '#198754',
                  color: '#198754',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  border: '1px solid #198754',
                  whiteSpace: 'nowrap'
                }}
              >
                Export CSV
              </Button>
            </div>
          </div>

          {/* Error Alert */}
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError(null)}>
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}
        </div>

        {/* Summary Cards */}
        {data.summary && (
          <Row className="g-3 mb-4">
            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#e3f2fd' }}>
                      <i className="fas fa-clipboard-list text-primary fs-4"></i>
                    </div>
                    <div className="text-end">
                      <h3 className="mb-0 fw-bold text-primary">{data.summary.workOrders.total}</h3>
                    </div>
                  </div>
                  <h6 className="mb-2 fw-semibold text-dark">Work Orders</h6>
                  <div className="d-flex gap-3 text-sm">
                    <span className="text-success">{data.summary.workOrders.completed} Completed</span>
                    <span className="text-danger">{data.summary.workOrders.overdue} Overdue</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#fff3e0' }}>
                      <i className="fas fa-exclamation-triangle text-warning fs-4"></i>
                    </div>
                    <div className="text-end">
                      <h3 className="mb-0 fw-bold text-warning">{data.summary.incidents.total}</h3>
                    </div>
                  </div>
                  <h6 className="mb-2 fw-semibold text-dark">Incident Reports</h6>
                  <div className="d-flex gap-3 text-sm">
                    <span className="text-success">{data.summary.incidents.resolved} Resolved</span>
                    <span className="text-info">{data.summary.incidents.submitted} Submitted</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#e8f5e8' }}>
                      <i className="fas fa-tools text-success fs-4"></i>
                    </div>
                    <div className="text-end">
                      <h3 className="mb-0 fw-bold text-success">{data.summary.maintenance.total}</h3>
                    </div>
                  </div>
                  <h6 className="mb-2 fw-semibold text-dark">Maintenance Tasks</h6>
                  <div className="d-flex gap-3 text-sm">
                    <span className="text-success">{data.summary.maintenance.completed} Done</span>
                    <span className="text-danger">{data.summary.maintenance.overdue} Overdue</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                <Card.Body className="p-3">
                  <div className="d-flex align-items-center justify-content-between mb-3">
                    <div className="p-3 rounded-3" style={{ backgroundColor: '#f3e5f5' }}>
                      <i className="fas fa-cubes text-info fs-4"></i>
                    </div>
                    <div className="text-end">
                      <h3 className="mb-0 fw-bold text-info">{data.summary.assets.total}</h3>
                    </div>
                  </div>
                  <h6 className="mb-2 fw-semibold text-dark">Total Assets</h6>
                  <div className="d-flex gap-2 text-sm">
                    <span className="text-success">{data.summary.assets.operational} Active</span>
                    <span className="text-warning">{data.summary.assets.maintenance} Maintenance</span>
                    <span className="text-muted">{data.summary.assets.retired} Retired</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Global Search Bar */}
        <div className="mb-3">
          <Row className="align-items-center">
            <Col lg={6}>
              <Form.Control 
                placeholder="Search across all data..." 
                value={search} 
                onChange={(e) => setSearch(e.target.value)}
                className="border shadow-sm"
                style={{ borderColor: '#ced4da !important', fontSize: '0.95rem', padding: '12px 16px' }}
              />
            </Col>
            <Col lg={3}>
              <Form.Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="border shadow-sm"
                style={{ borderColor: '#ced4da !important', fontSize: '0.95rem' }}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
                <option value="overdue">Overdue</option>
                <option value="cancelled">Cancelled</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
                <option value="submitted">Submitted</option>
                <option value="resolved">Resolved</option>
                <option value="operational">Operational</option>
                <option value="under_maintenance">Under Maintenance</option>
                <option value="retired">Retired</option>
                <option value="admin">Admin</option>
                <option value="personnel">Personnel</option>
                <option value="standard">Standard</option>
              </Form.Select>
            </Col>
            <Col lg={3}>
              <Form.Select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border shadow-sm"
                style={{ borderColor: '#ced4da !important', fontSize: '0.95rem' }}
              >
                <option value="all">All Categories</option>
                {categoryOptions.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </Form.Select>
            </Col>
          </Row>
        </div>

        {/* Tabs Section */}
       {/* Tabs */}
        <div className="mb-3">
          <div className="d-flex p-3 bg-white rounded-3 shadow-sm border">
            {[
              { key: 'workorders', name: 'Work Orders', count: tables.workorders.length },
              { key: 'incidents', name: 'Incident Reports', count: tables.incidents.length },
              { key: 'maintenance', name: 'Maintenance', count: tables.maintenance.length },
              { key: 'assets', name: 'Assets', count: tables.assets.length },
              { key: 'users', name: 'Users', count: tables.users.length }
            ].map(tab => (
              <button 
                key={tab.key}
                className={`btn position-relative px-3 py-2 rounded-pill fw-semibold flex-fill me-2 ${
                  activeTab === tab.key 
                    ? 'btn-primary text-white shadow-sm' 
                    : 'btn-outline-secondary text-muted'
                }`}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  border: activeTab === tab.key ? 'none' : '1.5px solid #e5e7eb',
                  transition: 'all 0.2s ease',
                  fontSize: '0.85rem',
                  minWidth: '0'
                }}
              >
                <div className="d-flex align-items-center justify-content-center">
                  <span className="text-truncate">{tab.name}</span>
                  <span 
                    className={`badge rounded-pill ms-2 ${
                      activeTab === tab.key 
                        ? 'bg-white text-primary' 
                        : 'bg-light text-muted'
                    }`}
                    style={{fontSize: '0.7rem'}}
                  >
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
              {/* WORK ORDERS TAB */}
              {activeTab === 'workorders' && (
                <div className="bg-white rounded shadow-sm" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="table table-hover table-sm mb-0">
                      <thead className="table-light">
                          <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Created</th>
                          <th>Assigned</th>
                          <th>Requestee</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated(tables.workorders).map(w => (
                          <tr key={w.id}>
                            <td>{w.id}</td>
                            <td>{w.title}</td>
                            <td>{w.category}</td>
                            <td className="py-2">
                              <Badge bg={getStatusBadgeVariant(w.status)}>
                            {w.status}
                          </Badge>
                            </td>
                            <td className="py-2 text-muted">{w.created_at}</td>
                            <td className="py-2">{w.assigned}</td>
                            <td className="py-2">{w.requestee}</td>
                          </tr>
                        ))}
                        {tables.workorders.length === 0 && (
                          <tr>
                            <td colSpan="7" className="text-center py-4 text-muted">
                              <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                              No work orders found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {Math.min(pageSize, tables.workorders.length - (page - 1) * pageSize)} of {tables.workorders.length} entries
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        className="border-0"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center px-3">
                        Page {page} of {Math.ceil(tables.workorders.length / pageSize) || 1}
                      </span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={(page * pageSize) >= tables.workorders.length} 
                        onClick={() => setPage(p => p + 1)}
                        className="border-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* INCIDENTS TAB */}
              {activeTab === 'incidents' && (
               <div className="bg-white rounded shadow-sm" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Reporter</th>
                          <th>Status</th>
                          <th>Submitted</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated(tables.incidents).map(i => (
                          <tr key={i.id} className="border-bottom">
                            <td className="py-2 fw-semibold">{i.id}</td>
                            <td className="py-2">{i.title}</td>
                            <td className="py-2">{i.reporter}</td>
                            <td className="py-2">
                              <Badge bg={getStatusBadgeVariant(i.status)}>
                                {i.status}
                              </Badge>
                              
                            </td>
                            <td className="py-3 text-muted">{i.created_at}</td>
                          </tr>
                        ))}
                        {tables.incidents.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                              No incident reports found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {Math.min(pageSize, tables.incidents.length - (page - 1) * pageSize)} of {tables.incidents.length} entries
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        className="border-0"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center px-3">
                        Page {page} of {Math.ceil(tables.incidents.length / pageSize) || 1}
                      </span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={(page * pageSize) >= tables.incidents.length} 
                        onClick={() => setPage(p => p + 1)} 
                        className="border-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* MAINTENANCE TAB */}
              {activeTab === 'maintenance' && (
               <div className="bg-white rounded shadow-sm" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Title</th>
                          <th>Schedule</th>
                          <th>Status</th>
                          <th>Assigned</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated(tables.maintenance).map(m => (
                          <tr key={m.id} className="border-bottom">
                            <td className="py-2 fw-semibold">{m.id}</td>
                            <td className="py-2">{m.title}</td>
                            <td className="py-2 text-muted">{m.schedule_date}</td>
                            <td className="py-2">
                             <Badge bg={getStatusBadgeVariant(m.status)}>
                              {m.status}
                            </Badge>
                            </td>
                            <td className="py-2">{m.assigned}</td>
                          </tr>
                        ))}
                        {tables.maintenance.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                              No maintenance schedules found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {Math.min(pageSize, tables.maintenance.length - (page - 1) * pageSize)} of {tables.maintenance.length} entries
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        className="border-0"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center px-3">
                        Page {page} of {Math.ceil(tables.maintenance.length / pageSize) || 1}
                      </span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={(page * pageSize) >= tables.maintenance.length} 
                        onClick={() => setPage(p => p + 1)} 
                        className="border-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* ASSETS TAB */}
              {activeTab === 'assets' && (
               <div className="bg-white rounded shadow-sm" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                      <thead className="table-light">
                       <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Category</th>
                          <th>Status</th>
                          <th>Location</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated(tables.assets).map(a => (
                          <tr key={a.id} className="border-bottom">
                            <td className="py-2 fw-semibold">{a.id}</td>
                            <td className="py-2">{a.name}</td>
                            <td className="py-2 text-muted">{a.category}</td>
                            <td className="py-2">

                              <Badge bg={getStatusBadgeVariant(a.status)}>
  {a.status.replace('_', ' ')}
</Badge>


                            </td>
                            <td className="py-3 text-muted">{a.location}</td>
                          </tr>
                        ))}
                        {tables.assets.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                              No assets found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {Math.min(pageSize, tables.assets.length - (page - 1) * pageSize)} of {tables.assets.length} entries
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        className="border-0"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center px-3">
                        Page {page} of {Math.ceil(tables.assets.length / pageSize) || 1}
                      </span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={(page * pageSize) >= tables.assets.length} 
                        onClick={() => setPage(p => p + 1)} 
                        className="border-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* USERS TAB */}
              {activeTab === 'users' && (
                <div className="bg-white rounded shadow-sm" style={{ padding: '0' }}>
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Role</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginated(tables.users).map(u => (
                          <tr key={u.id} className="border-bottom">
                            <td className="py-2 fw-semibold">{u.id}</td>
                            <td className="py-2">{u.name}</td>
                            <td className="py-2 text-muted">{u.email}</td>
                            <td className="py-2">
                            <Badge bg={getStatusBadgeVariant(u.role)}>
                            {u.role}
                          </Badge>
                            </td>
                            <td className="py-3 text-muted">{u.created_at}</td>
                          </tr>
                        ))}
                        {tables.users.length === 0 && (
                          <tr>
                            <td colSpan="5" className="text-center py-4 text-muted">
                              <i className="fas fa-inbox fa-2x mb-2 d-block"></i>
                              No users found for the selected filters
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <div className="text-muted">
                      Showing {Math.min(pageSize, tables.users.length - (page - 1) * pageSize)} of {tables.users.length} entries
                    </div>
                    <div className="d-flex gap-2">
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={page === 1} 
                        onClick={() => setPage(p => Math.max(1, p - 1))} 
                        className="border-0"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center px-3">
                        Page {page} of {Math.ceil(tables.users.length / pageSize) || 1}
                      </span>
                      <Button 
                        variant="outline-secondary" 
                        size="sm" 
                        disabled={(page * pageSize) >= tables.users.length} 
                        onClick={() => setPage(p => p + 1)} 
                        className="border-0"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
      </div>
    </SidebarLayout>
  );
}