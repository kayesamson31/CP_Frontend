// src/components/ActivityTracking.js
import React, { useState, useEffect } from "react";
import { Modal, Button, Table, Form, Card, Spinner, Alert } from "react-bootstrap";
import SidebarLayout from "../../Layouts/SidebarLayout";

export default function Activity() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        //  Replace with your actual API when ready:
        // const response = await fetch("/api/activities");
        // const data = await response.json();

        // Example data for visualization - remove this when connecting to real API
        const exampleData = [
          { id: 1, timestamp: "2024-09-06T09:30:00Z", user: "John Admin", role: "Admin", actionTaken: "Downloaded maintenance schedule" },
          { id: 2, timestamp: "2024-09-06T10:15:00Z", user: "Sarah Manager", role: "Admin", actionTaken: "Approved work order" },
          { id: 3, timestamp: "2024-09-06T11:00:00Z", user: "Mike Supervisor", role: "Personnel", actionTaken: "Submitted work order request" },
          { id: 4, timestamp: "2024-09-06T11:45:00Z", user: "Anna Director", role: "Admin", actionTaken: "Downloaded asset records" },
          { id: 5, timestamp: "2024-09-06T12:20:00Z", user: "John Admin", role: "Admin", actionTaken: "Rejected work order" },
          { id: 6, timestamp: "2024-09-06T13:10:00Z", user: "Lisa Coordinator", role: "Personnel", actionTaken: "Downloaded report" },
          { id: 7, timestamp: "2024-09-06T14:00:00Z", user: "Sarah Manager", role: "Admin", actionTaken: "Deleted asset" },
          { id: 8, timestamp: "2024-09-06T14:30:00Z", user: "Tom Technician", role: "Personnel", actionTaken: "Submitted work order request" },
          { id: 9, timestamp: "2024-09-06T15:15:00Z", user: "Anna Director", role: "Admin", actionTaken: "Downloaded maintenance schedule" },
          { id: 10, timestamp: "2024-09-06T16:00:00Z", user: "John Admin", role: "Admin", actionTaken: "Approved work order" }
        ];

        setActivities(exampleData);
      } catch (err) {
        setError("Failed to fetch activity data.");
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const filteredActivities = activities.filter(
    (act) =>
      act.user.toLowerCase().includes(search.toLowerCase()) ||
      act.actionTaken.toLowerCase().includes(search.toLowerCase()) ||
      act.role.toLowerCase().includes(search.toLowerCase())
  );

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
        <Card className="shadow-sm mb-4">
          <Card.Body className="d-flex flex-wrap gap-3 align-items-center">
            <Form.Select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              style={{ maxWidth: "200px" }}
            >
              <option value="all">All Time</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
            </Form.Select>

            <Form.Control
              type="text"
              placeholder="Search by user, role, or action..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ maxWidth: "300px" }}
            />
          </Card.Body>
        </Card>

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
          <Card className="shadow-sm">
            <Card.Body>
              <Table hover responsive className="align-middle mb-0">
                <thead className="table-light">
                  <tr>
                    <th style={{ width: '20%' }}>Timestamp</th>
                    <th style={{ width: '25%' }}>User</th>
                    <th style={{ width: '15%' }}>Role</th>
                    <th style={{ width: '40%' }}>Action Taken</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((act) => (
                    <tr
                      key={act.id}
                      style={{ cursor: "pointer" }}
                      onClick={() => setSelectedActivity(act)}
                      className="table-row-hover"
                    >
                      <td>
                        <small className="text-muted">
                          {new Date(act.timestamp).toLocaleString()}
                        </small>
                      </td>
                      <td className="fw-semibold">{act.user}</td>
                     <td>
                      {act.role}
                    </td>
                      <td>
                        <span className={`badge ${getActionBadgeColor(act.actionTaken)} me-2`}>
                          {act.actionTaken.includes('download') }
                          {act.actionTaken.includes('delete') }
                          {act.actionTaken.includes('submit')}
                          {act.actionTaken.includes('approve')}
                          {act.actionTaken.includes('reject')}
                        </span>
                        {act.actionTaken}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              {filteredActivities.length === 0 && search && (
                <div className="text-center py-4">
                  <p className="text-muted mb-0">No activities match your search criteria.</p>
                </div>
              )}
            </Card.Body>
          </Card>
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
              <span className="me-2">📋</span>
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
                        <strong className="text-primary">⏰ Timestamp:</strong>
                      </div>
                      <div className="col-sm-8">
                        {selectedActivity.timestamp ? new Date(selectedActivity.timestamp).toLocaleString() : 'N/A'}
                      </div>

                      <div className="col-sm-4">
                        <strong className="text-primary">👤 User:</strong>
                      </div>
                      <div className="col-sm-8">
                        {selectedActivity.user || 'Unknown User'}
                      </div>

                      <div className="col-sm-4">
                        <strong className="text-primary">🛡️ Role:</strong>
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

                      <div className="col-sm-4">
                        <strong className="text-primary">⚡ Action Taken:</strong>
                      </div>
                      <div className="col-sm-8">
                        <span className={`badge ${getActionBadgeColor(selectedActivity.actionTaken)} me-2`}>
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('download') && '⬇️'}
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('delete') && '🗑️'}
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('submit') && '📝'}
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('approve') && '✅'}
                          {selectedActivity.actionTaken && selectedActivity.actionTaken.toLowerCase().includes('reject') && '❌'}
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
