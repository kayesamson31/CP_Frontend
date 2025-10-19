// MaintenanceTasks.js - Basic Structure
import { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import { AuthUtils } from '../../utils/AuthUtils';
import { logActivity } from '../../utils/ActivityLogger';
import { assetService } from '../../services/assetService';
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
  const [assignedPersonnel, setAssignedPersonnel] = useState('');
const [showAssignModal, setShowAssignModal] = useState(false);
const [showDismissModal, setShowDismissModal] = useState(false);

  // API Base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
  const [incidentTaskForm, setIncidentTaskForm] = useState({
  dueDate: '',
  dueTime: '09:00',
  description: ''
});
  // Tabs - NO "To Review" for maintenance tasks
  const tabs = [
    { name: 'To Review', count: tasks.filter(t => t.type === 'incident' && t.status === 'To Review').length },
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
    
    // Get organization_id from current user
    const orgId = AuthUtils.getCurrentOrganizationId();
    if (!orgId) {
      throw new Error('Organization not found for current user');
    }
    
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
      .eq('organization_id', orgId) 
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
  dueDate: task.due_date,
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

  // Fetch incident reports for "To Review" tab
    const { data: incidents, error: incidentError } = await supabase
      .from('incident_reports')
      .select(`
        incident_id,
        description,
        date_reported,
        asset_id,
        severity_id,
        incident_type_id,
        reported_by,
        assets(asset_name, asset_code, location),
        incident_types(type_name),
        severity_levels(severity_name),
        users!reported_by(full_name)
      `)
      .eq('organization_id', orgId)
      .eq('status_id', 4) // Only "Reported" incidents
      .order('date_reported', { ascending: false });

    if (incidentError) {
      console.error('Error fetching incidents:', incidentError);
    }

    // Transform incidents to look like tasks
    // Get incidents that already have assigned tasks
const { data: existingTasks } = await supabase
  .from('maintenance_tasks')
  .select('incident_id')
  .not('incident_id', 'is', null);

const assignedIncidentIds = new Set(existingTasks?.map(t => t.incident_id) || []);

// Filter out incidents that already have tasks assigned
const unassignedIncidents = incidents?.filter(inc => !assignedIncidentIds.has(inc.incident_id)) || [];
    const transformedIncidents = unassignedIncidents.map(inc => ({
      id: `INC-${inc.incident_id}`,
      taskName: inc.incident_types?.type_name || 'Incident Report',
      assetName: inc.assets?.asset_name || 'Unknown Asset',
      assetCode: inc.assets?.asset_code || null,
      location: inc.assets?.location || '-',
      status: 'To Review',
      priority: inc.severity_levels?.severity_name || 'Medium',
      dueDate: null,
      dateCreated: inc.date_reported,
      description: inc.description,
      incident_id: inc.incident_id,
      asset_id: inc.asset_id,
      assignedTo: 'Unassigned',
      type: 'incident',
      reportedBy: inc.users?.full_name || 'Unknown',
      severity: inc.severity_levels?.severity_name || 'Medium'
    })) || [];

    // Combine incidents and tasks
    setTasks([...transformedIncidents, ...transformedTasks]);

  } catch (err) {
    console.error('Error fetching maintenance tasks:', err);
    setError('Failed to load maintenance tasks from database.');
    setTasks([]);
  } finally {
    setLoading(false);
  }
};

 const fetchPersonnel = async () => {
  try {
    const orgId = AuthUtils.getCurrentOrganizationId();
    if (!orgId) {
      console.error('Organization not found');
      setPersonnel([]);
      return;
    }
    
    const { data, error } = await supabase
      .from('users')
      .select('user_id, full_name, email, role_id')
      .eq('organization_id', orgId)  // ← ADD THIS
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
  const handleDismissIncident = async () => {
  if (!window.confirm('Are you sure you want to dismiss this incident?')) return;
  
  try {
    setLoading(true);
    
    await assetService.updateIncidentStatus(selectedTask.id, 'Dismissed');
    
    await logActivity('dismiss_incident', 
      `Dismissed incident: ${selectedTask.taskName} - ${selectedTask.priority} Priority for ${selectedTask.assetName}`
    );
    
    await fetchMaintenanceTasks();
    setShowModal(false);
    setSelectedTask(null);
    
    alert('Incident dismissed successfully');
  } catch (err) {
    console.error('Error dismissing incident:', err);
    alert('Failed to dismiss incident: ' + err.message);
  } finally {
    setLoading(false);
  }
};

const handleAssignIncidentTask = () => {
  setShowModal(false);
  setShowAssignModal(true);
};

const confirmIncidentAssignment = async () => {
  if (!assignedPersonnel || !incidentTaskForm.dueDate) {
    alert('Please select personnel and set due date');
    return;
  }
  
  try {
    setLoading(true);
    
    const assignedPerson = personnel.find(p => p.id === parseInt(assignedPersonnel));
    
    const severityToPriority = {
      'Critical': 'high',
      'Major': 'high', 
      'Minor': 'low',
      'High': 'high',
      'Medium': 'medium',
      'Low': 'low'
    };
    
    const priority = severityToPriority[selectedTask.priority] || 'medium';
    
   const taskData = {
  assetId: selectedTask.assetCode,
  title: `${selectedTask.taskName} - ${selectedTask.priority} Priority`,
  description: incidentTaskForm.description || selectedTask.description,
  assigneeId: assignedPersonnel,
  priority: priority,
  dueDate: incidentTaskForm.dueDate,
  dueTime: incidentTaskForm.dueTime || '09:00',
  taskType: 'custom',
  status: 'pending',
  incidentId: parseInt(selectedTask.id.replace('INC-', ''))
};
    
    await assetService.createMaintenanceTask(taskData);
    // Mark incident as handled (but keep status as Reported until task completes)
const incidentId = parseInt(selectedTask.id.replace('INC-', ''));
await supabase
  .from('incident_reports')
  .update({ 
    status_id: 4 // Keep as "Reported" - will auto-resolve when task completes
  })
  .eq('incident_id', incidentId);
    await logActivity('assign_maintenance_task', 
      `Assigned maintenance task from incident: ${selectedTask.taskName} - ${selectedTask.priority} Priority to ${assignedPerson.name}`
    );
    
    await fetchMaintenanceTasks();
 setShowAssignModal(false);
setAssignedPersonnel('');
setIncidentTaskForm({ dueDate: '', dueTime: '09:00', description: '' });
setSelectedTask(null);
    
    alert(`Maintenance task assigned to ${assignedPerson.name}!`);
    
  } catch (err) {
    console.error('Error assigning task:', err);
    alert('Failed to assign task: ' + err.message);
  } finally {
    setLoading(false);
  }
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
    {activeTab !== 'To Review' && <th>Assigned To</th>}
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
    {task.extensionCount > 0 && (
      <span className="badge bg-warning text-dark" style={{ fontSize: '0.7rem' }}>
        EXTENDED ({task.extensionCount}x)
      </span>
    )}
  </div>
</td>
                      <td>{formatDate(task.dueDate)}</td>
{activeTab !== 'To Review' && <td>{task.assignedTo || 'Unassigned'}</td>}
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

{/* Extension History - IMPROVED COLLAPSIBLE */}
{selectedTask.extensionCount > 0 && selectedTask.extensionHistory && selectedTask.extensionHistory.length > 0 && (
  <div className="mb-4">
    {/* Header with View All button */}
    <div className="d-flex justify-content-between align-items-center mb-2">
      <label className="form-label fw-bold text-muted small text-uppercase mb-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Extension History ({selectedTask.extensionCount})
      </label>
      
      {selectedTask.extensionHistory.length > 1 && (
        <button 
          className="btn btn-link btn-sm text-muted p-0 text-decoration-none" 
          style={{fontSize: '0.75rem'}}
          onClick={(e) => {
            const content = e.target.closest('.mb-4').querySelector('#extensionHistoryContent');
            const icon = e.target.querySelector('.bi') || e.target;
            if (content.style.display === 'none') {
              content.style.display = 'block';
              icon.classList.remove('bi-chevron-down');
              icon.classList.add('bi-chevron-up');
            } else {
              content.style.display = 'none';
              icon.classList.remove('bi-chevron-up');
              icon.classList.add('bi-chevron-down');
            }
          }}
        >
          View all <i className="bi bi-chevron-down"></i>
        </button>
      )}
    </div>
    
    {/* Latest Extension - Always Visible */}
    <div className="border rounded p-3" style={{backgroundColor: '#fffbf0', borderLeft: '3px solid #ffc107'}}>
      <div className="d-flex align-items-start gap-2">
        <div className="text-warning" style={{fontSize: '1.1rem', lineHeight: '1'}}>
          <i className="bi bi-clock"></i>
        </div>
        <div className="flex-grow-1" style={{fontSize: '0.85rem'}}>
          <div className="d-flex justify-content-between align-items-start mb-1">
            <span className="fw-semibold text-dark">
              {formatDate(selectedTask.extensionHistory[selectedTask.extensionHistory.length - 1].old_due_date)} → {formatDate(selectedTask.extensionHistory[selectedTask.extensionHistory.length - 1].new_due_date)}
            </span>
            <small className="text-muted">{formatDate(selectedTask.extensionHistory[selectedTask.extensionHistory.length - 1].extension_date)}</small>
          </div>
          <p className="mb-0 text-muted" style={{fontSize: '0.8rem'}}>
            {selectedTask.extensionHistory[selectedTask.extensionHistory.length - 1].extension_reason || 'No reason provided'}
          </p>
        </div>
      </div>
    </div>

    {/* Previous Extensions - Collapsible Content */}
    {selectedTask.extensionHistory.length > 1 && (
      <div className="mt-2 border rounded p-2" style={{backgroundColor: '#f8f9fa', display: 'none'}} id="extensionHistoryContent">
        {selectedTask.extensionHistory.slice(0, -1).reverse().map((ext, index) => (
          <div key={index} className={`d-flex align-items-start gap-2 p-2 ${index !== selectedTask.extensionHistory.length - 2 ? 'mb-2 border-bottom' : ''}`}>
            <div className="text-muted" style={{fontSize: '1rem', lineHeight: '1'}}>
              <i className="bi bi-clock"></i>
            </div>
            <div className="flex-grow-1" style={{fontSize: '0.85rem'}}>
              <div className="d-flex justify-content-between align-items-start mb-1">
                <span className="fw-semibold">
                  {formatDate(ext.old_due_date)} → {formatDate(ext.new_due_date)}
                </span>
                <small className="text-muted">{formatDate(ext.extension_date)}</small>
              </div>
              <p className="mb-0 text-muted" style={{fontSize: '0.8rem'}}>
                {ext.extension_reason || 'No reason provided'}
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
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
                       {/* Admin Actions for Incidents */}
{selectedTask.type === 'incident' && selectedTask.status === 'To Review' && (
  <div className="mb-4 p-4 rounded-3 shadow-sm" style={{backgroundColor: '#FFFFFF', border: '2px solid #337FCA'}}>
    <h6 className="fw-bold mb-3 text-dark d-flex align-items-center">
      <i className="bi bi-gear-fill me-2 text-warning"></i>
      Incident Actions
    </h6>
    
    <div className="row g-2">
      <div className="col-6">
        <button 
          className="btn btn-danger w-100 fw-bold"
          onClick={handleDismissIncident}
          disabled={loading}
        >
          Dismiss Incident
        </button>
      </div>
      <div className="col-6">
        <button 
          className="btn btn-success w-100 fw-bold"
          onClick={handleAssignIncidentTask}
          disabled={loading}
        >
          Assign Task
        </button>
      </div>
    </div>
  </div>
)}
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

               {/* Assign Personnel Modal */}
{showAssignModal && selectedTask && (
  <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Assign Maintenance Task - {selectedTask.id}</h5>
          <button 
            type="button" 
            className="btn-close"
            onClick={() => {
              setShowAssignModal(false);
              setAssignedPersonnel('');
            }}
          ></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-info">
            <strong>Incident:</strong> {selectedTask.taskName}<br />
            <strong>Asset:</strong> {selectedTask.assetName}<br />
            <strong>Priority:</strong> {selectedTask.priority}
          </div>
          
<div className="mb-3">
  <label className="form-label">Select Personnel *</label>
  <select 
    className="form-select"
    value={assignedPersonnel}
    onChange={(e) => setAssignedPersonnel(e.target.value)}
  >
    <option value="">Choose personnel...</option>
    {personnel.map(person => (
      <option key={person.id} value={person.id}>
        {person.name}
      </option>
    ))}
  </select>
</div>

{/* ADD THESE - Due Date & Time Fields */}
<div className="row">
  <div className="col-md-6">
    <div className="mb-3">
      <label className="form-label">Due Date *</label>
      <input
        type="date"
        className="form-control"
        value={incidentTaskForm.dueDate || ''}
        onChange={(e) => setIncidentTaskForm({...incidentTaskForm, dueDate: e.target.value})}
        required
      />
    </div>
  </div>
  
  <div className="col-md-6">
    <div className="mb-3">
      <label className="form-label">Due Time</label>
      <input
        type="time"
        className="form-control"
        value={incidentTaskForm.dueTime || '09:00'}
        onChange={(e) => setIncidentTaskForm({...incidentTaskForm, dueTime: e.target.value})}
      />
    </div>
  </div>
</div>

<div className="mb-3">
  <label className="form-label">Additional Instructions (Optional)</label>
  <textarea
    className="form-control"
    rows={3}
    value={incidentTaskForm.description || ''}
    onChange={(e) => setIncidentTaskForm({...incidentTaskForm, description: e.target.value})}
    placeholder="Add any additional instructions..."
  />
  <small className="text-muted">Default: {selectedTask?.description}</small>
</div>
        </div>
        <div className="modal-footer">
<button 
  type="button" 
  className="btn btn-secondary"
  onClick={() => {
    setShowAssignModal(false);
    setAssignedPersonnel('');
    setIncidentTaskForm({ dueDate: '', dueTime: '09:00', description: '' });
  }}
>
  Cancel
</button>
<button 
  type="button" 
  className="btn btn-success"
  onClick={confirmIncidentAssignment}
  disabled={!assignedPersonnel || !incidentTaskForm.dueDate || loading}
>
  {loading ? 'Assigning...' : 'Assign Task'}
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