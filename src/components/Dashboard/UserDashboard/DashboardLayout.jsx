import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import styles from './Layout.module.css';

const DashboardLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isTablet, setIsTablet] = useState(window.innerWidth > 768 && window.innerWidth <= 1024);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  // Vérification d'authentification intégrée au layout
  const checkAuth = useCallback(async () => {
    try {
      // Logique de vérification d'authentification ici
      setIsLoading(false);
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Gestion responsive améliorée
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const mobile = width <= 768;
      const tablet = width > 768 && width <= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      
      // Comportement intelligent selon le dispositif
      if (mobile) {
        setIsSidebarOpen(false);
        setIsSidebarCollapsed(false);
      } else if (tablet) {
        setIsSidebarOpen(true);
        setIsSidebarCollapsed(true);
      } else {
        setIsSidebarOpen(true);
        setIsSidebarCollapsed(false);
      }
    };

    handleResize(); // Initialisation
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fermer la sidebar lors des changements de route sur mobile
  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const toggleSidebarCollapse = useCallback(() => {
    setIsSidebarCollapsed(prev => !prev);
  }, []);

  if (isLoading) {
    return <div className={styles.loadingContainer}>
      <div className={styles.loadingSpinner}></div>
      <p>Loading your ThrowBack experience...</p>
    </div>;
  }

  return (
    <div className={styles.layout}>
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed && !isMobile}
        toggleCollapse={toggleSidebarCollapse}
        user={user}
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
          user={user}
          logout={logout}
        />
        
        <main className={styles.mainContent}>
          <Outlet />
        </main>

        {/* Bouton flottant amélioré pour mobile */}
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