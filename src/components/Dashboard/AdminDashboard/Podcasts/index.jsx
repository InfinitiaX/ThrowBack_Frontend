import React, { useState, useEffect } from 'react';
import AddPodcastModal from './AddPodcastModal';
import EditPodcastModal from './EditPodcastModal';
import PodcastDetailModal from './PodcastDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import styles from './Podcasts.module.css';

// Catégories disponibles pour les podcasts
const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const Podcasts = () => {
  // URL de base de l'API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  
  // État des podcasts et du chargement
  const [podcasts, setPodcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // État des modals
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedPodcast, setSelectedPodcast] = useState(null);
  
  // État des filtres
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [publishFilter, setPublishFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Statistiques
  const [stats, setStats] = useState({
    total: 0,
    byCategory: [],
    bySeason: []
  });

  // Mode d'affichage (grille ou tableau)
  const [viewMode, setViewMode] = useState('grid');
  
  // Détection de la taille de l'écran pour le responsive
  const [isMobile, setIsMobile] = useState(false);

  // Détecter les changements de taille d'écran
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Passer automatiquement en mode grille sur mobile
      if (window.innerWidth <= 768 && viewMode === 'table') {
        setViewMode('grid');
      }
    };

    handleResize(); // Vérifier la taille initiale
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Récupérer les podcasts avec les filtres
  const fetchPodcasts = async () => {
    try {
      setLoading(true);
      setShowError(false);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (seasonFilter) params.append('season', seasonFilter);
      if (categoryFilter) params.append('category', categoryFilter);
      if (publishFilter) params.append('publishStatus', publishFilter);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/admin/all?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la récupération des podcasts');
      }
      
      const data = await response.json();
      setPodcasts(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
      // Si nous sommes sur la première page sans filtres, récupérer les statistiques
      if (currentPage === 1 && !seasonFilter && !categoryFilter && !publishFilter && !searchQuery) {
        fetchPodcastStats();
      }
    } catch (err) {
      setError(err.message);
      setShowError(true);
      console.error('Erreur lors de la récupération des podcasts:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Récupérer les statistiques des podcasts
  const fetchPodcastStats = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error("Token d'authentification non trouvé");
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        console.error('Erreur lors de la récupération des statistiques');
        return; // Échouer silencieusement pour les stats
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
    }
  };

  // Charger les podcasts au montage et quand les filtres changent
  useEffect(() => {
    fetchPodcasts();
  }, [seasonFilter, categoryFilter, publishFilter, currentPage]);

  // Gérer la soumission du formulaire de recherche
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPodcasts();
  };

  // Réinitialiser les filtres
  const handleReset = () => {
    setSearchQuery('');
    setSeasonFilter('');
    setCategoryFilter('');
    setPublishFilter('');
    setCurrentPage(1);
  };

  // Basculer entre les modes d'affichage (grille/tableau)
  const toggleViewMode = () => {
    if (!isMobile) { // Empêcher le mode tableau sur mobile
      setViewMode(prev => prev === 'grid' ? 'table' : 'grid');
    }
  };

  // Gérer la création d'un podcast
  const handlePodcastCreated = (newPodcast) => {
    setPodcasts(prevPodcasts => [newPodcast, ...prevPodcasts]);
    setAddModalOpen(false);
    fetchPodcastStats();
  };

  // Gérer la mise à jour d'un podcast
  const handlePodcastUpdated = (updatedPodcast) => {
    setPodcasts(prevPodcasts => 
      prevPodcasts.map(podcast => 
        podcast._id === updatedPodcast._id ? updatedPodcast : podcast
      )
    );
    setEditModalOpen(false);
    setSelectedPodcast(null);
  };

  // Gérer le clic sur supprimer
  const handleDeleteClick = (podcast) => {
    setSelectedPodcast(podcast);
    setDeleteModalOpen(true);
  };

  // Gérer la suppression d'un podcast
  const handlePodcastDeleted = (deletedId) => {
    setPodcasts(prevPodcasts => 
      prevPodcasts.filter(podcast => podcast._id !== deletedId)
    );
    setDeleteModalOpen(false);
    setSelectedPodcast(null);
    fetchPodcastStats();
  };

  // Gérer l'affichage des détails d'un podcast
  const handleViewDetails = (podcast) => {
    setSelectedPodcast(podcast);
    setDetailModalOpen(true);
  };

  // Gérer le clic sur modifier
  const handleEditClick = (podcast) => {
    setSelectedPodcast(podcast);
    setEditModalOpen(true);
  };

  // Extraire l'ID Vimeo à partir de l'URL
  const getVimeoId = (url) => {
    try {
      if (!url) return null;
      
      const vimeoUrl = new URL(url);
      
      if (vimeoUrl.hostname.includes('vimeo.com')) {
        // Format: https://vimeo.com/123456789
        const segments = vimeoUrl.pathname.split('/').filter(Boolean);
        return segments[0];
      } else if (vimeoUrl.hostname.includes('player.vimeo.com')) {
        // Format: https://player.vimeo.com/video/123456789
        const segments = vimeoUrl.pathname.split('/').filter(Boolean);
        if (segments[0] === 'video') {
          return segments[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de l\'extraction de l\'ID Vimeo:', error);
      return null;
    }
  };

  // Générer l'URL de la vignette Vimeo
  const getVimeoThumbnail = (podcast) => {
    // Si le podcast a une image de couverture personnalisée, l'utiliser
    if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
      return podcast.coverImage;
    }
    
    // Sinon, essayer d'utiliser la vignette Vimeo (note: dans un cas réel,
    // il faudrait appeler l'API Vimeo côté serveur pour obtenir les vraies vignettes)
    const vimeoId = getVimeoId(podcast.vimeoUrl);
    
    // Si nous avons un ID Vimeo, renvoyer une image de remplacement Vimeo
    if (vimeoId) {
      return `/images/vimeo-placeholder.jpg`;
    }
    
    // Renvoyer l'image par défaut
    return '/images/podcast-default.jpg';
  };

  // Formater l'épisode (EP.01)
  const formatEpisode = (episode) => {
    return `EP.${episode.toString().padStart(2, '0')}`;
  };

  // Rendre un élément de la grille de podcasts
  const renderPodcastGridItem = (podcast) => (
    <div key={podcast._id} className={styles.podcastCard}>
      <div className={styles.podcastCategory}>{podcast.category}</div>
      <div 
        className={styles.podcastThumbnail}
        onClick={() => handleViewDetails(podcast)}
      >
        <img 
          src={getVimeoThumbnail(podcast)}
          alt={podcast.title}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/podcast-default.jpg';
          }}
        />
        
        <div className={styles.podcastEpisode}>{formatEpisode(podcast.episode)}</div>
        
        {podcast.season > 1 && (
          <div className={styles.podcastSeason}>Saison {podcast.season}</div>
        )}
        
        <div className={styles.podcastDuration}>{podcast.duration} min</div>
      </div>
      
      <div className={styles.podcastInfo}>
        <h3 className={styles.podcastTitle} title={podcast.title}>
          {podcast.title}
        </h3>
        <div className={styles.podcastMeta}>
          <div className={styles.podcastHost}>
            {podcast.guestName ? `Invité: ${podcast.guestName}` : `Host: ${podcast.hostName}`}
          </div>
          <div className={styles.podcastDate}>
            {new Date(podcast.publishDate).toLocaleDateString()}
          </div>
        </div>
      </div>
      
      {!podcast.isPublished && (
        <div className={styles.unpublishedBadge}>
          <i className="fas fa-eye-slash"></i> Non publié
        </div>
      )}
      
      <div className={styles.podcastActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => handleViewDetails(podcast)}
          title="Voir les détails"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleEditClick(podcast)}
          title="Modifier le podcast"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleDeleteClick(podcast)}
          title="Supprimer le podcast"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  // Rendre une ligne du tableau de podcasts
  const renderPodcastTableRow = (podcast) => (
    <tr key={podcast._id} className={styles.podcastTableRow}>
      <td className={styles.thumbnailCell}>
        <img 
          src={getVimeoThumbnail(podcast)}
          alt={podcast.title}
          className={styles.tableThumbnail}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/podcast-default.jpg';
          }}
        />
      </td>
      <td>
        {!podcast.isPublished && (
          <span className={styles.unpublishedIcon}>
            <i className="fas fa-eye-slash"></i>
          </span>
        )}
        {podcast.title}
      </td>
      <td>{formatEpisode(podcast.episode)}</td>
      <td>Saison {podcast.season}</td>
      <td>{podcast.guestName || '-'}</td>
      <td>
        <span className={styles.categoryTag}>
          {podcast.category}
        </span>
      </td>
      <td>{podcast.duration} min</td>
      <td>{new Date(podcast.publishDate).toLocaleDateString()}</td>
      <td className={styles.tableActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => handleViewDetails(podcast)}
          title="Voir les détails"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleEditClick(podcast)}
          title="Modifier le podcast"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleDeleteClick(podcast)}
          title="Supprimer le podcast"
        >
          <i className="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Gestion des Podcasts</h1>
          <br/>
          <p>Bienvenue dans le panneau de gestion des podcasts 👋</p>
        </div>
  
        <div className={styles.headerActions}>
          {!isMobile && (
            <button 
              className={styles.viewToggleButton}
              onClick={toggleViewMode}
              title={viewMode === 'grid' ? "Passer en vue tableau" : "Passer en vue grille"}
            >
              <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
            </button>
          )}
          <button 
            className={styles.addButton}
            onClick={() => setAddModalOpen(true)}
          >
            <i className="fas fa-plus"></i> 
            <span>{isMobile ? 'Ajouter' : 'Ajouter un podcast'}</span>
          </button>
        </div>
      </div>
      
      {/* Cartes de statistiques */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-podcast"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total || 0}</div>
            <div className={styles.statLabel}>Total Podcasts</div>
          </div>
        </div>
        
        {stats.byCategory && stats.byCategory.slice(0, 2).map((cat, index) => (
          <div className={styles.statCard} key={`cat-${index}`}>
            <div className={styles.statIcon} style={{backgroundColor: getCategoryColor(cat._id)}}>
              <i className="fas fa-tag"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{cat.count}</div>
              <div className={styles.statLabel}>{cat._id}</div>
            </div>
          </div>
        ))}
        
        {stats.bySeason && stats.bySeason.slice(0, 1).map((season, index) => (
          <div className={styles.statCard} key={`season-${index}`}>
            <div className={styles.statIcon} style={{backgroundColor: '#fab005'}}>
              <i className="fas fa-bookmark"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{season.count}</div>
              <div className={styles.statLabel}>Saison {season._id}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recherche et filtres */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder={isMobile ? "Rechercher..." : "Rechercher un podcast..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </form>
          
          <div className={styles.filterButtons}>
            {(searchQuery || seasonFilter || categoryFilter || publishFilter) && (
              <button 
                onClick={handleReset} 
                className={styles.resetButton}
              >
                <i className="fas fa-times"></i> 
                <span>{isMobile ? 'Effacer' : 'Effacer les filtres'}</span>
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.filtersBottom}>
          <div className={styles.filterGroup}>
            <label htmlFor="seasonFilter" className={styles.filterLabel}>Saison:</label>
            <select
              id="seasonFilter"
              value={seasonFilter}
              onChange={(e) => {
                setSeasonFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Toutes les saisons</option>
              <option value="1">Saison 1</option>
              <option value="2">Saison 2</option>
              <option value="3">Saison 3</option>
              <option value="4">Saison 4</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="categoryFilter" className={styles.filterLabel}>Catégorie:</label>
            <select
              id="categoryFilter"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Toutes les catégories</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="publishFilter" className={styles.filterLabel}>Statut:</label>
            <select
              id="publishFilter"
              value={publishFilter}
              onChange={(e) => {
                setPublishFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">Tous les statuts</option>
              <option value="published">Publiés</option>
              <option value="unpublished">Non publiés</option>
            </select>
          </div>
          
          <div className={styles.resultCount}>
            {podcasts.length > 0 && (
              <>
                <span className={styles.countValue}>
                  {podcasts.length}
                </span> 
                <span className={styles.countLabel}>
                  {podcasts.length === 1 ? 'podcast' : 'podcasts'}
                  {!isMobile && ' trouvés'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* État de chargement */}
      {loading && podcasts.length === 0 && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div className={styles.loadingText}>Chargement des podcasts...</div>
        </div>
      )}

      {/* État d'erreur */}
      {showError && error && (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button 
            className={styles.retryButton}
            onClick={() => fetchPodcasts()}
          >
            <i className="fas fa-redo"></i> Réessayer
          </button>
        </div>
      )}

      {/* Grille ou tableau de podcasts */}
      {!loading && podcasts.length === 0 && !showError ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-podcast"></i>
          </div>
          <h3 className={styles.emptyTitle}>Aucun podcast trouvé</h3>
          <p className={styles.emptyMessage}>
            {searchQuery || seasonFilter || categoryFilter || publishFilter ? 
              'Essayez d\'ajuster vos filtres ou votre recherche' :
              'Ajoutez votre premier podcast pour commencer'
            }
          </p>
          <button 
            onClick={() => setAddModalOpen(true)}
            className={styles.addEmptyButton}
          >
            <i className="fas fa-plus"></i> Ajouter votre premier podcast
          </button>
        </div>
      ) : viewMode === 'grid' || isMobile ? (
        <div className={styles.podcastGrid}>
          {podcasts.map(podcast => renderPodcastGridItem(podcast))}
        </div>
      ) : (
        <div className={styles.podcastTableContainer}>
          <table className={styles.podcastTable}>
            <thead>
              <tr>
                <th className={styles.thumbnailHeader}>Vignette</th>
                <th>Titre</th>
                <th>Épisode</th>
                <th>Saison</th>
                <th>Invité</th>
                <th>Catégorie</th>
                <th>Durée</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {podcasts.map(podcast => renderPodcastTableRow(podcast))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {podcasts.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <i className="fas fa-chevron-left"></i> 
            {!isMobile && 'Précédent'}
          </button>
          
          <div className={styles.pageNumbers}>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button
                  key={pageNum}
                  className={`${styles.pageNumber} ${currentPage === pageNum ? styles.currentPage : ''}`}
                  onClick={() => setCurrentPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            className={styles.paginationButton}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            {!isMobile && 'Suivant'} <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddPodcastModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onPodcastCreated={handlePodcastCreated}
      />
      
      {selectedPodcast && (
        <>
          <EditPodcastModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedPodcast(null);
            }}
            podcast={selectedPodcast}
            onPodcastUpdated={handlePodcastUpdated}
          />
          
          <PodcastDetailModal
            isOpen={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedPodcast(null);
            }}
            podcast={selectedPodcast}
          />
          
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedPodcast(null);
            }}
            podcastId={selectedPodcast._id}
            podcastTitle={selectedPodcast.title}
            onPodcastDeleted={handlePodcastDeleted}
          />
        </>
      )}
    </div>
  );
};

// Fonction utilitaire pour obtenir une couleur pour une catégorie
const getCategoryColor = (category) => {
  const categoryColors = {
    'PERSONAL BRANDING': '#4c6ef5',
    'MUSIC BUSINESS': '#40c057',
    'ARTIST INTERVIEW': '#fa5252',
    'INDUSTRY INSIGHTS': '#be4bdb',
    'THROWBACK HISTORY': '#fd7e14',
    'OTHER': '#868e96'
  };
  
  return categoryColors[category] || '#868e96';
};

export default Podcasts;