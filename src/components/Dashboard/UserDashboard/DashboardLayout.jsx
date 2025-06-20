import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const location = useLocation();

  // Gère le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(mobile);
      setIsPortrait(portrait);
      
      // Si on passe de mobile à desktop, ouvrir la sidebar
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
    };

    // Vérifier au chargement
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Fermer la sidebar lors des changements de route sur mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  // Ouvrir la sidebar par défaut sur desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleSidebarCollapse = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className={styles.layout}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed && !isMobile}
        toggleCollapse={toggleSidebarCollapse}
      />
      
      <div 
        className={`${styles.content} ${
          isSidebarOpen && !isMobile 
            ? isSidebarCollapsed 
              ? styles.withCollapsedSidebar 
              : styles.withSidebar 
            : ''
        }`}
      >
        <Header 
          toggleSidebar={toggleSidebar} 
          isSidebarOpen={isSidebarOpen} 
        />
        
        <main className={styles.mainContent}>
          <Outlet />
        </main>

        {/* Bouton flottant pour ouvrir la sidebar sur mobile */}
        {isMobile && !isSidebarOpen && (
          <button 
            className={styles.floatingMenuButton}
            onClick={toggleSidebar}
            aria-label="Open menu"
          >
            <span className={styles.floatingMenuIcon}></span>
            <span className={styles.floatingMenuIcon}></span>
            <span className={styles.floatingMenuIcon}></span>
          </button>
        )}
      </div>
    </div>
  );
};

export default DashboardLayout;