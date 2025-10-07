// components/Dashboard/AdminDashboard/Playlists/PlaylistsTable.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import styles from './PlaylistsTable.module.css';

// Base URL configuration for assets
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const PlaylistsTable = ({ 
  playlists, 
  loading, 
  error, 
  currentPage, 
  totalPages, 
  totalItems,
  limit,
  onPageChange, 
  onLimitChange,
  onDelete,
  onView,
  onEdit
}) => {
  // Track images that failed to load
  const [failedImages, setFailedImages] = useState({});

  // Handle image load errors
  const handleImageError = (id, type) => {
    setFailedImages(prev => ({
      ...prev,
      [`${type}_${id}`]: true
    }));
  };

  // Build full image URL
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    return `${API_BASE_URL}${path}`;
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Visibility badge class
  const getVisibilityBadgeClass = (visibility) => {
    switch (visibility) {
      case 'PUBLIC':
        return styles.badgeSuccess;
      case 'PRIVE':
        return styles.badgeDanger;
      case 'AMIS':
        return styles.badgeWarning;
      default:
        return styles.badgeSecondary;
    }
  };

  // Type badge class
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'MANUELLE':
        return styles.badgeInfo;
      case 'AUTO_GENRE':
        return styles.badgePrimary;
      case 'AUTO_DECENNIE':
        return styles.badgeSuccess;
      case 'AUTO_ARTISTE':
        return styles.badgeWarning;
      default:
        return styles.badgeSecondary;
    }
  };

  // Pagination options
  const paginationOptions = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationOptions.push(
      <option key={i} value={i}>{i}</option>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading playlists...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  // Empty state
  if (!playlists || playlists.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <i className="fas fa-music"></i>
        <p>No playlists found</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.entriesInfo}>
          Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalItems)} of {totalItems} playlists
        </div>
        <div className={styles.paginationControls}>
          <div className={styles.limitSelector}>
            <label htmlFor="limit-select">Show</label>
            <select 
              id="limit-select"
              value={limit}
              onChange={(e) => onLimitChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>per page</span>
          </div>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.playlistsTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Owner</th>
              <th>Videos</th>
              <th>Visibility</th>
              <th>Type</th>
              <th>Created on</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {playlists.map((playlist) => (
              <tr key={playlist._id}>
                <td>
                  <div className={styles.playlistNameCell}>
                    {playlist.image_couverture && !failedImages[`playlist_${playlist._id}`] ? (
                      <img 
                        src={getImageUrl(playlist.image_couverture)}
                        alt={playlist.nom} 
                        className={styles.playlistThumbnail}
                        onError={() => handleImageError(playlist._id, 'playlist')}
                      />
                    ) : (
                      <div className={styles.playlistDefaultThumbnail}>
                        <i className="fas fa-music"></i>
                      </div>
                    )}
                    <span>{playlist.nom}</span>
                  </div>
                </td>
                <td>
                  <div className={styles.userCell}>
                    {playlist.proprietaire ? (
                      <>
                        {playlist.proprietaire.photo_profil && !failedImages[`user_${playlist.proprietaire._id}`] ? (
                          <img 
                            src={getImageUrl(playlist.proprietaire.photo_profil)}
                            alt={`${playlist.proprietaire.prenom} ${playlist.proprietaire.nom}`} 
                            className={styles.userAvatar}
                            onError={() => handleImageError(playlist.proprietaire._id, 'user')}
                          />
                        ) : (
                          <div className={styles.userDefaultAvatar}>
                            {playlist.proprietaire.prenom?.[0] || ''}{playlist.proprietaire.nom?.[0] || ''}
                          </div>
                        )}
                        <span>{playlist.proprietaire.prenom} {playlist.proprietaire.nom}</span>
                      </>
                    ) : (
                      <span className={styles.unknownUser}>Unknown user</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className={styles.videoCountBadge}>
                    {playlist.nb_videos || 0}
                  </div>
                </td>
                <td>
                  <span className={`${styles.badge} ${getVisibilityBadgeClass(playlist.visibilite)}`}>
                    {playlist.visibilite === 'PUBLIC' ? 'Public' : playlist.visibilite === 'PRIVE' ? 'Private' : playlist.visibilite === 'AMIS' ? 'Friends' : playlist.visibilite}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${getTypeBadgeClass(playlist.type_playlist)}`}>
                    {playlist.type_playlist === 'MANUELLE' ? 'Manual' : 
                     playlist.type_playlist === 'AUTO_GENRE' ? 'Auto (Genre)' :
                     playlist.type_playlist === 'AUTO_DECENNIE' ? 'Auto (Decade)' :
                     playlist.type_playlist === 'AUTO_ARTISTE' ? 'Auto (Artist)' : 
                     playlist.type_playlist}
                  </span>
                </td>
                <td>
                  {formatDate(playlist.creation_date)}
                </td>
                <td>
                  <div className={styles.actionButtons}>
                    <button 
                      className={styles.viewButton} 
                      onClick={() => onView(playlist._id)}
                      title="View playlist"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className={styles.editButton} 
                      onClick={() => onEdit(playlist._id)}
                      title="Edit playlist"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className={styles.deleteButton} 
                      onClick={() => onDelete(playlist._id)}
                      title="Delete playlist"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className={styles.paginationContainer}>
        <button 
          className={styles.paginationButton}
          disabled={currentPage === 1}
          onClick={() => onPageChange(1)}
        >
          <i className="fas fa-angle-double-left"></i>
        </button>
        <button 
          className={styles.paginationButton}
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <i className="fas fa-angle-left"></i>
        </button>
        
        <div className={styles.pageSelector}>
          <span>Page</span>
          <select 
            value={currentPage}
            onChange={(e) => onPageChange(Number(e.target.value))}
          >
            {paginationOptions}
          </select>
          <span>of {totalPages}</span>
        </div>
        
        <button 
          className={styles.paginationButton}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <i className="fas fa-angle-right"></i>
        </button>
        <button 
          className={styles.paginationButton}
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(totalPages)}
        >
          <i className="fas fa-angle-double-right"></i>
        </button>
      </div>
    </div>
  );
};

export default PlaylistsTable;
