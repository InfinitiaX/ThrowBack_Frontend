import React, { useState, useEffect } from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, activeFilters, videoCount = 0 }) => {
  // États locaux pour suivre les changements avant de les soumettre
  const [localFilters, setLocalFilters] = useState({
    genre: activeFilters.genre === 'all' ? 'All genres' : activeFilters.genre,
    decade: activeFilters.decade === 'all' ? 'All decades' : activeFilters.decade,
    sortBy: activeFilters.sortBy || 'Newest'
  });
  
  // Synchroniser les filtres locaux quand les props changent
  useEffect(() => {
    setLocalFilters({
      genre: activeFilters.genre === 'all' ? 'All genres' : activeFilters.genre,
      decade: activeFilters.decade === 'all' ? 'All decades' : activeFilters.decade,
      sortBy: activeFilters.sortBy || 'Newest'
    });
  }, [activeFilters]);

  // Available music genres specific to music
  const genres = [
    'All genres', 'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 'Electronic', 
    'Dance', 'House', 'Techno', 'Country', 'Folk', 'Classical', 'Opera', 'Reggae', 'Latin', 
    'World', 'Afro', 'Alternative', 'Indie', 'Metal', 'Punk', 'Gospel', 'Funk', 'Disco', 
    'Ska', 'Salsa', 'Bachata', 'Merengue', 'Tango'
  ];
  
  // Available decades
  const decades = ['All decades', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
  
  // Sort options for music videos
  const sortOptions = ['Newest', 'Most popular', 'Most liked'];
  
  // Change handler for selects
  const handleSelectChange = (e, filterType) => {
    const value = e.target.value;
    const newLocalFilters = { ...localFilters };
    
    if (filterType === 'genre') {
      newLocalFilters.genre = value;
    } else if (filterType === 'decade') {
      newLocalFilters.decade = value;
    } else if (filterType === 'sortBy') {
      newLocalFilters.sortBy = value;
    }
    
    setLocalFilters(newLocalFilters);
    
    // Convertir les valeurs pour le parent
    const parentFilters = { ...activeFilters };
    
    if (filterType === 'genre') {
      parentFilters.genre = value === 'All genres' ? 'all' : value;
    } else if (filterType === 'decade') {
      parentFilters.decade = value === 'All decades' ? 'all' : value;
    } else if (filterType === 'sortBy') {
      parentFilters.sortBy = value;
    }
    
    onFilterChange(parentFilters);
  };
  
  // Fonction pour réinitialiser tous les filtres
  const resetAllFilters = () => {
    const defaultFilters = {
      genre: 'All genres',
      decade: 'All decades',
      sortBy: 'Newest'
    };
    
    setLocalFilters(defaultFilters);
    
    // Convertir pour le parent
    onFilterChange({
      genre: 'all',
      decade: 'all',
      sortBy: 'Newest'
    });
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
              value={localFilters.genre}
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
              value={localFilters.decade}
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
        
        <div className={styles.filterGroup}>
          <label htmlFor="sort-select" className={styles.filterLabel}>Sort by:</label>
          <div className={styles.selectWrapper}>
            <select
              id="sort-select"
              className={styles.filterSelect}
              value={localFilters.sortBy}
              onChange={(e) => handleSelectChange(e, 'sortBy')}
            >
              {sortOptions.map((option) => (
                <option key={`sort-${option}`} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className={styles.videoCount}>
          <span>{videoCount} videos found</span>
          {(localFilters.genre !== 'All genres' || 
            localFilters.decade !== 'All decades' || 
            localFilters.sortBy !== 'Newest') && (
            <button 
              className={styles.resetButton} 
              onClick={resetAllFilters}
              title="Reset all filters"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;