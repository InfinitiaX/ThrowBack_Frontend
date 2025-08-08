import React from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, activeFilters }) => {
  // Décennies disponibles
  const decades = ['Toutes', '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];
  
  // Genres musicaux disponibles - regroupés par catégories pour une meilleure organisation
  const genresLine1 = ['Tous', 'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues'];
  const genresLine2 = ['Electronic', 'Dance', 'House', 'Techno', 'Country', 'Folk', 'Classical', 'Opera'];
  const genresLine3 = ['Reggae', 'Reggaeton', 'Latin', 'World', 'Alternative', 'Indie', 'Metal', 'Punk'];
  
  // Options de tri
  const sortOptions = ['Plus récents', 'Plus populaires', 'Plus aimés'];
  
  const handleFilterClick = (filterType, value) => {
    const newFilters = { ...activeFilters };
    
    // Si on clique sur la même valeur déjà active, on revient à "Tous"
    if (filterType === 'decade') {
      newFilters.decade = value === activeFilters.decade ? 'Toutes' : value;
    } else if (filterType === 'genre') {
      newFilters.genre = value === activeFilters.genre ? 'Tous' : value;
    } else if (filterType === 'sort') {
      newFilters.sortBy = value;
    }
    
    onFilterChange(newFilters);
  };
  
  return (
    <div className={styles.filtersContainer}>
      {/* Filtres par décennie */}
      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {decades.map((decade) => (
            <button
              key={`decade-${decade}`}
              className={`${styles.filterChip} ${activeFilters.decade === decade ? styles.active : ''}`}
              onClick={() => handleFilterClick('decade', decade)}
            >
              {decade}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filtres par genre - Ligne 1 */}
      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {genresLine1.map((genre) => (
            <button
              key={`genre-${genre}`}
              className={`${styles.filterChip} ${activeFilters.genre === genre ? styles.active : ''}`}
              onClick={() => handleFilterClick('genre', genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filtres par genre - Ligne 2 */}
      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {genresLine2.map((genre) => (
            <button
              key={`genre-${genre}`}
              className={`${styles.filterChip} ${activeFilters.genre === genre ? styles.active : ''}`}
              onClick={() => handleFilterClick('genre', genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      {/* Filtres par genre - Ligne 3 */}
      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {genresLine3.map((genre) => (
            <button
              key={`genre-${genre}`}
              className={`${styles.filterChip} ${activeFilters.genre === genre ? styles.active : ''}`}
              onClick={() => handleFilterClick('genre', genre)}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>
      
      {/* Options de tri */}
      <div className={styles.filterSection}>
        <div className={styles.filterChips}>
          {sortOptions.map((option) => (
            <button
              key={`sort-${option}`}
              className={`${styles.filterChip} ${activeFilters.sortBy === option ? styles.active : ''}`}
              onClick={() => handleFilterClick('sort', option)}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;