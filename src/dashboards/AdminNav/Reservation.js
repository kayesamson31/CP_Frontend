import React, { useState, useEffect } from 'react';
import { Calendar, Clock, User, Car, Building, Search, Filter, Eye, Check, X, Plus, MoreVertical, Bell } from 'lucide-react';
import SidebarLayout from '../../Layouts/SidebarLayout';const ReservationManagement = () => {
  const [activeTab, setActiveTab] = useState('pending');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Mock data - in real app, this would come from your backend
  const [reservations, setReservations] = useState([
    {
      id: 'RES001',
      type: 'facility',
      itemName: 'Conference Room A',
      requester: 'John Doe',
      department: 'Marketing',
      date: '2025-08-25',
      time: '09:00 - 11:00',
      purpose: 'Team meeting and project discussion',
      status: 'pending',
      submittedDate: '2025-08-22',
      priority: 'normal'
    },
    {
      id: 'RES002',
      type: 'vehicle',
      itemName: 'Toyota Hiace (ABC-123)',
      requester: 'Jane Smith',
      department: 'HR',
      date: '2025-08-24',
      time: '08:00 - 17:00',
      purpose: 'Employee transportation for team building',
      status: 'approved',
      submittedDate: '2025-08-20',
      approvedDate: '2025-08-21',
      priority: 'high'
    },
    {
      id: 'RES003',
      type: 'facility',
      itemName: 'Auditorium',
      requester: 'Mike Johnson',
      department: 'Operations',
      date: '2025-08-23',
      time: '13:00 - 16:00',
      purpose: 'Monthly company meeting',
      status: 'completed',
      submittedDate: '2025-08-15',
      approvedDate: '2025-08-16',
      completedDate: '2025-08-23',
      priority: 'high'
    },
    {
      id: 'RES004',
      type: 'vehicle',
      itemName: 'Honda Civic (XYZ-789)',
      requester: 'Sarah Lee',
      department: 'Sales',
      date: '2025-08-26',
      time: '10:00 - 15:00',
      purpose: 'Client visit',
      status: 'rejected',
      submittedDate: '2025-08-21',
      rejectedDate: '2025-08-22',
      rejectionReason: 'Vehicle already reserved for maintenance',
      priority: 'normal'
    },
    {
      id: 'RES005',
      type: 'facility',
      itemName: 'Training Room B',
      requester: 'David Wilson',
      department: 'IT',
      date: '2025-08-27',
      time: '14:00 - 17:00',
      purpose: 'Technical training session',
      status: 'cancelled',
      submittedDate: '2025-08-19',
      approvedDate: '2025-08-20',
      cancelledDate: '2025-08-22',
      cancelReason: 'Event postponed',
      priority: 'normal'
    }
  ]);

  const statusCounts = {
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    rejected: reservations.filter(r => r.status === 'rejected').length,
    completed: reservations.filter(r => r.status === 'completed').length,
    cancelled: reservations.filter(r => r.status === 'cancelled').length
  };

  const filteredReservations = reservations.filter(reservation => {
    const matchesTab = reservation.status === activeTab;
    const matchesSearch = reservation.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.requester.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         reservation.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || reservation.type === filterType;
    
    return matchesTab && matchesSearch && matchesFilter;
  });

  const handleApprove = (reservationId) => {
    setReservations(prev => 
      prev.map(r => 
        r.id === reservationId 
          ? { ...r, status: 'approved', approvedDate: new Date().toISOString().split('T')[0] }
          : r
      )
    );
  };

  const handleReject = (reservationId, reason) => {
    setReservations(prev => 
      prev.map(r => 
        r.id === reservationId 
          ? { 
              ...r, 
              status: 'rejected', 
              rejectedDate: new Date().toISOString().split('T')[0],
              rejectionReason: reason 
            }
          : r
      )
    );
  };

  const StatusBadge = ({ status, priority }) => {
    const baseStyle = {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '4px 8px',
      fontSize: '12px',
      fontWeight: '500',
      borderRadius: '20px',
      border: '1px solid'
    };

    const statusStyles = {
      pending: { backgroundColor: '#fef3c7', color: '#92400e', borderColor: '#fcd34d' },
      approved: { backgroundColor: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' },
      rejected: { backgroundColor: '#fee2e2', color: '#991b1b', borderColor: '#fca5a5' },
      completed: { backgroundColor: '#dbeafe', color: '#1e40af', borderColor: '#93c5fd' },
      cancelled: { backgroundColor: '#f3f4f6', color: '#374151', borderColor: '#d1d5db' }
    };

    const priorityIndicator = priority === 'high' ? '🔥' : '';

    return (
      <span style={{...baseStyle, ...statusStyles[status]}}>
        {priorityIndicator}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const ReservationCard = ({ reservation }) => (
    <div style={{
      backgroundColor: 'white',
      border: '1px solid #e5e7eb',
      borderRadius: '8px',
      padding: '16px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      transition: 'box-shadow 0.2s',
      cursor: 'pointer',
      marginBottom: '16px'
    }}
    onMouseEnter={(e) => e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)'}
    onMouseLeave={(e) => e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)'}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {reservation.type === 'facility' ? 
            <Building size={20} color="#2563eb" /> : 
            <Car size={20} color="#059669" />
          }
          <h3 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>{reservation.itemName}</h3>
        </div>
        <StatusBadge status={reservation.status} priority={reservation.priority} />
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
          <User size={16} />
          <span>{reservation.requester} - {reservation.department}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
          <Calendar size={16} />
          <span>{reservation.date}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontSize: '14px', color: '#6b7280' }}>
          <Clock size={16} />
          <span>{reservation.time}</span>
        </div>
        <div style={{ fontSize: '14px', color: '#6b7280' }}>
          <strong>Purpose:</strong> {reservation.purpose}
        </div>
        {reservation.rejectionReason && (
          <div style={{
            backgroundColor: '#fef2f2',
            color: '#dc2626',
            padding: '8px',
            borderRadius: '4px',
            fontSize: '12px',
            marginTop: '8px'
          }}>
            <strong>Rejection Reason:</strong> {reservation.rejectionReason}
          </div>
        )}
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        paddingTop: '12px',
        borderTop: '1px solid #f3f4f6'
      }}>
        <span style={{ fontSize: '12px', color: '#9ca3af' }}>
          Submitted: {reservation.submittedDate}
        </span>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => setSelectedReservation(reservation)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 12px',
              fontSize: '12px',
              backgroundColor: '#f3f4f6',
              color: '#374151',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            <Eye size={12} />
            View
          </button>
          {reservation.status === 'pending' && (
            <>
              <button 
                onClick={() => handleApprove(reservation.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#dcfce7',
                  color: '#166534',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <Check size={12} />
                Approve
              </button>
              <button 
                onClick={() => handleReject(reservation.id, 'Admin rejected')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 12px',
                  fontSize: '12px',
                  backgroundColor: '#fee2e2',
                  color: '#991b1b',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
                Reject
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );

  const CalendarView = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());
    
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDays.push(day);
    }

    const getReservationsForDate = (date) => {
      const dateStr = date.toISOString().split('T')[0];
      return reservations.filter(r => r.date === dateStr);
    };

    return (
      <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <h3 style={{ fontWeight: '600', color: '#111827', margin: 0 }}>Weekly Calendar View</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', borderBottom: '1px solid #e5e7eb' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} style={{
              padding: '12px',
              textAlign: 'center',
              fontWeight: '500',
              color: '#374151',
              backgroundColor: '#f9fafb',
              borderRight: '1px solid #e5e7eb'
            }}>
              {day}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', minHeight: '400px' }}>
          {weekDays.map((day, index) => {
            const dayReservations = getReservationsForDate(day);
            const isToday = day.toDateString() === today.toDateString();
            
            return (
              <div 
                key={index} 
                style={{
                  padding: '8px',
                  borderRight: '1px solid #e5e7eb',
                  backgroundColor: isToday ? '#eff6ff' : 'white'
                }}
              >
                <div style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  marginBottom: '8px',
                  color: isToday ? '#2563eb' : '#111827'
                }}>
                  {day.getDate()}
                </div>
                <div>
                  {dayReservations.map(reservation => (
                    <div 
                      key={reservation.id}
                      style={{
                        fontSize: '12px',
                        padding: '4px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '4px',
                        backgroundColor: reservation.type === 'facility' ? '#dbeafe' : '#d1fae5',
                        color: reservation.type === 'facility' ? '#1e40af' : '#065f46'
                      }}
                      onClick={() => setSelectedReservation(reservation)}
                    >
                      <div style={{ fontWeight: '500', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reservation.itemName}
                      </div>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reservation.time}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <SidebarLayout role="admin">
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '24px', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', margin: '0 0 4px 0' }}>
              Reservation Management
            </h1>
            <p style={{ color: '#6b7280', margin: 0 }}>Manage facility and vehicle reservations</p>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <Bell size={16} />
              Notifications ({statusCounts.pending})
            </button>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              backgroundColor: '#059669',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer'
            }}>
              <Plus size={16} />
              Quick Reserve
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} style={{
              backgroundColor: 'white',
              padding: '16px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827' }}>{count}</div>
              <div style={{ fontSize: '14px', color: '#6b7280', textTransform: 'capitalize' }}>{status}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        border: '1px solid #e5e7eb'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} size={16} />
            <input
              type="text"
              placeholder="Search reservations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                paddingLeft: '40px',
                paddingRight: '16px',
                paddingTop: '8px',
                paddingBottom: '8px',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                outline: 'none',
                width: '250px'
              }}
            />
          </div>
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              outline: 'none'
            }}
          >
            <option value="all">All Types</option>
            <option value="facility">Facilities Only</option>
            <option value="vehicle">Vehicles Only</option>
          </select>
        </div>
        
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setViewMode('list')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'list' ? '#2563eb' : '#f3f4f6',
              color: viewMode === 'list' ? 'white' : '#374151'
            }}
          >
            List View
          </button>
          <button
            onClick={() => setViewMode('calendar')}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              backgroundColor: viewMode === 'calendar' ? '#2563eb' : '#f3f4f6',
              color: viewMode === 'calendar' ? 'white' : '#374151'
            }}
          >
            Calendar View
          </button>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && <CalendarView />}

      {/* Status Tabs */}
      {viewMode === 'list' && (
        <div style={{ marginBottom: '24px' }}>
          <div style={{ 
            display: 'flex', 
            gap: '4px', 
            backgroundColor: '#f3f4f6', 
            padding: '4px', 
            borderRadius: '8px',
            marginBottom: '16px'
          }}>
            {Object.entries(statusCounts).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setActiveTab(status)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  fontSize: '14px',
                  fontWeight: '500',
                  borderRadius: '6px',
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: activeTab === status ? 'white' : 'transparent',
                  color: activeTab === status ? '#2563eb' : '#6b7280',
                  textTransform: 'capitalize'
                }}
              >
                {status}
                <span style={{
                  padding: '2px 8px',
                  fontSize: '12px',
                  borderRadius: '12px',
                  backgroundColor: activeTab === status ? '#dbeafe' : '#e5e7eb'
                }}>
                  {count}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reservations List */}
      {viewMode === 'list' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '16px' }}>
          {filteredReservations.length > 0 ? (
            filteredReservations.map(reservation => (
              <ReservationCard key={reservation.id} reservation={reservation} />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: '#6b7280' }}>
              <div style={{ fontSize: '18px', marginBottom: '8px' }}>No reservations found</div>
              <div style={{ fontSize: '14px' }}>Try adjusting your search or filter criteria</div>
            </div>
          )}
        </div>
      )}

      {/* Reservation Detail Modal */}
      {selectedReservation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 50,
          padding: '16px'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            maxWidth: '500px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>Reservation Details</h2>
              <button 
                onClick={() => setSelectedReservation(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#9ca3af'
                }}
              >
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              <div style={{ marginBottom: '12px' }}><strong>ID:</strong> {selectedReservation.id}</div>
              <div style={{ marginBottom: '12px' }}><strong>Item:</strong> {selectedReservation.itemName}</div>
              <div style={{ marginBottom: '12px' }}><strong>Requester:</strong> {selectedReservation.requester}</div>
              <div style={{ marginBottom: '12px' }}><strong>Department:</strong> {selectedReservation.department}</div>
              <div style={{ marginBottom: '12px' }}><strong>Date:</strong> {selectedReservation.date}</div>
              <div style={{ marginBottom: '12px' }}><strong>Time:</strong> {selectedReservation.time}</div>
              <div style={{ marginBottom: '12px' }}><strong>Purpose:</strong> {selectedReservation.purpose}</div>
              <div style={{ marginBottom: '12px' }}>
                <strong>Status:</strong> <StatusBadge status={selectedReservation.status} priority={selectedReservation.priority} />
              </div>
              {selectedReservation.rejectionReason && (
                <div style={{ marginBottom: '12px' }}>
                  <strong>Rejection Reason:</strong> {selectedReservation.rejectionReason}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
    </SidebarLayout>
  );
};

export default ReservationManagement;