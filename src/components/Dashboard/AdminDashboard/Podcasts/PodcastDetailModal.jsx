import React from 'react';
import styles from './Podcasts.module.css';

const PodcastDetailModal = ({ isOpen, onClose, podcast }) => {
  if (!isOpen || !podcast) return null;

  // Extraire l'ID Vimeo à partir de l'URL
  const getVimeoEmbedUrl = (url) => {
    try {
      if (!url) return null;
      
      const vimeoUrl = new URL(url);
      let vimeoId = '';
      
      if (vimeoUrl.hostname.includes('vimeo.com')) {
        // Format: https://vimeo.com/123456789
        const pathParts = vimeoUrl.pathname.split('/').filter(Boolean);
        vimeoId = pathParts[0];
      } else if (vimeoUrl.hostname.includes('player.vimeo.com')) {
        // Format: https://player.vimeo.com/video/123456789
        const pathParts = vimeoUrl.pathname.split('/').filter(Boolean);
        if (pathParts[0] === 'video') {
          vimeoId = pathParts[1];
        }
      }
      
      return vimeoId ? `https://player.vimeo.com/video/${vimeoId}` : null;
    } catch (error) {
      console.error('Erreur lors de l\'extraction de l\'URL d\'intégration Vimeo:', error);
      return null;
    }
  };

  // Formater l'épisode (EP.01)
  const formatEpisode = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  const embedUrl = getVimeoEmbedUrl(podcast.vimeoUrl);
  
  // Gestion des dates
  const formattedDate = podcast.publishDate ? new Date(podcast.publishDate).toLocaleDateString() : 'Non définie';
  const createdDate = podcast.createdAt ? new Date(podcast.createdAt).toLocaleDateString() : 'Non définie';

  // Obtenir une couleur pour une catégorie
  const getCategoryColor = (category) => {
    const categoryColors = {
      'PERSONAL BRANDING': '#4c6ef5',
      'MUSIC BUSINESS': '#40c057',
      'ARTIST INTERVIEW': '#fa5252',
      'INDUSTRY INSIGHTS': '#be4bdb',
      'THROWBACK HISTORY': '#fd7e14',
      'OTHER': '#868e96'
    };
    
    return categoryColors[category] || '#868e96';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{podcast.title}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.podcastDetailContent}>
          {embedUrl ? (
            <div className={styles.podcastEmbed}>
              <iframe
                src={embedUrl}
                title={podcast.title}
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            <div className={styles.podcastUnavailable}>
              <i className="fas fa-podcast"></i>
              <p>Aperçu du podcast non disponible</p>
              {podcast.vimeoUrl && (
                <a 
                  href={podcast.vimeoUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.externalLink}
                >
                  Ouvrir sur Vimeo <i className="fas fa-external-link-alt"></i>
                </a>
              )}
            </div>
          )}
          
          <div className={styles.podcastDetails}>
            <div className={styles.detailHeader}>
              <div className={styles.podcastTypeBadges}>
                <div 
                  className={styles.podcastCategory}
                  style={{ backgroundColor: getCategoryColor(podcast.category) }}
                >
                  {podcast.category}
                </div>
                <div className={styles.podcastEpisode}>
                  {formatEpisode(podcast.episode)}
                </div>
                <div className={styles.podcastSeason}>
                  Saison {podcast.season}
                </div>
                {!podcast.isPublished && (
                  <div className={styles.unpublishedBadge}>
                    <i className="fas fa-eye-slash"></i> Non publié
                  </div>
                )}
              </div>
              <div className={styles.podcastAddedOn}>
                Publié le {formattedDate}
              </div>
            </div>
            
            <div className={styles.detailsGrid}>
              <div className={styles.detailItem}>
                <h4>Titre</h4>
                <p>{podcast.title}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Épisode</h4>
                <p>{formatEpisode(podcast.episode)}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Saison</h4>
                <p>{podcast.season}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Invité</h4>
                <p>{podcast.guestName || '—'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Hôte</h4>
                <p>{podcast.hostName || 'Mike Levis'}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Durée</h4>
                <p>{podcast.duration} minutes</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Catégorie</h4>
                <p>
                  <span 
                    style={{ 
                      color: getCategoryColor(podcast.category),
                      fontWeight: '600'
                    }}
                  >
                    {podcast.category}
                  </span>
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Date de publication</h4>
                <p>{formattedDate}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Date de création</h4>
                <p>{createdDate}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Statut</h4>
                <p>
                  {podcast.isPublished ? (
                    <span style={{ color: '#4caf50' }}>
                      <i className="fas fa-check-circle"></i> Publié
                    </span>
                  ) : (
                    <span style={{ color: '#f44336' }}>
                      <i className="fas fa-eye-slash"></i> Non publié
                    </span>
                  )}
                </p>
              </div>

              <div className={styles.detailItem}>
                <h4>Vues</h4>
                <p>{podcast.viewCount || 0}</p>
              </div>

              <div className={styles.detailItem}>
                <h4>Likes</h4>
                <p>{podcast.likeCount || 0}</p>
              </div>

              {podcast.topics && podcast.topics.length > 0 && (
                <div className={styles.detailItem}>
                  <h4>Topics</h4>
                  <div className={styles.topicsList}>
                    {podcast.topics.map((topic, index) => (
                      <span key={index} className={styles.topicTag}>
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.detailItem} style={{ gridColumn: "1 / -1" }}>
                <h4>Description</h4>
                <p className={styles.description}>
                  {podcast.description || '—'}
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>URL Vimeo</h4>
                <p className={styles.vimeoUrl}>
                  <a 
                    href={podcast.vimeoUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    {podcast.vimeoUrl} <i className="fas fa-external-link-alt"></i>
                  </a>
                </p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>ID</h4>
                <p className={styles.podcastId}>{podcast._id}</p>
              </div>
              
              <div className={styles.detailItem}>
                <h4>Créé par</h4>
                <p>
                  {podcast.author ? (
                    podcast.author.nom && podcast.author.prenom ? (
                      `${podcast.author.prenom} ${podcast.author.nom}`
                    ) : (
                      podcast.author._id || podcast.author
                    )
                  ) : '—'}
                </p>
              </div>
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

export default PodcastDetailModal;