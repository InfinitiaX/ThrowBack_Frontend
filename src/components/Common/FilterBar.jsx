// src/components/common/FilterBar.jsx
import React, { useState, useEffect } from 'react';
import styles from './FilterBar.module.css';

const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 
  'Electronic', 'Dance', 'House', 'Techno', 'Country', 'Folk', 
  'Classical', 'Opera', 'Reggae', 'Reggaeton', 'Latin', 'World', 
  'Alternative', 'Indie', 'Metal', 'Punk', 'Funk', 'Disco', 
  'Gospel', 'Soundtrack', 'Other'
];

const DECADES = ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];

const SORT_OPTIONS = [
  { value: 'recent', label: 'Plus récent' },
  { value: 'popular', label: 'Plus populaire' },
  { value: 'mostLiked', label: 'Plus aimé' },
  { value: 'alphabetical', label: 'Alphabétique' },
  { value: 'oldest', label: 'Plus ancien' }
];

const FilterBar = ({ filters, onFilterChange, loading }) => {
  const [searchInput, setSearchInput] = useState(filters.search || '');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sync search input with filters
  useEffect(() => {
    setSearchInput(filters.search || '');
  }, [filters.search]);

  // Handle search form submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      search: searchInput.trim()
    });
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  // Reset all filters
  const resetFilters = () => {
    const resetFilters = {
      type: 'all',
      genre: 'all',
      decade: 'all',
      search: '',
      sortBy: 'recent'
    };
    setSearchInput('');
    onFilterChange(resetFilters);
  };

  // Check if any filters are active
  const hasActiveFilters = filters.type !== 'all' || 
                          filters.genre !== 'all' || 
                          filters.decade !== 'all' || 
                          filters.search.trim() !== '';

  return (
    <div className={styles.filterBar}>
      <div className={styles.container}>
        {/* Search Form */}
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchInput}>
            <input
              type="text"
              placeholder="Rechercher une vidéo, un artiste..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              disabled={loading}
            />
            <button type="submit" disabled={loading}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>

        {/* Mobile Filter Toggle */}
        <button 
          className={styles.mobileFilterToggle}
          onClick={() => setShowMobileFilters(!showMobileFilters)}
        >
          <i className="fas fa-filter"></i>
          Filters
          {hasActiveFilters && <span className={styles.activeIndicator}></span>}
        </button>

        {/* Filters */}
        <div className={`${styles.filters} ${showMobileFilters ? styles.showMobile : ''}`}>
          {/* Type Filter */}
          <div className={styles.filterGroup}>
            <label>Type</label>
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              disabled={loading}
            >
              <option value="all">All types</option>
              <option value="music">Music</option>
              <option value="podcast">Podcast</option>
              <option value="short">Short</option>
            </select>
          </div>

          {/* Genre Filter */}
          <div className={styles.filterGroup}>
            <label>Gendre</label>
            <select
              value={filters.genre}
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              disabled={loading}
            >
              <option value="all"> All gendres</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>

          {/* Decade Filter */}
          <div className={styles.filterGroup}>
            <label>Decade</label>
            <select
              value={filters.decade}
              onChange={(e) => handleFilterChange('decade', e.target.value)}
              disabled={loading}
            >
              <option value="all">All decades</option>
              {DECADES.map(decade => (
                <option key={decade} value={decade}>{decade}</option>
              ))}
            </select>
          </div>

          {/* Sort Filter */}
          <div className={styles.filterGroup}>
            <label>sort by</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              disabled={loading}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters Button */}
          {hasActiveFilters && (
            <button
              className={styles.resetButton}
              onClick={resetFilters}
              disabled={loading}
            >
              <i className="fas fa-times"></i>
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;