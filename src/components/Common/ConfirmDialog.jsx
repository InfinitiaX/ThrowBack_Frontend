// components/Common/ConfirmDialog.jsx
import React from 'react';
import styles from './ConfirmDialog.module.css';

const ConfirmDialog = ({ isOpen, message, onConfirm, onCancel, confirmText = 'Confirmer', cancelText = 'Annuler' }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.dialog}>
        <div className={styles.message}>{message}</div>
        <div className={styles.buttons}>
          <button 
            onClick={onCancel} 
            className={styles.cancelButton}
          >
            {cancelText}
          </button>
          <button 
            onClick={onConfirm} 
            className={styles.confirmButton}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDialog;