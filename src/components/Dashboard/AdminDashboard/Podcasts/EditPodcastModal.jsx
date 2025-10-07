import React, { useState, useEffect } from 'react';
import styles from './Podcasts.module.css';

// List of available categories
const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const EditPodcastModal = ({ isOpen, onClose, podcast, onPodcastUpdated }) => {
  // Use API base URL
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  
  const [formData, setFormData] = useState({
    title: '',
    episode: '',
    season: '',
    vimeoUrl: '',
    duration: '',
    coverImage: '',
    description: '',
    guestName: '',
    hostName: '',
    publishDate: '',
    topics: '',
    category: '',
    isPublished: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  // Initialize form with podcast data
  useEffect(() => {
    if (podcast && isOpen) {
      setFormData({
        title: podcast.title || '',
        episode: podcast.episode ? podcast.episode.toString() : '',
        season: podcast.season ? podcast.season.toString() : '1',
        vimeoUrl: podcast.vimeoUrl || '',
        duration: podcast.duration ? podcast.duration.toString() : '',
        coverImage: podcast.coverImage || '',
        description: podcast.description || '',
        guestName: podcast.guestName || '',
        hostName: podcast.hostName || 'Mike Levis',
        publishDate: podcast.publishDate ? new Date(podcast.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        topics: podcast.topics ? podcast.topics.join(', ') : '',
        category: podcast.category || 'PERSONAL BRANDING',
        isPublished: podcast.isPublished !== undefined ? podcast.isPublished : true
      });

      // Set preview image
      if (podcast.coverImage && !podcast.coverImage.includes('podcast-default.jpg')) {
        setPreviewUrl(podcast.coverImage);
      } else {
        // Use default image for preview
        setPreviewUrl('/images/podcast-default.jpg');
      }
    }
  }, [podcast, isOpen]);

  if (!isOpen || !podcast) return null;

  // Extract Vimeo ID from URL
  const getVimeoId = (url) => {
    if (!url) return null;
    
    try {
      const vimeoUrl = new URL(url);
      
      if (vimeoUrl.hostname.includes('vimeo.com')) {
        // Format: https://vimeo.com/123456789
        const segments = vimeoUrl.pathname.split('/').filter(Boolean);
        return segments[0];
      } else if (vimeoUrl.hostname.includes('player.vimeo.com')) {
        // Format: https://player.vimeo.com/video/123456789
        const segments = vimeoUrl.pathname.split('/').filter(Boolean);
        if (segments[0] === 'video') {
          return segments[1];
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error extracting Vimeo ID:', error);
      return null;
    }
  };

  // Handle form changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // If Vimeo URL changes, update preview
    if (name === 'vimeoUrl') {
      const vimeoId = getVimeoId(value);
      if (vimeoId) {
        // Note: In a real app, we would call the API to fetch the Vimeo thumbnail.
        // Here we just use a placeholder image.
        setPreviewUrl('/images/podcast-default.jpg');
      }
    }

    // If coverImage provided, use it as preview
    if (name === 'coverImage' && value) {
      setPreviewUrl(value);
    }

    // Clear error when user types
    if (error) setError('');
  };

  // Check if form has changes
  const hasChanges = () => {
    return (
      formData.title !== (podcast.title || '') ||
      formData.episode !== (podcast.episode ? podcast.episode.toString() : '') ||
      formData.season !== (podcast.season ? podcast.season.toString() : '1') ||
      formData.vimeoUrl !== (podcast.vimeoUrl || '') ||
      formData.duration !== (podcast.duration ? podcast.duration.toString() : '') ||
      formData.coverImage !== (podcast.coverImage || '') ||
      formData.description !== (podcast.description || '') ||
      formData.guestName !== (podcast.guestName || '') ||
      formData.hostName !== (podcast.hostName || 'Mike Levis') ||
      formData.publishDate !== (podcast.publishDate ? new Date(podcast.publishDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]) ||
      formData.topics !== (podcast.topics ? podcast.topics.join(', ') : '') ||
      formData.category !== (podcast.category || 'PERSONAL BRANDING') ||
      formData.isPublished !== (podcast.isPublished !== undefined ? podcast.isPublished : true)
    );
  };

  // Validate form
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Title is required');
      return false;
    }
    if (!formData.episode.trim()) {
      setError('Episode number is required');
      return false;
    }
    if (!formData.vimeoUrl.trim()) {
      setError('Vimeo URL is required');
      return false;
    }
    if (!formData.duration.trim()) {
      setError('Duration is required');
      return false;
    }
    
    // Validate Vimeo URL
    const vimeoId = getVimeoId(formData.vimeoUrl);
    if (!vimeoId) {
      setError('Please enter a valid Vimeo URL');
      return false;
    }

    return true;
  };

  // Handle submit
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
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }
      
      // Prepare topics as an array
      const topicsArray = formData.topics
        ? formData.topics.split(',').map(topic => topic.trim())
        : [];
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts/${podcast._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          episode: parseInt(formData.episode),
          season: parseInt(formData.season),
          duration: parseInt(formData.duration),
          topics: topicsArray,
          isPublished: formData.isPublished === true || formData.isPublished === 'true'
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to update podcast');
      }
      
      const data = await response.json();
      
      // Notify parent
      onPodcastUpdated(data.data);
      
    } catch (err) {
      setError(err.message);
      console.error('Error updating podcast:', err);
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
          <h2>Edit Podcast</h2>
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
            <label htmlFor="title">
              Title <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter podcast title"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="episode">
                Episode Number <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="episode"
                name="episode"
                value={formData.episode}
                onChange={handleChange}
                placeholder="1"
                min="1"
                disabled={loading}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="season">
                Season
              </label>
              <input
                type="number"
                id="season"
                name="season"
                value={formData.season}
                onChange={handleChange}
                placeholder="1"
                min="1"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="vimeoUrl">
              Vimeo URL <span className={styles.required}>*</span>
            </label>
            <input
              type="url"
              id="vimeoUrl"
              name="vimeoUrl"
              value={formData.vimeoUrl}
              onChange={handleChange}
              placeholder="https://vimeo.com/123456789"
              disabled={loading}
              required
            />
            <small className={styles.formHelp}>
              {formData.vimeoUrl ? 
                (getVimeoId(formData.vimeoUrl) ? 'Valid Vimeo URL' : 'Invalid Vimeo URL') :
                'Example: https://vimeo.com/123456789'}
            </small>
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Podcast thumbnail" />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">
                Category
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={loading}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="duration">
                Duration (minutes) <span className={styles.required}>*</span>
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="45"
                min="1"
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="guestName">
                Guest Name
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleChange}
                placeholder="Guest name (optional)"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hostName">
                Host Name
              </label>
              <input
                type="text"
                id="hostName"
                name="hostName"
                value={formData.hostName}
                onChange={handleChange}
                placeholder="Mike Levis"
                disabled={loading}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="coverImage">
              Cover Image URL
            </label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://example.com/image.jpg (optional)"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="publishDate">
              Publish Date
            </label>
            <input
              type="date"
              id="publishDate"
              name="publishDate"
              value={formData.publishDate}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="topics">
              Topics (separated by commas)
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              placeholder="music, history, career"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Podcast description"
              disabled={loading}
              rows={4}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                name="isPublished"
                checked={formData.isPublished}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  isPublished: e.target.checked
                }))}
                disabled={loading}
              />
              Publish
            </label>
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
                <i className="fas fa-save"></i> Update
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditPodcastModal;
