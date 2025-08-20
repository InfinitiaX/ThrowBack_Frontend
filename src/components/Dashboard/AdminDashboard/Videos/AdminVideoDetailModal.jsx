import React, { useState, useEffect } from 'react';
import styles from './Videos.module.css';

// Configuration de l'URL de l'API - Sans espace à la fin
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

const VideoDetailModal = ({ isOpen, onClose, video }) => {
  const [videoError, setVideoError] = useState(false);
  const [isVideoLoading, setIsVideoLoading] = useState(true);
  
  useEffect(() => {
    // Réinitialiser les états lors de l'ouverture du modal avec une nouvelle vidéo
    if (isOpen && video) {
      setVideoError(false);
      setIsVideoLoading(true);
    }
  }, [isOpen, video]);
  
  if (!isOpen || !video) return null;

  // Extract YouTube video ID or handle uploaded files
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      
      // Si c'est un chemin local (/uploads/...), construire l'URL complète
      if (url.startsWith('/uploads/')) {
        return `${API_BASE_URL}${url}`;
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
      
      // Check if it's a Vimeo URL
      if (url.includes('vimeo.com')) {
        let vimeoId = '';
        
        try {
          const videoUrl = new URL(url);
          
          if (videoUrl.hostname.includes('vimeo.com')) {
            // Regular format: vimeo.com/VIDEO_ID
            const segments = videoUrl.pathname.split('/').filter(Boolean);
            vimeoId = segments[0];
            
            // Handle potential channel format: vimeo.com/channels/channelname/VIDEO_ID
            if (segments.length > 1 && segments[0] === 'channels' && !isNaN(segments[segments.length - 1])) {
              vimeoId = segments[segments.length - 1];
            }
          } else if (videoUrl.hostname.includes('player.vimeo.com')) {
            // Embed format: player.vimeo.com/video/VIDEO_ID
            const segments = videoUrl.pathname.split('/').filter(Boolean);
            if (segments.length > 1 && segments[0] === 'video') {
              vimeoId = segments[1];
            }
          }
        } catch (urlError) {
          // Fallback pour les URLs mal formées
          const match = url.match(/vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|)(\d+)(?:$|\/|\?)/i);
          if (match && match[1]) {
            vimeoId = match[1];
          }
        }
        
        return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
      }
      
      // For local files or other types, return the direct URL
      return url;
    } catch (error) {
      console.error("Error parsing video URL:", error);
      return null;
    }
  };

  const isYouTubeVideo = video.youtubeUrl && (video.youtubeUrl.includes('youtube.com') || video.youtubeUrl.includes('youtu.be'));
  const isVimeoVideo = video.youtubeUrl && video.youtubeUrl.includes('vimeo.com');
  const isLocalVideo = video.youtubeUrl && (video.youtubeUrl.startsWith('/uploads/') || video.youtubeUrl.startsWith('http') && !isYouTubeVideo && !isVimeoVideo);
  const embedUrl = getYouTubeEmbedUrl(video.youtubeUrl);
  const formattedDate = new Date(video.createdAt).toLocaleString();

  // Genre color mapping
  const getGenreColor = (genre) => {
    const genreColors = {
      'Pop': '#e91e63',
      'Rock': '#9c27b0',
      'Hip-Hop': '#673ab7',
      'Rap': '#3f51b5',
      'R&B': '#2196f3',
      'Soul': '#03a9f4',
      'Jazz': '#00bcd4',
      'Blues': '#009688',
      'Electronic': '#4caf50',
      'Dance': '#8bc34a',
      'House': '#cddc39',
      'Techno': '#ffeb3b',
      'Country': '#ffc107',
      'Folk': '#ff9800',
      'Classical': '#ff5722',
      'Reggae': '#795548',
      'Latin': '#607d8b',
      'Alternative': '#f44336',
      'Indie': '#e81e63',
      'Metal': '#424242',
      'Punk': '#000000',
      'Funk': '#ff4081',
      'Disco': '#7c4dff',
      'Gospel': '#448aff',
      'Soundtrack': '#18ffff',
      'Other': '#64dd17'
    };
    return genreColors[genre] || '#666';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{video.titre}</h2>
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
                title={video.titre}
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
          ) : isVimeoVideo && embedUrl ? (
            <div className={styles.videoEmbed}>
              <iframe
                src={`${embedUrl}?autoplay=0&mute=1`}
                title={video.titre}
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
          ) : isLocalVideo && embedUrl ? (
            // Pour les vidéos locales uploadées
            <div className={styles.videoEmbed}>
              <video
                controls
                autoPlay={false}
                muted
                src={embedUrl}
                className={styles.localVideo}
                crossOrigin="anonymous"
                onCanPlay={() => setIsVideoLoading(false)}
                onError={(e) => {
                  console.error("Error loading video:", e);
                  setVideoError(true);
                  setIsVideoLoading(false);
                }}
              >
                <source src={embedUrl} type="video/mp4" />
                <source src={embedUrl} type="video/webm" />
                <source src={embedUrl} type="video/ogg" />
                Your browser does not support the video tag.
              </video>
              
              {isVideoLoading && (
                <div className={styles.videoLoading}>
                  <i className="fas fa-spinner fa-spin"></i>
                  <p>Loading video...</p>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.videoUnavailable}>
              <i className="fas fa-film"></i>
              <p>Video preview unavailable</p>
              {video.youtubeUrl && (
                <a 
                  href={video.youtubeUrl.startsWith('/uploads/') ? `${API_BASE_URL}${video.youtubeUrl}` : video.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Open video <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}
          
          <div className={styles.videoDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.videoTypeBadges}>
                <div className={styles.videoType}>
                  {video.type.toUpperCase()}
                </div>
                {video.genre && (
                  <div 
                    className={styles.videoGenre}
                    style={{ backgroundColor: getGenreColor(video.genre) }}
                  >
                    {video.genre}
                  </div>
                )}
                {video.decennie && (
                  <div className={styles.videoDecade}>{video.decennie}</div>
                )}
              </div>
              <div className={styles.videoAddedOn}>
                Added on {formattedDate}
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <h4>Artist</h4>
                <p>{video.artiste || '—'}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Year</h4>
                <p>{video.annee || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Decade</h4>
                <p>{video.decennie || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Genre</h4>
                <p>
                  {video.genre ? (
                    <span 
                      style={{ 
                        color: getGenreColor(video.genre),
                        fontWeight: '600'
                      }}
                    >
                      {video.genre}
                    </span>
                  ) : '—'}
                </p>
              </div>

              {video.duree && (
                <div className={styles.detailItem}>
                  <h4>Duration</h4>
                  <p>{video.duree} seconds</p>
                </div>
              )}

              <div className={styles.detailItem}>
                <h4>Views</h4>
                <p>
                  <span style={{ color: '#4caf50' }}>
                    <i className="fas fa-eye"></i> {video.vues || 0} views
                  </span>
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Likes</h4>
                <p>
                  <span style={{ color: '#4caf50' }}>
                    <i className="fas fa-thumbs-up"></i> {video.likes || 0}
                  </span>
                  {video.dislikes !== undefined && (
                    <span style={{ color: '#f44336', marginLeft: '1rem' }}>
                      <i className="fas fa-thumbs-down"></i> {video.dislikes || 0}
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Comments</h4>
                <p>{video.meta?.commentCount || 0} comments</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Description</h4>
                <p className={styles.description}>
                  {video.description || '—'}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Video URL</h4>
                <p className={styles.youtubeUrl}>
                  <a 
                    href={video.youtubeUrl.startsWith('/uploads/') ? `${API_BASE_URL}${video.youtubeUrl}` : video.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {video.youtubeUrl} <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Video ID</h4>
                <p className={styles.videoId}>{video._id}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Added by</h4>
                <p>
                  {video.auteur ? (
                    typeof video.auteur === 'object' && video.auteur.nom && video.auteur.prenom ? (
                      `${video.auteur.prenom} ${video.auteur.nom}`
                    ) : (
                      video.auteur._id || video.auteur
                    )
                  ) : '—'}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Source</h4>
                <p>
                  {isYouTubeVideo ? (
                    <span style={{ color: '#ff0000', fontWeight: '600' }}>
                      <i className="fab fa-youtube"></i> YouTube
                    </span>
                  ) : isVimeoVideo ? (
                    <span style={{ color: '#1ab7ea', fontWeight: '600' }}>
                      <i className="fab fa-vimeo"></i> Vimeo
                    </span>
                  ) : isLocalVideo ? (
                    <span style={{ color: '#2196f3', fontWeight: '600' }}>
                      <i className="fas fa-upload"></i> Uploaded file
                    </span>
                  ) : (
                    <span style={{ color: '#555', fontWeight: '600' }}>
                      <i className="fas fa-link"></i> External URL
                    </span>
                  )}
                </p>
              </div>

              {video.meta?.tags && video.meta.tags.length > 0 && (
                <div className={styles.detailItem}>
                  <h4>Tags</h4>
                  <div className={styles.tagsList}>
                    {video.meta.tags.map((tag, index) => (
                      <span key={index} className={styles.tag}>
                        {tag}
                      </span>
                    ))}
                  </div>
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

export default VideoDetailModal;