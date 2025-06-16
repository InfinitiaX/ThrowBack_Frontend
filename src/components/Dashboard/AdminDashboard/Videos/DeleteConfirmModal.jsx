// src/components/admin/Videos/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import styles from './Videos.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, videoId, videoTitle, onVideoDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete video');
      }

      // Call the parent component's callback
      onVideoDeleted(videoId);
    } catch (err) {
      setError(err.message);
      console.error('Error deleting video:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Confirm Delete</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.deleteWarning}>
            <i className="fas fa-exclamation-triangle"></i>
            <p>Are you sure you want to delete this video?</p>
          </div>
          
          <p className={styles.deleteInfo}>
            You are about to delete: <strong>{videoTitle}</strong>
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