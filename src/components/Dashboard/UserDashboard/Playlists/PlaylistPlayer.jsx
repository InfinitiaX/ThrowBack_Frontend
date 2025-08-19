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
  
  // Data states
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Player states
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
  
  // Interface states
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  
  // References
  const videoRef = useRef(null);
  const playerContainerRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // Load playlist details
  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        
        if (!data) {
          setError('Playlist not found');
          setLoading(false);
          return;
        }
        
        if (data.videos.length === 0) {
          setError('This playlist does not contain any videos');
          setLoading(false);
          return;
        }
        
        // Sort videos by order
        const sortedVideos = [...data.videos].sort((a, b) => a.ordre - b.ordre);
        data.videos = sortedVideos;
        
        setPlaylist(data);
        setLoading(false);
        
        // Start playback automatically
        setTimeout(() => {
          setIsPlaying(true);
        }, 1000);
      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('An error occurred while loading the playlist');
        setLoading(false);
      }
    };

    fetchPlaylistDetails();
  }, [id]);
  
  // Update video player when current video changes
  useEffect(() => {
    if (playlist?.videos && playlist.videos.length > 0 && videoRef.current) {
      // Reset player
      videoRef.current.pause();
      setProgress(0);
      
      // Load new video
      const currentVideo = playlist.videos[currentVideoIndex].video_id;
      videoRef.current.src = currentVideo.youtubeUrl;
      
      // Start playback if needed
      if (isPlaying) {
        videoRef.current.play().catch(err => {
          console.error('Error during automatic playback:', err);
          setIsPlaying(false);
        });
      }
    }
  }, [currentVideoIndex, playlist, isPlaying]);
  
  // Event handlers for video player
  useEffect(() => {
    const videoElement = videoRef.current;
    
    if (videoElement) {
      const handleTimeUpdate = () => {
        setProgress(videoElement.currentTime);
        setDuration(videoElement.duration);
      };
      
      const handleEnded = () => {
        if (repeat) {
          // Replay the same video
          videoElement.currentTime = 0;
          videoElement.play().catch(err => {
            console.error('Error during repeated playback:', err);
          });
        } else if (shuffle) {
          // Move to a random video
          const randomIndex = Math.floor(Math.random() * playlist.videos.length);
          setCurrentVideoIndex(randomIndex);
        } else if (currentVideoIndex < playlist.videos.length - 1) {
          // Move to next video
          setCurrentVideoIndex(currentVideoIndex + 1);
        } else {
          // End of playlist
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
  
  // Event handlers for fullscreen mode
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
  
  // Handle volume and mute
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume / 100;
      videoRef.current.muted = isMuted;
    }
  }, [volume, isMuted]);
  
  // Format time (seconds -> MM:SS)
  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds === 0) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Player controls
  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(err => {
          console.error('Playback error:', err);
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
      // Enter fullscreen mode
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
      // Exit fullscreen mode
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
  
  // Favorites management
  const handleToggleFavorite = async () => {
    try {
      const response = await playlistAPI.toggleFavorite(id);
      
      // Update local state
      setPlaylist({
        ...playlist,
        isFavorite: response.isFavorite,
        nb_favoris: response.isFavorite ? playlist.nb_favoris + 1 : playlist.nb_favoris - 1
      });
      
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
  
  // Share playlist
  const handleSharePlaylist = () => {
    // Copy link to clipboard
    const shareUrl = `${window.location.origin}/dashboard/playlists/${id}`;
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
  };
  
  // Return to playlist details page
  const handleBack = () => {
    navigate(`/dashboard/playlists/${id}`);
  };
  
  // Play a specific video
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
          Back to playlist
        </button>
      </div>
    );
  }
  
  if (!playlist || playlist.videos.length === 0) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Empty or not found playlist</p>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/dashboard/playlists')}
        >
          Back to playlists
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
        {/* Video player section */}
        <div className={`${styles.videoSection} ${!showPlaylist && styles.fullWidth}`}>
          {/* Header with title and actions */}
          <div className={`${styles.playerHeader} ${isPlaying && styles.hideControls}`}>
            <button 
              className={styles.backButton}
              onClick={handleBack}
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Back</span>
            </button>
            
            <div className={styles.headerInfo}>
              <h1 className={styles.playlistTitle}>{playlist.nom}</h1>
              <p className={styles.playlistOwner}>
                By {playlist.proprietaire.prenom} {playlist.proprietaire.nom}
              </p>
            </div>
            
            <div className={styles.headerActions}>
              <button 
                className={styles.actionButton}
                onClick={handleToggleFavorite}
                title={playlist.isFavorite ? "Remove from favorites" : "Add to favorites"}
              >
                <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={handleSharePlaylist}
                title="Share playlist"
              >
                <FontAwesomeIcon icon={faShare} />
              </button>
              
              <button 
                className={styles.actionButton}
                onClick={handleTogglePlaylist}
                title={showPlaylist ? "Hide list" : "Show list"}
              >
                <FontAwesomeIcon icon={showPlaylist ? faMinus : faList} />
              </button>
            </div>
          </div>
          
          {/* Video player */}
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
          
          {/* Current video information */}
          <div className={`${styles.videoInfo} ${isPlaying && styles.hideControls}`}>
            <h2 className={styles.videoTitle}>
              {currentVideo?.titre}
            </h2>
            <p className={styles.videoArtist}>
              {currentVideo?.artiste}
            </p>
          </div>
          
          {/* Player controls */}
          <div className={`${styles.controls} ${isPlaying && styles.hideControls}`}>
            {/* Progress bar */}
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
            
            {/* Control buttons */}
            <div className={styles.controlButtons}>
              <div className={styles.primaryControls}>
                <button 
                  className={`${styles.controlButton} ${shuffle ? styles.active : ''}`}
                  onClick={handleShuffle}
                  title="Shuffle"
                >
                  <FontAwesomeIcon icon={faRandom} />
                </button>
                
                <button 
                  className={styles.controlButton}
                  onClick={handlePrevious}
                  disabled={currentVideoIndex === 0}
                  title="Previous"
                >
                  <FontAwesomeIcon icon={faStepBackward} />
                </button>
                
                <button 
                  className={styles.playPauseButton}
                  onClick={handlePlayPause}
                  title={isPlaying ? "Pause" : "Play"}
                >
                  <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                </button>
                
                <button 
                  className={styles.controlButton}
                  onClick={handleNext}
                  disabled={currentVideoIndex === playlist.videos.length - 1}
                  title="Next"
                >
                  <FontAwesomeIcon icon={faStepForward} />
                </button>
                
                <button 
                  className={`${styles.controlButton} ${repeat ? styles.active : ''}`}
                  onClick={handleRepeat}
                  title="Repeat"
                >
                  <FontAwesomeIcon icon={faRedo} />
                </button>
              </div>
              
              <div className={styles.secondaryControls}>
                <div className={styles.volumeControl}>
                  <button 
                    className={styles.controlButton}
                    onClick={handleMuteToggle}
                    title={isMuted ? "Unmute" : "Mute"}
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
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  <FontAwesomeIcon icon={isFullscreen ? faCompress : faExpand} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Video list section */}
        {showPlaylist && (
          <div className={styles.playlistSection}>
            <div className={styles.playlistHeader}>
              <h3 className={styles.playlistListTitle}>
                Videos in playlist ({playlist.videos.length})
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

export default PlaylistPlayer;