import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './header.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faBell, 
  faSignOutAlt, 
  faSearch,
  faTimes,
  faCog,
  faUser,
  faMicrophone,
  faPlus,
  faMusic,
  faHistory,
  faPlayCircle,
  faThumbsUp,
  faBars
} from '@fortawesome/free-solid-svg-icons';
import Logo from '../../../../images/Logo.png';
import { useAuth } from '../../../../contexts/AuthContext';

const Header = ({ toggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showClearButton, setShowClearButton] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 480);
  
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Détecter la taille de l'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 480);
      if (window.innerWidth > 480) {
        setShowMobileSearch(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Detect clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Focus sur l'input quand la recherche mobile est activée
  useEffect(() => {
    if (showMobileSearch && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showMobileSearch]);

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowClearButton(e.target.value.length > 0);
  };

  // Clear search input
  const clearSearch = () => {
    setSearchTerm('');
    setShowClearButton(false);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Handle search submission
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/dashboard/search?q=${encodeURIComponent(searchTerm.trim())}`);
      if (isMobile) {
        setShowMobileSearch(false);
      }
    }
  };

  // Navigation functions
  const handleProfileClick = () => {
    navigate('/dashboard/profile');
    setIsDropdownOpen(false);
  };

  const handleSettingsClick = () => {
    navigate('/dashboard/settings');
    setIsDropdownOpen(false);
  };

  const handleLogoutClick = () => {
    logout();
    navigate('/login');
  };

  const handleNotificationsClick = () => {
    navigate('/dashboard/notifications');
    setUnreadNotifications(0);
  };

  const handleCreateClick = () => {
    navigate('/dashboard/create');
  };

  // Handle menu button click to toggle sidebar
  const handleMenuButtonClick = () => {
    toggleSidebar();
  };

  // Fermer la recherche mobile
  const handleCloseMobileSearch = () => {
    setShowMobileSearch(false);
  };

  return (
    <header className={styles.header}>
      <div className={styles.headerLeft}>
        <button 
          className={`${styles.menuButton} ${isSidebarOpen ? styles.active : ''}`} 
          onClick={handleMenuButtonClick} 
          aria-label={isSidebarOpen ? "Close menu" : "Open menu"}
          title={isSidebarOpen ? "Close menu" : "Open menu"}
        >
          <FontAwesomeIcon icon={faBars} />
        </button>
        
        <Link to="/dashboard" className={styles.logoLink}>
          <img src={Logo} alt="ThrowBack" className={styles.logo} />
          <span className={styles.logoText}>ThrowBack</span>
        </Link>
      </div>

      <div className={`${styles.searchContainer} ${showMobileSearch ? styles.showMobileSearch : ''}`}>
        <form onSubmit={handleSearchSubmit} className={styles.searchForm}>
          <div className={styles.searchInputWrapper}>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search for music, artists, playlists..."
              className={styles.searchInput}
              value={searchTerm}
              onChange={handleSearchChange}
            />
            
            {showClearButton && (
              <button 
                type="button" 
                className={styles.clearButton} 
                onClick={clearSearch}
                aria-label="Clear search"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            )}
          </div>
          
          <button type="submit" className={styles.searchButton} aria-label="Search">
            <FontAwesomeIcon icon={faSearch} />
          </button>

          {isMobile && (
            <button 
              type="button" 
              className={styles.mobileCloseButton}
              onClick={handleCloseMobileSearch}
              aria-label="Close search"
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
          )}
        </form>
      </div>

      {isMobile && (
        <button 
          className={styles.mobileSearchButton} 
          onClick={() => setShowMobileSearch(!showMobileSearch)}
          aria-label="Search"
        >
          <FontAwesomeIcon icon={faSearch} />
        </button>
      )}

      <div className={styles.headerRight}>
        <button 
          className={styles.createButton} 
          onClick={handleCreateClick}
          aria-label="Create"
        >
          <FontAwesomeIcon icon={faPlus} />
          <span className={styles.createText}>Create</span>
        </button>
        
        <button 
          className={styles.notificationButton} 
          onClick={handleNotificationsClick}
          aria-label="Notifications"
        >
          <FontAwesomeIcon icon={faBell} />
          {unreadNotifications > 0 && (
            <span className={styles.notificationBadge}>{unreadNotifications}</span>
          )}
        </button>
        
        <div className={styles.profileContainer} ref={dropdownRef}>
          <button 
            className={styles.profileButton} 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            aria-label="Profile menu"
          >
            <img 
              src={user?.photo_profil || 'https://via.placeholder.com/32'} 
              alt="Profile" 
              className={styles.profileImage} 
            />
          </button>
          
          {isDropdownOpen && (
            <div className={styles.dropdown}>
              <div className={styles.dropdownHeader}>
                <img 
                  src={user?.photo_profil || 'https://via.placeholder.com/40'} 
                  alt="Profile" 
                  className={styles.dropdownProfileImage} 
                />
                <div className={styles.dropdownUserInfo}>
                  <span className={styles.dropdownUserName}>
                    {user?.prenom || 'Guest'} {user?.nom || 'User'}
                  </span>
                  <span className={styles.dropdownUserEmail}>
                    {user?.email || 'guest@example.com'}
                  </span>
                </div>
              </div>
              
              <div className={styles.dropdownBody}>
                <button className={styles.dropdownItem} onClick={handleProfileClick}>
                  <FontAwesomeIcon icon={faUser} className={styles.dropdownIcon} />
                  <span>Your Profile</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={() => navigate('/dashboard/playlists')}>
                  <FontAwesomeIcon icon={faMusic} className={styles.dropdownIcon} />
                  <span>Your Playlists</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={() => navigate('/dashboard/history')}>
                  <FontAwesomeIcon icon={faHistory} className={styles.dropdownIcon} />
                  <span>History</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={() => navigate('/dashboard/favorites')}>
                  <FontAwesomeIcon icon={faThumbsUp} className={styles.dropdownIcon} />
                  <span>Liked Videos</span>
                </button>
                
                <div className={styles.dropdownDivider}></div>
                
                <button className={styles.dropdownItem} onClick={handleSettingsClick}>
                  <FontAwesomeIcon icon={faCog} className={styles.dropdownIcon} />
                  <span>Settings</span>
                </button>
                
                <button className={styles.dropdownItem} onClick={handleLogoutClick}>
                  <FontAwesomeIcon icon={faSignOutAlt} className={styles.dropdownIcon} />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;