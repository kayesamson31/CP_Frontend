import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, ListGroup } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '../../supabaseClient';
export default function Notification() {
  // Get current user from localStorage
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  // Helper function to get current user's organization
const getCurrentUserOrganization = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('No authenticated user');

    const { data: userData, error } = await supabase
      .from('users')
      .select('organization_id, user_id')
      .eq('email', user.email)  // Ã¢Å“â€¦ Use email instead of auth_uid
      .single();

    if (error || !userData) {
      console.error('User data fetch error:', error);
      throw new Error('User organization not found');
    }
    
    console.log('Ã¢Å“â€¦ Organization ID:', userData.organization_id);
    console.log('Ã¢Å“â€¦ User ID:', userData.user_id);
    return userData.organization_id;
  } catch (error) {
    console.error('Error getting user organization:', error);
    throw error;
  }
};
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
  // Retention policy constants
const RETENTION_POLICY = {
  UNREAD_DAYS: 30,
  READ_DAYS: 7,
  ARCHIVED_DAYS: 90,
  MAX_NOTIFICATIONS: 500
};
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
  // Cleanup old notifications based on retention policy
const cleanupOldNotifications = async () => {
  try {
    const now = new Date();
    const readCutoffDate = new Date(now.getTime() - (RETENTION_POLICY.READ_DAYS * 24 * 60 * 60 * 1000));
    const unreadCutoffDate = new Date(now.getTime() - (RETENTION_POLICY.UNREAD_DAYS * 24 * 60 * 60 * 1000));

    // Get read notifications older than 7 days
    const { data: readNotifications } = await supabase
      .from('notification_user_reads')
      .select('notification_id, read_at')
      .eq('user_id', userId)
      .lt('read_at', readCutoffDate.toISOString());

    const readNotificationIds = readNotifications?.map(n => n.notification_id) || [];

    // Soft delete read notifications older than 7 days
if (readNotificationIds.length > 0) {
  const organizationId = await getCurrentUserOrganization(); // Ã¢Å“â€¦ ADD THIS
  
  await supabase
    .from('notifications')
    .update({ is_active: false })
    .eq('organization_id', organizationId) // Ã¢Å“â€¦ ADD THIS FILTER
    .in('notification_id', readNotificationIds);
}

    // Soft delete unread notifications older than 30 days
// Soft delete unread notifications older than 30 days
const organizationId = await getCurrentUserOrganization(); // Ã¢Å“â€¦ ADD THIS

await supabase
  .from('notifications')
  .update({ is_active: false })
  .eq('organization_id', organizationId) // Ã¢Å“â€¦ ADD THIS FILTER
  .lt('created_at', unreadCutoffDate.toISOString())
  .eq('is_active', true);

    console.log(`Cleanup: Deleted ${readNotificationIds.length} old read notifications`);
  } catch (error) {
    console.error('Error cleaning up notifications:', error);
  }
};
  // Fetch notifications from Supabase
const fetchNotifications = async () => {
  try {
    setLoading(true);
    const roleId = getRoleId(role);
    const organizationId = await getCurrentUserOrganization(); // Ã¢Å“â€¦ ADD THIS

    console.log('Ã°Å¸â€Â Fetching notifications for Org:', organizationId); // Ã¢Å“â€¦ Debug

    // Fetch notifications for this role AND organization
    const { data: notificationsData, error } = await supabase
  .from('notifications')
  .select(`
    notification_id,
    title,
    message,
    created_at,
    related_table,
    related_id,
    target_user_id,
    organization_id,
    notification_types(type_name),
    priority_levels(priority_name, color_code),
    created_by
  `)
  .eq('organization_id', organizationId) // Ã¢Å“â€¦ ADD THIS FILTER
  .or(`target_roles.eq.${roleId},target_user_id.eq.${userId}`)
  .eq('is_active', true)
  .order('created_at', { ascending: false});
      if (error) throw error;

console.log('=== FETCH NOTIFICATIONS DEBUG ===');
console.log('Current Role:', role);
console.log('Current Role ID:', roleId);
console.log('User ID:', userId);
console.log('Notifications Data:', notificationsData);
console.log('Total notifications fetched:', notificationsData?.length || 0);

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
        status: notif.title, // Default, we'll update this below
        workOrderId: notif.related_id
      }));

      console.log('Sample timestamp from DB:', notificationsData[0]?.created_at);
