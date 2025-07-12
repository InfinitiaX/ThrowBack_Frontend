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
 * Composant de carte réutilisable pour afficher une playlist
 * 
 * @param {Object} playlist - Données de la playlist à afficher
 * @param {Function} onDelete - Fonction à appeler pour supprimer la playlist
 * @param {Function} onToggleFavorite - Fonction à appeler pour ajouter/retirer des favoris
 * @param {Function} onShare - Fonction à appeler pour partager la playlist
 * @param {boolean} isOwner - Indique si l'utilisateur courant est le propriétaire de la playlist
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
  
  // Naviguer vers la page de détail de la playlist
  const handleClick = () => {
    navigate(`/dashboard/playlists/${playlist._id}`);
  };
  
  // Lancer la lecture de la playlist
  const handlePlay = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/play`);
  };
  
  // Afficher/masquer le menu contextuel
  const handleToggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown(!showDropdown);
  };
  
  // Éditer la playlist
  const handleEdit = (e) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/edit`);
    setShowDropdown(false);
  };
  
  // Partager la playlist
  const handleShare = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(playlist);
    }
    setShowDropdown(false);
  };
  
  // Supprimer la playlist
  const handleDelete = (e) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(playlist);
    }
    setShowDropdown(false);
  };
  
  // Ajouter/retirer des favoris
  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(playlist);
    }
  };
  
  // Formater le nombre de lectures/favoris
  const formatCount = (count) => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count;
  };
  
  // Afficher l'icône de visibilité correspondante
  const renderVisibilityIcon = (visibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return <FontAwesomeIcon icon={faGlobe} title="Public" />;
      case 'PRIVE':
        return <FontAwesomeIcon icon={faLock} title="Privé" />;
      case 'AMIS':
        return <FontAwesomeIcon icon={faUserFriends} title="Amis uniquement" />;
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
            aria-label="Lire la playlist"
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
          {playlist.description || "Aucune description"}
        </p>
        
        <div className={styles.stats}>
          <span className={styles.count}>
            <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} vidéos
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
              alt={`${playlist.proprietaire.prenom || 'Utilisateur'} ${playlist.proprietaire.nom || ''}`}
              className={styles.ownerAvatar}
            />
            <span className={styles.ownerName}>
              {`${playlist.proprietaire.prenom || 'Utilisateur'} ${playlist.proprietaire.nom || ''}`}
            </span>
          </div>
        )}
      </div>
      
      <div className={styles.actions}>
        <button 
          className={styles.actionButton}
          onClick={handleToggleFavorite}
          aria-label={playlist.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
        </button>
        
        <div className={styles.dropdownContainer}>
          <button 
            className={styles.actionButton}
            onClick={handleToggleDropdown}
            aria-label="Plus d'options"
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
                  <span>Modifier</span>
                </button>
              )}
              
              <button 
                className={styles.dropdownItem}
                onClick={handleShare}
              >
                <FontAwesomeIcon icon={faShare} />
                <span>Partager</span>
              </button>
              
              {isOwner && (
                <button 
                  className={styles.dropdownItem}
                  onClick={handleDelete}
                >
                  <FontAwesomeIcon icon={faTrash} />
                  <span>Supprimer</span>
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