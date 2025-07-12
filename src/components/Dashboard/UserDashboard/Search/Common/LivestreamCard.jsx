import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Cards.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faStream, faCalendarAlt, faUser } from '@fortawesome/free-solid-svg-icons';

const LivestreamCard = ({ livestream }) => {
  if (!livestream) return null;
  
  const isLive = livestream.status === 'LIVE';
  const isScheduled = livestream.status === 'SCHEDULED';
  
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' à ' + date.toLocaleTimeString().slice(0, 5);
  };
  
  return (
    <Link to={`/dashboard/livestreams/${livestream._id}`} className={styles.cardLink}>
      <div className={styles.livestreamCard}>
        <div className={styles.thumbnailContainer}>
          <img 
            src={livestream.thumbnailUrl || '/images/livestream-placeholder.jpg'} 
            alt={livestream.title || 'Livestream'} 
            className={styles.thumbnail} 
          />
          <div className={`${styles.livestreamStatus} ${isLive ? styles.live : isScheduled ? styles.scheduled : ''}`}>
            <FontAwesomeIcon icon={faStream} className={styles.statusIcon} />
            <span>{isLive ? 'EN DIRECT' : isScheduled ? 'PROGRAMMÉ' : 'TERMINÉ'}</span>
          </div>
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{livestream.title || 'Livestream sans titre'}</h3>
          <div className={styles.cardMeta}>
            {isScheduled && livestream.scheduledStartTime && (
              <span className={styles.scheduledTime}>
                <FontAwesomeIcon icon={faCalendarAlt} className={styles.calendarIcon} />
                {formatDate(livestream.scheduledStartTime)}
              </span>
            )}
            <span className={styles.host}>
              <FontAwesomeIcon icon={faUser} className={styles.userIcon} />
              {livestream.hostName || 'Hôte inconnu'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default LivestreamCard;