// components/Dashboard/UserDashboard/Wall/CommentItem.jsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faReply, 
  faEdit, 
  faTrash,
  faThumbsDown,
  faFlag,
  faEllipsisV,
  faSave,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';
import CommentForm from './CommentForm';
import AvatarInitials from '../../../Common/AvatarInitials';
import ConfirmDialog from '../../../Common/ConfirmDialog';
import { errorMessages } from '../../../../utils/errorMessages';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import { fr } from 'date-fns/locale';
import styles from './CommentItem.module.css';

const CommentItem = ({ comment, postId, onUpdateComment, onDeleteComment }) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.contenu);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReplies, setShowReplies] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [replies, setReplies] = useState(comment.replies || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  
  const commentId = comment._id || comment.id;
  const isLiked = comment.userInteraction?.liked || false;
  const isDisliked = comment.userInteraction?.disliked || false;
  const likeCount = comment.likes || 0;
  const dislikeCount = comment.dislikes || 0;
  
  const creationDate = comment.creation_date || comment.createdAt || new Date();
  const formattedDate = formatDistanceToNow(new Date(creationDate), {
    addSuffix: true,
    locale: fr
  });

  // Like handler
  const handleLikeClick = async () => {
    try {
      if (loading) return;
      
      const optimisticUpdate = {
        ...comment,
        userInteraction: {
          ...comment.userInteraction,
          liked: !isLiked,
          disliked: false
        },
        likes: isLiked ? likeCount - 1 : likeCount + 1,
        dislikes: isDisliked ? dislikeCount - 1 : dislikeCount
      };
      
      if (onUpdateComment) {
        onUpdateComment(optimisticUpdate);
      }
      
      setLoading(true);
      setError(null);
      
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          const response = await api.post(`/api/comments/${commentId}/like`);
          success = true;
          
          if (response.data && response.data.data) {
            const serverUpdatedComment = {
              ...comment,
              userInteraction: {
                ...comment.userInteraction,
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              },
              likes: response.data.data.likes,
              dislikes: response.data.data.dislikes
            };
            
            if (onUpdateComment) {
              onUpdateComment(serverUpdatedComment);
            }
          }
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) throw err;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (err) {
      console.error('Error liking comment:', err);
      setError("Unable to like this comment. Please try again.");
      if (onUpdateComment) {
        onUpdateComment(comment);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Dislike handler
  const handleDislikeClick = async () => {
    try {
      if (loading) return;
      
      const optimisticUpdate = {
        ...comment,
        userInteraction: {
          ...comment.userInteraction,
          disliked: !isDisliked,
          liked: false
        },
        dislikes: isDisliked ? dislikeCount - 1 : dislikeCount + 1,
        likes: isLiked ? likeCount - 1 : likeCount
      };
      
      if (onUpdateComment) {
        onUpdateComment(optimisticUpdate);
      }
      
      setLoading(true);
      setError(null);
      
      const maxRetries = 3;
      let retryCount = 0;
      let success = false;
      
      while (retryCount < maxRetries && !success) {
        try {
          const response = await api.post(`/api/comments/${commentId}/dislike`);
          success = true;
          
          if (response.data && response.data.data) {
            const serverUpdatedComment = {
              ...comment,
              userInteraction: {
                ...comment.userInteraction,
                liked: response.data.data.liked,
                disliked: response.data.data.disliked
              },
              likes: response.data.data.likes,
              dislikes: response.data.data.dislikes
            };
            
            if (onUpdateComment) {
              onUpdateComment(serverUpdatedComment);
            }
          }
        } catch (err) {
          retryCount++;
          if (retryCount >= maxRetries) throw err;
          await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retryCount)));
        }
      }
    } catch (err) {
      console.error('Error disliking comment:', err);
      setError("Unable to dislike this comment. Please try again.");
      if (onUpdateComment) {
        onUpdateComment(comment);
      }
    } finally {
      setLoading(false);
    }
  };
  
  const loadReplies = async () => {
    if (!commentId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/api/comments/${commentId}/replies`);
      if (response.data && (response.data.data || Array.isArray(response.data))) {
        const loadedReplies = response.data.data || response.data;
        setReplies(loadedReplies);
        setShowReplies(true);
      }
    } catch (err) {
      console.error('Error loading replies:', err);
      setError('Unable to load replies');
    } finally {
      setLoading(false);
    }
  };
  
  const handleAddReply = (newReply) => {
    setReplies(prev => [newReply, ...prev]);
    setShowReplyForm(false);
    setShowReplies(true);
    
    const updatedComment = {
      ...comment,
      totalReplies: (comment.totalReplies || 0) + 1,
      hasMoreReplies: true
    };
    
    if (onUpdateComment) {
      onUpdateComment(updatedComment);
    }
  };
  
  const handleDeleteClick = () => {
    setShowDropdown(false);
    setShowDeleteConfirm(true);
  };
  
  const confirmDelete = async () => {
    try {
      setLoading(true);
      setError(null);
      
      await api.delete(`/api/comments/${commentId}`);
      if (onDeleteComment) {
        onDeleteComment(commentId);
      }
      setShowDeleteConfirm(false);
    } catch (err) {
      console.error('Error deleting comment:', err);
      setError("Unable to delete this comment. Please try again. Or you are not the author of this comment.");
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };
  
  const handleUpdateComment = async () => {
    if (!editContent.trim()) {
      setError('The comment cannot be empty');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.put(`/api/comments/${commentId}`, {
        contenu: editContent
      });
      
      if (response.data && response.data.data) {
        const updatedComment = {
          ...comment,
          contenu: editContent,
          modified_date: new Date()
        };
        
        if (onUpdateComment) {
          onUpdateComment(updatedComment);
        }
        
        setIsEditing(false);
      }
    } catch (err) {
      console.error('Error updating comment:', err);
      setError("Unable to edit this comment. Please try again. Or you are not the author of this comment.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleReportClick = async () => {
    try {
      setShowDropdown(false);
      
      const reason = prompt('Please specify the reason for reporting:');
      if (!reason) return;
      
      setLoading(true);
      setError(null);
      
      await api.post(`/api/comments/${commentId}/report`, { raison: reason });
      alert('Comment successfully reported');
    } catch (err) {
      console.error('Error reporting comment:', err);
      setError('Unable to report the comment');
    } finally {
      setLoading(false);
    }
  };
  
  const isAuthor = user && comment.auteur && 
                  (comment.auteur._id === user.id || comment.auteur.id === user.id);
  const isAdmin = user && (
    (user.roles && user.roles.some(r => ['admin', 'superadmin'].includes(r.libelle_role))) ||
    ['admin', 'superadmin'].includes(user.role)
  );

  const canModify = isAuthor;
  const canDelete = isAuthor || isAdmin;

  return (
    <div className={styles.commentItem}>
      <div className={styles.commentHeader}>
        {comment.auteur?.photo_profil ? (
          <img 
            src={comment.auteur.photo_profil} 
            alt={`${comment.auteur.prenom} ${comment.auteur.nom}`} 
            className={styles.userAvatar}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextElementSibling.style.display = 'flex';
            }}
          />
        ) : (
          <AvatarInitials 
            user={comment.auteur} 
            className={styles.userAvatar} 
          />
        )}
        
        <div className={styles.commentContent}>
          <div className={styles.commentMeta}>
            <span className={styles.userName}>
              {comment.auteur?.prenom} {comment.auteur?.nom}
            </span>
            <span className={styles.commentDate}>{formattedDate}</span>
          </div>
          
          {isEditing ? (
            <>
              <textarea
                className={styles.editInput}
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
              />
              <div className={styles.editButtons}>
                <button 
                  className={styles.cancelEditButton}
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.contenu);
                  }}
                >
                  <FontAwesomeIcon icon={faTimes} />
                  <span>Cancel</span>
                </button>
                <button 
                  className={styles.saveEditButton}
                  onClick={handleUpdateComment}
                  disabled={loading || !editContent.trim()}
                >
                  <FontAwesomeIcon icon={faSave} />
                  <span>Save</span>
                </button>
              </div>
            </>
          ) : (
            <div className={styles.commentText}>
              {comment.contenu}
            </div>
          )}
          
          <div className={styles.commentActions}>
            <button 
              className={`${styles.actionButton} ${isLiked ? styles.liked : ''}`}
              onClick={handleLikeClick}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faHeart} />
              <span>{likeCount}</span>
            </button>
            
            <button 
              className={`${styles.actionButton} ${isDisliked ? styles.disliked : ''}`}
              onClick={handleDislikeClick}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faThumbsDown} />
              <span>{dislikeCount}</span>
            </button>
            
            <button 
              className={styles.actionButton}
              onClick={() => setShowReplyForm(!showReplyForm)}
              disabled={loading}
            >
              <FontAwesomeIcon icon={faReply} />
              <span>Reply</span>
            </button>
            
            {comment.totalReplies > 0 && !showReplies && (
              <button 
                className={styles.actionButton}
                onClick={loadReplies}
                disabled={loading}
              >
                <span>View {comment.totalReplies} replies</span>
              </button>
            )}
            
            {showReplies && comment.totalReplies > 0 && (
              <button 
                className={styles.actionButton}
                onClick={() => setShowReplies(false)}
              >
                <span>Hide replies</span>
              </button>
            )}
          </div>
          
          {error && (
            <div className={styles.errorMessage}>
              {error}
            </div>
          )}
        </div>
        
        {user && (
          <div className={styles.dropdownContainer}>
            <button 
              className={styles.moreButton}
              onClick={() => setShowDropdown(!showDropdown)}
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showDropdown && (
              <div className={styles.dropdown}>
                {canModify && (
                  <button onClick={() => {
                    setIsEditing(true);
                    setShowDropdown(false);
                  }}>
                    <FontAwesomeIcon icon={faEdit} />
                    <span>Edit</span>
                  </button>
                )}
                
                {canDelete && (
                  <button onClick={handleDeleteClick}>
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                )}
                
                {!isAuthor && (
                  <button onClick={handleReportClick}>
                    <FontAwesomeIcon icon={faFlag} />
                    <span>Report</span>
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {showReplyForm && (
        <div className={styles.replyForm}>
          <CommentForm 
            postId={postId}
            parentId={commentId}
            onCommentAdded={handleAddReply}
            onCancel={() => setShowReplyForm(false)}
            onError={setError}
          />
        </div>
      )}
      
      {showReplies && replies.length > 0 && (
        <div className={styles.repliesList}>
          {replies.map(reply => (
            <div key={reply._id || reply.id || `reply-${Math.random()}`} className={styles.replyItem}>
              {reply.auteur?.photo_profil ? (
                <img 
                  src={reply.auteur.photo_profil} 
                  alt={`${reply.auteur.prenom} ${reply.auteur.nom}`} 
                  className={styles.replyAvatar}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextElementSibling.style.display = 'flex';
                  }}
                />
              ) : (
                <AvatarInitials 
                  user={reply.auteur} 
                  size={24}
                  className={styles.replyAvatar} 
                />
              )}
              
              <div className={styles.replyContent}>
                <div className={styles.replyMeta}>
                  <span className={styles.replyUserName}>
                    {reply.auteur?.prenom} {reply.auteur?.nom}
                  </span>
                  <span className={styles.replyDate}>
                    {formatDistanceToNow(new Date(reply.creation_date || reply.createdAt), {
                      addSuffix: true,
                      locale: fr
                    })}
                  </span>
                </div>
                
                <div className={styles.replyText}>
                  {reply.contenu}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        message="Are you sure you want to delete this comment?"
        onConfirm={confirmDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </div>
  );
};

export default CommentItem;