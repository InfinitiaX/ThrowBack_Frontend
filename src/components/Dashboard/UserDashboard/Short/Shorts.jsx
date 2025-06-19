import React, { useState, useRef, useEffect } from 'react';
import styles from './Shorts.module.css';
import { FaHeart, FaShareAlt, FaStar, FaPlay, FaPause, FaTimes, 
         FaVolumeUp, FaVolumeMute, FaComment, FaCloudUploadAlt, 
         FaExclamationTriangle, FaChevronDown } from 'react-icons/fa';
import axios from 'axios';

// Fonction utilitaire pour formater les secondes en mm:ss
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Shorts() {
  // Index dynamique de la vidéo centrale (mise en avant)
  const [centerIdx, setCenterIdx] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', artiste: '', video: null });
  const [errDuree, setErrDuree] = useState('');
  const [shorts, setShorts] = useState([]);
  const videoRef = useRef();
  const centerVideoRef = useRef(null);
  const [isCenterPaused, setIsCenterPaused] = useState(false);
  const [isCenterPlaying, setIsCenterPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  // Nouveaux états pour gérer l'upload, pagination et commentaires
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingShorts, setIsLoadingShorts] = useState(true);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [activeShortId, setActiveShortId] = useState(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });

  const fetchShorts = async () => {
    try {
      setIsLoadingShorts(true);
      const res = await axios.get('/api/videos', {
        params: {
          type: 'short',
          page: 1,
          limit: 10
        }
      });
      
      // Vérifier si la réponse contient des données
      if (res.data && Array.isArray(res.data.data)) {
        setShorts(res.data.data);
        if (res.data.pagination) {
          setHasMoreShorts(res.data.pagination.page < res.data.pagination.totalPages);
        }
      } else if (res.data && Array.isArray(res.data)) {
        // Si les données sont directement dans res.data (format alternatif)
        setShorts(res.data);
        setHasMoreShorts(res.data.length >= 10); // Supposer qu'il y a plus si on reçoit au moins 10
      } else {
        showFeedback('Format de réponse inattendu', 'error');
        setShorts([]);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des shorts:', err);
      showFeedback('Erreur lors du chargement des shorts', 'error');
      setShorts([]);
    } finally {
      setIsLoadingShorts(false);
    }
  };

  const loadMoreShorts = async () => {
    if (!hasMoreShorts || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      const res = await axios.get('/api/videos', {
        params: {
          type: 'short',
          page: nextPage,
          limit: 10
        }
      });
      
      let newShorts = [];
      if (res.data && Array.isArray(res.data.data)) {
        newShorts = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        newShorts = res.data;
      }
      
      if (newShorts.length === 0) {
        setHasMoreShorts(false);
      } else {
        setShorts([...shorts, ...newShorts]);
        setPage(nextPage);
        
        if (res.data.pagination) {
          setHasMoreShorts(nextPage < res.data.pagination.totalPages);
        } else {
          setHasMoreShorts(newShorts.length >= 10);
        }
      }
    } catch (err) {
      console.error('Erreur lors du chargement de plus de shorts:', err);
      showFeedback('Impossible de charger plus de shorts', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  const fetchComments = async (shortId) => {
    if (!shortId) return;
    
    try {
      // Tentative de récupération des commentaires via l'API
      const response = await axios.get(`/api/videos/${shortId}/memories`);
      
      // Vérifier si la réponse contient des données
      if (response.data && Array.isArray(response.data.data)) {
        setComments(response.data.data);
      } else if (response.data && Array.isArray(response.data)) {
        setComments(response.data);
      } else {
        console.log('Format de réponse inattendu pour les commentaires:', response.data);
        setComments([]);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des commentaires:', err);
      
      // Fallback avec des commentaires vides
      setComments([]);
      
      // Ne pas afficher d'erreur à l'utilisateur, juste logger
    }
  };

  const addComment = async () => {
    if (!commentInput.trim() || !activeShortId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('Vous devez être connecté pour commenter', 'error');
        return;
      }
      
      await axios.post(`/api/videos/${activeShortId}/memories`, 
        { contenu: commentInput },
        { headers: { 'Authorization': `Bearer ${token}` }}
      );
      
      showFeedback('Commentaire ajouté avec succès', 'success');
      setCommentInput('');
      
      // Mettre à jour le nombre de commentaires dans le short actif
      const updatedShorts = shorts.map(short => {
        if (short._id === activeShortId) {
          // Incrémenter le compteur de commentaires
          const currentCount = short.meta?.commentCount || 0;
          return {
            ...short,
            meta: {
              ...short.meta,
              commentCount: currentCount + 1
            }
          };
        }
        return short;
      });
      setShorts(updatedShorts);
      
      // Recharger les commentaires
      fetchComments(activeShortId);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du commentaire:', err);
      showFeedback('Erreur lors de l\'ajout du commentaire', 'error');
    }
  };

  const showFeedback = (message, type = 'info') => {
    setFeedback({
      visible: true,
      message,
      type
    });
    
    setTimeout(() => {
      setFeedback({ visible: false, message: '', type: '' });
    }, 3000);
  };

  useEffect(() => {
    fetchShorts();
    // Réinitialise le centre au milieu de la liste quand on recharge
    setCenterIdx(2);
  }, []);

  // Met en pause toutes les vidéos du carousel à chaque changement de centerIdx, de shorts ou de pause
  useEffect(() => {
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      // On met tout en pause
      video.pause();
      video.currentTime = 0;
    });
    
    // Si un nouveau short est au centre, mettre à jour l'ID actif
    if (shorts.length > 0 && centerIdx >= 0 && centerIdx < shorts.length) {
      setActiveShortId(shorts[centerIdx]._id);
    }
  }, [centerIdx, shorts, isCenterPaused]);

  // Charger les commentaires quand un nouveau short est actif
  useEffect(() => {
    if (activeShortId && isCommentsVisible) {
      fetchComments(activeShortId);
    }
  }, [activeShortId, isCommentsVisible]);

  // Ajoute un event listener pour détecter la pause sur la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    
    const handlePause = () => setIsCenterPaused(true);
    const handlePlay = () => setIsCenterPaused(false);
    
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    
    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [centerIdx, shorts]);

  // Ajoute un event listener pour suivre l'état de lecture de la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    
    const handlePause = () => setIsCenterPlaying(false);
    const handlePlay = () => setIsCenterPlaying(true);
    
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    
    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [centerIdx, shorts]);

  // Synchronise la barre de progression avec la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    
    const updateProgress = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };
    
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [centerIdx, shorts]);

  // Gérer la visibilité de l'onglet
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && centerVideoRef.current && isCenterPlaying) {
        centerVideoRef.current.pause();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isCenterPlaying]);

  // Surveiller le scroll pour mettre en pause la vidéo si elle n'est plus visible
  useEffect(() => {
    const handleScroll = () => {
      if (centerVideoRef.current && isCenterPlaying) {
        const rect = centerVideoRef.current.getBoundingClientRect();
        const isVisible = (
          rect.top >= 0 &&
          rect.bottom <= (window.innerHeight || document.documentElement.clientHeight)
        );
        
        if (!isVisible) {
          centerVideoRef.current.pause();
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isCenterPlaying]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setErrDuree('');
    
    if (!file) {
      return;
    }
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('video/')) {
      setErrDuree('Le fichier sélectionné n\'est pas une vidéo.');
      setForm(f => ({ ...f, video: null }));
      return;
    }
    
    // Vérifier la taille du fichier (max 100MB)
    if (file.size > 100 * 1024 * 1024) {
      setErrDuree('Le fichier est trop volumineux (max 100MB).');
      setForm(f => ({ ...f, video: null }));
      return;
    }
    
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(url);
      const duration = video.duration;
      
      if (duration < 10 || duration > 30) {
        setErrDuree('La vidéo doit durer entre 10 et 30 secondes.');
        setForm(f => ({ ...f, video: null }));
      } else {
        setErrDuree('');
        setForm(f => ({ ...f, video: file, duree: Math.round(duration) }));
      }
    };
    
    video.onerror = () => {
      setErrDuree('Impossible de lire ce fichier vidéo.');
      setForm(f => ({ ...f, video: null }));
    };
    
    video.src = url;
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Vérifications de base
    if (!form.titre.trim()) {
      showFeedback('Le titre est requis', 'error');
      return;
    }
    
    if (!form.artiste.trim()) {
      showFeedback('L\'artiste est requis', 'error');
      return;
    }
    
    if (!form.video) {
      setErrDuree('Veuillez sélectionner une vidéo valide.');
      return;
    }
    
    try {
      setIsUploading(true);
      setErrDuree('');
      
      const data = new FormData();
      data.append('titre', form.titre);
      data.append('artiste', form.artiste);
      data.append('duree', form.duree || 15);
      data.append('videoFile', form.video);
      
      // Optionnel : ajouter la description si présente
      if (form.description) {
        data.append('description', form.description);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('Vous devez être connecté pour ajouter un short', 'error');
        setIsUploading(false);
        return;
      }
      
      // Tenter d'envoyer sur le nouvel endpoint
      try {
        await axios.post('/api/videos/shorts', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      } catch (uploadError) {
        console.error('Erreur sur /api/videos/shorts, tentative sur endpoint alternatif:', uploadError);
        
        // Si le premier endpoint échoue, essayer le second endpoint
        await axios.post('/api/videos/short', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      showFeedback('Short ajouté avec succès !', 'success');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null, description: '' });
      setErrDuree('');
      
      // Attendre un court délai avant de recharger la liste pour laisser le temps au serveur de traiter
      setTimeout(() => {
        fetchShorts();
      }, 1000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout du short:', err);
      setErrDuree(err.response?.data?.message || err.message || 'Erreur lors de l\'upload');
      showFeedback('Erreur lors de l\'ajout du short', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Quand on clique sur une sideCard, la vidéo centrale doit être en pause et toutes les vidéos du carrousel aussi
  const handleSideCardClick = (realIdx) => {
    setCenterIdx(realIdx);
    setIsCenterPlaying(false);
    
    // Met en pause toutes les vidéos du carrousel
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    
    // On ne joue pas la vidéo centrale automatiquement !
  };

  // Quand on clique sur mute/unmute
  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    if (centerVideoRef.current) {
      centerVideoRef.current.muted = !isMuted;
    }
  };

  // Fonctions pour gérer les likes et partages
  const handleLike = async (shortId) => {
    if (isLikeLoading) return;
    
    try {
      setIsLikeLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showFeedback('Vous devez être connecté pour aimer un short', 'error');
        return;
      }
      
      const response = await axios.post(`/api/videos/${shortId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.data && response.data.data) {
        // Mettre à jour l'état local pour refléter le changement
        const updatedShorts = shorts.map(short => {
          if (short._id === shortId) {
            return { 
              ...short, 
              likes: response.data.data.likes || short.likes,
              userInteraction: {
                ...(short.userInteraction || {}),
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              }
            };
          }
          return short;
        });
        
        setShorts(updatedShorts);
        
        if (response.data.data.liked) {
          showFeedback('Vous avez aimé ce short', 'success');
        } else {
          showFeedback('Vous n\'aimez plus ce short', 'info');
        }
      } else {
        // Fallback simple si le format de réponse est différent
        showFeedback('Action enregistrée', 'success');
        
        // Mettre à jour de manière optimiste
        const updatedShorts = shorts.map(short => {
          if (short._id === shortId) {
            const currentLikes = short.likes || 0;
            const isLiked = short.userInteraction?.liked;
            return { 
              ...short, 
              likes: isLiked ? currentLikes - 1 : currentLikes + 1,
              userInteraction: {
                ...(short.userInteraction || {}),
                liked: !isLiked,
                disliked: false
              }
            };
          }
          return short;
        });
        
        setShorts(updatedShorts);
      }
    } catch (err) {
      console.error('Erreur lors du like:', err);
      showFeedback('Erreur lors du like', 'error');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleShare = async (shortId) => {
    if (isShareLoading) return;
    
    try {
      setIsShareLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showFeedback('Vous devez être connecté pour partager un short', 'error');
        return;
      }
      
      try {
        // Tenter d'appeler l'API de partage
        await axios.post(`/api/videos/${shortId}/share`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (shareError) {
        // Ignorer les erreurs d'API pour cette fonction non critique
        console.warn('Erreur API de partage (ignorée):', shareError);
      }
      
      // Copier le lien dans le presse-papiers
      const shareLink = `${window.location.origin}/shorts/${shortId}`;
      
      try {
        await navigator.clipboard.writeText(shareLink);
        showFeedback('Lien copié dans le presse-papiers !', 'success');
      } catch (clipboardError) {
        console.error('Erreur de clipboard:', clipboardError);
        
        // Fallback pour les navigateurs qui ne supportent pas clipboard API
        const textarea = document.createElement('textarea');
        textarea.value = shareLink;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showFeedback('Lien copié dans le presse-papiers !', 'success');
          } else {
            throw new Error('Copie manuelle échouée');
          }
        } catch (err) {
          showFeedback('Impossible de copier le lien: ' + shareLink, 'info');
        }
        
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Erreur lors du partage:', err);
      showFeedback('Erreur lors du partage', 'error');
    } finally {
      setIsShareLoading(false);
    }
  };

  const toggleComments = () => {
    setIsCommentsVisible(!isCommentsVisible);
    if (!isCommentsVisible && activeShortId) {
      fetchComments(activeShortId);
    }
  };

  return (
    <div className={styles.shorts_bg}>
      <div className={styles.shortsContentBg}>
        <div className={styles.headerRow}>
          <button className={styles.newPostBtn} onClick={() => setShowModal(true)}>
            Add Short
          </button>
        </div>
        
        {isLoadingShorts ? (
          <div className={styles.loadingContainer}>
            <div className={styles.spinner}></div>
            <p>Chargement des shorts...</p>
          </div>
        ) : shorts.length === 0 ? (
          <div className={styles.noContent}>
            <p>Aucun short disponible pour le moment.</p>
            <button className={styles.newPostBtn} onClick={() => setShowModal(true)}>
              Soyez le premier à ajouter un Short !
            </button>
          </div>
        ) : (
          <div className={styles.carouselRow}>
            {(() => {
              // Calcul de la fenêtre de 5 shorts centrée sur centerIdx
              let window = [];
              for (let i = centerIdx - 2; i <= centerIdx + 2; i++) {
                if (i < 0 || i >= shorts.length) {
                  window.push(null);
                } else {
                  window.push({ short: shorts[i], realIdx: i });
                }
              }
              
              return window.map((item, idx) => {
                if (!item) {
                  return <div className={styles.sideCard} key={`empty-${idx}`} style={{opacity:0.3}} />;
                }
                
                const { short, realIdx } = item;
                
                if (idx === 2) {
                  // Card centrale
                  return (
                    <div className={styles.centerCard} key={short._id}>
                      <div className={styles.centerImgWrap}>
                        <video
                          key={short._id}
                          ref={centerVideoRef}
                          src={short.youtubeUrl}
                          controls={false}
                          className={styles.centerImg}
                          autoPlay={false}
                          muted={isMuted}
                          loop
                        />
                        <div className={styles.centerOverlay}></div>
                        <button
                          className={styles.playBtn}
                          onClick={() => {
                            if (centerVideoRef.current) {
                              if (isCenterPlaying) {
                                centerVideoRef.current.pause();
                              } else {
                                centerVideoRef.current.play();
                              }
                            }
                          }}
                        >
                          {isCenterPlaying ? <FaPause /> : <FaPlay />}
                        </button>
                        <button
                          className={styles.muteBtn}
                          onClick={handleMuteToggle}
                        >
                          {isMuted ? 
                            <FaVolumeMute style={{color: '#b31217', fontSize: '1.5rem'}} /> : 
                            <FaVolumeUp style={{color: '#b31217', fontSize: '1.5rem'}} />
                          }
                        </button>
                      </div>
                      
                      {/* Barre de progression */}
                      <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={progress}
                        step={0.1}
                        onChange={e => {
                          const val = Number(e.target.value);
                          setProgress(val);
                          if (centerVideoRef.current) {
                            centerVideoRef.current.currentTime = val;
                          }
                        }}
                        className={styles.progressBar}
                        style={{ 
                          width: '90%', 
                          margin: '12px auto 0 auto', 
                          display: 'block',
                          ['--progress']: `${(progress / (duration || 1)) * 100}`
                        }}
                        disabled={duration === 0}
                      />
                      
                      <div style={{
                        width: '90%', 
                        margin: '0 auto 8px auto', 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        fontSize: '0.98rem', 
                        color: '#fff', 
                        opacity: 0.85
                      }}>
                        <span>{formatTime(progress)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      
                      <div className={styles.centerInfo}>
                        <div className={styles.centerUserRow}>
                          <span className={styles.username}>{short.artiste || 'Artiste inconnu'}</span>
                        </div>
                        <div className={styles.centerDesc}>{short.description || short.titre || 'Pas de description'}</div>
                        <div className={styles.centerMusic}>🎵 {short.artiste || 'Artiste inconnu'}</div>
                        <div className={styles.centerActions}>
                          <span className={styles.featured}><FaStar /> Featured</span>
                          <button 
                            className={`${styles.actionBtn} ${isLikeLoading ? styles.disabled : ''} ${short.userInteraction?.liked ? styles.active : ''}`} 
                            onClick={() => handleLike(short._id)}
                            disabled={isLikeLoading}
                          >
                            <FaHeart />
                            <span className={styles.actionCount}>{short.likes || 0}</span>
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${isShareLoading ? styles.disabled : ''}`}
                            onClick={() => handleShare(short._id)}
                            disabled={isShareLoading}
                          >
                            <FaShareAlt />
                          </button>
                          <button 
                            className={`${styles.actionBtn} ${isCommentsVisible ? styles.active : ''}`}
                            onClick={toggleComments}
                          >
                            <FaComment />
                            <span className={styles.actionCount}>{short.meta?.commentCount || 0}</span>
                          </button>
                        </div>
                      </div>
                      
                      {/* Section des commentaires */}
                      {isCommentsVisible && (
                        <div className={styles.commentsSection}>
                          <div className={styles.commentsHeader}>
                            <h3>Commentaires</h3>
                            <button 
                              className={styles.collapseBtn}
                              onClick={toggleComments}
                            >
                              <FaChevronDown />
                            </button>
                          </div>
                          
                          <div className={styles.commentsList}>
                            {comments.length === 0 ? (
                              <p className={styles.noComments}>Aucun commentaire pour le moment.</p>
                            ) : (
                              comments.map(comment => (
                                <div key={comment.id} className={styles.commentItem}>
                                  <img 
                                    src={comment.imageUrl || '/images/default-avatar.jpg'} 
                                    alt={comment.username}
                                    onError={(e) => {
                                      e.target.src = '/images/default-avatar.jpg';
                                    }}
                                  />
                                  <div>
                                    <div className={styles.commentHeader}>
                                      <span className={styles.commentAuthor}>{comment.username}</span>
                                      <span className={styles.commentDate}>
                                        {new Date(comment.createdAt).toLocaleDateString()}
                                      </span>
                                    </div>
                                    <p className={styles.commentContent}>{comment.content}</p>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                          
                          <div className={styles.addCommentSection}>
                            <input
                              type="text"
                              value={commentInput}
                              onChange={e => setCommentInput(e.target.value)}
                              placeholder="Ajouter un commentaire..."
                              onKeyPress={e => e.key === 'Enter' && addComment()}
                            />
                            <button 
                              onClick={addComment}
                              disabled={!commentInput.trim()}
                            >
                              Envoyer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                } else {
                  // Cards latérales, cliquables pour changer le centre
                  return (
                    <div 
                      className={styles.sideCard} 
                      key={short._id} 
                      onClick={() => handleSideCardClick(realIdx)}
                    >
                      <video
                        src={short.youtubeUrl}
                        controls={false}
                        className={styles.sideImg}
                        autoPlay={false}
                        muted
                      />
                      <div className={styles.views}>
                        <FaPlay /> {short.duree || 0}s
                      </div>
                    </div>
                  );
                }
              });
            })()}
          </div>
        )}
        
        {/* Bouton pour charger plus de shorts */}
        {hasMoreShorts && shorts.length > 0 && (
          <div className={styles.loadMoreContainer}>
            <button 
              className={styles.loadMoreBtn}
              onClick={loadMoreShorts}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <div className={styles.smallSpinner}></div>
                  <span>Chargement...</span>
                </>
              ) : 'Charger plus de shorts'}
            </button>
          </div>
        )}
      </div>
      
      {/* Modal d'ajout de short */}
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>Ajouter un Short</h2>
              <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="titre">Titre</label>
                <input
                  id="titre"
                  name="titre"
                  type="text"
                  value={form.titre}
                  onChange={handleChange}
                  required
                  disabled={isUploading}
                  placeholder="Donnez un titre à votre short"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="artiste">Artiste</label>
                <input
                  id="artiste"
                  name="artiste"
                  type="text"
                  value={form.artiste}
                  onChange={handleChange}
                  required
                  disabled={isUploading}
                  placeholder="Nom de l'artiste"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Vidéo (10–30 s)</label>
                <div className={styles.fileUploadContainer}>
                  <div className={styles.fileUploadIcon}>
                    <FaCloudUploadAlt />
                  </div>
                  <div className={styles.fileUploadText}>
                    Glissez et déposez votre fichier vidéo ou cliquez pour sélectionner
                  </div>
                  <div className={styles.fileUploadSubtext}>
                    MP4, WebM, MOV ou AVI • 10-30 secondes • 100 MB maximum
                  </div>
                  <input
                    id="videoFile"
                    name="videoFile"
                    type="file"
                    accept="video/*"
                    className={styles.fileInput}
                    onChange={handleFileChange}
                    ref={videoRef}
                    disabled={isUploading}
                  />
                </div>
                
                {form.video && (
                  <div className={styles.filePreview}>
                    <video src={URL.createObjectURL(form.video)} />
                    <div className={styles.fileInfo}>
                      <div className={styles.fileName}>{form.video.name}</div>
                      <div className={styles.fileSize}>
                        {(form.video.size / (1024 * 1024)).toFixed(2)} MB • {form.duree || '?'} secondes
                      </div>
                    </div>
                  </div>
                )}
                
                {errDuree && (
                  <div className={styles.errDuree}>
                    <FaExclamationTriangle /> {errDuree}
                  </div>
                )}
              </div>
            </form>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
                disabled={isUploading}
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleSubmit}
                disabled={isUploading || !form.video || !form.titre || !form.artiste}
              >
                {isUploading ? (
                  <>
                    <div className={styles.smallSpinner}></div>
                    <span>Uploading...</span>
                  </>
                ) : 'Mettre en ligne'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Feedback toast */}
      {feedback.visible && (
        <div className={`${styles.feedback} ${styles[feedback.type]}`}>
          {feedback.message}
        </div>
      )}
    </div>
  );
}