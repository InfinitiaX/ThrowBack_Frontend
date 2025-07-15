import React from 'react';
import styles from './MemoryCard.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment } from '@fortawesome/free-solid-svg-icons';

const MemoryCard = ({ 
  memory, 
  baseUrl = '',
  useIcons = false,
  likeIcon = null,
  commentIcon = null,
  isDetailView = false
}) => {
  // Extraire les données du souvenir avec valeurs par défaut
  const {
    id = '',
    username = 'Utilisateur',
    type = 'posted',
    videoTitle = 'Vidéo sans titre',
    videoArtist = 'Artiste inconnu',
    videoYear = '----',
    imageUrl = null,
    content = '',
    likes = 0,
    comments = 0
  } = memory || {};

  // Construire l'URL complète pour l'image
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    return `${baseUrl}${path}`;
  };

  // Condition pour afficher l'image
  const shouldShowImage = imageUrl && !isDetailView;

  return (
    <div className={styles.memoryCard}>
      {/* En-tête avec nom d'utilisateur et type de partage */}
      <div className={styles.memoryHeader}>
        <span className={styles.memoryUsername}>{username}</span> 
        {type === 'posted' ? (
          <span> posted a memory on the music video:</span>
        ) : (
          <span> just shared a throwback to the iconic music video:</span>
        )}
      </div>

      {/* Contenu principal */}
      <div className={styles.memoryContent}>
        {/* Info sur la vidéo */}
        <div className={styles.memoryVideoInfo}>
          🎵 {videoArtist} - {videoTitle} ({videoYear}). Please, like and comment! 👍
        </div>

        {/* Image si disponible et applicable */}
        {shouldShowImage && (
          <img 
            src={getImageUrl(imageUrl)} 
            alt={username} 
            className={styles.memoryUserImage} 
            onError={(e) => {
              e.target.src = '/images/default-avatar.jpg';
            }}
          />
        )}

        {/* Texte du souvenir */}
        <div className={styles.memoryText}>{content}</div>
      </div>

      {/* Pied avec statistiques */}
      <div className={styles.memoryFooter}>
        <div className={styles.memoryLikes}>
          {useIcons ? (
            <FontAwesomeIcon icon={faHeart} className={styles.memoryIcon} />
          ) : likeIcon ? (
            <img src={likeIcon} alt="like" className={styles.iconImage} />
          ) : (
            <FontAwesomeIcon icon={faHeart} className={styles.memoryIcon} />
          )}
          <span>{likes}</span>
        </div>
        <div className={styles.memoryComments}>
          {useIcons ? (
            <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          ) : commentIcon ? (
            <img src={commentIcon} alt="comment" className={styles.iconImage} />
          ) : (
            <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          )}
          <span>{comments}</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;