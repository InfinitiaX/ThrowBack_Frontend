import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faArrowLeft, faSave, faGlobe, faLock, faUserFriends, faMusic,
  faSearch, faPlus, faTimes, faImage, faTrash, faExclamationCircle
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { videoAPI } from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Toast from '../../../Common/Toast';
import styles from './PlaylistForm.module.css';

const PlaylistForm = () => {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { user } = useAuth();

  // Form states
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    visibilite: 'PUBLIC',
    image_couverture: ''
  });

  // Video management states
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Form management states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Fonction utilitaire pour gérer les URLs des images et vidéos
  const getMediaUrl = (mediaPath) => {
    if (!mediaPath) return "";
    if (mediaPath.startsWith('http')) return mediaPath;
    const baseUrl = process.env.REACT_APP_API_URL || '';
    if (!mediaPath.startsWith('/')) {
      return `${baseUrl}/${mediaPath}`;
    }
    return `${baseUrl}${mediaPath}`;
  };

  // Fonction pour obtenir les initiales d'un artiste
  const getArtistInitials = (artist) => {
    if (!artist) return 'A';
    return artist.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2);
  };

  // Générer une couleur de fond basée sur le nom de l'artiste
  const getArtistColor = (artist) => {
    const colors = [
      '#4a6fa5', '#6fb98f', '#2c786c', '#f25f5c', '#a16ae8', 
      '#ffa600', '#58508d', '#bc5090', '#ff6361', '#003f5c'
    ];
    if (!artist) return colors[0];
    const sum = artist.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // Load data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const videosData = await videoAPI.getAllVideos();
        setAvailableVideos(videosData);

        if (isEditing) {
          const playlistData = await playlistAPI.getPlaylistById(id);
          if (!playlistData) { setError('Playlist not found'); setLoading(false); return; }

          // Vérification correcte du propriétaire
          const ownerId = playlistData.proprietaire._id || playlistData.proprietaire;
          const userId = user?.id || user?._id;
          const isOwner = ownerId && userId && (ownerId.toString() === userId.toString());
          if (!isOwner) { setError("You do not have permission to edit this playlist"); setLoading(false); return; }

          setFormData({
            nom: playlistData.nom || '',
            description: playlistData.description || '',
            visibilite: playlistData.visibilite || 'PUBLIC',
            image_couverture: playlistData.image_couverture || ''
          });

          if (playlistData.videos?.length) {
            const sorted = [...playlistData.videos].sort((a, b) => a.ordre - b.ordre);
            setPlaylistVideos(sorted.map(item => item.video_id));
          }
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('An error occurred while loading data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, user?.id, user?._id]);

  // Filter available videos based on search
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSearchResults([]);
      return;
    }
    const term = searchTerm.toLowerCase();
    const results = availableVideos.filter(video => 
      (video.titre && video.titre.toLowerCase().includes(term)) ||
      (video.artiste && video.artiste.toLowerCase().includes(term))
    );
    setSearchResults(results);
  }, [searchTerm, availableVideos]);

  // Handle form field changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (formErrors[name]) setFormErrors({ ...formErrors, [name]: null });
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
  };

  const handleAddVideo = (video) => {
    if (!playlistVideos.some(v => v._id === video._id)) {
      setPlaylistVideos([...playlistVideos, video]);
    }
    setSearchTerm('');
    setShowSearchResults(false);
  };

  const handleRemoveVideo = (videoId) => {
    setPlaylistVideos(playlistVideos.filter(video => video._id !== videoId));
  };

  const handleDragStart = (e, index) => { e.dataTransfer.setData('index', index.toString()); };
  const handleDragOver = (e) => { e.preventDefault(); };
  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    if (sourceIndex === targetIndex) return;
    const videos = [...playlistVideos];
    const [removed] = videos.splice(sourceIndex, 1);
    videos.splice(targetIndex, 0, removed);
    setPlaylistVideos(videos);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFormErrors({ ...formErrors, image_couverture: 'The file must be an image' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({ ...formErrors, image_couverture: "The image must not exceed 2MB" });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => { setFormData({ ...formData, image_couverture: event.target.result }); };
    reader.readAsDataURL(file);
    if (formErrors.image_couverture) setFormErrors({ ...formErrors, image_couverture: null });
  };

  const handleRemoveImage = () => { setFormData({ ...formData, image_couverture: '' }); };

  const validateForm = () => {
    const errors = {};
    if (!formData.nom || formData.nom.trim() === '') errors.nom = 'Playlist name is required';
    if (formData.nom && formData.nom.length > 100) errors.nom = 'The playlist name must not exceed 100 characters';
    if (formData.description && formData.description.length > 500) errors.description = 'The description must not exceed 500 characters';
    if (!formData.visibilite) errors.visibilite = 'Visibility is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSaving(true);
      const playlistData = {
        ...formData,
        videos: playlistVideos.map((video, index) => ({ videoId: video._id, ordre: index + 1 }))
      };

      let response;
      if (isEditing) {
        response = await playlistAPI.updatePlaylist(id, playlistData);
      } else {
        response = await playlistAPI.createPlaylist(playlistData);
      }

      setSaving(false);
      setToastMessage(isEditing ? 'Playlist updated successfully' : 'Playlist created successfully');
      setToastType('success');
      setShowToast(true);

      setTimeout(() => {
        // ✅ Extraire l’ID quel que soit le format de la réponse et éviter /undefined
        const newId = isEditing
          ? id
          : (response?._id ||
             response?.data?._id ||
             response?.playlist?._id ||
             response?.id);

        if (!newId) {
          setToastMessage("Creation successful but unable to retrieve the playlist ID.");
          setToastType('error');
          setShowToast(true);
          return;
        }
        navigate(`/dashboard/playlists/${newId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving playlist:', err);
      setSaving(false);
      setToastMessage('An error occurred while saving the playlist');
      setToastType('error');
      setShowToast(true);
    }
  };

  const handleCancel = () => {
    navigate(isEditing ? `/dashboard/playlists/${id}` : '/dashboard/playlists');
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => navigate('/dashboard/playlists')}
        >
          Back to playlist
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playlistFormContainer}>
      {/* Header with title and action buttons */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditing ? 'Edit playlist' : 'Create playlist'}
        </h1>
        
        <div className={styles.headerActions}>
          <button 
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Cancel</span>
          </button>
          
          <button 
            type="button"
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={saving}
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{saving ? 'Saving...' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formContent}>
          {/* Basic information */}
          <div className={styles.basicInfoSection}>
            <h2 className={styles.sectionTitle}>Basic information</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="nom" className={styles.label}>
                Playlist name<span className={styles.required}>*</span>
              </label>
              <input 
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className={`${styles.input} ${formErrors.nom ? styles.inputError : ''}`}
                placeholder="Enter the name of your playlist"
                maxLength="100"
              />
              {formErrors.nom && (
                <div className={styles.errorMessage}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{formErrors.nom}</span>
                </div>
              )}
              <div className={styles.charCounter}>
                {formData.nom.length}/100
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>
                Description
              </label>
              <textarea 
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className={`${styles.textarea} ${formErrors.description ? styles.inputError : ''}`}
                placeholder="Décrivez votre playlist (optionnel)"
                maxLength="500"
                rows="4"
              />
              {formErrors.description && (
                <div className={styles.errorMessage}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{formErrors.description}</span>
                </div>
              )}
              <div className={styles.charCounter}>
                {formData.description.length}/500
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Visibility <span className={styles.required}>*</span>
              </label>
              <div className={styles.visibilityOptions}>
                <label className={`${styles.visibilityOption} ${formData.visibilite === 'PUBLIC' ? styles.selected : ''}`}>
                  <input 
                    type="radio"
                    name="visibilite"
                    value="PUBLIC"
                    checked={formData.visibilite === 'PUBLIC'}
                    onChange={handleInputChange}
                  />
                  <div className={styles.visibilityIcon}>
                    <FontAwesomeIcon icon={faGlobe} />
                  </div>
                  <div className={styles.visibilityInfo}>
                    <span className={styles.visibilityTitle}>Public</span>
                    <span className={styles.visibilityDescription}>
                     Visible to all users
                    </span>
                  </div>
                </label>
                
                <label className={`${styles.visibilityOption} ${formData.visibilite === 'AMIS' ? styles.selected : ''}`}>
                  <input 
                    type="radio"
                    name="visibilite"
                    value="AMIS"
                    checked={formData.visibilite === 'AMIS'}
                    onChange={handleInputChange}
                  />
                  <div className={styles.visibilityIcon}>
                    <FontAwesomeIcon icon={faUserFriends} />
                  </div>
                  <div className={styles.visibilityInfo}>
                    <span className={styles.visibilityTitle}>Friends only</span>
                    <span className={styles.visibilityDescription}>
                     Visible only to your friends
                    </span>
                  </div>
                </label>
                
                <label className={`${styles.visibilityOption} ${formData.visibilite === 'PRIVE' ? styles.selected : ''}`}>
                  <input 
                    type="radio"
                    name="visibilite"
                    value="PRIVE"
                    checked={formData.visibilite === 'PRIVE'}
                    onChange={handleInputChange}
                  />
                  <div className={styles.visibilityIcon}>
                    <FontAwesomeIcon icon={faLock} />
                  </div>
                  <div className={styles.visibilityInfo}>
                    <span className={styles.visibilityTitle}>Privé</span>
                    <span className={styles.visibilityDescription}>
                     Visible only to you
                    </span>
                  </div>
                </label>
              </div>
              {formErrors.visibilite && (
                <div className={styles.errorMessage}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{formErrors.visibilite}</span>
                </div>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.label}>
                Cover image
              </label>
              
              <div className={styles.coverImageContainer}>
                {formData.image_couverture ? (
                  <div className={styles.previewContainer}>
                    <img 
                      src={formData.image_couverture}
                      alt="Aperçu de la couverture"
                      className={styles.coverPreview}
                    />
                    <button 
                      type="button"
                      className={styles.removeImageButton}
                      onClick={handleRemoveImage}
                    >
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </div>
                ) : (
                  <label className={styles.uploadButton}>
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className={styles.fileInput}
                    />
                    <FontAwesomeIcon icon={faImage} />
                    <span>Choose an image</span>
                  </label>
                )}
              </div>
              
              {formErrors.image_couverture && (
                <div className={styles.errorMessage}>
                  <FontAwesomeIcon icon={faExclamationCircle} />
                  <span>{formErrors.image_couverture}</span>
                </div>
              )}
              <p className={styles.imageHint}>
                Recommended format: JPG or PNG, 800x800px minimum
              </p>
            </div>
          </div>

          {/* Playlist videos */}
          <div className={styles.videosSection}>
            <h2 className={styles.sectionTitle}>Vidéos</h2>
            
            <div className={styles.searchContainer}>
              <div className={styles.searchInputContainer}>
                <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                  placeholder="Rechercher des vidéos à ajouter..."
                  onFocus={() => setShowSearchResults(true)}
                />
              </div>
              
              {showSearchResults && searchTerm.trim() !== '' && (
                <div className={styles.searchResults}>
                  {searchResults.length > 0 ? (
                    searchResults.map(video => (
                      <div 
                        key={video._id}
                        className={styles.searchResultItem}
                        onClick={() => handleAddVideo(video)}
                      >
                        <div 
                          className={styles.searchResultThumbnail}
                          style={{ backgroundColor: getArtistColor(video.artiste) }}
                        >
                          {getArtistInitials(video.artiste)}
                        </div>
                        <div className={styles.searchResultInfo}>
                          <h4 className={styles.searchResultTitle}>{video.titre || "Vidéo sans titre"}</h4>
                          <p className={styles.searchResultArtist}>{video.artiste || "Artiste inconnu"}</p>
                        </div>
                        <button 
                          type="button"
                          className={styles.addVideoButton}
                          onClick={(e) => { e.stopPropagation(); handleAddVideo(video); }}
                        >
                          <FontAwesomeIcon icon={faPlus} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className={styles.noResults}>
                      <p>No videos found</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.playlistVideosContainer}>
              <h3 className={styles.subSectionTitle}>
                Videos in playlist ({playlistVideos.length})
              </h3>
              
              {playlistVideos.length > 0 ? (
                <ul className={styles.playlistVideosList}>
                  {playlistVideos.map((video, index) => (
                    <li 
                      key={video._id}
                      className={styles.playlistVideoItem}
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, index)}
                    >
                      <div className={styles.videoItemIndex}>{index + 1}</div>
                      <div 
                        className={styles.videoItemThumbnail}
                        style={{ backgroundColor: getArtistColor(video.artiste) }}
                      >
                        {getArtistInitials(video.artiste)}
                      </div>
                      <div className={styles.videoItemInfo}>
                        <h4 className={styles.videoItemTitle}>{video.titre || "Untitled video"}</h4>
                        <p className={styles.videoItemArtist}>{video.artiste || "Unknown artist"}</p>
                      </div>
                      <div className={styles.videoItemDuration}>
                        {video.duree ? `${Math.floor(video.duree / 60)}:${(video.duree % 60).toString().padStart(2, '0')}` : '--:--'}
                      </div>
                      <button 
                        type="button"
                        className={styles.removeVideoButton}
                        onClick={() => handleRemoveVideo(video._id)}
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className={styles.emptyVideos}>
                  <FontAwesomeIcon icon={faMusic} className={styles.emptyIcon} />
                  <p>No videos in playlist</p>
                  <p className={styles.emptyHint}>
                    Find and add videos to your playlist
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons at the bottom of the form */}
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelButton} onClick={handleCancel}>
            Cancel
          </button>
          <button type="submit" className={styles.submitButton} disabled={saving}>
            {saving ? 'Saving...' : isEditing ? 'To update' : 'Create playlist'}
          </button>
        </div>
      </form>

      {/* Toast for notifications */}
      <Toast
        show={showToast}
        message={toastMessage}
        type={toastType}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
};

export default PlaylistForm;
