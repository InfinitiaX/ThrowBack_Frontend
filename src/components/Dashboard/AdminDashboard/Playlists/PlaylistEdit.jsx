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
  
  // Load playlist details
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
        setError('Error while loading the playlist');
        toast.error('Error while loading the playlist');
      }
    } catch (err) {
      console.error('Error fetchPlaylistDetails:', err);
      setError('Error while loading the playlist');
      toast.error('Error while loading the playlist');
    } finally {
      setLoading(false);
    }
  };
  
  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type and size
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      toast.error('Unsupported image format. Use JPG, PNG, GIF, or WEBP.');
      return;
    }
    
    if (file.size > maxSize) {
      toast.error('Image is too large. Max size: 5MB');
      return;
    }
    
    // Read file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      setFormData(prev => ({
        ...prev,
        image_couverture: event.target.result
      }));
    };
    reader.readAsDataURL(file);
  };
  
  // Remove image
  const handleRemoveImage = () => {
    setFormData(prev => ({
      ...prev,
      image_couverture: ''
    }));
  };
  
  // Save changes
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
        // Update
        response = await axios.put(`/api/admin/playlists/${id}`, dataToSend);
        if (response.data.success) {
          toast.success('Playlist updated successfully');
          navigate(`/admin/playlists/${id}`);
        }
      } else {
        // Create
        response = await axios.post('/api/admin/playlists', dataToSend);
        if (response.data.success) {
          toast.success('Playlist created successfully');
          navigate(`/admin/playlists/${response.data.data._id}`);
        }
      }
    } catch (err) {
      console.error('Error handleSubmit:', err);
      toast.error(err.response?.data?.message || 'Error while saving');
    } finally {
      setSaving(false);
    }
  };
  
  // Cancel changes
  const handleCancel = () => {
    if (id && id !== 'new') {
      navigate(`/admin/playlists/${id}`);
    } else {
      navigate('/admin/playlists');
    }
  };
  
  // Check if there are changes
  const hasChanges = () => {
    if (!originalData) return true; // New playlist
    
    const originalTags = originalData.tags ? originalData.tags.join(', ') : '';
    
    return (
      formData.nom !== originalData.nom ||
      formData.description !== (originalData.description || '') ||
      formData.visibilite !== originalData.visibilite ||
      formData.tags !== originalTags ||
      formData.image_couverture !== (originalData.image_couverture || '')
    );
  };
  
  // Loading state
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading...</p>
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
  
  return (
    <div className={styles.playlistEditContainer}>
      <div className={styles.header}>
        <h1>{id && id !== 'new' ? 'Edit playlist' : 'Create a playlist'}</h1>
        <button 
          className={styles.backButton}
          onClick={() => navigate('/admin/playlists')}
        >
          <i className="fas fa-times"></i>
          Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className={styles.editForm}>
        <div className={styles.formSection}>
          <h2>General information</h2>
          
          <div className={styles.formGroup}>
            <label htmlFor="nom">Playlist name *</label>
            <input
              type="text"
              id="nom"
              name="nom"
              value={formData.nom}
              onChange={handleInputChange}
              required
              placeholder="Enter the playlist name"
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
              placeholder="Describe this playlist (optional)"
            />
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="visibilite">Visibility *</label>
              <select
                id="visibilite"
                name="visibilite"
                value={formData.visibilite}
                onChange={handleInputChange}
                required
              >
                <option value="PUBLIC">Public</option>
                <option value="PRIVE">Private</option>
                <option value="AMIS">Friends only</option>
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
        </div>
        
        <div className={styles.formSection}>
          <h2>Cover image</h2>
          
          <div className={styles.imageUploadContainer}>
            <div className={styles.imagePreview}>
              {formData.image_couverture ? (
                <>
                  <img 
                    src={formData.image_couverture} 
                    alt="Cover preview" 
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
                  <p>No image</p>
                </div>
              )}
            </div>
            
            <div className={styles.uploadControls}>
              <label htmlFor="image_upload" className={styles.uploadButton}>
                <i className="fas fa-upload"></i>
                {formData.image_couverture ? 'Change image' : 'Add image'}
              </label>
              <input
                type="file"
                id="image_upload"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
                style={{ display: 'none' }}
              />
              <p className={styles.uploadHint}>
                Accepted formats: JPG, PNG, GIF, WEBP. Max size: 5MB.
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
            Cancel
          </button>
          <button 
            type="submit" 
            className={styles.saveButton}
            disabled={saving || !hasChanges()}
          >
            {saving ? (
              <>
                <i className="fas fa-spinner fa-spin"></i>
                Saving...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i>
                {id && id !== 'new' ? 'Update' : 'Create playlist'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PlaylistEdit;
