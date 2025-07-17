import React, { useState } from 'react';
import styles from './Podcasts.module.css';

// Liste des catégories disponibles
const CATEGORIES = [
  'PERSONAL BRANDING',
  'MUSIC BUSINESS',
  'ARTIST INTERVIEW',
  'INDUSTRY INSIGHTS',
  'THROWBACK HISTORY',
  'OTHER'
];

const AddPodcastModal = ({ isOpen, onClose, onPodcastCreated }) => {
  // Utiliser l'URL de base de l'API
  const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
  
  const [formData, setFormData] = useState({
    title: '',
    episode: '',
    season: '1',
    vimeoUrl: '',
    duration: '',
    coverImage: '',
    description: '',
    guestName: '',
    hostName: 'Mike Levis',
    publishDate: new Date().toISOString().split('T')[0],
    topics: '',
    category: 'PERSONAL BRANDING',
    isPublished: true
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');

  if (!isOpen) return null;

  // Extraire l'ID Vimeo à partir de l'URL
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
      console.error('Erreur lors de l\'extraction de l\'ID Vimeo:', error);
      return null;
    }
  };

  // Gérer les changements dans le formulaire
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Si l'URL Vimeo change, mettre à jour l'aperçu
    if (name === 'vimeoUrl') {
      const vimeoId = getVimeoId(value);
      
      if (vimeoId) {
        // Note: Dans une application réelle, nous ferions un appel API pour obtenir
        // la vignette Vimeo. Ici, nous utilisons simplement une image de substitution.
        setPreviewUrl('/images/podcast-default.jpg');
      } else {
        setPreviewUrl('');
      }
    }

    // Si coverImage est fourni, l'utiliser comme aperçu
    if (name === 'coverImage' && value) {
      setPreviewUrl(value);
    }

    // Effacer l'erreur quand l'utilisateur tape
    if (error) setError('');
  };

  // Valider le formulaire
  const validateForm = () => {
    if (!formData.title.trim()) {
      setError('Le titre est requis');
      return false;
    }
    if (!formData.episode.trim()) {
      setError('Le numéro d\'épisode est requis');
      return false;
    }
    if (!formData.vimeoUrl.trim()) {
      setError('L\'URL Vimeo est requise');
      return false;
    }
    if (!formData.duration.trim()) {
      setError('La durée est requise');
      return false;
    }
    
    // Valider l'URL Vimeo
    const vimeoId = getVimeoId(formData.vimeoUrl);
    if (!vimeoId) {
      setError('Veuillez entrer une URL Vimeo valide');
      return false;
    }

    return true;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      
      // Préparer les topics comme un tableau
      const topicsArray = formData.topics
        ? formData.topics.split(',').map(topic => topic.trim())
        : [];
      
      const response = await fetch(`${API_BASE_URL}/api/podcasts`, {
        method: 'POST',
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
        const errorData = await response.json().catch(() => ({ message: 'Erreur serveur' }));
        throw new Error(errorData.message || 'Échec de la création du podcast');
      }
      
      const data = await response.json();
      
      // Réinitialiser le formulaire
      setFormData({
        title: '',
        episode: '',
        season: '1',
        vimeoUrl: '',
        duration: '',
        coverImage: '',
        description: '',
        guestName: '',
        hostName: 'Mike Levis',
        publishDate: new Date().toISOString().split('T')[0],
        topics: '',
        category: 'PERSONAL BRANDING',
        isPublished: true
      });
      setPreviewUrl('');
      
      // Notifier le composant parent
      onPodcastCreated(data.data);
      
    } catch (err) {
      setError(err.message);
      console.error('Erreur lors de la création du podcast:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gérer la fermeture
  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        episode: '',
        season: '1',
        vimeoUrl: '',
        duration: '',
        coverImage: '',
        description: '',
        guestName: '',
        hostName: 'Mike Levis',
        publishDate: new Date().toISOString().split('T')[0],
        topics: '',
        category: 'PERSONAL BRANDING',
        isPublished: true
      });
      setPreviewUrl('');
      setError('');
      onClose();
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2>Ajouter un nouveau podcast</h2>
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
              Titre <span className={styles.required}>*</span>
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Entrez le titre du podcast"
              disabled={loading}
              required
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="episode">
                Numéro d'épisode <span className={styles.required}>*</span>
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
                Saison
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
              URL Vimeo <span className={styles.required}>*</span>
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
                (getVimeoId(formData.vimeoUrl) ? 'URL Vimeo valide' : 'URL Vimeo invalide') :
                'Exemple: https://vimeo.com/123456789'}
            </small>
          </div>

          {previewUrl && (
            <div className={styles.previewContainer}>
              <label>Aperçu</label>
              <div className={styles.thumbnailPreview}>
                <img src={previewUrl} alt="Vignette du podcast" />
              </div>
            </div>
          )}

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="category">
                Catégorie
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
                Durée (minutes) <span className={styles.required}>*</span>
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
                Nom de l'invité
              </label>
              <input
                type="text"
                id="guestName"
                name="guestName"
                value={formData.guestName}
                onChange={handleChange}
                placeholder="Nom de l'invité (optionnel)"
                disabled={loading}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="hostName">
                Nom de l'hôte
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
              URL de l'image de couverture
            </label>
            <input
              type="url"
              id="coverImage"
              name="coverImage"
              value={formData.coverImage}
              onChange={handleChange}
              placeholder="https://exemple.com/image.jpg (optionnel)"
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="publishDate">
              Date de publication
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
              Topics (séparés par des virgules)
            </label>
            <input
              type="text"
              id="topics"
              name="topics"
              value={formData.topics}
              onChange={handleChange}
              placeholder="musique, histoire, carrière"
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
              placeholder="Description du podcast"
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
              Publier immédiatement
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
            <i className="fas fa-times"></i> Annuler
          </button>
          <button 
            type="submit"
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Création...
              </>
            ) : (
              <>
                <i className="fas fa-plus"></i> Ajouter le podcast
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddPodcastModal;