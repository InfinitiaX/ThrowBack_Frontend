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
  
  // Data states
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Video player states
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // Interface states
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // References
  const videoRef = useRef(null);
  const progressBarRef = useRef(null);
  
  // Load playlist details
  useEffect(() => {
    const fetchPlaylistDetails = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        setPlaylist(data);
        setLoading(false);
      } catch (err) {
        console.error('Error loading playlist:', err);
        setError('Unable to load playlist. Please try again later.');
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
  }, [currentVideoIndex, playlist]);
  
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
  
  // Playlist action handlers
  const handleBackClick = () => {
    navigate('/dashboard/playlists');
  };
  
  const handleEditPlaylist = () => {
    navigate(`/dashboard/playlists/${id}/edit`);
    setShowDropdown(false);
  };
  
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
    
    setShowDropdown(false);
  };
  
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
  
  const handleDeletePlaylist = async () => {
    try {
      await playlistAPI.deletePlaylist(id);
      navigate('/dashboard/playlists');
      
      // Notification (will show on playlists page)
      setToastMessage('Playlist deleted successfully');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Error deleting playlist:', err);
      setToastMessage('Error deleting playlist');
      setToastType('error');
      setShowToast(true);
      setShowConfirmDelete(false);
    }
  };
  
  // Video management
  const handlePlayVideo = (index) => {
    setCurrentVideoIndex(index);
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.play().catch(err => {
        console.error('Playback error:', err);
        setIsPlaying(false);
      });
    }
  };
  
  const handleRemoveVideo = async (videoId) => {
    try {
      await playlistAPI.removeVideoFromPlaylist(id, videoId);
      
      // Update local state
      setPlaylist({
        ...playlist,
        videos: playlist.videos.filter(v => v.video_id._id !== videoId)
      });
      
      setToastMessage('Video removed from playlist');
      setToastType('success');
      setShowToast(true);
    } catch (err) {
      console.error('Error removing video:', err);
      setToastMessage('Error removing video');
      setToastType('error');
      setShowToast(true);
    }
  };
  
  // Drag-and-drop handler for playlist reordering
  const handleDragEnd = async (result) => {
    setIsDragging(false);
    
    if (!result.destination) return;
    
    const items = Array.from(playlist.videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Update order locally
    setPlaylist({
      ...playlist,
      videos: items.map((item, index) => ({ ...item, ordre: index + 1 }))
    });
    
    // Update order on server
    try {
      const videoOrders = items.map((item, index) => ({
        videoId: item.video_id._id,
        ordre: index + 1
      }));
      
      await playlistAPI.reorderPlaylist(id, videoOrders);
    } catch (err) {
      console.error('Error reordering playlist:', err);
      setToastMessage('Error reordering playlist');
      setToastType('error');
      setShowToast(true);
    }
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
  
  // Format date (ISO -> DD/MM/YYYY)
  const formatDate = (isoDate) => {
    const date = new Date(isoDate);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };
  
  // Format view count
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
          Try again
        </button>
      </div>
    );
  }
  
  if (!playlist) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>Playlist not found</p>
        <button 
          className={styles.retryButton}
          onClick={handleBackClick}
        >
          Back to playlists
        </button>
      </div>
    );
  }
  
  const isOwner = user && playlist.proprietaire && playlist.proprietaire._id === user._id;
  const currentVideo = playlist.videos[currentVideoIndex]?.video_id;
  
  return (
    <div className={styles.playlistDetailContainer}>
      {/* Header with back button and actions */}
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={handleBackClick}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
          <span>Back to playlists</span>
        </button>
        
        <div className={styles.playlistActions}>
          <button 
            className={styles.actionButton}
            onClick={handleToggleFavorite}
            aria-label={playlist.isFavorite ? "Remove from favorites" : "Add to favorites"}
          >
            <FontAwesomeIcon icon={playlist.isFavorite ? faHeartBroken : faHeart} />
          </button>
          
          <button 
            className={styles.actionButton}
            onClick={handleSharePlaylist}
            aria-label="Share playlist"
          >
            <FontAwesomeIcon icon={faShare} />
          </button>
          
          {isOwner && (
            <div className={styles.dropdownContainer}>
              <button 
                className={styles.actionButton}
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="More options"
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
                    <span>Edit</span>
                  </button>
                  
                  <button 
                    className={styles.dropdownItem}
                    onClick={() => setShowConfirmDelete(true)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Playlist information */}
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
              <span>{playlist.visibilite === 'PUBLIC' ? 'Public' : playlist.visibilite === 'PRIVE' ? 'Private' : 'Friends only'}</span>
            </div>
          </div>
          
          <h1 className={styles.playlistTitle}>{playlist.nom}</h1>
          
          <p className={styles.playlistDescription}>
            {playlist.description || "No description"}
          </p>
          
          <div className={styles.playlistStats}>
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faMusic} />
              <span>{playlist.videos.length} videos</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faEye} />
              <span>{formatCount(playlist.nb_lectures)} views</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faHeart} />
              <span>{formatCount(playlist.nb_favoris)} favorites</span>
            </div>
            
            <div className={styles.statItem}>
              <FontAwesomeIcon icon={faCalendarAlt} />
              <span>Created on {formatDate(playlist.creation_date)}</span>
            </div>
          </div>
          
          <div className={styles.creatorInfo}>
            <div className={styles.creatorProfile}>
              <img 
                src={playlist.proprietaire?.photo_profil || "https://via.placeholder.com/40"}
                alt={`${playlist.proprietaire?.prenom || 'User'} ${playlist.proprietaire?.nom || ''}`}
                className={styles.creatorAvatar}
              />
              <span className={styles.creatorName}>
                {`${playlist.proprietaire?.prenom || 'User'} ${playlist.proprietaire?.nom || ''}`}
              </span>
            </div>
            
            <button 
              className={styles.playAllButton}
              onClick={() => handlePlayVideo(0)}
            >
              <FontAwesomeIcon icon={faPlay} />
              <span>Play all</span>
            </button>
          </div>
        </div>
      </div>

      {/* Video player and list */}
      <div className={styles.playerSection}>
        {/* Video player */}
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
                    aria-label="Shuffle"
                  >
                    <FontAwesomeIcon icon={faRandom} />
                  </button>
                  
                  <button 
                    className={styles.controlButton}
                    onClick={handlePrevious}
                    disabled={currentVideoIndex === 0}
                    aria-label="Previous"
                  >
                    <FontAwesomeIcon icon={faStepBackward} />
                  </button>
                  
                  <button 
                    className={styles.playPauseButton}
                    onClick={handlePlayPause}
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    <FontAwesomeIcon icon={isPlaying ? faPause : faPlay} />
                  </button>
                  
                  <button 
                    className={styles.controlButton}
                    onClick={handleNext}
                    disabled={currentVideoIndex === playlist.videos.length - 1}
                    aria-label="Next"
                  >
                    <FontAwesomeIcon icon={faStepForward} />
                  </button>
                  
                  <button 
                    className={`${styles.controlButton} ${repeat ? styles.active : ''}`}
                    onClick={handleRepeat}
                    aria-label="Repeat"
                  >
                    <FontAwesomeIcon icon={faRedo} />
                  </button>
                </div>
                
                <div className={styles.volumeContainer}>
                  <button 
                    className={styles.muteButton}
                    onClick={handleMuteToggle}
                    aria-label={isMuted ? "Unmute" : "Mute"}
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
                title="No videos"
                message="This playlist doesn't contain any videos. Add videos to start enjoying your playlist."
                actionText={isOwner ? "Add videos" : null}
                onAction={isOwner ? () => setShowAddVideoModal(true) : null}
              />
            </div>
          )}
        </div>

        {/* Video list */}
        <div className={styles.playlistVideosContainer}>
          <div className={styles.playlistVideosHeader}>
            <h2 className={styles.videosTitle}>Videos in this playlist</h2>
            
            {isOwner && (
              <button 
                className={styles.addVideoButton}
                onClick={() => setShowAddVideoModal(true)}
              >
                <FontAwesomeIcon icon={faPlus} />
                <span>Add videos</span>
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
                                    aria-label="Remove from playlist"
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
              This playlist doesn't contain any videos.
            </p>
          )}
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete playlist"
        message={`Are you sure you want to delete the playlist "${playlist.nom}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleDeletePlaylist}
        onCancel={() => setShowConfirmDelete(false)}
      />

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

export default UserPlaylistDetail;