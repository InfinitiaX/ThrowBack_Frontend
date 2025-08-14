import React, { useState, useEffect } from 'react';
import styles from './LiveThrowback.module.css';

const LiveStreamDetailModal = ({ 
  isOpen, 
  onClose, 
  livestream, 
  onStartStream, 
  onEndStream, 
  onCancelStream,
  onEditStream,
  apiBaseUrl
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [isPlaying, setIsPlaying] = useState(false);
  const [videoIndex, setVideoIndex] = useState(0);
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [localLivestream, setLocalLivestream] = useState(null);
  
  // Utiliser l'URL de base passée en prop ou l'URL par défaut
  const baseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  
  // Réinitialiser les états lorsque le livestream change
  useEffect(() => {
    setIsPlaying(false);
    setVideoIndex(0);
    setLocalLivestream(livestream);
  }, [livestream]);
  
  // Charger les commentaires pour l'onglet modération
  const fetchComments = async () => {
    if (!localLivestream) return;
    
    try {
      setLoadingComments(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification non trouvé");
        setLoadingComments(false);
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${localLivestream._id}/comments`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setComments(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur API:', errorData.message || 'Échec de la récupération des commentaires');
      }
    } catch (error) {
      console.error('Erreur lors du chargement des commentaires:', error);
    } finally {
      setLoadingComments(false);
    }
  };
  
  // Charger les commentaires au changement d'onglet
  useEffect(() => {
    if (localLivestream && activeTab === 'moderation') {
      fetchComments();
    }
  }, [localLivestream, activeTab]);
  
  if (!isOpen || !localLivestream) return null;

  // Formater la date
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  };

  // Formater la durée totale
  const formatTotalDuration = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${remainingSeconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    } else {
      return `${remainingSeconds}s`;
    }
  };

  // Obtenir le badge de statut avec couleur appropriée
  const getStatusBadge = (status) => {
    const statusConfig = {
      'SCHEDULED': { 
        label: 'Programmé', 
        bgColor: '#3498db', 
        icon: 'fa-calendar-alt' 
      },
      'LIVE': { 
        label: 'En direct', 
        bgColor: '#e74c3c', 
        icon: 'fa-broadcast-tower' 
      },
      'COMPLETED': { 
        label: 'Terminé', 
        bgColor: '#2ecc71', 
        icon: 'fa-check-circle' 
      },
      'CANCELLED': { 
        label: 'Annulé', 
        bgColor: '#7f8c8d', 
        icon: 'fa-times-circle' 
      }
    };

    const config = statusConfig[status] || statusConfig['SCHEDULED'];
    
    return (
      <span 
        className={styles.statusBadge} 
        style={{ backgroundColor: config.bgColor }}
      >
        <i className={`fas ${config.icon}`}></i> {config.label}
      </span>
    );
  };

  // Vérifier si c'est une compilation de vidéos
  const isCompilation = localLivestream.compilationType === 'VIDEO_COLLECTION' && 
                      Array.isArray(localLivestream.compilationVideos) && 
                      localLivestream.compilationVideos.length > 0;

  // Gérer le lancement de la lecture d'aperçu
  const handlePlayPreview = () => {
    setIsPlaying(true);
  };

  // Gérer le changement de vidéo dans la prévisualisation
  const handleVideoChange = (index) => {
    if (index >= 0 && index < (localLivestream.compilationVideos?.length || 0)) {
      setVideoIndex(index);
    }
  };

  // Obtenir l'URL de l'iframe selon la source de la vidéo
  const getEmbedUrl = (video) => {
    if (!video) return '';
    
    switch (video.sourceType) {
      case 'YOUTUBE':
        return `https://www.youtube.com/embed/${video.sourceId}?autoplay=1`;
      case 'VIMEO':
        return `https://player.vimeo.com/video/${video.sourceId}?autoplay=1`;
      case 'DAILYMOTION':
        return `https://www.dailymotion.com/embed/video/${video.sourceId}?autoplay=1`;
      default:
        return '';
    }
  };
  
  // Supprimer un commentaire
  const handleDeleteComment = async (commentId) => {
    if (!localLivestream || !commentId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification non trouvé");
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${localLivestream._id}/comments/${commentId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // Mettre à jour l'UI
        setComments(prev => prev.filter(comment => comment._id !== commentId));
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la suppression');
      }
    } catch (error) {
      console.error('Erreur lors de la suppression du commentaire:', error);
    }
  };

  // Bannir un utilisateur
  const handleBanUser = async (userId) => {
    if (!localLivestream || !userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification non trouvé");
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${localLivestream._id}/ban-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userId })
      });
      
      if (response.ok) {
        // Mettre à jour l'UI
        setComments(prev => prev.filter(comment => comment.userId?._id !== userId));
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec du bannissement');
      }
    } catch (error) {
      console.error('Erreur lors du bannissement de l\'utilisateur:', error);
    }
  };

  // Mettre à jour les paramètres du chat
  const updateChatSettings = async (chatEnabled) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification non trouvé");
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/livestreams/${localLivestream._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ chatEnabled })
      });
      
      if (response.ok) {
        // Mise à jour locale du livestream
        setLocalLivestream({
          ...localLivestream,
          chatEnabled
        });
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        console.error('Erreur lors de la mise à jour des paramètres du chat:', errorData.message);
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour des paramètres du chat:', error);
    }
  };

  // Rendre l'aperçu de la compilation
  const renderCompilationPreview = () => {
    if (!isCompilation) {
      return (
        <div className={styles.noCompilationData}>
          <i className="fas fa-exclamation-circle"></i>
          <p>Aucune donnée de compilation disponible</p>
        </div>
      );
    }

    const currentVideo = localLivestream.compilationVideos[videoIndex];

    return (
      <div className={styles.compilationPreview}>
        {isPlaying ? (
          <div className={styles.embedPlayer}>
            {localLivestream.status === 'LIVE' ? (
              <iframe 
                src={localLivestream.playbackUrl || getEmbedUrl(currentVideo)} 
                title={currentVideo?.title || localLivestream.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className={styles.previewPlayer}>
                <iframe 
                  src={getEmbedUrl(currentVideo)} 
                  title={currentVideo?.title || localLivestream.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
                <div className={styles.previewNote}>
                  <i className="fas fa-info-circle"></i> 
                  <span>Aperçu de la vidéo {videoIndex + 1}/{localLivestream.compilationVideos.length}. La compilation complète sera diffusée en direct.</span>
                </div>
                {localLivestream.compilationVideos.length > 1 && (
                  <div className={styles.previewControls}>
                    <button
                      onClick={() => handleVideoChange(videoIndex - 1)}
                      disabled={videoIndex === 0}
                      className={styles.previewControlButton}
                    >
                      <i className="fas fa-step-backward"></i>
                    </button>
                    <button
                      onClick={() => handleVideoChange(videoIndex + 1)}
                      disabled={videoIndex === localLivestream.compilationVideos.length - 1}
                      className={styles.previewControlButton}
                    >
                      <i className="fas fa-step-forward"></i>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div 
            className={styles.previewThumbnail}
            onClick={handlePlayPreview}
          >
            <img 
              src={currentVideo?.thumbnailUrl || localLivestream.thumbnailUrl || '/images/live-default.jpg'} 
              alt={localLivestream.title}
              onError={(e) => {
                e.target.src = '/images/live-default.jpg';
              }}
            />
            <div className={styles.playButton}>
              <i className="fas fa-play"></i>
            </div>
            {localLivestream.compilationVideos.length > 1 && (
              <div className={styles.videoCounter}>
                {videoIndex + 1}/{localLivestream.compilationVideos.length}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  // Rendre l'onglet de modération
  const renderModerationTab = () => {
    return (
      <div className={styles.moderationTab}>
        <h3 className={styles.tabTitle}>Modération du chat en direct</h3>
        
        {localLivestream.chatEnabled ? (
          <>
            <div className={styles.moderationControls}>
              <button 
                className={styles.moderationButton}
                onClick={() => updateChatSettings(false)}
              >
                <i className="fas fa-comment-slash"></i> Désactiver le chat
              </button>
              
              <button 
                className={styles.refreshButton}
                onClick={fetchComments}
                disabled={loadingComments}
              >
                <i className={`fas ${loadingComments ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i> 
                {loadingComments ? 'Chargement...' : 'Rafraîchir'}
              </button>
            </div>
            
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <div className={styles.noComments}>
                  <i className="fas fa-comments"></i>
                  <p>Aucun commentaire pour le moment</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div key={comment._id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentUser}>
                        <img 
                          src={comment.userId?.photo_profil || '/images/default-avatar.jpg'} 
                          alt={comment.userId?.nom || 'Utilisateur'} 
                          className={styles.commentAvatar}
                          onError={(e) => {
                            e.target.src = '/images/default-avatar.jpg';
                          }}
                        />
                        <span className={styles.commentUsername}>
                          {comment.userId?.nom ? `${comment.userId.prenom} ${comment.userId.nom}` : 'Utilisateur inconnu'}
                        </span>
                      </div>
                      <div className={styles.commentActions}>
                        <button 
                          className={styles.commentActionButton}
                          onClick={() => handleDeleteComment(comment._id)}
                          title="Supprimer ce commentaire"
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                        <button 
                          className={styles.commentActionButton}
                          onClick={() => handleBanUser(comment.userId?._id)}
                          title="Bannir cet utilisateur"
                        >
                          <i className="fas fa-ban"></i>
                        </button>
                      </div>
                    </div>
                    <div className={styles.commentContent}>
                      {comment.content}
                    </div>
                    <div className={styles.commentTimestamp}>
                      {new Date(comment.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className={styles.chatDisabled}>
            <div className={styles.chatDisabledIcon}>
              <i className="fas fa-comment-slash"></i>
            </div>
            <p>Le chat est actuellement désactivé</p>
            <button 
              className={styles.enableChatButton}
              onClick={() => updateChatSettings(true)}
            >
              <i className="fas fa-comment"></i> Activer le chat
            </button>
          </div>
        )}
      </div>
    );
  };
  
  // Rendre l'onglet d'information
  const renderInfoTab = () => {
    return (
      <div className={styles.infoTab}>
        {renderCompilationPreview()}
        
        <div className={styles.livestreamDetails}>
          <div className={styles.detailsHeader}>
            <h3>{localLivestream.title}</h3>
            {getStatusBadge(localLivestream.status)}
          </div>
          
          <div className={styles.detailsContent}>
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Débute le</div>
              <div className={styles.detailValue}>{formatDate(localLivestream.startDate)}</div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Se termine le</div>
              <div className={styles.detailValue}>{formatDate(localLivestream.endDate)}</div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Durée totale</div>
              <div className={styles.detailValue}>
                {localLivestream.totalDuration ? formatTotalDuration(localLivestream.totalDuration) : 'Non définie'}
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Catégorie</div>
              <div className={styles.detailValue}>
                {localLivestream.category?.replace(/_/g, ' ') || 'Non définie'}
              </div>
            </div>
            
            <div className={styles.detailRow}>
              <div className={styles.detailLabel}>Hôte</div>
              <div className={styles.detailValue}>{localLivestream.hostName || 'ThrowBack'}</div>
            </div>
            
            {localLivestream.description && (
              <div className={styles.detailDescription}>
                <h4>Description</h4>
                <p>{localLivestream.description}</p>
              </div>
            )}
            
            {localLivestream.tags && localLivestream.tags.length > 0 && (
              <div className={styles.detailTags}>
                {Array.isArray(localLivestream.tags) ? 
                  localLivestream.tags.map((tag, idx) => (
                    <span key={idx} className={styles.tag}>#{tag}</span>
                  )) : 
                  localLivestream.tags.split(',').map((tag, idx) => (
                    <span key={idx} className={styles.tag}>#{tag.trim()}</span>
                  ))
                }
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Rendre l'onglet de contrôle
  const renderControlTab = () => {
    const canStart = localLivestream.status === 'SCHEDULED';
    const canEnd = localLivestream.status === 'LIVE';
    const canEdit = localLivestream.status === 'SCHEDULED';
    const canCancel = localLivestream.status === 'SCHEDULED';
    
    return (
      <div className={styles.controlTab}>
        <h3 className={styles.tabTitle}>Contrôles du direct</h3>
        
        <div className={styles.controlButtons}>
          {canStart && (
            <button 
              className={`${styles.controlButton} ${styles.startButton}`}
              onClick={() => onStartStream(localLivestream._id)}
            >
              <i className="fas fa-play-circle"></i>
              Démarrer le direct
            </button>
          )}
          
          {canEnd && (
            <button 
              className={`${styles.controlButton} ${styles.endButton}`}
              onClick={() => onEndStream(localLivestream._id)}
            >
              <i className="fas fa-stop-circle"></i>
              Terminer le direct
            </button>
          )}
          
          {canEdit && (
            <button 
              className={`${styles.controlButton} ${styles.editButton}`}
              onClick={() => onEditStream(localLivestream)}
            >
              <i className="fas fa-edit"></i>
              Modifier
            </button>
          )}
          
          {canCancel && (
            <button 
              className={`${styles.controlButton} ${styles.cancelButton}`}
              onClick={() => onCancelStream(localLivestream._id)}
            >
              <i className="fas fa-times-circle"></i>
              Annuler
            </button>
          )}
        </div>
        
        <div className={styles.streamSettings}>
          <h4>Paramètres du direct</h4>
          
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>Chat</div>
            <div className={styles.settingValue}>
              <div className={styles.toggleSwitch}>
                <input 
                  type="checkbox" 
                  id="chatToggle" 
                  checked={localLivestream.chatEnabled} 
                  onChange={() => updateChatSettings(!localLivestream.chatEnabled)} 
                />
                <label htmlFor="chatToggle"></label>
              </div>
            </div>
          </div>
          
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>Lecture en boucle</div>
            <div className={styles.settingValue}>
              <div className={styles.toggleValue}>
                {localLivestream.loop ? 'Activée' : 'Désactivée'}
              </div>
            </div>
          </div>
          
          <div className={styles.settingRow}>
            <div className={styles.settingLabel}>Visibilité</div>
            <div className={styles.settingValue}>
              <div className={styles.toggleValue}>
                {localLivestream.isPublic ? 'Public' : 'Privé'}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <div className={styles.modalTabs}>
            <button 
              className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('info')}
            >
              <i className="fas fa-info-circle"></i> Informations
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'control' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('control')}
            >
              <i className="fas fa-sliders-h"></i> Contrôles
            </button>
            <button 
              className={`${styles.tabButton} ${activeTab === 'moderation' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('moderation')}
            >
              <i className="fas fa-shield-alt"></i> Modération
            </button>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'control' && renderControlTab()}
          {activeTab === 'moderation' && renderModerationTab()}
        </div>
      </div>
    </div>
  );
};

export default LiveStreamDetailModal;