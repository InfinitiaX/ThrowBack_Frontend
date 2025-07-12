// components/Dashboard/UserDashboard/Playlists/PlaylistDetail.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward, faRandom, faRedo,
  faHeart, faHeartBroken, faShare, faEllipsisV, faEdit, faTrash,
  faArrowLeft, faPlus, faGlobe, faLock, faUserFriends, faGripLines,
  faEye, faCalendarAlt, faMusic, faVolumeUp, faVolumeMute
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { videoAPI } from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import EmptyState from '../../../Common/EmptyState';
import ConfirmModal from '../../../Common/ConfirmModal';
import Toast from '../../../Common/Toast';
import styles from './PlaylistDetail.module.css';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

const UserPlaylistDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // États pour les données
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour le lecteur vidéo
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // États pour l'interface
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // Références
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // Charger les détails de la playlist
  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        setPlaylist(data);
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement de la playlist:', err);
        setError('Impossible de charger la playlist. Veuillez réessayer plus tard.');
        setLoading(false);
      }
    };

    fetchPlaylistDetails();
  }, [id]);
  
  // Mettre à jour le lecteur vidéo lorsque la vidéo actuelle change
  useEffect(() => {
    if (playlist?.videos && playlist.videos.length > 0 && videoRef.current) {
      // Réinitialiser le lecteur
      videoRef.current.pause();
      setProgress(0);
      
      // Charger la nouvelle vidéo
      const currentVideo = playlist.videos[currentVideoIndex].video_id;
      videoRef.current.src = currentVideo.youtubeUrl;
      
      // Commencer la lecture si nécessaire
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Erreur lors de la lecture automatique:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentVideoIndex, playlist]);
  
  // Gestionnaire d'événements pour le lecteur vidéo
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const handleTimeUpdate = () => {
        setProgress(videoElement.currentTime);
        setDuration(videoElement.duration);
      };
      
      const handleEnded = () => {
        if (repeat) {
          // Rejouer la même vidéo
          videoElement.currentTime = 0;
          videoElement.play().catch(err => {
            console.error('Erreur lors de la lecture répétée:', err);
          });
        } else if (shuffle) {
          // Passer à une vidéo aléatoire
          const randomIndex = Math.floor(Math.random() * playlist.videos.length);
          setCurrentVideoIndex(randomIndex);
        } else if (currentVideoIndex < playlist.videos.length - 1) {
          // Passer à la vidéo suivante
          setCurrentVideoIndex(currentVideoIndex + 1);
        } else {
          // Fin de la playlist
          setIsPlaying(false);
        }
      };
      
      videoElement.addEventListener('timeupdate', handleTimeUpdate);
      videoElement.addEventListener('ended', handleEnded);
      
      return () => {
        videoElement.removeEventListener('timeupdate', handleTimeUpdate);
        videoElement.removeEventListener('ended', handleEnded);
      };
    }
  }, [currentVideoIndex, playlist, repeat, shuffle]);
  
  // Formater le temps (secondes -> MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Contrôles du lecteur
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Erreur lors de la lecture:', err);
        });
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(currentVideoIndex - 1);
    }
  };
  
  const handleNext = () => {
    if (currentVideoIndex < playlist.videos.length - 1) {
      setCurrentVideoIndex(currentVideoIndex + 1);
    }
  };
  
  const handleProgressChange = (e) => {
    const newTime = parseFloat(e.target.value);
    setProgress(newTime);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume / 100;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const handleMuteToggle = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleShuffle = () => {
    setShuffle(!shuffle);
  };
  
  const handleRepeat = () => {
    setRepeat(!repeat);
  };
  
  // Gestion des actions sur la playlist
  const handleBackClick = () => {
    navigate('/dashboard/playlists');
  };
  
  const handleEditPlaylist = () => {
    navigate(`/dashboard/playlists/${id}/edit`);
    setShowDropdown(false);
  };
  
  const handleSharePlaylist = () => {
    // Copier le lien dans le presse-papier
    const shareUrl = `${window.location.origin}/dashboard/playlists/${id}`;
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
    
    setShowDropdown(false);
  };
  
  const handleToggleFavorite = async () => {
    try {
      const response = await playlistAPI.toggleFavorite(id);
      
      // Mettre à jour l'état local
      setPlaylist({
        ...playlist,
        isFavorite: response.isFavorite,
        nb_favoris: response.isFavorite ? playlist.nb_favoris + 1 : playlist.nb_favoris - 1
      });
      
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
  
  const handleDeletePlaylist = async () => {
    try {
      await playlistAPI.deletePlaylist(id);
      navigate('/dashboard/playlists');
      
      // Notification (s'affichera sur la page des playlists)
      setToastMessage('Playlist supprimée avec succès');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Erreur lors de la suppression de la playlist:', err);
      setToastMessage('Erreur lors de la suppression de la playlist');
      setToastType('error');
      setShowToast(true);
      setShowConfirmDelete(false);
    }
  };
  
  // Gestion des vidéos dans la playlist
  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Erreur lors de la lecture:', err);
        setIsPlaying(false);
      });
    }
  };
  
  const handleRemoveVideo = async (videoId) => {
    try {
      await playlistAPI.removeVideoFromPlaylist(id, videoId);
      
      // Mettre à jour l'état local
      setPlaylist({
        ...playlist,
        videos: playlist.videos.filter(v => v.video_id._id !== videoId)
      });
      
      setToastMessage('Vidéo supprimée de la playlist');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Erreur lors de la suppression de la vidéo:', err);
      setToastMessage('Erreur lors de la suppression de la vidéo');
      setToastType('error');
      setShowToast(true);
    }
  };
  
  // Gestion du glisser-déposer pour réorganiser la playlist
  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(playlist.videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Mettre à jour l'ordre localement
    setPlaylist({
      ...playlist,
      videos: items.map((item, index) => ({ ...item, ordre: index + 1 }))
    });
    
    // Mettre à jour l'ordre sur le serveur
    try {
      const videoOrders = items.map((item, index) => ({
        videoId: item.video_id._id,
        ordre: index + 1
      }));
      
      await playlistAPI.reorderPlaylist(id, videoOrders);
    } catch (err) {
      console.error('Erreur lors de la réorganisation de la playlist:', err);
      setToastMessage('Erreur lors de la réorganisation de la playlist');
      setToastType('error');
      setShowToast(true);
    }
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
  
  // Formater la date (ISO -> DD/MM/YYYY)
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
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
  
  if (!playlist) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Playlist introuvable</p>
        <button 
          className={styles.retryButton}
          onClick={handleBackClick}
        >
          Retour aux playlists
        </button>
      </div>
    );
  }
  
  const isOwner = user && playlist.proprietaire && playlist.proprietaire._id === user._id;
  const currentVideo = playlist.videos[currentVideoIndex]?.video_id;
  
  return (
    <div className={styles.playlistDetailContainer}>
      {/* En-tête avec retour et actions */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleBackClick}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Retour aux playlists</span>
        </button>
        
        <div className={styles.playlistActions}>
          <button 
            className={styles.actionButton}
            onClick={handleToggleFavorite}
            aria-label={playlist.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
          >
            <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={handleSharePlaylist}
            aria-label="Partager la playlist"
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
          
          {isOwner && (
            <div className={styles.dropdownContainer}>
              <button 
                className={styles.actionButton}
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Plus d'options"
              >
                <FontAwesomeIcon icon={faEllipsisV} />
              </button>
              
              {showDropdown && (
                <div className={styles.dropdown}>
                  <button 
                    className={styles.dropdownItem}
                    onClick={handleEditPlaylist}
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Modifier</span>
                  </button>
                  
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Supprimer</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Informations sur la playlist */}
      <div className={styles.playlistInfo}>
        <div className={styles.playlistCover}>
          <img 
            src={playlist.image_couverture || "https://via.placeholder.com/300x300?text=Playlist"}
            alt={playlist.nom}
            className={styles.coverImage}
          />
        </div>
        
        <div className={styles.playlistDetails}>
          <div className={styles.playlistMeta}>
            <div className={styles.playlistVisibility}>
              {renderVisibilityIcon(playlist.visibilite)}
              <span>{playlist.visibilite === 'PUBLIC' ? 'Public' : playlist.visibilite === 'PRIVE' ? 'Privé' : 'Amis uniquement'}</span>
            </div>
          </div>
          
          <h1 className={styles.playlistTitle}>{playlist.nom}</h1>
          
          <p className={styles.playlistDescription}>
            {playlist.description || "Aucune description"}
          </p>
          
          <div className={styles.playlistStats}>
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faMusic} />
              <span>{playlist.videos.length} vidéos</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faEye} />
              <span>{formatCount(playlist.nb_lectures)} lectures</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faHeart} />
              <span>{formatCount(playlist.nb_favoris)} favoris</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Créée le {formatDate(playlist.creation_date)}</span>
            </div>
          </div>
          
          <div className={styles.creatorInfo}>
            <div className={styles.creatorProfile}>
              <img 
                src={playlist.proprietaire?.photo_profil || "https://via.placeholder.com/40"}
                alt={`${playlist.proprietaire?.prenom || 'Utilisateur'} ${playlist.proprietaire?.nom || ''}`}
                className={styles.creatorAvatar}
              />
              <span className={styles.creatorName}>
                {`${playlist.proprietaire?.prenom || 'Utilisateur'} ${playlist.proprietaire?.nom || ''}`}
              </span>
            </div>
            
            <button 
              className={styles.playAllButton}
              onClick={() => handlePlayVideo(0)}
            >
              <FontAwesomeIcon icon={faPlay} />
              <span>Lire tout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Lecteur vidéo et liste */}
      <div className={styles.playerSection}>
        {/* Lecteur vidéo */}
        <div className={styles.videoPlayerContainer}>
          {playlist.videos.length > 0 ? (
            <>
              <div className={styles.videoWrapper}>
                <video 
                  ref={videoRef}
                  className={styles.videoPlayer}
                  src={currentVideo?.youtubeUrl}
                  poster={currentVideo?.thumbnail}
                  onClick={handlePlayPause}
                />
                
                <div className={styles.videoOverlay} onClick={handlePlayPause}>
                  {!isPlaying && (
                    <div className={styles.playOverlayButton}>
                      <FontAwesomeIcon icon={faPlay} />
                    </div>
                  )}
                </div>
              </div>
              
              <div className={styles.videoInfo}>
                <h3 className={styles.videoTitle}>
                  {currentVideo?.titre}
                </h3>
                <p className={styles.videoArtist}>
                  {currentVideo?.artiste}
                </p>
              </div>
              
              <div className={styles.playerControls}>
                <div className={styles.progressContainer}>
                  <span className={styles.timeElapsed}>{formatTime(progress)}</span>
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={progress}
                    onChange={handleProgressChange}
                    className={styles.progressBar}
                    ref={progressBarRef}
                  />
                  <span className={styles.timeTotal}>{formatTime(duration)}</span>
                </div>
                
                <div className={styles.controlButtons}>
                  <button 
                    className={`${styles.controlButton} ${shuffle ? styles.active : ''}`}
                    onClick={handleShuffle}
                    aria-label="Lecture aléatoire"
                  >
                    <FontAwesomeIcon icon={faRandom} />
                  </button>
                  
                  <button 
                    className={styles.controlButton}
                    onClick={handlePrevious}
                    disabled={currentVideoIndex === 0}
                    aria-label="Précédent"
                  >
                    <FontAwesomeIcon icon={faStepBackward} />
                  </button>
                  
                  <button 
                    className={styles.playPauseButton}
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pause" : "Lecture"}
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                  </button>
                  
                  <button 
                    className={styles.controlButton}
                    onClick={handleNext}
                    disabled={currentVideoIndex === playlist.videos.length - 1}
                    aria-label="Suivant"
                  >
                    <FontAwesomeIcon icon={faStepForward} />
                  </button>
                  
                  <button 
                    className={`${styles.controlButton} ${repeat ? styles.active : ''}`}
                    onClick={handleRepeat}
                    aria-label="Répéter"
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </button>
                </div>
                
                <div className={styles.volumeContainer}>
                  <button 
                    className={styles.muteButton}
                    onClick={handleMuteToggle}
                    aria-label={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                  </button>
                  
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    className={styles.volumeSlider}
                  />
                </div>
              </div>
            </>
          ) : (
            <div className={styles.emptyPlayerState}>
              <EmptyState 
                icon={faMusic}
                title="Aucune vidéo"
                message="Cette playlist ne contient aucune vidéo. Ajoutez des vidéos pour commencer à profiter de votre playlist."
                actionText={isOwner ? "Ajouter des vidéos" : null}
                onAction={isOwner ? () => setShowAddVideoModal(true) : null}
              />
            </div>
          )}
        </div>

        {/* Liste des vidéos */}
        <div className={styles.playlistVideosContainer}>
          <div className={styles.playlistVideosHeader}>
            <h2 className={styles.videosTitle}>Vidéos dans cette playlist</h2>
            
            {isOwner && (
              <button 
                className={styles.addVideoButton}
                onClick={() => setShowAddVideoModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Ajouter des vidéos</span>
              </button>
            )}
          </div>
          
          {playlist.videos.length > 0 ? (
            <DragDropContext
              onDragStart={() => setIsDragging(true)}
              onDragEnd={handleDragEnd}
            >
              <Droppable droppableId="playlist-videos">
                {(provided) => (
                  <ul 
                    className={styles.videosList}
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                  >
                    {playlist.videos.map((videoItem, index) => {
                      const video = videoItem.video_id;
                      const isCurrentVideo = index === currentVideoIndex;
                      
                      return (
                        <Draggable 
                          key={video._id} 
                          draggableId={video._id} 
                          index={index}
                          isDragDisabled={!isOwner || isDragging}
                        >
                          {(provided) => (
                            <li 
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`${styles.videoItem} ${isCurrentVideo ? styles.currentVideo : ''}`}
                              onClick={() => handlePlayVideo(index)}
                            >
                              <div className={styles.videoItemContent}>
                                <div className={styles.videoIndex}>
                                  {isOwner && (
                                    <div 
                                      className={styles.dragHandle}
                                      {...provided.dragHandleProps}
                                    >
                                      <FontAwesomeIcon icon={faGripLines} />
                                    </div>
                                  )}
                                  <span>{index + 1}</span>
                                </div>
                                
                                <div className={styles.videoThumbnail}>
                                  <img 
                                    src={video.thumbnail || "https://via.placeholder.com/120x68?text=Video"}
                                    alt={video.titre}
                                  />
                                  {isCurrentVideo && isPlaying && <div className={styles.nowPlayingIndicator}></div>}
                                </div>
                                
                                <div className={styles.videoItemInfo}>
                                  <h4 className={styles.videoItemTitle}>{video.titre}</h4>
                                  <p className={styles.videoItemArtist}>{video.artiste}</p>
                                </div>
                                
                                <div className={styles.videoItemDuration}>
                                  {video.duree ? formatTime(video.duree) : '--:--'}
                                </div>
                                
                                {isOwner && (
                                  <button 
                                    className={styles.removeVideoButton}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveVideo(video._id);
                                    }}
                                    aria-label="Supprimer de la playlist"
                                  >
                                    <FontAwesomeIcon icon={faTrash} />
                                  </button>
                                )}
                              </div>
                            </li>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </ul>
                )}
              </Droppable>
            </DragDropContext>
          ) : (
            <p className={styles.emptyListMessage}>
              Cette playlist ne contient aucune vidéo.
            </p>
          )}
        </div>
      </div>

      {/* Modal de confirmation de suppression */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Supprimer la playlist"
        message={`Êtes-vous sûr de vouloir supprimer la playlist "${playlist.nom}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={handleDeletePlaylist}
        onCancel={() => setShowConfirmDelete(false)}
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

export default UserPlaylistDetail;