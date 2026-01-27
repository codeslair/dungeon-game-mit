import React, { useState, useCallback } from 'react';
import NotificationItem, { Notification as NotificationType } from './Notification';

export const useNotification = () => {
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newNotification: NotificationType = {
      id,
      message,
      type,
      duration,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  }, [removeNotification]);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const NotificationContainer: React.FC = () => (
    <div className="notification-container">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={removeNotification}
        />
      ))}
    </div>
  );

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    NotificationContainer,
  };
};

// Export Notification type
export type { NotificationType as Notification };