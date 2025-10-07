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
  
  // Use base URL passed as prop or default
  const baseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      setError('');
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${livestreamId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to delete LiveThrowback');
      }
      
      // Notify parent of successful deletion
      onLiveStreamDeleted(livestreamId);
    } catch (err) {
      console.error('Error while deleting:', err);
      setError(err.message || 'An error occurred while deleting');
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>Delete LiveThrowback</h3>
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
              Are you sure you want to delete the LiveThrowback 
              <span className={styles.deleteTitleHighlight}>{` "${livestreamTitle}" `}</span>?
            </p>
            
            <p className={styles.deleteWarning}>
              <i className="fas fa-exclamation-triangle"></i> This action is irreversible
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
            <i className="fas fa-times"></i> Cancel
          </button>
          
          <button 
            className={styles.deleteButton}
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <><i className="fas fa-spinner fa-spin"></i> Deleting...</>
            ) : (
              <><i className="fas fa-trash-alt"></i> Delete</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
