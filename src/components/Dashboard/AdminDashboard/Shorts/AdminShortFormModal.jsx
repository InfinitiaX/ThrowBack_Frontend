import React, { useState, useEffect } from 'react';
import styles from '../Videos/Videos.module.css';

// Configuration de l'URL de l'API - Suppression de l'espace qui causait des problèmes
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

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
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Fonction pour obtenir les headers d'authentification
  const getAuthHeaders = (contentType = 'application/json') => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError("Authentification requise. Veuillez vous reconnecter.");
      return null;
    }
    
    if (contentType) {
      return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': contentType
      };
    }
    
    return { 'Authorization': `Bearer ${token}` };
  };

  // Fonction pour obtenir les URLs complètes
  const getFullVideoUrl = (path) => {
    if (!path) return '';
    
    // Si l'URL est déjà absolue, la retourner telle quelle
    if (path.startsWith('http')) return path;
    
    // S'assurer que le chemin commence par un slash
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    
    // URL de base sans espace à la fin
    const baseWithoutTrailingSlash = API_BASE_URL.endsWith('/') 
      ? API_BASE_URL.slice(0, -1) 
      : API_BASE_URL;
    
    return `${baseWithoutTrailingSlash}${normalizedPath}`;
  };

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
        
        // Pour les fichiers uploadés, on peut essayer de générer un aperçu
        if (initialData.youtubeUrl && !initialData.youtubeUrl.includes('youtube')) {
          setPreviewUrl(getFullVideoUrl(initialData.youtubeUrl));
        }
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
    setUploadProgress(0);
    
    // Ne pas réinitialiser previewUrl ici pour permettre aux prévisualisations de s'afficher
  }, [isEdit, initialData, isOpen]);

  if (!isOpen) return null;

  const getYouTubeVideoId = (url) => {
    try {
      if (!url) return null;
      
      // Try with URL API first
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
      } catch (urlError) {
        // Fallback method with regex
        const match = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
        if (match && match[1]) {
          return match[1];
        }
        return null;
      }
    } catch (error) {
      console.error("Error parsing YouTube URL:", error);
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

  // Fonction améliorée avec retries pour l'upload
  const uploadWithRetry = async (url, formData, maxRetries = 2) => {
    let lastError = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Tentative d'upload ${attempt + 1}/${maxRetries + 1}`);
        
        const xhr = new XMLHttpRequest();
        
        // Promisifier XMLHttpRequest pour avoir le support du progress
        const uploadPromise = new Promise((resolve, reject) => {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const percentComplete = Math.round((event.loaded / event.total) * 100);
              setUploadProgress(percentComplete);
            }
          });
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const response = JSON.parse(xhr.responseText);
                resolve(response);
              } catch (parseError) {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              try {
                const errorResponse = JSON.parse(xhr.responseText);
                reject(new Error(errorResponse.message || `Error ${xhr.status}`));
              } catch (parseError) {
                reject(new Error(`Error ${xhr.status}`));
              }
            }
          };
          
          xhr.onerror = () => reject(new Error('Network error'));
          xhr.ontimeout = () => reject(new Error('Request timed out'));
        });
        
        // Configurez et envoyez la requête
        xhr.open('POST', url, true);
        
        // Ajoutez les headers d'authentification
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        // Ne pas définir Content-Type, le navigateur le fera avec la boundary
        xhr.timeout = 60000 * (attempt + 1); // Augmenter le timeout pour chaque tentative
        xhr.withCredentials = true; // Important pour CORS avec credentials
        
        // Envoi de la requête
        xhr.send(formData);
        
        // Attendre la fin de l'upload
        const response = await uploadPromise;
        return response;
      } catch (err) {
        console.error(`Erreur tentative ${attempt + 1}:`, err);
        lastError = err;
        
        // Si ce n'est pas la dernière tentative, attendre avant de réessayer
        if (attempt < maxRetries) {
          setUploadProgress(0); // Réinitialiser la progression
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }
    
    // Si toutes les tentatives échouent, lancer l'erreur
    throw lastError;
  };

  // Version améliorée de handleSubmit
  const handleSubmit = async e => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    setUploadProgress(0);
    
    try {
      let response;
      
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
        
        const res = await fetch(`${API_BASE_URL}/api/admin/shorts/${initialData._id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(payload),
          credentials: 'include'
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || `Erreur ${res.status}: ${res.statusText}`);
        }
        
        response = await res.json();
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
          
          const headers = getAuthHeaders();
          if (!headers) {
            setLoading(false);
            return;
          }
          
          console.log("Creating short with YouTube URL");
          
          const res = await fetch(`${API_BASE_URL}/api/admin/shorts`, {
            method: 'POST',
            headers,
            body: JSON.stringify(payload),
            credentials: 'include'
          });
          
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Erreur ${res.status}: ${res.statusText}`);
          }
          
          response = await res.json();
        } else {
          // Create with file upload
          const formData = new FormData();
          formData.append('titre', form.titre);
          formData.append('artiste', form.artiste);
          formData.append('description', form.description);
          formData.append('type', 'short');
          if (file) formData.append('videoFile', file); // S'assurer que le nom correspond à ce qu'attend le backend
          if (videoDuration) formData.append('duree', Math.round(videoDuration));
          
          console.log("Creating short with file upload");
          
          // Utiliser notre fonction améliorée avec retry et progress
          response = await uploadWithRetry(`${API_BASE_URL}/api/admin/shorts`, formData);
        }
      }
      
      console.log("Form submission response:", response);
      
      // Normaliser la structure de réponse
      let savedShort;
      if (response.data) {
        savedShort = response.data;
      } else if (response.video) {
        savedShort = response.video;
      } else {
        savedShort = response;
      }
      
      // Ensure videoUrl is absolute
      if (savedShort.youtubeUrl && !savedShort.youtubeUrl.startsWith('http')) {
        savedShort.youtubeUrl = getFullVideoUrl(savedShort.youtubeUrl);
      }
      
      // Notify parent of success
      onShortSaved(savedShort);
      
      // Close modal and reset
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || "Une erreur s'est produite lors de l'enregistrement");
      setUploadProgress(0);
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
                <img 
                  src={previewUrl} 
                  alt="Video preview" 
                  crossOrigin="anonymous"
                  onError={(e) => {
                    console.error("Preview image error:", e);
                    e.target.src = '/images/placeholder-video.jpg';
                  }}
                />
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

          {/* Progress bar for file upload */}
          {loading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className={styles.progressContainer}>
              <label>Upload Progress</label>
              <div className={styles.progressBarContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${uploadProgress}%` }}
                />
                <span className={styles.progressText}>{uploadProgress}%</span>
              </div>
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