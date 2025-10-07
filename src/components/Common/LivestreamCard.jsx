import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './LivestreamCard.css';

const LivestreamCard = ({ stream }) => {
  const [timeRemaining, setTimeRemaining] = useState('');
  
  // Calculer le temps restant avant le début du stream
  useEffect(() => {
    if (!stream.scheduledStartTime) return;
    
    const updateTimeRemaining = () => {
      const now = new Date();
      const startTime = new Date(stream.scheduledStartTime);
      const timeDiff = startTime - now;
      
      if (timeDiff <= 0) {
        // Le stream a déjà commencé
        if (stream.status === 'LIVE') {
          setTimeRemaining('LIVE');
        } else {
          setTimeRemaining('PROGRAM');
        }
        return;
      }
      
      // Calculer jours, heures, minutes
      const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (days > 0) {
        setTimeRemaining(`In ${days}j ${hours}h`);
      } else if (hours > 0) {
        setTimeRemaining(`In ${hours}h ${minutes}min`);
      } else {
        setTimeRemaining(`In ${minutes}min`);
      }
    };
    
    // Mettre à jour immédiatement puis toutes les minutes
    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(interval);
  }, [stream.scheduledStartTime, stream.status]);
  
  // Formater la date et l'heure
  const formatDateTime = (dateString) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const options = { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    
    return date.toLocaleDateString('fr-FR', options);
  };
  
  // Déterminer la classe CSS pour le statut
  const getStatusClass = () => {
    switch (stream.status) {
      case 'LIVE':
        return 'live';
      case 'SCHEDULED':
        return 'scheduled';
      case 'COMPLETED':
        return 'completed';
      case 'CANCELLED':
        return 'cancelled';
      default:
        return '';
    }
  };
  
  // Déterminer le texte du statut
  const getStatusText = () => {
    switch (stream.status) {
      case 'LIVE':
        return 'LIVE';
      case 'SCHEDULED':
        return timeRemaining || 'PROGRAM';
      case 'COMPLETED':
        return 'ENDED';
      case 'CANCELLED':
        return 'CANCELLED';
      default:
        return '';
    }
  };

  return (
    <div className={`livestream-card ${getStatusClass()}`}>
      <Link to={`/dashboard/live/${stream._id}`} className="livestream-card-link">
        <div className="livestream-thumbnail-container">
          <img 
            src={stream.thumbnailUrl || '/images/live-default.jpg'} 
            alt={stream.title} 
            className="livestream-thumbnail" 
          />
          
          <div className="livestream-overlay">
            <div className={`livestream-status ${getStatusClass()}`}>
              {stream.status === 'LIVE' && <span className="pulse-dot"></span>}
              {getStatusText()}
            </div>
            
            {stream.status === 'LIVE' && (
              <div className="livestream-viewers">
                <i className="fas fa-user"></i> {(stream.statistics?.maxConcurrentViewers || 0).toLocaleString()} viewers
              </div>
            )}
            
            <div className="livestream-play-button">
              {stream.status === 'LIVE' ? (
                <i className="fas fa-play"></i>
              ) : (
                <i className="fas fa-calendar"></i>
              )}
            </div>
          </div>
          
          {stream.category && (
            <div className="livestream-category">
              {stream.category.replace(/_/g, ' ')}
            </div>
          )}
        </div>
        
        <div className="livestream-info">
          <h3 className="livestream-title">{stream.title}</h3>
          
          <div className="livestream-meta">
            <div className="livestream-host">
              <span className="host-label">Hosted by:</span> {stream.hostName || 'ThrowBack Host'}
            </div>
            
            <div className="livestream-schedule">
              <i className="far fa-clock"></i> {formatDateTime(stream.scheduledStartTime)}
            </div>
            
            {stream.guests && stream.guests.length > 0 && (
              <div className="livestream-guests">
                <span className="guests-label">Guests:</span> {stream.guests.join(', ')}
              </div>
            )}
          </div>
          
          {stream.description && (
            <p className="livestream-description">
              {stream.description.length > 100 
                ? `${stream.description.substring(0, 100)}...` 
                : stream.description}
            </p>
          )}
          
          {stream.isRecurring && (
            <div className="livestream-recurring">
              <i className="fas fa-sync-alt"></i> Recurring show
            </div>
          )}
          
          {stream.tags && stream.tags.length > 0 && (
            <div className="livestream-tags">
              {stream.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="livestream-tag">
                  {tag}
                </span>
              ))}
              {stream.tags.length > 3 && (
                <span className="livestream-tag more">+{stream.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
      </Link>
    </div>
  );
};

export default LivestreamCard;