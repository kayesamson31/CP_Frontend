// src/components/SystemAdminUserManagement.js
import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import Papa from 'papaparse';
import { PasswordUtils } from '../../utils/PasswordUtils';
import { EmailService } from '../../utils/EmailService';
import EmailProgressModal from '../../components/EmailProgressModal';

export default function SysAdUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState('edit');
  // Enhanced roles for System Administrator
const [roles, setRoles] = useState([]);
const [emailProgress, setEmailProgress] = useState({
  isVisible: false,
  progress: 0,
  total: 0,
  currentEmail: '',
  successCount: 0,
  failedCount: 0
});

const fetchRoles = async () => {
  try {
    const { data, error } = await supabase
      .from('roles')
      .select('role_name')
      .order('role_id', { ascending: true });
    
    if (error) throw error;
    
    setRoles(data.map(role => role.role_name));
    
  } catch (err) {
    console.error('Error fetching roles:', err);
    // Fallback to default roles
    setRoles(['System Admin', 'Admin Official', 'Personnel', 'Standard User']);
  }
};

 


  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Standard User',
    status: 'Active'
  });


// Helper function to get role_id from role name
const getRoleIdFromRole = (roleString) => {
  if (!roleString || typeof roleString !== 'string') {
    return 4; // Default to Standard User
  }
  
  const normalizedRole = roleString.trim().toLowerCase();
  
  const roleMap = {
    'admin official': 2,
    'system admin': 1,
    'sysadmin': 1,
    'sys admin': 1,
    'personnel': 3,
    'standard user': 4,
    'standard': 4,
    'user': 4
  };
  
  return roleMap[normalizedRole] || 4;
};

const handleEmailProgressClose = () => {
  setEmailProgress(prev => ({ ...prev, isVisible: false }));
  
  const { successCount, failedCount } = emailProgress;
  if (failedCount > 0) {
    alert(`Email Summary:\n✓ ${successCount} emails sent successfully\n✗ ${failedCount} emails failed\n\nYou may need to manually send credentials to failed recipients.`);
  }
};

const fetchUsers = async () => {
  try {
    setLoading(true);
    setError(null);
    
    const { data, error } = await supabase
      .from('users')
      .select(`
        user_id,
        username,
        full_name,
        email,
        role_id,
        user_status,
        date_created,
        roles (role_name)
      `)
      .order('date_created', { ascending: false });
    
    if (error) throw error;
    
    // Transform data to match your UI format
    const transformedUsers = data.map(user => ({
      id: user.user_id,
      name: user.full_name,
      email: user.email,
      role: user.roles.role_name,
      roleId: user.role_id,
      status: user.user_status === 'active' ? 'Active' : 'Inactive',
      dateCreated: user.date_created,
    }));
    
    setUsers(transformedUsers);
    
  } catch (err) {
    setError(err.message);
    console.error('Error fetching users:', err);
  } finally {
    setLoading(false);
  }
};

const createUser = async (userData) => {
  try {
    setLoading(true);
    
    const response = await fetch('/api/sysadmin/users', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(userData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create user');
    }
    
    const newUser = await response.json();
    setUsers(prevUsers => [...prevUsers, newUser]);
    alert('User created successfully! Welcome email sent with login credentials.');
    
  } catch (err) {
    setError(err.message);
    console.error('Error creating user:', err);
    alert('Error creating user: ' + err.message);
  } finally {
    setLoading(false);
  }
};

const updateUser = async (userId, userData) => {
  try {
    setLoading(true);
    
    // Prepare the update data
    const updateData = {
      full_name: userData.name,
      email: userData.email.toLowerCase(),
      role_id: getRoleIdFromRole(userData.role),
      user_status: userData.status === 'Active' ? 'active' : 'inactive'
    };

    console.log('Updating user:', userId, updateData);

    // Update in database
    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('user_id', userId)
      .select();
    
    if (error) {
      console.error('Database Update Error:', error);
      throw new Error(`Failed to update user: ${error.message}`);
    }

    console.log('✓ User updated successfully:', data);
    
    // Refresh user list
    await fetchUsers();
    
    alert('User updated successfully!');
    
  } catch (err) {
    setError(err.message);
    console.error('Error updating user:', err);
    alert('Error updating user: ' + err.message);
  } finally {
    setLoading(false);
  }
};

 const deleteUser = async (userId) => {
  try {
    setLoading(true);
    
    console.log('Permanently deleting user:', userId);

    // Delete from database
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('user_id', userId);
    
    if (error) {
      console.error('Database Delete Error:', error);
      throw new Error(`Failed to delete user: ${error.message}`);
    }

    console.log('✓ User permanently deleted');
    
    // Refresh user list
    await fetchUsers();
    
    alert('User permanently deleted from the system.');
    
  } catch (err) {
    setError(err.message);
    console.error('Error deleting user:', err);
    alert('Error deleting user: ' + err.message);
  } finally {
    setLoading(false);
  }
};


  const bulkCreateUsers = async (usersData) => {
    try {
      setLoading(true);
      
      const newUsers = usersData.map((user, index) => ({
        ...user,
        id: Date.now() + index,
        dateCreated: new Date().toISOString(),
        lastLogin: null,
        loginCount: 0,
        reportsDownloaded: 0,
        accountChanges: 0
      }));
      setUsers(prevUsers => [...prevUsers, ...newUsers]);
      alert(`Successfully uploaded ${usersData.length} users!\nWelcome emails sent with login credentials.`);
      
    } catch (err) {
      setError(err.message);
      console.error('Error bulk creating users:', err);
      alert('Error bulk creating users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const exportUsers = async (filters = {}) => {
    try {
      // Enhanced CSV export with additional System Admin data
      const csvData = filteredUsers.map(user => 
        `"${user.name}","${user.email}","${user.role}","${user.status}","${new Date(user.dateCreated).toLocaleDateString()}","${user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}","${user.loginCount || 0}","${user.reportsDownloaded || 0}","${user.accountChanges || 0}"`
      ).join('\n');
      const csvContent = 'Name,Email,Role,Status,Date Created,Last Login,Login Count,Reports Downloaded,Account Changes\n' + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `system_users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error exporting users:', err);
      alert('Error exporting users: ' + err.message);
    }
  };

 useEffect(() => {
  fetchUsers();
  fetchRoles();
}, []);

  // Filter users based on search and filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = !roleFilter || user.role === roleFilter;
      const matchesStatus = !statusFilter || user.status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
    setFilteredUsers(filtered);
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.dropdown')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

const handleAddUser = async (e) => {
  e.preventDefault();
  
  try {
    setLoading(true);
    
    // Get current user's organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated - please log in again.');
    }

    const userEmail = user.email;
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('email', userEmail)
      .single();

    if (userDataError || !userData) {
      throw new Error('User data not found');
    }

    const orgId = userData.organization_id;

    // Generate password
    const tempPassword = PasswordUtils.generateSecurePassword(10);
    const hashedPassword = PasswordUtils.hashPassword(tempPassword);

    // Prepare user data
    const newUserData = {
      full_name: newUser.name.trim(),
      email: newUser.email.trim().toLowerCase(),
      user_status: newUser.status === 'Active' ? 'pending_activation' : 'inactive',
      role_id: getRoleIdFromRole(newUser.role),
      organization_id: orgId,
      username: PasswordUtils.generateUsername(newUser.email),
      password_hash: hashedPassword,
      auth_uid: null
    };

    console.log('Creating user:', { ...newUserData, password_hash: '[HIDDEN]' });

    // Insert to database
    const { data: insertResult, error: insertError } = await supabase
      .from('users')
      .insert([newUserData])
      .select('*')
      .single();

    if (insertError) {
      console.error('Database Insert Error:', insertError);
      throw new Error(`Failed to save user to database: ${insertError.message}`);
    }

    console.log('✓ User created successfully in database');

    // Refresh user list
    await fetchUsers();

    // Close add user modal
    setShowAddUserModal(false);

    // Reset form
    setNewUser({
      name: '',
      email: '',
      role: 'Standard User',
      status: 'Active'
    });

    // Show email progress modal
    setEmailProgress({
      isVisible: true,
      progress: 0,
      total: 1,
      currentEmail: newUser.email,
      successCount: 0,
      failedCount: 0
    });

    // Send email credentials
    try {
      if (!EmailService.isConfigured()) {
        throw new Error('Email service not configured. Check environment variables.');
      }

      // Get organization name
      const { data: orgData } = await supabase
        .from('organizations')
        .select('org_name')
        .eq('organization_id', orgId)
        .single();

      const organizationName = orgData?.org_name || 'Your Organization';

      console.log('Sending credentials email to:', newUser.email);

      // Send credentials email using sendUserCredentials (single email function)
      const emailResult = await EmailService.sendUserCredentials(
        newUserData.email,
        newUserData.full_name,
        tempPassword,
        organizationName
      );

      // Update progress
      setEmailProgress(prev => ({
        ...prev,
        progress: 1,
        successCount: emailResult.success ? 1 : 0,
        failedCount: emailResult.success ? 0 : 1
      }));

      if (emailResult.success) {
        console.log('✓ Welcome email sent successfully');
      } else {
        console.error('✗ Email failed:', emailResult.error);
        // Show manual credentials in alert
        alert(
          `User created successfully but email failed to send.\n\n` +
          `Please manually send these credentials to the user:\n\n` +
          `Email: ${newUserData.email}\n` +
          `Temporary Password: ${tempPassword}\n` +
          `Login URL: ${window.location.origin}/login`
        );
      }

    } catch (emailError) {
      console.error('Email sending exception:', emailError);
      setEmailProgress(prev => ({
        ...prev,
        progress: 1,
        failedCount: 1
      }));
      
      // Show manual credentials in alert
      alert(
        `User created successfully but email failed to send.\n\n` +
        `Please manually send these credentials to the user:\n\n` +
        `Email: ${newUserData.email}\n` +
        `Temporary Password: ${tempPassword}\n` +
        `Login URL: ${window.location.origin}/login`
      );
    }

  } catch (err) {
    console.error('Error creating user:', err);
    alert('Error creating user: ' + err.message);
    setEmailProgress(prev => ({ ...prev, isVisible: false }));
  } finally {
    setLoading(false);
  }
};


const handleDeleteUserFromModal = (user) => {
  setDeletingUser(user);
  setActiveTab('delete');
};

  const handleEditUser = (user) => {
  setEditingUser({ ...user });
  setActiveTab('edit'); // Reset to edit tab
  setShowEditModal(true);
};

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    await updateUser(editingUser.id, editingUser);
    
    setShowEditModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (user) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
  if (!deletingUser) return;
  
  await deleteUser(deletingUser.id);
  
  // Close the edit modal (since delete tab is inside edit modal)
  setShowEditModal(false);
  setEditingUser(null);
  setDeletingUser(null);
  setActiveTab('edit'); // Reset to edit tab for next time
};

  const handleManualEntry = () => {
    setShowAddUserModal(true);
    setShowDropdown(false);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
    setShowDropdown(false);
  };

  // Bulk upload functions (same as original)
  const handleBulkUpload = (file) => {
    if (file && file.type === 'text/csv') {
      setUploadFile(file);
    } else if (file) {
      alert('Please select a valid CSV file.');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleBulkUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleBulkUpload(e.target.files[0]);
    }
  };

const processUpload = async () => {
  if (!uploadFile) {
    alert('No file selected for upload!');
    return;
  }

  setLoading(true);
  
  try {
    // Get current user's organization ID
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated - please log in again.');
    }

    const userEmail = user.email;
    const { data: userData, error: userDataError } = await supabase
      .from('users')
      .select('organization_id')
      .eq('email', userEmail)
      .single();

    if (userDataError || !userData) {
      throw new Error('User data not found');
    }

    const orgId = userData.organization_id;

    // Parse CSV content using PapaParse
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const csvContent = e.target.result;
        const parseResult = Papa.parse(csvContent, { 
          header: true, 
          skipEmptyLines: true,
          transformHeader: (header) => header.trim()
        });

        if (parseResult.errors.length > 0) {
          console.error('CSV Parse Errors:', parseResult.errors);
        }

        const csvRows = parseResult.data.filter(row => {
  // Support both lowercase and Capital case headers
  const name = row.Name || row.name;
  const email = row.Email || row.email;
  return name && name.trim() !== '' && email && email.trim() !== '';
});
        if (csvRows.length === 0) {
          throw new Error('No valid user data found in CSV file.');
        }

        console.log(`Processing ${csvRows.length} users from CSV`);

        // Generate passwords and prepare user data
      // Generate passwords and prepare user data
const usersWithPasswords = csvRows.map((row) => {
  const tempPassword = PasswordUtils.generateSecurePassword(10);
  const hashedPassword = PasswordUtils.hashPassword(tempPassword);

  // Support both lowercase and Capital case headers
  const name = (row.Name || row.name || '').trim();
  const email = (row.Email || row.email || '').trim().toLowerCase();
  const role = (row.Role || row.role || 'Standard User').trim();

  return {
    full_name: name,
    email: email,
    user_status: 'pending_activation',
    role_id: getRoleIdFromRole(role),
    organization_id: orgId,
    username: PasswordUtils.generateUsername(email),
    password_hash: hashedPassword,
    auth_uid: null,
    tempPassword: tempPassword
  };
});

        // Prepare database users (remove tempPassword)
        const dbUsers = usersWithPasswords.map(user => {
          const { tempPassword, ...dbUser } = user;
          return dbUser;
        });

        // Insert to database
        const { data: insertResult, error: insertError } = await supabase
          .from('users')
          .insert(dbUsers)
          .select('*');

        if (insertError) {
          console.error('Database Insert Error:', insertError);
          throw new Error(`Failed to save users to database: ${insertError.message}`);
        }

        const insertedCount = insertResult ? insertResult.length : dbUsers.length;
        console.log(`Successfully inserted ${insertedCount} users to database`);

        // Refresh user list
        await fetchUsers();

        // Close bulk upload modal BEFORE email sending
        setShowBulkUploadModal(false);
        setUploadFile(null);
        setDragActive(false);

        // Show email progress modal
        setEmailProgress({
          isVisible: true,
          progress: 0,
          total: usersWithPasswords.length,
          currentEmail: '',
          successCount: 0,
          failedCount: 0
        });

        // Send bulk emails
        console.log('Starting bulk email send...');
        let successfulEmails = 0;
        let failedEmails = 0;

        try {
          if (!EmailService.isConfigured()) {
            throw new Error('Email service not configured. Check environment variables.');
          }

          // Get organization name for email
          const { data: orgData } = await supabase
            .from('organizations')
            .select('org_name')
            .eq('organization_id', orgId)
            .single();

          const organizationName = orgData?.org_name || 'Your Organization';

          const emailResults = await EmailService.sendBulkCredentials(
            usersWithPasswords,
            organizationName,
            (sent, total, currentEmail, success) => {
              setEmailProgress(prev => ({
                ...prev,
                progress: sent,
                currentEmail: currentEmail,
                successCount: success ? prev.successCount + 1 : prev.successCount,
                failedCount: success ? prev.failedCount : prev.failedCount + 1
              }));
            }
          );

          successfulEmails = emailResults.filter(r => r.success).length;
          failedEmails = emailResults.filter(r => !r.success).length;

          console.log(`Email sending complete: ${successfulEmails} sent, ${failedEmails} failed`);

        } catch (emailError) {
          console.error('Email sending failed:', emailError);
          failedEmails = usersWithPasswords.length;
          
          setEmailProgress(prev => ({
            ...prev,
            progress: usersWithPasswords.length,
            failedCount: usersWithPasswords.length,
            currentEmail: 'Email sending failed'
          }));
        }

        console.log(`Final result: ${insertedCount} users created, ${successfulEmails} emails sent, ${failedEmails} emails failed`);

      } catch (error) {
        console.error('Error processing CSV:', error);
        alert(`Error: ${error.message}`);
        setEmailProgress(prev => ({ ...prev, isVisible: false }));
      } finally {
        setLoading(false);
      }
    };

    reader.readAsText(uploadFile);
    
  } catch (error) {
    console.error('Error processing user CSV:', error);
    alert(`Error: ${error.message}`);
    setEmailProgress(prev => ({ ...prev, isVisible: false }));
    setLoading(false);
  }
};

  const cancelUpload = () => {
    setShowBulkUploadModal(false);
    setUploadFile(null);
    setDragActive(false);
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'name,email,role\n"John Doe","john@example.com","Standard User"\n"Jane Smith","jane@example.com","Personnel"\n"Admin User","admin@example.com","Admin Official"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'system_user_upload_template.csv');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const downloadAllUsersCSV = () => {
    exportUsers();
  };

  // Show loading state
  if (loading && users.length === 0) {
    return (
      <SidebarLayout role="sysadmin">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5>Loading system users...</h5>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidebarLayout role="sysadmin">
        <div className="container-fluid">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading System Users</h4>
            <p>{error}</p>
            <button className="btn btn-outline-danger" onClick={fetchUsers}>
              Try Again
            </button>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="sysadmin">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-0">System User Management</h3>
            <small className="text-muted">Full system administration - All user types and permissions</small>
          </div>
       
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-success"
              onClick={downloadAllUsersCSV}
              disabled={loading}
            >
              Export CSV
            </button>
            
            {/* Add New User Dropdown */}
            <div className="dropdown">
              <button 
                className="btn btn-primary dropdown-toggle d-flex align-items-center"
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={loading}
                style={{ minWidth: '160px' }}
              >
                Add New User
              </button>
              {showDropdown && (
                <div className="dropdown-menu show" style={{ minWidth: '160px' }}>
                  <button 
                    className="dropdown-item d-flex align-items-center"
                    onClick={handleManualEntry}
                    disabled={loading}
                  >
                    <span className="me-2"></span>
                    Manual Entry
                  </button>
                  <button 
                    className="dropdown-item d-flex align-items-center"
                    onClick={handleBulkUploadClick}
                    disabled={loading}
                  >
                    <span className="me-2"></span>
                    Bulk Upload (CSV)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

       {/* Search and Filters */}
<div className="row mb-4">
  <div className="col-md-6">
    <input
      type="text"
      className="form-control"
      placeholder="Search assets by name, ID, or assignee..."
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      disabled={loading}
    />
  </div>
  <div className="col-md-3">
    <select
      className="form-select"
      value={statusFilter}
      onChange={(e) => setStatusFilter(e.target.value)}
      disabled={loading}
    >
      <option value="">All Status</option>
      <option value="Active">Active</option>
      <option value="Inactive">Inactive</option>
    </select>
  </div>
  <div className="col-md-3">
    <select
      className="form-select"
      value={roleFilter}
      onChange={(e) => setRoleFilter(e.target.value)}
      disabled={loading}
    >
      <option value="">All Categories</option>
      {roles.map(role => (
        <option key={role} value={role}>{role}</option>
      ))}
    </select>
  </div>
</div>

        {/* Enhanced Users Table with System Admin features */}
        <div className="bg-white rounded shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date Added</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle me-3 d-flex align-items-center justify-content-center ${
                          user.status === 'Active' ? 'bg-success' : 'bg-secondary'
                        }`} style={{ width: '12px', height: '12px' }}></div>
                        <div>
                          <div className="fw-semibold">{user.name}</div>
                          <small className="text-muted">{user.email}</small>
                        </div>
                      </div>
                    </td>

                    <td>
                      {user.role}
                    </td>

                    <td>
                      <span className={`badge ${
                        user.status === 'Active' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {user.status}
                      </span>
                    </td>

                    
                    <td>
                    <small className="text-muted">
                      {new Date(user.dateCreated).toLocaleDateString()}
                    </small>
                  </td>

                    <td>
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => handleEditUser(user)}
                      disabled={loading}
                      title="Manage User"
                    >
                      Edit
                    </button>
                  </td>


                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && !loading && (
            <div className="text-center py-5 text-muted">
              <h5>No users found</h5>
              <p>
                {users.length === 0 
                  ? "No users have been added yet. Click 'Add New User' to get started." 
                  : "Try adjusting your search or filter criteria"
                }
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal - Enhanced for System Admin */}
        {showAddUserModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New System User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddUserModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Full Name *</label>
                      <input
                        type="text"
                        className="form-control"
                        value={newUser.name}
                        onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Email Address *</label>
                      <input
                        type="email"
                        className="form-control"
                        value={newUser.email}
                        onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                        required
                        disabled={loading}
                      />
                    </div>
                    <div className="mb-3">
                      <label className="form-label">User Role *</label>
                      <select
                        className="form-select"
                        value={newUser.role}
                        onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                        required
                        disabled={loading}
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="form-text">
                        <small>System Admin can create all user types including other System Administrators</small>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label className="form-label">Account Status</label>
                      <select
                        className="form-select"
                        value={newUser.status}
                        onChange={(e) => setNewUser({...newUser, status: e.target.value})}
                        disabled={loading}
                      >
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div className="alert alert-info">
                      <small>
                        📧 Welcome email with login credentials will be sent to the user.<br />
                        🔒 User will be required to change password on first login.
                      </small>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setShowAddUserModal(false)}
                      disabled={loading}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                      {loading ? 'Creating...' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      {/* Unified User Management Modal */}
{showEditModal && editingUser && (
  <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-xl">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Manage User - {editingUser.name}</h5>
          <button
            type="button"
            className="btn-close"
            onClick={() => setShowEditModal(false)}
          ></button>
        </div>
        
        {/* Tab Navigation */}
        <div className="modal-body p-0">
          <nav className="nav nav-tabs">
            <button
              className={`nav-link ${activeTab === 'edit' ? 'active' : ''}`}
              onClick={() => setActiveTab('edit')}
            >
              Edit Details
            </button>
          
            <button
              className={`nav-link ${activeTab === 'delete' ? 'active text-danger' : ''}`}
              onClick={() => {
                setActiveTab('delete');
                handleDeleteUserFromModal(editingUser);
              }}
            >
              Delete User
            </button>
          </nav>
          
          {/* Tab Content */}
          <div className="tab-content p-4">
            
            {/* Edit Details Tab */}
            {activeTab === 'edit' && (
              <div className="tab-pane fade show active">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Full Name</label>
                      <input
                        type="text"
                        className="form-control"
                        value={editingUser.name}
                        onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        value={editingUser.email}
                        onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                        disabled={loading}
                      />
                    </div>
                  </div>
                </div>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">User Role</label>
                      <select
                        className="form-select"
                        value={editingUser.role}
                        onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                        disabled={loading}
                      >
                        {roles.map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                      <div className="form-text">
                        <small>System Admin can assign any role including System Administrator</small>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">Account Status</label>
                      <div className="form-check form-switch mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={editingUser.status === 'Active'}
                          onChange={(e) => setEditingUser({
                            ...editingUser, 
                            status: e.target.checked ? 'Active' : 'Inactive'
                          })}
                          disabled={loading}
                        />
                        <label className="form-check-label">
                          Account Status: <strong className={editingUser.status === 'Active' ? 'text-success' : 'text-secondary'}>{editingUser.status}</strong>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
          
            
            {/* Delete User Tab */}
            {activeTab === 'delete' && (
              <div className="tab-pane fade show active">
                <div className="alert alert-danger">
                  <h6 className="alert-heading">⚠️ This action cannot be undone!</h6>
                  <p className="mb-0">You are about to permanently delete this user from the system.</p>
                </div>
                
                <div className="bg-light p-3 rounded mb-3">
                  <h6>User Details:</h6>
                  <ul className="mb-0">
                    <li><strong>Name:</strong> {editingUser.name}</li>
                    <li><strong>Email:</strong> {editingUser.email}</li>
                    <li><strong>Role:</strong> {editingUser.role}</li>
                    <li><strong>Status:</strong> {editingUser.status}</li>
                    <li><strong>Total Logins:</strong> {editingUser.loginCount || 0}</li>
                    <li><strong>Reports Downloaded:</strong> {editingUser.reportsDownloaded || 0}</li>
                  </ul>
                </div>
                
                <div className="mb-3">
                  <p className="text-muted mb-0">
                    <strong>What will happen:</strong><br />
                    • User account will be permanently removed<br />
                    • All user data and activity logs will be deleted<br />
                    • User will lose access immediately<br />
                    • This action cannot be reversed
                  </p>
                </div>
                
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => confirmDelete()}
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Permanently Delete User'}
                </button>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Footer - Only show Save/Cancel for Edit tab */}
        {activeTab === 'edit' && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSaveEdit}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
        
        {/* Close button for other tabs */}
        {activeTab !== 'edit' && (
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  </div>
)}




        {/* Bulk Upload Modal - Same as original but with enhanced template */}
        {showBulkUploadModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Bulk Upload System Users (CSV)</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={cancelUpload}
                    disabled={loading}
                  ></button>
                </div>
                
                <div className="modal-body">
                  {/* File Upload Area */}
                  <div 
                    className={`border-2 border-dashed rounded p-5 text-center position-relative ${
                      dragActive ? 'border-primary bg-light' : 'border-secondary'
                    } ${uploadFile ? 'border-success bg-success bg-opacity-10' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    style={{ minHeight: '200px', cursor: 'pointer' }}
                    onClick={() => document.getElementById('csvFileInput').click()}
                  >
                    <input
                      id="csvFileInput"
                      type="file"
                      className="d-none"
                      accept=".csv"
                      onChange={handleFileSelect}
                      disabled={loading}
                    />
                    
                    {!uploadFile ? (
                      <>
                        <div className="mb-3">
                          <svg width="48" height="48" fill="#6c757d" className="bi bi-cloud-arrow-up" viewBox="0 0 16 16">
                            <path fillRule="evenodd" d="M7.646 5.146a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 6.707V10.5a.5.5 0 0 1-1 0V6.707L6.354 7.854a.5.5 0 1 1-.708-.708l2-2z"/>
                            <path d="M4.406 3.342A5.53 5.53 0 0 1 8 2c2.69 0 4.923 2 5.166 4.579C14.758 6.804 16 8.137 16 9.773 16 11.569 14.502 13 12.687 13H3.781C1.708 13 0 11.366 0 9.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383zm.653.757c-.757.653-1.153 1.44-1.153 2.056v.448l-.445.049C2.064 6.805 1 7.952 1 9.318 1 10.785 2.23 12 3.781 12h8.906C13.98 12 15 10.988 15 9.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 4.825 10.328 3 8 3a4.53 4.53 0 0 0-2.941 1.1z"/>
                          </svg>
                        </div>
                        <h6 className="mb-2">Select CSV File</h6>
                        <p className="text-muted mb-3">
                          Drag and drop your CSV file here, or click to browse
                        </p>
                        <button 
                          type="button" 
                          className="btn btn-outline-primary"
                          disabled={loading}
                        >
                          Choose File
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="mb-3">
                          <svg width="48" height="48" fill="#198754" className="bi bi-file-earmark-check" viewBox="0 0 16 16">
                            <path d="M10.854 7.854a.5.5 0 0 0-.708-.708L7.5 9.793 6.354 8.646a.5.5 0 1 0-.708.708l1.5 1.5a.5.5 0 0 0 .708 0l3-3z"/>
                            <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                          </svg>
                        </div>
                        <h6 className="mb-2 text-success">File Selected</h6>
                        <p className="text-muted mb-0">{uploadFile.name}</p>
                        <small className="text-muted">
                          {(uploadFile.size / 1024).toFixed(2)} KB
                        </small>
                      </>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="d-flex justify-content-between align-items-center mt-4">
                    <button 
                      type="button"
                      className="btn btn-outline-secondary d-flex align-items-center"
                      onClick={downloadCSVTemplate}
                      disabled={loading}
                    >
                      <svg width="16" height="16" fill="currentColor" className="bi bi-download me-2" viewBox="0 0 16 16">
                        <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                        <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                      </svg>
                      Download Template
                    </button>
                    
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={cancelUpload}
                        disabled={loading}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={processUpload}
                        disabled={loading || !uploadFile}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg width="16" height="16" fill="currentColor" className="bi bi-upload me-2" viewBox="0 0 16 16">
                              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                            </svg>
                            Upload Users
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Enhanced Additional Info */}
                  <div className="mt-4 pt-3 border-top">
                    <small className="text-muted">
                      <strong>Supported format:</strong> CSV files only<br />
                      <strong>Required columns:</strong> name, email, role<br />
                      <strong>Available roles:</strong> {roles.join(', ')}<br />
                      <strong>System Admin Privilege:</strong> Can create users with any role including System Administrator
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Email Progress Modal */}
<EmailProgressModal
  isVisible={emailProgress.isVisible}
  progress={emailProgress.progress}
  total={emailProgress.total}
  currentEmail={emailProgress.currentEmail}
  successCount={emailProgress.successCount}
  failedCount={emailProgress.failedCount}
  onClose={handleEmailProgressClose}
/>
    </SidebarLayout>
  );
}