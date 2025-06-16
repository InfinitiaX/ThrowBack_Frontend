import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import styles from './Layout.module.css';

const Layout = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Fonction pour basculer l'état de la barre latérale
  const toggleSidebar = (collapsed) => {
    setSidebarCollapsed(collapsed);
    
    // Stockage de la préférence utilisateur dans localStorage (optionnel)
    localStorage.setItem('sidebarCollapsed', JSON.stringify(collapsed));
  };
  
  // Récupérer l'état précédent de la barre latérale au chargement
  useEffect(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    if (savedState) {
      setSidebarCollapsed(JSON.parse(savedState));
    }
    
    // Écouter les événements de redimensionnement
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Vérification initiale
    handleResize();
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  return (
    <div className={styles.layout}>
      <Sidebar collapsed={sidebarCollapsed} onToggle={toggleSidebar} />
      <main className={`${styles.mainContent} ${sidebarCollapsed ? styles.expanded : ''}`}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;