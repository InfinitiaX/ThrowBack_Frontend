// components/Common/Toast.jsx
import React, { useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faCheckCircle, faExclamationCircle, 
  faInfoCircle, faExclamationTriangle 
} from '@fortawesome/free-solid-svg-icons';
import styles from './Toast.module.css';

/**
 * Composant Toast pour afficher des notifications
 * 
 * @param {boolean} show 
 * @param {string} message 
 * @param {string} type 
 * @param {Function} onClose 
 * @param {number} duration 
 * @param {string} position 
 */
const Toast = ({ 
  show, 
  message, 
  type = 'success', 
  onClose, 
  duration = 3000,
  position = 'top-right'
}) => {
  // Fermer automatiquement le toast après la durée spécifiée
  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [show, duration, onClose]);
  
  // Si le toast n'est pas affiché, ne rien rendre
  if (!show) return null;
  
  // Déterminer l'icône à afficher en fonction du type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return faCheckCircle;
      case 'error':
        return faExclamationCircle;
      case 'warning':
        return faExclamationTriangle;
      case 'info':
      default:
        return faInfoCircle;
    }
  };
  
  // Déterminer la classe de position
  const getPositionClass = () => {
    switch (position) {
      case 'top-center':
        return styles.topCenter;
      case 'top-left':
        return styles.topLeft;
      case 'bottom-right':
        return styles.bottomRight;
      case 'bottom-center':
        return styles.bottomCenter;
      case 'bottom-left':
        return styles.bottomLeft;
      case 'top-right':
      default:
        return styles.topRight;
    }
  };
  
  return (
    <div className={`${styles.toastContainer} ${getPositionClass()}`}>
      <div className={`${styles.toast} ${styles[type]}`}>
        <div className={styles.toastIcon}>
          <FontAwesomeIcon icon={getIcon()} />
        </div>
        
        <div className={styles.toastContent}>
          <p className={styles.toastMessage}>{message}</p>
        </div>
        
        <button 
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Fermer"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>
    </div>
  );
};

export default Toast;