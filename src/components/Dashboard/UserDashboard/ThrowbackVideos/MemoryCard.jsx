import React from 'react';
import styles from './VideoDetail.module.css'; // S'assurer d'utiliser le bon fichier CSS
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faComment } from '@fortawesome/free-solid-svg-icons';

const MemoryCard = ({ memory, baseUrl }) => {
  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    
    // Si c'est déjà une URL absolue
    if (path.startsWith('http')) return path;
    
    // Sinon, construire l'URL complète
    return `${baseUrl}${path}`;
  };

  return (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span style={{color:'#d32f2f',fontWeight:600}}>{memory.username || 'Utilisateur'}</span>
        {memory.type === 'posted' ? (
          <span> posted a memory on the music video:</span>
        ) : (
          <span> just shared a throwback to the iconic music video:</span>
        )}
      </div>
      <img 
        src={getImageUrl(memory.imageUrl)} 
        alt={memory.videoTitle || 'Vidéo'} 
        className={styles.memoryUserImage}
        onError={(e) => {
          e.target.src = '/images/default-avatar.jpg';
        }}
      />
      <div className={styles.memoryBody}>
        {memory.videoArtist || 'Artiste'} - {memory.videoTitle || 'Titre'} ({memory.videoYear || '----'}). Please, like and comment to show some love! <br/>
        <span style={{color:'#d32f2f'}}>{memory.content || 'Aucun contenu'}</span>
      </div>
      <div className={styles.memoryFooter}>
        <span>
          <FontAwesomeIcon icon={faHeart} style={{ color: '#d32f2f', marginRight: 6 }} />
          {memory.likes || 0}
        </span>
        <span>
          <FontAwesomeIcon icon={faComment} style={{ color: '#d32f2f', marginRight: 6 }} />
          {memory.comments || 0}
        </span>
      </div>
    </div>
  );
};

export default MemoryCard;