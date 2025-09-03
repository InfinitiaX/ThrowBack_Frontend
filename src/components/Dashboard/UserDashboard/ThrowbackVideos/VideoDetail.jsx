import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { videoAPI } from '../../../../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faHeart,
  faComment,
  faEye,
  faShare,
  faSpinner,
  faExclamationTriangle,
  faCopy,
  faList,
  faFilter,
  faTimes,
  faArrowLeft,
  faThumbsUp
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';
import Toaster from '../../../common/Toaster'; // Supposons que ce composant existe ou nous le définirons

/* ========= Styled Confirm Dialog ========= */
const ConfirmDialog = ({
  open,
  title = 'Delete',
  message = 'Are you sure you want to delete this item? This action cannot be undone.',
  confirmText = 'Delete',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => {
  const cardRef = useRef(null);
  const confirmBtnRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.();
      if (e.key === 'Enter') onConfirm?.();
    };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => {
      clearTimeout(t);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel, onConfirm]);

  const handleOverlayClick = (e) => {
    if (cardRef.current && !cardRef.current.contains(e.target)) onCancel?.();
  };

  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={handleOverlayClick}>
      <div className={styles.modalCard} ref={cardRef} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4>{title}</h4>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={styles.modalBody}>
          <p>{message}</p>
        </div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancel} onClick={onCancel}>{cancelText}</button>
          <button className={styles.modalConfirm} onClick={onConfirm} ref={confirmBtnRef}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
