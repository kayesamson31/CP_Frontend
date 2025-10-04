// src/components/ActivityTracking.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Card, Spinner, Alert } from "react-bootstrap";
import SidebarLayout from "../../Layouts/SidebarLayout";
import { supabase } from '../../supabaseClient';
export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");
  const [filterRole, setFilterRole] = useState("all");
  const [filterActivityType, setFilterActivityType] = useState("all");
 
  
  useEffect(() => {
  const fetchActivities = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('activity_tracking')
        .select(`
          activity_id,
          activity_type,
          description,
          timestamp,
          user_id,
          users!activity_tracking_user_id_fkey (
            full_name,
            email,
            role_id,
            roles (role_name)
          )
        `)
        .order('timestamp', { ascending: false });

      // Apply date range filter
      if (dateRange !== 'all') {
        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - parseInt(dateRange));
        query = query.gte('timestamp', daysAgo.toISOString());
      }

      const { data, error } = await query;

      if (error) throw error;

      // Format data to match component structure
      const formattedActivities = data.map(activity => ({
        id: activity.activity_id,
        timestamp: activity.timestamp,
        user: activity.users?.full_name || 'Unknown User',
        email: activity.users?.email || 'No email',
        role: activity.users?.roles?.role_name || 'Unknown',
        actionTaken: activity.description || activity.activity_type
      }));

      setActivities(formattedActivities);
      setError(null);

    } catch (err) {
      console.error('Error fetching activities:', err);
      setError("Failed to fetch activity data.");
    } finally {
      setLoading(false);
    }
  };

  fetchActivities();
}, [dateRange]);

 const filteredActivities = activities.filter((act) => {
  const matchesSearch = 
    act.user.toLowerCase().includes(search.toLowerCase()) ||
    act.actionTaken.toLowerCase().includes(search.toLowerCase()) ||
    act.role.toLowerCase().includes(search.toLowerCase()) ||
    act.email.toLowerCase().includes(search.toLowerCase());

  const matchesRole = filterRole === 'all' || act.role === filterRole;
  
  const matchesActivityType = filterActivityType === 'all' || 
    act.actionTaken.toLowerCase().includes(filterActivityType.toLowerCase());

  return matchesSearch && matchesRole && matchesActivityType;
});

  const getActionBadgeColor = (action) => {
    const actionLower = action.toLowerCase();
    if (actionLower.includes('download')) return 'bg-info';
    if (actionLower.includes('delete')) return 'bg-danger';
    if (actionLower.includes('submit')) return 'bg-warning';
    if (actionLower.includes('approve')) return 'bg-success';
    if (actionLower.includes('reject')) return 'bg-danger';
    return 'bg-secondary';
  };

  return (
    <SidebarLayout role="admin">
      <div className="p-4">
        <h2 className="mb-4 fw-bold">Activity Tracking</h2>
        <p className="text-muted mb-4">
          Track admin activities including downloads, deletions, work order management, and report generation.
        </p>

{/* Filters */}
<div className="d-flex gap-3 mb-4">
  <Form.Control
    type="text"
    placeholder="Search by user, action, role, or email..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    className="flex-grow-1"
  />
  
  <Form.Select
    value={dateRange}
    onChange={(e) => setDateRange(e.target.value)}
    style={{ minWidth: "150px" }}
  >
    <option value="all">All Time</option>
    <option value="7">Last 7 Days</option>
    <option value="30">Last 30 Days</option>
    <option value="90">Last 90 Days</option>
  </Form.Select>
  
  <Form.Select
    value={filterRole}
    onChange={(e) => setFilterRole(e.target.value)}
    style={{ minWidth: "150px" }}
  >
    <option value="all">All Roles</option>
    <option value="Admin">Admin</option>
    <option value="Personnel">Personnel</option>
    <option value="System Admin">System Admin</option>
  </Form.Select>

  <Form.Select
    value={filterActivityType}
    onChange={(e) => setFilterActivityType(e.target.value)}
    style={{ minWidth: "180px" }}
  >
    <option value="all">All Activity Types</option>
    <option value="download">Downloads</option>
    <option value="submit">Submissions</option>
    <option value="approve">Approvals</option>
    <option value="reject">Rejections</option>
    <option value="delete">Deletions</option>
    <option value="update">Updates</option>
  </Form.Select>
</div>

        {/* Loading */}
        {loading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Loading activities...</p>
          </div>
        )}

        {/* Error */}
        {error && <Alert variant="danger">{error}</Alert>}

        {/* Empty State */}
        {!loading && activities.length === 0 && !error && (
          <Alert variant="info" className="text-center">
            <h5>No Activities Found</h5>
            <p className="mb-0">No admin activities have been recorded yet.</p>
          </Alert>
        )}

       {/* Activity Table */}
{!loading && !error && activities.length > 0 && (
  <div className="bg-white rounded shadow-sm">
    <div className="table-responsive">
      <table className="table table-hover mb-0">
       <thead className="table-light">
        <tr>
          <th>Timestamp</th>
          <th>User</th>
          <th>Role</th>
          <th>Email</th> 
          <th>Action Taken</th>
        </tr>
      </thead>
        <tbody>
          {filteredActivities.map((act) => (
            <tr
              key={act.id}
              style={{ cursor: "pointer" }}
              onClick={() => setSelectedActivity(act)}
            >
              <td>
                <small className="text-muted">
                  {new Date(act.timestamp).toLocaleString()}
                </small>
              </td>
              <td className="fw-semibold">{act.user}</td>
              <td>{act.role}</td>
              <td className="text-muted">{act.email}</td> 
              <td>
                <span className={`badge ${getActionBadgeColor(act.actionTaken)} me-2`}>
                  {act.actionTaken.includes('download') && '⬇️'}
                  {act.actionTaken.includes('delete') && '🗑️'}
                  {act.actionTaken.includes('submit') && '📝'}
                  {act.actionTaken.includes('approve') && '✅'}
                  {act.actionTaken.includes('reject') && '❌'}
                </span>
                {act.actionTaken}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {filteredActivities.length === 0 && search && (
        <div className="text-center py-4">
          <p className="text-muted mb-0">No activities match your search criteria.</p>
        </div>
      )}
    </div>
  </div>
)}

        {/* Activity Details Modal */}
        <Modal
          show={!!selectedActivity}
          onHide={() => setSelectedActivity(null)}
          centered
          size="md"
        >
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>
              <span className="me-2"></span>
              Activity Details
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedActivity && (
              <div className="row g-3">
                <div className="col-12">
                  <div className="border rounded p-3 bg-light">
                    <div className="row g-2">
                      <div className="col-sm-4">
                        <strong className="text-primary">Timestamp:</strong>
                      </div>
                      <div className="col-sm-8">
                        {selectedActivity.timestamp ? new Date(selectedActivity.timestamp).toLocaleString() : 'N/A'}
                      </div>

                      <div className="col-sm-4">
                        <strong className="text-primary"> User:</strong>
                      </div>
                      <div className="col-sm-8">
                        {selectedActivity.user || 'Unknown User'}
                      </div>

                      <div className="col-sm-4">
                        <strong className="text-primary"> Role:</strong>
                      </div>
                      <div className="col-sm-8">
                        <span className={`badge ${
                          selectedActivity.role === "Admin"
                            ? "bg-primary"
                            : selectedActivity.role === "Personnel"
                            ? "bg-success"
                            : "bg-secondary"
                        }`}>
                          {selectedActivity.role || 'Unknown'}
                        </span>
                      </div>

                      {/* ADD THESE LINES */}
                      <div className="col-sm-4">
                        <strong className="text-primary">Email:</strong>
                      </div>
                      <div className="col-sm-8">
                        {selectedActivity.email || 'No email provided'}
                      </div>

                      <div className="col-sm-4">
                        <strong className="text-primary">Action Taken:</strong>
                      </div>
                      <div className="col-sm-8">
                        <span className={`badge ${getActionBadgeColor(selectedActivity.actionTaken)} me-2`}>
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('download') }
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('delete')}
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('submit') }
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('approve') }
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('reject')}
                        </span>
                        {selectedActivity.actionTaken || 'No action specified'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setSelectedActivity(null)}>
              Close
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </SidebarLayout>
  );
}
