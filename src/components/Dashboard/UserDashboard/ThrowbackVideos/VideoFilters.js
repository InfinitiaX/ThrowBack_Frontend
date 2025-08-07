import React, { useState, useEffect } from 'react';
import styles from './VideoFilters.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faFilter, 
  faSort, 
  faMusic, 
  faClock,
  faSearch,
  faTimes,
  faChevronDown
} from '@fortawesome/free-solid-svg-icons';

const VideoFilters = ({ onFilterChange, initialFilters, availableFilters }) => {
  const [filters, setFilters] = useState({
    type: initialFilters?.type || 'all',
    genre: initialFilters?.genre || 'all',
    decade: initialFilters?.decade || 'all',
    search: initialFilters?.search || '',
    sortBy: initialFilters?.sortBy || 'recent'
  });
  
  const [expanded, setExpanded] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  
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
  
  const types = availableFilters?.availableTypes || [
    'music', 'short', 'podcast'
  ];
  
  // Mettre à jour les filtres et notifier le parent
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };
  
  // Réinitialiser tous les filtres
  const resetFilters = () => {
    const defaultFilters = {
      type: 'all',
      genre: 'all',
      decade: 'all',
      search: '',
      sortBy: 'recent'
    };
    setFilters(defaultFilters);
    onFilterChange(defaultFilters);
  };
  
  // Gérer la soumission du formulaire de recherche
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    onFilterChange(filters);
  };
  
  return (
    <div className={styles.filtersContainer}>
      {/* Barre de recherche - toujours visible */}
      <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
        <div className={styles.searchInputContainer}>
          <input
            type="text"
            placeholder="Rechercher..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            <FontAwesomeIcon icon={faSearch} />
          </button>
        </div>
        
        <button 
          type="button" 
          className={styles.expandFiltersButton}
          onClick={() => setExpanded(!expanded)}
        >
          <FontAwesomeIcon icon={faFilter} />
          <span>Filtres</span>
          <FontAwesomeIcon 
            icon={faChevronDown} 
            className={expanded ? styles.rotated : ''}
          />
        </button>
        
        <button 
          type="button" 
          className={styles.mobileFiltersButton}
          onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
        >
          <FontAwesomeIcon icon={faFilter} />
        </button>
      </form>
      
      {/* Filtres avancés - extensibles */}
      <div className={`${styles.advancedFilters} ${expanded ? styles.expanded : ''}`}>
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FontAwesomeIcon icon={faMusic} />
              <span>Type</span>
            </label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tous les types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'music' ? 'Musique' : 
                   type === 'short' ? 'Short' : 
                   type === 'podcast' ? 'Podcast' : type}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FontAwesomeIcon icon={faMusic} />
              <span>Genre</span>
            </label>
            <select 
              value={filters.genre} 
              onChange={(e) => handleFilterChange('genre', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Tous les genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FontAwesomeIcon icon={faClock} />
              <span>Décennie</span>
            </label>
            <select 
              value={filters.decade} 
              onChange={(e) => handleFilterChange('decade', e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">Toutes les décennies</option>
              {decades.map(decade => (
                <option key={decade} value={decade}>{decade}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <FontAwesomeIcon icon={faSort} />
              <span>Trier par</span>
            </label>
            <select 
              value={filters.sortBy} 
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
          
          <button 
            type="button" 
            onClick={resetFilters}
            className={styles.resetButton}
          >
            <FontAwesomeIcon icon={faTimes} />
            <span>Réinitialiser</span>
          </button>
        </div>
      </div>
      
      {/* Filtres pour mobile - modal */}
      <div className={`${styles.mobileFiltersModal} ${mobileFiltersOpen ? styles.open : ''}`}>
        <div className={styles.mobileFiltersContent}>
          <div className={styles.mobileHeader}>
            <h3>Filtres</h3>
            <button 
              onClick={() => setMobileFiltersOpen(false)}
              className={styles.closeButton}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          
          <div className={styles.mobileFilterGroup}>
            <label>Type</label>
            <select 
              value={filters.type} 
              onChange={(e) => handleFilterChange('type', e.target.value)}
            >
              <option value="all">Tous les types</option>
              {types.map(type => (
                <option key={type} value={type}>
                  {type === 'music' ? 'Musique' : 
                   type === 'short' ? 'Short' : 
                   type === 'podcast' ? 'Podcast' : type}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.mobileFilterGroup}>
            <label>Genre</label>
            <select 
              value={filters.genre} 
              onChange={(e) => handleFilterChange('genre', e.target.value)}
            >
              <option value="all">Tous les genres</option>
              {genres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.mobileFilterGroup}>
            <label>Décennie</label>
            <select 
              value={filters.decade} 
              onChange={(e) => handleFilterChange('decade', e.target.value)}
            >
              <option value="all">Toutes les décennies</option>
              {decades.map(decade => (
                <option key={decade} value={decade}>{decade}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.mobileFilterGroup}>
            <label>Trier par</label>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            >
              {sortOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.mobileFilterActions}>
            <button 
              onClick={resetFilters}
              className={styles.mobileResetButton}
            >
              Réinitialiser
            </button>
            
            <button 
              onClick={() => {
                onFilterChange(filters);
                setMobileFiltersOpen(false);
              }}
              className={styles.mobileApplyButton}
            >
              Appliquer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoFilters;