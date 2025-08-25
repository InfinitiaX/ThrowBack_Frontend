// src/components/admin/Videos/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import styles from './Videos.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, videoId, videoTitle, onVideoDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const tryDelete = async (url, token) => {
    const res = await fetch(url, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return res;
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('You are not authenticated.');
      }

      const urls = [
        `/api/admin/videos/${videoId}`,           // 1) admin mount directe
        `/api/videos/admin/videos/${videoId}`,    // 2) admin monté sous /api/videos
        `/api/videos/${videoId}`                  // 3) fallback générique (protégé)
      ];

      let success = false;
      let lastError = null;

      for (const url of urls) {
        try {
          const response = await tryDelete(url, token);
          if (response.ok) {
            success = true;
            break;
          } else if (response.status === 404) {
            // On essaie l'URL suivante si 404 (mauvaise route)
            lastError = `Endpoint not found: ${url}`;
            continue;
          } else {
            const data = await response.json().catch(() => ({}));
            lastError = data?.message || `Failed at ${url}`;
          }
        } catch (e) {
          lastError = e.message;
        }
      }

      if (!success) {
        throw new Error(lastError || 'Failed to delete video');
      }

      // Succès : informer le parent pour retirer la vidéo de la liste + fermer
      onVideoDeleted?.(videoId);
      onClose?.();
    } catch (err) {
      setError(err.message || 'Delete failed');
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
