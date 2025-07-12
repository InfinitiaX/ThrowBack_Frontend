import React from 'react';
import styles from './SearchFilters.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSort,
  faFilter,
  faMusic,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';

const SearchFilters = ({ activeTab, filters, onFilterChange }) => {
  // Options de tri pour les vidéos
  const videoSortOptions = [
    { value: 'relevance', label: 'Pertinence', icon: faSort },
    { value: 'views', label: 'Vues', icon: faSort },
    { value: 'newest', label: 'Plus récentes', icon: faSort },
    { value: 'oldest', label: 'Plus anciennes', icon: faSort },
    { value: 'likes', label: 'Likes', icon: faSort }
  ];
  
  // Options de tri pour les playlists
  const playlistSortOptions = [
    { value: 'popularity', label: 'Popularité', icon: faSort },
    { value: 'newest', label: 'Plus récentes', icon: faSort },
    { value: 'oldest', label: 'Plus anciennes', icon: faSort },
    { value: 'favorites', label: 'Favoris', icon: faSort }
  ];
  
  // Options de tri pour les podcasts
  const podcastSortOptions = [
    { value: 'newest', label: 'Plus récents', icon: faSort },
    { value: 'popular', label: 'Populaires', icon: faSort },
    { value: 'likes', label: 'Likes', icon: faSort }
  ];
  
  // Options de genre musical
  const genreOptions = [
    { value: null, label: 'Tous les genres' },
    { value: 'Pop', label: 'Pop' },
    { value: 'Rock', label: 'Rock' },
    { value: 'Hip-Hop', label: 'Hip-Hop' },
    { value: 'R&B', label: 'R&B' },
    { value: 'Electronic', label: 'Electronic' },
    { value: 'Jazz', label: 'Jazz' },
    { value: 'Classical', label: 'Classical' },
    { value: 'Country', label: 'Country' },
    { value: 'Reggae', label: 'Reggae' },
    { value: 'Latin', label: 'Latin' },
    { value: 'Metal', label: 'Metal' },
    { value: 'Blues', label: 'Blues' },
    { value: 'Folk', label: 'Folk' },
    { value: 'Disco', label: 'Disco' }
  ];
  
  // Options de décennie
  const decennieOptions = [
    { value: null, label: 'Toutes les décennies' },
    { value: '60s', label: 'Années 60' },
    { value: '70s', label: 'Années 70' },
    { value: '80s', label: 'Années 80' },
    { value: '90s', label: 'Années 90' },
    { value: '2000s', label: 'Années 2000' },
    { value: '2010s', label: 'Années 2010' },
    { value: '2020s', label: 'Années 2020' }
  ];
  
  // Options de catégorie de podcast
  const podcastCategoryOptions = [
    { value: null, label: 'Toutes les catégories' },
    { value: 'PERSONAL BRANDING', label: 'Personal Branding' },
    { value: 'MUSIC BUSINESS', label: 'Music Business' },
    { value: 'ARTIST INTERVIEW', label: 'Artist Interview' },
    { value: 'INDUSTRY INSIGHTS', label: 'Industry Insights' },
    { value: 'THROWBACK HISTORY', label: 'Throwback History' },
    { value: 'OTHER', label: 'Autre' }
  ];
  
  // Options de statut de livestream
  const livestreamStatusOptions = [
    { value: 'all', label: 'Tous' },
    { value: 'LIVE', label: 'En direct' },
    { value: 'SCHEDULED', label: 'Programmés' }
  ];
  
  // Options de catégorie de livestream
  const livestreamCategoryOptions = [
    { value: null, label: 'Toutes les catégories' },
    { value: 'MUSIC_PERFORMANCE', label: 'Performance musicale' },
    { value: 'TALK_SHOW', label: 'Talk Show' },
    { value: 'Q_AND_A', label: 'Q&A' },
    { value: 'BEHIND_THE_SCENES', label: 'Behind the Scenes' },
    { value: 'THROWBACK_SPECIAL', label: 'Throwback Special' },
    { value: 'OTHER', label: 'Autre' }
  ];
  
  // Rendu conditionnel des filtres en fonction de l'onglet actif
  const renderFilters = () => {
    switch (activeTab) {
      case 'videos':
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faSort} />
                <span>Trier par</span>
              </h3>
              <div className={styles.filterOptions}>
                {videoSortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${filters.videos.sort === option.value ? styles.active : ''}`}
                    onClick={() => onFilterChange('videos', 'sort', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faMusic} />
                <span>Genre</span>
              </h3>
              <div className={styles.filterOptions}>
                <select
                  className={styles.filterSelect}
                  value={filters.videos.genre || ''}
                  onChange={(e) => onFilterChange('videos', 'genre', e.target.value === '' ? null : e.target.value)}
                >
                  {genreOptions.map(option => (
                    <option key={option.value || 'all'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faCalendarAlt} />
                <span>Décennie</span>
              </h3>
              <div className={styles.filterOptions}>
                <select
                  className={styles.filterSelect}
                  value={filters.videos.decennie || ''}
                  onChange={(e) => onFilterChange('videos', 'decennie', e.target.value === '' ? null : e.target.value)}
                >
                  {decennieOptions.map(option => (
                    <option key={option.value || 'all'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'playlists':
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faSort} />
                <span>Trier par</span>
              </h3>
              <div className={styles.filterOptions}>
                {playlistSortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${filters.playlists.sort === option.value ? styles.active : ''}`}
                    onClick={() => onFilterChange('playlists', 'sort', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
        
      case 'podcasts':
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faSort} />
                <span>Trier par</span>
              </h3>
              <div className={styles.filterOptions}>
                {podcastSortOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${filters.podcasts.sort === option.value ? styles.active : ''}`}
                    onClick={() => onFilterChange('podcasts', 'sort', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faFilter} />
                <span>Catégorie</span>
              </h3>
              <div className={styles.filterOptions}>
                <select
                  className={styles.filterSelect}
                  value={filters.podcasts.category || ''}
                  onChange={(e) => onFilterChange('podcasts', 'category', e.target.value === '' ? null : e.target.value)}
                >
                  {podcastCategoryOptions.map(option => (
                    <option key={option.value || 'all'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'livestreams':
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faFilter} />
                <span>Statut</span>
              </h3>
              <div className={styles.filterOptions}>
                {livestreamStatusOptions.map(option => (
                  <button
                    key={option.value}
                    className={`${styles.filterOption} ${filters.livestreams.status === option.value ? styles.active : ''}`}
                    onClick={() => onFilterChange('livestreams', 'status', option.value)}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
            
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faFilter} />
                <span>Catégorie</span>
              </h3>
              <div className={styles.filterOptions}>
                <select
                  className={styles.filterSelect}
                  value={filters.livestreams.category || ''}
                  onChange={(e) => onFilterChange('livestreams', 'category', e.target.value === '' ? null : e.target.value)}
                >
                  {livestreamCategoryOptions.map(option => (
                    <option key={option.value || 'all'} value={option.value || ''}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        );
        
      case 'all':
      default:
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterInfo}>
              <p>Sélectionnez un type de contenu spécifique pour afficher plus de filtres</p>
            </div>
          </div>
        );
    }
  };
  
  return (
    <div className={styles.searchFilters}>
      {renderFilters()}
    </div>
  );
};

export default SearchFilters;