// src/dashboards/AdminNav/AssetManagement.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { useNavigate } from "react-router-dom";
import { assetService } from '../../services/assetService';
import { logActivity } from '../../utils/ActivityLogger';
import { AuthUtils } from '../../utils/AuthUtils';
import { supabase } from '../../supabaseClient';  // ← Make sure this line exists
import { AuditLogger } from '../../utils/AuditLogger';
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
  const navigate = useNavigate(); 
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

// Modal states for task assignment
const [showTaskModal, setShowTaskModal] = useState(false);
const [showMaintenanceHistoryModal, setShowMaintenanceHistoryModal] = useState(false);  
const [showCombinedHistoryModal, setShowCombinedHistoryModal] = useState(false);
const [historyAsset, setHistoryAsset] = useState(null);
const [showIncidentHistoryModal, setShowIncidentHistoryModal] = useState(false);      
const [newTask, setNewTask] = useState({
  assetId: '',
  assigneeId: '',
  title: '',
  description: '',
  priority: 'medium',
  dueDate: '',
  dueTime: '',
  taskType: 'predefined',
  status: 'pending',
  repeat: 'none'
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

  const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
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
    
    // Transform personnel and add active task count
    const transformedPersonnel = await Promise.all(
      data.map(async (user) => {
        // Check active tasks for this personnel
        const { count: activeTasks } = await supabase
          .from('maintenance_tasks')
          .select('*', { count: 'exact', head: true })
          .eq('assigned_to', user.id)
          .in('status_id', [1, 2]); // Pending or In Progress

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          department: user.department || 'Personnel',
          activeTaskCount: activeTasks || 0
        };
      })
    );
    
    setPersonnel(transformedPersonnel);
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
      // Log activity
await logActivity('update_asset', `Updated asset: ${editingAsset.name} - Status changed to ${editingAsset.status}`);
    } catch (err) {
      console.error('Error updating asset:', err);
      alert('Failed to update asset. Please try again.');
    }
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
      // Log activity
await logActivity('add_asset', `Added asset: ${newAsset.name} in ${newAsset.location}`);
// ✅ ADD: Audit log for asset creation
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      await AuditLogger.logWithIP({
        userId: currentUser.userId,
        actionTaken: `Created new asset: ${asset.name}`,
        tableAffected: 'assets',
        recordId: asset.id,
        organizationId: currentUser.organizationId
      });
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
        console.log('Ã¢Å“â€œ Uploaded:', asset.name);
      } catch (uploadErr) {
        failCount++;
        console.error('Ã¢Å“â€” Failed:', asset.name, uploadErr.message);
      }
    }
    
    await fetchAssets();
    
    setShowBulkUploadModal(false);
    setCsvFile(null);
    setCsvPreview([]);
    
    alert(`Upload complete!\nSuccess: ${successCount}\nFailed: ${failCount}`);
    // Log activity
await logActivity('bulk_add_assets', `Bulk uploaded ${successCount} assets to system`);
// ✅ ADD: Audit log for bulk upload
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    await AuditLogger.logWithIP({
      userId: currentUser.userId,
      actionTaken: `Bulk uploaded ${successCount} assets via CSV`,
      tableAffected: 'assets',
      recordId: 0, // Use 0 for bulk operations
      organizationId: currentUser.organizationId
    });
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
const handleExportReport = async () => {
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
    await logActivity('export_assets_report', `Exported assets report with ${filteredAssets.length} records`);
    
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
  status: 'pending',
  repeat: 'none'  
});
      
      setShowTaskModal(false);
      alert('Task assigned successfully!');
      // Log activity
await logActivity('assign_maintenance_task', `Assigned maintenance task: ${newTask.title} to asset ${newTask.assetId}`);
      
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
  <div className="d-flex align-items-center gap-2">
    {/* Main Status Badge */}
    <span className={`badge ${
      asset.status === 'Operational' ? 'bg-success' :
      asset.status === 'Under Maintenance' ? 'bg-warning' :
      'bg-secondary'
    }`}>
      {asset.status}
    </span>
    
    {/* ✅ IMPROVED: Show failed badge regardless of status */}
    {asset.hasFailedMaintenance && (
      <span 
        className="badge bg-danger" 
        title={`${asset.failedMaintenanceCount} Active Failed Task(s)`}
        style={{ cursor: 'help' }}
      >
        <i className="fas fa-wrench me-1"></i>
        {asset.failedMaintenanceCount}
      </span>
    )}
    
    {/* Incident Badge - Keep as is */}
    {asset.incidentReports && asset.incidentReports.length > 0 && (
      <span 
        className="badge bg-warning text-dark" 
        title={`${asset.incidentReports.length} Unresolved Incident(s)`}
        style={{ cursor: 'help' }}
      >
        <i className="fas fa-exclamation-triangle me-1"></i>
        {asset.incidentReports.length}
      </span>
    )}
  </div>
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
             
<div className="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
  <div className="d-flex gap-2 align-items-center">
    {/* Main Status */}
    <span className={`badge ${
      selectedAsset.status === 'Operational' ? 'bg-success' :
      selectedAsset.status === 'Under Maintenance' ? 'bg-warning' :
      'bg-secondary'
    }`}>
      {selectedAsset.status}
    </span>
    
    {/* ✅ IMPROVED: Show failed badge with better label */}
    {selectedAsset.hasFailedMaintenance && (
      <span className="badge bg-danger">
        <i className="fas fa-wrench me-1"></i>
        {selectedAsset.failedMaintenanceCount} Unresolved Failure{selectedAsset.failedMaintenanceCount > 1 ? 's' : ''}
      </span>
    )}
    
    {/* Incident Badge */}
    {selectedAsset.incidentReports && selectedAsset.incidentReports.length > 0 && (
      <span className="badge bg-warning text-dark">
        <i className="fas fa-exclamation-triangle me-1"></i>
        {selectedAsset.incidentReports.length} Pending Incident{selectedAsset.incidentReports.length > 1 ? 's' : ''}
      </span>
    )}
  </div>
  
<Button 
  size="sm" 
  variant="outline-primary"
  onClick={() => {
    setHistoryAsset(selectedAsset);  // Store current asset
    setSelectedAsset(null);  // Close Asset Details modal
    setShowCombinedHistoryModal(true);  // Open History modal
  }}
>
  <i className="fas fa-history me-2"></i>
  View History
</Button>
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
{/* Active Incidents Section - View Only */}
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
    <Card className="border-warning mb-0">
      <Card.Body className="py-3">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <i className="fas fa-exclamation-circle text-warning me-2"></i>
            <span className="fw-semibold">
              {selectedAsset.incidentReports.length} incident{selectedAsset.incidentReports.length > 1 ? 's' : ''} require{selectedAsset.incidentReports.length === 1 ? 's' : ''} attention
            </span>
          </div>
          <Button 
  variant="outline-warning" 
  size="sm"
  onClick={() => {
    setSelectedAsset(null); // Close the modal
    navigate('/dashboard-admin/MaintenanceTasks'); // Navigate to Maintenance Tasks
  }}
>
  View Details <i className="fas fa-arrow-right ms-1"></i>
</Button>
        </div>
      </Card.Body>
    </Card>
  ) : (
    <div className="text-center py-3 bg-light rounded">
      <i className="fas fa-check-circle fa-2x mb-2 text-success opacity-25"></i>
      <p className="mb-0 small text-muted">No active incidents</p>
    </div>
  )}
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
      <option key={person.id} value={person.id}>
        {person.name} - {person.department} {person.activeTaskCount > 0 ? `(${person.activeTaskCount} active)` : ''}
      </option>
    ))}
  </Form.Select>
  
  {/* ← ADD THIS WARNING BELOW */}
  {newTask.assigneeId && personnel.find(p => p.id === parseInt(newTask.assigneeId))?.activeTaskCount > 0 && (
    <Alert variant="warning" className="mt-2 mb-0">
      <small>
        <i className="fas fa-exclamation-triangle me-1"></i>
        <strong>Note:</strong> {personnel.find(p => p.id === parseInt(newTask.assigneeId))?.name} currently has {personnel.find(p => p.id === parseInt(newTask.assigneeId))?.activeTaskCount} active task(s)
      </small>
    </Alert>
  )}
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
      <Col xs={12}>
  <hr className="my-3" />
  <h6 className="mb-3">
    <i className="fas fa-repeat me-2"></i>
    Recurring Maintenance (Optional)
  </h6>
</Col>

<Col xs={12}>
  <Form.Group>
    <Form.Label>Repeat Schedule</Form.Label>
    <Form.Select
      value={newTask.repeat || 'none'}
      onChange={(e) => setNewTask({...newTask, repeat: e.target.value})}
    >
      <option value="none">No Repeat</option>
      <option value="weekly">Weekly</option>
      <option value="monthly">Monthly</option>
      <option value="yearly">Yearly</option>
    </Form.Select>
    <Form.Text className="text-muted">
      Set up recurring maintenance for this asset
    </Form.Text>
  </Form.Group>
</Col>

{newTask.repeat !== 'none' && (
  <Col xs={12}>
    <Alert variant="info">
      <small>
        <i className="fas fa-info-circle me-1"></i> 
        This task will repeat automatically. Personnel can view it in their task dashboard.
      </small>
    </Alert>
  </Col>
)}
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

{/* Maintenance History Modal */}
<Modal 
  show={showMaintenanceHistoryModal} 
  onHide={() => setShowMaintenanceHistoryModal(false)} 
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>Complete Maintenance History</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Table bordered hover size="sm">
      <thead className="table-light">
        <tr>
          <th>Date</th>
          <th>Task</th>
          <th>Assigned To</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {selectedAsset?.maintenanceHistory?.map((entry, idx) => (
          <tr key={idx}>
            <td>{formatDate(entry.date)}</td>
            <td>{entry.task}</td>
            <td>{entry.assigned}</td>
            <td>
              <Badge bg={
                entry.status === 'completed' ? 'success' : 
                entry.status === 'failed' ? 'danger' : 'secondary'
              }>
                {entry.status}
              </Badge>
            </td>
          </tr>
        ))}
      </tbody>
    </Table>
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowMaintenanceHistoryModal(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal>

{/* Incident History Modal */}
<Modal 
  show={showIncidentHistoryModal} 
  onHide={() => setShowIncidentHistoryModal(false)} 
  size="lg"
>
  <Modal.Header closeButton>
    <Modal.Title>Complete Incident History</Modal.Title>
  </Modal.Header>
  <Modal.Body>
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
        {selectedAsset?.incidentHistory?.map((incident, idx) => (
          <tr key={idx}>
            <td>{formatDate(incident.reportedAt)}</td>
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
    incident.status === 'Reported' ? 'secondary' : 
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
  </Modal.Body>
  <Modal.Footer>
    <Button variant="secondary" onClick={() => setShowIncidentHistoryModal(false)}>
      Close
    </Button>
  </Modal.Footer>
</Modal>
{/* Combined History Modal */}
<Modal 
  show={showCombinedHistoryModal} 
  onHide={() => {
    setShowCombinedHistoryModal(false);
    setHistoryAsset(null);  // Clear history asset
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
      {historyAsset?.maintenanceHistory?.length > 0 && (  // CHANGED
        <Badge bg="secondary">{historyAsset.maintenanceHistory.length} records</Badge>  // CHANGED
      )}
    </div>
    
    {historyAsset?.maintenanceHistory?.length > 0 ? (  // CHANGED
      <Table bordered hover size="sm">
        <thead className="table-light">
          <tr>
            <th>Date</th>
            <th>Task</th>
            <th>Assigned To</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {historyAsset.maintenanceHistory.map((entry, idx) => (  // CHANGED
            <tr key={idx}>
              <td>{formatDate(entry.date)}</td>
              <td>{entry.task}</td>
              <td>{entry.assigned}</td>
              <td>
                <Badge bg={
                  entry.status === 'completed' ? 'success' : 
                  entry.status === 'failed' ? 'danger' : 'secondary'
                }>
                  {entry.status}
                </Badge>
              </td>
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
      {historyAsset?.incidentHistory?.length > 0 && (  // CHANGED
        <Badge bg="secondary">{historyAsset.incidentHistory.length} records</Badge>  // CHANGED
      )}
    </div>
    
    {historyAsset?.incidentHistory?.length > 0 ? (  // CHANGED
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
    incident.status === 'Reported' ? 'secondary' : 
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
      setSelectedAsset(historyAsset);  // Restore Asset Details
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

    </SidebarLayout>
  );
}