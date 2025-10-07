import React, { useState, useEffect } from 'react';
import styles from '../Videos/Videos.module.css';

// API base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const AdminShortFormModal = ({ isOpen, onClose, onShortSaved, initialData }) => {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    titre: '',
    artiste: '',
    description: '',
    duree: null
  });
  const [file, setFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(null);
  const [durationError, setDurationError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get auth headers
  const getAuthHeaders = (contentType = 'application/json') => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      return null;
    }
    
    if (contentType) {
      return {
        Authorization: `Bearer ${token}`,
        'Content-Type': contentType
      };
    }
    
    return { Authorization: `Bearer ${token}` };
  };

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        titre: initialData.titre || '',
        artiste: initialData.artiste || '',
        description: initialData.description || '',
        duree: initialData.duree || null
      });
      
      // If the short has a URL, leave preview empty (generated on demand)
      if (initialData.youtubeUrl) {
        setPreviewUrl('');
      }
    } else {
      setForm({ titre: '', artiste: '', description: '', duree: null });
    }
    
    // Reset other states
    setFile(null);
    setVideoDuration(null);
    setDurationError('');
    setError('');
    setPreviewUrl('');
    setUploadProgress(0);
  }, [isEdit, initialData, isOpen]);

  if (!isOpen) return null;

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
          setDurationError('The video exceeds 30 seconds.');
        } else if (video.duration < 10) {
          setDurationError('The video must be at least 10 seconds long.');
        } else {
          setDurationError('');
        }
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(url);
        setDurationError('Unable to read this video file.');
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

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    
    if (error) setError('');
  };

  const validateForm = () => {
    if (!form.titre.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (!form.artiste.trim()) {
      setError('Artist is required');
      return false;
    }
    
    if (!isEdit && !file) {
      setError('Please select a video file');
      return false;
    }
    
    if (durationError) {
      setError(durationError);
      return false;
    }
    
    return true;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setUploadProgress(0);
    
    try {
      let res, data;
      
      if (isEdit) {
        // Edit mode - metadata only
        const payload = {
          ...form,
          type: 'short'
        };
        
        const headers = getAuthHeaders();
        if (!headers) {
          setLoading(false);
          return;
        }
        
        console.log(`Updating short: ${initialData._id}`);
        
        res = await fetch(`${API_BASE_URL}/api/admin/shorts/${initialData._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
          credentials: 'include'
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
        
        const headers = getAuthHeaders(null); // No Content-Type for FormData
        if (!headers) {
          setLoading(false);
          return;
        }
        
        console.log('Creating short with file upload');
        
        // Use XMLHttpRequest to track progress
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/admin/shorts`, true);
        
        // Add auth header
        xhr.setRequestHeader('Authorization', headers.Authorization);
        
        // Track progress
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };
        
        // Handle response
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            onShortSaved(response.data || response.video || response);
            onClose();
          } else {
            let errorMsg = 'An error occurred during upload';
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMsg = errorData.message || errorMsg;
            } catch (e) {}
            setError(errorMsg);
            setLoading(false);
          }
        };
        
        // Handle network errors
        xhr.onerror = function() {
          setError('Network error during upload');
          setLoading(false);
        };
        
        // Send request
        xhr.send(formData);
        return; // Exit here; XHR already handles the response
      }
      
      console.log('Response status:', res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
      }
      
      data = await res.json();
      console.log('Form submission response:', data);
      
      // Notify parent
      onShortSaved(data.data || data.video || data);
      
      // Close modal
      onClose();
    } catch (err) {
      console.error('Form submission error:', err);
      setError(err.message || 'An error occurred while saving');
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
              placeholder="Enter the short title"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="artiste">
              Artist <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="artiste"
              name="artiste"
              value={form.artiste}
              onChange={handleChange}
              placeholder="Artist name"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="videoFile">
              Video file (10–30 seconds) <span className={styles.required}>*</span>
            </label>
            <input
              type="file"
              id="videoFile"
              accept="video/*"
              onChange={handleFileChange}
              disabled={loading}
              required={!isEdit}
            />
            {videoDuration && (
              <div className={styles.durationInfo}>
                Detected duration: {Math.round(videoDuration)} seconds
              </div>
            )}
            {durationError && (
              <div className={styles.errorMessage}>
                <i className="fas fa-exclamation-triangle"></i>
                {durationError}
              </div>
            )}
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Preview</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Video preview" />
              </div>
            </div>
          )}

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
          
          {/* Upload progress bar */}
          {loading && uploadProgress > 0 && (
            <div className={styles.uploadProgressContainer}>
              <div 
                className={styles.uploadProgressBar} 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className={styles.uploadProgressText}>{uploadProgress}% Uploading...</span>
            </div>
          )}
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
                {isEdit ? 'Update' : 'Create Short'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShortFormModal;
