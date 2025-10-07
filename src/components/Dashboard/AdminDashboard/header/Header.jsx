import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Header.module.css';

// Style pour le badge Coming Soon
const comingSoonStyle = {
  fontSize: '0.6rem',
  padding: '2px 4px',
  backgroundColor: '#8b0000',
  color: 'white',
  borderRadius: '4px',
  marginLeft: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: 1,
};

const Header = ({ sidebarCollapsed, isMobile = false }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Écouter les changements de sidebar mobile
  useEffect(() => {
    const handleMobileSidebarToggle = (event) => {
      setMobileSidebarOpen(event.detail.isOpen);
    };

    window.addEventListener('toggleMobileSidebar', handleMobileSidebarToggle);
    return () => {
      window.removeEventListener('toggleMobileSidebar', handleMobileSidebarToggle);
    };
  }, []);

  // Générer les breadcrumbs basés sur l'URL actuelle
  const generateBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    
    if (pathSegments.length <= 1) return 'Dashboard';
    
    const pageNames = {
      'users': 'User Management',
      'videos': 'Video Management', 
      'shorts': 'Shorts Management',
      'playlists': 'Playlist Management',
      'comments': 'Comment Moderation',
      'posts': 'Post Management',
      'likes': 'Like Management',
      'messages': 'Message Center',
      'friends': 'Friend Connections',
      'security': 'Security Settings',
      'logs': 'System Logs',
      'profile': 'My Profile',
      'settings': 'Account Settings',
      'preferences': 'Preferences',
      'help': 'Help & Support',
      'notifications': 'Notifications'
    };

    const currentPage = pathSegments[pathSegments.length - 1];
    return pageNames[currentPage] || currentPage.charAt(0).toUpperCase() + currentPage.slice(1);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
      // Force logout même en cas d'erreur
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  const toggleMobileSidebar = () => {
    const newState = !mobileSidebarOpen;
    setMobileSidebarOpen(newState);
    
    window.dispatchEvent(
      new CustomEvent('toggleMobileSidebar', { 
        detail: { isOpen: newState } 
      })
    );
  };

  // Navigation vers page temporaire
  const navigateToTempPage = (path, title) => {
    navigate(path);
    setShowDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest(`.${styles.userProfile}`)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showDropdown]);

  // Close dropdown when route changes
  useEffect(() => {
    setShowDropdown(false);
  }, [location.pathname]);

  // Get user initials for avatar
  const getUserInitials = () => {
    if (!user) return 'AD';
    const firstInitial = user.prenom?.[0] || user.nom?.[0] || 'A';
    const lastInitial = user.nom?.[0] || user.prenom?.[0] || 'D';
    return `${firstInitial}${lastInitial}`.toUpperCase();
  };

  // Get user role display
  const getUserRole = () => {
    if (!user) return 'Administrator';
    
    if (Array.isArray(user.roles) && user.roles.length > 0) {
      const role = user.roles[0];
      if (typeof role === 'object' && role.libelle_role) {
        return role.libelle_role.charAt(0).toUpperCase() + role.libelle_role.slice(1);
      }
      return role.charAt(0).toUpperCase() + role.slice(1);
    }
    
    if (user.role) {
      return user.role.charAt(0).toUpperCase() + user.role.slice(1);
    }
    
    return 'Administrator';
  };

  return (
    <div 
      className={`${styles.header} ${isMobile ? styles.mobile : ''}`}
      style={{
        left: isMobile ? '0' : (sidebarCollapsed ? '60px' : '240px')
      }}
    >
      <div className={styles.headerLeft}>
        {isMobile && (
          <button 
            className={styles.mobileMenuToggle}
            onClick={toggleMobileSidebar}
            aria-label="Toggle menu"
          >
            <i className={`fas ${mobileSidebarOpen ? 'fa-times' : 'fa-bars'}`}></i>
          </button>
        )}
        
        <div className={styles.headerTitle}>
          {generateBreadcrumbs()}
        </div>
      </div>

      <div className={styles.headerActions}>
        <div 
          className={styles.headerIcon} 
          title="Notifications" 
          style={{ position: 'relative', cursor: 'pointer' }}
          onClick={() => navigateToTempPage('/admin/notifications', 'Notifications')}
        >
          <i className="fas fa-bell"></i>
          <span className={styles.notificationBadge}>5</span>
          <span style={{
            ...comingSoonStyle,
            position: 'absolute',
            bottom: '-18px',
            left: '50%',
            transform: 'translateX(-50%)',
            whiteSpace: 'nowrap'
          }}>Coming Soon</span>
        </div>

        <div className={styles.userProfile} onClick={(e) => {
          e.stopPropagation();
          setShowDropdown(!showDropdown);
        }}>
          <div className={styles.userAvatar}>
            {getUserInitials()}
          </div>
          {!isMobile && (
            <div className={styles.userInfo}>
              <div className={styles.userName}>
                {user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Administrator'}
              </div>
              <div className={styles.userRole}>{getUserRole()}</div>
            </div>
          )}
          <i className={`fas fa-chevron-${showDropdown ? 'up' : 'down'}`}></i>

          {showDropdown && (
            <div className={styles.userDropdown}>
              <div className={styles.dropdownHeader}>
                <div className={styles.dropdownUserInfo}>
                  <div className={styles.dropdownUserName}>
                    {user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : 'Administrator'}
                  </div>
                  <div className={styles.dropdownUserEmail}>
                    {user?.email || 'admin@throwback.com'}
                  </div>
                </div>
              </div>
              
              <div className={styles.dropdownDivider}></div>
              
              <button 
                className={styles.dropdownItem}
                onClick={() => navigateToTempPage('/admin/profile', 'My Profile')}
              >
                <i className="fas fa-user"></i>
                <span>My Profile</span>
                {/* <span style={comingSoonStyle}>Coming Soon</span> */}
              </button>
              
              {/* <button 
                className={styles.dropdownItem}
                onClick={() => navigateToTempPage('/admin/settings', 'Account Settings')}
              >
                <i className="fas fa-cog"></i>
                <span>Account Settings</span>
                <span style={comingSoonStyle}>Coming Soon</span>
              </button>
              
              <button 
                className={styles.dropdownItem}
                onClick={() => navigateToTempPage('/admin/preferences', 'Preferences')}
              >
                <i className="fas fa-palette"></i>
                <span>Preferences</span>
                <span style={comingSoonStyle}>Coming Soon</span>
              </button>
              
              <div className={styles.dropdownDivider}></div>
              
              <button 
                className={styles.dropdownItem}
                onClick={() => navigateToTempPage('/admin/help', 'Help & Support')}
              >
                <i className="fas fa-question-circle"></i>
                <span>Help & Support</span>
                <span style={comingSoonStyle}>Coming Soon</span>
              </button> */}
              
              <div className={styles.dropdownDivider}></div>
              
              <button onClick={handleLogout} className={styles.dropdownItem}>
                <i className="fas fa-sign-out-alt"></i>
                <span>Sign Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Header;