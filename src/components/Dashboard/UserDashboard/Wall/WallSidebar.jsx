// components/Dashboard/UserDashboard/Wall/WallSidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHashtag, 
  faUserFriends, 
  faUserPlus, 
  faMusic, 
  faVideo,
  faSync,
  faChartLine
} from '@fortawesome/free-solid-svg-icons';
import api from '../../../../utils/api';
import styles from './WallSidebar.module.css';

const WallSidebar = ({ onRefresh }) => {
  const [trendingHashtags, setTrendingHashtags] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    const fetchSidebarData = async () => {
      try {
        setLoading(true);
        
        // Simulate API call for trending hashtags
        setTimeout(() => {
          setTrendingHashtags([
            { tag: 'throwback80s', count: 234 },
            { tag: 'vinylvibes', count: 189 },
            { tag: 'musicmemories', count: 156 },
            { tag: 'classicrock', count: 122 },
            { tag: 'soulmusic', count: 95 }
          ]);
        }, 1000);
        
        // Simulate API call for suggested users
        setTimeout(() => {
          setSuggestedUsers([
            { 
              _id: '1', 
              nom: 'Martin', 
              prenom: 'Sophie', 
              photo_profil: '/images/default-avatar.jpg' 
            },
            { 
              _id: '2', 
              nom: 'Dubois', 
              prenom: 'Jean', 
              photo_profil: '/images/default-avatar.jpg' 
            },
            { 
              _id: '3', 
              nom: 'Chen', 
              prenom: 'Li', 
              photo_profil: '/images/default-avatar.jpg' 
            }
          ]);
          setLoading(false);
        }, 1500);
        
      } catch (err) {
        console.error('Erreur lors du chargement des données de la sidebar:', err);
        setLoading(false);
      }
    };
    
    fetchSidebarData();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    setTrendingHashtags([]);
    setSuggestedUsers([]);
    setLoading(true);
    
    setTimeout(() => {
      setTrendingHashtags([
        { tag: 'throwback80s', count: 234 },
        { tag: 'vinylvibes', count: 189 },
        { tag: 'musicmemories', count: 156 },
        { tag: 'classicrock', count: 122 },
        { tag: 'soulmusic', count: 95 }
      ]);
      
      setSuggestedUsers([
        { 
          _id: '1', 
          nom: 'Martin', 
          prenom: 'Sophie', 
          photo_profil: '/images/default-avatar.jpg' 
        },
        { 
          _id: '2', 
          nom: 'Dubois', 
          prenom: 'Jean', 
          photo_profil: '/images/default-avatar.jpg' 
        },
        { 
          _id: '3', 
          nom: 'Chen', 
          prenom: 'Li', 
          photo_profil: '/images/default-avatar.jpg' 
        }
      ]);
      
      setLoading(false);
      
      if (onRefresh) {
        onRefresh();
      }
    }, 1000);
  };

  return (
    <div className={styles.sidebar}>
      <div className={styles.sidebarHeader}>
        <h2>ThrowBack Wall</h2>
        <button 
          className={styles.refreshButton}
          onClick={handleRefresh}
          disabled={loading}
        >
          <FontAwesomeIcon icon={faSync} spin={loading} />
        </button>
      </div>
      
      {/* <div className={styles.sidebarSection}>
        <h3>
          <FontAwesomeIcon icon={faChartLine} />
          <span>Trends</span>
        </h3>
        
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.trendingHashtags}>
            {trendingHashtags.map((hashtag, index) => (
              <Link 
                key={index} 
                to={`/dashboard/wall?hashtag=${encodeURIComponent(hashtag.tag)}`}
                className={styles.hashtagItem}
              >
                <FontAwesomeIcon icon={faHashtag} />
                <span className={styles.hashtagName}>{hashtag.tag}</span>
                <span className={styles.hashtagCount}>{hashtag.count}</span>
              </Link>
            ))}
          </div>
        )}
      </div> */}
      
      {/* <div className={styles.sidebarSection}>
        <h3>
          <FontAwesomeIcon icon={faUserPlus} />
          <span>Suggestions</span>
        </h3>
        
        {loading ? (
          <div className={styles.loading}>Loading...</div>
        ) : (
          <div className={styles.suggestedUsers}>
            {suggestedUsers.map((user) => (
              <div key={user._id} className={styles.userItem}>
                <Link to={`/dashboard/profile/${user._id}`} className={styles.userLink}>
                  <img 
                    src={user.photo_profil} 
                    alt={`${user.prenom} ${user.nom}`} 
                    className={styles.userAvatar}
                  />
                  <span className={styles.userName}>
                    {user.prenom} {user.nom}
                  </span>
                </Link>
                <button className={styles.followButton}>
                  <FontAwesomeIcon icon={faUserFriends} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div> */}
      
      <div className={styles.sidebarSection}>
        <h3>Discover more</h3>
        <div className={styles.discoverLinks}>
          <Link to="/dashboard/videos" className={styles.discoverLink}>
            <FontAwesomeIcon icon={faVideo} />
            <span>Throwback Videos</span>
          </Link>
          <Link to="/dashboard/shorts" className={styles.discoverLink}>
            <FontAwesomeIcon icon={faMusic} />
            <span>Shorts</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WallSidebar;
