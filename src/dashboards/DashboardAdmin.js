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
import{AuthUtils} from '../utils/AuthUtils'

export default function DashboardAdmin() {
  const navigate = useNavigate();
  const [loadingCalendar, setLoadingCalendar] = useState(false);
const [calendarError, setCalendarError] = useState(null);
const [modalData, setModalData] = useState(null);
const [modalType, setModalType] = useState('');
const [selectedDate, setSelectedDate] = useState(new Date());
const [calendarEvents, setCalendarEvents] = useState([]);
const [showCalendarModal, setShowCalendarModal] = useState(false);
const [selectedEvents, setSelectedEvents] = useState([]);
const [userRole, setUserRole] = useState('Admin Official');
const [organizationName, setOrganizationName] = useState('Organization');
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
// Sample calendar events data
const sampleEvents = [
  // Copy ALL the sampleEvents array from Document 2 (lines 37-155)
  {
    id: 1,
    title: "HVAC System Maintenance",
    date: "2025-09-04",
    type: "maintenance",
    location: "Building A - Floor 3",
    time: "09:00 AM",
    priority: "high"
  },
  // ... (copy all events)
];


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
  .select('full_name, organization_id, job_position')
  .eq('auth_uid', user.id)
  .single();

      if (userData) {
        setAdminName(userData.full_name);
        setUserRole(userData.job_position || 'Admin Official');
        
        // Fetch organization name
        const { data: orgData } = await supabase
          .from('organizations')
          .select('org_name')
          .eq('organization_id', userData.organization_id)
          .single();
        
        if (orgData) {
          setOrganizationName(orgData.org_name);
        }
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

      const orgId = AuthUtils.getCurrentOrganizationId();
      
      // 1. Pending Approvals
      const { count: pendingCount } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status_id', [1, 6]);

      // 2. Overdue Tasks - ONLY active maintenance tasks past due
      const { data: overdueTasks } = await supabase
        .from('maintenance_tasks')
        .select('task_id, status_id, due_date')
        .eq('organization_id', orgId)
        .lt('due_date', new Date().toISOString())
        .in('status_id', [1, 2, 6]); // ONLY Pending, In Progress, To Review

      const overdueCount = overdueTasks?.length || 0;

      // 3. Extended Tasks - Get task_ids from extensions, then check if active
      const { data: extensionRecords } = await supabase
        .from('maintenance_task_extensions')
        .select('task_id')
        .eq('organization_id', orgId);

      let extendedCount = 0;
      if (extensionRecords && extensionRecords.length > 0) {
        const uniqueTaskIds = [...new Set(extensionRecords.map(r => r.task_id))];
        
        // Check which of these tasks are still active (NOT completed)
        const { data: activeTasks } = await supabase
          .from('maintenance_tasks')
          .select('task_id')
          .in('task_id', uniqueTaskIds)
          .in('status_id', [1, 2, 6]); // ONLY Pending, In Progress, To Review
        
        extendedCount = activeTasks?.length || 0;
      }

      // 4. Asset Maintenance - assets needing maintenance
      const { count: assetCount } = await supabase
        .from('assets')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
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
  const fetchRecentActivity = async () => {
    try {
      const orgId = AuthUtils.getCurrentOrganizationId();
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
        .eq('organization_id', orgId) 
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
    const orgId = AuthUtils.getCurrentOrganizationId();
const { data: personnel, error } = await supabase
  .from('users')
  .select('user_id, full_name, job_position, user_status')
  .eq('organization_id', orgId)  // ← ADD THIS
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
            statusColor: statusColor,
            activeTaskCount: activeTasks || 0
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
useEffect(() => {
  fetchAllOrgTasks();
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

const fetchAllOrgTasks = async () => {
  try {
    setLoadingCalendar(true);
    setCalendarError(null);
    
    const orgId = AuthUtils.getCurrentOrganizationId();
    
    // Fetch Work Orders with personnel info
    const { data: workOrders, error: woError } = await supabase
      .from('work_orders')
      .select(`
        work_order_id,
        title,
        description,
        due_date,
        location,
        category,
        asset_text,
        assigned_to,
        status_id,
        priority_id,
        admin_priority_id,
        users!work_orders_assigned_to_fkey(full_name),
        priority_levels!work_orders_priority_id_fkey(priority_name),
        admin_priority_levels:priority_levels!work_orders_admin_priority_id_fkey(priority_name),
        statuses(status_name)
      `)
      .eq('organization_id', orgId)
      .not('assigned_to', 'is', null)
      .in('status_id', [1, 2]); // Pending and In Progress only

    if (woError) throw woError;

    // Fetch Maintenance Tasks with personnel info
    const { data: maintenanceTasks, error: mtError } = await supabase
      .from('maintenance_tasks')
      .select(`
        task_id,
        task_name,
        description,
        due_date,
        assigned_to,
        status_id,
        priority_id,
        asset_id,
        incident_id,
        users!maintenance_tasks_assigned_to_fkey(full_name),
        priority_levels!maintenance_tasks_priority_id_fkey(priority_name),
        statuses(status_name),
        assets(asset_name, location)
      `)
      .eq('organization_id', orgId)
      .not('assigned_to', 'is', null)
      .in('status_id', [1, 2]); // Pending and In Progress only

    if (mtError) throw mtError;

    // Transform Work Orders
    const transformedWO = (workOrders || []).map(wo => ({
      id: wo.work_order_id,
      title: wo.title,
      description: wo.description || 'No description',
      date: wo.due_date ? wo.due_date.split('T')[0] : null,
      type: 'work_order',
      location: wo.location || 'Not specified',
      category: wo.category || 'General',
      asset: wo.asset_text || 'Not specified',
      priority: (wo.admin_priority_levels?.priority_name || wo.priority_levels?.priority_name || 'medium').toLowerCase(),
      status: wo.statuses?.status_name || 'Pending',
      personnelName: wo.users?.full_name || 'Unassigned',
      personnelId: wo.assigned_to
    }));

    // Transform Maintenance Tasks
    const transformedMT = (maintenanceTasks || []).map(mt => ({
      id: mt.task_id,
      title: mt.task_name,
      description: mt.description || 'No description',
      date: mt.due_date ? mt.due_date.split('T')[0] : null,
      type: mt.incident_id ? 'incident_task' : 'maintenance_task',
      location: mt.assets?.location || 'Not specified',
      category: 'Maintenance',
      asset: mt.assets?.asset_name || 'Not specified',
      priority: (mt.priority_levels?.priority_name || 'medium').toLowerCase(),
      status: mt.statuses?.status_name || 'Pending',
      personnelName: mt.users?.full_name || 'Unassigned',
      personnelId: mt.assigned_to,
      isIncidentRelated: !!mt.incident_id
    }));

    // Combine and filter out tasks without dates
    const allTasks = [...transformedWO, ...transformedMT].filter(task => task.date);
    
    setCalendarEvents(allTasks);
    
  } catch (error) {
    console.error('Error fetching calendar tasks:', error);
    setCalendarError('Failed to load calendar tasks');
  } finally {
    setLoadingCalendar(false);
  }
};

  const handleItemClick = (item, type) => {
    setModalData(item);
    setModalType(type);
  };
const handleDateClick = (date) => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const eventsOnDate = calendarEvents.filter(event => event.date === dateString);
  setSelectedEvents(eventsOnDate);
  setSelectedDate(date);
  setShowCalendarModal(true);
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

const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: '73% 26%',
  gap: '20px',
  marginBottom: '30px'
};

const calendarCardStyle = {
  ...cardStyle,
  minHeight: '650px'
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

  // Calendar component
  const Calendar = () => {
    
    const today = new Date();
    
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
const changeMonth = (increment) => {
  setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + increment, 1));
};
    
    const getEventsForDate = (day) => {
      const dateString = `${selectedDate.getFullYear()}-${(selectedDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      return calendarEvents.filter(event => event.date === dateString);
    };
    
    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(selectedDate);
      const firstDay = getFirstDayOfMonth(selectedDate);
      const days = [];
      
      // Empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const eventsOnDay = getEventsForDate(day);
        const isToday = today.getDate() === day && 
                       today.getMonth() === selectedDate.getMonth() && 
                       today.getFullYear() === selectedDate.getFullYear();
        
        days.push(
          <div 
            key={day} 
            className={`calendar-day ${isToday ? 'today' : ''} ${eventsOnDay.length > 0 ? 'has-events' : ''}`}
            onClick={() => handleDateClick(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
          >
            <span className="day-number">{day}</span>
            {eventsOnDay.length > 0 && (
              <div className="event-indicators">
                {eventsOnDay.slice(0, 3).map((event, index) => (
                  <div 
                    key={index} 
                    className={`event-dot ${event.type}`}
                    title={event.title}
                  ></div>
                ))}
                {eventsOnDay.length > 3 && (
                  <div className="event-more">+{eventsOnDay.length - 3}</div>
                )}
              </div>
            )}
          </div>
        );
      }
      
      return days;
    };
    
    return (
      <div className="calendar-container">
        <style jsx>{`
          .calendar-container {
            width: 100%;
          }
          
          .calendar-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding: 0 10px;
          }
          
          .calendar-nav {
            background: #f8f9fa;
            border: 1px solid #dee2e6;
            border-radius: 6px;
            padding: 8px 12px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
          }
          
          .calendar-nav:hover {
            background: #e9ecef;
          }
          
          .calendar-title {
            font-size: 18px;
            font-weight: 600;
            margin: 0;
          }
          
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 1px;
            background: #dee2e6;
            border-radius: 8px;
            overflow: hidden;
          }
          
          .calendar-weekday {
            background: #f8f9fa;
            padding: 12px;
            text-align: center;
            font-weight: 600;
            font-size: 12px;
            color: #6c757d;
            text-transform: uppercase;
          }
          
          .calendar-day {
            background: white;
            min-height: 95px;
            padding: 10px;
            cursor: pointer;
            transition: background-color 0.2s;
            position: relative;
            display: flex;
            flex-direction: column;
          }
          
          .calendar-day:hover {
            background: #f8f9fa;
          }
          
          .calendar-day.empty {
            background: #f8f9fa;
            cursor: default;
          }
          
          .calendar-day.today {
            background: #e3f2fd;
          }
          
          .calendar-day.has-events {
            background: #fff3e0;
          }
          
          .calendar-day.today.has-events {
            background: #e1f5fe;
          }
          
          .day-number {
            font-weight: 500;
            font-size: 14px;
            margin-bottom: 4px;
          }
          
          .event-indicators {
            display: flex;
            flex-wrap: wrap;
            gap: 2px;
            flex: 1;
          }
          
          .event-dot {
            width: 6px;
            height: 6px;
            border-radius: 50%;
            flex-shrink: 0;
          }
          
.event-dot.work_order {
  background: #F0D400;
}

.event-dot.maintenance_task {
  background: #337FCA;
}

.event-dot.incident_task {
  background: #dc3545;
  box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
}
          
          .event-more {
            font-size: 10px;
            color: #6c757d;
            font-weight: 500;
          }
        `}</style>
        
        <div className="calendar-header">
          <button 
            className="calendar-nav"
            onClick={() => changeMonth(-1)}
          >
          Prev
          </button>
          <h3 className="calendar-title">
            {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </h3>
          <button 
            className="calendar-nav"
            onClick={() => changeMonth(1)}
          >
            Next
          </button>
        </div>
        
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="calendar-weekday">{day}</div>
          ))}
          {renderCalendarDays()}
        </div>
      </div>
    );
  };
  return (
      <Col md={12} className="p-4">
{/* Welcome Section */}
<div style={{
  backgroundColor: '#f8f9fa',
  borderLeft: '4px solid #0d6efd',
  borderRadius: '12px',
  padding: '24px',
  marginBottom: '30px',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
}}>
<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <Building size={28} style={{ color: '#0d6efd' }} />
    <h1 style={{ margin: 0, fontWeight: '700', fontSize: '28px', color: '#1a1a1a' }}>
      Welcome back, {adminName}!
    </h1>
  </div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
    <CalendarIcon size={18} style={{ color: '#6c757d' }} />
    <span style={{ color: '#6c757d', fontSize: '14px' }}>
      {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
    </span>
  </div>
</div>
  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', paddingLeft: '40px' }}>
    <span style={{ 
  backgroundColor: '#0d6efd15', 
  color: '#0d6efd',
      padding: '4px 12px', 
      borderRadius: '6px',
      fontSize: '15px',
      fontWeight: '600'
    }}>
      {userRole}
    </span>
    <span style={{ color: '#6c757d', fontSize: '15px' }}>•</span>
    <span style={{ color: '#495057', fontSize: '15px', fontWeight: '500' }}>{organizationName}</span>
  </div>
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
 
 
  <div>

  </div>
        {/* Calendar and Summary Section */}
        <div style={twoColumnGrid}>
          {/* Calendar */}
          <div style={calendarCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CalendarIcon size={20} style={{ marginRight: '8px', color: '#0d6efd' }} />
                Schedule Calendar
              </h5>
<div style={{ fontSize: '11px', color: '#6c757d' }}>
  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '12px' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F0D400', marginRight: '5px' }}></div>
    Work Orders
  </span>
  <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '12px' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#337FCA', marginRight: '5px' }}></div>
    Maintenance
  </span>
  <span style={{ display: 'inline-flex', alignItems: 'center' }}>
    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#dc3545', marginRight: '5px' }}></div>
    Incidents
  </span>
</div>
<button 
  onClick={fetchAllOrgTasks}
  disabled={loadingCalendar}
  style={{
    background: '#0d6efd',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    padding: '4px 12px',
    fontSize: '12px',
    cursor: loadingCalendar ? 'not-allowed' : 'pointer',
    opacity: loadingCalendar ? 0.6 : 1
  }}
>
  {loadingCalendar ? 'Refreshing...' : '🔄 Refresh'}
</button>
            </div>
            {loadingCalendar ? (
  <div style={{ textAlign: 'center', padding: '40px 0' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading calendar...</span>
    </div>
    <p style={{ marginTop: '12px', color: '#6c757d' }}>Loading tasks...</p>
  </div>
) : calendarError ? (
  <div className="alert alert-danger" role="alert">
    {calendarError}
    <button className="btn btn-link p-0 ms-2" onClick={fetchAllOrgTasks}>
      Retry
    </button>
  </div>
) : (
  <Calendar />
)}
          
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
<div style={{maxHeight: '500px', overflowY: 'auto'}}>
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
<div className="d-flex flex-column align-items-end gap-1">
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
  {person.activeTaskCount > 0 && (
    <span style={{
      fontSize: '9px',
      color: '#6c757d'
    }}>
      {person.activeTaskCount} active task{person.activeTaskCount > 1 ? 's' : ''}
    </span>
  )}
</div>
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
      {modalData.type === 'work_order' && 'Work Order Details'}
      {modalData.type === 'maintenance_task' && 'Maintenance Task Details'}
      {modalData.type === 'incident_task' && 'Incident Task Details'}
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
    
    {/* Personnel Assignment */}
    <div style={{ marginBottom: '15px', padding: '12px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
      <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>Assigned To:</div>
      <div style={{ fontSize: '14px', fontWeight: '600', color: '#1a1a1a' }}>
        {modalData.personnelName}
      </div>
    </div>

    {/* Status and Priority Row */}
    <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: '12px', color: '#6c757d' }}>Status:</strong>
        <div style={{ marginTop: '4px' }}>
          <span style={{
            backgroundColor: modalData.status === 'In Progress' ? '#0d6efd15' : '#6c757d15',
            color: modalData.status === 'In Progress' ? '#0d6efd' : '#6c757d',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '12px'
          }}>
            {modalData.status}
          </span>
        </div>
      </div>
      <div style={{ flex: 1 }}>
        <strong style={{ fontSize: '12px', color: '#6c757d' }}>Priority:</strong>
        <div style={{ marginTop: '4px' }}>
          <span style={{
            backgroundColor: 
              modalData.priority === 'high' ? '#dc354515' : 
              modalData.priority === 'medium' ? '#fd7e1415' : 
              '#19875415',
            color: 
              modalData.priority === 'high' ? '#dc3545' : 
              modalData.priority === 'medium' ? '#fd7e14' : 
              '#198754',
            fontSize: '12px',
            fontWeight: '600',
            padding: '4px 8px',
            borderRadius: '12px',
            textTransform: 'uppercase'
          }}>
            {modalData.priority}
          </span>
        </div>
      </div>
    </div>

    {/* Type Badge */}
    {modalData.isIncidentRelated && (
      <div style={{ marginBottom: '10px' }}>
        <span style={{
          backgroundColor: '#dc354515',
          color: '#dc3545',
          fontSize: '11px',
          fontWeight: '600',
          padding: '4px 8px',
          borderRadius: '12px'
        }}>
          🚨 INCIDENT-RELATED TASK
        </span>
      </div>
    )}

    {/* Description */}
    <div style={{ marginBottom: '12px' }}>
      <strong style={{ fontSize: '12px', color: '#6c757d' }}>Description:</strong>
      <div style={{ fontSize: '14px', marginTop: '4px', color: '#495057' }}>
        {modalData.description}
      </div>
    </div>

    {/* Location */}
    {modalData.location && (
      <div style={{ marginBottom: '10px', display: 'flex', alignItems: 'center' }}>
        <MapPin size={16} style={{ marginRight: '8px', color: '#6c757d' }} />
        <span style={{ fontSize: '13px', color: '#495057' }}>{modalData.location}</span>
      </div>
    )}

    {/* Asset */}
    {modalData.asset && (
      <div style={{ marginBottom: '10px' }}>
        <strong style={{ fontSize: '12px', color: '#6c757d' }}>Asset/Equipment:</strong>
        <div style={{ fontSize: '13px', marginTop: '4px', color: '#495057' }}>
          {modalData.asset}
        </div>
      </div>
    )}

    {/* Category */}
    {modalData.category && (
      <div style={{ marginBottom: '10px' }}>
        <strong style={{ fontSize: '12px', color: '#6c757d' }}>Category:</strong>
        <div style={{ fontSize: '13px', marginTop: '4px', color: '#495057' }}>
          {modalData.category}
        </div>
      </div>
    )}
  </div>
</div>
  </div>
)}


{/* ADD THIS NEW MODAL RIGHT HERE: */}
{showCalendarModal && (
  <Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)} size="lg">
    <Modal.Header closeButton>
      <Modal.Title>
        Tasks on {selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
      </Modal.Title>
    </Modal.Header>
    <Modal.Body>
      {selectedEvents.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '20px', color: '#6c757d' }}>
          No tasks scheduled for this date
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {selectedEvents.map((event, index) => (
            <div 
              key={index}
              style={{
                padding: '16px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef',
                cursor: 'pointer'
              }}
              onClick={() => {
  setShowCalendarModal(false);
  
  // Redirect based on task type
  if (event.type === 'work_order') {
    navigate('/dashboard-admin/WorkOrder', { 
      state: { selectedWorkOrderId: event.id }
    });
  } else if (event.type === 'maintenance_task' || event.type === 'incident_task') {
    navigate('/dashboard-admin/MaintenanceTasks', { 
      state: { selectedTaskId: event.id }
    });
  }
}}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '600' }}>{event.title}</h6>
                <Badge bg={
                  event.type === 'work_order' ? 'warning' :
                  event.type === 'incident_task' ? 'danger' : 'primary'
                }>
                  {event.type === 'work_order' ? 'Work Order' :
                   event.type === 'incident_task' ? 'Incident' : 'Maintenance'}
                </Badge>
              </div>
              
              <div style={{ fontSize: '12px', color: '#6c757d', marginBottom: '4px' }}>
                <MapPin size={14} style={{ marginRight: '4px' }} />
                {event.location}
              </div>
              
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                Assigned to: <strong>{event.personnelName}</strong>
              </div>
              
              <div style={{ marginTop: '8px' }}>
                <span style={{
                  backgroundColor: 
                    event.priority === 'high' ? '#dc354515' : 
                    event.priority === 'medium' ? '#fd7e1415' : '#19875415',
                  color: 
                    event.priority === 'high' ? '#dc3545' : 
                    event.priority === 'medium' ? '#fd7e14' : '#198754',
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '3px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase'
                }}>
                  {event.priority}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal.Body>
  </Modal>
)}
      </Col>
  );
}