import React, { useState } from 'react';
import styles from './Podcasts.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, podcastId, podcastTitle, onPodcastDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Use API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/${podcastId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to delete podcast');
      }

      // Call parent callback
      onPodcastDeleted(podcastId);
    } catch (err) {
      setError(err.message);
      console.error('Error while deleting podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Confirm Deletion</h2>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Are you sure you want to delete this podcast?</p>
          </div>
          
          <p className={styles.deleteInfo}>
            You are about to delete: <strong>{podcastTitle}</strong>
          </p>
          
          <p className={styles.deletePermanent}>
            This action cannot be undone.
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
            Cancel
          </button>
          <button 
            className={styles.deleteButton} 
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Deleting...
              </>
            ) : (
              <>
                <i className="fas fa-trash"></i> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
