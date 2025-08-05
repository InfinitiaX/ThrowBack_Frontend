import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Shorts.module.css';
import { 
  FaHeart, FaShareAlt, FaStar, FaPlay, FaPause, FaTimes, 
  FaVolumeUp, FaVolumeMute, FaComment, FaCloudUploadAlt, 
  FaExclamationTriangle, FaChevronDown, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';
import axios from 'axios';

// Configuration Axios avec intercepteurs
axios.interceptors.request.use(
  config => {
    // Ajouter l'URL de base si ce n'est pas déjà fait
    if (config.url && !config.url.startsWith('http')) {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      config.url = `${apiBaseUrl}${config.url}`;
    }
    
    // Ajouter le token d'authentification s'il existe
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  error => Promise.reject(error)
);

// Intercepteur pour toutes les réponses Axios
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);
    
    // Gérer les timeouts
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - La requête a pris trop de temps');
    }
    
    // Gérer les erreurs CORS
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS issue or network problem');
    }
    
    return Promise.reject(error);
  }
);

// Fonction pour convertir les chemins relatifs en URLs absolues
function getFullVideoUrl(path) {
  if (!path) return '';
  
  // Si l'URL est déjà absolue, la retourner telle quelle
  if (path.startsWith('http')) return path;
  
  // S'assurer que le chemin commence par un slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // Toujours utiliser une URL de base, jamais une chaîne vide
  const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  const fullUrl = `${backendUrl}${normalizedPath}`;
  
  return fullUrl;
}

// Fonction utilitaire pour formater les secondes en mm:ss
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Shorts() {
  // Index dynamique de la vidéo centrale (mise en avant)
  const [centerIdx, setCenterIdx] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', artiste: '', description: '', video: null });
  const [errDuree, setErrDuree] = useState('');
  const [shorts, setShorts] = useState([]);
  const videoRef = useRef();
  const centerVideoRef = useRef(null);
  const carouselRef = useRef(null);
  const [isCenterPaused, setIsCenterPaused] = useState(true);
  const [isCenterPlaying, setIsCenterPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);
  
  // États pour la navigation et les animations
  const [dragging, setDragging] = useState(false);
  const [direction, setDirection] = useState(null);
  const [transition, setTransition] = useState(false);
  
  // États pour l'upload et la progression
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  
  // États pour le chargement et la pagination
  const [isLoadingShorts, setIsLoadingShorts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);
  
  // États pour les commentaires et interactions
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [activeShortId, setActiveShortId] = useState(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });

  // Fonction pour charger les shorts avec mécanisme de retry
  const fetchShorts = async () => {
    try {
      setIsLoadingShorts(true);
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Implémentation d'un mécanisme de retry
      let attempts = 0;
      const maxAttempts = 3;
      let success = false;
      let finalError;
      let response;
      
      while (attempts < maxAttempts && !success) {
        try {
          attempts++;
          
          response = await axios.get(`${apiBaseUrl}/api/videos`, {
            params: {
              type: 'short',
              page: 1,
              limit: 12
            },
            timeout: 10000 * attempts, // Augmenter le timeout à chaque tentative
            withCredentials: true
          });
          
          success = true;
          
        } catch (err) {
          console.error(`Erreur tentative ${attempts}:`, err);
          finalError = err;
          
          // Attendre avant de réessayer (backoff exponentiel)
          if (attempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempts - 1); // 1s, 2s, 4s...
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!success) {
        throw finalError || new Error("Échec après plusieurs tentatives");
      }
      
      // Traitement de la réponse
      let shortsData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        shortsData = response.data.data;
        setHasMoreShorts(response.data.pagination?.page < response.data.pagination?.totalPages);
      } else if (response.data && Array.isArray(response.data)) {
        shortsData = response.data;
        setHasMoreShorts(response.data.length >= 12);
      } else if (response.data && response.data.videos && Array.isArray(response.data.videos)) {
        shortsData = response.data.videos;
        setHasMoreShorts(response.data.pagination?.page < response.data.pagination?.totalPages);
      } else {
        console.warn('Format de réponse inattendu:', response.data);
        shortsData = [];
        setHasMoreShorts(false);
      }
      
      // Traiter les URLs de vidéos pour qu'elles soient absolues
      shortsData = shortsData.map(short => {
        const videoUrl = getFullVideoUrl(short.youtubeUrl);
        return {
          ...short,
          youtubeUrl: videoUrl
        };
      });
      
      setShorts(shortsData);
      
      // Si des shorts ont été chargés, définir le premier comme actif
      if (shortsData.length > 0) {
        setActiveShortId(shortsData[0]._id);
      }
      
    } catch (err) {
      console.error('Erreur détaillée lors du chargement des shorts:', err);
      
      // Détection d'erreurs spécifiques
      if (err.code === 'ECONNABORTED') {
        showFeedback('Le serveur met trop de temps à répondre. Veuillez réessayer.', 'error');
      } else if (err.response?.status === 401) {
        showFeedback('Votre session a expiré. Veuillez vous reconnecter.', 'error');
      } else {
        showFeedback('Erreur lors du chargement des shorts. Veuillez réessayer.', 'error');
      }
      
      setShorts([]);
      setHasMoreShorts(false);
    } finally {
      setIsLoadingShorts(false);
    }
  };

  // Charger plus de shorts
  const loadMoreShorts = async () => {
    if (!hasMoreShorts || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      const response = await axios.get(`${apiBaseUrl}/api/videos`, {
        params: {
          type: 'short',
          page: nextPage,
          limit: 10
        },
        timeout: 30000,
        withCredentials: true
      });
      
      let newShorts = [];
      if (response.data && Array.isArray(response.data.data)) {
        newShorts = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        newShorts = response.data;
      } else if (response.data && response.data.videos && Array.isArray(response.data.videos)) {
        newShorts = response.data.videos;
      }
      
      // Traiter les URLs de vidéos pour qu'elles soient absolues
      newShorts = newShorts.map(short => ({
        ...short,
        youtubeUrl: getFullVideoUrl(short.youtubeUrl)
      }));
      
      if (newShorts.length === 0) {
        setHasMoreShorts(false);
      } else {
        setShorts([...shorts, ...newShorts]);
        setPage(nextPage);
        
        if (response.data.pagination) {
          setHasMoreShorts(nextPage < response.data.pagination.totalPages);
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

  // Chargement des commentaires
  const fetchComments = async (shortId) => {
    if (!shortId) return;
    
    try {
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Tentative de récupération des commentaires via l'API
      const response = await axios.get(`${apiBaseUrl}/api/videos/${shortId}/memories`, {
        timeout: 15000,
        withCredentials: true
      });
      
      // Vérifier si la réponse contient des données
      let commentsData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data && response.data.memories && Array.isArray(response.data.memories)) {
        commentsData = response.data.memories;
      } else {
        console.warn('Format de réponse inattendu pour les commentaires:', response.data);
        commentsData = [];
      }
      
      // Normaliser le format des commentaires
      const normalizedComments = commentsData.map(comment => ({
        id: comment._id || comment.id || Math.random().toString(36).substr(2, 9),
        username: comment.auteur?.nom || comment.username || 'Utilisateur',
        content: comment.contenu || comment.content || comment.texte || '',
        createdAt: comment.createdAt || comment.date || new Date().toISOString(),
        imageUrl: getFullVideoUrl(comment.auteur?.photo_profil) || comment.imageUrl || '/images/default-avatar.jpg'
      }));
      
      setComments(normalizedComments);
    } catch (err) {
      console.error('Erreur détaillée lors de la récupération des commentaires:', err);
      setComments([]);
    }
  };

  // Ajout de commentaire
  const addComment = async () => {
    if (!commentInput.trim() || !activeShortId) return;
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('Vous devez être connecté pour commenter', 'error');
        return;
      }
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      await axios.post(`${apiBaseUrl}/api/videos/${activeShortId}/memories`, 
        { contenu: commentInput },
        { 
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        }
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

  // Affichage du feedback
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

  // Initialisation
  useEffect(() => {
    fetchShorts();
  }, []);

  // Gestion de la navigation horizontale
  const handleHorizontalScroll = useCallback((dir) => {
    if (shorts.length <= 1 || transition) return;
    
    // Pauser la vidéo actuelle
    if (centerVideoRef.current) {
      centerVideoRef.current.pause();
    }
    
    // Calculer le nouvel index central
    const newIndex = dir === 'right' 
      ? Math.min(centerIdx + 1, shorts.length - 1)
      : Math.max(centerIdx - 1, 0);
    
    if (newIndex !== centerIdx) {
      setDirection(dir);
      setTransition(true);
      
      // Appliquer la transition avec délai
      setTimeout(() => {
        setCenterIdx(newIndex);
        setIsCenterPlaying(false);
        
        // Mettre à jour l'ID du short actif
        if (shorts[newIndex]) {
          setActiveShortId(shorts[newIndex]._id);
        }
        
        // Réinitialiser après la transition
        setTimeout(() => {
          setDirection(null);
          setTransition(false);
        }, 300);
      }, 50);
    }
  }, [shorts, centerIdx, transition]);

  // Mettre en pause toutes les vidéos du carousel lors des changements
  useEffect(() => {
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    
    // Si un nouveau short est au centre, mettre à jour l'ID actif
    if (shorts.length > 0 && centerIdx >= 0 && centerIdx < shorts.length) {
      setActiveShortId(shorts[centerIdx]._id);
      
      // Réinitialiser la visibilité des commentaires lors du changement de short
      setIsCommentsVisible(false);
    }
  }, [centerIdx, shorts]);

  // Charger les commentaires quand un nouveau short est actif
  useEffect(() => {
    if (activeShortId && isCommentsVisible) {
      fetchComments(activeShortId);
    }
  }, [activeShortId, isCommentsVisible]);

  // Gestion des événements de lecture/pause
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    
    const handlePause = () => {
      setIsCenterPaused(true);
      setIsCenterPlaying(false);
    };
    
    const handlePlay = () => {
      setIsCenterPaused(false);
      setIsCenterPlaying(true);
    };
    
    const handleEnded = () => {
      setIsCenterPaused(true);
      setIsCenterPlaying(false);
      // Optionnel: avancer automatiquement au short suivant
      if (centerIdx < shorts.length - 1) {
        handleHorizontalScroll('right');
      }
    };
    
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);
    
    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, [centerIdx, shorts, handleHorizontalScroll]);

  // Gestion de la progression de la vidéo
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

  // Gestion de la visibilité
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Si la vidéo n'est plus visible, la mettre en pause
        if (!entry.isIntersecting && isCenterPlaying && centerVideoRef.current) {
          centerVideoRef.current.pause();
        }
      },
      { threshold: 0.5 } // 50% de la vidéo doit être visible
    );
    
    if (centerVideoRef.current) {
      observer.observe(centerVideoRef.current);
    }
    
    return () => {
      if (centerVideoRef.current) {
        observer.unobserve(centerVideoRef.current);
      }
    };
  }, [isCenterPlaying]);

  // Gestion des touches du clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleHorizontalScroll('left');
      } else if (e.key === 'ArrowRight') {
        handleHorizontalScroll('right');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Empêcher le défilement de la page sur espace
        e.preventDefault();
        
        // Basculer lecture/pause sur espace
        if (centerVideoRef.current) {
          if (isCenterPlaying) {
            centerVideoRef.current.pause();
          } else {
            centerVideoRef.current.play();
          }
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleHorizontalScroll, isCenterPlaying]);

  // Gestionnaire de glisser-déposer pour la vidéo
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelected(files[0]);
    }
  };

  // Traitement du fichier vidéo sélectionné
  const handleFileSelected = (file) => {
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

  // Gestion du changement de fichier
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelected(file);
  };

  // Gestion des changements de formulaire
  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  // Soumission du formulaire
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
      setUploadProgress(0);
      setErrDuree('');
      
      const data = new FormData();
      data.append('titre', form.titre);
      data.append('artiste', form.artiste);
      data.append('duree', form.duree || 15);
      data.append('videoFile', form.video);
      
      if (form.description) {
        data.append('description', form.description);
      }

      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('Vous devez être connecté pour ajouter un short', 'error');
        setIsUploading(false);
        return;
      }
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Configurer la requête avec rapport de progression
      const response = await axios.post(`${apiBaseUrl}/api/videos/shorts`, data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        timeout: 120000, // 2 minutes
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      showFeedback('Short ajouté avec succès !', 'success');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null, description: '' });
      setErrDuree('');
      setUploadProgress(0);
      
      // Attendre un court délai avant de recharger la liste
      setTimeout(() => {
        fetchShorts();
      }, 1000);
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du short:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de l\'upload';
      setErrDuree(errorMessage);
      showFeedback(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Gestion des clics sur les cartes latérales
  const handleSideCardClick = (realIdx) => {
    if (realIdx === centerIdx) return;
    
    // Déterminer la direction
    const direction = realIdx > centerIdx ? 'right' : 'left';
    handleHorizontalScroll(direction);
  };

  // Gestion du basculement muet/son
  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    if (centerVideoRef.current) {
      centerVideoRef.current.muted = !isMuted;
    }
  };

  // Gestion de la lecture/pause
  const handlePlayPause = () => {
    if (!centerVideoRef.current) return;
    
    if (isCenterPlaying) {
      centerVideoRef.current.pause();
    } else {
      // Tenter de jouer la vidéo
      const playPromise = centerVideoRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Erreur de lecture automatique:', err);
          showFeedback('Cliquez à nouveau pour lire la vidéo', 'info');
        });
      }
    }
  };

  // Gestion des likes
  const handleLike = async (shortId) => {
    if (isLikeLoading) return;
    
    try {
      setIsLikeLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showFeedback('Vous devez être connecté pour aimer un short', 'error');
        return;
      }
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      const response = await axios.post(`${apiBaseUrl}/api/videos/${shortId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
        withCredentials: true
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

  // Gestion des partages
  const handleShare = async (shortId) => {
    if (isShareLoading) return;
    
    try {
      setIsShareLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        showFeedback('Vous devez être connecté pour partager un short', 'error');
        return;
      }
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      try {
        // Tenter d'appeler l'API de partage
        await axios.post(`${apiBaseUrl}/api/videos/${shortId}/share`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
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

  // Basculer la visibilité des commentaires
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
            <FaCloudUploadAlt /> Ajouter un Short
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
          <div className={`${styles.carouselContainer} ${direction === 'left' ? styles.swipeLeft : direction === 'right' ? styles.swipeRight : ''}`}>
            <div 
              className={styles.carouselRow}
              ref={carouselRef}
              onTouchStart={() => setDragging(false)}
              onTouchMove={() => setDragging(true)}
              onTouchEnd={(e) => {
                if (dragging) {
                  // Logique de swipe
                  const touchEndX = e.changedTouches[0].clientX;
                  const touchStartX = e.target.dataset.touchStartX;
                  
                  if (touchStartX && Math.abs(touchEndX - touchStartX) > 80) {
                    if (touchEndX < touchStartX) {
                      handleHorizontalScroll('right');
                    } else {
                      handleHorizontalScroll('left');
                    }
                  }
                }
              }}
              data-touch-start-x={(e) => e.touches[0].clientX}
            >
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
                            playsInline
                            crossOrigin="anonymous"
                            onError={(e) => {
                              console.error('Erreur de chargement vidéo:', e);
                              e.target.src = '/images/video-error.jpg';
                            }}
                          />
                          <div className={styles.centerOverlay}></div>
                          <button
                            className={styles.playBtn}
                            onClick={handlePlayPause}
                            aria-label={isCenterPlaying ? "Pause" : "Play"}
                          >
                            {isCenterPlaying ? <FaPause /> : <FaPlay />}
                          </button>
                          <button
                            className={styles.muteBtn}
                            onClick={handleMuteToggle}
                            aria-label={isMuted ? "Unmute" : "Mute"}
                          >
                            {isMuted ? 
                              <FaVolumeMute style={{color: '#b31217', fontSize: '1.5rem'}} /> : 
                              <FaVolumeUp style={{color: '#b31217', fontSize: '1.5rem'}} />
                            }
                          </button>
                        </div>
                        
                        {/* Barre de progression */}
                        <div className={styles.progressContainer}>
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
                              ['--progress']: `${(progress / (duration || 1)) * 100}%`
                            }}
                            disabled={duration === 0}
                            aria-label="Video progress"
                          />
                          
                          <div className={styles.timeDisplay}>
                            <span>{formatTime(progress)}</span>
                            <span>{formatTime(duration)}</span>
                          </div>
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
                              aria-label="Like"
                            >
                              <FaHeart />
                              <span className={styles.actionCount}>{short.likes || 0}</span>
                            </button>
                            <button 
                              className={`${styles.actionBtn} ${isShareLoading ? styles.disabled : ''}`}
                              onClick={() => handleShare(short._id)}
                              disabled={isShareLoading}
                              aria-label="Share"
                            >
                              <FaShareAlt />
                            </button>
                            <button 
                              className={`${styles.actionBtn} ${isCommentsVisible ? styles.active : ''}`}
                              onClick={toggleComments}
                              aria-label="Comments"
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
                                aria-label="Close comments"
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
                                      crossOrigin="anonymous"
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
                                aria-label="Add comment"
                              />
                              <button 
                                onClick={addComment}
                                disabled={!commentInput.trim()}
                                aria-label="Send comment"
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
                        role="button"
                        tabIndex="0"
                        aria-label={`Voir le short ${short.titre}`}
                      >
                        <video
                          src={short.youtubeUrl}
                          controls={false}
                          className={styles.sideImg}
                          autoPlay={false}
                          muted
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Erreur de chargement vidéo:', e);
                            e.target.src = '/images/video-error.jpg';
                          }}
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
            
            {/* Boutons de navigation */}
            {shorts.length > 1 && (
              <>
                {centerIdx > 0 && (
                  <button 
                    className={`${styles.navButton} ${styles.leftNav}`} 
                    onClick={() => handleHorizontalScroll('left')}
                    aria-label="Previous short"
                  >
                    <FaChevronLeft />
                  </button>
                )}
                
                {centerIdx < shorts.length - 1 && (
                  <button 
                    className={`${styles.navButton} ${styles.rightNav}`} 
                    onClick={() => handleHorizontalScroll('right')}
                    aria-label="Next short"
                  >
                    <FaChevronRight />
                  </button>
                )}
              </>
            )}
            
            {/* Indicateur de position */}
            {shorts.length > 1 && (
              <div className={styles.paginationIndicator}>
                {shorts.map((_, idx) => (
                  <span 
                    key={idx} 
                    className={`${styles.paginationDot} ${idx === centerIdx ? styles.activeDot : ''}`}
                    onClick={() => setCenterIdx(idx)}
                    role="button"
                    tabIndex="0"
                    aria-label={`Aller au short ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Bouton pour charger plus de shorts */}
        {hasMoreShorts && shorts.length > 0 && (
          <div className={styles.loadMoreContainer}>
            <button 
              className={styles.loadMoreBtn}
              onClick={loadMoreShorts}
              disabled={isLoadingMore}
              aria-label="Load more shorts"
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
        <div className={styles.modalOverlay} onClick={() => !isUploading && setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Ajouter un Short</h2>
              <button 
                className={styles.closeBtn} 
                onClick={() => !isUploading && setShowModal(false)}
                disabled={isUploading}
                aria-label="Close modal"
              >
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
                  aria-required="true"
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
                  aria-required="true"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Description (optionnelle)</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={form.description}
                  onChange={handleChange}
                  disabled={isUploading}
                  placeholder="Décrivez votre short (optionnel)"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Vidéo (10–30 s)</label>
                <div 
                  className={`${styles.fileUploadContainer} ${dragActive ? styles.dragActive : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
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
                    aria-label="Sélectionner une vidéo"
                  />
                </div>
                
                {form.video && (
                  <div className={styles.filePreview}>
                    <video 
                      src={URL.createObjectURL(form.video)} 
                      controls={true}
                      muted
                      playsInline
                    />
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
                
                {isUploading && (
                  <div className={styles.uploadProgressContainer}>
                    <div 
                      className={styles.uploadProgressBar} 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                    <span className={styles.uploadProgressText}>{uploadProgress}% Uploading...</span>
                  </div>
                )}
              </div>
            </form>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => !isUploading && setShowModal(false)}
                disabled={isUploading}
                aria-label="Cancel"
              >
                Annuler
              </button>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleSubmit}
                disabled={isUploading || !form.video || !form.titre || !form.artiste}
                aria-label="Upload"
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
        <div className={`${styles.feedback} ${styles[feedback.type]}`} role="alert">
          {feedback.message}
        </div>
      )}
    </div>
  );
}