import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faReply } from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import api from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';

// Niveau de log configurable
const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';

// Fonction de log personnalisée
const logger = {
  debug: (...args) => LOG_LEVEL === 'debug' && console.log(...args),
  info: (...args) => ['debug', 'info'].includes(LOG_LEVEL) && console.log(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args)
};

// Cache pour les commentaires
const commentsCache = {
  data: {},
  get: (key) => commentsCache.data[key],
  set: (key, value, ttl = 60000) => {
    commentsCache.data[key] = {
      value,
      expiry: Date.now() + ttl
    };
  },
  isValid: (key) => {
    const item = commentsCache.data[key];
    return item && item.expiry > Date.now();
  },
  clear: (key = null, streamIdentifier = null) => {
    if (key) {
      delete commentsCache.data[key];
    } else if (streamIdentifier) {
      Object.keys(commentsCache.data).forEach(cacheKey => {
        if (cacheKey.startsWith(`comments_${streamIdentifier}`)) {
          delete commentsCache.data[cacheKey];
        }
      });
    } else {
      commentsCache.data = {};
    }
  }
};

const CommentSection = ({ streamId }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [replyingTo, setReplyingTo] = useState(null);
  const [error, setError] = useState(null);
  const [isBanned, setIsBanned] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);
  const { user } = useAuth();
  const commentsEndRef = useRef(null);
  const commentsContainerRef = useRef(null);

  // Vérifier si l'utilisateur est banni ou si le chat est désactivé
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!streamId) return;
      
      try {
        const response = await api.get(`/api/user/livestreams/${streamId}`);
        
        // Vérifier si le chat est désactivé
        if (response.data?.data?.chatEnabled === false) {
          setError('Chat has been disabled for this livestream.');
          setChatDisabled(true);
          return;
        }
        
        // Vérifier si l'utilisateur est banni (seulement si connecté)
        if (user && response.data?.data?.bannedUsers?.includes(user.id)) {
          setError('You have been banned from this chat by the moderator.');
          setIsBanned(true);
        }
      } catch (err) {
        logger.error('Error checking user access:', err);
      }
    };
    
    checkUserAccess();
  }, [streamId, user]);

  // Récupérer les messages du chat en utilisant l'API LiveChat
  const fetchComments = async () => {
    if (!streamId || chatDisabled || isBanned) return;
    
    const cacheKey = `comments_${streamId}_page_${page}`;
    
    try {
      setLoading(true);
      logger.debug(`Fetching comments for stream ${streamId}, page ${page}`);
      
      // Utiliser l'API LiveChat
      const response = await api.get(`/api/livechat/${streamId}`, {
        params: { page, limit: 10 }
      });
      
      if (response.data && response.data.success) {
        logger.debug('Successfully fetched comments from API');
        const fetchedComments = response.data.data;
        
        // Vérifier que fetchedComments est un tableau
        if (Array.isArray(fetchedComments)) {
          // Mettre en cache les commentaires récupérés
          commentsCache.set(cacheKey, fetchedComments, 60000); // Cache pour 1 minute
          
          if (page === 1) {
            setComments(fetchedComments);
          } else {
            setComments(prev => [...prev, ...fetchedComments]);
          }
          
          setHasMore(fetchedComments.length === 10);
        } else {
          logger.error('API returned non-array data:', fetchedComments);
          setError('Incorrect data format received from server');
        }
      } else {
        // Vérifier si l'utilisateur est banni ou si le chat est désactivé
        if (response.data?.chatDisabled) {
          setChatDisabled(true);
          setError('Chat has been disabled for this livestream.');
        } else if (response.data?.userBanned) {
          setIsBanned(true);
          setError('You have been banned from this chat by the moderator.');
        } else {
          logger.warn('Received invalid data format from API');
          setError('Incorrect data format received from server');
        }
      }
      
      setLoading(false);
    } catch (error) {
      logger.error('Error fetching comments:', error);
      setLoading(false);        
      
      // Vérifier si l'erreur indique un problème d'accès
      if (error.response) {
        if (error.response.status === 403) {
          if (error.response.data?.chatDisabled) {
            setChatDisabled(true);
            setError('Chat has been disabled for this livestream.');
          } else if (error.response.data?.userBanned) {
            setIsBanned(true);
            setError('You have been banned from this chat by the moderator.');
          } else {
            setError('You do not have access to this chat.');
          }
        } else if (error.response.status === 401) {
          setError('You must be logged in to access the chat.');
        } else {
          setError('Error loading comments.');
        }
      } else {
        setError('Connection error to server.');
      }
    }
  };

  // Effet pour charger les commentaires initiaux et mettre en place le polling
  useEffect(() => {
    if (!streamId || chatDisabled || isBanned) return;
    
    fetchComments();
    
    // Mise en place d'un polling pour rafraîchir les commentaires
    const interval = setInterval(() => {
      // Nettoyer le cache pour la première page uniquement
      if (page === 1 && !chatDisabled && !isBanned) {
        commentsCache.clear(`comments_${streamId}_page_1`);
        fetchComments();
      }
    }, 15000); // 15 secondes
    
    return () => clearInterval(interval);
  }, [streamId, page, chatDisabled, isBanned]);

  // Scroll vers le bas lors du premier chargement
  useEffect(() => {
    if (comments.length > 0 && page === 1 && !loading && commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [comments, page, loading]);

  // Gérer l'infinite scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!commentsContainerRef.current || loading || !hasMore || chatDisabled || isBanned) return;
      
      const { scrollTop, scrollHeight, clientHeight } = commentsContainerRef.current;
      
      // Si on a scrollé jusqu'en haut, charger plus de commentaires
      if (scrollTop === 0) {
        setPage(prev => prev + 1);
      }
    };
    
    const container = commentsContainerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, [loading, hasMore, chatDisabled, isBanned]);

  // Like un message en utilisant l'API LiveChat
  const handleLikeComment = async (commentId) => {
    if (!user || chatDisabled || isBanned) return;
    
    try {
      // Trouver le commentaire actuel
      const commentToUpdate = comments.find(c => c._id === commentId);
      if (!commentToUpdate) return;
      
      // Mise à jour optimiste de l'UI
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === commentId 
            ? { 
                ...comment, 
                likes: comment.userLiked 
                  ? comment.likes - 1 
                  : comment.likes + 1,
                userLiked: !comment.userLiked
              }
            : comment
        )
      );
      
      // Utiliser l'API LiveChat pour ajouter/supprimer le like
      await api.post(`/api/livechat/${streamId}/messages/${commentId}/like`);
      logger.debug(`Like message API call successful for message ${commentId}`);
      
      // Invalider le cache pour ce stream
      commentsCache.clear(`comments_${streamId}_page_1`, streamId);
    } catch (error) {
      logger.error('Error liking comment:', error);
      // Annuler le changement d'état optimiste
      setComments(prevComments => 
        prevComments.map(comment => 
          comment._id === commentId 
            ? { 
                ...comment, 
                likes: comment.userLiked 
                  ? comment.likes + 1 
                  : comment.likes - 1,
                userLiked: !comment.userLiked
              }
            : comment
        )
      );
    }
  };

  // Répondre à un commentaire
  const handleReplyToComment = (commentId, userName) => {
    if (chatDisabled || isBanned) return;
    
    logger.debug(`Preparing reply to ${userName}, comment ID: ${commentId}`);
    setReplyingTo({ id: commentId, name: userName });
  };

  // Format de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return date.toLocaleDateString();
  };

  // Soumettre un commentaire en utilisant l'API LiveChat
  const handleSubmitComment = async (content, parentId = null) => {
    if (!content.trim() || !user || !streamId || chatDisabled || isBanned) return;
    
    try {
      const requestData = {
        content: content.trim(),
        ...(parentId && { parentId })
      };
      
      // Utiliser l'API LiveChat
      const response = await api.post(`/api/livechat/${streamId}`, requestData);
      
      if (response.data && response.data.success) {
        // Nettoyer le cache pour ce stream
        commentsCache.clear(`comments_${streamId}_page_1`, streamId);
        
        if (parentId) {
          // Si c'est une réponse, ajouter la réponse au commentaire parent
          setComments(prevComments => 
            prevComments.map(comment => 
              comment._id === parentId 
                ? { 
                    ...comment, 
                    replies: [
                      ...(comment.replies || []),
                      response.data.data
                    ]
                  }
                : comment
            )
          );
        } else {
          // Si c'est un nouveau commentaire, ajouter au début de la liste
          setComments(prevComments => [
            response.data.data,
            ...prevComments
          ]);
        }
        
        // Réinitialiser l'état
        setReplyingTo(null);
        
        // Forcer un rafraîchissement après un court délai
        setTimeout(() => {
          commentsCache.clear(`comments_${streamId}_page_1`, streamId);
          if (page === 1) {
            fetchComments();
          }
        }, 1000);
      }
    } catch (error) {
      logger.error('Error posting comment:', error);
      
      // Vérifier si l'erreur indique un bannissement ou une désactivation du chat
      if (error.response) {
        if (error.response.status === 403) {
          if (error.response.data?.message?.includes('chat is disabled')) {
            setChatDisabled(true);
            setError('Chat has been disabled for this livestream.');
          } else if (error.response.data?.message?.includes('banned')) {
            setIsBanned(true);
            setError('You have been banned from this chat by the moderator.');
          }
        } else if (error.response.status === 401) {
          setError('You must be logged in to send a message.');
        }
      }
    }
  };

  // Affichage de l'erreur ou du contenu normal
  if (error) {
    return (
      <div className={styles.commentsError}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div 
      className={styles.commentsContainer}
      ref={commentsContainerRef}
    >
      {loading && page === 1 ? (
        <div className={styles.loadingComments}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className={styles.noComments}>No comments yet. Be the first to comment!</div>
      ) : (
        <>
          {loading && page > 1 && (
            <div className={styles.loadingMoreComments}>Loading more comments...</div>
          )}
          
          <div className={styles.commentsList}>
            {comments.map(comment => (
              <div key={comment._id} className={styles.comment}>
                <img 
                  src={comment.userId?.photo_profil || '/images/bob4.png'} 
                  alt={comment.userId?.prenom || 'User'} 
                  className={styles.commentAvatar}
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = '/images/bob4.png';
                  }}
                />
                
                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>
                      {comment.userId?.prenom} {comment.userId?.nom}
                    </span>
                    <span className={styles.commentTime}>
                      {formatDate(comment.createdAt)}
                    </span>
                  </div>
                  
                  <p className={styles.commentText}>{comment.content}</p>
                  
                  <div className={styles.commentActions}>
                    <button 
                      className={`${styles.commentAction} ${comment.userLiked ? styles.liked : ''}`}
                      onClick={() => handleLikeComment(comment._id)}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} />
                      <span>{comment.likes}</span>
                    </button>
                    
                    <button 
                      className={styles.commentAction}
                      onClick={() => handleReplyToComment(comment._id, `${comment.userId?.prenom} ${comment.userId?.nom}`)}
                    >
                      <FontAwesomeIcon icon={faReply} />
                      <span>Reply</span>
                    </button>
                  </div>
                  
                  {/* Sous-commentaires */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className={styles.replies}>
                      {comment.replies.map(reply => (
                        <div key={reply._id} className={styles.reply}>
                          <img 
                            src={reply.userId?.photo_profil || '/images/bob6.png'} 
                            alt={reply.userId?.prenom || 'User'} 
                            className={styles.replyAvatar}
                            onError={(e) => {
                              e.target.onerror = null; 
                              e.target.src = '/images/bob6.png';
                            }}
                          />
                          
                          <div className={styles.replyContent}>
                            <div className={styles.replyHeader}>
                              <span className={styles.replyAuthor}>
                                {reply.userId?.prenom} {reply.userId?.nom}
                              </span>
                              <span className={styles.replyTime}>
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            
                            <p className={styles.replyText}>{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Formulaire de réponse si ce commentaire est sélectionné */}
                  {replyingTo && replyingTo.id === comment._id && (
                    <div className={styles.replyFormContainer}>
                      <form 
                        className={styles.replyInputForm}
                        onSubmit={(e) => {
                          e.preventDefault();
                          const input = e.target.querySelector('input');
                          if (input && input.value) {
                            handleSubmitComment(input.value, comment._id);
                            input.value = '';
                          }
                          setReplyingTo(null);
                        }}
                      >
                        <input 
                          type="text" 
                          placeholder={`Reply to ${replyingTo.name}...`}
                          className={styles.replyInput}
                          autoFocus
                        />
                        <div className={styles.replyFormActions}>
                          <button 
                            type="button" 
                            className={styles.cancelReplyBtn}
                            onClick={() => setReplyingTo(null)}
                          >
                            Cancel
                          </button>
                          <button 
                            type="submit" 
                            className={styles.submitReplyBtn}
                          >
                            Reply
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          
          <div ref={commentsEndRef} />
        </>
      )}
    </div>
  );
};

export default CommentSection;