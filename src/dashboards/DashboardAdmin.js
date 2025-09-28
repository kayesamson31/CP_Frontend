//hello_Sample2
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Modal, Badge } from 'react-bootstrap';
import { 
  AlertTriangle,  
  Building,  
  CalendarDays,
  Wrench,
  Calendar as CalendarIcon,
  Clock,
  MapPin
} from 'lucide-react';

export default function DashboardAdmin() {
  const navigate = useNavigate();
  
  const [modalData, setModalData] = useState(null);
  const [modalType, setModalType] = useState('');
 

const [statsData, setStatsData] = useState([
  {
    title: "Pending Approvals",
    value: "5",
    subtitle: "Work orders awaiting review",
    color: "#dc3545",
    icon: AlertTriangle,
    route: "/dashboard-admin/WorkOrder"
  },
  {
    title: "Overdue Tasks",
    value: "3", 
    subtitle: "Maintenance past due date",
    color: "#fd7e14",
    icon: Clock,
    route: "/dashboard-admin/AssetManagement"
  },
  {
    title: "In Progress",
    value: "8",
    subtitle: "Active work orders",
    color: "#0d6efd",
    icon: Wrench,
    route: "/dashboard-admin/WorkOrder"
  },
  {
    title: "Available Personnel",
    value: "12",
    subtitle: "Staff ready for assignment",
    color: "#198754",
    icon: Building,
    route: "/dashboard-admin/UserManagement"
  }
]);



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
  padding: '24px', // dati 24px
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  marginBottom: '20px',
  border: '1px solid rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  minHeight: '120px' // added para consistent pero mas maliit
};

// Add new style just for the top stats cards
const statCardStyle = {
  backgroundColor: 'white',
  borderRadius: '12px',
  padding: '12px', // mas maliit na padding
  boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
  border: '1px solid rgba(0,0,0,0.06)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  minHeight: '100px', // mas maliit pa
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};



 

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: 'repeat(3, 1fr)'
    },
    '@media (max-width: 768px)': {
      gridTemplateColumns: '1fr'
    }
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
      <Col md={12} className="p-4">
        {/* Stats Cards */}
        <div style={gridStyle}>
          {statsData.length === 0 ? (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>No stats available</div>
          ) : (
            statsData.map((stat, index) => (
              <div 
                key={index} 
                style={{...statCardStyle, cursor: 'pointer'}}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                }}
              >
              <div style={{ 
  display: 'flex', 
  justifyContent: 'space-between', 
  alignItems: 'center', // center vertically
  width: '100%'
}}>
  {/* Texts on the left */}
  <div>
    <div style={{ color: '#6c757d', fontSize: '12px', marginBottom: '4px' }}>
      {stat.title}
    </div>
    <div style={{ fontSize: '24px', fontWeight: '700', marginBottom: '2px', color: '#1a1a1a' }}>
      {stat.value}
    </div>
    <div style={{ color: '#6c757d', fontSize: '12px' }}>
      {stat.subtitle}
    </div>
  </div>

  {/* Icon on the right with circle background */}
  <div style={{ 
    display: 'flex', 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: `${stat.color}15`, // light tinted bg
    borderRadius: '50%',
    width: '60px',
    height: '60px'
  }}>
    <stat.icon size={30} color={stat.color} />
  </div>
</div>

              </div>
            ))
          )}
        </div>

{/* Workflow and Quick Actions Section */}
<div style={{display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px', marginBottom: '30px'}}>
  
  {/* Left Column: Work Order Pipeline + Recent Activity */}
  <div>
    {/* Workflow Pipeline */}
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
        <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <Wrench size={20} style={{ marginRight: '8px', color: '#0d6efd' }} />
          Work Order Pipeline
        </h5>
      </div>
      
      {/* Pipeline Status Flow */}
      <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: '20px'}}>
        {[
          {status: 'To Review', count: 5, color: '#dc3545'},
          {status: 'Pending', count: 8, color: '#fd7e14'}, 
          {status: 'In Progress', count: 12, color: '#0d6efd'},
          {status: 'Completed', count: 45, color: '#198754'}
        ].map((stage, index) => (
          <div key={index} style={{textAlign: 'center', flex: 1}}>
            <div style={{
              width: '60px', 
              height: '60px', 
              borderRadius: '50%', 
              backgroundColor: `${stage.color}15`,
              border: `3px solid ${stage.color}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 10px',
              fontSize: '18px',
              fontWeight: 'bold',
              color: stage.color
            }}>
              {stage.count}
            </div>
            <div style={{fontSize: '12px', fontWeight: '500', color: '#6c757d'}}>
              {stage.status}
            </div>
          </div>
        ))}
      </div>
      
      {/* Priority Distribution */}
      <div style={{backgroundColor: '#f8f9fa', padding: '15px', borderRadius: '8px'}}>
        <h6 style={{marginBottom: '12px', fontSize: '14px'}}>Priority Distribution</h6>
        <div style={{display: 'flex', gap: '20px'}}>
          {[
            {priority: 'High', count: 8, color: '#dc3545'},
            {priority: 'Medium', count: 15, color: '#fd7e14'},
            {priority: 'Low', count: 7, color: '#198754'}
          ].map((item, index) => (
            <div key={index} style={{display: 'flex', alignItems: 'center'}}>
              <div style={{
                width: '12px',
                height: '12px', 
                borderRadius: '50%',
                backgroundColor: item.color,
                marginRight: '6px'
              }}></div>
              <span style={{fontSize: '13px', color: '#6c757d'}}>
                {item.priority}: {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Recent Activity Feed - NOW IN LEFT COLUMN */}
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
        <h5 style={{ margin: 0, fontWeight: 'bold' }}>Recent Activity</h5>
        <button onClick={() => navigate('/dashboard-admin/ActivityTracking')} style={{
          backgroundColor: 'transparent',
          border: '1px solid #dee2e6',
          borderRadius: '6px',
          padding: '6px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          color: '#6c757d'
        }}>
          View All
        </button>
      </div>
      
      <div style={{maxHeight: '300px', overflowY: 'auto'}}>
        {[
          {action: 'Work Order WO-2024-156 approved', user: 'John Smith', time: '5 min ago', type: 'approval'},
          {action: 'Maintenance task assigned to Mike Johnson', user: 'Admin', time: '12 min ago', type: 'assignment'},
          {action: 'HVAC inspection completed', user: 'Mike Johnson', time: '1 hour ago', type: 'completion'},
          {action: 'New work order submitted', user: 'Sarah Wilson', time: '2 hours ago', type: 'submission'},
          {action: 'Asset status updated: Generator #2', user: 'Tom Miller', time: '3 hours ago', type: 'update'},
          {action: 'Work Order WO-2024-155 marked as failed', user: 'Mike Johnson', time: '4 hours ago', type: 'failure'},
          {action: 'Emergency request: Water leak Building C', user: 'David Brown', time: '5 hours ago', type: 'emergency'},
          {action: 'Weekly maintenance schedule generated', user: 'System', time: '6 hours ago', type: 'system'},
          {action: 'Personnel account created: Alex Rodriguez', user: 'Admin', time: '1 day ago', type: 'account'},
          {action: 'Asset inspection overdue notification sent', user: 'System', time: '1 day ago', type: 'notification'}
        ].map((activity, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: index < 9 ? '1px solid #f8f9fa' : 'none'
          }}>
            <div style={{flex: 1}}>
              <div style={{fontSize: '13px', fontWeight: '500', marginBottom: '2px'}}>
                {activity.action}
              </div>
              <div style={{fontSize: '12px', color: '#6c757d'}}>
                by {activity.user}
              </div>
            </div>
            <div style={{fontSize: '11px', color: '#6c757d', marginLeft: '10px'}}>
              {activity.time}
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>

  {/* Right Column: Critical Items */}
  <div style={cardStyle}>
    <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
      <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        <Clock size={20} style={{ marginRight: '8px', color: '#337FCA' }} />
        Critical Items
      </h5>
    </div>
    
    {/* High Priority Items needing attention */}
    {[
      {title: 'HVAC System Down', type: 'Emergency', time: '2 hours ago'},
      {title: 'Electrical Panel Check', type: 'Overdue', time: '1 day overdue'},
      {title: 'Water Leak Report', type: 'High Priority', time: '30 min ago'},
      {title: 'Generator Maintenance', type: 'Due Today', time: 'Today'},
      {title: 'Fire Safety Inspection', type: 'Pending Approval', time: '3 hours ago'}
    ].map((item, index) => (
      <div key={index} style={{...itemCardStyle, height: 'auto', minHeight: '70px', cursor: 'pointer', marginBottom: '10px'}}>
        <div style={{fontWeight: '500', fontSize: '13px', marginBottom: '4px'}}>
          {item.title}
        </div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
          <span style={{
            backgroundColor: index < 2 ? '#dc354515' : '#fd7e1415',
            color: index < 2 ? '#dc3545' : '#fd7e14',
            fontSize: '10px',
            fontWeight: '600',
            padding: '2px 6px',
            borderRadius: '10px'
          }}>
            {item.type}
          </span>
          <span style={{fontSize: '11px', color: '#6c757d'}}>
            {item.time}
          </span>
        </div>
      </div>
    ))}
    
    {/* Quick Action Buttons */}
    <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
      <button onClick={() => navigate('/dashboard-admin/WorkOrder')} style={{
        width: '100%',
        padding: '10px',
        backgroundColor: '#0d6efd',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '8px',
        cursor: 'pointer'
      }}>
        Review Pending Orders
      </button>
      <button onClick={() => navigate('/dashboard-admin/AssetManagement')} style={{
        width: '100%',
        padding: '10px',
        backgroundColor: '#198754',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        fontSize: '13px',
        fontWeight: '500',
        cursor: 'pointer'
      }}>
        Schedule Maintenance
      </button>
    </div>
  </div>
</div>

{/* Also fix the Original Modal at the bottom */}
{modalData && (
  <div style={modalOverlayStyle} onClick={closeModal}>
    <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4 style={{ margin: 0 }}>
          {modalType === 'workOrder' && 'Work Order Details'}
          {modalType === 'maintenance' && 'Maintenance Details'}
          {modalType === 'workorder' && 'Work Order Details'}
        </h4>
        <button 
          onClick={closeModal}
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: '#6c757d' }}
        >
          ×
        </button>
      </div>
      
      <div>
        <h5>{modalData.title}</h5>
        {modalData.time && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <Clock size={16} style={{ marginRight: '8px', color: '#6c757d' }} />
            {modalData.time}
          </div>
        )}
        {modalData.location && (
          <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
            <MapPin size={16} style={{ marginRight: '8px', color: '#6c757d' }} />
            {modalData.location}
          </div>
        )}
        {modalData.priority && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Priority: </strong>
            {/* FIXED: Use inline styles instead of Bootstrap Badge */}
            <span
              style={{
                backgroundColor: modalData.priority === 'high' ? '#dc3545' : modalData.priority === 'medium' ? '#fd7e14' : '#198754',
                color: 'white',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                border: 'none',
                display: 'inline-block'
              }}
            >
              {modalData.priority.toUpperCase()}
            </span>
          </div>
        )}
        {modalData.type && (
          <div style={{ marginBottom: '10px' }}>
            <strong>Type: </strong>
            {/* FIXED: Add type badge in modal */}
            <span
              style={{
                backgroundColor: modalData.type === 'maintenance' ? '#337FCA' : '#F0D400',
                color: modalData.type === 'maintenance' ? 'white' : 'black',
                fontSize: '12px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                border: 'none',
                display: 'inline-block'
              }}
            >
              {modalData.type.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  </div>
)}
      </Col>
  );
}