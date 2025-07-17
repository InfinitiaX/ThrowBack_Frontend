// components/LiveThrowback/LiveStreamScheduler.jsx
import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const LiveStreamScheduler = ({ onSchedule, videosSelected, isLoading }) => {
  const [schedulingData, setSchedulingData] = useState({
    title: '',
    description: '',
    startDate: formatDateTimeForInput(addMinutes(new Date(), 30)),
    endDate: formatDateTimeForInput(addHours(new Date(), 3)),
    category: 'MUSIC_PERFORMANCE',
    hostName: 'ThrowBack Host',
    tags: '',
    isPublic: true,
    chatEnabled: true,
    loop: true,
    shuffle: false,
    transitionEffect: 'fade'
  });
  
  const [errors, setErrors] = useState({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  
  // Helper pour formater la date pour les inputs datetime-local
  function formatDateTimeForInput(date) {
    return date.toISOString().slice(0, 16);
  }
  
  // Helper pour ajouter des heures à une date
  function addHours(date, hours) {
    const newDate = new Date(date);
    newDate.setHours(newDate.getHours() + hours);
    return newDate;
  }

  // Helper pour ajouter des minutes à une date
  function addMinutes(date, minutes) {
    const newDate = new Date(date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return newDate;
  }
  
  // Mettre à jour le formulaire
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // S'assurer que tags reste une chaîne
    if (name === 'tags') {
      setSchedulingData(prev => ({
        ...prev,
        tags: value || ''  // Assurer qu'une chaîne vide est utilisée si value est falsy
      }));
    } else {
      setSchedulingData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
    
    // Effacer l'erreur correspondante
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[name];
        return newErrors;
      });
    }
  };
  
  // Validation du formulaire
  const validateForm = () => {
    const newErrors = {};
    
    if (!schedulingData.title.trim()) {
      newErrors.title = 'Le titre est requis';
    }
    
    if (!schedulingData.startDate) {
      newErrors.startDate = 'La date de début est requise';
    }
    
    if (!schedulingData.endDate) {
      newErrors.endDate = 'La date de fin est requise';
    }
    
    const start = new Date(schedulingData.startDate);
    const end = new Date(schedulingData.endDate);
    const now = new Date();
    
    if (start < now) {
      newErrors.startDate = 'La date de début doit être dans le futur';
    }
    
    if (end <= start) {
      newErrors.endDate = 'La date de fin doit être postérieure à la date de début';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Gérer la soumission du formulaire
  const handleSubmit = () => {
    if (!validateForm()) return;
    
    // S'assurer que tags est bien une chaîne avant de l'envoyer
    const formattedData = {
      ...schedulingData,
      tags: typeof schedulingData.tags === 'string' ? schedulingData.tags : ''
    };
    
    onSchedule(formattedData);
  };
  
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
  
  return (
    <div className={styles.schedulerContainer}>
      <div className={styles.schedulerHeader}>
        <h3>Programmer le LiveThrowback</h3>
        {!videosSelected && (
          <div className={styles.warningMessage}>
            <i className="fas fa-exclamation-triangle"></i> Ajoutez au moins une vidéo avant de programmer
          </div>
        )}
      </div>
      
      <div className={styles.schedulingForm}>
        <div className={styles.formGroup}>
          <label htmlFor="title">
            Titre <span className={styles.requiredField}>*</span>
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={schedulingData.title}
            onChange={handleChange}
            placeholder="Titre de votre LiveThrowback"
            className={errors.title ? styles.inputError : ''}
          />
          {errors.title && <div className={styles.errorText}>{errors.title}</div>}
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={schedulingData.description}
            onChange={handleChange}
            placeholder="Décrivez votre LiveThrowback..."
            rows={3}
          />
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="startDate">
              Date de début <span className={styles.requiredField}>*</span>
            </label>
            <input
              type="datetime-local"
              id="startDate"
              name="startDate"
              value={schedulingData.startDate}
              onChange={handleChange}
              className={errors.startDate ? styles.inputError : ''}
            />
            {errors.startDate && <div className={styles.errorText}>{errors.startDate}</div>}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="endDate">
              Date de fin <span className={styles.requiredField}>*</span>
            </label>
            <input
              type="datetime-local"
              id="endDate"
              name="endDate"
              value={schedulingData.endDate}
              onChange={handleChange}
              className={errors.endDate ? styles.inputError : ''}
            />
            {errors.endDate && <div className={styles.errorText}>{errors.endDate}</div>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="category">Catégorie</label>
            <select
              id="category"
              name="category"
              value={schedulingData.category}
              onChange={handleChange}
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
              value={schedulingData.hostName}
              onChange={handleChange}
              placeholder="Nom de l'hôte"
            />
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label htmlFor="tags">Tags (séparés par des virgules)</label>
          <input
            type="text"
            id="tags"
            name="tags"
            value={schedulingData.tags || ''}
            onChange={handleChange}
            placeholder="musique, oldies, années80, ..."
          />
        </div>
        
        <div className={styles.formCheckboxGroup}>
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={schedulingData.isPublic}
              onChange={handleChange}
            />
            <label htmlFor="isPublic">Rendre public</label>
          </div>
          
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="chatEnabled"
              name="chatEnabled"
              checked={schedulingData.chatEnabled}
              onChange={handleChange}
            />
            <label htmlFor="chatEnabled">Activer le chat</label>
          </div>
          
          <div className={styles.checkboxItem}>
            <input
              type="checkbox"
              id="loop"
              name="loop"
              checked={schedulingData.loop}
              onChange={handleChange}
            />
            <label htmlFor="loop">Lecture en boucle</label>
          </div>
        </div>
        
        <div className={styles.advancedSettingsToggle}>
          <button 
            type="button"
            className={styles.toggleButton}
            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
          >
            <i className={`fas ${showAdvancedSettings ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
            {showAdvancedSettings ? 'Masquer les paramètres avancés' : 'Paramètres avancés'}
          </button>
        </div>
        
        {showAdvancedSettings && (
          <div className={styles.advancedSettings}>
            <div className={styles.formGroup}>
              <label htmlFor="transitionEffect">Effet de transition</label>
              <select
                id="transitionEffect"
                name="transitionEffect"
                value={schedulingData.transitionEffect}
                onChange={handleChange}
              >
                {transitionEffects.map(effect => (
                  <option key={effect.value} value={effect.value}>
                    {effect.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.checkboxItem}>
              <input
                type="checkbox"
                id="shuffle"
                name="shuffle"
                checked={schedulingData.shuffle}
                onChange={handleChange}
              />
              <label htmlFor="shuffle">Lecture aléatoire</label>
            </div>
          </div>
        )}
        
        <div className={styles.formActions}>
          <button 
            className={styles.scheduleButton}
            onClick={handleSubmit}
            disabled={isLoading || !videosSelected}
          >
            {isLoading ? (
              <><i className="fas fa-spinner fa-spin"></i> Programmation en cours...</>
            ) : (
              <><i className="fas fa-calendar-plus"></i> Programmer le LiveThrowback</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamScheduler;