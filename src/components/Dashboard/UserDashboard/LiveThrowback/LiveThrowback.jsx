import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faEye, 
  faShare, 
  faHeartBroken,
  faExclamationTriangle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import CommentSection from './CommentSection';
import VideoPlayer from '../../../Common/VideoPlayer';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';

// Cache utilitaire pour réduire les appels API
const cache = {
  data: {},
  get: (key) => cache.data[key],
  set: (key, value, ttl = 60000) => {
    cache.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  isValid: (key) => {
    const item = cache.data[key];
    return item && item.expiry > Date.now();
  },
  clear: (key) => {
    if (key) {
      delete cache.data[key];
    } else {
      cache.data = {};
    }
  }
};

// Niveau de log configurable
const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';

// Fonction de log personnalisée
const logger = {
  debug: (...args) => LOG_LEVEL === 'debug' && console.log(...args),
  info: (...args) => ['debug', 'info'].includes(LOG_LEVEL) && console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

const LiveThrowback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [comment, setComment] = useState('');
  const [chatDisabled, setChatDisabled] = useState(false);
  const videoRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Fonction pour vérifier si le stream est encore valide
  const isStreamValid = (stream) => {
    if (!stream) return false;
    
    const now = new Date();
    const endTime = new Date(stream.scheduledEndTime);
    const startTime = new Date(stream.scheduledStartTime);
    
    // Vérifications de base
    if (stream.status !== 'LIVE') return false;
    if (endTime <= now) return false;
    if (startTime > now) return false;
    
    return true;
  };

  // Extraire l'ID YouTube depuis une URL
  const extractYoutubeId = (url) => {
    if (!url) return null;
    
    // Formats : youtu.be/ID ou youtube.com/watch?v=ID
    const shortPattern = /youtu\.be\/([^?&]+)/;
    const longPattern = /youtube\.com\/watch\?v=([^?&]+)/;
    
    const shortMatch = url.match(shortPattern);
    const longMatch = url.match(longPattern);
    
    return shortMatch ? shortMatch[1] : longMatch ? longMatch[1] : null;
  };

  // Fonction améliorée pour obtenir l'URL de lecture
  const getPlaybackUrl = () => {
    if (!currentStream) return '';
    
    // Vérifier que le stream est vraiment actif
    if (!isStreamValid(currentStream)) {
      logger.debug('Stream expired or not live');
      return '';
    }
    
    // Extraire les paramètres de configuration
    const loop = currentStream.playbackConfig?.loop !== false;
    const shuffle = currentStream.playbackConfig?.shuffle || false;
    const autoplay = currentStream.playbackConfig?.autoplay !== false;
    
    // 1. Compilation de vidéos 
    if (currentStream.compilationType === 'VIDEO_COLLECTION' && 
        currentStream.compilationVideos?.length > 0) {
      
      const videos = currentStream.compilationVideos;
      const currentIndex = currentStream.currentVideoIndex || 0;
      
      // Une seule vidéo : lecture en boucle
      if (videos.length === 1) {
        const video = videos[0];
        
        if (video.sourceType === 'YOUTUBE') {
          let url = `https://www.youtube.com/embed/${video.sourceId}?autoplay=${autoplay ? 1 : 0}`;
          if (loop) url += '&loop=1&playlist=' + video.sourceId; // Pour le loop sur une vidéo unique
          url += '&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=1&enablejsapi=1';
          url += '&origin=' + window.location.origin;
          return url;
        }
        
        if (video.sourceType === 'VIMEO') {
          let url = `https://player.vimeo.com/video/${video.sourceId}?autoplay=${autoplay ? 1 : 0}`;
          if (loop) url += '&loop=1';
          url += '&transparent=0&dnt=1&playsinline=1';
          return url;
        }
        
        if (video.sourceType === 'DAILYMOTION') {
          return `https://www.dailymotion.com/embed/video/${video.sourceId}?autoplay=${autoplay ? 1 : 0}`;
        }
      }
      
      // Plusieurs vidéos : playlist ou vidéo courante
      else {
        // Calculer la vidéo courante basée sur le temps écoulé
        const startTime = new Date(currentStream.actualStartTime || currentStream.scheduledStartTime);
        const now = new Date();
        const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
        const avgVideoDuration = 4; // minutes par vidéo
        const calculatedIndex = Math.floor(elapsedMinutes / avgVideoDuration) % videos.length;
        
        // Utiliser l'index calculé ou celui du serveur
        const videoIndex = currentStream.currentVideoIndex !== undefined ? 
                          currentStream.currentVideoIndex : calculatedIndex;
        
        const currentVideo = videos[videoIndex];
        
        // Si toutes les vidéos sont YouTube, créer une playlist
        if (videos.every(v => v.sourceType === 'YOUTUBE')) {
          const videoIds = videos.map(v => v.sourceId);
          let url = `https://www.youtube.com/embed/?playlist=${videoIds.join(',')}&autoplay=${autoplay ? 1 : 0}`;
          if (loop) url += '&loop=1';
          if (shuffle) url += '&shuffle=1';
          url += `&index=${videoIndex + 1}&rel=0&showinfo=0&modestbranding=1&enablejsapi=1`;
          url += '&origin=' + window.location.origin;
          return url;
        }
        
        // Sinon, jouer la vidéo courante
        if (currentVideo && currentVideo.sourceType === 'YOUTUBE') {
          let url = `https://www.youtube.com/embed/${currentVideo.sourceId}?autoplay=${autoplay ? 1 : 0}`;
          url += '&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=1&enablejsapi=1';
          url += '&origin=' + window.location.origin;
          return url;
        }
        
        if (currentVideo && currentVideo.sourceType === 'VIMEO') {
          let url = `https://player.vimeo.com/video/${currentVideo.sourceId}?autoplay=${autoplay ? 1 : 0}`;
          url += '&transparent=0&dnt=1&playsinline=1';
          return url;
        }
        
        if (currentVideo && currentVideo.sourceType === 'DAILYMOTION') {
          return `https://www.dailymotion.com/embed/video/${currentVideo.sourceId}?autoplay=${autoplay ? 1 : 0}`;
        }
      }
    }
    
    // 2. URL de lecture directe
    if (currentStream.playbackUrl) {
      return currentStream.playbackUrl;
    }
    
    // 3. URL YouTube directe
    if (currentStream.youtubeUrl) {
      const videoId = extractYoutubeId(currentStream.youtubeUrl);
      if (videoId) {
        let url = `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}`;
        if (loop) url += '&loop=1&playlist=' + videoId;
        url += '&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3&fs=1&enablejsapi=1';
        url += '&origin=' + window.location.origin;
        return url;
      }
      return currentStream.youtubeUrl;
    }
    
    // 4. Code d'intégration
    if (currentStream.embedCode) {
      return currentStream.embedCode;
    }
    
    return '';
  };

  // Fonction pour mettre à jour automatiquement la progression
  const updateStreamProgress = () => {
    if (!currentStream || currentStream.compilationType !== 'VIDEO_COLLECTION') return;
    
    const videos = currentStream.compilationVideos;
    if (!videos || videos.length <= 1) return;
    
    const now = new Date();
    const startTime = new Date(currentStream.actualStartTime || currentStream.scheduledStartTime);
    const elapsedMinutes = Math.floor((now - startTime) / (1000 * 60));
    
    // Calculer l'index de la vidéo courante
    const avgVideoDuration = 4; // minutes
    const newIndex = Math.floor(elapsedMinutes / avgVideoDuration) % videos.length;
    
    // Mettre à jour l'index si nécessaire
    if (newIndex !== currentStream.currentVideoIndex) {
      setCurrentStream(prev => ({
        ...prev,
        currentVideoIndex: newIndex
      }));
      
      logger.debug(`Updated video index to ${newIndex}`);
    }
  };

  // Charger les livestreams actifs
  useEffect(() => {
    const fetchLiveStreams = async () => {
      const cacheKey = 'livestreams';
      
      // Utiliser le cache si disponible et valide
      if (cache.isValid(cacheKey)) {
        const cachedData = cache.get(cacheKey).value;
        logger.debug('Using cached livestreams data');
        
        // Filtrer les streams expirés même dans le cache
        const validStreams = cachedData.filter(isStreamValid);
        setLiveStreams(validStreams);
        
        if (validStreams.length > 0 && !currentStream) {
          setCurrentStream(validStreams[0]);
          setViewCount(validStreams[0].statistics?.totalUniqueViewers || 0);
          setLikeCount(validStreams[0].statistics?.likes || 0);
          setChatDisabled(validStreams[0].chatEnabled === false);
          if (user && validStreams[0].userLiked) {
            setLiked(true);
          }
        }
        
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        logger.debug('Fetching live streams...');
        
        // Utiliser l'API avec le paramètre activeOnly pour avoir seulement les streams actifs
        const response = await api.get('/api/user/livestreams?activeOnly=true');
        logger.debug('API response:', response.data);
        
        if (response.data && response.data.success) {
          const streams = response.data.data;
          
          // Double vérification côté client
          const validStreams = streams.filter(isStreamValid);
          logger.debug('Valid streams found:', validStreams.length);
          
          setLiveStreams(validStreams);
          cache.set(cacheKey, validStreams, 60000); // Cache pendant 1 minute seulement
          
          // Définir le premier stream comme courant s'il existe
          if (validStreams.length > 0) {
            logger.debug('Setting current stream:', validStreams[0].title);
            setCurrentStream(validStreams[0]);
            setViewCount(validStreams[0].statistics?.totalUniqueViewers || 0);
            setLikeCount(validStreams[0].statistics?.likes || 0);
            setChatDisabled(validStreams[0].chatEnabled === false);
            if (user && validStreams[0].userLiked) {
              setLiked(true);
            }
          } else {
            logger.debug('No valid streams found');
          }
        } else {
          logger.error('Invalid API response structure:', response.data);
          setError('Invalid API response format');
        }
        
        setLoading(false);
      } catch (error) {
        logger.error('Error fetching livestreams:', error);
        setError('Failed to load livestreams. Please try again later.');
        setLoading(false);
      }
    };

    fetchLiveStreams();
    
    // Rafraîchir plus souvent pour vérifier les streams expirés
    const interval = setInterval(fetchLiveStreams, 60000); // Toutes les minutes
    
    return () => clearInterval(interval);
  }, [user]);

  // Mise à jour des vues
  useEffect(() => {
    const updateViewCount = async () => {
      if (currentStream && user && isStreamValid(currentStream)) {
        try {
          // Utiliser la nouvelle API
          await api.get(`/api/user/livestreams/${currentStream._id}`);
          
          // Mettre à jour le compteur localement pour UX instantanée
          setViewCount(prev => prev + 1);
        } catch (error) {
          logger.error('Error updating view count:', error);
        }
      }
    };

    if (currentStream && isStreamValid(currentStream)) {
      updateViewCount();
    }
  }, [currentStream, user]);

  // useEffect pour mettre à jour la progression des compilations
  useEffect(() => {
    if (!currentStream || currentStream.compilationType !== 'VIDEO_COLLECTION') return;
    
    const progressInterval = setInterval(updateStreamProgress, 30000); // Toutes les 30 secondes
    
    return () => clearInterval(progressInterval);
  }, [currentStream]);

  // useEffect pour vérifier l'expiration du stream courant
  useEffect(() => {
    if (!currentStream) return;
    
    const checkExpiration = () => {
      if (!isStreamValid(currentStream)) {
        logger.debug('Current stream has expired');
        setError('Ce direct est terminé');
        setCurrentStream(null);
        // Recharger la liste des streams
        cache.clear();
        setTimeout(() => window.location.reload(), 2000);
      }
    };
    
    const expirationInterval = setInterval(checkExpiration, 10000); // Toutes les 10 secondes
    
    return () => clearInterval(expirationInterval);
  }, [currentStream]);

  // Gérer le like
  const handleLike = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (!isStreamValid(currentStream)) {
      setError('Ce direct n\'est plus actif');
      return;
    }

    try {
      if (!liked && currentStream) {
        // Mise à jour optimiste de l'UI
        setLiked(true);
        setLikeCount(prev => prev + 1);
        
        // Appel API
        await api.post(`/api/user/livestreams/${currentStream._id}/like`);
        logger.debug('Like added successfully');
      } else if (liked && currentStream) {
        // Dans un système réel, vous auriez une route pour supprimer le like
        // Pour l'instant, nous simulons localement
        setLiked(false);
        setLikeCount(prev => prev - 1);
      }
    } catch (error) {
      // Annuler les changements optimistes en cas d'erreur
      setLiked(!liked);
      setLikeCount(prev => liked ? prev - 1 : prev + 1);
      logger.error('Error toggling like:', error);
      
      if (error.response && error.response.status === 400) {
        setError('Ce direct n\'est plus actif');
      }
    }
  };

  // Gérer le partage
  const handleShare = async () => {
    if (!currentStream) return;

    // Créer l'URL de partage
    const shareUrl = `${window.location.origin}/dashboard/live/${currentStream._id}`;
    
    // Utiliser l'API Web Share si disponible
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentStream.title,
          text: `Check out this live stream: ${currentStream.title}`,
          url: shareUrl
        });
      } catch (error) {
        logger.error('Error sharing content:', error);
        // Fallback - copier dans le presse-papier
        copyToClipboard(shareUrl);
      }
    } else {
      // Fallback pour les navigateurs qui ne supportent pas l'API Web Share
      copyToClipboard(shareUrl);
    }
  };

  // Fonction utilitaire pour copier dans le presse-papier
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(err => {
        logger.error('Failed to copy link:', err);
      });
  };

  // Gérer l'envoi de commentaire
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!comment.trim() || !user || !currentStream) return;
    
    if (!isStreamValid(currentStream)) {
      setError('Ce direct n\'est plus actif');
      return;
    }
    
    // Déclarer messageContent dans une portée accessible au catch
    let messageContent = comment;
    
    try {
      setComment(''); // Vider le champ immédiatement
      
      // Utiliser l'API de LiveChat pour envoyer le message
      const response = await api.post(`/api/livechat/${currentStream._id}`, {
        content: messageContent
      });
      
      // Si la soumission réussit, forcer un rafraîchissement des commentaires
      if (response.data && response.data.success) {
        // Nettoyer le cache pour forcer un rafraîchissement
        cache.clear(`comments_${currentStream._id}_page_1`);
      }
    } catch (error) {
      logger.error('Error posting comment:', error);
      // Restaurer le commentaire en cas d'erreur
      setComment(messageContent);
      
      // Vérifier si l'erreur indique un bannissement ou une désactivation du chat
      if (error.response) {
        if (error.response.status === 403) {
          if (error.response.data?.message?.includes('chat est désactivé')) {
            setChatDisabled(true);
            setError('Le chat a été désactivé pour ce direct.');
          } else if (error.response.data?.message?.includes('banni')) {
            setError('Vous avez été banni de ce chat par le modérateur.');
          }
        } else if (error.response.status === 400) {
          setError('Ce direct n\'est plus actif');
        }
      }
    }
  };

  // Fonction pour afficher la progression des compilations
  const renderCompilationProgress = () => {
    if (!currentStream || 
        currentStream.compilationType !== 'VIDEO_COLLECTION' || 
        !currentStream.compilationVideos || 
        currentStream.compilationVideos.length <= 1) {
      return null;
    }
    
    const videos = currentStream.compilationVideos;
    const currentIndex = currentStream.currentVideoIndex || 0;
    const currentVideo = videos[currentIndex];
    
    return (
      <div className={styles.compilationProgress}>
        <div className={styles.progressInfo}>
          <span className={styles.videoTitle}>
            {currentVideo?.title || `Vidéo ${currentIndex + 1}`}
          </span>
          <span className={styles.videoCounter}>
            {currentIndex + 1} / {videos.length}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div 
            className={styles.progressFill}
            style={{ width: `${((currentIndex + 1) / videos.length) * 100}%` }}
          />
        </div>
      </div>
    );
  };

  // Vérifier si le stream actuel a une URL de lecture valide
  const hasValidPlaybackUrl = currentStream && isStreamValid(currentStream) && (
    currentStream.playbackUrl || 
    currentStream.youtubeUrl ||
    (currentStream.compilationVideos && 
     currentStream.compilationVideos.length > 0 &&
     (currentStream.compilationVideos[0].sourceId || 
      currentStream.compilationVideos[0].originalUrl))
  );

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => {
            cache.clear(); // Effacer le cache en cas d'erreur
            window.location.reload();
          }}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (liveStreams.length === 0) {
    return (
      <div className={styles.noStreamContainer}>
        <FontAwesomeIcon icon={faClock} className={styles.noStreamIcon} />
        <h2>No live streams available</h2>
        <p>There are no active ThrowBack compilations at the moment. Please check back later !</p>
        <button 
          className={styles.refreshButton}
          onClick={() => {
            cache.clear();
            window.location.reload();
          }}
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className={styles.liveThrowbackContainer}>
      <h1 className={styles.pageTitle}>Livethrowback</h1>
      
      <div className={styles.mainContent}>
        {/* Section vidéo à gauche */}
        <div className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            {currentStream && (
              <>
                <div className={styles.videoPlayer}>
                  {hasValidPlaybackUrl ? (
                    <VideoPlayer 
                      src={getPlaybackUrl()} 
                      poster={currentStream.thumbnailUrl || '/images/default-livestream.jpg'}
                      ref={videoRef}
                      autoPlay={currentStream.playbackConfig?.autoplay !== false}
                      muted={false}
                      controls={true}
                      loop={currentStream.playbackConfig?.loop !== false}
                    />
                  ) : (
                    <div className={styles.noVideoMessage}>
                      <p>This stream doesn't have a valid video URL.</p>
                    </div>
                  )}
                  
                  {/* Overlay si le stream est expiré */}
                  {!isStreamValid(currentStream) && (
                    <div className={styles.streamExpired}>
                      <FontAwesomeIcon icon={faExclamationTriangle} className={styles.expiredIcon} />
                      <div className={styles.expiredMessage}>Ce direct est terminé</div>
                      <div className={styles.expiredSubtext}>
                        Merci d'avoir suivi cette compilation ThrowBack !
                      </div>
                    </div>
                  )}
                </div>
                
                {isStreamValid(currentStream) && (
                  <>
                    <div className={styles.liveIndicator}>
                      <span className={styles.liveIcon}></span>
                      LIVE
                    </div>
                    <div className={styles.viewCount}>
                      <FontAwesomeIcon icon={faEye} />
                      <span>{viewCount > 999 ? `${(viewCount/1000).toFixed(1)}K` : viewCount}</span>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          
          {/* Informations de la vidéo */}
          {currentStream && (
            <div className={styles.videoInfo}>
              <h2 className={styles.streamTitle}>{currentStream.title}</h2>
              <p className={styles.hostInfo}>Hosted by: {currentStream.hostName || 'ThrowBack Host'}</p>
              
              {/* Indicateur de progression pour les compilations */}
              {renderCompilationProgress()}
              
              <div className={styles.interactionBar}>
                <button 
                  className={`${styles.interactionButton} ${liked ? styles.liked : ''}`}
                  onClick={handleLike}
                  disabled={!isStreamValid(currentStream)}
                >
                  <FontAwesomeIcon icon={liked ? faHeart : faHeartBroken} />
                  <span>{likeCount}</span>
                </button>
                
                <button 
                  className={styles.interactionButton}
                  onClick={handleShare}
                >
                  <FontAwesomeIcon icon={faShare} />
                  <span>Share</span>
                </button>
              </div>
              
              {/* Formulaire de commentaire principal - affiché seulement si le chat est activé et le stream valide */}
              {!chatDisabled && isStreamValid(currentStream) && (
                <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                  <img 
                    src={user?.photo_profil || '/images/default-user.jpg'} 
                    alt={user?.prenom || 'User'} 
                    className={styles.userAvatar}
                    onError={(e) => {
                      e.target.onerror = null; 
                      e.target.src = '/images/default-user.jpg';
                    }}
                  />
                  <input
                    type="text"
                    placeholder="Share a comment..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className={styles.commentInput}
                  />
                  <button 
                    type="submit" 
                    className={styles.commentSubmit}
                    disabled={!comment.trim()}
                  >
                    Chat
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
        
        {/* Section de chat à droite - conditionnelle selon le paramètre chatEnabled */}
        {currentStream && (
          <>
            {currentStream.chatEnabled !== false && isStreamValid(currentStream) ? (
              <div className={styles.commentsSection}>
                <h3 className={styles.commentsTitle}>Live Chat</h3>
                <CommentSection streamId={currentStream._id} />
              </div>
            ) : (
              <div className={styles.commentsDisabled}>
                <h3 className={styles.commentsTitle}>
                  {!isStreamValid(currentStream) ? 'Direct terminé' : 'Chat désactivé'}
                </h3>
                <p>
                  {!isStreamValid(currentStream) 
                    ? 'Le chat est fermé car le direct est terminé' 
                    : 'Le chat a été désactivé pour ce direct'
                  }
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveThrowback;