// components/Dashboard/AdminDashboard/Playlists/PlaylistsTable.jsx
import React, { useState } from 'react';
import { format } from 'date-fns';
import styles from './PlaylistsTable.module.css';

// Configuration de l'URL de base pour les ressources
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
  // État pour suivre les images qui ont échoué à charger
  const [failedImages, setFailedImages] = useState({});

  // Gestion des erreurs de chargement d'image
  const handleImageError = (id, type) => {
    setFailedImages(prev => ({
      ...prev,
      [`${type}_${id}`]: true
    }));
  };

  // Fonction pour construire l'URL complète des images
  const getImageUrl = (path) => {
    if (!path) return null;
    
    // Si l'URL est déjà absolue (commence par http ou https)
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    
    // Si l'URL est relative, préfixer avec l'URL de base de l'API
    return `${API_BASE_URL}${path}`;
  };

  // Fonction pour formatter la date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Fonction pour obtenir la classe de badge selon la visibilité
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

  // Fonction pour obtenir la classe de badge selon le type
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

  // Générer les options de pagination
  const paginationOptions = [];
  for (let i = 1; i <= totalPages; i++) {
    paginationOptions.push(
      <option key={i} value={i}>{i}</option>
    );
  }

  // Si chargement en cours
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement des playlists...</p>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  // Si aucune playlist
  if (!playlists || playlists.length === 0) {
    return (
      <div className={styles.emptyContainer}>
        <i className="fas fa-music"></i>
        <p>Aucune playlist trouvée</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <div className={styles.tableHeader}>
        <div className={styles.entriesInfo}>
          Affichage de {((currentPage - 1) * limit) + 1} à {Math.min(currentPage * limit, totalItems)} sur {totalItems} playlists
        </div>
        <div className={styles.paginationControls}>
          <div className={styles.limitSelector}>
            <label htmlFor="limit-select">Afficher</label>
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
            <span>par page</span>
          </div>
        </div>
      </div>
      
      <div className={styles.tableWrapper}>
        <table className={styles.playlistsTable}>
          <thead>
            <tr>
              <th>Nom</th>
              <th>Propriétaire</th>
              <th>Vidéos</th>
              <th>Visibilité</th>
              <th>Type</th>
              <th>Créée le</th>
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
                      <span className={styles.unknownUser}>Utilisateur inconnu</span>
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
                    {playlist.visibilite}
                  </span>
                </td>
                <td>
                  <span className={`${styles.badge} ${getTypeBadgeClass(playlist.type_playlist)}`}>
                    {playlist.type_playlist === 'MANUELLE' ? 'Manuelle' : 
                     playlist.type_playlist === 'AUTO_GENRE' ? 'Auto (Genre)' :
                     playlist.type_playlist === 'AUTO_DECENNIE' ? 'Auto (Décennie)' :
                     playlist.type_playlist === 'AUTO_ARTISTE' ? 'Auto (Artiste)' : 
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
                      title="Voir la playlist"
                    >
                      <i className="fas fa-eye"></i>
                    </button>
                    <button 
                      className={styles.editButton} 
                      onClick={() => onEdit(playlist._id)}
                      title="Modifier la playlist"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button 
                      className={styles.deleteButton} 
                      onClick={() => onDelete(playlist._id)}
                      title="Supprimer la playlist"
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
          <span>sur {totalPages}</span>
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