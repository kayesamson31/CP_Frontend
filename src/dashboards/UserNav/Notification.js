import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, ListGroup } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../supabaseClient';
export default function Notification() {
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  
  // Map role_id to role name
  const getRoleName = (roleId) => {
    const roleMap = {
      1: 'sysadmin',
      2: 'admin',
      3: 'personnel',
      4: 'standard'
    };
    return roleMap[roleId] || 'standard';
  };

  const role = getRoleName(currentUser.role);
  const userId = currentUser.id;
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Get role_id from role name
  const getRoleId = (roleName) => {
    const roleMap = {
      'standard': 4,
      'admin': 2,
      'personnel': 3,
      'sysadmin': 1
    };
    return roleMap[roleName.toLowerCase()] || 4;
  };

  // Get status color based on status name
  const getStatusTextClass = (status) => {
    const statusColorMap = {
      'To Review': 'text-warning',
      'Pending': 'text-info', 
      'In Progress': 'text-primary',
      'Completed': 'text-success',
      'Failed': 'text-danger',
      'Rejected': 'text-secondary',
      'Cancelled': 'text-dark',
      'Reported': 'text-warning',
      'Resolved': 'text-success'
    };
    return statusColorMap[status] || 'text-muted';
  };

  // Fetch notifications from Supabase
  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const roleId = getRoleId(role);

      // Fetch notifications for this role
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select(`
          notification_id,
          title,
          message,
          created_at,
          related_table,
          related_id,
          notification_types(type_name),
          priority_levels(priority_name, color_code),
          created_by
        `)
        .contains('target_roles', [roleId.toString()])
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch which notifications current user has read
      const { data: readData, error: readError } = await supabase
        .from('notification_user_reads')
        .select('notification_id')
        .eq('user_id', userId);

      if (readError) throw readError;

      const readNotificationIds = readData.map(r => r.notification_id);

      // Transform data to match your component structure
      const transformedNotifications = notificationsData.map(notif => ({
        id: notif.notification_id,
        title: notif.title,
        message: notif.message,
        timestamp: notif.created_at,
        isRead: readNotificationIds.includes(notif.notification_id),
        priority: notif.priority_levels?.priority_name || 'normal',
        priorityColor: notif.priority_levels?.color_code || '#6c757d',
        category: notif.notification_types?.type_name || 'general',
        relatedTable: notif.related_table,
        relatedId: notif.related_id,
        // We'll fetch status separately if needed
        status: 'Notification', // Default, we'll update this below
        workOrderId: notif.related_id
      }));

      // Fetch related work order statuses if applicable
      for (let notif of transformedNotifications) {
        if (notif.relatedTable === 'work_orders' && notif.relatedId) {
          const { data: woData } = await supabase
            .from('work_orders')
            .select('status_id, statuses(status_name)')
            .eq('work_order_id', notif.relatedId)
            .single();

          if (woData) {
            notif.status = woData.statuses?.status_name || 'Unknown';
          }
        } else if (notif.relatedTable === 'incident_reports' && notif.relatedId) {
          const { data: irData } = await supabase
            .from('incident_reports')
            .select('status_id, statuses(status_name)')
            .eq('incident_report_id', notif.relatedId)
            .single();

          if (irData) {
            notif.status = irData.statuses?.status_name || 'Unknown';
          }
        }
      }

      setNotifications(transformedNotifications);
      setUnreadCount(transformedNotifications.filter(n => !n.isRead).length);

    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      // Insert into notification_user_reads
      const { error } = await supabase
        .from('notification_user_reads')
        .insert({
          notification_id: notificationId,
          user_id: userId,
          read_at: new Date().toISOString()
        });

      if (error && error.code !== '23505') { // Ignore duplicate key errors
        throw error;
      }

      // Update local state
      const updated = notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, isRead: true }
          : notification
      );

      setNotifications(updated);
      setUnreadCount(updated.filter(n => !n.isRead).length);

    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.isRead);

      for (const notif of unreadNotifications) {
        await supabase
          .from('notification_user_reads')
          .insert({
            notification_id: notif.id,
            user_id: userId,
            read_at: new Date().toISOString()
          });
      }

      const updated = notifications.map(n => ({ ...n, isRead: true }));
      setNotifications(updated);
      setUnreadCount(0);

    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };


useEffect(() => {
    fetchNotifications();
    
    // Set up real-time subscription for new notifications
    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          const roleId = getRoleId(role);
          if (payload.new.target_roles?.includes(roleId.toString())) {
            fetchNotifications(); // Refresh notifications
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [role, userId]);



  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Role-specific navigation logic
    console.log('Clicked notification:', notification);
    
    // You can implement role-specific navigation here
    // Example:
    // if (role === 'admin' && notification.category === 'work_order') {
    //   navigate(`/admin/work-orders/${notification.workOrderId}`);
    // } else if (role === 'personnel') {
    //   navigate(`/personnel/assignments/${notification.workOrderId}`);
    // } else if (role === 'standard') {
    //   navigate(`/my-requests/${notification.workOrderId}`);
    // } else if (role === 'system_admin') {
    //   navigate(`/system/alerts/${notification.workOrderId}`);
    // }
  };

  const getRoleDisplayName = (role) => {
    const roleNames = {
      'standard': 'Standard User',
      'admin': 'Admin',
      'personnel': 'Personnel',
      'sysadmin': 'System Administrator'
    };
    return roleNames[role] || role;
  };

  return (
    <SidebarLayout role={role}>
      <Container fluid style={{ backgroundColor: '#FFFFFF', padding: 0, minHeight: '100vh' }}>
        <Row>
          <Col className="p-4" style={{ backgroundColor: '#FFFFFF' }}>      
            <div className="d-flex justify-content-between align-items-center mb-4">
              <div>
                <h2 style={{ color: '#284386', marginBottom: '5px' }}>
                  Notifications - {getRoleDisplayName(role)}
                </h2>
                <p className="text-muted mb-0">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </p>
              </div>

              {unreadCount > 0 && (
<Button
  variant="outline-primary"
  onClick={markAllAsRead}
>
  Mark All as Read
</Button>
              )}
            </div>

            <Card className="shadow-sm" style={{ width: '100%' }}>
              <Card.Body className="p-0">
  {loading ? (
    <div className="text-center py-5">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <p className="text-muted mt-2">Loading notifications...</p>
    </div>
  ) : notifications.length === 0 ? (
                  <div className="text-center py-5">
                    <h5 style={{ color: '#6C757D', marginBottom: '10px' }}>No notifications yet</h5>
                    <p className="text-muted">You'll see notifications here when there are updates relevant to your role.</p>
                  </div>
                ) : (
                  <ListGroup variant="flush">
                    {notifications.map((notification) => (
                      <ListGroup.Item
                        key={notification.id}
                        action
                        onClick={() => handleNotificationClick(notification)}
                        style={{
                          backgroundColor: notification.isRead ? 'transparent' : '#F8F9FA',
                          borderLeft: notification.isRead ? 'none' : `3px solid #007BFF`,
                          cursor: 'pointer',
                          padding: '12px 20px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        className="border-0 border-bottom"
                      >
                        <div className="d-flex align-items-center justify-content-between">
                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="mb-1"
                                style={{ 
                                  fontWeight: notification.isRead ? '500' : '600',
                                  color: notification.isRead ? '#6C757D' : '#000',
                                  fontSize: '0.95rem'
                                }}>
                                {notification.title}
                              </h6>
                              <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </small>
                            </div>

                            <p className="mb-2" 
                              style={{ 
                                color: notification.isRead ? '#6C757D' : '#495057',
                                fontSize: '0.85rem',
                                lineHeight: '1.4',
                                marginBottom: '8px'
                              }}>
                              {notification.message}
                            </p>

                            <div className="d-flex align-items-center gap-3">
                              <span 
                                className={`fw-bold ${getStatusTextClass(notification.status)}`}
                                style={{ fontSize: '0.8rem' }}>
                                {notification.status}
                              </span>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                #{notification.workOrderId}
                              </small>
                              {notification.priority === 'high' || notification.priority === 'critical' ? (
                                <span className="text-danger fw-bold" style={{ fontSize: '0.75rem' }}>
                                  {notification.priority.toUpperCase()}
                                </span>
                              ) : null}
                            </div>
                          </div>

                          {!notification.isRead && (
                            <div
                              style={{
                                width: '6px',
                                height: '6px',
                                backgroundColor: '#007BFF',
                                borderRadius: '50%',
                                marginLeft: '15px'
                              }}
                            />
                          )}
                        </div>
                      </ListGroup.Item>
                    ))}
                  </ListGroup>
                )}
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </SidebarLayout>
  );
}