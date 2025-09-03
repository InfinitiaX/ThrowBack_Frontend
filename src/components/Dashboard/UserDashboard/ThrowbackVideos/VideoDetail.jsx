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
  faPaperPlane,
  faTrash
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

/* ===== Universal Comments Modal (Bottom sheet style) ===== */
const CommentsModal = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className={styles.commentsOverlay} onClick={onClose}>
      <div className={styles.commentsModal} role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
        <div className={styles.commentsHandle} />
        <div className={styles.commentsHeader}>
          <h4>Comments</h4>
          <button className={styles.commentsClose} onClick={onClose} aria-label="Close comments">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={styles.commentsBody}>{children}</div>
      </div>
    </div>
  );
};

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

  // Universal comments modal
  const [commentsOpen, setCommentsOpen] = useState(false);

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

  const fetchVideoMemories = async (videoId) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const myToken = ++requestTokenRef.current.memories;
    try {
      setMemoriesLoading(true);

      // 1) from state cache
      const memFromState = allMemories.length > 0 ? filterMemoriesForCurrentVideo(allMemories, videoId) : [];
      if (myToken !== requestTokenRef.current.memories) return;
      if (memFromState.length > 0) {
        setMemories(formatMemories(memFromState, videoId));
        return;
      }

      // 2) from localStorage
      try {
        const cached = localStorage.getItem('allMemories');
        if (cached) {
          const parsed = JSON.parse(cached);
          const filtered = filterMemoriesForCurrentVideo(parsed, videoId);
          if (myToken !== requestTokenRef.current.memories) return;
          if (filtered.length > 0) {
            setMemories(formatMemories(filtered, videoId));
            setAllMemories(parsed);
            return;
          }
        }
      } catch {}

      // 3) API call
      const apiMem = await videoAPI.getVideoMemories(videoId);
      if (myToken !== requestTokenRef.current.memories) return;
      if (Array.isArray(apiMem)) {
        const strictly = apiMem.filter(m => {
          const vid =
            (m.video && typeof m.video === 'object' ? m.video._id : null) ||
            (typeof m.video === 'string' ? m.video : null) ||
            m.videoId || m.video_id;
        return vid && vid.toString() === videoId.toString();
        });
        setMemories(formatMemories(strictly, videoId));
        retryCountRef.current = 0;
      } else if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        setTimeout(() => {
          fetchingRef.current = false;
          fetchVideoMemories(videoId);
        }, 1000 * retryCountRef.current);
        return;
      } else {
        setMemories([]);
        retryCountRef.current = 0;
      }
    } catch {
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        try {
          await fetchAllMemories();
          const newFiltered = filterMemoriesForCurrentVideo(allMemories, videoId);
          setMemories(formatMemories(newFiltered, videoId));
        } catch {
          setMemories([]);
        }
      } else {
        setMemories([]);
      }
    } finally {
      if (myToken === requestTokenRef.current.memories) {
        fetchingRef.current = false;
        setMemoriesLoading(false);
        retryCountRef.current = 0;
      }
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
      // optimistic update
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

  const handleDeleteMemory = async (memoryId) => {
    openConfirm(
      'Delete',
      'Are you sure you want to delete this item? This action cannot be undone.',
      async () => {
        try {
          setMemories(prev =>
            prev
              .map(m => {
                if (m.id === memoryId) return null;
                return { ...m, replies: (m.replies || []).filter(r => (r.id || r._id) !== memoryId) };
              })
              .filter(Boolean)
          );

          try {
            await api.delete(`/api/memories/${memoryId}`);
          } catch (apiErr) {
            try {
              await api.delete(`/api/public/memories/${memoryId}`);
            } catch {
              if (apiErr.response?.status === 401) alert('You must be logged in to delete this item');
              else if (apiErr.response?.status === 403) alert("You don't have permission to delete this item");
              fetchVideoMemories(id);
            }
          }
        } catch {
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

  /* ---------- Add Memory ---------- */
  const handleAddMemory = async (e) => {
    e.preventDefault();
    if (!memoryText.trim() || isAddingMemory) return;
    try {
      setIsAddingMemory(true);
      let serverMemory = null;

      try {
        const res = await api.post(`/api/public/videos/${id}/memories`, {
          contenu: memoryText.trim(), video_id: id, videoId: id, video: id
        });
        if (res.data?.success) serverMemory = res.data.data;
      } catch {}

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

  /* ---------- RecommendedVideo component ---------- */
  const RecommendedVideo = ({ video: recommendedVideo }) => {
    if (!recommendedVideo) return null;
    const isCurrentVideo = video && recommendedVideo._id === video._id;
    const handleClick = (e) => {
      e.preventDefault();
      navigate(`/dashboard/videos/${recommendedVideo._id}`);
    };
    return (
      <a
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

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          {/* Player */}
          <div className={styles.videoPlayerContainer}>
            <div className={styles.videoWrapper}>
              {embedUrl ? (
                <iframe
                  src={embedUrl}
                  title={`${video.artiste || 'Artist'} - ${video.titre || 'Title'}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className={styles.videoThumbnail}>
                  <img
                    src={getYouTubeThumbnail(video.youtubeUrl)}
                    alt="Video thumbnail"
                    className={styles.thumbnailImg}
                  />
                  <div className={styles.playButton}>▶</div>
                </div>
              )}
            </div>
          </div>

          {/* Info + actions */}
          <div className={styles.videoInfoBar}>
            <h2 className={styles.videoTitle}>
              {video.artiste || 'Artist'} : {video.titre || 'Title'} ({video.annee || '----'})
            </h2>
            <div className={styles.videoStats}>
              <div className={styles.statItem} title="Views">
                <FontAwesomeIcon icon={faEye} />
                <span>{viewCount}</span>
              </div>

              <div
                className={`${styles.statItem} ${userLiked ? styles.liked : ''} ${isLiking ? styles.loading : ''}`}
                onClick={handleLikeVideo}
                title={userLiked ? 'Unlike' : 'Like'}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{likeCount}</span>
              </div>

              {/* Comments button opens universal modal */}
              <div
                className={styles.statItem}
                onClick={() => setCommentsOpen(true)}
                aria-label="Open comments"
                title="Comments"
              >
                <FontAwesomeIcon icon={faComment} />
                <span>{memories?.length || 0}</span>
              </div>

              <div className={styles.statItem} onClick={handleShareVideo} title="Share">
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
                {showShareOptions && (
                  <div className={styles.shareOptions}>
                    <div className={styles.shareOption} onClick={() => handleShareOption('copy')}>
                      <FontAwesomeIcon icon={faCopy} /> Copy link
                    </div>
                    <div className={styles.shareOption} onClick={() => handleShareOption('facebook')}>
                      <FontAwesomeIcon icon={faFacebook} /> Facebook
                    </div>
                    <div className={styles.shareOption} onClick={() => handleShareOption('twitter')}>
                      <FontAwesomeIcon icon={faTwitter} /> Twitter / X
                    </div>
                    <div className={styles.shareOption} onClick={() => handleShareOption('whatsapp')}>
                      <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                    </div>
                  </div>
                )}
                {shareMessage && <div className={styles.shareMessage}>{shareMessage}</div>}
              </div>

              <button className={styles.filterToggleButton} onClick={() => setShowPlaylistModal(true)}>
                <FontAwesomeIcon icon={faList} /> Add Playlist
              </button>
            </div>
          </div>

          {/* Recommended */}
          <section className={styles.recommendedVideosSection}>
            <div className={styles.recommendedSectionTitle}>All Music Videos</div>
            <div className={styles.recommendedVideosGrid}>
              {videosLoading ? (
                <div className={styles.recommendedLoading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <p>Loading recommendations…</p>
                </div>
              ) : allVideos.length ? (
                allVideos.map((v) => <RecommendedVideo key={v._id} video={v} />)
              ) : (
                <div className={styles.emptyRecommendations}>No recommendations found.</div>
              )}
            </div>
          </section>
        </main>
      </div>

      {/* ===== Universal Comments Modal ===== */}
      <CommentsModal open={commentsOpen} onClose={() => setCommentsOpen(false)}>
        <form className={styles.memoryInputContainer} onSubmit={handleAddMemory}>
          <input
            className={styles.memoryInput}
            placeholder="Share A Memory……"
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
          />
          <button type="submit" className={styles.commentButton} disabled={isAddingMemory} aria-label="Send memory">
            {isAddingMemory ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
          </button>
        </form>

        <div className={styles.memoriesHeader}>
          <h3>{memories?.length || 0} Comments</h3>
        </div>

        {memoriesLoading ? (
          <div className={styles.memoriesLoading}>
            <FontAwesomeIcon icon={faSpinner} spin />
            <p>Loading comments…</p>
          </div>
        ) : memories?.length ? (
          memories.map(m => (
            <MemoryCard
              key={m.id}
              memory={m}
              baseUrl={baseUrl}
              onLike={handleLikeMemory}
              onAddReply={handleAddReply}
              onRequestDelete={handleDeleteMemory}
              currentVideoId={id}
              replies={m.replies || []}
              showReplies={m.showReplies}
              onToggleReplies={handleToggleReplies}
            />
          ))
        ) : (
          <div className={styles.emptyMemories}>Be the first to share a memory.</div>
        )}
      </CommentsModal>

      {/* Modals */}
      {showPlaylistModal && (
        <PlaylistModal
          open={showPlaylistModal}
          onClose={() => setShowPlaylistModal(false)}
          videoId={id}
        />
      )}

      {confirm.open && (
        <ConfirmDialog
          open={confirm.open}
          title={confirm.title}
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={cancelConfirm}
        />
      )}
    </div>
  );
};

export default VideoDetail;