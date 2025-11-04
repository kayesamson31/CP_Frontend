import React, { useState, useEffect } from 'react';
import { Col, Modal, Badge } from 'react-bootstrap';
import { assetService } from '../services/assetService'; 
import { supabase } from '../supabaseClient';
import { AuthUtils } from '../utils/AuthUtils';
import { logActivity } from '../utils/ActivityLogger';
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  CalendarDays
} from 'lucide-react';

const globalStyles = document.createElement('style');
globalStyles.innerHTML = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

// Only add styles once
if (typeof document !== 'undefined' && !document.querySelector('#personnel-dashboard-styles')) {
  globalStyles.id = 'personnel-dashboard-styles';
  document.head.appendChild(globalStyles);
}

// API service functions (replace with actual API calls later)
const apiService = {
  async updateTaskStatus(taskId, taskType, status, reason, newDate = null) {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: userProfile } = await supabase
        .from('users')
        .select('user_id')
        .eq('auth_uid', userData.user.id)
        .single();

      let statusId;
      switch(status) {
        case 'in-progress': statusId = 2; break;
        case 'completed': statusId = 3; break;
        case 'failed': statusId = 11; break;
        default: statusId = 1;
      }

       // Handle maintenance_task updates
    // Inside apiService.updateTaskStatus, update the maintenance_task extension handling:

if (taskType === 'maintenance_task') {
  // Handle extension for maintenance tasks
  if (newDate && status === 'in-progress') {
    // Get current task data
    const { data: currentTask } = await supabase
      .from('maintenance_tasks')
      .select('due_date, original_due_date, extension_count')
      .eq('task_id', taskId)
      .single();

  const { data: userOrgData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('user_id', userProfile.user_id)
  .single();

// ✅ Then insert with organization_id
await supabase
  .from('maintenance_task_extensions')
  .insert({
    task_id: taskId,
    old_due_date: currentTask.due_date,
    new_due_date: newDate,
    extension_reason: reason,
    extended_by: userProfile.user_id,
    organization_id: userOrgData.organization_id  // ✅ ADD THIS
  });

    // Update maintenance_tasks with extension data
    const taskUpdate = {
      status_id: statusId,
      due_date: newDate,
      original_due_date: currentTask.original_due_date || currentTask.due_date,
      extension_count: (currentTask.extension_count || 0) + 1,
      last_extension_date: new Date().toISOString(),
      last_extension_reason: reason,
      extended_by: userProfile.user_id
    };

    const { data, error } = await supabase
      .from('maintenance_tasks')
      .update(taskUpdate)
      .eq('task_id', taskId)
      .select();

    if (error) throw error;
    // ✅ FETCH EXTENSION HISTORY AFTER INSERT
const { data: extensionHistory } = await supabase
  .from('maintenance_task_extensions')
  .select('*')
  .eq('task_id', taskId)
  .order('extension_date', { ascending: false });

// ✅ ATTACH TO RETURNED DATA
const taskWithExtensions = {
  ...data[0],
  maintenance_task_extensions: extensionHistory || []
};

    await logActivity('request_task_extension', `Requested extension for maintenance task #${taskId} from ${new Date(currentTask.due_date).toLocaleDateString()} to ${new Date(newDate).toLocaleDateString()} - Reason: ${reason}`);
    try {
const { data: userOrgData } = await supabase
  .from('users')
  .select('organization_id')
  .eq('user_id', userProfile.user_id)
  .single();

// Then add to notification:
await supabase.from('notifications').insert({
  notification_type_id: 3,
  created_by: userProfile.user_id,
  title: 'Maintenance Task Extended',
  message: `Personnel extended maintenance task #${taskId}...`,
  target_roles: '2',
  priority_id: 2,
  related_table: 'maintenance_tasks',
  related_id: taskId,
  organization_id: userOrgData.organization_id, // ✅ ADD THIS
  is_active: true
});
      console.log('✅ Admin notified about task extension');
    } catch (notifError) {
      console.error('❌ Failed to notify admin about extension:', notifError);
    }

   return { success: true, data: taskWithExtensions };
  }

  // Regular status update for maintenance tasks (non-extension)
// Regular status update for maintenance tasks (non-extension)
// Regular status update for maintenance tasks (non-extension)
const updateData = {
  status_id: statusId,
  ...(status === 'completed' && { date_completed: new Date().toISOString() }),
  ...(reason && { remarks: reason })
};

const { data, error } = await supabase
  .from('maintenance_tasks')
  .update(updateData)
  .eq('task_id', taskId)
  .select('*, asset_id, incident_id');

if (error) throw error;

// Update asset status to operational when task is completed
if (status === 'completed' && data?.[0]?.asset_id) {
  await supabase
    .from('assets')
    .update({ 
      asset_status: 'active',
      last_maintenance: new Date().toISOString()
    })
    .eq('asset_id', data[0].asset_id);
  
  // ✅ AUTO-RESOLVE RELATED INCIDENT
// ✅ AUTO-UPDATE RELATED INCIDENT STATUS
// ✅ AUTO-UPDATE RELATED INCIDENT STATUS (WITH DEBUG LOGGING)
if (data[0].incident_id) {
  try {
    console.log('🔍 Task completed/failed - checking incident:', {
      taskId: taskId,
      incidentId: data[0].incident_id,
      taskStatus: status
    });
    
    // Map maintenance task status to incident status
    const incidentStatusMap = {
      'completed': 'Completed',  // ✅ Success
      'failed': 'Failed'         // ❌ Failed
    };
    
    const incidentStatus = incidentStatusMap[status];
    
    if (incidentStatus) {
      console.log(`📝 Attempting to update incident ${data[0].incident_id} to status: ${incidentStatus}`);
      
      const result = await assetService.updateIncidentStatus(
        `INC-${data[0].incident_id}`,  // ✅ FIX: Add "INC-" prefix
        incidentStatus
      );
      
      console.log(`✅ Incident ${data[0].incident_id} marked as ${incidentStatus}`, result);
    } else {
      console.log('⚠️ No incident status mapping for task status:', status);
    }
  } catch (incidentError) {
    console.error('❌ Failed to update incident status:', incidentError);
  }
}
}

// ✅ NOTIFY ADMIN about maintenance task update (exclude incident-related tasks to avoid duplicates)
if (!data[0]?.incident_id) {
  try {
    const statusMessage = status === 'completed' 
      ? `Personnel completed maintenance task #${taskId}` 
      : status === 'failed'
      ? `Personnel marked maintenance task #${taskId} as failed${reason ? ': ' + reason : ''}`
      : status === 'in-progress'
      ? newDate 
        ? `Personnel extended maintenance task #${taskId} due date to ${new Date(newDate).toLocaleDateString()}${reason ? ' - Reason: ' + reason : ''}`
        : `Personnel started working on maintenance task #${taskId}`
      : `Personnel updated maintenance task #${taskId} to ${status}`;

    const { data: userOrgData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('user_id', userProfile.user_id)
      .single();

    await supabase.from('notifications').insert({
      notification_type_id: 3,
      created_by: userProfile.user_id,
      title: `Maintenance Task ${
        status === 'completed' ? 'Completed' : 
        status === 'failed' ? 'Failed' : 
        status === 'in-progress' ? (newDate ? 'Extended' : 'In Progress') : 
        'Updated'
      }`,
      message: statusMessage,
      target_roles: '2',
      priority_id: status === 'failed' ? 3 : 2,
      related_table: 'maintenance_tasks',
      related_id: taskId,
      organization_id: userOrgData.organization_id,
      is_active: true
    });
  } catch (notifError) {
    console.error('Failed to create admin notification:', notifError);
  }
}
// ✅ NOTIFY ADMIN about maintenance task update
// ✅ NOTIFY ADMIN about maintenance task update (FOR INCIDENT-RELATED TASKS)
// PALITAN MO YUNG CONDITION MULA:
// if (data[0]?.incident_id && (status === 'completed' || status === 'failed')) {
// PAPUNTA SA:
if (data[0]?.incident_id && (status === 'in-progress' || status === 'completed' || status === 'failed')) {
  try {
    const statusMessage = status === 'completed' 
      ? `Personnel completed maintenance task #${taskId} for incident report` 
      : status === 'failed'
      ? `Personnel marked maintenance task #${taskId} as failed${reason ? ': ' + reason : ''}`
      : status === 'in-progress'
      ? newDate 
        ? `Personnel extended maintenance task #${taskId} due date to ${new Date(newDate).toLocaleDateString()}${reason ? ' - Reason: ' + reason : ''}`
        : `Personnel started working on incident-related maintenance task #${taskId}`
      : `Personnel updated maintenance task #${taskId} to ${status}`;

    const { data: userOrgData } = await supabase
      .from('users')
      .select('organization_id')
      .eq('user_id', userProfile.user_id)
      .single();

    await supabase.from('notifications').insert({
      notification_type_id: 3,
      created_by: userProfile.user_id,
      title: `Maintenance Task ${
        status === 'completed' ? 'Completed' : 
        status === 'failed' ? 'Failed' : 
        status === 'in-progress' ? (newDate ? 'Extended' : 'In Progress') : 
        'Updated'
      }`,
      message: statusMessage,
      target_roles: '2',
      priority_id: status === 'failed' ? 3 : 2,
      related_table: 'maintenance_tasks',
      related_id: taskId,
      organization_id: userOrgData.organization_id,
      is_active: true
    });
    
    console.log('✅ Admin notified about incident task update:', status);
  } catch (notifError) {
    console.error('❌ Failed to create admin notification:', notifError);
  }
}
await logActivity('update_task_status', `Updated maintenance task #${taskId} status to: ${status}${reason ? ' - Reason: ' + reason : ''}`);
return { success: true, data: data?.[0] };
}  // ← This closes the maintenance_task if block

    // Handle extension logic
    if (newDate && status === 'in-progress') {
      // Get current work order data
      const { data: currentWO } = await supabase
        .from('work_orders')
        .select('due_date, original_due_date, extension_count')
        .eq('work_order_id', taskId)
        .single();

      // Insert extension history
      await supabase
        .from('work_order_extensions')
        .insert({
          work_order_id: taskId,
          old_due_date: currentWO.due_date,
          new_due_date: newDate,
          extension_reason: reason,
          extended_by: userProfile.user_id
        });

      // Update work_orders with extension data
// Update work_orders with extension data
const workOrderUpdate = {
  status_id: statusId,
  due_date: newDate,
  original_due_date: currentWO.original_due_date || currentWO.due_date,
  extension_count: (currentWO.extension_count || 0) + 1,
  last_extension_date: new Date().toISOString(),
  last_extension_reason: reason,
  extended_by: userProfile.user_id
};

const { data: workOrderData, error: workOrderError } = await supabase
  .from('work_orders')
  .update(workOrderUpdate)
  .eq('work_order_id', taskId)
  .select();

if (workOrderError) throw workOrderError;

// Notify admin and requester about extension
try {
  const { data: userOrgData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('user_id', userProfile.user_id)
    .single();

  const { data: woData } = await supabase
    .from('work_orders')
    .select('requested_by, title')
    .eq('work_order_id', taskId)
    .single();

  const extensionMessage = `Personnel extended work order #${taskId}: "${woData?.title}" to ${new Date(newDate).toLocaleDateString()}${reason ? ' - Reason: ' + reason : ''}`;

  // 1️⃣ Notification for ADMIN
  await supabase.from('notifications').insert({
    notification_type_id: 3,
    created_by: userProfile.user_id,
    title: 'Work Order Extended',
    message: extensionMessage,
    target_roles: '2',
    target_user_id: null,
    priority_id: 2,
    related_table: 'work_orders',
    related_id: taskId,
    organization_id: userOrgData.organization_id,
    is_active: true
  });

  // 2️⃣ Notification for REQUESTER
  await supabase.from('notifications').insert({
    notification_type_id: 3,
    created_by: userProfile.user_id,
    title: 'Your Work Order Extended',
    message: extensionMessage,
    target_roles: null,
    target_user_id: woData?.requested_by,
    priority_id: 2,
    related_table: 'work_orders',
    related_id: taskId,
    organization_id: userOrgData.organization_id,
    is_active: true
  });
  
  console.log('Admin and requester notified about work order extension');
} catch (notifError) {
  console.error('âŒ Failed to notify about extension:', notifError);
}

await logActivity('request_task_extension', `Requested extension for work order #${taskId} to ${new Date(newDate).toLocaleDateString()} - Reason: ${reason}`);

return { success: true, data: workOrderData?.[0] };
      // Log activity - Task extension request
    }

    // Regular status update (not extension)
// Regular status update (not extension)
const workOrderUpdate = {
  status_id: statusId,
  ...(status === 'completed' || status === 'failed' ? { date_resolved: new Date().toISOString() } : {}),
  ...(status === 'failed' && reason ? { failure_reason: reason } : {})
};

const { data: workOrderData, error: workOrderError } = await supabase
  .from('work_orders')
  .update(workOrderUpdate)
  .eq('work_order_id', taskId)
  .select('*, requested_by'); // ✅ Include requested_by

if (workOrderError) throw workOrderError;

// Optional work_order_details update wrapped in try-catch
try {
  const detailsUpdate = {
    status_id: statusId
  };

  await supabase
    .from('work_order_details')
    .update(detailsUpdate)
    .eq('work_order_id', taskId);
} catch (detailsErr) {
  console.warn('Work order details update failed, but continuing...');
}

// Notify admin and requester about status update
try {
  const statusMessage = status === 'completed' 
    ? `Personnel completed work order #${taskId}` 
    : status === 'failed'
    ? `Personnel marked work order #${taskId} as failed${reason ? ': ' + reason : ''}`
    : status === 'in-progress'
    ? `Personnel started working on work order #${taskId}`
    : `Personnel updated work order #${taskId} to ${status}`;

  const { data: userOrgData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('user_id', userProfile.user_id)
    .single();

  //SOLUTION: Create TWO separate notifications
  
  // 1️⃣ Notification for ADMIN (role-based)
  await supabase.from('notifications').insert({
    notification_type_id: 3,
    created_by: userProfile.user_id,
    title: `Work Order ${
      status === 'completed' ? 'Completed' : 
      status === 'failed' ? 'Failed' : 
      status === 'in-progress' ? 'In Progress' : 
      'Updated'
    }`,
    message: statusMessage,
    target_roles: '2', // ONLY admin role
    target_user_id: null, //NULL = all admins get it
    priority_id: status === 'failed' ? 3 : 2,
    related_table: 'work_orders',
    related_id: taskId,
    organization_id: userOrgData.organization_id,
    is_active: true
  });

  // 2️⃣ Notification for REQUESTER (specific user)
  await supabase.from('notifications').insert({
    notification_type_id: 3,
    created_by: userProfile.user_id,
    title: `Your Work Order ${
      status === 'completed' ? 'Completed' : 
      status === 'failed' ? 'Failed' : 
      status === 'in-progress' ? 'In Progress' : 
      'Updated'
    }`,
    message: statusMessage,
    target_roles: null, //NULL because we're targeting specific user
    target_user_id: workOrderData[0]?.requested_by, //Specific requester
    priority_id: status === 'failed' ? 3 : 2,
    related_table: 'work_orders',
    related_id: taskId,
    organization_id: userOrgData.organization_id,
    is_active: true
  });
  
  console.log('Admin and requester notified about work order status update');
} catch (notifError) {
  console.error('âŒ Failed to create notification:', notifError);
}

await logActivity('update_task_status', `Updated work order #${taskId} status to: ${status}${reason ? ' - Reason: ' + reason : ''}`);
return { success: true, data: workOrderData?.[0] || workOrderData };
    // Log activity - Work order status update
} catch (error) {
    console.error('Error updating task status:', error);
    return { success: false, error: error.message };
  }
}
};



export default function DashboardPersonnel() {
  const [currentDate, setCurrentDate] = useState(new Date());  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [personnelName, setPersonnelName] = useState('Personnel');
  const [personnelRole, setPersonnelRole] = useState('Personnel');
  const [organizationName, setOrganizationName] = useState('Organization');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modals
  const [selectedTask, setSelectedTask] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // Inputs
  const [statusReason, setStatusReason] = useState('');
  const [newDueDate, setNewDueDate] = useState('');

  // Tabs
// Tabs
const [showHistory, setShowHistory] = useState(false);
const [filterKey, setFilterKey] = useState(0);
// Filters for History Tab
const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'completed', 'failed'
const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', 'week', 'month', '3months'

 const formatTimeTo12Hour = (time24) => {
    if (!time24) return '';
    
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Helper functions to capitalize text
const capitalizeStatus = (status) => {
  if (status === 'in-progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const capitalizePriority = (priority) => {
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

  // Load tasks from backend
  useEffect(() => {
    loadTasks();
  }, []);
// Fetch personnel info
  useEffect(() => {
    const fetchPersonnelData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: userData } = await supabase
          .from('users')
          .select('full_name, organization_id, job_position')
          .eq('auth_uid', user.id)
          .single();

        if (userData) {
          setPersonnelName(userData.full_name);
          setPersonnelRole(userData.job_position || 'Personnel');
          
          const { data: orgData } = await supabase
            .from('organizations')
            .select('org_name')
            .eq('organization_id', userData.organization_id)
            .single();
          
          if (orgData) {
            setOrganizationName(orgData.org_name);
          }
        }
      } catch (error) {
        console.error('Error fetching personnel data:', error);
      }
    };

    fetchPersonnelData();
  }, []);

const loadTasks = async () => {
  try {
    setLoading(true);
    setError(null);
        
    // Get current user auth ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
        
    // Get user profile to find user_id
   const { data: userProfile, error: profileError } = await supabase
  .from('users')
  .select('user_id, full_name, organization_id')
  .eq('auth_uid', userData.user.id)
  .single();

const orgId = userProfile.organization_id;
      
    if (profileError) {
      console.error('Error getting user profile:', profileError);
      throw profileError;
    }

    // Fetch both work orders AND maintenance tasks
    const [workOrders, maintenanceTasks] = await Promise.all([
      // Work orders query
     supabase
  .from('work_orders')
  .select(`
    *,
    priority_levels!work_orders_priority_id_fkey(priority_name, color_code),
    admin_priority_levels:priority_levels!work_orders_admin_priority_id_fkey(priority_name, color_code),
    statuses(status_name, color_code),
    work_order_extensions(*)
  `)
  .eq('organization_id', orgId)  
  .eq('assigned_to', userProfile.user_id),
      
      // Maintenance tasks query using assetService
      assetService.fetchMyTasks()
    ]);

    if (workOrders.error) {
      console.error('Error fetching work orders:', workOrders.error);
      throw workOrders.error;
    }

    const allTasks = [];

    // Transform work orders
    if (workOrders.data && workOrders.data.length > 0) {
      const transformedWorkOrders = workOrders.data.map(wo => {
        let statusName = 'pending';
        switch(wo.status_id) {
          case 1: statusName = 'pending'; break;
          case 2: statusName = 'in-progress'; break;
          case 3: statusName = 'completed'; break;
          case 11: statusName = 'failed'; break;
          default: statusName = 'pending';
        }

        const dueDate = new Date(wo.due_date);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const isOverdue = (statusName === 'pending' || statusName === 'in-progress') && 
                         dueDate < currentDate;

        return {
          id: wo.work_order_id,
          type: 'work_order', // Add type identifier
          title: wo.title || 'Untitled Task',
          description: wo.description || 'No description',
          category: wo.category || 'General',
          asset: wo.asset_text || 'Not specified',
          location: wo.location || 'Not specified',
          dueDate: wo.due_date,
          scheduledTime: wo.scheduled_time || null,
          originalDueDate: wo.original_due_date,
          priority: (wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'medium').toLowerCase(),
          status: statusName,
          isOverdue: isOverdue,
          failureReason: wo.failure_reason,
          extensionCount: wo.extension_count || 0,
          lastExtensionReason: wo.last_extension_reason,
          extensionHistory: wo.work_order_extensions || [],
          dateCompleted: wo.date_resolved,
          logs: []
        };
      });
      allTasks.push(...transformedWorkOrders);
    }

    // Transform maintenance tasks
    if (maintenanceTasks && maintenanceTasks.length > 0) {
      const transformedMaintenanceTasks = maintenanceTasks
  .filter(task => !task.workOrderId)
  .map(task => {
    console.log('📦 Mapping task:', task.taskId, 'Extensions:', task.maintenance_task_extensions); 
        const dueDate = new Date(task.dueDate);
        const currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        dueDate.setHours(0, 0, 0, 0);

        const statusName = task.status.toLowerCase().replace(' ', '-');
        const isOverdue = (statusName === 'pending' || statusName === 'in-progress') && 
                         dueDate < currentDate;

        return {
          id: task.taskId,
          type: 'maintenance_task', // Add type identifier
          title: task.title,
          description: task.description || 'No description',
         asset: task.asset?.name || task.workOrder?.asset?.name || 'Not specified',
        location: task.asset?.location || task.workOrder?.location || task.workOrder?.asset?.location || 'Not specified',
        category: task.asset?.category || task.workOrder?.category || 'Maintenance',
          dueDate: task.dueDate,
          scheduledTime: task.scheduledTime || null,
          originalDueDate: task.originalDueDate,
          priority: task.priority.toLowerCase(),
          status: statusName,
          isOverdue: isOverdue,
          failureReason: task.remarks,
           extensionCount: task.extension_count || 0,
          lastExtensionReason: task.last_extension_reason, 
         extensionHistory: task.extensionHistory || task.maintenance_task_extensions || [],
          dateCompleted: task.dateCompleted,
          logs: [],
          // Keep maintenance task specific data
          workOrderId: task.workOrderId,
          remarks: task.remarks
        };
      });
      allTasks.push(...transformedMaintenanceTasks);
    }

    // Sort all tasks by due date
    allTasks.sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));
    
    setTasks(allTasks);
    
  } catch (err) {
    setError('Failed to load tasks. Please try again.');
    console.error('Error loading tasks:', err);
  } finally {
    setLoading(false);
  }
};

  // Helpers
  const isSameDay = (d1, d2) => d1.toDateString() === d2.toDateString();
  
  const getTasksForDate = date => tasks.filter(t => 
    isSameDay(new Date(t.dueDate), date) && 
    (t.status === 'pending' || t.status === 'in-progress')
  );
  
  const priorityOrder = { high: 1, medium: 2, low: 3 };
  
  const sortTasks = list =>
    [...list].sort((a, b) =>
      priorityOrder[a.priority] !== priorityOrder[b.priority]
        ? priorityOrder[a.priority] - priorityOrder[b.priority]
        : new Date(a.dueDate) - new Date(b.dueDate)
    );
  
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };  

  const getTodayTasks = () => sortTasks(tasks.filter(t => 
    isSameDay(new Date(t.dueDate), new Date()) && 
    (t.status === 'pending' || t.status === 'in-progress')
  ));


const getCompletedTasks = () => {
  console.log('🔍 Getting completed tasks with filters:', { statusFilter, dateRangeFilter });
  
  let completedTasks = tasks.filter(t => 
    t.status === 'completed' || t.status === 'failed'
  );
  
  console.log('📊 Total completed/failed tasks:', completedTasks.length);
  
  // Apply status filter
  if (statusFilter !== 'all') {
    const beforeFilter = completedTasks.length;
    completedTasks = completedTasks.filter(t => t.status === statusFilter);
    console.log(`✅ After status filter (${statusFilter}):`, completedTasks.length, '(was', beforeFilter + ')');
  }
  
  // Apply date range filter
  if (dateRangeFilter !== 'all') {
    const now = new Date();
    const filterDate = new Date();
    
    switch(dateRangeFilter) {
      case 'week':
        filterDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        filterDate.setMonth(now.getMonth() - 1);
        break;
      case '3months':
        filterDate.setMonth(now.getMonth() - 3);
        break;
    }
    
    const beforeDateFilter = completedTasks.length;
    completedTasks = completedTasks.filter(t => {
      const taskDate = new Date(t.dateCompleted || t.dueDate);
      return taskDate >= filterDate;
    });
    console.log(`📅 After date filter (${dateRangeFilter}):`, completedTasks.length, '(was', beforeDateFilter + ')');
  }
  
  // Sort by most recent first
  const sorted = completedTasks.sort((a, b) => {
    const dateA = new Date(a.dateCompleted || a.dueDate);
    const dateB = new Date(b.dateCompleted || b.dueDate);
    return dateB - dateA;
  });
  
  console.log('✅ Final filtered tasks:', sorted.length);
  return sorted;
};

  const closeAllModals = () => {
    setShowTaskModal(false);
    setShowFailedModal(false);
    setShowExtendModal(false);
    setShowCalendarModal(false);
    setSelectedTask(null);
    setStatusReason('');
    setNewDueDate('');
    setSelectedEvents([]);
  };

  // FIXED: Updated to handle modal transitions properly
