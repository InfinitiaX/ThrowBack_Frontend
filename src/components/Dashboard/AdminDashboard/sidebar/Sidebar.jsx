// Sidebar admin
// This file contains the sidebar component for the admin dashoard
import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import styles from './Sidebar.module.css';

const Sidebar = ({ collapsed, onToggle, isMobile = false }) => {
  const location = useLocation();
  const [currentPath, setCurrentPath] = useState('');
  const [isOpen, setIsOpen] = useState(false); 
  
  // Mettre à jour le chemin actuel quand la location change
  useEffect(() => {
    setCurrentPath(location.pathname);
  }, [location]);

  // Écouter les événements de toggle mobile
  useEffect(() => {
    const handleMobileToggle = (event) => {
      if (isMobile) {
        setIsOpen(event.detail.isOpen);
      }
    };

    window.addEventListener('toggleMobileSidebar', handleMobileToggle);
    return () => {
      window.removeEventListener('toggleMobileSidebar', handleMobileToggle);
    };
  }, [isMobile]);

  // Toggle sidebar and notify parent component
  const toggleSidebar = () => {
    if (isMobile) {
      // Sur mobile, on ferme/ouvre le sidebar
      const newState = !isOpen;
      setIsOpen(newState);
      
      // Dispatcher l'événement pour les autres composants
      window.dispatchEvent(
        new CustomEvent('toggleMobileSidebar', { 
          detail: { isOpen: newState } 
        })
      );
    } else {
      // Sur desktop, on collapse/expand
      const newState = !collapsed;
      
      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent('sidebarToggle', { 
          detail: { collapsed: newState } 
        })
      );
      
      // Notify parent directly
      if (onToggle) {
        onToggle(newState);
      }
    }
  };

  // Fermer le sidebar mobile lors d'un clic sur un lien
  const handleLinkClick = () => {
    if (isMobile && isOpen) {
      setIsOpen(false);
      window.dispatchEvent(
        new CustomEvent('toggleMobileSidebar', { 
          detail: { isOpen: false } 
        })
      );
    }
  };

  // Fonction pour déterminer si un lien est actif
  const isLinkActive = (path) => {
    if (path === '/admin' && currentPath === '/admin') {
      return true;
    }
    
    if (path !== '/admin' && currentPath.startsWith(path)) {
      return true;
    }
    
    return false;
  };

const menuItems = [
  {
    category: 'GENERAL',
    items: [
      { path: '/admin', icon: 'fas fa-tachometer-alt', label: 'Dashboard', exact: true },
      { path: '/admin/users', icon: 'fas fa-users', label: 'Manage Users' }
    ]
  },
   {
    category: 'Musique videos',
    items: [
      { path: '/admin/livestreams', icon: 'fas fa-broadcast-tower', label: 'Livethrowback' },
      { path: '/admin/videos', icon: 'fas fa-video', label: 'Videos' },
      { path: '/admin/shorts', icon: 'fas fa-bolt', label: 'Shorts' },
      { path: '/admin/podcasts', icon: 'fas fa-podcast', label: 'Podcasts' }, 
      { path: '/admin/playlists', icon: 'fas fa-list', label: 'Playlists' }
    ]
  },
    {
      category: 'MODERATION',
      items: [
        { path: '/admin/comments', icon: 'fas fa-comments', label: 'Comments' },
        { path: '/admin/posts', icon: 'fas fa-file-alt', label: 'Posts' },
        { path: '/admin/likes', icon: 'fas fa-thumbs-up', label: 'Likes' },
        { path: '/admin/messages', icon: 'fas fa-envelope', label: 'Messages' },
        { path: '/admin/friends', icon: 'fas fa-user-friends', label: 'Friends' }
      ]
    },
    {
      category: 'SYSTEM',
      items: [
        { path: '/admin/security', icon: 'fas fa-shield-alt', label: 'Security' },
        { path: '/admin/logs', icon: 'fas fa-history', label: 'Logs' }
      ]
    }
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isMobile && isOpen && (
        <div 
          className={styles.overlay} 
          onClick={() => {
            setIsOpen(false);
            window.dispatchEvent(
              new CustomEvent('toggleMobileSidebar', { 
                detail: { isOpen: false } 
              })
            );
          }}
        />
      )}

      <div className={`
        ${styles.sidebar} 
        ${collapsed && !isMobile ? styles.collapsed : ''} 
        ${isMobile && isOpen ? styles.open : ''}
        ${isMobile ? styles.mobile : ''}
      `}>
        <div className={styles.sidebarHeader}>
          <NavLink to="/admin" className={styles.logo} onClick={handleLinkClick}>
            <img src="/images/Logo.png" alt="ThrowBack" className={styles.logoImg} />
            {(!collapsed || isMobile) && <span>ThrowBack</span>}
          </NavLink>
          <button 
            className={styles.sidebarToggle} 
            onClick={toggleSidebar}
            aria-label={
              isMobile 
                ? (isOpen ? "Close sidebar" : "Open sidebar")
                : (collapsed ? "Expand sidebar" : "Collapse sidebar")
            }
          >
            <i className={`fas ${
              isMobile 
                ? (isOpen ? 'fa-times' : 'fa-bars')
                : (collapsed ? 'fa-chevron-right' : 'fa-chevron-left')
            }`}></i>
          </button>
        </div>

        <div className={styles.sidebarMenu}>
          {menuItems.map((category, categoryIndex) => (
            <div key={categoryIndex}>
              <div className={styles.menuHeader}>
                {(!collapsed || isMobile) && category.category}
              </div>
              {category.items.map((item, itemIndex) => (
                <NavLink 
                  key={itemIndex}
                  to={item.path} 
                  className={({ isActive }) => `
                    ${styles.menuItem} 
                    ${(item.exact ? (currentPath === item.path) : isLinkActive(item.path)) ? styles.active : ''}
                  `}
                  onClick={handleLinkClick}
                  title={collapsed && !isMobile ? item.label : ''}
                >
                  <i className={item.icon}></i>
                  {(!collapsed || isMobile) && <span>{item.label}</span>}
                </NavLink>
              ))}
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

export default Sidebar;