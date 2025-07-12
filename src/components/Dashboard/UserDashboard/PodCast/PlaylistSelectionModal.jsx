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
  
  // Vérifier si l'utilisateur est authentifié
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    setIsAuthenticated(!!token);
    
    if (!token) {
      setError('Vous devez être connecté pour gérer vos playlists');
      setLoading(false);
    }
  }, []);
  
  // Récupérer les playlists de l'utilisateur
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
        setError('Erreur lors du chargement de vos playlists');
        
        if (err.response?.status === 401) {
          setIsAuthenticated(false);
          setError('Vous devez être connecté pour gérer vos playlists');
        }
      } finally {
        setLoading(false);
      }
    };
    
    if (isAuthenticated) {
      fetchUserPlaylists();
    }
  }, [isAuthenticated]);
  
  // Ajouter le podcast à une playlist existante
  const handleAddToPlaylist = async (playlistId) => {
    if (submitting) return;
    
    try {
      setSubmitting(true);
      setError(null);
      
      console.log('Adding podcast to playlist:', { podcastId, playlistId });
      const response = await podcastAPI.addPodcastToPlaylist(podcastId, playlistId);
      console.log('Add to playlist response:', response);
      
      if (response && response.success) {
        setSuccessMessage('Podcast ajouté à la playlist avec succès!');
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response?.message || 'Erreur lors de l\'ajout à la playlist');
      }
    } catch (err) {
      console.error('Error adding podcast to playlist:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout à la playlist');
      
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setError('Vous devez être connecté pour ajouter à une playlist');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Créer une nouvelle playlist
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();
    
    if (!newPlaylistName.trim()) {
      setError('Le nom de la playlist est requis');
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
        setSuccessMessage('Nouvelle playlist créée avec succès!');
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setCreateMode(false);
        
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setError(response?.message || 'Erreur lors de la création de la playlist');
      }
    } catch (err) {
      console.error('Error creating playlist:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la playlist');
      
      if (err.response?.status === 401) {
        setIsAuthenticated(false);
        setError('Vous devez être connecté pour créer une playlist');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  // Vérifier si un podcast est déjà dans une playlist
  const isPodcastInPlaylist = (playlist) => {
    if (!playlist.videos) return false;
    
    return playlist.videos.some(item => {
      if (typeof item === 'string') return item === podcastId;
      if (typeof item.video_id === 'string') return item.video_id === podcastId;
      if (item.video_id && typeof item.video_id === 'object') return item.video_id._id === podcastId;
      return false;
    });
  };
  
  // Rediriger vers la page de connexion
  const handleLogin = () => {
    window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
  };
  
  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{createMode ? 'Créer une nouvelle playlist' : 'Ajouter à une playlist'}</h3>
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
                Se connecter
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
                <p>Chargement de vos playlists...</p>
              </div>
            ) : (
              <div className={styles.playlistsContainer}>
                {isAuthenticated && userPlaylists.length > 0 ? (
                  <div className={styles.playlistsList}>
                    {userPlaylists.map(playlist => (
                      <div key={playlist._id} className={styles.playlistItem}>
                        <div className={styles.playlistInfo}>
                          <h4>{playlist.nom}</h4>
                          <span>{playlist.videos?.length || 0} éléments</span>
                        </div>
                        <button 
                          className={`${styles.addButton} ${isPodcastInPlaylist(playlist) ? styles.addedButton : ''}`}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                          disabled={isPodcastInPlaylist(playlist) || submitting}
                        >
                          {isPodcastInPlaylist(playlist) ? (
                            <><FontAwesomeIcon icon={faCheck} /> Ajouté</>
                          ) : submitting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <><FontAwesomeIcon icon={faPlus} /> Ajouter</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : isAuthenticated ? (
                  <div className={styles.emptyMessage}>
                    <p>Vous n'avez pas encore de playlist.</p>
                  </div>
                ) : null}
                
                {isAuthenticated && (
                  <button 
                    className={styles.createButton}
                    onClick={() => setCreateMode(true)}
                  >
                    <FontAwesomeIcon icon={faPlus} /> Créer une nouvelle playlist
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <form onSubmit={handleCreatePlaylist} className={styles.createForm}>
            <div className={styles.formGroup}>
              <label htmlFor="playlistName">Nom de la playlist*</label>
              <input
                type="text"
                id="playlistName"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Ma nouvelle playlist"
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="playlistDescription">Description (optionnelle)</label>
              <textarea
                id="playlistDescription"
                value={newPlaylistDescription}
                onChange={(e) => setNewPlaylistDescription(e.target.value)}
                placeholder="Description de votre playlist..."
                className={styles.textarea}
              />
            </div>
            
            <div className={styles.formActions}>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => setCreateMode(false)}
              >
                Annuler
              </button>
              <button 
                type="submit" 
                className={styles.submitButton}
                disabled={submitting || !newPlaylistName.trim()}
              >
                {submitting ? (
                  <FontAwesomeIcon icon={faSpinner} spin />
                ) : (
                  <><FontAwesomeIcon icon={faPlus} /> Créer et ajouter</>
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