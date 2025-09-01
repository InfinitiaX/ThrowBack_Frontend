import React, { useState, useEffect } from 'react';
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
  const [videos, setVideos] = useState([]);
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    genre: 'all',        // All genres by default
    decade: 'all',       // All decades by default
    sortBy: 'Newest'
  });
  
  // Build base URL based on environment
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    // Retrieve only "music" type videos
    fetchMusicVideos();
    
    // Retrieve recent memories
    fetchRecentMemories();
  }, []);
  
  useEffect(() => {
    // Apply filters to videos
    applyFilters();
  }, [activeFilters, videos]);

  const fetchMusicVideos = async () => {
    try {
      setLoading(true);
      console.log('Loading music videos...');
      
      try {
        // Explicitly specify "music" type
        const response = await fetch(`${baseUrl}/api/public/videos?type=music`);
        
        if (response.ok) {
          const result = await response.json();
          const videosData = result.data || result.videos || [];
          
          console.log('Music videos retrieved:', videosData);
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setFilteredVideos(videosData);
            setError(null);
            return;
          }
        }
        
        throw new Error('Failed with public route');
      } catch (primaryError) {
        console.warn('Public route failed, trying standard route:', primaryError);
        
        // Fallback: try old route
        const fallbackResponse = await fetch(`${baseUrl}/api/videos?type=music`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          const videosData = result.data || result.videos || [];
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setFilteredVideos(videosData);
            setError(null);
            return;
          }
        }
        
        // If both routes fail, use mock data
        console.warn('No route works, using mock data');
        setVideos(mockVideos);
        setFilteredVideos(mockVideos);
        setError('Temporary data displayed - Unable to connect to server');
      }
    } catch (err) {
      console.error('Exception while loading videos:', err);
      setVideos(mockVideos);
      setFilteredVideos(mockVideos);
      setError(`Temporary data displayed - ${err.message}`);
    } finally {
      setLoading(false);
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
  
  // Apply filters to videos
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
    
    // Filter by genre
    if (activeFilters.genre !== 'all') {
      result = result.filter(video => {
        return video.genre === activeFilters.genre || 
               video.genres?.includes(activeFilters.genre);
      });
    }
    
    // Sort
    switch(activeFilters.sortBy) {
      case 'Newest':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'Most popular':
        result.sort((a, b) => (b.vues || 0) - (a.vues || 0));
        break;
      case 'Most liked':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }
    
    setFilteredVideos(result);
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
              {filteredVideos && filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <VideoCard 
                    key={video._id || `video-${Math.random()}`} 
                    video={video} 
                    baseUrl={baseUrl}
                  />
                ))
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
                  {/* Duplication for infinite effect */}
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
