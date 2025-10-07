// components/Dashboard/UserDashboard/Wall/CommentForm.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faSpinner, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import AvatarInitials from '../../../Common/AvatarInitials';
import styles from './CommentForm.module.css';

const CommentForm = ({ postId, parentId, onCommentAdded, onCancel, onError }) => {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const { user } = useAuth();

  // Handle form submission with improved error handling
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    if (!content.trim()) {
      const errorMsg = 'Please enter a comment';
      setLocalError(errorMsg);
      if (onError) onError(errorMsg);
      return;
    }
    
    try {
      setLoading(true);
      setLocalError(null);
      
      // Submit to API with proper error handling
      const response = await api.post(`/api/posts/${postId}/comments`, {
        contenu: content,
        parentId: parentId || null
      });
      
      // Check for successful response with data
      if (response.data && (response.data.success || response.data.data)) {
        const newComment = response.data.data || response.data;
        
        // Clear form
        setContent('');
        
        // Notify parent component
        if (onCommentAdded) {
          onCommentAdded(newComment);
        }
        
        // Close form if it's a reply
        if (onCancel && parentId) {
          onCancel();
        }
      } else {
        throw new Error('Invalid server response');
      }
    } catch (err) {
      console.error('Error submitting comment:', err);
      const errorMsg = err.response?.data?.message || 
                      'An error occurred while sending the comment';
      
      setLocalError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.commentForm}>
      <div className={styles.formContent}>
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
        
        <textarea
          placeholder="Write a comment..."
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            if (localError) setLocalError(null);
          }}
          className={styles.commentInput}
          disabled={loading}
          rows={2}
        />
        
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={loading || !content.trim()}
        >
          {loading ? (
            <FontAwesomeIcon icon={faSpinner} spin />
          ) : (
            <FontAwesomeIcon icon={faPaperPlane} />
          )}
        </button>
      </div>
      
      {localError && (
        <div className={styles.errorMessage}>
          {localError}
        </div>
      )}
      
      {parentId && onCancel && (
        <button 
          type="button" 
          className={styles.cancelButton}
          onClick={onCancel}
        >
          <FontAwesomeIcon icon={faTimes} />
          <span>Cancel</span>
        </button>
      )}
    </form>
  );
};

export default CommentForm;
