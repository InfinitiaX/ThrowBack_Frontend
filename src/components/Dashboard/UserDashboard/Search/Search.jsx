import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Search.module.css';
import searchAPI from '../../../../utils/searchAPI';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSearch,
  faFilter,
  faTimes,
  faSpinner,
  faVideo,
  faList,
  faMicrophone,
  faStream
} from '@fortawesome/free-solid-svg-icons';
import SearchResults from './SearchResults';
import SearchFilters from './SearchFilters';
import SearchSuggestions from './SearchSuggestions';

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

  // Suggestions
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const debounceRef = useRef(null);
  const inputRef = useRef(null);

  const [filters, setFilters] = useState({
    videos: { genre: null, decennie: null, sort: 'relevance' },
    playlists: { sort: 'popularity' },
    podcasts: { category: null, sort: 'newest' },
    livestreams: { status: 'all', category: null }
  });

  // -------- Helpers de normalisation --------
  const normalizeList = (payload) => {
    // payload peut être un tableau simple (backend actuel) ou déjà {items,total,...}
    if (Array.isArray(payload)) {
      return { items: payload, total: payload.length, totalPages: 1 };
    }
    if (payload && typeof payload === 'object') {
      return {
        items: Array.isArray(payload.items) ? payload.items : [],
        total: typeof payload.total === 'number' ? payload.total : (Array.isArray(payload.items) ? payload.items.length : 0),
        totalPages: typeof payload.totalPages === 'number' ? payload.totalPages : 1
      };
    }
    return { items: [], total: 0, totalPages: 1 };
  };

  const normalizeAll = (payload) => {
    // payload attendu du backend: { videos: [], playlists: [], podcasts: [], livestreams: [] }
    const v = normalizeList(payload?.videos || []);
    const p = normalizeList(payload?.playlists || []);
    const pc = normalizeList(payload?.podcasts || []);
    const l = normalizeList(payload?.livestreams || []);
    return { videos: v, playlists: p, podcasts: pc, livestreams: l };
  };

  // ------------------------------------------

  // Initial search on load
  useEffect(() => {
    if (searchQuery) performSearch(searchQuery, activeTab);
  }, [searchQuery, activeTab]); // :contentReference[oaicite:3]{index=3}

  // Sync type in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    params.set('type', activeTab);
    navigate(`${location.pathname}?${params.toString()}`, { replace: true });
  }, [activeTab, location.pathname, navigate]); // :contentReference[oaicite:4]{index=4}

  // Debounced suggestions on typing
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!searchTerm || searchTerm.trim().length < 2) {
      setSuggestions([]);
      setShowSuggest(false);
      setActiveIndex(-1);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      const res = await searchAPI.getSearchSuggestions(searchTerm, 8);
      setSuggestions(res?.data || []);
      setShowSuggest(true);
      setActiveIndex(-1);
    }, 220);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm]);

  // Close suggestions on route change
  useEffect(() => {
    setShowSuggest(false);
    setActiveIndex(-1);
  }, [location.pathname, location.search]);

  const performSearch = async (query, type) => {
    if (!query.trim()) return;
    setIsLoading(true);
    try {
      let response;
      switch (type) {
        case 'videos':
          response = await searchAPI.searchVideos(query, { page: 1, limit: 12, ...filters.videos });
          // response = { success, data: [...] }
          setResults(normalizeList(response.data));
          break;
        case 'playlists':
          response = await searchAPI.searchPlaylists(query, { page: 1, limit: 12, ...filters.playlists });
          setResults(normalizeList(response.data));
          break;
        case 'podcasts':
          response = await searchAPI.searchPodcasts(query, { page: 1, limit: 12, ...filters.podcasts });
          setResults(normalizeList(response.data));
          break;
        case 'livestreams':
          response = await searchAPI.searchLivestreams(query, { page: 1, limit: 12, ...filters.livestreams });
          setResults(normalizeList(response.data));
          break;
        case 'all':
        default:
          response = await searchAPI.globalSearch(query, { page: 1, limit: 10, type: 'all' });
          // response = { success, data: { videos: [], playlists: [], podcasts: [], livestreams: [] } }
          setResults(normalizeAll(response.data));
          break;
      }
    } catch (e) {
      console.error('Error during search:', e);
      setResults({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      const params = new URLSearchParams(location.search);
      params.set('q', searchTerm);
      navigate(`${location.pathname}?${params.toString()}`);
      performSearch(searchTerm, activeTab);
      setShowSuggest(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (searchQuery) performSearch(searchQuery, tab);
  };

  const handleFilterChange = (type, filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [type]: { ...prev[type], [filterName]: value },
    }));
    if (searchQuery) performSearch(searchQuery, activeTab);
  };

  const clearSearch = () => {
    setSearchTerm('');
    setSuggestions([]);
    setShowSuggest(false);
    navigate('/dashboard/search');
  };

  // Keyboard navigation in suggestions
  const onKeyDown = (e) => {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      if (activeIndex >= 0) {
        e.preventDefault();
        pickSuggestion(suggestions[activeIndex]);
      }
    } else if (e.key === 'Escape') {
      setShowSuggest(false);
    }
  };

  const pickSuggestion = (s) => {
    const nextQ = s.query || s.text || searchTerm;
    setSearchTerm(nextQ);
    const params = new URLSearchParams(location.search);
    params.set('q', nextQ);

    const nextType =
      s.type === 'playlist' ? 'playlists'
      : s.type === 'video' ? 'videos'
      : 'videos';

    params.set('type', nextType);
    navigate(`${location.pathname}?${params.toString()}`);
    performSearch(nextQ, nextType);
    setShowSuggest(false);
    inputRef.current?.blur();
  };

  return (
    <div className={styles.searchPage}>
      <div className={styles.searchHeader}>
        <h1>Search</h1>

        <form onSubmit={handleSubmit} className={styles.searchForm}>
          <div className={styles.searchInputWrapper} style={{ position: 'relative' }}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search for music, playlists, podcasts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setShowSuggest(true);
              }}
              onBlur={() => {
                setTimeout(() => setShowSuggest(false), 120);
              }}
              onKeyDown={onKeyDown}
              className={styles.searchInput}
              aria-autocomplete="list"
              aria-expanded={showSuggest}
              aria-controls="search-suggest"
            />

            {searchTerm && (
              <button
                type="button"
                className={styles.clearButton}
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}

            <SearchSuggestions
              visible={showSuggest}
              query={searchTerm}
              suggestions={suggestions}
              activeIndex={activeIndex}
              onHover={setActiveIndex}
              onPick={pickSuggestion}
            />
          </div>

          <button type="submit" className={styles.searchButton} aria-label="Submit search">
            {isLoading ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faSearch} />}
          </button>

          <button
            type="button"
            className={`${styles.filterButton} ${showFilters ? styles.active : ''}`}
            onClick={() => setShowFilters(!showFilters)}
            aria-pressed={showFilters}
            aria-label="Toggle filters"
          >
            <FontAwesomeIcon icon={faFilter} />
          </button>
        </form>
      </div>

      {showFilters && (
        <SearchFilters activeTab={activeTab} filters={filters} onFilterChange={handleFilterChange} />
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
        <SearchResults results={results} searchQuery={searchQuery} activeTab={activeTab} />
      )}
    </div>
  );
};

export default Search;
