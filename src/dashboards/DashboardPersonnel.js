import React, { useState, useEffect } from 'react';
import { Col, Modal, Badge } from 'react-bootstrap';
import { assetService } from '../services/assetService'; 
import { supabase } from '../supabaseClient'; 
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  CalendarDays
} from 'lucide-react';

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

    // Insert extension history
    await supabase
      .from('maintenance_task_extensions')
      .insert({
        task_id: taskId,
        old_due_date: currentTask.due_date,
        new_due_date: newDate,
        extension_reason: reason,
        extended_by: userProfile.user_id
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

    return { success: true, data: data?.[0] };
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
  if (data[0].incident_id) {
    try {
      await assetService.autoResolveIncident(data[0].incident_id);
      console.log('Auto-resolved incident:', data[0].incident_id);
    } catch (incidentError) {
      console.error('Failed to auto-resolve incident:', incidentError);
    }
  }
}

// âœ… NOTIFY ADMIN about incident task update (OUTSIDE the completed check!)
if (data[0]?.incident_id) {
  try {
    const statusMessage = status === 'completed' 
      ? `Personnel completed incident report task #${data[0].incident_id}` 
      : status === 'failed'
      ? `Personnel marked incident report task #${data[0].incident_id} as failed${reason ? ': ' + reason : ''}`
      : `Personnel updated incident report task #${data[0].incident_id} to ${status}`;

    await supabase.from('notifications').insert({
      notification_type_id: 3,
      created_by: userProfile.user_id,
      title: `Incident Task ${status === 'completed' ? 'Completed' : status === 'failed' ? 'Failed' : 'Updated'}`,
      message: statusMessage,
      target_roles: '2',
      priority_id: status === 'failed' ? 3 : 2,
      related_table: 'incident_reports',
      related_id: data[0].incident_id,
      is_active: true
    });
  } catch (notifError) {
    console.error('Failed to create admin notification:', notifError);
  }
}

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
      return { success: true, data: workOrderData?.[0] };
    }

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
      .select();

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

    return { success: true, data: workOrderData?.[0] || workOrderData };
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
  const [showHistory, setShowHistory] = useState(false);

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
      .select('user_id, full_name')
      .eq('auth_uid', userData.user.id)
      .single();
      
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
          originalDueDate: wo.original_due_date,
          priority: (wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'medium').toLowerCase(),
          status: statusName,
          isOverdue: isOverdue,
          failureReason: wo.failure_reason,
          extensionCount: wo.extension_count || 0,
          lastExtensionReason: wo.last_extension_reason,
          extensionHistory: wo.work_order_extensions || [],
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
          originalDueDate: null,
          priority: task.priority.toLowerCase(),
          status: statusName,
          isOverdue: isOverdue,
          failureReason: task.remarks,
          extensionCount: 0,
          lastExtensionReason: null,
          extensionHistory: [],
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


  const getCompletedTasks = () => sortTasks(tasks.filter(t => 
    t.status === 'completed' || t.status === 'failed'
  ));

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
  const handleTaskClick = task => {
    setSelectedTask(task);
    // Close calendar modal first if it's open
    if (showCalendarModal) {
      setShowCalendarModal(false);
    }
    // Small delay to ensure calendar modal is closed before opening task modal
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
      selectedTask.type, // Add this - pass the task type
      status,
      statusReason,
      requireDate ? newDueDate : null
    );

    if (result.success) {
      const updatedTask = addLogLocally(
        selectedTask,
        status,
        statusReason,
        requireDate ? newDueDate : null
      );

      setTasks(tasks.map(t => (t.id === selectedTask.id ? updatedTask : t)));
      closeAllModals();
      await loadTasks();
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
  minHeight: '500px', // Increase minimum height to match calendar
  display: 'flex',      // Add flex display
  flexDirection: 'column' // Add flex direction
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
          <h2 style={{ margin: 0 }}>Welcome back!</h2>
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
    maxHeight: '630px', // Set maximum height
    paddingRight: '8px' // Add padding for scrollbar
  }}>
    {getTodayTasks().length === 0 ? (
      <EmptyState message="No tasks for today" />
    ) : (
      getTodayTasks().map((task, index) => (
        <div 
          key={index} 
          style={{
            padding: '16px',
            marginBottom: '12px',
            backgroundColor: task.isOverdue ? '#fff5f5' : '#f8f9fa',
            borderRadius: '8px',
            border: task.isOverdue ? '2px solid #dc3545' : '1px solid #e9ecef',
            transition: 'background-color 0.2s ease, transform 0.1s ease',
            height: 'auto', 
            minHeight: '80px', 
            cursor: 'pointer',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start'
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
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start', 
            marginBottom: '8px' 
          }}>
            <div style={{ fontWeight: '500', fontSize: '14px' }}>{task.title}</div>
            <div style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'flex-end', 
              gap: '4px' 
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
          <div style={{ 
            color: '#6c757d', 
            fontSize: '13px', 
            marginBottom: '4px' 
          }}>
            {task.description}
          </div>
          <div style={{ 
            color: '#6c757d', 
            fontSize: '13px', 
            display: 'flex', 
            alignItems: 'center' 
          }}>
            <MapPin size={12} style={{ marginRight: '4px' }} />
            {task.location}
          </div>
        </div>
      ))
    )}
  </div>
</div>
                  </>
                ) : (
                  <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center', flexShrink: 0  }}>
                      <AlertTriangle size={16} style={{ marginRight: '8px', color: '#fd7e14' }} />
                      Task History
                    </h6>
                   <div style={{
  flex: 1, 
  overflowY: 'auto',
  maxHeight: '630px', 
  paddingRight: '8px'
}}>
  {getCompletedTasks().length === 0 ? (
    <EmptyState message="No completed tasks yet" />
  ) : (
    getCompletedTasks().map(task => (
                        <div key={task.id}
                          style={{
                            padding: '16px',
                            marginBottom: '12px',
                            backgroundColor: '#f8f9fa',
                            borderRadius: '8px',
                            border: '1px solid #e9ecef',
                            transition: 'background-color 0.2s ease, transform 0.1s ease',
                            height: '110px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'flex-start',
                            cursor: 'pointer'
                          }}
                          onClick={() => handleTaskClick(task)}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#e9ecef';
                            e.currentTarget.style.transform = 'translateY(-1px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
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
                              <Badge bg={task.status === 'completed' ? 'success' : 'danger'} style={{ fontSize: '9px' }}>
                                {task.status === 'completed' ? 'âœ“ Completed' : 'âœ— Failed'}
                              </Badge>
                            </div>
                          </div>
                          <div style={{ color: '#6c757d', fontSize: '13px' }}>{task.description}</div>
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
                     <span className="ms-2 text-danger">{capitalizePriority(selectedTask.priority)}</span>
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

                  {/* Location and Date Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label">Location:</label>
                      <input className="form-control" value={selectedTask.location} readOnly />
                    </div>
                    <div className="col-6">
                      <label className="form-label">Date Needed By:</label>
                      <input className="form-control" value={new Date(selectedTask.dueDate).toLocaleDateString()} readOnly />
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
                        {selectedTask.extensionHistory.map((ext, i) => (
                          <div key={i} className="border p-2 mb-2 bg-warning bg-opacity-10 rounded">
                            <small><b>Extended</b> - {ext.extension_reason}</small><br />
                            <small className="text-info">
                              From: {new Date(ext.old_due_date).toLocaleDateString()} â†’ 
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
                      âœ“ In Progress
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