import React, { useState, useMemo } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { Search, Plus, Edit2, Eye, Settings, User, Clock, CheckCircle, AlertCircle, XCircle } from 'lucide-react';

export default function AssetManagement() {
  // Sample data
  const [assets] = useState([
    { id: 'A001', name: 'Laptop Dell XPS 13', category: 'IT Equipment', status: 'operational', assignee: 'John Smith', location: 'Office Floor 2', purchaseDate: '2023-01-15', value: 1200 },
    { id: 'A002', name: 'Projector Epson', category: 'Presentation', status: 'under_maintenance', assignee: 'Sarah Johnson', location: 'Conference Room A', purchaseDate: '2022-08-20', value: 800 },
    { id: 'A003', name: 'Office Chair Herman Miller', category: 'Furniture', status: 'operational', assignee: 'Mike Davis', location: 'Workspace 15', purchaseDate: '2023-03-10', value: 450 },
    { id: 'A004', name: 'Server HP ProLiant', category: 'IT Equipment', status: 'retired', assignee: 'IT Team', location: 'Server Room', purchaseDate: '2020-05-12', value: 2500 },
    { id: 'A005', name: 'Printer Canon MX920', category: 'Office Equipment', status: 'operational', assignee: 'Reception', location: 'Front Desk', purchaseDate: '2023-02-28', value: 300 },
    { id: 'A006', name: 'Whiteboard Mobile', category: 'Presentation', status: 'under_maintenance', assignee: 'Training Room', location: 'Training Center', purchaseDate: '2022-11-05', value: 200 }
  ]);

  const [personnel] = useState([
    { id: 'P001', name: 'John Smith', department: 'Engineering', email: 'john.smith@company.com' },
    { id: 'P002', name: 'Sarah Johnson', department: 'Marketing', email: 'sarah.johnson@company.com' },
    { id: 'P003', name: 'Mike Davis', department: 'Operations', email: 'mike.davis@company.com' },
    { id: 'P004', name: 'Lisa Chen', department: 'HR', email: 'lisa.chen@company.com' },
    { id: 'P005', name: 'Tom Wilson', department: 'Finance', email: 'tom.wilson@company.com' }
  ]);

  const [tasks, setTasks] = useState([
  { id: 'T001', assetId: 'A002', assigneeId: 'P003', title: 'Replace projector bulb', description: 'Projector bulb needs replacement', priority: 'high', dueDate: '2024-08-25', status: 'pending' },
  { id: 'T002', assetId: 'A006', assigneeId: 'P004', title: 'Fix whiteboard wheels', description: 'Mobile whiteboard wheels are loose', priority: 'medium', dueDate: '2024-08-28', status: 'in_progress' },
  { id: 'T003', assetId: 'A001', assigneeId: 'P001', title: 'Software update', description: 'Update laptop OS and security patches', priority: 'medium', dueDate: '2024-08-30', status: 'completed' },
  { id: 'T004', assetId: 'A005', assigneeId: 'P002', title: 'Printer maintenance', description: 'Clean and replace toner cartridge', priority: 'low', dueDate: '2024-08-26', status: 'failed', failureReason: 'Toner not available in stock' },
  { id: 'T005', assetId: 'A002', assigneeId: 'P002', title: 'Equipment inspection', description: 'Routine quarterly inspection and testing', priority: 'medium', dueDate: '2025-08-11', status: 'pending' }
]);


  const [taskSearchTerm, setTaskSearchTerm] = useState('');
const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  const [predefinedTasks] = useState([
  'Equipment Maintenance',
  'Safety Inspection',
  'Software Update',
  'Calibration Check',
  'Cleaning Service',
  'Battery Replacement',
  'Performance Review',
  'Inventory Check'
]);
  
  const [showAdvancedScheduleModal, setShowAdvancedScheduleModal] = useState(false);
const [advancedSchedule, setAdvancedSchedule] = useState({
  assetId: '',
  assigneeId: '', // ← ADD THIS LINE
  taskType: 'predefined', // 'predefined' or 'custom'
  predefinedTask: '',
  customTaskTitle: '',
  customTaskDescription: '',
  description: '',
  scheduleDate: '',
  scheduleTime: '',
  repeat: 'none' // 'none', 'weekly', 'monthly', 'yearly', 'custom'
});

const [selectedTask, setSelectedTask] = useState(null);
const [isEditingTask, setIsEditingTask] = useState(false);
const [editingTask, setEditingTask] = useState(null);

  // State management
  const [activeTab, setActiveTab] = useState('assets');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
  assetId: '',
  assigneeId: '',
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  dueTime: '', // Add this line
  taskType: 'predefined', // Add this line
  status: 'pending'
});
  const [isEditing, setIsEditing] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Get unique categories
  const categories = [...new Set(assets.map(asset => asset.category))];

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter(asset => {
      const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           asset.assignee.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || asset.status === statusFilter;
      const matchesCategory = categoryFilter === 'all' || asset.category === categoryFilter;
      
      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [assets, searchTerm, statusFilter, categoryFilter]);

  // Filter tasks
const filteredTasks = useMemo(() => {
  return tasks.filter(task => {
    const asset = assets.find(a => a.id === task.assetId);
    const assignee = personnel.find(p => p.id === task.assigneeId);
    
    const matchesSearch = task.title.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                         asset?.name.toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
                         assignee?.name.toLowerCase().includes(taskSearchTerm.toLowerCase());
    const matchesStatus = taskStatusFilter === 'all' || task.status === taskStatusFilter;
    
    return matchesSearch && matchesStatus;
  });
}, [tasks, taskSearchTerm, taskStatusFilter, assets, personnel]);

  // Handle asset update
  const handleUpdateAsset = () => {
    if (editingAsset) {
      const updatedAssets = assets.map(asset => 
        asset.id === editingAsset.id ? editingAsset : asset
      );
      // Here you would normally update your state or send to API
      // For now, we'll just close the editing mode
      setIsEditing(false);
      setSelectedAsset(editingAsset);
      setEditingAsset(null);
      alert('Asset updated successfully!'); // Replace with proper notification
    }
  };

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingAsset({...selectedAsset});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingAsset(null);
  };

  // Status badge component
  const StatusBadge = ({ status }) => {
    const statusConfig = {
      operational: { className: 'badge bg-success', icon: CheckCircle, text: 'Operational' },
      under_maintenance: { className: 'badge bg-warning', icon: AlertCircle, text: 'Under Maintenance' },
      retired: { className: 'badge bg-secondary', icon: XCircle, text: 'Retired' }
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <span className={config.className}>
        <IconComponent size={12} className="me-1" />
        {config.text}
      </span>
    );
  };

  // Task Status badge component
const TaskStatusBadge = ({ status }) => {
  const statusConfig = {
    pending: { className: 'badge bg-secondary', icon: Clock, text: 'Pending' },
    in_progress: { className: 'badge bg-primary', icon: AlertCircle, text: 'In Progress' },
    completed: { className: 'badge bg-success', icon: CheckCircle, text: 'Completed' },
    failed: { className: 'badge bg-danger', icon: XCircle, text: 'Failed' }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <span className={config.className}>
      <IconComponent size={12} className="me-1" />
      {config.text}
    </span>
  );
};

  // Handle task creation
  const handleCreateTask = () => {
  if (newTask.title && newTask.assetId && newTask.assigneeId) {
    const task = {
      ...newTask,
      id: `T${String(tasks.length + 1).padStart(3, '0')}`
    };
    setTasks([...tasks, task]);
    setNewTask({
      assetId: '',
      assigneeId: '',
      title: '',
      description: '',
      priority: 'medium',
      dueDate: '',
      dueTime: '', // Add this line
      taskType: 'predefined', // Add this line
      status: 'pending'
    });
    setShowTaskModal(false);
  }
};
const handleStartEditTask = () => {
  setIsEditingTask(true);
  setEditingTask({...selectedTask});
};

const handleUpdateTask = () => {
  if (editingTask) {
    const updatedTasks = tasks.map(task => 
      task.id === editingTask.id ? editingTask : task
    );
    setTasks(updatedTasks);
    setIsEditingTask(false);
    setSelectedTask(editingTask);
    setEditingTask(null);
    alert('Task updated successfully!');
  }
};

