// src/components/WorkOrder.js
import { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function WorkOrder() {
  const [activeTab, setActiveTab] = useState('To Review');
  const [workOrders, setWorkOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [assignedPersonnel, setAssignedPersonnel] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [adminPriority, setAdminPriority] = useState('');
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [failureReason, setFailureReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [personnel, setPersonnel] = useState([]);
  const [categories, setCategories] = useState([]);

  // API Base URL - update this to match your backend
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

  // Fetch work orders from backend
  const fetchWorkOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/work-orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`, // Adjust based on your auth method
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setWorkOrders(data.workOrders || data || []);
    } catch (err) {
      console.error('Error fetching work orders:', err);
      setError('Failed to load work orders. Please try again.');
      setWorkOrders([]); // Fallback to empty array
    } finally {
      setLoading(false);
    }
  };

  // Fetch personnel list for assignment
  const fetchPersonnel = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/personnel`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPersonnel(data.personnel || data || []);
      }
    } catch (err) {
      console.error('Error fetching personnel:', err);
      // Fallback to empty array - component will still work
      setPersonnel([]);
    }
  };

  // Fetch categories for filter
  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || data || []);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      // Fallback to default categories
      setCategories(['Electrical', 'Plumbing', 'HVAC', 'Janitorial', 'IT Support', 'Security']);
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

  // API call to assign personnel
  const confirmAssignment = async () => {
    if (!assignedPersonnel) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/work-orders/${selectedOrder.id}/assign`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          assignedTo: assignedPersonnel,
          priority: adminPriority || selectedOrder.priority,
          adminUpdatedPriority: adminPriority || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign personnel');
      }

      const updatedOrder = await response.json();
      
      // Update local state
      const updatedOrders = workOrders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      );
      setWorkOrders(updatedOrders);

      // Reset modal states
      setShowAssignModal(false);
      setAssignedPersonnel('');
      setAdminPriority('');
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error assigning personnel:', err);
      setError('Failed to assign personnel. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // API call to reject work order
  const confirmRejection = async () => {
    if (!rejectReason.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/work-orders/${selectedOrder.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          rejectionReason: rejectReason,
          priority: adminPriority || selectedOrder.priority,
          adminUpdatedPriority: adminPriority || null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to reject work order');
      }

      const updatedOrder = await response.json();
      
      // Update local state
      const updatedOrders = workOrders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      );
      setWorkOrders(updatedOrders);

      // Reset modal states
      setShowRejectModal(false);
      setRejectReason('');
      setAdminPriority('');
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error rejecting work order:', err);
      setError('Failed to reject work order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // API call to mark as failed
  const confirmFailure = async () => {
    if (!failureReason.trim()) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/work-orders/${selectedOrder.id}/fail`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          failureReason: failureReason
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark work order as failed');
      }

      const updatedOrder = await response.json();
      
      // Update local state
      const updatedOrders = workOrders.map(order => 
        order.id === selectedOrder.id ? updatedOrder : order
      );
      setWorkOrders(updatedOrders);

      // Reset modal states
      setShowFailureModal(false);
      setFailureReason('');
      setSelectedOrder(null);
    } catch (err) {
      console.error('Error marking as failed:', err);
      setError('Failed to mark work order as failed. Please try again.');
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
    
    return <span className={priorityColors[priority]} style={{ fontSize: '0.85rem' }}>● {priority}</span>;
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

  return (
    <SidebarLayout role="admin">
      <div className="container-fluid p-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">Work Orders</h3>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger alert-dismissible fade show" role="alert">
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
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="input-group shadow-sm">
              <span className="input-group-text bg-primary text-white border-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-0 py-3"
                placeholder="Search work orders by ID, requester, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  fontSize: '1rem',
                  borderRadius: '0 0.5rem 0.5rem 0',
                  boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                  height: '38px'
                }}
              />
            </div>
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
          <div className="col-md-3">
            <select 
              className="form-select"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              <option value="all">All Priorities</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
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
              <table className="table table-striped table-hover mb-0">      
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
                  {filteredOrders.map(order => (
                    <tr key={order.id} style={{backgroundColor: '#B0D0E6'}}>
                      <td className="fw-bold text-dark" style={{ fontSize: '1rem', fontFamily: 'monospace' }}>
                        {order.id || '-'}
                      </td>
                      <td>{order.requester || '-'}</td>
                      <td><span className="text-muted fw-medium">{order.category || '-'}</span></td>
                      <td>{order.location || '-'}</td>
                      <td>{getStatusBadge(order.status)}</td>
                      <td>{getPriorityBadge(order.priority)}</td>
                      <td>{formatDate(order.requestDate)}</td>
                      
                      {activeTab !== 'To Review' && <td>{order.assignedTo || '-'}</td>}
                      <td>
                        <button className="btn btn-outline-primary btn-sm" onClick={() => handleViewOrder(order)}>
                          <i className="bi bi-eye me-1"></i> View
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

                  {/* Location and Date Needed By Row */}
                  <div className="row mb-3">
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Location:</label>
                      <p className="mb-0">{selectedOrder.location || '-'}</p>
                    </div>
                    <div className="col-6">
                      <label className="form-label fw-bold text-muted small">Date Needed By:</label>
                      <p className="mb-0">{formatDate(selectedOrder.dueDate)}</p>
                    </div>
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

                  {/* Mark as Failed - Show for In Progress status */}
                  {selectedOrder.status === 'In Progress' && (
                    <div className="mb-4">
                      <button 
                        className="btn btn-outline-danger w-100 fw-bold"
                        onClick={() => {
                          setShowModal(false);
                          setShowFailureModal(true);
                        }}
                        disabled={loading}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Mark as Failed
                      </button>
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
                    onClick={() => setShowAssignModal(false)}
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
                        <option key={person.id || person.name} value={person.name || person.id}>
                          {person.name || person.firstName + ' ' + person.lastName || person.id}
                        </option>
                      ))}
                    </select>
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

        {/* Failure Reason Modal */}
        {showFailureModal && selectedOrder && (
          <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Mark as Failed - {selectedOrder.id}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowFailureModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Reason for Failure</label>
                    <textarea 
                      className="form-control"
                      rows="4"
                      placeholder="Please provide a detailed reason why this work order failed..."
                      value={failureReason}
                      onChange={(e) => setFailureReason(e.target.value)}
                    ></textarea>
                  </div>
                  <div className="alert alert-warning">
                    <small>This work order will be moved to the Failed tab and the requester will be notified.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowFailureModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmFailure}
                    disabled={!failureReason.trim() || loading}
                  >
                    {loading ? 'Processing...' : 'Mark as Failed'}
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