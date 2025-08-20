import React, { useState, useEffect } from 'react';
import styles from '../Videos/Videos.module.css';

// Configuration de l'URL de l'API
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

  useEffect(() => {
    if (isEdit && initialData) {
      setForm({
        titre: initialData.titre || '',
        artiste: initialData.artiste || '',
        description: initialData.description || '',
        duree: initialData.duree || null
      });
      
      // Si le short a une URL, essayer de créer une prévisualisation
      if (initialData.youtubeUrl) {
        // Pour les fichiers locaux, laisser vide - sera généré à la demande
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
        setDurationError('Veuillez sélectionner un fichier vidéo valide.');
        return;
      }
      
      // Check file size (50MB max)
      if (selectedFile.size > 50 * 1024 * 1024) {
        setDurationError('Le fichier est trop volumineux (max 50MB).');
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
          setDurationError('La vidéo dépasse 30 secondes.');
        } else if (video.duration < 10) {
          setDurationError('La vidéo doit durer au moins 10 secondes.');
        } else {
          setDurationError('');
        }
      };
      video.onerror = () => {
        window.URL.revokeObjectURL(url);
        setDurationError('Impossible de lire ce fichier vidéo.');
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
      setError('Le titre est requis');
      return false;
    }
    
    if (!form.artiste.trim()) {
      setError('L\'artiste est requis');
      return false;
    }
    
    if (!isEdit && !file) {
      setError('Veuillez sélectionner un fichier vidéo');
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
        
        const headers = getAuthHeaders(null); // Pas de Content-Type pour FormData
        if (!headers) {
          setLoading(false);
          return;
        }
        
        console.log("Creating short with file upload");
        
        // Utiliser XMLHttpRequest pour suivre la progression
        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${API_BASE_URL}/api/admin/shorts`, true);
        
        // Ajouter les headers d'authentification
        xhr.setRequestHeader('Authorization', headers.Authorization);
        
        // Suivre la progression
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percentComplete = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percentComplete);
          }
        };
        
        // Gérer la réponse
        xhr.onload = function() {
          if (xhr.status >= 200 && xhr.status < 300) {
            const response = JSON.parse(xhr.responseText);
            onShortSaved(response.data || response.video || response);
            onClose();
          } else {
            let errorMsg = "Une erreur est survenue lors de l'upload";
            try {
              const errorData = JSON.parse(xhr.responseText);
              errorMsg = errorData.message || errorMsg;
            } catch (e) {}
            setError(errorMsg);
            setLoading(false);
          }
        };
        
        // Gérer les erreurs
        xhr.onerror = function() {
          setError("Erreur réseau lors de l'upload");
          setLoading(false);
        };
        
        // Envoyer la requête
        xhr.send(formData);
        return; // Sortir de la fonction ici car XMLHttpRequest gère déjà la réponse
      }
      
      console.log("Response status:", res.status);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Erreur ${res.status}: ${res.statusText}`);
      }
      
      data = await res.json();
      console.log("Form submission response:", data);
      
      // Notify parent of success
      onShortSaved(data.data || data.video || data);
      
      // Close modal and reset
      onClose();
    } catch (err) {
      console.error("Form submission error:", err);
      setError(err.message || "Une erreur s'est produite lors de l'enregistrement");
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
          <h2>{isEdit ? 'Modifier un Short' : 'Ajouter un Short'}</h2>
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
              Titre <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="titre"
              name="titre"
              value={form.titre}
              onChange={handleChange}
              placeholder="Entrez le titre du short"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="artiste">
              Artiste <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="artiste"
              name="artiste"
              value={form.artiste}
              onChange={handleChange}
              placeholder="Nom de l'artiste"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="videoFile">
              Fichier vidéo (10-30 secondes) <span className={styles.required}>*</span>
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
                Durée détectée: {Math.round(videoDuration)} secondes
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
              <label>Aperçu</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Aperçu de la vidéo" />
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
              placeholder="Description optionnelle"
              disabled={loading}
              rows={3}
            />
          </div>
          
          {/* Barre de progression pour l'upload */}
          {loading && uploadProgress > 0 && (
            <div className={styles.uploadProgressContainer}>
              <div 
                className={styles.uploadProgressBar} 
                style={{ width: `${uploadProgress}%` }}
              ></div>
              <span className={styles.uploadProgressText}>{uploadProgress}% Téléchargement en cours...</span>
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
            <i className="fas fa-times"></i> Annuler
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
                {isEdit ? 'Mise à jour...' : 'Création...'}
              </>
            ) : (
              <>
                <i className={`fas fa-${isEdit ? 'save' : 'plus'}`}></i>
                {isEdit ? 'Mettre à jour' : 'Créer le Short'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShortFormModal;