import React from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, activeFilters, videoCount = 0 }) => {
  const genres = [
    'All genres', 'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 'Electronic',
    'Dance', 'House', 'Techno', 'Country', 'Folk', 'Classical', 'Opera', 'Reggae', 'Latin',
    'World', 'Afro', 'Alternative', 'Indie', 'Metal', 'Punk', 'Gospel', 'Funk', 'Disco',
    'Ska', 'Salsa', 'Bachata', 'Merengue', 'Tango'
  ];
  const decades = ['All decades', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
  const sortOptions = ['Newest', 'Most popular', 'Most liked'];

  const handleSelectChange = (e, filterType) => {
    const value = e.target.value;
    const newFilters = { ...activeFilters }; // <— FIX propagation

    if (filterType === 'genre') {
      newFilters.genre = value === 'All genres' ? 'all' : value;
    } else if (filterType === 'decade') {
      newFilters.decade = value === 'All decades' ? 'all' : value;
    } else if (filterType === 'sortBy') {
      newFilters.sortBy = value;
    }

    onFilterChange(newFilters);
  };

  const getCurrentValue = (filterType) => {
    if (filterType === 'genre') {
      return activeFilters.genre === 'all' ? 'All genres' : activeFilters.genre;
    } else if (filterType === 'decade') {
      return activeFilters.decade === 'all' ? 'All decades' : activeFilters.decade;
    } else if (filterType === 'sortBy') {
      return activeFilters.sortBy;
    }
    return '';
  };

  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersContent}>
        <div className={styles.filterGroup}>
          <label htmlFor="genre-select" className={styles.filterLabel}>Genre:</label>
          <div className={styles.selectWrapper}>
            <select
              id="genre-select"
              className={styles.filterSelect}
              value={getCurrentValue('genre')}
              onChange={(e) => handleSelectChange(e, 'genre')}
            >
              {genres.map((g) => (
                <option key={`genre-${g}`} value={g}>{g}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="decade-select" className={styles.filterLabel}>Decade:</label>
          <div className={styles.selectWrapper}>
            <select
              id="decade-select"
              className={styles.filterSelect}
              value={getCurrentValue('decade')}
              onChange={(e) => handleSelectChange(e, 'decade')}
            >
              {decades.map((d) => (
                <option key={`decade-${d}`} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="sort-select" className={styles.filterLabel}>Sort by:</label>
          <div className={styles.selectWrapper}>
            <select
              id="sort-select"
              className={styles.filterSelect}
              value={getCurrentValue('sortBy')}
              onChange={(e) => handleSelectChange(e, 'sortBy')}
            >
              {sortOptions.map((o) => (
                <option key={`sort-${o}`} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.videoCount}>
          <span>{videoCount} videos found</span>
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;
