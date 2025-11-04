// src/dashboards/SYSAD/AssetOverview.js
import React, { useState, useEffect } from "react";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { assetService } from '../../services/assetService';
import { supabase } from '../../supabaseClient';
import Papa from 'papaparse';
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
  Badge
} from "react-bootstrap";

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
  // Pagination state
const [currentPage, setCurrentPage] = useState(1);
const [totalPages, setTotalPages] = useState(1);
const [totalRecords, setTotalRecords] = useState(0);
const [recordsPerPage] = useState(17);
// State for view modal
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [showCombinedHistoryModal, setShowCombinedHistoryModal] = useState(false);
  const [historyAsset, setHistoryAsset] = useState(null);
const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
const [csvFile, setCsvFile] = useState(null);
const [csvPreview, setCsvPreview] = useState([]);
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
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const lines = text.split('\n');
      const preview = lines.slice(0, 6);
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

  setUploadingAssets(true);
  
  try {
    // Get current user's organization ID from Supabase Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!user || authError) {
      throw new Error('User not authenticated - please log in again.');
    }

    const userEmail = user.email;

    // Get organization_id from database
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('email', userEmail)
      .single();

    if (userDataError || !userData) {
      throw new Error('User data not found in database');
    }

    const orgId = userData.organization_id;

    // Read CSV file
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target.result;

        // Parse CSV content using Papa.parse
        const parseResult = Papa.parse(csvContent, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });

        if (parseResult.errors.length > 0) {
          console.error('CSV Parse Errors:', parseResult.errors);
        }

        const csvRows = parseResult.data.filter(row => 
          row['Asset Name'] && row['Asset Name'].trim() !== '' && 
          row.Category && row.Category.trim() !== ''
        );

        if (csvRows.length === 0) {
          throw new Error('No valid asset data found in CSV');
        }

        // âœ… CHECK FOR DUPLICATES
        const existingAssets = assets;
console.log('First existing asset structure:', existingAssets[0]);
console.log('CSV row structure:', csvRows[0]); // Current assets in state
        const duplicates = [];
        const uniqueRows = [];
        
        console.log('Checking for duplicates...');
        console.log('Existing assets count:', existingAssets.length);
        console.log('CSV rows count:', csvRows.length);
        
        for (const row of csvRows) {
          const assetName = row['Asset Name'].trim();
          const assetLocation = row.Location ? row.Location.trim() : 'Not specified';
          
          // Check if asset already exists (case-insensitive comparison)
          const isDuplicate = existingAssets.some(existing => 
            existing.name.toLowerCase() === assetName.toLowerCase() &&
            existing.location.toLowerCase() === assetLocation.toLowerCase()
          );
          
          if (isDuplicate) {
            duplicates.push({ name: assetName, location: assetLocation });
            console.log('Duplicate found:', assetName, assetLocation);
          } else {
            uniqueRows.push(row);
          }
        }
        
        console.log('Duplicates found:', duplicates.length);
        console.log('Unique rows:', uniqueRows.length);
        
        // âœ… SHOW DUPLICATE WARNING IF FOUND
        if (duplicates.length > 0) {
          const duplicateList = duplicates
            .slice(0, 5)
            .map(d => `${d.name} (${d.location})`)
            .join('\n');
          const moreText = duplicates.length > 5 ? `\n...and ${duplicates.length - 5} more` : '';
          
          const userChoice = window.confirm(
            `DUPLICATE DETECTION\n\n` +
            `Found ${duplicates.length} asset(s) that already exist in the system:\n\n` +
            `${duplicateList}${moreText}\n\n` +
            `These duplicates will be SKIPPED.\n` +
            `${uniqueRows.length} new asset(s) will be uploaded.\n\n` +
            `Click OK to continue, or CANCEL to abort.`
          );
          
          if (!userChoice) {
            alert('Upload cancelled by user.');
            setUploadingAssets(false);
            setShowBulkUploadModal(false);
            setCsvFile(null);
            setCsvPreview([]);
            return;
          }
        }
        
        // âœ… CHECK IF NO NEW ASSETS TO UPLOAD
        if (uniqueRows.length === 0) {
          alert('No new assets to upload.\n\nAll assets in the CSV already exist in the system.');
          setUploadingAssets(false);
          setShowBulkUploadModal(false);
          setCsvFile(null);
          setCsvPreview([]);
          return;
        }

       // Get unique categories from CSV (use uniqueRows instead of csvRows)
        const uniqueCategories = [...new Set(uniqueRows.map(row => row.Category.trim()))];
        console.log('Categories to process:', uniqueCategories);

        // Create/get asset categories first
        const categoryMap = {};
        
        for (const categoryName of uniqueCategories) {
          try {
            // Try to get existing category first
            const { data: existingCategory } = await supabase
              .from('asset_categories')
              .select('category_id, category_name')
              .eq('category_name', categoryName)
              .single();

            if (existingCategory) {
              categoryMap[categoryName] = existingCategory.category_id;
            } else {
              // Create new category
              const { data: newCategory, error: categoryError } = await supabase
                .from('asset_categories')
                .insert([{ category_name: categoryName }])
                .select('category_id, category_name')
                .single();

              if (categoryError) {
                console.error(`Failed to create category ${categoryName}:`, categoryError);
                throw new Error(`Failed to create category: ${categoryName}`);
              }

              categoryMap[categoryName] = newCategory.category_id;
            }
          } catch (categoryError) {
            console.error(`Error processing category ${categoryName}:`, categoryError);
            throw new Error(`Error processing category: ${categoryName}`);
          }
        }

        console.log('Category mapping:', categoryMap);

       // Prepare assets for insertion (use uniqueRows instead of csvRows)
        const assetsToInsert = uniqueRows.map((row, index) => ({
          asset_code: `${row['Asset Name'].trim().replace(/\s+/g, '_')}_${Date.now()}_${index}`,
          asset_category_id: categoryMap[row.Category.trim()],
          asset_status: (row.Status || 'operational').toLowerCase(),
          location: row.Location ? row.Location.trim() : 'Not specified',
          organization_id: orgId
        }));

        console.log('Assets to insert:', assetsToInsert);

      // Insert assets one by one to handle individual failures
