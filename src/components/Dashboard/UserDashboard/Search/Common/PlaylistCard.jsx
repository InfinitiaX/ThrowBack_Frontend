import React from 'react';
import { Link } from 'react-router-dom';
import styles from './Cards.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faList, faMusic } from '@fortawesome/free-solid-svg-icons';

const PlaylistCard = ({ playlist }) => {
  if (!playlist) return null;
  
  return (
    <Link to={`/dashboard/playlists/${playlist._id}`} className={styles.cardLink}>
      <div className={styles.playlistCard}>
        <div className={styles.thumbnailContainer}>
          <img 
            src={playlist.image_couverture || '/images/playlist-placeholder.jpg'} 
            alt={playlist.nom || 'Playlist'} 
            className={styles.thumbnail} 
          />
          <div className={styles.playlistOverlay}>
            <FontAwesomeIcon icon={faList} className={styles.playlistIcon} />
            <span className={styles.videoCount}>
              {playlist.videos?.length || 0} titres
            </span>
          </div>
        </div>
        <div className={styles.cardInfo}>
          <h3 className={styles.cardTitle}>{playlist.nom || 'Playlist sans titre'}</h3>
          <div className={styles.cardMeta}>
            <span className={styles.creator}>
              <FontAwesomeIcon icon={faMusic} className={styles.musicIcon} />
              {playlist.proprietaire?.prenom ? 
                `${playlist.proprietaire.prenom} ${playlist.proprietaire.nom}` : 
                'Utilisateur inconnu'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default PlaylistCard;