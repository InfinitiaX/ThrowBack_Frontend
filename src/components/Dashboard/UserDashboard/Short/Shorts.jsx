// Shorts.jsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
import styles from './Shorts.module.css';
import {
  FaHeart, FaShareAlt, FaStar, FaPlay, FaPause, FaTimes,
  FaVolumeUp, FaVolumeMute, FaComment, FaCloudUploadAlt,
  FaExclamationTriangle, FaChevronDown, FaChevronLeft, FaChevronRight
} from 'react-icons/fa';
import axios from 'axios';

// Axios configuration with interceptors
axios.interceptors.request.use(
  config => {
    // Add base URL if not already done
    if (config.url && !config.url.startsWith('http')) {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      config.url = `${apiBaseUrl}${config.url}`;
    }

    // Add authentication token if it exists
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  error => Promise.reject(error)
);

// Interceptor for all Axios responses
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('Axios error:', error);

    // Handle timeouts
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout - The request took too long');
    }

    // Handle CORS errors
    if (error.message && error.message.includes('Network Error')) {
      console.error('Possible CORS issue or network problem');
    }

    return Promise.reject(error);
  }
);

// Function to convert relative paths to absolute URLs
function getFullVideoUrl(path) {
  if (!path) return '';

  // If the URL is already absolute, return it as is
  if (path.startsWith('http')) return path;

  // Make sure the path starts with a slash
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // Always use a base URL, never an empty string
  const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  const fullUrl = `${backendUrl}${normalizedPath}`;

  return fullUrl;
}

