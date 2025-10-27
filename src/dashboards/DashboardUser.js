// Import ko lahat ng kakailanganin kong components at services
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Form, Badge, Card, InputGroup, FormControl, Modal } from 'react-bootstrap';
import { WorkOrderService } from '../services/WorkOrderService';
import { AuthUtils } from '../utils/AuthUtils';
import { supabase } from '../supabaseClient';
import { User, Calendar, Building } from 'lucide-react';
// Ito ang mismong Dashboard component ng user
export default function DashboardUser() {
  // States para sa filters (status at priority)
  // Nilagay ko default na "To Review" para fresh work orders agad ang makikita ng user  
const [selectedStatus, setSelectedStatus] = useState('To Review');
const [selectedPriority, setSelectedPriority] = useState('All');
 // States para sa modals

const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
const [searchTerm, setSearchTerm] = useState(''); 
const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
const [showDetailsModal, setShowDetailsModal] = useState(false);
const [showPriorityModal, setShowPriorityModal] = useState(false);
// States for user info
const [userName, setUserName] = useState('User');
const [userRole, setUserRole] = useState('Standard User');
const [organizationName, setOrganizationName] = useState('Organization');
  // States para sa data at errors
const [historyData, setHistoryData] = useState([]);
const [statusCounts, setStatusCounts] = useState([]);
const [priorities, setPriorities] = useState([]);
const [loading, setLoading] = useState(true);
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState('');

 // Para sa background refresh indicator (nagche-check kung may bagong work orders)
const [backgroundRefreshing, setBackgroundRefreshing] = useState(false);

 // State ng form para sa bagong Work Order
const [formData, setFormData] = useState({
  title: '',
  category: '',
  priority: 'Low',
  location: '',
  asset: '',
  description: '',
  dateNeeded: ''
});
const [formErrors, setFormErrors] = useState({});

  // Function na ginagamit ko para i-handle ang pag-update ng form fields
  // Kapag may error, nililinis ko agad para di mag-stick
const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setFormErrors(prev => ({ ...prev, [field]: '' }));
};
 // Function para mag-assign ng icons depende sa status
const getStatusIcon = (status) => {
  switch (status) {
    case 'To Review': return 'bi bi-eye';
    case 'Pending': return 'bi bi-clock';
    case 'In Progress': return 'bi bi-gear';
    case 'Completed': return 'bi bi-check-circle';
    case 'Rejected': return 'bi bi-x-circle';
    case 'Failed': return 'bi bi-exclamation-triangle';
    case 'Cancelled': return 'bi bi-dash-circle';
    default: return 'bi bi-question-circle';
  }
};

// Fetch user info
useEffect(() => {
  const fetchUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('full_name, organization_id, job_position')
        .eq('auth_uid', user.id)
        .single();

      if (userData) {
        setUserName(userData.full_name);
        setUserRole(userData.job_position || 'Standard User');
        
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
      console.error('Error fetching user data:', error);
    }
  };

  fetchUserData();
}, []);

// Initial load ng data (priorities, status counts, work orders)
useEffect(() => {
  loadInitialData();
}, []);

 //  Every time magbago yung filters, nire-reload ko yung work orders
useEffect(() => {
  if (!loading) {
    loadWorkOrders();
  }
}, [selectedStatus, selectedPriority, searchTerm]);

