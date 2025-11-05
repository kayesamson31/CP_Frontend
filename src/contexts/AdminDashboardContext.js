import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AdminDashboardContext = createContext();

export const useAdminDashboard = () => {
  const context = useContext(AdminDashboardContext);
  if (!context) {
    throw new Error('useAdminDashboard must be used within AdminDashboardProvider');
  }
  return context;
};

export const AdminDashboardProvider = ({ children }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastFetched, setLastFetched] = useState(null);
  const [organizationId, setOrganizationId] = useState(null);
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get admin user data
      const { data: userData } = await supabase
        .from('users')
        .select('full_name, organization_id, job_position, user_id')
        .eq('auth_uid', user.id)
        .single();

      if (!userData) return;

      const organizationId = userData.organization_id;
      setOrganizationId(organizationId); 
      const today = new Date();
      today.setHours(0, 0, 0, 0);

const [
  orgData,
  pendingApprovalsResult,
  [overdueMaintenanceResult, overdueWorkOrdersResult],
  maintenanceExtensionsResult,
  workOrderExtensionsResult,
  [scheduledMaintenanceResult, activeMaintenanceTasksResult],  // ✅ NOW IT'S AN ARRAY!
  recentActivityResult,
  personnelResult,
  workOrdersResult,
  maintenanceTasksResult
] = await Promise.all([
        // Organization name
        supabase
          .from('organizations')
          .select('org_name')
          .eq('organization_id', organizationId)
          .single(),
        
        // Pending Approvals
        supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .eq('status_id', 6), 
        
      // Overdue Tasks - Both Maintenance Tasks and Work Orders
Promise.all([
  // Overdue Maintenance Tasks (active statuses only)
  supabase
    .from('maintenance_tasks')
    .select('task_id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .lt('due_date', new Date().toISOString().split('T')[0])
    .in('status_id', [1, 2]), // Pending, In Progress ONLY
  
  // Overdue Work Orders (active statuses only)
  supabase
    .from('work_orders')
    .select('work_order_id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .lt('due_date', new Date().toISOString().split('T')[0])
    .in('status_id', [1, 2]) // Pending, In Progress ONLY
]),
       // Extension Records - Maintenance Tasks
supabase
  .from('maintenance_task_extensions')
  .select('task_id')
  .eq('organization_id', organizationId),

// Extension Records - Work Orders (no org filter since it's null, filter later via work_orders)
supabase
  .from('work_order_extensions')
  .select('work_order_id'),

       // Asset Maintenance - Check BOTH scheduled maintenance AND active tasks
Promise.all([
  // Assets with scheduled maintenance today
  supabase
    .from('assets')
    .select('asset_id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('next_maintenance', new Date().toISOString().split('T')[0])
    .eq('asset_status', 'active'),
  
  // Assets with active maintenance tasks (Pending or In Progress)
  supabase
    .from('maintenance_tasks')
    .select('asset_id')
    .eq('organization_id', organizationId)
    .in('status_id', [1, 2]) // Pending, In Progress
]),
        
        // Recent Activity
        supabase
          .from('activity_tracking')
          .select(`
            activity_id,
            activity_type,
            description,
            timestamp,
            user_id,
            users!activity_tracking_user_id_fkey (full_name)
          `)
          .eq('organization_id', organizationId)
          .order('timestamp', { ascending: false })
          .limit(5),
        
        // Available Personnel
        supabase
          .from('users')
          .select('user_id, full_name, job_position, user_status')
          .eq('organization_id', organizationId)
          .eq('role_id', 3)
          .eq('user_status', 'active')
          .order('full_name', { ascending: true }),
        
        // Work Orders for calendar
        supabase
          .from('work_orders')
          .select(`
            work_order_id,
            title,
            description,
            due_date,
            location,
            category,
            asset_text,
            assigned_to,
            status_id,
            priority_id,
            admin_priority_id,
            users!work_orders_assigned_to_fkey(full_name),
            priority_levels!work_orders_priority_id_fkey(priority_name),
            admin_priority_levels:priority_levels!work_orders_admin_priority_id_fkey(priority_name),
            statuses(status_name)
          `)
          .eq('organization_id', organizationId)
          .not('assigned_to', 'is', null)
          .in('status_id', [1, 2]),
        
        // Maintenance Tasks for calendar
        supabase
          .from('maintenance_tasks')
          .select(`
            task_id,
            task_name,
            description,
            due_date,
            assigned_to,
            status_id,
            priority_id,
            asset_id,
            incident_id,
            users!maintenance_tasks_assigned_to_fkey(full_name),
            priority_levels!maintenance_tasks_priority_id_fkey(priority_name),
            statuses(status_name),
            assets(asset_name, location)
          `)
          .eq('organization_id', organizationId)
          .not('assigned_to', 'is', null)
          .in('status_id', [1, 2])
      ]);

      // Calculate Total Overdue Tasks
const overdueMaintenanceCount = overdueMaintenanceResult.count || 0;
const overdueWorkOrdersCount = overdueWorkOrdersResult.count || 0;
const totalOverdueTasks = overdueMaintenanceCount + overdueWorkOrdersCount;

console.log('🔴 Overdue Maintenance Tasks:', overdueMaintenanceCount);
console.log('🔴 Overdue Work Orders:', overdueWorkOrdersCount);
console.log('🔴 TOTAL Overdue Tasks:', totalOverdueTasks);

// Process Extended Tasks - Count both Maintenance Tasks and Work Orders
let extendedCount = 0;

// Count extended maintenance tasks
let extendedMaintenanceTasks = 0;
if (maintenanceExtensionsResult.data && maintenanceExtensionsResult.data.length > 0) {
  const uniqueTaskIds = [...new Set(maintenanceExtensionsResult.data.map(r => r.task_id))];
  const { data: activeTasks } = await supabase
    .from('maintenance_tasks')
    .select('task_id')
    .in('task_id', uniqueTaskIds)
    .in('status_id', [1, 2]); // Pending, In Progress
  extendedMaintenanceTasks = activeTasks?.length || 0;
}

// Count extended work orders
let extendedWorkOrders = 0;
if (workOrderExtensionsResult.data && workOrderExtensionsResult.data.length > 0) {
  const uniqueWOIds = [...new Set(workOrderExtensionsResult.data.map(r => r.work_order_id))];
 
  const { data: activeWOs } = await supabase
    .from('work_orders')
    .select('work_order_id')
    .in('work_order_id', uniqueWOIds)
    .eq('organization_id', organizationId)
    .in('status_id', [1, 2]); // Pending, In Progress
  extendedWorkOrders = activeWOs?.length || 0;
}

// Total extended tasks
extendedCount = extendedMaintenanceTasks + extendedWorkOrders;

console.log('🔍 Extended Maintenance Tasks:', extendedMaintenanceTasks);
console.log('🔍 Extended Work Orders:', extendedWorkOrders);
console.log('🔍 TOTAL Extended Count:', extendedCount);

// Process Personnel with status
const personnelWithStatus = await Promise.all(
  (personnelResult.data || []).map(async (person) => {
    // ✅ Count active maintenance tasks
    const { count: activeTasks } = await supabase
      .from('maintenance_tasks')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', person.user_id)
      .in('status_id', [1, 2]);

    // ✅ Count active work orders
    const { count: activeWorkOrders } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .eq('assigned_to', person.user_id)
      .in('status_id', [1, 2]); // 1=Pending, 2=In Progress

    // ✅ Total active assignments
    const totalActive = (activeTasks || 0) + (activeWorkOrders || 0);

    return {
      name: person.full_name,
      role: person.job_position || 'Personnel',
      status: totalActive > 0 ? 'On Task' : 'Available',
      statusColor: totalActive > 0 ? '#0d6efd' : '#198754',
      activeTaskCount: totalActive // ✅ Combined count
    };
  })
);

      // Transform Work Orders for calendar
      const transformedWO = (workOrdersResult.data || []).map(wo => ({
        id: wo.work_order_id,
        title: wo.title,
        description: wo.description || 'No description',
        date: wo.due_date ? wo.due_date.split('T')[0] : null,
        type: 'work_order',
        location: wo.location || 'Not specified',
        category: wo.category || 'General',
        asset: wo.asset_text || 'Not specified',
        priority: (wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'medium').toLowerCase(),
        status: wo.statuses?.status_name || 'Pending',
        personnelName: wo.users?.full_name || 'Unassigned',
        personnelId: wo.assigned_to
      }));

      // Transform Maintenance Tasks for calendar
      const transformedMT = (maintenanceTasksResult.data || []).map(mt => ({
        id: mt.task_id,
        title: mt.task_name,
        description: mt.description || 'No description',
        date: mt.due_date ? mt.due_date.split('T')[0] : null,
        type: mt.incident_id ? 'incident_task' : 'maintenance_task',
        location: mt.assets?.location || 'Not specified',
        category: 'Maintenance',
        asset: mt.assets?.asset_name || 'Not specified',
        priority: (mt.priority_levels?.priority_name || 'medium').toLowerCase(),
        status: mt.statuses?.status_name || 'Pending',
        personnelName: mt.users?.full_name || 'Unassigned',
        personnelId: mt.assigned_to,
        isIncidentRelated: !!mt.incident_id
      }));

      // Format recent activities
      const formatTimeAgo = (timestamp) => {
        const now = new Date();
        const time = new Date(timestamp);
        const diffInMinutes = Math.floor((now - time) / 60000);
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      };

      const formattedActivities = (recentActivityResult.data || []).map(activity => ({
        action: activity.description,
        user: activity.users?.full_name || 'Unknown',
        time: formatTimeAgo(activity.timestamp),
        type: activity.activity_type
      }));

      // Build final data
      const data = {
        adminName: userData.full_name || 'Admin',
        userRole: userData.job_position || 'Facility Manager',
        organizationName: orgData.data?.org_name || 'Organization',
        statsData: [
          {
            title: "Pending Approvals",
            value: pendingApprovalsResult.count || 0,
            subtitle: "Work orders awaiting review",
            color: "#dc3545",
            route: "/dashboard-admin/WorkOrder"
          },
          {
            title: "Overdue Tasks",
          value: totalOverdueTasks, // ← NEW
            subtitle: "Maintenance past due",
            color: "#fd7e14",
            route: "/dashboard-admin/MaintenanceTasks"
          },
          {
            title: "Extended Tasks",
            value: extendedCount,
            subtitle: "Extended due dates",
            color: "#ffc107",
            route: "/dashboard-admin/MaintenanceTasks"
          },
          {
  title: "Asset Maintenance",
  value: (() => {
    // Count unique assets with active maintenance tasks
    const uniqueAssetIds = new Set(
      (activeMaintenanceTasksResult.data || []).map(task => task.asset_id)
    );
    // Add scheduled maintenance count
    const scheduledCount = scheduledMaintenanceResult.count || 0;
    // Total = scheduled + unique assets with active tasks
    return scheduledCount + uniqueAssetIds.size;
  })(),
  subtitle: "Assets needing service",
  color: "#17a2b8",
  route: "/dashboard-admin/AssetManagement"
}
        ],
        recentActivities: formattedActivities,
        availablePersonnel: personnelWithStatus,
        calendarEvents: [...transformedWO, ...transformedMT].filter(task => task.date)
      };

      setDashboardData(data);
      setLastFetched(new Date());
      
    } catch (error) {
      console.error('Error fetching admin dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Add this NEW useEffect for realtime subscription
useEffect(() => {
  if (!organizationId) return; // Wait for organizationId to be set

  console.log('🔌 Setting up realtime subscription for org:', organizationId);

  const subscription = supabase
    .channel('admin-dashboard-changes')
    .on('postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: 'maintenance_tasks',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('🔔 Maintenance task changed:', payload);
        refreshData();
      }
    )
    .on('postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'work_orders',
        filter: `organization_id=eq.${organizationId}`
      },
      (payload) => {
        console.log('🔔 Work order changed:', payload);
        refreshData();
      }
    )
    .subscribe();

  // Cleanup subscription when component unmounts or organizationId changes
  return () => {
    console.log('🔌 Cleaning up realtime subscription');
    supabase.removeChannel(subscription);
  };
}, [organizationId]); // Run when organizationId changes

  const refreshData = () => {
    return fetchAllData();
  };

  return (
    <AdminDashboardContext.Provider value={{ dashboardData, loading, refreshData, lastFetched }}>
      {children}
    </AdminDashboardContext.Provider>
  );
};