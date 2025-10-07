import React, { useEffect, useState } from 'react';
import styles from './Likes.module.css';

export default function LikesFilters({ filters, onFilterChange, totalLikes }) {
  const [searchTerm, setSearchTerm] = useState(filters.search || '');

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm, page: 1 });
      }
    }, 450);
    return () => clearTimeout(t);
    // eslint-disable-next-line
  }, [searchTerm]);

  const reset = () => {
    setSearchTerm('');
    onFilterChange({
      page: 1,
      limit: filters.limit || 20,
      search: '',
      userId: '',
      type: 'all',
      targetId: '',
      dateFrom: '',
      dateTo: '',
      action: 'all',
      sortBy: 'recent'
    });
  };

  return (
    <div className={styles.filters}>
      <input
        className={styles.input}
        type="text"
        placeholder="Search (video title, post/comment content, user name/email, type/action)…"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      <select
        className={styles.select}
        value={filters.type}
        onChange={(e) => onFilterChange({ type: e.target.value, page: 1 })}
      >
        <option value="all">All types</option>
        <option value="video">Videos</option>
        {/* <option value="post">Posts</option> */}
        <option value="comment">Comments</option>
        {/* <option value="memory">Memories</option> */}
        {/* <option value="playlist">Playlists</option> */}
        {/* <option value="podcast">Podcasts</option> */}
      </select>

      <select
        className={styles.select}
        value={filters.action}
        onChange={(e) => onFilterChange({ action: e.target.value, page: 1 })}
      >
        <option value="all">All actions</option>
        <option value="like">Likes</option>
        <option value="dislike">Dislikes</option>
      </select>

      <select
        className={styles.select}
        value={filters.sortBy}
        onChange={(e) => onFilterChange({ sortBy: e.target.value, page: 1 })}
      >
        <option value="recent">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="most_active">Activity (type/target)</option>
      </select>

      <button className={styles.btnIcon_details} onClick={reset}>
        <i className="fas fa-undo" /> Reset
      </button>

      <button
        className={styles.btnPrimary}
        onClick={() => onFilterChange({ page: 1 })}
        title="Refresh search"
      >
        <i className="fas fa-sync-alt" /> Refresh
      </button>

      <div style={{ gridColumn: '1 / -1', color: '#6c757d', fontSize: 14 }}>
        <i className="fas fa-heart" /> <strong>{totalLikes || 0}</strong> result{(totalLikes || 0) > 1 ? 's' : ''}
      </div>
    </div>
  );
}
