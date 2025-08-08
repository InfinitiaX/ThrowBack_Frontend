import React from 'react';
import styles from './VideoFilters.module.css';

const VideoFilters = ({ onFilterChange, currentFilters, availableFilters }) => {
  // Options de tri disponibles
  const sortOptions = [
    { value: 'recent', label: 'Plus récents' },
    { value: 'popular', label: 'Plus populaires' },
    { value: 'mostLiked', label: 'Plus aimés' },
    { value: 'oldest', label: 'Plus anciens' },
    { value: 'alphabetical', label: 'A-Z' }
  ];
  
  // Utiliser les filtres disponibles de l'API ou des valeurs par défaut
  const genres = availableFilters?.availableGenres || [
    'Rock', 'Pop', 'Hip-Hop', 'Rap', 'R&B', 'Jazz', 'Blues', 
    'Electronic', 'Country', 'Folk', 'Classical', 'Reggae'
  ];
  
  const decades = availableFilters?.availableDecades || [
    '60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'
  ];
  
  // Gestionnaire de changement de filtre
  const handleFilterChange = (name, value) => {
    onFilterChange({ ...currentFilters, [name]: value });
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    onFilterChange({
      genre: 'all',
      decade: 'all',
      sortBy: 'recent'
    });
  };
  
  return (
    <div className={styles.filtersContainer}>
      <div className={styles.horizontalFilters}>
        {/* Filtre par genre */}
        <div className={styles.filterGroup}>
          <select 
            value={currentFilters.genre} 
            onChange={(e) => handleFilterChange('genre', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Tous les genres</option>
            {genres.map(genre => (
              <option key={genre} value={genre}>{genre}</option>
            ))}
          </select>
        </div>
        
        {/* Filtre par décennie */}
        <div className={styles.filterGroup}>
          <select 
            value={currentFilters.decade} 
            onChange={(e) => handleFilterChange('decade', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">Toutes les décennies</option>
            {decades.map(decade => (
              <option key={decade} value={decade}>{decade}</option>
            ))}
          </select>
        </div>
        
        {/* Filtre de tri */}
        <div className={styles.filterGroup}>
          <select 
            value={currentFilters.sortBy} 
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            {sortOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Bouton de réinitialisation */}
        <button 
          onClick={resetFilters}
          className={styles.resetButton}
        >
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default VideoFilters;