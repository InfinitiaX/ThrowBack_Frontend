// src/components/common/ErrorMessage.jsx
import React from 'react';
import styles from './ErrorMessage.module.css';

const ErrorMessage = ({ 
  message, 
  onRetry, 
  type = 'error',
  showIcon = true,
  className = ''
}) => {
  const getIcon = () => {
    switch (type) {
      case 'warning':
        return 'fas fa-exclamation-triangle';
      case 'info':
        return 'fas fa-info-circle';
      case 'success':
        return 'fas fa-check-circle';
      default:
        return 'fas fa-exclamation-circle';
    }
  };

  return (
    <div className={`${styles.errorMessage} ${styles[type]} ${className}`}>
      {showIcon && (
        <div className={styles.icon}>
          <i className={getIcon()}></i>
        </div>
      )}
      
      <div className={styles.content}>
        <p className={styles.message}>{message}</p>
        
        {onRetry && (
          <button className={styles.retryButton} onClick={onRetry}>
            <i className="fas fa-redo"></i>
            Retry
          </button>
        )}
      </div>
    </div>
  );
};

export default ErrorMessage;