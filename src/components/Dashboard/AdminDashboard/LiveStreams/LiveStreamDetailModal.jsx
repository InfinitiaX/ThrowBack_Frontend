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
        console.error('API Error:', errorData.message || 'Failed to fetch comments');
      }
    } catch (error) {
      console.error('Error loading comments:', error);
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
    if (!dateString) return 'Not defined';
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
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  // Formater la durée totale
  const formatTotalDuration = (seconds) => {
    if (!seconds) return '0s';
    
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
        label: 'Program', 
        bgColor: '#3498db', 
        icon: 'fa-calendar-alt' 
      },
      'LIVE': { 
        label: 'Live', 
        bgColor: '#e74c3c', 
        icon: 'fa-broadcast-tower' 
      },
      'COMPLETED': { 
        label: 'Finished', 
        bgColor: '#2ecc71', 
        icon: 'fa-check-circle' 
      },
      'CANCELLED': { 
        label: 'Cancelled', 
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
        console.error("Authentication token not found");
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
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Deletion failed');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  // Bannir un utilisateur
  const handleBanUser = async (userId) => {
    if (!localLivestream || !userId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Authentication token not found");
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
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed ban');
      }
    } catch (error) {
      console.error('Error banning user:', error);
    }
  };

  // Mettre à jour les paramètres du chat
  const updateChatSettings = async (chatEnabled) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Authentication token not found");
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
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        console.error('Error updating chat settings:', errorData.message);
      }
    } catch (error) {
      console.error('Error updating chat settings:', error);
    }
  };

  // Rendre l'aperçu de la compilation
  const renderCompilationPreview = () => {
    if (!isCompilation) {
      return (
        <div className={styles.noCompilationData}>
          <i className="fas fa-exclamation-circle"></i>
          <p>No compilation data available</p>
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
                  <span>Preview video {videoIndex + 1}/{localLivestream.compilationVideos.length}. The full compilation will be broadcast live.</span>
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
        <h3 className={styles.tabTitle}>Live chat moderation</h3>
        
        {localLivestream.chatEnabled ? (
          <>
            <div className={styles.moderationControls}>
              <button 
                className={styles.moderationButton}
                onClick={() => updateChatSettings(false)}
              >
                <i className="fas fa-comment-slash"></i> Disable chat
              </button>
              
              <button 
                className={styles.refreshButton}
                onClick={fetchComments}
                disabled={loadingComments}
              >
                <i className={`fas ${loadingComments ? 'fa-spinner fa-spin' : 'fa-sync'}`}></i> 
                {loadingComments? 'Loading...': 'Refresh'}
              </button>
            </div>
            
            <div className={styles.commentsList}>
              {comments.length > 0 ? comments.map(comment => (
                <div key={comment._id} className={styles.moderationCommentItem}>
                  <div className={styles.commentInfo}>
                    <img 
                      src={comment.userId?.photo_profil || '/images/default-user.jpg'} 
                      alt={comment.userId?.prenom || 'User'} 
                      className={styles.commentAvatar}
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = '/images/default-user.jpg';
                      }}
                    />
                    <div className={styles.commentText}>
                      <div className={styles.commentAuthor}>
                        {comment.userId?.prenom} {comment.userId?.nom}
                        <span className={styles.commentTime}>
                          {formatDate(comment.createdAt)}
                        </span>
                      </div>
                      <p>{comment.content}</p>
                    </div>
                  </div>
                  
                  <div className={styles.moderationActions}>
                    <button 
                      className={styles.deleteCommentButton}
                      onClick={() => handleDeleteComment(comment._id)}
                      title="Delete this comment"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                    
                    <button 
                      className={styles.banUserButton}
                      onClick={() => handleBanUser(comment.userId?._id)}
                      title="Block this user"
                    >
                      <i className="fas fa-user-slash"></i>
                    </button>
                  </div>
                </div>
              )) : (
                <div className={styles.noComments}>
                  <i className="fas fa-comments"></i>
                  <p>No comments yet</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className={styles.chatDisabled}>
            <i className="fas fa-comment-slash"></i>
            <p>Le chat est actuellement désactivé</p>
            <button 
              className={styles.enableChatButton}
              onClick={() => updateChatSettings(true)}
            >
              <i className="fas fa-comment"></i> Enable chat
            </button>
          </div>
        )}
      </div>
    );
  };

  // Rendre l'onglet actif
  const renderTabContent = () => {
    switch (activeTab) {
      case 'videos':
        return (
          <div className={styles.videosTab}>
            <h3 className={styles.tabTitle}>
              Compilation videos
              <span className={styles.videoCount}>
                {isCompilation ? localLivestream.compilationVideos.length : 0} videos
              </span>
            </h3>
            
            {isCompilation ? (
              <div className={styles.compilationVideosList}>
                {localLivestream.compilationVideos.map((video, index) => (
                  <div 
                    key={`${video.sourceId}-${index}`} 
                    className={`${styles.compilationVideoItem} ${index === videoIndex ? styles.activeVideo : ''}`}
                    onClick={() => { setVideoIndex(index); setIsPlaying(true); }}
                  >
                    <div className={styles.videoOrderBadge}>{index + 1}</div>
                    <div className={styles.compilationVideoThumbnail}>
                      <img 
                        src={video.thumbnailUrl || '/images/video-placeholder.jpg'} 
                        alt={video.title}
                        onError={(e) => {
                          e.target.src = '/images/video-placeholder.jpg';
                        }}
                      />
                      <span className={styles.compilationVideoDuration}>
                        {video.duration || '0:00'}
                      </span>
                    </div>
                    <div className={styles.compilationVideoInfo}>
                      <h4 className={styles.compilationVideoTitle}>{video.title}</h4>
                      <p className={styles.compilationVideoSource}>
                        {video.sourceType === 'YOUTUBE' && <i className="fab fa-youtube"></i>}
                        {video.sourceType === 'VIMEO' && <i className="fab fa-vimeo-v"></i>}
                        {video.sourceType === 'DAILYMOTION' && <i className="fas fa-play-circle"></i>}
                        <span>{video.channel || 'Chaîne inconnue'}</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noVideosMessage}>
                <i className="fas fa-film"></i>
                <p>No videos in this compilation</p>
              </div>
            )}
          </div>
        );
      
      case 'stats':
        return (
          <div className={styles.statsTab}>
            <h3 className={styles.tabTitle}>Statistics</h3>
            
            {localLivestream.status === 'LIVE' || localLivestream.status === 'COMPLETED' ? (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Max spectators</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.maxConcurrentViewers || 0}</div>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Unique spectators</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.totalUniqueViewers || 0}</div>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Viewing time</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.totalViewDuration || 0} min</div>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Messages chat</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.chatMessages || 0}</div>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Likes</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.likes || 0}</div>
                </div>
                
                <div className={styles.statItem}>
                  <div className={styles.statLabel}>Shares</div>
                  <div className={styles.statValue}>{localLivestream.statistics?.shares || 0}</div>
                </div>
              </div>
            ) : (
              <div className={styles.noStatsMessage}>
                <i className="fas fa-chart-bar"></i>
                <p>Statistics will be available once the live stream starts</p>
              </div>
            )}
            
            {localLivestream.status === 'COMPLETED' && localLivestream.recordedVideoId && (
              <div className={styles.recordedVideoLink}>
                <h4>Recording available</h4>
                <a href={`/dashboard/videos/${localLivestream.recordedVideoId}`} className={styles.recordedVideoButton}>
                  <i className="fas fa-play-circle"></i> View the recording
                </a>
              </div>
            )}
          </div>
        );
      
      case 'settings':
        return (
          <div className={styles.settingsTab}>
            <h3 className={styles.tabTitle}>Parametres</h3>
            
            <div className={styles.settingsSection}>
              <h4>Playback setup</h4>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Loop playback</div>
                  <div className={styles.settingValue}>
                    {localLivestream.playbackConfig?.loop ? (
                      <span className={styles.enabledSetting}><i className="fas fa-check"></i> Active</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-times"></i> Disabled</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Shuffle Playback</div>
                  <div className={styles.settingValue}>
                    {localLivestream.playbackConfig?.shuffle ? (
                      <span className={styles.enabledSetting}><i className="fas fa-check"></i> Active</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-times"></i> Disable</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Transition</div>
                  <div className={styles.settingValue}>
                    {(() => {
                      const effect = localLivestream.playbackConfig?.transitionEffect || 'none';
                      const effects = {
                        'none': 'Aucune',
                        'fade': 'Fondu',
                        'slide': 'Glissement',
                        'zoom': 'Zoom',
                        'flip': 'Retournement'
                      };
                      return effects[effect] || effect;
                    })()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className={styles.settingsSection}>
              <h4>Live settings</h4>
              <div className={styles.settingsGrid}>
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Visibility</div>
                  <div className={styles.settingValue}>
                    {localLivestream.isPublic ? (
                      <span className={styles.enabledSetting}><i className="fas fa-globe"></i> Public</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-lock"></i> Prived</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Chat</div>
                  <div className={styles.settingValue}>
                    {localLivestream.chatEnabled ? (
                      <span className={styles.enabledSetting}><i className="fas fa-check"></i> Active</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-times"></i> Disable</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Moderation</div>
                  <div className={styles.settingValue}>
                    {localLivestream.moderationEnabled ? (
                      <span className={styles.enabledSetting}><i className="fas fa-check"></i> Active</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-times"></i> Disable</span>
                    )}
                  </div>
                </div>
                
                <div className={styles.settingItem}>
                  <div className={styles.settingLabel}>Saving</div>
                  <div className={styles.settingValue}>
                    {localLivestream.recordAfterStream ? (
                      <span className={styles.enabledSetting}><i className="fas fa-check"></i> Active</span>
                    ) : (
                      <span className={styles.disabledSetting}><i className="fas fa-times"></i> Disable</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {localLivestream.status === 'SCHEDULED' && localLivestream.streamKey && (
              <div className={styles.streamKeySection}>
                <h4>Streaming key</h4>
                <div className={styles.streamKeyContainer}>
                  <div className={styles.streamKeyDisplay}>
                    <span>{localLivestream.streamKey}</span>
                    <button 
                      className={styles.copyButton}
                      onClick={() => {
                        navigator.clipboard.writeText(localLivestream.streamKey);
                        alert('Clé de streaming copiée dans le presse-papier');
                      }}
                    >
                      <i className="fas fa-copy"></i> copy
                    </button>
                  </div>
                  <p className={styles.streamKeyNote}>
                    <i className="fas fa-info-circle"></i> This key will not be needed for LiveThrowback builds.
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      
      case 'moderation':
        return renderModerationTab();
      
      case 'info':
      default:
        return (
          <div className={styles.infoTab}>
            <div className={styles.mainInfo}>
              <div className={styles.infoHeader}>
                <h3>{localLivestream.title}</h3>
                {getStatusBadge(localLivestream.status)}
              </div>
              
              {renderCompilationPreview()}
              
              <div className={styles.infoDescription}>
                <h4>Description</h4>
                <p>{localLivestream.description || 'Aucune description fournie.'}</p>
              </div>
              
              <div className={styles.infoMeta}>
                <div className={styles.infoMetaItem}>
                  <i className="fas fa-user"></i> Host: {localLivestream.hostName}
                </div>
                
                <div className={styles.infoMetaItem}>
                  <i className="fas fa-calendar-alt"></i> Program: {formatDate(localLivestream.scheduledStartTime)}
                </div>
                
                <div className={styles.infoMetaItem}>
                  <i className="fas fa-clock"></i> Expected ending: {formatDate(localLivestream.scheduledEndTime)}
                </div>
                
                <div className={styles.infoMetaItem}>
                  <i className="fas fa-tag"></i> Category: {localLivestream.category ? localLivestream.category.replace(/_/g, ' ') : 'No defined'}
                </div>
                
                {isCompilation && (
                  <div className={styles.infoMetaItem}>
                    <i className="fas fa-film"></i> Compilation: {localLivestream.compilationVideos.length} vidoos
                  </div>
                )}
                
                {isCompilation && (
                  <div className={styles.infoMetaItem}>
                    <i className="fas fa-hourglass-half"></i> Total duration: {formatTotalDuration(localLivestream.totalCompilationDuration)}
                  </div>
                )}
                
                {localLivestream.tags && localLivestream.tags.length > 0 && (
                  <div className={styles.infoMetaItem}>
                    <i className="fas fa-tags"></i> Tags: 
                    <div className={styles.tagsList}>
                      {localLivestream.tags.map((tag, index) => (
                        <span key={index} className={styles.tag}>{tag}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentLarge}>
        <div className={styles.modalHeader}>
          <h3>LiveThrowback Details</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalTabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'info' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <i className="fas fa-info-circle"></i> Informations
          </button>
          
          <button 
            className={`${styles.tabButton} ${activeTab === 'videos' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('videos')}
          >
            <i className="fas fa-film"></i> Videos
          </button>
          
          <button 
            className={`${styles.tabButton} ${activeTab === 'stats' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <i className="fas fa-chart-bar"></i> Statistics
          </button>
          
          <button 
            className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <i className="fas fa-cog"></i> Settings
          </button>

          <button 
            className={`${styles.tabButton} ${activeTab === 'moderation' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('moderation')}
          >
            <i className="fas fa-shield-alt"></i> Moderation
          </button>
        </div>
        
        <div className={styles.modalBody}>
          {renderTabContent()}
        </div>
        
        <div className={styles.modalFooter}>
          <div className={styles.modalActions}>
            {localLivestream.status === 'SCHEDULED' && (
              <>
                <button 
                  className={styles.startStreamButton}
                  onClick={() => onStartStream(localLivestream._id)}
                >
                  <i className="fas fa-play"></i> Start streaming
                </button>
                
                <button 
                  className={styles.editStreamButton}
                  onClick={() => onEditStream(localLivestream)}
                >
                  <i className="fas fa-edit"></i> Edit
                </button>
                
                <button 
                  className={styles.cancelStreamButton}
                  onClick={() => onCancelStream(localLivestream._id)}
                >
                  <i className="fas fa-times"></i> Cancel
                </button>
              </>
            )}
            
            {localLivestream.status === 'LIVE' && (
              <button 
                className={styles.endStreamButton}
                onClick={() => onEndStream(localLivestream._id)}
              >
                <i className="fas fa-stop"></i> End the broadcast
              </button>
            )}
          </div>
          
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

export default LiveStreamDetailModal;