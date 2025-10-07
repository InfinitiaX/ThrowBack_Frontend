import React, { useState, useEffect } from 'react';
import styles from './LiveThrowback.module.css';

const CompilationBuilder = ({ selectedVideos, onRemoveVideo, onReorderVideos }) => {
  const [totalDuration, setTotalDuration] = useState(0);
  const [draggedVideo, setDraggedVideo] = useState(null);

  // Calculate total duration whenever the list changes
  useEffect(() => {
    const calcTotalDuration = () => {
      let total = 0;
      selectedVideos.forEach(video => {
        const duration = video.duration || '0:00';
        const parts = duration.split(':').map(part => parseInt(part, 10) || 0);
        
        if (parts.length === 3) { // h:m:s
          total += parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) { // m:s
          total += parts[0] * 60 + parts[1];
        } else if (parts.length === 1) { // just seconds
          total += parts[0];
        }
      });
      
      setTotalDuration(total);
    };
    
    calcTotalDuration();
  }, [selectedVideos]);

  // Format total duration as hh:mm:ss
  const formatTotalDuration = () => {
    const hours = Math.floor(totalDuration / 3600);
    const minutes = Math.floor((totalDuration % 3600) / 60);
    const seconds = Math.floor(totalDuration % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Drag and drop handling
  const handleDragStart = (e, index) => {
    setDraggedVideo(index);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      if (e.target && e.target.classList) {
        e.target.classList.add(styles.dragging);
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    if (e.target && e.target.classList) {
      e.target.classList.remove(styles.dragging);
    }
    setDraggedVideo(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedVideo !== null && draggedVideo !== index) {
      onReorderVideos(draggedVideo, index);
      setDraggedVideo(index);
    }
  };

  // Clear all videos
  const clearAllVideos = () => {
    if (selectedVideos.length > 0) {
      if (window.confirm("Are you sure you want to clear the compilation?")) {
        selectedVideos.forEach(v => onRemoveVideo(v.videoId));
      }
    }
  };

  return (
    <div className={styles.compilationContainer}>
      <div className={styles.compilationHeader}>
        <h3>LiveThrowback Compilation</h3>
        <div className={styles.compilationStats}>
          <span className={styles.videoCount}>
            {selectedVideos.length} {selectedVideos.length <= 1 ? 'video' : 'videos'}
          </span>
          <span className={styles.totalDuration}>
            <i className="far fa-clock"></i> {formatTotalDuration()}
          </span>
        </div>
      </div>

      {selectedVideos.length > 0 ? (
        <div className={styles.selectedVideosList}>
          {selectedVideos.map((video, index) => (
            <div 
              key={`${video.videoId}-${index}`} 
              className={styles.selectedVideoItem}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, index)}
            >
              <div className={styles.videoOrderNumber}>{index + 1}</div>
              <div className={styles.selectedVideoThumbnail}>
                <img 
                  src={video.thumbnail || '/images/video-placeholder.jpg'} 
                  alt={video.title}
                  onError={(e) => {
                    e.target.src = '/images/video-placeholder.jpg';
                  }}
                />
                <span className={styles.selectedVideoDuration}>
                  {video.duration || '0:00'}
                </span>
              </div>
              <div className={styles.selectedVideoInfo}>
                <h4 className={styles.selectedVideoTitle}>{video.title}</h4>
                <p className={styles.selectedVideoChannel}>{video.channel}</p>
              </div>
              <div className={styles.selectedVideoActions}>
                <button 
                  className={styles.removeVideoButton}
                  onClick={() => onRemoveVideo(video.videoId)}
                  title="Remove from compilation"
                >
                  <i className="fas fa-times"></i>
                </button>
                <button 
                  className={styles.dragVideoButton}
                  title="Move"
                >
                  <i className="fas fa-grip-lines"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.emptyCompilation}>
          <i className="fas fa-film"></i>
          <p>Your compilation is empty</p>
          <p>Search and add videos from the left panel</p>
        </div>
      )}

      {selectedVideos.length > 0 && (
        <div className={styles.compilationFooter}>
          <p className={styles.compilationInstructions}>
            <i className="fas fa-info-circle"></i> Drag and drop videos to change playback order
          </p>
          
          <div className={styles.compilationActions}>
            <button 
              className={styles.clearCompilationButton}
              onClick={clearAllVideos}
            >
              <i className="fas fa-trash-alt"></i> Clear compilation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilationBuilder;