/* ========= /Confirm Dialog ========= */

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = window.innerWidth <= 768;
  
  // Main states
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [allMemories, setAllMemories] = useState([]);
  const [memoryText, setMemoryText] = useState('');
  const [showAllMemories, setShowAllMemories] = useState(false);
  const [notification, setNotification] = useState(null);

  // Interaction states
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  const [memoriesVisible, setMemoriesVisible] = useState(!isMobile);

  // Interface states
  const [videosLoading, setVideosLoading] = useState(false);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Confirm modal
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const requestTokenRef = useRef({ video: 0, memories: 0 });

  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    fetchAllVideos();
    fetchAllMemories();
    window.addEventListener('storage', handleStorageChange);
    
    // Responsive listener
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setMemoriesVisible(!mobile);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('resize', handleResize);
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchVideoById(id);
    fetchVideoMemories(id);
    window.scrollTo(0, 0);
    localStorage.setItem('currentVideoId', id);
  }, [id]);

  const handleStorageChange = (event) => {
    if (event.key === 'memoriesUpdated' && event.newValue) fetchVideoMemories(id);
  };

  const showNotification = (message, type = 'success', duration = 3000) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), duration);
  };

  /* ---------- Data fetching ---------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const videosData = await videoAPI.getAllVideos({ type: 'music', limit: '50' });
      setAllVideos(Array.isArray(videosData) ? videosData : []);
    } catch (error) {
      console.error("Error fetching videos:", error);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchAllMemories = async () => {
    try {
      setMemoriesLoading(true);
      let memoriesData = await videoAPI.getAllMemories();
      if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
        try {
          const cached = localStorage.getItem('allMemories');
          if (cached) memoriesData = JSON.parse(cached);
        } catch {}
      }
      setAllMemories(Array.isArray(memoriesData) ? memoriesData : []);
      try {
        localStorage.setItem('allMemories', JSON.stringify(Array.isArray(memoriesData) ? memoriesData : []));
        localStorage.setItem('memoriesFetchTime', Date.now().toString());
      } catch {}
    } finally {
      setMemoriesLoading(false);
    }
  };

  const filterMemoriesForCurrentVideo = (memoriesArray, videoId) => {
    if (!videoId || !Array.isArray(memoriesArray) || !memoriesArray.length) return [];
    const currentVideoId = videoId.toString().trim();
    return memoriesArray.filter(memory => {
      const memoryVideoId =
        (memory.video && typeof memory.video === 'object' ? memory.video._id : null) ||
        (memory.video && typeof memory.video === 'string' ? memory.video : null) ||
        memory.videoId ||
        memory.video_id;
      const normalized = memoryVideoId ? memoryVideoId.toString().trim() : '';
      return normalized === currentVideoId;
    });
  };

  const fetchVideoById = async (videoId) => {
    const myToken = ++requestTokenRef.current.video;
    try {
      setLoading(true);
      setError(null);
      console.log(`Fetching video details for ID: ${videoId}`);
      const videoData = await videoAPI.getVideoById(videoId);
      if (myToken !== requestTokenRef.current.video) return;
      if (videoData) {
        console.log(`Video data received:`, videoData);
        setVideo(videoData);
        setUserLiked(videoData.userInteraction?.liked || false);
        setViewCount(videoData.vues || 0);
        setLikeCount(videoData.likes || 0);
      } else {
        setError('Unable to load video details');
        console.error('No video data received');
      }
    } catch (error) {
      console.error(`Error fetching video ${videoId}:`, error);
      if (myToken !== requestTokenRef.current.video) return;
      setError('Error loading video');
    } finally {
      if (myToken === requestTokenRef.current.video) setLoading(false);
    }
  };

  // Récupération des commentaires simplifiée et plus fiable
  const fetchVideoMemories = async (videoId) => {
    try {
      console.log(`Fetching memories for video: ${videoId}`);
      setMemoriesLoading(true);
      
      // Essai direct de l'API publique
      try {
        const response = await api.get(`/api/public/videos/${videoId}/memories`);
        console.log('Public API response:', response.data);
        
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
          const memories = response.data.data;
          console.log(`Found ${memories.length} memories via public API`);
          setMemories(formatMemories(memories, videoId));
          return;
        }
      } catch (error) {
        console.warn('Error with public API:', error.message);
      }
      
      // Essai avec l'API standard
      try {
        const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
        console.log('Fallback API response:', fallbackResponse.data);
        
        if (fallbackResponse.data && fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
          const memories = fallbackResponse.data.data;
          console.log(`Found ${memories.length} memories via fallback API`);
          setMemories(formatMemories(memories, videoId));
          return;
        }
      } catch (error) {
        console.warn('Error with fallback API:', error.message);
      }
      
      // Si tout échoue, essayer le cache
      try {
        const cachedMemories = localStorage.getItem('allMemories');
        if (cachedMemories) {
          const parsed = JSON.parse(cachedMemories);
          const filtered = filterMemoriesForCurrentVideo(parsed, videoId);
          console.log(`Found ${filtered.length} memories in cache`);
          if (filtered.length > 0) {
            setMemories(formatMemories(filtered, videoId));
            return;
          }
        }
      } catch (error) {
        console.warn('Error with cache:', error.message);
      }
      
      // Dernier recours: tableau vide
      console.log('No memories found from any source');
      setMemories([]);
    } catch (error) {
      console.error(`Error fetching memories for video ${videoId}:`, error);
      setMemories([]);
    } finally {
      setMemoriesLoading(false);
    }
  };

  /* ---------- Memories helpers ---------- */
  const formatMemories = (memoriesData, currentVideoId = id) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) return [];
    return memoriesData.map(memory => {
      let username = 'User';
      if (memory.auteur) {
        if (typeof memory.auteur === 'object') {
          const prenom = memory.auteur.prenom || '';
          const nom = memory.auteur.nom || '';
          username = (prenom || nom) ? `${prenom} ${nom}`.trim() : (memory.auteur.username || 'User');
        } else if (typeof memory.auteur === 'string' && memory.auteurDetails) {
          const prenom = memory.auteurDetails.prenom || '';
          const nom = memory.auteurDetails.nom || '';
          username = `${prenom} ${nom}`.trim() || memory.auteurDetails.username || 'User';
        }
      } else if (memory.username) {
        username = memory.username;
      }

      const videoDetails = {
        id: currentVideoId,
        title: memory.video?.titre || memory.videoTitle || video?.titre || 'Untitled video',
        artist: memory.video?.artiste || memory.videoArtist || video?.artiste || 'Unknown artist',
        year: memory.video?.annee || memory.videoYear || video?.annee || '----'
      };

      return {
        id: memory._id || memory.id || `memory-${Math.random()}`,
        username,
        type: memory.type || 'posted',
        videoId: videoDetails.id,
        videoTitle: videoDetails.title,
        videoArtist: videoDetails.artist,
        videoYear: videoDetails.year,
        imageUrl: memory.auteur?.photo_profil || memory.imageUrl || '/images/default-avatar.jpg',
        content: memory.contenu || memory.content || '',
        likes: memory.likes || 0,
        comments: memory.nb_commentaires || memory.comments || 0,
        auteur: memory.auteur,
        video: memory.video,
        originalVideoId: videoDetails.id,
        currentVideoId,
        userInteraction: memory.userInteraction || { liked: false, disliked: false, isAuthor: false },
        replies: memory.replies || [],
        showReplies: false
      };
    });
  };

  const fetchReplies = async (memoryId) => {
    try {
      console.log(`Fetching replies for memory: ${memoryId}`);
      setMemoriesLoading(true);
      
      // Essai direct de l'API standard
      try {
        const response = await api.get(`/api/memories/${memoryId}/replies`);
        console.log('Reply API response:', response.data);
        if (response.data?.success && Array.isArray(response.data.data)) {
          return response.data.data;
        }
      } catch (error) {
        console.warn('Error with standard reply API:', error.message);
      }
      
      // Essai avec l'API publique
      try {
        const fallbackResponse = await api.get(`/api/public/memories/${memoryId}/replies`);
        console.log('Fallback reply API response:', fallbackResponse.data);
        if (fallbackResponse.data?.success && Array.isArray(fallbackResponse.data.data)) {
          return fallbackResponse.data.data;
        }
      } catch (error) {
        console.warn('Error with fallback reply API:', error.message);
      }
      
      return [];
    } finally {
      setMemoriesLoading(false);
    }
  };

  const handleToggleReplies = async (memoryId) => {
    if (memoriesLoading) return;
    
    console.log(`Toggling replies for memory: ${memoryId}`);
    const idx = memories.findIndex(m => m.id === memoryId);
    if (idx === -1) {
      console.warn(`Memory ${memoryId} not found in current memories`);
      return;
    }
    
    const item = memories[idx];
    
    // Si déjà affiché, masquer les réponses
    if (item.showReplies) {
      console.log(`Hiding replies for memory: ${memoryId}`);
      const updated = [...memories];
      updated[idx] = { ...item, showReplies: false };
      setMemories(updated);
      return;
    }
    
    // Si aucune réponse n'est chargée, les récupérer
    if (!item.replies || item.replies.length === 0) {
      console.log(`Loading replies for memory: ${memoryId}`);
      const replies = await fetchReplies(memoryId);
      console.log(`Got ${replies.length} replies`);
      const updated = [...memories];
      updated[idx] = { ...item, replies, showReplies: true };
      setMemories(updated);
    } else {
      // Sinon, afficher les réponses déjà chargées
      console.log(`Showing ${item.replies.length} cached replies`);
      const updated = [...memories];
      updated[idx] = { ...item, showReplies: true };
      setMemories(updated);
    }
  };

  const handleAddReply = async (memoryId, replyText) => {
    console.log(`Adding reply to memory ${memoryId}: "${replyText}"`);
    try {
      // Essai direct sur l'API standard
      try {
        console.log('Trying standard API for reply');
        const response = await api.post(`/api/memories/${memoryId}/replies`, { contenu: replyText });
        if (response.data?.success) {
          console.log('Reply added successfully via standard API:', response.data);
          const newReply = response.data.data;
          
          // Mise à jour optimiste de l'UI
          const updated = memories.map(m => (m.id === memoryId)
            ? { 
                ...m, 
                nb_commentaires: (m.nb_commentaires || 0) + 1, 
                replies: [...(m.replies || []), newReply],
                showReplies: true // Auto-afficher les réponses
              }
            : m
          );
          
          setMemories(updated);
          showNotification('Reply added successfully');
          return true;
        }
      } catch (error) {
        console.warn('Standard API failed for reply:', error.message);
      }
      
      // Essai sur l'API publique
      try {
        console.log('Trying public API for reply');
        const fallback = await api.post(`/api/public/memories/${memoryId}/replies`, { contenu: replyText });
        if (fallback.data?.success) {
          console.log('Reply added successfully via public API:', fallback.data);
          const newReply = fallback.data.data;
          
          // Mise à jour optimiste de l'UI
          const updated = memories.map(m => (m.id === memoryId)
            ? { 
                ...m, 
                nb_commentaires: (m.nb_commentaires || 0) + 1, 
                replies: [...(m.replies || []), newReply],
                showReplies: true // Auto-afficher les réponses
              }
            : m
          );
          
          setMemories(updated);
          showNotification('Reply added successfully');
          return true;
        }
      } catch (error) {
        console.warn('Public API failed for reply:', error.message);
      }
      
      // Si tout échoue
      console.error('All reply attempts failed');
      if (error.response?.status === 401) {
        showNotification('Please log in to add a reply', 'error');
      } else {
        showNotification('Error adding reply. Please try again.', 'error');
      }
      return false;
    } catch (error) {
      console.error('Unexpected error adding reply:', error);
      showNotification('An unexpected error occurred', 'error');
      return false;
    }
  };

  const handleLikeMemory = async (memoryId) => {
    console.log(`Liking memory: ${memoryId}`);
    try {
      // Mise à jour optimiste (gère à la fois les cartes et les réponses)
      setMemories(memories.map(m => (m.id === memoryId ? {
        ...m,
        likes: m.userInteraction?.liked ? Math.max(0, (m.likes || 0) - 1) : (m.likes || 0) + 1,
        userInteraction: { ...(m.userInteraction || {}), liked: !m.userInteraction?.liked }
      } : {
        ...m,
        replies: (m.replies || []).map(r => ((r.id || r._id) === memoryId
          ? {
              ...r,
              likes: r.userInteraction?.liked ? Math.max(0, (r.likes || 0) - 1) : (r.likes || 0) + 1,
              userInteraction: { ...(r.userInteraction || {}), liked: !r.userInteraction?.liked }
            }
          : r))
      })));

      // Synchronisation serveur
      const r = await videoAPI.likeMemory(memoryId);
      if (r?.success && r.data) {
        console.log('Like response from server:', r.data);
        setMemories(cur => cur.map(m => (m.id === memoryId ? {
          ...m,
          likes: r.data.likes,
          userInteraction: { ...(m.userInteraction || {}), liked: r.data.liked }
        } : {
          ...m,
          replies: (m.replies || []).map(rp => ((rp.id || rp._id) === memoryId
            ? { ...rp, likes: r.data.likes, userInteraction: { ...(rp.userInteraction || {}), liked: r.data.liked } }
            : rp))
        })));
      }
    } catch (err) {
      console.error('Error liking memory:', err);
      if (err.response?.status === 401) {
        showNotification('Please log in to like this item', 'error');
      } else {
        showNotification('Error liking the item', 'error');
      }
    }
  };

  // Confirmation modal helpers
  const openConfirm = (title, message, onConfirm) => {
    setConfirm({
      open: true,
      title,
      message,
      onConfirm: () => {
        setConfirm({ open: false, title: '', message: '', onConfirm: null });
        onConfirm();
      }
    });
  };
  const cancelConfirm = () => setConfirm({ open: false, title: '', message: '', onConfirm: null });

  // Fonction améliorée pour la suppression des commentaires
  const handleDeleteMemory = async (memoryId) => {
    console.log(`Requesting deletion of memory: ${memoryId}`);
    
    openConfirm(
      'Delete Memory',
      'Are you sure you want to delete this item? This action cannot be undone.',
      async () => {
        try {
          console.log(`Confirmed deletion of memory: ${memoryId}`);
          
          // Mise à jour optimiste de l'UI
          const updatedMemories = memories.filter(m => m.id !== memoryId);
          setMemories(updatedMemories);
          
          // Essai de suppression via l'API standard
          try {
            console.log('Attempting to delete via standard API');
            const response = await api.delete(`/api/memories/${memoryId}`);
            console.log('Standard API delete response:', response.data);
            showNotification('Memory deleted successfully');
            return;
          } catch (standardError) {
            console.warn('Standard API delete failed:', standardError.message);
          }
          
          // Essai via l'API publique en cas d'échec
          try {
            console.log('Attempting to delete via public API');
            const fallbackResponse = await api.delete(`/api/public/memories/${memoryId}`);
            console.log('Public API delete response:', fallbackResponse.data);
            showNotification('Memory deleted successfully');
            return;
          } catch (publicError) {
            console.error('Public API delete also failed:', publicError.message);
          }
          
          // Restauration en cas d'échec complet et notification
          console.error('All deletion attempts failed, restoring state');
          showNotification('Failed to delete memory. Please try again.', 'error');
          fetchVideoMemories(id);
        } catch (error) {
          console.error('Unexpected error deleting memory:', error);
          showNotification('An unexpected error occurred', 'error');
          fetchVideoMemories(id);
        }
      }
    );
  };

  // Fonction améliorée pour la suppression des réponses
  const handleDeleteReply = async (replyId) => {
    console.log(`Requesting deletion of reply: ${replyId}`);
    
    // Trouver d'abord le commentaire parent
    let parentMemoryId = null;
    let replyIndex = -1;
    
    for (let i = 0; i < memories.length; i++) {
      const memory = memories[i];
      const rIndex = (memory.replies || []).findIndex(r => 
        (r.id || r._id) === replyId
      );
      
      if (rIndex !== -1) {
        parentMemoryId = memory.id;
        replyIndex = rIndex;
        break;
      }
    }
    
    if (!parentMemoryId) {
      console.error(`Could not find parent memory for reply: ${replyId}`);
      showNotification('Cannot locate the parent comment', 'error');
      return;
    }
    
    console.log(`Found parent memory ${parentMemoryId} for reply ${replyId} at index ${replyIndex}`);
    
    openConfirm(
      'Delete Reply',
      'Are you sure you want to delete this reply? This action cannot be undone.',
      async () => {
        try {
          console.log(`Confirmed deletion of reply: ${replyId}`);
          
          // Mise à jour optimiste de l'UI
          const updatedMemories = memories.map(memory => {
            if (memory.id === parentMemoryId) {
              const updatedReplies = [...memory.replies];
              updatedReplies.splice(replyIndex, 1);
              return { 
                ...memory, 
                replies: updatedReplies,
                nb_commentaires: Math.max(0, (memory.nb_commentaires || memory.replies.length) - 1)
              };
            }
            return memory;
          });
          
          setMemories(updatedMemories);
          
          // Essai de suppression via l'API standard
          try {
            console.log(`Attempting to delete reply via standard API: /api/memories/${parentMemoryId}/replies/${replyId}`);
            const response = await api.delete(`/api/memories/${parentMemoryId}/replies/${replyId}`);
            console.log('Standard API delete reply response:', response.data);
            showNotification('Reply deleted successfully');
            return;
          } catch (standardError) {
            console.warn('Standard API delete reply failed:', standardError.message);
          }
          
          // Essai via l'API publique en cas d'échec
          try {
            console.log(`Attempting to delete reply via public API: /api/public/memories/${parentMemoryId}/replies/${replyId}`);
            const fallbackResponse = await api.delete(`/api/public/memories/${parentMemoryId}/replies/${replyId}`);
            console.log('Public API delete reply response:', fallbackResponse.data);
            showNotification('Reply deleted successfully');
            return;
          } catch (publicError) {
            console.error('Public API delete reply also failed:', publicError.message);
          }
          
          // Restauration en cas d'échec complet
          console.error('All deletion attempts failed, restoring state');
          showNotification('Failed to delete reply. Please try again.', 'error');
          fetchVideoMemories(id);
        } catch (error) {
          console.error('Unexpected error deleting reply:', error);
          showNotification('An unexpected error occurred', 'error');
          fetchVideoMemories(id);
        }
      }
    );
  };

  /* ---------- Video interactions ---------- */
  const handleLikeVideo = async () => {
    if (isLiking) return;
    
    console.log('Liking video:', id);
    try {
      setIsLiking(true);
      
      // Mise à jour optimiste
      const newLikedState = !userLiked;
      const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      setUserLiked(newLikedState);
      setLikeCount(newLikeCount);

      // Synchronisation serveur
      const response = await videoAPI.likeVideo(id);
      console.log('Video like response:', response);
      
      if (response.success && response.data) {
        setUserLiked(response.data.liked);
        setLikeCount(response.data.likes);
        showNotification(response.data.liked ? 'Video liked!' : 'Like removed');
      } else {
        // Restauration en cas de problème
        setUserLiked(!newLikedState);
        setLikeCount(likeCount);
        showNotification('Error updating like status', 'error');
      }
    } catch (err) {
      console.error('Error liking video:', err);
      
      // Restauration de l'état
      setUserLiked(!userLiked);
      setLikeCount(likeCount);
      
      if (err.response?.status === 401) {
        showNotification('Please log in to like this video', 'error');
      } else {
        showNotification('Error liking the video. Please try again.', 'error');
      }
    } finally {
      setIsLiking(false);
    }
  };

  const handleShareVideo = () => setShowShareOptions(!showShareOptions);
  
  const handleShareOption = async (option) => {
    const videoUrl = window.location.href;
    const videoTitle = video ? `${video.artiste} - ${video.titre}` : 'ThrowBack video';
    
    try {
      switch (option) {
        case 'copy':
          await navigator.clipboard.writeText(videoUrl);
          showNotification('URL copied to clipboard!');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this awesome throwback: ${videoTitle}`)}&url=${encodeURIComponent(videoUrl)}`, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this awesome throwback: ${videoTitle} ${videoUrl}`)}`, '_blank');
          break;
        default: return;
      }
      
      // Enregistrer le partage côté serveur
      videoAPI.shareVideo(id).catch(() => {
        console.warn('Error recording share on server');
      });
    } catch (error) {
      console.error('Error sharing:', error);
      showNotification('Error sharing', 'error');
    }
    
    setShowShareOptions(false);
  };

  /* ---------- Add Memory ---------- */
  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!memoryText.trim() || isAddingMemory) return;
    
    console.log(`Adding memory for video ${id}: "${memoryText}"`);
    
    try {
      setIsAddingMemory(true);
      let serverMemory = null;

      // Tentative via API publique
      try {
        console.log('Trying public API for adding memory');
        const res = await api.post(`/api/public/videos/${id}/memories`, {
          contenu: memoryText.trim(), 
          video_id: id, 
          videoId: id, 
          video: id
        });
        
        if (res.data?.success) {
          console.log('Memory added successfully via public API:', res.data);
          serverMemory = res.data.data;
        }
      } catch (publicError) {
        console.warn('Public API failed for adding memory:', publicError.message);
      }

      // Tentative via API standard si la première échoue
      if (!serverMemory) {
        try {
          console.log('Trying standard API for adding memory');
          const fb = await api.post(`/api/videos/${id}/memories`, {
            contenu: memoryText.trim(), 
            video_id: id, 
            videoId: id, 
            video: id
          });
          
          if (fb.data?.success) {
            console.log('Memory added successfully via standard API:', fb.data);
            serverMemory = fb.data.data;
          }
        } catch (standardError) {
          console.warn('Standard API failed for adding memory:', standardError.message);
        }
      }

      if (!serverMemory) {
        console.error('All attempts to add memory failed');
        throw new Error('Error adding memory');
      }

      // Préparation du nouveau commentaire avec les données vidéo
      const newMemoryData = {
        ...serverMemory,
        video: { _id: id, titre: video?.titre, artiste: video?.artiste, annee: video?.annee },
        videoId: id
      };
      
      // Formatage et ajout à l'UI
      const newMemory = formatMemories([newMemoryData])[0];
      setMemories(prev => [newMemory, ...prev]);
      
      // Mise à jour du cache global
      const updatedAll = [newMemoryData, ...allMemories];
      setAllMemories(updatedAll);
      
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAll));
        localStorage.setItem('memoriesUpdated', Date.now().toString());
      } catch (storageError) {
        console.warn('Error updating memory cache:', storageError);
      }

      setMemoryText('');
      showNotification('Memory added successfully!');
    } catch (err) {
      console.error('Error adding memory:', err);
      
      if (err.response?.status === 401) {
        showNotification('Please log in to share a memory', 'error');
      } else {
        showNotification('Error adding memory. Please try again.', 'error');
      }
    } finally {
      setIsAddingMemory(false);
    }
  };

  /* ---------- YouTube helpers ---------- */
  const getYouTubeThumbnail = (url) => {
    if (!url) return '/images/video-placeholder.jpg';
    if (url.startsWith('/') || url.startsWith('./')) return url;
    let videoId = '';
    try {
      if (url.includes('youtube.com/watch?v=')) {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } else if (url.includes('youtu.be/')) {
        videoId = url.split('youtu.be/')[1];
      } else if (url.includes('youtube.com/embed/')) {
        videoId = url.split('youtube.com/embed/')[1];
      }
      if (videoId) {
        if (videoId.includes('&')) videoId = videoId.split('&')[0];
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch {}
    return url;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    const safe = url.trim();
    if (safe.includes('youtube.com/embed/')) return safe;

    let videoId = '';
    try {
      if (safe.includes('youtube.com/watch')) {
        const u = new URL(safe);
        videoId = u.searchParams.get('v') || '';
      } else if (safe.includes('youtu.be/')) {
        videoId = safe.split('youtu.be/')[1] || '';
      }
    } catch {
      return safe;
    }
    if (videoId && videoId.includes('&')) videoId = videoId.split('&')[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : safe;
  };

  /* ---------- Mobile helpers ---------- */
  const toggleMemories = () => {
    setMemoriesVisible(!memoriesVisible);
  };
  
  const goBack = () => {
    navigate(-1);
  };

  /* ---------- Small child component ---------- */
const RecommendedVideo = ({ video: recommendedVideo }) => {
  if (!recommendedVideo) return null;
  const isCurrentVideo = video && recommendedVideo._id === video._id;
  const handleClick = (e) => {
    e.preventDefault();
    navigate(`/dashboard/videos/${recommendedVideo._id}`);
  };
  return (
    
      href={`/dashboard/videos/${recommendedVideo._id}`}
      className={`${styles.recommendedVideo} ${isCurrentVideo ? styles.currentVideo : ''}`}
      onClick={handleClick}
    >
      <img
        src={getYouTubeThumbnail(recommendedVideo.youtubeUrl)}
        alt={`${recommendedVideo.artiste || 'Artist'} - ${recommendedVideo.titre || 'Title'}`}
        className={styles.recommendedImg}
        onError={(e) => { e.target.src = '/images/video-placeholder.jpg'; }}
      />
      <div className={styles.recommendedInfo}>
        <div className={styles.recommendedArtist}>{recommendedVideo.artiste || 'Artist'}</div>
        <div className={styles.recommendedTitle}>: {recommendedVideo.titre || 'Title'} ({recommendedVideo.annee || '----'})</div>
      </div>
      {isCurrentVideo && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
    </a>
  );
};

  /* ---------- Render ---------- */
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
        <p>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <p>{error || 'Video not found'}</p>
        <Link to="/dashboard/videos" className={styles.backButton}>
          Back to videos
        </Link>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(video?.youtubeUrl);
  const isYoutubeEmbed = embedUrl && embedUrl.includes('youtube.com/embed/');
  const memoriesToDisplay = showAllMemories ? formatMemories(allMemories, id) : memories;

  return (
    <div className={styles.throwbackVideosBg}>
      {/* Notification Toast */}
      {notification && (
        <div className={`${styles.notificationToast} ${styles[notification.type]}`}>
          {notification.message}
        </div>
      )}
      
      {/* Playlist Modal */}
      {showPlaylistModal && (
        <PlaylistModal
          videoId={id}
          onClose={() => setShowPlaylistModal(false)}
          onSuccess={() => {
            setShowPlaylistModal(false);
            fetchVideoById(id);
          }}
        />
      )}

      {/* Delete Confirmation Popup */}
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title || 'Delete'}
        message={confirm.message || 'Are you sure you want to delete this item? This action cannot be undone.'}
        onConfirm={confirm.onConfirm || (() => {})}
        onCancel={cancelConfirm}
        confirmText="Delete"
        cancelText="Cancel"
      />

      {/* Mobile Header */}
      {isMobile && (
        <div className={styles.mobileHeader}>
          <button className={styles.backButton} onClick={goBack}>
            <FontAwesomeIcon icon={faArrowLeft} />
          </button>
          <h2 className={styles.mobileTitle}>
            {video?.artiste || 'Artist'} - {video?.titre || 'Video'}
          </h2>
          <button 
            className={`${styles.commentsToggle} ${memoriesVisible ? styles.active : ''}`}
            onClick={toggleMemories}
          >
            <FontAwesomeIcon icon={faComment} />
            <span className={styles.commentCount}>{memories.length}</span>
          </button>
        </div>
      )}

      <div className={`${styles.mainContentWrap} ${isMobile ? styles.mobileLayout : ''}`}>
        <main className={`${styles.mainContent} ${isMobile && memoriesVisible ? styles.hidden : ''}`}>
          {/* Player */}
          <div className={styles.videoPlayerContainer} key={id}>
            {isYoutubeEmbed ? (
              <div className={styles.videoWrapper}>
                <iframe
                  src={`${embedUrl}?rel=0&modestbranding=1`}
                  title={`${video.artiste} - ${video.titre}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className={styles.videoThumbnail}>
                <img
                  src={getYouTubeThumbnail(video.youtubeUrl)}
                  alt={`${video.artiste} - ${video.titre}`}
                  className={styles.thumbnailImg}
                  onError={(e) => { e.target.src = '/images/video-placeholder.jpg'; }}
                />
                <div className={styles.playButton}>▶</div>
              </div>
            )}
          </div>

          {/* Title / Stats */}
          <div className={styles.videoInfoBar}>
            {!isMobile && (
              <h1 className={styles.videoTitle}>
                {video.artiste || 'Artist'} : <span style={{ fontWeight: 300, fontSize: 18 }}>{video.titre || 'Title'} ({video.annee || '----'})</span>
              </h1>
            )}
            <div className={styles.videoStats}>
              <div className={styles.statItem}>
                <FontAwesomeIcon icon={faEye} />
                <span>{viewCount}</span>
              </div>
              <div
                className={`${styles.statItem} ${userLiked ? styles.liked : ''} ${isLiking ? styles.loading : ''}`}
                onClick={handleLikeVideo}
              >
                <FontAwesomeIcon icon={isLiking ? faSpinner : faHeart} spin={isLiking} />
                <span>{likeCount}</span>
              </div>
              <div className={styles.statItem} onClick={handleShareVideo}>
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </div>
              <div className={styles.statItem} onClick={() => setShowPlaylistModal(true)}>
                <FontAwesomeIcon icon={faList} />
                <span>Add Playlist</span>
              </div>
            </div>

            {/* Share Options */}
            {showShareOptions && (
              <div className={styles.shareOptions}>
                <div className={styles.shareOption} onClick={() => handleShareOption('copy')}>
                  <FontAwesomeIcon icon={faCopy} /> Copy Link
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('facebook')}>
                  <FontAwesomeIcon icon={faFacebook} /> Facebook
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('twitter')}>
                  <FontAwesomeIcon icon={faTwitter} /> Twitter
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('whatsapp')}>
                  <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                </div>
              </div>
            )}
          </div>

          {/* Add Memory */}
          <div className={styles.memoryInputContainer}>
            <input
              type="text"
              className={styles.memoryInput}
              placeholder="Share A Memory......"
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isAddingMemory) handleAddMemory(e); }}
              disabled={isAddingMemory}
            />
            <button
              className={`${styles.commentButton} ${isAddingMemory ? styles.loading : ''}`}
              onClick={handleAddMemory}
              disabled={isAddingMemory}
            >
              <FontAwesomeIcon icon={isAddingMemory ? faSpinner : faComment} spin={isAddingMemory} />
            </button>
          </div>

          {/* Recommendations */}
          <div className={styles.recommendedVideosSection}>
            <h3 className={styles.recommendedSectionTitle}>All Music Videos</h3>
            <div className={styles.recommendedVideosGrid}>
              {videosLoading ? (
                <div className={styles.recommendedLoading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Loading videos...</span>
                </div>
              ) : allVideos.length > 0 ? (
                allVideos.map((videoItem) => (
                  <RecommendedVideo key={videoItem._id || `video-${Math.random()}`} video={videoItem} />
                ))
              ) : (
                <div className={styles.emptyRecommendations}>
                  <p>We're adding new videos soon!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Sidebar Memories */}
        {(!isMobile || (isMobile && memoriesVisible)) && (
          <aside className={`${styles.rightCards} ${isMobile ? styles.mobileComments : ''}`}>
            {isMobile && (
              <div className={styles.mobileCommentsHeader}>
                <button className={styles.closeCommentsButton} onClick={toggleMemories}>
                  <FontAwesomeIcon icon={faTimes} />
                </button>
                <h3>Comments ({memories.length})</h3>
              </div>
            )}
            
            {!isMobile && (
              <div className={styles.memoriesHeader}>
                <h3>Memories {!showAllMemories && 'for this video'}</h3>
                <div className={styles.memoriesControls}>
                  <button
                    className={styles.filterToggleButton}
                    onClick={() => setShowAllMemories(!showAllMemories)}
                    title={showAllMemories ? 'Show only memories for this video' : 'Show all memories'}
                  >
                    <FontAwesomeIcon icon={faFilter} />
                    <span>{showAllMemories ? 'Filter' : 'All'}</span>
                  </button>
                </div>
              </div>
            )}

            {memoriesLoading ? (
              <div className={styles.memoriesLoading}>
                <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                <p>Loading memories...</p>
              </div>
            ) : memoriesToDisplay.length > 0 ? (
              memoriesToDisplay.map((memory) => (
                <MemoryCard
                  key={memory.id || `memory-${Math.random()}`}
                  memory={memory}
                  baseUrl={baseUrl}
                  onLike={handleLikeMemory}
                  onAddReply={handleAddReply}
                  onDeleteMemory={handleDeleteMemory}
                  onRequestDelete={handleDeleteReply} // Utilise handleDeleteReply pour les réponses
                  onToggleReplies={handleToggleReplies}
                  currentVideoId={id}
                  replies={memory.replies || []}
                  showReplies={memory.showReplies || false}
                  isMobile={isMobile}
                />
              ))
            ) : (
              <div className={styles.emptyMemories}>
                <p>No memories shared{!showAllMemories && ' for this video'}.</p>
                <p>Be the first to share a memory!</p>
                {!showAllMemories && allMemories.length > 0 && (
                  <button className={styles.showAllButton} onClick={() => setShowAllMemories(true)}>
                    View all memories
                  </button>
                )}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
};

export default VideoDetail;