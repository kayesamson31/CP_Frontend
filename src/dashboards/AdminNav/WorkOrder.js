// src/components/WorkOrder.js
import { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import { AuthUtils } from '../../utils/AuthUtils';
import { logActivity } from '../../utils/ActivityLogger';
export default function WorkOrder() {
  const [activeTab, setActiveTab] = useState('To Review');
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assignedPersonnel, setAssignedPersonnel] = useState('');
  const [assignedTime, setAssignedTime] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminPriority, setAdminPriority] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [categories, setCategories] = useState([]);
  const [extendedDueDate, setExtendedDueDate] = useState('');
const [showExtendModal, setShowExtendModal] = useState(false);
const [extensionReason, setExtensionReason] = useState('');
const [showReassignModal, setShowReassignModal] = useState(false);
const [showCloseResolvedModal, setShowCloseResolvedModal] = useState(false);
const [adminResolution, setAdminResolution] = useState('');
const [currentPage, setCurrentPage] = useState(1);
const [itemsPerPage] = useState(15); // 15 work orders per page

  // API Base URL - update this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';


  // Fetch work orders from backend
const fetchWorkOrders = async () => {
  try {
    setLoading(true);
    setError(null);
    
    // Get organization_id from current user
    const orgId = AuthUtils.getCurrentOrganizationId();
    if (!orgId) {
      throw new Error('Organization not found for current user');
    }
    
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        users!requested_by(full_name, email),
        statuses(status_name, color_code),
        priority_levels!work_orders_priority_id_fkey(priority_name, color_code),
        admin_priority_levels:priority_levels!work_orders_admin_priority_id_fkey(priority_name, color_code),
        assigned_user:users!assigned_to(full_name, email),
        work_order_extensions(*)
      `)
      .eq('organization_id', orgId)  // â† ADD THIS
      .order('date_requested', { ascending: false });
  
  if (error) throw error;
    // Transform data to match your component structure
// Transform data to match your component structure
const transformedOrders = data.map(wo => {
  // ADD OVERDUE LOGIC HERE
  const dueDate = new Date(wo.due_date);
  const currentDate = new Date();
  // Set time to start of day for accurate comparison
  currentDate.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const statusName = wo.statuses?.status_name || 'To Review';
  const isOverdue = (statusName === 'Pending' || statusName === 'In Progress') && 
                   dueDate < currentDate;

  return {
    id: `WO-${wo.work_order_id}`,
    requester: wo.users?.full_name || 'Unknown',
    category: wo.category,
    location: wo.location,
    status: statusName,
    priority: wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'Low',
    suggestedPriority: wo.priority_levels?.priority_name || 'Low',
    adminUpdatedPriority: wo.admin_priority_levels?.priority_name || null,
    requestDate: wo.date_requested,
     scheduledTime: wo.scheduled_time,
    dueDate: wo.due_date,
    description: wo.title,
    detailedDescription: wo.description,
    assetEquipment: wo.asset_text || 'Not specified',
    work_order_id: wo.work_order_id,
    assignedTo: wo.assigned_user?.full_name || null,
    failureReason: wo.failure_reason,
    rejectionReason: wo.rejection_reason,
    priority_id: wo.priority_id,
    admin_priority_id: wo.admin_priority_id,
    isOverdue: isOverdue,
    originalDueDate: wo.original_due_date,
    extensionCount: wo.extension_count || 0,
    lastExtensionReason: wo.last_extension_reason,
    extensionHistory: wo.work_order_extensions || [],
     requesterConfirmation: wo.requester_confirmation || 'pending',
  disputedReason: wo.disputed_reason || null 
    
  };
});


    setWorkOrders(transformedOrders);

  } catch (err) {
    console.error('Error fetching work orders:', err);
    setError('Failed to load work orders from database.');
    setWorkOrders([]);
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
      .select('user_id, full_name, email, role_id, job_position')
      .eq('organization_id', orgId)
      .eq('role_id', 3)
      .order('full_name');

    if (error) throw error;

    const transformedPersonnel = await Promise.all(
      data.map(async (user) => {
        // Count active work orders assigned to this personnel
        const { count: activeWorkOrders } = await supabase
          .from('work_orders')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.user_id)
          .in('status_id', [1, 2]); // Pending (2) or In Progress (3) - adjust IDs if needed

        // Count active maintenance tasks assigned to this personnel
        const { count: activeTasks } = await supabase
          .from('maintenance_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.user_id)
          .in('status_id', [1, 2]); // Pending or In Progress

        // Total active assignments = work orders + maintenance tasks
        const totalActive = (activeWorkOrders || 0) + (activeTasks || 0);

        return {
          id: user.user_id,
          name: user.full_name,
          email: user.email,
          department: user.job_position || 'Personnel',
          activeTaskCount: totalActive // ✅ Combined count
        };
      })
    );
    
    setPersonnel(transformedPersonnel);
  } catch (err) {
    console.error('Error fetching personnel:', err);
    setPersonnel([]);
  }
};

const fetchCategories = async () => {
  try {
    // Use the same categories from your user form
    const defaultCategories = [
      'Electrical', 
      'Plumbing', 
      'HVAC', 
      'Carpentry', 
      'Masonry', 
      'General Services', 
      'Groundskeeping', 
      'Painting'
    ];
    
    setCategories(defaultCategories);
  } catch (err) {
    console.error('Error setting categories:', err);
    setCategories([]);
  }
};

  useEffect(() => {
    fetchWorkOrders();
    fetchPersonnel();
    fetchCategories();
  }, []);

  const tabs = [
  { name: 'To Review', count: workOrders.filter(wo => wo.status === 'To Review').length },
  { name: 'Pending', count: workOrders.filter(wo => wo.status === 'Pending').length },
  { name: 'In Progress', count: workOrders.filter(wo => wo.status === 'In Progress').length },
  { name: 'Completed', count: workOrders.filter(wo => wo.status === 'Completed').length },
  { name: 'Needs Review', count: workOrders.filter(wo => wo.status === 'Needs Review').length }, // ← ADD THIS
  { name: 'Failed', count: workOrders.filter(wo => wo.status === 'Failed').length },
  { name: 'Rejected', count: workOrders.filter(wo => wo.status === 'Rejected').length },
  { name: 'Cancelled', count: workOrders.filter(wo => wo.status === 'Cancelled').length }
];

  const filteredOrders = workOrders.filter(order => {
     const matchesTab = order.status === activeTab;
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.requester?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || order.category === categoryFilter;
    const matchesPriority = priorityFilter === 'all' || order.priority === priorityFilter;
    
    return matchesTab && matchesSearch && matchesCategory && matchesPriority;
  });

// Pagination calculations
const indexOfLastItem = currentPage * itemsPerPage;
const indexOfFirstItem = indexOfLastItem - itemsPerPage;
const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const handleViewOrder = (order) => {
    setSelectedOrder(order);
    setShowModal(true);
  };

  const handleAcceptOrder = (order) => {
    setSelectedOrder(order);
    setShowAssignModal(true);
  };

  const handleRejectOrder = (order) => {
    setSelectedOrder(order);
    setShowRejectModal(true);
  };

const confirmAssignment = async () => {
  if (!assignedPersonnel) return;

  try {
    setLoading(true);
    
    // Get "Pending" status
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'Pending')
      .eq('status_category', 'work_order')
      .single();

    if (statusError) throw statusError;

// Prepare update object with scheduled time
let scheduledDateTime = new Date();
if (assignedTime) {
  // If time is provided, combine selected date with time
  const [hours, minutes] = assignedTime.split(':');
  scheduledDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
}

const updateData = { 
  status_id: statusData.status_id,
  assigned_to: parseInt(assignedPersonnel),
  date_assigned: new Date().toISOString()
};

// Only add scheduled_time if provided
if (assignedTime) {
  updateData.scheduled_time = assignedTime;
}

    // If admin selected a priority, get the priority_id and add to update
    if (adminPriority) {
      const { data: priorityData, error: priorityError } = await supabase
        .from('priority_levels')
        .select('priority_id')
        .eq('priority_name', adminPriority)
        .single();

      if (priorityError) {
        console.error('Error fetching priority:', priorityError);
        throw new Error('Failed to update priority level');
      }

      updateData.admin_priority_id = priorityData.priority_id;
    }

    // Update work order
    const { error: updateError } = await supabase
      .from('work_orders')
      .update(updateData)
      .eq('work_order_id', selectedOrder.work_order_id);

    if (updateError) throw updateError;

 // Reload work orders
await fetchWorkOrders();

// ✅ Log activity
await logActivity('assign_work_order', `Assigned work order ${selectedOrder.id} to personnel`);

// ✅ Notify personnel about assignment
try {
  // Get current admin user
  const { data: { user } } = await supabase.auth.getUser();
  const { data: adminData } = await supabase
    .from('users')
    .select('user_id, organization_id')
    .eq('auth_uid', user.id)
    .single();

  // Get personnel name for message
  const personnelData = personnel.find(p => p.id === parseInt(assignedPersonnel));
  
  await supabase.from('notifications').insert({
    notification_type_id: 9, // or create new type for "work_order_assigned"
    created_by: adminData.user_id,
    title: 'Work Order Assigned to You',
    message: `Admin assigned you work order: "${selectedOrder.description}"${adminPriority ? ` with ${adminPriority} priority` : ''}`,
    target_user_id: parseInt(assignedPersonnel), // ✅ Specific personnel
    priority_id: adminPriority ? (adminPriority === 'High' ? 3 : adminPriority === 'Medium' ? 2 : 1) : 2,
    related_table: 'work_orders',
    related_id: selectedOrder.work_order_id,
    organization_id: adminData.organization_id,
    is_active: true
  });
  
  console.log('✅ Personnel notified about work order assignment');
} catch (notifError) {
  console.error('❌ Failed to notify personnel:', notifError);
}

// Reset modal states
setShowAssignModal(false);

    setAssignedPersonnel('');
    setAdminPriority('');
    setAssignedTime('');
    setSelectedOrder(null);

  } catch (err) {
    console.error('Error assigning personnel:', err);
    setError('Failed to assign personnel: ' + err.message);
  } finally {
    setLoading(false);
  }
};

const confirmRejection = async () => {
  if (!rejectReason.trim()) return;

  try {
    setLoading(true);
    
    // Get "Rejected" status
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'Rejected')
      .eq('status_category', 'work_order')
      .single();

    if (statusError) throw statusError;

    // Update work order
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({ 
        status_id: statusData.status_id,
        rejection_reason: rejectReason,
        date_resolved: new Date().toISOString()
      })
      .eq('work_order_id', selectedOrder.work_order_id);

    if (updateError) throw updateError;

 // Reload work orders
await fetchWorkOrders();

// ✅ Log activity - TAMA NA PLACEMENT NITO DITO!
await logActivity('reject_work_order', `Rejected work order ${selectedOrder.id} - Reason: ${rejectReason}`);

// Reset modal states
setShowRejectModal(false);

    setRejectReason('');
    setAdminPriority('');
    setSelectedOrder(null);

  } catch (err) {
    console.error('Error rejecting work order:', err);
    setError('Failed to reject work order.');
  } finally {
    setLoading(false);
  }
};

const handleReassignForRevision = async () => {
  if (!assignedPersonnel || !extendedDueDate) return;

  try {
    setLoading(true);
    
    // Get "In Progress" status
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'In Progress')
      .eq('status_category', 'work_order')
      .single();

    if (statusError) throw statusError;

    // Update work order with NEW DUE DATE ✅
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({ 
        status_id: statusData.status_id,
        assigned_to: parseInt(assignedPersonnel),
        requester_confirmation: 'pending', // Reset confirmation
        disputed_reason: null, // Clear dispute
        due_date: new Date(extendedDueDate).toISOString() // ✅ NEW DUE DATE
      })
      .eq('work_order_id', selectedOrder.work_order_id);

    if (updateError) throw updateError;

    // Reload data
    await fetchWorkOrders();

    // Log activity
    await logActivity('reassign_disputed_work_order', `Reassigned disputed work order ${selectedOrder.id} for revision`);

    // Notify personnel
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('users')
        .select('user_id, full_name, organization_id')
        .eq('auth_uid', user.id)
        .single();

      await supabase.from('notifications').insert({
        notification_type_id: 3,
        created_by: adminData.user_id,
        title: 'Work Order Reassigned for Revision',
       message: `Admin ${adminData.full_name} reassigned work order "${selectedOrder.description}" to you for revision. New due date: ${new Date(extendedDueDate).toLocaleDateString()}. Previous complaint: "${selectedOrder.disputedReason}"`,
        target_user_id: parseInt(assignedPersonnel),
        priority_id: 3,
        related_table: 'work_orders',
        related_id: selectedOrder.work_order_id,
        organization_id: adminData.organization_id,
        is_active: true
      });
    } catch (notifError) {
      console.error('Failed to notify personnel:', notifError);
    }

    // Reset states
    setShowReassignModal(false);
    setAssignedPersonnel('');
    setExtendedDueDate('');
    setSelectedOrder(null);

  } catch (err) {
    console.error('Error reassigning work order:', err);
    setError('Failed to reassign work order: ' + err.message);
  } finally {
    setLoading(false);
  }
};

const handleCloseAsResolved = async () => {
  try {
    setLoading(true);
    
    // Get "Completed" status
    const { data: statusData, error: statusError } = await supabase
      .from('statuses')
      .select('status_id')
      .eq('status_name', 'Completed')
      .eq('status_category', 'work_order')
      .single();

    if (statusError) throw statusError;

    // Update work order
    const { error: updateError } = await supabase
      .from('work_orders')
      .update({ 
        status_id: statusData.status_id,
        requester_confirmation: 'confirmed', // Override to confirmed
        admin_resolution_notes: adminResolution || 'Admin closed as resolved',
        date_resolved: new Date().toISOString()
      })
      .eq('work_order_id', selectedOrder.work_order_id);

    if (updateError) throw updateError;

    // Reload data
    await fetchWorkOrders();

    // Log activity
    await logActivity('close_disputed_as_resolved', `Closed disputed work order ${selectedOrder.id} as resolved`);

    // Notify requester
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: adminData } = await supabase
        .from('users')
        .select('user_id, full_name, organization_id')
        .eq('auth_uid', user.id)
        .single();

      // Get requester's user_id
      const { data: workOrderData } = await supabase
        .from('work_orders')
        .select('requested_by')
        .eq('work_order_id', selectedOrder.work_order_id)
        .single();

      await supabase.from('notifications').insert({
        notification_type_id: 3,
        created_by: adminData.user_id,
        title: 'Work Order Closed as Resolved',
        message: `Admin ${adminData.full_name} has reviewed your complaint and closed work order "${selectedOrder.description}" as resolved. ${adminResolution ? `Resolution: ${adminResolution}` : ''}`,
        target_user_id: workOrderData.requested_by,
        priority_id: 2,
        related_table: 'work_orders',
        related_id: selectedOrder.work_order_id,
        organization_id: adminData.organization_id,
        is_active: true
      });
    } catch (notifError) {
      console.error('Failed to notify requester:', notifError);
    }

    // Reset states
    setShowCloseResolvedModal(false);
    setAdminResolution('');
    setSelectedOrder(null);

  } catch (err) {
    console.error('Error closing work order:', err);
    setError('Failed to close work order: ' + err.message);
  } finally {
    setLoading(false);
  }
};

  const getStatusBadge = (status) => {
    const statusColors = {
      'To Review': 'text-warning',
      'Pending': 'text-info',
      'In Progress': 'text-primary',
      'Completed': 'text-success',
      'Failed': 'text-danger',
      'Rejected': 'text-secondary',
      'Cancelled': 'text-dark'
    };
    
    return (
      <span className={`${statusColors[status]} fw-medium`} style={{ fontSize: '0.85rem' }}>
        {status}
      </span>
    );
  };

const getPriorityBadge = (priority) => {
  const priorityColors = {
    'High': 'text-danger',
    'Medium': 'text-warning', 
    'Low': 'text-success'
  };
  return <span className={priorityColors[priority] || 'text-muted'} style={{ fontSize: '0.85rem' }}>{priority}</span>;
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
      return dateString; // Return original if parsing fails
    }
  };
const formatTimeTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
};

  return (
    <SidebarLayout role="admin">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Work Orders</h3>
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
      onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
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
      onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
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
      onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
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
                onClick={() => { setActiveTab(tab.name); setCurrentPage(1); }}
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
            Showing {filteredOrders.length} of {workOrders.filter(wo => wo.status === activeTab).length} work orders
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
        {!loading && (
          <div className="card shadow-sm"> 
            <div className="table-responsive">
              <table className="table table-hover mb-0">      
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Requester</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Request Date</th>
                    {activeTab !== 'To Review' && <th>Assigned To</th>}
                    <th>Actions</th>
                  </tr>
                </thead>
                
                <tbody>
                  {currentOrders.map(order => (
                    <tr 
                  key={order.id} 
                  style={{
                    backgroundColor: order.isOverdue ? '#fff5f5' : 'inherit',
                    border: order.isOverdue ? '2px solid rgba(220, 53, 69, 0.2)' : 'inherit'
                  }}
                >
                      <td className="fw-bold text-dark" style={{ fontSize: '1rem', fontFamily: 'monospace' }}>
                        {order.id || '-'}
                      </td>
                      <td>{order.requester || '-'}</td>
                      <td><span className="text-muted fw-medium">{order.category || '-'}</span></td>
                      <td>{order.location || '-'}</td>
                      <td>{getStatusBadge(order.status)}</td>
                     <td>
  <div className="d-flex align-items-center gap-2">
    {getPriorityBadge(order.priority)}
    {order.isOverdue && (
      <span className="badge bg-danger" style={{ fontSize: '0.7rem', animation: 'pulse 2s infinite' }}>
        OVERDUE
      </span>
    )}
    {order.extensionCount > 0 && (
      <span className="badge bg-warning" style={{ fontSize: '0.7rem' }}>
        EXTENDED {order.extensionCount}x
      </span>
    )}
  </div>
</td>
                      <td>{formatDate(order.requestDate)}</td>
                      
                      {activeTab !== 'To Review' && <td>{order.assignedTo || '-'}</td>}
                      <td>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleViewOrder(order)}>
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Controls */}
{totalPages > 1 && (
  <div className="d-flex justify-content-between align-items-center p-3 border-top bg-light">
    <div className="text-muted">
      Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} work orders
    </div>
    <div className="d-flex gap-2">
      <button 
        className="btn btn-outline-primary btn-sm"
        disabled={currentPage === 1}
        onClick={() => setCurrentPage(currentPage - 1)}
      >
        Previous
      </button>
      
      <div className="d-flex gap-1">
        {[...Array(totalPages)].map((_, index) => (
          <button
            key={index + 1}
            className={`btn btn-sm ${currentPage === index + 1 ? "btn-primary" : "btn-outline-primary"}`}
            onClick={() => setCurrentPage(index + 1)}
          >
            {index + 1}
          </button>
        ))}
      </div>
      
      <button 
        className="btn btn-outline-primary btn-sm"
        disabled={currentPage === totalPages}
        onClick={() => setCurrentPage(currentPage + 1)}
      >
        Next
      </button>
    </div>
  </div>
)}

            </div>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredOrders.length === 0 && (
          <div className="text-center py-5">
            <i className="bi bi-inbox display-1 text-muted mb-3"></i>
            <h5 className="text-muted">No work orders found</h5>
            <p className="text-muted">Try adjusting your search or filter criteria.</p>
          </div>
        )}

        {/* View Details Modal */}
        {showModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered" style={{maxWidth: '700px'}}>      
              <div className="modal-content">
                <div className="modal-header border-0 text-white" style={{background: '#337FCA', borderRadius: '0.5rem 0.5rem 0 0'}}>  
                  <h5 className="modal-title fw-bold">Work Order Details</h5>
                  <button type="button" className="btn-close btn-close-white" onClick={() => { setShowModal(false); setAdminPriority(''); }}></button>
                </div>

                <div className="modal-body px-5 py-4" style={{backgroundColor: '#FFFFFFFF', minHeight: '500px'}}>  
                  <div className="text-center mb-4">
                    <h4 className="fw-bold text-dark mb-1">ID: {selectedOrder.id}</h4>
                  </div>

                  {/* Request */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small">Request:</label>
                    <p className="mb-0">{selectedOrder.description || 'No description provided'}</p>
                  </div>

                  {/* Category and Specific Asset/Equipment Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Category:</label>
                      <p className="mb-0">{selectedOrder.category || '-'}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Specific Asset/Equipment:</label>
                      <p className="mb-0">{selectedOrder.assetEquipment || selectedOrder.asset || '-'}</p>
                    </div>
                  </div>

               <div className="col-6">
  <label className="form-label fw-bold text-muted small">
    {selectedOrder.scheduledTime ? 'Scheduled Date & Time:' : 'Date Needed By:'}
  </label>
  <p className="mb-0">
    {selectedOrder.scheduledTime 
      ? `${formatDate(selectedOrder.dueDate)} at ${formatTimeTo12Hour(selectedOrder.scheduledTime)}`
      : formatDate(selectedOrder.dueDate)
    }
  </p>
  {selectedOrder.scheduledTime && (
    <small className="text-muted d-block mt-1">
      Assigned time for personnel to start
    </small>
  )}
</div>

                  {/* Request Date and Suggested Priority Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Request Date:</label>
                      <p className="mb-0">{formatDate(selectedOrder.requestDate)}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Suggested Priority:</label>
                      <p className="mb-0">
                        <span className={`fw-bold ${
                          (selectedOrder.suggestedPriority || selectedOrder.priority) === 'High' ? 'text-danger' :
                          (selectedOrder.suggestedPriority || selectedOrder.priority) === 'Medium' ? 'text-warning' :
                          'text-success'
                        }`}>
                          {selectedOrder.suggestedPriority || selectedOrder.priority || 'Not specified'}
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Detailed Description */}
                  <div className="mb-4">
                    <label className="form-label fw-bold text-muted small">Detailed Description:</label>
                    <div className="p-3 bg-white rounded border">
                      <p className="mb-0 text-muted">{selectedOrder.detailedDescription || selectedOrder.description || 'No detailed description provided'}</p>
                    </div>
                  </div>

                 {/* Overdue Warning - Add this section */}
{selectedOrder.isOverdue && (
  <div className="mb-4">
    <div className="alert alert-danger d-flex align-items-center" role="alert">
      <i className="bi bi-exclamation-triangle-fill me-2"></i>
      <div>
        <strong>This work order is overdue!</strong><br />
        <small>
          {selectedOrder.extensionCount > 0 
            ? `Extended due date was: ${formatDate(selectedOrder.dueDate)} (Originally: ${formatDate(selectedOrder.originalDueDate)})`
            : `Due date was: ${formatDate(selectedOrder.dueDate)}`
          }
        </small>
      </div>
    </div>
  </div>
)}

                {/* Extended Due Date - Only show for In Progress orders with extended dates */}
{selectedOrder.status === 'In Progress' && selectedOrder.extendedDueDate && (
  <div className="mb-4">
    <div className="p-3 rounded-3 shadow-sm" style={{
      backgroundColor: selectedOrder.isOverdue ? '#fff3cd' : '#d1ecf1', 
      border: selectedOrder.isOverdue ? '2px solid #ffc107' : '2px solid #0dcaf0'
    }}>
      <div className="d-flex align-items-center mb-2">
        <i className={`bi ${selectedOrder.isOverdue ? 'bi-exclamation-triangle-fill' : 'bi-calendar-plus-fill'} me-2 ${selectedOrder.isOverdue ? 'text-warning' : 'text-info'}`}></i>
        <h6 className={`fw-bold mb-0 ${selectedOrder.isOverdue ? 'text-warning' : 'text-info'}`}>
          {selectedOrder.isOverdue ? 'Overdue - Extended Due Date' : 'Due Date Extended'}
        </h6>
      </div>
      <div className="row">
        <div className="col-6">
          <small className="text-muted fw-bold">Original Due Date:</small>
          <p className="mb-0">{formatDate(selectedOrder.dueDate)}</p>
        </div>
        <div className="col-6">
          <small className="text-muted fw-bold">New Due Date:</small>
          <p className="mb-0">
            <span className={`fw-bold ${selectedOrder.isOverdue ? 'text-warning' : 'text-info'}`}>
              {formatDate(selectedOrder.extendedDueDate)}
            </span>
          </p>
        </div>
      </div>
      {selectedOrder.extensionReason && (
        <div className="mt-2">
          <small className="text-muted fw-bold">Extension Reason:</small>
          <p className="mb-0 small">{selectedOrder.extensionReason}</p>
        </div>
      )}
    </div>
  </div>
)}

                  {/* Admin Priority Update - Show for Pending, In Progress, Completed, Failed */}
                  {(selectedOrder.status === 'Pending' || selectedOrder.status === 'In Progress' || 
                    selectedOrder.status === 'Completed' || selectedOrder.status === 'Failed') && 
                    selectedOrder.adminUpdatedPriority && (
                    <div className="mb-4">
                      <div className="p-3 rounded-3 shadow-sm" style={{backgroundColor: '#e0f2fe', border: '2px solid #0288d1'}}>
                        <div className="d-flex align-items-center mb-2">
                          <i className="bi bi-shield-check-fill me-2 text-info"></i>
                          <h6 className="fw-bold mb-0 text-info">Priority Updated by Administrator</h6>
                        </div>
                        <div className="row">
                          <div className="col-6">
                            <small className="text-muted fw-bold">Original Priority:</small>
                            <p className="mb-0">{selectedOrder.suggestedPriority || 'Medium'}</p>
                          </div>
                          <div className="col-6">
                            <small className="text-muted fw-bold">Updated Priority:</small>
                            <p className="mb-0">
                              <span className={`fw-bold ${
                                selectedOrder.adminUpdatedPriority === 'High' ? 'text-danger' :
                                selectedOrder.adminUpdatedPriority === 'Medium' ? 'text-warning' :
                                'text-success'
                              }`}>
                                {selectedOrder.adminUpdatedPriority}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Rejection Reason - Only show for rejected orders */}
                  {selectedOrder.status === 'Rejected' && selectedOrder.rejectionReason && (
                    <div className="mb-4">
                      <label className="form-label fw-bold text-muted small">Rejection Reason:</label>
                      <div className="p-3 bg-danger-subtle rounded border border-danger-subtle">
                        <p className="mb-0 text-danger">{selectedOrder.rejectionReason}</p>
                      </div>
                    </div>
                  )}

                 {/* Failure Reason - Only show for failed orders */}
{selectedOrder.status === 'Failed' && selectedOrder.failureReason && (
  <div className="mb-4">
    <label className="form-label fw-bold text-muted small">Reason for Failure:</label>
    <div className="p-3 bg-danger-subtle rounded border border-danger-subtle">
      <p className="mb-0 text-danger">{selectedOrder.failureReason}</p>
    </div>
  </div>
)}

{/* Disputed Reason - Show for Needs Review status */}
{selectedOrder.status === 'Needs Review' && selectedOrder.disputedReason && (
  <div className="mb-4">
    <div className="p-3 rounded-3 shadow-sm" style={{backgroundColor: '#fff3cd', border: '2px solid #ffc107'}}>
      <div className="d-flex align-items-center mb-2">
        <i className="bi bi-exclamation-triangle-fill me-2 text-warning"></i>
        <h6 className="fw-bold mb-0 text-warning">Issue Reported by Requester</h6>
      </div>
      <div>
        <small className="text-muted fw-bold">Complaint:</small>
        <p className="mb-0 mt-1" style={{fontSize: '14px', color: '#856404'}}>
          {selectedOrder.disputedReason}
        </p>
      </div>
    </div>

    
{/* ✅ ADD THESE ACTION BUTTONS */}
    <div className="mt-3">
      <h6 className="fw-bold mb-3 text-dark">Admin Actions:</h6>
      <div className="row g-2">
        <div className="col-6">
          <button 
            className="btn btn-warning w-100 fw-bold"
            onClick={() => {
              setShowModal(false);
              setShowReassignModal(true);
            }}
            disabled={loading}
          >
            <i className="bi bi-arrow-repeat me-2"></i>
            Reassign for Revision
          </button>
        </div>
        <div className="col-6">
          <button 
            className="btn btn-success w-100 fw-bold"
            onClick={() => {
              setShowModal(false);
              setShowCloseResolvedModal(true);
            }}
            disabled={loading}
          >
            <i className="bi bi-check-circle me-2"></i>
            Close as Resolved
          </button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Extension History - IMPROVED COLLAPSIBLE */}
{selectedOrder.extensionHistory?.length > 0 && (
  <div className="mb-4">
    {/* Header with View All button */}
    <div className="d-flex justify-content-between align-items-center mb-2">
      <label className="form-label fw-bold text-muted small text-uppercase mb-0" style={{fontSize: '0.75rem', letterSpacing: '0.5px'}}>
        Extension History ({selectedOrder.extensionCount})
      </label>
      
      {selectedOrder.extensionHistory.length > 1 && (
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
              {formatDate(selectedOrder.extensionHistory[selectedOrder.extensionHistory.length - 1].old_due_date)} → {formatDate(selectedOrder.extensionHistory[selectedOrder.extensionHistory.length - 1].new_due_date)}
            </span>
            <small className="text-muted">{formatDate(selectedOrder.extensionHistory[selectedOrder.extensionHistory.length - 1].extension_date)}</small>
          </div>
          <p className="mb-0 text-muted" style={{fontSize: '0.8rem'}}>
            {selectedOrder.extensionHistory[selectedOrder.extensionHistory.length - 1].extension_reason || 'No reason provided'}
          </p>
        </div>
      </div>
    </div>

    {/* Previous Extensions - Collapsible Content */}
    {selectedOrder.extensionHistory.length > 1 && (
      <div className="mt-2 border rounded p-2" style={{backgroundColor: '#f8f9fa', display: 'none'}} id="extensionHistoryContent">
        {selectedOrder.extensionHistory.slice(0, -1).reverse().map((ext, index) => (
          <div key={index} className={`d-flex align-items-start gap-2 p-2 ${index !== selectedOrder.extensionHistory.length - 2 ? 'mb-2 border-bottom' : ''}`}>
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

                  {/* Admin Priority Control */}
                  {selectedOrder.status === 'To Review' && (
                    <div className="mb-4 p-4 rounded-3 shadow-sm" style={{backgroundColor: '#FFFFFFFF', border: '2px solid #337FCA'}}>  
                      <h6 className="fw-bold mb-4 text-dark d-flex align-items-center">
                        <i className="bi bi-gear-fill me-2 text-warning"></i>
                        Admin Priority Control
                      </h6>
                      
                      <div className="mb-4">
                        <label className="form-label fw-bold text-dark mb-2">Change Priority Level</label>
                        <select 
                          className="form-select form-select-lg shadow-sm"
                          value={adminPriority}
                          onChange={(e) => setAdminPriority(e.target.value)}
                          style={{
                            border: '2px solid #e5e7eb',
                            borderRadius: '0.75rem',
                            backgroundColor: '#ffffff',
                            fontSize: '1rem'
                          }}
                        >
                          <option value="">Keep suggested priority</option>
                          <option value="High">High Priority</option>
                          <option value="Medium">Medium Priority</option>
                          <option value="Low">Low Priority</option>
                        </select>
                      </div>

                      {/* Action Buttons */}
                      <div className="row g-2">
                        <div className="col-6">
                          <button 
                            className="btn btn-danger w-100 fw-bold"
                            onClick={() => {
                              setShowModal(false);
                              setShowRejectModal(true);
                            }}
                            disabled={loading}
                          >
                            Reject Request
                          </button>
                        </div>
                        <div className="col-6">
                          <button 
                            className="btn btn-success w-100 fw-bold"
                            onClick={() => {
                              setShowModal(false);
                              setShowAssignModal(true);
                            }}
                            disabled={loading}
                          >
                            Accept Request
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
         
                </div>
                
                <div className="modal-footer border-0 pt-0 justify-content-end">
                  <button 
                    type="button" 
                    className="btn btn-outline-secondary btn-sm"
                    onClick={() => {
                      setShowModal(false);
                      setAdminPriority('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Assign Personnel Modal */}
        {showAssignModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Assign Personnel - {selectedOrder.id}</h5>
                  <button 
  type="button" 
  className="btn-close"
  onClick={() => {
    setShowAssignModal(false);
    setAssignedTime(''); // ← ADD THIS
  }}
></button>
                </div>
                <div className="modal-body">
<div className="mb-3">
  <label className="form-label">Select Personnel</label>
  <select 
    className="form-select"
    value={assignedPersonnel}
    onChange={(e) => setAssignedPersonnel(e.target.value)}
  >
    <option value="">Choose personnel...</option>
    {personnel.map(person => (
      <option key={person.id} value={person.id}>
        {person.name}
        {person.department && ` - ${person.department}`}
        {person.activeTaskCount > 0 ? ` (${person.activeTaskCount} active)` : ''}
      </option>
    ))}
  </select>
  
  {/* ← ADD THIS WARNING BELOW */}
  {assignedPersonnel && personnel.find(p => p.id === parseInt(assignedPersonnel))?.activeTaskCount > 0 && (
    <div className="alert alert-warning mt-2 mb-0">
      <small>
        <i className="fas fa-exclamation-triangle me-1"></i>
        <strong>Note:</strong> {personnel.find(p => p.id === parseInt(assignedPersonnel))?.name} currently has {personnel.find(p => p.id === parseInt(assignedPersonnel))?.activeTaskCount} active task(s)
      </small>
    </div>
  )}
</div>
{/* ADD THIS: Scheduled Time Field */}
<div className="mb-3">
  <label className="form-label">Scheduled Time (Optional)</label>
  <input 
    type="time"
    className="form-select"
    value={assignedTime}
    onChange={(e) => setAssignedTime(e.target.value)}
  />
  <small className="text-muted">Set a specific time for the personnel to start this work order</small>
</div>
                  <div className="alert alert-info">
                    <small>Once assigned, this work order will move to the Pending tab.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowAssignModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-success"
                    onClick={confirmAssignment}
                    disabled={!assignedPersonnel || loading}
                  >
                    {loading ? 'Assigning...' : 'Assign'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reject Work Order - {selectedOrder.id}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowRejectModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Reason for Rejection</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      placeholder="Please provide a reason for rejecting this work order..."
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="alert alert-warning">
                    <small>This work order will be moved to the Rejected tab and the requester will be notified.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowRejectModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmRejection}
                    disabled={!rejectReason.trim() || loading}
                  >
                    {loading ? 'Rejecting...' : 'Reject Work Order'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Extend Due Date Modal */}
{showExtendModal && selectedOrder && (
  <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Extend Due Date - {selectedOrder.id}</h5>
          <button 
            type="button" 
            className="btn-close"
            onClick={() => {
              setShowExtendModal(false);
              setExtendedDueDate('');
              setExtensionReason('');
            }}
          ></button>
        </div>
        <div className="modal-body">
          <div className="mb-3">
            <label className="form-label">Current Due Date</label>
            <input 
              type="text" 
              className="form-control" 
              value={formatDate(selectedOrder.dueDate)}
              disabled
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New Due Date</label>
            <input 
              type="datetime-local"
              className="form-control"
              value={extendedDueDate}
              onChange={(e) => setExtendedDueDate(e.target.value)}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Reason for Extension</label>
            <textarea 
              className="form-control"
              rows="3"
              placeholder="Please provide a reason for extending the due date..."
              value={extensionReason}
              onChange={(e) => setExtensionReason(e.target.value)}
            ></textarea>
          </div>
          <div className="alert alert-info">
            <small>The personnel will be notified of the extended due date.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              setShowExtendModal(false);
              setExtendedDueDate('');
              setExtensionReason('');
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-warning"
            onClick={() => {
              // Handle extend due date logic here
              console.log('Extending due date to:', extendedDueDate);
              setShowExtendModal(false);
              setExtendedDueDate('');
              setExtensionReason('');
            }}
            disabled={!extendedDueDate || !extensionReason.trim() || loading}
          >
            {loading ? 'Extending...' : 'Extend Due Date'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
{/* Reassign for Revision Modal */}
{showReassignModal && selectedOrder && (
  <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Reassign Work Order - {selectedOrder.id}</h5>
          <button 
            type="button" 
            className="btn-close"

            onClick={() => {
  setShowReassignModal(false);
  setAssignedPersonnel('');
  setExtendedDueDate(''); // ✅ Clear due date
}}

          ></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning">
            <strong>Dispute Reported:</strong> {selectedOrder.disputedReason}
          </div>
          
        <div className="mb-3">
  <label className="form-label">Reassign to Personnel</label>
  <select 
    className="form-select"
    value={assignedPersonnel}
    onChange={(e) => setAssignedPersonnel(e.target.value)}
  >
    <option value="">Choose personnel...</option>
    {personnel.map(person => (
      <option key={person.id} value={person.id}>
        {person.name}
        {person.department && ` - ${person.department}`}
        {person.activeTaskCount > 0 ? ` (${person.activeTaskCount} active)` : ''}
      </option>
    ))}
  </select>
</div>

{/* ✅ ADD NEW DUE DATE FIELD */}
<div className="mb-3">
  <label className="form-label">New Due Date <span className="text-danger">*</span></label>
  <input 
    type="date"
    className="form-control"
    value={extendedDueDate}
    onChange={(e) => setExtendedDueDate(e.target.value)}
    min={new Date().toISOString().split('T')[0]} // Can't select past dates
  />
  <small className="text-muted">Give personnel enough time to fix the reported issue</small>
</div>

<div className="alert alert-info">
  <small>The work order will be moved back to "In Progress" status with a new due date for revision.</small>
</div>

        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              setShowReassignModal(false);
              setAssignedPersonnel('');
            }}
          >
            Cancel
          </button>
      <button 
  type="button" 
  className="btn btn-warning"
  onClick={handleReassignForRevision}
  disabled={!assignedPersonnel || !extendedDueDate || loading}
>
  {loading ? 'Reassigning...' : 'Reassign for Revision'}
</button>
        </div>
      </div>
    </div>
  </div>
)}

{/* Close as Resolved Modal */}
{showCloseResolvedModal && selectedOrder && (
  <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Close Work Order as Resolved - {selectedOrder.id}</h5>
          <button 
            type="button" 
            className="btn-close"
            onClick={() => {
              setShowCloseResolvedModal(false);
              setAdminResolution('');
            }}
          ></button>
        </div>
        <div className="modal-body">
          <div className="alert alert-warning">
            <strong>Requester's Complaint:</strong> {selectedOrder.disputedReason}
          </div>
          
          <div className="mb-3">
            <label className="form-label">Admin Resolution Notes (Optional)</label>
            <textarea 
              className="form-control"
              rows="4"
              placeholder="Explain why this work order is being closed as resolved despite the complaint..."
              value={adminResolution}
              onChange={(e) => setAdminResolution(e.target.value)}
            ></textarea>
          </div>
          
          <div className="alert alert-success">
            <small><strong>Note:</strong> This will mark the work order as "Completed" and close it. The requester will be notified of your decision.</small>
          </div>
        </div>
        <div className="modal-footer">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => {
              setShowCloseResolvedModal(false);
              setAdminResolution('');
            }}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="btn btn-success"
            onClick={handleCloseAsResolved}
            disabled={loading}
          >
            {loading ? 'Closing...' : 'Close as Resolved'}
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