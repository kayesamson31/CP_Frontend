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
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Fetch all data in parallel
      const [
        orgData,
        pendingApprovalsResult,
        overdueTasksResult,
        extensionRecordsResult,
        assetMaintenanceResult,
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
          .in('status_id', [1, 6]),
        
        // Overdue Tasks
        supabase
          .from('maintenance_tasks')
          .select('task_id, status_id, due_date')
          .eq('organization_id', organizationId)
          .lt('due_date', new Date().toISOString())
          .in('status_id', [1, 2, 6]),
        
        // Extension Records
        supabase
          .from('maintenance_task_extensions')
          .select('task_id')
          .eq('organization_id', organizationId),
        
        // Asset Maintenance
        supabase
          .from('assets')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', organizationId)
          .lte('next_maintenance', new Date().toISOString())
          .eq('asset_status', 'active'),
        
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

      // Process Extended Tasks
      let extendedCount = 0;
      if (extensionRecordsResult.data && extensionRecordsResult.data.length > 0) {
        const uniqueTaskIds = [...new Set(extensionRecordsResult.data.map(r => r.task_id))];
        const { data: activeTasks } = await supabase
          .from('maintenance_tasks')
          .select('task_id')
          .in('task_id', uniqueTaskIds)
          .in('status_id', [1, 2, 6]);
        extendedCount = activeTasks?.length || 0;
      }

      // Process Personnel with status
      const personnelWithStatus = await Promise.all(
        (personnelResult.data || []).map(async (person) => {
          const { count: activeTasks } = await supabase
            .from('maintenance_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', person.user_id)
            .in('status_id', [1, 2]);

          return {
            name: person.full_name,
            role: person.job_position || 'Personnel',
            status: activeTasks > 0 ? 'On Task' : 'Available',
            statusColor: activeTasks > 0 ? '#0d6efd' : '#198754',
            activeTaskCount: activeTasks || 0
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
        userRole: userData.job_position || 'Admin Official',
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
            value: overdueTasksResult.data?.length || 0,
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
            value: assetMaintenanceResult.count || 0,
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

  const refreshData = () => {
    return fetchAllData();
  };

  return (
    <AdminDashboardContext.Provider value={{ dashboardData, loading, refreshData, lastFetched }}>
      {children}
    </AdminDashboardContext.Provider>
  );
};