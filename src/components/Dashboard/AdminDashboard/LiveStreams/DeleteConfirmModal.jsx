// components/LiveThrowback/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const DeleteConfirmModal = ({ 
  isOpen, 
  onClose, 
  livestreamId, 
  livestreamTitle, 
  onLiveStreamDeleted,
  apiBaseUrl 
}) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  
  // Utiliser l'URL de base passée en prop ou l'URL par défaut
  const baseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${livestreamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la suppression du LiveThrowback');
      }
      
      // Notifier le parent de la suppression réussie
      onLiveStreamDeleted(livestreamId);
    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      setError(err.message || 'Une erreur est survenue lors de la suppression');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Supprimer le LiveThrowback</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={isDeleting}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.deleteConfirmation}>
            <div className={styles.deleteIcon}>
              <i className="fas fa-trash-alt"></i>
            </div>
            
            <p className={styles.deleteMessage}>
              Êtes-vous sûr de vouloir supprimer le LiveThrowback 
              <span className={styles.deleteTitleHighlight}>{` "${livestreamTitle}" `}</span>?
            </p>
            
            <p className={styles.deleteWarning}>
              <i className="fas fa-exclamation-triangle"></i> Cette action est irréversible
            </p>
          </div>
          
          {error && (
            <div className={styles.deleteError}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={isDeleting}
          >
            <i className="fas fa-times"></i> Annuler
          </button>
          
          <button 
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <><i className="fas fa-spinner fa-spin"></i> Suppression...</>
            ) : (
              <><i className="fas fa-trash-alt"></i> Supprimer</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;