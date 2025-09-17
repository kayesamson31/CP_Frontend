//hello_Sample2
import React, { useState } from 'react';
import SidebarLayout from '../Layouts/SidebarLayout';
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
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedEvents, setSelectedEvents] = useState([]);

  // Hard-coded sample data for visualization
  const [statsData, setStatsData] = useState([
    {
      title: "Total Assets",
      value: "248",
      subtitle: "Active equipment",
      color: "#0d6efd",
      icon: Building,
      route: "/dashboard-admin/AssetManagement"
    },
    {
      title: "Work Orders",
      value: "32",
      subtitle: "This month",
      color: "#dc3545",
      icon: Wrench,
      route: "/dashboard-admin/WorkOrder"
    },
    {
      title: "Maintenance Due",
      value: "8",
      subtitle: "Next 7 days",
      color: "#fd7e14",
      icon: AlertTriangle,
      route: "/dashboard-admin/AssetManagement"
    },
  
  ]);

  const [workOrders, setWorkOrders] = useState([
    {
      title: "HVAC System Repair",
      id: "WO-2024-001",
      category: "HVAC",
      dateRequested: "2024-09-01",
      priority: "HIGH",
      priorityColor: "#dc3545"
    },
    {
      title: "Electrical Panel Maintenance",
      id: "WO-2024-002",
      category: "Electrical",
      dateRequested: "2024-09-02",
      priority: "MEDIUM",
      priorityColor: "#fd7e14"
    },
    {
      title: "Plumbing Leak Fix",
      id: "WO-2024-003",
      category: "Plumbing",
      dateRequested: "2024-09-03",
      priority: "HIGH",
      priorityColor: "#dc3545"
    },
    {
      title: "Generator Inspection",
      id: "WO-2024-004",
      category: "Generator",
      dateRequested: "2024-09-04",
      priority: "LOW",
      priorityColor: "#198754"
    }
  ]);

  const [upcomingMaintenance, setUpcomingMaintenance] = useState([
    {
      task: "Monthly HVAC Filter Change",
      date: "2024-09-10",
      assets: "AC Units 1-5",
      location: "Building A - All Floors"
    },
    {
      task: "Elevator Safety Inspection",
      date: "2024-09-12",
      assets: "Elevators A1, A2",
      location: "Building A - Main Lobby"
    },
    {
      task: "Fire Safety System Test",
      date: "2024-09-15",
      assets: "Fire Alarms, Sprinklers",
      location: "Building B - All Areas"
    },
    {
      task: "Generator Load Test",
      date: "2024-09-18",
      assets: "Backup Generator #1",
      location: "Building A - Basement"
    },
    {
      task: "Water Tank Cleaning",
      date: "2024-09-20",
      assets: "Water Tanks 1-3",
      location: "Building C - Rooftop"
    }
  ]);

  // Comprehensive calendar events data
  const sampleEvents = [
    // Today's events
    {
      id: 1,
      title: "HVAC System Maintenance",
      date: "2025-09-04",
      type: "maintenance",
      location: "Building A - Floor 3",
      time: "09:00 AM",
      priority: "high"
    },
    {
      id: 2,
      title: "Electrical Work Order",
      date: "2025-09-04",
      type: "workorder",
      location: "Building B - Basement",
      time: "02:00 PM",
      priority: "medium"
    },
    // Tomorrow's events
    {
      id: 3,
      title: "Plumbing Inspection",
      date: "2025-09-05",
      type: "maintenance",
      location: "Building C - All Floors",
      time: "10:00 AM",
      priority: "low"
    },
    {
      id: 4,
      title: "Generator Repair",
      date: "2025-09-05",
      type: "workorder",
      location: "Building A - Basement",
      time: "01:00 PM",
      priority: "high"
    },
    // This week
    {
      id: 5,
      title: "Fire Safety System Check",
      date: "2025-09-06",
      type: "maintenance",
      location: "Building B - All Floors",
      time: "08:30 AM",
      priority: "high"
    },
    {
      id: 6,
      title: "Elevator Maintenance",
      date: "2025-09-07",
      type: "maintenance",
      location: "Building A - Lobby",
      time: "11:00 AM",
      priority: "medium"
    },
    {
      id: 7,
      title: "AC Unit Repair",
      date: "2025-09-08",
      type: "workorder",
      location: "Building C - Floor 2",
      time: "03:00 PM",
      priority: "medium"
    },
    // Next week
    {
      id: 8,
      title: "Water Tank Cleaning",
      date: "2025-09-10",
      type: "maintenance",
      location: "Building A - Rooftop",
      time: "07:00 AM",
      priority: "medium"
    },
    {
      id: 9,
      title: "Security System Update",
      date: "2025-09-11",
      type: "maintenance",
      location: "All Buildings",
      time: "09:00 AM",
      priority: "high"
    },
    {
      id: 10,
      title: "Lighting Fixture Replacement",
      date: "2025-09-12",
      type: "workorder",
      location: "Building B - Floor 1",
      time: "02:30 PM",
      priority: "low"
    },
    {
      id: 11,
      title: "Ventilation System Cleaning",
      date: "2025-09-13",
      type: "maintenance",
      location: "Building C - All Floors",
      time: "08:00 AM",
      priority: "medium"
    },
    {
      id: 12,
      title: "Door Lock Repair",
      date: "2025-09-14",
      type: "workorder",
      location: "Building A - Floor 4",
      time: "10:30 AM",
      priority: "low"
    },
    // Later this month
    {
      id: 13,
      title: "Monthly HVAC Filter Change",
      date: "2025-09-15",
      type: "maintenance",
      location: "All Buildings",
      time: "06:00 AM",
      priority: "medium"
    },
    {
      id: 14,
      title: "Parking Lot Light Repair",
      date: "2025-09-16",
      type: "workorder",
      location: "Parking Area A",
      time: "04:00 PM",
      priority: "low"
    },
    {
      id: 15,
      title: "Boiler Inspection",
      date: "2025-09-18",
      type: "maintenance",
      location: "Building A - Basement",
      time: "09:30 AM",
      priority: "high"
    },
    {
      id: 16,
      title: "Window Cleaning Service",
      date: "2025-09-20",
      type: "maintenance",
      location: "All Buildings - Exterior",
      time: "08:00 AM",
      priority: "low"
    },
    {
      id: 17,
      title: "Internet Connection Repair",
      date: "2025-09-22",
      type: "workorder",
      location: "Building C - IT Room",
      time: "01:00 PM",
      priority: "high"
    },
    {
      id: 18,
      title: "Landscaping Maintenance",
      date: "2025-09-25",
      type: "maintenance",
      location: "Garden Areas",
      time: "07:30 AM",
      priority: "low"
    }
  ];

React.useEffect(() => {
  setCalendarEvents(sampleEvents);

  // Get today's date in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  // Filter work orders and maintenance due for today
  const todaysTasks = sampleEvents.filter(event => event.date === today);

  // Count tasks
  const totalDailyTasks = todaysTasks.length;
  const totalWorkOrders = todaysTasks.filter(e => e.type === "workorder").length;
  const totalMaintenance = todaysTasks.filter(e => e.type === "maintenance").length;

  // Update stats cards
  setStatsData([
    {
      title: "Total Daily Tasks",
      value: totalDailyTasks,
      subtitle: "Work Orders + Maintenance",
      color: "#0d6efd",
      icon: CalendarDays,
      
    },
    {
      title: "Work Orders",
      value: totalWorkOrders,
      subtitle: "Today's Work Order Request",
      color: "#dc3545",
      icon: Wrench,
      route: "/dashboard-admin/WorkOrder"
    },
    {
      title: "Maintenance Due",
      value: totalMaintenance,
      subtitle: "Today's Asset Maintenance",
      color: "#fd7e14",
      icon: AlertTriangle,
      route: "/dashboard-admin/AssetManagement"
    }
  ]);
}, []);


  const handleItemClick = (item, type) => {
    setModalData(item);
    setModalType(type);
  };

  const closeModal = () => {
    setModalData(null);
    setModalType('');
  };

  const handleDateClick = (date) => {
  // Use local date instead of ISO to avoid timezone issues
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const dateString = `${year}-${month}-${day}`;
  
  const eventsOnDate = calendarEvents.filter(event => event.date === dateString);
  setSelectedEvents(eventsOnDate);
  setSelectedDate(date);
  setShowCalendarModal(true);
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

  const twoColumnGrid = {
  display: 'grid',
  gridTemplateColumns: '73% 26%', // Calendar 70%, Schedule 30%
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

  // Calendar component
  const Calendar = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const today = new Date();
    
    const getDaysInMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };
    
    const getFirstDayOfMonth = (date) => {
      return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };
    
    const changeMonth = (increment) => {
      setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + increment, 1));
    };
    
    const getEventsForDate = (day) => {
      const dateString = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
      return calendarEvents.filter(event => event.date === dateString);
    };
    
    const renderCalendarDays = () => {
      const daysInMonth = getDaysInMonth(currentDate);
      const firstDay = getFirstDayOfMonth(currentDate);
      const days = [];
      
      // Empty cells for days before the first day of the month
      for (let i = 0; i < firstDay; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
      }
      
      // Days of the month
      for (let day = 1; day <= daysInMonth; day++) {
        const eventsOnDay = getEventsForDate(day);
        const isToday = today.getDate() === day && 
                       today.getMonth() === currentDate.getMonth() && 
                       today.getFullYear() === currentDate.getFullYear();
        
        days.push(
          <div 
            key={day} 
            className={`calendar-day ${isToday ? 'today' : ''} ${eventsOnDay.length > 0 ? 'has-events' : ''}`}
            onClick={() => handleDateClick(new Date(currentDate.getFullYear(), currentDate.getMonth(), day))}
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
          
          .event-dot.maintenance {
            background: #337FCA;
          }
          
          .event-dot.workorder {
            background: #F0D400;
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
            {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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

        {/* Calendar and Summary Section */}
        <div style={twoColumnGrid}>
          {/* Calendar */}
          <div style={calendarCardStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
              <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
                <CalendarIcon size={20} style={{ marginRight: '8px', color: '#0d6efd' }} />
                Schedule Calendar
              </h5>
              <div style={{ fontSize: '12px', color: '#6c757d' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', marginRight: '15px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#337FCA', marginRight: '5px' }}></div>
                  Maintenance
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F0D400', marginRight: '5px' }}></div>
                  Work Orders
                </span>
              </div>
            </div>
            <Calendar />
          </div>

          {/* Today's Schedule */}

<div style={cardStyle}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', paddingBottom: '15px', borderBottom: '1px solid #dee2e6' }}>
    <h5 style={{ margin: 0, fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
      <Clock size={20} style={{ marginRight: '8px', color: '#337FCA' }} />
      Today's Schedule
    </h5>
  </div>
  <div>
    {(() => {
      const today = new Date().toISOString().split('T')[0];
      const todaysEvents = calendarEvents.filter(event => event.date === today);
      
      return todaysEvents.length === 0 ? (
        <div style={{ color: '#6c757d', fontSize: '13px' }}>No events scheduled for today</div>
      ) : (
        todaysEvents.map((event, index) => (
          <div 
            key={index} 
            style={{...itemCardStyle, height: 'auto', minHeight: '80px', cursor: 'pointer'}}
            onClick={() => handleItemClick(event, event.type)}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>{event.title}</div>
              
              {/* FIXED: Use inline styles instead of Bootstrap Badge */}
              <span
                style={{
                  backgroundColor: event.type === 'maintenance' ? '#337FCA' : '#F0D400',
                  color: event.type === 'maintenance' ? 'white' : 'black',
                  fontSize: '10px',
                  fontWeight: '600',
                  padding: '4px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                  border: 'none',
                  display: 'inline-block'
                }}
              >
                {event.type.toUpperCase()}
              </span>
            </div>
            <div style={{ color: '#6c757d', fontSize: '13px', marginBottom: '4px', display: 'flex', alignItems: 'center' }}>
              <Clock size={12} style={{ marginRight: '4px' }} />
              {event.time}
            </div>
            <div style={{ color: '#6c757d', fontSize: '13px', display: 'flex', alignItems: 'center' }}>
              <MapPin size={12} style={{ marginRight: '4px' }} />
              {event.location}
            </div>
          </div>
        ))
      );
    })()}
  </div>
</div>
        </div>


{/* Calendar Events Modal */}
<Modal show={showCalendarModal} onHide={() => setShowCalendarModal(false)} size="lg">
  <Modal.Header closeButton>
    <Modal.Title>
      Events for {selectedDate.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}
    </Modal.Title>
  </Modal.Header>
  <Modal.Body>
    {selectedEvents.length === 0 ? (
      <p className="text-muted">No events scheduled for this date.</p>
    ) : (
      selectedEvents.map((event, index) => (
        <div key={index} className="mb-3 p-3 border rounded">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0">{event.title}</h6>
            
            {/* FIXED: Use inline styles instead of Bootstrap Badge */}
            <span
              style={{
                backgroundColor: event.type === 'maintenance' ? '#337FCA' : '#F0D400',
                color: event.type === 'maintenance' ? 'white' : 'black',
                fontSize: '10px',
                fontWeight: '600',
                padding: '4px 8px',
                borderRadius: '12px',
                textTransform: 'uppercase',
                border: 'none',
                display: 'inline-block'
              }}
            >
              {event.type.toUpperCase()}
            </span>
          </div>
          <div className="d-flex align-items-center mb-1 text-muted">
            <Clock size={14} className="me-2" />
            {event.time}
          </div>
          <div className="d-flex align-items-center text-muted">
            <MapPin size={14} className="me-2" />
            {event.location}
          </div>
        </div>
      ))
    )}
  </Modal.Body>
</Modal>

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
    </SidebarLayout>
  );
}