const handleTaskClick = async (task) => {
  // ✅ CLOSE CALENDAR MODAL FIRST
  if (showCalendarModal) {
    setShowCalendarModal(false);
  }
  
  // ✅ RE-FETCH FRESH DATA FOR MAINTENANCE TASKS
  if (task.type === 'maintenance_task') {
    try {
      const { data: freshTask } = await supabase
        .from('maintenance_tasks')
        .select(`
          *,
          maintenance_task_extensions(
            extension_id,
            old_due_date,
            new_due_date,
            extension_reason,
            extension_date
          )
        `)
        .eq('task_id', task.id)
        .single();
      
      if (freshTask) {
        task.extensionHistory = freshTask.maintenance_task_extensions || [];
        console.log('✅ Fresh extension history loaded:', task.extensionHistory);
      }
    } catch (error) {
      console.error('⚠️ Failed to fetch fresh task data:', error);
    }
  }
  
  setSelectedTask(task);
  
  setTimeout(() => {
    setShowTaskModal(true);
  }, 100);
};

  // FIXED: Separate handler for calendar modal task clicks
  const handleCalendarTaskClick = (task, event) => {
    // Prevent event bubbling
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Close calendar modal first
    setShowCalendarModal(false);
    setSelectedTask(task);
    
    // Open task modal with a small delay
    setTimeout(() => {
      setShowTaskModal(true);
    }, 150);
  };

