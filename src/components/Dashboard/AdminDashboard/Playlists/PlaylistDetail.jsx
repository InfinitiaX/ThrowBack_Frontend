import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import styles from './PlaylistDetail.module.css';

// Base URL configuration for assets
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

  // Load playlist details
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
        setError('Error loading playlist');
        toast.error('Error loading playlist');
      }
    } catch (err) {
      console.error('Error fetchPlaylistDetails:', err);
      setError('Error loading playlist');
      toast.error('Error loading playlist');
    } finally {
      setLoading(false);
    }
  };

  // Search videos to add
  const searchVideos = async () => {
    if (!searchQuery.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/videos/search?q=${encodeURIComponent(searchQuery)}`);
      
      if (response.data.success || response.data.data) {
        const playlistVideoIds = playlist.videos.map(v => v.video_id._id);
        const filteredResults = (response.data.data || response.data.videos || [])
          .filter(video => !playlistVideoIds.includes(video._id));
        
        setSearchResults(filteredResults);
      } else {
        toast.warning('No results found');
      }
    } catch (err) {
      console.error('Error searchVideos:', err);
      toast.error('Error while searching videos');
    } finally {
      setSearchLoading(false);
    }
  };

  // Search users for collaboration
  const searchUsers = async () => {
    if (!userSearch.trim()) return;
    
    setUserLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/admin/users?search=${encodeURIComponent(userSearch)}`);
      
      if (response.data.success || response.data.users) {
        const collaboratorIds = playlist.collaborateurs.map(c => c.utilisateur._id);
        const filteredUsers = (response.data.users || response.data.data || [])
          .filter(user => !collaboratorIds.includes(user._id) && !user._id.includes(playlist.proprietaire._id));
        
        setUserResults(filteredUsers);
      } else {
        toast.warning('No users found');
      }
    } catch (err) {
      console.error('Error searchUsers:', err);
      toast.error('Error while searching users');
    } finally {
      setUserLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes
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
        toast.success('Playlist updated successfully');
        setPlaylist(response.data.data);
        setEditMode(false);
      } else {
        toast.error('Error while updating playlist');
      }
    } catch (err) {
      console.error('Error handleSaveChanges:', err);
      toast.error('Error while updating playlist');
    }
  };

  // Add a video to playlist
  const handleAddVideo = async (videoId) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/admin/playlists/${id}/videos`, {
        videoId
      });
      
      if (response.data.success) {
        toast.success('Video added to playlist');
        fetchPlaylistDetails();
        setSearchResults(prev => prev.filter(video => video._id !== videoId));
      } else {
        toast.error('Error adding video');
      }
    } catch (err) {
      console.error('Error handleAddVideo:', err);
      toast.error('Error adding video');
    }
  };

  // Remove a video from playlist
  const handleRemoveVideo = async (videoId) => {
    if (window.confirm('Are you sure you want to remove this video from the playlist?')) {
      try {
        const response = await axios.delete(`${API_BASE_URL}/api/admin/playlists/${id}/videos/${videoId}`);
        
        if (response.data.success) {
          toast.success('Video removed from playlist');
          fetchPlaylistDetails();
        } else {
          toast.error('Error removing video');
        }
      } catch (err) {
        console.error('Error handleRemoveVideo:', err);
        toast.error('Error removing video');
      }
    }
  };

  // Reorder videos
  const handleDragEnd = async (result) => {
    if (!result.destination) return;
    
    const items = Array.from(playlist.videos);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setPlaylist(prev => ({
      ...prev,
      videos: items
    }));
    
    try {
      const nouveauOrdre = items.map((item, index) => ({
        videoId: item.video_id._id,
        ordre: index + 1
      }));
      
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/reorder`, {
        nouveauOrdre
      });
      
      if (response.data.success) {
        toast.success('Video order updated');
      } else {
        toast.error('Error updating order');
        fetchPlaylistDetails();
      }
    } catch (err) {
      console.error('Error handleDragEnd:', err);
      toast.error('Error updating order');
      fetchPlaylistDetails();
    }
  };

  // Add collaborator
  const handleAddCollaborator = async (userId) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
        action: 'add',
        userId,
        permission: selectedPermission
      });
      
      if (response.data.success) {
        toast.success('Collaborator added successfully');
        fetchPlaylistDetails();
        setUserResults(prev => prev.filter(user => user._id !== userId));
      } else {
        toast.error('Error adding collaborator');
      }
    } catch (err) {
      console.error('Error handleAddCollaborator:', err);
      toast.error('Error adding collaborator');
    }
  };

  // Remove collaborator
  const handleRemoveCollaborator = async (userId) => {
    if (window.confirm('Are you sure you want to remove this collaborator?')) {
      try {
        const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
          action: 'remove',
          userId
        });
        
        if (response.data.success) {
          toast.success('Collaborator removed successfully');
          fetchPlaylistDetails();
        } else {
          toast.error('Error removing collaborator');
        }
      } catch (err) {
        console.error('Error handleRemoveCollaborator:', err);
        toast.error('Error removing collaborator');
      }
    }
  };

  // Update collaborator permission
  const handleUpdateCollaboratorPermission = async (userId, permission) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/api/admin/playlists/${id}/collaborateurs`, {
        action: 'update',
        userId,
        permission
      });
      
      if (response.data.success) {
        toast.success('Permission updated successfully');
        fetchPlaylistDetails();
      } else {
        toast.error('Error updating permission');
      }
    } catch (err) {
      console.error('Error handleUpdateCollaboratorPermission:', err);
      toast.error('Error updating permission');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading playlist...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>{error}</p>
        <button onClick={() => navigate('/admin/playlists')}>Back to playlists</button>
      </div>
    );
  }

  // Not found
  if (!playlist) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>Playlist not found</p>
        <button onClick={() => navigate('/admin/playlists')}>Back to playlists</button>
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
          Back to playlists
        </button>
        <div className={styles.actions}>
          <button 
            className={`${styles.actionButton} ${styles.editButton}`}
            onClick={() => setEditMode(!editMode)}
          >
            <i className={`fas ${editMode ? 'fa-times' : 'fa-edit'}`}></i>
            {editMode ? 'Cancel' : 'Edit'}
          </button>
          <button 
            className={`${styles.actionButton} ${styles.deleteButton}`}
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this playlist? This action is irreversible.')) {
                axios.delete(`${API_BASE_URL}/api/admin/playlists/${id}`)
                  .then(response => {
                    if (response.data.success) {
                      toast.success('Playlist deleted successfully');
                      navigate('/admin/playlists');
                    } else {
                      toast.error('Error deleting playlist');
                    }
                  })
                  .catch(err => {
                    console.error('Error deleting playlist:', err);
                    toast.error('Error deleting playlist');
                  });
              }
            }}
          >
            <i className="fas fa-trash-alt"></i>
            Delete
          </button>
        </div>
      </div>

      <div className={styles.playlistInfo}>
        {/* Edit mode */}
        {editMode ? (
          <div className={styles.editForm}>
            <div className={styles.formGroup}>
              <label htmlFor="nom">Playlist name</label>
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
                <label htmlFor="visibilite">Visibility</label>
                <select
                  id="visibilite"
                  name="visibilite"
                  value={formData.visibilite}
                  onChange={handleInputChange}
                >
                  <option value="PUBLIC">Public</option>
                  <option value="PRIVE">Private</option>
                  <option value="AMIS">Friends</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tags">Tags (comma separated)</label>
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
                Cancel
              </button>
              <button 
                className={styles.saveButton}
                onClick={handleSaveChanges}
              >
                Save
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
                  Created by {playlist.proprietaire.prenom} {playlist.proprietaire.nom}
                </span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-calendar-alt"></i>
                <span>Created on {formatDate(playlist.creation_date)}</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-eye"></i>
                <span>
                  {playlist.visibilite === 'PUBLIC' ? 'Public' :
                   playlist.visibilite === 'PRIVE' ? 'Private' : 'Friends only'}
                </span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-video"></i>
                <span>{playlist.videos.length} videos</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-play"></i>
                <span>{playlist.nb_lectures || 0} plays</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-heart"></i>
                <span>{playlist.nb_favoris || 0} favorites</span>
              </div>
              <div className={styles.metaItem}>
                <i className="fas fa-users"></i>
                <span>{playlist.collaborateurs.length} collaborators</span>
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
            Videos
          </button>
          <button 
            className={`${styles.tabButton} ${collaboratorsMode ? styles.active : ''}`}
            onClick={() => setCollaboratorsMode(true)}
          >
            <i className="fas fa-users"></i>
            Collaborators
          </button>
        </div>

        {/* Videos tab */}
        {!collaboratorsMode && (
          <div className={styles.videosContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search videos to add..."
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

            {/* Search results */}
            {searchResults.length > 0 && (
              <div className={styles.searchResults}>
                <h3>Search results</h3>
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
                        <p>{video.artiste || 'Unknown artist'}</p>
                      </div>
                      <button 
                        className={styles.addButton}
                        onClick={() => handleAddVideo(video._id)}
                      >
                        <i className="fas fa-plus"></i>
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Playlist videos */}
            <div className={styles.playlistVideos}>
              <h3>Videos in the playlist</h3>
              {playlist.videos.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-film"></i>
                  <p>No videos in this playlist</p>
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
                                  <p>{item.video_id.artiste || 'Unknown artist'}</p>
                                  <div className={styles.videoMeta}>
                                    <span className={styles.videoDuration}>
                                      <i className="fas fa-clock"></i>
                                      {Math.floor(item.video_id.duree / 60)}:{(item.video_id.duree % 60).toString().padStart(2, '0')}
                                    </span>
                                    <span className={styles.videoType}>
                                      <i className="fas fa-tag"></i>
                                      {item.video_id.type === 'music' ? 'Music' : 
                                       item.video_id.type === 'short' ? 'Short' : 
                                       item.video_id.type === 'podcast' ? 'Podcast' : 
                                       item.video_id.type}
                                    </span>
                                    {item.ajoute_par && (
                                      <span className={styles.videoAddedBy}>
                                        <i className="fas fa-user"></i>
                                        Added by {item.ajoute_par.prenom} {item.ajoute_par.nom}
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

        {/* Collaborators tab */}
        {collaboratorsMode && (
          <div className={styles.collaboratorsContainer}>
            <div className={styles.searchContainer}>
              <div className={styles.searchBox}>
                <input
                  type="text"
                  placeholder="Search users..."
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
                  <option value="LECTURE">Read</option>
                  <option value="AJOUT">Add videos</option>
                  <option value="MODIFICATION">Full edit</option>
                </select>
              </div>
            </div>

            {/* User search results */}
            {userResults.length > 0 && (
              <div className={styles.userResults}>
                <h3>Search results</h3>
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
                        Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Collaborators list */}
            <div className={styles.collaboratorsList}>
              <h3>Collaborators</h3>
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
                  Owner
                </div>
              </div>

              {playlist.collaborateurs.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-users"></i>
                  <p>No collaborator</p>
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
                          <option value="LECTURE">Read</option>
                          <option value="AJOUT">Add videos</option>
                          <option value="MODIFICATION">Full edit</option>
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
