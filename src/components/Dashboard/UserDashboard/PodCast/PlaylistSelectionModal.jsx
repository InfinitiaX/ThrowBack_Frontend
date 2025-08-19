import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faSpinner,
  faTimes,
  faCheck,
  faList,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import podcastAPI from '../../../../utils/podcastAPI';
import styles from './PlaylistSelectionModal.module.css';

const PlaylistSelectionModal = ({ podcastId, onClose, onSuccess }) => {
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [createMode, setCreateMode] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('token'));
  
  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    
    if (!token) {
      setError('You must be logged in to manage your playlists');
      setLoading(false);
    }
  }, []);
  
  // Fetch user playlists
  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Fetching user playlists');
        const playlists = await podcastAPI.getUserPlaylists();
        console.log('Received playlists:', playlists);
        setUserPlaylists(playlists || []);
      } catch (err) {
        console.error('Error fetching user playlists:', err);
        setError('Error loading your playlists');
        
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
          setError('You must be logged in to manage your playlists');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserPlaylists();
    }
  }, [isAuthenticated]);
  
  // Add podcast to existing playlist
  const handleAddToPlaylist = async (playlistId) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Adding podcast to playlist:', { podcastId, playlistId });
      const response = await podcastAPI.addPodcastToPlaylist(podcastId, playlistId);
      console.log('Add to playlist response:', response);
      
      if (response && response.success) {
        setSuccessMessage('Podcast added to playlist successfully!');
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response?.message || 'Error adding to playlist');
      }
    } catch (err) {
      console.error('Error adding podcast to playlist:', err);
      setError(err.response?.data?.message || 'Error adding to playlist');
      
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setError('You must be logged in to add to a playlist');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Create a new playlist
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      setError('Playlist name is required');
      return;
    }
    
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      const playlistData = {
        nom: newPlaylistName.trim(),
        description: newPlaylistDescription.trim(),
        podcastId: podcastId
      };
      
      console.log('Creating playlist with data:', playlistData);
      const response = await podcastAPI.createPlaylist(playlistData);
      console.log('Create playlist response:', response);
      
      if (response && response.success) {
        setSuccessMessage('New playlist created successfully!');
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setCreateMode(false);
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response?.message || 'Error creating playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.response?.data?.message || 'Error creating playlist');
      
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setError('You must be logged in to create a playlist');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Check if podcast is already in a playlist
  const isPodcastInPlaylist = (playlist) => {
    if (!playlist.videos) return false;
    
    return playlist.videos.some(item => {
      if (typeof item === 'string') return item === podcastId;
      if (typeof item.video_id === 'string') return item.video_id === podcastId;
      if (item.video_id && typeof item.video_id === 'object') return item.video_id._id === podcastId;
      return false;
    });
  };
  
  // Redirect to login page
  const handleLogin = () => {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{createMode ? 'Create a new playlist' : 'Add to playlist'}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {error && (
          <div className={styles.errorMessage}>
            <FontAwesomeIcon icon={faExclamationTriangle} /> {error}
            {!isAuthenticated && (
              <button 
                className={styles.loginButton}
                onClick={handleLogin}
              >
                Log in
              </button>
            )}
          </div>
        )}
        
        {successMessage && (
          <div className={styles.successMessage}>
            <FontAwesomeIcon icon={faCheck} /> {successMessage}
          </div>
        )}
        
        {!createMode ? (
          <>
            {loading ? (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                <p>Loading your playlists...</p>
              </div>
            ) : (
              <div className={styles.playlistsContainer}>
                {isAuthenticated && userPlaylists.length > 0 ? (
                  <div className={styles.playlistsList}>
                    {userPlaylists.map(playlist => (
                      <div key={playlist._id} className={styles.playlistItem}>
                        <div className={styles.playlistInfo}>
                          <h4>{playlist.nom}</h4>
                          <span>{playlist.videos?.length || 0} items</span>
                        </div>
                        <button 
                          className={`${styles.addButton} ${isPodcastInPlaylist(playlist) ? styles.addedButton : ''}`}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                          disabled={isPodcastInPlaylist(playlist) || submitting}
                        >
                          {isPodcastInPlaylist(playlist) ? (
                            <><FontAwesomeIcon icon={faCheck} /> Added</>
                          ) : submitting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <><FontAwesomeIcon icon={faPlus} /> Add</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isAuthenticated ? (
                  <div className={styles.emptyMessage}>
                    <p>You don't have any playlists yet.</p>
                  </div>
                ) : null}
                
                {isAuthenticated && (
                  <button 
                    className={styles.createButton}
                    onClick={() => setCreateMode(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Create a new playlist
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCreatePlaylist} className={styles.createForm}>
            <div className={styles.formGroup}>
              <label htmlFor="playlistName">Playlist name*</label>
              <input
                type="text"
                id="playlistName"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="My new playlist"
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="playlistDescription">Description (optional)</label>
              <textarea
                id="playlistDescription"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Description of your playlist..."
                className={styles.textarea}
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setCreateMode(false)}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={submitting || !newPlaylistName.trim()}
              >
                {submitting ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <><FontAwesomeIcon icon={faPlus} /> Create and add</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default PlaylistSelectionModal;