import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Card, Badge, ListGroup } from 'react-bootstrap';
import SidebarLayout from '../../Layouts/SidebarLayout'; // Import SidebarLayout
import { formatDistanceToNow } from 'date-fns';

export default function Notification({ role = 'standard' }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

useEffect(() => {
  const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
    const parsed = JSON.parse(storedNotifications);
    setNotifications(parsed);
    setUnreadCount(parsed.filter(n => !n.isRead).length);
       }
      }, 
      []);

  const markAsRead = (notificationId) => {
  const updated = notifications.map(notification =>
    notification.id === notificationId
      ? { ...notification, isRead: true }
      : notification
      );

  setNotifications(updated);
  setUnreadCount(updated.filter(n => !n.isRead).length);
  localStorage.setItem('notifications', JSON.stringify(updated));
      };


  const handleNotificationClick = (notification) => {
  if (!notification.isRead)
    {
      markAsRead(notification.id);
    }
    console.log('Clicked notification:', notification); // Handle the click logic, e.g., navigate or show more details
    };

    return (
      <SidebarLayout  role={role}>
          <Container fluid style={{ backgroundColor: '#FFFFFF', padding: 0, minHeight: '100vh' }}>
          <Row>
          <Col className="p-4" style={{ backgroundColor: '#FFFFFF' }}>      
            <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 style={{ color: '#284386', marginBottom: '5px' }}>Notifications</h2>
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
                  localStorage.setItem('notifications', JSON.stringify(updated));
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
                  <p className="text-muted">You'll see notifications here when there are updates to your requests.</p>
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
                    borderLeft: notification.isRead ? 'none' : '4px solid #284CFF',
                    cursor: 'pointer',
                    padding: '20px',
                    width: '100%', // Ensure full width
                    boxSizing: 'border-box' // Include padding in width calculation
                  }}
                  className="border-0 border-bottom"
                >
                
                <div className="d-flex align-items-start">
                <div
                  style={{
                      width: '40px',
                      height: '40px',
                      backgroundColor: notification.isRead ? '#E9ECEF' : '#284CFF',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: '15px',
                      fontSize: '1.2rem'
                        }}
                >
                      {notification.isRead ? '📖' : '🔄'}
                </div>

                {/* Notification Content */}

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
                                  backgroundColor: '#FF7308', // Replace with status color logic
                                  fontSize: '0.75rem'
                                }}
                                >
                                {notification.status}
                        </Badge>
                              <small className="text-muted">#{notification.workOrderId}</small>
                        </div>
                      </div>

                          {/* Unread Indicator */}
                          {!notification.isRead && (
                          <div
                            style={{
                            width: '8px',
                            height: '8px',
                            backgroundColor: '#284CFF',
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
