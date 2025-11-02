// src/components/Reports.js
import React, { useEffect, useMemo, useRef, useState } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { Row, Col, Card, Form, Button, InputGroup, Table, Spinner, Alert, Badge } from 'react-bootstrap';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';// Import Supabase client
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
const CHART_COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];


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
},
// Add this inside apiService object, after getDashboardSummary

// Get analytics data for charts
getAnalyticsData: async (period = 'monthly') => {
  try {
    const organizationId = await getCurrentUserOrganization();
    
    // Calculate date range
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

    // Fetch work orders with detailed info for analytics
    const { data: workOrders } = await supabase
      .from('work_orders')
      .select(`
        work_order_id,
        category,
        status_id,
        date_requested,
        date_resolved,
        due_date,
        statuses(status_name)
      `)
      .eq('organization_id', organizationId)
      .gte('date_requested', startDate.toISOString());

    // Fetch incidents with detailed info
    const { data: incidents } = await supabase
      .from('incident_reports')
      .select(`
        incident_id,
        date_reported,
        date_resolved,
        severity_id,
        asset_id,
        statuses(status_name)
      `)
      .eq('organization_id', organizationId)
      .gte('date_reported', startDate.toISOString());

    // Fetch assets with incident count
    const { data: assets } = await supabase
      .from('assets')
      .select(`
        asset_id,
        asset_code,
        asset_name,
        asset_status
      `)
      .eq('organization_id', organizationId);

    return {
      workOrders: workOrders || [],
      incidents: incidents || [],
      assets: assets || []
    };
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    return { workOrders: [], incidents: [], assets: [] };
  }
},

// Calculate performance metrics
getPerformanceMetrics: async (period = 'monthly') => {
  try {
    const organizationId = await getCurrentUserOrganization();
    
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

    // Fetch completed work orders with resolution time
    const { data: completedWorkOrders } = await supabase
      .from('work_orders')
      .select('date_requested, date_resolved, due_date')
      .eq('organization_id', organizationId)
      .eq('status_id', 3) // Completed status
      .not('date_resolved', 'is', null)
      .gte('date_requested', startDate.toISOString());

    // Calculate average resolution time
    let totalResolutionTime = 0;
    let onTimeCount = 0;
    
    completedWorkOrders?.forEach(wo => {
      const requested = new Date(wo.date_requested);
      const resolved = new Date(wo.date_resolved);
      const diffTime = Math.abs(resolved - requested);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      totalResolutionTime += diffDays;
      
      // Check if resolved on time
      if (wo.due_date) {
        const dueDate = new Date(wo.due_date);
        if (resolved <= dueDate) onTimeCount++;
      }
    });

    const avgResolutionTime = completedWorkOrders?.length 
      ? (totalResolutionTime / completedWorkOrders.length).toFixed(1)
      : 0;
    
    const onTimeRate = completedWorkOrders?.length
      ? ((onTimeCount / completedWorkOrders.length) * 100).toFixed(0)
      : 0;

    // Get total counts
    const { data: allWorkOrders } = await supabase
      .from('work_orders')
      .select('status_id, statuses(status_name)')
      .eq('organization_id', organizationId)
      .gte('date_requested', startDate.toISOString());

    const completionRate = allWorkOrders?.length
      ? ((completedWorkOrders?.length / allWorkOrders.length) * 100).toFixed(0)
      : 0;

    return {
      avgResolutionTime: parseFloat(avgResolutionTime),
      completionRate: parseFloat(completionRate),
      onTimeRate: parseFloat(onTimeRate),
      totalCompleted: completedWorkOrders?.length || 0
    };
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    return {
      avgResolutionTime: 0,
      completionRate: 0,
      onTimeRate: 0,
      totalCompleted: 0
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
// Add these helper functions after getStatusBadgeVariant and before export default function Reports()

// Process work orders by category for bar chart
const processWorkOrdersByCategory = (workOrders) => {
  const categoryCount = {};
  workOrders.forEach(wo => {
    const category = wo.category || 'General';
    categoryCount[category] = (categoryCount[category] || 0) + 1;
  });
  
  return Object.entries(categoryCount)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5); // Top 5 categories
};

// Process status distribution for pie chart
const processStatusDistribution = (workOrders) => {
  const statusCount = {};
  workOrders.forEach(wo => {
    const status = wo.statuses?.status_name || 'Unknown';
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  
  return Object.entries(statusCount).map(([name, value]) => ({ name, value }));
};

// Process trend data for line chart (last 7 days or periods)
const processTrendData = (workOrders, period) => {
  const trendData = [];
  const now = new Date();
  
  if (period === 'weekly' || period === 'today') {
    // Last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const count = workOrders.filter(wo => 
        wo.date_requested?.split('T')[0] === dateStr
      ).length;
      
      trendData.push({
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        count
      });
    }
  } else if (period === 'monthly') {
    // Last 4 weeks
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - (i * 7 + 6));
      const weekEnd = new Date(now);
      weekEnd.setDate(weekEnd.getDate() - (i * 7));
      
      const count = workOrders.filter(wo => {
        const woDate = new Date(wo.date_requested);
        return woDate >= weekStart && woDate <= weekEnd;
      }).length;
      
      trendData.push({
        date: `Week ${4 - i}`,
        count
      });
    }
  } else {
    // Last 12 months
    for (let i = 11; i >= 0; i--) {
      const month = new Date(now);
      month.setMonth(month.getMonth() - i);
      const monthStr = month.toLocaleDateString('en-US', { month: 'short' });
      
      const count = workOrders.filter(wo => {
        const woDate = new Date(wo.date_requested);
        return woDate.getMonth() === month.getMonth() && 
               woDate.getFullYear() === month.getFullYear();
      }).length;
      
      trendData.push({
        date: monthStr,
        count
      });
    }
  }
  
  return trendData;
};

