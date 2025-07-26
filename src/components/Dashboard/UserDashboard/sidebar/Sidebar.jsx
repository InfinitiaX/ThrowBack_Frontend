// src/components/Dashboard/UserDashboard/Sidebar.jsx
import React, { useEffect, useRef } from 'react';
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

// Main navigation items
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

// Éléments de la section Bibliothèque
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

  // Détection des gestes de swipe
  useEffect(() => {
    let touchStartX = 0;
    let touchEndX = 0;
    
    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
    };
    
    const handleTouchMove = (event) => {
      touchEndX = event.touches[0].clientX;
    };
    
    const handleTouchEnd = () => {
      // Swipe gauche (fermer sidebar si ouverte)
      if (touchStartX - touchEndX > 50 && isOpen) {
        toggleSidebar();
      }
      // Swipe droit (ouvrir sidebar si fermée) - uniquement près du bord gauche
      else if (touchEndX - touchStartX > 50 && !isOpen && touchStartX < 30) {
        toggleSidebar();
      }
      
      // Réinitialiser
      touchStartX = 0;
      touchEndX = 0;
    };

    // Ajouter la détection de swipe sur la sidebar
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart);
      sidebarRef.current.addEventListener('touchmove', handleTouchMove);
      sidebarRef.current.addEventListener('touchend', handleTouchEnd);
    }

    // Ajouter la détection de swipe sur le document pour l'ouverture
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchmove', handleTouchMove);
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
  }, [isOpen, toggleSidebar]);

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
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
        className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}
      >
        <div className={styles.sidebarHeader}>
          <div className={styles.logoWrap}>
            <img 
              src={Logo} 
              alt="ThrowBack" 
              className={styles.logo} 
              onClick={() => navigate('/dashboard')}
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
            <NavLink
              key={label}
              to={to}
              className={({ isActive: navIsActive }) =>
                `${styles.navItem} ${isActive(to, exact) ? styles.active : ''} ${inDevelopment ? styles.inDevelopment : ''}`
              }
              onClick={() => {
                // Ferme le sidebar sur mobile lors d'un clic sur un lien
                if (window.innerWidth <= 768) {
                  toggleSidebar();
                }
              }}
            >
              <span className={styles.icon}>
                <FontAwesomeIcon icon={icon} />
              </span>
              <span className={styles.label}>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Library Section - Affichée uniquement si des éléments existent */}
        {libraryItems.length > 0 && (
          <div className={styles.librarySection}>
            <div className={styles.sectionTitle}>
              <span>Library</span>
            </div>
            
            {libraryItems.map(({ label, to, icon, inDevelopment }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive: navIsActive }) =>
                  `${styles.navItem} ${styles.libraryItem} ${isActive(to) ? styles.active : ''} ${inDevelopment ? styles.inDevelopment : ''}`
                }
                onClick={() => {
                  if (window.innerWidth <= 768) {
                    toggleSidebar();
                  }
                }}
              >
                <span className={styles.icon}>
                  <FontAwesomeIcon icon={icon} />
                </span>
                <span className={styles.label}>{label}</span>
              </NavLink>
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