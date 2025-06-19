// Correction pour PlaylistModal.jsx
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

  // Récupérer les playlists de l'utilisateur
  useEffect(() => {
    const fetchUserPlaylists = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/playlists/user'); // Utiliser api au lieu de axios
        if (response.data.success) {
          setUserPlaylists(response.data.data);
        } else {
          setError('Erreur lors de la récupération de vos playlists');
        }
      } catch (err) {
        console.error('Erreur lors du chargement des playlists:', err);
        setError('Erreur lors du chargement de vos playlists');
      } finally {
        setLoading(false);
      }
    };

    fetchUserPlaylists();
  }, []);

  // Ajouter la vidéo à une playlist existante
  const handleAddToPlaylist = async (playlistId) => {
    try {
      setSubmitting(true);
      const response = await api.post(`/api/playlists/${playlistId}/videos`, {
        videoId
      });

      if (response.data.success) {
        setSuccess(`Vidéo ajoutée à la playlist avec succès!`);
        
        // Rafraîchir la liste des playlists
        const updatedPlaylistsResponse = await api.get('/api/playlists/user');
        if (updatedPlaylistsResponse.data.success) {
          setUserPlaylists(updatedPlaylistsResponse.data.data);
        }
        
        // Notifier le composant parent
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Erreur lors de l\'ajout à la playlist');
      }
    } catch (err) {
      console.error('Erreur lors de l\'ajout à la playlist:', err);
      setError(err.response?.data?.message || 'Erreur lors de l\'ajout à la playlist');
    } finally {
      setSubmitting(false);
    }
  };

  // Créer une nouvelle playlist et y ajouter la vidéo
  const handleCreatePlaylist = async (e) => {
    e.preventDefault();

    if (!newPlaylistName.trim()) {
      setError('Le nom de la playlist est requis');
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
        setSuccess('Nouvelle playlist créée avec succès!');
        setNewPlaylistName('');
        setNewPlaylistDescription('');
        setCreateMode(false);
        
        // Rafraîchir la liste des playlists
        const updatedPlaylistsResponse = await api.get('/api/playlists/user');
        if (updatedPlaylistsResponse.data.success) {
          setUserPlaylists(updatedPlaylistsResponse.data.data);
        }
        
        // Notifier le composant parent
        if (onSuccess) {
          setTimeout(() => {
            onSuccess();
          }, 1500);
        }
      } else {
        setError(response.data.message || 'Erreur lors de la création de la playlist');
      }
    } catch (err) {
      console.error('Erreur lors de la création de la playlist:', err);
      setError(err.response?.data?.message || 'Erreur lors de la création de la playlist');
    } finally {
      setSubmitting(false);
    }
  };

  // Vérifier si la vidéo est déjà dans une playlist
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
          <h3>{createMode ? 'Créer une nouvelle playlist' : 'Ajouter à une playlist'}</h3>
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
                <p>Chargement de vos playlists...</p>
              </div>
            ) : (
              <>
                {userPlaylists.length > 0 ? (
                  <div className={styles.playlistsList}>
                    {userPlaylists.map(playlist => (
                      <div key={playlist._id} className={styles.playlistItem}>
                        <div className={styles.playlistInfo}>
                          <h4>{playlist.nom}</h4>
                          <span>{playlist.nb_videos || playlist.videos?.length || 0} vidéos</span>
                        </div>
                        <button 
                          className={`${styles.addButton} ${isVideoInPlaylist(playlist) ? styles.addedButton : ''}`}
                          onClick={() => handleAddToPlaylist(playlist._id)}
                          disabled={isVideoInPlaylist(playlist) || submitting}
                        >
                          {isVideoInPlaylist(playlist) ? (
                            <><FontAwesomeIcon icon={faCheck} /> Ajoutée</>
                          ) : submitting ? (
                            <FontAwesomeIcon icon={faSpinner} spin />
                          ) : (
                            <><FontAwesomeIcon icon={faPlus} /> Ajouter</>
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.emptyMessage}>
                    <p>Vous n'avez pas encore de playlist.</p>
                  </div>
                )}

                <button 
                  className={styles.createButton}
                  onClick={() => setCreateMode(true)}
                >
                  <FontAwesomeIcon icon={faPlus} /> Créer une nouvelle playlist
                </button>
              </>
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
                placeholder="Ma playlist awesome"
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
                placeholder="Une description de votre playlist..."
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

export default PlaylistModal;