const insertedAssets = [];
const failedAssets = [];

for (const assetData of assetsToInsert) {
  try {
    // ✅ EXTRA CHECK: Verify this asset doesn't exist before inserting
    const assetNameFromCode = assetData.asset_code.split('_').slice(0, -2).join('_'); // Remove timestamp and index
    const { data: existingCheck } = await supabase
      .from('assets')
      .select('asset_id')
      .eq('organization_id', orgId)
      .ilike('asset_code', `%${assetNameFromCode}%`)
      .eq('location', assetData.location)
      .limit(1);
    
    if (existingCheck && existingCheck.length > 0) {
      console.log(`⚠️ Skipping duplicate: ${assetData.asset_code}`);
      failedAssets.push({ 
        asset_code: assetData.asset_code, 
        error: 'Duplicate asset (already exists in database)' 
      });
      continue; // Skip this asset
    }
    
    // Proceed with insert if no duplicate found
    const { data, error } = await supabase
      .from('assets')
      .insert([assetData])
      .select()
      .single();

    if (error) {
      console.error(`Failed to insert asset ${assetData.asset_code}:`, error);
      failedAssets.push({ asset_code: assetData.asset_code, error: error.message });
    } else {
      insertedAssets.push(data);
      console.log(`✅ Successfully inserted: ${assetData.asset_code}`);
    }
  } catch (insertError) {
    console.error(`Error inserting asset ${assetData.asset_code}:`, insertError);
    failedAssets.push({ asset_code: assetData.asset_code, error: insertError.message });
  }
}

        const successCount = insertedAssets.length;
const failCount = failedAssets.length;
        // Refresh assets list
        await fetchAssets();

        // Close modal and reset
        setShowBulkUploadModal(false);
        setCsvFile(null);
        setCsvPreview([]);
        
      // âœ… DETAILED SUCCESS MESSAGE
    // ✅ SIMPLE & DIRECT MESSAGE
let resultMessage = '';

