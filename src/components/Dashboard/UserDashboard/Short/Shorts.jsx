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
  
  // États pour les animations et interactions
  const [dragging, setDragging] = useState(false);
  const [direction, setDirection] = useState(null);
  const [transition, setTransition] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  
  // États pour l'upload et la pagination
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingShorts, setIsLoadingShorts] = useState(true);
  
  // États pour les commentaires et interactions
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [activeShortId, setActiveShortId] = useState(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });
  const [dragActive, setDragActive] = useState(false);

  // Fonction optimisée pour récupérer les shorts avec mécanisme de retry
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
          console.log(`Tentative ${attempts} de récupération des shorts...`);
          
          response = await axios.get(`${apiBaseUrl}/api/videos`, {
            params: {
              type: 'short',
              page: 1,
              limit: 10
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
      
      console.log('Shorts response:', response.data);
      
      // Différentes possibilités de structure de réponse
      let shortsData = [];
      
      if (response.data && Array.isArray(response.data.data)) {
        // Format 1: { data: [...] }
        shortsData = response.data.data;
        setHasMoreShorts(response.data.pagination?.page < response.data.pagination?.totalPages);
      } else if (response.data && Array.isArray(response.data)) {
        // Format 2: [...] (tableau direct)
        shortsData = response.data;
        setHasMoreShorts(response.data.length >= 10);
      } else if (response.data && response.data.videos && Array.isArray(response.data.videos)) {
        // Format 3: { videos: [...] }
        shortsData = response.data.videos;
        setHasMoreShorts(response.data.pagination?.page < response.data.pagination?.totalPages);
      } else {
        console.warn('Format de réponse inattendu:', response.data);
        shortsData = [];
        setHasMoreShorts(false);
      }
      
      // Traiter les URLs de vidéos pour qu'elles soient absolues
      shortsData = shortsData.map(short => ({
        ...short,
        youtubeUrl: getFullVideoUrl(short.youtubeUrl)
      }));
      
      setShorts(shortsData);
      
      // Si nous avons des shorts, mettre à jour l'ID actif
      if (shortsData.length > 0) {
        setActiveShortId(shortsData[0]._id);
      }
      
    } catch (err) {
      // Gestion d'erreur améliorée
      console.error('Erreur détaillée lors du chargement des shorts:', err);
      
      // Détection d'erreurs spécifiques
      if (err.code === 'ECONNABORTED') {
        showFeedback('Le serveur met trop de temps à répondre. Veuillez réessayer.', 'error');
      } else if (err.response?.status === 401) {
        showFeedback('Votre session a expiré. Veuillez vous reconnecter.', 'error');
        // Rediriger vers la page de connexion après un délai
        setTimeout(() => {
          window.location.href = '/login';
        }, 2000);
      } else {
        showFeedback('Erreur lors du chargement des shorts. Veuillez réessayer.', 'error');
      }
      
      setShorts([]);
      setHasMoreShorts(false);
    } finally {
      setIsLoadingShorts(false);
    }
  };

  const loadMoreShorts = async () => {
    if (!hasMoreShorts || isLoadingMore) return;
    
    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;
      
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      const res = await axios.get(`${apiBaseUrl}/api/videos`, {
        params: {
          type: 'short',
          page: nextPage,
          limit: 10
        },
        timeout: 30000,
        withCredentials: true
      });
      
      let newShorts = [];
      if (res.data && Array.isArray(res.data.data)) {
        newShorts = res.data.data;
      } else if (res.data && Array.isArray(res.data)) {
        newShorts = res.data;
      } else if (res.data && res.data.videos && Array.isArray(res.data.videos)) {
        newShorts = res.data.videos;
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
      // Utiliser l'URL absolue du backend
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      console.log('Fetching comments for short:', shortId);
      
      // Tentative de récupération des commentaires via l'API
      const response = await axios.get(`${apiBaseUrl}/api/videos/${shortId}/memories`, {
        timeout: 15000, // 15 secondes
        withCredentials: true
      });
      
      console.log('Comments response:', response.data);
      
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

  // Fonction optimisée pour gérer le défilement horizontal
  const handleHorizontalScroll = useCallback((direction) => {
    if (shorts.length <= 1 || transition) return;
    
    // Pauser la vidéo actuelle
    if (centerVideoRef.current) {
      centerVideoRef.current.pause();
      setIsCenterPlaying(false);
    }
    
    // Calculer le nouvel index central
    const newIndex = direction === 'right' 
      ? Math.min(centerIdx + 1, shorts.length - 1)
      : Math.max(centerIdx - 1, 0);
    
    if (newIndex !== centerIdx) {
      setDirection(direction);
      setTransition(true);
      
      // Appliquer la transition avec délai
      setTimeout(() => {
        setCenterIdx(newIndex);
        
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

  // Gérer les interactions tactiles
  const handleTouchStart = (e) => {
    setDragStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    if (!dragStart) return;
    
    const currentPosition = e.touches[0].clientX;
    const difference = dragStart - currentPosition;
    
    // Détecter la direction si le mouvement est suffisant
    if (Math.abs(difference) > 50) {
      setDragging(true);
    }
  };

  const handleTouchEnd = (e) => {
    if (!dragStart || !dragging) return;
    
    const currentPosition = e.changedTouches[0].clientX;
    const difference = dragStart - currentPosition;
    
    // Si le mouvement est suffisamment important, changer de short
    if (Math.abs(difference) > 80) {
      if (difference > 0) {
        // Swipe gauche -> short suivant
        handleHorizontalScroll('right');
      } else {
        // Swipe droit -> short précédent
        handleHorizontalScroll('left');
      }
    }
    
    setDragStart(0);
    setDragging(false);
  };

  // Fonction optimisée pour gérer la lecture des vidéos
  const handleVideoPlayback = useCallback(() => {
    if (!centerVideoRef.current) return;
    
    if (isCenterPlaying) {
      centerVideoRef.current.pause();
      setIsCenterPlaying(false);
    } else {
      // Pause toutes les autres vidéos avant de jouer celle-ci
      const videos = document.querySelectorAll('video');
      videos.forEach((video) => {
        if (video !== centerVideoRef.current) {
          video.pause();
        }
      });
      
      // Jouer la vidéo avec gestion d'erreur
      try {
        const playPromise = centerVideoRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsCenterPlaying(true);
            })
            .catch(err => {
              console.error('Erreur lors de la lecture:', err);
              // Si erreur d'autoplay par exemple
              showFeedback('Cliquez à nouveau pour lire la vidéo', 'info');
            });
        }
      } catch (err) {
        console.error('Erreur lors de la lecture:', err);
      }
    }
  }, [isCenterPlaying]);

  useEffect(() => {
    console.log('Initializing Shorts component');
    fetchShorts();
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

  // Utiliser l'Intersection Observer pour mettre en pause la vidéo hors écran
  useEffect(() => {
    if (!centerVideoRef.current) return;
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isCenterPlaying && centerVideoRef.current) {
          centerVideoRef.current.pause();
          setIsCenterPlaying(false);
        }
      },
      { threshold: 0.5 }
    );
    
    observer.observe(centerVideoRef.current);
    
    return () => {
      if (centerVideoRef.current) {
        observer.unobserve(centerVideoRef.current);
      }
    };
  }, [centerVideoRef.current, isCenterPlaying]);

  // Ajoute des écouteurs pour les touches de clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleHorizontalScroll('left');
      } else if (e.key === 'ArrowRight') {
        handleHorizontalScroll('right');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Basculer lecture/pause sur espace
        handleVideoPlayback();
        e.preventDefault(); // Empêcher le défilement par défaut
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleHorizontalScroll, handleVideoPlayback]);

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

  // Fonction améliorée pour l'upload avec progression
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
      
      // Tenter avec un endpoint alternatif en cas d'échec
      try {
        const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
        const token = localStorage.getItem('token');
        const data = new FormData();
        data.append('titre', form.titre);
        data.append('artiste', form.artiste);
        data.append('duree', form.duree || 15);
        data.append('videoFile', form.video);
        
        if (form.description) {
          data.append('description', form.description);
        }
        
        const response = await axios.post(`${apiBaseUrl}/api/videos/short`, data, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          timeout: 120000,
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
        
        setTimeout(() => {
          fetchShorts();
        }, 1000);
        
      } catch (fallbackErr) {
        const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de l\'upload';
        setErrDuree(errorMessage);
        showFeedback(errorMessage, 'error');
      }
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
            <p>Loading shorts...</p>
          </div>
        ) : shorts.length === 0 ? (
          <div className={styles.noContent}>
            <p>No shorts available at the moment.</p>
            <button className={styles.newPostBtn} onClick={() => setShowModal(true)}>
              Be the first to add a Short!
            </button>
          </div>
        ) : (
          <div 
            className={`${styles.carouselRow} ${
              direction === 'left' ? styles.swipeLeft : 
              direction === 'right' ? styles.swipeRight : ''
            }`} 
            ref={carouselRef}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            style={{
              cursor: dragging ? 'grabbing' : 'grab',
              touchAction: 'pan-y',
            }}
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
                          src={getFullVideoUrl(short.youtubeUrl)}
                          controls={false}
                          className={styles.centerImg}
                          autoPlay={false}
                          muted={isMuted}
                          loop
                          crossOrigin="anonymous" 
                        />
                        <div className={styles.centerOverlay}></div>
                        <button
                          className={styles.playBtn}
                          onClick={handleVideoPlayback}
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
                            <h3>Comments</h3>
                            <button 
                              className={styles.collapseBtn}
                              onClick={toggleComments}
                              aria-label="Hide comments"
                            >
                              <FaChevronDown />
                            </button>
                          </div>
                          
                          <div className={styles.commentsList}>
                            {comments.length === 0 ? (
                              <p className={styles.noComments}>No comments yet.</p>
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
                      aria-label={`Select ${short.titre}`}
                    >
                      <video
                        src={getFullVideoUrl(short.youtubeUrl)}
                        controls={false}
                        className={styles.sideImg}
                        autoPlay={false}
                        muted
                        crossOrigin="anonymous"
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
        
        {/* Boutons de navigation */}
        {shorts.length > 0 && (
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
          <div className={styles.positionIndicator}>
            {shorts.map((_, index) => (
              <span 
                key={index} 
                className={`${styles.positionDot} ${index === centerIdx ? styles.activeDot : ''}`}
                onClick={() => setCenterIdx(index)}
              />
            ))}
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
                  <span>Loading...</span>
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
              <h2>Add Short</h2>
              <button 
                className={styles.closeBtn} 
                onClick={() => setShowModal(false)}
                aria-label="Close"
              >
                <FaTimes />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="titre">Title</label>
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
                <label htmlFor="artiste">Artist</label>
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
                <label htmlFor="description">Description (optional)</label>
                <input
                  id="description"
                  name="description"
                  type="text"
                  value={form.description}
                  onChange={handleChange}
                  disabled={isUploading}
                  placeholder="Ajoutez une description"
                />
              </div>
              
              <div className={styles.formGroup}>
                <label>Video (10–30 s)</label>
                <div 
                  className={`${styles.fileUploadContainer} ${dragActive ? styles.dragActive : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={() => setDragActive(false)}
                  onDrop={() => setDragActive(false)}
                >
                  <div className={styles.fileUploadIcon}>
                    <FaCloudUploadAlt />
                  </div>
                  <div className={styles.fileUploadText}>
                    Drag and drop your video file or click to select
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

              {/* Barre de progression */}
              {isUploading && (
                <div className={styles.uploadProgressContainer}>
                  <div 
                    className={styles.uploadProgressBar} 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                  <span className={styles.uploadProgressText}>{uploadProgress}% Uploading...</span>
                </div>
              )}
            </form>
            
            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => setShowModal(false)}
                disabled={isUploading}
              >
                Cancel
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