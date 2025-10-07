import React from 'react';
import styles from './Likes.module.css';

export default function BulkActionsBar({ count, onCancel, onDelete }) {
  return (
    <div className={styles.bulkBar}>
      <div className={styles.bulkInfo}>
        <i className="fas fa-check-square" /> {count} selected item{count > 1 ? 's' : ''}
      </div>
      <div className={styles.bulkActions}>
        <button className={styles.btnDanger} onClick={onDelete}>
          <i className="fas fa-trash" /> Bulk delete
        </button>
        <button className={styles.btnGhost} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
}
