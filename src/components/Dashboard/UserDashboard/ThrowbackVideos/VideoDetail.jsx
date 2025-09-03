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
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

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

  // Main states
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [allMemories, setAllMemories] = useState([]);
  const [memoryText, setMemoryText] = useState('');
  const [showAllMemories, setShowAllMemories] = useState(false);

  // Interaction states
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isAddingMemory, setIsAddingMemory] = useState(false);

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
    return () => window.removeEventListener('storage', handleStorageChange);
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

  /* ---------- Data fetching ---------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const videosData = await videoAPI.getAllVideos({ type: 'music', limit: '50' });
      setAllVideos(Array.isArray(videosData) ? videosData : []);
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
      const videoData = await videoAPI.getVideoById(videoId);
      if (myToken !== requestTokenRef.current.video) return;
      if (videoData) {
        setVideo(videoData);
        setUserLiked(videoData.userInteraction?.liked || false);
        setViewCount(videoData.vues || 0);
        setLikeCount(videoData.likes || 0);
      } else {
        setError('Unable to load video details');
      }
    } catch {
      if (myToken !== requestTokenRef.current.video) return;
      setError('Error loading video');
    } finally {
      if (myToken === requestTokenRef.current.video) setLoading(false);
    }
  };

  // FONCTION CORRIGÉE: Récupération des commentaires simplifiée et plus fiable
  const fetchVideoMemories = async (videoId) => {
    try {
      console.log("Fetching memories for video:", videoId);
      setMemoriesLoading(true);
      
      // Appel direct à l'API sans cache ni fallback complexe
      const response = await api.get(`/api/public/videos/${videoId}/memories`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        console.log(`✅ Found ${response.data.data.length} memories for video ${videoId}`);
        setMemories(formatMemories(response.data.data, videoId));
      } else {
        console.warn("API returned success but no valid data array");
        
        // Tentative de fallback direct
        const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
        if (fallbackResponse.data && fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
          console.log(`✅ Found ${fallbackResponse.data.data.length} memories from fallback API`);
          setMemories(formatMemories(fallbackResponse.data.data, videoId));
        } else {
          setMemories([]);
        }
      }
    } catch (error) {
      console.error("Error fetching memories:", error);
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
      setMemoriesLoading(true);
      try {
        const response = await api.get(`/api/memories/${memoryId}/replies`);
        if (response.data?.success) return response.data.data;
      } catch {
        const fallbackResponse = await api.get(`/api/public/memories/${memoryId}/replies`);
        if (fallbackResponse.data?.success) return fallbackResponse.data.data;
      }
      return [];
    } finally {
      setMemoriesLoading(false);
    }
  };

  const handleToggleReplies = async (memoryId) => {
    if (memoriesLoading) return;
    const idx = memories.findIndex(m => m.id === memoryId);
    if (idx === -1) return;
    const item = memories[idx];

    if (item.showReplies) {
      const updated = [...memories];
      updated[idx] = { ...item, showReplies: false };
      setMemories(updated);
      return;
    }

    if (!item.replies || item.replies.length === 0) {
      const replies = await fetchReplies(memoryId);
      const updated = [...memories];
      updated[idx] = { ...item, replies, showReplies: true };
      setMemories(updated);
    } else {
      const updated = [...memories];
      updated[idx] = { ...item, showReplies: true };
      setMemories(updated);
    }
  };

  const handleAddReply = async (memoryId, replyText) => {
    try {
      const response = await api.post(`/api/memories/${memoryId}/replies`, { contenu: replyText });
      if (response.data?.success) {
        const updated = memories.map(m => (m.id === memoryId)
          ? { ...m, nb_commentaires: (m.nb_commentaires || 0) + 1, replies: [...(m.replies || []), response.data.data] }
          : m
        );
        setMemories(updated);
        return true;
      }
      return false;
    } catch (err) {
      try {
        const fallback = await api.post(`/api/public/memories/${memoryId}/replies`, { contenu: replyText });
        if (fallback.data?.success) {
          const updated = memories.map(m => (m.id === memoryId)
            ? { ...m, nb_commentaires: (m.nb_commentaires || 0) + 1, replies: [...(m.replies || []), fallback.data.data] }
            : m
          );
          setMemories(updated);
          return true;
        }
      } catch {}
      if (err.response?.status === 401) alert('Please log in to add a reply');
      else alert('Error adding reply. Please try again.');
      return false;
    }
  };

  const handleLikeMemory = async (memoryId) => {
    try {
      // optimistic (handles both cards and replies)
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

      // server sync
      const r = await videoAPI.likeMemory(memoryId);
      if (r?.success && r.data) {
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
      if (err.response?.status === 401) alert('Please log in to like this item');
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

  // FONCTION CORRIGÉE: Suppression de commentaire simplifiée et plus fiable
  const handleDeleteMemory = async (memoryId) => {
    console.log("Attempting to delete memory:", memoryId);
    
    // Confirmation
    openConfirm(
      'Delete Memory',
      'Are you sure you want to delete this item? This action cannot be undone.',
      async () => {
        try {
          console.log("Confirmed deletion of memory:", memoryId);
          
          // Mise à jour optimiste de l'interface utilisateur
          const updatedMemories = memories.filter(m => m.id !== memoryId);
          setMemories(updatedMemories);
          
          // Essai de suppression via l'API
          try {
            const response = await api.delete(`/api/memories/${memoryId}`);
            console.log("Memory delete response:", response.data);
          } catch (apiError) {
            console.warn("Primary API delete failed, trying fallback:", apiError);
            
            // Fallback à l'API publique
            try {
              const fallbackResponse = await api.delete(`/api/public/memories/${memoryId}`);
              console.log("Fallback delete response:", fallbackResponse.data);
            } catch (fallbackError) {
              console.error("All delete attempts failed:", fallbackError);
              // Restaurer l'état en cas d'erreur
              fetchVideoMemories(id);
            }
          }
        } catch (error) {
          console.error("Delete memory error:", error);
          // Restaurer l'état en cas d'erreur
          fetchVideoMemories(id);
        }
      }
    );
  };

  // FONCTION CORRIGÉE: Suppression des réponses
  const handleDeleteReply = async (replyId) => {
    console.log("Attempting to delete reply:", replyId);
    
    // Confirmation
    openConfirm(
      'Delete Reply',
      'Are you sure you want to delete this reply? This action cannot be undone.',
      async () => {
        try {
          console.log("Confirmed deletion of reply:", replyId);
          
          // Trouver le memory parent qui contient cette réponse
          let parentMemoryId = null;
          const updatedMemories = memories.map(memory => {
            const replyIndex = (memory.replies || []).findIndex(r => 
              (r.id || r._id) === replyId
            );
            
            if (replyIndex !== -1) {
              parentMemoryId = memory.id;
              // Créer une copie profonde pour éviter la modification directe
              const updatedMemory = {
                ...memory,
                replies: [...memory.replies]
              };
              // Retirer la réponse
              updatedMemory.replies.splice(replyIndex, 1);
              return updatedMemory;
            }
            return memory;
          });
          
          // Mettre à jour l'état UI de façon optimiste
          if (parentMemoryId) {
            setMemories(updatedMemories);
            
            // Effectuer la suppression API
            try {
              const response = await api.delete(`/api/memories/${parentMemoryId}/replies/${replyId}`);
              console.log("Reply delete response:", response.data);
            } catch (apiError) {
              console.warn("Primary API delete reply failed, trying fallback:", apiError);
              
              try {
                const fallbackResponse = await api.delete(`/api/public/memories/${parentMemoryId}/replies/${replyId}`);
                console.log("Fallback delete reply response:", fallbackResponse.data);
              } catch (fallbackError) {
                console.error("All delete reply attempts failed:", fallbackError);
                // Restaurer en cas d'échec complet
                fetchVideoMemories(id);
              }
            }
          } else {
            console.error("Could not find parent memory for reply:", replyId);
            alert("Error: Could not find parent memory for this reply");
          }
        } catch (error) {
          console.error("Delete reply error:", error);
          fetchVideoMemories(id);
        }
      }
    );
  };

  /* ---------- Video interactions ---------- */
  const handleLikeVideo = async () => {
    if (isLiking) return;
    try {
      setIsLiking(true);
      const newLikedState = !userLiked;
      const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      setUserLiked(newLikedState);
      setLikeCount(newLikeCount);

      const response = await videoAPI.likeVideo(id);
      if (response.success && response.data) {
        setUserLiked(response.data.liked);
        setLikeCount(response.data.likes);
      } else {
        setUserLiked(!newLikedState);
        setLikeCount(likeCount);
      }
    } catch (err) {
      setUserLiked(!userLiked);
      setLikeCount(likeCount);
      if (err.response?.status === 401) alert('Please log in to like this video');
      else alert('Error liking the video. Please try again.');
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
          setShareMessage('URL copied to clipboard!');
          setTimeout(() => setShareMessage(''), 3000);
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
      videoAPI.shareVideo(id).catch(() => {});
    } catch {
      setShareMessage('Error sharing.');
      setTimeout(() => setShareMessage(''), 3000);
    }
    setShowShareOptions(false);
  };

  /* ---------- Add Memory (now defined and reused) ---------- */
  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!memoryText.trim() || isAddingMemory) return;
    try {
      setIsAddingMemory(true);
      let serverMemory = null;

      // Try public route
      try {
        const res = await api.post(`/api/public/videos/${id}/memories`, {
          contenu: memoryText.trim(), video_id: id, videoId: id, video: id
        });
        if (res.data?.success) serverMemory = res.data.data;
      } catch {}

      // Fallback private route
      if (!serverMemory) {
        const fb = await api.post(`/api/videos/${id}/memories`, {
          contenu: memoryText.trim(), video_id: id, videoId: id, video: id
        });
        if (fb.data?.success) serverMemory = fb.data.data;
      }

      if (!serverMemory) throw new Error('Error adding memory');

      const newMemoryData = {
        ...serverMemory,
        video: { _id: id, titre: video?.titre, artiste: video?.artiste, annee: video?.annee },
        videoId: id
      };
      const newMemory = formatMemories([newMemoryData])[0];

      setMemories(prev => [newMemory, ...prev]);
      const updatedAll = [newMemoryData, ...allMemories];
      setAllMemories(updatedAll);
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAll));
        localStorage.setItem('memoriesUpdated', Date.now().toString());
      } catch {}

      setMemoryText('');
      setShareMessage('Memory added successfully!');
      setTimeout(() => setShareMessage(''), 3000);
    } catch (err) {
      if (err.response?.status === 401) alert('Please log in to share a memory');
      else alert('Error adding memory. Please try again.');
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

      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
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
            <h1 className={styles.videoTitle}>
              {video.artiste || 'Artist'} : <span style={{ fontWeight: 300, fontSize: 18 }}>{video.titre || 'Title'} ({video.annee || '----'})</span>
            </h1>
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
            {shareMessage && <div className={styles.shareMessage}>{shareMessage}</div>}
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

       
        </main>

        {/* Sidebar Memories */}
        <aside className={styles.rightCards}>
          <div className={styles.memoriesHeader}>
            <h3>Memories {!showAllMemories && 'for this video'}</h3>
            <div className={styles.memoriesControls}>
              {/* Refresh removed */}
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
                onRequestDelete={handleDeleteReply} // Utilisez handleDeleteReply au lieu de handleDeleteMemory
                onToggleReplies={handleToggleReplies}
                currentVideoId={id}
                replies={memory.replies || []}
                showReplies={memory.showReplies || false}
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
              {/* Refresh removed */}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;