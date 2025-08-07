import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment,
  faSpinner,
  faExclamationTriangle,
  faEye,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import likeIcon from '../../../../assets/icons/like.png';
import commentIcon from '../../../../assets/icons/comment.png';
import MemoryCard from './MemoryCard';
import VideoCard from './VideoCard';

// Définition des données mockées pour le fallback
const mockMemories = [
  {
    id: 'mock1',
    username: 'Martin Doe',
    type: 'posted',
    videoTitle: 'Bohemian Rhapsody',
    videoArtist: 'Queen',
    videoYear: '1975',
    imageUrl: '/images/default-avatar.jpg',
    content: "Ce morceau me rappelle mes années lycée. On l'écoutait en boucle!",
    likes: 25,
    comments: 8
  },
  {
    id: 'mock2',
    username: 'Sophie Martin',
    type: 'shared',
    videoTitle: 'Thriller',
    videoArtist: 'Michael Jackson',
    videoYear: '1982',
    imageUrl: '/images/default-avatar.jpg',
    content: "Mon premier concert! Des souvenirs incroyables avec ce tube qui a révolutionné la musique.",
    likes: 42,
    comments: 15
  },
  {
    id: 'mock3',
    username: 'Jean Dupont',
    type: 'posted',
    videoTitle: 'Like a Rolling Stone',
    videoArtist: 'Bob Dylan',
    videoYear: '1965',
    imageUrl: '/images/default-avatar.jpg',
    content: "Mon père me faisait écouter ce morceau quand j'étais petit. Aujourd'hui je comprends sa poésie.",
    likes: 18,
    comments: 5
  }
];

const mockVideos = [
  {
    _id: 'mock-video-1',
    titre: 'Bohemian Rhapsody',
    artiste: 'Queen',
    annee: '1975',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    genre: 'Rock',
    decennie: '70s',
    vues: 3452,
    likes: 278,
    type: 'music',
    description: 'Chef-d\'œuvre du rock progressif considéré comme l\'une des plus grandes chansons de tous les temps.'
  },
  {
    _id: 'mock-video-2',
    titre: 'Thriller',
    artiste: 'Michael Jackson',
    annee: '1982',
    youtubeUrl: 'https://www.youtube.com/watch?v=sOnqjkJTMaA',
    genre: 'Pop',
    decennie: '80s',
    vues: 4218,
    likes: 356,
    type: 'music',
    description: 'Chanson emblématique avec l\'un des clips les plus influents de l\'histoire de la musique.'
  },
  {
    _id: 'mock-video-3',
    titre: 'Hotel California',
    artiste: 'Eagles',
    annee: '1976',
    youtubeUrl: 'https://www.youtube.com/watch?v=EqPtz5qN7HM',
    genre: 'Rock',
    decennie: '70s',
    vues: 2873,
    likes: 201,
    type: 'music',
    description: 'Une chanson mythique des Eagles, célèbre pour son solo de guitare final.'
  },
  {
    _id: 'mock-video-4',
    titre: 'Billie Jean',
    artiste: 'Michael Jackson',
    annee: '1983',
    youtubeUrl: 'https://www.youtube.com/watch?v=Zi_XLOBDo_Y',
    genre: 'Pop',
    decennie: '80s',
    vues: 3921,
    likes: 287,
    type: 'music',
    description: 'Tube planétaire connu pour son rythme implacable et le moonwalk de Michael Jackson.'
  },
  {
    _id: 'mock-video-5',
    titre: 'Imagine',
    artiste: 'John Lennon',
    annee: '1971',
    youtubeUrl: 'https://www.youtube.com/watch?v=VOgFZfRVaww',
    genre: 'Pop',
    decennie: '70s',
    vues: 2651,
    likes: 198,
    type: 'music',
    description: 'Hymne pacifiste devenu un classique intemporel.'
  },
  {
    _id: 'mock-video-6',
    titre: 'Sweet Child O\' Mine',
    artiste: 'Guns N\' Roses',
    annee: '1987',
    youtubeUrl: 'https://www.youtube.com/watch?v=1w7OgIMMRc4',
    genre: 'Rock',
    decennie: '80s',
    vues: 3107,
    likes: 243,
    type: 'music',
    description: 'Rock emblématique des années 80 avec un riff d\'introduction mythique.'
  }
];

const ThrowbackVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);
  
  // État pour les filtres et la pagination
  const [filters, setFilters] = useState({
    type: 'music',
    genre: 'all',
    decade: 'all',
    sortBy: 'recent'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0
  });
  
  // État pour les options de filtres disponibles
  const [availableFilters, setAvailableFilters] = useState({
    availableGenres: ['Rock', 'Pop', 'Hip-Hop', 'Rap', 'R&B', 'Jazz', 'Blues', 'Electronic', 'Country', 'Folk', 'Classical', 'Reggae'],
    availableDecades: ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'],
    availableTypes: ['music', 'short', 'podcast']
  });
  
  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    // Récupérer les vidéos avec les filtres actuels
    fetchVideos();
    
    // Récupérer les souvenirs récents
    fetchRecentMemories();
  }, [filters, pagination.page]); // Recharger quand les filtres ou la page changent

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
      console.log('Tentative de récupération des vidéos avec filtres:', filters);
      
      // Construire les paramètres de requête à partir des filtres
      const queryParams = new URLSearchParams();
      if (filters.type && filters.type !== 'all') queryParams.append('type', filters.type);
      if (filters.genre && filters.genre !== 'all') queryParams.append('genre', filters.genre);
      if (filters.decade && filters.decade !== 'all') queryParams.append('decade', filters.decade);
      if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
      queryParams.append('page', pagination.page);
      queryParams.append('limit', pagination.limit);
      
      try {
        // Tentative avec la route API publique
        const response = await fetch(`${baseUrl}/api/public/videos?${queryParams.toString()}`);
        
        if (response.ok) {
          const result = await response.json();
          const videosData = result.data || result.videos || [];
          
          console.log('Vidéos récupérées avec succès:', videosData);
          
          // Mettre à jour les filtres disponibles
          if (result.filters) {
            setAvailableFilters(result.filters);
          }
          
          // Mettre à jour la pagination
          if (result.pagination) {
            setPagination(result.pagination);
          }
          
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
        const fallbackResponse = await fetch(`${baseUrl}/api/videos?${queryParams.toString()}`);
        
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
        
        // Simuler un filtrage sur les données mockées
        let filteredMockVideos = [...mockVideos];
        
        if (filters.type && filters.type !== 'all') {
          filteredMockVideos = filteredMockVideos.filter(v => v.type === filters.type);
        }
        
        if (filters.genre && filters.genre !== 'all') {
          filteredMockVideos = filteredMockVideos.filter(v => v.genre === filters.genre);
        }
        
        if (filters.decade && filters.decade !== 'all') {
          filteredMockVideos = filteredMockVideos.filter(v => v.decennie === filters.decade);
        }
        
        // Tri des résultats
        if (filters.sortBy) {
          switch (filters.sortBy) {
            case 'popular':
              filteredMockVideos.sort((a, b) => (b.vues || 0) - (a.vues || 0));
              break;
            case 'mostLiked':
              filteredMockVideos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
              break;
            case 'oldest':
              filteredMockVideos.sort((a, b) => (a.annee || 0) - (b.annee || 0));
              break;
            case 'alphabetical':
              filteredMockVideos.sort((a, b) => a.titre.localeCompare(b.titre));
              break;
            case 'recent':
            default:
              // Garder l'ordre actuel (les plus récents en premier)
              break;
          }
        }
        
        setVideos(filteredMockVideos);
        setPagination({
          ...pagination,
          total: filteredMockVideos.length,
          totalPages: Math.ceil(filteredMockVideos.length / pagination.limit)
        });
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
  
  // Gestionnaire de changement de page
  const handlePageChange = (newPage) => {
    setPagination({
      ...pagination,
      page: newPage
    });
    // Remonter en haut de la page
    window.scrollTo(0, 0);
  };
  
  // Gestionnaire de changement de filtres
  const handleFilterChange = (newFilters) => {
    console.log('Nouveaux filtres appliqués:', newFilters);
    // Réinitialiser la page à 1 lors du changement de filtres
    setPagination({
      ...pagination,
      page: 1
    });
    setFilters(newFilters);
  };
  
  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    
    // Si c'est déjà une URL absolue
    if (path.startsWith('http')) return path;
    
    // Si c'est un chemin relatif commençant par /
    if (path.startsWith('/')) {
      return `${baseUrl}${path}`;
    }
    
    // Sinon, construire l'URL complète
    return `${baseUrl}/${path}`;
  };

  // Affichage des "filtres actifs" pour informer l'utilisateur
  const renderActiveFilters = () => {
    const activeFilters = [];
    
    if (filters.type && filters.type !== 'all') {
      activeFilters.push(`Type: ${filters.type === 'music' ? 'Musique' : 
                           filters.type === 'short' ? 'Short' : 
                           filters.type === 'podcast' ? 'Podcast' : filters.type}`);
    }
    
    if (filters.genre && filters.genre !== 'all') {
      activeFilters.push(`Genre: ${filters.genre}`);
    }
    
    if (filters.decade && filters.decade !== 'all') {
      activeFilters.push(`Décennie: ${filters.decade}`);
    }
    
    if (filters.sortBy && filters.sortBy !== 'recent') {
      const sortLabel = {
        'popular': 'Plus populaires',
        'mostLiked': 'Plus aimés',
        'oldest': 'Plus anciens',
        'alphabetical': 'A-Z'
      }[filters.sortBy] || filters.sortBy;
      
      activeFilters.push(`Tri: ${sortLabel}`);
    }
    
    if (activeFilters.length === 0) {
      return null;
    }
    
    return (
      <div className={styles.activeFilters}>
        <span className={styles.activeFiltersLabel}>Filtres actifs:</span>
        {activeFilters.map((filter, index) => (
          <span key={index} className={styles.activeFilter}>{filter}</span>
        ))}
      </div>
    );
  };

  // Affichage de la pagination
  const renderPagination = () => {
    if (!pagination.totalPages || pagination.totalPages <= 1) {
      return null;
    }
    
    const pages = [];
    const maxButtons = 5; // Nombre maximum de boutons de page à afficher
    
    let startPage = Math.max(1, pagination.page - Math.floor(maxButtons / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxButtons - 1);
    
    // Ajuster startPage si on est proche de la fin
    if (endPage - startPage + 1 < maxButtons) {
      startPage = Math.max(1, endPage - maxButtons + 1);
    }
    
    // Premier bouton
    if (startPage > 1) {
      pages.push(
        <button 
          key="first" 
          onClick={() => handlePageChange(1)}
          className={styles.paginationButton}
        >
          1
        </button>
      );
      
      if (startPage > 2) {
        pages.push(<span key="ellipsis1" className={styles.paginationEllipsis}>...</span>);
      }
    }
    
    // Pages centrales
    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button 
          key={i} 
          onClick={() => handlePageChange(i)}
          className={`${styles.paginationButton} ${pagination.page === i ? styles.active : ''}`}
        >
          {i}
        </button>
      );
    }
    
    // Dernier bouton
    if (endPage < pagination.totalPages) {
      if (endPage < pagination.totalPages - 1) {
        pages.push(<span key="ellipsis2" className={styles.paginationEllipsis}>...</span>);
      }
      
      pages.push(
        <button 
          key="last" 
          onClick={() => handlePageChange(pagination.totalPages)}
          className={styles.paginationButton}
        >
          {pagination.totalPages}
        </button>
      );
    }
    
    return (
      <div className={styles.pagination}>
        <button 
          onClick={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
          className={`${styles.paginationButton} ${styles.navButton}`}
        >
          &laquo; Précédent
        </button>
        
        <div className={styles.pageButtons}>
          {pages}
        </div>
        
        <button 
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
          className={`${styles.paginationButton} ${styles.navButton}`}
        >
          Suivant &raquo;
        </button>
      </div>
    );
  };

  // Fonction pour gérer un like sur une vidéo
  const handleLikeVideo = async (videoId) => {
    try {
      // Vérifier si l'utilisateur est connecté (à implémenter selon votre système d'authentification)
      const token = localStorage.getItem('token');
      
      if (!token) {
        // Rediriger vers la page de connexion ou afficher un message
        alert("Veuillez vous connecter pour aimer cette vidéo");
        return;
      }
      
      const response = await fetch(`${baseUrl}/api/public/videos/${videoId}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Like enregistré:', result);
        
        // Mettre à jour l'état local des vidéos pour refléter le nouveau like
        setVideos(videos.map(video => {
          if (video._id === videoId) {
            return {
              ...video,
              likes: result.data.likes,
              userInteraction: {
                ...video.userInteraction,
                liked: result.data.liked,
                disliked: result.data.disliked
              }
            };
          }
          return video;
        }));
      } else {
        console.error('Erreur lors du like:', await response.text());
      }
    } catch (error) {
      console.error('Erreur lors du like:', error);
    }
  };

  // Composant pour les filtres style YouTube
  const renderYoutubeStyleFilters = () => {
    return (
      <div className={styles.youtubeStyleFilters}>
        {/* Onglets de types */}
        <div className={styles.filterTabs}>
          <button 
            className={`${styles.filterTab} ${filters.type === 'all' ? styles.active : ''}`}
            onClick={() => handleFilterChange({...filters, type: 'all'})}
          >
            Tous
          </button>
          <button 
            className={`${styles.filterTab} ${filters.type === 'music' ? styles.active : ''}`}
            onClick={() => handleFilterChange({...filters, type: 'music'})}
          >
            Musique
          </button>
          <button 
            className={`${styles.filterTab} ${filters.type === 'short' ? styles.active : ''}`}
            onClick={() => handleFilterChange({...filters, type: 'short'})}
          >
            Shorts
          </button>
          <button 
            className={`${styles.filterTab} ${filters.type === 'podcast' ? styles.active : ''}`}
            onClick={() => handleFilterChange({...filters, type: 'podcast'})}
          >
            Podcasts
          </button>
        </div>
        
        {/* Filtres horizontaux */}
        <div className={styles.horizontalFilters}>
          {/* Filtre Genre */}
          <div className={styles.filterItem}>
            <select 
              value={filters.genre} 
              onChange={(e) => handleFilterChange({...filters, genre: e.target.value})}
              className={styles.filterSelect}
            >
              <option value="all">Tous les genres</option>
              {availableFilters.availableGenres.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          {/* Filtre Décennie */}
          <div className={styles.filterItem}>
            <select 
              value={filters.decade} 
              onChange={(e) => handleFilterChange({...filters, decade: e.target.value})}
              className={styles.filterSelect}
            >
              <option value="all">Toutes les décennies</option>
              {availableFilters.availableDecades.map(decade => (
                <option key={decade} value={decade}>{decade}</option>
              ))}
            </select>
          </div>
          
          {/* Filtre Tri */}
          <div className={styles.filterItem}>
            <select 
              value={filters.sortBy} 
              onChange={(e) => handleFilterChange({...filters, sortBy: e.target.value})}
              className={styles.filterSelect}
            >
              <option value="recent">Plus récents</option>
              <option value="popular">Plus populaires</option>
              <option value="mostLiked">Plus aimés</option>
              <option value="oldest">Plus anciens</option>
              <option value="alphabetical">A-Z</option>
            </select>
          </div>
          
          {/* Bouton réinitialiser */}
          {(filters.genre !== 'all' || filters.decade !== 'all' || filters.sortBy !== 'recent') && (
            <button 
              onClick={() => handleFilterChange({
                type: filters.type,
                genre: 'all',
                decade: 'all',
                sortBy: 'recent'
              })}
              className={styles.resetButton}
            >
              <FontAwesomeIcon icon={faTimes} />
              <span>Réinitialiser les filtres</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.throwbackVideosBg}>
      {/* Filtres style YouTube au-dessus du titre */}
      {renderYoutubeStyleFilters()}
      
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>Today's Pick</h2>
          
          {/* Affichage des filtres actifs */}
          {renderActiveFilters()}
          
          {/* Message de résultats */}
          {!loading && !error && (
            <div className={styles.resultsInfo}>
              <span>{pagination.total} vidéos trouvées</span>
            </div>
          )}
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Chargement des vidéos...</p>
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
                    onLike={() => handleLikeVideo(video._id)}
                  />
                ))
              ) : (
                <div className={styles.noVideosMessage}>
                  <p>Aucune vidéo ne correspond à ces critères.</p>
                  <button 
                    onClick={() => handleFilterChange({
                      type: 'all',
                      genre: 'all',
                      decade: 'all',
                      sortBy: 'recent'
                    })}
                    className={styles.resetFiltersButton}
                  >
                    Réinitialiser les filtres
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* Pagination */}
          {renderPagination()}
        </main>
        
        <aside className={styles.rightCards}>
          <div className={styles.asideHeader}>
            <h3 className={styles.memoriesTitle}>Souvenirs récents</h3>
            <Link to="/memories" className={styles.viewAllLink}>Voir tout</Link>
          </div>
          
          <div className={styles.verticalTicker}>
            <div className={styles.tickerContent}>
              {memoriesLoading ? (
                <div className={styles.loadingContainer}>
                  <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                  <p>Chargement des souvenirs...</p>
                </div>
              ) : memoriesError ? (
                <div className={styles.errorContainer}>
                  <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
                  <p>{memoriesError}</p>
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