// Process top problematic assets
const processProblematicAssets = (incidents, assets) => {
  const assetIncidentCount = {};
  
  incidents.forEach(incident => {
    const assetId = incident.asset_id;
    assetIncidentCount[assetId] = (assetIncidentCount[assetId] || 0) + 1;
  });
  
  return Object.entries(assetIncidentCount)
    .map(([assetId, count]) => {
      const asset = assets.find(a => a.asset_id === parseInt(assetId));
      return {
        name: asset?.asset_name || asset?.asset_code || `Asset ${assetId}`,
        incidents: count
      };
    })
    .sort((a, b) => b.incidents - a.incidents)
    .slice(0, 5); // Top 5 problematic assets
};

export default function Reports() {
  // State management
  const [period, setPeriod] = useState('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(new Date());

  // Search & filters
// Data state
const [data, setData] = useState({
  workOrders: [],
  incidentReports: [],
  maintenanceSchedules: [],
  assets: [],
  users: [],
  summary: null,
  analytics: null,
  performanceMetrics: null
});


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
      summary,
      analytics,
      performanceMetrics
    ] = await Promise.all([
      apiService.getWorkOrders(),
      apiService.getIncidentReports(),
      apiService.getMaintenanceSchedules(),
      apiService.getAssets(),
      apiService.getUsers(),
      apiService.getDashboardSummary(period),
      apiService.getAnalyticsData(period),
      apiService.getPerformanceMetrics(period)
    ]);

    setData({
      workOrders,
      incidentReports,
      maintenanceSchedules,
      assets,
      users,
      summary,
      analytics,
      performanceMetrics
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


const chartData = useMemo(() => {
  if (!data.analytics) return null;
  
  return {
    categoryData: processWorkOrdersByCategory(data.analytics.workOrders),
    statusData: processStatusDistribution(data.analytics.workOrders),
    trendData: processTrendData(data.analytics.workOrders, period),
    problematicAssets: processProblematicAssets(data.analytics.incidents, data.analytics.assets)
  };
}, [data.analytics, period]);
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
<div className="d-flex gap-2 align-items-center">
  <Form.Select 
    value={period} 
    onChange={(e) => setPeriod(e.target.value)}
    style={{ width: '150px', fontSize: '0.875rem',height: '38px' }}
    className="border-0 shadow-sm"
    size="sm"
  >
    {PERIODS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
  </Form.Select>
  
  {/* Export Buttons */}
  <Button 
    variant="outline-primary" 
    size="sm"
    className="px-3 py-2"
    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
    onClick={() => {
      const headers = ['ID', 'Title', 'Category', 'Status', 'Created', 'Assigned', 'Requestee'];
      const rows = [headers, ...data.workOrders.map(w => [
        w.id, w.title, w.category, w.status, w.created_at, w.assigned, w.requestee
      ])];
      downloadCSV(`work_orders_${period}_${new Date().toISOString().split('T')[0]}.csv`, rows);
    }}
  >
    <i className="fas fa-file-csv me-1"></i>
    Work Orders
  </Button>
  
  <Button 
    variant="outline-success" 
    size="sm"
    className="px-3 py-2"
    style={{ fontSize: '0.875rem', whiteSpace: 'nowrap' }}
    onClick={() => {
      const headers = ['ID', 'Title', 'Reporter', 'Status', 'Submitted'];
      const rows = [headers, ...data.incidentReports.map(i => [
        i.id, i.title, i.reporter, i.status, i.created_at
      ])];
      downloadCSV(`incidents_${period}_${new Date().toISOString().split('T')[0]}.csv`, rows);
    }}
  >
    <i className="fas fa-file-excel me-1"></i>
    Incidents
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

{/* Performance Metrics Cards */}
        {data.performanceMetrics && (
          <Row className="g-3 mb-4">
            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Card.Body className="p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 opacity-75" style={{ fontSize: '0.85rem' }}>Avg Resolution Time</p>
                      <h2 className="mb-0 fw-bold">{data.performanceMetrics.avgResolutionTime} days</h2>
                    </div>
                    <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <i className="fas fa-clock fs-4"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                <Card.Body className="p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 opacity-75" style={{ fontSize: '0.85rem' }}>Completion Rate</p>
                      <h2 className="mb-0 fw-bold">{data.performanceMetrics.completionRate}%</h2>
                    </div>
                    <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <i className="fas fa-check-circle fs-4"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                <Card.Body className="p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 opacity-75" style={{ fontSize: '0.85rem' }}>On-Time Rate</p>
                      <h2 className="mb-0 fw-bold">{data.performanceMetrics.onTimeRate}%</h2>
                    </div>
                    <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <i className="fas fa-thumbs-up fs-4"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xl={3} lg={6} md={6}>
              <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' }}>
                <Card.Body className="p-3 text-white">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 opacity-75" style={{ fontSize: '0.85rem' }}>Tasks Completed</p>
                      <h2 className="mb-0 fw-bold">{data.performanceMetrics.totalCompleted}</h2>
                    </div>
                    <div className="p-3 rounded-circle" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}>
                      <i className="fas fa-tasks fs-4"></i>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        )}

        {/* Charts Section */}
        {chartData && (
          <>
            <Row className="g-3 mb-4">
              {/* Work Order Trends Chart */}
              <Col lg={8}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <Card.Body className="p-4">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="mb-0 fw-semibold">Work Order Trends</h5>
                      <Badge bg="primary" className="px-3 py-2">{period === 'today' || period === 'weekly' ? 'Daily' : period === 'monthly' ? 'Weekly' : 'Monthly'}</Badge>
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={chartData.trendData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="date" stroke="#666" style={{ fontSize: '0.85rem' }} />
                        <YAxis stroke="#666" style={{ fontSize: '0.85rem' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="count" 
                          name="Work Orders"
                          stroke="#0088FE" 
                          strokeWidth={3}
                          dot={{ fill: '#0088FE', r: 5 }}
                          activeDot={{ r: 7 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>

              {/* Status Distribution Pie Chart */}
              <Col lg={4}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <Card.Body className="p-4">
                    <h5 className="mb-3 fw-semibold">Status Distribution</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={chartData.statusData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {chartData.statusData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            <Row className="g-3 mb-4">
              {/* Top Categories Bar Chart */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <Card.Body className="p-4">
                    <h5 className="mb-3 fw-semibold">Top Work Order Categories</h5>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={chartData.categoryData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" stroke="#666" style={{ fontSize: '0.85rem' }} />
                        <YAxis stroke="#666" style={{ fontSize: '0.85rem' }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#fff', 
                            border: '1px solid #e0e0e0', 
                            borderRadius: '8px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                          }} 
                        />
                        <Bar dataKey="value" fill="#00C49F" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </Card.Body>
                </Card>
              </Col>

              {/* Top Problematic Assets */}
              <Col lg={6}>
                <Card className="border-0 shadow-sm h-100" style={{ borderRadius: '12px' }}>
                  <Card.Body className="p-4">
                   <div className="d-flex justify-content-between align-items-center mb-3">
  <div>
    <h5 className="mb-0 fw-semibold">Assets with Most Incidents</h5>
    <small className="text-muted">Based on incident report frequency</small>
  </div>
</div>
                    {chartData.problematicAssets.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={chartData.problematicAssets} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis type="number" stroke="#666" style={{ fontSize: '0.85rem' }} />
                          <YAxis dataKey="name" type="category" width={120} stroke="#666" style={{ fontSize: '0.85rem' }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#fff', 
                              border: '1px solid #e0e0e0', 
                              borderRadius: '8px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                            }} 
                          />
                          <Bar dataKey="incidents" fill="#FF8042" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: '300px' }}>
                        <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
                        <p className="text-muted">No problematic assets found</p>
                      </div>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          </>
        )}

      </div>
    </SidebarLayout>
  );
}