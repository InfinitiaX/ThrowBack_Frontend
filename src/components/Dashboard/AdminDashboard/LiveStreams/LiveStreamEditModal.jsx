// components/LiveThrowback/LiveStreamEditModal.jsx
import React, { useState, useEffect } from 'react';
import styles from './LiveThrowback.module.css';

const LiveStreamEditModal = ({ isOpen, onClose, livestream, onSave, apiBaseUrl }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
    category: 'MUSIC_PERFORMANCE',
    hostName: '',
    tags: '',
    isPublic: true,
    chatEnabled: true,
    moderationEnabled: true,
    recordAfterStream: true
  });

  const [playbackConfig, setPlaybackConfig] = useState({
    loop: true,
    shuffle: false,
    transitionEffect: 'none'
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  // Initialiser le formulaire avec les données du livestream
  useEffect(() => {
    if (livestream) {
      setFormData({
        title: livestream.title || '',
        description: livestream.description || '',
        scheduledStartTime: formatDateTimeForInput(new Date(livestream.scheduledStartTime)) || '',
        scheduledEndTime: formatDateTimeForInput(new Date(livestream.scheduledEndTime)) || '',
        category: livestream.category || 'MUSIC_PERFORMANCE',
        hostName: livestream.hostName || 'ThrowBack Host',
        tags: Array.isArray(livestream.tags) ? livestream.tags.join(', ') : '',
        isPublic: livestream.isPublic !== false,
        chatEnabled: livestream.chatEnabled !== false,
        moderationEnabled: livestream.moderationEnabled !== false,
        recordAfterStream: livestream.recordAfterStream !== false
      });

      if (livestream.playbackConfig) {
        setPlaybackConfig({
          loop: livestream.playbackConfig.loop !== false,
          shuffle: livestream.playbackConfig.shuffle || false,
          transitionEffect: livestream.playbackConfig.transitionEffect || 'none'
        });
      }
    }
  }, [livestream]);

  // Helper pour formater la date pour les inputs datetime-local
  function formatDateTimeForInput(date) {
    if (!date || isNaN(date.getTime())) return '';
    
    try {
      // Format YYYY-MM-DDThh:mm
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      console.error('Erreur lors du formatage de la date:', e);
      return '';
    }
  }

  // Mettre à jour le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Effacer l'erreur correspondante
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Mettre à jour la configuration de lecture
  const handlePlaybackConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    setPlaybackConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!formData.scheduledStartTime) {
      newErrors.scheduledStartTime = 'La date de début est requise';
    }
    
    if (!formData.scheduledEndTime) {
      newErrors.scheduledEndTime = 'La date de fin est requise';
    }
    
    const start = new Date(formData.scheduledStartTime);
    const end = new Date(formData.scheduledEndTime);
    
    if (end <= start) {
      newErrors.scheduledEndTime = 'La date de fin doit être postérieure à la date de début';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Gérer la soumission du formulaire
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      
      // Convertir les tags en tableau
      const tagsArray = formData.tags
        ? formData.tags.split(',').map(tag => tag.trim())
        : [];
      
      // Préparer les données pour l'API
      const updatedData = {
        ...formData,
        tags: tagsArray,
        playbackConfig
      };
      
      await onSave(livestream._id, updatedData);
      
      onClose();
    } catch (error) {
      console.error('Error updating livestream:', error);
      setErrors({ submit: error.message || 'Une erreur est survenue lors de la mise à jour' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !livestream) return null;

  // Liste des catégories disponibles
  const categories = [
    'MUSIC_PERFORMANCE',
    'TALK_SHOW',
    'Q_AND_A',
    'BEHIND_THE_SCENES',
    'THROWBACK_SPECIAL',
    'OTHER'
  ];

  // Liste des effets de transition
  const transitionEffects = [
    { value: 'none', label: 'Aucun' },
    { value: 'fade', label: 'Fondu' },
    { value: 'slide', label: 'Glissement' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'flip', label: 'Retournement' }
  ];

  // Vérifier si le livestream est une compilation
  const isCompilation = livestream.compilationType === 'VIDEO_COLLECTION' && 
                      Array.isArray(livestream.compilationVideos) && 
                      livestream.compilationVideos.length > 0;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentLarge}>
        <div className={styles.modalHeader}>
          <h3>Modifier le LiveThrowback</h3>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
        
        <div className={styles.modalBody}>
          <div className={styles.editForm}>
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Informations générales</h4>
              
              <div className={styles.formGroup}>
                <label htmlFor="title">
                  Titre <span className={styles.requiredField}>*</span>
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Titre de votre LiveThrowback"
                  className={errors.title ? styles.inputError : ''}
                  disabled={loading}
                />
                {errors.title && <div className={styles.errorText}>{errors.title}</div>}
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Décrivez votre LiveThrowback..."
                  rows={3}
                  disabled={loading}
                />
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="scheduledStartTime">
                    Date de début <span className={styles.requiredField}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledStartTime"
                    name="scheduledStartTime"
                    value={formData.scheduledStartTime}
                    onChange={handleChange}
                    className={errors.scheduledStartTime ? styles.inputError : ''}
                    disabled={loading}
                  />
                  {errors.scheduledStartTime && <div className={styles.errorText}>{errors.scheduledStartTime}</div>}
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="scheduledEndTime">
                    Date de fin <span className={styles.requiredField}>*</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledEndTime"
                    name="scheduledEndTime"
                    value={formData.scheduledEndTime}
                    onChange={handleChange}
                    className={errors.scheduledEndTime ? styles.inputError : ''}
                    disabled={loading}
                  />
                  {errors.scheduledEndTime && <div className={styles.errorText}>{errors.scheduledEndTime}</div>}
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Catégorie</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="hostName">Nom de l'hôte</label>
                  <input
                    type="text"
                    id="hostName"
                    name="hostName"
                    value={formData.hostName}
                    onChange={handleChange}
                    placeholder="Nom de l'hôte"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="tags">Tags (séparés par des virgules)</label>
                <input
                  type="text"
                  id="tags"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="musique, oldies, années80, ..."
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Options</h4>
              
              <div className={styles.formCheckboxGroup}>
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="isPublic"
                    name="isPublic"
                    checked={formData.isPublic}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="isPublic">Rendre public</label>
                </div>
                
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="chatEnabled"
                    name="chatEnabled"
                    checked={formData.chatEnabled}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="chatEnabled">Activer le chat</label>
                </div>
                
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="moderationEnabled"
                    name="moderationEnabled"
                    checked={formData.moderationEnabled}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="moderationEnabled">Activer la modération</label>
                </div>
                
                <div className={styles.checkboxItem}>
                  <input
                    type="checkbox"
                    id="recordAfterStream"
                    name="recordAfterStream"
                    checked={formData.recordAfterStream}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label htmlFor="recordAfterStream">Enregistrer le direct</label>
                </div>
              </div>
            </div>
            
            {isCompilation && (
              <div className={styles.formSection}>
                <div className={styles.advancedSettingsToggle}>
                  <button 
                    type="button"
                    className={styles.toggleButton}
                    onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                    disabled={loading}
                  >
                    <i className={`fas ${showAdvancedSettings ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    {showAdvancedSettings ? 'Masquer les paramètres de lecture' : 'Paramètres de lecture'}
                  </button>
                </div>
                
                {showAdvancedSettings && (
                  <div className={styles.advancedSettings}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="transitionEffect">Effet de transition</label>
                        <select
                          id="transitionEffect"
                          name="transitionEffect"
                          value={playbackConfig.transitionEffect}
                          onChange={handlePlaybackConfigChange}
                          disabled={loading}
                        >
                          {transitionEffects.map(effect => (
                            <option key={effect.value} value={effect.value}>
                              {effect.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    <div className={styles.formCheckboxGroup}>
                      <div className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id="loop"
                          name="loop"
                          checked={playbackConfig.loop}
                          onChange={handlePlaybackConfigChange}
                          disabled={loading}
                        />
                        <label htmlFor="loop">Lecture en boucle</label>
                      </div>
                      
                      <div className={styles.checkboxItem}>
                        <input
                          type="checkbox"
                          id="shuffle"
                          name="shuffle"
                          checked={playbackConfig.shuffle}
                          onChange={handlePlaybackConfigChange}
                          disabled={loading}
                        />
                        <label htmlFor="shuffle">Lecture aléatoire</label>
                      </div>
                    </div>
                    
                    <div className={styles.compilationInfo}>
                      <p><i className="fas fa-info-circle"></i> Cette compilation contient {livestream.compilationVideos.length} vidéos. Pour modifier la liste des vidéos, vous devez créer un nouveau LiveThrowback.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {errors.submit && (
              <div className={styles.formError}>
                <i className="fas fa-exclamation-circle"></i>
                <span>{errors.submit}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className={styles.modalFooter}>
          <button 
            className={styles.cancelButton}
            onClick={onClose}
            disabled={loading}
          >
            <i className="fas fa-times"></i> Annuler
          </button>
          
          <button 
            className={styles.saveButton}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <>
                <i className="fas fa-spinner fa-spin"></i> Enregistrement...
              </>
            ) : (
              <>
                <i className="fas fa-save"></i> Enregistrer les modifications
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamEditModal;