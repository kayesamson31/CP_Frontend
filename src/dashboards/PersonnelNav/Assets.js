// src/dashboards/PersonnelNav/Assets.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Table,
  Modal,
  Alert,
} from "react-bootstrap";

export default function Assets() {
  // State for assets - will be populated from backend
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
      
      // TODO: Replace this with actual API call
      // const response = await fetch('/api/assets');
      // const data = await response.json();
      // setAssets(data);
      
      // For now, simulate loading and return sample data for visualization
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setAssets(sampleAssets); // Using sample data for visualization
      
    } catch (err) {
      setError('Failed to load assets');
      console.error('Error fetching assets:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load assets on component mount
  useEffect(() => {
    fetchAssets();
  }, []);

  const [showIncidentModal, setShowIncidentModal] = useState(false);
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
  if (!incidentForm.description.trim()) return;

  try {
    const newIncident = {
      id: `INC-${Date.now()}`,
      type: incidentForm.type,
      description: incidentForm.description.trim(),
      severity: incidentForm.severity,
      reportedBy: currentUser.name,
      reportedAt: new Date().toISOString(),
      status: "Open"
    };

    const updatedAssets = assets.map((asset) => {
      if (asset.id === incidentAsset.id) {
        return {
          ...asset,
          incidentHistory: [...(asset.incidentHistory || []), newIncident],
        };
      }
      return asset;
    });

    setAssets(updatedAssets);
    const updatedSelectedAsset = updatedAssets.find(a => a.id === incidentAsset.id);
    setSelectedAsset(updatedSelectedAsset);
    
    setIncidentForm({ type: "", description: "", severity: "Low" });
    setShowIncidentModal(false);
    setIncidentAsset(null);  // Clear the stored asset data
  } catch (err) {
    console.error('Error adding incident:', err);
  }
};

const handleCancelIncident = () => {
  setIncidentForm({ type: "", description: "", severity: "Low" });
  setShowIncidentModal(false);
  setIncidentAsset(null);  // Clear the stored asset data
};


  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // Changed from categoryFilter
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [incidentAsset, setIncidentAsset] = useState(null);
  // Filtered assets - updated to include status filter
  const filteredAssets = assets.filter(
    (asset) =>
      (asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.id?.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "" || asset.status === statusFilter) &&
      (categoryFilter === "" || asset.category === categoryFilter)
  );

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

  return (
    <SidebarLayout role="personnel">
      <Container fluid>
        <h3>Asset Management</h3>

        {/* Sample Data Notice */}
        <Alert variant="info" className="mb-3">
          <strong>Note:</strong> Currently showing sample data for visualization purposes. 
          This will be replaced with real data from the backend API.
        </Alert>

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
            <option value="HVAC Equipment">HVAC Equipment</option>
            <option value="Electrical Equipment">Electrical Equipment</option>
            <option value="Plumbing Fixtures">Plumbing Fixtures</option>
            <option value="Carpentry/Structural Assets">Carpentry/Structural Assets</option>
            <option value="Office Equipment">Office Equipment</option>
            <option value="Safety Equipment">Safety Equipment</option>
            <option value="Groundskeeping Tools">Groundskeeping Tools</option>
            <option value="Miscellaneous / General Facilities">Miscellaneous / General Facilities</option>
          </Form.Select>
          </Col>
        </Row>

       {/* Assets Table */}
      <div className="bg-white rounded shadow-sm">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Asset ID</th>
              <th>Asset Name</th>
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
                  <td>{asset.id}</td>
                  <td>{asset.name}</td>
                  <td>{asset.category}</td>
                  <td>{asset.location}</td>
                  <td>
                    <span className={`badge ${
                      asset.status === 'Operational' ? 'bg-success' :
                      asset.status === 'Under Maintenance' ? 'bg-warning' :
                      'bg-secondary'
                    }`}>
                      {asset.status}
                    </span>
                  </td>
                  <td>{asset.lastMaintenance}</td>
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
                <td colSpan="7" className="text-center text-muted py-4">
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

        {/* Detailed Asset Modal - Keep existing modal code */}
        <Modal
          show={!!selectedAsset}
          onHide={() => setSelectedAsset(null)}
          size="lg"
        >
          {selectedAsset && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>{selectedAsset.name} Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <h5>{selectedAsset.name}</h5>

                {/* Asset Info - Two Column */}
                <Row className="mb-4">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><strong>ID:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.id}readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label><strong>Status:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.status} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-3">
                    <Form.Group>
                      <Form.Label><strong>Location:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.location} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-3">
                    <Form.Group>
                      <Form.Label><strong>Category:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.category} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-3">
                    <Form.Group>
                      <Form.Label><strong>Category:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.category} readOnly />
                    </Form.Group>
                  </Col>
                  <Col md={6} className="mt-3">
                    <Form.Group>
                      <Form.Label><strong>Acquisition Date:</strong></Form.Label>
                      <Form.Control type="text" value={selectedAsset.acquisitionDate} readOnly />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Maintenance History */}
                <div className="mb-4">
                  <h6>Maintenance History</h6>
                  <Table bordered size="sm" className="mt-2">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tasks</th>
                        <th>Assigned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAsset.maintenanceHistory?.length > 0 ? (
                        selectedAsset.maintenanceHistory.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{entry.date}</td>
                            <td>{entry.task}</td>
                            <td>{entry.Assigned}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="3" className="text-center text-muted">
                            No maintenance history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

              {/* Next Maintenance - ADD THIS ENTIRE SECTION */}
<div className="mb-4">
  <h6>Next Maintenance</h6>
  <div className="p-3" style={{ backgroundColor: '#f8f9fa', borderRadius: '8px', border: '1px solid #dee2e6' }}>
    <Row>
      <Col md={6}>
        <strong>Scheduled Date:</strong>
        <div className="mt-1">{selectedAsset.nextMaintenance || "Not scheduled"}</div>
      </Col>
      <Col md={6}>
        <strong>Status:</strong>
        <div className="mt-1">
          <span className={`badge ${
            selectedAsset.nextMaintenance && new Date(selectedAsset.nextMaintenance) < new Date()
              ? 'bg-danger' 
              : selectedAsset.nextMaintenance && new Date(selectedAsset.nextMaintenance) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
              ? 'bg-warning'
              : 'bg-success'
          }`}>
            {selectedAsset.nextMaintenance 
              ? new Date(selectedAsset.nextMaintenance) < new Date()
                ? 'Overdue'
                : new Date(selectedAsset.nextMaintenance) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                ? 'Due Soon'
                : 'Scheduled'
              : 'Not Scheduled'
            }
          </span>
        </div>
      </Col>
    </Row>
  </div>
</div>

               {/* Incident History */}
<div>
  <div className="d-flex justify-content-between align-items-center mb-3">
    <h6>Incident History</h6>
    <Button 
      size="sm" 
      variant="outline-danger"
      onClick={() => {
        setIncidentAsset(selectedAsset);  // Store the asset data
        setSelectedAsset(null);           // Close asset details modal
        setTimeout(() => {
          setShowIncidentModal(true);     // Open incident modal
        }, 100);
      }}
    >
      Report Incident
    </Button>
  </div>
  
  {selectedAsset.incidentHistory?.length > 0 ? (
    selectedAsset.incidentHistory.map((incident, index) => (
      <div key={index} className="border rounded p-3 mb-3">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <strong>{incident.type}</strong>
            <span className={`badge ms-2 ${
              incident.severity === 'High' ? 'bg-danger' :
              incident.severity === 'Medium' ? 'bg-warning' : 'bg-info'
            }`}>
              {incident.severity}
            </span>
          </div>
          <small className="text-muted">{incident.id}</small>
        </div>
        <p className="mb-2">{incident.description}</p>
        <div className="d-flex justify-content-between">
          <small className="text-muted">
            Reported by: {incident.reportedBy}
          </small>
          <small className="text-muted">
            {new Date(incident.reportedAt).toLocaleString()}
          </small>
        </div>
      </div>
    ))
  ) : (
    <p className="text-muted">No incidents reported yet.</p>
  )}
</div>
              </Modal.Body>
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
          <Col md={6}>
            <Form.Group>
              <Form.Label>Asset ID</Form.Label>
              <Form.Control type="text" value={incidentAsset.id} readOnly />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group>
              <Form.Label>Asset Name</Form.Label>
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

      </Container>
    </SidebarLayout>
  );
}