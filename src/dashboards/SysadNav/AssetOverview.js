// src/dashboards/SYSAD/AssetOverview.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { assetService } from '../../services/assetService';
import {Container,Row,Col,Form,Button,Table,Modal,Alert,Badge} from "react-bootstrap";
import Papa from 'papaparse'
import { PasswordUtils } from '../../utils/PasswordUtils';
import { EmailService } from '../../utils/EmailService';

export default function AssetOverview() {
  // State for assets
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // State for filters
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  
  // State for view modal
  const [selectedAsset, setSelectedAsset] = useState(null);
 
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [csvFile, setCsvFile] = useState(null);
const [uploadingAssets, setUploadingAssets] = useState(false);

  // Fetch functions
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

  // Filtered assets
  const filteredAssets = assets.filter(
    (asset) =>
      (asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.id?.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "" || asset.status === statusFilter) &&
      (categoryFilter === "" || asset.category === categoryFilter)
  );

  // Export function
  const handleExportReport = () => {
    try {
      const headers = [
        'Asset ID',
        'Asset Name',
        'Category',
        'Location',
        'Status',
        'Acquisition Date',
        'Last Maintenance'
      ];
      
      const csvData = [
        headers.join(','),
        ...filteredAssets.map(asset => [
          asset.id,
          `"${asset.name}"`,
          `"${asset.category}"`,
          `"${asset.location}"`,
          asset.status,
          asset.acquisitionDate || '',
          asset.lastMaintenance || ''
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `assets_overview_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
    } catch (err) {
      console.error('Error exporting report:', err);
      alert('Failed to export report. Please try again.');
    }
  };

  // Handle CSV file selection
const handleCsvFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    setCsvFile(file);
  } else {
    alert('Please select a valid CSV file.');
  }
};

const handleBulkUpload = async () => {
  if (!csvFile) {
    alert('Please select a CSV file first.');
    return;
  }
  
  setUploadingAssets(true);
  
  try {
    // Get current user's organization ID
    const organizationId = await assetService.getCurrentUserOrganization();
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        
        
        const parseResult = Papa.parse(text, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });

        if (parseResult.errors.length > 0) {
          console.error('CSV Parse Errors:', parseResult.errors);
        }

        const csvRows = parseResult.data.filter(row => 
          row.name && row.name.trim() !== '' && 
          row.category && row.category.trim() !== ''
        );

        if (csvRows.length === 0) {
          throw new Error('No valid asset data found in CSV');
        }

        console.log('Parsed CSV rows:', csvRows);

        // Prepare assets array for bulk upload service
 // Prepare assets array for bulk upload service
const assetsToUpload = csvRows.map(row => {
  // Convert DD/MM/YYYY to YYYY-MM-DD if date exists
  let formattedDate = null;
  if (row.acquisitionDate && row.acquisitionDate.trim() !== '') {
    const parts = row.acquisitionDate.trim().split('/');
    if (parts.length === 3) {
      // parts[0] = day, parts[1] = month, parts[2] = year
      formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  return {
    name: row.name.trim(),
    category: row.category.trim(),
    location: row.location?.trim() || 'Not specified',
    status: row.status || 'Operational',
    acquisitionDate: formattedDate
  };
});

        console.log('Assets to upload:', assetsToUpload);

        // Call the bulk upload service
        const result = await assetService.bulkUploadAssets(assetsToUpload);
        
        console.log('Upload result:', result);

        alert(`Successfully uploaded ${assetsToUpload.length} assets!`);
        
        // Close modal and reset
        setShowBulkUploadModal(false);
        setCsvFile(null);
        
        // Refresh the asset list
        await fetchAssets();
        
      } catch (innerError) {
        console.error('Error processing CSV:', innerError);
        alert('Failed to upload CSV: ' + innerError.message);
      }
    };
    
    reader.readAsText(csvFile);
    
  } catch (error) {
    console.error('Error uploading CSV:', error);
    alert('Failed to upload CSV. Please check the format and try again.');
  } finally {
    setUploadingAssets(false);
  }
};

const downloadTemplate = () => {
  const template = `name,category,location,status,acquisitionDate
Laptop Dell XPS,Computer,Office Floor 1,Operational,2024-01-15
Printer HP LaserJet,Office Equipment,Reception,Operational,2024-02-20`;


  const blob = new Blob([template], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'assets_template.csv';
  a.click();
  window.URL.revokeObjectURL(url);
};

  // Loading state
  if (loading) {
    return (
      <SidebarLayout role="sysadmin">
        <Container fluid>
          <h3>Asset Overview</h3>
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '300px' }}>
            <div>Loading assets...</div>
          </div>
        </Container>
      </SidebarLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <SidebarLayout role="sysadmin">
        <Container fluid>
          <h3>Asset Overview</h3>
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
    <SidebarLayout role="sysadmin">
      <Container fluid>
        {/* Header */}
<div className="d-flex justify-content-between align-items-center mb-4">
  <div>
    <h3 className="mb-1">Asset Overview</h3>
    <p className="text-muted mb-0">View and monitor all organizational assets</p>
  </div>
  <div className="d-flex gap-2">
  <Button 
    variant="primary"
    onClick={() => setShowBulkUploadModal(true)}
  >
    <i className="fas fa-upload me-2"></i>
    Bulk Upload Assets (CSV)
  </Button>
  
  <Button 
    variant="outline-success"
    onClick={handleExportReport}
  >
    <i className="fas fa-download me-2"></i>
    Export CSV
  </Button>
</div>
</div>

{/* Search & Filter Section */}
<Row className="mb-3">
  <Col md={4}>
    <Form.Control
      type="text"
      placeholder="Search assets by name, ID, or location..."
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
                <span className={`badge ${
                  asset.status === 'Operational' ? 'bg-success' :
                  asset.status === 'Under Maintenance' ? 'bg-warning' :
                  'bg-secondary'
                }`}>
                  {asset.status}
                </span>
              </td>
              <td>{asset.lastMaintenance || 'N/A'}</td>
              <td>
                <Button
                  size="sm"
                  variant="outline-primary"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <i className="fas fa-eye me-1"></i>
                  View
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan="6" className="text-center text-muted py-4">
              {assets.length === 0 
                ? 'No assets available in the system.'
                : 'No assets found matching your search criteria.'
              }
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
</div>

{/* No assets message */}
{assets.length === 0 && (
  <Alert variant="info" className="mt-3">
    <Alert.Heading>No Assets Available</Alert.Heading>
    <p>
      Assets will appear here once they are added to the system through the setup wizard or by Admin Officials.
    </p>
  </Alert>
)}

{/* Bulk Upload Modal */}
<Modal show={showBulkUploadModal} onHide={() => setShowBulkUploadModal(false)} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>Bulk Upload Assets (CSV)</Modal.Title>
  </Modal.Header>
  <Modal.Body>
   <Alert variant="info">
  <strong>CSV Format:</strong> name, category, location, status, acquisitionDate
  <br />
  <small>Header row should match these column names (case sensitive)</small>
  <br />
  <small className="text-muted">Note: Next maintenance can be scheduled after upload using the "Schedule" button</small>
</Alert>
    
    <div className="mb-3">
      <Button 
        variant="outline-primary" 
        size="sm"
        onClick={downloadTemplate}
      >
        <i className="fas fa-download me-2"></i>
        Download Template
      </Button>
    </div>
    
    <Form.Group className="mb-3">
      <Form.Label>Select CSV File</Form.Label>
      <Form.Control
        type="file"
        accept=".csv"
        onChange={handleCsvFileChange}
      />
    </Form.Group>
    
    
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowBulkUploadModal(false)}>
      Cancel
    </Button>
    <Button 
      variant="primary" 
      onClick={handleBulkUpload}
      disabled={!csvFile || uploadingAssets}
    >
      {uploadingAssets ? (
        <>
          <span className="spinner-border spinner-border-sm me-2"></span>
          Uploading...
        </>
      ) : (
        <>
          <i className="fas fa-upload me-2"></i>
          Upload Assets
        </>
      )}
    </Button>
  </Modal.Footer>
</Modal>
{/* Read-Only Asset Detail Modal */}
<Modal
  show={!!selectedAsset}
  onHide={() => setSelectedAsset(null)}
  size="xl"
>
  {selectedAsset && (
    <>
      <Modal.Header closeButton>
        <Modal.Title>Asset Details (Read-Only)</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Row>
          {/* Main Asset Information */}
          <Col lg={8}>
            <div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
              <div className="d-flex gap-2">
                <span className={`badge ${
                  selectedAsset.status === 'Operational' ? 'bg-success' :
                  selectedAsset.status === 'Under Maintenance' ? 'bg-warning' :
                  'bg-secondary'
                }`}>
                  {selectedAsset.status}
                </span>
                {selectedAsset.hasFailedMaintenance && (
                  <span className="badge bg-danger">
                    <i className="fas fa-exclamation-triangle me-1"></i>
                    {selectedAsset.failedMaintenanceCount} Failed Task{selectedAsset.failedMaintenanceCount > 1 ? 's' : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Asset Details - Read Only */}
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
                  <Form.Control type="text" value={selectedAsset.acquisitionDate || 'N/A'} readOnly />
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

            {/* Maintenance History */}
            <div className="mt-4 pt-3 border-top">
              <h6 className="mb-3">
                <i className="fas fa-history me-2"></i>
                Maintenance History
              </h6>
              <Table bordered size="sm" className="mt-2">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Tasks</th>
                    <th>Assigned</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedAsset.maintenanceHistory?.length > 0 ? (
                    selectedAsset.maintenanceHistory.map((entry, idx) => (
                      <tr key={idx}>
                        <td>{entry.date}</td>
                        <td>{entry.task}</td>
                        <td>{entry.assigned}</td>
                        <td>
                          <Badge bg={entry.status === 'completed' ? 'success' : entry.status === 'failed' ? 'danger' : 'secondary'}>
                            {entry.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center text-muted">
                        No maintenance history available
                      </td>
                    </tr>
                  )}
                </tbody>
              </Table>
            </div>

            {/* Incident History */}
            {selectedAsset.incidentHistory && selectedAsset.incidentHistory.length > 0 && (
              <div className="mt-4 pt-3 border-top">
                <h6 className="mb-3">
                  <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                  Incident Report History
                </h6>
                <Table bordered size="sm" className="mt-2">
                  <thead>
                    <tr>
                      <th>Date Reported</th>
                      <th>Type</th>
                      <th>Severity</th>
                      <th>Reported By</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedAsset.incidentHistory.map((incident, idx) => (
                      <tr key={idx}>
                        <td>{new Date(incident.reportedAt).toLocaleDateString()}</td>
                        <td>{incident.type}</td>
                        <td>
                          <Badge bg={
                            incident.severity === 'Critical' ? 'danger' :
                            incident.severity === 'Major' ? 'warning' : 'info'
                          }>
                            {incident.severity}
                          </Badge>
                        </td>
                        <td>{incident.reportedBy}</td>
                        <td>
                          <Badge bg={
                            incident.status === 'Reported' ? 'danger' : 
                            incident.status === 'Resolved' ? 'success' : 'secondary'
                          }>
                            {incident.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Col>

          {/* Right Column - Incident Reports Panel */}
          <Col lg={4}>
            <div className="h-100 border-start ps-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">
                  <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
                  Active Incidents
                </h6>
                {selectedAsset.incidentReports?.length > 0 && (
                  <Badge bg="danger">{selectedAsset.incidentReports.length}</Badge>
                )}
              </div>
              
              <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                {selectedAsset.incidentReports?.length > 0 ? (
                  selectedAsset.incidentReports.map((incident, index) => (
                    <div key={index} className="mb-3 p-3 border rounded shadow-sm bg-light">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <strong className="text-danger">{incident.reportedBy}</strong>
                          <div>
                            <small className="text-muted">
                              {new Date(incident.reportedAt).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        <Badge bg={incident.status === 'Open' ? 'danger' : incident.status === 'Assigned to Task' ? 'warning' : 'secondary'}>
                          {incident.status}
                        </Badge>
                      </div>
                      
                      <div className="mb-2">
                        <span className="fw-bold">{incident.type}</span>
                        <span className={`badge ms-2 ${
                          incident.severity === 'High' ? 'bg-danger' :
                          incident.severity === 'Medium' ? 'bg-warning' : 'bg-info'
                        }`}>
                          {incident.severity}
                        </span>
                      </div>
                      
                      <p className="small mb-0 text-muted">
                        {incident.description.length > 80 
                          ? `${incident.description.substring(0, 80)}...` 
                          : incident.description
                        }
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-muted py-5">
                    <i className="fas fa-clipboard-check fa-3x mb-3 opacity-25"></i>
                    <p className="mb-0">No active incidents</p>
                    <small>All clear!</small>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setSelectedAsset(null)}>
          Close
        </Button>
      </Modal.Footer>
    </>
  )}
</Modal>
      </Container>
    </SidebarLayout>
  );
}