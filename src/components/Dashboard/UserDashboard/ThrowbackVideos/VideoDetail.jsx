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
  faSync
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

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
  
  // References to track request state
  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Build base URL based on environment
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Load all videos and memories when component mounts
  useEffect(() => {
    fetchAllVideos();
    fetchAllMemories();
    
    // Add localStorage event listener for state sharing mechanism
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Load specific video when ID changes
  useEffect(() => {
    if (id) {
      fetchVideoById(id);
      fetchVideoMemories(id);
      window.scrollTo(0, 0);
      
      // Save current video ID in localStorage
      localStorage.setItem('currentVideoId', id);
    }
  }, [id]);

  // Handle localStorage changes (for cross-tab communication)
  const handleStorageChange = (event) => {
    if (event.key === 'memoriesUpdated' && event.newValue) {
      // If memories were updated in another tab
      fetchVideoMemories(id);
    }
  };

  // Fetch all available videos
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      console.log('🎬 Loading all videos...');
      
      const videosData = await videoAPI.getAllVideos({
        type: 'music',
        limit: '50'
      });
      
      if (Array.isArray(videosData) && videosData.length > 0) {
        setAllVideos(videosData);
        console.log(`✅ ${videosData.length} videos loaded`);
      } else {
        console.warn('⚠️ No videos found');
        setAllVideos([]);
      }
    } catch (err) {
      console.error('❌ Error loading videos:', err);
      setAllVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  // Fetch all memories from the platform
  const fetchAllMemories = async () => {
    try {
      setMemoriesLoading(true);
      console.log('🔍 Loading all memories...');
      
      let memoriesData = [];
      
      try {
        // Public route
        const response = await api.get('/api/public/memories');
        if (response.data && Array.isArray(response.data.data)) {
          memoriesData = response.data.data;
          console.log(`✅ ${memoriesData.length} memories retrieved via public API`);
        }
      } catch (err) {
        console.warn('⚠️ Public route failed, trying standard route');
        
        try {
          // Standard route
          const fallbackResponse = await api.get('/api/memories');
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
            memoriesData = fallbackResponse.data.data;
            console.log(`✅ ${memoriesData.length} memories retrieved via standard route`);
          }
        } catch (fallbackErr) {
          console.error('❌ All routes failed');
        }
      }
      
      // If we retrieved memories, cache them
      if (memoriesData.length > 0) {
        setAllMemories(memoriesData);
        
        // Store memories in localStorage for persistence between refreshes
        try {
          localStorage.setItem('allMemories', JSON.stringify(memoriesData));
          localStorage.setItem('memoriesFetchTime', Date.now().toString());
        } catch (storageErr) {
          console.warn('⚠️ Unable to store memories in localStorage:', storageErr);
        }
      } else {
        // If no memories were retrieved, try loading from localStorage
        try {
          const cachedMemories = localStorage.getItem('allMemories');
          if (cachedMemories) {
            const parsedMemories = JSON.parse(cachedMemories);
            setAllMemories(parsedMemories);
            console.log(`✅ ${parsedMemories.length} memories retrieved from cache`);
          }
        } catch (parseErr) {
          console.warn('⚠️ Error retrieving from cache:', parseErr);
        }
      }
    } catch (err) {
      console.error('❌ Error loading memories:', err);
      
      // Try loading from localStorage in case of error
      try {
        const cachedMemories = localStorage.getItem('allMemories');
        if (cachedMemories) {
          const parsedMemories = JSON.parse(cachedMemories);
          setAllMemories(parsedMemories);
          console.log(`✅ ${parsedMemories.length} memories retrieved from cache after error`);
        }
      } catch (parseErr) {
        console.warn('⚠️ Error retrieving from cache:', parseErr);
      }
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Filter memories for the current video
  const filterMemoriesForCurrentVideo = (memoriesArray, videoId) => {
    if (!videoId || !memoriesArray || !Array.isArray(memoriesArray) || memoriesArray.length === 0) return [];
    
    console.log('🔍 Filtering memories for video:', videoId);
    
    // Normalize current video ID for comparisons
    const currentVideoId = videoId.toString().trim();
    
    // Filter memories associated with this video
    const matchingMemories = memoriesArray.filter(memory => {
      // Extract video ID from the memory (with different possible formats)
      const memoryVideoId = 
        (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
        (memory.video && typeof memory.video === 'string' ? memory.video : null) ||
        memory.videoId || 
        memory.video_id;
      
      // Normalize memory ID
      const normalizedMemoryVideoId = memoryVideoId ? memoryVideoId.toString().trim() : '';
      
      // Check for matches with logging for debugging
      const isMatch = normalizedMemoryVideoId === currentVideoId;
      if (isMatch) {
        console.log(`✅ Matching memory found: ID=${memory._id || memory.id}, video=${memoryVideoId}`);
      }
      
      return isMatch;
    });
    
    console.log(`🎯 ${matchingMemories.length} memories match the current video`);
    return matchingMemories;
  };

  // Fetch a specific video by its ID
  const fetchVideoById = async (videoId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎬 Loading video:', videoId);
      
      const videoData = await videoAPI.getVideoById(videoId);
      
      if (videoData) {
        setVideo(videoData);
        
        // Check if user liked the video
        setUserLiked(videoData.userInteraction?.liked || false);
        
        // Set counters
        setViewCount(videoData.vues || 0);
        setLikeCount(videoData.likes || 0);
        
        console.log('✅ Video loaded:', videoData.titre);
      } else {
        setError('Unable to load video details');
      }
    } catch (err) {
      console.error('❌ Error loading video:', err);
      setError('Error loading video');
    } finally {
      setLoading(false);
    }
  };

  // Fetch memories specific to this video with cache management and retries
  const fetchVideoMemories = async (videoId) => {
    // Avoid multiple simultaneous requests
    if (fetchingRef.current) {
      console.log('⏳ A request is already in progress, cancelling');
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      setMemoriesLoading(true);
      console.log('🔍 Retrieving memories for video:', videoId);
      
      // First try to retrieve from local cache
      const memoriesFromState = allMemories.length > 0 ? filterMemoriesForCurrentVideo(allMemories, videoId) : [];
      
      if (memoriesFromState.length > 0) {
        console.log(`✅ ${memoriesFromState.length} memories found in local state`);
        const formattedMemories = formatMemories(memoriesFromState, videoId);
        setMemories(formattedMemories);
        fetchingRef.current = false;
        setMemoriesLoading(false);
        return;
      }
      
      // Try to retrieve from localStorage
      try {
        const cachedMemories = localStorage.getItem('allMemories');
        if (cachedMemories) {
          const parsedMemories = JSON.parse(cachedMemories);
          const filteredMemories = filterMemoriesForCurrentVideo(parsedMemories, videoId);
          
          if (filteredMemories.length > 0) {
            console.log(`✅ ${filteredMemories.length} memories found in localStorage cache`);
            const formattedMemories = formatMemories(filteredMemories, videoId);
            setMemories(formattedMemories);
            
            // Update global state too
            setAllMemories(parsedMemories);
            
            fetchingRef.current = false;
            setMemoriesLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn('⚠️ Error retrieving from cache:', cacheErr);
      }
      
      // If no cache or empty cache, request to API
      console.log('🔄 Attempting to retrieve from API...');
      
      // First try with the API specific to this video
      try {
        const memoriesData = await videoAPI.getVideoMemories(videoId);
        
        if (Array.isArray(memoriesData) && memoriesData.length > 0) {
          console.log(`✅ ${memoriesData.length} memories retrieved via API`);
          
          // Strictly filter for this video
          const strictlyFilteredMemories = memoriesData.filter(memory => {
            const memoryVideoId = 
                (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
                (typeof memory.video === 'string' ? memory.video : null) ||
                memory.videoId || 
                memory.video_id;
            
            return memoryVideoId && memoryVideoId.toString() === videoId.toString();
          });
          
          const formattedMemories = formatMemories(strictlyFilteredMemories, videoId);
          setMemories(formattedMemories);
          
          // Reset retry counter
          retryCountRef.current = 0;
        } else if (retryCountRef.current < maxRetries) {
          // Increase retry counter and try again after a delay
          retryCountRef.current++;
          console.log(`⚠️ No memories found, attempt ${retryCountRef.current}/${maxRetries}`);
          
          setTimeout(() => {
            fetchingRef.current = false;
            fetchVideoMemories(videoId);
          }, 1000 * retryCountRef.current); // Wait longer each time
          
          return;
        } else {
          console.warn('❌ No memories found after multiple attempts');
          setMemories([]);
          retryCountRef.current = 0;
        }
      } catch (apiErr) {
        console.error('❌ Error retrieving memories via API:', apiErr);
        
        // Fallback: retrieve all memories and filter
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`⚠️ Fallback attempt ${retryCountRef.current}/${maxRetries}`);
          
          try {
            // Retrieve all memories
            await fetchAllMemories();
            
            // Filter for this video
            const newFilteredMemories = filterMemoriesForCurrentVideo(allMemories, videoId);
            if (newFilteredMemories.length > 0) {
              const formattedMemories = formatMemories(newFilteredMemories, videoId);
              setMemories(formattedMemories);
            } else {
              setMemories([]);
            }
          } catch (fallbackErr) {
            console.error('❌ Error during fallback:', fallbackErr);
            setMemories([]);
          }
        } else {
          console.warn('❌ Failed after multiple attempts');
          setMemories([]);
        }
      }
    } finally {
      fetchingRef.current = false;
      setMemoriesLoading(false);
      retryCountRef.current = 0;
    }
  };

  // Manually refresh memories
  const refreshMemories = () => {
    if (id) {
      fetchVideoMemories(id);
    }
  };

  // Format memory data for display
  const formatMemories = (memoriesData, currentVideoId = id) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
      return [];
    }
    
    return memoriesData.map(memory => {
      // Correctly extract username
      let username = 'User';
      
      if (memory.auteur) {
        if (typeof memory.auteur === 'object') {
          // If author is an object (populate case)
          const prenom = memory.auteur.prenom || '';
          const nom = memory.auteur.nom || '';
          
          if (prenom || nom) {
            username = `${prenom} ${nom}`.trim();
          } else if (memory.auteur.username) {
            username = memory.auteur.username;
          }
        } else if (typeof memory.auteur === 'string' && memory.auteurDetails) {
          // If author is an ID but details are available elsewhere
          const prenom = memory.auteurDetails.prenom || '';
          const nom = memory.auteurDetails.nom || '';
          username = `${prenom} ${nom}`.trim() || memory.auteurDetails.username || 'User';
        }
      } else if (memory.username) {
        username = memory.username;
      }
      
      // Ensure video data is correct
      const videoDetails = {
        id: memory.video?._id || 
            (typeof memory.video === 'string' ? memory.video : null) || 
            memory.videoId || 
            memory.video_id ||
            currentVideoId, // id comes from context (current video ID)
        title: memory.video?.titre || memory.videoTitle || video?.titre || 'Untitled video',
        artist: memory.video?.artiste || memory.videoArtist || video?.artiste || 'Unknown artist',
        year: memory.video?.annee || memory.videoYear || video?.annee || '----'
      };
      
      return {
        id: memory._id || memory.id || `memory-${Math.random()}`,
        username: username,
        type: memory.type || 'posted',
        videoId: videoDetails.id,
        videoTitle: videoDetails.title,
        videoArtist: videoDetails.artist,
        videoYear: videoDetails.year,
        imageUrl: memory.auteur?.photo_profil || memory.imageUrl || '/images/default-avatar.jpg',
        content: memory.contenu || memory.content || '',
        likes: memory.likes || 0,
        comments: memory.nb_commentaires || memory.comments || 0,
        // Keep original references for interactions
        auteur: memory.auteur,
        video: memory.video,
        // For match verification
        originalVideoId: videoDetails.id,
        currentVideoId: currentVideoId,
        // User interaction information
        userInteraction: memory.userInteraction || {
          liked: false,
          disliked: false,
          isAuthor: false
        }
      };
    });
  };

  // Format all memories for display ("All memories" mode)
  const getAllFormattedMemories = () => {
    return formatMemories(allMemories);
  };

  // Load replies to a memory
  const fetchReplies = async (memoryId) => {
    try {
      setMemoriesLoading(true);
      console.log('🔍 Loading replies for memory:', memoryId);
      
      try {
        // Main route
        const response = await api.get(`/api/memories/${memoryId}/replies`);
        
        if (response.data && response.data.success) {
          console.log(`✅ ${response.data.data.length} replies retrieved`);
          return response.data.data;
        }
      } catch (err) {
        console.warn('⚠️ Main route failed, trying alternative route');
        
        // Alternative route
        try {
          const fallbackResponse = await api.get(`/api/public/memories/${memoryId}/replies`);
          
          if (fallbackResponse.data && fallbackResponse.data.success) {
            console.log(`✅ ${fallbackResponse.data.data.length} replies retrieved via alternative route`);
            return fallbackResponse.data.data;
          }
        } catch (fallbackErr) {
          console.error('❌ All routes failed');
        }
      }
      
      return [];
    } catch (err) {
      console.error('❌ Error loading replies:', err);
      return [];
    } finally {
      setMemoriesLoading(false);
    }
  };

  // To handle displaying replies to a memory
  const handleToggleReplies = async (memoryId) => {
    // Check if already loading
    if (memoriesLoading) return;
    
    // Find memory in state
    const memoryIndex = memories.findIndex(m => m.id === memoryId);
    if (memoryIndex === -1) return;
    
    const memory = memories[memoryIndex];
    
    // If replies are already displayed, hide them
    if (memory.showReplies) {
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        showReplies: false
      };
      setMemories(updatedMemories);
      return;
    }
    
    // Load replies if they're not already loaded
    if (!memory.replies || memory.replies.length === 0) {
      const replies = await fetchReplies(memoryId);
      
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        replies,
        showReplies: true
      };
      setMemories(updatedMemories);
    } else {
      // Simply display already loaded replies
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        showReplies: true
      };
      setMemories(updatedMemories);
    }
  };


