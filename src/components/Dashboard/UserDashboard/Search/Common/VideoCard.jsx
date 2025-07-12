import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Cards.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlayCircle, faEye } from '@fortawesome/free-solid-svg-icons';

const VideoCard = ({ video }) => {
  if (!video) return null;
  
  return (
    <Link to={`/dashboard/videos/${video._id}`} className={styles.cardLink}>
      <div className={styles.videoCard}>
        <div className={styles.thumbnailContainer}>
          {video.youtubeUrl && (
            <img 
              src={video.youtubeUrl.includes('youtube.com') ? 
                `https://img.youtube.com/vi/${video.youtubeUrl.split('v=')[1]?.split('&')[0]}/mqdefault.jpg` : 
                '/images/video-placeholder.jpg'} 
              alt={video.titre || 'Vidéo'} 
              className={styles.thumbnail} 
            />
          )}
          <div className={styles.playOverlay}>
            <FontAwesomeIcon icon={faPlayCircle} className={styles.playIcon} />
          </div>
          {video.duree && (
            <span className={styles.duration}>{video.duree}s</span>
          )}
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{video.titre || 'Vidéo sans titre'}</h3>
          <div className={styles.cardMeta}>
            <span className={styles.artist}>{video.artiste || 'Artiste inconnu'}</span>
            {video.vues !== undefined && (
              <span className={styles.views}>
                <FontAwesomeIcon icon={faEye} className={styles.viewIcon} />
                {video.vues}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VideoCard;