import React, { useState, useEffect } from 'react';

interface ErrorBoxProps {
  message: string;
  type?: 'error' | 'warning' | 'info';
  autoClose?: boolean;
  duration?: number;
  onClose?: () => void;
}

const ErrorBox: React.FC<ErrorBoxProps> = ({ 
  message, 
  type = 'error',
  autoClose = true,
  duration = 5000,
  onClose
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (autoClose && message) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, duration - elapsed);
        setProgress((remaining / duration) * 100);
        
        if (remaining <= 0) {
          handleClose();
          clearInterval(interval);
        }
      }, 50);

      return () => clearInterval(interval);
    }
  }, [message, autoClose, duration]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) {
      setTimeout(onClose, 300);
    }
  };

  if (!message || !isVisible) return null;

  const getTypeStyles = () => {
    switch (type) {
      case 'error':
        return {
          background: 'rgba(244, 67, 54, 0.95)',
          borderColor: '#d32f2f',
          icon: '❌'
        };
      case 'warning':
        return {
          background: 'rgba(255, 152, 0, 0.95)',
          borderColor: '#f57c00',
          icon: '⚠️'
        };
      case 'info':
        return {
          background: 'rgba(33, 150, 243, 0.95)',
          borderColor: '#1976d2',
          icon: 'ℹ️'
        };
      default:
        return {
          background: 'rgba(244, 67, 54, 0.95)',
          borderColor: '#d32f2f',
          icon: '❌'
        };
    }
  };

  const styles = getTypeStyles();
  const title = type === 'error' ? 'Error' : type === 'warning' ? 'Warning' : 'Information';

  return (
    <div 
      className="error-box" 
      style={{ 
        background: styles.background, 
        borderLeftColor: styles.borderColor 
      }}
    >
      <div className="error-header">
        <span className="error-icon">{styles.icon}</span>
        <span className="error-title">{title}</span>
        <button 
          className="close-button"
          onClick={handleClose}
          aria-label="Close error message"
        >
          &times;
        </button>
      </div>
      <div className="error-content">
        {message}
      </div>
      {autoClose && (
        <div className="error-progress">
          <div 
            className="error-progress-bar" 
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default ErrorBox;