// components/Dashboard/AdminDashboard/Comments/CommentFilters.jsx
import React, { useState, useEffect } from 'react';
import styles from './CommentFilters.module.css';

const CommentFilters = ({ filters, onFilterChange, totalComments }) => {
  const [searchTerm, setSearchTerm] = useState(filters.search);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Debounce for search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm !== filters.search) {
        onFilterChange({ search: searchTerm });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset filters
  const resetFilters = () => {
    setSearchTerm('');
    onFilterChange({
      search: '',
      status: 'all',
      type: 'all',
      sortBy: 'recent',
      reported: 'all',
      page: 1
    });
  };

  // Count active filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.status !== 'all') count++;
    if (filters.type !== 'all') count++;
    if (filters.reported !== 'all') count++;
    if (filters.sortBy !== 'recent') count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className={styles.filtersContainer}>
      {/* Search bar and main actions */}
      <div className={styles.mainFilters}>
        <div className={styles.searchContainer}>
          <div className={styles.searchInput}>
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search comments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className={styles.clearSearch}
                onClick={() => setSearchTerm('')}
              >
                <i className="fas fa-times"></i>
              </button>
            )}
          </div>
        </div>

        <div className={styles.quickFilters}>
          {/* Filter by status */}
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ status: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All statuses</option>
            <option value="ACTIF">Active</option>
            <option value="MODERE">Moderated</option>
            <option value="SUPPRIME">Deleted</option>
            {/* <option value="SIGNALE">Reported</option> */}
          </select>

          {/* Filter by type */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="all">All types</option>
            <option value="video">Video comments</option>
            <option value="post">Post comments</option>
          </select>

          {/* Sort */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value })}
            className={styles.filterSelect}
          >
            <option value="recent">Most recent</option>
            <option value="oldest">Oldest</option>
            <option value="most_liked">Most liked</option>
            {/* <option value="most_reported">Most reported</option> */}
          </select>
        </div>

        <div className={styles.filterActions}>
          {/* Advanced filters button */}
          <button
            className={`${styles.advancedBtn} ${showAdvanced ? styles.active : ''}`}
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <i className="fas fa-filter"></i>
            Advanced filters
            {activeFiltersCount > 0 && (
              <span className={styles.filterBadge}>{activeFiltersCount}</span>
            )}
          </button>

          {/* Reset button */}
          {activeFiltersCount > 0 && (
            <button
              className={styles.resetBtn}
              onClick={resetFilters}
              title="Reset all filters"
            >
              <i className="fas fa-undo"></i>
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Advanced filters */}
      {showAdvanced && (
        <div className={styles.advancedFilters}>
          <div className={styles.advancedRow}>
            <div className={styles.filterGroup}>
              <label>Items per page</label>
              <select
                value={filters.limit}
                onChange={(e) => onFilterChange({ limit: parseInt(e.target.value) })}
                className={styles.filterSelect}
              >
                <option value="10">10 per page</option>
                <option value="20">20 per page</option>
                <option value="50">50 per page</option>
                <option value="100">100 per page</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Results info */}
      <div className={styles.filtersInfo}>
        <div className={styles.resultsCount}>
          <i className="fas fa-comments"></i>
          {totalComments} comment{totalComments > 1 ? 's' : ''} found
          {activeFiltersCount > 0 && (
            <span className={styles.filtered}>
              (with {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''})
            </span>
          )}
        </div>

        {/* Active filters */}
        {activeFiltersCount > 0 && (
          <div className={styles.activeFilters}>
            {filters.search && (
              <span className={styles.activeFilter}>
                <i className="fas fa-search"></i>
                "{filters.search}"
                <button onClick={() => onFilterChange({ search: '' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {filters.status !== 'all' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-check-circle"></i>
                Status: {filters.status}
                <button onClick={() => onFilterChange({ status: 'all' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {filters.type !== 'all' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-tag"></i>
                Type: {filters.type}
                <button onClick={() => onFilterChange({ type: 'all' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
            
            {filters.sortBy !== 'recent' && (
              <span className={styles.activeFilter}>
                <i className="fas fa-sort"></i>
                Sort: {filters.sortBy}
                <button onClick={() => onFilterChange({ sortBy: 'recent' })}>
                  <i className="fas fa-times"></i>
                </button>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Quick suggestions */}
      <div className={styles.quickSuggestions}>
        <span className={styles.suggestionsLabel}>Quick filters:</span>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ status: 'MODERE' })}
        >
          <i className="fas fa-eye-slash"></i>
          Pending moderation
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ sortBy: 'most_liked', status: 'ACTIF' })}
        >
          <i className="fas fa-thumbs-up"></i>
          Most popular
        </button>
        <button
          className={styles.suggestionBtn}
          onClick={() => onFilterChange({ type: 'video', sortBy: 'recent' })}
        >
          <i className="fas fa-video"></i>
          Recent video comments
        </button>
      </div>
    </div>
  );
};

export default CommentFilters;
