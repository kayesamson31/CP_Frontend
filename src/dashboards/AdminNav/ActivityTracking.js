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
        // 🚧 Replace with your actual API when ready:
        const response = await fetch("/api/activities");
        const data = await response.json();

        setActivities(data); // expect this to be an array
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
      act.action.toLowerCase().includes(search.toLowerCase()) ||
      act.target.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <SidebarLayout role="admin">
      <div className="p-4">
        <h2 className="mb-4 fw-bold">📊 Activity Tracking</h2>

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
              placeholder="🔍 Search by user, action, or target..."
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
            No activities to show yet.
          </Alert>
        )}

        {/* Activity Table */}
        {!loading && !error && activities.length > 0 && (
          <Card className="shadow-sm">
            <Card.Body>
              <Table hover responsive className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Target</th>
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
                      <td>{act.timestamp}</td>
                      <td className="fw-semibold">{act.user}</td>
                      <td>
                        <span
                          className={`badge rounded-pill ${
                            act.role === "Admin"
                              ? "bg-primary"
                              : act.role === "Personnel"
                              ? "bg-success"
                              : "bg-secondary"
                          }`}
                        >
                          {act.role}
                        </span>
                      </td>
                      <td>{act.action}</td>
                      <td>{act.target}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        )}

        {/* Modal */}
        <Modal
          show={!!selectedActivity}
          onHide={() => setSelectedActivity(null)}
          centered
        >
          <Modal.Header closeButton>
            <Modal.Title>Activity Details</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedActivity && (
              <div>
                <p>
                  <strong>⏰ Timestamp:</strong> {selectedActivity.timestamp}
                </p>
                <p>
                  <strong>👤 User:</strong> {selectedActivity.user}
                </p>
                <p>
                  <strong>🛡️ Role:</strong>{" "}
                  <span className="badge bg-info">{selectedActivity.role}</span>
                </p>
                <p>
                  <strong>⚡ Action:</strong> {selectedActivity.action}
                </p>
                <p>
                  <strong>🎯 Target:</strong> {selectedActivity.target}
                </p>
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
