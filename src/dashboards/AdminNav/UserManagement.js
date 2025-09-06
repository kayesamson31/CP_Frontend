// src/components/UserManagement.js
import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const roles = ['Standard User', 'Personnel', 'Admin Official'];

  // Sample hardcoded data - 4 different examples
  const sampleUsers = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      email: 'juan.delacruz@company.com',
      role: 'Standard User',
      status: 'Active',
      dateCreated: '2024-01-15T08:30:00Z'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria.santos@company.com',
      role: 'Personnel',
      status: 'Active',
      dateCreated: '2024-02-20T10:15:00Z'
    },
    {
      id: 3,
      name: 'Roberto Garcia',
      email: 'roberto.garcia@company.com',
      role: 'Admin Official',
      status: 'Inactive',
      dateCreated: '2024-01-10T14:45:00Z'
    },
    {
      id: 4,
      name: 'Ana Reyes',
      email: 'ana.reyes@company.com',
      role: 'Personnel',
      status: 'Active',
      dateCreated: '2024-03-05T09:20:00Z'
    }
  ];

  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Standard User',
    status: 'Active'
  });

  // API Functions - Ready for backend integration
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users', {
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to fetch users');
      // }
      // 
      // const data = await response.json();
      // setUsers(data.users || []);
      
      // For now, simulate API call with sample data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setUsers(sampleUsers); // Use sample data instead of empty array
      
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
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(userData)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to create user');
      // }
      // 
      // const newUser = await response.json();
      // setUsers(prevUsers => [...prevUsers, newUser]);
      // 
      // // Show success message with temporary password if provided
      // if (newUser.tempPassword) {
      //   alert(`User added successfully!\n\nEmail sent to: ${newUser.email}\nTemporary Password: ${newUser.tempPassword}`);
      // } else {
      //   alert('User added successfully! Welcome email sent.');
      // }
      
      // For now, simulate adding user to sample data
      const newUserWithId = {
        ...userData,
        id: Date.now(), // Simple ID generation for demo
        dateCreated: new Date().toISOString()
      };
      setUsers(prevUsers => [...prevUsers, newUserWithId]);
      alert('User added successfully! Welcome email sent.');
      
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
      
      // TODO: Replace with actual API call
      // const response = await fetch(`/api/users/${userId}`, {
      //   method: 'PUT',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify(userData)
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to update user');
      // }
      // 
      // const updatedUser = await response.json();
      // setUsers(prevUsers => 
      //   prevUsers.map(user => user.id === userId ? updatedUser : user)
      // );
      
      // For now, simulate updating user in sample data
      setUsers(prevUsers => 
        prevUsers.map(user => user.id === userId ? { ...user, ...userData } : user)
      );
      alert('User updated successfully!');
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating user:', err);
      alert('Error updating user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const bulkCreateUsers = async (usersData) => {
    try {
      setLoading(true);
      
      // TODO: Replace with actual API call
      // const response = await fetch('/api/users/bulk', {
      //   method: 'POST',
      //   headers: {
      //     'Authorization': `Bearer ${token}`,
      //     'Content-Type': 'application/json'
      //   },
      //   body: JSON.stringify({ users: usersData })
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to bulk create users');
      // }
      // 
      // const result = await response.json();
      // setUsers(prevUsers => [...prevUsers, ...result.createdUsers]);
      // 
      // alert(`Successfully uploaded ${result.createdUsers.length} users!\nWelcome emails sent to all users.`);
      
      // For now, simulate bulk upload with sample data
      const newUsers = usersData.map((user, index) => ({
        ...user,
        id: Date.now() + index, // Simple ID generation for demo
        dateCreated: new Date().toISOString()
      }));
      setUsers(prevUsers => [...prevUsers, ...newUsers]);
      alert(`Successfully uploaded ${usersData.length} users!\nWelcome emails sent to all users.`);
      
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
      // TODO: Replace with actual API call
      // const queryParams = new URLSearchParams({
      //   search: searchTerm,
      //   role: roleFilter,
      //   status: statusFilter,
      //   ...filters
      // });
      // 
      // const response = await fetch(`/api/users/export?${queryParams}`, {
      //   headers: {
      //     'Authorization': `Bearer ${token}`
      //   }
      // });
      // 
      // if (!response.ok) {
      //   throw new Error('Failed to export users');
      // }
      // 
      // const blob = await response.blob();
      // const url = window.URL.createObjectURL(blob);
      // const a = document.createElement('a');
      // a.setAttribute('hidden', '');
      // a.setAttribute('href', url);
      // a.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      // document.body.appendChild(a);
      // a.click();
      // document.body.removeChild(a);
      // window.URL.revokeObjectURL(url);
      
      // For now, generate CSV from sample data
      const csvData = filteredUsers.map(user => 
        `"${user.name}","${user.email}","${user.role}","${user.status}","${new Date(user.dateCreated).toLocaleDateString()}"`
      ).join('\n');
      const csvContent = 'Name,Email,Role,Status,Date Created\n' + csvData;
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.setAttribute('hidden', '');
      a.setAttribute('href', url);
      a.setAttribute('download', `users_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error exporting users:', err);
      alert('Error exporting users: ' + err.message);
    }
  };

  // Initialize data on component mount
  useEffect(() => {
    fetchUsers();
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
    
    await createUser(newUser);
    
    // Reset form and close modal
    setNewUser({
      name: '',
      email: '',
      role: 'Standard User',
      status: 'Active'
    });
    setShowAddUserModal(false);
    
    // Refresh user list
    fetchUsers();
  };

  const handleEditRole = (user) => {
    setEditingUser({ ...user });
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    await updateUser(editingUser.id, editingUser);
    
    setShowEditModal(false);
    setEditingUser(null);
    
    // Refresh user list
    fetchUsers();
  };

  const handleManualEntry = () => {
    setShowAddUserModal(true);
    setShowDropdown(false);
  };

  const handleBulkUploadClick = () => {
    setShowBulkUploadModal(true);
    setShowDropdown(false);
  };

  // Enhanced bulk upload functions
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
    if (!uploadFile) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvText = event.target.result;
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        
        // Parse CSV data
        const usersData = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length >= 3) { // Name, Email, Role minimum
              const user = {
                name: values[0],
                email: values[1],
                role: values[2],
                status: 'Active' // Default status
              };
              usersData.push(user);
            }
          }
        }
        
        if (usersData.length > 0) {
          await bulkCreateUsers(usersData);
          cancelUpload();
          
          // Refresh user list
          fetchUsers();
        } else {
          alert('No valid user data found in CSV file.');
        }
      } catch (err) {
        console.error('Error processing CSV:', err);
        alert('Error processing CSV file: ' + err.message);
      }
    };
    reader.readAsText(uploadFile);
  };

  const cancelUpload = () => {
    setShowBulkUploadModal(false);
    setUploadFile(null);
    setDragActive(false);
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'name,email,role\n"John Doe","john@example.com","Standard User"\n"Jane Smith","jane@example.com","Personnel"';
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('hidden', '');
    a.setAttribute('href', url);
    a.setAttribute('download', 'user_upload_template.csv');
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
      <SidebarLayout role="admin">
        <div className="container-fluid">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
            <div className="text-center">
              <div className="spinner-border text-primary mb-3" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <h5>Loading users...</h5>
            </div>
          </div>
        </div>
      </SidebarLayout>
    );
  }

  // Show error state
  if (error) {
    return (
      <SidebarLayout role="admin">
        <div className="container-fluid">
          <div className="alert alert-danger" role="alert">
            <h4 className="alert-heading">Error Loading Users</h4>
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
    <SidebarLayout role="admin">
      <div className="container-fluid">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="mb-0">User Management</h3>
       
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-success"
              onClick={downloadAllUsersCSV}
              disabled={loading}
            >
              📥 Download Users CSV
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
        <div className="bg-light p-4 mb-4" style={{ borderRadius: '8px' }}>
          <div className="row">
            <div className="col-md-6">
              <input
                type="text"
                className="form-control"
                placeholder="Search by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={loading}
              />
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                disabled={loading}
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
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
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white rounded shadow-sm">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Date Created</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className={`rounded-circle me-2 d-flex align-items-center justify-content-center ${
                          user.status === 'Active' ? 'bg-success' : 'bg-secondary'
                        }`} style={{ width: '8px', height: '8px' }}></div>
                        {user.name}
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${
                        user.status === 'Active' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.dateCreated ? new Date(user.dateCreated).toLocaleDateString() : '-'}</td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEditRole(user)}
                        disabled={loading}
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

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add New User</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowAddUserModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleAddUser}>
                  <div className="modal-body">
                    <div className="mb-3">
                      <label className="form-label">Name *</label>
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
                      <label className="form-label">Email *</label>
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
                      <label className="form-label">Role *</label>
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
                      {loading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Edit User - {editingUser.name}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowEditModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingUser.name}
                      onChange={(e) => setEditingUser({...editingUser, name: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Role</label>
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
                  </div>
                  <div className="mb-3">
                    <div className="form-check form-switch">
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
                        Account Status: <strong>{editingUser.status}</strong>
                      </label>
                    </div>
                  </div>
                </div>
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
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header border-0 pb-0">
                  <h5 className="modal-title fw-bold">Bulk Upload Users (CSV)</h5>
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

                  {/* Additional Info */}
                  <div className="mt-4 pt-3 border-top">
                    <small className="text-muted">
                      <strong>Supported format:</strong> CSV files only<br />
                      <strong>Required columns:</strong> name, email, role<br />
                      <strong>Available roles:</strong> {roles.join(', ')}
                    </small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
}