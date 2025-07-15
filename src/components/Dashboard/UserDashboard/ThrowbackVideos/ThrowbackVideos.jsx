import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment,
  faSpinner,
  faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons';
import likeIcon from '../../../../assets/icons/like.png';
import commentIcon from '../../../../assets/icons/comment.png';
import MemoryCard from './MemoryCard';
import VideoCard from './VideoCard';

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

const mockVideos = [
  {
    _id: 'mock-video-1',
    titre: 'Bohemian Rhapsody',
    artiste: 'Queen',
    annee: '1975',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ'
  },
  {
    _id: 'mock-video-2',
    titre: 'Thriller',
    artiste: 'Michael Jackson',
    annee: '1982',
    youtubeUrl: 'https://www.youtube.com/watch?v=sOnqjkJTMaA'
  },
  {
    _id: 'mock-video-3',
    titre: 'Hotel California',
    artiste: 'Eagles',
    annee: '1976',
    youtubeUrl: 'https://www.youtube.com/watch?v=EqPtz5qN7HM'
  }
];

const ThrowbackVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  
  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    // Récupérer les vidéos
    fetchVideos();
    
    // Récupérer les souvenirs récents
    fetchRecentMemories();
  }, []);

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

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Tentative de récupération des vidéos...');
      
      try {
        // Tentative avec la route API publique
        const response = await fetch(`${baseUrl}/api/public/videos?type=music`);
        
        if (response.ok) {
          const result = await response.json();
          const videosData = result.data || result.videos || [];
          
          console.log('Vidéos récupérées avec succès:', videosData);
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setError(null);
            return;
          }
        }
        
        throw new Error('Échec avec la route publique');
      } catch (primaryError) {
        console.warn('Route publique échouée, tentative avec route standard:', primaryError);
        
        // Fallback: essayer l'ancienne route
        const fallbackResponse = await fetch(`${baseUrl}/api/videos?type=music`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          const videosData = result.data || result.videos || [];
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setError(null);
            return;
          }
        }
        
        // Si les deux routes échouent, utiliser les données mockées
        console.warn('Aucune route ne fonctionne, utilisation des données mockées');
        setVideos(mockVideos);
        setError('Données temporaires affichées - Connexion au serveur impossible');
      }
    } catch (err) {
      console.error('Exception lors du chargement des vidéos:', err);
      setVideos(mockVideos);
      setError(`Données temporaires affichées - ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    
    // Si c'est déjà une URL absolue
    if (path.startsWith('http')) return path;
    
    // Sinon, construire l'URL complète
    return `${baseUrl}${path}`;
  };

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>Today's Pick</h2>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading videos...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          ) : (
            <div className={styles.videosGrid}>
              {videos && videos.length > 0 ? (
                videos.map((video) => (
                  <VideoCard 
                    key={video._id || `video-${Math.random()}`} 
                    video={video} 
                    baseUrl={baseUrl}
                  />
                ))
              ) : (
                <div className={styles.noVideosMessage}>
                  <p>No videos available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </main>
        
        <aside className={styles.rightCards}>
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
        </aside>
      </div>
    </div>
  );
};

export default ThrowbackVideos;