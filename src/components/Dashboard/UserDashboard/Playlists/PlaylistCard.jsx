// components/Dashboard/UserDashboard/Playlists/PlaylistCard.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faHeart, faHeartBroken, faEllipsisV, faEdit, 
  faTrash, faShare, faEye, faMusic, faGlobe, faLock, faUserFriends 
} from '@fortawesome/free-solid-svg-icons';
import styles from './PlaylistCard.module.css';

/**
 * Reusable card component to display a playlist
 * 
 * @param {Object} playlist - Playlist data to display
 * @param {Function} onDelete - Function to call to delete the playlist
 * @param {Function} onToggleFavorite - Function to call to add/remove from favorites
 * @param {Function} onShare - Function to call to share the playlist
 * @param {boolean} isOwner - Indicates if the current user is the owner of the playlist
 */
const PlaylistCard = ({ 
  playlist, 
  onDelete, 
  onToggleFavorite, 
  onShare, 
  isOwner = false 
}) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Navigate to playlist detail page
  const handleClick = () => {
    navigate(`/dashboard/playlists/${playlist._id}`);
  };
  
  // Start playing the playlist
  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/play`);
  };
  
  // Show/hide the context menu
  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };
  
  // Edit the playlist
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/edit`);
    setShowDropdown(false);
  };
  
  // Share the playlist
  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(playlist);
    }
    setShowDropdown(false);
  };
  
  // Delete the playlist
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(playlist);
    }
    setShowDropdown(false);
  };
  
  // Add/remove from favorites
  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(playlist);
    }
  };
  
  // Format the view/favorites count
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
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
  
  return (
    <div className={styles.playlistCard} onClick={handleClick}>
      <div className={styles.imageContainer}>
        <img 
          src={playlist.image_couverture || "https://via.placeholder.com/300x200?text=Playlist"}
          alt={playlist.nom}
          className={styles.playlistImage}
        />
        <div className={styles.overlay}>
          <button 
            className={styles.playButton}
            onClick={handlePlay}
            aria-label="Play playlist"
          >
            <FontAwesomeIcon icon={faPlay} />
          </button>
        </div>
      </div>
      
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{playlist.nom}</h3>
          <div className={styles.visibility}>
            {renderVisibilityIcon(playlist.visibilite)}
          </div>
        </div>
        
        <p className={styles.description}>
          {playlist.description || "No description"}
        </p>
        
        <div className={styles.stats}>
          <span className={styles.count}>
            <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} videos
          </span>
          <span className={styles.count}>
            <FontAwesomeIcon icon={faEye} /> {formatCount(playlist.nb_lectures || 0)}
          </span>
          <span className={styles.count}>
            <FontAwesomeIcon icon={faHeart} /> {formatCount(playlist.nb_favoris || 0)}
          </span>
        </div>
        
        {playlist.proprietaire && (
          <div className={styles.owner}>
            <img 
              src={playlist.proprietaire.photo_profil || "https://via.placeholder.com/30"}
              alt={`${playlist.proprietaire.prenom || 'User'} ${playlist.proprietaire.nom || ''}`}
              className={styles.ownerAvatar}
            />
            <span className={styles.ownerName}>
              {`${playlist.proprietaire.prenom || 'User'} ${playlist.proprietaire.nom || ''}`}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={handleToggleFavorite}
          aria-label={playlist.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
        </button>
        
        <div className={styles.dropdownContainer}>
          <button 
            className={styles.actionButton}
            onClick={handleToggleDropdown}
            aria-label="More options"
          >
            <FontAwesomeIcon icon={faEllipsisV} />
          </button>
          
          {showDropdown && (
            <div className={styles.dropdown}>
              {isOwner && (
                <button 
                  className={styles.dropdownItem}
                  onClick={handleEdit}
                >
                  <FontAwesomeIcon icon={faEdit} />
                  <span>Edit</span>
                </button>
              )}
              
              <button 
                className={styles.dropdownItem}
                onClick={handleShare}
              >
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </button>
              
              {isOwner && (
                <button 
                  className={styles.dropdownItem}
                  onClick={handleDelete}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Delete</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;