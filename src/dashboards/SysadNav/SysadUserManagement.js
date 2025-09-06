// src/components/SystemAdminUserManagement.js
import React, { useState, useEffect } from 'react';
import SidebarLayout from '../../Layouts/SidebarLayout';

export default function SysAdUserManagement() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [resetUser, setResetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);

  // System-level roles that System Admin can assign
  const roles = ['Standard User', 'Personnel', 'Admin Official'];

  // Form state for adding new user
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: 'Standard User',
    status: 'Active',
    password: '',
    confirmPassword: ''
  });

  // Mock data for demonstration
  const mockUsers = [
    {
      id: 1,
      name: 'Juan Dela Cruz',
      email: 'juan@orga.com',
      role: 'Admin Official',
      organization: 'Organization A',
      status: 'Active',
      dateCreated: '2024-01-15',
      lastLogin: '2024-08-25',
      createdBy: 'System Admin'
    },
    {
      id: 2,
      name: 'Maria Santos',
      email: 'maria@orgb.com',
      role: 'Personnel',
      organization: 'Organization B',
      status: 'Active',
      dateCreated: '2024-02-20',
      lastLogin: '2024-08-26',
      createdBy: 'System Admin'
    },
    {
      id: 3,
      name: 'Pedro Garcia',
      email: 'pedro@orga.com',
      role: 'Standard User',
      organization: 'Organization A',
      status: 'Inactive',
      dateCreated: '2024-03-10',
      lastLogin: '2024-07-15',
      createdBy: 'System Admin'
    }
  ];

  const mockOrganizations = [
    { id: 1, name: 'Organization A', status: 'Active' },
    { id: 2, name: 'Organization B', status: 'Active' },
    { id: 3, name: 'Organization C', status: 'Active' }
  ];


  // Simulated fetch functions
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      await new Promise(resolve => setTimeout(resolve, 800));
      setUsers(mockUsers);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  useEffect(() => {
    fetchUsers();
  }, []);

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

  // --- Event Handlers ---
  const handleAddUser = async (e) => {
    e.preventDefault();
    if (newUser.password !== newUser.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const userToAdd = {
        id: users.length + 1,
        ...newUser,
        dateCreated: new Date().toISOString().split('T')[0],
        lastLogin: null,
        createdBy: 'System Admin'
      };
      
      setUsers([...users, userToAdd]);
      setShowAddUserModal(false);
      setNewUser({
        name: '', email: '', role: 'Standard User', status: 'Active',
        organization: '', password: '', confirmPassword: ''
      });
      alert('User successfully added!');
    } catch (error) {
      alert('Failed to add user. Please try again.');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser({...user});
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(users.map(user => 
        user.id === editingUser.id ? editingUser : user
      ));
      
      setShowEditModal(false);
      setEditingUser(null);
      alert('User successfully updated!');
    } catch (error) {
      alert('Failed to update user. Please try again.');
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Inactive' : 'Active';
    const action = newStatus === 'Active' ? 'reactivated' : 'deactivated';
    
    if (window.confirm(`Are you sure you want to ${action === 'deactivated' ? 'deactivate' : 'reactivate'} this user?`)) {
      try {
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setUsers(users.map(user =>
          user.id === userId ? { ...user, status: newStatus } : user
        ));
        
        alert(`User successfully ${action}!`);
      } catch (error) {
        alert(`Failed to ${action} user. Please try again.`);
      }
    }
  };

  const handleResetPassword = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      setShowResetPasswordModal(false);
      setResetUser(null);
      alert('Password reset email has been sent to the user!');
    } catch (error) {
      alert('Failed to reset password. Please try again.');
    }
  };

  const handleBulkUpload = async (e) => {
    e.preventDefault();
    if (!bulkUploadFile) {
      alert('Please select a CSV file to upload.');
      return;
    }

    try {
      // Simulate bulk upload processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful upload
      alert('Bulk upload completed successfully! 15 users were added.');
      setShowBulkUpload(false);
      setBulkUploadFile(null);
      fetchUsers(); // Refresh the user list
    } catch (error) {
      alert('Bulk upload failed. Please check your CSV format and try again.');
    }
  };

  // --- UI Components ---
  if (loading && users.length === 0) {
    return (
      <SidebarLayout role="sysadmin">
        <div className="container-fluid d-flex justify-content-center align-items-center" style={{height: '60vh'}}>
          <div className="text-center">
            <div className="spinner-border text-primary mb-3"></div>
            <h5>Loading users...</h5>
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
            <h3 className="mb-0">User Management</h3>
            <p className="text-muted mb-0">Manage users in the system</p>
          </div>
          <div>
           
            <button 
              className="btn btn-outline-primary me-2"
              onClick={() => setShowBulkUpload(!showBulkUpload)}
            >
              Bulk upload
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddUserModal(true)}
            >
              + Add User
            </button>
          </div>
        </div>



        {/* Filters */}
        <div className="bg-light p-4 mb-4 rounded">
          <div className="row g-3">
            <div className="col-md-3">
              <input 
                className="form-control"
                placeholder="Search by name or email"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <select 
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All Roles</option>
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select 
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
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
                  <th>Last Login</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.name}</strong>
                      {user.role === 'Admin Official' && (
                        <span className="badge bg-warning ms-2">Admin</span>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>
                      <span className={`badge ${user.status==='Active'?'bg-success':'bg-secondary'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td>{user.dateCreated ? new Date(user.dateCreated).toLocaleDateString() : '-'}</td>
                    <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                    <td>
                      <div className="dropdown">
                        <button 
                          className="btn btn-sm btn-outline-secondary dropdown-toggle" 
                          data-bs-toggle="dropdown"
                        >
                          Actions
                        </button>
                        <ul className="dropdown-menu">
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleEditUser(user)}
                            >
                              ✏️ Edit User
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => handleToggleStatus(user.id, user.status)}
                            >
                              {user.status === 'Active' ? '🚫 Deactivate' : '✅ Reactivate'}
                            </button>
                          </li>
                          <li>
                            <button 
                              className="dropdown-item"
                              onClick={() => {
                                setResetUser(user);
                                setShowResetPasswordModal(true);
                              }}
                            >
                              🔄 Reset Password
                            </button>
                          </li>
                        </ul>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-5 text-muted">
              <h5>No users found</h5>
              <p>
                {users.length === 0 
                  ? "No users across organizations yet. Click 'Add User' to get started."
                  : "Try adjusting your search or filter criteria"}
              </p>
            </div>
          )}
        </div>

        {/* Add User Modal */}
        {showAddUserModal && (
          <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <form onSubmit={handleAddUser}>
                  <div className="modal-header">
                    <h5 className="modal-title">Add New User</h5>
                    <button type="button" className="btn-close" onClick={() => setShowAddUserModal(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Full Name</label>
                        <input 
                          className="form-control mb-3" 
                          placeholder="Enter full name" 
                          required 
                          value={newUser.name}
                          onChange={(e)=>setNewUser({...newUser, name:e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Email Address</label>
                        <input 
                          className="form-control mb-3" 
                          type="email" 
                          placeholder="Enter email address" 
                          required
                          value={newUser.email}
                          onChange={(e)=>setNewUser({...newUser, email:e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Role</label>
                        <select 
                          className="form-select mb-3" 
                          value={newUser.role}
                          onChange={(e)=>setNewUser({...newUser, role:e.target.value})}
                        >
                          {roles.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                     
                    </div>
                    <div className="row">
                      <div className="col-md-6">
                        <label className="form-label">Password</label>
                        <input 
                          className="form-control mb-3" 
                          type="password" 
                          placeholder="Enter password" 
                          required
                          value={newUser.password}
                          onChange={(e)=>setNewUser({...newUser, password:e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label">Confirm Password</label>
                        <input 
                          className="form-control mb-3" 
                          type="password" 
                          placeholder="Confirm password" 
                          required
                          value={newUser.confirmPassword}
                          onChange={(e)=>setNewUser({...newUser, confirmPassword:e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={()=>setShowAddUserModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Add User</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Edit User Modal */}
        {showEditModal && editingUser && (
          <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>Edit User — {editingUser.name}</h5>
                  <button type="button" className="btn-close" onClick={()=>setShowEditModal(false)}></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Full Name</label>
                      <input 
                        className="form-control mb-3" 
                        value={editingUser.name}
                        onChange={(e)=>setEditingUser({...editingUser, name:e.target.value})}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input 
                        className="form-control mb-3" 
                        type="email" 
                        value={editingUser.email}
                        onChange={(e)=>setEditingUser({...editingUser, email:e.target.value})}
                      />
                    </div>
                  </div>
                  <div className="row">
                    <div className="col-md-6">
                      <label className="form-label">Role</label>
                      <select 
                        className="form-select mb-3" 
                        value={editingUser.role}
                        onChange={(e)=>setEditingUser({...editingUser, role:e.target.value})}
                      >
                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                   
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={()=>setShowEditModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUpload && (
          <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <form onSubmit={handleBulkUpload}>
                  <div className="modal-header">
                    <h5 className="modal-title">Bulk Upload Users</h5>
                    <button type="button" className="btn-close" onClick={() => setShowBulkUpload(false)}></button>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <strong>CSV Format Required:</strong><br/>
                      Columns: Name, Email, Role, Organization, Status<br/>
                      <small>Download sample template: <a href="#" className="alert-link">sample_users.csv</a></small>
                    </div>
                    <input 
                      type="file" 
                      className="form-control" 
                      accept=".csv"
                      onChange={(e) => setBulkUploadFile(e.target.files[0])}
                      required
                    />
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowBulkUpload(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary">Upload Users</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Modal */}
        {showResetPasswordModal && resetUser && (
          <div className="modal show d-block" style={{backgroundColor:'rgba(0,0,0,0.5)'}}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reset Password</h5>
                  <button type="button" className="btn-close" onClick={() => setShowResetPasswordModal(false)}></button>
                </div>
                <div className="modal-body">
                  <p>Are you sure you want to reset the password for:</p>
                  <div className="alert alert-warning">
                    <strong>{resetUser.name}</strong><br/>
                    <small>{resetUser.email}</small>
                  </div>
                  <p><small>A password reset email will be sent to the user.</small></p>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowResetPasswordModal(false)}>Cancel</button>
                  <button type="button" className="btn btn-warning" onClick={handleResetPassword}>Send Reset Email</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audit Logs */}

      </div>
    </SidebarLayout>
  );
}