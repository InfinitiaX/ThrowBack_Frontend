import React from 'react';
import styles from '../Videos/Videos.module.css';

const AdminShortDetailModal = ({ isOpen, onClose, short }) => {
  if (!isOpen || !short) return null;

  // Fonction plus robuste pour extraire l'ID YouTube et construire des URLs correctes
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      
      // Si c'est un chemin local (/uploads/...), construire l'URL complète
      if (url && url.startsWith('/uploads/')) {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
        return `${apiBaseUrl}${url}`;
      }
      
      // Check if it's a YouTube URL
      if (url.includes('youtube.com') || url.includes('youtu.be')) {
        let videoId = '';
        
        try {
          const videoUrl = new URL(url);
          
          if (videoUrl.hostname.includes('youtube.com')) {
            // Classic format: youtube.com/watch?v=VIDEO_ID
            if (videoUrl.searchParams.get('v')) {
              videoId = videoUrl.searchParams.get('v');
            }
            // Shorts format: youtube.com/shorts/VIDEO_ID
            else if (videoUrl.pathname.startsWith('/shorts/')) {
              videoId = videoUrl.pathname.replace('/shorts/', '');
            }
            // Embed format: youtube.com/embed/VIDEO_ID
            else if (videoUrl.pathname.startsWith('/embed/')) {
              videoId = videoUrl.pathname.replace('/embed/', '');
            }
          } else if (videoUrl.hostname.includes('youtu.be')) {
            // Short format: youtu.be/VIDEO_ID
            videoId = videoUrl.pathname.substring(1);
          }
        } catch (urlError) {
          // Fallback pour les URLs mal formées
          const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
          if (match && match[1]) {
            videoId = match[1];
          }
        }
        
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      
      // Return the URL as is if not YouTube or local
      return url;
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
      return null;
    }
  };

  const isYouTubeVideo = short.youtubeUrl && (short.youtubeUrl.includes('youtube.com') || short.youtubeUrl.includes('youtu.be'));
  const embedUrl = getYouTubeEmbedUrl(short.youtubeUrl);
  const formattedDate = new Date(short.createdAt).toLocaleString();

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>
            <i className="fas fa-bolt" style={{ color: '#fab005', marginRight: '0.5rem' }}></i>
            {short.titre}
          </h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.videoDetailContent}>
          {/* Video Player */}
          {isYouTubeVideo && embedUrl ? (
            <div className={styles.videoEmbed}>
              <iframe
                src={`${embedUrl}?autoplay=0&mute=1`}
                title={short.titre}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : short.youtubeUrl && !isYouTubeVideo ? (
            // Local video file
            <div className={styles.videoEmbed}>
              <video
                controls
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '6px'
                }}
                crossOrigin="anonymous"
              >
                <source src={getYouTubeEmbedUrl(short.youtubeUrl)} type="video/mp4" />
                <source src={getYouTubeEmbedUrl(short.youtubeUrl)} type="video/webm" />
                <source src={getYouTubeEmbedUrl(short.youtubeUrl)} type="video/ogg" />
                Votre navigateur ne supporte pas la lecture de vidéos.
              </video>
            </div>
          ) : (
            <div className={styles.videoUnavailable}>
              <i className="fas fa-bolt"></i>
              <p>Aperçu vidéo non disponible</p>
              {short.youtubeUrl && (
                <a 
                  href={short.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Ouvrir le fichier <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}
          
          {/* Video Details */}
          <div className={styles.videoDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.videoTypeBadges}>
                <div className={styles.videoType} style={{ backgroundColor: '#fab005' }}>
                  SHORT
                </div>
                {short.duree && (
                  <div className={styles.videoDuration} style={{ backgroundColor: '#4caf50' }}>
                    {short.duree}s
                  </div>
                )}
              </div>
              <div className={styles.videoAddedOn}>
                Ajouté le {formattedDate}
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <h4>Titre</h4>
                <p>{short.titre}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Artiste</h4>
                <p>{short.artiste || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Durée</h4>
                <p>
                  {short.duree ? (
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>
                      <i className="fas fa-clock"></i> {short.duree} secondes
                    </span>
                  ) : '—'}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Type de source</h4>
                <p>
                  {isYouTubeVideo ? (
                    <span style={{ color: '#ff0000', fontWeight: '600' }}>
                      <i className="fab fa-youtube"></i> YouTube
                    </span>
                  ) : (
                    <span style={{ color: '#2196f3', fontWeight: '600' }}>
                      <i className="fas fa-upload"></i> Fichier uploadé
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Vues</h4>
                <p>
                  <span style={{ color: '#4caf50' }}>
                    <i className="fas fa-eye"></i> {short.vues || 0} vues
                  </span>
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Likes</h4>
                <p>
                  <span style={{ color: '#4caf50' }}>
                    <i className="fas fa-thumbs-up"></i> {short.likes || 0}
                  </span>
                  {short.dislikes !== undefined && (
                    <span style={{ color: '#f44336', marginLeft: '1rem' }}>
                      <i className="fas fa-thumbs-down"></i> {short.dislikes || 0}
                    </span>
                  )}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Description</h4>
                <p className={styles.description}>
                  {short.description || '—'}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>URL/Chemin</h4>
                <p className={styles.youtubeUrl}>
                  {isYouTubeVideo ? (
                    <a 
                      href={short.youtubeUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      {short.youtubeUrl} <i className="fas fa-external-link-alt"></i>
                    </a>
                  ) : (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                      {short.youtubeUrl}
                    </span>
                  )}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>ID</h4>
                <p className={styles.videoId}>{short._id}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Ajouté par</h4>
                <p>
                  {short.auteur ? (
                    typeof short.auteur === 'object' && short.auteur.nom && short.auteur.prenom ? (
                      `${short.auteur.prenom} ${short.auteur.nom}`
                    ) : (
                      short.auteur._id || short.auteur
                    )
                  ) : '—'}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Date de création</h4>
                <p>{new Date(short.createdAt).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</p>
              </div>

              {short.updatedAt && short.updatedAt !== short.createdAt && (
                <div className={styles.detailItem}>
                  <h4>Dernière modification</h4>
                  <p>{new Date(short.updatedAt).toLocaleDateString('fr-FR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}</p>
                </div>
              )}

              {/* Performance Metrics */}
              {(short.vues > 0 || short.likes > 0) && (
                <div className={styles.detailItem}>
                  <h4>Engagement</h4>
                  <p>
                    {short.vues > 0 && short.likes > 0 && (
                      <span style={{ color: '#4caf50' }}>
                        Taux d'engagement: {((short.likes / short.vues) * 100).toFixed(1)}%
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.closeModalButton}
            onClick={onClose}
          >
            <i className="fas fa-times"></i> Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShortDetailModal;