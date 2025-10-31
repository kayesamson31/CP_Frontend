// src/dashboards/PersonnelNav/Assets.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { assetService } from '../../services/assetService';
import { logActivity } from '../../utils/ActivityLogger';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Modal,
  Alert,
  Badge,
  Card,
} from "react-bootstrap";

export default function Assets() {
  // State for assets - will be populated from backend
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [recordsPerPage] = useState(17);
  // Sample hardcoded data for visualization
  const sampleAssets = [
    {
      id: "AST-001",
      name: "Main Building HVAC System",
      category: "HVAC Equipment",
      location: "Main Building - Ground Floor",
      status: "Operational",
      lastMaintenance: "2024-08-15",
      task: "Regular cleaning and filter replacement",
      acquisitionDate: "2023-05-15", // Add this line
      nextMaintenance: "2024-09-15", // Add this line
      maintenanceHistory: [
        { date: "2024-08-15", task: "Filter replacement and system cleaning", Assigned: "Juan Dela Cruz"},
        { date: "2024-07-10", task: "Coolant level check and refill", Assigned: "Juan Dela Cruz" },
        { date: "2024-06-20", task: "Routine inspection", Assigned: "Juan Dela Cruz" }
      ],
     incidentHistory: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "Minor temperature fluctuation detected during peak hours",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Resolved"
  }
]
    },
    {
      id: "AST-002",
      name: "Security Camera System - Block A",
      category: "Safety Equipment",
      location: "Block A - All Floors",
      status: "Under Maintenance",
      lastMaintenance: "2024-08-18",
      acquisitionDate: "2023-05-15", // ADD THIS
  nextMaintenance: "2024-09-16", // ADD THIS
      task: "Camera lens cleaning and software update",
      maintenanceHistory: [
        { date: "2024-08-18", task: "Camera 3 lens replacement due to scratches", Assigned: "Juan Dela Cruz" },
        { date: "2024-07-25", task: "Software update and system calibration", Assigned: "Juan Dela Cruz" },
        { date: "2024-07-01", task: "Monthly inspection and cleaning", Assigned: "Juan Dela Cruz" }
      ],
    incidentHistory: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "Minor temperature fluctuation detected during peak hours",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Resolved"
  }
]
    },
    {
      id: "AST-003",
      name: "Garden Sprinkler System",
      category: "Groundskeeping Tools",
      location: "Front Garden & Courtyard",
      status: "Operational",
      lastMaintenance: "2024-08-10",
      acquisitionDate: "2023-05-15", // ADD THIS
      nextMaintenance: "2024-09-15", // ADD THIS
      task: "Nozzle cleaning and water pressure check",
      maintenanceHistory: [
        { date: "2024-08-10", task: "Nozzle cleaning and water pressure adjustment", Assigned: "Juan Dela Cruz" },
        { date: "2024-07-15",  task: "Timer system calibration", Assigned: "Juan Dela Cruz" },
        { date: "2024-06-30",  task: "Seasonal maintenance check", Assigned: "Juan Dela Cruz" }
      ],
      remarks: []
    },
    {
      id: "AST-004",
      name: "Conference Room Tables (Set A)",
      category: "Office Equipment",
      location: "Conference Room A",
      status: "Operational",
      lastMaintenance: "2024-08-12",
      acquisitionDate: "2023-05-15", // ADD THIS
      nextMaintenance: "2024-09-15", // ADD THIS
      task: "Surface polishing and hardware check",
      maintenanceHistory: [
        { date: "2024-08-12",  task: "Wood polish application and hardware tightening", Assigned: "Juan Dela Cruz" },
        { date: "2024-07-05", task: "Scratch repair on table surface", Assigned: "Juan Dela Cruz" }
      ],
      remarks: [
        {
          user: "Ana Reyes",
          timestamp: "2024-08-13T11:20:00Z",
          content: "Tables look great after polishing. One table leg still wobbles slightly."
        }
      ]
    },
    {
      id: "AST-005",
      name: "Backup Generator Unit 1",
      category: "Electrical Equipment",
      location: "Generator Room",
      status: "Retired",
      lastMaintenance: "2024-05-30",
      acquisitionDate: "2023-05-15", // ADD THIS
  nextMaintenance: "2024-09-15", // ADD THIS
      task: "Final inspection before retirement",
      maintenanceHistory: [
        { date: "2024-05-30", task: "Final inspection and documentation", Assigned: "Juan Dela Cruz" },
        { date: "2024-04-20", task: "Engine oil change and battery check", Assigned: "Juan Dela Cruz" },
        { date: "2024-03-15", task: "Load testing and fuel system check", Assigned: "Juan Dela Cruz" }
      ],
     incidentHistory: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "Minor temperature fluctuation detected during peak hours",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Resolved"
  }
]
    },
    {
      id: "AST-006",
      name: "Floor Cleaning Equipment",
      category: "Miscellaneous / General Facilities",
      location: "Janitor's Storage Room",
      status: "Under Maintenance",
      lastMaintenance: "2024-08-16",
      acquisitionDate: "2023-05-15", // ADD THIS
  nextMaintenance: "2024-09-15", // ADD THIS
      task: "Motor repair and brush replacement",
      maintenanceHistory: [
        { date: "2024-08-16", task: "Motor diagnostic and repair attempt",  Assigned: "Juan Dela Cruz" },
        { date: "2024-07-20", task: "Routine cleaning and lubrication", Assigned: "Juan Dela Cruz" }
      ],
     incidentHistory: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "Minor temperature fluctuation detected during peak hours",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Resolved"
  }
]
    }
  ];

  // Mock function to simulate API call - replace with actual API call later
const fetchAssets = async () => {
  try {
    setLoading(true);
    const data = await assetService.fetchAssets();
    setAssets(data);
  } catch (err) {
    setError('Failed to load assets');
    console.error('Error fetching assets:', err);
  } finally {
    setLoading(false);
  }
};

const fetchCategories = async () => {
  try {
    const data = await assetService.fetchAssetCategories();
    setCategories(data);
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

useEffect(() => {
  fetchAssets();
  fetchCategories();
}, []);

const [showIncidentModal, setShowIncidentModal] = useState(false);
const [showCombinedHistoryModal, setShowCombinedHistoryModal] = useState(false);
const [historyAsset, setHistoryAsset] = useState(null);
const [incidentForm, setIncidentForm] = useState({
  type: "",
  description: "",
  severity: "Low"
});
  
  // Get current user info (keep existing logic)
  const currentUser = {
    name: localStorage.getItem("userName") || "Unknown User",
    email: localStorage.getItem("userEmail"),
    role: localStorage.getItem("userRole"),
  };

const handleSubmitIncident = async () => {
  if (!incidentForm.description.trim() || !incidentForm.type) {
    alert('Please fill in all required fields.');
    return;
  }

  try {
    const savedIncident = await assetService.createIncidentReport({
      assetId: incidentAsset.id,
      type: incidentForm.type,
      description: incidentForm.description.trim(),
      severity: incidentForm.severity
    });
    
    const updatedAssets = assets.map((asset) => {
      if (asset.id === incidentAsset.id) {
        return {
          ...asset,
          incidentHistory: [...(asset.incidentHistory || []), savedIncident],
        };
      }
      return asset;
    });

    setAssets(updatedAssets);
    
    setIncidentForm({ type: "", description: "", severity: "Low" });
    setShowIncidentModal(false);
    setIncidentAsset(null);
    
    alert('Incident report submitted successfully!');
    // Log activity
await logActivity('submit_incident_report', `Submitted incident report: ${incidentForm.type} - Severity: ${incidentForm.severity} for asset ${incidentAsset.name}`);
  } catch (err) {
    console.error('Error submitting incident:', err);
    alert('Failed to submit incident report. Please try again.');
  }
};

const handleCancelIncident = () => {
  setIncidentForm({ type: "", description: "", severity: "Low" });
  setShowIncidentModal(false);
  setIncidentAsset(null);  // Clear the stored asset data
};

// Pagination Component
const Pagination = () => {
  const maxPageButtons = 5;
  
  let startPage = Math.max(1, currentPage - Math.floor(maxPageButtons / 2));
  let endPage = Math.min(totalPages, startPage + maxPageButtons - 1);
  
  if (endPage - startPage < maxPageButtons - 1) {
    startPage = Math.max(1, endPage - maxPageButtons + 1);
  }
  
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="d-flex justify-content-between align-items-center p-3 border-top">
      <div className="text-muted">
        Showing {startIndex + 1} to {Math.min(startIndex + recordsPerPage, totalRecords)} of {totalRecords} entries
      </div>
      <div className="d-flex gap-2">
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage(currentPage - 1)}
        >
          Previous
        </Button>
        
        <div className="d-flex gap-1">
          {startPage > 1 && (
            <>
              <Button variant="outline-primary" size="sm" onClick={() => setCurrentPage(1)}>1</Button>
              {startPage > 2 && <span className="px-2">...</span>}
            </>
          )}
          
          {pageNumbers.map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "primary" : "outline-primary"}
              size="sm"
              onClick={() => setCurrentPage(pageNum)}
            >
              {pageNum}
            </Button>
          ))}
          
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="px-2">...</span>}
              <Button variant="outline-primary" size="sm" onClick={() => setCurrentPage(totalPages)}>
                {totalPages}
              </Button>
            </>
          )}
        </div>
        
        <Button
          variant="outline-primary"
          size="sm"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Changed from categoryFilter
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [incidentAsset, setIncidentAsset] = useState(null);
  // Filtered assets - updated to include status filter
// First filter all assets
const allFilteredAssets = assets.filter(
  (asset) =>
    (asset.name?.toLowerCase().includes(search.toLowerCase()) ||
      asset.id?.toLowerCase().includes(search.toLowerCase())) &&
    (statusFilter === "" || asset.status === statusFilter) &&
    (categoryFilter === "" || asset.category === categoryFilter)
);

// Update total records and pages
useEffect(() => {
  setTotalRecords(allFilteredAssets.length);
  setTotalPages(Math.ceil(allFilteredAssets.length / recordsPerPage));
}, [allFilteredAssets.length, recordsPerPage]);

// Apply pagination
const startIndex = (currentPage - 1) * recordsPerPage;
const filteredAssets = allFilteredAssets.slice(startIndex, startIndex + recordsPerPage);

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="personnel">
        <Container fluid>
          <h3>Asset Management</h3>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div>Loading assets...</div>
          </div>
        </Container>
      </SidebarLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidebarLayout role="personnel">
        <Container fluid>
          <h3>Asset Management</h3>
          <Alert variant="danger">
            <Alert.Heading>Error Loading Assets</Alert.Heading>
            <p>{error}</p>
            <Button variant="outline-danger" onClick={fetchAssets}>
              Try Again
            </Button>
          </Alert>
        </Container>
      </SidebarLayout>
    );
  }

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
};

  return (
    <SidebarLayout role="personnel">
      <Container fluid>
        <h3>Asset Management</h3>


        {/* Search & Filter Section - Updated with Status dropdown */}
        <Row className="mb-3">
          <Col md={4}>
            <Form.Control
              type="text"
              placeholder="Search assets by name, ID, or assignee..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={3}>
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Operational">Operational</option>
              <option value="Under Maintenance">Under Maintenance</option>
              <option value="Retired">Retired</option>
            </Form.Select>
          </Col>
          <Col md={3}>
          <Form.Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All Categories</option>
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_name}>
              {cat.category_name}
            </option>
          ))}
        </Form.Select>
          </Col>
        </Row>

       {/* Assets Table */}
      <div className="bg-white rounded shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
        <thead className="table-light">
          <tr>
            <th>Asset Name/Code</th>
            <th>Category</th>
            <th>Location</th>
            <th>Status</th>
            <th>Last Maintenance</th>
            <th>Actions</th>
          </tr>
        </thead>
         <tbody>
  {filteredAssets.length > 0 ? (
    filteredAssets.map((asset) => (
      <tr key={asset.id}>
        <td>{asset.name}</td>
        <td>{asset.category}</td>
        <td>{asset.location}</td>
<td>
  <div className="d-flex align-items-center gap-2">
    {/* Main Status Badge */}
   <span 
  className={`badge ${
    asset.status === 'Operational' ? 'bg-success' :
    asset.status === 'Under Maintenance' ? 'bg-warning' :
    'bg-secondary'
  }`}
  style={{ minWidth: '150px', display: 'inline-block', textAlign: 'center' }}
>
  {asset.status}
</span>
    
    {/* Incident Alert Badge */}
    {asset.incidentReports && asset.incidentReports.length > 0 && (
      <span 
        className="badge bg-warning text-dark" 
        title={`${asset.incidentReports.length} Incident Report(s)`}
        style={{ cursor: 'help' }}
      >
        <i className="fas fa-exclamation-triangle me-1"></i>
        {asset.incidentReports.length}
      </span>
    )}
  </div>
</td>
        <td>{asset.lastMaintenance || 'No maintenance yet'}</td>
                  <td>
                  <div className="btn-group btn-group-sm">
                    <Button
                      size="sm"
                      variant="outline-primary"
                      onClick={() => setSelectedAsset(asset)}
                    >
                      View
                    </Button>
                  </div>
                </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  {assets.length === 0 
                    ? `No assets available. Assets will appear here once they are added by an administrator.`
                    : `No assets found matching your search criteria.`
                  }
                </td>
              </tr>
            )}
          </tbody>
     </table>
  </div>
  {!loading && !error && filteredAssets.length > 0 && <Pagination />}
</div>

        {/* Show info message when no assets exist */}
        {assets.length === 0 && (
          <Alert variant="info">
            <Alert.Heading>No Assets Available</Alert.Heading>
            <p>
              Assets will be displayed here once they are added to the system by an administrator. 
              The asset management interface is ready and will automatically populate when backend data is available.
            </p>
          </Alert>
        )}
{/* Detailed Asset Modal */}
        <Modal
          show={!!selectedAsset}
          onHide={() => setSelectedAsset(null)}
          size="xl"
        >
          {selectedAsset && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>Asset Details</Modal.Title>
              </Modal.Header>
              
            <Modal.Body>
  {/* Status Badge and Report Button */}
<div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
  <div className="d-flex gap-2 align-items-center">
    {/* Main Status */}
    <span 
  className={`badge ${
    selectedAsset.status === 'Operational' ? 'bg-success' :
    selectedAsset.status === 'Under Maintenance' ? 'bg-warning' :
    'bg-secondary'
  }`}
  style={{ minWidth: '150px', display: 'inline-block', textAlign: 'center' }}
>
  {selectedAsset.status}
</span>
    
    {/* Incident Badge */}
    {selectedAsset.incidentReports && selectedAsset.incidentReports.length > 0 && (
      <span className="badge bg-warning text-dark">
        <i className="fas fa-exclamation-triangle me-1"></i>
        {selectedAsset.incidentReports.length} Incident{selectedAsset.incidentReports.length > 1 ? 's' : ''}
      </span>
    )}
  </div>
  
  {/* RIGHT SIDE - TWO BUTTONS */}
  <div className="d-flex gap-2">
    {/* REPORT INCIDENT BUTTON */}
    <Button 
      variant="outline-danger"
      size="sm"
      onClick={() => {
        setIncidentAsset(selectedAsset);
        setSelectedAsset(null);
        setTimeout(() => {
          setShowIncidentModal(true);
        }, 100);
      }}
    >
      <i className="fas fa-exclamation-triangle me-1"></i>
      Report Incident
    </Button>
    
    {/* VIEW HISTORY BUTTON */}
    <Button 
      size="sm" 
      variant="outline-primary"
      onClick={() => {
        setHistoryAsset(selectedAsset);
        setSelectedAsset(null);
        setShowCombinedHistoryModal(true);
      }}
    >
      <i className="fas fa-history me-2"></i>
      View History
    </Button>
  </div>
</div>

  {/* Asset Information - Two Column Grid */}
  <div className="row g-3">
    <div className="col-md-6">
      <Form.Group>
        <Form.Label><strong>Asset Name/Code:</strong></Form.Label>
        <Form.Control type="text" value={selectedAsset.name} readOnly />
      </Form.Group>
    </div>
    <div className="col-md-6">
      <Form.Group>
        <Form.Label><strong>Category:</strong></Form.Label>
        <Form.Control type="text" value={selectedAsset.category} readOnly />
      </Form.Group>
    </div>
    <div className="col-md-6">
      <Form.Group>
        <Form.Label><strong>Acquisition Date:</strong></Form.Label>
        <Form.Control type="text" value={selectedAsset.acquisitionDate} readOnly />
      </Form.Group>
    </div>
    <div className="col-md-6">
      <Form.Group>
        <Form.Label><strong>Location:</strong></Form.Label>
        <Form.Control type="text" value={selectedAsset.location} readOnly />
      </Form.Group>
    </div>
    <div className="col-md-12">
      <Form.Group>
        <Form.Label><strong>Next Maintenance:</strong></Form.Label>
        <Form.Control 
          type="text" 
          value={selectedAsset.nextMaintenance || 'Not scheduled'} 
          readOnly 
        />
        {selectedAsset.nextMaintenanceRepeat && selectedAsset.nextMaintenanceRepeat !== 'none' && (
          <Form.Text className="text-muted d-block mt-1">
            <i className="fas fa-repeat me-1"></i>
            Repeats: {selectedAsset.nextMaintenanceRepeat}
          </Form.Text>
        )}
      </Form.Group>
    </div>
  </div>

{/* Active Incidents Section */}
{/* Active Incidents Section */}
  <div className="mt-4 pt-3 border-top">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6 className="mb-0">
        <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
        Active Incidents
      </h6>
      {selectedAsset.incidentReports?.length > 0 && (
        <Badge bg="danger" pill>{selectedAsset.incidentReports.length}</Badge>
      )}
    </div>
    
    {selectedAsset.incidentReports?.length > 0 ? (
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {selectedAsset.incidentReports.map((incident, index) => (
          <Card key={index} className="mb-2 border-warning">
            <Card.Body className="py-2 px-3">
              {/* Single Row: Name, Date, Type, Severity, Status */}
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div className="d-flex align-items-center gap-2 flex-wrap">
                  <span className="fw-semibold small">{incident.reportedBy}</span>
                  <span className="text-muted small">•</span>
                  <span className="text-muted small">
                    {new Date(incident.reportedAt).toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                  <span className="text-muted small">•</span>
                  <span className="fw-bold text-dark small">{incident.type}</span>
                  <Badge 
                    bg={
                      incident.severity === 'High' ? 'danger' :
                      incident.severity === 'Medium' ? 'warning' : 'info'
                    }
                    className="small"
                  >
                    {incident.severity}
                  </Badge>
                </div>
                <Badge bg={incident.status === 'Reported' ? 'danger' : 'success'} className="small">
                  {incident.status}
                </Badge>
              </div>
              
              {/* Description */}
              <p className="small mb-0 text-muted" style={{ lineHeight: '1.4' }}>
                {incident.description}
              </p>
            </Card.Body>
          </Card>
        ))}
      </div>
    ) : (
      <div className="text-center py-3 bg-light rounded">
        <i className="fas fa-check-circle fa-2x mb-2 text-success opacity-25"></i>
        <p className="mb-0 small text-muted">No active incidents</p>
      </div>
    )}
  </div>
</Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setSelectedAsset(null)}>
                  Close
                </Button>
              </Modal.Footer>
            </>
          )}
        </Modal>
      
{/* Incident Report Modal */}
<Modal
  show={showIncidentModal}
  onHide={() => setShowIncidentModal(false)}
  centered
>
  <Modal.Header closeButton>
    <Modal.Title>Report Incident</Modal.Title>
  </Modal.Header>

  <Modal.Body>
    {incidentAsset && (
    <>
      <Row className="mb-3">
        <Col xs={12}>
          <Form.Group>
            <Form.Label>Asset Name/Code</Form.Label>
            <Form.Control type="text" value={incidentAsset.name} readOnly />
          </Form.Group>
        </Col>
      </Row>
        
        <Form.Group className="mb-3">
          <Form.Label>Category</Form.Label>
          <Form.Control type="text" value={incidentAsset.category} readOnly />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Incident Type *</Form.Label>
          <Form.Select
            value={incidentForm.type}
            onChange={(e) => setIncidentForm({...incidentForm, type: e.target.value})}
            required
          >
            <option value="">Select incident type...</option>
            <option value="Equipment Malfunction">Equipment Malfunction</option>
            <option value="Safety Hazard">Safety Hazard</option>
            <option value="Damage">Damage</option>
            <option value="Performance Issue">Performance Issue</option>
            <option value="Other">Other</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Severity *</Form.Label>
          <Form.Select
            value={incidentForm.severity}
            onChange={(e) => setIncidentForm({...incidentForm, severity: e.target.value})}
          >
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Description *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            placeholder="Describe the incident in detail..."
            value={incidentForm.description}
            onChange={(e) => setIncidentForm({...incidentForm, description: e.target.value})}
            required
          />
        </Form.Group>
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={handleCancelIncident}>
      Cancel
    </Button>
    <Button 
      variant="danger" 
      onClick={handleSubmitIncident}
      disabled={!incidentForm.type || !incidentForm.description.trim()}
    >
      Report Incident
    </Button>
  </Modal.Footer>
</Modal>
{/* Combined History Modal */}
<Modal 
  show={showCombinedHistoryModal} 
  onHide={() => {
    setShowCombinedHistoryModal(false);
    setHistoryAsset(null);
  }} 
  size="xl"
>
  <Modal.Header closeButton>
    <Modal.Title>Asset History</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {/* Maintenance History Section */}
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="fas fa-tools me-2 text-primary"></i>
          Maintenance History
        </h5>
        {historyAsset?.maintenanceHistory?.length > 0 && (
          <Badge bg="secondary">{historyAsset.maintenanceHistory.length} records</Badge>
        )}
      </div>
      
      {historyAsset?.maintenanceHistory?.length > 0 ? (
        <Table bordered hover size="sm">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Task</th>
              <th>Assigned To</th>
            </tr>
          </thead>
          <tbody>
            {historyAsset.maintenanceHistory.map((entry, idx) => (
              <tr key={idx}>
                <td>{formatDate(entry.date)}</td>
                <td>{entry.task}</td>
                <td>{entry.assigned}</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="light" className="text-center">
          <i className="fas fa-clipboard-list fa-2x mb-2 opacity-25"></i>
          <p className="mb-0">No maintenance history available</p>
        </Alert>
      )}
    </div>

    {/* Incident History Section */}
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">
          <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
          Incident History
        </h5>
        {historyAsset?.incidentHistory?.length > 0 && (
          <Badge bg="secondary">{historyAsset.incidentHistory.length} records</Badge>
        )}
      </div>
      
      {historyAsset?.incidentHistory?.length > 0 ? (
        <Table bordered hover size="sm">
          <thead className="table-light">
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Severity</th>
              <th>Reported By</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {historyAsset.incidentHistory.map((incident, idx) => (
              <tr key={idx}>
                <td>{formatDate(incident.reportedAt)}</td>
                <td>{incident.type}</td>
                <td>
                  <Badge bg={
                    incident.severity === 'High' ? 'danger' :
                    incident.severity === 'Medium' ? 'warning' : 'info'
                  }>
                    {incident.severity}
                  </Badge>
                </td>
                <td>{incident.reportedBy}</td>
<td>
  <Badge bg={
    incident.status === 'Reported' ? 'secondary' :  // ⬅️ CHANGED from 'danger'
    incident.status === 'Completed' ? 'success' : 
    incident.status === 'Failed' ? 'danger' : 'secondary'
  }>
    {incident.status}
  </Badge>
</td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <Alert variant="light" className="text-center">
          <i className="fas fa-check-circle fa-2x mb-2 text-success opacity-25"></i>
          <p className="mb-0">No incident history available</p>
        </Alert>
      )}
    </div>
  </Modal.Body>
  <Modal.Footer>
    <Button 
      variant="outline-secondary" 
      onClick={() => {
        setShowCombinedHistoryModal(false);
        setSelectedAsset(historyAsset);
        setHistoryAsset(null);
      }}
    >
      <i className="fas fa-arrow-left me-2"></i>
      Back to Asset Details
    </Button>
    <Button variant="secondary" onClick={() => {
      setShowCombinedHistoryModal(false);
      setHistoryAsset(null);
    }}>
      Close
    </Button>
  </Modal.Footer>
</Modal>

      </Container>
      
    </SidebarLayout>
  );
}