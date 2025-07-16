import React, { useState, useEffect } from 'react';
import styles from '../Videos/Videos.module.css';

// Configuration de l'URL de l'API - Suppression de l'espace qui causait des problèmes
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

const AdminShortDetailModal = ({ isOpen, onClose, short }) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  
  useEffect(() => {
    // Réinitialiser les états lors de l'ouverture du modal avec un nouveau short
    if (isOpen && short) {
      setVideoError(false);
      setIsVideoLoading(true);
    }
  }, [isOpen, short]);
  
  if (!isOpen || !short) return null;

  // Fonction plus robuste pour obtenir l'URL complète
  const getFullVideoUrl = (path) => {
    if (!path) return '';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // S'assurer que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // URL de base sans espace à la fin
    const baseWithoutTrailingSlash = API_BASE_URL.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
    
    return `${baseWithoutTrailingSlash}${normalizedPath}`;
  };

  // Fonction plus robuste pour extraire l'ID YouTube
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      
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
      
      // For local files, return the direct URL
      return url;
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
      return null;
    }
  };

  const isYouTubeVideo = short.youtubeUrl && (short.youtubeUrl.includes('youtube.com') || short.youtubeUrl.includes('youtu.be'));
  const embedUrl = isYouTubeVideo ? getYouTubeEmbedUrl(short.youtubeUrl) : null;
  const formattedDate = new Date(short.createdAt).toLocaleString();
  
  // Préparer l'URL correcte pour les fichiers locaux
  const videoSrc = isYouTubeVideo ? embedUrl : getFullVideoUrl(short.youtubeUrl);

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
                onLoad={() => setIsVideoLoading(false)}
                onError={() => {
                  setVideoError(true);
                  setIsVideoLoading(false);
                }}
              ></iframe>
              
              {isVideoLoading && (
                <div className={styles.videoLoading}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading video...</p>
                </div>
              )}
            </div>
          ) : !isYouTubeVideo && short.youtubeUrl ? (
            // Local video file
            <div className={styles.videoEmbed}>
              {videoError ? (
                <div className={styles.videoUnavailable}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <p>Video could not be loaded</p>
                  <a 
                    href={getFullVideoUrl(short.youtubeUrl)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className={styles.externalLink}
                  >
                    Open video in new tab <i className="fas fa-external-link-alt"></i>
                  </a>
                </div>
              ) : (
                <>
                  <video
                    controls
                    autoPlay
                    crossOrigin="anonymous"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '6px',
                      display: isVideoLoading ? 'none' : 'block'
                    }}
                    onLoadedData={() => setIsVideoLoading(false)}
                    onError={(e) => {
                      console.error("Video loading error:", e);
                      setVideoError(true);
                      setIsVideoLoading(false);
                    }}
                  >
                    <source src={videoSrc} type="video/mp4" />
                    <source src={videoSrc} type="video/webm" />
                    <source src={videoSrc} type="video/ogg" />
                    Votre navigateur ne supporte pas la lecture de vidéos.
                  </video>
                  
                  {isVideoLoading && (
                    <div className={styles.videoLoading}>
                      <i className="fas fa-spinner fa-spin"></i>
                      <p>Loading video...</p>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <div className={styles.videoUnavailable}>
              <i className="fas fa-bolt"></i>
              <p>Video preview not available</p>
              {short.youtubeUrl && (
                <a 
                  href={getFullVideoUrl(short.youtubeUrl)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Open file <i className="fas fa-external-link-alt"></i>
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
                Added on {formattedDate}
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <h4>Title</h4>
                <p>{short.titre}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Artist</h4>
                <p>{short.artiste || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Duration</h4>
                <p>
                  {short.duree ? (
                    <span style={{ color: '#4caf50', fontWeight: '600' }}>
                      <i className="fas fa-clock"></i> {short.duree} seconds
                    </span>
                  ) : '—'}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Source Type</h4>
                <p>
                  {isYouTubeVideo ? (
                    <span style={{ color: '#ff0000', fontWeight: '600' }}>
                      <i className="fab fa-youtube"></i> YouTube
                    </span>
                  ) : (
                    <span style={{ color: '#2196f3', fontWeight: '600' }}>
                      <i className="fas fa-upload"></i> Uploaded file
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Views</h4>
                <p>
                  <span style={{ color: '#4caf50' }}>
                    <i className="fas fa-eye"></i> {short.vues || 0} views
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
                <h4>URL/Path</h4>
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
                <h4>Added by</h4>
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
                <h4>Created on</h4>
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
                  <h4>Last modified</h4>
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
                        Engagement rate: {((short.likes / short.vues) * 100).toFixed(1)}%
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
            <i className="fas fa-times"></i> Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShortDetailModal;