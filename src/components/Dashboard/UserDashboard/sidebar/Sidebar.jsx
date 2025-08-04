// src/components/Dashboard/UserDashboard/Sidebar.jsx
import React, { useEffect, useRef, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import styles from './Sidebar.module.css';
import Logo from '../../../../images/Logo.png';
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
  faHome,
  faSearch,
  faBookmark,
  faHeart,
  faPlus,
  faUserGroup,
  faUserFriends,
} from '@fortawesome/free-solid-svg-icons';

// Main navigation items (sans modification)
const navItems = [
  { 
    label: 'LiveThrowBack', 
    to: '/dashboard', // Chemin corrigé pour pointer vers l'index
    icon: faBroadcastTower
  },
  { 
    label: 'ThrowBack Videos', 
    to: '/dashboard/videos', 
    icon: faVideo,
    exact: true
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
    inDevelopment: true // Marquer comme en développement
  },
  { 
    label: 'ThrowBack Chat', 
    to: '/dashboard/chat', 
    icon: faComments,
    inDevelopment: true // Marquer comme en développement
  },
  { 
    label: 'Profile', 
    to: '/dashboard/profile', 
    icon: faUser 
  },
];

// Éléments de la section Bibliothèque (sans modification)
const libraryItems = [
  {
    label: 'Your Playlists',
    to: '/dashboard/playlists',
    icon: faHeart
  },
  {
    label: 'Discover',
    to: '/dashboard/discover',
    icon: faSearch,
    inDevelopment: true // Marquer comme en développement
  },
  {
    label: 'Find friends',
    to: '/dashboard/search',
    icon: faUserFriends
  }, 
  {
    label: 'Your favorites',
    to: '/dashboard/favorites',
    icon: faBookmark,
    inDevelopment: true // Marquer comme en développement
  }
];

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  
  // Détection si l'appareil est tactile
  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // Détection d'iOS
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

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
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
      isSwiping = false;
    };

    // Ajouter la détection de swipe sur la sidebar
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
      sidebarRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
      sidebarRef.current.addEventListener('touchend', handleTouchEnd);
    }

    // Ajouter la détection de swipe sur le document pour l'ouverture
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

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };
  
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
              src={Logo} 
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
          
          {navItems.map(({ label, to, icon, exact, inDevelopment }) => (
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
              </div>
            </div>
          ))}
        </nav>
        
        {/* Library Section - Affichée uniquement si des éléments existent */}
        {libraryItems.length > 0 && (
          <div className={styles.librarySection}>
            <div className={styles.sectionTitle}>
              <span>Library</span>
            </div>
            
            {libraryItems.map(({ label, to, icon, inDevelopment }) => (
              <div
                key={label}
                className={`${styles.navItemWrapper} ${styles.libraryItemWrapper} ${isActive(to) ? styles.activeWrapper : ''} ${inDevelopment ? styles.inDevelopmentWrapper : ''}`}
                onClick={() => handleNavigation(to)}
                role="button"
                tabIndex={0}
              >
                <div 
                  className={`${styles.navItem} ${styles.libraryItem} ${isActive(to) ? styles.active : ''} ${inDevelopment ? styles.inDevelopment : ''}`}
                >
                  <span className={styles.icon}>
                    <FontAwesomeIcon icon={icon} />
                  </span>
                  <span className={styles.label}>{label}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        
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