// In VideoDetail.jsx, update the handleAddReply function
const handleAddReply = async (memoryId, replyText) => {
  try {
    console.log('✍️ Adding a reply to memory:', memoryId);
    
    // API call - try with the full route to ensure it's correct
    const response = await api.post(`/api/memories/${memoryId}/replies`, {
      contenu: replyText
    });
    
    if (response.data && response.data.success) {
      // Success processing
      console.log('✅ Reply added successfully:', response.data);
      
      // Update the replies list in real time
      const updatedMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            nb_commentaires: (memory.nb_commentaires || 0) + 1,
            replies: memory.replies 
              ? [...memory.replies, response.data.data] 
              : [response.data.data]
          };
        }
        return memory;
      });
      
      setMemories(updatedMemories);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('❌ Error adding reply:', err);
    
    // Try with an alternative route
    try {
      console.log('🔄 Trying with alternative route...');
      const fallbackResponse = await api.post(`/api/public/memories/${memoryId}/replies`, {
        contenu: replyText
      });
      
      if (fallbackResponse.data && fallbackResponse.data.success) {
        console.log('✅ Reply added successfully (via fallback):', fallbackResponse.data);
        
        // Update the replies list
        const updatedMemories = memories.map(memory => {
          if (memory.id === memoryId) {
            return {
              ...memory,
              nb_commentaires: (memory.nb_commentaires || 0) + 1,
              replies: memory.replies 
                ? [...memory.replies, fallbackResponse.data.data] 
                : [fallbackResponse.data.data]
            };
          }
          return memory;
        });
        
        setMemories(updatedMemories);
        return true;
      }
    } catch (fallbackErr) {
      console.error('❌ Error during alternative attempt:', fallbackErr);
    }
    
    if (err.response?.status === 401) {
      alert('Please log in to add a reply');
    } else {
      alert('Error adding reply. Please try again.');
    }
    
    return false;
  }
};

  // Handle liking a memory
  const handleLikeMemory = async (memoryId) => {
    try {
      console.log(' Attempting to like memory:', memoryId);
      
      // Optimistic update
      const updatedMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          const isLiked = memory.userInteraction?.liked;
          return {
            ...memory,
            likes: isLiked ? Math.max(0, memory.likes - 1) : memory.likes + 1,
            userInteraction: {
              ...memory.userInteraction,
              liked: !isLiked
            }
          };
        }
        return memory;
      });
      
      setMemories(updatedMemories);
      
      // Also update in allMemories
      const updatedAllMemories = allMemories.map(memory => {
        if ((memory._id || memory.id) === memoryId) {
          const isLiked = memory.userInteraction?.liked;
          return {
            ...memory,
            likes: isLiked ? Math.max(0, memory.likes - 1) : (memory.likes || 0) + 1,
            userInteraction: {
              ...memory.userInteraction,
              liked: !isLiked
            }
          };
        }
        return memory;
      });
      
      setAllMemories(updatedAllMemories);
      
      // Update localStorage cache
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
      } catch (storageErr) {
        console.warn('⚠️ Error updating cache:', storageErr);
      }
      
      // API call
      try {
        const response = await api.post(`/api/memories/${memoryId}/like`);
        
        // If the response contains new data, update with real values
        if (response.data && response.data.success && response.data.data) {
          const { liked, likes } = response.data.data;
          
          const updatedWithResponse = memories.map(memory => {
            if (memory.id === memoryId) {
              return {
                ...memory,
                likes: likes,
                userInteraction: {
                  ...memory.userInteraction,
                  liked: liked
                }
              };
            }
            return memory;
          });
          
          setMemories(updatedWithResponse);
        }
      } catch (apiErr) {
        console.warn('⚠️ Like API unavailable, local update only:', apiErr);
        
        // Try with an alternative route
        try {
          await api.post(`/api/public/memories/${memoryId}/like`);
        } catch (fallbackErr) {
          console.warn('⚠️ Alternative route also unavailable:', fallbackErr);
        }
      }
      
    } catch (err) {
      console.error('❌ Error liking memory:', err);
      
      if (err.response?.status === 401) {
        alert('Please log in to like this memory');
      }
    }
  };

  // Handle deleting a memory
  const handleDeleteMemory = async (memoryId) => {
    try {
      console.log('🗑️ Deleting memory:', memoryId);
      
      if (!window.confirm('Are you sure you want to delete this memory?')) {
        return;
      }
      
      // Optimistic update
      const updatedMemories = memories.filter(memory => memory.id !== memoryId);
      setMemories(updatedMemories);
      
      // Also update in allMemories
      const updatedAllMemories = allMemories.filter(memory => 
        (memory._id || memory.id) !== memoryId
      );
      
      setAllMemories(updatedAllMemories);
      
      // Update localStorage cache
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
      } catch (storageErr) {
        console.warn('⚠️ Error updating cache:', storageErr);
      }
      
      // API call
      try {
        await api.delete(`/api/memories/${memoryId}`);
        console.log('✅ Memory deleted successfully');
      } catch (apiErr) {
        console.warn('⚠️ Deletion API unavailable:', apiErr);
        
        if (apiErr.response?.status === 401) {
          alert('You must be logged in to delete this memory');
          // Restore the memory
          fetchVideoMemories(id);
        } else if (apiErr.response?.status === 403) {
          alert('You cannot delete this memory');
          // Restore the memory
          fetchVideoMemories(id);
        }
      }
    } catch (err) {
      console.error('❌ Error deleting memory:', err);
      // Restore in case of error
      fetchVideoMemories(id);
    }
  };

  // Handle liking a video
  const handleLikeVideo = async () => {
    if (isLiking) return; // Avoid multiple clicks
    
    try {
      setIsLiking(true);
      
      // Optimistic UI update
      const newLikedState = !userLiked;
      const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      
      setUserLiked(newLikedState);
      setLikeCount(newLikeCount);
      
      console.log('👍 Attempting like/unlike...');
      
      // API call
      const response = await videoAPI.likeVideo(id);
      
      if (response.success) {
        // Update with real data from server
        if (response.data) {
          setUserLiked(response.data.liked);
          setLikeCount(response.data.likes);
        }
        console.log('✅ Like/unlike successful');
      } else {
        // Revert to previous state in case of failure
        setUserLiked(!newLikedState);
        setLikeCount(likeCount);
        console.warn('⚠️ Like failed:', response.message);
      }
    } catch (err) {
      // Revert to previous state in case of error
      setUserLiked(!userLiked);
      setLikeCount(likeCount);
      
      console.error('❌ Error during like:', err);
      
      if (err.response?.status === 401) {
        alert('Please log in to like this video');
      } else {
        alert('Error liking the video. Please try again.');
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Handle video sharing
  const handleShareVideo = () => {
    setShowShareOptions(!showShareOptions);
  };
  
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
        default:
          return;
      }
      
      // Log the share via API (non-blocking)
      videoAPI.shareVideo(id).catch(err => 
        console.warn('⚠️ Share logging failed:', err)
      );
      
    } catch (err) {
      console.error('❌ Error sharing:', err);
      setShareMessage('Error sharing.');
      setTimeout(() => setShareMessage(''), 3000);
    }
    
    setShowShareOptions(false);
  };

  // Handle adding a memory
  const handleAddMemory = async (e) => {
    e.preventDefault();
    
    if (!memoryText.trim()) {
      alert('Please enter a memory to share');
      return;
    }
    
    if (isAddingMemory) return; 
    
    try {
      setIsAddingMemory(true);
      console.log('✍️ Adding a memory...');
      
      // EXPLICITLY include video ID in memory data
      const memoryData = {
        contenu: memoryText.trim(),
        video_id: id,
        videoId: id,
        video: id
      };
      
      const response = await api.post(`/api/public/videos/${id}/memories`, memoryData);
      
      if (response.data && response.data.success) {
        // Add the new memory to the list with explicit reference to current video
        if (response.data.data) {
          const newMemoryData = {
            ...response.data.data,
            video: {
              _id: id,
              titre: video?.titre,
              artiste: video?.artiste,
              annee: video?.annee
            },
            videoId: id // Explicitly add video ID
          };
          
          // Add to filtered memories list
          const newMemory = formatMemories([newMemoryData])[0];
          setMemories(prevMemories => [newMemory, ...prevMemories]);
          
          // Also add to complete list
          const updatedAllMemories = [newMemoryData, ...allMemories];
          setAllMemories(updatedAllMemories);
          
          // Update localStorage cache
          try {
            localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
            // Notify other tabs that memories have been updated
            localStorage.setItem('memoriesUpdated', Date.now().toString());
          } catch (storageErr) {
            console.warn('⚠️ Error updating cache:', storageErr);
          }
        }
        
        setMemoryText('');
        
        console.log('✅ Memory added successfully');
        
        // Discreet success notification
        setShareMessage('Memory added successfully!');
        setTimeout(() => setShareMessage(''), 3000);
      } else {
        // Fallback: try alternative route
        const fallbackResponse = await api.post(`/api/videos/${id}/memories`, memoryData);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          // Same processing as above
          if (fallbackResponse.data.data) {
            const newMemoryData = {
              ...fallbackResponse.data.data,
              video: {
                _id: id,
                titre: video?.titre,
                artiste: video?.artiste,
                annee: video?.annee
              },
              videoId: id
            };
            
            const newMemory = formatMemories([newMemoryData])[0];
            setMemories(prevMemories => [newMemory, ...prevMemories]);
            
            const updatedAllMemories = [newMemoryData, ...allMemories];
            setAllMemories(updatedAllMemories);
            
            try {
              localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
              localStorage.setItem('memoriesUpdated', Date.now().toString());
            } catch (storageErr) {
              console.warn('⚠️ Error updating cache:', storageErr);
            }
          }
          
          setMemoryText('');
          setShareMessage('Memory added successfully!');
          setTimeout(() => setShareMessage(''), 3000);
        } else {
          alert(fallbackResponse.data?.message || 'Error adding memory');
        }
      }
    } catch (err) {
      console.error('❌ Error adding memory:', err);
      
      // Try fallback
      try {
        const memoryData = {
          contenu: memoryText.trim(),
          video_id: id,
          videoId: id,
          video: id
        };
        
        const fallbackResponse = await api.post(`/api/videos/${id}/memories`, memoryData);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          console.log('✅ Memory added successfully (via fallback)');
          
          // Same actions as above
          if (fallbackResponse.data.data) {
            const newMemoryData = {
              ...fallbackResponse.data.data,
              video: {
                _id: id,
                titre: video?.titre,
                artiste: video?.artiste,
                annee: video?.annee
              },
              videoId: id
            };
            
            const newMemory = formatMemories([newMemoryData])[0];
            setMemories(prevMemories => [newMemory, ...prevMemories]);
            setAllMemories(prevAllMemories => [newMemoryData, ...prevAllMemories]);
            
            try {
              localStorage.setItem('allMemories', JSON.stringify([newMemoryData, ...allMemories]));
              localStorage.setItem('memoriesUpdated', Date.now().toString());
            } catch (storageErr) {
              console.warn('⚠️ Error updating cache:', storageErr);
            }
          }
          
          setMemoryText('');
          setShareMessage('Memory added successfully!');
          setTimeout(() => setShareMessage(''), 3000);
        } else {
          if (err.response?.status === 401) {
            alert('Please log in to share a memory');
          } else {
            alert('Error adding memory. Please try again.');
          }
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback also failed:', fallbackErr);
        
        if (err.response?.status === 401) {
          alert('Please log in to share a memory');
        } else {
          alert('Error adding memory. Please try again.');
        }
      }
    } finally {
      setIsAddingMemory(false);
    }
  };

  // Utilities for YouTube URLs
  const getYouTubeThumbnail = (url) => {
    if (!url) return '/images/video-placeholder.jpg';
    
    if (url.startsWith('/') || url.startsWith('./')) {
      return url;
    }
    
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
        if (videoId.includes('&')) {
          videoId = videoId.split('&')[0];
        }
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (error) {
      console.error('Error parsing YouTube URL:', error);
    }
    
    return url;
  };

  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      try {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } catch (e) {
        return url;
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1];
    } else {
      return url;
    }
    
    if (videoId && videoId.includes('&')) {
      videoId = videoId.split('&')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  // Component for recommended videos
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
          onError={(e) => {
            e.target.src = '/images/video-placeholder.jpg';
          }}
        />
        <div className={styles.recommendedInfo}>
          <div className={styles.recommendedArtist}>{recommendedVideo.artiste || 'Artist'}</div>
          <div className={styles.recommendedTitle}>: {recommendedVideo.titre || 'Title'} ({recommendedVideo.annee || '----'})</div>
        </div>
        {isCurrentVideo && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
      </a>
    );
  };

  // Toggle between all memories and only those for the current video
  const toggleAllMemories = () => {
    setShowAllMemories(!showAllMemories);
  };

  // Loading and error states
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
  
  // Determine which memories to display
  const memoriesToDisplay = showAllMemories ? getAllFormattedMemories() : memories;

  return (
    <div className={styles.throwbackVideosBg}>
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
      
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          {/* Video Player */}
          <div className={styles.videoPlayerContainer}>
            {isYoutubeEmbed ? (
              <div className={styles.videoWrapper}>
                <iframe
                  src={embedUrl}
                  title={`${video.artiste} - ${video.titre}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className={styles.videoThumbnail}>
                <img 
                  src={getYouTubeThumbnail(video.youtubeUrl)} 
                  alt={`${video.artiste} - ${video.titre}`} 
                  className={styles.thumbnailImg}
                  onError={(e) => {
                    e.target.src = '/images/video-placeholder.jpg';
                  }}
                />
                <div className={styles.playButton}>▶</div>
              </div>
            )}
          </div>

          {/* Video Title and Stats */}
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
            
            {/* Share/Success Message */}
            {shareMessage && (
              <div className={styles.shareMessage}>
                {shareMessage}
              </div>
            )}
          </div>

          {/* Memory Input */}
          <div className={styles.memoryInputContainer}>
            <input 
              type="text" 
              className={styles.memoryInput}
              placeholder="Share A Memory......"
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !isAddingMemory) {
                  handleAddMemory(e);
                }
              }}
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

          {/* Recommended Videos */}
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

        {/* Memories Sidebar */}
        <aside className={styles.rightCards}>
          {/* Header with filter and refresh button */}
          <div className={styles.memoriesHeader}>
            <h3>Memories {!showAllMemories && "for this video"}</h3>
            <div className={styles.memoriesControls}>
              <button 
                className={styles.refreshButton}
                onClick={refreshMemories}
                title="Refresh memories"
              >
                <FontAwesomeIcon icon={faSync} spin={memoriesLoading} />
              </button>
              <button 
                className={styles.filterToggleButton} 
                onClick={toggleAllMemories}
                title={showAllMemories ? "Show only memories for this video" : "Show all memories"}
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>{showAllMemories ? "Filter" : "All"}</span>
              </button>
            </div>
          </div>
          
          {/* Loader for memories */}
          {memoriesLoading ? (
            <div className={styles.memoriesLoading}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading memories...</p>
            </div>
          ) : memoriesToDisplay.length > 0 ? (
            // Display memories
            memoriesToDisplay.map((memory) => (
              <MemoryCard 
                key={memory.id || `memory-${Math.random()}`} 
                memory={memory}
                baseUrl={baseUrl}
                onLike={handleLikeMemory}
                onAddReply={handleAddReply}
                onDeleteMemory={handleDeleteMemory}
                onToggleReplies={handleToggleReplies}
                currentVideoId={id}
                replies={memory.replies || []}
                showReplies={memory.showReplies || false}
              />
            ))
          ) : (
            // Message if no memories
            <div className={styles.emptyMemories}>
              <p>No memories shared{!showAllMemories && " for this video"}.</p>
              <p>Be the first to share a memory!</p>
              
              {!showAllMemories && allMemories.length > 0 && (
                <button 
                  className={styles.showAllButton}
                  onClick={toggleAllMemories}
                >
                  View all memories
                </button>
              )}
              
              <button 
                className={styles.refreshButton}
                onClick={refreshMemories}
                style={{ marginTop: '12px' }}
              >
                <FontAwesomeIcon icon={faSync} /> Refresh
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;