const handleCancelEditTask = () => {
  setIsEditingTask(false);
  setEditingTask(null);
};


  return (
    <SidebarLayout role="admin">
      <div className="container-fluid">
        {/* Header */}
<div className="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h2 className="fw-bold mb-1">Asset Management</h2>
    <p className="text-muted mb-0">Manage and track all company assets</p>
  </div>
  <div className="d-flex gap-2">
    <button
      className="btn btn-outline-primary"
      onClick={() => setShowAdvancedScheduleModal(true)}
    >
      <Clock size={16} className="me-2" />
      Advanced Schedule
    </button>
    <button
      className="btn btn-primary"
      onClick={() => setShowTaskModal(true)}
    >
      <Plus size={16} className="me-2" />
      Assign Task
    </button>
  </div>
</div>

        {/* Tabs */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'assets' ? 'active' : ''}`}
              onClick={() => setActiveTab('assets')}
            >
              <Settings size={16} className="me-2" />
              Assets
            </button>
          </li>
          <li className="nav-item">
            <button
              className={`nav-link ${activeTab === 'tasks' ? 'active' : ''}`}
              onClick={() => setActiveTab('tasks')}
            >
              <Clock size={16} className="me-2" />
              Tasks
            </button>
          </li>
        </ul>

        {activeTab === 'assets' && (
          <>
            {/* Search and Filter Bar */}
            <div className="card mb-4">
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="position-relative">
                      <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
                      <input
                        type="text"
                        className="form-control ps-5"
                        placeholder="Search assets by name, ID, or assignee..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                    >
                      <option value="all">All Status</option>
                      <option value="operational">Operational</option>
                      <option value="under_maintenance">Under Maintenance</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>
                  <div className="col-md-3">
                    <select
                      className="form-select"
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="all">All Categories</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Assets Table */}
            <div className="card">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Asset</th>
                      <th>Category</th>
                      <th>Status</th>
                      <th>Location</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAssets.map((asset) => (
                      <tr key={asset.id}>
                        <td>
                          <div>
                            <div className="fw-semibold">{asset.name}</div>
                            <small className="text-muted">{asset.id}</small>
                          </div>
                        </td>
                        <td>{asset.category}</td>
                        <td>
                          <StatusBadge status={asset.status} />
                        </td>
                        <td>{asset.location}</td>
                        <td>
                          <div className="btn-group btn-group-sm">
                            <button 
                              className="btn btn-outline-primary btn-sm"
                              onClick={() => setSelectedAsset(asset)}
                            >
                              View
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

{activeTab === 'tasks' && (
  <>
    {/* Task Search and Filter Bar */}
    <div className="card mb-4">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-8">
            <div className="position-relative">
              <Search size={16} className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search tasks by title, asset, or assignee..."
                value={taskSearchTerm}
                onChange={(e) => setTaskSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <select
              className="form-select"
              value={taskStatusFilter}
              onChange={(e) => setTaskStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      </div>
    </div>

    {/* Tasks List */}
    <div className="card">
      <div className="card-header">
        <h5 className="card-title mb-0">Task Management ({filteredTasks.length} tasks)</h5>
      </div>
      <div className="card-body p-0">
        {filteredTasks.length === 0 ? (
          <div className="p-4 text-center text-muted">
            <Clock size={48} className="mb-3 opacity-50" />
            <p>No tasks found matching your criteria.</p>
          </div>
        ) : (
          filteredTasks.map((task, index) => {
            const asset = assets.find(a => a.id === task.assetId);
            const assignee = personnel.find(p => p.id === task.assigneeId);
            return (
              <div key={task.id} className={`p-3 ${index !== filteredTasks.length - 1 ? 'border-bottom' : ''}`}>
               
                
                   <div className="d-flex justify-content-between align-items-start">
  <div className="flex-grow-1">
    <div className="d-flex align-items-center gap-2 mb-1">
      <h6 className="mb-0">{task.title}</h6>
      <span className={`badge ${
        task.priority === 'high' ? 'bg-danger' :
        task.priority === 'medium' ? 'bg-warning' : 'bg-success'
      }`}>
        {task.priority}
      </span>
      <TaskStatusBadge status={task.status} />
    </div>
    <div className="d-flex gap-4 text-sm">
      <small className="text-muted">Due: <span className="text-dark">{task.dueDate}</span></small>
      <small className="text-muted">Asset: <span className="text-dark">{asset?.name}</span></small>
    </div>
  </div>
                  <div className="ms-3">
  <button 
    className="btn btn-sm btn-outline-primary"
    onClick={() => setSelectedTask(task)}
  >
    View Details
  </button>
</div>

                </div>



              </div>
            );
          })
        )}
      </div>
    </div>
  </>
)}

            {/* Advanced Schedule Modal */}
{showAdvancedScheduleModal && (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Advanced Task Scheduling</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowAdvancedScheduleModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          {/* Asset Selection */}
          <div className="mb-3">
            <label className="form-label">Select Asset</label>
            <select
              className="form-select"
              value={advancedSchedule.assetId}
              onChange={(e) => setAdvancedSchedule({...advancedSchedule, assetId: e.target.value})}
            >
              <option value="">Select Asset</option>
              {assets.map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name} ({asset.id})</option>
              ))}
            </select>
          </div>

          <div className="mb-3">
  <label className="form-label">Assign To</label>
  <select
    className="form-select"
    value={advancedSchedule.assigneeId}
    onChange={(e) => setAdvancedSchedule({...advancedSchedule, assigneeId: e.target.value})}
  >
    <option value="">Select Personnel</option>
    {personnel.map(person => (
      <option key={person.id} value={person.id}>{person.name} - {person.department}</option>
    ))}
  </select>
</div>

          {/* Task Type Selection */}
          <div className="mb-3">
            <label className="form-label">Task Type</label>
            <div className="d-flex gap-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="taskType"
                  id="predefined"
                  value="predefined"
                  checked={advancedSchedule.taskType === 'predefined'}
                  onChange={(e) => setAdvancedSchedule({...advancedSchedule, taskType: e.target.value})}
                />
                <label className="form-check-label" htmlFor="predefined">
                  Predefined Tasks
                </label>
              </div>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name="taskType"
                  id="custom"
                  value="custom"
                  checked={advancedSchedule.taskType === 'custom'}
                  onChange={(e) => setAdvancedSchedule({...advancedSchedule, taskType: e.target.value})}
                />
                <label className="form-check-label" htmlFor="custom">
                  Custom Task
                </label>
              </div>
            </div>
          </div>

          {/* Predefined Task Selection */}
          {advancedSchedule.taskType === 'predefined' && (
            <div className="mb-3">
              <label className="form-label">Select Task</label>
              <select
                className="form-select"
                value={advancedSchedule.predefinedTask}
                onChange={(e) => setAdvancedSchedule({...advancedSchedule, predefinedTask: e.target.value})}
              >
                <option value="">Choose a task</option>
                {predefinedTasks.map(task => (
                  <option key={task} value={task}>{task}</option>
                ))}
              </select>
            </div>
          )}

          {/* Custom Task Fields */}
          {advancedSchedule.taskType === 'custom' && (
            <>
              <div className="mb-3">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={advancedSchedule.customTaskTitle}
                  onChange={(e) => setAdvancedSchedule({...advancedSchedule, customTaskTitle: e.target.value})}
                  placeholder="Enter custom task title"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Task Description</label>
                <textarea
                  className="form-control"
                  rows={2}
                  value={advancedSchedule.customTaskDescription}
                  onChange={(e) => setAdvancedSchedule({...advancedSchedule, customTaskDescription: e.target.value})}
                  placeholder="Enter task description"
                />
              </div>
            </>
          )}

          {/* Optional Description */}
          <div className="mb-3">
            <label className="form-label">Additional Notes (Optional)</label>
            <textarea
              className="form-control"
              rows={2}
              value={advancedSchedule.description}
              onChange={(e) => setAdvancedSchedule({...advancedSchedule, description: e.target.value})}
              placeholder="Add any additional notes or instructions..."
            />
          </div>

          {/* Schedule Date and Time */}
          <div className="row mb-3">
            <div className="col-md-6">
              <label className="form-label">Schedule Date</label>
              <input
                type="date"
                className="form-control"
                value={advancedSchedule.scheduleDate}
                onChange={(e) => setAdvancedSchedule({...advancedSchedule, scheduleDate: e.target.value})}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Schedule Time</label>
              <input
                type="time"
                className="form-control"
                value={advancedSchedule.scheduleTime}
                onChange={(e) => setAdvancedSchedule({...advancedSchedule, scheduleTime: e.target.value})}
              />
            </div>
          </div>

          {/* Repeat Options */}
          <div className="mb-3">
            <label className="form-label">Repeat Schedule</label>
            <select
              className="form-select"
              value={advancedSchedule.repeat}
              onChange={(e) => setAdvancedSchedule({...advancedSchedule, repeat: e.target.value})}
            >
              <option value="none">No Repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Interval</option>
            </select>
          </div>

          {/* Custom Interval (if selected) */}
          {advancedSchedule.repeat === 'custom' && (
            <div className="alert alert-info">
              <small>Custom interval scheduling will be configured in the next step after saving this schedule.</small>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowAdvancedScheduleModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
  if (advancedSchedule.assetId && advancedSchedule.assigneeId && 
      (advancedSchedule.predefinedTask || advancedSchedule.customTaskTitle)) {
    
    const taskTitle = advancedSchedule.taskType === 'predefined' 
      ? advancedSchedule.predefinedTask 
      : advancedSchedule.customTaskTitle;
      
    const taskDescription = advancedSchedule.taskType === 'predefined'
      ? advancedSchedule.description
      : advancedSchedule.customTaskDescription + (advancedSchedule.description ? ' - ' + advancedSchedule.description : '');

    const newScheduledTask = {
      id: `T${String(tasks.length + 1).padStart(3, '0')}`,
      assetId: advancedSchedule.assetId,
      assigneeId: advancedSchedule.assigneeId,
      title: taskTitle,
      description: taskDescription,
      priority: 'medium',
      dueDate: advancedSchedule.scheduleDate,
      status: 'pending'
    };

    setTasks([...tasks, newScheduledTask]);
    alert('Advanced schedule created successfully!');
    setShowAdvancedScheduleModal(false);
    
    // Reset form
    setAdvancedSchedule({
      assetId: '',
      assigneeId: '',
      taskType: 'predefined',
      predefinedTask: '',
      customTaskTitle: '',
      customTaskDescription: '',
      description: '',
      scheduleDate: '',
      scheduleTime: '',
      repeat: 'none'
    });
  } else {
    alert('Please fill in all required fields');
  }
}}


          >
            Create Schedule
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Task Assignment Modal */}
{showTaskModal && (
<div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Assign New Task</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowTaskModal(false)}
          ></button>
        </div>
        <div className="modal-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label">Select Asset</label>
              <select
                className="form-select"
                value={newTask.assetId}
                onChange={(e) => setNewTask({...newTask, assetId: e.target.value})}
              >
                <option value="">Select Asset</option>
                {assets.map(asset => (
                  <option key={asset.id} value={asset.id}>{asset.name} ({asset.id})</option>
                ))}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Assign To</label>
              <select
                className="form-select"
                value={newTask.assigneeId}
                onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
              >
                <option value="">Select Personnel</option>
                {personnel.map(person => (
                  <option key={person.id} value={person.id}>{person.name} - {person.department}</option>
                ))}
              </select>
            </div>
            
            {/* Task Type Selection */}
            <div className="col-md-12">
              <label className="form-label">Task Type</label>
              <div className="d-flex gap-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="taskType"
                    id="predefinedTask"
                    value="predefined"
                    checked={newTask.taskType === 'predefined'}
                    onChange={(e) => setNewTask({...newTask, taskType: e.target.value})}
                  />
                  <label className="form-check-label" htmlFor="predefinedTask">
                    Maintenance Task
                  </label>
                </div>
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="taskType"
                    id="customTask"
                    value="custom"
                    checked={newTask.taskType === 'custom'}
                    onChange={(e) => setNewTask({...newTask, taskType: e.target.value})}
                  />
                  <label className="form-check-label" htmlFor="customTask">
                    Custom Task
                  </label>
                </div>
              </div>
            </div>

            {/* Predefined Task Selection */}
            {newTask.taskType === 'predefined' && (
              <div className="col-md-12">
                <label className="form-label">Select Maintenance Task</label>
                <select
                  className="form-select"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                >
                  <option value="">Choose a maintenance task</option>
                  {predefinedTasks.map(task => (
                    <option key={task} value={task}>{task}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Task Title */}
            {newTask.taskType === 'custom' && (
              <div className="col-md-12">
                <label className="form-label">Task Title</label>
                <input
                  type="text"
                  className="form-control"
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Enter custom task title"
                />
              </div>
            )}

            <div className="col-md-12">
              <label className="form-label">Description <small className="text-muted">(Optional)</small></label>
              <textarea
                className="form-control"
                rows={3}
                value={newTask.description}
                onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                placeholder="Enter additional task details or instructions (optional)"
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Priority</label>
              <select
                className="form-select"
                value={newTask.priority}
                onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="col-md-4">
              <label className="form-label">Due Date</label>
              <input
                type="date"
                className="form-control"
                value={newTask.dueDate}
                onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              />
            </div>
            <div className="col-md-4">
              <label className="form-label">Time <small className="text-muted">(Optional)</small></label>
              <input
                type="time"
                className="form-control"
                value={newTask.dueTime || ''}
                onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
              />
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setShowTaskModal(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreateTask}
          >
            Assign Task
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Task Detail Modal */}
{selectedTask && (
  <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">
            {isEditingTask ? 'Edit Task' : 'Task Details'}
          </h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => {
              setSelectedTask(null);
              setIsEditingTask(false);
              setEditingTask(null);
            }}
          ></button>
        </div>
        <div className="modal-body">
          {!isEditingTask ? (
            // View Mode
            <div className="row g-3">
              <div className="col-md-6">
                <strong>Task ID:</strong> {selectedTask.id}
              </div>
              <div className="col-md-6">
                <strong>Title:</strong> {selectedTask.title}
              </div>
              <div className="col-md-12">
  <strong>Description:</strong> 
  <div className="mt-1" style={{ wordBreak: 'break-word' }}>
    {selectedTask.description}
  </div>
</div>
              <div className="col-md-6">
                <strong>Asset:</strong> {assets.find(a => a.id === selectedTask.assetId)?.name}
              </div>
              <div className="col-md-6">
                <strong>Assigned to:</strong> {personnel.find(p => p.id === selectedTask.assigneeId)?.name}
              </div>
              <div className="col-md-6">
                <strong>Priority:</strong> 
                <span className={`badge ms-2 ${
                  selectedTask.priority === 'high' ? 'bg-danger' :
                  selectedTask.priority === 'medium' ? 'bg-warning' : 'bg-success'
                }`}>
                  {selectedTask.priority}
                </span>
              </div>
              <div className="col-md-6">
                <strong>Status:</strong> <TaskStatusBadge status={selectedTask.status} />
              </div>
              <div className="col-md-6">
                <strong>Due Date:</strong> {selectedTask.dueDate}
              </div>
              {selectedTask.failureReason && (
                <div className="col-md-12">
                  <strong>Failure Reason:</strong> 
                  <div className="alert alert-danger mt-2">
                    {selectedTask.failureReason}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Edit Mode
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Task ID</label>
                <input type="text" className="form-control" value={editingTask.id} disabled />
              </div>
              <div className="col-md-6">
                <label className="form-label">Title</label>
                <input 
                  type="text" 
                  className="form-control" 
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({...editingTask, title: e.target.value})}
                />
              </div>
              <div className="col-md-12">
                <label className="form-label">Description</label>
                <textarea 
                  className="form-control" 
                  rows={3}
                  value={editingTask.description}
                  onChange={(e) => setEditingTask({...editingTask, description: e.target.value})}
                />
              </div>
              <div className="col-md-6">
                <label className="form-label">Asset</label>
                <select 
                  className="form-select"
                  value={editingTask.assetId}
                  onChange={(e) => setEditingTask({...editingTask, assetId: e.target.value})}
                >
                  {assets.map(asset => (
                    <option key={asset.id} value={asset.id}>{asset.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Assigned to</label>
                <select 
                  className="form-select"
                  value={editingTask.assigneeId}
                  onChange={(e) => setEditingTask({...editingTask, assigneeId: e.target.value})}
                >
                  {personnel.map(person => (
                    <option key={person.id} value={person.id}>{person.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Priority</label>
                <select 
                  className="form-select"
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({...editingTask, priority: e.target.value})}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Status</label>
                <select 
                  className="form-select"
                  value={editingTask.status}
                  onChange={(e) => setEditingTask({...editingTask, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="col-md-4">
                <label className="form-label">Due Date</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={editingTask.dueDate}
                  onChange={(e) => setEditingTask({...editingTask, dueDate: e.target.value})}
                />
              </div>
              {editingTask.status === 'failed' && (
                <div className="col-md-12">
                  <label className="form-label">Failure Reason</label>
                  <textarea 
                    className="form-control" 
                    rows={2}
                    value={editingTask.failureReason || ''}
                    onChange={(e) => setEditingTask({...editingTask, failureReason: e.target.value})}
                    placeholder="Enter failure reason..."
                  />
                </div>
              )}
            </div>
          )}
        </div>
        <div className="modal-footer">
          {!isEditingTask ? (
            <>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleStartEditTask}
              >
                Edit Task
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setSelectedTask(null)}
              >
                Close
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                className="btn btn-success"
                onClick={handleUpdateTask}
              >
                Save Changes
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={handleCancelEditTask}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  </div>
)}



        {/* Asset Detail Modal */}
        {selectedAsset && (
          <div className="modal d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {isEditing ? 'Edit Asset' : 'Asset Details'}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setSelectedAsset(null);
                      setIsEditing(false);
                      setEditingAsset(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  {!isEditing ? (
                    // View Mode
                    <div className="row g-3">
                      <div className="col-md-6">
                        <strong>ID:</strong> {selectedAsset.id}
                      </div>
                      <div className="col-md-6">
                        <strong>Name:</strong> {selectedAsset.name}
                      </div>
                      <div className="col-md-6">
                        <strong>Category:</strong> {selectedAsset.category}
                      </div>
                      <div className="col-md-6">
                        <strong>Status:</strong> <StatusBadge status={selectedAsset.status} />
                      </div>
                      <div className="col-md-6">
                        <strong>Location:</strong> {selectedAsset.location}
                      </div>
                     
                    </div>
                  ) : (
                    // Edit Mode
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label">ID</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingAsset.id} 
                          disabled 
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Name</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingAsset.name}
                          onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Category</label>
                        <select 
                          className="form-select"
                          value={editingAsset.category}
                          onChange={(e) => setEditingAsset({...editingAsset, category: e.target.value})}
                        >
                          {categories.map(category => (
                            <option key={category} value={category}>{category}</option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Status</label>
                        <select 
                          className="form-select"
                          value={editingAsset.status}
                          onChange={(e) => setEditingAsset({...editingAsset, status: e.target.value})}
                        >
                          <option value="operational">Operational</option>
                          <option value="under_maintenance">Under Maintenance</option>
                          <option value="retired">Retired</option>
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Location</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          value={editingAsset.location}
                          onChange={(e) => setEditingAsset({...editingAsset, location: e.target.value})}
                        />
                      </div>
                     
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  {!isEditing ? (
                    <>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleStartEdit}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setSelectedAsset(null)}
                      >
                        Close
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={handleUpdateAsset}
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleCancelEdit}
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </SidebarLayout>
  );
}