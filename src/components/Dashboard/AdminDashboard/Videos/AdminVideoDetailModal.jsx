// src/components/admin/Videos/VideoDetailModal.jsx
import React from 'react';
import styles from './Videos.module.css';

const VideoDetailModal = ({ isOpen, onClose, video }) => {
  if (!isOpen || !video) return null;

  // Extract YouTube video ID
  const getYouTubeEmbedUrl = (url) => {
    try {
      if (!url) return null;
      
      const videoUrl = new URL(url);
      let videoId = '';
      
      if (videoUrl.hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      } else if (videoUrl.hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.substring(1);
      }
      
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (error) {
      return null;
    }
  };

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
          {embedUrl ? (
            <div className={styles.videoEmbed}>
              <iframe
                src={embedUrl}
                title={video.titre}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className={styles.videoUnavailable}>
              <i className="fas fa-film"></i>
              <p>Video preview unavailable</p>
              {video.youtubeUrl && (
                <a 
                  href={video.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Open on YouTube <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}
          
          <div className={styles.videoDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.videoTypeBadges}>
                <div className={styles.videoType}>{video.type}</div>
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
                <p>{video.vues || 0} views</p>
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
                <h4>YouTube URL</h4>
                <p className={styles.youtubeUrl}>
                  <a 
                    href={video.youtubeUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {video.youtubeUrl} <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>ID</h4>
                <p className={styles.videoId}>{video._id}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Added by</h4>
                <p>
                  {video.auteur ? (
                    video.auteur.nom && video.auteur.prenom ? (
                      `${video.auteur.prenom} ${video.auteur.nom}`
                    ) : (
                      video.auteur._id || video.auteur
                    )
                  ) : '—'}
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