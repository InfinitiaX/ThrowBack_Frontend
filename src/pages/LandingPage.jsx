import React from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './LandingPage.module.css';



export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.landing_bg}>
      {/* Conteneur vidéo avec éléments par-dessus */}
      <div className={styles.videoContainer}>
        <video 
          className={styles.backgroundVideo}
          autoPlay 
          muted 
          loop 
          playsInline
        >
          <source src="/videos/throwback-intro.mp4" type="video/mp4" />
        </video>
        
        {/* Overlay pour assombrir légèrement la vidéo */}
        <div className={styles.videoOverlay}></div>
        
        {/* Section supérieure - Logo et Slogan */}
        <div className={styles.topSection}>
          <img 
            src="/images/Logo.png" 
            alt="ThrowBack Logo" 
            className={styles.logoImg} 
          />
          
          <h1 className={styles.slogan}>
            Your memories. Your music. Let’s connect!
          </h1>
        </div>
        

        
        {/* Section inférieure - Bouton Get Started */}
        <div className={styles.bottomSection}>
          <button 
            className={styles.getStarted} 
            onClick={() => navigate('/login')}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}