import { useState } from 'react';
import { Container, Row, Col, Button, Form, Badge, Card, InputGroup, FormControl, Modal } from 'react-bootstrap';


export default function DashboardUser() {
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedPriority, setSelectedPriority] = useState('All');
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const getStatusCounts = () => {
  const defaultStatuses = ['To Review', 'Pending', 'In Progress', 'Completed', 'Rejected', 'Failed', 'Cancelled'];

return defaultStatuses.map(status => ({
  label: status,
  color: '#ffffff',
  icon: getStatusIcon(status),
  count: historyData.filter(item => item.status === status).length
  }));
  };

const [searchTerm, setSearchTerm] = useState(''); 

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

const [selectedWorkOrder, setSelectedWorkOrder] = useState(null);
const [showDetailsModal, setShowDetailsModal] = useState(false);

const [formData, setFormData] = useState({
  title: '',
  category: '',
  priority: '',
  location: '',
  asset: '',
  description: '',
  attachment: null,
  dateNeeded: ''
  });

const [formErrors, setFormErrors] = useState({});
const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
  setFormErrors(prev => ({ ...prev, [field]: '' }));
  };

const [showPriorityModal, setShowPriorityModal] = useState(false);
const priorities = [
  { label: 'Low', color: '#00C417' },
  { label: 'Medium', color: '#FF7308' },
  { label: 'High', color: '#FF0000' }
  ];

const [historyData, setHistoryData] = useState([]); // start empty

const filteredHistory = historyData.filter(item => {
const statusMatch = selectedStatus === 'All' || item.status === selectedStatus;
const priorityMatch = selectedPriority === 'All' || item.priority === selectedPriority;
const searchMatch = searchTerm === '' || 
  item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
  item.location.toLowerCase().includes(searchTerm.toLowerCase());
  return statusMatch && priorityMatch && searchMatch;
});

const handleAddWorkOrder = () => {
const errors = {};
  if (!formData.title.trim()) errors.title = 'Title is required';
  if (!formData.category) errors.category = 'Category is required';
  if (!formData.location.trim()) errors.location = 'Location is required';
  if (!formData.dateNeeded) errors.dateNeeded = 'Date is required';

  if (Object.keys(errors).length > 0) {
   setFormErrors(errors);
   return;
    }

const selectedPriority = formData.priority || 'Low';
const matchedPriority = priorities.find(p => p.label === selectedPriority);
const priorityColor = matchedPriority ? matchedPriority.color : '#00C417';

const newItem = {
        title: formData.title,
        category: formData.category,
        priority: selectedPriority,
        location: formData.location,
        asset: formData.asset,
        dateNeeded: formData.dateNeeded,
        description: formData.description, // ✅ Include detailed description
        attachment: formData.attachment,   // ✅ Include attachment (if needed)
        status: 'To Review',
        reason: '—',
        color: '#F0D400',
        priorityColor: priorityColor,
        timestamp: new Date().toISOString().split('T')[0]
    };

setHistoryData(prev => [...prev, newItem]);
setShowWorkOrderModal(false);
setFormData({
       title: '',
       category: '',
       priority: '',
       location: '',
       asset: '',
       description: '',
       attachment: null,
      dateNeeded: ''
          });
setFormErrors({});
          };

const handleCancelRequest = (indexInFiltered) => {
const itemToCancel = filteredHistory[indexInFiltered];
const realIndex = historyData.findIndex(item =>
  item.description === itemToCancel.description &&
  item.timestamp === itemToCancel.timestamp &&
  item.status === itemToCancel.status
         );

if (realIndex !== -1) {
  setHistoryData(prevData => {
  const updatedData = [...prevData];
  updatedData[realIndex] = {
  ...updatedData[realIndex],
  status: 'Cancelled',
  color: '#B0B0B0',
  reason: 'Cancelled by user'
  };
  
  return updatedData;
  });
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
  attachment: null,
  dateNeeded: ''
            });
  setFormErrors({});
                };  

