// src/dashboards/PersonnelNav/Assets.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Tabs,
  Tab,
  Table,
  Modal,
  Alert,
} from "react-bootstrap";

export default function Assets() {
  // State for assets - will be populated from backend
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock function to simulate API call - replace with actual API call later
  const fetchAssets = async () => {
    try {
      setLoading(true);
      
      // TODO: Replace this with actual API call
      // const response = await fetch('/api/assets');
      // const data = await response.json();
      // setAssets(data);
      
      // For now, simulate loading and return empty array
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setAssets([]); // No assets until backend is connected
      
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

  const [remark, setRemark] = useState("");
  
  // Get current user info (keep existing logic)
  const currentUser = {
    name: localStorage.getItem("userName") || "Unknown User",
    email: localStorage.getItem("userEmail"),
    role: localStorage.getItem("userRole"),
  };

  const handleSubmitRemark = async () => {
    if (remark.trim() === "") return;

    try {
      const newRemark = {
        content: remark.trim(),
        user: currentUser.name,
        timestamp: new Date().toISOString(),
      };

      // TODO: Replace with actual API call
      // await fetch(`/api/assets/${selectedAsset.id}/remarks`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(newRemark)
      // });

      // For now, update local state (this logic will work with backend too)
      const updatedAssets = assets.map((asset) => {
        if (asset.id === selectedAsset.id) {
          return {
            ...asset,
            remarks: [...(asset.remarks || []), newRemark],
          };
        }
        return asset;
      });

      setAssets(updatedAssets);
      
      // Update the modal view
      const updatedSelectedAsset = updatedAssets.find(a => a.id === selectedAsset.id);
      setSelectedAsset(updatedSelectedAsset);
      
      setRemark("");
    } catch (err) {
      console.error('Error adding remark:', err);
      // TODO: Show error message to user
    }
  };

  const handleCancelRemark = () => {
    setRemark("");
    setSelectedAsset(null);
  };

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);

  // Filtered assets
  const filteredAssets = assets.filter(
    (asset) =>
      (asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.id?.toLowerCase().includes(search.toLowerCase())) &&
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

        {/* Search & Filter Section */}
        <Row className="mb-3">
          <Col md={6}>
            <Form.Control
              type="text"
              placeholder="Search assets by name or ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col md={4}>
            <Form.Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              <option>Facilities & Building Infra</option>
              <option>Safety & Security Systems</option>
              <option>Grounds & External Areas</option>
              <option>Furniture & Fixtures</option>
              <option>Maintenance Equipment</option>
              <option>Utilities Infrastructure</option>
              <option>Vehicles</option>
            </Form.Select>
          </Col>
          <Col md={2}>
            <Button variant="outline-primary" onClick={fetchAssets}>
              Refresh
            </Button>
          </Col>
        </Row>

        {/* Status Tabs */}
        <Tabs defaultActiveKey="Operational" className="mb-3">
          {["Operational", "Under Maintenance", "Retired"].map((status) => (
            <Tab eventKey={status} title={status} key={status}>
              <Table bordered hover responsive>
                <thead>
                  <tr>
                    <th>Asset ID</th>
                    <th>Asset Name</th>
                    <th>Category</th>
                    <th>Location</th>
                    <th>Status</th>
                    <th>Last Maintenance</th>
                    <th>Task</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAssets.filter((a) => a.status === status).length > 0 ? (
                    filteredAssets
                      .filter((a) => a.status === status)
                      .map((asset) => (
                        <tr key={asset.id}>
                          <td>{asset.id}</td>
                          <td>{asset.name}</td>
                          <td>{asset.category}</td>
                          <td>{asset.location}</td>
                          <td>{asset.status}</td>
                          <td>{asset.lastMaintenance}</td>
                          <td>{asset.task}</td>
                          <td>
                            <Button
                              size="sm"
                              variant="primary"
                              onClick={() => setSelectedAsset(asset)}
                            >
                              View
                            </Button>
                          </td>
                        </tr>
                      ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-muted py-4">
                        {assets.length === 0 
                          ? `No assets available. Assets will appear here once they are added by an administrator.`
                          : `No ${status.toLowerCase()} assets found.`
                        }
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </Tab>
          ))}
        </Tabs>

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
                      <Form.Control type="text" value={selectedAsset.id} readOnly />
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
                </Row>

                {/* Maintenance History */}
                <div className="mb-4">
                  <h6>Maintenance History</h6>
                  <Table bordered size="sm" className="mt-2">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Tasks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedAsset.maintenanceHistory?.length > 0 ? (
                        selectedAsset.maintenanceHistory.map((entry, idx) => (
                          <tr key={idx}>
                            <td>{entry.date}</td>
                            <td>{entry.task}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="2" className="text-center text-muted">
                            No maintenance history available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </Table>
                </div>

                {/* Remarks */}
                <div>
                  <h6>Remarks</h6>
                  {selectedAsset.remarks?.length > 0 ? (
                    selectedAsset.remarks.map((remark, index) => (
                      <div key={index} style={{ borderTop: '1px solid #ccc', paddingTop: '1rem', marginTop: '1rem' }}>
                        <div style={{ fontWeight: '600', color: '#1B4B8F' }}>
                          👤 {remark.user}
                        </div>
                        <div style={{ fontSize: '0.85rem', color: '#666' }}>
                          📅 {new Date(remark.timestamp).toLocaleString()}
                        </div>
                        <div style={{ backgroundColor: '#f9f9f9', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                          {remark.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted">No remarks yet.</p>
                  )}

                  {/* Add Remark */}
                  <Form.Group className="mt-4">
                    <Form.Label>Leave a remark about this asset:</Form.Label>
                    <Form.Control
                      as="textarea"
                      rows={3}
                      placeholder="Enter your remark..."
                      value={remark}
                      onChange={(e) => setRemark(e.target.value)}
                    />
                  </Form.Group>

                  <div className="d-flex justify-content-between mt-3">
                    <Button variant="secondary" onClick={handleCancelRemark}>Cancel</Button>
                    <Button variant="primary" onClick={handleSubmitRemark}>Submit Remark</Button>
                  </div>
                </div>
              </Modal.Body>
            </>
          )}
        </Modal>
      </Container>
    </SidebarLayout>
  );
}