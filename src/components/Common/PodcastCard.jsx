import React from 'react';
import { Link } from 'react-router-dom';
import './PodcastCard.css';

const PodcastCard = ({ podcast }) => {
  // Formater la durée en minutes
  const formatDuration = (seconds) => {
    if (!seconds) return '';
    
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return `${hours}h ${remainingMinutes > 0 ? remainingMinutes + 'min' : ''}`;
    }
  };
  
  // Formater la date en format court
  const formatDate = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };
  
  // Formater l'épisode (ex: EP.01)
  const formatEpisode = (episode, season = 1) => {
    if (!episode) return '';
    
    const episodeFormatted = episode.toString().padStart(2, '0');
    
    if (season > 1) {
      const seasonFormatted = season.toString().padStart(2, '0');
      return `S${seasonFormatted}E${episodeFormatted}`;
    }
    
    return `EP.${episodeFormatted}`;
  };

  return (
    <div className="podcast-card">
      <Link to={`/dashboard/podcast/${podcast._id}`} className="podcast-card-link">
        <div className="podcast-thumbnail-container">
          <img 
            src={podcast.coverImage || '/images/podcast-default.jpg'} 
            alt={podcast.title} 
            className="podcast-thumbnail" 
          />
          
          <div className="podcast-overlay">
            <div className="podcast-episode-badge">
              {formatEpisode(podcast.episode, podcast.season)}
            </div>
            
            <div className="podcast-play-button">
              <i className="fas fa-play"></i>
            </div>
            
            {podcast.duration && (
              <div className="podcast-duration">
                {formatDuration(podcast.duration)}
              </div>
            )}
          </div>
          
          {podcast.isHighlighted && (
            <div className="podcast-highlight-badge">
              <i className="fas fa-star"></i> Featured
            </div>
          )}
        </div>
        
        <div className="podcast-info">
          <h3 className="podcast-title">{podcast.title}</h3>
          
          <div className="podcast-meta">
            {podcast.guestName && (
              <div className="podcast-guest">
                <span className="meta-label">Invité:</span> {podcast.guestName}
              </div>
            )}
            
            <div className="podcast-details">
              <span className="podcast-publish-date">{formatDate(podcast.publishDate)}</span>
              <span className="podcast-category">{podcast.category}</span>
            </div>
            
            <div className="podcast-stats">
              <span className="podcast-views">
                <i className="fas fa-eye"></i> {(podcast.viewCount || 0).toLocaleString()}
              </span>
              <span className="podcast-likes">
                <i className="fas fa-heart"></i> {(podcast.likeCount || 0).toLocaleString()}
              </span>
              <span className="podcast-comments">
                <i className="fas fa-comment"></i> {(podcast.commentCount || 0).toLocaleString()}
              </span>
            </div>
          </div>
          
          {podcast.description && (
            <p className="podcast-description">
              {podcast.description.length > 100 
                ? `${podcast.description.substring(0, 100)}...` 
                : podcast.description}
            </p>
          )}
          
          {podcast.topics && podcast.topics.length > 0 && (
            <div className="podcast-topics">
              {podcast.topics.slice(0, 3).map((topic, index) => (
                <span key={index} className="podcast-topic">
                  {topic}
                </span>
              ))}
              {podcast.topics.length > 3 && (
                <span className="podcast-topic more">+{podcast.topics.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default PodcastCard;