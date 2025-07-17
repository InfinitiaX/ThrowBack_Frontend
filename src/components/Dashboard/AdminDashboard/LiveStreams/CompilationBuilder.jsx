import React, { useState, useEffect } from 'react';
import styles from './LiveThrowback.module.css';

const CompilationBuilder = ({ selectedVideos, onRemoveVideo, onReorderVideos }) => {
  const [totalDuration, setTotalDuration] = useState(0);
  const [draggedVideo, setDraggedVideo] = useState(null);

  // Calculer la durée totale à chaque modification de la liste
  useEffect(() => {
    // Calculer la durée totale
    const calcTotalDuration = () => {
      let total = 0;
      selectedVideos.forEach(video => {
        // Convertir la durée en secondes
        const duration = video.duration || '0:00';
        const parts = duration.split(':').map(part => parseInt(part, 10) || 0);
        
        if (parts.length === 3) { // format h:m:s
          total += parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) { // format m:s
          total += parts[0] * 60 + parts[1];
        } else if (parts.length === 1) { // juste secondes
          total += parts[0];
        }
      });
      
      setTotalDuration(total);
    };
    
    calcTotalDuration();
  }, [selectedVideos]);

  // Formater la durée totale en hh:mm:ss
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

  // Gestion du drag and drop
  const handleDragStart = (e, index) => {
    setDraggedVideo(index);
    e.dataTransfer.effectAllowed = 'move';
    // Pour éviter l'apparence fantôme pendant le drag
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
    
    // Si on survole un autre élément que celui qu'on déplace
    if (draggedVideo !== null && draggedVideo !== index) {
      onReorderVideos(draggedVideo, index);
      setDraggedVideo(index);
    }
  };

  // Fonction pour effacer toutes les vidéos
  const clearAllVideos = () => {
    if (selectedVideos.length > 0) {
      // Confirmation avant suppression
      if (window.confirm("Êtes-vous sûr de vouloir vider la compilation ?")) {
        selectedVideos.forEach(v => onRemoveVideo(v.videoId));
      }
    }
  };

  return (
    <div className={styles.compilationContainer}>
      <div className={styles.compilationHeader}>
        <h3>Compilation LiveThrowback</h3>
        <div className={styles.compilationStats}>
          <span className={styles.videoCount}>
            {selectedVideos.length} {selectedVideos.length <= 1 ? 'vidéo' : 'vidéos'}
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
                  title="Retirer de la compilation"
                >
                  <i className="fas fa-times"></i>
                </button>
                <button 
                  className={styles.dragVideoButton}
                  title="Déplacer"
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
          <p>Votre compilation est vide</p>
          <p>Recherchez et ajoutez des vidéos depuis le panneau de gauche</p>
        </div>
      )}

      {selectedVideos.length > 0 && (
        <div className={styles.compilationFooter}>
          <p className={styles.compilationInstructions}>
            <i className="fas fa-info-circle"></i> Faites glisser les vidéos pour modifier leur ordre de lecture
          </p>
          
          <div className={styles.compilationActions}>
            <button 
              className={styles.clearCompilationButton}
              onClick={clearAllVideos}
            >
              <i className="fas fa-trash-alt"></i> Vider la compilation
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompilationBuilder;