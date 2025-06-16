// src/components/Profile/Profile.jsx
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ReactComponent as LocationIcon } from '../../assets/icons/location.svg';
import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';
import styles from './profile.module.css';
import ProfileTabs from '../Dashboard/UserDashboard/Profile/ProfileTabs';
import UserInfo from './UserInfo';
import likeIcon from '../../assets/icons/like.png';
import commentIcon from '../../assets/icons/comment.png';

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);

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
                src={user.photo_profil || '/images/default-avatar.png'}
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
            <div className={styles.memoryCard}>
              <div className={styles.memoryHeader}><span style={{color:'#d32f2f',fontWeight:600}}>Alice Perry</span> posted a memory on the music video :</div>
              <img src="/images/image2.png" alt="memory" className={styles.memoryImage} />
              <div className={styles.memoryBody}>
                Eric Clapton - Tears in Heaven (1992). Please, like and comment to show some love! <br/>
                <span style={{color:'#d32f2f'}}>* This song always reminds me of my my late father. He was everything for me and I still miss him.😢</span>
              </div>
              <div className={styles.memoryFooter}>
                <span>
                  <img src={likeIcon} alt="like" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  43
                </span>
                <span>
                  <img src={commentIcon} alt="comment" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  11
                </span>
              </div>
            </div>
            <div className={styles.memoryCard}>
              <div className={styles.memoryHeader}><span style={{color:'#d32f2f',fontWeight:600}}>James Taylor</span> just shared a throwback to the iconic music video :</div>
              <img src="/images/image.png" alt="memory" className={styles.memoryImage} />
              <div className={styles.memoryBody}>
                Carole King - You've Got a Friend (1971). Please, like and comment! <br/>
                <span style={{color:'#d32f2f'}}>* This song always brings a smile to my face. 😊 It reminds me of sunny afternoons with my dad, singing along while driving with the windows down.*</span>
              </div>
              <div className={styles.memoryFooter}>
                <span>
                  <img src={likeIcon} alt="like" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  20
                </span>
                <span>
                  <img src={commentIcon} alt="comment" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  8
                </span>
              </div>
            </div>
            {/* Duplique les cards pour l'effet infini */}
            <div className={styles.memoryCard}>
              <div className={styles.memoryHeader}><span style={{color:'#d32f2f',fontWeight:600}}>Alice Perry</span> posted a memory on the music video :</div>
              <img src="/images/image.png" alt="memory" className={styles.memoryImage} />
              <div className={styles.memoryBody}>
                Eric Clapton - Tears in Heaven (1992). Please, like and comment to show some love! <br/>
                <span style={{color:'#d32f2f'}}>* This song always reminds me of my my late father. He was everything for me and I still miss him.😢</span>
              </div>
              <div className={styles.memoryFooter}>
                <span>
                  <img src={likeIcon} alt="like" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  43
                </span>
                <span>
                  <img src={commentIcon} alt="comment" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  11
                </span>
              </div>
            </div>
            <div className={styles.memoryCard}>
              <div className={styles.memoryHeader}><span style={{color:'#d32f2f',fontWeight:600}}>James Taylor</span> just shared a throwback to the iconic music video :</div>
              <img src="/images/image.png" alt="memory" className={styles.memoryImage} />
              <div className={styles.memoryBody}>
                Carole King - You've Got a Friend (1971). Please, like and comment! <br/>
                <span style={{color:'#d32f2f'}}>* This song always brings a smile to my face. 😊 It reminds me of sunny afternoons with my dad, singing along while driving with the windows down.*</span>
              </div>
              <div className={styles.memoryFooter}>
                <span>
                  <img src={likeIcon} alt="like" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  20
                </span>
                <span>
                  <img src={commentIcon} alt="comment" style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
                  8
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

