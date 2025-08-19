import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlay,
  faPause,
  faSpinner,
  faHeadphones,
  faArrowLeft,
  faArrowRight,
  faInfoCircle,
  faExclamationTriangle,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import styles from './WeeklyPodcast.module.css';
import PodcastCard from './PodcastCard';
import api from '../../../../utils/api';

const DEFAULT_IMAGE_PATH = '/images/podcast-default.jpg';

const WeeklyPodcast = () => {
  const [podcasts, setPodcasts] = useState([]);
  const [featuredPodcast, setFeaturedPodcast] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [nowPlaying, setNowPlaying] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const navigate = useNavigate();

  // Format episode number (EP.01)
  const formatEpisodeNumber = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Fetch podcasts - using central API
  useEffect(() => {
    const fetchPodcasts = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('Fetching podcasts, page:', currentPage);
        
        // Use centralized API instead of direct fetch
        const response = await api.get(`/api/podcasts/user`, {
          params: {
            page: currentPage,
            limit: 6
          }
        });
        
        console.log('Podcasts data:', response.data);
        
        if (response.data.success) {
          setPodcasts(response.data.data || []);
          setTotalPages(response.data.pagination?.totalPages || 1);
          
          // Use featured podcast provided by the API
          if (response.data.featuredPodcast) {
            setFeaturedPodcast(response.data.featuredPodcast);
          } else if (response.data.data && response.data.data.length > 0) {
            // Fallback: use first podcast as featuredPodcast
            setFeaturedPodcast(response.data.data[0]);
          }
        } else {
          throw new Error(response.data.message || 'Failed to fetch podcasts');
        }
      } catch (err) {
        console.error('Error fetching podcasts:', err);
        setError(err.message || 'An error occurred while loading podcasts');
        
        // If no podcasts are loaded, use dummy data
        if (podcasts.length === 0) {
          setupMockData();
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPodcasts();
  }, [currentPage]);

  // Set up mock data if needed (for demo or in case of error)
  const setupMockData = () => {
    console.log('Setting up mock data');
    const mockPodcasts = [
      {
        _id: '1',
        title: 'The Evolution of Music Through Decades',
        episode: 1,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Anna Smith',
        category: 'THROWBACK HISTORY',
        duration: 60,
        publishDate: new Date().toISOString(),
        description: 'Exploring how music has evolved from the 60s to today, with insights from music historian Anna Smith.',
        vimeoUrl: 'https://vimeo.com/123456789',
        viewCount: 1542,
        likeCount: 287
      },
      {
        _id: '2',
        title: 'Building Your Music Brand From Scratch',
        episode: 2,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'John Doe',
        category: 'PERSONAL BRANDING',
        duration: 55,
        publishDate: new Date().toISOString(),
        description: 'Learn how to build your unique identity as an artist in the crowded music industry.',
        vimeoUrl: 'https://vimeo.com/123456790',
        viewCount: 1245,
        likeCount: 198
      },
      {
        _id: '3',
        title: 'The 80s Music Revolution',
        episode: 3,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Sarah Johnson',
        category: 'THROWBACK HISTORY',
        duration: 62,
        publishDate: new Date().toISOString(),
        description: 'A deep dive into the 80s music scene and how it changed the industry forever.',
        vimeoUrl: 'https://vimeo.com/123456791',
        viewCount: 980,
        likeCount: 145
      },
      {
        _id: '4',
        title: 'Finding Your Unique Voice As An Artist',
        episode: 4,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Michael Brown',
        category: 'ARTIST INTERVIEW',
        duration: 58,
        publishDate: new Date().toISOString(),
        description: 'Michael Brown shares his journey of discovering his unique sound and artistic identity.',
        vimeoUrl: 'https://vimeo.com/123456792',
        viewCount: 845,
        likeCount: 123
      },
      {
        _id: '5',
        title: 'The Business Side of Music',
        episode: 5,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'Emily Williams',
        category: 'MUSIC BUSINESS',
        duration: 65,
        publishDate: new Date().toISOString(),
        description: 'Understanding contracts, royalties, and the financial aspects of the music industry.',
        vimeoUrl: 'https://vimeo.com/123456793',
        viewCount: 732,
        likeCount: 98
      },
      {
        _id: '6',
        title: 'Digital Music Distribution in 2025',
        episode: 6,
        season: 1,
        hostName: 'MIKE LEVIS',
        guestName: 'David Wilson',
        category: 'INDUSTRY INSIGHTS',
        duration: 60,
        publishDate: new Date().toISOString(),
        description: 'How digital platforms have transformed music distribution and whats coming next.',
        vimeoUrl: 'https://vimeo.com/123456794',
        viewCount: 654,
        likeCount: 87
      }
    ];
    
    setPodcasts(mockPodcasts);
    setFeaturedPodcast(mockPodcasts[0]);
  };

  // Handle podcast playback
  const handlePlay = (podcast) => {
    if (nowPlaying && nowPlaying._id === podcast._id) {
      // Toggle pause/play if it's the same podcast
      setIsPlaying(!isPlaying);
    } else {
      // Play a new podcast
      setNowPlaying(podcast);
      setIsPlaying(true);
      // In production, redirect to podcast page
      navigate(`/dashboard/podcast/${podcast._id}`);
    }
  };

  // Function to handle image errors
  const handleImageError = (e) => {
    e.target.onerror = null;
    e.target.src = DEFAULT_IMAGE_PATH;
  };

  // Function to get secure image path
  const getImagePath = (podcast) => {
    if (podcast.coverImage) {
      return podcast.coverImage;
    }
    // Use modulo on a secure numeric value
    // Convert string ID to a number by summing char codes
    const idSum = podcast._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `/images/podcast-${(idSum % 6) + 1}.jpg`;
  };

  return (
    <div className={styles.weeklyPodcastContainer}>
      <header className={styles.pageHeader}>
        <div className={styles.titleSection}>
          <h1 className={styles.pageTitle}>
            <FontAwesomeIcon icon={faHeadphones} className={styles.pageTitleIcon} />
            Weekly Podcast
          </h1>
          <p className={styles.pageSubtitle}>
            Discover our weekly podcasts with industry professionals and artists
          </p>
        </div>
      </header>

      {/* Featured Podcast Section */}
      {featuredPodcast && (
        <section className={styles.featuredSection}>
          <h2 className={styles.sectionTitle}>Latest Episode</h2>
          <div className={styles.featuredPodcast}>
            <div className={styles.featuredPodcastImage}>
              <span className={styles.episodeNumber}>
                {formatEpisodeNumber(featuredPodcast.episode)}
              </span>
              <div
                className={styles.playButton}
                onClick={() => handlePlay(featuredPodcast)}
              >
                <FontAwesomeIcon
                  icon={
                    isPlaying && nowPlaying?._id === featuredPodcast._id
                      ? faPause
                      : faPlay
                  }
                />
              </div>
              <img
                src={getImagePath(featuredPodcast)}
                alt={featuredPodcast.title}
                onError={handleImageError}
                crossOrigin="anonymous"
              />
            </div>
            <div className={styles.featuredPodcastContent}>
              <div className={styles.podcastMeta}>
                <span className={styles.hostName}>{featuredPodcast.hostName}</span>
                <span className={styles.divider}>•</span>
                <span className={styles.category}>{featuredPodcast.category}</span>
              </div>
              <h3 className={styles.podcastTitle}>{featuredPodcast.title}</h3>
              <p className={styles.podcastDescription}>{featuredPodcast.description}</p>
              <div className={styles.podcastStats}>
                <span className={styles.duration}>
                  <FontAwesomeIcon icon={faCalendarAlt} />
                  {new Date(featuredPodcast.publishDate).toLocaleDateString()}
                </span>
                <span className={styles.duration}>
                  <FontAwesomeIcon icon={faInfoCircle} />
                  {featuredPodcast.duration} min
                </span>
                <Link
                  to={`/dashboard/podcast/${featuredPodcast._id}`}
                  className={styles.detailsLink}
                >
                  <FontAwesomeIcon icon={faInfoCircle} />
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Episodes List */}
      <section className={styles.episodesSection}>
        <h2 className={styles.sectionTitle}>All Episodes</h2>

        {isLoading ? (
          <div className={styles.loadingContainer}>
            <FontAwesomeIcon icon={faSpinner} spin size="2x" />
            <span>Loading podcasts...</span>
          </div>
        ) : error ? (
          <div className={styles.errorContainer}>
            <FontAwesomeIcon icon={faExclamationTriangle} size="2x" />
            <p>Error: {error}</p>
            <button
              className={styles.retryButton}
              onClick={() => setCurrentPage(1)}
            >
              Retry
            </button>
          </div>
        ) : podcasts.length === 0 ? (
          <div className={styles.emptyContainer}>
            <FontAwesomeIcon icon={faInfoCircle} size="2x" />
            <p>No podcasts found. New episodes coming soon!</p>
          </div>
        ) : (
          <>
            <div className={styles.podcastGrid}>
              {podcasts.map((podcast) => (
                <PodcastCard
                  key={podcast._id}
                  podcast={podcast}
                  onPlay={() => handlePlay(podcast)}
                  isPlaying={isPlaying && nowPlaying?._id === podcast._id}
                  getImagePath={getImagePath}
                  handleImageError={handleImageError}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.paginationButton}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                >
                  <FontAwesomeIcon icon={faArrowLeft} />
                  <span>Previous</span>
                </button>
                <div className={styles.pageInfo}>
                  Page {currentPage} of {totalPages}
                </div>
                <button
                  className={styles.paginationButton}
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                >
                  <span>Next</span>
                  <FontAwesomeIcon icon={faArrowRight} />
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
};

export default WeeklyPodcast;