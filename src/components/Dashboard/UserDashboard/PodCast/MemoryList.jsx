import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import podcastAPI from '../../../../utils/podcastAPI';
import styles from './MemoryList.module.css';

const MemoryList = ({ podcastId }) => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memoryText, setMemoryText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
  }, []);

  // Load memories
  useEffect(() => {
    const fetchMemories = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching memories for podcast:', podcastId);
        const data = await podcastAPI.getPodcastMemories(podcastId);
        console.log('Received memories:', data);
        setMemories(data || []);
      } catch (err) {
        console.error('Error fetching memories:', err);
        setError('Error loading memories');
      } finally {
        setLoading(false);
      }
    };

    if (podcastId) {
      fetchMemories();
    }
  }, [podcastId]);

  // Add a new memory
  const handleAddMemory = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      alert('Please log in to share a memory');
      return;
    }
    
    if (!memoryText.trim()) {
      return;
    }
    
    if (isSubmitting) {
      return;
    }
    
    try {
      setIsSubmitting(true);
      console.log('Adding memory to podcast:', podcastId, 'Content:', memoryText);
      const response = await podcastAPI.addMemory(podcastId, memoryText);
      
      if (response && response.success) {
        console.log('Memory added successfully:', response.data);
        // Add the new memory to the top of the list
        setMemories(prev => [response.data, ...prev]);
        setMemoryText('');
      } else {
        console.error('Failed to add memory:', response);
        setError(response?.message || 'Error adding memory');
      }
    } catch (err) {
      console.error('Error adding memory:', err);
      setError('Error adding memory');
      
      if (err.response?.status === 401) {
        alert('Please log in to share a memory');
        setIsAuthenticated(false);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Get image URL with CORS handling
  const getImageUrl = (imagePath) => {
    if (!imagePath) return '/images/default-avatar.jpg';
    
    if (imagePath.startsWith('http')) {
      return imagePath;
    }
    
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ';
    return `${backendUrl}${imagePath.startsWith('/') ? '' : '/'}${imagePath}`;
  };

  // Component to display a memory
  const MemoryCard = ({ memory }) => (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <div className={styles.userInfo}>
          {memory.imageUrl && (
            <img 
              src={getImageUrl(memory.imageUrl)} 
              alt={memory.username} 
              className={styles.userAvatar} 
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/default-avatar.jpg';
              }}
              crossOrigin="anonymous"
            />
          )}
          <span className={styles.username}>{memory.username}</span>
        </div>
        <span className={styles.memoryType}>
          {memory.type === 'posted' ? 'shared a memory' : 'shared this podcast'}
        </span>
      </div>
      
      <div className={styles.memoryContent}>
        <div className={styles.podcastInfo}>
          <span className={styles.podcastArtist}>{memory.videoArtist}</span>
          <span className={styles.podcastTitle}> - {memory.videoTitle}</span>
          <span className={styles.podcastYear}> ({memory.videoYear})</span>
        </div>
        
        <p className={styles.memoryText}>{memory.content}</p>
      </div>
      
      <div className={styles.memoryFooter}>
        <div className={styles.memoryActions}>
          <button className={styles.likeButton}>
            <FontAwesomeIcon icon={faHeart} /> 
            <span>{memory.likes}</span>
          </button>
          
          <button className={styles.commentButton}>
            <FontAwesomeIcon icon={faComment} />
            <span>{memory.comments}</span>
          </button>
        </div>
        
        <div className={styles.memoryDate}>
          {formatDate(memory.date)}
        </div>
      </div>
    </div>
  );

  return (
    <div className={styles.memoryListContainer}>
      <h3 className={styles.sectionTitle}>Shared Memories</h3>
      
      <div className={styles.memoryInputContainer}>
        <form onSubmit={handleAddMemory}>
          <input
            type="text"
            placeholder={isAuthenticated 
              ? "Share a memory related to this podcast..." 
              : "Log in to share a memory"}
            className={styles.memoryInput}
            value={memoryText}
            onChange={(e) => setMemoryText(e.target.value)}
            disabled={isSubmitting || !isAuthenticated}
          />
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={!memoryText.trim() || isSubmitting || !isAuthenticated}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              'Share'
            )}
          </button>
        </form>
      </div>
      
      {error && (
        <div className={styles.errorMessage}>
          <FontAwesomeIcon icon={faExclamationTriangle} />
          <span>{error}</span>
        </div>
      )}
      
      <div className={styles.memoriesList}>
        {loading ? (
          <div className={styles.loadingContainer}>
            <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
            <p>Loading memories...</p>
          </div>
        ) : memories.length > 0 ? (
          memories.map((memory, index) => (
            <MemoryCard key={memory.id || memory._id || index} memory={memory} />
          ))
        ) : (
          <div className={styles.emptyMessage}>
            <p>No memories shared for this podcast yet.</p>
            <p>Be the first to share a memory!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MemoryList;