import React, { useEffect, useState } from 'react';
import { Card, Table, Badge, Spinner, Alert, Row, Col } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { supabase } from '../../supabaseClient';
import 'bootstrap/dist/css/bootstrap.min.css';

export default function Organizations() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalOrgs: 0,
    totalUsers: 0,
    totalAssets: 0,
    activeOrgs: 0
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all organizations with related data
      const { data: orgsData, error: orgsError } = await supabase
        .from('organizations')
        .select(`
          organization_id,
          org_name,
          org_type_id,
          country_id,
          contact_person,
          contact_email,
          phone,
          date_created,
          setup_completed,
          organization_types(type_name),
          countries(country_name)
        `)
        .order('date_created', { ascending: false });

      if (orgsError) throw orgsError;

      // Get user counts per organization
      const { data: userCounts, error: userError } = await supabase
        .from('users')
        .select('organization_id')
        .not('organization_id', 'is', null);

      if (userError) throw userError;

      // Get asset counts per organization
      const { data: assetCounts, error: assetError } = await supabase
        .from('assets')
        .select('organization_id')
        .not('organization_id', 'is', null);

      if (assetError) throw assetError;

      // Count users per org
      const userCountMap = {};
      userCounts.forEach(u => {
        userCountMap[u.organization_id] = (userCountMap[u.organization_id] || 0) + 1;
      });

      // Count assets per org
      const assetCountMap = {};
      assetCounts.forEach(a => {
        assetCountMap[a.organization_id] = (assetCountMap[a.organization_id] || 0) + 1;
      });

      // Combine data
      const enrichedOrgs = orgsData.map(org => ({
        ...org,
        userCount: userCountMap[org.organization_id] || 0,
        assetCount: assetCountMap[org.organization_id] || 0,
        status: org.setup_completed ? 'Active' : 'Setup Pending'
      }));

      setOrganizations(enrichedOrgs);

      // Calculate stats
      setStats({
        totalOrgs: orgsData.length,
        totalUsers: userCounts.length,
        totalAssets: assetCounts.length,
        activeOrgs: orgsData.filter(o => o.setup_completed).length
      });

    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError('Failed to load organizations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SidebarLayout role="superadmin">
        <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
          <Spinner animation="border" />
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout role="superadmin">
      <div className="container-fluid p-4" style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
        
        {/* Header */}
        <div className="mb-4">
          <h2 className="mb-1 fw-bold text-dark">Organizations Management</h2>
          <p className="text-muted">Manage all organizations using OpenFMS</p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {/* Stats Cards */}
        <Row className="g-3 mb-4">
          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>Total Organizations</p>
                    <h3 className="mb-0 fw-bold text-primary">{stats.totalOrgs}</h3>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: '#e3f2fd' }}>
                    <i className="bi bi-building fs-4 text-primary"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>Active Organizations</p>
                    <h3 className="mb-0 fw-bold text-success">{stats.activeOrgs}</h3>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: '#e8f5e9' }}>
                    <i className="bi bi-check-circle fs-4 text-success"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>Total Users</p>
                    <h3 className="mb-0 fw-bold text-info">{stats.totalUsers}</h3>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: '#e1f5fe' }}>
                    <i className="bi bi-people fs-4 text-info"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>

          <Col lg={3} md={6}>
            <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
              <Card.Body className="p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1" style={{ fontSize: '0.875rem' }}>Total Assets</p>
                    <h3 className="mb-0 fw-bold text-warning">{stats.totalAssets}</h3>
                  </div>
                  <div className="p-3 rounded-circle" style={{ backgroundColor: '#fff3e0' }}>
                    <i className="bi bi-box-seam fs-4 text-warning"></i>
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Organizations Table */}
        <Card className="border-0 shadow-sm" style={{ borderRadius: '12px' }}>
          <Card.Body className="p-0">
            <div className="p-3 border-bottom">
              <h5 className="mb-0 fw-semibold">All Organizations</h5>
            </div>
            
            <Table responsive hover className="mb-0">
              <thead style={{ backgroundColor: '#f8f9fa' }}>
                <tr>
                  <th className="py-3 px-3">Organization Name</th>
                  <th className="py-3">Type</th>
                  <th className="py-3">Country</th>
                  <th className="py-3">Contact Person</th>
                  <th className="py-3">Contact Email</th>
                  <th className="py-3 text-center">Users</th>
                  <th className="py-3 text-center">Assets</th>
                  <th className="py-3">Date Created</th>
                  <th className="py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {organizations.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="text-center py-4 text-muted">
                      No organizations found
                    </td>
                  </tr>
                ) : (
                  organizations.map((org) => (
                    <tr key={org.organization_id}>
                      <td className="py-3 px-3 fw-semibold">{org.org_name}</td>
                      <td className="py-3">{org.organization_types?.type_name || 'N/A'}</td>
                      <td className="py-3">{org.countries?.country_name || 'N/A'}</td>
                      <td className="py-3">{org.contact_person || 'N/A'}</td>
                      <td className="py-3">{org.contact_email || 'N/A'}</td>
                      <td className="py-3 text-center">
                        <Badge bg="info" className="px-3 py-2">
                          {org.userCount}
                        </Badge>
                      </td>
                      <td className="py-3 text-center">
                        <Badge bg="warning" className="px-3 py-2">
                          {org.assetCount}
                        </Badge>
                      </td>
                      <td className="py-3">
                        {new Date(org.date_created).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3 text-center">
                        <Badge 
                          bg={org.setup_completed ? 'success' : 'warning'}
                          className="px-3 py-2"
                        >
                          {org.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </div>
    </SidebarLayout>
  );
}