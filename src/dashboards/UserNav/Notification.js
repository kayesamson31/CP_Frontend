import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Badge, ListGroup } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout';
import { formatDistanceToNow } from 'date-fns';

export default function Notification({ role = 'standard', userId = 'user123' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Role-based example notifications
  const getNotificationsByRole = (role) => {
    const baseTimestamp = Date.now();
    
    const notificationTemplates = {
      standard: [
        {
          id: 1,
          title: "Work Order Request Pending",
          message: "Your work order request #WO-2024-001 for office AC repair is now pending for admin approval.",
          status: "Pending",
          workOrderId: "WO-2024-001",
          timestamp: new Date(baseTimestamp - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "admin",
          actionType: "status_update"
        },
        {
          id: 2,
          title: "Work Order Request Rejected",
          message: "Your work order request #WO-2024-002 has been rejected. Reason: Insufficient details provided.",
          status: "Rejected",
          workOrderId: "WO-2024-002",
          timestamp: new Date(baseTimestamp - 24 * 60 * 60 * 1000).toISOString(),
          isRead: true,
          category: "work_order",
          priority: "high",
          notifiedBy: "admin",
          actionType: "status_update"
        },
        {
          id: 3,
          title: "Work Order In Progress",
          message: "Your work order request #WO-2024-003 is now in progress. Technician John Doe has started working on it.",
          status: "In Progress",
          workOrderId: "WO-2024-003",
          timestamp: new Date(baseTimestamp - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "personnel",
          actionType: "status_update"
        },
        {
          id: 4,
          title: "Work Order Completed",
          message: "Your work order request #WO-2024-004 has been successfully completed by our technician.",
          status: "Completed",
          workOrderId: "WO-2024-004",
          timestamp: new Date(baseTimestamp - 6 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "personnel",
          actionType: "status_update"
        },
        {
          id: 5,
          title: "Work Order Failed",
          message: "Work order #WO-2024-005 encountered issues during execution. Please contact support for details.",
          status: "Failed",
          workOrderId: "WO-2024-005",
          timestamp: new Date(baseTimestamp - 8 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "high",
          notifiedBy: "personnel",
          actionType: "status_update"
        }
      ],
      
      admin: [
        {
          id: 6,
          title: "New Work Order Request Received",
          message: "A new work order request #WO-2024-006 has been submitted by Jane Smith for printer maintenance.",
          status: "New Request",
          workOrderId: "WO-2024-006",
          timestamp: new Date(baseTimestamp - 30 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "system",
          actionType: "new_request",
          requestor: "Jane Smith"
        },
        {
          id: 7,
          title: "Task Completed by Personnel",
          message: "Personnel Mike Johnson has marked work order #WO-2024-007 as completed.",
          status: "Completed",
          workOrderId: "WO-2024-007",
          timestamp: new Date(baseTimestamp - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "personnel",
          actionType: "task_update",
          personnel: "Mike Johnson"
        },
        {
          id: 8,
          title: "Task In Progress with Extended Due Date",
          message: "Personnel has extended the due date for work order #WO-2024-008. New expected completion: Tomorrow.",
          status: "In Progress - Extended",
          workOrderId: "WO-2024-008",
          timestamp: new Date(baseTimestamp - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "medium",
          notifiedBy: "personnel",
          actionType: "task_update"
        },
        {
          id: 9,
          title: "Asset Maintenance Remarks",
          message: "Personnel provided remarks for asset maintenance #AM-2024-001: 'Equipment requires part replacement'",
          status: "Remarks Added",
          workOrderId: "AM-2024-001",
          timestamp: new Date(baseTimestamp - 6 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "asset_maintenance",
          priority: "normal",
          notifiedBy: "personnel",
          actionType: "remarks_added"
        },
        {
          id: 10,
          title: "Overdue Task Alert",
          message: "Work order #WO-2024-009 assigned to Personnel is now overdue by 2 days.",
          status: "Overdue",
          workOrderId: "WO-2024-009",
          timestamp: new Date(baseTimestamp - 8 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "high",
          notifiedBy: "system",
          actionType: "overdue_alert"
        }
      ],
      
      personnel: [
        {
          id: 11,
          title: "New Work Order Assignment",
          message: "You have been assigned a new work order #WO-2024-011 for electrical repair in Conference Room A.",
          status: "Assigned",
          workOrderId: "WO-2024-011",
          timestamp: new Date(baseTimestamp - 1 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "normal",
          notifiedBy: "admin",
          actionType: "task_assigned"
        },
        {
          id: 12,
          title: "Asset Maintenance Assignment",
          message: "You have been assigned asset maintenance #AM-2024-002 for HVAC system inspection in Building B.",
          status: "Assigned",
          workOrderId: "AM-2024-002",
          timestamp: new Date(baseTimestamp - 3 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "asset_maintenance",
          priority: "medium",
          notifiedBy: "admin",
          actionType: "task_assigned"
        },
        {
          id: 13,
          title: "High Priority Assignment",
          message: "URGENT: You have been assigned a high-priority work order #WO-2024-013 for emergency plumbing repair.",
          status: "Assigned - Urgent",
          workOrderId: "WO-2024-013",
          timestamp: new Date(baseTimestamp - 15 * 60 * 1000).toISOString(),
          isRead: false,
          category: "work_order",
          priority: "high",
          notifiedBy: "admin",
          actionType: "task_assigned"
        }
      ],
      
      sysadmin: [
        {
          id: 14,
          title: "Database Connection Error",
          message: "Critical system error detected: Database connection timeout in Work Order module at 14:30.",
          status: "Critical Error",
          workOrderId: "SYS-2024-001",
          timestamp: new Date(baseTimestamp - 30 * 60 * 1000).toISOString(),
          isRead: false,
          category: "system_error",
          priority: "critical",
          notifiedBy: "system",
          actionType: "system_alert",
          errorCode: "DB_TIMEOUT_001"
        },
        {
          id: 15,
          title: "API Service Down",
          message: "System alert: Notification service API is experiencing downtime. User notifications may be delayed.",
          status: "Service Down",
          workOrderId: "SYS-2024-002",
          timestamp: new Date(baseTimestamp - 2 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "system_error",
          priority: "high",
          notifiedBy: "system",
          actionType: "system_alert",
          errorCode: "API_DOWN_002"
        },
        {
          id: 16,
          title: "System Performance Warning",
          message: "Warning: Server CPU usage has exceeded 85% for the past 15 minutes. Consider scaling resources.",
          status: "Performance Warning",
          workOrderId: "SYS-2024-003",
          timestamp: new Date(baseTimestamp - 4 * 60 * 60 * 1000).toISOString(),
          isRead: false,
          category: "system_error",
          priority: "medium",
          notifiedBy: "system",
          actionType: "system_alert",
          errorCode: "PERF_WARN_003"
        }
      ]
    };

    return notificationTemplates[role] || [];
  };

  // Get badge color based on status and role
  const getBadgeColor = (status, priority, category) => {
    if (priority === 'critical') return '#DC3545';
    if (priority === 'high') return '#FD7E14';
    
    const colorMap = {
      'Pending': '#FFC107',
      'Approved': '#28A745',
      'Rejected': '#DC3545',
      'In Progress': '#007BFF',
      'In Progress - Extended': '#17A2B8',
      'Completed': '#28A745',
      'Failed': '#DC3545',
      'New Request': '#6F42C1',
      'Assigned': '#007BFF',
      'Assigned - Urgent': '#DC3545',
      'Overdue': '#DC3545',
      'Remarks Added': '#17A2B8',
      'Critical Error': '#DC3545',
      'Service Down': '#FD7E14',
      'Performance Warning': '#FFC107'
    };
    
    return colorMap[status] || '#6C757D';
  };

  // Get icon based on category and status
  const getNotificationIcon = (category, status, isRead) => {
    if (isRead) return '📖';
    
    const iconMap = {
      work_order: {
        'Pending': '⏳',
        'Approved': '✅',
        'Rejected': '❌',
        'In Progress': '🔧',
        'In Progress - Extended': '🔧⏱️',
        'Completed': '✅',
        'Failed': '❌',
        'New Request': '📋',
        'Assigned': '📋',
        'Assigned - Urgent': '🚨',
        'Overdue': '⚠️'
      },
      asset_maintenance: {
        'Assigned': '🔧',
        'Remarks Added': '📝',
        default: '🛠️'
      },
      system_error: {
        'Critical Error': '🔴',
        'Service Down': '⚠️',
        'Performance Warning': '🟡',
        default: '⚙️'
      }
    };
    
    return iconMap[category]?.[status] || iconMap[category]?.default || '📄';
  };

  // Add this new useEffect after the existing one
useEffect(() => {
  // Store unread count in localStorage for sidebar to read
  localStorage.setItem(`unreadCount_${role}`, unreadCount.toString());
}, [unreadCount, role]);
    
  useEffect(() => {
    const storedNotifications = localStorage.getItem(`notifications_${role}`);
    if (storedNotifications) {
      const parsed = JSON.parse(storedNotifications);
      setNotifications(parsed);
      setUnreadCount(parsed.filter(n => !n.isRead).length);
    } else {
      const roleNotifications = getNotificationsByRole(role);
      setNotifications(roleNotifications);
      setUnreadCount(roleNotifications.filter(n => !n.isRead).length);
      localStorage.setItem(`notifications_${role}`, JSON.stringify(roleNotifications));
    }
  }, [role]);

  const markAsRead = (notificationId) => {
    const updated = notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, isRead: true }
        : notification
    );

    setNotifications(updated);
    setUnreadCount(updated.filter(n => !n.isRead).length);
    localStorage.setItem(`notifications_${role}`, JSON.stringify(updated));
  };

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
                  onClick={() => {
                    const updated = notifications.map(n => ({ ...n, isRead: true }));
                    setNotifications(updated);
                    setUnreadCount(0);
                    localStorage.setItem(`notifications_${role}`, JSON.stringify(updated));
                  }}
                >
                  Mark All as Read
                </Button>
              )}
            </div>

            <Card className="shadow-sm" style={{ width: '100%' }}>
              <Card.Body className="p-0">
                {notifications.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🔔</div>
                    <h5 style={{ color: '#6C757D' }}>No notifications yet</h5>
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
                          borderLeft: notification.isRead ? 'none' : `4px solid ${getBadgeColor(notification.status, notification.priority, notification.category)}`,
                          cursor: 'pointer',
                          padding: '20px',
                          width: '100%',
                          boxSizing: 'border-box'
                        }}
                        className="border-0 border-bottom"
                      >
                        <div className="d-flex align-items-start">
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: notification.isRead ? '#E9ECEF' : getBadgeColor(notification.status, notification.priority, notification.category),
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '15px',
                              fontSize: '1.2rem'
                            }}
                          >
                            {getNotificationIcon(notification.category, notification.status, notification.isRead)}
                          </div>

                          <div className="flex-grow-1">
                            <div className="d-flex justify-content-between align-items-start mb-1">
                              <h6 className="mb-1"
                                style={{ 
                                  fontWeight: notification.isRead ? '500' : '600',
                                  color: notification.isRead ? '#6C757D' : '#000'
                                }}>
                                {notification.title}
                              </h6>
                              <small className="text-muted">
                                {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                              </small>
                            </div>

                            <p className="mb-2" 
                              style={{ 
                                color: notification.isRead ? '#6C757D' : '#000',
                                fontSize: '0.9rem',
                                lineHeight: '1.4'
                              }}>
                              {notification.message}
                            </p>

                            <div className="d-flex align-items-center gap-2">
                              <Badge 
                                style={{ 
                                  backgroundColor: getBadgeColor(notification.status, notification.priority, notification.category),
                                  fontSize: '0.75rem'
                                }}>
                                {notification.status}
                              </Badge>
                              <small className="text-muted">#{notification.workOrderId}</small>
                              {notification.priority === 'high' || notification.priority === 'critical' ? (
                                <Badge bg="danger" style={{ fontSize: '0.7rem' }}>
                                  {notification.priority.toUpperCase()}
                                </Badge>
                              ) : null}
                              {notification.notifiedBy && (
                                <small className="text-muted">by {notification.notifiedBy}</small>
                              )}
                            </div>
                          </div>

                          {!notification.isRead && (
                            <div
                              style={{
                                width: '8px',
                                height: '8px',
                                backgroundColor: getBadgeColor(notification.status, notification.priority, notification.category),
                                borderRadius: '50%',
                                marginLeft: '10px'
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