// Utility function to format seconds as mm:ss
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Shorts() {
  // Dynamic index of the center video (featured)
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

  // States for navigation and animations
  const [dragging, setDragging] = useState(false);
  const [direction, setDirection] = useState(null);
  const [transition, setTransition] = useState(false);

  // 👉 Ref pour corriger le swipe
  const touchStartXRef = useRef(null);

  // States for upload and progress
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // States for loading and pagination
  const [isLoadingShorts, setIsLoadingShorts] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMoreShorts, setHasMoreShorts] = useState(true);

  // States for comments and interactions
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState('');
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [activeShortId, setActiveShortId] = useState(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);
  const [isShareLoading, setIsShareLoading] = useState(false);
  const [feedback, setFeedback] = useState({ visible: false, message: '', type: '' });

  // ✅ handleChange: pas de filtrage des espaces
  const handleChange = useCallback((e) => {
    e.stopPropagation();
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }, []);

  // double sécurité (pas obligatoire mais conservée)
  const handleInputEvent = useCallback((e) => handleChange(e), [handleChange]);

  const handleKeyDown = useCallback((e) => {
    // on autorise explicitement l'espace dans les champs
    if (e.key === ' ') {
      // ne rien faire ici
    }
  }, []);

  // Function to load shorts with retry mechanism
  const fetchShorts = async () => {
    try {
      setIsLoadingShorts(true);

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

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
            timeout: 10000 * attempts,
            withCredentials: true
          });

          success = true;

        } catch (err) {
          console.error(`Error attempt ${attempts}:`, err);
          finalError = err;

          if (attempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempts - 1);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      if (!success) {
        throw finalError || new Error("Failed after multiple attempts");
      }

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
        console.warn('Unexpected response format:', response.data);
        shortsData = [];
        setHasMoreShorts(false);
      }

      shortsData = shortsData.map(short => {
        const videoUrl = getFullVideoUrl(short.youtubeUrl);
        return {
          ...short,
          youtubeUrl: videoUrl
        };
      });

      setShorts(shortsData);

      if (shortsData.length > 0) {
        setActiveShortId(shortsData[0]._id);
      }

    } catch (err) {
      console.error('Detailed error while loading shorts:', err);

      if (err.code === 'ECONNABORTED') {
        showFeedback('The server is taking too long to respond. Please try again.', 'error');
      } else if (err.response?.status === 401) {
        showFeedback('Your session has expired. Please log in again.', 'error');
      } else {
        showFeedback('Error loading shorts. Please try again.', 'error');
      }

      setShorts([]);
      setHasMoreShorts(false);
    } finally {
      setIsLoadingShorts(false);
    }
  };

  // Load more shorts
  const loadMoreShorts = async () => {
    if (!hasMoreShorts || isLoadingMore) return;

    try {
      setIsLoadingMore(true);
      const nextPage = page + 1;

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
      console.error('Error loading more shorts:', err);
      showFeedback('Unable to load more shorts', 'error');
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Loading comments
  const fetchComments = async (shortId) => {
    if (!shortId) return;

    try {
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

      const response = await axios.get(`${apiBaseUrl}/api/videos/${shortId}/memories`, {
        timeout: 15000,
        withCredentials: true
      });

      let commentsData = [];

      if (response.data && Array.isArray(response.data.data)) {
        commentsData = response.data.data;
      } else if (response.data && Array.isArray(response.data)) {
        commentsData = response.data;
      } else if (response.data && response.data.memories && Array.isArray(response.data.memories)) {
        commentsData = response.data.memories;
      } else {
        console.warn('Unexpected response format for comments:', response.data);
        commentsData = [];
      }

      const normalizedComments = commentsData.map(comment => ({
        id: comment._id || comment.id || Math.random().toString(36).substr(2, 9),
        username: comment.auteur?.nom || comment.username || 'User',
        content: comment.contenu || comment.content || comment.texte || '',
        createdAt: comment.createdAt || comment.date || new Date().toISOString(),
        imageUrl: getFullVideoUrl(comment.auteur?.photo_profil) || comment.imageUrl || '/images/default-avatar.jpg'
      }));

      setComments(normalizedComments);
    } catch (err) {
      console.error('Detailed error while retrieving comments:', err);
      setComments([]);
    }
  };

  // Add comment
  const addComment = async () => {
    if (!commentInput.trim() || !activeShortId) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        showFeedback('You must be logged in to comment', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

      await axios.post(`${apiBaseUrl}/api/videos/${activeShortId}/memories`,
        { contenu: commentInput },
        {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        }
      );

      showFeedback('Comment added successfully', 'success');
      setCommentInput('');

      const updatedShorts = shorts.map(short => {
        if (short._id === activeShortId) {
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

      fetchComments(activeShortId);
    } catch (err) {
      console.error('Error adding comment:', err);
      showFeedback('Error adding comment', 'error');
    }
  };

  // Display feedback
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

  // Initialization
  useEffect(() => {
    fetchShorts();
  }, []);

  // Handle horizontal navigation
  const handleHorizontalScroll = useCallback((dir) => {
    if (shorts.length <= 1 || transition) return;

    // Pause the current video
    if (centerVideoRef.current) {
      centerVideoRef.current.pause();
    }

    // Calculate the new center index
    const newIndex = dir === 'right'
      ? Math.min(centerIdx + 1, shorts.length - 1)
      : Math.max(centerIdx - 1, 0);

    if (newIndex !== centerIdx) {
      setDirection(dir);
      setTransition(true);

      // Apply transition with delay
      setTimeout(() => {
        setCenterIdx(newIndex);
        setIsCenterPlaying(false);

        // Update the active short ID
        if (shorts[newIndex]) {
          setActiveShortId(shorts[newIndex]._id);
        }

        // Reset after transition
        setTimeout(() => {
          setDirection(null);
          setTransition(false);
        }, 300);
      }, 50);
    }
  }, [shorts, centerIdx, transition]);

  // Pause all videos in the carousel on changes
  useEffect(() => {
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });

    if (shorts.length > 0 && centerIdx >= 0 && centerIdx < shorts.length) {
      setActiveShortId(shorts[centerIdx]._id);
      setIsCommentsVisible(false);
    }
  }, [centerIdx, shorts]);

  // Load comments when a new short is active
  useEffect(() => {
    if (activeShortId && isCommentsVisible) {
      fetchComments(activeShortId);
    }
  }, [activeShortId, isCommentsVisible]);

  // Handle play/pause events
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

  // Handle video progress
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

  // Pause when not visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting && isCenterPlaying && centerVideoRef.current) {
          centerVideoRef.current.pause();
        }
      },
      { threshold: 0.5 }
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

  // ✅ Global keyboard: n'intercepte pas l'espace dans les champs éditables
  useEffect(() => {
    const handleKeyDownGlobal = (e) => {
      const t = e.target;
      const isEditable =
        t &&
        (
          t.tagName === 'INPUT' ||
          t.tagName === 'TEXTAREA' ||
          t.isContentEditable
        );

      if (e.key === 'ArrowLeft' && !isEditable) {
        handleHorizontalScroll('left');
        return;
      }

      if (e.key === 'ArrowRight' && !isEditable) {
        handleHorizontalScroll('right');
        return;
      }

      if ((e.key === ' ' || e.key === 'Spacebar') && !isEditable) {
        // empêcher le scroll uniquement hors champs
        e.preventDefault();
        if (centerVideoRef.current) {
          isCenterPlaying ? centerVideoRef.current.pause() : centerVideoRef.current.play();
        }
      }
    };

    // important pour que preventDefault fonctionne
    document.addEventListener('keydown', handleKeyDownGlobal, { passive: false });
    return () => document.removeEventListener('keydown', handleKeyDownGlobal);
  }, [handleHorizontalScroll, isCenterPlaying]);

  // Drag and drop handler for video
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

  // Process the selected video file
  const handleFileSelected = (file) => {
    setErrDuree('');

    if (!file) {
      return;
    }

    if (!file.type.startsWith('video/')) {
      setErrDuree('The selected file is not a video.');
      setForm(f => ({ ...f, video: null }));
      return;
    }

    if (file.size > 100 * 1024 * 1024) {
      setErrDuree('The file is too large (max 100MB).');
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
        setErrDuree('The video must be between 10 and 30 seconds long.');
        setForm(f => ({ ...f, video: null }));
      } else {
        setErrDuree('');
        setForm(f => ({ ...f, video: file, duree: Math.round(duration) }));
      }
    };

    video.onerror = () => {
      setErrDuree('Unable to read this video file.');
      setForm(f => ({ ...f, video: null }));
    };

    video.src = url;
  };

  // Handle file change
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    handleFileSelected(file);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.titre.trim()) {
      showFeedback('Title is required', 'error');
      return;
    }

    if (!form.artiste.trim()) {
      showFeedback('Artist is required', 'error');
      return;
    }

    if (!form.video) {
      setErrDuree('Please select a valid video.');
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
        showFeedback('You must be logged in to add a short', 'error');
        setIsUploading(false);
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

      const response = await axios.post(`${apiBaseUrl}/api/videos/shorts`, data, {
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

      if (response) {
        // ok
      }

      showFeedback('Short added successfully!', 'success');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null, description: '' });
      setErrDuree('');
      setUploadProgress(0);

      setTimeout(() => {
        fetchShorts();
      }, 1000);

    } catch (err) {
      console.error('Error adding short:', err);
      const errorMessage = err.response?.data?.message || err.message || 'Error during upload';
      setErrDuree(errorMessage);
      showFeedback(errorMessage, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Handle clicks on side cards
  const handleSideCardClick = (realIdx) => {
    if (realIdx === centerIdx) return;
    const direction = realIdx > centerIdx ? 'right' : 'left';
    handleHorizontalScroll(direction);
  };

  // Handle mute/unmute toggle
  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    if (centerVideoRef.current) {
      centerVideoRef.current.muted = !isMuted;
    }
  };

  // Handle play/pause
  const handlePlayPause = () => {
    if (!centerVideoRef.current) return;

    if (isCenterPlaying) {
      centerVideoRef.current.pause();
    } else {
      const playPromise = centerVideoRef.current.play();
      if (playPromise !== undefined) {
        playPromise.catch(err => {
          console.error('Autoplay error:', err);
          showFeedback('Click again to play the video', 'info');
        });
      }
    }
  };

  // Handle likes
  const handleLike = async (shortId) => {
    if (isLikeLoading) return;

    try {
      setIsLikeLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showFeedback('You must be logged in to like a short', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

      const response = await axios.post(`${apiBaseUrl}/api/videos/${shortId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
        withCredentials: true
      });

      if (response.data && response.data.data) {
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
          showFeedback('You liked this short', 'success');
        } else {
          showFeedback('You no longer like this short', 'info');
        }
      } else {
        showFeedback('Action recorded', 'success');

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
      console.error('Error during like:', err);
      showFeedback('Error during like', 'error');
    } finally {
      setIsLikeLoading(false);
    }
  };

  // Handle shares
  const handleShare = async (shortId) => {
    if (isShareLoading) return;

    try {
      setIsShareLoading(true);
      const token = localStorage.getItem('token');

      if (!token) {
        showFeedback('You must be logged in to share a short', 'error');
        return;
      }

      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

      try {
        await axios.post(`${apiBaseUrl}/api/videos/${shortId}/share`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        });
      } catch (shareError) {
        console.warn('Share API error (ignored):', shareError);
      }

      const shareLink = `${window.location.origin}/shorts/${shortId}`;

      try {
        await navigator.clipboard.writeText(shareLink);
        showFeedback('Link copied to clipboard!', 'success');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        const textarea = document.createElement('textarea');
        textarea.value = shareLink;
        textarea.style.position = 'fixed';
        document.body.appendChild(textarea);
        textarea.focus();
        textarea.select();
        try {
          const successful = document.execCommand('copy');
          if (successful) {
            showFeedback('Link copied to clipboard!', 'success');
          } else {
            throw new Error('Manual copy failed');
          }
        } catch (err) {
          showFeedback('Unable to copy link: ' + shareLink, 'info');
        }
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error('Error during share:', err);
      showFeedback('Error during share', 'error');
    } finally {
      setIsShareLoading(false);
    }
  };

  // Toggle comment visibility
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
            <FaCloudUploadAlt /> Add a Short
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
          <div className={`${styles.carouselContainer} ${direction === 'left' ? styles.swipeLeft : direction === 'right' ? styles.swipeRight : ''}`}>
            <div
              className={styles.carouselRow}
              ref={carouselRef}
              onTouchStart={(e) => {
                setDragging(false);
                touchStartXRef.current = e.touches[0].clientX;
              }}
              onTouchMove={() => {
                setDragging(true);
              }}
              onTouchEnd={(e) => {
                if (dragging) {
                  const touchEndX = e.changedTouches[0].clientX;
                  const dx = touchEndX - (touchStartXRef.current ?? 0);
                  if (Math.abs(dx) > 80) {
                    handleHorizontalScroll(dx < 0 ? 'right' : 'left');
                  }
                }
                touchStartXRef.current = null;
              }}
            >
              {(() => {
                // Calculate the window of 5 shorts centered on centerIdx
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
                    return <div className={styles.sideCard} key={`empty-${idx}`} style={{ opacity: 0.3 }} />;
                  }

                  const { short, realIdx } = item;

                  if (idx === 2) {
                    // Center card
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
                              console.error('Video loading error:', e);
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
                              <FaVolumeMute style={{ fontSize: '1.5rem' }} /> :
                              <FaVolumeUp style={{ fontSize: '1.5rem' }} />
                            }
                          </button>
                        </div>

                        {/* Progress bar */}
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
                            <span className={styles.username}>{short.artiste || 'Unknown artist'}</span>
                          </div>
                          <div className={styles.centerDesc}>{short.description || short.titre || 'No description'}</div>
                          <div className={styles.centerMusic}>🎵 {short.artiste || 'Unknown artist'}</div>
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

                        {/* Comments section */}
                        {isCommentsVisible && (
                          <div className={styles.commentsSection}>
                            <div className={styles.commentsHeader}>
                              <h3>Comments</h3>
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
                                placeholder="Add a comment..."
                                onKeyPress={e => e.key === 'Enter' && addComment()}
                                aria-label="Add comment"
                              />
                              <button
                                onClick={addComment}
                                disabled={!commentInput.trim()}
                                aria-label="Send comment"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  } else {
                    // Side cards, clickable to change the center
                    return (
                      <div
                        className={styles.sideCard}
                        key={short._id}
                        onClick={() => handleSideCardClick(realIdx)}
                        role="button"
                        tabIndex="0"
                        aria-label={`View short ${short.titre}`}
                      >
                        <video
                          src={short.youtubeUrl}
                          controls={false}
                          className={styles.sideImg}
                          autoPlay={false}
                          muted
                          crossOrigin="anonymous"
                          onError={(e) => {
                            console.error('Video loading error:', e);
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

            {/* Navigation buttons */}
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

            {/* Position indicator */}
            {shorts.length > 1 && (
              <div className={styles.paginationIndicator}>
                {shorts.map((_, idx) => (
                  <span
                    key={idx}
                    className={`${styles.paginationDot} ${idx === centerIdx ? styles.activeDot : ''}`}
                    onClick={() => setCenterIdx(idx)}
                    role="button"
                    tabIndex="0"
                    aria-label={`Go to short ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Button to load more shorts */}
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
              ) : 'Load more shorts'}
            </button>
          </div>
        )}
      </div>

      {/* MODAL Add short */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={() => !isUploading && setShowModal(false)}>
          <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Add a Short</h2>
              <button
                className={styles.closeBtn}
                onClick={() => !isUploading && setShowModal(false)}
                disabled={isUploading}
                aria-label="Close modal"
              >
                <FaTimes />
              </button>
            </div>

            {/* FORM */}
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <div className={styles.formGroup}>
                <label htmlFor="titre">Title</label>
                <input
                  id="titre"
                  name="titre"
                  type="text"
                  value={form.titre}
                  onChange={handleChange}
                  onInput={handleInputEvent}
                  onKeyDown={handleKeyDown}
                  required
                  disabled={isUploading}
                  placeholder="Give your short a title"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    pointerEvents: isUploading ? 'none' : 'auto',
                    userSelect: 'text',
                    cursor: isUploading ? 'not-allowed' : 'text',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
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
                  onInput={handleInputEvent}
                  onKeyDown={handleKeyDown}
                  required
                  disabled={isUploading}
                  placeholder="Artist name"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    pointerEvents: isUploading ? 'none' : 'auto',
                    userSelect: 'text',
                    cursor: isUploading ? 'not-allowed' : 'text',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
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
                  onInput={handleInputEvent}
                  onKeyDown={handleKeyDown}
                  disabled={isUploading}
                  placeholder="Describe your short (optional)"
                  autoComplete="off"
                  spellCheck="false"
                  style={{
                    pointerEvents: isUploading ? 'none' : 'auto',
                    userSelect: 'text',
                    cursor: isUploading ? 'not-allowed' : 'text',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '12px 16px',
                    border: '2px solid #ddd',
                    borderRadius: '8px',
                    fontSize: '16px',
                    backgroundColor: '#fff',
                    color: '#333',
                    fontFamily: 'inherit',
                    lineHeight: '1.4'
                  }}
                />
              </div>

              <div className={styles.formGroup}>
                <label>Video (10–30 s)</label>
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
                    Drag and drop your video file or click to select
                  </div>
                  <div className={styles.fileUploadSubtext}>
                    MP4, WebM, MOV or AVI • 10-30 seconds • 100 MB maximum
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
                    aria-label="Select a video"
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
                        {(form.video.size / (1024 * 1024)).toFixed(2)} MB • {form.duree || '?'} seconds
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
                Cancel
              </button>
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={handleSubmit}
                disabled={isUploading || !form.video || !form.titre.trim() || !form.artiste.trim()}
                aria-label="Upload"
              >
                {isUploading ? (
                  <>
                    <div className={styles.smallSpinner}></div>
                    <span>Uploading...</span>
                  </>
                ) : 'Upload'}
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

      {/* DEBUG overlay en dev */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999,
          maxWidth: '300px'
        }}>
          <div>📝 Form State Debug:</div>
          <div>Title: "{form.titre}" ({form.titre.length} chars)</div>
          <div>Artist: "{form.artiste}" ({form.artiste.length} chars)</div>
          <div>Description: "{form.description}" ({form.description.length} chars)</div>
          <div>Modal: {showModal ? 'Open' : 'Closed'}</div>
        </div>
      )}
    </div>
  );
}
