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

  // États du formulaire
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    visibilite: 'PUBLIC',
    image_couverture: ''
  });

  // États pour la gestion des vidéos
  const [playlistVideos, setPlaylistVideos] = useState([]);
  const [availableVideos, setAvailableVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // États pour la gestion du formulaire
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Charger les données si en mode édition
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Charger les vidéos disponibles
        const videosData = await videoAPI.getAllVideos();
        setAvailableVideos(videosData);
        
        // Si en mode édition, charger les données de la playlist
        if (isEditing) {
          const playlistData = await playlistAPI.getPlaylistById(id);
          
          if (!playlistData) {
            setError('Playlist introuvable');
            setLoading(false);
            return;
          }
          
          // Vérifier que l'utilisateur est le propriétaire
          if (playlistData.proprietaire._id !== user?.id) {
            setError('Vous n\'avez pas les permissions nécessaires pour modifier cette playlist');
            setLoading(false);
            return;
          }
          
          // Remplir le formulaire avec les données de la playlist
          setFormData({
            nom: playlistData.nom || '',
            description: playlistData.description || '',
            visibilite: playlistData.visibilite || 'PUBLIC',
            image_couverture: playlistData.image_couverture || ''
          });
          
          // Trier les vidéos par ordre
          const sortedVideos = [...playlistData.videos].sort((a, b) => a.ordre - b.ordre);
          setPlaylistVideos(sortedVideos.map(item => item.video_id));
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Une erreur est survenue lors du chargement des données');
        setLoading(false);
      }
    };

    fetchData();
  }, [id, isEditing, user?.id]);

  // Filtrer les vidéos disponibles en fonction de la recherche
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

  // Gérer les changements dans les champs du formulaire
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Effacer l'erreur pour ce champ
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };

  // Gérer la recherche de vidéos
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setShowSearchResults(true);
  };

  // Ajouter une vidéo à la playlist
  const handleAddVideo = (video) => {
    // Vérifier si la vidéo n'est pas déjà dans la playlist
    if (!playlistVideos.some(v => v._id === video._id)) {
      setPlaylistVideos([...playlistVideos, video]);
    }
    
    setSearchTerm('');
    setShowSearchResults(false);
  };

  // Supprimer une vidéo de la playlist
  const handleRemoveVideo = (videoId) => {
    setPlaylistVideos(playlistVideos.filter(video => video._id !== videoId));
  };

  // Gérer le glisser-déposer pour réorganiser les vidéos
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

  // Gérer l'upload d'image de couverture
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type de fichier
    if (!file.type.startsWith('image/')) {
      setFormErrors({
        ...formErrors,
        image_couverture: 'Le fichier doit être une image'
      });
      return;
    }
    
    // Vérifier la taille du fichier (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setFormErrors({
        ...formErrors,
        image_couverture: 'L\'image ne doit pas dépasser 2MB'
      });
      return;
    }
    
    // Créer une URL pour prévisualiser l'image
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData({
        ...formData,
        image_couverture: event.target.result
      });
    };
    reader.readAsDataURL(file);
    
    // Effacer l'erreur pour ce champ
    if (formErrors.image_couverture) {
      setFormErrors({
        ...formErrors,
        image_couverture: null
      });
    }
  };

  // Supprimer l'image de couverture
  const handleRemoveImage = () => {
    setFormData({
      ...formData,
      image_couverture: ''
    });
  };

  // Valider le formulaire
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

  // Soumettre le formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Valider le formulaire
    if (!validateForm()) {
      return;
    }
    
    try {
      setSaving(true);
      
      // Préparer les données pour l'API
      const playlistData = {
        ...formData,
        videos: playlistVideos.map((video, index) => ({
          videoId: video._id,
          ordre: index + 1
        }))
      };
      
      let response;
      
      if (isEditing) {
        // Mettre à jour la playlist existante
        response = await playlistAPI.updatePlaylist(id, playlistData);
      } else {
        // Créer une nouvelle playlist
        response = await playlistAPI.createPlaylist(playlistData);
      }
      
      setSaving(false);
      
      // Afficher un message de succès
      setToastMessage(isEditing ? 'Playlist mise à jour avec succès' : 'Playlist créée avec succès');
      setToastType('success');
      setShowToast(true);
      
      // Rediriger vers la page de détail de la playlist
      setTimeout(() => {
        navigate(`/dashboard/playlists/${isEditing ? id : response.data._id}`);
      }, 1500);
    } catch (err) {
      console.error('Erreur lors de l\'enregistrement de la playlist:', err);
      
      setSaving(false);
      
      // Afficher un message d'erreur
      setToastMessage('Une erreur est survenue lors de l\'enregistrement de la playlist');
      setToastType('error');
      setShowToast(true);
    }
  };

  // Annuler et retourner à la page précédente
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
      {/* En-tête avec titre et boutons d'action */}
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

      {/* Formulaire */}
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.formContent}>
          {/* Informations de base */}
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
                placeholder="Décrivez votre playlist (facultatif)"
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
                      Visible par vos amis seulement
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
                      Visible par vous uniquement
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

          {/* Vidéos de la playlist */}
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
                  <p>Aucune vidéo dans la playlist</p>
                  <p className={styles.emptyHint}>
                    Recherchez et ajoutez des vidéos à votre playlist
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Boutons d'action en bas du formulaire */}
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

      {/* Toast pour les notifications */}
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