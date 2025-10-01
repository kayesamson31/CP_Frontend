// MaintenanceTasks.js - Basic Structure
import { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';

export default function MaintenanceTasks() {
  // State management (same pattern as WorkOrder)
  const [activeTab, setActiveTab] = useState('Pending');
  const [tasks, setTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [categories, setCategories] = useState([]);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Tabs - NO "To Review" for maintenance tasks
  const tabs = [
    { name: 'Pending', count: tasks.filter(t => t.status === 'Pending').length },
    { name: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length },
    { name: 'Completed', count: tasks.filter(t => t.status === 'Completed').length },
    { name: 'Failed', count: tasks.filter(t => t.status === 'Failed').length }
    // NO Rejected, NO Cancelled for maintenance tasks
  ];

const fetchMaintenanceTasks = async () => {
  try {
    setLoading(true);
    setError(null);
    
const { data, error } = await supabase
  .from('maintenance_tasks')
  .select(`
    *,
    assets!maintenance_tasks_asset_id_fkey(asset_id, asset_name, asset_code, location),
    statuses(status_name, color_code),
    priority_levels(priority_name, color_code),
    assigned_user:users!assigned_to(full_name, email),
    maintenance_task_extensions(
      extension_id,
      old_due_date,
      new_due_date,
      extension_reason,
      extension_date
    )
  `)
  .order('date_created', { ascending: false });
    
    if (error) throw error;
         // ADD THIS - to see what we're getting
    console.log('Raw data from database:', data);
    console.log('First task work_orders:', data[0]?.work_orders);
    console.log('First task assets:', data[0]?.work_orders?.assets);
    // Transform data
    const transformedTasks = data.map(task => {
      console.log(`Task ${task.task_id}:`, {
        work_order_id: task.work_order_id,
        has_work_order: !!task.work_orders,
        asset_name: task.work_orders?.assets?.asset_name,
        location: task.work_orders?.assets?.location
      });
      const dueDate = new Date(task.due_date);
      const currentDate = new Date();
      currentDate.setHours(0, 0, 0, 0);
      dueDate.setHours(0, 0, 0, 0);

      const statusName = task.statuses?.status_name || 'Pending';
      const isOverdue = (statusName === 'Pending' || statusName === 'In Progress') && 
                       dueDate < currentDate;

      // Parse extension_history properly
      let extensionHistory = [];
      if (task.extension_history) {
        try {
          extensionHistory = Array.isArray(task.extension_history) 
            ? task.extension_history 
            : JSON.parse(task.extension_history);
        } catch (e) {
          console.error('Error parsing extension_history:', e);
          extensionHistory = [];
        }
      }

   return {
  id: `MT-${task.task_id}`,
  taskName: task.task_name,
  assetName: task.assets?.asset_name || 'Unknown Asset',
  location: task.assets?.location || '-',
  status: statusName,
  priority: task.priority_levels?.priority_name || 'Low',
  dueDate: task.due_due,
  dateCreated: task.date_created,
  description: task.description,
  task_id: task.task_id,
  assignedTo: task.assigned_user?.full_name || 'Unassigned',
  isOverdue: isOverdue,
  asset_id: task.asset_id,
  originalDueDate: task.original_due_date || task.due_date,
  extensionCount: task.extension_count || 0,
  extensionHistory: task.maintenance_task_extensions || [],
  remarks: task.remarks, // ADD THIS for failed reason
  lastExtensionReason: task.last_extension_reason // ADD THIS
};
    });

    setTasks(transformedTasks);

  } catch (err) {
    console.error('Error fetching maintenance tasks:', err);
    setError('Failed to load maintenance tasks from database.');
    setTasks([]);
  } finally {
    setLoading(false);
  }
};

  const fetchPersonnel = async () => {
    // Same as WorkOrder.js
    try {
      const { data, error } = await supabase
        .from('users')
        .select('user_id, full_name, email, role_id')
        .eq('role_id', 3)
        .order('full_name');

      if (error) throw error;

      const transformedPersonnel = data.map(user => ({
        id: user.user_id,
        name: user.full_name,
        email: user.email
      }));
      
      setPersonnel(transformedPersonnel);
    } catch (err) {
      console.error('Error fetching personnel:', err);
      setPersonnel([]);
    }
  };

  const fetchCategories = async () => {
    // Same categories as WorkOrder
    const defaultCategories = [
      'Electrical', 'Plumbing', 'HVAC', 'Carpentry', 
      'Masonry', 'General Services', 'Groundskeeping', 'Painting'
    ];
    setCategories(defaultCategories);
  };

  useEffect(() => {
    fetchMaintenanceTasks();
    fetchPersonnel();
    fetchCategories();
  }, []);
  // Filtered tasks (same logic as work orders)
  const filteredTasks = tasks.filter(task => {
    const matchesTab = task.status === activeTab;
    const matchesSearch = task.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.taskName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.assetName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || task.priority === priorityFilter;
    
    return matchesTab && matchesSearch && matchesCategory && matchesPriority;
  });

  const handleViewTask = (task) => {
    setSelectedTask(task);
    setShowModal(true);
  };

const getStatusBadge = (status) => {
    const statusColors = {
      'Pending': 'text-info',
      'In Progress': 'text-primary',
      'Completed': 'text-success',
      'Failed': 'text-danger'
    };
    return <span className={`badge ${statusColors[status] || 'text-muted'}`}>{status}</span>;
  };
  const getPriorityBadge = (priority) => {
    const priorityColors = {
      'High': 'text-danger',
      'Medium': 'text-warning', 
      'Low': 'text-success'
    };
    return <span className={priorityColors[priority] || 'text-muted'} style={{ fontSize: '0.85rem' }}>● {priority}</span>;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };
  return (
    <SidebarLayout role="admin">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Maintenance Tasks</h3>  {/* Changed from "Work Orders" */}
        </div>
       {/* Error Alert */}
               {error && (
                 <div className="alert alert-warning alert-dismissible fade show" role="alert">
                   {error}
                   <button 
                     type="button" 
                     className="btn-close" 
                     onClick={() => setError(null)}
                     aria-label="Close"
                   ></button>
                 </div>
               )}
       
               {/* Search and Filters */}
       {/* Search and Filters */}
       <div className="row mb-4">
         <div className="col-md-4">
           <input
             type="text"
             className="form-control"
             placeholder="Search assets by name, ID, or assignee..."
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
             style={{
               borderRadius: '8px',
               border: '1px solid #ddd',
               padding: '8px 12px'
             }}
           />
         </div>
         <div className="col-md-4">
           <select 
             className="form-select"
             value={priorityFilter}
             onChange={(e) => setPriorityFilter(e.target.value)}
             style={{
               borderRadius: '8px',
               border: '1px solid #ddd',
               padding: '8px 12px'
             }}
           >
             <option value="all">All Status</option>
             <option value="High">High Priority</option>
             <option value="Medium">Medium Priority</option>
             <option value="Low">Low Priority</option>
           </select>
         </div>
         <div className="col-md-4">
           <select 
             className="form-select"
             value={categoryFilter}
             onChange={(e) => setCategoryFilter(e.target.value)}
             style={{
               borderRadius: '8px',
               border: '1px solid #ddd',
               padding: '8px 12px'
             }}
           >
             <option value="all">All Categories</option>
             {categories.map(category => (
               <option key={category} value={category}>{category}</option>
             ))}
           </select>
         </div>
       </div>
       
               {/* Tabs */}
               <div className="mb-4">
                 <div className="d-flex p-3 bg-white rounded-3 shadow-sm border">
                   {tabs.map(tab => (
                     <button 
                       key={tab.name}
                       className={`btn position-relative px-3 py-2 rounded-pill fw-semibold flex-fill me-2 ${
                         activeTab === tab.name 
                           ? 'btn-primary text-white shadow-sm' 
                           : 'btn-outline-secondary text-muted'
                       }`}
                       onClick={() => setActiveTab(tab.name)}
                       style={{
                         border: activeTab === tab.name ? 'none' : '1.5px solid #e5e7eb',
                         transition: 'all 0.2s ease',
                         fontSize: '0.85rem',
                         minWidth: '0'
                       }}
                     >
                       <div className="d-flex align-items-center justify-content-center">
                         <span className="text-truncate">{tab.name}</span>
                         <span 
                           className={`badge rounded-pill ms-2 ${
                             activeTab === tab.name 
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
       
               {/* Results Count */}
               <div className="d-flex justify-content-between align-items-center mb-3">
                <small className="text-muted">
          Showing {filteredTasks.length} of {tasks.filter(t => t.status === activeTab).length} maintenance tasks
        </small>
               </div>
       
               {/* Loading Spinner */}
               {loading && (
                 <div className="text-center py-5">
                   <div className="spinner-border text-primary" role="status">
                     <span className="visually-hidden">Loading...</span>
                   </div>
                   <p className="mt-2 text-muted">Loading work orders...</p>
                 </div>
               )}
       
               {/* Work Orders Table */}
              {/* Maintenance Tasks Table */}
        {!loading && (
          <div className="card shadow-sm"> 
            <div className="table-responsive">
              <table className="table table-hover mb-0">      
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Task Name</th>
                    <th>Asset</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Due Date</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                       
                      <tbody>
                  {filteredTasks.map(task => (
                    <tr 
                      key={task.id} 
                      style={{
                        backgroundColor: task.isOverdue ? '#fff5f5' : 'inherit',
                        border: task.isOverdue ? '2px solid rgba(220, 53, 69, 0.2)' : 'inherit'
                      }}
                    >
                      <td className="fw-bold text-dark" style={{ fontSize: '1rem', fontFamily: 'monospace' }}>
                        {task.id || '-'}
                      </td>
                      <td>{task.taskName || '-'}</td>
                      <td><span className="text-muted fw-medium">{task.assetName || '-'}</span></td>
                      <td>{task.location || '-'}</td>
                      <td>{getStatusBadge(task.status)}</td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          {getPriorityBadge(task.priority)}
                          {task.isOverdue && (
                            <span className="badge bg-danger" style={{ fontSize: '0.7rem' }}>
                              OVERDUE
                            </span>
                          )}
                        </div>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td>{task.assignedTo || 'Unassigned'}</td>
                      <td>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleViewTask(task)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>

                     </table>
                   </div>
                 </div>
               )}
       
               {/* No Results */}
               {!loading && filteredTasks.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
            <h5 className="text-muted">No maintenance tasks found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria.</p>
          </div>
        )}
               {/* View Details Modal */}
               {showModal && selectedTask && (
                 <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                   <div className="modal-dialog modal-dialog-centered" style={{maxWidth: '700px'}}>      
                     <div className="modal-content">
                       <div className="modal-header border-0 text-white" style={{background: '#337FCA', borderRadius: '0.5rem 0.5rem 0 0'}}>  
                        <h5 className="modal-title fw-bold">Maintenance Task Details</h5>
                        <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                       </div>

<div className="modal-body px-5 py-4" style={{backgroundColor: '#FFFFFF', minHeight: '500px'}}>  
  {/* Header Section - ID, Task Name, Status */}
  <div className="text-center mb-4">
    <h4 className="fw-bold text-dark mb-2" style={{fontSize: '1.5rem'}}>ID: {selectedTask.id}</h4>
    <h5 className="fw-semibold mb-2" style={{fontSize: '1.1rem', color: '#495057'}}>
      {selectedTask.taskName || 'No task name'}
    </h5>
    <div className="mt-2">
      {getStatusBadge(selectedTask.status)}
    </div>
  </div>

  {/* Divider */}
  <hr className="my-4" />

  {/* Asset and Location Row */}
  <div className="row mb-4">
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Asset
      </label>
      <p className="mb-0" style={{fontSize: '0.95rem', color: '#212529'}}>{selectedTask.assetName || '-'}</p>
    </div>
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Location
      </label>
      <p className="mb-0" style={{fontSize: '0.95rem', color: '#212529'}}>{selectedTask.location || '-'}</p>
    </div>
  </div>

  {/* Priority and Due Date Row */}
  <div className="row mb-4">
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Priority
      </label>
      <p className="mb-0">
        <span className={`fw-bold ${
          selectedTask.priority === 'High' ? 'text-danger' :
          selectedTask.priority === 'Medium' ? 'text-warning' :
          'text-success'
        }`} style={{fontSize: '0.95rem'}}>
          {selectedTask.priority || 'Not specified'}
        </span>
      </p>
    </div>
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Due Date
      </label>
      <p className="mb-0" style={{fontSize: '0.95rem', color: '#212529'}}>{formatDate(selectedTask.dueDate)}</p>
    </div>
  </div>

  {/* Date Created and Assigned To Row */}
  <div className="row mb-4">
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Date Created
      </label>
      <p className="mb-0" style={{fontSize: '0.95rem', color: '#212529'}}>{formatDate(selectedTask.dateCreated)}</p>
    </div>
    <div className="col-6">
      <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Assigned To
      </label>
      <p className="mb-0" style={{fontSize: '0.95rem', color: '#212529'}}>{selectedTask.assignedTo || 'Unassigned'}</p>
    </div>
  </div>

  {/* Divider */}
  <hr className="my-4" />

  {/* Description */}
  <div className="mb-4">
    <label className="form-label fw-bold text-muted small text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
      Description
    </label>
    <div className="p-3 bg-light rounded border" style={{minHeight: '80px'}}>
      <p className="mb-0" style={{lineHeight: '1.6', fontSize: '0.95rem', color: '#495057'}}>
        {selectedTask.description || 'No description provided'}
      </p>
    </div>
  </div>

  {/* Extension History */}
{/* Extension History */}
{selectedTask.extensionCount > 0 && selectedTask.extensionHistory && selectedTask.extensionHistory.length > 0 && (
  <div className="mb-4">
    <label className="form-label fw-bold text-muted small text-uppercase mb-3" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
      Extension History ({selectedTask.extensionCount} extensions)
    </label>
    <div className="alert alert-warning" role="alert" style={{backgroundColor: '#fff3cd', border: '1px solid #ffc107'}}>
      {selectedTask.extensionHistory.map((ext, index) => (
        <div key={index} className="bg-white p-3 rounded border mb-2">
          <div className="row">
            <div className="col-6">
              <strong className="small text-muted text-uppercase" style={{fontSize: '0.75rem'}}>From:</strong>
              <p className="mb-0" style={{fontSize: '0.9rem'}}>{formatDate(ext.old_due_date)}</p>
            </div>
            <div className="col-6">
              <strong className="small text-muted text-uppercase" style={{fontSize: '0.75rem'}}>To:</strong>
              <p className="mb-0" style={{fontSize: '0.9rem'}}>{formatDate(ext.new_due_date)}</p>
            </div>
          </div>
          <div className="mt-2">
            <strong className="small text-muted text-uppercase" style={{fontSize: '0.75rem'}}>Reason:</strong>
            <p className="mb-0" style={{fontSize: '0.9rem'}}>{ext.extension_reason || 'No reason provided'}</p>
          </div>
          <div className="mt-1">
            <small className="text-muted" style={{fontSize: '0.8rem'}}>
              Extended on: {formatDate(ext.extension_date)}
            </small>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* Failed Reason - ADD THIS if not present */}
{selectedTask.status === 'Failed' && selectedTask.remarks && (
  <div className="mb-4">
    <label className="form-label fw-bold text-danger text-uppercase mb-2" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
      Failure Reason
    </label>
    <div className="alert alert-danger" role="alert">
      <p className="mb-0" style={{fontSize: '0.95rem'}}>{selectedTask.remarks}</p>
    </div>
  </div>
)}

  {/* Overdue Warning */}
  {selectedTask.isOverdue && (
    <div className="mb-4">
      <div className="alert alert-danger d-flex align-items-center" role="alert">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        <div>
          <strong style={{fontSize: '0.95rem'}}>This maintenance task is overdue!</strong><br />
          <small style={{fontSize: '0.85rem'}}>
            {selectedTask.extensionCount > 0 
              ? `Extended due date was: ${formatDate(selectedTask.dueDate)} (Originally: ${formatDate(selectedTask.originalDueDate)})`
              : `Due date was: ${formatDate(selectedTask.dueDate)}`
            }
          </small>
        </div>
      </div>
    </div>
  )}
</div>
                       
                       <div className="modal-footer border-0 pt-0 justify-content-end">
                        <button 
  type="button" 
  className="btn btn-outline-secondary btn-sm"
  onClick={() => setShowModal(false)}
>
  Close
</button>
                       </div>
                     </div>
                   </div>
                 </div>
               )}
                    </div>
           </SidebarLayout>
         );
       }