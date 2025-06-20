// src/components/Profile/Profile.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LocationIcon } from '../../assets/icons/location.svg';
import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';
import styles from './profile.module.css';
import ProfileTabs from '../Dashboard/UserDashboard/Profile/ProfileTabs';
import UserInfo from './UserInfo';


export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);
  
  // Fonction pour convertir les chemins relatifs en URLs absolues
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // Sinon, préfixer avec l'URL du backend
    const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    return `${backendUrl}${path}`;
  };

  if (editMode) {
    return <UserInfo onBack={() => setEditMode(false)} />;
  }

  if (showProfileTabs) {
    return (
      <div className={styles.tabsPageCenter}>
        <div className={styles.tabsPageContent}>
          <ProfileTabs />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.wrapper}>
      <div className={styles.main}>
        <div className={styles.content}>
          {/* Boutons du haut modernisés */}
          <div className={styles.topButtons} style={{ justifyContent: 'center', marginBottom: 32 }}>
            <button
              className={`${styles.friendlyBtn} ${activeBtn === 'friendly' ? styles.active : ''}`}
              onClick={() => setActiveBtn('friendly')}
            >
              + Friendly
            </button>
            <button
              className={`${styles.messageBtn} ${activeBtn === 'message' ? styles.active : ''}`}
              onClick={() => setActiveBtn('message')}
            >
              Message
            </button>
            <button
              className={`${styles.playlistBtn} ${activeBtn === 'playlist' ? styles.active : ''}`}
              onClick={() => setActiveBtn('playlist')}
            >
              My ThrowBack Playlist
            </button>
          </div>

          <div className={styles.profileCenterBlock}>
            {/* Profil central modernisé */}
            <div className={styles.profileInfo} style={{ marginBottom: 32 }}>
              <img
                src={getImageUrl(user.photo_profil)}
                alt={`${user.prenom} ${user.nom}`}
                className={styles.avatar}
              />
              <h2 className={styles.name}>{`${user.prenom} ${user.nom}`}</h2>
              <p className={styles.bio}>{user.bio || "Aucun bio renseigné."}</p>
              <div className={styles.meta}>
                <div className={styles.metaItem}>
                  <LocationIcon className={styles.icon} />
                  <span>{user.ville || "—"}</span>
                </div>
                <div className={styles.metaItem}>
                  <CheckIcon className={styles.icon} style={{ color: '#1ec773' }} />
                  <span style={{ color: '#1ec773' }}>Available</span>
                </div>
              </div>
            </div>

            {/* Boutons du bas modernisés */}
            <div className={styles.bottomButtons}>
              <button className={styles.bottomBtn} onClick={() => navigate('/dashboard/settings')}>
                Setting
              </button>
              <button className={styles.bottomBtn}>Help & Support</button>
              <button 
                className={styles.bottomBtn}
                onClick={() => setShowProfileTabs(true)}
              >
                Informations
              </button>
            </div>
          </div>
        </div>
      </div>
      {/* Partie droite statique */}
      <div className={styles.rightStatic}>
        <div className={styles.verticalTicker}>
          <div className={styles.tickerContent}>
            {/* Contenu dynamique ici... */}
          </div>
        </div>
      </div>
    </div>
  );
}