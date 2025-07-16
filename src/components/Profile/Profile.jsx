// src/components/Profile/Profile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { ReactComponent as LocationIcon } from '../../assets/icons/location.svg';
import { ReactComponent as CheckIcon } from '../../assets/icons/check.svg';
import styles from './profile.module.css';
import ProfileTabs from '../Dashboard/UserDashboard/Profile/ProfileTabs';
import UserInfo from './UserInfo';
import MemoryCard from '../Dashboard/UserDashboard/ThrowbackVideos/MemoryCard';
import likeIcon from '../../assets/icons/like.png';
import commentIcon from '../../assets/icons/comment.png';
import HelpAndSupport from './HelpAndSupport';

// Définition des données mockées pour le fallback
const mockMemories = [
  {
    id: 'mock1',
    username: 'User Demo',
    type: 'posted',
    videoTitle: 'Sample Video',
    videoArtist: 'Artist',
    videoYear: '2000',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This is a sample memory',
    likes: 5,
    comments: 2
  },
  {
    id: 'mock2',
    username: 'Another User',
    type: 'shared',
    videoTitle: 'Another Video',
    videoArtist: 'Another Artist',
    videoYear: '1990',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This is another sample memory',
    likes: 10,
    comments: 3
  }
];

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showProfileTabs, setShowProfileTabs] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeBtn, setActiveBtn] = useState(null);
  const [showHelpSupport, setShowHelpSupport] = useState(false);
  
  // États pour les souvenirs
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  
  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ';
  
  // Fonction pour convertir les chemins relatifs en URLs absolues
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.png';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // Sinon, préfixer avec l'URL du backend
    return `${baseUrl}${path}`;
  };

  // Gestionnaire pour le bouton "Your Playlists"
  const handlePlaylistsClick = () => {
    setActiveBtn('playlist');
    navigate('/dashboard/playlists');
  };

  // Gestionnaire pour le bouton "Help & Support"
  const handleHelpSupportClick = () => {
    setShowHelpSupport(true);
  };

  // Charger les souvenirs au chargement du composant
  useEffect(() => {
    fetchRecentMemories();
  }, []);

  // Fonction pour récupérer les souvenirs récents
  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      console.log('Chargement des souvenirs récents...');
      
      try {
        // Tentative avec la nouvelle route API
        const response = await fetch(`${baseUrl}/api/public/memories/recent`);
        
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            console.log('Souvenirs récupérés avec succès:', result.data);
            const formattedMemories = formatMemories(result.data);
            setMemories(formattedMemories);
            setMemoriesError(null);
            return;
          }
        }
        
        throw new Error('Échec avec la route principale');
      } catch (primaryError) {
        console.warn('Route principale échouée, tentative avec route de secours:', primaryError);
        
        // Fallback: essayer l'ancienne route
        const fallbackResponse = await fetch(`${baseUrl}/api/memories/recent`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          if (result.success && result.data) {
            console.log('Souvenirs récupérés avec route de secours:', result.data);
            const formattedMemories = formatMemories(result.data);
            setMemories(formattedMemories);
            setMemoriesError(null);
            return;
          }
        }
        
        // Si les deux routes échouent, utiliser les données mockées
        console.warn('Aucune route ne fonctionne, utilisation des données mockées');
        setMemories(mockMemories);
        setMemoriesError("Impossible de charger les souvenirs, affichage de données statiques");
      }
    } catch (err) {
      console.error('Erreur lors du chargement des souvenirs:', err);
      setMemories(mockMemories);
      setMemoriesError("Erreur lors du chargement des souvenirs, affichage de données statiques");
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Formater les données des souvenirs pour l'affichage
  const formatMemories = (memoriesData) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
      return mockMemories;
    }
    
    return memoriesData.map(memory => ({
      id: memory._id || memory.id || `memory-${Math.random()}`,
      username: memory.auteur ? 
        `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim() || 'Utilisateur' : 
        'Utilisateur',
      type: memory.type || 'posted',
      videoTitle: memory.video?.titre || memory.videoTitle || 'Vidéo sans titre',
      videoArtist: memory.video?.artiste || memory.videoArtist || 'Artiste inconnu',
      videoYear: memory.video?.annee || memory.videoYear || '----',
      imageUrl: getImageUrl(memory.auteur?.photo_profil || memory.imageUrl),
      content: memory.contenu || memory.content || 'Pas de contenu',
      likes: memory.likes || 0,
      comments: memory.nb_commentaires || memory.comments || 0
    }));
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

  if (showHelpSupport) {
    return <HelpAndSupport />;
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
              onClick={handlePlaylistsClick}
            >
              Your Playlists
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
              <button 
                className={styles.bottomBtn}
                onClick={handleHelpSupportClick}
              >
                Help & Support
              </button>
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
      
      {/* Partie droite dynamique avec les souvenirs */}
      <div className={styles.rightStatic}>
        <div className={styles.verticalTicker}>
          <div className={styles.tickerContent}>
            {memoriesLoading ? (
              <div className={styles.loadingContainer}>
                <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                <p>Loading memories...</p>
              </div>
            ) : memoriesError ? (
              <div className={styles.errorContainer}>
                <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
                <p>Error loading memories</p>
              </div>
            ) : (
              <>
                {memories.map((memory) => (
                  <MemoryCard 
                    key={memory.id || `memory-${Math.random()}`} 
                    memory={memory}
                    likeIcon={likeIcon}
                    commentIcon={commentIcon}
                    baseUrl={baseUrl}
                  />
                ))}
                {/* Duplication pour effet infini */}
                {memories.slice(0, 2).map((memory) => (
                  <MemoryCard 
                    key={`duplicate-${memory.id || Math.random()}`} 
                    memory={memory}
                    likeIcon={likeIcon}
                    commentIcon={commentIcon}
                    baseUrl={baseUrl}
                  />
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}