return (    
  <Container fluid style={{ backgroundColor: '#FFFFFFFF', minHeight: '100vh', padding: 0 }}>  
  <Row>
                                                             
{/* Main Content */}

  <Col
    md={10}
    className="p-4 d-flex justify-content-center align-items-start"
    style={{
     backgroundColor: '#FFFFFF',
     minHeight: '100vh',
     paddingLeft: '15px', // Padding for better space utilization
     paddingRight: '15px', // Padding to avoid content touching the edges
     marginLeft: 'auto', // Centering the content
     marginRight: 'auto', // Centering the content
     flex: 1, // This ensures that the main content takes full available width
            }}
            >       

{/* Status Cards */}

 <Row className="w-100">
{/* Status Tabs */}
<div className="mb-4" style={{ 
  display: 'flex', 
  backgroundColor: '#f8f9fa', 
  borderRadius: '50px', 
  padding: '8px',
  gap: '4px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
}}>
  {/* Add "All" tab first */}
  <div
    style={{
  flex: 1,
  padding: '12px 16px',
  textAlign: 'center',
  cursor: 'pointer',
  borderRadius: '25px',
  transition: 'all 0.3s ease',
  backgroundColor: selectedStatus === 'All' ? '#284CFF' : '#ffffff',
  color: selectedStatus === 'All' ? 'white' : '#495057',
  fontSize: '14px',
  fontWeight: selectedStatus === 'All' ? '700' : '500',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  border: selectedStatus === 'All' ? '2px solid #284CFF' : '0.2px solid #ECEBF0',
  boxShadow: selectedStatus === 'All' ? '0 4px 12px rgba(40, 76, 255, 0.2)' : '0 2px 4px rgba(0,0,0,0.05)'
}}
    onClick={() => setSelectedStatus('All')}
  >
    <span>All</span>
    <span style={{
      backgroundColor: selectedStatus === 'All' ? 'rgba(255,255,255,0.2)' : '#EFEAE9FF',
      color: selectedStatus === 'All' ? 'white' : '#666',
      padding: '2px 8px',
      borderRadius: '12px',
      fontSize: '12px',
      fontWeight: '600'
    }}>
      {historyData.length}
    </span>
  </div>

  {getStatusCounts().map((status) => (
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
    <option value="Low">Low</option>
    <option value="Medium">Medium</option>
    <option value="High">High</option>
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
    <div className="mb-3">
      <h5 style={{color: '#284386' }}>History</h5>
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
                    key={index}
                     onClick={() => {
                      setSelectedWorkOrder(item);
                      setShowDetailsModal(true);
                      }}
                    style={{ cursor: 'pointer' }}
                  >

                  <td>{item.title}</td>
                  <td>
                    <Badge style={{ backgroundColor: item.color }}>
                      {item.status}
                    </Badge>
                  </td>

                  <td>
                    <Badge
                     bg=""
                      style={{
                        backgroundColor: priorities.find(p => p.label === item.priority)?.color || '#00C417',
                        color: 'white',
                        padding: '4px 10px',
                        fontSize: '0.85rem',
                        borderRadius: '8px'
                      }}
                    >
                      {item.priority}
                    </Badge>
                   </td>

              <td>{item.timestamp}</td>
                <td>
                  {item.status === 'To Review' ? (
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={(e) => {
                      e.stopPropagation(); // ⛔ prevent opening the modal when cancel is clicked
                       handleCancelRequest(index);
                        }}
                    >
                      Cancel
                    </Button>
                      ) : (item.reason)}
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
                      >
                         +
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
                  Priority Level
                </Form.Label>
                <Form.Select
                  value={formData.priority}
                  onChange={e => handleChange('priority', e.target.value)}
                  style={{
                    borderRadius: '8px',
                    border: '2px solid #e9ecef',
                    padding: '12px 16px',
                    fontSize: '14px'
                  }}
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
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
          <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label style={{ 
              fontWeight: '600', 
              color: '#495057', 
              marginBottom: '8px' 
            }}>
              Attachments
            </Form.Label>
            <div style={{
              border: '2px dashed #dee2e6',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              transition: 'border-color 0.3s ease',
              position: 'relative'
            }}
            onMouseEnter={(e) => e.target.style.borderColor = '#284CFF'}
            onMouseLeave={(e) => e.target.style.borderColor = '#dee2e6'}
            >
            <div style={{ color: '#6c757d', fontSize: '14px' }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>📁</div>
               {formData.attachment ? (
                <div>
                  <div style={{ color: '#28a745', fontWeight: '600', marginBottom: '4px' }}>
                    ✅ {formData.attachment.length} file(s) selected
                    </div>
                    <div style={{ fontSize: '12px' }}>
                    {Array.from(formData.attachment).map(file => file.name).join(', ')}
                    </div>
                  </div>
                  ) : (
                  <div>
                   Click to upload or drag files here
                   <br />
                   <small>JPG, PNG, PDF up to 10MB</small>
                  </div>
                  )}
              </div>

              <Form.Control 
               type="file" 
               multiple 
               onChange={(e) => handleChange('attachment', e.target.files)}
               style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  opacity: 0,
                  width: '100%',
                  height: '100%',
                  cursor: 'pointer'
                }}
               />
            </div>

            {formData.attachment && formData.attachment.length > 0 && (
             <div style={{ marginTop: '10px' }}>
              <small style={{ color: '#6c757d', fontWeight: '600' }}>Selected Files:</small>
              <ul style={{ margin: '5px 0', paddingLeft: '20px', fontSize: '12px' }}>
                {Array.from(formData.attachment).map((file, index) => (
                 <li key={index} style={{ color: '#495057', marginBottom: '2px' }}>
                   {file.name} ({(file.size / 1024).toFixed(1)} KB)
                </li>
                  ))}
              </ul>
              </div>
               )}
          </Form.Group>
        </Col>


            <Col md={6}>
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
                   style={{
                    backgroundColor: '#284CFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 24px',
                    fontWeight: '600',
                    boxShadow: '0 2px 8px rgba(40, 76, 255, 0.3)'
                          }}
                >
                Submit Request
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
                <div className="mb-3">
                  <Badge bg="" style={{ backgroundColor: '#00C417', color: 'white', padding: '8px' }}>
                    Low
                  </Badge>
                    <p className="mb-2">Tasks that can be addressed when time permits.</p>
                </div>

                <div className="mb-3">
                 <Badge bg="" style={{ backgroundColor: '#FF7308', color: 'white', padding: '8px' }}>
                   Medium
                 </Badge>
                 <p className="mb-2">Tasks that are important but not immediately critical.</p>
                </div>
    
                <div className="mb-3">
                  <Badge bg="" style={{ backgroundColor: '#FF0000', color: 'white', padding: '8px' }}>
                    High
                  </Badge>
                  <p>Urgent tasks requiring immediate action.</p>
                  </div>
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
                    <div style={{ marginBottom: '15px' }}>
                      <p><strong>Title:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.title}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Category:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.category || '—'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Location:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.location || '—'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Asset:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.asset || '—'}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Priority:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.priority}</span></p>
                        </div>
                      <div style={{ marginBottom: '15px' }}>
                      <p><strong>Date Needed:</strong> <span style={{ fontWeight: '300' }}>{selectedWorkOrder.dateNeeded || '—'}</span></p>
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
                    
                       {selectedWorkOrder.description || '—'}
                      </span>
                     </div>
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