import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';

const VideoCard = ({ video, baseUrl }) => {
  // Obtenir l'URL de la vignette YouTube avec gestion améliorée des erreurs
  const getYouTubeThumbnail = (url) => {
    if (!url) return '/images/video-placeholder.jpg';
    
    // Si l'URL est déjà une image locale ou un chemin de backend
    if (url.startsWith('/')) {
      return `${baseUrl}${url}`;
    }
    
    // Si c'est une URL YouTube, extraire l'ID de la vidéo
    let videoId = '';
    
    try {
      // Vérifier si l'URL est valide
      const urlString = url.toString();
      
      if (urlString.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(urlString);
        videoId = urlObj.searchParams.get('v');
      } else if (urlString.includes('youtu.be/')) {
        const parts = urlString.split('youtu.be/');
        if (parts.length > 1) {
          videoId = parts[1];
        }
      } else if (urlString.includes('youtube.com/embed/')) {
        const parts = urlString.split('youtube.com/embed/');
        if (parts.length > 1) {
          videoId = parts[1];
        }
      }
      
      if (videoId) {
        // Nettoyer l'ID
        if (videoId.includes('&')) {
          videoId = videoId.split('&')[0];
        }
        
        // Retourner l'URL de la vignette haute qualité
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (error) {
      console.error('Erreur de parsing URL YouTube:', error);
    }
    
    // Fallback sur l'image par défaut
    return '/images/video-placeholder.jpg';
  };
  
  // Obtenir l'URL de la vignette
  const thumbnailUrl = getYouTubeThumbnail(video.youtubeUrl);
  
  return (
    <Link to={`/dashboard/videos/${video._id}`} className={styles.videoCard}>
      <img 
        src={thumbnailUrl} 
        alt={`${video.artiste || 'Artiste'} - ${video.titre || 'Titre'}`} 
        className={styles.videoImg} 
        onError={(e) => {
          e.target.src = '/images/video-placeholder.jpg';
        }}
      />
      <div className={styles.videoTitle}>
        <span style={{ fontWeight: 600 }}>{video.artiste || 'Artiste'}</span> : {video.titre || 'Titre'} ({video.annee || '----'})
      </div>
    </Link>
  );
};

export default VideoCard;