if (successCount > 0) {
  // SUCCESS SCENARIO
  resultMessage = `✅ Upload Successful!\n\n`;
  resultMessage += `${successCount} asset(s) added successfully`;
  
  // Show what was skipped
  if (duplicates.length > 0 || failCount > 0) {
    resultMessage += `\n\nSkipped:`;
    if (duplicates.length > 0) {
      resultMessage += `\n• ${duplicates.length} duplicate(s)`;
    }
    if (failCount > 0) {
      resultMessage += `\n• ${failCount} asset(s) already exist in database`;
    }
  }
  
} else {
  // FAILURE SCENARIO - Nothing was uploaded
  resultMessage = `❌ Upload Failed\n\n`;
  resultMessage += `No assets were added to the system.\n\n`;
  
  // Explain WHY
  if (duplicates.length > 0 && failCount > 0) {
    resultMessage += `Reason: All ${duplicates.length + failCount} asset(s) already exist in the system.`;
  } else if (duplicates.length > 0) {
    resultMessage += `Reason: All ${duplicates.length} asset(s) in the CSV already exist (duplicates).`;
  } else if (failCount > 0) {
    resultMessage += `Reason: All ${failCount} asset(s) already exist in the database.`;
  } else {
    resultMessage += `Reason: No valid assets found in CSV file.`;
  }
}

alert(resultMessage);
        // âœ… ADD: Audit log for bulk upload
        const { data: { user: authUser } } = await supabase.auth.getUser();
        const { data: currentUserData } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', authUser.email)
          .single();
        
      // ✅ ONLY LOG IF SUCCESSFUL
if (currentUserData && successCount > 0) {
  await AuditLogger.logWithIP({
    userId: currentUserData.user_id,
    actionTaken: `Bulk uploaded ${successCount} assets via CSV`,
    tableAffected: 'assets',
    recordId: 0,
    organizationId: orgId
  });
}
      } catch (innerError) {
        console.error('Error processing CSV:', innerError);
        alert(`Error: ${innerError.message}`);
      }
    };

    reader.readAsText(csvFile);
    
  } catch (error) {
    console.error('Error processing asset CSV:', error);
    alert(`Error: ${error.message}`);
  } finally {
    setUploadingAssets(false);
  }
};

const downloadTemplate = () => {
  const template = `Asset Name,Category,Location,Status
Laptop Dell XPS,Computer,Office Floor 1,Operational
Printer HP LaserJet,Office Equipment,Reception,Operational
Monitor Samsung,Computer,Office Floor 2,Operational`;

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

const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = String(date.getFullYear()).slice(-2);
  return `${month}-${day}-${year}`;
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



{/* Render pagination after table */}
{!loading && !error && filteredAssets.length > 0 && <Pagination />}

{/* Bulk Upload Modal */}
<Modal show={showBulkUploadModal} onHide={() => setShowBulkUploadModal(false)} size="xl">
  <Modal.Header closeButton>
    <Modal.Title>Bulk Upload Assets (CSV)</Modal.Title>
  </Modal.Header>
  <Modal.Body>
   <Alert variant="info">
  <strong>CSV Format:</strong> Asset Name, Category, Location, Status
  <br />
  <small>Header row should match these column names exactly (case sensitive)</small>
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
        {/* Status Badge and View History Button */}
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
            
            {/* Incident Badge */}
            {selectedAsset.incidentReports && selectedAsset.incidentReports.length > 0 && (
              <span className="badge bg-warning text-dark">
                <i className="fas fa-exclamation-triangle me-1"></i>
                {selectedAsset.incidentReports.length} Incident{selectedAsset.incidentReports.length > 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          {/* RIGHT SIDE - View History Button */}
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
              <Form.Control type="text" value={selectedAsset.acquisitionDate || 'N/A'} readOnly />
            </Form.Group>
          </div>
          <div className="col-md-6">
            <Form.Group>
              <Form.Label><strong>Location:</strong></Form.Label>
              <Form.Control type="text" value={selectedAsset.location} readOnly />
            </Form.Group>
          </div>
  
        </div>

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
                <div key={index} className="mb-2 p-3 border border-warning rounded bg-light">
                  {/* Single Row: Name, Date, Type, Severity, Status */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="d-flex align-items-center gap-2 flex-wrap">
                      <span className="fw-semibold small">{incident.reportedBy}</span>
                      <span className="text-muted small"></span>
                      <span className="text-muted small">
                        {new Date(incident.reportedAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      <span className="text-muted small"></span>
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
                </div>
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
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {historyAsset.maintenanceHistory.map((entry, idx) => (
              <tr key={idx}>
                <td>{formatDate(entry.date)}</td>
                <td>{entry.task}</td>
                <td>{entry.assigned}</td>
                <td>
                  <Badge bg={
                    entry.status === 'completed' ? 'success' : 
                    entry.status === 'failed' ? 'danger' : 'secondary'
                  }>
                    {entry.status || 'N/A'}
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