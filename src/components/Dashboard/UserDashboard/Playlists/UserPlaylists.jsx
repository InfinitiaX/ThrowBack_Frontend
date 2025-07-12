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

  // Charger les playlists de l'utilisateur et les playlists populaires
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les playlists de l'utilisateur
        const userPlaylistsData = await playlistAPI.getUserPlaylists();
        setPlaylists(userPlaylistsData);
        
        // Charger les playlists populaires
        const popularPlaylistsData = await playlistAPI.getPopularPlaylists(5);
        setPopularPlaylists(popularPlaylistsData);
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des playlists:', err);
        setError('Impossible de charger les playlists. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchData();
    
    // Nettoyer les dropdowns lorsqu'on clique en dehors
    const handleClickOutside = () => setActiveDropdown(null);
    document.addEventListener('click', handleClickOutside);
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  // Gérer la création d'une nouvelle playlist
  const handleCreatePlaylist = () => {
    navigate('/dashboard/playlists/new');
  };

  // Gérer la navigation vers une playlist
  const handlePlaylistClick = (playlistId) => {
    navigate(`/dashboard/playlists/${playlistId}`);
  };

  // Gérer la lecture d'une playlist
  const handlePlayPlaylist = (e, playlistId) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlistId}/play`);
  };

  // Afficher le menu contextuel d'une playlist
  const handleToggleDropdown = (e, index) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === index ? null : index);
  };

  // Supprimer une playlist
  const handleDeletePlaylist = async () => {
    try {
      await playlistAPI.deletePlaylist(selectedPlaylist._id);
      setPlaylists(playlists.filter(p => p._id !== selectedPlaylist._id));
      setShowConfirmDelete(false);
      setSelectedPlaylist(null);
      
      // Afficher une notification de succès
      setToastMessage('Playlist supprimée avec succès');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Erreur lors de la suppression de la playlist:', err);
      setToastMessage('Erreur lors de la suppression de la playlist');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Modifier une playlist
  const handleEditPlaylist = (e, playlist) => {
    e.stopPropagation();
    navigate(`/dashboard/playlists/${playlist._id}/edit`);
    setActiveDropdown(null);
  };

  // Ajouter/retirer des favoris
  const handleToggleFavorite = async (e, playlist) => {
    e.stopPropagation();
    try {
      const response = await playlistAPI.toggleFavorite(playlist._id);
      
      // Mettre à jour l'état local
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
        'Playlist ajoutée aux favoris' : 
        'Playlist retirée des favoris');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Erreur lors de la gestion des favoris:', err);
      setToastMessage('Erreur lors de la gestion des favoris');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Partager une playlist
  const handleSharePlaylist = (e, playlist) => {
    e.stopPropagation();
    // Copier le lien dans le presse-papier
    const shareUrl = `${window.location.origin}/dashboard/playlists/${playlist._id}`;
    navigator.clipboard.writeText(shareUrl)
      .then(() => {
        setToastMessage('Lien de la playlist copié dans le presse-papier');
        setToastType('success');
        setShowToast(true);
      })
      .catch(err => {
        console.error('Erreur lors de la copie du lien:', err);
        setToastMessage('Erreur lors de la copie du lien');
        setToastType('error');
        setShowToast(true);
      });
    
    setActiveDropdown(null);
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

  // Formater le nombre de lectures
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
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playlistsContainer}>
      {/* En-tête avec titre et bouton de création */}
      <div className={styles.header}>
        <h1 className={styles.title}>Vos playlists</h1>
        <button 
          className={styles.createButton}
          onClick={handleCreatePlaylist}
        >
          <FontAwesomeIcon icon={faPlus} />
          <span>Créer une playlist</span>
        </button>
      </div>

      {/* Playlists de l'utilisateur */}
      <section className={styles.userPlaylistsSection}>
        <h2 className={styles.sectionTitle}>Mes playlists</h2>
        
        {playlists.length === 0 ? (
          <EmptyState 
            icon={faMusic}
            title="Aucune playlist"
            message="Vous n'avez pas encore créé de playlist. Créez-en une pour commencer à organiser vos vidéos préférées."
            actionText="Créer une playlist"
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
                      aria-label="Lire la playlist"
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
                    {playlist.description || "Aucune description"}
                  </p>
                  
                  <div className={styles.playlistStats}>
                    <span className={styles.videoCount}>
                      <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} vidéos
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
                    aria-label={playlist.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                  >
                    <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
                  </button>
                  
                  <div className={styles.dropdownContainer}>
                    <button 
                      className={styles.actionButton}
                      onClick={(e) => handleToggleDropdown(e, index)}
                      aria-label="Plus d'options"
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
                          <span>Modifier</span>
                        </button>
                        
                        <button 
                          className={styles.dropdownItem}
                          onClick={(e) => handleSharePlaylist(e, playlist)}
                        >
                          <FontAwesomeIcon icon={faShare} />
                          <span>Partager</span>
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
                          <span>Supprimer</span>
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

      {/* Playlists populaires */}
      {popularPlaylists.length > 0 && (
        <section className={styles.popularPlaylistsSection}>
          <h2 className={styles.sectionTitle}>Playlists populaires</h2>
          
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
                      aria-label="Lire la playlist"
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
                    {playlist.description || "Aucune description"}
                  </p>
                  
                  <div className={styles.playlistStats}>
                    <span className={styles.videoCount}>
                      <FontAwesomeIcon icon={faMusic} /> {playlist.nb_videos || 0} vidéos
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
                      alt={`${playlist.proprietaire?.prenom || 'Utilisateur'} ${playlist.proprietaire?.nom || ''}`}
                      className={styles.creatorAvatar}
                    />
                    <span className={styles.creatorName}>
                      {`${playlist.proprietaire?.prenom || 'Utilisateur'} ${playlist.proprietaire?.nom || ''}`}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Supprimer la playlist"
        message={`Êtes-vous sûr de vouloir supprimer la playlist "${selectedPlaylist?.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeletePlaylist}
        onCancel={() => {
          setShowConfirmDelete(false);
          setSelectedPlaylist(null);
        }}
      />

      {/* Toast pour les notifications */}
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