import React from 'react';
import { Link } from 'react-router-dom';
import './ShortCard.css';

const ShortCard = ({ short }) => {
  // Extraire l'ID YouTube à partir de l'URL si disponible
  const extractYoutubeId = (url) => {
    if (!url) return null;
    
    // YouTube URL patterns
    const patterns = [
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i,
      /(?:\/shorts\/)([^"&?\/\s]{11})/i
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    
    return null;
  };
  
  // Obtenir la miniature YouTube si applicable
  const getYoutubeThumbnail = (url) => {
    const youtubeId = extractYoutubeId(url);
    if (youtubeId) {
      return `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
    }
    return null;
  };
  
  // Déterminer l'image à afficher
  const getThumbnailUrl = () => {
    // Si l'URL est une URL YouTube, utiliser la miniature YouTube
    const youtubeThumbnail = getYoutubeThumbnail(short.youtubeUrl);
    if (youtubeThumbnail) {
      return youtubeThumbnail;
    }
    
    // Si c'est une URL locale (upload), utiliser directement l'URL
    if (short.youtubeUrl && short.youtubeUrl.startsWith('/')) {
      return short.youtubeUrl;
    }
    
    // Image par défaut
    return '/images/short-placeholder.jpg';
  };

  return (
    <div className="short-card">
      <Link to={`/dashboard/shorts/${short._id}`} className="short-card-link">
        <div className="short-thumbnail-container">
          <img 
            src={getThumbnailUrl()} 
            alt={short.titre} 
            className="short-thumbnail" 
          />
          
          <div className="short-overlay">
            <div className="short-icon">
              <i className="fas fa-bolt"></i>
            </div>
            
            <div className="short-duration">
              {short.duree ? `${short.duree}s` : ''}
            </div>
          </div>
        </div>
        
        <div className="short-info">
          <h3 className="short-title">{short.titre}</h3>
          
          <div className="short-meta">
            {short.artiste && (
              <span className="short-artist">{short.artiste}</span>
            )}
            
            <span className="short-views">
              <i className="fas fa-eye"></i> {(short.vues || 0).toLocaleString()}
            </span>
          </div>
          
          {short.auteur && (short.auteur.nom || short.auteur.prenom) && (
            <div className="short-creator">
              <span className="creator-avatar">
                {short.auteur.photo_profil ? (
                  <img src={short.auteur.photo_profil} alt={`${short.auteur.prenom || ''} ${short.auteur.nom || ''}`} />
                ) : (
                  <div className="avatar-placeholder">
                    {short.auteur.prenom ? short.auteur.prenom[0].toUpperCase() : ''}
                  </div>
                )}
              </span>
              <span className="creator-name">
                {short.auteur.prenom || ''} {short.auteur.nom || ''}
              </span>
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default ShortCard;