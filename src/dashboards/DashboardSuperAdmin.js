import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DashboardSuperAdmin() {
  const navigate = useNavigate();

  useEffect(() => {
    // Automatically redirect to organizations page
    navigate('/dashboard-superadmin/organizations', { replace: true });
  }, [navigate]);

  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
      <p>Redirecting to Organizations...</p>
    </div>
  );
}