import React from 'react';
import styles from './VideoDetail.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment } from '@fortawesome/free-solid-svg-icons';

const MemoryCard = ({ memory, baseUrl = '', onLike }) => {
  if (!memory) return null;

  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http') || path.startsWith('/images/')) return path;
    
    // Nettoyer l'URL de base pour éviter les doubles slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBaseUrl}${cleanPath}`;
  };

  // Construire le texte adapté au type de mémoire
  const getMemoryTypeText = () => {
    switch (memory.type) {
      case 'shared':
        return 'just shared a throwback to the iconic music video:';
      case 'posted':
      default:
        return 'posted a memory on the music video:';
    }
  };

  // Gérer le clic sur le bouton like
  const handleLike = () => {
    if (onLike && memory.id) {
      onLike(memory.id);
    }
  };

  return (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span className={styles.memoryUsername}>
          {memory.username || (memory.auteur && `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim()) || 'Utilisateur'}
        </span>
        <span> {getMemoryTypeText()}</span>
      </div>
      
      <img 
        src={getImageUrl(memory.imageUrl || (memory.auteur && memory.auteur.photo_profil))} 
        alt={`Photo de ${memory.username || 'utilisateur'}`}
        className={styles.memoryUserImage}
        onError={(e) => {
          e.target.src = '/images/default-avatar.jpg';
        }}
      />
      
      <div className={styles.memoryBody}>
        {memory.videoArtist || 'Artiste inconnu'} - {memory.videoTitle || 'Vidéo sans titre'} ({memory.videoYear || '----'}). Please, like and comment to show some love!
      </div>
      
      {memory.content && (
        <div className={styles.memoryText}>
          {memory.content}
        </div>
      )}
      
      <div className={styles.memoryFooter}>
        <div className={styles.memoryLikes} onClick={handleLike}>
          <FontAwesomeIcon icon={faHeart} className={styles.memoryIcon} />
          <span>{memory.likes || 0}</span>
        </div>
        <div className={styles.memoryComments}>
          <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          <span>{memory.nb_commentaires || memory.comments || 0}</span>
        </div>
      </div>
    </div>
  );
};

export default MemoryCard;