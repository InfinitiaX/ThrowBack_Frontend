// VideoCard.jsx - Carte pour afficher une vidéo dans la grille
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';

const VideoCard = ({ video }) => {
  // Utiliser l'ID de la vidéo pour créer le lien vers la page détaillée
  const videoId = video._id;
  
  // Construire l'URL de l'image en fonction du type d'URL
  const thumbnailUrl = video.youtubeUrl.startsWith('http') 
    ? generateYouTubeThumbnail(video.youtubeUrl) 
    : video.youtubeUrl; // URL locale ou chemin complet
  
  return (
    <Link to={`/dashboard/videos/${videoId}`} className={styles.videoCard}>
      <img src={thumbnailUrl} alt={`${video.artiste} - ${video.titre}`} className={styles.videoImg} />
      <div className={styles.videoTitle}>
        {video.artiste} : {video.titre} ({video.annee})
      </div>
    </Link>
  );
};

// Fonction pour extraire l'image miniature d'une URL YouTube
const generateYouTubeThumbnail = (youtubeUrl) => {
  try {
    // Extraire l'ID vidéo YouTube
    let videoId = '';
    
    if (youtubeUrl.includes('youtube.com/watch?v=')) {
      const url = new URL(youtubeUrl);
      videoId = url.searchParams.get('v');
    } else if (youtubeUrl.includes('youtu.be/')) {
      videoId = youtubeUrl.split('youtu.be/')[1];
    } else if (youtubeUrl.includes('youtube.com/embed/')) {
      videoId = youtubeUrl.split('youtube.com/embed/')[1];
    }
    
    // Nettoyer l'ID de paramètres supplémentaires
    if (videoId.includes('&')) {
      videoId = videoId.split('&')[0];
    }
    
    if (videoId) {
      // Retourner l'URL de la miniature haute qualité
      return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    }
    
    // En cas d'échec, renvoyer une image par défaut
    return '/images/video-placeholder.jpg';
  } catch (error) {
    console.error('Erreur lors de la génération de la miniature:', error);
    return '/images/video-placeholder.jpg';
  }
};

export default VideoCard;