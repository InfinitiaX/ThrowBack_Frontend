// ConfirmDialog (styled + English)
import React, { useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';

const ConfirmDialog = ({
  open,
  title = 'Delete',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  const cardRef = useRef(null);
  const confirmBtnRef = useRef(null);

  // Close on ESC + focus confirm by default
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    document.addEventListener('keydown', onKey);
    // small delay to ensure render is done before focusing
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, onConfirm]);

  // Close when clicking outside the card
  const handleOverlayClick = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) onCancel?.();
  };

  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={handleOverlayClick}>
      <div className={styles.modalCard} ref={cardRef} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4>{title}</h4>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancel} onClick={onCancel}>{cancelText}</button>
          <button className={styles.modalConfirm} onClick={onConfirm} ref={confirmBtnRef}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;
