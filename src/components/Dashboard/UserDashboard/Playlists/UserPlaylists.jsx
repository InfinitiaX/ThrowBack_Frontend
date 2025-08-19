// components/Dashboard/UserDashboard/Playlists/UserPlaylists.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faMusic, faPlay, faEllipsisV, faTrash, faEdit, faShare, 
  faHeart, faHeartBroken, faEye, faGlobe, faLock, faUserFriends
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import EmptyState from '../../../Common/EmptyState';
import ConfirmModal from '../../../Common/ConfirmModal';
import Toast from '../../../Common/Toast';
import styles from './UserPlaylists.module.css';

const UserPlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [popularPlaylists, setPopularPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [activeDropdown, setActiveDropdown] = useState(null);
  
  const { user } = useAuth();
  const navigate = useNavigate();

  // Load user playlists and popular playlists
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load user playlists
        const userPlaylistsData = await playlistAPI.getUserPlaylists();
        setPlaylists(userPlaylistsData);
        
        // Load popular playlists
        const popularPlaylistsData = await playlistAPI.getPopularPlaylists(5);
        setPopularPlaylists(popularPlaylistsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading playlists:', err);
        setError('Unable to load playlists. Please try again later.');
        setLoading(false);
      }
    };

    fetchData();
    
    // Clean up dropdowns when clicking outside
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Handle creating a new playlist
  const handleCreatePlaylist = () => {
    navigate('/dashboard/playlists/new');
  };

  // Handle navigation to a playlist
  const handlePlaylistClick = (playlistId) => {
    navigate(`/dashboard/playlists/${playlistId}`);
  };

  // Handle playing a playlist
  const handlePlayPlaylist = (e, playlistId) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlistId}/play`);
  };

  // Show playlist context menu
  const handleToggleDropdown = (e, index) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Delete a playlist
  const handleDeletePlaylist = async () => {
    try {
      await playlistAPI.deletePlaylist(selectedPlaylist._id);
      setPlaylists(playlists.filter(p => p._id !== selectedPlaylist._id));
      setShowConfirmDelete(false);
      setSelectedPlaylist(null);
      
      // Show success notification
      setToastMessage('Playlist deleted successfully');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Error deleting playlist:', err);
      setToastMessage('Error deleting playlist');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Edit a playlist
  const handleEditPlaylist = (e, playlist) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/edit`);
    setActiveDropdown(null);
  };

  // Add/remove from favorites
  const handleToggleFavorite = async (e, playlist) => {
    e.stopPropagation();
    try {
      const response = await playlistAPI.toggleFavorite(playlist._id);
      
      // Update local state
      setPlaylists(playlists.map(p => {
        if (p._id === playlist._id) {
          return {
            ...p,
            isFavorite: response.isFavorite,
            nb_favoris: response.isFavorite ? p.nb_favoris + 1 : p.nb_favoris - 1
          };
        }
        return p;
      }));
      
      setToastMessage(response.isFavorite ? 
        'Playlist added to favorites' : 
        'Playlist removed from favorites');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Error managing favorites:', err);
      setToastMessage('Error managing favorites');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Share a playlist
  const handleSharePlaylist = (e, playlist) => {
    e.stopPropagation();
    // Copy link to clipboard
    const shareUrl = `${window.location.origin}/dashboard/playlists/${playlist._id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setToastMessage('Playlist link copied to clipboard');
        setToastType('success');
        setShowToast(true);
      })
      .catch(err => {
        console.error('Error copying link:', err);
        setToastMessage('Error copying link');
        setToastType('error');
        setShowToast(true);
      });
    
    setActiveDropdown(null);
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

  // Format the view count
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => window.location.reload()}
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playlistsContainer}>
      {/* Header with title and create button */}
      <div className={styles.header}>
        <h1 className={styles.title}>Your playlists</h1>
        <button 
          className={styles.createButton}
          onClick={handleCreatePlaylist}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Create playlist</span>
        </button>
      </div>

      {/* User playlists */}
      <section className={styles.userPlaylistsSection}>
        <h2 className={styles.sectionTitle}>My playlists</h2>
        
        {playlists.length === 0 ? (
          <EmptyState 
            icon={faMusic}
            title="No playlists"
            message="You haven't created any playlists yet. Create one to start organizing your favorite videos."
            actionText="Create playlist"
            onAction={handleCreatePlaylist}
          />
        ) : (
          <div className={styles.playlistsGrid}>
            {playlists.map((playlist, index) => (
              <div 
                key={playlist._id} 
                className={styles.playlistCard}
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                <div className={styles.playlistImageContainer}>
                  <img 
                    src={playlist.image_couverture || "https://via.placeholder.com/300x200?text=Playlist"}
                    alt={playlist.nom}
                    className={styles.playlistImage}
                  />
                  <div className={styles.playlistOverlay}>
                    <button 
                      className={styles.playButton}
                      onClick={(e) => handlePlayPlaylist(e, playlist._id)}
                      aria-label="Play playlist"
                    >
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  </div>
                </div>
                
                <div className={styles.playlistInfo}>
                  <div className={styles.playlistMeta}>
                    <h3 className={styles.playlistTitle}>{playlist.nom}</h3>
                    <div className={styles.playlistVisibility}>
                      {renderVisibilityIcon(playlist.visibilite)}
                    </div>
                  </div>
                  
                  <p className={styles.playlistDescription}>
                    {playlist.description || "No description"}
                  </p>
                  
                  <div className={styles.playlistStats}>
                    <span className={styles.videoCount}>
                      <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} videos
                    </span>
                    <span className={styles.viewCount}>
                      <FontAwesomeIcon icon={faEye} /> {formatCount(playlist.nb_lectures || 0)}
                    </span>
                    <span className={styles.likeCount}>
                      <FontAwesomeIcon icon={faHeart} /> {formatCount(playlist.nb_favoris || 0)}
                    </span>
                  </div>
                </div>
                
                <div className={styles.playlistActions}>
                  <button 
                    className={styles.actionButton}
                    onClick={(e) => handleToggleFavorite(e, playlist)}
                    aria-label={playlist.isFavorite ? "Remove from favorites" : "Add to favorites"}
                  >
                    <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
                  </button>
                  
                  <div className={styles.dropdownContainer}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => handleToggleDropdown(e, index)}
                      aria-label="More options"
                    >
                      <FontAwesomeIcon icon={faEllipsisV} />
                    </button>
                    
                    {activeDropdown === index && (
                      <div className={styles.dropdown}>
                        <button 
                          className={styles.dropdownItem}
                          onClick={(e) => handleEditPlaylist(e, playlist)}
                        >
                          <FontAwesomeIcon icon={faEdit} />
                          <span>Edit</span>
                        </button>
                        
                        <button 
                          className={styles.dropdownItem}
                          onClick={(e) => handleSharePlaylist(e, playlist)}
                        >
                          <FontAwesomeIcon icon={faShare} />
                          <span>Share</span>
                        </button>
                        
                        <button 
                          className={styles.dropdownItem}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPlaylist(playlist);
                            setShowConfirmDelete(true);
                            setActiveDropdown(null);
                          }}
                        >
                          <FontAwesomeIcon icon={faTrash} />
                          <span>Delete</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Popular playlists */}
      {popularPlaylists.length > 0 && (
        <section className={styles.popularPlaylistsSection}>
          <h2 className={styles.sectionTitle}>Popular playlists</h2>
          
          <div className={styles.playlistsGrid}>
            {popularPlaylists.map((playlist) => (
              <div 
                key={playlist._id} 
                className={styles.playlistCard}
                onClick={() => handlePlaylistClick(playlist._id)}
              >
                <div className={styles.playlistImageContainer}>
                  <img 
                    src={playlist.image_couverture || "https://via.placeholder.com/300x200?text=Playlist"}
                    alt={playlist.nom}
                    className={styles.playlistImage}
                  />
                  <div className={styles.playlistOverlay}>
                    <button 
                      className={styles.playButton}
                      onClick={(e) => handlePlayPlaylist(e, playlist._id)}
                      aria-label="Play playlist"
                    >
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  </div>
                </div>
                
                <div className={styles.playlistInfo}>
                  <div className={styles.playlistMeta}>
                    <h3 className={styles.playlistTitle}>{playlist.nom}</h3>
                    <div className={styles.playlistVisibility}>
                      {renderVisibilityIcon(playlist.visibilite)}
                    </div>
                  </div>
                  
                  <p className={styles.playlistDescription}>
                    {playlist.description || "No description"}
                  </p>
                  
                  <div className={styles.playlistStats}>
                    <span className={styles.videoCount}>
                      <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} videos
                    </span>
                    <span className={styles.viewCount}>
                      <FontAwesomeIcon icon={faEye} /> {formatCount(playlist.nb_lectures || 0)}
                    </span>
                    <span className={styles.likeCount}>
                      <FontAwesomeIcon icon={faHeart} /> {formatCount(playlist.nb_favoris || 0)}
                    </span>
                  </div>
                  
                  <div className={styles.playlistCreator}>
                    <img 
                      src={playlist.proprietaire?.photo_profil || "https://via.placeholder.com/30"}
                      alt={`${playlist.proprietaire?.prenom || 'User'} ${playlist.proprietaire?.nom || ''}`}
                      className={styles.creatorAvatar}
                    />
                    <span className={styles.creatorName}>
                      {`${playlist.proprietaire?.prenom || 'User'} ${playlist.proprietaire?.nom || ''}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete playlist"
        message={`Are you sure you want to delete the playlist "${selectedPlaylist?.nom}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeletePlaylist}
        onCancel={() => {
          setShowConfirmDelete(false);
          setSelectedPlaylist(null);
        }}
      />

      {/* Toast for notifications */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default UserPlaylists;