import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment,
  faSpinner,
  faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import likeIcon from '../../../../assets/icons/like.png';
import commentIcon from '../../../../assets/icons/comment.png';
import MemoryCard from './MemoryCard';
import VideoCard from './VideoCard';
import VideoFilters from './VideoFilters';

// Definition of mock data for fallback
const mockMemories = [
  {
    id: 'mock1',
    username: 'User Demo',
    type: 'posted',
    videoTitle: 'Bohemian Rhapsody',
    videoArtist: 'Queen',
    videoYear: '1975',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This song reminds me of my college days!',
    likes: 5,
    comments: 2
  },
  {
    id: 'mock2',
    username: 'Another User',
    type: 'shared',
    videoTitle: 'Thriller',
    videoArtist: 'Michael Jackson',
    videoYear: '1982',
    imageUrl: '/images/default-avatar.jpg',
    content: 'Best music video of all time!',
    likes: 10,
    comments: 3
  }
];

const mockVideos = [
  {
    _id: 'mock-video-1',
    titre: 'Bohemian Rhapsody',
    artiste: 'Queen',
    annee: '1975',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    vues: 1200,
    likes: 450,
    type: 'music'
  },
  {
    _id: 'mock-video-2',
    titre: 'Thriller',
    artiste: 'Michael Jackson',
    annee: '1982',
    youtubeUrl: 'https://www.youtube.com/watch?v=sOnqjkJTMaA',
    vues: 980,
    likes: 320,
    type: 'music'
  },
  {
    _id: 'mock-video-3',
    titre: 'Hotel California',
    artiste: 'Eagles',
    annee: '1976',
    youtubeUrl: 'https://www.youtube.com/watch?v=EqPtz5qN7HM',
    vues: 750,
    likes: 280,
    type: 'music'
  }
];

