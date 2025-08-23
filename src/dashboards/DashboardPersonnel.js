import React, { useState, useEffect } from 'react';
import SidebarLayout from '../Layouts/SidebarLayout';

// API service functions (replace with actual API calls later)
const apiService = {
  // Get all tasks assigned to current personnel
  async fetchTasks() {
    // TODO: Replace with actual API call
    // return await fetch('/api/personnel/tasks').then(res => res.json());
    
    // For now, return empty array since no admin has assigned tasks yet
    return [];
  },

  // Update task status
  async updateTaskStatus(taskId, status, reason = '', newDueDate = null) {
    // TODO: Replace with actual API call
    // const payload = { status, reason, ...(newDueDate && { dueDate: newDueDate }) };
    // return await fetch(`/api/tasks/${taskId}/status`, {
    //   method: 'PATCH',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(payload)
    // }).then(res => res.json());
    
    // For now, simulate API response
    return { success: true };
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
      const fetchedTasks = await apiService.fetchTasks();
      setTasks(fetchedTasks);
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
    setSelectedTask(null);
    setStatusReason('');
    setNewDueDate('');
  };

  const handleTaskClick = task => {
    setSelectedTask(task);
    setShowTaskModal(true);
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
      // Update on backend first
      await apiService.updateTaskStatus(
        selectedTask.id, 
        status, 
        statusReason, 
        requireDate ? newDueDate : null
      );

      // Update local state optimistically
      const updatedTask = addLogLocally(
        selectedTask, 
        status, 
        statusReason, 
        requireDate ? newDueDate : null
      );

      setTasks(tasks.map(t => (t.id === selectedTask.id ? updatedTask : t)));
      closeAllModals();
      
      // Optional: Reload tasks to ensure sync with backend
      // await loadTasks();
      
    } catch (err) {
      alert('Failed to update task status. Please try again.');
      console.error('Error updating task status:', err);
    }
  };

  // UI components
  const TaskCard = ({ task }) => (
    <div className="card mb-2 shadow-sm cursor-pointer" onClick={() => handleTaskClick(task)}>
      <div className="card-body d-flex justify-content-between">
        <div>
          <h6 className="mb-1">{task.title}</h6>
          <small className="text-muted">{task.description}</small>
        </div>
        <span className={`badge ${
          task.priority === 'high' ? 'bg-danger' : 
          task.priority === 'medium' ? 'bg-warning' : 
          'bg-success'
        }`}>
          {capitalizePriority(task.priority)}
        </span>
      </div>
    </div>
  );

  // Empty state component
  const EmptyState = ({ message }) => (
    <div className="text-center py-4 text-muted">
      <p>{message}</p>
    </div>
  );

  // Calendar helper functions
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const isToday = (date) => isSameDay(date, new Date());
  
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentDate);
    const firstDay = getFirstDayOfMonth(currentDate);
    const days = [];

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <div 
          key={`empty-${i}`} 
          className="border bg-light" 
          style={{ height: '100px', minHeight: '100px' }}
        ></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const cellTasks = getTasksForDate(cellDate);
      const isSelectedDate = isSameDay(cellDate, selectedDate);
      const isTodayDate = isToday(cellDate);

      days.push(
        <div
          key={day}
          className={`border cursor-pointer d-flex flex-column p-2`}
          style={{ 
            backgroundColor: isSelectedDate ? '#B0D0E6' : // Purple for selected
                            isTodayDate && !isSelectedDate ? '#337FCA' : // Pink for today  
                            '#ffffff', // Light gray for regular days
            color: isSelectedDate ? '#284386' : 'black',
            height: '100px', 
            minHeight: '100px',
            fontSize: '12px', 
            overflow: 'hidden' 
          }}
          onClick={() => setSelectedDate(cellDate)}
        >
          <div className={`fw-bold mb-1 ${isTodayDate && !isSelectedDate ? 'text-dark' : ''}`}>
            {day}
          </div>
          <div className="flex-grow-1 d-flex flex-column gap-1" style={{ maxHeight: '70px', overflow: 'hidden' }}>
            {cellTasks.slice(0, 2).map(task => (
              <div
                key={task.id}
                className={`px-1 py-0 rounded text-center ${
                  task.priority === 'high' ? 'bg-danger text-white' :
                  task.priority === 'medium' ? 'bg-warning text-dark' :
                  'bg-success text-white'
                }`}
                style={{ 
                  fontSize: '9px', 
                  lineHeight: '1.2', 
                  minHeight: '16px', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center' 
                }}
                title={task.title}
                onClick={(e) => {
                  e.stopPropagation();
                  handleTaskClick(task);
                }}
              >
                {task.title.length > 12 ? task.title.substring(0, 12) + '...' : task.title}
              </div>
            ))}
            {cellTasks.length > 2 && (
              <div className="text-muted text-center" style={{ fontSize: '9px', lineHeight: '1.2' }}>
                +{cellTasks.length - 2} more
              </div>
            )}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <SidebarLayout role="personnel">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Personnel Dashboard</h2>
        <button className="btn btn-outline-primary" onClick={loadTasks}>
          <i className="fas fa-refresh"></i> Refresh Tasks
        </button>
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
        <div className="text-center py-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading tasks...</p>
        </div>
      ) : (
        <div className="row">
          {/* Calendar */}
          <div className="col-lg-8">
            <div className="card shadow-sm">
              <div className="card-header d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Task Calendar</h5>
                <div className="d-flex align-items-center gap-3">
                  <button className="btn btn-outline-primary btn-sm" onClick={goToToday}>
                    Today
                  </button>
                  <div className="d-flex align-items-center gap-2">
                    <button 
                      className="btn btn-outline-secondary btn-sm" 
                      onClick={() => navigateMonth(-1)}
                    >
                      &#8249;
                    </button>
                    <span className="fw-bold" style={{minWidth: '150px', textAlign: 'center'}}>
                      {currentDate.toLocaleDateString('en-US', { 
                        month: 'long', 
                        year: 'numeric' 
                      })}
                    </span>
                    <button 
                      className="btn btn-outline-secondary btn-sm" 
                      onClick={() => navigateMonth(1)}
                    >
                      &#8250;
                    </button>
                  </div>
                </div>
              </div>
              <div className="card-body p-0">
                {/* Calendar Header */}
                <div className="d-grid border-bottom" style={{gridTemplateColumns: 'repeat(7, 1fr)'}}>
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center bg-white py-2 fw-bold text-muted small border-end">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="d-grid" style={{gridTemplateColumns: 'repeat(7, 1fr)', }}>
                  {renderCalendar()}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card shadow-sm mb-3">
              <div className="card-header d-flex justify-content-between">
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
            </div>

            {!showHistory ? (
              <>
                <div className="card shadow-sm mb-3">
                  <div className="card-header">Today's Tasks</div>
                  <div className="card-body">
                    {getTodayTasks().length > 0 ? (
                      getTodayTasks().map(t => <TaskCard key={t.id} task={t} />)
                    ) : (
                      <EmptyState message="No tasks scheduled for today" />
                    )}
                  </div>
                </div>
                <div className="card shadow-sm mb-3">
                  <div className="card-header">Upcoming Tasks</div>
                  <div className="card-body">
                    {getUpcomingTasks().length > 0 ? (
                      getUpcomingTasks().map(t => <TaskCard key={t.id} task={t} />)
                    ) : (
                      <EmptyState message="No upcoming tasks assigned" />
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="card shadow-sm">
                <div className="card-header">Task History</div>
                <div className="card-body">
                  {getCompletedTasks().length > 0 ? (
                    getCompletedTasks().map(t => <TaskCard key={t.id} task={t} />)
                  ) : (
                    <EmptyState message="No completed tasks yet" />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {/* Failed Modal */}
      {showFailedModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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

      {/* Extend Modal */}
      {showExtendModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
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
    </SidebarLayout>
  );
}