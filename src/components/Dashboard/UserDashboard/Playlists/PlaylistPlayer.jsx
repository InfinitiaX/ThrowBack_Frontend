// components/Dashboard/UserDashboard/Playlists/PlaylistPlayer.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward, faRandom, faRedo,
  faVolumeUp, faVolumeMute, faExpand, faCompress, faArrowLeft, 
  faList, faHeart, faHeartBroken, faShare, faPlus, faMinus
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Toast from '../../../Common/Toast';
import styles from './PlaylistPlayer.module.css';

const PlaylistPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États pour les données
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // États pour le lecteur
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(true);
  
  // États pour l'interface
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // Références
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // Charger les détails de la playlist
  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        
        if (!data) {
          setError('Playlist introuvable');
          setLoading(false);
          return;
        }
        
        if (data.videos.length === 0) {
          setError('Cette playlist ne contient aucune vidéo');
          setLoading(false);
          return;
        }
        
        // Trier les vidéos par ordre
        const sortedVideos = [...data.videos].sort((a, b) => a.ordre - b.ordre);
        data.videos = sortedVideos;
        
        setPlaylist(data);
        setLoading(false);
        
        // Commencer la lecture automatiquement
        setTimeout(() => {
          setIsPlaying(true);
        }, 1000);
      } catch (err) {
        console.error('Erreur lors du chargement de la playlist:', err);
        setError('Une erreur est survenue lors du chargement de la playlist');
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
  }, [currentVideoIndex, playlist, isPlaying]);
  
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
  
  // Gestionnaire d'événements pour le mode plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(
        document.fullscreenElement || 
        document.webkitFullscreenElement || 
        document.mozFullScreenElement || 
        document.msFullscreenElement
      );
    };
    
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);
  
  // Gérer le volume et le mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
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
  
  const handleProgressClick = (e) => {
    if (progressBarRef.current && videoRef.current) {
      const rect = progressBarRef.current.getBoundingClientRect();
      const percentage = (e.clientX - rect.left) / rect.width;
      const newTime = percentage * videoRef.current.duration;
      setProgress(newTime);
      videoRef.current.currentTime = newTime;
    }
  };
  
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };
  
  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
  };
  
  const handleShuffle = () => {
    setShuffle(!shuffle);
  };
  
  const handleRepeat = () => {
    setRepeat(!repeat);
  };
  
  const handleFullscreenToggle = () => {
    if (!isFullscreen) {
      // Entrer en mode plein écran
      if (playerContainerRef.current.requestFullscreen) {
        playerContainerRef.current.requestFullscreen();
      } else if (playerContainerRef.current.webkitRequestFullscreen) {
        playerContainerRef.current.webkitRequestFullscreen();
      } else if (playerContainerRef.current.mozRequestFullScreen) {
        playerContainerRef.current.mozRequestFullScreen();
      } else if (playerContainerRef.current.msRequestFullscreen) {
        playerContainerRef.current.msRequestFullscreen();
      }
    } else {
      // Quitter le mode plein écran
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };
  
  const handleTogglePlaylist = () => {
    setShowPlaylist(!showPlaylist);
  };
  
  // Gestion des favoris
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
  
  // Partager la playlist
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
  };
  
  // Retour à la page de détail de la playlist
  const handleBack = () => {
    navigate(`/dashboard/playlists/${id}`);
  };
  
  // Lecture d'une vidéo spécifique
  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.backButton}
          onClick={handleBack}
        >
          Retour à la playlist
        </button>
      </div>
    );
  }
  
  if (!playlist || playlist.videos.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Playlist vide ou introuvable</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/dashboard/playlists')}
        >
          Retour aux playlists
        </button>
      </div>
    );
  }
  
  const currentVideo = playlist.videos[currentVideoIndex].video_id;
  
  return (
    <div 
      className={`${styles.playerContainer} ${isFullscreen ? styles.fullscreen : ''}`}
      ref={playerContainerRef}
    >
      <div className={styles.playerContent}>
        {/* Section lecteur vidéo */}
        <div className={`${styles.videoSection} ${!showPlaylist && styles.fullWidth}`}>
          {/* En-tête avec titre et actions */}
          <div className={`${styles.playerHeader} ${isPlaying && styles.hideControls}`}>
            <button 
              className={styles.backButton}
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Retour</span>
            </button>
            
            <div className={styles.headerInfo}>
              <h1 className={styles.playlistTitle}>{playlist.nom}</h1>
              <p className={styles.playlistOwner}>
                Par {playlist.proprietaire.prenom} {playlist.proprietaire.nom}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <button 
                className={styles.actionButton}
                onClick={handleToggleFavorite}
                title={playlist.isFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={handleSharePlaylist}
                title="Partager la playlist"
              >
                <FontAwesomeIcon icon={faShare} />
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={handleTogglePlaylist}
                title={showPlaylist ? "Masquer la liste" : "Afficher la liste"}
              >
                <FontAwesomeIcon icon={showPlaylist ? faMinus : faList} />
              </button>
            </div>
          </div>
          
          {/* Lecteur vidéo */}
          <div 
            className={`${styles.videoWrapper} ${isPlaying && styles.hideControls}`}
            onClick={handlePlayPause}
          >
            <video 
              ref={videoRef}
              className={styles.videoPlayer}
              src={currentVideo?.youtubeUrl}
              poster={currentVideo?.thumbnail}
            />
            
            {!isPlaying && (
              <div className={styles.playOverlay}>
                <button className={styles.bigPlayButton}>
                  <FontAwesomeIcon icon={faPlay} />
                </button>
              </div>
            )}
          </div>
          
          {/* Informations sur la vidéo en cours */}
          <div className={`${styles.videoInfo} ${isPlaying && styles.hideControls}`}>
            <h2 className={styles.videoTitle}>
              {currentVideo?.titre}
            </h2>
            <p className={styles.videoArtist}>
              {currentVideo?.artiste}
            </p>
          </div>
          
          {/* Contrôles du lecteur */}
          <div className={`${styles.controls} ${isPlaying && styles.hideControls}`}>
            {/* Barre de progression */}
            <div 
              className={styles.progressContainer}
              onClick={handleProgressClick}
              ref={progressBarRef}
            >
              <div className={styles.progressBackground}>
                <div 
                  className={styles.progressFill}
                  style={{ width: `${(progress / duration) * 100}%` }}
                ></div>
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={progress}
                onChange={handleProgressChange}
                className={styles.progressInput}
              />
              <div className={styles.timeDisplay}>
                <span className={styles.currentTime}>{formatTime(progress)}</span>
                <span className={styles.duration}>{formatTime(duration)}</span>
              </div>
            </div>
            
            {/* Boutons de contrôle */}
            <div className={styles.controlButtons}>
              <div className={styles.primaryControls}>
                <button 
                  className={`${styles.controlButton} ${shuffle ? styles.active : ''}`}
                  onClick={handleShuffle}
                  title="Lecture aléatoire"
                >
                  <FontAwesomeIcon icon={faRandom} />
                </button>
                
                <button 
                  className={styles.controlButton}
                  onClick={handlePrevious}
                  disabled={currentVideoIndex === 0}
                  title="Précédent"
                >
                  <FontAwesomeIcon icon={faStepBackward} />
                </button>
                
                <button 
                  className={styles.playPauseButton}
                  onClick={handlePlayPause}
                  title={isPlaying ? "Pause" : "Lecture"}
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
                
                <button 
                  className={styles.controlButton}
                  onClick={handleNext}
                  disabled={currentVideoIndex === playlist.videos.length - 1}
                  title="Suivant"
                >
                  <FontAwesomeIcon icon={faStepForward} />
                </button>
                
                <button 
                  className={`${styles.controlButton} ${repeat ? styles.active : ''}`}
                  onClick={handleRepeat}
                  title="Répéter"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
              
              <div className={styles.secondaryControls}>
                <div className={styles.volumeControl}>
                  <button 
                    className={styles.controlButton}
                    onClick={handleMuteToggle}
                    title={isMuted ? "Activer le son" : "Couper le son"}
                  >
                    <FontAwesomeIcon icon={isMuted ? faVolumeMute : faVolumeUp} />
                  </button>
                  
                  <div className={styles.volumeSliderContainer}>
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
                
                <button 
                  className={styles.controlButton}
                  onClick={handleFullscreenToggle}
                  title={isFullscreen ? "Quitter le plein écran" : "Plein écran"}
                >
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section liste des vidéos */}
        {showPlaylist && (
          <div className={styles.playlistSection}>
            <div className={styles.playlistHeader}>
              <h3 className={styles.playlistListTitle}>
                Vidéos dans la playlist ({playlist.videos.length})
              </h3>
            </div>
            
            <ul className={styles.videosList}>
              {playlist.videos.map((videoItem, index) => {
                const video = videoItem.video_id;
                const isCurrentVideo = index === currentVideoIndex;
                
                return (
                  <li 
                    key={video._id}
                    className={`${styles.videoItem} ${isCurrentVideo ? styles.current : ''}`}
                    onClick={() => handlePlayVideo(index)}
                  >
                    <div className={styles.videoItemNumber}>{index + 1}</div>
                    
                    <div className={styles.videoItemThumbnail}>
                      <img 
                        src={video.thumbnail || "https://via.placeholder.com/120x68?text=Video"}
                        alt={video.titre}
                      />
                      {isCurrentVideo && isPlaying && (
                        <div className={styles.nowPlaying}>
                          <span className={styles.playingIndicator}></span>
                        </div>
                      )}
                    </div>
                    
                    <div className={styles.videoItemInfo}>
                      <h4 className={styles.videoItemTitle}>{video.titre}</h4>
                      <p className={styles.videoItemArtist}>{video.artiste}</p>
                    </div>
                    
                    <div className={styles.videoItemDuration}>
                      {video.duree ? formatTime(video.duree) : '--:--'}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

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

export default PlaylistPlayer;