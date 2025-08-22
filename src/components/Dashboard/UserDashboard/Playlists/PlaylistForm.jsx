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
    
    // Si c'est déjà une URL complète
    if (mediaPath.startsWith('http')) return mediaPath;
    
    // Récupérer l'URL de base de l'API
    const baseUrl = process.env.REACT_APP_API_URL || '';
    
    // Si c'est un chemin relatif sans slash au début
    if (!mediaPath.startsWith('/')) {
      return `${baseUrl}/${mediaPath}`;
    }
    
    // Chemin relatif avec slash
    return `${baseUrl}${mediaPath}`;
  };

  // Fonction pour obtenir les initiales d'un artiste
  const getArtistInitials = (artist) => {
    if (!artist) return 'A';
    
    // Découper le nom de l'artiste en mots et prendre les premières lettres
    return artist.split(' ')
      .map(word => word.charAt(0).toUpperCase())
      .join('')
      .substring(0, 2); // Limiter à 2 caractères maximum
  };

  // Générer une couleur de fond basée sur le nom de l'artiste pour être consistant
  const getArtistColor = (artist) => {
    const colors = [
      '#4a6fa5', '#6fb98f', '#2c786c', '#f25f5c', '#a16ae8', 
      '#ffa600', '#58508d', '#bc5090', '#ff6361', '#003f5c'
    ];
    
    if (!artist) return colors[0];
    
    // Générer un nombre à partir du nom pour choisir une couleur
    const sum = artist.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  // Load data if in edit mode
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Chargement des données pour le formulaire...");
        
        // Load available videos
        const videosData = await videoAPI.getAllVideos();
        console.log("Vidéos disponibles:", videosData);
        setAvailableVideos(videosData);
        
        // If in edit mode, load playlist data
        if (isEditing) {
          console.log("Mode édition, chargement de la playlist:", id);
          const playlistData = await playlistAPI.getPlaylistById(id);
          
          if (!playlistData) {
            setError('Playlist introuvable');
            setLoading(false);
            return;
          }
          
          console.log("Données de la playlist:", playlistData);
          
          // Check that the user is the owner
          // Vérification correcte du propriétaire avec gestion des formats d'ID différents
          const ownerId = playlistData.proprietaire._id || playlistData.proprietaire;
          const userId = user?.id || user?._id;
          
          const isOwner = ownerId && userId && 
                         (ownerId.toString() === userId.toString());
          
          console.log("Vérification propriétaire:", {
            ownerId: ownerId?.toString(),
            userId: userId?.toString(),
            isOwner
          });
          
          if (!isOwner) {
            setError("Vous n'avez pas l'autorisation de modifier cette playlist");
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
          if (playlistData.videos && playlistData.videos.length > 0) {
            const sortedVideos = [...playlistData.videos].sort((a, b) => a.ordre - b.ordre);
            setPlaylistVideos(sortedVideos.map(item => item.video_id));
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Une erreur est survenue lors du chargement des données');
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
        image_couverture: 'Le fichier doit être une image'
      });
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({
        ...formErrors,
        image_couverture: "L'image ne doit pas dépasser 2Mo"
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
      errors.nom = 'Le nom de la playlist est requis';
    }
    
    if (formData.nom && formData.nom.length > 100) {
      errors.nom = 'Le nom de la playlist ne doit pas dépasser 100 caractères';
    }
    
    if (formData.description && formData.description.length > 500) {
      errors.description = 'La description ne doit pas dépasser 500 caractères';
    }
    
    if (!formData.visibilite) {
      errors.visibilite = 'La visibilité est requise';
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
      
      console.log("Données à envoyer:", playlistData);
      
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
      setToastMessage(isEditing ? 'Playlist mise à jour avec succès' : 'Playlist créée avec succès');
      setToastType('success');
      setShowToast(true);
      
      // Redirect to the playlist detail page
      setTimeout(() => {
        navigate(`/dashboard/playlists/${isEditing ? id : response._id}`);
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la playlist:', err);
      
      setSaving(false);
      
      // Display an error message
      setToastMessage('Une erreur est survenue lors de l\'enregistrement de la playlist');
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
          Retour aux playlists
        </button>
      </div>
    );
  }

  return (
    <div className={styles.playlistFormContainer}>
      {/* Header with title and action buttons */}
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isEditing ? 'Modifier la playlist' : 'Créer une playlist'}
        </h1>
        
        <div className={styles.headerActions}>
          <button 
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Annuler</span>
          </button>
          
          <button 
            type="button"
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={saving}
          >
            <FontAwesomeIcon icon={faSave} />
            <span>{saving ? 'Enregistrement...' : 'Enregistrer'}</span>
          </button>
        </div>
      </div>

      {/* Form */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formContent}>
          {/* Basic information */}
          <div className={styles.basicInfoSection}>
            <h2 className={styles.sectionTitle}>Informations de base</h2>
            
            <div className={styles.formGroup}>
              <label htmlFor="nom" className={styles.label}>
                Nom de la playlist <span className={styles.required}>*</span>
              </label>
              <input 
                type="text"
                id="nom"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                className={`${styles.input} ${formErrors.nom ? styles.inputError : ''}`}
                placeholder="Entrez le nom de votre playlist"
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
                Visibilité <span className={styles.required}>*</span>
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
                      Visible par tous les utilisateurs
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
                    <span className={styles.visibilityTitle}>Amis uniquement</span>
                    <span className={styles.visibilityDescription}>
                      Visible uniquement par vos amis
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
                      Visible uniquement par vous
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
                Image de couverture
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
                    <span>Choisir une image</span>
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
                Format recommandé : JPG ou PNG, 800x800px minimum
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
                          style={{ 
                            backgroundColor: getArtistColor(video.artiste),
                          }}
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
                      <p>Aucune vidéo trouvée</p>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className={styles.playlistVideosContainer}>
              <h3 className={styles.subSectionTitle}>
                Vidéos dans la playlist ({playlistVideos.length})
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
                        style={{ 
                          backgroundColor: getArtistColor(video.artiste),
                        }}
                      >
                        {getArtistInitials(video.artiste)}
                      </div>
                      <div className={styles.videoItemInfo}>
                        <h4 className={styles.videoItemTitle}>{video.titre || "Vidéo sans titre"}</h4>
                        <p className={styles.videoItemArtist}>{video.artiste || "Artiste inconnu"}</p>
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
                  <p>Aucune vidéo dans la playlist</p>
                  <p className={styles.emptyHint}>
                    Recherchez et ajoutez des vidéos à votre playlist
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
            Annuler
          </button>
          
          <button 
            type="submit"
            className={styles.submitButton}
            disabled={saving}
          >
            {saving ? 'Enregistrement...' : isEditing ? 'Mettre à jour' : 'Créer la playlist'}
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