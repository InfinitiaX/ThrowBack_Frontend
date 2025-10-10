// components/Dashboard/UserDashboard/Wall/CreatePostForm.jsx
import React, { useState, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faImage, 
  faVideo, 
  faMusic, 
  faGlobe, 
  faUserFriends, 
  faLock, 
  faPaperPlane,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import styles from './CreatePostForm.module.css';

const CreatePostForm = ({ onPostCreated }) => {
  const [content, setContent] = useState('');
  const [mediaFile, setMediaFile] = useState(null);
  const [mediaPreview, setMediaPreview] = useState(null);
  const [visibility, setVisibility] = useState('PUBLIC');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const { user } = useAuth();

  // ✅ CONSTANTES : Limites de taille
  const MAX_CONTENT_LENGTH = 5000; // Augmenté pour correspondre au modèle backend
  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  // Gestion de l'upload de média
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Taille max 50MB
    if (file.size > MAX_FILE_SIZE) {
      setError('The file is too large. Max size: 50MB');
      return;
    }
    
    const previewUrl = URL.createObjectURL(file);
    setMediaFile(file);
    setMediaPreview(previewUrl);
    setError(null);
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ✅ Gestion du changement de contenu avec validation de longueur
  const handleContentChange = (e) => {
    const newContent = e.target.value;
    
    // Limiter le contenu à MAX_CONTENT_LENGTH caractères
    if (newContent.length <= MAX_CONTENT_LENGTH) {
      setContent(newContent);
      setError(null); // Effacer l'erreur si elle existe
    } else {
      setError(`Le contenu ne peut pas dépasser ${MAX_CONTENT_LENGTH} caractères`);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!content.trim() && !mediaFile) {
      setError('Please add text or media to your post');
      return;
    }

    // Vérification finale de la longueur
    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`Content is too long. Max: ${MAX_CONTENT_LENGTH} characters`);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append('contenu', content);
      formData.append('visibilite', visibility);
      
      if (mediaFile) {
        formData.append('media', mediaFile);
      }
      
      // Extraire les hashtags
      const hashtags = content.match(/#[\w\u00C0-\u017F]+/g) || [];
      if (hashtags.length > 0) {
        hashtags.forEach((tag, index) => {
          formData.append(`hashtags[${index}]`, tag.substring(1));
        });
      }
      
      const response = await api.post('/api/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // Reset
      setContent('');
      setMediaFile(null);
      setMediaPreview(null);
      setVisibility('PUBLIC');
      
      if (onPostCreated) {
        onPostCreated(response.data?.data);
      }
    } catch (err) {
      console.error('Erreur lors de la création du post:', err);
      
      // Gestion détaillée des erreurs
      if (err.response?.status === 400) {
        setError(err.response?.data?.message || 'Invalid data. Please check your post.');
      } else if (err.response?.status === 413) {
        setError('The file or content is too large');
      } else {
        setError(err.response?.data?.message || 'An error occurred while publishing');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderVisibilityIcon = () => {
    switch (visibility) {
      case 'PUBLIC':
        return <FontAwesomeIcon icon={faGlobe} />;
      case 'FRIENDS':
        return <FontAwesomeIcon icon={faUserFriends} />;
      case 'PRIVATE':
        return <FontAwesomeIcon icon={faLock} />;
      default:
        return <FontAwesomeIcon icon={faGlobe} />;
    }
  };

  const toggleVisibility = () => {
    const visibilities = ['PUBLIC', 'FRIENDS', 'PRIVATE'];
    const currentIndex = visibilities.indexOf(visibility);
    const nextIndex = (currentIndex + 1) % visibilities.length;
    setVisibility(visibilities[nextIndex]);
  };

  // Calculer le pourcentage de caractères utilisés
  const charPercentage = (content.length / MAX_CONTENT_LENGTH) * 100;
  const isNearLimit = charPercentage > 80;
  const isAtLimit = charPercentage >= 100;

  return (
    <div className={styles.createPostContainer}>
      <form onSubmit={handleSubmit} className={styles.createPostForm}>
        <div className={styles.userInfo}>
          {user?.photo_profil ? (
            <img 
              src={user.photo_profil} 
              alt={`${user.prenom} ${user.nom}`} 
              className={styles.userAvatar}
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextElementSibling.style.display = 'flex';
              }}
            />
          ) : (
            <AvatarInitials 
              user={user} 
              className={styles.userAvatar} 
            />
          )}
          <div className={styles.userName}>
            {user?.prenom} {user?.nom}
          </div>
          <div className={styles.visibilitySelector} onClick={toggleVisibility}>
            {renderVisibilityIcon()}
            <span className={styles.visibilityText}>
              {visibility === 'PUBLIC' ? 'Public' : 
               visibility === 'FRIENDS' ? 'Friends' : 'Private'}
            </span>
          </div>
        </div>
        
        <div className={styles.contentInput}>
          <textarea
            placeholder="Share your musical memories, use #hashtags..."
            value={content}
            onChange={handleContentChange}
            disabled={loading}
            rows={mediaPreview ? 2 : 4}
            className={styles.textarea}
            maxLength={MAX_CONTENT_LENGTH}
          />
          
          {/* ✅ NOUVEAU : Compteur de caractères */}
          <div className={styles.characterCounter}>
            <span 
              className={`${styles.charCount} ${isNearLimit ? styles.warning : ''} ${isAtLimit ? styles.danger : ''}`}
            >
              {content.length} / {MAX_CONTENT_LENGTH}
            </span>
          </div>
        </div>
        
        {mediaPreview && (
          <div className={styles.mediaPreviewContainer}>
            <button 
              type="button" 
              className={styles.removeMediaButton}
              onClick={removeMedia}
            >
              <FontAwesomeIcon icon={faTimes} />
            </button>
            
            {mediaFile?.type?.startsWith('image/') ? (
              <img src={mediaPreview} alt="Preview" className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('video/') ? (
              <video src={mediaPreview} controls className={styles.mediaPreview} />
            ) : mediaFile?.type?.startsWith('audio/') ? (
              <audio src={mediaPreview} controls className={styles.audioPreview} />
            ) : null}
          </div>
        )}
        
        {error && <div className={styles.errorMessage}>{error}</div>}
        
        <div className={styles.formActions}>
          <div className={styles.mediaButtons}>
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
              title="Add photo"
            >
              <FontAwesomeIcon icon={faImage} />
              <span>Photo</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
              title="Add video"
            >
              <FontAwesomeIcon icon={faVideo} />
              <span>Video</span>
            </button>
            
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()}
              className={styles.mediaButton}
              disabled={loading}
              title="Add audio"
            >
              <FontAwesomeIcon icon={faMusic} />
              <span>Audio</span>
            </button>
            
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*, video/*, audio/*"
              style={{ display: 'none' }}
              disabled={loading}
            />
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading || (!content.trim() && !mediaFile) || isAtLimit}
          >
            {loading ? 'Posting...' : (
              <>
                <FontAwesomeIcon icon={faPaperPlane} />
                <span>Post</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreatePostForm;