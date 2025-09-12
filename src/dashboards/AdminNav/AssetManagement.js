// src/dashboards/AdminNav/AssetManagement.js
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
  Badge,
  Card,
  Dropdown  
} from "react-bootstrap";

export default function AssetManagement() {
  // State for assets - will be populated from backend
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Add these state variables for task management
const [tasks, setTasks] = useState([]);
const [personnel] = useState([
  { id: "PER-001", name: "Juan Dela Cruz", department: "Maintenance", email: "juan.delacruz@company.com" },
  { id: "PER-002", name: "Maria Santos", department: "Engineering", email: "maria.santos@company.com" },
  { id: "PER-003", name: "Pedro Garcia", department: "Operations", email: "pedro.garcia@company.com" },
  { id: "PER-004", name: "Ana Reyes", department: "Admin", email: "ana.reyes@company.com" },
  { id: "PER-005", name: "Roberto Cruz", department: "IT", email: "roberto.cruz@company.com" },
  { id: "PER-006", name: "Lisa Fernandez", department: "Facilities", email: "lisa.fernandez@company.com" }
]);

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

  // Personnel list for assignment
  const personnelList = [
    { id: "PER-001", name: "Juan Dela Cruz" },
    { id: "PER-002", name: "Maria Santos" },
    { id: "PER-003", name: "Pedro Garcia" },
    { id: "PER-004", name: "Ana Reyes" },
    { id: "PER-005", name: "Roberto Cruz" },
    { id: "PER-006", name: "Lisa Fernandez" }
  ];

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
  const sampleAssets = [
    {
      id: "AST-001",
      name: "Main Building HVAC System",
      category: "HVAC Equipment",
      location: "Main Building - Ground Floor",
      status: "Operational",
      lastMaintenance: "2024-08-15",
      task: "Regular cleaning and filter replacement",
      acquisitionDate: "2023-05-15",
      nextMaintenance: "2024-09-15",
      maintenanceHistory: [
        { date: "2024-08-15", task: "Filter replacement and system cleaning", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-07-10", task: "Coolant level check and refill", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-06-20", task: "Routine inspection", assigned: "Juan Dela Cruz", status: "completed" }
      ],
     incidentReports: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "System is running smoothly after recent maintenance. Temperature control is optimal.",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Open"
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
      acquisitionDate: "2023-05-15",
      nextMaintenance: "2024-09-16",
      task: "Camera lens cleaning and software update",
      maintenanceSchedule: {
        taskDescription: "Camera 3 lens replacement and system calibration",
        assignedPersonnel: "PER-002",
        assignedPersonnelName: "Maria Santos",
        scheduledDateTime: "2024-09-05T09:00:00Z",
        dueDateTime: "2024-09-05T17:00:00Z",
        status: "in progress",
        createdBy: "Admin",
        createdAt: "2024-09-04T10:00:00Z",
        startedAt: "2024-09-05T09:15:00Z",
        completedAt: null,
        comments: "Started lens replacement. Waiting for calibration tools."
      },
      maintenanceHistory: [
        { date: "2024-08-18", task: "Camera 3 lens replacement due to scratches", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-07-25", task: "Software update and system calibration", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-07-01", task: "Monthly inspection and cleaning", assigned: "Juan Dela Cruz", status: "completed" }
      ],
      incidentReports: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "System is running smoothly after recent maintenance. Temperature control is optimal.",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Open"
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
      acquisitionDate: "2023-05-15",
      nextMaintenance: "2024-09-15",
      task: "Nozzle cleaning and water pressure check",
      maintenanceHistory: [
        { date: "2024-08-10", task: "Nozzle cleaning and water pressure adjustment", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-07-15", task: "Timer system calibration", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-06-30", task: "Seasonal maintenance check", assigned: "Juan Dela Cruz", status: "completed" }
      ],
      incidentReports: []
    },
    {
      id: "AST-004",
      name: "Conference Room Tables (Set A)",
      category: "Carpentry/Structural Assets",
      location: "Conference Room A",
      status: "Operational",
      lastMaintenance: "2024-08-12",
      acquisitionDate: "2023-05-15",
      nextMaintenance: "2024-09-15",
      task: "Surface polishing and hardware check",
      maintenanceHistory: [
        { date: "2024-08-12", task: "Wood polish application and hardware tightening", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-07-05", task: "Scratch repair on table surface", assigned: "Juan Dela Cruz", status: "completed" }
      ],
    incidentReports: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "System is running smoothly after recent maintenance. Temperature control is optimal.",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Open"
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
      acquisitionDate: "2023-05-15",
      nextMaintenance: null,
      task: "Final inspection before retirement",
      maintenanceHistory: [
        { date: "2024-05-30", task: "Final inspection and documentation", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-04-20", task: "Engine oil change and battery check", assigned: "Juan Dela Cruz", status: "completed" },
        { date: "2024-03-15", task: "Load testing and fuel system check", assigned: "Juan Dela Cruz", status: "completed" }
      ],
      incidentReports: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "System is running smoothly after recent maintenance. Temperature control is optimal.",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Open"
  }
]
    },
    {
      id: "AST-006",
      name: "Floor Cleaning Equipment",
      category: "Miscellaneous / General Facilities ",
      location: "Janitor's Storage Room",
      status: "Under Maintenance",
      lastMaintenance: "2024-08-16",
      acquisitionDate: "2023-05-15",
      nextMaintenance: "2024-09-15",
      task: "Motor repair and brush replacement",
      maintenanceSchedule: {
        taskDescription: "Motor replacement and complete overhaul",
        assignedPersonnel: "PER-006",
        assignedPersonnelName: "Lisa Fernandez",
        scheduledDateTime: "2024-09-04T08:00:00Z",
        dueDateTime: "2024-09-04T16:00:00Z",
        status: "overdue",
        createdBy: "Admin",
        createdAt: "2024-09-03T15:00:00Z",
        startedAt: null,
        completedAt: null,
        comments: null
      },
      maintenanceHistory: [
        { date: "2024-08-16", task: "Motor diagnostic and repair attempt", assigned: "Juan Dela Cruz", status: "failed" },
        { date: "2024-07-20", task: "Routine cleaning and lubrication", assigned: "Juan Dela Cruz", status: "completed" }
      ],
      incidentReports: [
  {
    id: "INC-001",
    type: "Equipment Malfunction",
    description: "System is running smoothly after recent maintenance. Temperature control is optimal.",
    severity: "Low",
    reportedBy: "Juan Dela Cruz",
    reportedAt: "2024-08-20T10:30:00Z",
    status: "Open"
  }
]
    }
  ];
const handleViewIncidentDetails = (incident) => {
  setSelectedIncident(incident);
  setShowIncidentDetailsModal(true);
};

const handleAssignIncidentTask = () => {
  setIncidentTaskForm({
    ...incidentTaskForm,
    incidentId: selectedIncident.id
  });
  setShowIncidentDetailsModal(false);
  setShowAssignTaskModal(true);
};

const handleDismissIncident = async () => {
  if (selectedIncident && selectedAsset) {
    try {
      const updatedAssets = assets.map(asset => {
        if (asset.id === selectedAsset.id) {
          return {
            ...asset,
            incidentReports: asset.incidentReports.map(incident =>
              incident.id === selectedIncident.id
                ? { ...incident, status: 'Dismissed' }
                : incident
            )
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      const updatedSelectedAsset = updatedAssets.find(a => a.id === selectedAsset.id);
      setSelectedAsset(updatedSelectedAsset);
      
      setShowIncidentDetailsModal(false);
      alert('Incident dismissed successfully!');
    } catch (err) {
      console.error('Error dismissing incident:', err);
      alert('Failed to dismiss incident.');
    }
  }
};

const handleSubmitIncidentTask = async () => {
  if (incidentTaskForm.assigneeId && incidentTaskForm.dueDate) {
    try {
      const assignedPersonnel = personnel.find(p => p.id === incidentTaskForm.assigneeId);
      
      // Create task based on incident
      const task = {
        id: `TSK-${String(tasks.length + 1).padStart(3, '0')}`,
        assetId: selectedAsset.id,
        title: `${selectedIncident.type} - ${selectedIncident.severity} Priority`,
        description: incidentTaskForm.description || selectedIncident.description,
        assigneeId: incidentTaskForm.assigneeId,
        priority: selectedIncident.severity === 'High' ? 'high' : selectedIncident.severity === 'Medium' ? 'medium' : 'low',
        dueDate: incidentTaskForm.dueDate,
        dueTime: incidentTaskForm.dueTime || '09:00',
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdFrom: 'incident',
        relatedIncidentId: selectedIncident.id
      };
      
      setTasks(prevTasks => [...prevTasks, task]);
      
      // Update asset status and incident
      const updatedAssets = assets.map(asset => {
        if (asset.id === selectedAsset.id) {
          return {
            ...asset,
            status: "Under Maintenance",
            incidentReports: asset.incidentReports.map(incident =>
              incident.id === selectedIncident.id
                ? { ...incident, status: 'Assigned to Task', assignedTaskId: task.id }
                : incident
            )
          };
        }
        return asset;
      });
      
      setAssets(updatedAssets);
      const updatedSelectedAsset = updatedAssets.find(a => a.id === selectedAsset.id);
      setSelectedAsset(updatedSelectedAsset);
      
      setShowAssignTaskModal(false);
      setIncidentTaskForm({ incidentId: '', assigneeId: '', dueDate: '', dueTime: '', description: '' });
      alert(`Maintenance task assigned to ${assignedPersonnel.name}!`);
      
    } catch (err) {
      console.error('Error assigning task:', err);
      alert('Failed to assign task.');
    }
  } else {
    alert('Please fill in required fields.');
  }
};
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

  // Handle asset update
  const handleUpdateAsset = async () => {
    if (editingAsset) {
      try {
        // TODO: Replace with actual API call
        // await fetch(`/api/assets/${editingAsset.id}`, {
        //   method: 'PUT',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(editingAsset)
        // });

        // For now, update local state
        const updatedAssets = assets.map(asset => 
          asset.id === editingAsset.id ? editingAsset : asset
        );
        setAssets(updatedAssets);
        
        setIsEditing(false);
        setSelectedAsset(editingAsset);
        setEditingAsset(null);
        
        // Success message
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
      // Get personnel name
      const assignedPersonnel = personnel.find(p => p.id === nextMaintenanceSchedule.assigneeId);
      
      // Create the scheduled maintenance object
      const scheduledMaintenance = {
        date: nextMaintenanceSchedule.scheduledDate,
        time: nextMaintenanceSchedule.scheduledTime || '09:00',
        assignedPersonnel: assignedPersonnel?.name,
        repeat: nextMaintenanceSchedule.repeat,
        createdAt: new Date().toISOString()
      };
      
      // Update the asset with next maintenance schedule
      const updatedAssets = assets.map(asset => 
        asset.id === nextMaintenanceSchedule.assetId 
          ? { 
              ...asset, 
              nextMaintenance: nextMaintenanceSchedule.scheduledDate,
              nextMaintenanceTime: nextMaintenanceSchedule.scheduledTime || '09:00',
              nextMaintenanceRepeat: nextMaintenanceSchedule.repeat,
              nextMaintenanceAssigned: assignedPersonnel?.name
            }
          : asset
      );
      setAssets(updatedAssets);
      
      // Update selected asset if it's the same one
      if (selectedAsset && selectedAsset.id === nextMaintenanceSchedule.assetId) {
        const updatedSelectedAsset = updatedAssets.find(a => a.id === selectedAsset.id);
        setSelectedAsset(updatedSelectedAsset);
      }
      
      setShowMaintenanceScheduleModal(false);
      alert(`Next maintenance scheduled successfully! ${nextMaintenanceSchedule.repeat !== 'none' ? `Will repeat ${nextMaintenanceSchedule.repeat}.` : ''}`);
      
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
      const asset = {
        ...newAsset,
        id: `AST-${String(assets.length + 1).padStart(3, '0')}`,
        lastMaintenance: null,
        maintenanceHistory: [],
        incidentReports: []
      };
      
      setAssets(prevAssets => [...prevAssets, asset]);
      setShowAddAssetModal(false);
      
      // Reset form
      setNewAsset({
        name: '',
        category: 'Facilities & Building Infra',
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

// Handle bulk CSV upload
const handleBulkUpload = async () => {
  if (!csvFile) {
    alert('Please select a CSV file first.');
    return;
  }
  
  try {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const newAssets = [];
      for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
          const values = lines[i].split(',').map(v => v.trim());
          const asset = {
            id: `AST-${String(assets.length + newAssets.length + 1).padStart(3, '0')}`,
            name: values[headers.indexOf('name')] || values[0],
            category: values[headers.indexOf('category')] || values[1] || 'Facilities & Building Infra',
            location: values[headers.indexOf('location')] || values[2],
            status: values[headers.indexOf('status')] || values[3] || 'Operational',
            acquisitionDate: values[headers.indexOf('acquisitionDate')] || values[4] || '',
            nextMaintenance: values[headers.indexOf('nextMaintenance')] || values[5] || '',
            task: values[headers.indexOf('task')] || values[6] || '',
            lastMaintenance: null,
            maintenanceHistory: [],
            incidentReports: []
          };
          newAssets.push(asset);
        }
      }
      
      setAssets(prevAssets => [...prevAssets, ...newAssets]);
      setShowBulkUploadModal(false);
      setCsvFile(null);
      setCsvPreview([]);
      
      alert(`Successfully uploaded ${newAssets.length} assets!`);
    };
    reader.readAsText(csvFile);
    
  } catch (err) {
    console.error('Error uploading CSV:', err);
    alert('Failed to upload CSV. Please check the format and try again.');
  }
};

// Handle export to CSV
const handleExportReport = () => {
  try {
    // Prepare CSV headers
    const headers = [
      'Asset ID',
      'Asset Name', 
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
      const task = {
        ...newTask,
        id: `TSK-${String(tasks.length + 1).padStart(3, '0')}`,
        createdAt: new Date().toISOString(),
        status: 'pending'
      };
      
      // Add task to tasks array
      setTasks(prevTasks => [...prevTasks, task]);
      
      // Get personnel name
      const assignedPersonnel = personnel.find(p => p.id === newTask.assigneeId);
      
      // Create maintenance schedule object
      const maintenanceSchedule = {
        taskDescription: newTask.title,
        assignedPersonnel: newTask.assigneeId,
        assignedPersonnelName: assignedPersonnel?.name,
        scheduledDateTime: `${newTask.dueDate}T${newTask.dueTime || '09:00:00'}`,
        dueDateTime: `${newTask.dueDate}T${newTask.dueTime || '17:00:00'}`,
        status: 'pending',
        createdBy: 'Admin',
        createdAt: new Date().toISOString(),
        startedAt: null,
        completedAt: null,
        comments: newTask.description || null
      };
      
      // Update asset with maintenance schedule and status
      const updatedAssets = assets.map(asset => 
        asset.id === newTask.assetId 
          ? { 
              ...asset, 
              status: "Under Maintenance",
              maintenanceSchedule: maintenanceSchedule
            }
          : asset
      );
      setAssets(updatedAssets);
      
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
      alert('Task assigned successfully! Asset status updated to Under Maintenance.');
      
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
          <Form.Label>Asset Name *</Form.Label>
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
<Modal show={showBulkUploadModal} onHide={() => setShowBulkUploadModal(false)} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>Bulk Upload Assets (CSV)</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    <Alert variant="info">
      <strong>CSV Format:</strong> name, category, location, status, acquisitionDate, nextMaintenance, task
      <br />
      <small>Header row should match these column names (case sensitive)</small>
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

        {/* Sample Data Notice */}
        <Alert variant="info" className="mb-3">
          <strong>Admin Panel:</strong> You can view and edit asset details. 
          Sample data is currently displayed for demonstration purposes.
        </Alert>

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
              filteredAssets.map((asset) => {
                return (
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
                );
              })
            ) : (
              <tr>
                <td colSpan="7" className="text-center text-muted py-4">
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
                    {!isEditing ? (
                      // View Mode
                      <div className="row g-3">
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label><strong>Asset ID:</strong></Form.Label>
                            <Form.Control type="text" value={selectedAsset.id} readOnly />
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label><strong>Asset Name:</strong></Form.Label>
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
                            <Form.Label><strong>Status:</strong></Form.Label>
                            <div className="pt-2">
                              <span className={`badge ${
                                selectedAsset.status === 'Operational' ? 'bg-success' :
                                selectedAsset.status === 'Under Maintenance' ? 'bg-warning' :
                                'bg-secondary'
                              }`}>
                                {selectedAsset.status}
                              </span>
                            </div>
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label><strong>Location:</strong></Form.Label>
                            <Form.Control type="text" value={selectedAsset.location} readOnly />
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label><strong>Acquisition Date:</strong></Form.Label>
                            <Form.Control type="text" value={selectedAsset.acquisitionDate} readOnly />
                          </Form.Group>
                        </div>

                        <div className="col-md-12">
  <Form.Group>
    <Form.Label><strong>Next Maintenance:</strong></Form.Label>
    <div className="d-flex align-items-center gap-3">
      <Form.Control 
        type="text" 
        value={selectedAsset.nextMaintenance || 'Not scheduled'} 
        readOnly 
        className="flex-grow-1"
      />
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
    {selectedAsset.nextMaintenanceRepeat && selectedAsset.nextMaintenanceRepeat !== 'none' && (
      <Form.Text className="text-muted">
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
                            <Form.Label>Asset ID</Form.Label>
                            <Form.Control type="text" value={editingAsset.id} disabled />
                          </Form.Group>
                        </div>
                        <div className="col-md-6">
                          <Form.Group>
                            <Form.Label>Asset Name *</Form.Label>
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
                    <div className="mt-4">
                      <h6>Maintenance History</h6>
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
<Col lg={4}>
  <div className="border-start ps-4">
    <h6>Incident Reports</h6>
    
    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
      {selectedAsset.incidentReports?.length > 0 ? (
        selectedAsset.incidentReports.map((incident, index) => (
          <div key={index} className="mb-3 p-3 border rounded">
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
        <div className="text-center text-muted py-4">
          <i className="fas fa-exclamation-triangle fa-2x mb-3 opacity-50"></i>
          <p>No incident reports submitted yet.</p>
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
              {assets.filter(asset => asset.status === 'Operational').map(asset => (
                <option key={asset.id} value={asset.id}>{asset.name} ({asset.id})</option>
              ))}
            </Form.Select>
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
    <Button variant="secondary" onClick={() => setShowIncidentDetailsModal(false)}>
      Close
    </Button>
    {selectedIncident?.status === 'Open' && (
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
    <Button variant="secondary" onClick={() => setShowAssignTaskModal(false)}>
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