const handleDateClick = (date) => {
  // Use local date instead of ISO to avoid timezone issues
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const tasksOnDate = tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskDateString = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
    
    // ADD THIS LINE - Filter out completed and failed tasks
    const isActiveTask = task.status === 'pending' || task.status === 'in-progress';
    
    return taskDateString === dateString && isActiveTask;
  });
  
  setSelectedEvents(tasksOnDate);
  setSelectedDate(date);
  setShowCalendarModal(true);
};

  const addLogLocally = (task, status, reason, newDate = null) => {
    const log = {
      status,
      reason,
      date: new Date().toISOString(),
      ...(newDate && { newDueDate: newDate })
    };
    return { 
      ...task, 
      status, 
      logs: [...(task.logs || []), log], 
      ...(newDate && { dueDate: new Date(newDate) }) 
    };
  };

const updateTaskStatus = async (status, requireReason = false, requireDate = false) => {
  if (!selectedTask) return;

  if (requireReason && !statusReason.trim()) {
    alert("Reason is required.");
    return;
  }
  if (requireDate && !newDueDate) {
    alert("New due date is required.");
    return;
  }

  try {
    const result = await apiService.updateTaskStatus(
      selectedTask.id,
      selectedTask.type,
      status,
      statusReason,
      requireDate ? newDueDate : null
    );

    if (result.success) {
      // ✅ Reload all tasks
      await loadTasks();
      
      // ✅ Keep modal open but update selectedTask with fresh data from result
      if (result.data && selectedTask.type === 'maintenance_task') {
        // ✅ ADD CONSOLE LOG HERE
    console.log('📦 Updated task data:', result.data);
    console.log('📜 Extension history:', result.data.maintenance_task_extensions);
        // Transform the returned data to match our display format
        setSelectedTask({
          ...selectedTask,
          dueDate: result.data.due_date,
          extensionCount: result.data.extension_count || 0,
          lastExtensionReason: result.data.last_extension_reason,
          extensionHistory: result.data.maintenance_task_extensions || [],
          status: status
        });
      }
      
      // ✅ Close only the extend/failed modals, keep task modal open
      setShowExtendModal(false);
      setShowFailedModal(false);
      setStatusReason('');
      setNewDueDate('');
      
    } else {
      alert('Failed to update task status: ' + result.error);
    }
  } catch (err) {
    alert('Failed to update task status. Please try again.');
    console.error('Error updating task status:', err);
  }
};

