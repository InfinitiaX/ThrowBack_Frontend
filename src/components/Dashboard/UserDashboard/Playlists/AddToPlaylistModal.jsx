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
 * Modal pour ajouter une vidéo à des playlists existantes
 * 
 * @param {boolean} isOpen - Indique si le modal est ouvert
 * @param {Function} onClose - Fonction à appeler pour fermer le modal
 * @param {Object} video - Données de la vidéo à ajouter
 * @param {Array} existingPlaylists - Liste des playlists auxquelles la vidéo appartient déjà
 */
const AddToPlaylistModal = ({ isOpen, onClose, video, existingPlaylists = [] }) => {
  const { user } = useAuth();
  
  // États
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  
  // Charger les playlists de l'utilisateur
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isOpen || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        const userPlaylists = await playlistAPI.getUserPlaylists();
        
        // Marquer les playlists qui contiennent déjà la vidéo
        const playlistsWithStatus = userPlaylists.map(playlist => ({
          ...playlist,
          hasVideo: existingPlaylists.includes(playlist._id)
        }));
        
        setPlaylists(playlistsWithStatus);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des playlists:', err);
        setError('Impossible de charger vos playlists. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchPlaylists();
  }, [isOpen, user, existingPlaylists]);
  
  // Filtrer les playlists en fonction de la recherche
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.nom.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Ajouter la vidéo à une playlist
  const handleAddToPlaylist = async (playlistId) => {
    try {
      setAddingToPlaylist(prev => ({ ...prev, [playlistId]: true }));
      
      await playlistAPI.addVideoToPlaylist(playlistId, video._id);
      
      // Marquer la playlist comme contenant la vidéo
      setPlaylists(playlists.map(playlist => 
        playlist._id === playlistId 
          ? { ...playlist, hasVideo: true } 
          : playlist
      ));
      
      // Afficher un message de succès
      setSuccessMessages(prev => ({ 
        ...prev, 
        [playlistId]: "Vidéo ajoutée à la playlist" 
      }));
      
      // Masquer le message après 3 secondes
      setTimeout(() => {
        setSuccessMessages(prev => {
          const newMessages = { ...prev };
          delete newMessages[playlistId];
          return newMessages;
        });
      }, 3000);
    } catch (err) {
      console.error('Erreur lors de l\'ajout à la playlist:', err);
      
      // Marquer la playlist comme ayant une erreur
      setSuccessMessages(prev => ({ 
        ...prev, 
        [playlistId]: "Erreur lors de l'ajout" 
      }));
      
      // Masquer le message après 3 secondes
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
  
  // Créer une nouvelle playlist et y ajouter la vidéo
  const handleCreateNewPlaylist = () => {
    // Fermer le modal
    onClose();
    
    // Rediriger vers la page de création de playlist
    // Le composant parent devrait gérer cette redirection
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
  
  // Si le modal n'est pas ouvert, ne rien afficher
  if (!isOpen) return null;
  
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Ajouter à une playlist</h2>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fermer"
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
              placeholder="Rechercher dans vos playlists..."
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
                <span>Créer une nouvelle playlist</span>
              </div>
            </button>
            
            {loading ? (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin />
                <span>Chargement des playlists...</span>
              </div>
            ) : error ? (
              <div className={styles.errorContainer}>
                <p className={styles.errorMessage}>{error}</p>
                <button 
                  className={styles.retryButton}
                  onClick={() => window.location.reload()}
                >
                  Réessayer
                </button>
              </div>
            ) : filteredPlaylists.length === 0 ? (
              <div className={styles.emptyState}>
                <FontAwesomeIcon icon={faMusic} className={styles.emptyIcon} />
                <p className={styles.emptyMessage}>
                  {searchTerm ? 
                    "Aucune playlist ne correspond à votre recherche" : 
                    "Vous n'avez pas encore créé de playlist"
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
                        <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} vidéos
                      </p>
                    </div>
                  </div>
                  
                  <div className={styles.playlistAction}>
                    {playlist.hasVideo ? (
                      <span className={styles.alreadyAdded}>
                        <FontAwesomeIcon icon={faCheck} /> Ajoutée
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
                        <span>Ajouter</span>
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
            Terminé
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToPlaylistModal;