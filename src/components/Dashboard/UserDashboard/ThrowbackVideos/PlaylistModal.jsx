// Correction for PlaylistModal.jsx
import React, { useState, useEffect } from 'react';
import api from '../../../../utils/api'; 
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus,
  faSpinner,
  faTimes,
  faCheck,
  faList
} from '@fortawesome/free-solid-svg-icons';
import styles from './PlaylistModal.module.css';

const PlaylistModal = ({ videoId, onClose, onSuccess }) => {
  const [userPlaylists, setUserPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistDescription, setNewPlaylistDescription] = useState('');
  const [createMode, setCreateMode] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Fetch user playlists
  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/playlists/user'); // Use api instead of axios
        if (response.data.success) {
          setUserPlaylists(response.data.data);
        } else {
          setError('Error retrieving your playlists');
        }
      } catch (err) {
        console.error('Error loading playlists:', err);
        setError('Error loading your playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlaylists();
  }, []);

  // Add video to existing playlist
  const handleAddToPlaylist = async (playlistId) => {
    try {
      setSubmitting(true);
      const response = await api.post(`/api/playlists/${playlistId}/videos`, {
        videoId
      });

      if (response.data.success) {
        setSuccess(`Video added to playlist successfully!`);
        
        // Refresh playlist list
        const updatedPlaylistsResponse = await api.get('/api/playlists/user');
        if (updatedPlaylistsResponse.data.success) {
          setUserPlaylists(updatedPlaylistsResponse.data.data);
        }
        
        // Notify parent component
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Error adding to playlist');
      }
    } catch (err) {
      console.error('Error adding to playlist:', err);
      setError(err.response?.data?.message || 'Error adding to playlist');
    } finally {
      setSubmitting(false);
    }
  };

  // Create a new playlist and add the video
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      setError('Playlist name is required');
      return;
    }

    try {
      setSubmitting(true);
      const response = await api.post('/api/playlists', {
        nom: newPlaylistName,
        description: newPlaylistDescription,
        videos: [{ videoId }] 
      });

      if (response.data.success) {
        setSuccess('New playlist created successfully!');
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setCreateMode(false);
        
        // Refresh playlist list
        const updatedPlaylistsResponse = await api.get('/api/playlists/user');
        if (updatedPlaylistsResponse.data.success) {
          setUserPlaylists(updatedPlaylistsResponse.data.data);
        }
        
        // Notify parent component
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Error creating playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.response?.data?.message || 'Error creating playlist');
    } finally {
      setSubmitting(false);
    }
  };

  // Check if video is already in a playlist
  const isVideoInPlaylist = (playlist) => {
    return playlist.videos && playlist.videos.some(v => 
      (v.video_id === videoId) || 
      (typeof v.video_id === 'object' && v.video_id._id === videoId)
    );
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h3>{createMode ? 'Create a new playlist' : 'Add to playlist'}</h3>
          <button className={styles.closeButton} onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        {error && (
          <div className={styles.errorMessage}>
            {error}
          </div>
        )}

        {success && (
          <div className={styles.successMessage}>
            <FontAwesomeIcon icon={faCheck} /> {success}
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
              <>
                {userPlaylists.length > 0 ? (
                  <div className={styles.playlistsList}>
                    {userPlaylists.map(playlist => (
                      <div key={playlist._id} className={styles.playlistItem}>
                        <div className={styles.playlistInfo}>
                          <h4>{playlist.nom}</h4>
                          <span>{playlist.nb_videos || playlist.videos?.length || 0} videos</span>
                        </div>
                        <button 
                          className={`${styles.addButton} ${isVideoInPlaylist(playlist) ? styles.addedButton : ''}`}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                          disabled={isVideoInPlaylist(playlist) || submitting}
                        >
                          {isVideoInPlaylist(playlist) ? (
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
                ) : (
                  <div className={styles.emptyMessage}>
                    <p>You don't have any playlists yet.</p>
                  </div>
                )}

                <button 
                  className={styles.createButton}
                  onClick={() => setCreateMode(true)}
                >
                  <FontAwesomeIcon icon={faPlus} /> Create a new playlist
                </button>
              </>
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
                placeholder="My awesome playlist"
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
                placeholder="A description of your playlist..."
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

export default PlaylistModal;