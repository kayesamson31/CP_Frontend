import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Col, Modal, Badge } from 'react-bootstrap';
import { supabase } from '../supabaseClient';
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
    value: "0",
    subtitle: "Work orders awaiting review",
    color: "#dc3545",
    icon: AlertTriangle,
    route: "/dashboard-admin/WorkOrder"
  },
  {
    title: "Overdue Tasks",
    value: "0", 
    subtitle: "Maintenance past due",
    color: "#fd7e14",
    icon: Clock,
    route: "/dashboard-admin/MaintenanceTasks"
  },
  {
    title: "Extended Tasks",
    value: "0",
    subtitle: "Extended due dates",
    color: "#ffc107",
    icon: CalendarDays,
    route: "/dashboard-admin/MaintenanceTasks"
  },
  {
    title: "Asset Maintenance",
    value: "0",
    subtitle: "Assets needing service",
    color: "#17a2b8",
    icon: Wrench,
    route: "/dashboard-admin/AssetManagement"
  }
]);
const [pipelineData, setPipelineData] = useState([
  {status: 'To Review', count: 0, color: '#dc3545'},
  {status: 'Assigned', count: 0, color: '#fd7e14'}, 
  {status: 'In Progress', count: 0, color: '#0d6efd'},
  {status: 'Completed', count: 0, color: '#198754'}
]);
const [recentActivities, setRecentActivities] = useState([]);
const [availablePersonnel, setAvailablePersonnel] = useState([]);
const [adminName, setAdminName] = useState('Admin');
useEffect(() => {
  const fetchAdminData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('full_name')
        .eq('auth_uid', user.id)
        .single();

      if (userData) {
        setAdminName(userData.full_name);
      }
    } catch (error) {
      console.error('Error fetching admin data:', error);
    }
  };

  fetchAdminData();
}, []);

useEffect(() => {
  const fetchDailyMetrics = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Pending Approvals - work orders with status "pending" or "to review"
      const { count: pendingCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .in('status_id', [1, 6]); // 1=Pending, 6=To Review

      // 2. Overdue Tasks - maintenance tasks past due date
      const { count: overdueCount } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .lt('due_date', new Date().toISOString())
        .neq('status_id', 3); // 3=Completed

      // 3. Extended Tasks - tasks extended today
      const { count: extendedCount } = await supabase
        .from('maintenance_task_extensions')
        .select('*', { count: 'exact', head: true })
        .gte('extension_date', today.toISOString());

      // 4. Asset Maintenance - assets needing maintenance today
      const { count: assetCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .lte('next_maintenance', new Date().toISOString())
        .eq('asset_status', 'active');

      setStatsData([
        {
          title: "Pending Approvals",
          value: pendingCount || 0,
          subtitle: "Work orders awaiting review",
          color: "#dc3545",
          icon: AlertTriangle,
          route: "/dashboard-admin/WorkOrder"
        },
        {
          title: "Overdue Tasks",
          value: overdueCount || 0,
          subtitle: "Maintenance past due",
          color: "#fd7e14",
          icon: Clock,
          route: "/dashboard-admin/MaintenanceTasks"
        },
        {
          title: "Extended Tasks",
          value: extendedCount || 0,
          subtitle: "Extended due dates",
          color: "#ffc107",
          icon: CalendarDays,
          route: "/dashboard-admin/MaintenanceTasks"
        },
        {
          title: "Asset Maintenance",
          value: assetCount || 0,
          subtitle: "Assets needing service",
          color: "#17a2b8",
          icon: Wrench,
          route: "/dashboard-admin/AssetManagement"
        }
      ]);

    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  fetchDailyMetrics();
}, []);

useEffect(() => {
  const fetchPipelineData = async () => {
    try {
      // To Review (status_id = 6)
      const { count: toReviewWO } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 6);
      
      const { count: toReviewMT } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 6);
      
      // Pending/Assigned (status_id = 1)
      const { count: pendingWO } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 1);
      
      const { count: pendingMT } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 1);
      
      // In Progress (status_id = 2)
      const { count: progressWO } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 2);
      
      const { count: progressMT } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 2);
      
      // Completed (status_id = 3)
      const { count: completedWO } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 3);
      
      const { count: completedMT } = await supabase
        .from('maintenance_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status_id', 3);

      setPipelineData([
        {status: 'To Review', count: (toReviewWO || 0) + (toReviewMT || 0), color: '#dc3545'},
        {status: 'Assigned', count: (pendingWO || 0) + (pendingMT || 0), color: '#fd7e14'}, 
        {status: 'In Progress', count: (progressWO || 0) + (progressMT || 0), color: '#0d6efd'},
        {status: 'Completed', count: (completedWO || 0) + (completedMT || 0), color: '#198754'}
      ]);

    } catch (error) {
      console.error('Error fetching pipeline data:', error);
    }
  };

  fetchPipelineData();
}, []);

useEffect(() => {
  const fetchRecentActivity = async () => {
    try {
      const { data: activities, error } = await supabase
        .from('activity_tracking')
        .select(`
          activity_id,
          activity_type,
          description,
          timestamp,
          user_id,
          users!activity_tracking_user_id_fkey (full_name)
        `)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (error) throw error;

      const formattedActivities = activities.map(activity => ({
        action: activity.description,
        user: activity.users?.full_name || 'Unknown',
        time: formatTimeAgo(activity.timestamp),
        type: activity.activity_type
      }));

      setRecentActivities(formattedActivities);

    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  };

  fetchRecentActivity();
}, []);

useEffect(() => {
  const fetchAvailablePersonnel = async () => {
    try {
      // Fetch users with role_id 3 (personnel) who are active
      const { data: personnel, error } = await supabase
        .from('users')
        .select('user_id, full_name, job_position, user_status')
        .eq('role_id', 3)
        .eq('user_status', 'active')
        .order('full_name', { ascending: true });

      if (error) throw error;

      // Check if personnel are currently assigned to active tasks
      const personnelWithStatus = await Promise.all(
        personnel.map(async (person) => {
          // Check maintenance_tasks
          const { count: activeTasks } = await supabase
            .from('maintenance_tasks')
            .select('*', { count: 'exact', head: true })
            .eq('assigned_to', person.user_id)
            .in('status_id', [1, 2]); // Pending or In Progress

          let status = 'Available';
          let statusColor = '#198754';

          if (activeTasks > 0) {
            status = 'On Task';
            statusColor = '#0d6efd';
          }

          return {
            name: person.full_name,
            role: person.job_position || 'Personnel',
            status: status,
            statusColor: statusColor
          };
        })
      );

      setAvailablePersonnel(personnelWithStatus);

    } catch (error) {
      console.error('Error fetching personnel:', error);
    }
  };

  fetchAvailablePersonnel();
}, []);

const formatTimeAgo = (timestamp) => {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInMinutes = Math.floor((now - time) / 60000);
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
};

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
{/* Welcome Section */}
<div style={{
  marginBottom: '24px'
}}>
 <h3 style={{ margin: 0, fontWeight: 'bold', color: '#1a1a1a' }}>
  Welcome back, {adminName}
</h3>
  <p style={{ margin: '4px 0 0 0', color: '#6c757d', fontSize: '14px' }}>
    {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
  </p>
</div>
        {/* Stats Cards */}
        <div style={gridStyle}>
          {statsData.length === 0 ? (
            <div style={{ color: '#6c757d', fontSize: '14px' }}>No stats available</div>
          ) : (
            statsData.map((stat, index) => (
             <div 
              key={index} 
              style={{...statCardStyle, cursor: 'pointer'}}
              onClick={() => navigate(stat.route)}
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
    {/*Tasks Pipeline*/}
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
        <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
          <Wrench size={20} style={{ marginRight: '8px', color: '#0d6efd' }} />
        Tasks Pipeline
        </h5>
      </div>
      
    {/* Pipeline Status Flow - Workflow Stages */}
<div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px'}}>

 {pipelineData.map((stage, index) => (
    <React.Fragment key={index}>
      <div style={{textAlign: 'center', flex: 1}}>
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
      
      {/* Arrow between stages */}
      {index < 3 && (
        <div style={{
          fontSize: '20px',
          color: '#dee2e6',
          margin: '0 10px',
          alignSelf: 'center',
          marginBottom: '35px'
        }}>
          →
        </div>
      )}
    </React.Fragment>
  ))}
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
  {recentActivities.length === 0 ? (
    <div style={{textAlign: 'center', padding: '20px', color: '#6c757d'}}>
      No recent activity
    </div>
  ) : (
    recentActivities.map((activity, index) => (
      <div key={index} style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 0',
        borderBottom: index < recentActivities.length - 1 ? '1px solid #f8f9fa' : 'none'
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
    ))
  )}
</div>
    </div>
  </div>

{/* Right Column: Available Personnel */}
<div style={cardStyle}>
  <div style={{ marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
    <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
      <Building size={20} style={{ marginRight: '8px', color: '#198754' }} />
      Available Personnel
    </h5>
  </div>
  
{/* Personnel List */}
<div style={{maxHeight: '400px', overflowY: 'auto'}}>
  {availablePersonnel.length === 0 ? (
    <div style={{textAlign: 'center', padding: '20px', color: '#6c757d'}}>
      No personnel available
    </div>
  ) : (
    availablePersonnel.map((person, index) => (
      <div key={index} style={{
        padding: '12px',
        marginBottom: '8px',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e9ecef',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{fontWeight: '500', fontSize: '13px', marginBottom: '2px'}}>
            {person.name}
          </div>
          <div style={{fontSize: '11px', color: '#6c757d'}}>
            {person.role}
          </div>
        </div>
        <span style={{
          backgroundColor: `${person.statusColor}15`,
          color: person.statusColor,
          fontSize: '10px',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          {person.status}
        </span>
      </div>
    ))
  )}
</div>
  
  {/* Quick Action Buttons */}
  <div style={{marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6'}}>
    <button onClick={() => navigate('/dashboard-admin/UserManagement')} style={{
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
      View All Personnel
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