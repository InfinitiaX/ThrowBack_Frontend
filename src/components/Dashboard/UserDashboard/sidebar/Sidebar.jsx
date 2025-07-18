// Sidebar user corrigé pour iOS
// This file contains the sidebar component for the user dashboard
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

// Main navigation items
const navItems = [
  { 
    label: 'LiveThrowBack', 
    to: '/dashboard/live', 
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
    icon: faStream 
  },
  { 
    label: 'ThrowBack Chat', 
    to: '/dashboard/chat', 
    icon: faComments 
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
    icon: faSearch
  },
  {
    label: 'Find friends',
    to: '/dashboard/search/',
    icon: faUserFriends
  }, 
  {
    label :'Your favorites',
    to : '/dashboard/favorites/',
    icon : faBookmark
  }
];

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);
  const [internalIsOpen, setInternalIsOpen] = useState(isOpen);

  // Détecter si on est sur mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Synchroniser l'état interne avec les props
  useEffect(() => {
    setInternalIsOpen(isOpen);
  }, [isOpen]);

  // Écouter les événements personnalisés comme le sidebar admin
  useEffect(() => {
    const handleMobileToggle = (event) => {
      if (isMobile) {
        setInternalIsOpen(event.detail.isOpen);
      }
    };

    window.addEventListener('toggleMobileSidebar', handleMobileToggle);
    return () => {
      window.removeEventListener('toggleMobileSidebar', handleMobileToggle);
    };
  }, [isMobile]);

  // Gestion des gestes swipe améliorée pour iOS
  useEffect(() => {
    if (!isMobile) return;

    let touchStartX = 0;
    let touchStartY = 0;
    let touchEndX = 0;
    let touchEndY = 0;
    let isScrolling = false;
    
    const handleTouchStart = (event) => {
      touchStartX = event.touches[0].clientX;
      touchStartY = event.touches[0].clientY;
      isScrolling = false;
    };
    
    const handleTouchMove = (event) => {
      if (!touchStartX || !touchStartY) return;
      
      touchEndX = event.touches[0].clientX;
      touchEndY = event.touches[0].clientY;
      
      const diffX = Math.abs(touchEndX - touchStartX);
      const diffY = Math.abs(touchEndY - touchStartY);
      
      // Détecter si c'est un scroll vertical
      if (diffY > diffX) {
        isScrolling = true;
        return;
      }
      
      // Empêcher le comportement par défaut si c'est un swipe horizontal
      if (diffX > 10 && !isScrolling) {
        event.preventDefault();
      }
    };
    
    const handleTouchEnd = (event) => {
      if (isScrolling) return;
      
      const diffX = touchStartX - touchEndX;
      const diffY = Math.abs(touchStartY - touchEndY);
      
      // S'assurer que c'est un swipe horizontal
      if (Math.abs(diffX) < 50 || diffY > 100) return;
      
      // Swipe gauche (fermer sidebar si ouverte)
      if (diffX > 0 && internalIsOpen) {
        handleToggle();
      }
      // Swipe droit (ouvrir sidebar si fermée) - uniquement près du bord gauche
      else if (diffX < 0 && !internalIsOpen && touchStartX < 30) {
        handleToggle();
      }
      
      // Réinitialiser
      touchStartX = 0;
      touchStartY = 0;
      touchEndX = 0;
      touchEndY = 0;
    };

    // Ajouter les événements avec options pour iOS
    const options = { passive: false };
    
    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart, options);
      sidebarRef.current.addEventListener('touchmove', handleTouchMove, options);
      sidebarRef.current.addEventListener('touchend', handleTouchEnd, options);
    }

    // Événements sur document pour l'ouverture depuis le bord
    document.addEventListener('touchstart', handleTouchStart, options);
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, options);
    
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
  }, [isMobile, internalIsOpen]);

  const handleToggle = () => {
    if (isMobile) {
      const newState = !internalIsOpen;
      setInternalIsOpen(newState);
      
      // Dispatcher l'événement pour les autres composants
      window.dispatchEvent(
        new CustomEvent('toggleMobileSidebar', { 
          detail: { isOpen: newState } 
        })
      );
      
      // Appeler aussi la fonction parent
      if (toggleSidebar) {
        toggleSidebar();
      }
    } else {
      // Desktop - collapse/expand
      if (toggleCollapse) {
        toggleCollapse();
      }
    }
  };

  const handleLinkClick = () => {
    if (isMobile && internalIsOpen) {
      setInternalIsOpen(false);
      window.dispatchEvent(
        new CustomEvent('toggleMobileSidebar', { 
          detail: { isOpen: false } 
        })
      );
      if (toggleSidebar) {
        toggleSidebar();
      }
    }
  };

  const handleOverlayClick = () => {
    if (isMobile) {
      setInternalIsOpen(false);
      window.dispatchEvent(
        new CustomEvent('toggleMobileSidebar', { 
          detail: { isOpen: false } 
        })
      );
      if (toggleSidebar) {
        toggleSidebar();
      }
    }
  };

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isMobile && internalIsOpen && (
        <div 
          className={styles.overlay} 
          onClick={handleOverlayClick}
          aria-hidden="true"
        />
      )}
      
      <aside 
        ref={sidebarRef}
        className={`
          ${styles.sidebar} 
          ${internalIsOpen && isMobile ? styles.open : ''} 
          ${isCollapsed && !isMobile ? styles.collapsed : ''}
          ${isMobile ? styles.mobile : ''}
        `}
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
            onClick={handleToggle} 
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
          
          {navItems.map(({ label, to, icon, exact }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive: navIsActive }) =>
                `${styles.navItem} ${isActive(to, exact) ? styles.active : ''}`
              }
              onClick={handleLinkClick}
            >
              <span className={styles.icon}>
                <FontAwesomeIcon icon={icon} />
              </span>
              <span className={styles.label}>{label}</span>
            </NavLink>
          ))}
        </nav>
        
        {/* Library Section */}
        {libraryItems.length > 0 && (
          <div className={styles.librarySection}>
            <div className={styles.sectionTitle}>
              <span>Library</span>
            </div>
            
            {libraryItems.map(({ label, to, icon }) => (
              <NavLink
                key={label}
                to={to}
                className={({ isActive: navIsActive }) =>
                  `${styles.navItem} ${styles.libraryItem} ${isActive(to) ? styles.active : ''}`
                }
                onClick={handleLinkClick}
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
        {!isMobile && (
          <button 
            className={styles.toggleBtn}
            onClick={handleToggle}
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <FontAwesomeIcon icon={isCollapsed ? faChevronRight : faChevronLeft} />
          </button>
        )}
        
        <div className={styles.sidebarFooter}>
          <p className={styles.copyright}>© {new Date().getFullYear()} ThrowBack</p>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;