import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  
  // States
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingToPlaylist, setAddingToPlaylist] = useState({});
  const [successMessages, setSuccessMessages] = useState({});
  
  // Fonction utilitaire pour gérer les URLs des images
  const getImageUrl = (imagePath) => {
    if (!imagePath) return "https://via.placeholder.com/40?text=P";
    
    // Si c'est déjà une URL complète
    if (imagePath.startsWith('http')) return imagePath;
    
    // Récupérer l'URL de base de l'API
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // Si c'est un chemin relatif sans slash au début
    if (!imagePath.startsWith('/')) {
      return `${baseUrl}/${imagePath}`;
    }
    
    // Chemin relatif avec slash
    return `${baseUrl}${imagePath}`;
  };
  
  // Load user playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!isOpen || !user) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log("Chargement des playlists de l'utilisateur...");
        const userPlaylists = await playlistAPI.getUserPlaylists();
        console.log("Playlists récupérées:", userPlaylists);
        
        // Mark playlists that already contain the video
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
  
  // Filter playlists based on search
  const filteredPlaylists = playlists.filter(playlist => 
    playlist.nom?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Add video to playlist
  const handleAddToPlaylist = async (playlistId) => {
    try {
      setAddingToPlaylist(prev => ({ ...prev, [playlistId]: true }));
      
      console.log(`Ajout de la vidéo ${video._id} à la playlist ${playlistId}...`);
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
        [playlistId]: "Vidéo ajoutée à la playlist" 
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
      console.error('Erreur lors de l\'ajout à la playlist:', err);
      
      // Mark the playlist as having an error
      setSuccessMessages(prev => ({ 
        ...prev, 
        [playlistId]: "Erreur lors de l'ajout à la playlist" 
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
    navigate('/dashboard/playlists/new');
  };
  
  // Display the corresponding visibility icon
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
  
  // If the modal is not open, don't display anything
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
                src={getImageUrl(video.thumbnail) || "https://via.placeholder.com/300x168?text=Video"}
                alt={video.titre || "Vidéo"}
              />
            </div>
            <div className={styles.videoInfo}>
              <h3 className={styles.videoTitle}>{video.titre || "Vidéo sans titre"}</h3>
              <p className={styles.videoArtist}>{video.artiste || "Artiste inconnu"}</p>
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
                    "Vous n'avez pas encore créé de playlists"
                  }
                </p>
              </div>
            ) : (
              filteredPlaylists.map(playlist => (
                <div key={playlist._id} className={styles.playlistItem}>
                  <div className={styles.playlistInfo}>
                    <div className={styles.playlistImageContainer}>
                      <img 
                        src={getImageUrl(playlist.image_couverture)}
                        alt={playlist.nom || "Playlist"}
                        className={styles.playlistImage}
                      />
                    </div>
                    <div className={styles.playlistDetails}>
                      <div className={styles.playlistHeader}>
                        <h3 className={styles.playlistName}>{playlist.nom || "Playlist sans titre"}</h3>
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
                      <span className={`${styles.successMessage} ${successMessages[playlist._id].includes('Erreur') ? styles.errorMessage : ''}`}>
                        <FontAwesomeIcon icon={successMessages[playlist._id].includes('Erreur') ? faTimes : faCheck} /> 
                        {successMessages[playlist._id]}
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