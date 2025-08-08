import React from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, activeFilters, videoCount = 0 }) => {
  // Types de vidéos disponibles
  const types = ['Tous types', 'Music', 'Short', 'Podcast'];
  
  // Genres musicaux disponibles 
  const genres = [
    'Tous genres', 'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 'Electronic', 
    'Dance', 'House', 'Techno', 'Country', 'Folk', 'Classical', 'Opera', 'Reggae', 'Latin', 
    'World', 'Afro', 'Alternative', 'Indie', 'Metal', 'Punk', 'Gospel', 'Funk', 'Disco', 
    'Ska', 'Salsa', 'Bachata', 'Merengue', 'Tango'
  ];
  
  // Décennies disponibles
  const decades = ['Toutes décennies', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
  
  // Gestionnaire de changement pour les select
  const handleSelectChange = (e, filterType) => {
    const value = e.target.value;
    const newFilters = { ...activeFilters };
    
    if (filterType === 'type') {
      newFilters.type = value === 'Tous types' ? 'all' : value.toLowerCase();
    } else if (filterType === 'genre') {
      newFilters.genre = value === 'Tous genres' ? 'all' : value;
    } else if (filterType === 'decade') {
      newFilters.decade = value === 'Toutes décennies' ? 'all' : value;
    }
    
    onFilterChange(newFilters);
  };
  
  // Fonction pour obtenir la valeur actuelle du select
  const getCurrentValue = (filterType) => {
    if (filterType === 'type') {
      if (activeFilters.type === 'all') return 'Tous types';
      return activeFilters.type.charAt(0).toUpperCase() + activeFilters.type.slice(1);
    } else if (filterType === 'genre') {
      return activeFilters.genre === 'all' ? 'Tous genres' : activeFilters.genre;
    } else if (filterType === 'decade') {
      return activeFilters.decade === 'all' ? 'Toutes décennies' : activeFilters.decade;
    }
    return '';
  };
  
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.filtersContent}>
        <div className={styles.filterGroup}>
          <label htmlFor="type-select" className={styles.filterLabel}>Type:</label>
          <div className={styles.selectWrapper}>
            <select
              id="type-select"
              className={styles.filterSelect}
              value={getCurrentValue('type')}
              onChange={(e) => handleSelectChange(e, 'type')}
            >
              {types.map((type) => (
                <option key={`type-${type}`} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="genre-select" className={styles.filterLabel}>Genre:</label>
          <div className={styles.selectWrapper}>
            <select
              id="genre-select"
              className={styles.filterSelect}
              value={getCurrentValue('genre')}
              onChange={(e) => handleSelectChange(e, 'genre')}
            >
              {genres.map((genre) => (
                <option key={`genre-${genre}`} value={genre}>
                  {genre}
                </option>
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
              {decades.map((decade) => (
                <option key={`decade-${decade}`} value={decade}>
                  {decade}
                </option>
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