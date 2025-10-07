import React from 'react';
import styles from './Likes.module.css';

export default function LikesTable({
  rows,
  loading,
  pagination,
  selected,
  onToggleRow,
  onToggleAll,
  onOpenDetails,
  onDelete,
  onPageChange,
  onSortChange
}) {
  const typeIcon = (t) =>
    t === 'VIDEO'    ? 'fas fa-play-circle' :
    t === 'POST'     ? 'fas fa-file-alt'   :
    t === 'COMMENT'  ? 'fas fa-comment'    :
    t === 'MEMORY'   ? 'fas fa-heart'      :
    t === 'PLAYLIST' ? 'fas fa-list'       :
    t === 'PODCAST'  ? 'fas fa-podcast'    :
                       'fas fa-question-circle';

  const actionIcon = (a) => (a === 'LIKE' ? 'fas fa-thumbs-up' : 'fas fa-thumbs-down');

  const renderTarget = (r) => {
    switch (r.type_entite) {
      case 'VIDEO':    return r.target?.titre || r.entite_id;
      case 'POST':     return r.target?.contenu || r.entite_id;
      case 'COMMENT':  return r.target?.contenu || r.entite_id;
      case 'MEMORY':   return r.target?.contenu || r.entite_id;
      case 'PLAYLIST': return r.target?.nom || r.entite_id;
      case 'PODCAST':  return r.target?.title || r.entite_id;
      default:         return r.entite_id;
    }
  };

  return (
    <div className={styles.tableWrap}>
      <div className={styles.tableToolbar}>
        <div className={styles.tableTitle}>Results</div>
        <div className={styles.tableActions}>
          <label className={styles.sortLabel}>Sort:</label>
          <select
            className={styles.select}
            value={pagination?.sortBy || 'recent'}
            onChange={(e) => onSortChange(e.target.value)}
          >
            <option value="recent">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="most_active">Activity (type/target)</option>
          </select>
        </div>
      </div>

      <div className={styles.table}>
        {/* Header */}
        <div className={`${styles.tr} ${styles.th}`}>
          <div className={styles.td}>
            <input
              type="checkbox"
              checked={rows?.length > 0 && selected?.length === rows.length}
              onChange={onToggleAll}
            />
          </div>
          <div className={styles.td}>Type</div>
          <div className={styles.td}>Action</div>
          <div className={styles.td}>Target</div>
          <div className={styles.td}>User</div>
          <div className={styles.td}>Date</div>
          <div className={styles.td}>Actions</div>
        </div>

        {/* Body */}
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            Loading…
          </div>
        ) : !rows || rows.length === 0 ? (
          <div className={styles.empty}>
            <i className="fas fa-inbox" />
            No likes found
          </div>
        ) : (
          rows.map((r) => (
            <div key={r._id} className={styles.tr}>
              <div className={styles.td}>
                <input
                  type="checkbox"
                  checked={selected?.includes(r._id)}
                  onChange={() => onToggleRow(r._id)}
                />
              </div>

              <div className={styles.td}>
                <span className={styles.tag}>
                  <i className={typeIcon(r.type_entite)} /> {r.type_entite}
                </span>
              </div>

              <div className={styles.td}>
                <span className={r.type_action === 'LIKE' ? styles.like : styles.dislike}>
                  <i className={actionIcon(r.type_action)} /> {r.type_action}
                </span>
              </div>

              <div className={`${styles.td} ${styles.ellipsis}`}>
                {renderTarget(r)}
              </div>

              <div className={styles.td}>
                {r.utilisateur
                  ? `${r.utilisateur.prenom || ''} ${r.utilisateur.nom || ''}`.trim() || r.utilisateur.email
                  : '-'}
              </div>

              <div className={styles.td}>
                {r.creation_date ? new Date(r.creation_date).toLocaleString() : '-'}
              </div>

              <div className={styles.td}>
                <button
                  className={styles.btnIcon_details}
                  onClick={() => onOpenDetails(r)}
                  title="Details"
                  aria-label="Details"
                >
                  <i className="fas fa-eye" />
                </button>
                <button
                  className={styles.btnIcon_delete}
                  onClick={() => onDelete(r._id)}
                  title="Delete"
                  aria-label="Delete"
                >
                  <i className="fas fa-trash" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination?.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
          >
            ←
          </button>
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
          >
            →
          </button>
        </div>
      )}
    </div>
  );
}
