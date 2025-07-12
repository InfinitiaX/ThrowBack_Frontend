import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Cards.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faUser } from '@fortawesome/free-solid-svg-icons';

const PodcastCard = ({ podcast }) => {
  if (!podcast) return null;
  
  return (
    <Link to={`/dashboard/podcast/${podcast._id}`} className={styles.cardLink}>
      <div className={styles.podcastCard}>
        <div className={styles.thumbnailContainer}>
          <img 
            src={podcast.coverImage || '/images/podcast-placeholder.jpg'} 
            alt={podcast.title || 'Podcast'} 
            className={styles.thumbnail} 
          />
          <div className={styles.podcastOverlay}>
            <FontAwesomeIcon icon={faMicrophone} className={styles.podcastIcon} />
            <span className={styles.episode}>
              {podcast.getFormattedEpisode ? podcast.getFormattedEpisode() : `EP.${podcast.episode || '01'}`}
            </span>
          </div>
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{podcast.title || 'Podcast sans titre'}</h3>
          <div className={styles.cardMeta}>
            <span className={styles.host}>
              <FontAwesomeIcon icon={faUser} className={styles.userIcon} />
              {podcast.hostName || 'Hôte inconnu'}
            </span>
            {podcast.guestName && (
              <span className={styles.guest}>avec {podcast.guestName}</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PodcastCard;