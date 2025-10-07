// components/Dashboard/AdminDashboard/Comments/Comments.jsx
import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../../../utils/adminAPI';
import styles from './Comments.module.css';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import CommentCard from './CommentCard';
import CommentFilters from './CommentFilters';
import CommentStats from './CommentStats';
import BulkActions from './BulkActions';
import Pagination from '../../../Common/Pagination';

const Comments = () => {
  const [comments, setComments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedComments, setSelectedComments] = useState([]);
  
  // Filters and pagination
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: 'all',
    type: 'all',
    sortBy: 'recent',
    reported: 'all'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  });

  // Load comments
  const loadComments = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getComments(filters);
      
      if (response.success) {
        setComments(response.data);
        setPagination(response.pagination);
        setStats(response.stats);
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      setError('Error while loading comments');
    } finally {
      setLoading(false);
    }
  };

  // Load stats
  const loadStats = async () => {
    try {
      const response = await adminAPI.getCommentsStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  useEffect(() => {
    loadComments();
  }, [filters]);

  useEffect(() => {
    loadStats();
  }, []);

  // Handle filter change
  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1 // Reset page when filters change
    }));
    setSelectedComments([]); // Clear selections
  };

  // Handle page change
  const handlePageChange = (page) => {
    setFilters(prev => ({ ...prev, page }));
    setSelectedComments([]);
  };

  // Select a comment
  const handleSelectComment = (commentId) => {
    setSelectedComments(prev => {
      if (prev.includes(commentId)) {
        return prev.filter(id => id !== commentId);
      } else {
        return [...prev, commentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedComments.length === comments.length) {
      setSelectedComments([]);
    } else {
      setSelectedComments(comments.map(comment => comment._id));
    }
  };

  // Moderate a comment
  const handleModerateComment = async (commentId, action, reason = '') => {
    try {
      const response = await adminAPI.moderateComment(commentId, action, reason);

      if (response.success) {
        await loadComments();
        await loadStats();
        
        console.log(`Comment ${action === 'approve' ? 'approved' : action === 'reject' ? 'rejected' : 'deleted'}`);
      }
    } catch (err) {
      console.error('Error moderating comment:', err);
      setError('Error while moderating comment');
    }
  };

  // Bulk moderation
  const handleBulkModerate = async (action, reason = '') => {
    if (selectedComments.length === 0) return;

    try {
      const response = await adminAPI.bulkModerateComments(selectedComments, action, reason);

      if (response.success) {
        setSelectedComments([]);
        await loadComments();
        await loadStats();
        
        console.log(`${response.data.modifiedCount} comments moderated`);
      }
    } catch (err) {
      console.error('Error bulk moderating:', err);
      setError('Error during bulk moderation');
    }
  };

  // Reply to a comment
  const handleReplyToComment = async (commentId, content) => {
    try {
      const response = await adminAPI.replyToComment(commentId, content);

      if (response.success) {
        await loadComments();
        console.log('Reply added successfully');
      }
    } catch (err) {
      console.error('Error replying to comment:', err);
      setError('Error while adding reply');
    }
  };

  if (loading && comments.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1>Comments Moderation</h1>
        </div>
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {error && (
        <div className={styles.error}>
          <i className="fas fa-exclamation-triangle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Comments Moderation</h1>
          <p>
            Manage all comments, memories, and replies on the platform
          </p>
        </div>
        <div className={styles.headerActions}>
          <button 
            className={styles.refreshBtn}
            onClick={() => {
              loadComments();
              loadStats();
            }}
            disabled={loading}
          >
            <i className={`fas fa-sync-alt ${loading ? styles.spinning : ''}`}></i>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      {stats && <CommentStats stats={stats} />}

      {/* Filters */}
      <CommentFilters
        filters={filters}
        onFilterChange={handleFilterChange}
        totalComments={pagination.total}
      />

      {/* Bulk actions */}
      {selectedComments.length > 0 && (
        <BulkActions
          selectedCount={selectedComments.length}
          onBulkModerate={handleBulkModerate}
          onCancel={() => setSelectedComments([])}
        />
      )}

      {/* Comments list */}
      <div className={styles.content}>
        {comments.length === 0 ? (
          <div className={styles.emptyState}>
            <i className="fas fa-comments"></i>
            <h3>No comments found</h3>
            <p>No comments match the selected filters.</p>
          </div>
        ) : (
          <>
            {/* Table header */}
            <div className={styles.tableHeader}>
              <div className={styles.checkboxColumn}>
                <input
                  type="checkbox"
                  checked={selectedComments.length === comments.length && comments.length > 0}
                  onChange={handleSelectAll}
                />
              </div>
              <div className={styles.contentColumn}>Content</div>
              <div className={styles.authorColumn}>Author</div>
              <div className={styles.contextColumn}>Context</div>
              <div className={styles.statusColumn}>Status</div>
              <div className={styles.dateColumn}>Date</div>
              <div className={styles.actionsColumn}>Actions</div>
            </div>

            {/* Comments list */}
            <div className={styles.commentsList}>
              {comments.map(comment => (
                <CommentCard
                  key={comment._id}
                  comment={comment}
                  isSelected={selectedComments.includes(comment._id)}
                  onSelect={() => handleSelectComment(comment._id)}
                  onModerate={handleModerateComment}
                  onReply={handleReplyToComment}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={handlePageChange}
                totalItems={pagination.total}
                itemsPerPage={pagination.limit}
              />
            )}
          </>
        )}
      </div>

      {loading && comments.length > 0 && (
        <div className={styles.loadingOverlay}>
          <LoadingSpinner size="small" />
        </div>
      )}
    </div>
  );
};

export default Comments;
