import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import styles from './PlaylistDetail.module.css';

// Configuration de l'URL de base pour les ressources
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const PlaylistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    visibilite: '',
    tags: ''
  });
  const [videosToAdd, setVideosToAdd] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const [collaboratorsMode, setCollaboratorsMode] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userResults, setUserResults] = useState([]);
  const [userLoading, setUserLoading] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState('LECTURE');
  
  // État pour suivre les images qui ont échoué à charger
  const [failedImages, setFailedImages] = useState({});

  // Fonction pour gérer les erreurs de chargement d'image
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

  // Charger les détails de la playlist
  useEffect(() => {
    fetchPlaylistDetails();
  }, [id]);

  const fetchPlaylistDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/playlists/${id}`);
      
      if (response.data.success) {
        setPlaylist(response.data.data);
        setFormData({
          nom: response.data.data.nom,
          description: response.data.data.description || '',
          visibilite: response.data.data.visibilite,
          tags: response.data.data.tags ? response.data.data.tags.join(', ') : ''
        });
      } else {
        setError('Erreur lors du chargement de la playlist');
        toast.error('Erreur lors du chargement de la playlist');
      }
    } catch (err) {
      console.error('Erreur fetchPlaylistDetails:', err);
      setError('Erreur lors du chargement de la playlist');
      toast.error('Erreur lors du chargement de la playlist');
    } finally {
      setLoading(false);
    }
  };

  // Rechercher des vidéos à ajouter
  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.data.success || response.data.data) {
        // Filtrer les vidéos déjà dans la playlist
        const playlistVideoIds = playlist.videos.map(v => v.video_id._id);
        const filteredResults = (response.data.data || response.data.videos || [])
          .filter(video => !playlistVideoIds.includes(video._id));
        
        setSearchResults(filteredResults);
      } else {
        toast.warning('Aucun résultat trouvé');
      }
    } catch (err) {
      console.error('Erreur searchVideos:', err);
      toast.error('Erreur lors de la recherche de vidéos');
    } finally {
      setSearchLoading(false);
    }
  };

  // Rechercher des utilisateurs pour la collaboration
  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    
    setUserLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      
      if (response.data.success || response.data.users) {
        // Filtrer les utilisateurs déjà collaborateurs
        const collaboratorIds = playlist.collaborateurs.map(c => c.utilisateur._id);
        const filteredUsers = (response.data.users || response.data.data || [])
          .filter(user => !collaboratorIds.includes(user._id) && !user._id.includes(playlist.proprietaire._id));
        
        setUserResults(filteredUsers);
      } else {
        toast.warning('Aucun utilisateur trouvé');
      }
    } catch (err) {
      console.error('Erreur searchUsers:', err);
      toast.error('Erreur lors de la recherche d\'utilisateurs');
    } finally {
      setUserLoading(false);
    }
  };

  // Gérer le changement des inputs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Sauvegarder les modifications
  const handleSaveChanges = async () => {
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];
      
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}`, {
        nom: formData.nom,
        description: formData.description,
        visibilite: formData.visibilite,
        tags: tagsArray
      });
      
      if (response.data.success) {
        toast.success('Playlist mise à jour avec succès');
        setPlaylist(response.data.data);
        setEditMode(false);
      } else {
        toast.error('Erreur lors de la mise à jour de la playlist');
      }
    } catch (err) {
      console.error('Erreur handleSaveChanges:', err);
      toast.error('Erreur lors de la mise à jour de la playlist');
    }
  };

  // Ajouter une vidéo à la playlist
  const handleAddVideo = async (videoId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/playlists/${id}/videos`, {
        videoId
      });
      
      if (response.data.success) {
        toast.success('Vidéo ajoutée à la playlist');
        fetchPlaylistDetails(); // Rafraîchir les détails
        setSearchResults(prev => prev.filter(video => video._id !== videoId));
      } else {
        toast.error('Erreur lors de l\'ajout de la vidéo');
      }
    } catch (err) {
      console.error('Erreur handleAddVideo:', err);
      toast.error('Erreur lors de l\'ajout de la vidéo');
    }
  };

  // Supprimer une vidéo de la playlist
  const handleRemoveVideo = async (videoId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vidéo de la playlist ?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/admin/playlists/${id}/videos/${videoId}`);
        
        if (response.data.success) {
          toast.success('Vidéo supprimée de la playlist');
          fetchPlaylistDetails(); // Rafraîchir les détails
        } else {
          toast.error('Erreur lors de la suppression de la vidéo');
        }
      } catch (err) {
        console.error('Erreur handleRemoveVideo:', err);
        toast.error('Erreur lors de la suppression de la vidéo');
      }
    }
  };

  // Réorganiser les vidéos
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(playlist.videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Mise à jour temporaire pour l'interface
    setPlaylist(prev => ({
      ...prev,
      videos: items
    }));
    
    // Envoyer la nouvelle organisation au serveur
    try {
      const nouveauOrdre = items.map((item, index) => ({
        videoId: item.video_id._id,
        ordre: index + 1
      }));
      
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/reorder`, {
        nouveauOrdre
      });
      
      if (response.data.success) {
        toast.success('Ordre des vidéos mis à jour');
      } else {
        toast.error('Erreur lors de la mise à jour de l\'ordre');
        fetchPlaylistDetails(); // Rafraîchir en cas d'erreur
      }
    } catch (err) {
      console.error('Erreur handleDragEnd:', err);
      toast.error('Erreur lors de la mise à jour de l\'ordre');
      fetchPlaylistDetails(); // Rafraîchir en cas d'erreur
    }
  };

  // Ajouter un collaborateur
  const handleAddCollaborator = async (userId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
        action: 'add',
        userId,
        permission: selectedPermission
      });
      
      if (response.data.success) {
        toast.success('Collaborateur ajouté avec succès');
        fetchPlaylistDetails(); // Rafraîchir les détails
        setUserResults(prev => prev.filter(user => user._id !== userId));
      } else {
        toast.error('Erreur lors de l\'ajout du collaborateur');
      }
    } catch (err) {
      console.error('Erreur handleAddCollaborator:', err);
      toast.error('Erreur lors de l\'ajout du collaborateur');
    }
  };

  // Supprimer un collaborateur
  const handleRemoveCollaborator = async (userId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce collaborateur ?')) {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
          action: 'remove',
          userId
        });
        
        if (response.data.success) {
          toast.success('Collaborateur supprimé avec succès');
          fetchPlaylistDetails(); // Rafraîchir les détails
        } else {
          toast.error('Erreur lors de la suppression du collaborateur');
        }
      } catch (err) {
        console.error('Erreur handleRemoveCollaborator:', err);
        toast.error('Erreur lors de la suppression du collaborateur');
      }
    }
  };

  // Mettre à jour les permissions d'un collaborateur
  const handleUpdateCollaboratorPermission = async (userId, permission) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
        action: 'update',
        userId,
        permission
      });
      
      if (response.data.success) {
        toast.success('Permission mise à jour avec succès');
        fetchPlaylistDetails(); // Rafraîchir les détails
      } else {
        toast.error('Erreur lors de la mise à jour de la permission');
      }
    } catch (err) {
      console.error('Erreur handleUpdateCollaboratorPermission:', err);
      toast.error('Erreur lors de la mise à jour de la permission');
    }
  };

  // Formatter la date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Date invalide';
    }
  };

  // Si chargement en cours
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement de la playlist...</p>
      </div>
    );
  }

  // Si erreur
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/playlists')}>Retour aux playlists</button>
      </div>
    );
  }

  // Si la playlist n'existe pas
  if (!playlist) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>Playlist non trouvée</p>
        <button onClick={() => navigate('/admin/playlists')}>Retour aux playlists</button>
      </div>
    );
  }

  return (
    <div className={styles.playlistDetailContainer}>
      <div className={styles.header}>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/admin/playlists')}
        >
          <i className="fas fa-arrow-left"></i>
          Retour aux playlists
        </button>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={() => setEditMode(!editMode)}
          >
            <i className={`fas ${editMode ? 'fa-times' : 'fa-edit'}`}></i>
            {editMode ? 'Annuler' : 'Modifier'}
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => {
              if (window.confirm('Êtes-vous sûr de vouloir supprimer cette playlist ? Cette action est irréversible.')) {
                axios.delete(`${API_BASE_URL}/api/admin/playlists/${id}`)
                  .then(response => {
                    if (response.data.success) {
                      toast.success('Playlist supprimée avec succès');
                      navigate('/admin/playlists');
                    } else {
                      toast.error('Erreur lors de la suppression de la playlist');
                    }
                  })
                  .catch(err => {
                    console.error('Erreur suppression playlist:', err);
                    toast.error('Erreur lors de la suppression de la playlist');
                  });
              }
            }}
          >
            <i className="fas fa-trash-alt"></i>
            Supprimer
          </button>
        </div>
      </div>

      <div className={styles.playlistInfo}>
        {/* Mode édition */}
        {editMode ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="nom">Nom de la playlist</label>
              <input
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
              />
            </div>
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="visibilite">Visibilité</label>
                <select
                  id="visibilite"
                  name="visibilite"
                  value={formData.visibilite}
                  onChange={handleInputChange}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVE">Privé</option>
                  <option value="AMIS">Amis</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tags">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  placeholder="rock, 80s, compilation..."
                />
              </div>
            </div>
            <div className={styles.formActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setEditMode(false);
                  setFormData({
                    nom: playlist.nom,
                    description: playlist.description || '',
                    visibilite: playlist.visibilite,
                    tags: playlist.tags ? playlist.tags.join(', ') : ''
                  });
                }}
              >
                Annuler
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveChanges}
              >
                Enregistrer
              </button>
            </div>
          </div>
        ) : (
          <div className={styles.infoCard}>
            <h1>{playlist.nom}</h1>
            <div className={styles.playlistMeta}>
              <div className={styles.metaItem}>
                <i className="fas fa-user"></i>
                <span>
                  Créée par {playlist.proprietaire.prenom} {playlist.proprietaire.nom}
                </span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-calendar-alt"></i>
                <span>Créée le {formatDate(playlist.creation_date)}</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-eye"></i>
                <span>
                  {playlist.visibilite === 'PUBLIC' ? 'Publique' :
                   playlist.visibilite === 'PRIVE' ? 'Privée' : 'Amis uniquement'}
                </span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-video"></i>
                <span>{playlist.videos.length} vidéos</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-play"></i>
                <span>{playlist.nb_lectures || 0} lectures</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-heart"></i>
                <span>{playlist.nb_favoris || 0} favoris</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-users"></i>
                <span>{playlist.collaborateurs.length} collaborateurs</span>
              </div>
            </div>
            {playlist.description && (
              <div className={styles.playlistDescription}>
                <p>{playlist.description}</p>
              </div>
            )}
            {playlist.tags && playlist.tags.length > 0 && (
              <div className={styles.playlistTags}>
                {playlist.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${!collaboratorsMode ? styles.active : ''}`}
            onClick={() => setCollaboratorsMode(false)}
          >
            <i className="fas fa-list"></i>
            Vidéos
          </button>
          <button 
            className={`${styles.tabButton} ${collaboratorsMode ? styles.active : ''}`}
            onClick={() => setCollaboratorsMode(true)}
          >
            <i className="fas fa-users"></i>
            Collaborateurs
          </button>
        </div>

        {/* Onglet Vidéos */}
        {!collaboratorsMode && (
          <div className={styles.videosContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Rechercher des vidéos à ajouter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchVideos()}
                />
                <button 
                  className={styles.searchButton}
                  onClick={searchVideos}
                  disabled={searchLoading}
                >
                  {searchLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-search"></i>
                  )}
                </button>
              </div>
            </div>

            {/* Résultats de recherche */}
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <h3>Résultats de recherche</h3>
                <div className={styles.resultsGrid}>
                  {searchResults.map((video) => (
                    <div key={video._id} className={styles.videoCard}>
                      <div className={styles.videoThumbnail}>
                        {video.youtubeUrl.includes('youtube.com') || video.youtubeUrl.includes('youtu.be') ? (
                          <img
                            src={`https://img.youtube.com/vi/${video.youtubeUrl.split('v=')[1] || video.youtubeUrl.split('/').pop()}/mqdefault.jpg`}
                            alt={video.titre}
                            onError={() => handleImageError(video._id, 'videoThumb')}
                          />
                        ) : (
                          <div className={styles.videoPlaceholder}>
                            <i className="fas fa-video"></i>
                          </div>
                        )}
                        <span className={styles.videoDuration}>
                          {Math.floor(video.duree / 60)}:{(video.duree % 60).toString().padStart(2, '0')}
                        </span>
                      </div>
                      <div className={styles.videoInfo}>
                        <h4>{video.titre}</h4>
                        <p>{video.artiste || 'Artiste inconnu'}</p>
                      </div>
                      <button 
                        className={styles.addButton}
                        onClick={() => handleAddVideo(video._id)}
                      >
                        <i className="fas fa-plus"></i>
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des vidéos de la playlist */}
            <div className={styles.playlistVideos}>
              <h3>Vidéos dans la playlist</h3>
              {playlist.videos.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-film"></i>
                  <p>Aucune vidéo dans cette playlist</p>
                </div>
              ) : (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="playlist-videos">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className={styles.videosList}
                      >
                        {playlist.videos.map((item, index) => (
                          <Draggable 
                            key={item.video_id._id} 
                            draggableId={item.video_id._id} 
                            index={index}
                          >
                            {(provided) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={styles.videoItem}
                              >
                                <div className={styles.dragHandle}>
                                  <i className="fas fa-grip-lines"></i>
                                </div>
                                <div className={styles.videoPosition}>
                                  {index + 1}
                                </div>
                                <div className={styles.videoThumbnail}>
                                  {item.video_id.youtubeUrl.includes('youtube.com') || item.video_id.youtubeUrl.includes('youtu.be') ? (
                                    <img
                                      src={`https://img.youtube.com/vi/${item.video_id.youtubeUrl.split('v=')[1] || item.video_id.youtubeUrl.split('/').pop()}/mqdefault.jpg`}
                                      alt={item.video_id.titre}
                                      onError={() => handleImageError(item.video_id._id, 'playlistVideoThumb')}
                                    />
                                  ) : (
                                    <div className={styles.videoPlaceholder}>
                                      <i className="fas fa-video"></i>
                                    </div>
                                  )}
                                </div>
                                <div className={styles.videoInfo}>
                                  <h4>{item.video_id.titre}</h4>
                                  <p>{item.video_id.artiste || 'Artiste inconnu'}</p>
                                  <div className={styles.videoMeta}>
                                    <span className={styles.videoDuration}>
                                      <i className="fas fa-clock"></i>
                                      {Math.floor(item.video_id.duree / 60)}:{(item.video_id.duree % 60).toString().padStart(2, '0')}
                                    </span>
                                    <span className={styles.videoType}>
                                      <i className="fas fa-tag"></i>
                                      {item.video_id.type === 'music' ? 'Musique' : 
                                       item.video_id.type === 'short' ? 'Short' : 
                                       item.video_id.type === 'podcast' ? 'Podcast' : 
                                       item.video_id.type}
                                    </span>
                                    {item.ajoute_par && (
                                      <span className={styles.videoAddedBy}>
                                        <i className="fas fa-user"></i>
                                        Ajouté par {item.ajoute_par.prenom} {item.ajoute_par.nom}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <button 
                                  className={styles.removeButton}
                                  onClick={() => handleRemoveVideo(item.video_id._id)}
                                >
                                  <i className="fas fa-trash-alt"></i>
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              )}
            </div>
          </div>
        )}

        {/* Onglet Collaborateurs */}
        {collaboratorsMode && (
          <div className={styles.collaboratorsContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Rechercher des utilisateurs..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchUsers()}
                />
                <button 
                  className={styles.searchButton}
                  onClick={searchUsers}
                  disabled={userLoading}
                >
                  {userLoading ? (
                    <i className="fas fa-spinner fa-spin"></i>
                  ) : (
                    <i className="fas fa-search"></i>
                  )}
                </button>
              </div>
              <div className={styles.permissionSelector}>
                <label htmlFor="permission-select">Permission:</label>
                <select
                  id="permission-select"
                  value={selectedPermission}
                  onChange={(e) => setSelectedPermission(e.target.value)}
                >
                  <option value="LECTURE">Lecture</option>
                  <option value="AJOUT">Ajout de vidéos</option>
                  <option value="MODIFICATION">Modification complète</option>
                </select>
              </div>
            </div>

            {/* Résultats de recherche utilisateurs */}
            {userResults.length > 0 && (
              <div className={styles.userResults}>
                <h3>Résultats de recherche</h3>
                <div className={styles.userGrid}>
                  {userResults.map((user) => (
                    <div key={user._id} className={styles.userCard}>
                      <div className={styles.userAvatar}>
                        {user.photo_profil && !failedImages[`userResult_${user._id}`] ? (
                          <img 
                            src={getImageUrl(user.photo_profil)} 
                            alt={`${user.prenom} ${user.nom}`} 
                            onError={() => handleImageError(user._id, 'userResult')}
                          />
                        ) : (
                          <div className={styles.userInitials}>
                            {user.prenom?.[0] || ''}{user.nom?.[0] || ''}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4>{user.prenom} {user.nom}</h4>
                        <p>{user.email}</p>
                      </div>
                      <button 
                        className={styles.addButton}
                        onClick={() => handleAddCollaborator(user._id)}
                      >
                        <i className="fas fa-plus"></i>
                        Ajouter
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Liste des collaborateurs */}
            <div className={styles.collaboratorsList}>
              <h3>Collaborateurs</h3>
              <div className={styles.ownerCard}>
                <div className={styles.userAvatar}>
                  {playlist.proprietaire.photo_profil && !failedImages[`owner_${playlist.proprietaire._id}`] ? (
                    <img 
                      src={getImageUrl(playlist.proprietaire.photo_profil)} 
                      alt={`${playlist.proprietaire.prenom} ${playlist.proprietaire.nom}`} 
                      onError={() => handleImageError(playlist.proprietaire._id, 'owner')}
                    />
                  ) : (
                    <div className={styles.userInitials}>
                      {playlist.proprietaire.prenom?.[0] || ''}{playlist.proprietaire.nom?.[0] || ''}
                    </div>
                  )}
                </div>
                <div className={styles.userInfo}>
                  <h4>{playlist.proprietaire.prenom} {playlist.proprietaire.nom}</h4>
                  <p>{playlist.proprietaire.email}</p>
                </div>
                <div className={styles.ownerBadge}>
                  <i className="fas fa-crown"></i>
                  Propriétaire
                </div>
              </div>

              {playlist.collaborateurs.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-users"></i>
                  <p>Aucun collaborateur</p>
                </div>
              ) : (
                <div className={styles.collaboratorsGrid}>
                  {playlist.collaborateurs.map((collab) => (
                    <div key={collab.utilisateur._id} className={styles.collaboratorCard}>
                      <div className={styles.userAvatar}>
                        {collab.utilisateur.photo_profil && !failedImages[`collab_${collab.utilisateur._id}`] ? (
                          <img 
                            src={getImageUrl(collab.utilisateur.photo_profil)} 
                            alt={`${collab.utilisateur.prenom} ${collab.utilisateur.nom}`}
                            onError={() => handleImageError(collab.utilisateur._id, 'collab')}
                          />
                        ) : (
                          <div className={styles.userInitials}>
                            {collab.utilisateur.prenom?.[0] || ''}{collab.utilisateur.nom?.[0] || ''}
                          </div>
                        )}
                      </div>
                      <div className={styles.userInfo}>
                        <h4>{collab.utilisateur.prenom} {collab.utilisateur.nom}</h4>
                        <p>{collab.utilisateur.email}</p>
                      </div>
                      <div className={styles.collaboratorControls}>
                        <select
                          value={collab.permissions}
                          onChange={(e) => handleUpdateCollaboratorPermission(collab.utilisateur._id, e.target.value)}
                        >
                          <option value="LECTURE">Lecture</option>
                          <option value="AJOUT">Ajout de vidéos</option>
                          <option value="MODIFICATION">Modification complète</option>
                        </select>
                        <button 
                          className={styles.removeButton}
                          onClick={() => handleRemoveCollaborator(collab.utilisateur._id)}
                        >
                          <i className="fas fa-trash-alt"></i>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaylistDetail;