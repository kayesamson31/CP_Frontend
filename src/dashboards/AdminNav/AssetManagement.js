// src/dashboards/AdminNav/AssetManagement.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { assetService } from '../../services/assetService';
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
  Dropdown  
} from "react-bootstrap";

export default function AssetManagement() {
  // State for assets - will be populated from backend
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
const [categories, setCategories] = useState([]);
  // Add these state variables for task management
const [tasks, setTasks] = useState([]);
const [personnel, setPersonnel] = useState([]);


const [previousAsset, setPreviousAsset] = useState(null);
const [predefinedTasks] = useState([
  'Check-up / Inspection',
  'Cleaning',
  'Lubrication / Greasing',
  'Calibration',
  'Testing & Diagnostics',
  'Repairs / Minor Fixes',
  'Replacement of Parts',
  'Safety Compliance Check'
]);
const fetchCategories = async () => {
  try {
    const data = await assetService.fetchAssetCategories();
    setCategories(data);
  } catch (err) {
    console.error('Error fetching categories:', err);
  }
};

// Add Asset Modal states
const [showAddAssetModal, setShowAddAssetModal] = useState(false);
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [newAsset, setNewAsset] = useState({
  name: '',
  category: 'Facilities & Building Infra',
  location: '',
  status: 'Operational',
  acquisitionDate: '',
  nextMaintenance: '',
  task: ''
});
const [csvFile, setCsvFile] = useState(null);
const [csvPreview, setCsvPreview] = useState([]);

// Add these after the existing state variables
const [showMaintenanceScheduleModal, setShowMaintenanceScheduleModal] = useState(false);
const [nextMaintenanceSchedule, setNextMaintenanceSchedule] = useState({
  assetId: '',
  assigneeId: '',
  scheduledDate: '',
  scheduledTime: '',
  repeat: 'none'
});

const [showIncidentDetailsModal, setShowIncidentDetailsModal] = useState(false);
const [selectedIncident, setSelectedIncident] = useState(null);
const [showAssignTaskModal, setShowAssignTaskModal] = useState(false);
const [incidentTaskForm, setIncidentTaskForm] = useState({
  incidentId: '',
  assigneeId: '',
  dueDate: '',
  dueTime: '',
  description: ''
});

// Modal states for task assignment
const [showTaskModal, setShowTaskModal] = useState(false);
const [newTask, setNewTask] = useState({
  assetId: '',
  assigneeId: '',
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  dueTime: '',
  taskType: 'predefined',
  status: 'pending'
});


  // Helper function to get maintenance status
  const getMaintenanceStatus = (schedule) => {
    if (!schedule) return null;
    
    const now = new Date();
    const dueDate = new Date(schedule.dueDateTime);
    
    if (schedule.status === 'completed' || schedule.status === 'failed') {
      return schedule.status;
    }
    
    if (now > dueDate) {
      return 'overdue';
    }
    
    return schedule.status;
  };

  // Sample hardcoded data for visualization with maintenance schedules

const handleViewIncidentDetails = (incident) => {
  setPreviousAsset(selectedAsset); // Store the current asset
  setSelectedIncident(incident);
  setSelectedAsset(null); // Close the Asset Details modal
  setShowIncidentDetailsModal(true);
};

const handleAssignIncidentTask = () => {
  setIncidentTaskForm({
    ...incidentTaskForm,
    incidentId: parseInt(selectedIncident.id.replace('INC-', ''))  // Extract numeric part
  });
  setShowIncidentDetailsModal(false);
  setShowAssignTaskModal(true);
  // Don't reset previousAsset here so user can return to asset details later
};

const handleDismissIncident = async () => {
  if (selectedIncident && previousAsset) {
    try {
      // Update in database
      await assetService.updateIncidentStatus(selectedIncident.id, 'Dismissed');
      
      // Refresh assets to get updated data
      await fetchAssets();
      
      setShowIncidentDetailsModal(false);
      setSelectedAsset(null);
      setPreviousAsset(null);
      
      alert('Incident dismissed successfully!');
    } catch (err) {
      console.error('Error dismissing incident:', err);
      alert('Failed to dismiss incident. Please try again.');
    }
  }
};
const handleSubmitIncidentTask = async () => {
  if (incidentTaskForm.assigneeId && incidentTaskForm.dueDate && previousAsset) {  // ADD previousAsset check
    try {
      const assignedPersonnel = personnel.find(p => p.id === incidentTaskForm.assigneeId);
      
      // Use previousAsset instead of selectedAsset
      const assetId = previousAsset.id;
      
      // Map severity to priority
      const severityToPriority = {
        'Critical': 'high',
        'Major': 'high',
        'Minor': 'low'
      };
      
      const priority = severityToPriority[selectedIncident.severity] || 'medium';
      
      // Create the maintenance task via API
      const taskData = {
        assetId: assetId,
        title: `${selectedIncident.type} - ${selectedIncident.severity} Priority`,
        description: incidentTaskForm.description || selectedIncident.description,
        assigneeId: incidentTaskForm.assigneeId,
        priority: priority,
        dueDate: incidentTaskForm.dueDate,
        dueTime: incidentTaskForm.dueTime || '09:00',
        taskType: 'custom',
        status: 'pending',
         incidentId: parseInt(selectedIncident.id.replace('INC-', ''))
      };
      
      await assetService.createMaintenanceTask(taskData);
      
      // Update incident status to "Assigned to Task"
      await assetService.updateIncidentStatus(selectedIncident.id, 'Assigned');
      
      // Refresh assets
      await fetchAssets();
      
      
      setShowAssignTaskModal(false);
      setIncidentTaskForm({ incidentId: '', assigneeId: '', dueDate: '', dueTime: '', description: '' });
      setPreviousAsset(null);
      
      alert(`Maintenance task assigned to ${assignedPersonnel.name}!`);
      
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Failed to assign task: ' + err.message);
    }
  } else {
    alert('Please fill in required fields.');
  }
};

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
const fetchPersonnel = async () => {
  try {
    const data = await assetService.fetchUsers();
    setPersonnel(data);
  } catch (err) {
    console.error('Error fetching personnel:', err);
  }
};

useEffect(() => {
  fetchAssets();
  fetchPersonnel();
  fetchCategories();
}, []);

  // State for editing
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editingAsset, setEditingAsset] = useState(null);

  // Filtered assets
  const filteredAssets = assets.filter(
    (asset) =>
      (asset.name?.toLowerCase().includes(search.toLowerCase()) ||
        asset.id?.toLowerCase().includes(search.toLowerCase())) &&
      (statusFilter === "" || asset.status === statusFilter) &&
      (categoryFilter === "" || asset.category === categoryFilter)
  );

