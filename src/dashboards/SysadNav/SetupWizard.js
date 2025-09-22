import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, Upload, Download, Users, Building2, Database, CheckCircle, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { PasswordUtils } from '../../utils/PasswordUtils';

const parseCSV = (file) => {
  return new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => {
  try {
  const text = e.target.result;
  const lines = text.split("\n").map(line => line.trim()).filter(line => line.length > 0);
        
  if (lines.length < 2) {
  reject(new Error("CSV file must have at least a header and one data row"));
    return;
    }
        
  const headers = lines[0].split(",").map(h => h.trim().replace(/"/g, ''));
  console.log("CSV Headers:", headers);
        
  const data = [];
  for (let i = 1; i < lines.length; i++) {
  const values = lines[i].split(",").map(v => v.trim().replace(/"/g, ''));
  if (values.length === headers.length && values.some(v => v.length > 0)) {
  const row = {};
  headers.forEach((header, index) => {
    row[header] = values[index] || "";
       });
    data.push(row);
         }
        }
        
   console.log("Parsed CSV data:", data);
    resolve(data);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsText(file);
    });
    };


  const importUsers = async (file, roleMap, orgData) => {
  try {
    console.log("Starting user import for:", file.name);
    const rows = await parseCSV(file);
    console.log("Parsed rows:", rows);

    if (!rows || rows.length === 0) {
      console.log("No valid rows found in CSV");
      return [];
    }

    // Validate required fields
  const validRows = rows.filter(row => {
    const hasName = row.Name && row.Name.trim().length > 0;
    const hasEmail = row.Email && row.Email.includes('@') && row.Email.includes('.');
    const hasRole = row.Role && row.Role.trim().length > 0;
      
  if (!hasName || !hasEmail || !hasRole) {
  console.warn("Skipping invalid row:", row);
  return false;
  }
  return true;
  });

  console.log(`Valid rows: ${validRows.length} out of ${rows.length}`);

  // Process users - INSERT DIRECTLY TO DATABASE (skip Supabase Auth for now)
  const insertedUsers = [];
    
  for (let index = 0; index < validRows.length; index++) {
  const r = validRows[index];
      
  try {
  const email = r.Email.toLowerCase().trim();
  const tempPassword = PasswordUtils.generateSecurePassword(10);
  const hashedPassword = PasswordUtils.hashPassword(tempPassword);
  const username = `${email.split("@")[0]}_${Date.now()}_${index}`;

  // Insert user directly to database without Supabase Auth (for now)
  const userData = {
  username: username,
  full_name: r.Name.trim(),
  email: email,
  role_id: roleMap[r.Role] || 4,
  user_status: 'active', // Set as active since we're not using email confirmation yet
  password_hash: hashedPassword,
  auth_uid: null, // Will be null for now
  organization_id: orgData.organization_id
  };

  const { data: dbUser, error: dbError } = await supabase
  .from("users")
  .insert([userData])
  .select()
  .single();
        
  if (dbError) {
  console.log(`✅ User inserted: ${dbUser.full_name} (${dbUser.email}) - Role: ${dbUser.role_id}`);          continue;
  }
        
  insertedUsers.push({
  ...dbUser,
  tempPassword: tempPassword // Include for potential email sending later
  });
        
  console.log(`✅ Successfully created user: ${email}`);
        
  } catch (userError) {
  console.error(`Error processing user ${r.Email}:`, userError);
  }
  }

  console.log(`Successfully processed ${insertedUsers.length} users out of ${validRows.length}`);
  return insertedUsers;
    
  } catch (err) {
    console.error("User import failed:", err.message);
    alert("User import failed: " + err.message);
    return [];
  }
  };

  const importAssets = async (file, orgData) => {
  try {
    console.log("ðŸ” Starting asset import...");
    const rows = await parseCSV(file);
    console.log("ðŸ“Š Parsed asset rows:", rows);

  if (!rows || rows.length === 0) {
    console.log("No valid asset rows found");
    return 0;
    }

    // Validate asset rows
  const validRows = rows.filter(row => {
  const hasName = row["Asset Name"] && row["Asset Name"].trim().length > 0;
  const hasCategory = row.Category && row.Category.trim().length > 0;
      
  if (!hasName || !hasCategory) {
  console.warn("Skipping invalid asset row:", row);
  return false;
  }
  return true;
  });

    // Get unique categories
    const uniqueCategories = [...new Set(validRows.map(r => r.Category.trim()))];
    console.log("Unique categories to create:", uniqueCategories);
    
    // Insert categories
    for (const categoryName of uniqueCategories) {
      try {
        await supabase
          .from("asset_categories")
          .upsert({ category_name: categoryName }, { 
            onConflict: 'category_name',
            ignoreDuplicates: true 
          });
      } catch (catError) {
        console.error(`Failed to create category ${categoryName}:`, catError);
      }
    }

    // Get all categories with IDs
    const { data: categories, error: fetchError } = await supabase
      .from("asset_categories")
      .select("category_id, category_name");
    
    if (fetchError) {
      console.error("Error fetching categories:", fetchError);
      return 0;
    }

    const categoryMap = {};
    categories.forEach(cat => {
      categoryMap[cat.category_name] = cat.category_id;
    });

    console.log("Category mapping:", categoryMap);

    // Insert assets one by one
    const insertedAssets = [];
    for (let i = 0; i < validRows.length; i++) {
      const row = validRows[i];
      try {
        const assetData = {
          asset_code: `${row["Asset Name"].trim()}_${Date.now()}_${i}`,
          asset_category_id: categoryMap[row.Category.trim()],
          asset_status: (row.Status || 'operational').toLowerCase(),
          location: row.Location ? row.Location.trim() : 'Not specified',
          organization_id: orgData.organization_id
        };

        const { data, error } = await supabase
          .from("assets")
          .insert([assetData])
          .select()
          .single();
        
        if (error) {
          console.error(`Failed to insert asset ${assetData.asset_code}:`, error);
          continue;
        }
        
        insertedAssets.push(data);
        console.log(`âœ… Inserted asset: ${assetData.asset_code}`);
      } catch (assetError) {
        console.error(`Error inserting asset:`, assetError);
      }
    }

    console.log(`âœ… Successfully imported ${insertedAssets.length} assets`);
    return insertedAssets.length;
    
  } catch (err) {
    console.error("âŒ Asset import failed:", err.message);
    return 0;
  }
};
// Sa SetupWizard.js, replace ang getRoleMap function:
const getRoleMap = async () => {
  try {
    const { data: roles, error } = await supabase
      .from("roles")
      .select("role_id, role_name");
    
    if (error) throw error;
    
    // Create mapping from role names to IDs
    const roleMap = {};
    roles.forEach(role => {
      const roleName = role.role_name.toLowerCase();
      if (roleName.includes('system') && roleName.includes('admin')) {
        roleMap['system admin'] = role.role_id;
        roleMap['System admin'] = role.role_id;
      } else if (roleName.includes('admin') && roleName.includes('official')) {
        roleMap['Admin official'] = role.role_id;
        roleMap['admin official'] = role.role_id;
      } else if (roleName.includes('personnel')) {
        roleMap['Personnel'] = role.role_id;
        roleMap['personnel'] = role.role_id;
      } else if (roleName.includes('standard') || roleName.includes('user')) {
        roleMap['Standard user'] = role.role_id;
        roleMap['standard user'] = role.role_id;
      }
    });
    
    console.log("Role mapping created:", roleMap);
    return roleMap;
  } catch (err) {
    console.error("Error fetching roles:", err);
    // Fallback - based sa typical OpenFMS role structure
    return {
      'system admin': 1,
      'System admin': 1, 
      'Admin official': 2,
      'admin official': 2,
      'Personnel': 3,
      'personnel': 3,
      'Standard user': 4,
      'standard user': 4
    };
  }
};


export default function SetupWizard() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Get org data from signup if available
 const getInitialOrgData = () => {
  // Will be populated by useEffect from user metadata
  return {
    name: '',
    email: '',
    phone: '',
    address: '',
    orgType: '',
    country: '',
    website: '',
    contactPerson: '',
    contactEmail: '',
    password: '',
    confirmPassword: ''
  };
};

  const [orgData, setOrgData] = useState(getInitialOrgData());
  const [userImportMethod, setUserImportMethod] = useState(''); // Add this missing state
  const [assetImportMethod, setAssetImportMethod] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState({
    heads: null,
    personnel: null,
    standardUsers: null,
    assets: null
  });
  const [skippedSteps, setSkippedSteps] = useState({
    heads: false,
    personnel: false,
    standardUsers: false,
    assets: false
  });
  const totalSteps = 4;

useEffect(() => {
  const loadUserData = async () => {
    console.log('=== LOADING USER DATA ===');
    const { data, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('Error getting user:', error);
      navigate('/login');
      return;
    }

    if (!data.user) {
      console.log('No authenticated user found');
      navigate('/signup');
      return;
    }

    const user = data.user;
    console.log('User found:', user.email);

    // Check if email is confirmed
    if (!user.email_confirmed_at) {
      alert('Please confirm your email first before proceeding with setup.');
      return;
    }

    // Get org data from user metadata
    const orgData = user.user_metadata?.org_data;
    const fullName = user.user_metadata?.full_name;
    
    if (orgData) {
      console.log('Loading org data from metadata:', orgData);
      
      setOrgData(prev => ({
        ...prev,
        name: orgData.orgName || '',
        orgType: orgData.orgType || '',
        country: orgData.country || '',
        website: orgData.website || '',
        address: orgData.address || '',
        contactPerson: orgData.contactPerson || fullName || '',
        contactEmail: user.email || '',
        phone: orgData.phone || ''
      }));
    } else {
      console.log('No org data in metadata, using basic user info');
      
      // Fallback: set basic user info
      setOrgData(prev => ({
        ...prev,
        contactEmail: user.email || '',
        contactPerson: fullName || user.email.split('@')[0] || ''
      }));
    }
    
    console.log('=========================');
  };

  loadUserData();
}, [navigate]);

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = (stepType) => {
    if (stepType === 'users') {
      // Skip all user types
      setSkippedSteps(prev => ({
        ...prev,
        heads: true,
        personnel: true,
        standardUsers: true
      }));
    } else {
      setSkippedSteps(prev => ({
        ...prev,
        [stepType]: true
      }));
    }
    setCurrentStep(currentStep + 1);
  };

  const handleFileUpload = (type, file) => {
    setUploadedFiles(prev => ({
      ...prev,
      [type]: file
    }));
    // Update skipped steps for user types
    if (['heads', 'personnel', 'standardUsers'].includes(type)) {
      setSkippedSteps(prev => ({ ...prev, [type]: false }));
      // Set user import method when any user file is uploaded
      setUserImportMethod('csv');
    } else if (type === 'assets') {
      setSkippedSteps(prev => ({ ...prev, assets: false }));
    }
  };

  // UPDATE downloadTemplate function:
  const downloadTemplate = (type) => {
    const templates = {
      heads: `Name,Email,Status,Role
John Admin,john.admin@company.com,active,Admin official
Jane Head,jane.head@company.com,active,system admin`,
      personnel: `Name,Email,Status,Role
Mike Staff,mike.staff@company.com,active,Personnel
Sarah Worker,sarah.worker@company.com,active,Personnel`,
      standardUsers: `Name,Email,Status,Role
Tom User,tom.user@company.com,active,Standard user
Lisa Member,lisa.member@company.com,active,Standard user`,
      assets: `Asset Name,Category,Status,Location
Laptop Dell XPS,Computer,Operational,Office Floor 1
Printer HP LaserJet,Office Equipment,Operational,Reception`
    };

    const blob = new Blob([templates[type]], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_template.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const isSetupComplete = () => {
  const usersComplete = !skippedSteps.heads && uploadedFiles.heads &&
                       !skippedSteps.personnel && uploadedFiles.personnel &&
                       !skippedSteps.standardUsers && uploadedFiles.standardUsers;
  
  const assetsComplete = !skippedSteps.assets && uploadedFiles.assets;
  
  // CHANGE THIS LINE: orgData.email -> orgData.contactEmail
  return usersComplete && assetsComplete && orgData.name && orgData.contactEmail;
};
  const getUserImportMethodDisplay = () => {
    if (skippedSteps.heads && skippedSteps.personnel && skippedSteps.standardUsers) {
      return 'Skipped';
    }
    if (userImportMethod === 'csv' && (uploadedFiles.heads || uploadedFiles.personnel || uploadedFiles.standardUsers)) {
      return 'CSV Bulk Upload';
    }
    return 'Not configured';
  };

  const getAssetImportMethodDisplay = () => {
    if (skippedSteps.assets) {
      return 'Skipped';
    }
    if (assetImportMethod === 'csv' && uploadedFiles.assets) {
      return 'CSV Bulk Upload';
    }
    return 'Not configured';
  };

  const getStepTitle = () => {
    switch(currentStep) {
      case 1: return 'Organization Setup';
      case 2: return 'Import Users';
      case 3: return 'Import Assets';
      case 4: return 'Summary';
      default: return 'Setup';
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      backgroundColor: 'white',
      padding: '2rem 1rem'
    },
    primaryColor: '#284386',
    secondaryColor: '#284C9A',
    accentColor: '#337FCA',
    lightColor: '#B0D0E6',
    bgColor: '#ECEBF0'
  };

  const renderProgressBar = () => (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h1 className="h2 fw-bold" style={{ color: styles.primaryColor }}>{getStepTitle()}</h1>
        <span 
          className="badge rounded-pill px-3 py-2 text-white"
          style={{ backgroundColor: styles.accentColor }}
        >
          Step {currentStep} of {totalSteps}
        </span>
      </div>
      <div className="d-flex align-items-center mb-2">
        {[1, 2, 3, 4].map((step, index) => (
          <React.Fragment key={step}>
            <div 
              className="d-flex align-items-center justify-content-center rounded-circle fw-bold"
              style={{
                width: '32px',
                height: '32px',
                fontSize: '14px',
                backgroundColor: currentStep > step ? styles.accentColor : 
                               currentStep === step ? styles.secondaryColor : styles.bgColor,
                color: currentStep >= step ? 'white' : '#666'
              }}
            >
              {currentStep > step ? <CheckCircle size={16} /> : step}
            </div>
            {index < 3 && (
              <div 
                className="flex-fill mx-2"
                style={{
                  height: '3px',
                  backgroundColor: currentStep > step + 1 ? styles.accentColor :
                                 currentStep > step ? styles.secondaryColor : styles.bgColor
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <div className="d-flex justify-content-between">
        <small className="text-muted">Organization</small>
        <small className="text-muted">Users</small>
        <small className="text-muted">Assets</small>
        <small className="text-muted">Summary</small>
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <Building2 style={{ color: styles.accentColor }} className="mb-3" size={48} />
        <h2 className="display-6 fw-bold mb-2" style={{ color: styles.primaryColor }}>Welcome to OpenFMS</h2>
        <p className="text-muted fs-6">Let's set up your organization and get you started</p>
      </div>
      
      <div>
        <h3 className="h4 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>Organization Details</h3>
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Organization Name *
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Enter organization name"
              value={orgData.name}
              onChange={(e) => setOrgData({...orgData, name: e.target.value})}
            />
          </div>

           <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Organization Type
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Organization type"
              value={orgData.orgType}
              onChange={(e) => setOrgData({...orgData, orgType: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Official Website
            </label>
            <input
              type="url"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="https://example.com"
              value={orgData.website}
              onChange={(e) => setOrgData({...orgData, website: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Phone
            </label>
            <input
              type="tel"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Phone number"
              value={orgData.phone}
              onChange={(e) => setOrgData({...orgData, phone: e.target.value})}
            />
          </div>

                <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Country
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Enter country"
              value={orgData.country}
              onChange={(e) => setOrgData({...orgData, country: e.target.value})}
            />
          </div>

          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Address
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Office address"
              value={orgData.address}
              onChange={(e) => setOrgData({...orgData, address: e.target.value})}
            />
          </div>
         
          
          
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="container" style={{ maxWidth: '1200px' }}>
      <div className="text-center mb-4">
        <Users style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Users</h2>
        <p className="text-muted">Add your team members to the system</p>
      </div>

      <div 
        className="p-3 rounded-3 mb-5"
        style={{ 
          borderLeft: `4px solid ${styles.accentColor}`,
          backgroundColor: '#f8f9ff'
        }}
      >
        <div className="d-flex">
          <AlertCircle style={{ color: styles.accentColor }} size={20} className="me-3 mt-1 flex-shrink-0" />
          <div>
            <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>Available User Roles:</h6>
            <ul className="mb-0 small text-muted">
              <li><strong>Standard user</strong> - Basic access to assigned assets</li>
              <li><strong>Personnel</strong> - Can manage assets and view reports</li>
              <li><strong>Admin official</strong> - Full management capabilities</li>
              <li><strong>System admin</strong> - Complete system control</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <h3 className="h5 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>System Administrator</h3>
        <div className="row g-4">
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Name *
            </label>
            <input
              type="text"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}
              placeholder="Administrator name"
              value={orgData.contactPerson || ''}
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Email *
            </label>
            <input
              type="email"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px',
                backgroundColor: '#f8f9fa'
              }}
              placeholder="admin@organization.com"
              value={orgData.contactEmail || ''} 
              readOnly
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Password *
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Create password"
              value={orgData.password}
              onChange={(e) => setOrgData({...orgData, password: e.target.value})}
            />
          </div>
          <div className="col-md-6">
            <label className="form-label fw-medium" style={{ color: styles.primaryColor }}>
              Confirm Password *
            </label>
            <input
              type="password"
              className="form-control form-control-lg"
              style={{ 
                borderColor: styles.lightColor,
                borderRadius: '8px'
              }}
              placeholder="Confirm password"
              value={orgData.confirmPassword}
              onChange={(e) => setOrgData({...orgData, confirmPassword: e.target.value})}
            />
          </div>
        </div>
      </div>

      {/* Three CSV Upload Sections */}
      <div className="row g-4 mb-4">
        {/* Heads Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Heads</h5>
              <p className="text-muted small">Admin officials & System admins</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('heads')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('heads', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.heads && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.heads.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Personnel Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Personnel</h5>
              <p className="text-muted small">Staff with asset management access</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('personnel')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('personnel', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.personnel && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.personnel.name}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Standard Users Upload */}
        <div className="col-md-4">
          <div className="p-4 border rounded-3 h-100" style={{ borderColor: styles.lightColor }}>
            <div className="text-center mb-3">
              <Upload style={{ color: styles.accentColor }} size={24} />
              <h5 className="fw-semibold mt-2" style={{ color: styles.primaryColor }}>Standard Users</h5>
              <p className="text-muted small">Basic users with limited access</p>
            </div>
            
            <button
              type="button"
              onClick={() => downloadTemplate('standardUsers')}
              className="btn btn-sm mb-3 w-100"
              style={{ borderColor: styles.accentColor, color: styles.accentColor, backgroundColor: 'transparent' }}
            >
              <Download size={16} className="me-2" />
              Download Template
            </button>
            
            <div className="border border-2 border-dashed rounded p-3" style={{ borderColor: styles.lightColor }}>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => handleFileUpload('standardUsers', e.target.files[0])}
                className="form-control form-control-sm"
              />
              {uploadedFiles.standardUsers && (
                <div className="d-flex align-items-center text-success small mt-2">
                  <CheckCircle size={14} className="me-1" />
                  {uploadedFiles.standardUsers.name}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="container" style={{ maxWidth: '1000px' }}>
      <div className="text-center mb-5">
        <Database style={{ color: styles.accentColor }} className="mb-3" size={40} />
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>Import Assets</h2>
        <p className="text-muted">Add your organization's assets to the system</p>
      </div>

           <div className="row g-3">
        <div className="col-12">
          <div 
            className="p-3 rounded-3"
            style={{ 
              borderLeft: '4px solid #28a745',
              backgroundColor: '#f8fff9'
            }}
          >
            <div className="d-flex">
              <AlertCircle className="text-success me-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>Asset Status Options:</h6>
                <ul className="mb-0 small text-muted">
                  <li><strong>Operational</strong> - Asset is active and in use</li>
                  <li><strong>Retired</strong> - Asset is no longer in active use</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="col-12">
          <div 
            className="p-3 rounded-3"
            style={{ 
              borderLeft: '4px solid #ffc107',
              backgroundColor: '#fffef8'
            }}
          >
            <div className="d-flex">
              <AlertCircle className="text-warning me-3 mt-1 flex-shrink-0" size={20} />
              <div>
                <p className="mb-0 small text-muted">
                  <strong>Don't have your data ready?</strong> No worries! You can skip this step and add assets later from your dashboard.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

  <div className="row justify-content-center mb-4">
  <div className="col-lg-6 col-md-8 mt-4">     
   <div 
  className="p-3 border rounded-3"
  style={{
    cursor: 'pointer',
    borderColor: assetImportMethod === 'csv' ? styles.accentColor : styles.lightColor,
    borderWidth: '2px',
    backgroundColor: 'white',
    transition: 'all 0.3s ease',
    maxWidth: '500px',
    margin: '0 auto'
  }}
  onClick={() => setAssetImportMethod('csv')}
>
            <div className="text-center">
              <Upload style={{ color: styles.accentColor }} className="mb-3" size={28} />
              <h4 className="h5 fw-semibold mb-2" style={{ color: styles.primaryColor }}>CSV Upload</h4>
              <p className="text-muted mb-3">Upload a CSV file with your asset data</p>
            </div>
            
            
              <div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadTemplate('assets');
                  }}
                  className="btn btn-sm mb-3 d-flex align-items-center mx-auto"
                  style={{
                    borderColor: styles.accentColor,
                    color: styles.accentColor,
                    backgroundColor: 'transparent'
                  }}
                >
                  <Download size={16} className="me-2" />
                  Download Template
                </button>
                
                <div 
                  className="border border-2 border-dashed rounded p-3"
                  style={{ borderColor: styles.lightColor, backgroundColor: 'white'}}
                >
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => handleFileUpload('assets', e.target.files[0])}
                    className="form-control form-control-sm"
                  />
                  {uploadedFiles.assets && (
                    <div className="d-flex align-items-center text-success small mt-2">
                      <CheckCircle size={16} className="me-2" />
                      {uploadedFiles.assets.name}
                    </div>
                  )}
                </div>
              </div>
           

            
          </div>
        </div>
      </div>

    </div>
  );

  const renderStep4 = () => (

    
    <div className="container" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-5">
        <div 
          className="d-inline-flex align-items-center justify-content-center rounded-circle mb-4"
          style={{ 
            width: '80px', 
            height: '80px',
            backgroundColor: isSetupComplete() ? '#28a74520' : '#ffc10720'
          }}
        >
          <CheckCircle 
            className={isSetupComplete() ? 'text-success' : 'text-warning'} 
            size={40} 
          />
        </div>
        <h2 className="h3 fw-bold mb-2" style={{ color: styles.primaryColor }}>
          {isSetupComplete() ? 'Setup Complete!' : 'Setup Incomplete'}
        </h2>
      
      </div>

            {isSetupComplete() && (
        <div 
          className="p-3 rounded-3 mb-4"
          style={{ 
            borderLeft: '4px solid #28a745',
            backgroundColor: '#f8fff9'
          }}
        >
          <div className="d-flex">
            <CheckCircle className="text-success me-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <h6 className="fw-semibold mb-2" style={{ color: styles.primaryColor }}>ðŸŽ‰ Congratulations!</h6>
              <p className="mb-0 small text-muted">
                Your OpenFMS system has been successfully set up! All data has been imported and your system is now ready for full operation. 
                You'll be redirected to your System Admin dashboard where you can manage users, assets, and system settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {!isSetupComplete() && (
        <div 
          className="p-3 rounded-3"
          style={{ 
            borderLeft: '4px solid #17a2b8',
            backgroundColor: '#f8fdff'
          }}
        >
          <div className="d-flex">
            <AlertCircle className="text-info me-3 mt-1 flex-shrink-0" size={20} />
            <div>
              <p className="mb-0 small text-muted">
                You can complete the skipped steps later from your System Admin dashboard. The system is ready to use with basic configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <h3 className="h5 fw-semibold mb-4" style={{ color: styles.secondaryColor }}>Configuration Summary</h3>
        
        <div>
          {[
            { label: 'Organization:', value: orgData.name || 'Not specified' },
            { label: 'Organization Type:', value: orgData.orgType || 'Not specified' },
            { label: 'Country:', value: orgData.country || 'Not specified' },
            { label: 'Website:', value: orgData.website || 'Not specified' },
            { label: 'Address:', value: orgData.address || 'Not specified' },
            { label: 'Phone:', value: orgData.phone || 'Not specified' },
            { label: 'Admin Email:', value: orgData.contactEmail || 'Not specified' }
          ].map((item, index) => (
            <div key={index} className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
              <span className="fw-medium text-muted">{item.label}</span>
              <span style={{ color: styles.primaryColor }}>{item.value}</span>
            </div>
          ))}
          
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
            <span className="fw-medium text-muted">User Import Method:</span>
            <span 
              className="badge text-white px-3 py-1"
              style={{
                backgroundColor: getUserImportMethodDisplay() === 'Skipped' ? '#ffc107' :
                              getUserImportMethodDisplay() === 'CSV Bulk Upload' ? '#28a745' :
                              '#6c757d'
              }}
            >
              {getUserImportMethodDisplay()}
            </span>
          </div>
          
          <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
            <span className="fw-medium text-muted">Asset Import Method:</span>
            <span 
              className="badge text-white px-3 py-1"
              style={{
                backgroundColor: getAssetImportMethodDisplay() === 'Skipped' ? '#ffc107' :
                              getAssetImportMethodDisplay() === 'CSV Bulk Upload' ? '#28a745' :
                              '#6c757d'
              }}
            >
              {getAssetImportMethodDisplay()}
            </span>
          </div>
          
          {(uploadedFiles.heads || uploadedFiles.personnel || uploadedFiles.standardUsers) && (
            <div className="d-flex justify-content-between align-items-center py-3 border-bottom" style={{ borderColor: styles.lightColor }}>
              <span className="fw-medium text-muted">Users CSV Files:</span>
              <div className="text-end">
                {uploadedFiles.heads && <div className="text-success fw-medium small">{uploadedFiles.heads.name}</div>}
                {uploadedFiles.personnel && <div className="text-success fw-medium small">{uploadedFiles.personnel.name}</div>}
                {uploadedFiles.standardUsers && <div className="text-success fw-medium small">{uploadedFiles.standardUsers.name}</div>}
              </div>
            </div>
          )}
          
          {uploadedFiles.assets && (
            <div className="d-flex justify-content-between align-items-center py-3">
              <span className="fw-medium text-muted">Assets CSV:</span>
              <span className="text-success fw-medium">{uploadedFiles.assets.name}</span>
            </div>
          )}
        </div>
      </div>


    </div>
  );

  return (
    <div style={styles.container}>
      <div className="container" style={{ maxWidth: '1200px' }}>
        {renderProgressBar()}
        
        <div style={{ paddingTop: '2rem' }}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          
          <div className="d-flex justify-content-between align-items-center mt-5 pt-4 border-top" style={{ borderColor: styles.lightColor }}>
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="btn d-flex align-items-center px-4 py-2"
              style={{
                backgroundColor: currentStep === 1 ? styles.bgColor : styles.secondaryColor,
                color: currentStep === 1 ? '#666' : 'white',
                border: 'none',
                borderRadius: '8px'
              }}
            >
              <ChevronLeft size={16} className="me-2" />
              Previous
            </button>
            
            <div className="d-flex gap-3">
              {(currentStep === 2 || currentStep === 3) && (
                <button
                  onClick={() => handleSkip(currentStep === 2 ? 'users' : 'assets')}
                  className="btn px-4 py-2"
                  style={{
                    borderColor: styles.lightColor,
                    color: styles.primaryColor,
                    backgroundColor: 'transparent',
                    borderRadius: '8px'
                  }}
                >
                  Skip & Continue
                </button>
              )}
              
              {currentStep < totalSteps ? (
                <button
                  onClick={handleNext}
                  disabled={currentStep === 2 && (!orgData.password || !orgData.confirmPassword || orgData.password !== orgData.confirmPassword)}
                  className="btn d-flex align-items-center px-4 py-2 text-white"
                  style={{
                    backgroundColor: (currentStep === 2 && (!orgData.password || !orgData.confirmPassword || orgData.password !== orgData.confirmPassword))
                      ? styles.bgColor
                      : styles.accentColor,
                    color: (currentStep === 1 && !orgData.name) ? '#666' : 'white',
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  Next
                  <ChevronRight size={16} className="ms-2" />
                </button>
              ) : (
                <button
// Replace the setup completion button onClick function in SetupWizard.js

onClick={async () => {
  try {
    console.log("=== STARTING SETUP COMPLETION ===");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Please log in again');
    }

    console.log("Current user:", user.email);

    // Update password if provided
    if (orgData.password && orgData.password === orgData.confirmPassword) {
      const { error: passwordError } = await supabase.auth.updateUser({
        password: orgData.password
      });
      if (passwordError) {
        console.error("Password update error:", passwordError);
        // Don't throw here, continue with setup
      }
    }

    // Create organization
    console.log("Creating organization...");
    const { data: orgResult, error: orgError } = await supabase
      .from("organizations")
      .insert([{
        org_name: orgData.name,
        org_type_id: 1,
        country_id: 1,
        website: orgData.website || null,
        address: orgData.address,
        contact_person: orgData.contactPerson,
        contact_email: orgData.contactEmail,
        phone: orgData.phone
      }])
      .select()
      .single();
      
    if (orgError) {
      console.error("Organization creation error:", orgError);
      throw orgError;
    }
    
    console.log("Organization created:", orgResult);

    // Create admin user profile
    console.log("Creating admin user profile...");
    const { error: userInsertError } = await supabase
      .from("users")
      .insert([{
        username: `${orgData.contactEmail.split("@")[0]}_admin_${Date.now()}`,
        full_name: orgData.contactPerson,
        email: orgData.contactEmail.toLowerCase().trim(),
        role_id: 1, // System admin role
        user_status: "active",
        password_hash: PasswordUtils.hashPassword(orgData.password),
        auth_uid: user.id,
        organization_id: orgResult.organization_id
      }]);

    if (userInsertError) {
      console.error("User profile creation error:", userInsertError);
      throw userInsertError;
    }

    localStorage.setItem('userEmail', orgData.contactEmail.toLowerCase().trim());
    localStorage.setItem('userId', user.id);
    localStorage.setItem('userRole', 'sysadmin');// System admin
    localStorage.setItem('organizationId', orgResult.organization_id.toString());

    // Get role mapping
    const roleMap = await getRoleMap();
    console.log("Role mapping:", roleMap);

    // Import users with proper organization ID
    let userImportResults = {
      heads: 0,
      personnel: 0,
      standardUsers: 0
    };

    // Process each user type
    const importPromises = [];
    
    if (uploadedFiles.heads) {
      importPromises.push(
        importUsers(uploadedFiles.heads, roleMap, orgResult).then(result => {
          userImportResults.heads = result ? result.length : 0;
          console.log(`Heads imported: ${userImportResults.heads}`);
        }).catch(err => {
          console.error("Heads import failed:", err);
          userImportResults.heads = 0;
        })
      );
    }

    if (uploadedFiles.personnel) {
      importPromises.push(
        importUsers(uploadedFiles.personnel, roleMap, orgResult).then(result => {
          userImportResults.personnel = result ? result.length : 0;
          console.log(`Personnel imported: ${userImportResults.personnel}`);
        }).catch(err => {
          console.error("Personnel import failed:", err);
          userImportResults.personnel = 0;
        })
      );
    }

    if (uploadedFiles.standardUsers) {
      importPromises.push(
        importUsers(uploadedFiles.standardUsers, roleMap, orgResult).then(result => {
          userImportResults.standardUsers = result ? result.length : 0;
          console.log(`Standard users imported: ${userImportResults.standardUsers}`);
        }).catch(err => {
          console.error("Standard users import failed:", err);
          userImportResults.standardUsers = 0;
        })
      );
    }

    // Wait for all user imports to complete
    await Promise.all(importPromises);

    // Import assets
    let assetImportResult = 0;
    if (uploadedFiles.assets) {
      try {
        console.log("Importing assets...");
        assetImportResult = await importAssets(uploadedFiles.assets, orgResult);
        console.log(`Assets imported: ${assetImportResult}`);
      } catch (err) {
        console.error("Asset import failed:", err);
        assetImportResult = 0;
      }
    }

    // Save setup data to localStorage
    const setupData = {
      completed: true,
      completedDate: new Date().toISOString(),
      organizationId: orgResult.organization_id,
      orgData: {
        name: orgData.name,
        contactPerson: orgData.contactPerson,
        contactEmail: orgData.contactEmail
      },
      uploadedFiles: {
        heads: uploadedFiles.heads ? { 
          fileName: uploadedFiles.heads.name, 
          count: userImportResults.heads,
          uploadDate: new Date().toISOString()
        } : null,
        personnel: uploadedFiles.personnel ? { 
          fileName: uploadedFiles.personnel.name, 
          count: userImportResults.personnel,
          uploadDate: new Date().toISOString()
        } : null,
        standardUsers: uploadedFiles.standardUsers ? { 
          fileName: uploadedFiles.standardUsers.name, 
          count: userImportResults.standardUsers,
          uploadDate: new Date().toISOString()
        } : null,
        assets: uploadedFiles.assets ? { 
          fileName: uploadedFiles.assets.name, 
          count: assetImportResult,
          uploadDate: new Date().toISOString()
        } : null
      },
      skippedSteps,
      userImportMethod,
      assetImportMethod,
      importResults: {
        users: userImportResults,
        assets: assetImportResult
      }
    };
    
    localStorage.setItem("setupWizardData", JSON.stringify(setupData));
    localStorage.removeItem("orgDataFromSignup");
    localStorage.setItem('setupJustCompleted', 'true');
    console.log("=== SETUP COMPLETED ===");
    console.log("Import results:", setupData.importResults);

    const totalUsers = Object.values(userImportResults).reduce((a, b) => a + b, 0) + 1; // +1 for admin
    
    alert(`Setup completed successfully! 
Users imported: ${totalUsers} (including your account)
Assets imported: ${assetImportResult}

You will now be redirected to your dashboard.`);
    
    // Navigate to dashboard instead of login since user is already authenticated
    navigate("/dashboard-sysadmin");

  } catch (err) {
    console.error("Setup completion failed:", err);
    alert("Setup failed: " + err.message + "\n\nCheck console for details.");
  }
}}
                  className="btn d-flex align-items-center px-4 py-2 text-white"
                  style={{
                    backgroundColor: isSetupComplete() ? '#28a745' : styles.accentColor,
                    border: 'none',
                    borderRadius: '8px'
                  }}
                >
                  {isSetupComplete() ? 'Complete Setup' : 'Skip & Continue'}
                  <CheckCircle size={16} className="ms-2" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}