const ThrowbackVideos = () => {
  // États de base
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  
  // États pour les filtres
  const [activeFilters, setActiveFilters] = useState({
    genre: 'all',        // All genres by default
    decade: 'all',       // All decades by default
    sortBy: 'Newest'
  });
  const [prevFilters, setPrevFilters] = useState({ ...activeFilters });
  
  // Nouveaux états pour le défilement infini
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [displayedVideos, setDisplayedVideos] = useState([]);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loader = useRef(null);
  const videosPerPage = 12;
  
  // Build base URL based on environment
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Premier chargement
  useEffect(() => {
    // Retrieve only "music" type videos
    fetchMusicVideos();
    
    // Retrieve recent memories
    fetchRecentMemories();
  }, []);
  
  // Observer pour le défilement infini
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 0.5
    };
    
    const observer = new IntersectionObserver((entities) => {
      const target = entities[0];
      if (target.isIntersecting && hasMore && !loading && !isLoadingMore) {
        setIsLoadingMore(true);
        setPage(prevPage => prevPage + 1);
      }
    }, options);
    
    if (loader.current) {
      observer.observe(loader.current);
    }
    
    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [hasMore, loading, isLoadingMore]);
  
  // Charger plus de vidéos quand la page change
  useEffect(() => {
    if (page > 1) {
      fetchMusicVideos(page);
    }
  }, [page]);
  
  // Appliquer les filtres
  useEffect(() => {
    const activeFiltersChanged = JSON.stringify(prevFilters) !== JSON.stringify(activeFilters);
    if (activeFiltersChanged) {
      // Si les filtres changent, réinitialiser la pagination
      setPage(1);
      setPrevFilters(activeFilters);
    }
    applyFilters();
  }, [activeFilters, videos, page]);

  // Fonction principale pour récupérer les vidéos
  const fetchMusicVideos = async (currentPage = 1) => {
    try {
      const isFirstLoad = currentPage === 1;
      if (isFirstLoad) {
        setLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      
      console.log(`Loading music videos (page ${currentPage})...`);
      
      try {
        // Explicitement spécifier le type "music" et ajouter pagination
        const response = await fetch(`${baseUrl}/api/public/videos?type=music&page=${currentPage}&limit=${videosPerPage}`);
        
        if (response.ok) {
          const result = await response.json();
          const videosData = result.data || result.videos || [];
          
          console.log('Music videos retrieved:', videosData);
          
          if (videosData.length > 0) {
            // Premier chargement ou chargement supplémentaire
            setVideos(prev => isFirstLoad ? videosData : [...prev, ...videosData]);
            // Déterminer s'il y a plus de données à charger
            setHasMore(videosData.length === videosPerPage);
            setError(null);
            return;
          }
        }
        
        throw new Error('Failed with public route');
      } catch (primaryError) {
        console.warn('Public route failed, trying standard route:', primaryError);
        
        // Fallback: try old route
        const fallbackResponse = await fetch(`${baseUrl}/api/videos?type=music&page=${currentPage}&limit=${videosPerPage}`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          const videosData = result.data || result.videos || [];
          
          if (videosData.length > 0) {
            // Premier chargement ou chargement supplémentaire
            setVideos(prev => isFirstLoad ? videosData : [...prev, ...videosData]);
            // Déterminer s'il y a plus de données à charger
            setHasMore(videosData.length === videosPerPage);
            setError(null);
            return;
          }
        }
        
        // If both routes fail, use mock data (seulement pour le premier chargement)
        if (isFirstLoad) {
          console.warn('No route works, using mock data');
          setVideos(mockVideos);
          setFilteredVideos(mockVideos);
          setDisplayedVideos(mockVideos);
          setHasMore(false);
          setError('Temporary data displayed - Unable to connect to server');
        } else {
          // Pour les chargements supplémentaires, on arrête simplement le chargement
          setHasMore(false);
        }
      }
    } catch (err) {
      console.error('Exception while loading videos:', err);
      if (currentPage === 1) {
        setVideos(mockVideos);
        setFilteredVideos(mockVideos);
        setDisplayedVideos(mockVideos);
        setHasMore(false);
        setError(`Temporary data displayed - ${err.message}`);
      } else {
        setHasMore(false);
      }
    } finally {
      if (currentPage === 1) {
        setLoading(false);
      }
      setIsLoadingMore(false);
    }
  };

  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      console.log('Loading recent memories...');
      
      try {
        // Try with the new API route
        const response = await fetch(`${baseUrl}/api/public/memories/recent`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('Memories retrieved successfully:', result.data);
            const formattedMemories = formatMemories(result.data);
            setMemories(formattedMemories);
            setMemoriesError(null);
            return;
          }
        }
        
        throw new Error('Failed with main route');
      } catch (primaryError) {
        console.warn('Main route failed, trying backup route:', primaryError);
        
        // Fallback: try old route
        const fallbackResponse = await fetch(`${baseUrl}/api/memories/recent`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          if (result.success && result.data) {
            console.log('Memories retrieved with backup route:', result.data);
            const formattedMemories = formatMemories(result.data);
            setMemories(formattedMemories);
            setMemoriesError(null);
            return;
          }
        }
        
        // If both routes fail, use mock data
        console.warn('No route works, using mock data');
        setMemories(mockMemories);
        setMemoriesError("Unable to load memories, displaying static data");
      }
    } catch (err) {
      console.error('Error loading memories:', err);
      setMemories(mockMemories);
      setMemoriesError("Error loading memories, displaying static data");
    } finally {
      setMemoriesLoading(false);
    }
  };
  
  // Format memory data for display
  const formatMemories = (memoriesData) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
      return mockMemories;
    }
    
    return memoriesData.map(memory => ({
      id: memory._id || memory.id || `memory-${Math.random()}`,
      username: memory.auteur ? 
        `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim() || 'User' : 
        'User',
      type: memory.type || 'posted',
      videoTitle: memory.video?.titre || memory.videoTitle || 'Untitled video',
      videoArtist: memory.video?.artiste || memory.videoArtist || 'Unknown artist',
      videoYear: memory.video?.annee || memory.videoYear || '----',
      imageUrl: getImageUrl(memory.auteur?.photo_profil || memory.imageUrl),
      content: memory.contenu || memory.content || 'No content',
      likes: memory.likes || 0,
      comments: memory.nb_commentaires || memory.comments || 0
    }));
  };
  
  // Apply filters to videos with improved functionality
  const applyFilters = () => {
    if (!videos.length) return;
    
    let result = [...videos];
    
    // Filter by decade
    if (activeFilters.decade !== 'all') {
      const decade = activeFilters.decade.replace('s', ''); // Convert "80s" to "80"
      const decadeStart = parseInt(decade);
      const decadeEnd = decadeStart + 9;
      
      result = result.filter(video => {
        const year = parseInt(video.annee);
        return !isNaN(year) && year >= decadeStart && year <= decadeEnd;
      });
    }
    
    // Filter by genre - amélioré pour gérer différentes structures de données
    if (activeFilters.genre !== 'all') {
      result = result.filter(video => {
        if (!video) return false;
        
        // Vérifier différentes propriétés possibles pour le genre
        return (
          // Si c'est une chaîne directe
          video.genre === activeFilters.genre || 
          // Si c'est un tableau de genres
          (Array.isArray(video.genres) && video.genres.includes(activeFilters.genre)) ||
          // Si c'est dans une propriété tags
          (Array.isArray(video.tags) && video.tags.includes(activeFilters.genre)) ||
          // Si c'est dans un objet metadata
          (video.metadata && video.metadata.genre === activeFilters.genre)
        );
      });
    }
    
    // Tri amélioré avec gestion d'erreurs
    try {
      switch(activeFilters.sortBy) {
        case 'Newest':
          result.sort((a, b) => {
            // Utiliser createdAt, date, ou date_ajout selon ce qui est disponible
            const dateA = new Date(a.createdAt || a.date || a.date_ajout || 0);
            const dateB = new Date(b.createdAt || b.date || b.date_ajout || 0);
            return dateB - dateA;
          });
          break;
        case 'Most popular':
          result.sort((a, b) => (b.vues || b.views || 0) - (a.vues || a.views || 0));
          break;
        case 'Most liked':
          result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
          break;
        default:
          break;
      }
    } catch (error) {
      console.error('Error sorting videos:', error);
    }
    
    setFilteredVideos(result); // Stocker tous les résultats filtrés
    
    // Appliquer la pagination aux résultats filtrés
    const paginated = result.slice(0, page * videosPerPage);
    setDisplayedVideos(paginated);
    
    // Vérifier s'il y a plus de vidéos à afficher après le filtrage
    setHasMore(result.length > paginated.length);
  };
  
  // Function to build complete URLs for images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    
    // If it's already an absolute URL
    if (path.startsWith('http')) return path;
    
    // Otherwise, build the complete URL
    return `${baseUrl}${path}`;
  };
  
  // Filter change handler
  const handleFilterChange = (newFilters) => {
    console.log('New filters applied:', newFilters);
    // Réinitialiser la page quand les filtres changent
    setPage(1);
    setActiveFilters(newFilters);
  };

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>Today's Pick</h2>
          
          {/* VideoFilters component with dropdowns specific to music */}
          <VideoFilters 
            onFilterChange={handleFilterChange}
            activeFilters={activeFilters}
            videoCount={filteredVideos.length}
          />
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading videos...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          ) : (
            <div className={styles.videosGrid}>
              {displayedVideos && displayedVideos.length > 0 ? (
                <>
                  {displayedVideos.map((video) => (
                    <VideoCard 
                      key={video._id || `video-${Math.random()}`} 
                      video={video} 
                      baseUrl={baseUrl}
                    />
                  ))}
                  
                  {/* Loader pour le défilement infini */}
                  <div ref={loader} className={styles.loadingMore}>
                    {isLoadingMore && (
                      <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                    )}
                  </div>
                </>
              ) : (
                <div className={styles.noVideosMessage}>
                  <p>No videos match your search criteria.</p>
                </div>
              )}
            </div>
          )}
        </main>
        
        <aside className={styles.rightCards}>
          <div className={styles.verticalTicker}>
            <div className={styles.tickerContent}>
              {memoriesLoading ? (
                <div className={styles.loadingContainer}>
                  <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                  <p>Loading memories...</p>
                </div>
              ) : memoriesError ? (
                <div className={styles.errorContainer}>
                  <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
                  <p>{memoriesError}</p>
                </div>
              ) : (
                <>
                  {memories.map((memory) => (
                    <MemoryCard 
                      key={memory.id || `memory-${Math.random()}`} 
                      memory={memory}
                      likeIcon={likeIcon}
                      commentIcon={commentIcon}
                      baseUrl={baseUrl}
                    />
                  ))}
                  {/* Duplication pour effet infini */}
                  {memories.slice(0, 2).map((memory) => (
                    <MemoryCard 
                      key={`duplicate-${memory.id || Math.random()}`} 
                      memory={memory}
                      likeIcon={likeIcon}
                      commentIcon={commentIcon}
                      baseUrl={baseUrl}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ThrowbackVideos;