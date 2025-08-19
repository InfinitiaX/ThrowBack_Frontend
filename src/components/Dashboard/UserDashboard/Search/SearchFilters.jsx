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
  // Video sort options
  const videoSortOptions = [
    { value: 'relevance', label: 'Relevance', icon: faSort },
    { value: 'views', label: 'Views', icon: faSort },
    { value: 'newest', label: 'Newest', icon: faSort },
    { value: 'oldest', label: 'Oldest', icon: faSort },
    { value: 'likes', label: 'Likes', icon: faSort }
  ];
  
  // Playlist sort options
  const playlistSortOptions = [
    { value: 'popularity', label: 'Popularity', icon: faSort },
    { value: 'newest', label: 'Newest', icon: faSort },
    { value: 'oldest', label: 'Oldest', icon: faSort },
    { value: 'favorites', label: 'Favorites', icon: faSort }
  ];
  
  // Podcast sort options
  const podcastSortOptions = [
    { value: 'newest', label: 'Newest', icon: faSort },
    { value: 'popular', label: 'Popular', icon: faSort },
    { value: 'likes', label: 'Likes', icon: faSort }
  ];
  
  // Music genre options
  const genreOptions = [
    { value: null, label: 'All genres' },
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
  
  // Decade options
  const decennieOptions = [
    { value: null, label: 'All decades' },
    { value: '60s', label: '60s' },
    { value: '70s', label: '70s' },
    { value: '80s', label: '80s' },
    { value: '90s', label: '90s' },
    { value: '2000s', label: '2000s' },
    { value: '2010s', label: '2010s' },
    { value: '2020s', label: '2020s' }
  ];
  
  // Podcast category options
  const podcastCategoryOptions = [
    { value: null, label: 'All categories' },
    { value: 'PERSONAL BRANDING', label: 'Personal Branding' },
    { value: 'MUSIC BUSINESS', label: 'Music Business' },
    { value: 'ARTIST INTERVIEW', label: 'Artist Interview' },
    { value: 'INDUSTRY INSIGHTS', label: 'Industry Insights' },
    { value: 'THROWBACK HISTORY', label: 'Throwback History' },
    { value: 'OTHER', label: 'Other' }
  ];
  
  // Livestream status options
  const livestreamStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'LIVE', label: 'Live' },
    { value: 'SCHEDULED', label: 'Scheduled' }
  ];
  
  // Livestream category options
  const livestreamCategoryOptions = [
    { value: null, label: 'All categories' },
    { value: 'MUSIC_PERFORMANCE', label: 'Music Performance' },
    { value: 'TALK_SHOW', label: 'Talk Show' },
    { value: 'Q_AND_A', label: 'Q&A' },
    { value: 'BEHIND_THE_SCENES', label: 'Behind the Scenes' },
    { value: 'THROWBACK_SPECIAL', label: 'Throwback Special' },
    { value: 'OTHER', label: 'Other' }
  ];
  
  // Conditional rendering of filters based on active tab
  const renderFilters = () => {
    switch (activeTab) {
      case 'videos':
        return (
          <div className={styles.filterGroup}>
            <div className={styles.filterSection}>
              <h3>
                <FontAwesomeIcon icon={faSort} />
                <span>Sort by</span>
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
                <span>Decade</span>
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
                <span>Sort by</span>
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
                <span>Sort by</span>
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
                <span>Category</span>
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
                <span>Status</span>
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
                <span>Category</span>
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
              <p>Select a specific content type to display more filters</p>
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