// components/LiveThrowback/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, livestreamId, livestreamTitle, onLiveStreamDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/livestreams/${livestreamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Échec de la suppression du livestream');
      }
      
      // Notifier le composant parent
      onLiveStreamDeleted(livestreamId);
      
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Confirmer la suppression</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <div className={styles.warningIcon}>
              <i className="fas fa-exclamation-triangle"></i>
            </div>
            <div className={styles.warningText}>
              <p>Êtes-vous sûr de vouloir supprimer le direct <strong>"{livestreamTitle}"</strong> ?</p>
              <p className={styles.warningDetails}>Cette action est irréversible et supprimera définitivement ce direct.</p>
            </div>
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i>
              <span>{error}</span>
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i> Annuler
          </button>
          
          <button 
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Suppression...
              </>
            ) : (
              <>
                <i className="fas fa-trash-alt"></i> Confirmer la suppression
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;