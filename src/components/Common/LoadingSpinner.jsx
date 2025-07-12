import React from 'react';
import './LoadingSpinner.css';

const LoadingSpinner = ({ size = 'medium', text = 'Chargement...' }) => {
  return (
    <div className="loading-container">
      <div className={`spinner-container ${size}`}>
        <div className="spinner">
          <div className="spinner-circle"></div>
          <div className="spinner-logo">
            {/* Version simplifiée du logo ThrowBack */}
            <div className="mini-logo">TB</div>
          </div>
        </div>
      </div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;