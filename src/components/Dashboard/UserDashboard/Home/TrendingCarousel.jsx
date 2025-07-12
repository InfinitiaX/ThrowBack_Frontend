import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './TrendingCarousel.css';

const TrendingCarousel = ({ videos }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoplay, setIsAutoplay] = useState(true);

  // Configuration automatique du carrousel
  useEffect(() => {
    let interval;
    
    if (isAutoplay && videos.length > 1) {
      interval = setInterval(() => {
        setCurrentIndex((prevIndex) => (prevIndex === videos.length - 1 ? 0 : prevIndex + 1));
      }, 6000); // Changement toutes les 6 secondes
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isAutoplay, videos.length]);

  // Pause autoplay quand l'utilisateur interagit
  const handleMouseEnter = () => setIsAutoplay(false);
  const handleMouseLeave = () => setIsAutoplay(true);
  
  // Navigation manuelle
  const goToPrevious = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === 0 ? videos.length - 1 : prevIndex - 1));
  };
  
  const goToNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prevIndex) => (prevIndex === videos.length - 1 ? 0 : prevIndex + 1));
  };
  
  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  if (!videos || videos.length === 0) {
    return null;
  }

  const currentVideo = videos[currentIndex];

  return (
    <div 
      className="trending-carousel" 
      onMouseEnter={handleMouseEnter} 
      onMouseLeave={handleMouseLeave}
    >
      <div className="carousel-content">
        <Link to={`/dashboard/videos/${currentVideo._id}`} className="carousel-main">
          <div className="carousel-image-container">
            {/* Arrière-plan flou pour l'effet visuel */}
            <div 
              className="carousel-background" 
              style={{ 
                backgroundImage: `url(${currentVideo.thumbnailUrl || '/images/video-placeholder.jpg'})`
              }}
            ></div>
            
            {/* Image principale */}
            <img 
              src={currentVideo.thumbnailUrl || '/images/video-placeholder.jpg'} 
              alt={currentVideo.titre} 
              className="carousel-image"
            />
            
            {/* Badge trending */}
            <div className="trending-badge">
              <i className="fas fa-fire"></i> Tendance
            </div>
            
            {/* Durée vidéo */}
            {currentVideo.duree && (
              <div className="video-duration">
                {Math.floor(currentVideo.duree / 60)}:{(currentVideo.duree % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
          
          <div className="carousel-info">
            <h2 className="carousel-title">{currentVideo.titre}</h2>
            
            <div className="video-meta">
              {currentVideo.artiste && (
                <span className="video-artist">{currentVideo.artiste}</span>
              )}
              
              {currentVideo.decennie && (
                <span className="video-decade">{currentVideo.decennie}</span>
              )}
              
              {currentVideo.genre && (
                <span className="video-genre">{currentVideo.genre}</span>
              )}
            </div>
            
            <p className="carousel-description">
              {currentVideo.description ? (
                currentVideo.description.length > 120 
                  ? `${currentVideo.description.substring(0, 120)}...` 
                  : currentVideo.description
              ) : 'Aucune description disponible.'}
            </p>
            
            <div className="video-stats">
              <span className="views-count">
                <i className="fas fa-eye"></i> {(currentVideo.vues || 0).toLocaleString()} vues
              </span>
              
              <span className="likes-count">
                <i className="fas fa-heart"></i> {(currentVideo.likes || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </Link>
      </div>
      
      {/* Boutons de navigation */}
      <button className="carousel-nav prev" onClick={goToPrevious}>
        <i className="fas fa-chevron-left"></i>
      </button>
      
      <button className="carousel-nav next" onClick={goToNext}>
        <i className="fas fa-chevron-right"></i>
      </button>
      
      {/* Indicateurs */}
      {videos.length > 1 && (
        <div className="carousel-indicators">
          {videos.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Voir tendance ${index + 1}`}
            ></button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrendingCarousel;