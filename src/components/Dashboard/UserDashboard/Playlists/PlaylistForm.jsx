// components/Dashboard/UserDashboard/Playlists/PlaylistForm.jsx
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

  // Load data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Load available videos
        const videosData = await videoAPI.getAllVideos();
        setAvailableVideos(videosData);
        
        // If in edit mode, load playlist data
        if (isEditing) {
          const playlistData = await playlistAPI.getPlaylistById(id);
          
          if (!playlistData) {
            setError('Playlist not found');
            setLoading(false);
            return;
          }
          
          // Check that the user is the owner
          if (playlistData.proprietaire._id !== user?.id) {
            setError('You do not have permission to edit this playlist');
            setLoading(false);
            return;
          }
          
          // Fill the form with playlist data
          setFormData({
            nom: playlistData.nom || '',
            description: playlistData.description || '',
            visibilite: playlistData.visibilite || 'PUBLIC',
            image_couverture: playlistData.image_couverture || ''
          });
          
          // Sort videos by order
          const sortedVideos = [...playlistData.videos].sort((a, b) => a.ordre - b.ordre);
          setPlaylistVideos(sortedVideos.map(item => item.video_id));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('An error occurred while loading data');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, user?.id]);

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
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error for this field
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Handle video search
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
  };

  // Add a video to the playlist
  const handleAddVideo = (video) => {
    // Check if the video is not already in the playlist
    if (!playlistVideos.some(v => v._id === video._id)) {
      setPlaylistVideos([...playlistVideos, video]);
    }
    
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Remove a video from the playlist
  const handleRemoveVideo = (videoId) => {
    setPlaylistVideos(playlistVideos.filter(video => video._id !== videoId));
  };

  // Handle drag and drop for video reordering
  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('index', index.toString());
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIndex = parseInt(e.dataTransfer.getData('index'));
    
    if (sourceIndex === targetIndex) return;
    
    const videos = [...playlistVideos];
    const [removed] = videos.splice(sourceIndex, 1);
    videos.splice(targetIndex, 0, removed);
    
    setPlaylistVideos(videos);
  };

  // Handle cover image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Check file type
    if (!file.type.startsWith('image/')) {
      setFormErrors({
        ...formErrors,
        image_couverture: 'The file must be an image'
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({
        ...formErrors,
        image_couverture: 'The image must not exceed 2MB'
      });
      return;
    }
    
    // Create a URL to preview the image
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({
        ...formData,
        image_couverture: event.target.result
      });
    };
    reader.readAsDataURL(file);
    
    // Clear error for this field
    if (formErrors.image_couverture) {
      setFormErrors({
        ...formErrors,
        image_couverture: null
      });
    }
  };

  // Remove the cover image
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image_couverture: ''
    });
  };

  // Validate the form
  const validateForm = () => {
    const errors = {};
    
    if (!formData.nom || formData.nom.trim() === '') {
      errors.nom = 'Playlist name is required';
    }
    
    if (formData.nom && formData.nom.length > 100) {
      errors.nom = 'Playlist name must not exceed 100 characters';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'Description must not exceed 500 characters';
    }
    
    if (!formData.visibilite) {
      errors.visibilite = 'Visibility is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit the form
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate the form
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Prepare data for the API
      const playlistData = {
        ...formData,
        videos: playlistVideos.map((video, index) => ({
          videoId: video._id,
          ordre: index + 1
        }))
      };
      
      let response;
      
      if (isEditing) {
        // Update existing playlist
        response = await playlistAPI.updatePlaylist(id, playlistData);
      } else {
        // Create a new playlist
        response = await playlistAPI.createPlaylist(playlistData);
      }
      
      setSaving(false);
      
      // Display a success message
      setToastMessage(isEditing ? 'Playlist updated successfully' : 'Playlist created successfully');
      setToastType('success');
      setShowToast(true);
      
      // Redirect to the playlist detail page
      setTimeout(() => {
        navigate(`/dashboard/playlists/${isEditing ? id : response.data._id}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving playlist:', err);
      
      setSaving(false);
      
      // Display an error message
      setToastMessage('An error occurred while saving the playlist');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Cancel and return to the previous page
  const handleCancel = () => {
    navigate(isEditing ? `/dashboard/playlists/${id}` : '/dashboard/playlists');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button 
          className={styles.retryButton}
          onClick={() => navigate('/dashboard/playlists')}
        >
          Back to playlists
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
            <h2 className={styles.sectionTitle}>Basic Information</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="nom" className={styles.label}>
                Playlist name <span className={styles.required}>*</span>
              </label>
              <input 
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className={`${styles.input} ${formErrors.nom ? styles.inputError : ''}`}
                placeholder="Enter your playlist name"
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
                placeholder="Describe your playlist (optional)"
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
                      Visible to your friends only
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
                    <span className={styles.visibilityTitle}>Private</span>
                    <span className={styles.visibilityDescription}>
                      Visible to you only
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
                      alt="Cover preview"
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
            <h2 className={styles.sectionTitle}>Videos</h2>
            
            <div className={styles.searchContainer}>
              <div className={styles.searchInputContainer}>
                <FontAwesomeIcon icon={faSearch} className={styles.searchIcon} />
                <input 
                  type="text"
                  value={searchTerm}
                  onChange={handleSearchChange}
                  className={styles.searchInput}
                  placeholder="Search for videos to add..."
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
                        <div className={styles.searchResultThumbnail}>
                          <img 
                            src={video.thumbnail || "https://via.placeholder.com/60x34?text=Video"}
                            alt={video.titre}
                          />
                        </div>
                        <div className={styles.searchResultInfo}>
                          <h4 className={styles.searchResultTitle}>{video.titre}</h4>
                          <p className={styles.searchResultArtist}>{video.artiste}</p>
                        </div>
                        <button 
                          type="button"
                          className={styles.addVideoButton}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddVideo(video);
                          }}
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
                      <div className={styles.videoItemThumbnail}>
                        <img 
                          src={video.thumbnail || "https://via.placeholder.com/80x45?text=Video"}
                          alt={video.titre}
                        />
                      </div>
                      <div className={styles.videoItemInfo}>
                        <h4 className={styles.videoItemTitle}>{video.titre}</h4>
                        <p className={styles.videoItemArtist}>{video.artiste}</p>
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
                    Search and add videos to your playlist
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action buttons at the bottom of the form */}
        <div className={styles.formActions}>
          <button 
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancel
          </button>
          
          <button 
            type="submit"
            className={styles.submitButton}
            disabled={saving}
          >
            {saving ? 'Saving...' : isEditing ? 'Update' : 'Create playlist'}
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