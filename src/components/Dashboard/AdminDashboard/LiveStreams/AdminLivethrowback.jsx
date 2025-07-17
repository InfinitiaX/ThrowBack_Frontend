// components/LiveThrowback/AdminLiveThrowback.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './LiveThrowback.module.css';
import adminStyles from '../AdminLayout.module.css';
import DeleteConfirmModal from './DeleteConfirmModal';
import LiveStreamDetailModal from './LiveStreamDetailModal';
import LiveStreamEditModal from './LiveStreamEditModal';

// Composants internes pour la modularité
import LiveStreamList from './LiveStreamList';
import VideoUrlImport from './VideoUrlImport';
import CompilationBuilder from './CompilationBuilder';
import LiveStreamScheduler from './LiveStreamScheduler';

// Configuration des URLs
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

const AdminLiveThrowback = () => {
  // État principal
  const [liveStreams, setLiveStreams] = useState([]);
  const [selectedLiveStream, setSelectedLiveStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // États UI
  const [activeTab, setActiveTab] = useState('streams');
  const [viewMode, setViewMode] = useState('grid');
  const [createMode, setCreateMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // États de compilation
  const [selectedVideos, setSelectedVideos] = useState([]);
  
  // États de filtrage/pagination
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats et métriques
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    scheduled: 0,
    views: 0,
    categories: []
  });

  // Obtenir le token d'authentification
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Token d\'authentification non trouvé');
      setError('Vous n\'êtes pas authentifié. Veuillez vous reconnecter.');
      return null;
    }
    return token;
  };

  // Charger les diffusions et statistiques
  const fetchLiveStreams = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      // Construire la requête avec filtres
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/admin/all?${params.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la récupération des livestreams');
      }
      
      const data = await response.json();
      setLiveStreams(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
      // Charger les stats si on est sur la première page sans filtres
      if (currentPage === 1 && !filters.status && !filters.category && !filters.search) {
        fetchStats();
      }
    } catch (err) {
      console.error('Erreur fetchLiveStreams:', err);
      setError(err.message || 'Échec de la récupération des livestreams');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Charger les statistiques
  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/admin/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Erreur statistiques:', errorData.message || 'Échec de la récupération des statistiques');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // Formater les stats pour l'affichage
        const liveCount = data.data?.byStatus?.find(s => s._id === 'LIVE')?.count || 0;
        const scheduledCount = data.data?.byStatus?.find(s => s._id === 'SCHEDULED')?.count || 0;
        
        setStats({
          total: data.data?.total || 0,
          live: liveCount,
          scheduled: scheduledCount,
          views: data.data?.totalViews || 0,
          categories: data.data?.byCategory || []
        });
      }
    } catch (err) {
      console.error('Erreur lors de la récupération des statistiques:', err);
    }
  };

  // Ajouter une vidéo à la compilation
  const addVideoToCompilation = (video) => {
    // Éviter les doublons
    if (!selectedVideos.some(v => v.videoId === video.videoId)) {
      setSelectedVideos([...selectedVideos, {
        ...video,
        duration: video.duration || '0:00',
        order: selectedVideos.length + 1
      }]);
    }
  };

  // Supprimer une vidéo de la compilation
  const removeVideoFromCompilation = (videoId) => {
    const updatedVideos = selectedVideos.filter(v => v.videoId !== videoId);
    // Réorganiser les ordres
    const reorderedVideos = updatedVideos.map((video, index) => ({
      ...video,
      order: index + 1
    }));
    setSelectedVideos(reorderedVideos);
  };

  // Réorganiser les vidéos dans la compilation
  const reorderCompilation = (fromIndex, toIndex) => {
    const updatedVideos = [...selectedVideos];
    const [movedVideo] = updatedVideos.splice(fromIndex, 1);
    updatedVideos.splice(toIndex, 0, movedVideo);
    
    // Mettre à jour les ordres
    const reorderedVideos = updatedVideos.map((video, index) => ({
      ...video,
      order: index + 1
    }));
    
    setSelectedVideos(reorderedVideos);
  };

  // Créer un nouveau LiveThrowback
  const createLiveThrowback = async (schedulingData) => {
    if (selectedVideos.length === 0) {
      setError('Vous devez sélectionner au moins une vidéo pour la compilation');
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      // Préparer les données pour l'API
      const compilationData = {
        title: schedulingData.title,
        description: schedulingData.description,
        scheduledStartTime: schedulingData.startDate,
        scheduledEndTime: schedulingData.endDate,
        category: schedulingData.category,
        hostName: schedulingData.hostName || 'ThrowBack Host',
        isPublic: schedulingData.isPublic !== false,
        chatEnabled: schedulingData.chatEnabled !== false,
        // Vérifier que tags est une chaîne avant d'appeler split
        tags: typeof schedulingData.tags === 'string' && schedulingData.tags 
          ? schedulingData.tags.split(',').map(tag => tag.trim()) 
          : [],
        
        // Données spécifiques à la compilation
        compilationType: 'VIDEO_COLLECTION',
        compilationVideos: selectedVideos.map(video => ({
          sourceId: video.videoId,
          sourceType: video.source || 'YOUTUBE',
          title: video.title,
          thumbnailUrl: video.thumbnail,
          duration: video.duration,
          channel: video.channel,
          order: video.order,
          originalUrl: video.url
        })),
        
        // Configuration de lecture
        playbackConfig: {
          loop: schedulingData.loop !== false,
          autoplay: true,
          shuffle: schedulingData.shuffle || false,
          transitionEffect: schedulingData.transitionEffect || 'none'
        }
      };
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(compilationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la création du LiveThrowback');
      }
      
      const newLiveStream = await response.json();
      
      // Réinitialiser le formulaire et rafraîchir la liste
      setSelectedVideos([]);
      setCreateMode(false);
      setActiveTab('streams');
      fetchLiveStreams();
      
      return newLiveStream.data;
    } catch (err) {
      console.error('Erreur createLiveThrowback:', err);
      setError(err.message || 'Échec de la création du LiveThrowback');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un LiveThrowback
  const updateLiveStream = async (livestreamId, updatedData) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${livestreamId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la mise à jour du LiveThrowback');
      }
      
      const updatedLiveStream = await response.json();
      
      // Mettre à jour la liste
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === livestreamId ? updatedLiveStream.data : stream
        )
      );
      
      return updatedLiveStream.data;
    } catch (err) {
      console.error('Erreur updateLiveStream:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer un LiveThrowback
  const handleDelete = (livestream) => {
    setSelectedLiveStream(livestream);
    setDeleteModalOpen(true);
  };

  // Voir les détails d'un LiveThrowback
  const handleViewDetails = (livestream) => {
    setSelectedLiveStream(livestream);
    setDetailModalOpen(true);
  };

  // Modifier un LiveThrowback
  const handleEdit = (livestream) => {
    setSelectedLiveStream(livestream);
    setEditModalOpen(true);
  };

  // Confirmer la suppression
  const handleLiveStreamDeleted = (deletedId) => {
    setLiveStreams(prevStreams => 
      prevStreams.filter(stream => stream._id !== deletedId)
    );
    setDeleteModalOpen(false);
    setSelectedLiveStream(null);
    fetchStats();
  };

  // Démarrer une diffusion
  const startLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec du démarrage de la diffusion');
      }
      
      const data = await response.json();
      
      // Mettre à jour la liste
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('Erreur startLiveStream:', err);
      setError(err.message || 'Échec du démarrage de la diffusion');
    }
  };

  // Terminer une diffusion
  const endLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la fin de la diffusion');
      }
      
      const data = await response.json();
      
      // Mettre à jour la liste
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('Erreur endLiveStream:', err);
      setError(err.message || 'Échec de la fin de la diffusion');
    }
  };

  // Annuler une diffusion
  const cancelLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de l\'annulation de la diffusion');
      }
      
      const data = await response.json();
      
      // Mettre à jour la liste
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('Erreur cancelLiveStream:', err);
      setError(err.message || 'Échec de l\'annulation de la diffusion');
    }
  };

  // Charger les streams au démarrage et quand les filtres changent
  useEffect(() => {
    fetchLiveStreams();
  }, [fetchLiveStreams]);

  // Fonction pour changer de filtres
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Fonction pour fermer l'alerte d'erreur
  const dismissError = () => {
    setError('');
  };

  // Navigue entre les onglets
  const renderTabContent = () => {
    if (createMode) {
      return (
        <div className={styles.creationContainer}>
          <div className={styles.creationHeader}>
            <h2>Créer un nouveau LiveThrowback</h2>
            <button 
              className={styles.backButton}
              onClick={() => setCreateMode(false)}
            >
              <i className="fas fa-arrow-left"></i> Retour
            </button>
          </div>
          
          <div className={styles.creationLayout}>
            <div className={styles.searchSection}>
              <VideoUrlImport 
                onVideoSelect={addVideoToCompilation}
                apiBaseUrl={API_BASE_URL}
              />
            </div>
            
            <div className={styles.compilationSection}>
              <CompilationBuilder 
                selectedVideos={selectedVideos}
                onRemoveVideo={removeVideoFromCompilation}
                onReorderVideos={reorderCompilation}
              />
            </div>
            
            <div className={styles.schedulingSection}>
              <LiveStreamScheduler 
                onSchedule={createLiveThrowback}
                videosSelected={selectedVideos.length > 0}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'streams':
        return (
          <LiveStreamList 
            livestreams={liveStreams}
            viewMode={viewMode}
            loading={loading}
            filters={filters}
            onFilterChange={applyFilters}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onEditStream={handleEdit}
            onStartStream={startLiveStream}
            onEndStream={endLiveStream}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        );
      default:
        return <div>Contenu non disponible</div>;
    }
  };

  return (
    <div className={adminStyles.pageContainer}>
      <div className={adminStyles.card}>
        <div className={styles.header}>
          <div>
            <h1>LiveThrowback</h1>
            <p>Créez et gérez des compilations vidéo qui tournent en boucle pour vos utilisateurs</p>
          </div>
          
          <div className={styles.headerActions}>
            {!createMode && (
              <>
                <button 
                  className={styles.viewToggleButton}
                  onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
                  title={viewMode === 'grid' ? "Passer en vue tableau" : "Passer en vue grille"}
                >
                  <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
                </button>
                <button 
                  className={styles.addButton}
                  onClick={() => setCreateMode(true)}
                >
                  <i className="fas fa-plus"></i> Créer un LiveThrowback
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {!createMode && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-film"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total LiveThrowbacks</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#e74c3c'}}>
              <i className="fas fa-broadcast-tower"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.live}</div>
              <div className={styles.statLabel}>En Direct</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#3498db'}}>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.scheduled}</div>
              <div className={styles.statLabel}>Programmés</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#9c27b0'}}>
              <i className="fas fa-eye"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.views}</div>
              <div className={styles.statLabel}>Vues totales</div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button 
            className={styles.dismissButton}
            onClick={dismissError}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {renderTabContent()}
      
      {/* Modals */}
      {deleteModalOpen && selectedLiveStream && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestreamId={selectedLiveStream._id}
          livestreamTitle={selectedLiveStream.title}
          onLiveStreamDeleted={handleLiveStreamDeleted}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {detailModalOpen && selectedLiveStream && (
        <LiveStreamDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestream={selectedLiveStream}
          onStartStream={startLiveStream}
          onEndStream={endLiveStream}
          onCancelStream={cancelLiveStream}
          onEditStream={handleEdit}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {editModalOpen && selectedLiveStream && (
        <LiveStreamEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestream={selectedLiveStream}
          onSave={updateLiveStream}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
};

export default AdminLiveThrowback;