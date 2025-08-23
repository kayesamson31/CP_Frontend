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
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const roles = ['Standard User', 'Personnel', 'Admin Official'];

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
      
      // For now, simulate API call with empty data
      await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
      setUsers([]); // Start with empty array - backend will provide data
      
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
      
      // For now, just show placeholder message
      alert('User creation will be handled by backend API');
      
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
      
      // For now, just show placeholder message
      alert('User update will be handled by backend API');
      
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
      
      // For now, just show placeholder message
      alert(`Bulk upload will be handled by backend API.\nWould process ${usersData.length} users.`);
      
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
      
      // For now, show placeholder message
      alert('CSV export will be handled by backend API');
      
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

  const handleBulkUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
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
            setShowBulkUpload(false);
            
            // Reset file input
            e.target.value = '';
            
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
      reader.readAsText(file);
    } else {
      alert('Please select a valid CSV file.');
    }
  };

  const downloadCSVTemplate = () => {
    const csvContent = 'Name,Email,Role\n"John Doe","john@example.com","Standard User"\n"Jane Smith","jane@example.com","Personnel"';
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
       
          <div>
            <button 
              className="btn btn-outline-success me-2"
              onClick={downloadAllUsersCSV}
              disabled={loading}
            >
              📥 Download Users CSV
            </button>
            <button 
              className="btn btn-outline-primary me-2"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
              disabled={loading}
            >
              📄 Upload CSV
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddUserModal(true)}
              disabled={loading}
            >
              + Add User
            </button>
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

        {/* Bulk Upload Section */}
        {showBulkUpload && (
          <div className="bg-light p-4 mb-4" style={{ borderRadius: '8px' }}>
            <h5>Bulk Upload Users</h5>
            <p className="text-muted mb-3">Upload a CSV file to add multiple users at once</p>
            <div className="d-flex gap-3 align-items-center">
              <input
                type="file"
                className="form-control"
                accept=".csv"
                onChange={handleBulkUpload}
                style={{ maxWidth: '300px' }}
                disabled={loading}
              />
              <button 
                className="btn btn-outline-secondary"
                onClick={downloadCSVTemplate}
                disabled={loading}
              >
                Download Template
              </button>
            </div>
          </div>
        )}

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
                  ? "No users have been added yet. Click 'Add User' to get started." 
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
      </div>
    </SidebarLayout>
  );
}