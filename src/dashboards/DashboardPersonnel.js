import React, { useState, useEffect } from 'react';
import { Col, Modal, Badge } from 'react-bootstrap';
import { supabase } from '../supabaseClient'; // Adjust path as needed
import { 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  AlertTriangle,
  Wrench,
  CalendarDays
} from 'lucide-react';

// API service functions (replace with actual API calls later)
// Fixed API service function
// Fixed API service function
const apiService = {
  // Get all tasks assigned to current personnel
  async fetchTasks() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      // Query work_orders with a left join to work_order_details for additional info
      const { data, error } = await supabase
        .from('work_orders')
        .select(`
          *,
          work_order_details(*),
          requester:users!requested_by(full_name, email)
        `)
        .eq('assigned_to', userData.user.id)
        .in('status_id', [1, 2]) // Assuming 1 = Pending, 2 = In Progress - adjust these IDs based on your status table
        .order('due_date', { ascending: true });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Raw data from Supabase:', data); // Debug log

      // Transform data to match your component structure
      return data.map(wo => ({
        id: wo.work_order_id,
        title: wo.title,
        description: wo.description,
        category: wo.category,
        asset: wo.asset_id || 'Not specified',
        location: wo.location,
        dueDate: wo.due_date,
        // Use the data from work_order_details if available, otherwise default values
        priority: wo.work_order_details?.priority_name?.toLowerCase() || 'medium',
        status: wo.work_order_details?.status_name?.toLowerCase().replace(' ', '-') || 'pending',
        logs: wo.activity_tracking || []
      }));

    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
    }
  },

  // Alternative approach - simple query without complex joins
  async fetchTasksSimple() {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      
      console.log('Current user ID:', userData.user.id); // Debug log
      
      // Simple query without joins to test basic functionality
      const { data, error } = await supabase
        .from('work_orders')
        .select('*')
        .eq('assigned_to', userData.user.id);

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Raw work_orders data:', data); // Debug log
      console.log('Number of work orders found:', data?.length || 0);

      if (!data || data.length === 0) {
        console.log('No work orders found for user');
        return [];
      }

      // Transform data with default values
      const transformedData = data.map(wo => ({
        id: wo.work_order_id,
        title: wo.title || 'Untitled Task',
        description: wo.description || 'No description',
        category: wo.category || 'General',
        asset: wo.asset_id || 'Not specified',
        location: wo.location || 'Not specified',
        dueDate: wo.due_date,
        priority: 'medium', // Default for now
        status: 'pending', // Default for now
        logs: wo.activity_tracking || []
      }));

      console.log('Transformed data:', transformedData);
      return transformedData;

    } catch (error) {
      console.error('Error fetching tasks:', error);
      return [];
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
    
    console.log('=== DEBUGGING START ===');
    
    // Get current user auth ID
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    console.log('Auth user ID:', userData.user.id);
    
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
    
    console.log('User profile:', userProfile);
    
    // Get tasks assigned to current user only
    const { data: allTasks, error: tasksError } = await supabase
      .from('work_order_details')
      .select('*')
      .eq('assigned_to', userProfile.user_id);
    
    console.log('All work_order_details:', allTasks);
    console.log('Tasks query error:', tasksError);
    
    if (tasksError) {
      throw tasksError;
    }
    
    if (allTasks && allTasks.length > 0) {
      const transformedData = allTasks.map(wo => ({
        id: wo.work_order_id,
        title: wo.title || 'Untitled Task',
        description: wo.description || 'No description',
        category: wo.category || 'General',
        asset: wo.asset_code || 'Not specified',
        location: wo.location || 'Not specified',
        dueDate: wo.due_date,
        priority: wo.priority_name?.toLowerCase() || 'medium',
        status: wo.status_name?.toLowerCase().replace(' ', '-') || 'pending',
        logs: []
      }));
      
      console.log('Transformed tasks:', transformedData);
      setTasks(transformedData);
    } else {
      console.log('No tasks found for current user');
      setTasks([]);
    }
    
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

  const getUpcomingTasks = () => sortTasks(tasks.filter(t => 
    new Date(t.dueDate) > new Date() && 
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
      return taskDateString === dateString;
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
      status, 
      statusReason, 
      requireDate ? newDueDate : null
    );

    if (result.success) {
      // Update local state
      const updatedTask = addLogLocally(
        selectedTask, 
        status, 
        statusReason, 
        requireDate ? newDueDate : null
      );

      setTasks(tasks.map(t => (t.id === selectedTask.id ? updatedTask : t)));
      closeAllModals();
      
      // Reload to sync with backend
      await loadTasks();
      
    } else {
      alert('Failed to update task status: ' + result.error);
    }
  } catch (err) {
    alert('Failed to update task status. Please try again.');
    console.error('Error updating task status:', err);
  }
};
  // UI components
  const TaskCard = ({ task }) => (
    <div 
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
        <Badge bg={
          task.priority === 'high' ? 'danger' : 
          task.priority === 'medium' ? 'warning' : 
          'success'
        } style={{ fontSize: '10px' }}>
          {capitalizePriority(task.priority)}
        </Badge>
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
        
        days.push(
          <div 
            key={day} 
            className={`calendar-day ${isToday ? 'today' : ''} ${tasksOnDay.length > 0 ? 'has-events' : ''}`}
            onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
          >
            <span className="day-number">{day}</span>
            {tasksOnDay.length > 0 && (
              <div className="event-indicators">
                {tasksOnDay.slice(0, 3).map((task, index) => (
                  <div 
                    key={index} 
                    className={`event-dot ${
                      task.priority === 'high' ? 'high-priority' : 
                      task.priority === 'medium' ? 'medium-priority' : 
                      'low-priority'
                    }`}
                    title={task.title}
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

  // Styles same as admin
  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '20px',
    border: '1px solid rgba(0,0,0,0.06)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    minHeight: '120px'
  };

  const calendarCardStyle = {
    ...cardStyle,
    minHeight: '500px'
  };

  const twoColumnGrid = {
    display: 'grid',
    gridTemplateColumns: '73% 26%',
    gap: '20px',
    marginBottom: '30px'
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
                    {/* Today's Tasks */}
                    <div style={{ marginBottom: '20px' }}>
                      <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                        <Clock size={16} style={{ marginRight: '8px', color: '#28a745' }} />
                        Today's Tasks
                      </h6>
                      <div>
                        {getTodayTasks().length === 0 ? (
                          <EmptyState message="No tasks scheduled for today" />
                        ) : (
                          getTodayTasks().map((task, index) => (
                            <div 
                              key={index} 
                              style={{...itemCardStyle, height: 'auto', minHeight: '80px', cursor: 'pointer'}}
                              onClick={() => handleTaskClick(task)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                                <div style={{ fontWeight: '500', fontSize: '14px' }}>{task.title}</div>
                                <Badge bg={
                                  task.priority === 'high' ? 'danger' : 
                                  task.priority === 'medium' ? 'warning' : 
                                  'success'
                                } style={{ fontSize: '10px' }}>
                                  {capitalizePriority(task.priority)}
                                </Badge>
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px' }}>
                                {task.description}
                              </div>
                              <div style={{ color: '#6c757d', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
                                <MapPin size={12} style={{ marginRight: '4px' }} />
                                {task.location}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Upcoming Tasks */}
                    <div>
                      <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                        <CalendarDays size={16} style={{ marginRight: '8px', color: '#0d6efd' }} />
                        Upcoming Tasks
                      </h6>
                      <div>
                        {getUpcomingTasks().length === 0 ? (
                          <EmptyState message="No upcoming tasks assigned" />
                        ) : (
                          getUpcomingTasks().slice(0, 3).map(task => (
                            <TaskCard key={task.id} task={task} />
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <div>
                    <h6 style={{ margin: 0, fontWeight: 'bold', marginBottom: '15px', display: 'flex', alignItems: 'center' }}>
                      <AlertTriangle size={16} style={{ marginRight: '8px', color: '#fd7e14' }} />
                      Task History
                    </h6>
                    <div>
                      {getCompletedTasks().map(task => (
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
          {task.status === 'completed' ? '✓ Completed' : '✗ Failed'}
        </Badge>
      </div>
    </div>
    <div style={{ color: '#6c757d', fontSize: '13px' }}>{task.description}</div>
  </div>
))}
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
                      ✓ In Progress
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