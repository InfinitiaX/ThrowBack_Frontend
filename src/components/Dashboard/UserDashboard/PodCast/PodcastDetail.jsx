import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faPlay,
  faPause,
  faVolumeUp,
  faVolumeMute,
  faArrowLeft,
  faSpinner,
  faCalendarAlt,
  faUser,
  faTag,
  faEye,
  faHeart,
  faBookmark,
  faShare,
  faDownload,
  faInfoCircle,
  faExclamationTriangle,
  faCopy,
  faList
} from '@fortawesome/free-solid-svg-icons';
import styles from './PodcastDetail.module.css';
// Import new components
import PlaylistSelectionModal from './PlaylistSelectionModal';
import MemoryList from './MemoryList';
import podcastAPI from '../../../../utils/podcastAPI';

const PodcastDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // Main states
  const [podcast, setPodcast] = useState(null);
  const [allPodcasts, setAllPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Audio player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(1);
  
  // Interaction states
  const [userLiked, setUserLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isBookmarking, setIsBookmarking] = useState(false);
  
  // Interface states
  const [podcastsLoading, setPodcastsLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  const audioRef = useRef(null);
  const progressRef = useRef(null);

  // Format episode number (EP.01)
  const formatEpisodeNumber = (episode) => {
    if (!episode && episode !== 0) return 'EP.01';
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Format time (mm:ss)
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Load all podcasts when component mounts
  useEffect(() => {
    fetchAllPodcasts();
  }, []);

  // Load specific podcast when ID changes
  useEffect(() => {
    if (id) {
      fetchPodcastById(id);
      window.scrollTo(0, 0);
    }
  }, [id]);

  // Audio player controls
  useEffect(() => {
    if (audioRef.current) {
      const audioElement = audioRef.current;
      
      const handleTimeUpdate = () => {
        setCurrentTime(audioElement.currentTime);
      };
      
      const handleLoadedMetadata = () => {
        setDuration(audioElement.duration);
      };
      
      const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
      };
      
      audioElement.addEventListener('timeupdate', handleTimeUpdate);
      audioElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioElement.addEventListener('ended', handleEnded);
      
      return () => {
        audioElement.removeEventListener('timeupdate', handleTimeUpdate);
        audioElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        audioElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [audioRef]);

  // Fetch all available podcasts
  const fetchAllPodcasts = async () => {
    try {
      setPodcastsLoading(true);
      console.log('Loading all podcasts...');
      
      const podcastsData = await podcastAPI.getAllPodcasts({
        limit: '50'
      });
      
      if (Array.isArray(podcastsData) && podcastsData.length > 0) {
        setAllPodcasts(podcastsData);
        console.log(`${podcastsData.length} podcasts loaded`);
      } else {
        console.warn('No podcasts found, using mock data');
        setupMockData();
      }
    } catch (err) {
      console.error('Error loading podcasts:', err);
      setupMockData();
    } finally {
      setPodcastsLoading(false);
    }
  };

  // Fetch a specific podcast by ID
  const fetchPodcastById = async (podcastId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎙️ Loading podcast:', podcastId);
      
      const podcastData = await podcastAPI.getPodcastById(podcastId);
      
      if (podcastData) {
        console.log('Podcast data loaded:', podcastData);
        setPodcast(podcastData);
        
        // Check if user liked the podcast
        setUserLiked(podcastData.userInteraction?.liked || false);
        setIsBookmarked(podcastData.userInteraction?.bookmarked || false);
        
        // Set counters
        setViewCount(podcastData.viewCount || 0);
        setLikeCount(podcastData.likeCount || 0);
        
        console.log('Podcast loaded:', podcastData.title);
      } else {
        setError('Unable to load podcast details');
        setupMockData();
      }
    } catch (err) {
      console.error('Error loading podcast:', err);
      setError('Error loading podcast');
      
      // If API fails, use mock data for demo
      setupMockData();
    } finally {
      setLoading(false);
    }
  };

  // Load mock data if API fails
  const setupMockData = () => {
    // Mock podcast data
    const mockPodcast = {
      _id: id,
      title: 'The Evolution of Hip Hop: From the 80s to Today',
      episode: parseInt(id) || 1,
      season: 1,
      hostName: 'MIKE LEVIS',
      guestName: 'DJ Flash',
      category: 'MUSIC HISTORY',
      duration: 60,
      publishDate: new Date().toISOString(),
      description: 'In this episode, we explore the fascinating journey of hip hop music from its early days in the 1980s through its golden age in the 90s to its current mainstream dominance. Our guest, DJ Flash, shares insights from decades in the industry.',
      coverImage: `/images/podcast-${(parseInt(id) % 6) + 1}.jpg`,
      audioUrl: '/audio/sample-podcast.mp3',
      vimeoUrl: 'https://vimeo.com/123456789',
      topics: ['Hip Hop', 'Music History', 'DJ Culture', 'Music Production'],
      viewCount: 1542,
      likeCount: 287,
      year: 2025
    };
    
    setPodcast(mockPodcast);
    setViewCount(mockPodcast.viewCount);
    setLikeCount(mockPodcast.likeCount);
    
    // Mock related podcasts
    const mockRelated = [
      {
        _id: '2',
        title: 'The Golden Age of R&B: Unforgettable Hits',
        episode: 2,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Sarah Soul',
        category: 'MUSIC HISTORY',
        duration: 55,
        publishDate: new Date().toISOString(),
        coverImage: '/images/podcast-rnb.jpg',
        viewCount: 1245,
        likeCount: 198,
        year: 2025
      },
      {
        _id: '3',
        title: 'Rock Legends: Stories Behind The Classics',
        episode: 3,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Jack Thunder',
        category: 'MUSIC HISTORY',
        duration: 62,
        publishDate: new Date().toISOString(),
        coverImage: '/images/podcast-rock.jpg',
        viewCount: 980,
        likeCount: 145,
        year: 2025
      },
      {
        _id: '4',
        title: 'Dance Music Revolution: From Disco to EDM',
        episode: 4,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'DJ Electra',
        category: 'MUSIC HISTORY',
        duration: 58,
        publishDate: new Date().toISOString(),
        coverImage: '/images/podcast-dance.jpg',
        viewCount: 845,
        likeCount: 123,
        year: 2025
      }
    ];
    
    if (allPodcasts.length === 0) {
      setAllPodcasts(mockRelated);
    }
  };

  // Play/pause control
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Seek control
  const handleSeek = (e) => {
    if (audioRef.current && progressRef.current) {
      const rect = progressRef.current.getBoundingClientRect();
      const pos = (e.clientX - rect.left) / rect.width;
      audioRef.current.currentTime = pos * duration;
      setCurrentTime(pos * duration);
    }
  };

  // Volume control
  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  // Mute/unmute control
  const toggleMute = () => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.volume = prevVolume;
        setVolume(prevVolume);
      } else {
        setPrevVolume(volume);
        audioRef.current.volume = 0;
        setVolume(0);
      }
      setIsMuted(!isMuted);
    }
  };

  // Handle liking a podcast
  const handleLikePodcast = async () => {
    if (isLiking) return; // Prevent multiple clicks
    
    try {
      setIsLiking(true);
      
      // Optimistic UI update
      const newLikedState = !userLiked;
      const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      
      setUserLiked(newLikedState);
      setLikeCount(newLikeCount);
      
      console.log('Attempting like/unlike...');
      
      // API call
      const response = await podcastAPI.likePodcast(id);
      
      if (response.success) {
        // Update with real data from server
        if (response.data) {
          setUserLiked(response.data.liked);
          setLikeCount(response.data.likeCount);
        }
        console.log('Like/unlike successful');
      } else {
        // Revert to previous state on failure
        setUserLiked(!newLikedState);
        setLikeCount(likeCount);
        console.warn('Like failed:', response.message);
      }
    } catch (err) {
      // Revert to previous state on error
      setUserLiked(!userLiked);
      setLikeCount(likeCount);
      
      console.error('Error during like:', err);
      
      if (err.response?.status === 401) {
        alert('Please log in to like this podcast');
      } else {
        alert('Error during like. Please try again.');
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Handle bookmarking a podcast
  const handleBookmarkPodcast = async () => {
    if (isBookmarking) return; 
    
    try {
      setIsBookmarking(true);
      
      // Optimistic UI update
      const newBookmarkedState = !isBookmarked;
      setIsBookmarked(newBookmarkedState);
      
      console.log('Attempting bookmark/unbookmark...');
      
      // API call
      const response = await podcastAPI.bookmarkPodcast(id);
      
      if (response.success) {
        // Update with real data from server
        if (response.data) {
          setIsBookmarked(response.data.bookmarked);
        }
        console.log('Bookmark/unbookmark successful');
      } else {
        // Revert to previous state on failure
        setIsBookmarked(!newBookmarkedState);
        console.warn('Bookmark failed:', response.message);
      }
    } catch (err) {
      // Revert to previous state on error
      setIsBookmarked(!isBookmarked);
      
      console.error('Error during bookmark:', err);
      
      if (err.response?.status === 401) {
        alert('Please log in to bookmark this podcast');
      } else {
        alert('Error during bookmark. Please try again.');
      }
    } finally {
      setIsBookmarking(false);
    }
  };

  // Handle podcast sharing
  const handleSharePodcast = () => {
    setShowShareOptions(!showShareOptions);
  };
  
  const handleShareOption = async (option) => {
    const podcastUrl = window.location.href;
    const podcastTitle = podcast ? podcast.title : 'ThrowBack podcast';
    
    try {
      switch (option) {
        case 'copy':
          await navigator.clipboard.writeText(podcastUrl);
          setShareMessage('URL copied to clipboard!');
          setTimeout(() => setShareMessage(''), 3000);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(podcastUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this awesome podcast: ${podcastTitle}`)}&url=${encodeURIComponent(podcastUrl)}`, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this awesome podcast: ${podcastTitle} ${podcastUrl}`)}`, '_blank');
          break;
        default:
          return;
      }
      
      // Log share via API (non-blocking)
      podcastAPI.sharePodcast(id, option).catch(err => 
        console.warn('Failed to log share:', err)
      );
      
    } catch (err) {
      console.error('Error during sharing:', err);
      setShareMessage('Error during sharing.');
      setTimeout(() => setShareMessage(''), 3000);
    }
    
    setShowShareOptions(false);
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Extract Vimeo ID for iframe embedding
  const getVimeoEmbedUrl = (vimeoUrl) => {
    if (!vimeoUrl) return null;
    
    try {
      const url = new URL(vimeoUrl);
      let vimeoId = '';
      
      if (url.hostname.includes('vimeo.com')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        vimeoId = pathParts[0];
      } else if (url.hostname.includes('player.vimeo.com')) {
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'video') {
          vimeoId = pathParts[1];
        }
      }
      
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    } catch (error) {
      return null;
    }
  };

  // Get secure image path
  const getImagePath = (imagePath) => {
    if (!imagePath) {
      // Default image path
      const idNum = parseInt(id) || 1;
      return `/images/podcast-${(idNum % 6) + 1}.jpg`;
    }
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Component for recommended podcasts
  const RecommendedPodcast = ({ podcast: recommendedPodcast }) => {
    const isCurrentPodcast = podcast && recommendedPodcast._id === podcast._id;
    
    const handleClick = (e) => {
      e.preventDefault();
      navigate(`/dashboard/podcast/${recommendedPodcast._id}`);
    };
    
    const getImagePath = () => {
      if (recommendedPodcast.coverImage) {
        if (recommendedPodcast.coverImage.startsWith('http')) {
          return recommendedPodcast.coverImage;
        }
        const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ';
        return `${backendUrl}${recommendedPodcast.coverImage.startsWith('/') ? '' : '/'}${recommendedPodcast.coverImage}`;
      }
      
      // Calculate a stable default image based on ID
      const idSum = recommendedPodcast._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
      return `/images/podcast-${(idSum % 6) + 1}.jpg`;
    };
    
    return (
      <a 
        href={`/dashboard/podcast/${recommendedPodcast._id}`}
        className={`${styles.recommendedPodcast} ${isCurrentPodcast ? styles.currentPodcast : ''}`}
        onClick={handleClick}
      >
        <div className={styles.recommendedPodcastImage}>
          <span className={styles.recommendedEpisodeNumber}>
            {formatEpisodeNumber(recommendedPodcast.episode)}
          </span>
          <img 
            src={getImagePath()}
            alt={recommendedPodcast.title}
            className={styles.recommendedImg}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/podcast-default.jpg';
            }}
            crossOrigin="anonymous"
          />
        </div>
        <div className={styles.recommendedInfo}>
          <div className={styles.recommendedHost}>{recommendedPodcast.hostName}</div>
          <div className={styles.recommendedTitle}>: {recommendedPodcast.title}</div>
        </div>
        {isCurrentPodcast && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
      </a>
    );
  };

  // Loading and error states
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
        <p>Loading podcast...</p>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <p>{error || 'Podcast not found'}</p>
        <Link to="/dashboard/podcast" className={styles.backButton}>
          <FontAwesomeIcon icon={faArrowLeft} /> Back to podcasts
        </Link>
      </div>
    );
  }

  const embedUrl = getVimeoEmbedUrl(podcast.vimeoUrl);

  return (
    <div className={styles.throwbackPodcastBg}>
      {/* Use the new PlaylistSelectionModal component */}
      {showPlaylistModal && (
        <PlaylistSelectionModal 
          podcastId={id} 
          onClose={() => setShowPlaylistModal(false)}
          onSuccess={() => {
            setShowPlaylistModal(false);
            fetchPodcastById(id);
          }}
        />
      )}
      
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <div className={styles.backLink}>
            <button 
              className={styles.backButton}
              onClick={() => navigate('/dashboard/podcast')}
            >
              <FontAwesomeIcon icon={faArrowLeft} /> Back to
            </button>
          </div>
          
          {/* Podcast Header with Cover and Info */}
          <div className={styles.podcastPlayerContainer}>
            <div className={styles.podcastHeader}>
              <div className={styles.podcastCover}>
                <span className={styles.episodeNumber}>
                  {formatEpisodeNumber(podcast.episode)}
                </span>
                <img
                  src={getImagePath(podcast.coverImage)}
                  alt={podcast.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/podcast-default.jpg';
                  }}
                  crossOrigin="anonymous"
                />
                <div className={styles.playButton} onClick={togglePlay}>
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </div>
              </div>
              
              <div className={styles.podcastInfo}>
                <div className={styles.podcastMeta}>
                  <span className={styles.season}>Season {podcast.season}</span>
                  <span className={styles.hostName}>{podcast.hostName}</span>
                  <span className={styles.category}>{podcast.category}</span>
                </div>
                
                <h1 className={styles.podcastTitle}>{podcast.title}</h1>
                
                {podcast.guestName && (
                  <div className={styles.guestInfo}>
                    <FontAwesomeIcon icon={faUser} /> Guest: {podcast.guestName}
                  </div>
                )}
                
                <div className={styles.podcastStats}>
                  <div className={styles.statItem}>
                    <FontAwesomeIcon icon={faCalendarAlt} />
                    <span>{formatDate(podcast.publishDate)}</span>
                  </div>
                  
                  <div className={styles.statItem}>
                    <FontAwesomeIcon icon={faEye} />
                    <span>{viewCount} views</span>
                  </div>
                  
                  <div className={`${styles.statItem} ${userLiked ? styles.liked : ''} ${isLiking ? styles.loading : ''}`}
                    onClick={handleLikePodcast}>
                    <FontAwesomeIcon icon={isLiking ? faSpinner : faHeart} spin={isLiking} />
                    <span>{likeCount} likes</span>
                  </div>
                </div>
                
                <div className={styles.podcastDescription}>
                  {podcast.description}
                </div>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className={styles.podcastActionBar}>
            <div className={styles.actionButtons}>
              <button 
                className={`${styles.actionButton} ${isBookmarked ? styles.activeButton : ''} ${isBookmarking ? styles.loading : ''}`}
                onClick={handleBookmarkPodcast}
              >
                <FontAwesomeIcon icon={isBookmarking ? faSpinner : faBookmark} spin={isBookmarking} />
                {isBookmarked ? 'Bookmarked' : 'Bookmark'}
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={handleSharePodcast}
              >
                <FontAwesomeIcon icon={faShare} />
                Share
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={() => setShowPlaylistModal(true)}
              >
                <FontAwesomeIcon icon={faList} />
                Add to Playlist
              </button>
            </div>
            
            {/* Share Options */}
            {showShareOptions && (
              <div className={styles.shareOptions}>
                <div className={styles.shareOption} onClick={() => handleShareOption('copy')}>
                  <FontAwesomeIcon icon={faCopy} /> Copy Link
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('facebook')}>
                  <FontAwesomeIcon icon={faFacebook} /> Facebook
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('twitter')}>
                  <FontAwesomeIcon icon={faTwitter} /> Twitter
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('whatsapp')}>
                  <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                </div>
              </div>
            )}
            
            {/* Success Message */}
            {shareMessage && (
              <div className={styles.shareMessage}>
                {shareMessage}
              </div>
            )}
          </div>
          
          {/* Include the MemoryList component instead of direct input field */}
          <div className={styles.memoriesContainer}>
            <MemoryList podcastId={id} />
          </div>
          
          {/* Podcast Video Preview Section */}
          {embedUrl && (
            <div className={styles.podcastVideoSection}>
              <h3 className={styles.sectionTitle}>Podcast Video Preview</h3>
              <div className={styles.embedContainer}>
                <iframe
                  src={embedUrl}
                  frameBorder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                  title={podcast.title}
                ></iframe>
              </div>
            </div>
          )}
          
          {/* Topics Section */}
          {podcast.topics && podcast.topics.length > 0 && (
            <div className={styles.topicsSection}>
              <h3 className={styles.sectionTitle}>Topics Discussed</h3>
              <div className={styles.topicTags}>
                {podcast.topics.map((topic, index) => (
                  <span key={index} className={styles.topicTag}>
                    <FontAwesomeIcon icon={faTag} />
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommended Podcasts */}
          <div className={styles.recommendedPodcastsSection}>
            <h3 className={styles.recommendedSectionTitle}>All Episodes</h3>
            <div className={styles.recommendedPodcastsGrid}>
              {podcastsLoading ? (
                <div className={styles.recommendedLoading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Loading podcasts...</span>
                </div>
              ) : allPodcasts.length > 0 ? (
                allPodcasts.map(podcastItem => (
                  <RecommendedPodcast key={podcastItem._id} podcast={podcastItem} />
                ))
              ) : (
                <div className={styles.emptyRecommendations}>
                  <p>We're adding new podcasts soon!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* No need to display memories in the sidebar as they're already handled by the MemoryList component */}
        <aside className={styles.rightCards}>
          <h3 className={styles.memoriesSectionTitle}>Featured Podcasts</h3>
          {allPodcasts.length > 0 && (
            <div className={styles.featuredPodcasts}>
              {allPodcasts.slice(0, 3).map(podcastItem => (
                <RecommendedPodcast key={podcastItem._id} podcast={podcastItem} />
              ))}
            </div>
          )}
        </aside>
      </div>
      
      {/* Audio element for podcast playback */}
      <audio ref={audioRef} src={podcast.audioUrl || '/audio/sample-podcast.mp3'} preload="metadata" />
    </div>
  );
};

export default PodcastDetail;