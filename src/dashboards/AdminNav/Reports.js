// src/components/Reports.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { Row, Col, Card, Form, Button, InputGroup, Table, Spinner, Alert, Badge } from 'react-bootstrap';
// Import Supabase client
import { supabase } from '../../supabaseClient'; // Adjust path based on your folder structure
import 'bootstrap/dist/css/bootstrap.min.css';


const getCurrentUserOrganization = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: userData, error } = await supabase
      .from('users')
      .select('organization_id')
      .eq('auth_uid', user.id)
      .single();

    if (error || !userData) throw new Error('User organization not found');
    return userData.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    throw error;
  }
};

const PERIODS = [
  { value: 'today', label: 'Today' },
  { value: 'weekly', label: 'This Week' },
  { value: 'monthly', label: 'This Month' },
  { value: 'yearly', label: 'This Year' }
];


const apiService = {
  // Work Orders
  getWorkOrders: async (params = {}) => {
    try {
      const organizationId = await getCurrentUserOrganization();
      
      const { data, error } = await supabase
      .from('work_orders')
      .select(`
        work_order_id,
        title,
        category,
        status_id,
        date_requested,
        due_date,
        assigned_to,
        requested_by,
        statuses(status_name),
          assigned_user:users!work_orders_assigned_to_fkey(full_name),
          requester:users!work_orders_requested_by_fkey(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('date_requested', { ascending: false });

      if (error) throw error;

      return data.map(wo => ({
        id: `WO-${wo.work_order_id.toString().padStart(3, '0')}`,
        title: wo.title,
        category: wo.category || 'General',
        status: wo.statuses?.status_name?.toLowerCase() || 'pending',
        created_at: wo.date_requested?.split('T')[0] || '',
        assigned: wo.assigned_user?.full_name || 'Unassigned',
        requestee: wo.requester?.full_name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return [];
    }
  },

  // Incident Reports
  getIncidentReports: async (params = {}) => {
    try {
      const organizationId = await getCurrentUserOrganization();
      
      const { data, error } = await supabase
        .from('incident_reports')
        .select(`
          incident_id,
          description,
          status_id,
          date_reported,
          reported_by,
          statuses(status_name),
          users!incident_reports_reported_by_fkey(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('date_reported', { ascending: false });

      if (error) throw error;

      return data.map(ir => ({
        id: `IR-${ir.incident_id.toString().padStart(3, '0')}`,
        title: ir.description?.substring(0, 50) + '...' || 'Incident Report',
        status: ir.statuses?.status_name?.toLowerCase() || 'submitted',
        created_at: ir.date_reported?.split('T')[0] || '',
        reporter: ir.users?.full_name || 'Unknown'
      }));
    } catch (error) {
      console.error('Error fetching incident reports:', error);
      return [];
    }
  },

  // Maintenance Schedules
  getMaintenanceSchedules: async (params = {}) => {
    try {
      const organizationId = await getCurrentUserOrganization();
      
      const { data, error } = await supabase
        .from('maintenance_schedules')
        .select(`
          schedule_id,
          task_description,
          scheduled_date,
          status,
          assigned_user_id,
          users!maintenance_schedules_assigned_user_id_fkey(full_name)
        `)
        .eq('organization_id', organizationId)
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      return data.map(ms => ({
        id: `M-${ms.schedule_id.toString().padStart(3, '0')}`,
        title: ms.task_description,
        schedule_date: ms.scheduled_date || '',
        status: ms.status || 'scheduled',
        assigned: ms.users?.full_name || 'Unassigned'
      }));
    } catch (error) {
      console.error('Error fetching maintenance schedules:', error);
      return [];
    }
  },

  // Assets
  getAssets: async (params = {}) => {
    try {
      const organizationId = await getCurrentUserOrganization();
      
      const { data, error } = await supabase
        .from('assets')
        .select(`
          asset_id,
          asset_code,
          asset_name,
          asset_status,
          location,
          asset_categories(category_name)
        `)
        .eq('organization_id', organizationId)
        .order('asset_id', { ascending: false });

      if (error) throw error;

      return data.map(asset => ({
        id: asset.asset_code,
        name: asset.asset_name || asset.asset_code,
        status: asset.asset_status || 'active',
        category: asset.asset_categories?.category_name || 'Unknown',
        location: asset.location || 'N/A'
      }));
    } catch (error) {
      console.error('Error fetching assets:', error);
      return [];
    }
  },

  // Users
  getUsers: async (params = {}) => {
    try {
      const organizationId = await getCurrentUserOrganization();
      
      const { data, error } = await supabase
        .from('users')
        .select(`
          user_id,
          full_name,
          email,
          role_id,
          date_created,
          roles(role_name)
        `)
        .eq('organization_id', organizationId)
        .order('date_created', { ascending: false });

      if (error) throw error;

      const roleMap = { 1: 'sysadmin', 2: 'admin', 3: 'personnel', 4: 'standard' };

      return data.map(user => ({
        id: `U-${user.user_id.toString().padStart(3, '0')}`,
        name: user.full_name,
        role: roleMap[user.role_id] || 'standard',
        email: user.email,
        created_at: user.date_created?.split('T')[0] || ''
      }));
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    }
  },

getDashboardSummary: async (period = 'monthly') => {
  try {
    const organizationId = await getCurrentUserOrganization();
    
    // Calculate date range based on period
    const now = new Date();
    let startDate = new Date();
    
    switch(period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'weekly':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'yearly':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    // Fetch work orders
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select('status_id, due_date, statuses(status_name)')
      .eq('organization_id', organizationId)
      .gte('date_requested', startDate.toISOString());

    // Fetch incidents
    const { data: incidents } = await supabase
      .from('incident_reports')
      .select('status_id, statuses(status_name)')
      .eq('organization_id', organizationId)
      .gte('date_reported', startDate.toISOString());

    // Fetch maintenance
    const { data: maintenance } = await supabase
      .from('maintenance_schedules')
      .select('status, scheduled_date')
      .eq('organization_id', organizationId)
      .gte('scheduled_date', startDate.toISOString().split('T')[0]);

    // Fetch assets (all, not filtered by date)
    const { data: assets } = await supabase
      .from('assets')
      .select('asset_status')
      .eq('organization_id', organizationId);

    // Fetch users (all, not filtered by date)
    const { data: users } = await supabase
      .from('users')
      .select('role_id')
      .eq('organization_id', organizationId);

    return {
      workOrders: {
        total: workOrders?.length || 0,
        completed: workOrders?.filter(w => w.statuses?.status_name?.toLowerCase() === 'completed').length || 0,
        overdue: workOrders?.filter(w => {
          if (!w.due_date) return false;
          const dueDate = new Date(w.due_date);
          const isOverdue = dueDate < now && w.statuses?.status_name?.toLowerCase() !== 'completed';
          return isOverdue;
        }).length || 0,
        pending: workOrders?.filter(w => w.statuses?.status_name?.toLowerCase() === 'pending').length || 0
      },
      incidents: {
        total: incidents?.length || 0,
        resolved: incidents?.filter(i => i.statuses?.status_name?.toLowerCase() === 'resolved').length || 0,
        submitted: incidents?.filter(i => i.statuses?.status_name?.toLowerCase() === 'reported').length || 0
      },
      maintenance: {
        total: maintenance?.length || 0,
        completed: maintenance?.filter(m => m.status?.toLowerCase() === 'completed').length || 0,
        overdue: maintenance?.filter(m => {
          if (!m.scheduled_date) return false;
          const scheduledDate = new Date(m.scheduled_date);
          const isOverdue = scheduledDate < now && m.status?.toLowerCase() !== 'completed';
          return isOverdue;
        }).length || 0
      },
      assets: {
        total: assets?.length || 0,
        operational: assets?.filter(a => a.asset_status === 'active').length || 0,
        maintenance: assets?.filter(a => a.asset_status === 'maintenance').length || 0,
        retired: assets?.filter(a => a.asset_status === 'retired').length || 0
      },
      users: {
        total: users?.length || 0,
        standard: users?.filter(u => u.role_id === 4).length || 0,
        personnel: users?.filter(u => u.role_id === 3).length || 0,
        admin: users?.filter(u => u.role_id === 2).length || 0
      }
    };
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    return {
      workOrders: { total: 0, completed: 0, overdue: 0, pending: 0 },
      incidents: { total: 0, resolved: 0, submitted: 0 },
      maintenance: { total: 0, completed: 0, overdue: 0 },
      assets: { total: 0, operational: 0, maintenance: 0, retired: 0 },
      users: { total: 0, standard: 0, personnel: 0, admin: 0 }
    };
  }
}
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

  // Real-time subscriptions
useEffect(() => {
  const channels = [];

  // Subscribe to work_orders changes
  const workOrdersChannel = supabase
    .channel('work_orders_changes')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'work_orders' },
      () => {
        console.log('Work order changed, refreshing data...');
        refreshData();
      }
    )
    .subscribe();
  channels.push(workOrdersChannel);

  // Subscribe to incident_reports changes
  const incidentsChannel = supabase
    .channel('incidents_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'incident_reports' },
      () => {
        console.log('Incident report changed, refreshing data...');
        refreshData();
      }
    )
    .subscribe();
  channels.push(incidentsChannel);

  // Subscribe to maintenance_schedules changes
  const maintenanceChannel = supabase
    .channel('maintenance_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'maintenance_schedules' },
      () => {
        console.log('Maintenance schedule changed, refreshing data...');
        refreshData();
      }
    )
    .subscribe();
  channels.push(maintenanceChannel);

  // Subscribe to assets changes
  const assetsChannel = supabase
    .channel('assets_changes')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'assets' },
      () => {
        console.log('Asset changed, refreshing data...');
        refreshData();
      }
    )
    .subscribe();
  channels.push(assetsChannel);

  // Cleanup subscriptions
  return () => {
    channels.forEach(channel => supabase.removeChannel(channel));
  };
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
    const filename = `report_${activeTab}_${period}_${new Date().toISOString().split('T')[0]}.csv`;
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