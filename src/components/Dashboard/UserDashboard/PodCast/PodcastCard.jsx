import React from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, 
  faPause,
  faCalendarAlt
} from '@fortawesome/free-solid-svg-icons';
import styles from './WeeklyPodcast.module.css';

const DEFAULT_IMAGE_PATH = '/images/podcast-default.jpg';

const PodcastCard = ({ podcast, onPlay, isPlaying, getImagePath, handleImageError }) => {
  // Format episode number (e.g., EP.01)
  const formatEpisodeNumber = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric',
      month: 'short', 
      day: 'numeric' 
    });
  };

  // Handle image errors with fallback
  const onImageError = (e) => {
    if (handleImageError) {
      handleImageError(e);
    } else {
      e.target.onerror = null;
      e.target.src = DEFAULT_IMAGE_PATH;
    }
  };

  // Get secure image path
  const getImageSrc = () => {
    if (getImagePath) {
      return getImagePath(podcast);
    }
    
    if (podcast.coverImage) {
      return podcast.coverImage;
    }
    
    // Fallback: create a number from the string ID
    const idSum = podcast._id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return `/images/podcast-${(idSum % 6) + 1}.jpg`;
  };

  return (
    <div className={styles.podcastCard}>
      <div className={styles.podcastCardImageWrapper}>
        <span className={styles.episodeNumber}>
          {formatEpisodeNumber(podcast.episode)}
        </span>
        <div className={styles.playButton} onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onPlay();
        }}>
          <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
        </div>
        <img
          src={getImageSrc()}
          alt={podcast.title}
          className={styles.podcastCardImage}
          onError={onImageError}
          crossOrigin="anonymous"
        />
      </div>
      
      <div className={styles.podcastCardContent}>
        <div className={styles.podcastCardMeta}>
          <span className={styles.hostName}>{podcast.hostName}</span>
          <span className={styles.divider}>•</span>
          <span className={styles.category}>{podcast.category}</span>
        </div>
        
        <h3 className={styles.podcastCardTitle}>
          <Link to={`/dashboard/podcast/${podcast._id}`}>
            {podcast.title}
          </Link>
        </h3>
        
        <p className={styles.podcastCardDescription}>
          {podcast.description}
        </p>
        
        <div className={styles.podcastCardActions}>
          <button 
            className={styles.playEpisodeButton}
            onClick={(e) => {
              e.preventDefault();
              onPlay();
            }}
          >
            <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} /> 
            {isPlaying ? "Pause" : "Play"}
          </button>
          <span className={styles.episodeDuration}>
            {podcast.duration} min • S{podcast.season}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PodcastCard;