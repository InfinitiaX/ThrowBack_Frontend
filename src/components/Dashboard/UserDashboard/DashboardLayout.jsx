import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Vérifie si l'écran est en mode mobile ou desktop
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Gère le redimensionnement de la fenêtre
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // Si on passe de mobile à desktop, ouvrir la sidebar
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      
      // Si on passe de desktop à mobile, fermer la sidebar
      if (mobile && isSidebarOpen) {
        setIsSidebarOpen(false);
      }
    };

    // Vérifier au chargement
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen]);

  // Ouvrir la sidebar par défaut sur desktop
  useEffect(() => {
    if (!isMobile) {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    console.log("Toggling sidebar. Current state:", isSidebarOpen);
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
        isCollapsed={isSidebarCollapsed}
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
      </div>
    </div>
  );
};

export default DashboardLayout;