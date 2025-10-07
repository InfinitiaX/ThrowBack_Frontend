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

  function formatDateTimeForInput(date) {
    if (!date || isNaN(date.getTime())) return '';
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (e) {
      console.error('Date formatting error:', e);
      return '';
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handlePlaybackConfigChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPlaybackConfig(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.scheduledStartTime) newErrors.scheduledStartTime = 'Start date is required';
    if (!formData.scheduledEndTime) newErrors.scheduledEndTime = 'End date is required';
    const start = new Date(formData.scheduledStartTime);
    const end = new Date(formData.scheduledEndTime);
    if (end <= start) newErrors.scheduledEndTime = 'End date must be after start date';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const tagsArray = formData.tags ? formData.tags.split(',').map(tag => tag.trim()) : [];
      const updatedData = { ...formData, tags: tagsArray, playbackConfig };
      await onSave(livestream._id, updatedData);
      onClose();
    } catch (error) {
      console.error('Error updating livestream:', error);
      setErrors({ submit: error.message || 'An error occurred while updating' });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !livestream) return null;

  const categories = [
    'MUSIC_PERFORMANCE',
    'TALK_SHOW',
    'Q_AND_A',
    'BEHIND_THE_SCENES',
    'THROWBACK_SPECIAL',
    'OTHER'
  ];

  const transitionEffects = [
    { value: 'none', label: 'None' },
    { value: 'fade', label: 'Fade' },
    { value: 'slide', label: 'Slide' },
    { value: 'zoom', label: 'Zoom' },
    { value: 'flip', label: 'Flip' }
  ];

  const isCompilation = livestream.compilationType === 'VIDEO_COLLECTION' && Array.isArray(livestream.compilationVideos) && livestream.compilationVideos.length > 0;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContentLarge}>
        <div className={styles.modalHeader}>
          <h3>Edit LiveThrowback</h3>
          <button className={styles.closeButton} onClick={onClose} disabled={loading}><i className="fas fa-times"></i></button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.editForm}>
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>General Information</h4>
              <div className={styles.formGroup}>
                <label htmlFor="title">Title <span className={styles.requiredField}>*</span></label>
                <input type="text" id="title" name="title" value={formData.title} onChange={handleChange} placeholder="Enter LiveThrowback title" className={errors.title ? styles.inputError : ''} disabled={loading} />
                {errors.title && <div className={styles.errorText}>{errors.title}</div>}
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="description">Description</label>
                <textarea id="description" name="description" value={formData.description} onChange={handleChange} placeholder="Describe your LiveThrowback..." rows={3} disabled={loading}></textarea>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="scheduledStartTime">Start Date <span className={styles.requiredField}>*</span></label>
                  <input type="datetime-local" id="scheduledStartTime" name="scheduledStartTime" value={formData.scheduledStartTime} onChange={handleChange} className={errors.scheduledStartTime ? styles.inputError : ''} disabled={loading} />
                  {errors.scheduledStartTime && <div className={styles.errorText}>{errors.scheduledStartTime}</div>}
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="scheduledEndTime">End Date <span className={styles.requiredField}>*</span></label>
                  <input type="datetime-local" id="scheduledEndTime" name="scheduledEndTime" value={formData.scheduledEndTime} onChange={handleChange} className={errors.scheduledEndTime ? styles.inputError : ''} disabled={loading} />
                  {errors.scheduledEndTime && <div className={styles.errorText}>{errors.scheduledEndTime}</div>}
                </div>
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="category">Category</label>
                  <select id="category" name="category" value={formData.category} onChange={handleChange} disabled={loading}>
                    {categories.map(category => (<option key={category} value={category}>{category.replace(/_/g, ' ')}</option>))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label htmlFor="hostName">Host Name</label>
                  <input type="text" id="hostName" name="hostName" value={formData.hostName} onChange={handleChange} placeholder="Enter host name" disabled={loading} />
                </div>
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="tags">Tags (comma separated)</label>
                <input type="text" id="tags" name="tags" value={formData.tags} onChange={handleChange} placeholder="music, oldies, 80s..." disabled={loading} />
              </div>
            </div>
            <div className={styles.formSection}>
              <h4 className={styles.sectionTitle}>Options</h4>
              <div className={styles.formCheckboxGroup}>
                <div className={styles.checkboxItem}>
                  <input type="checkbox" id="isPublic" name="isPublic" checked={formData.isPublic} onChange={handleChange} disabled={loading} />
                  <label htmlFor="isPublic">Make Public</label>
                </div>
                <div className={styles.checkboxItem}>
                  <input type="checkbox" id="chatEnabled" name="chatEnabled" checked={formData.chatEnabled} onChange={handleChange} disabled={loading} />
                  <label htmlFor="chatEnabled">Enable Chat</label>
                </div>
                <div className={styles.checkboxItem}>
                  <input type="checkbox" id="moderationEnabled" name="moderationEnabled" checked={formData.moderationEnabled} onChange={handleChange} disabled={loading} />
                  <label htmlFor="moderationEnabled">Enable Moderation</label>
                </div>
                <div className={styles.checkboxItem}>
                  <input type="checkbox" id="recordAfterStream" name="recordAfterStream" checked={formData.recordAfterStream} onChange={handleChange} disabled={loading} />
                  <label htmlFor="recordAfterStream">Record Stream</label>
                </div>
              </div>
            </div>
            {isCompilation && (
              <div className={styles.formSection}>
                <div className={styles.advancedSettingsToggle}>
                  <button type="button" className={styles.toggleButton} onClick={() => setShowAdvancedSettings(!showAdvancedSettings)} disabled={loading}>
                    <i className={`fas ${showAdvancedSettings ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
                    {showAdvancedSettings ? 'Hide Playback Settings' : 'Playback Settings'}
                  </button>
                </div>
                {showAdvancedSettings && (
                  <div className={styles.advancedSettings}>
                    <div className={styles.formRow}>
                      <div className={styles.formGroup}>
                        <label htmlFor="transitionEffect">Transition Effect</label>
                        <select id="transitionEffect" name="transitionEffect" value={playbackConfig.transitionEffect} onChange={handlePlaybackConfigChange} disabled={loading}>
                          {transitionEffects.map(effect => (<option key={effect.value} value={effect.value}>{effect.label}</option>))}
                        </select>
                      </div>
                    </div>
                    <div className={styles.formCheckboxGroup}>
                      <div className={styles.checkboxItem}>
                        <input type="checkbox" id="loop" name="loop" checked={playbackConfig.loop} onChange={handlePlaybackConfigChange} disabled={loading} />
                        <label htmlFor="loop">Loop Playback</label>
                      </div>
                      <div className={styles.checkboxItem}>
                        <input type="checkbox" id="shuffle" name="shuffle" checked={playbackConfig.shuffle} onChange={handlePlaybackConfigChange} disabled={loading} />
                        <label htmlFor="shuffle">Shuffle Playback</label>
                      </div>
                    </div>
                    <div className={styles.compilationInfo}>
                      <p><i className="fas fa-info-circle"></i> This compilation contains {livestream.compilationVideos.length} videos. To edit the list of videos, you must create a new LiveThrowback.</p>
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
          <button className={styles.cancelButton} onClick={onClose} disabled={loading}><i className="fas fa-times"></i> Cancel</button>
          <button className={styles.saveButton} onClick={handleSubmit} disabled={loading}>
            {loading ? (<><i className="fas fa-spinner fa-spin"></i> Saving...</>) : (<><i className="fas fa-save"></i> Save Changes</>)}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamEditModal;
