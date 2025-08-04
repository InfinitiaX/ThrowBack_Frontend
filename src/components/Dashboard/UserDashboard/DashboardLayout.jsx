import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import styles from './Layout.module.css';
import { useAuth } from '../../../contexts/AuthContext';

const DashboardLayout = () => {
  // États
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isPortrait, setIsPortrait] = useState(window.innerHeight > window.innerWidth);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  
  // Refs
  const layoutRef = useRef(null);
  const contentRef = useRef(null);
  
  // Hooks
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // Effet pour gérer le redimensionnement
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      const portrait = window.innerHeight > window.innerWidth;
      
      setIsMobile(mobile);
      setIsPortrait(portrait);
      
      // Ouvrir automatiquement la sidebar sur desktop
      if (!mobile && !isSidebarOpen) {
        setIsSidebarOpen(true);
      }
      
      // Fermer automatiquement la sidebar sur mobile (sauf si en cours d'utilisation)
      if (mobile && isSidebarOpen && !isTransitioning) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // Appliquer une fois au montage
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, [isSidebarOpen, isTransitioning]);

  // Fermer la sidebar lors des changements de route sur mobile
  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      setIsTransitioning(true);
      setIsSidebarOpen(false);
      
      // Réinitialiser l'état de transition après animation
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      }, 300); // Durée de la transition
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, isMobile]);
  
  // Effet pour optimiser la performance sur les appareils à faible puissance
  useEffect(() => {
    const isLowPowerDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isLowPowerDevice) {
      // Désactiver certaines animations ou transitions
      document.body.classList.add('low-power-device');
    }
    
    return () => {
      document.body.classList.remove('low-power-device');
    };
  }, []);
  
  // Gestionnaire d'événements tactiles pour le swipe
  useEffect(() => {
    if (!isMobile) return;
    
    const handleTouchStart = (e) => {
      setTouchStartX(e.touches[0].clientX);
    };
    
    const handleTouchEnd = (e) => {
      if (touchStartX === null) return;
      
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchEndX - touchStartX;
      
      // Seuil de swipe (50px)
      if (Math.abs(diff) > 50) {
        if (diff > 0 && !isSidebarOpen && touchStartX < 30) {
          // Swipe de gauche à droite près du bord = ouvrir sidebar
          setIsSidebarOpen(true);
        } else if (diff < 0 && isSidebarOpen) {
          // Swipe de droite à gauche = fermer sidebar
          setIsSidebarOpen(false);
        }
      }
      
      setTouchStartX(null);
    };
    
    const handleTouchMove = (e) => {
      // Optionnel: Implémenter une prévisualisation de la sidebar pendant le swipe
    };
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchmove', handleTouchMove, { passive: true });
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
      document.removeEventListener('touchmove', handleTouchMove);
    };
  }, [isMobile, isSidebarOpen, touchStartX]);

  // Bascule de la sidebar
  const toggleSidebar = () => {
    setIsTransitioning(true);
    setIsSidebarOpen(!isSidebarOpen);
    
    // Réinitialiser l'état de transition après animation
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };

  // Bascule du mode réduit de la sidebar
  const toggleSidebarCollapse = () => {
    setIsTransitioning(true);
    setIsSidebarCollapsed(!isSidebarCollapsed);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 300);
  };
  
  // Vérification si l'utilisateur est sur une page spécifique (peut être utilisé pour conditionnellement modifier le layout)
  const isOnPage = (path) => {
    return location.pathname === path;
  };
  
  // Classe CSS conditionnelle pour le contenu principal
  const contentClassName = `${styles.content} ${
    isSidebarOpen && !isMobile 
      ? isSidebarCollapsed 
        ? styles.withCollapsedSidebar 
        : styles.withSidebar 
      : ''
  } ${isTransitioning ? styles.isTransitioning : ''}`;

  return (
    <div className={styles.layout} ref={layoutRef}>
      {/* Overlay pour fermer la sidebar sur mobile */}
      {isSidebarOpen && isMobile && (
        <div 
          className={styles.overlay} 
          onClick={toggleSidebar}
          aria-hidden="true"
        />
      )}
      
      <Sidebar 
        isOpen={isSidebarOpen} 
        toggleSidebar={toggleSidebar}
        isCollapsed={isSidebarCollapsed && !isMobile}
        toggleCollapse={toggleSidebarCollapse}
      />
      
      <div className={contentClassName} ref={contentRef}>
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
        
        {/* Indicateur de chargement de page (optionnel) */}
        <div className={`${styles.pageLoadIndicator} ${isTransitioning ? styles.loading : ''}`}></div>
      </div>
    </div>
  );
};

export default DashboardLayout;