import React, { useState } from 'react';
import SidebarLayout from '../Layouts/SidebarLayout';
import { useNavigate } from 'react-router-dom';
import { Col } from 'react-bootstrap';
import { 
  AlertTriangle, 
  Car, 
  Building, 
  Eye, 
  CalendarDays,
  Wrench
} from 'lucide-react';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');

  const [statsData, setStatsData] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([]);
  const [reservationRequests, setReservationRequests] = useState([]);

  const handleItemClick = (item, type) => {
    setModalData(item);
    setModalType(type);
  };

  const closeModal = () => {
    setModalData(null);
    setModalType('');
  };

  const modalOverlayStyle = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000
  };

  const modalStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    maxWidth: '500px',
    width: '90%',
    maxHeight: '80vh',
    overflow: 'auto'
  };

  const cardStyle = {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    marginBottom: '20px',
    height: '100%',
    border: '1px solid rgba(0,0,0,0.06)',
    transition: 'transform 0.2s ease, box-shadow 0.2s ease'
  };

  const badgeStyle = (color) => ({
    backgroundColor: color,
    color: 'white',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: '600',
    textTransform: 'uppercase',
    boxShadow: `0 2px 4px ${color}20`
  });

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '20px',
    marginBottom: '30px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
  };

  const threeColumnGrid = {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '20px',
    marginBottom: '30px'
  };

  const handleCardClick = (route) => {
    navigate(route);
  };

  const itemCardStyle = {
    padding: '16px',
    marginBottom: '12px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    border: '1px solid #e9ecef',
    transition: 'background-color 0.2s ease, transform 0.1s ease',
    height: '110px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start'
  };

  return (
    <SidebarLayout role="admin">
      <Col md={12} className="p-4">
        {/* Stats Cards */}
        <div style={gridStyle}>
          {statsData.length === 0 ? (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>No stats available</div>
          ) : (
            statsData.map((stat, index) => (
              <div 
                key={index} 
                style={{...cardStyle, cursor: 'pointer'}}
                onClick={() => handleCardClick(stat.route)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ color: '#6c757d', fontSize: '14px', marginBottom: '4px' }}>
                      {stat.title}
                    </div>
                    <div style={{ fontSize: '32px', fontWeight: '700', marginBottom: '4px', color: '#1a1a1a' }}>
                      {stat.value}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '14px' }}>
                      {stat.subtitle}
                    </div>
                  </div>
                  <div style={{ color: stat.color }}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Main Dashboard Sections */}
        <div style={threeColumnGrid}>
          {/* Recent Work Orders */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold' }}>Recent Work Orders</h5>
              <button 
                onClick={() => navigate('/dashboard-admin/WorkOrder')} 
                style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }}
              >
                <Eye size={16} style={{ marginRight: '4px' }} />
                View all
              </button>
            </div>
            <div>
              {workOrders.length === 0 ? (
                <div style={{ color: '#6c757d', fontSize: '13px' }}>No work orders available</div>
              ) : (
                workOrders.map((order, index) => (
                  <div 
                    key={index} 
                    style={{...itemCardStyle, cursor: 'pointer'}}
                    onClick={() => handleItemClick(order, 'workOrder')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{order.title}</div>
                      <span style={badgeStyle(order.priorityColor)}>{order.priority}</span>
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px' }}>{order.id}</div>
                    <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px' }}>{order.category}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Maintenance */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold' }}>Upcoming Maintenance</h5>
              <button 
                onClick={() => navigate('/dashboard-admin/AssetManagement')} 
                style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }}
              >
                <CalendarDays size={16} style={{ marginRight: '4px' }} />
                View all
              </button>
            </div>
            <div>
              {upcomingMaintenance.length === 0 ? (
                <div style={{ color: '#6c757d', fontSize: '13px' }}>No maintenance scheduled</div>
              ) : (
                upcomingMaintenance.map((maintenance, index) => (
                  <div 
                    key={index} 
                    style={{...itemCardStyle, cursor: 'pointer'}}
                    onClick={() => handleItemClick(maintenance, 'maintenance')}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ fontWeight: '500', fontSize: '14px' }}>{maintenance.task}</div>
                      <span style={badgeStyle('#0dcaf0')}>SCHEDULED</span>
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px' }}>{maintenance.date}</div>
                    <div style={{ color: '#6c757d', fontSize: '13px' }}>{maintenance.location}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reservation Requests */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold' }}>Reservation Requests</h5>
              <button 
                onClick={() => navigate('/dashboard-admin/Reservation')} 
                style={{ background: 'none', border: 'none', color: '#0d6efd', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: '14px' }}
              >
                <Eye size={16} style={{ marginRight: '4px' }} />
                View all
              </button>
            </div>
            <div>
              {reservationRequests.length === 0 ? (
                <div style={{ color: '#6c757d', fontSize: '13px' }}>No reservations yet</div>
              ) : (
                reservationRequests.map((request, index) => (
                  <div 
                    key={index} 
                    style={{...itemCardStyle, cursor: 'pointer'}}
                    onClick={() => handleItemClick(request, 'reservation')}
                  >
                    <div style={{ fontWeight: '500', fontSize: '14px' }}>
                      {request.type} • {request.title}
                    </div>
                    <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px' }}>{request.dateNeeded}</div>
                    <div style={{ color: '#6c757d', fontSize: '13px' }}>{request.location}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Modal */}
        {modalData && (
          <div style={modalOverlayStyle} onClick={closeModal}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h4 style={{ margin: 0 }}>
                  {modalType === 'workOrder' && 'Work Order Details'}
                  {modalType === 'maintenance' && 'Maintenance Details'}
                  {modalType === 'reservation' && 'Reservation Details'}
                </h4>
                <button 
                  onClick={closeModal}
                  style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6c757d' }}
                >
                  ×
                </button>
              </div>

              {modalType === 'workOrder' && (
                <div>
                  <div><strong>Title:</strong> {modalData.title}</div>
                  <div><strong>ID:</strong> {modalData.id}</div>
                  <div><strong>Category:</strong> {modalData.category}</div>
                  <div><strong>Date Requested:</strong> {modalData.dateRequested}</div>
                  <div><strong>Priority:</strong> <span style={badgeStyle(modalData.priorityColor)}>{modalData.priority}</span></div>
                </div>
              )}

              {modalType === 'maintenance' && (
                <div>
                  <div><strong>Task:</strong> {modalData.task}</div>
                  <div><strong>Date:</strong> {modalData.date}</div>
                  <div><strong>Assets:</strong> {modalData.assets}</div>
                  <div><strong>Location:</strong> {modalData.location}</div>
                </div>
              )}

              {modalType === 'reservation' && (
                <div>
                  <div><strong>Type:</strong> {modalData.type}</div>
                  <div><strong>Title:</strong> {modalData.title}</div>
                  <div><strong>Date Requested:</strong> {modalData.dateRequested}</div>
                  <div><strong>Location:</strong> {modalData.location}</div>
                  <div><strong>Date Needed:</strong> {modalData.dateNeeded}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </Col>
    </SidebarLayout>
  );
}
