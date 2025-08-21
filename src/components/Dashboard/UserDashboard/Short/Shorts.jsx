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

  // Function to load shorts with retry mechanism
  const fetchShorts = async () => {
    try {
      setIsLoadingShorts(true);
      
      // Use absolute backend URL
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Implementation of a retry mechanism
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
            timeout: 10000 * attempts, // Increase timeout with each attempt
            withCredentials: true
          });
          
          success = true;
          
        } catch (err) {
          console.error(`Error attempt ${attempts}:`, err);
          finalError = err;
          
          // Wait before retrying (exponential backoff)
          if (attempts < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempts - 1); // 1s, 2s, 4s...
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      if (!success) {
        throw finalError || new Error("Failed after multiple attempts");
      }
      
      // Process the response
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
      
      // Process video URLs to make them absolute
      shortsData = shortsData.map(short => {
        const videoUrl = getFullVideoUrl(short.youtubeUrl);
        return {
          ...short,
          youtubeUrl: videoUrl
        };
      });
      
      setShorts(shortsData);
      
      // If shorts have been loaded, set the first as active
      if (shortsData.length > 0) {
        setActiveShortId(shortsData[0]._id);
      }
      
    } catch (err) {
      console.error('Detailed error while loading shorts:', err);
      
      // Detection of specific errors
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
      
      // Use absolute backend URL
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
      
      // Process video URLs to make them absolute
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
      // Use absolute backend URL
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Attempt to retrieve comments via the API
      const response = await axios.get(`${apiBaseUrl}/api/videos/${shortId}/memories`, {
        timeout: 15000,
        withCredentials: true
      });
      
      // Check if the response contains data
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
      
      // Normalize the comment format
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
      
      // Use absolute backend URL
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
      
      // Update the comment count in the active short
      const updatedShorts = shorts.map(short => {
        if (short._id === activeShortId) {
          // Increment the comment counter
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
      
      // Reload comments
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
    
    // If a new short is in the center, update the active ID
    if (shorts.length > 0 && centerIdx >= 0 && centerIdx < shorts.length) {
      setActiveShortId(shorts[centerIdx]._id);
      
      // Reset comment visibility when changing short
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
      // Optional: automatically advance to the next short
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

  // Handle visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the video is no longer visible, pause it
        if (!entry.isIntersecting && isCenterPlaying && centerVideoRef.current) {
          centerVideoRef.current.pause();
        }
      },
      { threshold: 0.5 } // 50% of the video must be visible
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

  // Handle keyboard keys
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handleHorizontalScroll('left');
      } else if (e.key === 'ArrowRight') {
        handleHorizontalScroll('right');
      } else if (e.key === ' ' || e.key === 'Spacebar') {
        // Prevent page scrolling on space
        e.preventDefault();
        
        // Toggle play/pause on space
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
    
    // Check file type
    if (!file.type.startsWith('video/')) {
      setErrDuree('The selected file is not a video.');
      setForm(f => ({ ...f, video: null }));
      return;
    }
    
    // Check file size (max 100MB)
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

  // CORRECTION: Modification de la fonction handleChange pour préserver les espaces
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Assurons-nous que la valeur est traitée comme une chaîne brute
    // et garantissons que les espaces sont préservés
    setForm(prevForm => ({
      ...prevForm,
      [name]: value
    }));
    
    // Vérification optionnelle pour le débogage
    console.log(`Field ${name} updated with value: "${value}"`);
  };

  // Form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validations
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
      
      // Use absolute backend URL
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      // Configure the request with progress reporting
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
      
      showFeedback('Short added successfully!', 'success');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null, description: '' });
      setErrDuree('');
      setUploadProgress(0);
      
      // Wait a short delay before reloading the list
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
    
    // Determine the direction
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
      // Try to play the video
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
      
      // Use absolute backend URL
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      const response = await axios.post(`${apiBaseUrl}/api/videos/${shortId}/like`, {}, {
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 15000,
        withCredentials: true
      });
      
      if (response.data && response.data.data) {
        // Update the local state to reflect the change
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
        // Simple fallback if the response format is different
        showFeedback('Action recorded', 'success');
        
        // Update optimistically
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
      
      // Use absolute backend URL
      const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      
      try {
        // Try to call the share API
        await axios.post(`${apiBaseUrl}/api/videos/${shortId}/share`, {}, {
          headers: { 'Authorization': `Bearer ${token}` },
          timeout: 15000,
          withCredentials: true
        });
      } catch (shareError) {
        // Ignore API errors for this non-critical function
        console.warn('Share API error (ignored):', shareError);
      }
      
      // Copy the link to the clipboard
      const shareLink = `${window.location.origin}/shorts/${shortId}`;
      
      try {
        await navigator.clipboard.writeText(shareLink);
        showFeedback('Link copied to clipboard!', 'success');
      } catch (clipboardError) {
        console.error('Clipboard error:', clipboardError);
        
        // Fallback for browsers that don't support clipboard API
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
              onTouchStart={() => setDragging(false)}
              onTouchMove={() => setDragging(true)}
              onTouchEnd={(e) => {
                if (dragging) {
                  // Swipe logic
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
                    return <div className={styles.sideCard} key={`empty-${idx}`} style={{opacity:0.3}} />;
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
                              <FaVolumeMute style={{color: '#b31217', fontSize: '1.5rem'}} /> : 
                              <FaVolumeUp style={{color: '#b31217', fontSize: '1.5rem'}} />
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
      
      {/* Add short modal */}
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
                  placeholder="Give your short a title"
                  aria-required="true"
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
                  placeholder="Artist name"
                  aria-required="true"
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
                  placeholder="Describe your short (optional)"
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
                disabled={isUploading || !form.video || !form.titre || !form.artiste}
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
    </div>
  );
}