const handleUpdateAsset = async () => {
  if (editingAsset) {
    try {
      const updatedAsset = await assetService.updateAsset(editingAsset.id, editingAsset);
      
      const updatedAssets = assets.map(asset => 
        asset.id === editingAsset.id ? updatedAsset : asset
      );
      setAssets(updatedAssets);
      
      setIsEditing(false);
      setSelectedAsset(updatedAsset);
      setEditingAsset(null);
      
      alert('Asset updated successfully!');
    } catch (err) {
      console.error('Error updating asset:', err);
      alert('Failed to update asset. Please try again.');
    }
  }
};
  
// Handle next maintenance scheduling
const handleScheduleNextMaintenance = async () => {
  if (nextMaintenanceSchedule.scheduledDate && nextMaintenanceSchedule.assigneeId) {
    try {
      await assetService.scheduleMaintenanceTask(nextMaintenanceSchedule);
      
      // Refresh assets to get updated data
      await fetchAssets();
      
      setShowMaintenanceScheduleModal(false);
      alert('Next maintenance scheduled successfully!');
      
      // Reset form
      setNextMaintenanceSchedule({
        assetId: '',
        assigneeId: '',
        scheduledDate: '',
        scheduledTime: '',
        repeat: 'none'
      });
      
    } catch (err) {
      console.error('Error scheduling maintenance:', err);
      alert('Failed to schedule maintenance. Please try again.');
    }
  } else {
    alert('Please fill in the required fields.');
  }
};

// Handle manual asset addition
const handleAddAsset = async () => {
  if (newAsset.name && newAsset.category && newAsset.location) {
    try {
      const asset = await assetService.addAsset(newAsset);
      setAssets(prevAssets => [...prevAssets, asset]);
      setShowAddAssetModal(false);
      
      // Reset form
      setNewAsset({
        name: '',
        category: 'HVAC Equipment',
        location: '',
        status: 'Operational',
        acquisitionDate: '',
        nextMaintenance: '',
        task: ''
      });
      
      alert('Asset added successfully!');
    } catch (err) {
      console.error('Error adding asset:', err);
      alert('Failed to add asset. Please try again.');
    }
  } else {
    alert('Please fill in all required fields.');
  }
};

// Handle CSV file selection
const handleCsvFileChange = (event) => {
  const file = event.target.files[0];
  if (file && file.type === 'text/csv') {
    setCsvFile(file);
    
    // Preview CSV content
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const preview = lines.slice(0, 6); // Show first 5 rows + header
      setCsvPreview(preview.map(line => line.split(',')));
    };
    reader.readAsText(file);
  } else {
    alert('Please select a valid CSV file.');
  }
};

const handleBulkUpload = async () => {
  if (!csvFile) {
    alert('Please select a CSV file first.');
    return;
  }
  
  try {
    const text = await csvFile.text();
    const lines = text.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const newAssets = [];
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        
        // Get category value
        let categoryValue = values[headers.indexOf('category')] || values[1] || '';
        
        // Check if category exists (case-insensitive comparison)
        const matchedCategory = categories.find(c => 
          c.category_name.toLowerCase().trim() === categoryValue.toLowerCase().trim()
        );
        
        if (!matchedCategory && categoryValue) {
          console.error(`Category not found: "${categoryValue}"`);
          console.log('Available categories:', categories.map(c => c.category_name));
          alert(`Error: Category "${categoryValue}" not found in database.\n\nAvailable categories:\n${categories.map(c => c.category_name).join('\n')}`);
          return; // Stop upload
        }
        
        const asset = {
          name: values[headers.indexOf('name')] || values[0],
          category: matchedCategory ? matchedCategory.category_name : 'HVAC Equipment', // Use matched or default
          location: values[headers.indexOf('location')] || values[2],
          status: values[headers.indexOf('status')] || values[3] || 'Operational',
          acquisitionDate: values[headers.indexOf('acquisitionDate')] || values[4] || ''
        };
        newAssets.push(asset);
      }
    }
    
    // Upload one by one with better error handling
    let successCount = 0;
    let failCount = 0;
    
    for (const asset of newAssets) {
      try {
        await assetService.addAsset(asset);
        successCount++;
        console.log('✓ Uploaded:', asset.name);
      } catch (uploadErr) {
        failCount++;
        console.error('✗ Failed:', asset.name, uploadErr.message);
      }
    }
    
    await fetchAssets();
    
    setShowBulkUploadModal(false);
    setCsvFile(null);
    setCsvPreview([]);
    
    alert(`Upload complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    
  } catch (err) {
    console.error('CSV Upload Error:', err);
    alert('Failed to upload CSV: ' + err.message);
  }
};

// Add this function with the other handlers (around line 280)
const handleDownloadTemplate = () => {
  // Use first available category or fallback
  const sampleCategory = categories.length > 0 
    ? categories[0].category_name 
    : 'HVAC Equipment';
  
  const templateHeaders = ['name', 'category', 'location', 'status', 'acquisitionDate'];
  const sampleRow = ['Sample Asset Name', sampleCategory, 'Building A - Room 101', 'Operational', '2024-01-15'];
  
  const csvContent = [
    templateHeaders.join(','),
    sampleRow.join(',')
  ].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', 'asset_upload_template.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
// Handle export to CSV
const handleExportReport = () => {
  try {
    // Prepare CSV headers
    const headers = [
      'Asset ID',
      'Asset Name/Code', 
      'Category',
      'Location',
      'Status',
      'Acquisition Date',
      'Last Maintenance',
      'Next Maintenance',
      'Task',
      'Assigned Personnel',
      'Remarks Count'
    ];
    
    // Prepare CSV data
    const csvData = [
      headers.join(','),
      ...filteredAssets.map(asset => [
        asset.id,
        `"${asset.name}"`,
        `"${asset.category}"`,
        `"${asset.location}"`,
        asset.status,
        asset.acquisitionDate || '',
        asset.lastMaintenance || '',
        asset.nextMaintenance || '',
        `"${asset.task || ''}"`,
        asset.nextMaintenanceAssigned || '',
        asset.remarks?.length || 0
      ].join(','))
    ].join('\n');
    
    // Create and download file
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `assets_report_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
  } catch (err) {
    console.error('Error exporting report:', err);
    alert('Failed to export report. Please try again.');
  }
};

  const handleStartEdit = () => {
    setIsEditing(true);
    setEditingAsset({...selectedAsset});
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingAsset(null);
  };
  // Handle task creation and auto-update asset status
const handleCreateTask = async () => {
  if (newTask.title && newTask.assetId && newTask.assigneeId) {
    try {
      await assetService.createMaintenanceTask(newTask);
      
      // Refresh assets to get updated status
      await fetchAssets();
      
      // Reset form
      setNewTask({
        assetId: '',
        assigneeId: '',
        title: '',
        description: '',
        priority: 'medium',
        dueDate: '',
        dueTime: '',
        taskType: 'predefined',
        status: 'pending'
      });
      
      setShowTaskModal(false);
      alert('Task assigned successfully!');
      
    } catch (err) {
      console.error('Error creating task:', err);
      alert('Failed to create task. Please try again.');
    }
  } else {
    alert('Please fill in all required fields.');
  }
};


  // Get status badge variant for maintenance schedule
  const getStatusBadgeVariant = (status) => {
    switch(status) {
      case 'pending': return 'secondary';
      case 'in progress': return 'primary';
      case 'completed': return 'success';
      case 'failed': return 'danger';
      case 'overdue': return 'warning';
      default: return 'secondary';
    }
  };

  // Format date and time
  const formatDateTime = (dateTime) => {
    return new Date(dateTime).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Show loading state
  if (loading) {
    return (
      <SidebarLayout role="admin">
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
      <SidebarLayout role="admin">
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
    <SidebarLayout role="admin">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Asset Management</h3>
            <p className="text-muted mb-0">Manage and oversee all company assets</p>
          </div>
          <div className="d-flex gap-2">

  <Button 
    variant="primary"
    onClick={() => setShowTaskModal(true)}
  >
    <i className="fas fa-plus me-2"></i>
    Assign Task
  </Button>

    <Button 
  variant="outline-success"
  onClick={handleExportReport}
>

  Export CSV
</Button>

 <Dropdown>
  <Dropdown.Toggle variant="outline-primary">
    <i className="fas fa-plus me-2"></i>
    Add New Asset
  </Dropdown.Toggle>
  <Dropdown.Menu>
    <Dropdown.Item onClick={() => setShowAddAssetModal(true)}>
      <i className="fas fa-plus me-2"></i>Manual Entry
    </Dropdown.Item>
    <Dropdown.Item onClick={() => setShowBulkUploadModal(true)}>
      <i className="fas fa-upload me-2"></i>Bulk Upload (CSV)
    </Dropdown.Item>
  </Dropdown.Menu>
</Dropdown>
  {/* Add Asset Modal */}
<Modal show={showAddAssetModal} onHide={() => setShowAddAssetModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Add New Asset</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Row className="g-3">
      <Col md={6}>
        <Form.Group>
          <Form.Label>Asset Name/Code *</Form.Label>
          <Form.Control
            type="text"
            value={newAsset.name}
            onChange={(e) => setNewAsset({...newAsset, name: e.target.value})}
            placeholder="Enter asset name"
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Category *</Form.Label>
<Form.Select
  value={newAsset.category}
  onChange={(e) => setNewAsset({...newAsset, category: e.target.value})}
  required
>
  <option value="">Select Category</option>
  {categories.map(cat => (
    <option key={cat.category_id} value={cat.category_name}>
      {cat.category_name}
    </option>
  ))}
</Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Location *</Form.Label>
          <Form.Control
            type="text"
            value={newAsset.location}
            onChange={(e) => setNewAsset({...newAsset, location: e.target.value})}
            placeholder="Enter asset location"
            required
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Status</Form.Label>
          <Form.Select
            value={newAsset.status}
            onChange={(e) => setNewAsset({...newAsset, status: e.target.value})}
          >
            <option value="Operational">Operational</option>
            <option value="Under Maintenance">Under Maintenance</option>
            <option value="Retired">Retired</option>
          </Form.Select>
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Acquisition Date</Form.Label>
          <Form.Control
            type="date"
            value={newAsset.acquisitionDate}
            onChange={(e) => setNewAsset({...newAsset, acquisitionDate: e.target.value})}
          />
        </Form.Group>
      </Col>
      <Col md={6}>
        <Form.Group>
          <Form.Label>Next Maintenance Date</Form.Label>
          <Form.Control
            type="date"
            value={newAsset.nextMaintenance}
            onChange={(e) => setNewAsset({...newAsset, nextMaintenance: e.target.value})}
          />
        </Form.Group>
      </Col>
      <Col xs={12}>
        <Form.Group>
          <Form.Label>Task/Notes</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            value={newAsset.task}
            onChange={(e) => setNewAsset({...newAsset, task: e.target.value})}
            placeholder="Enter any initial tasks or notes"
          />
        </Form.Group>
      </Col>
    </Row>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowAddAssetModal(false)}>
      Cancel
    </Button>
    <Button variant="primary" onClick={handleAddAsset}>
      <i className="fas fa-plus me-2"></i>
      Add Asset
    </Button>
  </Modal.Footer>
</Modal>

{/* Bulk Upload Modal */}
<Modal show={showBulkUploadModal} onHide={() => {
  setShowBulkUploadModal(false);
  setCsvFile(null);
  setCsvPreview([]);
}} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>Bulk Upload Assets (CSV)</Modal.Title>
  </Modal.Header>

  <Modal.Body>

   <Alert variant="info">
  <div className="d-flex justify-content-between align-items-center">
    <div>
      <strong>CSV Format:</strong> name, category, location, status, acquisitionDate
      <br />
      <small>Header row should match these column names (case sensitive)</small>
    </div>
    <Button 
      variant="outline-primary" 
      size="sm"
      onClick={handleDownloadTemplate}
    >
      <i className="fas fa-download me-2"></i>
      Download Template
    </Button>
  </div>
</Alert>
    
    <Form.Group className="mb-3">
      <Form.Label>Select CSV File</Form.Label>
      <Form.Control
        type="file"
        accept=".csv"
        onChange={handleCsvFileChange}
      />
    </Form.Group>
    
    {csvPreview.length > 0 && (
      <div>
        <h6>Preview:</h6>
        <Table bordered size="sm">
          <tbody>
            {csvPreview.map((row, index) => (
              <tr key={index}>
                {row.map((cell, cellIndex) => (
                  <td key={cellIndex} className={index === 0 ? 'fw-bold bg-light' : ''}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </Table>
      </div>
    )}
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowBulkUploadModal(false)}>
      Cancel
    </Button>
    <Button 
      variant="primary" 
      onClick={handleBulkUpload}
      disabled={!csvFile}
    >
      <i className="fas fa-upload me-2"></i>
      Upload Assets
    </Button>
  </Modal.Footer>
</Modal>
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
              filteredAssets.map((asset) => {
               return (
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
  {asset.hasFailedMaintenance && asset.status !== 'Operational' && (
    <div className="d-flex align-items-center mt-1">
      <span className="text-danger" style={{ fontSize: '0.7rem' }}>
        ▲
      </span>
      <small className="text-danger ms-1" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
        FAILED MAINTENANCE ({asset.failedMaintenanceCount})
      </small>
    </div>
  )}
  {asset.incidentReports && asset.incidentReports.length > 0 && (
    <div className="d-flex align-items-center mt-1">
      <i className="fas fa-exclamation-circle text-danger" style={{ fontSize: '0.7rem' }}></i>
      <small className="text-danger ms-1" style={{ fontSize: '0.7rem', fontWeight: '500' }}>
        {asset.incidentReports.length} INCIDENT REPORT{asset.incidentReports.length > 1 ? 'S' : ''}
      </small>
    </div>
  )}
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
                );
              })
            ) : (
              <tr>
                <td colSpan="6" className="text-center text-muted py-4">
                  {assets.length === 0 
                    ? `No assets available. Add new assets to get started.`
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
              Add assets to the system to start managing your organization's inventory. 
              Assets can be tracked, maintained, and monitored from this interface.
            </p>
          </Alert>
        )}

        {/* Detailed Asset Modal */}
        <Modal
          show={!!selectedAsset}
          onHide={() => {
            setSelectedAsset(null);
            setIsEditing(false);
            setEditingAsset(null);
          }}
          size="xl"
        >
          {selectedAsset && (
            <>
              <Modal.Header closeButton>
                <Modal.Title>
                  {isEditing ? 'Edit Asset Details' : 'Asset Details'}
                </Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Row>
                  {/* Left Column - Asset Information */}
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
                    {!isEditing ? (
                      // View Mode
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
    <div className="d-flex justify-content-between align-items-center mb-2">
      <Form.Label className="mb-0"><strong>Next Maintenance:</strong></Form.Label>
      <Button 
        variant="outline-primary" 
        size="sm"
        onClick={() => {
          setNextMaintenanceSchedule({
            assetId: selectedAsset.id,
            assigneeId: '',
            scheduledDate: '',
            scheduledTime: '',
            repeat: 'none'
          });
          setShowMaintenanceScheduleModal(true);
        }}
      >
        <i className="fas fa-calendar-plus me-1"></i>
        Schedule
      </Button>
    </div>
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
                    ) : (
                      // Edit Mode
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Asset Name/Code *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editingAsset.name}
                              onChange={(e) => setEditingAsset({...editingAsset, name: e.target.value})}
                              required
                            />
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Category *</Form.Label>
                        <Form.Select
  value={editingAsset.category}
  onChange={(e) => setEditingAsset({...editingAsset, category: e.target.value})}
  required
>
  <option value="">Select Category</option>
  {categories.map(cat => (
    <option key={cat.category_id} value={cat.category_name}>
      {cat.category_name}
    </option>
  ))}
</Form.Select>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Status *</Form.Label>
                            <Form.Select
                              value={editingAsset.status}
                              onChange={(e) => setEditingAsset({...editingAsset, status: e.target.value})}
                              required
                            >
                              <option value="Operational">Operational</option>
                              <option value="Under Maintenance">Under Maintenance</option>
                              <option value="Retired">Retired</option>
                            </Form.Select>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Location *</Form.Label>
                            <Form.Control 
                              type="text" 
                              value={editingAsset.location}
                              onChange={(e) => setEditingAsset({...editingAsset, location: e.target.value})}
                              required
                            />
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Acquisition Date</Form.Label>
                            <Form.Control 
                              type="date" 
                              value={editingAsset.acquisitionDate}
                              onChange={(e) => setEditingAsset({...editingAsset, acquisitionDate: e.target.value})}
                            />
                          </Form.Group>
                        </div>
                       <div className="col-md-4">
  <Form.Group>
    <Form.Label>Next Maintenance Date</Form.Label>
    <Form.Control 
      type="date" 
      value={editingAsset.nextMaintenance || ''}
      onChange={(e) => setEditingAsset({...editingAsset, nextMaintenance: e.target.value})}
    />
  </Form.Group>
</div>
<div className="col-md-4">
  <Form.Group>
    <Form.Label>Next Maintenance Time</Form.Label>
    <Form.Control 
      type="time" 
      value={editingAsset.nextMaintenanceTime || ''}
      onChange={(e) => setEditingAsset({...editingAsset, nextMaintenanceTime: e.target.value})}
    />
  </Form.Group>
</div>
<div className="col-md-4">
  <Form.Group>
    <Form.Label>Repeat Schedule</Form.Label>
    <Form.Select
      value={editingAsset.nextMaintenanceRepeat || 'none'}
      onChange={(e) => setEditingAsset({...editingAsset, nextMaintenanceRepeat: e.target.value})}
    >
      <option value="none">No Repeat</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
      <option value="custom">Custom</option>
    </Form.Select>
  </Form.Group>
</div>
                      </div>
                    )}


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
                    
                    {/* Maintenance Schedule Section - Only show for Under Maintenance assets */}
                    {selectedAsset.status === 'Under Maintenance' && selectedAsset.maintenanceSchedule && (
                      <Card className="mt-4">
                        <Card.Header className="bg-warning text-dark">
                          <h6 className="mb-0">
                            <i className="fas fa-tools me-2"></i>
                            Current Maintenance Schedule
                          </h6>
                        </Card.Header>
                        <Card.Body>
                          <Row>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Task Description:</strong>
                                <p className="mb-1">{selectedAsset.maintenanceSchedule.taskDescription}</p>
                              </div>
                              <div className="mb-3">
                                <strong>Assigned Personnel:</strong>
                                <p className="mb-1">
                                  <Badge bg="info" className="me-2">
                                    {selectedAsset.maintenanceSchedule.assignedPersonnelName}
                                  </Badge>
                                </p>
                              </div>
                              <div className="mb-3">
                                <strong>Current Status:</strong>
                                <p className="mb-1">
                                  <Badge bg={getStatusBadgeVariant(getMaintenanceStatus(selectedAsset.maintenanceSchedule))}>
                                    {getMaintenanceStatus(selectedAsset.maintenanceSchedule)?.charAt(0).toUpperCase() + 
                                     getMaintenanceStatus(selectedAsset.maintenanceSchedule)?.slice(1)}
                                  </Badge>
                                </p>
                              </div>
                            </Col>
                            <Col md={6}>
                              <div className="mb-3">
                                <strong>Scheduled Date & Time:</strong>
                                <p className="mb-1">{formatDateTime(selectedAsset.maintenanceSchedule.scheduledDateTime)}</p>
                              </div>
                              <div className="mb-3">
                                <strong>Due Date & Time:</strong>
                                <p className="mb-1 text-danger">{formatDateTime(selectedAsset.maintenanceSchedule.dueDateTime)}</p>
                              </div>
                              <div className="mb-3">
                                <strong>Started At:</strong>
                                <p className="mb-1">
                                  {selectedAsset.maintenanceSchedule.startedAt 
                                    ? formatDateTime(selectedAsset.maintenanceSchedule.startedAt)
                                    : 'Not started yet'}
                                </p>
                              </div>
                            </Col>
                          </Row>
                          
                          {selectedAsset.maintenanceSchedule.comments && (
                            <div className="mt-3">
                              <strong>Latest Comments:</strong>
                              <div className="bg-light p-3 rounded mt-2">
                                <p className="mb-0">{selectedAsset.maintenanceSchedule.comments}</p>
                              </div>
                            </div>
                          )}

              
                        </Card.Body>
                      </Card>
                    )}
                  </Col>

                 {/* Right Column - Incident Reports Panel */}
{/* Right Column - Incident Reports Panel */}
<Col lg={4}>
  <div className="h-100 border-start ps-4">
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h6 className="mb-0">
        <i className="fas fa-exclamation-triangle me-2 text-warning"></i>
        Incident Reports
      </h6>
      {selectedAsset.incidentReports?.length > 0 && (
        <Badge bg="danger">{selectedAsset.incidentReports.length}</Badge>
      )}
    </div>
    
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {selectedAsset.incidentReports?.length > 0 ? (
       selectedAsset.incidentReports.map((incident, index) => (
  <div key={index} className="mb-3 p-3 border rounded shadow-sm bg-white">
            <div className="d-flex justify-content-between align-items-start mb-2">
              <div>
                <strong className="text-danger">{incident.reportedBy}</strong>
                <div>
                  <small className="text-muted">
                    {new Date(incident.reportedAt).toLocaleDateString()}
                  </small>
                </div>
              </div>
              <div className="text-end">
                <Badge bg={incident.status === 'Open' ? 'danger' : incident.status === 'Assigned to Task' ? 'warning' : 'secondary'}>
                  {incident.status}
                </Badge>
              </div>
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
            
            <p className="small mb-3 text-muted">
              {incident.description.length > 80 
                ? `${incident.description.substring(0, 80)}...` 
                : incident.description
              }
            </p>
            
            <Button 
              size="sm" 
              variant="outline-primary"
              onClick={() => handleViewIncidentDetails(incident)}
              className="w-100"
            >
              View Details
            </Button>
          </div>
        ))
     ) : (
  <div className="text-center text-muted py-5">
    <i className="fas fa-clipboard-check fa-3x mb-3 opacity-25"></i>
    <p className="mb-0">No incident reports</p>
    <small>All clear!</small>
  </div>
)}
    </div>
  </div>
</Col>


                </Row>
              </Modal.Body>
              <Modal.Footer>
                {!isEditing ? (
                  <>
                    <Button variant="primary" onClick={handleStartEdit}>
                      <i className="fas fa-edit me-2"></i>
                      Edit Asset
                    </Button>
                    <Button variant="secondary" onClick={() => setSelectedAsset(null)}>
                      Close
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="success" onClick={handleUpdateAsset}>
                      <i className="fas fa-save me-2"></i>
                      Save Changes
                    </Button>
                    <Button variant="secondary" onClick={handleCancelEdit}>
                      Cancel
                    </Button>
                  </>
                )}
              </Modal.Footer>
            </>
          )}
        </Modal>
      </Container>
      {/* Task Assignment Modal */}
{showTaskModal && (
  <Modal show={showTaskModal} onHide={() => setShowTaskModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>Assign New Task</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Row className="g-3">
        <Col md={6}>
          <Form.Group>
            <Form.Label>Select Asset *</Form.Label>
           <Form.Select
  value={newTask.assetId}
  onChange={(e) => setNewTask({...newTask, assetId: e.target.value})}
  required
>
  <option value="">Select Asset</option>
  {assets.filter(asset => asset.status === 'Operational').length === 0 ? (
    <option disabled>No operational assets available</option>
  ) : (
    assets
      .filter(asset => asset.status === 'Operational')
      .map(asset => (
        <option key={asset.id} value={asset.id}>
          {asset.name} ({asset.id})
        </option>
      ))
  )}
</Form.Select>
<Form.Text className="text-muted">
  {assets.filter(asset => asset.status === 'Operational').length === 0 
    ? 'All assets are currently under maintenance or retired'
    : `Only operational assets can be assigned tasks (${assets.filter(asset => asset.status === 'Operational').length} available)`
  }
</Form.Text>
            <Form.Text className="text-muted">
              Only operational assets can be assigned tasks
            </Form.Text>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Assign To *</Form.Label>
            <Form.Select
              value={newTask.assigneeId}
              onChange={(e) => setNewTask({...newTask, assigneeId: e.target.value})}
              required
            >
              <option value="">Select Personnel</option>
              {personnel.map(person => (
                <option key={person.id} value={person.id}>{person.name} - {person.department}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col xs={12}>
          <div className="d-flex gap-3 mb-3">
            <Form.Check
              type="radio"
              id="predefinedTask"
              name="taskType"
              label="Predefined Task"
              value="predefined"
              checked={newTask.taskType === 'predefined'}
              onChange={(e) => setNewTask({...newTask, taskType: e.target.value})}
            />
            <Form.Check
              type="radio"
              id="customTask"
              name="taskType"
              label="Custom Task"
              value="custom"
              checked={newTask.taskType === 'custom'}
              onChange={(e) => setNewTask({...newTask, taskType: e.target.value})}
            />
          </div>
        </Col>
        {newTask.taskType === 'predefined' ? (
          <Col xs={12}>
            <Form.Group>
              <Form.Label>Select Task *</Form.Label>
              <Form.Select
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                required
              >
                <option value="">Choose a task</option>
                {predefinedTasks.map(task => (
                  <option key={task} value={task}>{task}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        ) : (
          <Col xs={12}>
            <Form.Group>
              <Form.Label>Task Title *</Form.Label>
              <Form.Control
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                placeholder="Enter custom task title"
                required
              />
            </Form.Group>
          </Col>
        )}
        <Col xs={12}>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={newTask.description}
              onChange={(e) => setNewTask({...newTask, description: e.target.value})}
              placeholder="Enter task description"
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Priority</Form.Label>
            <Form.Select
              value={newTask.priority}
              onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Due Date *</Form.Label>
            <Form.Control
              type="date"
              value={newTask.dueDate}
              onChange={(e) => setNewTask({...newTask, dueDate: e.target.value})}
              required
            />
          </Form.Group>
        </Col>
        <Col md={4}>
          <Form.Group>
            <Form.Label>Due Time</Form.Label>
            <Form.Control
              type="time"
              value={newTask.dueTime}
              onChange={(e) => setNewTask({...newTask, dueTime: e.target.value})}
            />
          </Form.Group>
        </Col>
      </Row>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleCreateTask}>
        <i className="fas fa-plus me-2"></i>
        Assign Task
      </Button>
    </Modal.Footer>
  </Modal>
)}


{/* Next Maintenance Schedule Modal */}
{showMaintenanceScheduleModal && (
  <Modal show={showMaintenanceScheduleModal} onHide={() => setShowMaintenanceScheduleModal(false)} size="md">
    <Modal.Header closeButton>
      <Modal.Title>Schedule Next Maintenance</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <Row className="g-3">
        <Col xs={12}>
          <Alert variant="info">
            <strong>Asset:</strong> {assets.find(a => a.id === nextMaintenanceSchedule.assetId)?.name}
          </Alert>
        </Col>
        <Col xs={12}>
          <Form.Group>
            <Form.Label>Assign To *</Form.Label>
            <Form.Select
              value={nextMaintenanceSchedule.assigneeId}
              onChange={(e) => setNextMaintenanceSchedule({...nextMaintenanceSchedule, assigneeId: e.target.value})}
              required
            >
              <option value="">Select Personnel</option>
              {personnel.map(person => (
                <option key={person.id} value={person.id}>{person.name} - {person.department}</option>
              ))}
            </Form.Select>
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Scheduled Date *</Form.Label>
            <Form.Control
              type="date"
              value={nextMaintenanceSchedule.scheduledDate}
              onChange={(e) => setNextMaintenanceSchedule({...nextMaintenanceSchedule, scheduledDate: e.target.value})}
              required
            />
          </Form.Group>
        </Col>
        <Col md={6}>
          <Form.Group>
            <Form.Label>Scheduled Time</Form.Label>
            <Form.Control
              type="time"
              value={nextMaintenanceSchedule.scheduledTime}
              onChange={(e) => setNextMaintenanceSchedule({...nextMaintenanceSchedule, scheduledTime: e.target.value})}
            />
          </Form.Group>
        </Col>
        <Col xs={12}>
          <Form.Group>
            <Form.Label>Repeat Schedule</Form.Label>
            <Form.Select
              value={nextMaintenanceSchedule.repeat}
              onChange={(e) => setNextMaintenanceSchedule({...nextMaintenanceSchedule, repeat: e.target.value})}
            >
              <option value="none">No Repeat</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom Interval</option>
            </Form.Select>
          </Form.Group>
        </Col>
        {nextMaintenanceSchedule.repeat === 'custom' && (
          <Col xs={12}>
            <Alert variant="warning">
              <small><strong>Note:</strong> Custom interval settings will be configured after saving this schedule.</small>
            </Alert>
          </Col>
        )}
        {nextMaintenanceSchedule.repeat !== 'none' && (
          <Col xs={12}>
            <Alert variant="success">
              <small><i className="fas fa-bell me-1"></i> Notifications will be sent to admin and assigned personnel based on the repeat schedule.</small>
            </Alert>
          </Col>
        )}
      </Row>
    </Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={() => setShowMaintenanceScheduleModal(false)}>
        Cancel
      </Button>
      <Button variant="primary" onClick={handleScheduleNextMaintenance}>
        <i className="fas fa-calendar-check me-2"></i>
        Schedule Maintenance
      </Button>
    </Modal.Footer>
  </Modal>
)}

{/* Incident Details Modal */}
<Modal show={showIncidentDetailsModal} onHide={() => setShowIncidentDetailsModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Incident Report Details</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedIncident && (
      <>
        <Row className="mb-3">
          <Col md={6}>
            <strong>Incident ID:</strong>
            <p>{selectedIncident.id}</p>
          </Col>
          <Col md={6}>
            <strong>Status:</strong>
            <Badge bg={selectedIncident.status === 'Open' ? 'danger' : selectedIncident.status === 'Assigned to Task' ? 'warning' : 'secondary'}>
              {selectedIncident.status}
            </Badge>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={6}>
            <strong>Reported By:</strong>
            <p>{selectedIncident.reportedBy}</p>
          </Col>
          <Col md={6}>
            <strong>Date Reported:</strong>
            <p>{new Date(selectedIncident.reportedAt).toLocaleString()}</p>
          </Col>
        </Row>
        
        <Row className="mb-3">
          <Col md={6}>
            <strong>Incident Type:</strong>
            <p>{selectedIncident.type}</p>
          </Col>
          <Col md={6}>
            <strong>Severity:</strong>
            <span className={`badge ${
              selectedIncident.severity === 'High' ? 'bg-danger' :
              selectedIncident.severity === 'Medium' ? 'bg-warning' : 'bg-info'
            }`}>
              {selectedIncident.severity}
            </span>
          </Col>
        </Row>
        
        <div className="mb-3">
          <strong>Description:</strong>
          <div className="border rounded p-3 bg-light mt-2">
            {selectedIncident.description}
          </div>
        </div>
        
        {selectedIncident.assignedTaskId && (
          <Alert variant="info">
            <strong>Task Assigned:</strong> This incident has been assigned to maintenance task #{selectedIncident.assignedTaskId}
          </Alert>
        )}
      </>
    )}
  </Modal.Body>
<Modal.Footer>
  <Button variant="outline-secondary" onClick={() => {
    setShowIncidentDetailsModal(false);
    setSelectedAsset(previousAsset);
    setPreviousAsset(null);
  }}>
    <i className="fas fa-arrow-left me-2"></i>
    Back to Asset Details
  </Button>
  <Button variant="secondary" onClick={() => {
    setShowIncidentDetailsModal(false);
    setPreviousAsset(null);
  }}>
    Close
  </Button>
  {(selectedIncident?.status === 'Reported' || selectedIncident?.status === 'Open') && (
    <>
      <Button variant="warning" onClick={handleAssignIncidentTask}>
        <i className="fas fa-tasks me-2"></i>
        Assign as Maintenance Task
      </Button>
      <Button variant="outline-danger" onClick={handleDismissIncident}>
        <i className="fas fa-times me-2"></i>
        Dismiss Incident
      </Button>
    </>
  )}
</Modal.Footer>
</Modal>

{/* Assign Incident Task Modal */}
<Modal show={showAssignTaskModal} onHide={() => setShowAssignTaskModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>Assign Maintenance Task from Incident</Modal.Title>
  </Modal.Header>
  <Modal.Body>
      {/* DEBUG INFO - Remove after fixing */}
  <div className="alert alert-info">
    <strong>Debug Info:</strong><br/>
    Total Assets: {assets.length}<br/>
    Operational Assets: {assets.filter(a => a.status === 'Operational').length}<br/>
    Total Personnel: {personnel.length}
  </div>

    {selectedIncident && (
      <>
        <Alert variant="info">
          <strong>Creating task for incident:</strong> {selectedIncident.type} - {selectedIncident.severity} Priority
        </Alert>
        
        <Row className="g-3">
          <Col xs={12}>
            <Form.Group>
              <Form.Label>Assign To *</Form.Label>
              <Form.Select
                value={incidentTaskForm.assigneeId}
                onChange={(e) => setIncidentTaskForm({...incidentTaskForm, assigneeId: e.target.value})}
                required
              >
                <option value="">Select Personnel</option>
                {personnel.map(person => (
                  <option key={person.id} value={person.id}>{person.name} - {person.department}</option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Due Date *</Form.Label>
              <Form.Control
                type="date"
                value={incidentTaskForm.dueDate}
                onChange={(e) => setIncidentTaskForm({...incidentTaskForm, dueDate: e.target.value})}
                required
              />
            </Form.Group>
          </Col>
          
          <Col md={6}>
            <Form.Group>
              <Form.Label>Due Time</Form.Label>
              <Form.Control
                type="time"
                value={incidentTaskForm.dueTime}
                onChange={(e) => setIncidentTaskForm({...incidentTaskForm, dueTime: e.target.value})}
              />
            </Form.Group>
          </Col>
          
          <Col xs={12}>
            <Form.Group>
              <Form.Label>Additional Instructions</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={incidentTaskForm.description}
                onChange={(e) => setIncidentTaskForm({...incidentTaskForm, description: e.target.value})}
                placeholder="Add any additional instructions for the maintenance task..."
              />
              <Form.Text className="text-muted">
                Default: {selectedIncident.description}
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>
      </>
    )}
  </Modal.Body>
  <Modal.Footer>
<Button variant="secondary" onClick={() => {
  setShowBulkUploadModal(false);
  setCsvFile(null);
  setCsvPreview([]);
}}>
  Cancel
</Button>
    <Button variant="primary" onClick={handleSubmitIncidentTask}>
      <i className="fas fa-tasks me-2"></i>
      Assign Task
    </Button>
  </Modal.Footer>
</Modal>

    </SidebarLayout>
  );
}