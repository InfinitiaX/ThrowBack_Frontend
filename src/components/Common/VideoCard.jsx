import React from 'react';
import { Link } from 'react-router-dom';
import './VideoCard.css';

const VideoCard = ({ video }) => {
  // Formater la durée en minutes:secondes
  const formatDuration = (seconds) => {
    if (!seconds) return '--:--';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Formater la date en format relatif
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return "Aujourd'hui";
    } else if (diffDays === 1) {
      return "Hier";
    } else if (diffDays < 7) {
      return `Il y a ${diffDays} jours`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `Il y a ${weeks} semaine${weeks > 1 ? 's' : ''}`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      return `Il y a ${months} mois`;
    } else {
      const years = Math.floor(diffDays / 365);
      return `Il y a ${years} an${years > 1 ? 's' : ''}`;
    }
  };

  return (
    <div className="video-card">
      <Link to={`/dashboard/videos/${video._id}`} className="video-card-link">
        <div className="video-thumbnail-container">
          <img 
            src={video.thumbnailUrl || '/images/video-placeholder.jpg'} 
            alt={video.titre} 
            className="video-thumbnail" 
          />
          
          <span className="video-duration">{formatDuration(video.duree)}</span>
          
          {video.type === 'music' && (
            <div className="video-type music">
              <i className="fas fa-music"></i>
            </div>
          )}
          
          {video.decennie && (
            <div className="video-decade">{video.decennie}</div>
          )}
        </div>
        
        <div className="video-info">
          <h3 className="video-title">{video.titre}</h3>
          
          {video.artiste && (
            <div className="video-artist">
              {video.artiste}
              {video.genre && <span className="video-genre">{video.genre}</span>}
            </div>
          )}
          
          <div className="video-meta">
            <span className="video-views">
              <i className="fas fa-eye"></i> {(video.vues || 0).toLocaleString()} vues
            </span>
            <span className="video-date">{formatDate(video.createdAt)}</span>
          </div>
          
          {video.auteur && video.auteur.nom && (
            <div className="video-channel">
              <span className="channel-avatar">
                {video.auteur.photo_profil ? (
                  <img src={video.auteur.photo_profil} alt={`${video.auteur.prenom} ${video.auteur.nom}`} />
                ) : (
                  <div className="avatar-placeholder">
                    {video.auteur.prenom ? video.auteur.prenom[0].toUpperCase() : ''}
                  </div>
                )}
              </span>
              <span className="channel-name">
                {video.auteur.prenom} {video.auteur.nom}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default VideoCard;