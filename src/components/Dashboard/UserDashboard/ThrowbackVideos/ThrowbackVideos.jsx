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
import VideoFilters from './VideoFilters';

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
  const [filteredVideos, setFilteredVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  const [filters, setFilters] = useState({
    type: 'all',
    genre: 'all',
    decade: 'all',
    search: '',
    sortBy: 'recent'
  });
  const [availableFilters, setAvailableFilters] = useState(null);
  
  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    // Récupérer les vidéos
    fetchVideos();
    
    // Récupérer les souvenirs récents
    fetchRecentMemories();
    
    // Récupérer les filtres disponibles
    fetchAvailableFilters();
  }, []);
  
  useEffect(() => {
    // Appliquer les filtres aux vidéos chaque fois que les filtres changent
    applyFilters();
  }, [filters, videos]);

  // Fonction pour récupérer les filtres disponibles (genres, décennies, etc.)
  const fetchAvailableFilters = async () => {
    try {
      // Tentative de récupération des filtres disponibles
      const response = await fetch(`${baseUrl}/api/public/filters`);
      
      if (response.ok) {
        const result = await response.json();
        setAvailableFilters(result.data);
      } else {
        // Utiliser des filtres par défaut si l'API n'est pas disponible
        setAvailableFilters({
          availableGenres: ['Rock', 'Pop', 'Hip-Hop', 'R&B', 'Jazz', 'Blues', 'Electronic'],
          availableDecades: ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'],
          availableTypes: ['music', 'short', 'podcast']
        });
      }
    } catch (err) {
      console.warn('Erreur lors de la récupération des filtres disponibles:', err);
      // Utiliser des filtres par défaut
      setAvailableFilters({
        availableGenres: ['Rock', 'Pop', 'Hip-Hop', 'R&B', 'Jazz', 'Blues', 'Electronic'],
        availableDecades: ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'],
        availableTypes: ['music', 'short', 'podcast']
      });
    }
  };

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
      
      // Construire les paramètres de requête en fonction des filtres
      let queryParams = `?`;
      if (filters.type !== 'all') queryParams += `type=${filters.type}&`;
      if (filters.genre !== 'all') queryParams += `genre=${filters.genre}&`;
      if (filters.decade !== 'all') queryParams += `decade=${filters.decade}&`;
      if (filters.search) queryParams += `search=${encodeURIComponent(filters.search)}&`;
      if (filters.sortBy) queryParams += `sortBy=${filters.sortBy}&`;
      
      try {
        // Tentative avec la route API publique
        const response = await fetch(`${baseUrl}/api/public/videos${queryParams}`);
        
        if (response.ok) {
          const result = await response.json();
          const videosData = result.data || result.videos || [];
          
          console.log('Vidéos récupérées avec succès:', videosData);
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setFilteredVideos(videosData);
            setError(null);
            return;
          }
        }
        
        throw new Error('Échec avec la route publique');
      } catch (primaryError) {
        console.warn('Route publique échouée, tentative avec route standard:', primaryError);
        
        // Fallback: essayer l'ancienne route
        const fallbackResponse = await fetch(`${baseUrl}/api/videos${queryParams}`);
        
        if (fallbackResponse.ok) {
          const result = await fallbackResponse.json();
          const videosData = result.data || result.videos || [];
          
          if (videosData.length > 0) {
            setVideos(videosData);
            setFilteredVideos(videosData);
            setError(null);
            return;
          }
        }
        
        // Si les deux routes échouent, utiliser les données mockées
        console.warn('Aucune route ne fonctionne, utilisation des données mockées');
        setVideos(mockVideos);
        setFilteredVideos(mockVideos);
        setError('Données temporaires affichées - Connexion au serveur impossible');
      }
    } catch (err) {
      console.error('Exception lors du chargement des vidéos:', err);
      setVideos(mockVideos);
      setFilteredVideos(mockVideos);
      setError(`Données temporaires affichées - ${err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Appliquer les filtres aux vidéos côté client
  const applyFilters = () => {
    if (!videos.length) return;
    
    let result = [...videos];
    
    // Filtre par type
    if (filters.type !== 'all') {
      result = result.filter(video => video.type === filters.type);
    }
    
    // Filtre par genre (si disponible dans les données)
    if (filters.genre !== 'all') {
      result = result.filter(video => {
        return video.genre === filters.genre || 
               video.genres?.includes(filters.genre);
      });
    }
    
    // Filtre par décennie
    if (filters.decade !== 'all') {
      const decadeStart = parseInt(filters.decade);
      result = result.filter(video => {
        const year = parseInt(video.annee);
        return !isNaN(year) && 
               year >= decadeStart && 
               year < decadeStart + 10;
      });
    }
    
    // Filtre par recherche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(video => 
        video.titre?.toLowerCase().includes(searchLower) || 
        video.artiste?.toLowerCase().includes(searchLower) ||
        video.description?.toLowerCase().includes(searchLower)
      );
    }
    
    // Tri
    switch(filters.sortBy) {
      case 'recent':
        result.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        break;
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
        break;
      case 'popular':
        result.sort((a, b) => (b.vues || 0) - (a.vues || 0));
        break;
      case 'mostLiked':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.titre.localeCompare(b.titre));
        break;
      default:
        break;
    }
    
    setFilteredVideos(result);
  };
  
  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    
    // Si c'est déjà une URL absolue
    if (path.startsWith('http')) return path;
    
    // Sinon, construire l'URL complète
    return `${baseUrl}${path}`;
  };
  
  // Gestionnaire de changement de filtres
  const handleFilterChange = (newFilters) => {
    console.log('Nouveaux filtres appliqués:', newFilters);
    setFilters(newFilters);
    
    // Si les filtres type, genre, decade ou sortBy changent, ou si la recherche est substantiellement différente,
    // refaire une requête au serveur pour de meilleurs résultats
    const shouldRefetch = 
      newFilters.type !== filters.type ||
      newFilters.genre !== filters.genre ||
      newFilters.decade !== filters.decade ||
      newFilters.sortBy !== filters.sortBy ||
      (newFilters.search !== filters.search && 
       (newFilters.search.length === 0 || 
        filters.search.length === 0 ||
        !newFilters.search.includes(filters.search)));
    
    if (shouldRefetch) {
      fetchVideos();
    }
  };

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>Today's Pick</h2>
          
          {/* Intégration du composant VideoFilters */}
          <VideoFilters 
            onFilterChange={handleFilterChange}
            initialFilters={filters}
            availableFilters={availableFilters}
          />
          
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
              {filteredVideos && filteredVideos.length > 0 ? (
                filteredVideos.map((video) => (
                  <VideoCard 
                    key={video._id || `video-${Math.random()}`} 
                    video={video} 
                    baseUrl={baseUrl}
                  />
                ))
              ) : (
                <div className={styles.noVideosMessage}>
                  <p>No videos found matching your criteria. Try adjusting your filters.</p>
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