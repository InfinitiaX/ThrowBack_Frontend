// components/Dashboard/UserDashboard/Wall/CommentList.jsx
import React, { useState, useEffect } from 'react';
import CommentItem from './CommentItem';
import CommentForm from './CommentForm';
import Spinner from '../../../Common/Spinner';
import api from '../../../../utils/api';
import styles from './CommentList.module.css';

const CommentList = ({ postId, onCommentCountChange }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load comments with improved error handling
  const loadComments = async (pageNum = 1) => {
    try {
      setLoading(true);
      
      const response = await api.get(`/api/posts/${postId}/comments`, {
        params: { page: pageNum, limit: 10 }
      });
      
      // More robust data handling - support multiple response formats
      const newComments = response.data.data || 
                         (Array.isArray(response.data) ? response.data : []);
      
      // Handle pagination data safely
      const pagination = response.data.pagination || { 
        page: pageNum, 
        limit: 10,
        total: newComments.length,
        totalPages: Math.ceil(newComments.length / 10)
      };
      
      if (pageNum === 1) {
        setComments(newComments);
      } else {
        setComments(prev => [...prev, ...newComments]);
      }
      
      setHasMore(pagination.page < pagination.totalPages);
      setPage(pagination.page);
      
      // Update comment counter if callback provided
      if (onCommentCountChange) {
        onCommentCountChange(pagination.total || newComments.length);
      }
      
      // Clear any previous errors on successful load
      setError(null);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Unable to load comments. Please try again later.');
      
      // Set empty array on first page error to avoid undefined issues
      if (pageNum === 1) {
        setComments([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // Load comments on component mount or when postId changes
  useEffect(() => {
    if (postId) {
      loadComments(1);
    }
  }, [postId]);

  // Add new comment handler with error prevention
  const handleAddComment = (newComment) => {
    // Validate newComment before adding to prevent UI errors
    if (newComment && (newComment._id || newComment.id)) {
      setComments(prev => [newComment, ...prev]);
      
      // Update counter
      if (onCommentCountChange) {
        onCommentCountChange(prev => (typeof prev === 'number' ? prev + 1 : 1));
      }
    }
  };

  // Update comment handler with improved validation
  const handleUpdateComment = (updatedComment) => {
    if (!updatedComment || (!updatedComment._id && !updatedComment.id)) {
      console.error('Invalid comment update received');
      return;
    }
    
    const commentId = updatedComment._id || updatedComment.id;
    
    setComments(prev => 
      prev.map(comment => {
        const currentId = comment._id || comment.id;
        return currentId === commentId ? updatedComment : comment;
      })
    );
  };

  // Delete comment handler
  const handleDeleteComment = (commentId) => {
    if (!commentId) return;
    
    setComments(prev => prev.filter(comment => {
      const currentId = comment._id || comment.id;
      return currentId !== commentId;
    }));
    
    // Update counter
    if (onCommentCountChange) {
      onCommentCountChange(prev => {
        const newCount = typeof prev === 'number' ? prev - 1 : 0;
        return Math.max(0, newCount); // Prevent negative counts
      });
    }
  };

  // Add refresh function
  const refreshComments = () => {
    setPage(1);
    loadComments(1);
  };

  return (
    <div className={styles.commentListContainer}>
      <CommentForm 
        postId={postId} 
        onCommentAdded={handleAddComment}
        onError={(errorMsg) => setError(errorMsg)} 
      />
      
      {error && (
        <div className={styles.errorMessage}>
          {error}
          <button 
            className={styles.retryButton}
            onClick={refreshComments}
          >
            Retry
          </button>
        </div>
      )}
      
      <div className={styles.commentList}>
        {comments.length === 0 && !loading ? (
          <div className={styles.emptyComments}>
            No comments yet. Be the first to comment!
          </div>
        ) : (
          <>
            {comments.map(comment => (
              <CommentItem 
                key={comment._id || comment.id || `comment-${Math.random()}`} 
                comment={comment}
                postId={postId}
                onUpdateComment={handleUpdateComment}
                onDeleteComment={handleDeleteComment}
              />
            ))}
            
            {loading && (
              <div className={styles.loadingComments}>
                <Spinner size="small" />
                <span>Loading comments...</span>
              </div>
            )}
            
            {!loading && hasMore && (
              <button 
                className={styles.loadMoreButton}
                onClick={() => loadComments(page + 1)}
              >
                Show more comments
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CommentList;