const TaskCard = ({ task }) => (
  <div 
    style={{
      padding: '16px',
      marginBottom: '12px',
      backgroundColor: task.isOverdue ? '#fff5f5' : '#f8f9fa',
      borderRadius: '8px',
      border: task.isOverdue ? '2px solid #dc3545' : '1px solid #e9ecef',
      transition: 'background-color 0.2s ease, transform 0.1s ease',
      height: '110px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'flex-start',
      cursor: 'pointer'
    }}
    onClick={() => handleTaskClick(task)}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = task.isOverdue ? '#fed7d7' : '#e9ecef';
      e.currentTarget.style.transform = 'translateY(-1px)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = task.isOverdue ? '#fff5f5' : '#f8f9fa';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
      <div style={{ fontWeight: '500', fontSize: '14px' }}>{task.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
        <Badge bg={
          task.priority === 'high' ? 'danger' : 
          task.priority === 'medium' ? 'warning' : 
          'success'
        } style={{ fontSize: '10px' }}>
          {capitalizePriority(task.priority)}
        </Badge>
        {task.isOverdue && (
          <Badge bg="danger" style={{ fontSize: '9px', animation: 'pulse 2s infinite' }}>
            OVERDUE
          </Badge>
        )}
      </div>
    </div>
    <div style={{ color: '#6c757d', fontSize: '13px' }}>{task.description}</div>
  </div>
);

  // Empty state component
  const EmptyState = ({ message }) => (
    <div style={{ textAlign: 'center', padding: '24px 0', color: '#6c757d' }}>
      <p>{message}</p>
    </div>
  );

  // Floating Calendar Component (same as admin)
  const Calendar = () => {
    const today = new Date();
    
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const changeMonth = (increment) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };
    
 const getTasksForDate = (day) => {
  const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
  return tasks.filter(task => {
    const taskDate = new Date(task.dueDate);
    const taskDateString = `${taskDate.getFullYear()}-${(taskDate.getMonth() + 1).toString().padStart(2, '0')}-${taskDate.getDate().toString().padStart(2, '0')}`;
    return taskDateString === dateString && (task.status === 'pending' || task.status === 'in-progress');
  });
};
    
    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(currentDate);
      const firstDay = getFirstDayOfMonth(currentDate);
      const days = [];
      
      // Empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const tasksOnDay = getTasksForDate(day);
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentDate.getMonth() && 
                       today.getFullYear() === currentDate.getFullYear();
        const hasOverdueTask = tasksOnDay.some(task => task.isOverdue);

        days.push(
          <div 
            key={day} 
           className={`calendar-day ${isToday ? 'today' : ''} ${tasksOnDay.length > 0 ? 'has-events' : ''} ${hasOverdueTask ? 'has-overdue' : ''}`}
            onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          >
            <span className="day-number">{day}</span>
            {tasksOnDay.length > 0 && (
              <div className="event-indicators">
                {tasksOnDay.slice(0, 3).map((task, index) => (
                  <div 
                    key={index} 
                    className={`event-dot ${
                      task.isOverdue ? 'overdue-priority' :
                      task.priority === 'high' ? 'high-priority' : 
                      task.priority === 'medium' ? 'medium-priority' : 
                      'low-priority'
                    }`}
                    title={`${task.title} ${task.isOverdue ? '(OVERDUE)' : ''}`}
                  ></div>
                ))}
                {tasksOnDay.length > 3 && (
                  <div className="event-more">+{tasksOnDay.length - 3}</div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      return days;
    };
    
    return (
      <div className="calendar-container">
        <style jsx>{`
          .calendar-container {
            width: 100%;
          }
          
          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 0 10px;
          }
          
          .calendar-nav {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          
          .calendar-nav:hover {
            background: #e9ecef;
          }
          
          .calendar-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background: #dee2e6;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .calendar-weekday {
            background: #f8f9fa;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
          }
          
          .calendar-day {
            background: white;
            min-height: 110px;
            padding: 8px;
            cursor: pointer;
            transition: background-color 0.2s;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .calendar-day:hover {
            background: #f8f9fa;
          }
          
          .calendar-day.empty {
            background: #f8f9fa;
            cursor: default;
          }
          
          .calendar-day.today {
            background: #e3f2fd;
          }
          
          .calendar-day.has-events {
            background: #fff3e0;
          }
          
          .calendar-day.today.has-events {
            background: #e1f5fe;
          }
            .calendar-day.has-overdue {
  background: #ffebee;
  border: 2px solid rgba(220, 53, 69, 0.3);
}

.calendar-day.today.has-overdue {
  background: #ffcdd2;
  border: 2px solid rgba(220, 53, 69, 0.5);
}
          
          .day-number {
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .event-indicators {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            flex: 1;
          }
          
          .event-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          
          .event-dot.high-priority {
            background: #dc3545;
          }
          
          .event-dot.medium-priority {
            background: #fd7e14;
          }
          
          .event-dot.low-priority {
            background: #28a745;
          }
          .event-dot.overdue-priority {
  background: #dc3545;
  box-shadow: 0 0 8px rgba(220, 53, 69, 0.8);
  animation: pulse-overdue 2s infinite;
}

@keyframes pulse-overdue {
  0% { box-shadow: 0 0 8px rgba(220, 53, 69, 0.8); }
  50% { box-shadow: 0 0 15px rgba(220, 53, 69, 1); }
  100% { box-shadow: 0 0 8px rgba(220, 53, 69, 0.8); }
}
          .event-more {
            font-size: 10px;
            color: #6c757d;
            font-weight: 500;
          }
            
        `}</style>
        
        <div className="calendar-header">
          <button 
            className="calendar-nav"
            onClick={() => changeMonth(-1)}
          >
          Prev
          </button>
          <h3 className="calendar-title">
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            className="calendar-nav"
            onClick={() => changeMonth(1)}
          >
            Next
          </button>
        </div>
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>
    );
  };

 
const cardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '24px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  border: '1px solid rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  //minHeight: '500px', // Increase minimum height to match calendar
  display: 'flex',      // Add flex display
  flexDirection: 'column', // Add flex direction
  height: '100%'
};

const calendarCardStyle = {
  ...cardStyle,
  minHeight: '500px'
};

const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: '73% 26%',
  gap: '20px',
  marginBottom: '30px',
  alignItems: 'start' // Add this to align items to start
};

  const itemCardStyle = {
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    height: '110px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  };

  return (
      <Col md={12} className="p-4">
     
<div style={{
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #0d6efd',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '30px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Wrench size={28} style={{ color: '#0d6efd' }} />
    <h1 style={{ margin: 0, fontWeight: '700', fontSize: '28px', color: '#1a1a1a' }}>
      Welcome back, {personnelName}!
    </h1>
  </div>
<div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
  {/* Date Display */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <CalendarIcon size={18} style={{ color: '#6c757d' }} />
    <span style={{ color: '#6c757d', fontSize: '14px' }}>
      {new Date().toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </span>
  </div>
  
  {/* Refresh Button */}
  <button
    onClick={loadTasks}
    disabled={loading}
    style={{
      backgroundColor: '#0d6efd',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: loading ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      transition: 'all 0.2s ease',
      opacity: loading ? 0.6 : 1
    }}
    onMouseEnter={(e) => {
      if (!loading) {
        e.currentTarget.style.backgroundColor = '#0b5ed7';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = '#0d6efd';
      e.currentTarget.style.transform = 'translateY(0)';
    }}
  >
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="16" 
      height="16" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{
        animation: loading ? 'spin 1s linear infinite' : 'none'
      }}
    >
      <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2"/>
    </svg>
    {loading ? 'Refreshing...' : 'Refresh'}
  </button>
</div>
  
</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', paddingLeft: '40px' }}>
<span style={{ 
  backgroundColor: '#0d6efd15', 
  color: '#0d6efd',
      padding: '4px 12px', 
      borderRadius: '6px',
      fontSize: '15px',
      fontWeight: '600'
    }}>
      {personnelRole}
    </span>
    <span style={{ color: '#6c757d', fontSize: '15px' }}>•</span>
    <span style={{ color: '#495057', fontSize: '15px', fontWeight: '500' }}>{organizationName}</span>
  </div>
</div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
            <button className="btn btn-link p-0 ms-2" onClick={loadTasks}>
              Try Again
            </button>
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p style={{ marginTop: '16px' }}>Loading tasks...</p>
          </div>
        ) : (
          <>
            {/* Calendar and Schedule Section - Same layout as Admin */}
            <div style={twoColumnGrid}>
              {/* Calendar */}
              <div style={calendarCardStyle}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
                  <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                    <CalendarIcon size={20} style={{ marginRight: '8px', color: '#0d6efd' }} />
                    Task Calendar
                  </h5>
                  <div style={{ fontSize: '12px', color: '#6c757d' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '15px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc3545', marginRight: '5px' }}></div>
                      High Priority
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '15px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#fd7e14', marginRight: '5px' }}></div>
                      Medium Priority
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#28a745', marginRight: '5px' }}></div>
                      Low Priority
                    </span>
                  </div>
                </div>
                <Calendar />
              </div>

              {/* Right Side - Today's Tasks with Tabs */}
              <div style={cardStyle}>
                {/* Tab Buttons */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <button 
                    className={`btn btn-sm ${!showHistory ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setShowHistory(false)}
                  >
                    Current
                  </button>
                  <button 
                    className={`btn btn-sm ${showHistory ? 'btn-primary' : 'btn-outline-primary'}`} 
                    onClick={() => setShowHistory(true)}
                  >
                    History
                  </button>
                </div>

                {/* Tab Content */}
                {!showHistory ? (
                  <>
{/* Today's Tasks - Now Scrollable */}
<div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
  <h6 style={{ 
    margin: 0, 
    fontWeight: 'bold', 
    marginBottom: '15px', 
    display: 'flex', 
    alignItems: 'center',
    flexShrink: 0  // Prevent header from shrinking
  }}>
    <Clock size={16} style={{ marginRight: '8px', color: '#28a745' }} />
    Today's Tasks
  </h6>
  
  {/* Scrollable container */}
  <div style={{
    flex: 1, // Take remaining space
    overflowY: 'auto',
    maxHeight: '580px', // Set maximum height
    paddingRight: '8px' // Add padding for scrollbar
  }}>
    {getTodayTasks().length === 0 ? (
      <EmptyState message="No tasks for today" />
    ) : (
getTodayTasks().map((task, index) => (
  <div 
    key={index} 
    style={{
      padding: '12px 16px',
      marginBottom: '10px',
      backgroundColor: task.isOverdue ? '#fff5f5' : '#fff',
      borderRadius: '8px',
      border: task.isOverdue ? '2px solid #dc3545' : '1px solid #e9ecef',
      borderLeft: task.isOverdue ? '4px solid #dc3545' : '4px solid transparent',
      transition: 'all 0.2s ease',
      cursor: 'pointer'
    }}
    onClick={() => handleTaskClick(task)}
    onMouseEnter={(e) => {
      e.currentTarget.style.backgroundColor = task.isOverdue ? '#ffe5e5' : '#f8f9fa';
      e.currentTarget.style.transform = 'translateX(2px)';
      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.backgroundColor = task.isOverdue ? '#fff5f5' : '#fff';
      e.currentTarget.style.transform = 'translateX(0)';
      e.currentTarget.style.boxShadow = 'none';
    }}
  >
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      gap: '12px'
    }}>
      {/* Left: Title and location */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ 
          fontWeight: '500', 
          fontSize: '14px',
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          {task.title}
        </div>
        <div style={{ 
          color: '#6c757d', 
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap'
        }}>
          <MapPin size={11} style={{ marginRight: '4px', flexShrink: 0 }} />
          {task.location}
        </div>
      </div>
      
      {/* Right: Badges */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'flex-end', 
        gap: '4px',
        flexShrink: 0
      }}>
        <Badge bg={
          task.priority === 'high' ? 'danger' : 
          task.priority === 'medium' ? 'warning' : 
          'success'
        } style={{ fontSize: '10px' }}>
          {capitalizePriority(task.priority)}
        </Badge>
        {task.isOverdue && (
          <Badge bg="danger" style={{ fontSize: '9px' }}>
            OVERDUE
          </Badge>
        )}
      </div>
    </div>
  </div>
))
    )}
  </div>
</div>
                  </>
) : (
  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
    <h6 style={{ 
      margin: 0, 
      fontWeight: 'bold', 
      marginBottom: '15px', 
      display: 'flex', 
      alignItems: 'center', 
      flexShrink: 0 
    }}>
      <AlertTriangle size={16} style={{ marginRight: '8px', color: '#fd7e14' }} />
      Task History
    </h6>
    
    {/* Search Bar */}
{/* Filter Controls */}
<div style={{ marginBottom: '15px', flexShrink: 0 }}>
  <div className="row g-2">
    {/* Status Filter */}
    <div className="col-6">
     <select
  className="form-select form-select-sm"
  value={statusFilter}
  onChange={(e) => {
    setStatusFilter(e.target.value);
    setFilterKey(prev => prev + 1); 
    console.log('🔄 Status filter changed to:', e.target.value);
  }}
        style={{
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          padding: '8px 12px',
          fontSize: '13px'
        }}
      >
        <option value="all">All Status</option>
        <option value="completed">✓ Completed</option>
        <option value="failed">✗ Failed</option>
      </select>
    </div>
    
    {/* Date Range Filter */}
    <div className="col-6">
      <select
  className="form-select form-select-sm"
  value={dateRangeFilter}
  onChange={(e) => {
    setDateRangeFilter(e.target.value);
    setFilterKey(prev => prev + 1); 
    console.log('📅 Date filter changed to:', e.target.value);
  }}
        style={{
          borderRadius: '8px',
          border: '1px solid #dee2e6',
          padding: '8px 12px',
          fontSize: '13px'
        }}
      >
        <option value="all">All Time</option>
        <option value="week">This Week</option>
        <option value="month">This Month</option>
        <option value="3months">Last 3 Months</option>
      </select>
    </div>
  </div>
</div>
    
    <div 
      key={filterKey}
    style={{
      flex: 1, 
      overflowY: 'auto',
      maxHeight: '580px', 
      paddingRight: '8px'
    }}>
{getCompletedTasks().length === 0 ? (
  <EmptyState message={
    statusFilter !== 'all' || dateRangeFilter !== 'all'
      ? "No tasks found with selected filters" 
      : "No completed tasks yet"
  } />
) : (
        getCompletedTasks().map(task => (
<div key={task.id}
  style={{
    padding: '12px 16px',
    marginBottom: '10px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    transition: 'all 0.2s ease',
    cursor: 'pointer'
  }}
  onClick={() => handleTaskClick(task)}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#f8f9fa';
    e.currentTarget.style.transform = 'translateX(2px)';
    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = '#fff';
    e.currentTarget.style.transform = 'translateX(0)';
    e.currentTarget.style.boxShadow = 'none';
  }}
>
  {/* Single row layout */}
  <div style={{ 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    gap: '12px'
  }}>
    {/* Left: Title and timestamp */}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ 
        fontWeight: '500', 
        fontSize: '14px',
        marginBottom: '4px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap'
      }}>
        {task.title}
      </div>
      <div style={{ 
        color: '#6c757d', 
        fontSize: '11px',
        display: 'flex',
        alignItems: 'center'
      }}>
        <Clock size={11} style={{ marginRight: '4px' }} />
        {task.dateCompleted 
          ? new Date(task.dateCompleted).toLocaleString('en-US', {
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })
          : new Date(task.dueDate).toLocaleDateString()
        }
      </div>
    </div>
    
    {/* Right: Badges */}
    <div style={{ 
      display: 'flex', 
      gap: '6px',
      flexShrink: 0
    }}>
      <Badge bg={
        task.priority === 'high' ? 'danger' : 
        task.priority === 'medium' ? 'warning' : 
        'success'
      } style={{ fontSize: '10px' }}>
        {capitalizePriority(task.priority)}
      </Badge>
      <Badge 
        bg={task.status === 'completed' ? 'success' : 'danger'} 
        style={{ fontSize: '10px' }}
      >
        {task.status === 'completed' ? '✓' : '✗'}
      </Badge>
    </div>
  </div>
</div>
        ))
      )}
    </div>
  </div>
)}
              </div>
            </div>
          </>
        )}

        {/* FIXED: Calendar Events Modal with better z-index and event handling */}
        <Modal 
          show={showCalendarModal} 
          onHide={closeAllModals} 
          size="lg"
          style={{ zIndex: 1050 }} // Lower z-index than task modal
        >
          <Modal.Header closeButton>
            <Modal.Title>
              Tasks for {selectedDate.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedEvents.length === 0 ? (
              <p className="text-muted">No tasks scheduled for this date.</p>
            ) : (
              selectedEvents.map((task, index) => (
                <div 
                  key={index} 
                  className="mb-3 p-3 border rounded" 
                  style={{ cursor: 'pointer' }} 
                  onClick={(e) => handleCalendarTaskClick(task, e)}
                >
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <h6 className="mb-0">{task.title}</h6>
                    <Badge bg={
                      task.priority === 'high' ? 'danger' : 
                      task.priority === 'medium' ? 'warning' : 
                      'success'
                    }>
                      {capitalizePriority(task.priority)}
                    </Badge>
                  </div>
                  <div className="d-flex align-items-center mb-1 text-muted">
                    <Clock size={14} className="me-2" />
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </div>
                  <div className="d-flex align-items-center text-muted">
                    <MapPin size={14} className="me-2" />
                    {task.location}
                  </div>
                </div>
              ))
            )}
          </Modal.Body>
        </Modal>

        {/* FIXED: Task Modal with higher z-index */}
        {showTaskModal && selectedTask && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Task Details</h5>
                  <button className="btn-close" onClick={closeAllModals}></button>
                </div>
                <div className="modal-body">
                  {/* Status and Priority Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold">Status:</label>
                      <span className={`ms-2 ${
                        selectedTask.status === 'completed' ? 'text-success' :
                        selectedTask.status === 'failed' ? 'text-danger' :
                        selectedTask.status === 'in-progress' ? 'text-primary' :
                        'text-muted'
                     }`}>{capitalizeStatus(selectedTask.status)}</span>
                    </div>
                  <div className="col-6">
  <label className="form-label fw-bold">Priority Level:</label>
  <span className="ms-2">{capitalizePriority(selectedTask.priority)}</span>
</div>
                  </div>

                      {/* OVERDUE WARNING HERE */}
{selectedTask.isOverdue && (
  <div className="row mb-3">
    <div className="col-12">
      <div className="alert alert-danger d-flex align-items-center" role="alert">
        <AlertTriangle size={20} className="me-2" />
        <div>
          <strong>Task is Overdue!</strong><br />
          <small>Due date was: {new Date(selectedTask.dueDate).toLocaleDateString()}</small>
        </div>
      </div>
    </div>
  </div>
)}

                  {/* Request Field */}
                  <div className="mb-3">
                    <label className="form-label">Request:</label>
                    <input className="form-control" value={selectedTask.title} readOnly />
                  </div>

                  {/* Category and Asset Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Category:</label>
                      <input className="form-control" value={selectedTask.category} readOnly />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Specific Asset/Equipment:</label>
                      <input className="form-control" value={selectedTask.asset} readOnly />
                    </div>
                  </div>

{/* Location Row */}
<div className="row mb-3">
  <div className="col-12">
    <label className="form-label">Location:</label>
    <input className="form-control" value={selectedTask.location} readOnly />
  </div>
</div>

{/* Date & Time Row - Combined */}
<div className="row mb-3">
  <div className="col-12">
    <label className="form-label">
      {selectedTask.scheduledTime ? 'Scheduled Date & Time:' : 'Date Needed By:'}
    </label>
    <input 
      className="form-control" 
      value={
        selectedTask.scheduledTime 
          ? `${new Date(selectedTask.dueDate).toLocaleDateString()} at ${formatTimeTo12Hour(selectedTask.scheduledTime)}`
          : new Date(selectedTask.dueDate).toLocaleDateString()
      }
      readOnly 
    />
    {selectedTask.scheduledTime && (
      <small className="text-muted">This is the time assigned by admin for you to start this task</small>
    )}
  </div>
</div>

                  {/* Description Field */}
                  <div className="mb-3">
                    <label className="form-label">Detailed Description:</label>
                    <textarea className="form-control" rows="4" value={selectedTask.description} readOnly />
                  </div>

                      {/* Failure Reason Display */}
                    {selectedTask.status === 'failed' && selectedTask.failureReason && (
                      <div className="mb-3">
                        <label className="form-label fw-bold text-danger">Failure Reason:</label>
                        <div className="alert alert-danger" role="alert">
                          {selectedTask.failureReason}
                        </div>
                      </div>
                    )}

                  {/* Activity Log */}
                  {selectedTask.logs?.length > 0 && (
                    <div className="mt-4">
                      <h6>Activity Log</h6>
                      {selectedTask.logs.map((log, i) => (
                        <div key={i} className="border p-2 mb-2 bg-light rounded">
                          <small><b>{capitalizeStatus(log.status)}</b> - {log.reason}</small><br />
                          {log.newDueDate && <small className="text-info">New due: {new Date(log.newDueDate).toLocaleDateString()}</small>}<br />
                          <small className="text-muted">{new Date(log.date).toLocaleString()}</small>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Extension History */}
                    {selectedTask.extensionHistory?.length > 0 && (
                      <div className="mt-4">
                        <h6>Extension History</h6>
                         {console.log('🔍 Rendering extensions:', selectedTask.extensionHistory)} 
                        {selectedTask.extensionHistory.map((ext, i) => (
                          <div key={i} className="border p-2 mb-2 bg-warning bg-opacity-10 rounded">
                            <small><b>Extended</b> - {ext.extension_reason}</small><br />
                            <small className="text-info">
                              From: {new Date(ext.old_due_date).toLocaleDateString()}

                               To: {new Date(ext.new_due_date).toLocaleDateString()}
                            </small><br />
                            <small className="text-muted">{new Date(ext.extension_date).toLocaleString()}</small>
                          </div>
                        ))}
                      </div>
)}

                  {/* Update Tasks Section */}
                  {(selectedTask.status === 'pending' || selectedTask.status === 'in-progress') && (
                    <div className="mt-4">
                      <label className="form-label fw-bold">Update Task:</label>
                      <div className="d-flex gap-3 flex-wrap mt-2 justify-content-left">
                        <button className="btn btn-success" onClick={() => updateTaskStatus("completed")}>
                          Mark as Complete
                        </button>
                        <button className="btn btn-danger" onClick={() => setShowFailedModal(true)}>
                          Mark as Failed
                        </button>
                        <button className="btn" style={{backgroundColor: '#fd7e14', color: 'white'}} onClick={() => setShowExtendModal(true)}>
                          Extend Due Date
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="modal-footer d-flex justify-content-between">
                  <button className="btn btn-secondary" onClick={closeAllModals}>Cancel</button>
                  
                  {selectedTask.status === 'pending' && (
                    <button className="btn btn-primary" onClick={() => updateTaskStatus("in-progress")}>
                      Mark as In Progress
                    </button>
                  )}
                  
                  {selectedTask.status === 'in-progress' && (
                    <button className="btn btn-dark" disabled>
                      In Progress
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Failed Modal with proper z-index */}
        {showFailedModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header"><h5>Mark as Failed</h5></div>
                <div className="modal-body">
                  <textarea 
                    className="form-control" 
                    placeholder="Reason for failure" 
                    value={statusReason} 
                    onChange={e => setStatusReason(e.target.value)} 
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeAllModals}>Cancel</button>
                  <button className="btn btn-danger" onClick={() => updateTaskStatus("failed", true)}>
                    Mark as Failed
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FIXED: Extend Modal with proper z-index */}
        {showExtendModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1070 }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header"><h5>Extend Due Date</h5></div>
                <div className="modal-body">
                  <input 
                    type="date" 
                    className="form-control mb-2" 
                    value={newDueDate} 
                    onChange={e => setNewDueDate(e.target.value)} 
                  />
                  <textarea 
                    className="form-control" 
                    placeholder="Reason for extension" 
                    value={statusReason} 
                    onChange={e => setStatusReason(e.target.value)} 
                  />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={closeAllModals}>Cancel</button>
                  <button className="btn btn-warning" onClick={() => updateTaskStatus("in-progress", true, true)}>
                    Extend Due Date
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </Col>
  );
}