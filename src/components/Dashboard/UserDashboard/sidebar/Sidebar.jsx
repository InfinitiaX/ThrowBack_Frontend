import React, { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faVideo,
  faStream,
  faComments,
  faPodcast,
  faMusic,
  faUser,
  faBroadcastTower,
  faTimes,
  faChevronLeft,
  faChevronRight,
  faBookmark,
  faHeart,
  faSearch,
  faUserFriends,
   faQuestionCircle
} from '@fortawesome/free-solid-svg-icons';

// Définition des éléments de navigation
const navItems = [
  { 
    label: 'LiveThrowBack', 
    to: '/dashboard', // Route de base
    icon: faBroadcastTower,
    exact: true // Important: exact match pour la route de base
  },
  { 
    label: 'ThrowBack Videos', 
    to: '/dashboard/videos', 
    icon: faVideo
  },
  { 
    label: 'ThrowBack Shorts', 
    to: '/dashboard/shorts', 
    icon: faMusic 
  },
  { 
    label: 'Weekly Podcast', 
    to: '/dashboard/podcast', 
    icon: faPodcast 
  },
  { 
    label: 'ThrowBack Wall', 
    to: '/dashboard/wall', 
    icon: faStream,
    inDevelopment: true
  },
  { 
    label: 'ThrowBack Chat', 
    to: '/dashboard/chat', 
    icon: faComments,
    inDevelopment: true
  },
  { 
    label: 'Profile', 
    to: '/dashboard/profile', 
    icon: faUser 
  },
];

// Éléments de la section Bibliothèque
const libraryItems = [
  {
    label: 'Your Playlists',
    to: '/dashboard/playlists',
    icon: faHeart
  }, 
   {
    label: 'Help & Support',
    to: '/dashboard/help-support', 
    icon: faQuestionCircle,
    inDevelopment: false
  }
];

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Détection des appareils tactiles
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Détection d'iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Fonction améliorée pour déterminer si un élément est actif
  const isActive = (path, exact = false) => {
    // Pour la route dashboard principale
    if (path === '/dashboard' && exact) {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/';
    }
    
    // Pour les autres routes
    if (exact) {
      return location.pathname === path;
    }
    
    // Empêcher la route de base d'être active quand on est sur une sous-route
    if (path === '/dashboard' && location.pathname !== '/dashboard' && location.pathname !== '/dashboard/') {
      return false;
    }
    
    return location.pathname.startsWith(path);
  };

  // Détection des gestes de swipe améliorée
  useEffect(() => {
    if (!isTouchDevice) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isSwiping = false;
    
    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      isSwiping = false;
    };
    
    const handleTouchMove = (event) => {
      touchEndX = event.touches[0].clientX;
      touchEndY = event.touches[0].clientY;
      
      // Détection horizontale vs verticale pour éviter les conflits avec le défilement
      const deltaX = Math.abs(touchEndX - touchStartX);
      const deltaY = Math.abs(touchEndY - touchStartY);
      
      // Si le mouvement est plus horizontal que vertical et significatif
      if (deltaX > deltaY && deltaX > 30) {
        isSwiping = true;
      }
    };
    
    const handleTouchEnd = (event) => {
      // Seulement traiter les swipes, pas les taps
      if (!isSwiping) return;
      
      // Swipe gauche (fermer sidebar si ouverte)
      if (touchStartX - touchEndX > 50 && isOpen) {
        toggleSidebar();
        // Empêcher le clic après swipe sur iOS
        event.preventDefault();
      }
      // Swipe droit (ouvrir sidebar si fermée) - uniquement près du bord gauche
      else if (touchEndX - touchStartX > 50 && !isOpen && touchStartX < 30) {
        toggleSidebar();
        // Empêcher le clic après swipe sur iOS
        event.preventDefault();
      }
      
      // Réinitialiser
      isSwiping = false;
    };

    // Ajouter la détection de swipe
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
      sidebarRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
      sidebarRef.current.addEventListener('touchend', handleTouchEnd);
    }

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('touchstart', handleTouchStart);
        sidebarRef.current.removeEventListener('touchmove', handleTouchMove);
        sidebarRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isOpen, toggleSidebar, isTouchDevice]);
  
  // Gestionnaire de navigation optimisé pour iOS
  const handleNavigation = (to) => {
    navigate(to);
    
    // Ferme la sidebar sur mobile
    if (window.innerWidth <= 768) {
      // Délai pour iOS pour éviter les conflits d'événements
      if (isIOS) {
        setTimeout(() => {
          toggleSidebar();
        }, 50);
      } else {
        toggleSidebar();
      }
    }
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className={styles.overlay} 
          onClick={toggleSidebar}
          aria-hidden="true"
        ></div>
      )}
      
      <aside 
        ref={sidebarRef}
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''} ${isIOS ? styles.iosFix : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div 
            className={styles.logoWrap} 
            onClick={() => handleNavigation('/dashboard')}
            role="button"
            tabIndex={0}
            aria-label="Go to dashboard"
          >
            <img 
              src='/images/Logo.png' 
              alt="ThrowBack" 
              className={styles.logo}
            />
          </div>
          <button 
            className={styles.closeBtn} 
            onClick={toggleSidebar} 
            aria-label="Close menu"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        
        {/* Main Navigation */}
        <nav className={styles.nav}>
          <div className={styles.sectionTitle}>
            <span>Navigation</span>
          </div>
          
          {navItems.map(({ label, to, icon, exact = false, inDevelopment }) => (
            <div
              key={label}
              className={`${styles.navItemWrapper} ${isActive(to, exact) ? styles.activeWrapper : ''} ${inDevelopment ? styles.inDevelopmentWrapper : ''}`}
              onClick={() => handleNavigation(to)}
              role="button"
              tabIndex={0}
            >
              <div 
                className={`${styles.navItem} ${isActive(to, exact) ? styles.active : ''} ${inDevelopment ? styles.inDevelopment : ''}`}
              >
                <span className={styles.icon}>
                  <FontAwesomeIcon icon={icon} />
                </span>
                <span className={styles.label}>{label}</span>
                
                {/* Indicateur visuel pour l'élément actif */}
                {isActive(to, exact) && (
                  <span className={styles.activeIndicator}></span>
                )}
              </div>
            </div>
          ))}
        </nav>
        
        {/* Library Section */}
        <div className={styles.librarySection}>
          <div className={styles.sectionTitle}>
            <span>Library</span>
          </div>
          
          {libraryItems.map(({ label, to, icon, exact = false, inDevelopment }) => (
            <div
              key={label}
              className={`${styles.navItemWrapper} ${styles.libraryItemWrapper} ${isActive(to, exact) ? styles.activeWrapper : ''} ${inDevelopment ? styles.inDevelopmentWrapper : ''}`}
              onClick={() => handleNavigation(to)}
              role="button"
              tabIndex={0}
            >
              <div 
                className={`${styles.navItem} ${styles.libraryItem} ${isActive(to, exact) ? styles.active : ''} ${inDevelopment ? styles.inDevelopment : ''}`}
              >
                <span className={styles.icon}>
                  <FontAwesomeIcon icon={icon} />
                </span>
                <span className={styles.label}>{label}</span>
                
                {/* Indicateur visuel pour l'élément actif */}
                {isActive(to, exact) && (
                  <span className={styles.activeIndicator}></span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Toggle Button - Visible uniquement sur desktop */}
        <button 
          className={styles.toggleBtn}
          onClick={toggleCollapse}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
        </button>
        
        <div className={styles.sidebarFooter}>
          <p className={styles.copyright}>© {new Date().getFullYear()} ThrowBack</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;