// Real-time updates for "To Review" status only
useEffect(() => {
  if (selectedStatus !== 'To Review') return;

  // Subscribe to work_orders changes
  const channel = supabase
    .channel('work-orders-updates')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'work_orders'
      },
      async (payload) => {
        console.log('Work order change detected:', payload);
        // Refresh data when changes occur
        await loadStatusCounts();
        await loadWorkOrders();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [selectedStatus]);

 //  Ito ang medyo complex: Polling mechanism
  // Gusto kong mag-refresh ng data automatically kada ilang seconds
  // Depende kung anong tab ang tinitingnan (faster if "To Review" or "Pending")
useEffect(() => {
  // Only refresh when user switches to "To Review" status
  // This catches new work orders without constant polling
  if (selectedStatus === 'To Review' && !loading) {
    loadWorkOrders();
  }
}, [selectedStatus]);

  //Initial load function
const loadInitialData = async () => {
  setLoading(true);
  try {
    // Load priorities
    const priorityResult = await WorkOrderService.getPriorityLevels();
    if (priorityResult.success) {
      setPriorities(priorityResult.data);
    }

    // Load status counts
    await loadStatusCounts();

    // Load work orders
    await loadWorkOrders();

  } catch (error) {
    console.error('Failed to load initial data:', error);
    setError('Failed to load data. Please refresh the page.');
  } finally {
    setLoading(false);
  }
};

// Load status counts (para sa tabs)
const loadStatusCounts = async () => {
  const result = await WorkOrderService.getStatusCounts();
  if (result.success) {
    setStatusCounts(result.data);
  }
};

  // Load work orders
  // Medyo mahaba kasi kailangan ko i-transform yung data para madali siyang gamitin
  // Naglagay din ako ng overdue logic dito (kung lumampas na ang due date pero "Pending" o "In Progress" pa rin)
const loadWorkOrders = async () => {
  const filters = {
    status: selectedStatus,
    priority: selectedPriority,
    search: searchTerm
  };

  const result = await WorkOrderService.getUserWorkOrders(filters);
  if (result.success) {

  const transformedData = result.data.map(wo => {
  const dueDate = new Date(wo.due_date);
  const currentDate = new Date();
  // Set time to start of day for accurate comparison
  currentDate.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  const statusName = wo.statuses?.status_name || 'To Review';
  const isOverdue = (statusName === 'Pending' || statusName === 'In Progress') && 
                   dueDate < currentDate;

return {
    work_order_id: wo.work_order_id,
    title: wo.title,
    category: wo.category,
    priority: wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'Low',
    suggestedPriority: wo.priority_levels?.priority_name || 'Low',
    adminUpdatedPriority: wo.admin_priority_levels?.priority_name || null,
    location: wo.location || '',
    asset: wo.asset_text || '-',
    dateNeeded: wo.due_date ? wo.due_date.split('T')[0] : '',
    description: wo.description,
    status: statusName,
    color: wo.statuses?.color_code || '#F0D400',
    priorityColor: wo.admin_priority_levels?.color_code || wo.priority_levels?.color_code || '#00C417',
    timestamp: wo.date_requested ? wo.date_requested.split('T')[0] : '',
    reason: wo.rejection_reason || '-',
    failureReason: wo.failure_reason,
    isOverdue: isOverdue,
    extensionCount: wo.extension_count || 0,
    lastExtensionReason: wo.last_extension_reason,
    extensionHistory: wo.work_order_extensions || []
    
};
});
    
    setHistoryData(transformedData);
  } else {
    setError(result.error || 'Failed to load work orders');
  }
};

const filteredHistory = historyData.filter(item => {
const statusMatch = item.status === selectedStatus;
const priorityMatch = selectedPriority === 'All' || item.priority === selectedPriority;
const searchMatch = searchTerm === '' || 
  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.location.toLowerCase().includes(searchTerm.toLowerCase());
  return statusMatch && priorityMatch && searchMatch;
});

const handleAddWorkOrder = async () => {
  const errors = {};
  if (!formData.title.trim()) errors.title = 'Title is required';
  if (!formData.category) errors.category = 'Category is required';
  if (!formData.location.trim()) errors.location = 'Location is required';
  if (!formData.dateNeeded) errors.dateNeeded = 'Date is required';

  if (Object.keys(errors).length > 0) {
    setFormErrors(errors);
    return;
  }

  setSubmitting(true);
  
  try {
    const result = await WorkOrderService.submitWorkOrder(formData);
    
    if (result.success) {
      setShowWorkOrderModal(false);
      setFormData({
        title: '',
        category: '',
        priority: 'Low',
        location: '',
        asset: '',
        description: '',
        dateNeeded: ''
      });
      setFormErrors({});
      
      // Reload data
      await loadStatusCounts();
      await loadWorkOrders();
      
      // Show success message
      setError('');
    } else {
      setError(result.error || 'Failed to submit work order');
    }
  } catch (error) {
    setError('An unexpected error occurred. Please try again.');
  } finally {
    setSubmitting(false);
  }
};

const handleCancelRequest = async (item) => {
  if (window.confirm('Are you sure you want to cancel this work order?')) {
    try {
      const result = await WorkOrderService.cancelWorkOrder(item.work_order_id);
      
      if (result.success) {
        // Reload data
        await loadStatusCounts();
        await loadWorkOrders();
      } else {
        alert('Failed to cancel work order: ' + result.error);
      }
    } catch (error) {
      alert('An error occurred while canceling the work order');
    }
  }
};

const handleCancelModal = () => {
  setShowWorkOrderModal(false);
  setFormData({
  title: '',
  category: '',
  priority: '',
  location: '',
  asset: '',
  description: '',
  dateNeeded: ''
            });
  setFormErrors({});
                };  

if (loading) {
  return (
    <Container fluid className="d-flex justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
      <div className="text-center">
        <div className="spinner-border" role="status" style={{ color: '#284CFF' }}>
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="mt-3">Loading your work orders...</p>
      </div>
    </Container>
  );
}

return ( 
  <Container fluid style={{ backgroundColor: '#FFFFFFFF', minHeight: '100vh', padding: 0 }}>  
  <Row>
                                                             
{/* Main Content */}

<Col
    md={10}
    className="p-4"  // ✅ SIMPLE LANG
    style={{
     backgroundColor: '#FFFFFF',
     minHeight: '100vh',
     paddingLeft: '15px',
     paddingRight: '15px',
     marginLeft: 'auto',
     marginRight: 'auto',
     flex: 1,
    }}
>    
{/* Welcome Section */}
<Row className="w-100">
  <Col md={12}>
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
          <User size={28} style={{ color: '#0d6efd' }} />
          <h1 style={{ margin: 0, fontWeight: '700', fontSize: '28px', color: '#1a1a1a' }}>
            Welcome back, {userName}!
          </h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Calendar size={18} style={{ color: '#6c757d' }} />
          <span style={{ color: '#6c757d', fontSize: '14px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </span>
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
          {userRole}
        </span>
        <span style={{ color: '#6c757d', fontSize: '15px' }}>•</span>
        <span style={{ color: '#495057', fontSize: '15px', fontWeight: '500' }}>{organizationName}</span>
      </div>
    </div>
  </Col>
</Row>
{/* Status Cards */}
 <Row className="w-100">
  {/* Error Alert */}
{error && (
  <div className="alert alert-danger alert-dismissible fade show mb-3" role="alert">
    {error}
    <button type="button" className="btn-close" onClick={() => setError('')} aria-label="Close"></button>
  </div>
)}
{/* Status Tabs */}
<div className="mb-4" style={{ 
  display: 'flex', 
  backgroundColor: '#f8f9fa', 
  borderRadius: '50px', 
  padding: '8px',
  gap: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}}>


{statusCounts.map((status) => (
  <div
    key={status.label}
   style={{
flex: 1,
padding: '12px 16px',
textAlign: 'center',
cursor: 'pointer',
borderRadius: '25px',
transition: 'all 0.3s ease',
backgroundColor: selectedStatus === status.label ? '#284CFF' : '#ffffff',
color: selectedStatus === status.label ? 'white' : '#495057',
fontSize: '14px',
fontWeight: selectedStatus === status.label ? '700' : '500',
display: 'flex',
alignItems: 'center',
justifyContent: 'center',
gap: '8px',
border: selectedStatus === status.label ? '2px solid #284CFF' : '0.2px solid #ECEBF0',
boxShadow: selectedStatus === status.label ? '0 4px 12px rgba(40, 76, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
}}
    onClick={() => setSelectedStatus(status.label)}
  >
  <i 
className={status.icon}
style={{ 
fontSize: '16px',
color: selectedStatus === status.label ? 'white' : '#495057'
}}
/>
    <span>{status.label}</span>
    <span style={{
      backgroundColor: selectedStatus === status.label ? 'rgba(255,255,255,0.2)' : '#e9ecef',
      color: selectedStatus === status.label ? 'white' : '#666',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    }}>
      {status.count}
    </span>
  </div>
))}
</div>
               
{/* Search and Filter Section */}
<div className="d-flex align-items-center mb-3" style={{ gap: '15px', width: '100%' }}>
  
  <div style={{ flex: '0 1 400px' }}>
    <Form.Control
      type="text"
      placeholder="Search assets by name, ID, or assignee..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      style={{
        borderRadius: '8px',
        border: '1px solid #E6DEE0FF',
        padding: '12px 16px',
        fontSize: '14px',
        backgroundColor: '#ffffff'
      }}
    />
  </div>
  
  {/* Priority Filter - compact */}
<Form.Select 
  value={selectedPriority}
  onChange={(e) => setSelectedPriority(e.target.value)}
  style={{ 
    width: '160px',
    borderRadius: '8px',
    border: '1px solid #dee2e6',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    padding: '12px 16px'
  }}
>
    <option value="All">All Priority</option>
    {priorities.map(priority => (
      <option key={priority.priority_id} value={priority.priority_name}>
        {priority.priority_name}
      </option>
    ))}
  </Form.Select>

  {/* Priority Level Link - compact */}
  <div style={{ width: '120px' }}>
  <span
    style={{
      color: '#284CFF',
      textDecoration: 'underline',
      cursor: 'pointer',
      fontWeight: '600',
      whiteSpace: 'nowrap',
      fontSize: '14px'
    }}
    onClick={() => setShowPriorityModal(true)}
  >
  Priority Level
  </span>
</div>

</div>

{/* History Section */}
<Card className="shadow-sm">
  <Card.Body>
<div className="mb-3 d-flex justify-content-between align-items-center">
  <h5 style={{color: '#284386' }}>History</h5>
  
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    {/* Manual Refresh Button */}
    <button
      onClick={async () => {
        setBackgroundRefreshing(true);
        await loadStatusCounts();
        await loadWorkOrders();
        setBackgroundRefreshing(false);
      }}
      disabled={backgroundRefreshing}
      style={{
        background: backgroundRefreshing ? '#6c757d' : '#284CFF',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        padding: '6px 12px',
        fontSize: '13px',
        cursor: backgroundRefreshing ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => {
        if (!backgroundRefreshing) {
          e.currentTarget.style.background = '#1a3acc';
        }
      }}
      onMouseLeave={(e) => {
        if (!backgroundRefreshing) {
          e.currentTarget.style.background = '#284CFF';
        }
      }}
    >
      {backgroundRefreshing ? (
        <>
          <div className="spinner-border spinner-border-sm" style={{ width: '12px', height: '12px' }}></div>
          <span>Refreshing...</span>
        </>
      ) : (
        <>
          <i className="bi bi-arrow-clockwise"></i>
          <span>Refresh</span>
        </>
      )}
    </button>
    
    {/* Last updated timestamp */}
    {!backgroundRefreshing && (
      <small style={{ color: '#6c757d' }}>
        Updated: {new Date().toLocaleTimeString()}
      </small>
    )}
  </div>
</div>
                    
                <table className="table table-hover align-middle mb-0 ">
                  <thead style={{ backgroundColor: '#284C9A', color: 'white' }}>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Timestamp</th>
                    <th>{selectedStatus === 'To Review' ? 'Action' : 'Reason'}</th>
                  </tr>
                  </thead>

                <tbody>
                {filteredHistory.map((item, index) => (
<tr
  key={item.work_order_id || index}
   onClick={() => {
    setSelectedWorkOrder(item);
    setShowDetailsModal(true);
    }}
  style={{ 
    cursor: 'pointer',
    backgroundColor: item.isOverdue ? '#fff5f5' : 'inherit',
    border: item.isOverdue ? '2px solid rgba(220, 53, 69, 0.2)' : 'inherit'
  }}
>

<td>{item.title}</td>
<td>
  <Badge style={{ backgroundColor: item.color }}>
    {item.status}
  </Badge>
</td>


<td>
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
    {/* Priority Badge - Main element */}
    <Badge
      bg=""
      style={{
        backgroundColor: item.priorityColor,
        color: 'white',
        padding: '4px 10px',
        fontSize: '0.85rem',
        borderRadius: '8px'
      }}
    >
      {item.priority}
    </Badge>
    
    {/* Compact Indicators Row - All in one line */}
    {(item.adminUpdatedPriority || item.extensionCount > 0 || item.isOverdue) && (
      <div style={{ 
        display: 'flex', 
        gap: '6px', 
        fontSize: '10px',
        flexWrap: 'wrap',
        alignItems: 'center'
      }}>
        {item.adminUpdatedPriority && (
          <span style={{ 
            color: '#0066cc', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <i className="bi bi-shield-check"></i> Admin
          </span>
        )}
        
        {item.extensionCount > 0 && (
          <span style={{ 
            color: '#fd7e14', 
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <i className="bi bi-calendar-plus"></i> {item.extensionCount}x
          </span>
        )}
        
        {item.isOverdue && (
          <span style={{ 
            color: '#dc3545', 
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}>
            <i className="bi bi-exclamation-triangle-fill"></i> OVERDUE
          </span>
        )}
      </div>
    )}
  </div>
</td>

<td>{item.timestamp}</td>
<td>
  {item.status === 'To Review' ? (
    <Button
      variant="danger"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleCancelRequest(item);
      }}
    >
      Cancel
    </Button>
  ) : (
    item.status === 'Failed' && item.failureReason 
      ? item.failureReason 
      : item.reason
  )}
</td>
      </tr>
      ))}

                  {filteredHistory.length === 0 && (
                    <tr>
                      <td colSpan="5" className="text-center text-muted">No records found.</td>
                    </tr>
                    )}
                    </tbody>
                      </table>
                        </Card.Body>
                          </Card>
                            </Row>

                    {/* Floating Action Button */}
                      <Button
  style={{
      backgroundColor: '#284CFF',
      border: 'none',
      borderRadius: '50%',
      width: '60px',
      height: '60px',
      position: 'fixed',
      bottom: '30px',
      right: '30px',
      fontSize: '1.5rem',
      boxShadow: '0px 4px 10px rgba(0,0,0,0.3)'
        }}
      onClick={() => setShowWorkOrderModal(true)}
      disabled={submitting}
>
   {submitting ? (
     <div className="spinner-border spinner-border-sm" role="status">
       <span className="visually-hidden">Loading...</span>
     </div>
   ) : (
     '+'
   )}
</Button>


            {/* Work Order Request Modal */}
                
                      <Modal
                        show={showWorkOrderModal}
                        onHide={() => setShowWorkOrderModal(false)}
                        size="lg"
                        centered
                        backdrop="static"
                      >
                        {/* Header */}

                      <Modal.Header 
                        closeButton 
                        style={{ 
                         backgroundColor: '#f8f9fa', 
                          borderBottom: '2px solid #e9ecef',
                          padding: '20px 30px'
                          }}
                        >
                      <Modal.Title style={{ 
                        color: '#2c3e50', 
                        fontSize: '1.5rem',
                        fontWeight: '600'
                          }}>
                            Create Work Order Request
                      </Modal.Title>
                      </Modal.Header>

                      {/* Body */}
                      <Modal.Body style={{ padding: '30px', backgroundColor: '#ffffff' }}>
                        <Form>
                          {/* Basic Information Card */}
                          <Card className="mb-4" style={{ 
                            border: '1px solid #e9ecef', 
                            borderRadius: '12px', 
                            boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
                          }}>
                        <Card.Header style={{ 
                          backgroundColor: '#f8f9fa', 
                          borderBottom: '1px solid #e9ecef',
                          padding: '15px 20px',
                          borderRadius: '12px 12px 0 0'
                          }}>
                            <h6 className="mb-0" style={{ color: '#495057', fontWeight: '600' }}>
                              Basic Information
                            </h6>
                        </Card.Header>

                        <Card.Body style={{ padding: '20px' }}>
                          <Row>
                            <Col md={12}>
                              <Form.Group className="mb-3">
                                <Form.Label style={{ 
                                  fontWeight: '600', 
                                  color: '#495057', 
                                  marginBottom: '8px' 
                                }}
                                >
                                Request Title <span style={{ color: '#dc3545' }}>*</span>
                              </Form.Label>

                            <Form.Control
  type="text"
  placeholder="Enter a brief title for your request"
  value={formData.title}
  onChange={e => handleChange('title', e.target.value)}
  isInvalid={!!formErrors.title}
  disabled={submitting}
   style={{
      borderRadius: '8px',
      border: '2px solid #e9ecef',
      padding: '12px 16px',
      fontSize: '14px'
    }}
  />

                      <Form.Control.Feedback type="invalid">
                        {formErrors.title}
                     </Form.Control.Feedback>
                    </Form.Group>
                 </Col>
              </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '8px' 
                }}>
                  Category <span style={{ color: '#dc3545' }}>*</span>
                </Form.Label>
                <Form.Select
                  value={formData.category}
                  onChange={e => handleChange('category', e.target.value)}
                  isInvalid={!!formErrors.category}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Category</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Plumbing">Plumbing</option>
                  <option value="HVAC">HVAC</option>
                  <option value="Carpentry">Carpentry/Structural</option>
                  <option value="Masonry">Masonry / Civil Works</option>
                  <option value="General Services">General Services / Miscellaneous</option>
                  <option value="Groundskeeping">Groundskeeping & Landscaping</option>
                  <option value="Painting">Painting / Finishing</option>

                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  {formErrors.category}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '8px' 
                }}>
                  Suggested Priority Level
                </Form.Label>
               <Form.Select
  value={formData.priority}
  onChange={e => handleChange('priority', e.target.value)}
  disabled={submitting}
  style={{
    borderRadius: '8px',
    border: '2px solid #e9ecef',
    padding: '12px 16px',
    fontSize: '14px'
  }}
>
  {priorities.map(priority => (
    <option key={priority.priority_id} value={priority.priority_name}>
      {priority.priority_name}
    </option>
  ))}
</Form.Select>

              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Location & Asset Information Card */}
      <Card className="mb-4" style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
      }}>
        <Card.Header style={{ 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #e9ecef',
          padding: '15px 20px',
          borderRadius: '12px 12px 0 0'
        }}>
          <h6 className="mb-0" style={{ color: '#495057', fontWeight: '600' }}>
            Location Details
          </h6>
        </Card.Header>
        <Card.Body style={{ padding: '20px' }}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '8px' 
                }}>
                  Location <span style={{ color: '#dc3545' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Building, floor, room number"
                  value={formData.location}
                  onChange={e => handleChange('location', e.target.value)}
                  isInvalid={!!formErrors.location}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                />
                <Form.Control.Feedback type="invalid">
                  {formErrors.location}
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
            
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '8px' 
                }}>
                  Specific Asset/Equipment
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Equipment name or ID (optional)"
                  value={formData.asset}
                  onChange={e => handleChange('asset', e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                />
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Description & Details Card */}
      <Card className="mb-4" style={{ 
        border: '1px solid #e9ecef', 
        borderRadius: '12px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)' 
      }}>
        <Card.Header style={{ 
          backgroundColor: '#f8f9fa', 
          borderBottom: '1px solid #e9ecef',
          padding: '15px 20px',
          borderRadius: '12px 12px 0 0'
        }}>
          <h6 className="mb-0" style={{ color: '#495057', fontWeight: '600' }}>
            Additional Details
          </h6>
        </Card.Header>
        <Card.Body style={{ padding: '20px' }}>
          <Form.Group className="mb-3">
            <Form.Label style={{ 
              fontWeight: '600', 
              color: '#495057', 
              marginBottom: '8px' 
            }}>
              Detailed Description
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder="Describe the issue or request in detail..."
              value={formData.description}
              onChange={e => handleChange('description', e.target.value)}
              style={{
                borderRadius: '8px',
                border: '2px solid #e9ecef',
                padding: '12px 16px',
                fontSize: '14px',
                resize: 'vertical'
              }}
            />
          </Form.Group>

          <Row>
            <Col md={12}>
              <Form.Group className="mb-3">
                <Form.Label style={{ 
                  fontWeight: '600', 
                  color: '#495057', 
                  marginBottom: '8px' 
                }}>
                  Date Needed By <span style={{ color: '#dc3545' }}>*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.dateNeeded}
                  onChange={e => handleChange('dateNeeded', e.target.value)}
                  isInvalid={!!formErrors.dateNeeded}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                />
              
              <Form.Control.Feedback type="invalid">
                {formErrors.dateNeeded}
              </Form.Control.Feedback>
              </Form.Group>
              </Col>
              </Row>
              </Card.Body>
              </Card>
              </Form>
              </Modal.Body>
                              
                                                                   {/* Footer */}
                <Modal.Footer style={{ 
                    backgroundColor: '#f8f9fa', 
                    borderTop: '2px solid #e9ecef',
                    padding: '20px 30px',
                    borderRadius: '0 0 12px 12px'
                    }}>
                                
               <Button 
    variant="outline-secondary" 
    onClick={handleCancelModal}
    disabled={submitting}
      style={{
      borderRadius: '8px',
      padding: '10px 24px',
      fontWeight: '600',
      border: '2px solid #6c757d'
            }}
>
Cancel
</Button>

                <Button 
                onClick={handleAddWorkOrder}
                disabled={submitting}
                style={{
                  backgroundColor: '#284CFF',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '10px 24px',
                  fontWeight: '600',
                  boxShadow: '0 2px 8px rgba(40, 76, 255, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                        }}
              >
              {submitting && <div className="spinner-border spinner-border-sm" role="status"></div>}
              {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>


              </Modal.Footer>
             </Modal>
            </Col>
          </Row>

              <Modal
               show={showPriorityModal}
               onHide={() => setShowPriorityModal(false)}
               centered
              >

              <Modal.Header closeButton>
                <Modal.Title>Priority Levels</Modal.Title>
              </Modal.Header>

            <Modal.Body>
  {priorities.map(priority => (
    <div key={priority.priority_id} className="mb-3">
      <Badge 
        bg="" 
        style={{ 
          backgroundColor: priority.color_code, 
          color: 'white', 
          padding: '8px 12px',
          fontSize: '14px',
          marginRight: '10px'
        }}
      >
        {priority.priority_name}
      </Badge>
      <p className="mb-2 d-inline">
        {priority.priority_name === 'Low' && 'Tasks that can be addressed when time permits.'}
        {priority.priority_name === 'Medium' && 'Tasks that are important but not immediately critical.'}
        {priority.priority_name === 'High' && 'Urgent tasks requiring immediate action.'}
      </p>
    </div>
  ))}
</Modal.Body>

                  <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowPriorityModal(false)}>
                      Close
                    </Button>
                  </Modal.Footer>
                  </Modal>

                  <Modal
                    show={showDetailsModal}
                    onHide={() => setShowDetailsModal(false)}
                    centered
                  >
                  
                  <Modal.Header closeButton>
                    <Modal.Title>Work Order Details</Modal.Title>
                  </Modal.Header>

                  <Modal.Body>
                   {selectedWorkOrder ? (
                    <div style={{ padding: '20px' }}>


                                                {/* OVERDUE WARNING  */}
    {selectedWorkOrder.isOverdue && (
      <div style={{ 
        marginBottom: '15px',
        padding: '12px',
        backgroundColor: '#fff5f5',
        border: '2px solid #dc3545',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}>
        <i className="bi bi-exclamation-triangle-fill" style={{ color: '#dc3545', fontSize: '16px' }}></i>
        <div>
          <strong style={{ color: '#dc3545' }}>This request is overdue!</strong><br />
          <small style={{ color: '#666' }}>Due date was: {selectedWorkOrder.dateNeeded}</small>
        </div>
      </div>
    )}

     {/* ADMIN PRIORITY UPDATE BANNER*/}
  {selectedWorkOrder.adminUpdatedPriority && (
    <div style={{ 
      marginBottom: '15px',
      padding: '12px',
      backgroundColor: '#e7f3ff',
      border: '2px solid #0066cc',
      borderRadius: '8px',
      display: 'flex',
      alignItems: 'center',
      gap: '8px'
    }}>
      <i className="bi bi-shield-check" style={{ color: '#0066cc', fontSize: '16px' }}></i>
      <div>
        <strong style={{ color: '#0066cc' }}>Priority updated by admin</strong><br />
        <small style={{ color: '#666' }}>
          Changed from <strong>{selectedWorkOrder.suggestedPriority}</strong> to <strong>{selectedWorkOrder.adminUpdatedPriority}</strong>
        </small>
      </div>
    </div>
  )}
                    <div style={{ marginBottom: '15px' }}>
                      <p><strong>Title:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.title}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Category:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.category || 'â€”'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Location:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.location || 'â€”'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Asset:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.asset || 'â€”'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Priority:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.priority}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Date Needed:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.dateNeeded || 'â€”'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Status:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.status}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Description:</strong></p>
                      <span
                        style={{
                          display: 'block',
                          maxWidth: '100%',
                          wordBreak: 'break-word',
                          whiteSpace: 'pre-wrap',
                          backgroundColor: '#f9f9f9',
                          padding: '10px',
                          borderRadius: '5px',
                          fontSize: '14px',
                          color: '#333',
                          boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)'
                        }}
                      >
                    
                       {selectedWorkOrder.description || 'â€”'}
                      </span>
                     </div>
                      {/* Extension History Display - ADD THIS */}
{selectedWorkOrder.extensionHistory?.length > 0 && (
  <div style={{ marginBottom: '15px' }}>
    <p><strong>Extension History:</strong></p>
    <div style={{
      backgroundColor: '#fff3cd',
      border: '1px solid #ffeaa7',
      borderRadius: '8px',
      padding: '12px',
      marginTop: '8px'
    }}>
      <div style={{ marginBottom: '8px' }}>
        <strong>Total Extensions: {selectedWorkOrder.extensionCount}</strong>
        {selectedWorkOrder.originalDueDate && (
          <span style={{ fontSize: '12px', color: '#666', marginLeft: '8px' }}>
            (Original due: {selectedWorkOrder.originalDueDate.split('T')[0]})
          </span>
        )}
      </div>
      {selectedWorkOrder.extensionHistory.map((ext, i) => (
        <div key={i} style={{
          backgroundColor: 'white',
          border: '1px solid #e9ecef',
          borderRadius: '4px',
          padding: '8px',
          marginBottom: '8px',
          fontSize: '13px'
        }}>
          <div><strong>From:</strong> {ext.old_due_date.split('T')[0]} â†’ <strong>To:</strong> {ext.new_due_date.split('T')[0]}</div>
          <div><strong>Reason:</strong> {ext.extension_reason}</div>
        </div>
      ))}
    </div>
  </div>
)}
                    </div>
                  ) : (
                    <p>No details available.</p>
                  )}
                </Modal.Body>

              <Modal.Footer style={{ borderTop: '1px solid #e0e0e0', paddingTop: '10px' }}>
               <Button
                 variant="secondary"
                 onClick={() => setShowDetailsModal(false)}
                 style={{
                  backgroundColor: '#6C757D',
                  color: '#fff',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '5px',
                  fontWeight: '500',
                    }}
               >
                 Close
               </Button>
               </Modal.Footer>
            </Modal>
          </Container>
);
}