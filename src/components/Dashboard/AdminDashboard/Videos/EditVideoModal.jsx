// src/components/admin/Videos/EditVideoModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './Videos.module.css';

// Liste des genres disponibles (synchronisée avec le backend)
const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 
  'Electronic', 'Dance', 'House', 'Techno', 'Country', 'Folk', 
  'Classical', 'Opera', 'Reggae', 'Reggaeton', 'Latin', 'World', 
  'Alternative', 'Indie', 'Metal', 'Punk', 'Funk', 'Disco', 
  'Gospel', 'Soundtrack', 'Other'
];

const DECADES = ['60s', '70s', '80s', '90s', '2000s', '2010s', '2020s'];

const EditVideoModal = ({ isOpen, onClose, video, onVideoUpdated }) => {
  const [formData, setFormData] = useState({
    titre: '',
    youtubeUrl: '',
    type: 'music',
    genre: '',
    artiste: '',
    annee: '',
    decennie: '',
    duree: '',
    description: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // Initialize form with video data
  useEffect(() => {
    if (video && isOpen) {
      setFormData({
        titre: video.titre || '',
        youtubeUrl: video.youtubeUrl || '',
        type: video.type || 'music',
        genre: video.genre || '',
        artiste: video.artiste || '',
        annee: video.annee ? video.annee.toString() : '',
        decennie: video.decennie || '',
        duree: video.duree ? video.duree.toString() : '',
        description: video.description || ''
      });

      // Set preview URL
      const videoId = getYouTubeVideoId(video.youtubeUrl);
      if (videoId) {
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      }
    }
  }, [video, isOpen]);

  if (!isOpen || !video) return null;

  // Extract YouTube video ID and generate thumbnail
  const getYouTubeVideoId = (url) => {
    try {
      const videoUrl = new URL(url);
      let videoId = '';
      
      if (videoUrl.hostname.includes('youtube.com')) {
        videoId = videoUrl.searchParams.get('v');
      } else if (videoUrl.hostname.includes('youtu.be')) {
        videoId = videoUrl.pathname.substring(1);
      }
      
      return videoId;
    } catch (error) {
      return null;
    }
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Auto-generate decade from year
    if (name === 'annee' && value) {
      const year = parseInt(value);
      let decade = '';
      if (year >= 1960 && year <= 1969) decade = '60s';
      else if (year >= 1970 && year <= 1979) decade = '70s';
      else if (year >= 1980 && year <= 1989) decade = '80s';
      else if (year >= 1990 && year <= 1999) decade = '90s';
      else if (year >= 2000 && year <= 2009) decade = '2000s';
      else if (year >= 2010 && year <= 2019) decade = '2010s';
      else if (year >= 2020 && year <= 2029) decade = '2020s';
      
      setFormData(prev => ({
        ...prev,
        decennie: decade
      }));
    }

    // Generate preview URL for YouTube videos
    if (name === 'youtubeUrl') {
      const videoId = getYouTubeVideoId(value);
      if (videoId) {
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      } else {
        setPreviewUrl('');
      }
    }

    // Clear error when user types
    if (error) setError('');
  };

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.titre !== (video.titre || '') ||
      formData.youtubeUrl !== (video.youtubeUrl || '') ||
      formData.type !== (video.type || 'music') ||
      formData.genre !== (video.genre || '') ||
      formData.artiste !== (video.artiste || '') ||
      formData.annee !== (video.annee ? video.annee.toString() : '') ||
      formData.decennie !== (video.decennie || '') ||
      formData.duree !== (video.duree ? video.duree.toString() : '') ||
      formData.description !== (video.description || '')
    );
  };

  // Validate form
  const validateForm = () => {
    if (!formData.titre.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.youtubeUrl.trim()) {
      setError('YouTube URL is required');
      return false;
    }
    if (!formData.type) {
      setError('Type is required');
      return false;
    }
    if (formData.type === 'short' && (!formData.duree || formData.duree < 10 || formData.duree > 30)) {
      setError('Short duration must be between 10 and 30 seconds');
      return false;
    }
    
    // Validate YouTube URL
    const videoId = getYouTubeVideoId(formData.youtubeUrl);
    if (!videoId) {
      setError('Please enter a valid YouTube URL');
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!hasChanges()) {
      setError('No changes detected');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/videos/${video._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          annee: formData.annee ? parseInt(formData.annee) : undefined,
          duree: formData.duree ? parseInt(formData.duree) : undefined
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update video');
      }
      
      // Notify parent component
      onVideoUpdated(data.data);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Handle close
  const handleClose = () => {
    if (!loading) {
      setError('');
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Edit Video</h2>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="titre">
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={formData.titre}
              onChange={handleChange}
              placeholder="Enter video title"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="youtubeUrl">
              YouTube URL <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              id="youtubeUrl"
              name="youtubeUrl"
              value={formData.youtubeUrl}
              onChange={handleChange}
              placeholder="https://www.youtube.com/watch?v=..."
              disabled={loading}
              required
            />
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Video thumbnail" />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="type">
                Type <span className={styles.required}>*</span>
              </label>
              <select
                id="type"
                name="type"
                value={formData.type}
                onChange={handleChange}
                disabled={loading}
                required
              >
                <option value="music">Music Video</option>
                <option value="podcast">Podcast</option>
                <option value="short">Short</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Select genre</option>
                {GENRES.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="artiste">Artist</label>
              <input
                type="text"
                id="artiste"
                name="artiste"
                value={formData.artiste}
                onChange={handleChange}
                placeholder="Artist name"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="annee">Year</label>
              <input
                type="number"
                id="annee"
                name="annee"
                value={formData.annee}
                onChange={handleChange}
                placeholder="2024"
                min="1950"
                max="2030"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="decennie">Decade</label>
              <select
                id="decennie"
                name="decennie"
                value={formData.decennie}
                onChange={handleChange}
                disabled={loading}
              >
                <option value="">Auto-detect from year</option>
                {DECADES.map(decade => (
                  <option key={decade} value={decade}>{decade}</option>
                ))}
              </select>
            </div>

            {formData.type === 'short' && (
              <div className={styles.formGroup}>
                <label htmlFor="duree">
                  Duration (seconds) <span className={styles.required}>*</span>
                </label>
                <input
                  type="number"
                  id="duree"
                  name="duree"
                  value={formData.duree}
                  onChange={handleChange}
                  placeholder="15"
                  min="10"
                  max="30"
                  disabled={loading}
                  required={formData.type === 'short'}
                />
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Optional description"
              disabled={loading}
              rows={4}
            />
          </div>
        </form>
        
        <div className={styles.modalFooter}>
          <button 
            type="button"
            className={styles.cancelButton}
            onClick={handleClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i> Cancel
          </button>
          <button 
            type="submit"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading || !hasChanges()}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Updating...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Update Video
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditVideoModal;