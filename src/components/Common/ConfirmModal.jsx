// components/Common/ConfirmModal.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import styles from './ConfirmModal.module.css';

/**
 * Composant Modal de confirmation pour les actions importantes
 * 
 * @param {boolean} isOpen - Indique si le modal est ouvert
 * @param {string} title - Titre du modal
 * @param {string} message - Message de confirmation
 * @param {string} confirmText - Texte du bouton de confirmation
 * @param {string} cancelText - Texte du bouton d'annulation
 * @param {Function} onConfirm - Fonction à appeler lors de la confirmation
 * @param {Function} onCancel - Fonction à appeler lors de l'annulation
 * @param {boolean} isDangerous - Indique si l'action est dangereuse (style rouge)
 */
const ConfirmModal = ({ 
  isOpen, 
  title, 
  message, 
  confirmText = 'Confirmer', 
  cancelText = 'Annuler', 
  onConfirm, 
  onCancel,
  isDangerous = false
}) => {
  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;
  
  // Fermer le modal lorsque l'utilisateur clique en dehors
  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };
  
  // Empêcher la propagation des clics dans le contenu du modal
  const handleContentClick = (e) => {
    e.stopPropagation();
  };
  
  return (
    <div 
      className={styles.modalOverlay} 
      onClick={handleOverlayClick}
    >
      <div 
        className={styles.modalContent}
        onClick={handleContentClick}
      >
        <div className={styles.modalHeader}>
          <h2 className={`${styles.modalTitle} ${isDangerous ? styles.dangerTitle : ''}`}>
            {isDangerous && (
              <FontAwesomeIcon 
                icon={faExclamationTriangle} 
                className={styles.warningIcon} 
              />
            )}
            {title}
          </h2>
          <button 
            className={styles.closeButton}
            onClick={onCancel}
            aria-label="Fermer"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <p className={styles.message}>{message}</p>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onCancel}
          >
            {cancelText}
          </button>
          
          <button 
            className={`${styles.confirmButton} ${isDangerous ? styles.dangerButton : ''}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;