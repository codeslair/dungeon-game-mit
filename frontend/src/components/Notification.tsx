import React, { useState, useEffect, useCallback } from 'react';
import './Notification.scss';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
}

interface NotificationProps {
  notification: Notification;
  onClose: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  }, [onClose, notification.id]);

  useEffect(() => {
    if (notification.duration && notification.duration > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, notification.duration);

      return () => clearTimeout(timer);
    }
  }, [notification.duration, notification.id, handleClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📢';
    }
  };

  const getTypeClass = () => {
    return `notification notification--${notification.type} ${isClosing ? 'notification--closing' : ''}`;
  };

  return (
    <div className={getTypeClass()}>
      <div className="notification__icon">{getIcon()}</div>
      <div className="notification__content">
        <p className="notification__message">{notification.message}</p>
      </div>
      <button 
        className="notification__close" 
        onClick={handleClose}
        aria-label="Close notification"
      >
        &times;
      </button>
    </div>
  );
};

export default NotificationItem;