// components/LiveThrowback/LiveStreamList.jsx
import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const LiveStreamList = ({ 
  livestreams, 
  viewMode, 
  loading, 
  filters, 
  onFilterChange, 
  onDelete, 
  onViewDetails, 
  onEditStream,
  onStartStream, 
  onEndStream,
  currentPage,
  totalPages, 
  onPageChange
}) => {
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  
  // Formater la date pour l'affichage
  const formatDate = (dateString) => {
    if (!dateString) return 'Non définie';
    try {
      const options = { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      };
      return new Date(dateString).toLocaleDateString('fr-FR', options);
    } catch (error) {
      console.error('Erreur lors du formatage de la date:', error);
      return 'Date invalide';
    }
  };
  
  // Obtenir un badge coloré pour le statut
  const getStatusBadge = (status) => {
    const statusConfig = {
      'SCHEDULED': { 
        label: 'Programmé', 
        bgColor: '#3498db', 
        icon: 'fa-calendar-alt' 
      },
      'LIVE': { 
        label: 'En direct', 
        bgColor: '#e74c3c', 
        icon: 'fa-broadcast-tower' 
      },
      'COMPLETED': { 
        label: 'Terminé', 
        bgColor: '#2ecc71', 
        icon: 'fa-check-circle' 
      },
      'CANCELLED': { 
        label: 'Annulé', 
        bgColor: '#7f8c8d', 
        icon: 'fa-times-circle' 
      }
    };

    const config = statusConfig[status] || statusConfig['SCHEDULED'];
    
    return (
      <span 
        className={styles.statusBadge} 
        style={{ backgroundColor: config.bgColor }}
      >
        <i className={`fas ${config.icon}`}></i> {config.label}
      </span>
    );
  };
  
  // Calculer le temps restant avant le début
  const getTimeUntilStart = (startTime) => {
    try {
      const now = new Date();
      const start = new Date(startTime);
      const diffMs = start - now;
      
      if (diffMs <= 0) return 'Maintenant';
      
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      
      if (diffDays > 0) {
        return `${diffDays}j ${diffHours}h`;
      } else if (diffHours > 0) {
        return `${diffHours}h ${diffMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      console.error('Erreur lors du calcul du temps restant:', error);
      return 'Calcul impossible';
    }
  };
  
  // Gérer la soumission du formulaire de recherche
  const handleSearch = (e) => {
    e.preventDefault();
    onFilterChange({
      ...filters,
      search: localSearch
    });
  };
  
  // Réinitialiser les filtres
  const resetFilters = () => {
    setLocalSearch('');
    onFilterChange({
      status: '',
      category: '',
      search: ''
    });
  };
  
  // Catégories disponibles
  const categories = [
    { value: '', label: 'Toutes les catégories' },
    { value: 'MUSIC_PERFORMANCE', label: 'Performance musicale' },
    { value: 'TALK_SHOW', label: 'Talk-show' },
    { value: 'Q_AND_A', label: 'Questions-réponses' },
    { value: 'BEHIND_THE_SCENES', label: 'Coulisses' },
    { value: 'THROWBACK_SPECIAL', label: 'Spécial ThrowBack' },
    { value: 'OTHER', label: 'Autre' }
  ];
  
  // Statuts disponibles
  const statuses = [
    { value: '', label: 'Tous les statuts' },
    { value: 'SCHEDULED', label: 'Programmé' },
    { value: 'LIVE', label: 'En direct' },
    { value: 'COMPLETED', label: 'Terminé' },
    { value: 'CANCELLED', label: 'Annulé' }
  ];
  
  // Rendre un élément de la grille
  const renderGridItem = (livestream) => (
    <div key={livestream._id} className={styles.livestreamCard}>
      <div className={styles.livestreamThumbnail}>
        <img 
          src={livestream.thumbnailUrl || '/images/live-default.jpg'} 
          alt={livestream.title}
          onError={(e) => {
            e.target.src = '/images/live-default.jpg';
          }}
        />
        
        <div className={styles.livestreamStatusOverlay}>
          {getStatusBadge(livestream.status)}
        </div>
        
        {livestream.status === 'SCHEDULED' && (
          <div className={styles.livestreamCountdown}>
            <i className="far fa-clock"></i> {getTimeUntilStart(livestream.scheduledStartTime)}
          </div>
        )}
        
        {livestream.status === 'LIVE' && (
          <div className={styles.viewCount}>
            <i className="fas fa-eye"></i> {livestream.statistics?.maxConcurrentViewers || 0}
          </div>
        )}
        
        {livestream.compilationType === 'VIDEO_COLLECTION' && (
          <div className={styles.compilationBadge}>
            <i className="fas fa-film"></i> Compilation
          </div>
        )}
      </div>
      
      <div className={styles.livestreamInfo}>
        <h3 className={styles.livestreamTitle} title={livestream.title}>
          {livestream.title}
        </h3>
        <div className={styles.livestreamMeta}>
          <div className={styles.livestreamHost}>
            {livestream.hostName}
          </div>
          <div className={styles.livestreamDate}>
            {formatDate(livestream.scheduledStartTime)}
          </div>
        </div>
        {livestream.compilationVideos && (
          <div className={styles.compilationInfo}>
            <i className="fas fa-list"></i> {livestream.compilationVideos.length} vidéos
          </div>
        )}
      </div>
      
      <div className={styles.livestreamActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => onViewDetails(livestream)}
          title="Voir les détails"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => onEditStream(livestream)}
          title="Modifier"
          disabled={livestream.status === 'COMPLETED' || livestream.status === 'CANCELLED'}
        >
          <i className="fas fa-edit"></i>
        </button>
        
        {livestream.status === 'SCHEDULED' && (
          <>
            <button 
              className={`${styles.actionButton} ${styles.startButton}`} 
              onClick={() => onStartStream(livestream._id)}
              title="Démarrer la diffusion"
            >
              <i className="fas fa-play"></i>
            </button>
            <button 
              className={`${styles.actionButton} ${styles.cancelButton}`} 
              onClick={() => onDelete(livestream)}
              title="Annuler"
            >
              <i className="fas fa-times"></i>
            </button>
          </>
        )}
        
        {livestream.status === 'LIVE' && (
          <button 
            className={`${styles.actionButton} ${styles.endButton}`} 
            onClick={() => onEndStream(livestream._id)}
            title="Terminer la diffusion"
          >
            <i className="fas fa-stop"></i>
          </button>
        )}
        
        {(livestream.status === 'SCHEDULED') && (
          <button 
            className={styles.actionButton} 
            onClick={() => onDelete(livestream)}
            title="Supprimer"
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
      </div>
    </div>
  );
  
  // Rendre une ligne du tableau
  const renderTableRow = (livestream) => (
    <tr key={livestream._id} className={styles.livestreamTableRow}>
      <td className={styles.thumbnailCell}>
        <img 
          src={livestream.thumbnailUrl || '/images/live-default.jpg'}
          alt={livestream.title}
          className={styles.tableThumbnail}
          onError={(e) => {
            e.target.src = '/images/live-default.jpg';
          }}
        />
      </td>
      <td>
        {livestream.title}
        {livestream.compilationType === 'VIDEO_COLLECTION' && (
          <span className={styles.tableCompilationBadge}>
            <i className="fas fa-film"></i> Compilation
          </span>
        )}
      </td>
      <td>{getStatusBadge(livestream.status)}</td>
      <td>{formatDate(livestream.scheduledStartTime)}</td>
      <td>{livestream.hostName}</td>
      <td className={styles.tableActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => onViewDetails(livestream)}
          title="Voir les détails"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => onEditStream(livestream)}
          title="Modifier"
          disabled={livestream.status === 'COMPLETED' || livestream.status === 'CANCELLED'}
        >
          <i className="fas fa-edit"></i>
        </button>
        
        {livestream.status === 'SCHEDULED' && (
          <>
            <button 
              className={`${styles.actionButton} ${styles.startButton}`} 
              onClick={() => onStartStream(livestream._id)}
              title="Démarrer la diffusion"
            >
              <i className="fas fa-play"></i>
            </button>
          </>
        )}
        
        {livestream.status === 'LIVE' && (
          <button 
            className={`${styles.actionButton} ${styles.endButton}`} 
            onClick={() => onEndStream(livestream._id)}
            title="Terminer la diffusion"
          >
            <i className="fas fa-stop"></i>
          </button>
        )}
        
        {(livestream.status === 'SCHEDULED') && (
          <button 
            className={styles.actionButton} 
            onClick={() => onDelete(livestream)}
            title="Supprimer"
          >
            <i className="fas fa-trash"></i>
          </button>
        )}
      </td>
    </tr>
  );
  
  return (
    <div className={styles.liveStreamListContainer}>
      {/* Filtres */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <div className={styles.searchForm}>
            <input
              type="text"
              placeholder="Rechercher..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className={styles.searchInput}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch(e)}
            />
            <button onClick={handleSearch} className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
          
          <div className={styles.filterButtons}>
            {(filters.search || filters.status || filters.category) && (
              <button 
                onClick={resetFilters} 
                className={styles.resetButton}
              >
                <i className="fas fa-times"></i> Effacer les filtres
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.filtersBottom}>
          <div className={styles.filterGroup}>
            <label htmlFor="statusFilter" className={styles.filterLabel}>Statut:</label>
            <select
              id="statusFilter"
              value={filters.status}
              onChange={(e) => onFilterChange({...filters, status: e.target.value})}
              className={styles.filterSelect}
            >
              {statuses.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="categoryFilter" className={styles.filterLabel}>Catégorie:</label>
            <select
              id="categoryFilter"
              value={filters.category}
              onChange={(e) => onFilterChange({...filters, category: e.target.value})}
              className={styles.filterSelect}
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
          
          <div className={styles.resultCount}>
            {livestreams.length > 0 && (
              <>
                <span className={styles.countValue}>{livestreams.length}</span> 
                <span className={styles.countLabel}>
                  {livestreams.length === 1 ? 'direct' : 'directs'} trouvés
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Contenu principal */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div className={styles.loadingText}>Chargement des LiveThrowbacks...</div>
        </div>
      ) : livestreams.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-broadcast-tower"></i>
          </div>
          <h3 className={styles.emptyTitle}>Aucun LiveThrowback trouvé</h3>
          <p className={styles.emptyMessage}>
            {filters.search || filters.status || filters.category ? 
              'Essayez d\'ajuster vos filtres ou votre recherche' :
              'Ajoutez votre premier LiveThrowback pour commencer'
            }
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className={styles.livestreamGrid}>
          {livestreams.map(livestream => renderGridItem(livestream))}
        </div>
      ) : (
        <div className={styles.livestreamTableContainer}>
          <table className={styles.livestreamTable}>
            <thead>
              <tr>
                <th className={styles.thumbnailHeader}>Vignette</th>
                <th>Titre</th>
                <th>Statut</th>
                <th>Date programmée</th>
                <th>Hôte</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {livestreams.map(livestream => renderTableRow(livestream))}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Pagination */}
      {livestreams.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            disabled={currentPage === 1}
            onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          >
            <i className="fas fa-chevron-left"></i> Précédent
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
                  onClick={() => onPageChange(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          
          <button
            className={styles.paginationButton}
            disabled={currentPage === totalPages}
            onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          >
            Suivant <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveStreamList;