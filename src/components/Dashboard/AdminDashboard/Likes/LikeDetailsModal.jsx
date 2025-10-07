import React from 'react';
import styles from './Likes.module.css';

export default function LikeDetailsModal({ like, onClose }) {
  if (!like) return null;

  const title =
    like.type_entite === 'VIDEO'    ? (like.target?.titre || like.entite_id) :
    like.type_entite === 'POST'     ? (like.target?.contenu || like.entite_id) :
    like.type_entite === 'COMMENT'  ? (like.target?.contenu || like.entite_id) :
    like.type_entite === 'MEMORY'   ? (like.target?.contenu || like.entite_id) :
    like.type_entite === 'PLAYLIST' ? (like.target?.nom || like.entite_id) :
    like.type_entite === 'PODCAST'  ? (like.target?.title || like.entite_id) :
    like.entite_id;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Like details</h3>
          <button className={styles.close} onClick={onClose} aria-label="Close">×</button>
        </div>

        <div className={styles.modalBody}>
          <div className={styles.detailRow}>
            <div className={styles.detailKey}>Type</div>
            <div className={styles.detailVal}>{like.type_entite}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailKey}>Action</div>
            <div className={styles.detailVal}>{like.type_action}</div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailKey}>User</div>
            <div className={styles.detailVal}>
              {like.utilisateur ? `${like.utilisateur.prenom || ''} ${like.utilisateur.nom || ''}`.trim() || like.utilisateur.email : '—'}
            </div>
          </div>
          <div className={styles.detailRow}>
            <div className={styles.detailKey}>Date</div>
            <div className={styles.detailVal}>{like.creation_date ? new Date(like.creation_date).toLocaleString() : '—'}</div>
          </div>

          <div className={styles.detailBlock}>
            <div className={styles.detailTitle}>Target</div>
            <p className={styles.entityExcerpt}>{title}</p>
          </div>
        </div>

        <div className={styles.modalFooter}>
          <button className={styles.btnIcon_details} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