console.log('Sample transformed timestamp:', transformedNotifications[0]?.timestamp);
console.log('Current time:', new Date().toISOString());


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
    // Check if already marked as read
    const { data: existing } = await supabase
      .from('notification_user_reads')
      .select('read_id')
      .eq('notification_id', notificationId)
      .eq('user_id', userId)
      .maybeSingle();

    // Only insert if not already read
    if (!existing) {
      const { error } = await supabase
        .from('notification_user_reads')
        .insert({
          notification_id: notificationId,
          user_id: userId,
          read_at: new Date().toISOString()
        });

      if (error) throw error;
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

  // Clear all read notifications
const clearReadNotifications = async () => {
  try {
    const readNotificationIds = notifications
      .filter(n => n.isRead)
      .map(n => n.id);

    if (readNotificationIds.length === 0) {
      alert('No read notifications to clear');
      return;
    }

    // Soft delete by setting is_active to false
// Soft delete by setting is_active to false
const organizationId = await getCurrentUserOrganization(); // Ã¢Å“â€¦ ADD THIS

const { error } = await supabase
  .from('notifications')
  .update({ is_active: false })
  .eq('organization_id', organizationId) // Ã¢Å“â€¦ ADD THIS FILTER
  .in('notification_id', readNotificationIds);

    if (error) throw error;

    // Remove from local state
    const updated = notifications.filter(n => !n.isRead);
    setNotifications(updated);
    
    alert(`Cleared ${readNotificationIds.length} read notifications`);
  } catch (error) {
    console.error('Error clearing read notifications:', error);
  }
};


useEffect(() => {
  fetchNotifications();
  cleanupOldNotifications();
  
  // Get org ID once at the start
  let currentOrgId = null;
  
  const initSubscription = async () => {
    try {
      currentOrgId = await getCurrentUserOrganization();
      console.log('ðŸ¢ Current Organization ID:', currentOrgId);
    } catch (error) {
      console.error('âŒ Failed to get organization ID:', error);
    }
    
    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications'
        },
        (payload) => {
          console.log('ðŸ”” New notification received:', payload);
          
          const roleId = getRoleId(role);
          
          // Check if notification is for current user
          const targetRoles = payload.new.target_roles?.split(',').map(r => r.trim()) || [];
          const isForMyRole = targetRoles.includes(roleId.toString());
          const isForMe = payload.new.target_user_id === userId;
          const isMyOrganization = payload.new.organization_id === currentOrgId;
          
          console.log('ðŸ” Checking notification:', {
            notificationOrgId: payload.new.organization_id,
            myOrgId: currentOrgId,
            targetRoles,
            myRole: roleId,
            isForMyRole,
            isForMe,
            isMyOrganization
          });
          
          if ((isForMyRole || isForMe) && isMyOrganization) {
            console.log('âœ… Notification is for me! Refreshing...');
            fetchNotifications();
          } else {
            console.log('âŒ Notification not for me, skipping...');
          }
        }
      )
      .subscribe((status) => {
        console.log('ðŸ“¡ Subscription status:', status);
      });

    return channel;
  };

  const channelPromise = initSubscription();

  // Refresh every 30 seconds as fallback
  const intervalId = setInterval(() => {
    fetchNotifications();
  }, 30000);

  // Cleanup old notifications daily
  const cleanupIntervalId = setInterval(() => {
    cleanupOldNotifications();
  }, 24 * 60 * 60 * 1000);

  return () => {
    channelPromise.then(channel => {
      if (channel) supabase.removeChannel(channel);
    });
    clearInterval(intervalId);
    clearInterval(cleanupIntervalId);
  };
}, [role, userId]);


  const handleNotificationClick = (notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    
    // Role-specific navigation logic
    console.log('Clicked notification:', notification);
    
   
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

<div className="d-flex gap-2">
  <Button
    variant="outline-primary"
    onClick={markAllAsRead}
    disabled={unreadCount === 0}
  >
    Mark All as Read
  </Button>
  <Button
    variant="outline-secondary"
    onClick={clearReadNotifications}
    disabled={notifications.filter(n => n.isRead).length === 0}
  >
    Clear Read
  </Button>
</div>
            </div>

           
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
                  <ListGroup className="p-2">
                    {notifications.map((notification) => (
                      <ListGroup.Item
                        key={notification.id}
                        action
                        onClick={() => handleNotificationClick(notification)}
                      style={{
  backgroundColor: notification.isRead ? '#FFFFFF' : '#F3FAFFFF',
  borderLeft: notification.isRead ? 'none' : `4px solid #007BFF`,
  cursor: 'pointer',
  padding: '16px 20px',
  width: '100%',
  boxSizing: 'border-box',
  marginBottom: '8px',
  borderRadius: '6px',
  border: notification.isRead ? '2px solid #C7DFF8FF' : '1px solid #E9ECEF',  // Thicker blue border for read
  boxShadow: 'none'  // Remove shadow muna para mas clear yung border
}}
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
  {formatDistanceToNow(new Date(notification.timestamp + 'Z'), { addSuffix: true })}
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
  {notification.workOrderId && notification.workOrderId !== 0 ? (
    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
      #{notification.workOrderId}
    </small>
  ) : null}
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
             
          </Col>
        </Row>
      </Container>
    </SidebarLayout>
  );
}