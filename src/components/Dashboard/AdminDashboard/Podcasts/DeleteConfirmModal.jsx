import React, { useState } from 'react';
import styles from './Podcasts.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, podcastId, podcastTitle, onPodcastDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Utiliser l'URL de base de l'API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/${podcastId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la suppression du podcast');
      }

      // Appeler le callback du composant parent
      onPodcastDeleted(podcastId);
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la suppression du podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Confirmer la suppression</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Êtes-vous sûr de vouloir supprimer ce podcast ?</p>
          </div>
          
          <p className={styles.deleteInfo}>
            Vous êtes sur le point de supprimer : <strong>{podcastTitle}</strong>
          </p>
          
          <p className={styles.deletePermanent}>
            Cette action ne peut pas être annulée.
          </p>
          
          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton} 
            onClick={onClose}
            disabled={loading}
          >
            Annuler
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
                <i className="fas fa-trash"></i> Supprimer
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;