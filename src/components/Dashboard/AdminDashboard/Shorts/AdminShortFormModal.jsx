import React, { useState, useEffect } from 'react';
import styles from '../Videos/Videos.module.css';

const AdminShortFormModal = ({ isOpen, onClose, onShortSaved, initialData }) => {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    titre: '',
    artiste: '',
    description: '',
    youtubeUrl: ''
  });
  const [file, setFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [durationError, setDurationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadMode, setUploadMode] = useState('file'); 

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        titre: initialData.titre || '',
        artiste: initialData.artiste || '',
        description: initialData.description || '',
        youtubeUrl: initialData.youtubeUrl || ''
      });
      
      // Detect mode based on existing URL
      if (initialData.youtubeUrl && initialData.youtubeUrl.includes('youtube')) {
        setUploadMode('youtube');
        
        // Generate preview for YouTube
        const videoId = getYouTubeVideoId(initialData.youtubeUrl);
        if (videoId) {
          setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
        }
      } else {
        setUploadMode('file');
      }
    } else {
      setForm({ titre: '', artiste: '', description: '', youtubeUrl: '' });
      setUploadMode('file');
    }
    
    // Reset other states
    setFile(null);
    setVideoDuration(null);
    setDurationError('');
    setError('');
    setPreviewUrl('');
  }, [isEdit, initialData, isOpen]);

  if (!isOpen) return null;

  const getYouTubeVideoId = (url) => {
    try {
      const videoUrl = new URL(url);
      let videoId = '';
      
      if (videoUrl.hostname.includes('youtube.com')) {
        // Classic format: youtube.com/watch?v=VIDEO_ID
        if (videoUrl.searchParams.get('v')) {
          videoId = videoUrl.searchParams.get('v');
        }
        // Shorts format: youtube.com/shorts/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/shorts/')) {
          videoId = videoUrl.pathname.replace('/shorts/', '');
        }
        // Embed format: youtube.com/embed/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/embed/')) {
          videoId = videoUrl.pathname.replace('/embed/', '');
        }
      } else if (videoUrl.hostname.includes('youtu.be')) {
        // Short format: youtu.be/VIDEO_ID
        videoId = videoUrl.pathname.substring(1);
      }
      
      return videoId;
    } catch (error) {
      return null;
    }
  };

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    // For YouTube URL, generate preview
    if (name === 'youtubeUrl' && uploadMode === 'youtube') {
      const videoId = getYouTubeVideoId(value);
      if (videoId) {
        setPreviewUrl(`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`);
      } else {
        setPreviewUrl('');
      }
    }
    
    if (error) setError('');
  };

  const handleFileChange = e => {
    const selectedFile = e.target.files[0] || null;
    setFile(selectedFile);
    setDurationError('');
    setVideoDuration(null);
    setPreviewUrl('');
    
    if (selectedFile) {
      // Validate file type
      if (!selectedFile.type.startsWith('video/')) {
        setDurationError('Please select a valid video file.');
        return;
      }
      
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setDurationError('File is too large (max 50MB).');
        return;
      }
      
      // Create preview and check duration
      const url = URL.createObjectURL(selectedFile);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(url);
        setVideoDuration(video.duration);
        
        if (video.duration > 30) {
          setDurationError('Video exceeds 30 seconds.');
        } else if (video.duration < 10) {
          setDurationError('Video must be at least 10 seconds long.');
        } else {
          setDurationError('');
        }
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(url);
        setDurationError('Unable to read video file.');
      };
      video.src = url;
      
      // Create thumbnail preview
      video.addEventListener('loadeddata', () => {
        video.currentTime = 1; 
      });
      
      video.addEventListener('seeked', () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        setPreviewUrl(canvas.toDataURL());
      });
    }
  };

  const validateForm = () => {
    if (!form.titre.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (uploadMode === 'youtube') {
      if (!form.youtubeUrl.trim()) {
        setError('YouTube URL is required');
        return false;
      }
      
      // Verify it's a valid YouTube URL
      const isValidYouTubeUrl = 
        form.youtubeUrl.includes('youtube.com/watch?v=') ||
        form.youtubeUrl.includes('youtube.com/shorts/') ||
        form.youtubeUrl.includes('youtube.com/embed/') ||
        form.youtubeUrl.includes('youtu.be/');
      
      if (!isValidYouTubeUrl) {
        setError('Please enter a valid YouTube URL (youtube.com or youtu.be)');
        return false;
      }
      
      const videoId = getYouTubeVideoId(form.youtubeUrl);
      if (!videoId || videoId.length < 10) {
        setError('Unable to extract video ID from this URL');
        return false;
      }
    } else if (!isEdit) {
      if (!file) {
        setError('Please select a video file');
        return false;
      }
      
      if (durationError) {
        setError(durationError);
        return false;
      }
    }
    
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      let res, data;
      
      if (isEdit) {
        // Edit mode - metadata only
        const payload = {
          ...form,
          type: 'short'
        };
        
        res = await fetch(`/api/admin/shorts/${initialData._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
      } else {
        // Creation mode
        if (uploadMode === 'youtube') {
          // Create with YouTube URL (admin)
          const payload = {
            titre: form.titre,
            artiste: form.artiste,
            description: form.description,
            youtubeUrl: form.youtubeUrl,
            type: 'short'
          };
          
          res = await fetch('/api/admin/shorts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
          });
        } else {
          // Create with file upload
          const formData = new FormData();
          formData.append('titre', form.titre);
          formData.append('artiste', form.artiste);
          formData.append('description', form.description);
          formData.append('type', 'short');
          if (file) formData.append('videoFile', file);
          if (videoDuration) formData.append('duree', Math.round(videoDuration));
          
          res = await fetch('/api/admin/shorts', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          });
        }
      }
      
      data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.message || 'Error saving short');
      }
      
      // Notify parent of success
      onShortSaved(data.data || data.video || data);
      
      // Close modal and reset
      onClose();
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>{isEdit ? 'Edit Short' : 'Add Short'}</h2>
          <button className={styles.closeButton} onClick={handleClose} disabled={loading}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalForm}>
          {error && (
            <div className={styles.errorMessage}>
              <i className="fas fa-exclamation-circle"></i>
              {error}
            </div>
          )}

          {/* Mode selection (creation only) */}
          {!isEdit && (
            <div className={styles.formGroup}>
              <label>Upload Method</label>
              <div className={styles.modeSelector}>
                <button
                  type="button"
                  className={`${styles.modeButton} ${uploadMode === 'file' ? styles.active : ''}`}
                  onClick={() => {
                    setUploadMode('file');
                    setForm(prev => ({ ...prev, youtubeUrl: '' }));
                    setPreviewUrl('');
                  }}
                >
                  <i className="fas fa-upload"></i> Upload File
                </button>
                <button
                  type="button"
                  className={`${styles.modeButton} ${uploadMode === 'youtube' ? styles.active : ''}`}
                  onClick={() => {
                    setUploadMode('youtube');
                    setFile(null);
                    setVideoDuration(null);
                    setDurationError('');
                    setPreviewUrl('');
                  }}
                >
                  <i className="fab fa-youtube"></i> YouTube URL
                </button>
              </div>
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
              value={form.titre}
              onChange={handleChange}
              placeholder="Enter short title"
              disabled={loading}
              required
            />
          </div>

          {uploadMode === 'youtube' ? (
            <div className={styles.formGroup}>
              <label htmlFor="youtubeUrl">
                YouTube URL <span className={styles.required}>*</span>
              </label>
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                value={form.youtubeUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/shorts/... or https://youtu.be/..."
                disabled={loading}
                required={uploadMode === 'youtube'}
              />
              {form.youtubeUrl && getYouTubeVideoId(form.youtubeUrl) && (
                <div className={styles.durationInfo}>
                  ✓ Valid YouTube URL detected
                </div>
              )}
              {form.youtubeUrl && !getYouTubeVideoId(form.youtubeUrl) && form.youtubeUrl.length > 10 && (
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-triangle"></i>
                  Invalid YouTube URL format
                </div>
              )}
            </div>
          ) : (
            <div className={styles.formGroup}>
              <label htmlFor="videoFile">
                Video File (10-30 seconds) <span className={styles.required}>*</span>
              </label>
              <input
                type="file"
                id="videoFile"
                accept="video/*"
                onChange={handleFileChange}
                disabled={loading}
                required={!isEdit && uploadMode === 'file'}
              />
              {videoDuration && (
                <div className={styles.durationInfo}>
                  Duration detected: {Math.round(videoDuration)} seconds
                </div>
              )}
              {durationError && (
                <div className={styles.errorMessage}>
                  <i className="fas fa-exclamation-triangle"></i>
                  {durationError}
                </div>
              )}
            </div>
          )}

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Video preview" />
              </div>
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="artiste">Artist</label>
            <input
              type="text"
              id="artiste"
              name="artiste"
              value={form.artiste}
              onChange={handleChange}
              placeholder="Artist name"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Optional description"
              disabled={loading}
              rows={3}
            />
          </div>
        </div>
        
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
            type="button"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading || !!durationError}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> 
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i>
                {isEdit ? 'Update Short' : 'Create Short'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShortFormModal;