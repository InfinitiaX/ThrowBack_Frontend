// components/Dashboard/UserDashboard/Playlists/AddToPlaylistModal.jsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTimes, faSearch, faPlus, faCheck, faLock, 
  faGlobe, faUserFriends, faMusic, faSpinner 
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AddToPlaylistModal.module.css';

/**
 * Modal to add a video to existing playlists
 * 
 * @param {boolean} isOpen - Indicates if the modal is open
 * @param {Function} onClose - Function to call to close the modal
 * @param {Object} video - Video data to add
 * @param {Array} existingPlaylists - List of playlists the video already belongs to
 */
const AddToPlaylistModal = ({ isOpen, onClose, video, existingPlaylists = [] }) => {
  const { user } = useAuth();
  
  // States
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  
  // Load user playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isOpen || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userPlaylists = await playlistAPI.getUserPlaylists();
        
        // Mark playlists that already contain the video
        const playlistsWithStatus = userPlaylists.map(playlist => ({
          ...playlist,
          hasVideo: existingPlaylists.includes(playlist._id)
        }));
        
        setPlaylists(playlistsWithStatus);
        setLoading(false);
      } catch (err) {
        console.error('Error loading playlists:', err);
        setError('Unable to load your playlists. Please try again later.');
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [isOpen, user, existingPlaylists]);
  
  // Filter playlists based on search
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Add video to playlist
  const handleAddToPlaylist = async (playlistId) => {
    try {
      setAddingToPlaylist(prev => ({ ...prev, [playlistId]: true }));
      
      await playlistAPI.addVideoToPlaylist(playlistId, video._id);
      
      // Mark the playlist as containing the video
      setPlaylists(playlists.map(playlist => 
        playlist._id === playlistId 
          ? { ...playlist, hasVideo: true } 
          : playlist
      ));
      
      // Display success message
      setSuccessMessages(prev => ({ 
        ...prev, 
        [playlistId]: "Video added to playlist" 
      }));
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[playlistId];
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      console.error('Error adding to playlist:', err);
      
      // Mark the playlist as having an error
      setSuccessMessages(prev => ({ 
        ...prev, 
        [playlistId]: "Error adding to playlist" 
      }));
      
      // Hide message after 3 seconds
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[playlistId];
          return newMessages;
        });
      }, 3000);
    } finally {
      setAddingToPlaylist(prev => ({ ...prev, [playlistId]: false }));
    }
  };
  
  // Create a new playlist and add the video
  const handleCreateNewPlaylist = () => {
    // Close the modal
    onClose();
    
    // Redirect to playlist creation page
    // The parent component should handle this redirection
  };
  
  // Display the corresponding visibility icon
  const renderVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return <FontAwesomeIcon icon={faGlobe} title="Public" />;
      case 'PRIVE':
        return <FontAwesomeIcon icon={faLock} title="Private" />;
      case 'AMIS':
        return <FontAwesomeIcon icon={faUserFriends} title="Friends only" />;
      default:
        return <FontAwesomeIcon icon={faGlobe} title="Public" />;
    }
  };
  
  // If the modal is not open, don't display anything
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add to playlist</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.videoPreview}>
            <div className={styles.videoThumbnail}>
              <img 
                src={video.thumbnail || "https://via.placeholder.com/300x168?text=Video"}
                alt={video.titre}
              />
            </div>
            <div className={styles.videoInfo}>
              <h3 className={styles.videoTitle}>{video.titre}</h3>
              <p className={styles.videoArtist}>{video.artiste}</p>
            </div>
          </div>
          
          <div className={styles.searchContainer}>
            <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your playlists..."
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.playlistsList}>
            <button 
              className={styles.createPlaylistButton}
              onClick={handleCreateNewPlaylist}
            >
              <div className={styles.createPlaylistIcon}>
                <FontAwesomeIcon icon={faPlus} />
              </div>
              <div className={styles.createPlaylistText}>
                <span>Create a new playlist</span>
              </div>
            </button>
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Loading playlists...</span>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Retry
                </button>
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faMusic} className={styles.emptyIcon} />
                <p className={styles.emptyMessage}>
                  {searchTerm ? 
                    "No playlist matches your search" : 
                    "You haven't created any playlists yet"
                  }
                </p>
              </div>
            ) : (
              filteredPlaylists.map(playlist => (
                <div key={playlist._id} className={styles.playlistItem}>
                  <div className={styles.playlistInfo}>
                    <div className={styles.playlistImageContainer}>
                      <img 
                        src={playlist.image_couverture || "https://via.placeholder.com/40?text=P"}
                        alt={playlist.nom}
                        className={styles.playlistImage}
                      />
                    </div>
                    <div className={styles.playlistDetails}>
                      <div className={styles.playlistHeader}>
                        <h3 className={styles.playlistName}>{playlist.nom}</h3>
                        <span className={styles.playlistVisibility}>
                          {renderVisibilityIcon(playlist.visibilite)}
                        </span>
                      </div>
                      <p className={styles.playlistStats}>
                        <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} videos
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.playlistAction}>
                    {playlist.hasVideo ? (
                      <span className={styles.alreadyAdded}>
                        <FontAwesomeIcon icon={faCheck} /> Added
                      </span>
                    ) : successMessages[playlist._id] ? (
                      <span className={styles.successMessage}>
                        <FontAwesomeIcon icon={faCheck} /> {successMessages[playlist._id]}
                      </span>
                    ) : (
                      <button 
                        className={styles.addButton}
                        onClick={() => handleAddToPlaylist(playlist._id)}
                        disabled={addingToPlaylist[playlist._id]}
                      >
                        {addingToPlaylist[playlist._id] ? (
                          <FontAwesomeIcon icon={faSpinner} spin />
                        ) : (
                          <FontAwesomeIcon icon={faPlus} />
                        )}
                        <span>Add</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.doneButton}
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;