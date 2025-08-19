import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Search.module.css';
import { searchAPI } from '../../../../utils/api'; // Corrected import
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSearch, 
  faFilter, 
  faTimes, 
  faSpinner,
  faMusic,
  faVideo,
  faList,
  faMicrophone,
  faStream
} from '@fortawesome/free-solid-svg-icons';
import SearchResults from './SearchResults';
import SearchFilters from './SearchFilters';

const Search = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const searchQuery = queryParams.get('q') || '';
  const typeParam = queryParams.get('type') || 'all';
  
  const [activeTab, setActiveTab] = useState(typeParam);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState({});
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    videos: {
      genre: null,
      decennie: null,
      sort: 'relevance'
    },
    playlists: {
      sort: 'popularity'
    },
    podcasts: {
      category: null,
      sort: 'newest'
    },
    livestreams: {
      status: 'all',
      category: null
    }
  });
  
  // Perform initial search on load
  useEffect(() => {
    if (searchQuery) {
      performSearch(searchQuery, activeTab);
    }
  }, [searchQuery, activeTab]);
  
  // Update URL when search type changes
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('type', activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, location.pathname, navigate]);
  
  // Function to perform search
  const performSearch = async (query, type) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    
    try {
      let response;
      
      switch (type) {
        case 'videos':
          response = await searchAPI.searchVideos(query, {
            page: 1,
            limit: 12,
            ...filters.videos
          });
          break;
        case 'playlists':
          response = await searchAPI.searchPlaylists(query, {
            page: 1,
            limit: 12,
            ...filters.playlists
          });
          break;
        case 'podcasts':
          response = await searchAPI.searchPodcasts(query, {
            page: 1,
            limit: 12,
            ...filters.podcasts
          });
          break;
        case 'livestreams':
          response = await searchAPI.searchLivestreams(query, {
            page: 1,
            limit: 12,
            ...filters.livestreams
          });
          break;
        case 'all':
        default:
          response = await searchAPI.globalSearch(query, {
            page: 1,
            limit: 10,
            type: 'all'
          });
          break;
      }
      
      setResults(response.data);
    } catch (error) {
      console.error('Error during search:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams(location.search);
      params.set('q', searchTerm);
      navigate(`${location.pathname}?${params.toString()}`);
      performSearch(searchTerm, activeTab);
    }
  };
  
  // Handle tab change
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (searchQuery) {
      performSearch(searchQuery, tab);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (type, filterName, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [type]: {
        ...prevFilters[type],
        [filterName]: value
      }
    }));
    
    // Relaunch search with new filters
    if (searchQuery) {
      performSearch(searchQuery, activeTab);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    navigate('/dashboard/search');
  };
  
  return (
    <div className={styles.searchPage}>
      <div className={styles.searchHeader}>
        <h1>Search</h1>
        
        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search for music, playlists, podcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button 
                type="button" 
                className={styles.clearButton}
                onClick={clearSearch}
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          
          <button type="submit" className={styles.searchButton}>
            {isLoading ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faSearch} />
            )}
          </button>
          
          <button 
            type="button" 
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <FontAwesomeIcon icon={faFilter} />
          </button>
        </form>
      </div>
      
      {showFilters && (
        <SearchFilters 
          activeTab={activeTab}
          filters={filters}
          onFilterChange={handleFilterChange}
        />
      )}
      
      <div className={styles.searchTabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
          onClick={() => handleTabChange('all')}
        >
          <FontAwesomeIcon icon={faSearch} />
          <span>All</span>
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'videos' ? styles.active : ''}`}
          onClick={() => handleTabChange('videos')}
        >
          <FontAwesomeIcon icon={faVideo} />
          <span>Videos</span>
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'playlists' ? styles.active : ''}`}
          onClick={() => handleTabChange('playlists')}
        >
          <FontAwesomeIcon icon={faList} />
          <span>Playlists</span>
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'podcasts' ? styles.active : ''}`}
          onClick={() => handleTabChange('podcasts')}
        >
          <FontAwesomeIcon icon={faMicrophone} />
          <span>Podcasts</span>
        </button>
        
        <button 
          className={`${styles.tab} ${activeTab === 'livestreams' ? styles.active : ''}`}
          onClick={() => handleTabChange('livestreams')}
        >
          <FontAwesomeIcon icon={faStream} />
          <span>Livestreams</span>
        </button>
      </div>
      
      {isLoading ? (
        <div className={styles.loading}>
          <FontAwesomeIcon icon={faSpinner} spin size="2x" />
          <p>Searching...</p>
        </div>
      ) : (
        <SearchResults 
          results={results} 
          searchQuery={searchQuery}
          activeTab={activeTab}
        />
      )}
    </div>
  );
};

export default Search;