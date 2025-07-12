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
 * @param {boolean} show - Indique si le toast doit être affiché
 * @param {string} message - Message à afficher
 * @param {string} type - Type de toast (success, error, info, warning)
 * @param {Function} onClose - Fonction à appeler pour fermer le toast
 * @param {number} duration - Durée d'affichage en millisecondes (0 pour ne pas disparaître automatiquement)
 * @param {string} position - Position du toast (top-right, top-center, top-left, bottom-right, bottom-center, bottom-left)
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