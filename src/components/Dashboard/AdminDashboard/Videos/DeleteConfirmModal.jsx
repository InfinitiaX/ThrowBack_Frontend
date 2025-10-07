// src/components/admin/Videos/DeleteConfirmModal.jsx
import React, { useState } from 'react';
import api from '../../../../utils/api'; 
import styles from './Videos.module.css';

const DeleteConfirmModal = ({ isOpen, onClose, videoId, videoTitle, onVideoDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  // On couvre les différents montages possibles des routes
  const endpoints = [
    `/api/admin/videos/${videoId}`,            // 1) route admin classique
    `/api/videos/admin/videos/${videoId}`,     // 2) route admin sous /api/videos
    `/api/videos/${videoId}`                   // 3) fallback (protégée)
  ];

  const handleDelete = async () => {
    setLoading(true);
    setError('');
    try {
      let lastErr;

      for (const url of endpoints) {
        try {
          const res = await api.delete(url);
          // Axios lève déjà pour 4xx/5xx. Si on est là, c'est 2xx
          if (res?.status >= 200 && res?.status < 300 && res.data?.success !== false) {
            // Informer le parent pour retirer la carte, puis fermer
            onVideoDeleted?.(videoId);
            onClose?.();
            return;
          }
          lastErr = res?.data?.message || `Request failed: ${url}`;
        } catch (e) {
          const status = e?.response?.status;
          // 404/405 => on tente l'endpoint suivant
          if (status === 404 || status === 405) { lastErr = `Endpoint not found: ${url}`; continue; }
          if (status === 401) { lastErr = 'You are not authenticated.'; break; }
          if (status === 403) { lastErr = "You don't have permission to delete this video."; break; }
          lastErr = e?.response?.data?.message || e.message || `Failed at ${url}`;
          // On arrête si c'est une vraie erreur d'authz/authn
          if (status && status >= 400 && status < 500) break;
          // Sinon on tente la suivante
        }
      }

      throw new Error(lastErr || 'Failed to delete the video.');
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
          <button className={styles.closeButton} onClick={onClose} aria-label="Close">
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

          <p className={styles.deletePermanent}>This action cannot be undone.</p>

          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i> {error}
            </div>
          )}
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button className={styles.deleteButton} onClick={handleDelete} disabled={loading}>
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
