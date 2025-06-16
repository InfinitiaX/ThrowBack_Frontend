import React, { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
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
  faHeart,
  faPlus
} from '@fortawesome/free-solid-svg-icons';

// Main navigation items
const navItems = [
  // { 
  //   label: 'Home',
  //   to: '/dashboard',
  //   icon: faHome,
  //   exact: true
  // },

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
  // {
  //   label: 'Your Playlists',
  //   to: '/dashboard/playlists',
  //   icon: faHeart
  // },
  // {
  //   label: 'Discover',
  //   to: '/dashboard/discover',
  //   icon: faSearch
  // },
  // {
  //   label: 'Create Playlist',
  //   to: '/dashboard/playlists/new',
  //   icon: faPlus
  // }
];

const Sidebar = ({ isOpen, toggleSidebar, isCollapsed, toggleCollapse }) => {
  const location = useLocation();

  // Log props for debugging
  useEffect(() => {
    console.log("Sidebar props:", { isOpen, isCollapsed });
  }, [isOpen, isCollapsed]);

  const isActive = (path, exact = false) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && <div className={styles.overlay} onClick={toggleSidebar}></div>}
      
      <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''} ${isCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logoWrap}>
            <img src={Logo} alt="ThrowBack" className={styles.logo} />
          </div>
          <button className={styles.closeBtn} onClick={toggleSidebar} aria-label="Close menu">
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
        
        {/* Library Section */}
        <div className={styles.librarySection}>
          {/* <div className={styles.sectionTitle}>
            <span>Library</span>
          </div> */}
          
          {libraryItems.map(({ label, to, icon }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive: navIsActive }) =>
                `${styles.navItem} ${styles.libraryItem} ${isActive(to) ? styles.active : ''}`
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
        
        {/* Toggle Button */}
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