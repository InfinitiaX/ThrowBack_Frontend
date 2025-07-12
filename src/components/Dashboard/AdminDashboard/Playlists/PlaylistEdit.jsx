// components/Dashboard/AdminDashboard/Playlists/PlaylistEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import styles from './PlaylistEdit.module.css';

const PlaylistEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    visibilite: 'PUBLIC',
    tags: '',
    image_couverture: ''
  });
  const [originalData, setOriginalData] = useState(null);
  
  // Charger les détails de la playlist
  useEffect(() => {
    if (id && id !== 'new') {
      fetchPlaylistDetails();
    } else {
      setLoading(false);
    }
  }, [id]);
  
  const fetchPlaylistDetails = async () => {
    try {
      const response = await axios.get(`/api/admin/playlists/${id}`);
      
      if (response.data.success) {
        const playlist = response.data.data;
        setOriginalData(playlist);
        setFormData({
          nom: playlist.nom,
          description: playlist.description || '',
          visibilite: playlist.visibilite,
          tags: playlist.tags ? playlist.tags.join(', ') : '',
          image_couverture: playlist.image_couverture || ''
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
  
  // Gérer le changement des inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Gérer l'upload d'image
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Vérifier le type et la taille du fichier
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('Format d\'image non supporté. Utilisez JPG, PNG, GIF ou WEBP.');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('L\'image est trop volumineuse. Taille maximale: 5MB');
      return;
    }
    
    // Lire le fichier comme une URL data
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        image_couverture: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Supprimer l'image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image_couverture: ''
    }));
  };
  
  // Enregistrer les modifications
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag !== '')
        : [];
      
      const dataToSend = {
        nom: formData.nom,
        description: formData.description,
        visibilite: formData.visibilite,
        tags: tagsArray,
        image_couverture: formData.image_couverture
      };
      
      let response;
      
      if (id && id !== 'new') {
        // Mise à jour
        response = await axios.put(`/api/admin/playlists/${id}`, dataToSend);
        if (response.data.success) {
          toast.success('Playlist mise à jour avec succès');
          navigate(`/admin/playlists/${id}`);
        }
      } else {
        // Création
        response = await axios.post('/api/admin/playlists', dataToSend);
        if (response.data.success) {
          toast.success('Playlist créée avec succès');
          navigate(`/admin/playlists/${response.data.data._id}`);
        }
      }
    } catch (err) {
      console.error('Erreur handleSubmit:', err);
      toast.error(err.response?.data?.message || 'Erreur lors de l\'enregistrement');
    } finally {
      setSaving(false);
    }
  };
  
  // Annuler les modifications
  const handleCancel = () => {
    if (id && id !== 'new') {
      navigate(`/admin/playlists/${id}`);
    } else {
      navigate('/admin/playlists');
    }
  };
  
  // Vérifier s'il y a des modifications
  const hasChanges = () => {
    if (!originalData) return true; // Nouvelle playlist
    
    const originalTags = originalData.tags ? originalData.tags.join(', ') : '';
    
    return (
      formData.nom !== originalData.nom ||
      formData.description !== (originalData.description || '') ||
      formData.visibilite !== originalData.visibilite ||
      formData.tags !== originalTags ||
      formData.image_couverture !== (originalData.image_couverture || '')
    );
  };
  
  // Si chargement en cours
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement...</p>
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
  
  return (
    <div className={styles.playlistEditContainer}>
      <div className={styles.header}>
        <h1>{id && id !== 'new' ? 'Modifier la playlist' : 'Créer une playlist'}</h1>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/admin/playlists')}
        >
          <i className="fas fa-times"></i>
          Annuler
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.formSection}>
          <h2>Informations générales</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nom">Nom de la playlist *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              required
              placeholder="Entrez le nom de la playlist"
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
              placeholder="Décrivez cette playlist (optionnel)"
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="visibilite">Visibilité *</label>
              <select
                id="visibilite"
                name="visibilite"
                value={formData.visibilite}
                onChange={handleInputChange}
                required
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVE">Privé</option>
                <option value="AMIS">Amis uniquement</option>
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
        </div>
        
        <div className={styles.formSection}>
          <h2>Image de couverture</h2>
          
          <div className={styles.imageUploadContainer}>
            <div className={styles.imagePreview}>
              {formData.image_couverture ? (
                <>
                  <img 
                    src={formData.image_couverture} 
                    alt="Aperçu de la couverture" 
                  />
                  <button 
                    type="button"
                    className={styles.removeImageButton}
                    onClick={handleRemoveImage}
                  >
                    <i className="fas fa-trash-alt"></i>
                  </button>
                </>
              ) : (
                <div className={styles.noImage}>
                  <i className="fas fa-music"></i>
                  <p>Aucune image</p>
                </div>
              )}
            </div>
            
            <div className={styles.uploadControls}>
              <label htmlFor="image_upload" className={styles.uploadButton}>
                <i className="fas fa-upload"></i>
                {formData.image_couverture ? 'Changer l\'image' : 'Ajouter une image'}
              </label>
              <input
                type="file"
                id="image_upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <p className={styles.uploadHint}>
                Formats acceptés: JPG, PNG, GIF, WEBP. Taille maximale: 5MB.
              </p>
            </div>
          </div>
        </div>
        
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
            className={styles.saveButton}
            disabled={saving || !hasChanges()}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Enregistrement...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                {id && id !== 'new' ? 'Mettre à jour' : 'Créer la playlist'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaylistEdit;