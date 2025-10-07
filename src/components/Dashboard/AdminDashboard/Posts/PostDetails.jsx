// components/Dashboard/AdminDashboard/Posts/PostDetails.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './PostDetails.module.css';
import socialAPI from '../../../../utils/socialAPI';

const apiBase = process.env.REACT_APP_API_URL || '';

/**
 * Accepts:
 *  - string: '/uploads/...' ou 'https://...'
 *  - object with common keys: { url, path, secure_url, Location, location, href, src }
 * Returns absolute url or null.
 */
const toAbsoluteUrl = (value) => {
  if (!value) return null;

  let s = null;
  if (typeof value === 'string') {
    s = value;
  } else if (typeof value === 'object') {
    s =
      value.url ??
      value.path ??
      value.secure_url ??
      value.Location ??
      value.location ??
      value.href ??
      value.src ??
      null;
  }

  if (!s) return null;
  s = String(s);

  try {
    return s.startsWith('/') ? `${apiBase}${s}` : s;
  } catch {
    return null;
  }
};

const PostDetails = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  
  // Main states
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentLoading, setCommentLoading] = useState(false);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Tabs
  const [tab, setTab] = useState('details');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmModerate, setConfirmModerate] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [moderationReason, setModerationReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  
  // Comments selection (reserved)
  const [selectedComments, setSelectedComments] = useState([]);
  const [showCommentActions, setShowCommentActions] = useState(false);

  // Load post data
  useEffect(() => {
    if (postId) {
      fetchPostDetails();
    }
  }, [postId]);

  // Load comments
  useEffect(() => {
    if (tab === 'comments' && post) {
      fetchComments();
    }
  }, [tab, currentPage, post]);

  // Load analytics
  useEffect(() => {
    if (tab === 'analytics' && post) {
      fetchAnalytics();
    }
  }, [tab, post]);

  // Auto clear messages
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Fetch post details
  const fetchPostDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await socialAPI.getPostById(postId, true);
      setPost(response.data);
    } catch (err) {
      console.error('Error loading post:', err);
      const formattedError = socialAPI.formatApiError(err);
      if (formattedError.status === 404) {
        setError('Post not found. It may have been deleted.');
      } else {
        setError(formattedError.message || 'Unable to load post details.');
      }
    } finally {
      setLoading(false);
    }
  }, [postId]);

  // Fetch comments
  const fetchComments = useCallback(async () => {
    try {
      setCommentLoading(true);
      const response = await socialAPI.getPostComments(postId, {
        page: currentPage,
        limit: 10,
        includeReplies: true
      });
      setComments(response.data || []);
      setTotalPages(response.pagination?.totalPages || 1);
    } catch (err) {
      console.error('Error loading comments:', err);
    } finally {
      setCommentLoading(false);
    }
  }, [postId, currentPage]);

  // Fetch analytics
  const fetchAnalytics = useCallback(async () => {
    try {
      setAnalyticsLoading(true);
      const response = await socialAPI.getPostAnalytics(postId, '30d');
      setAnalytics(response.data);
    } catch (err) {
      console.error('Error loading analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [postId]);

  // Delete post
  const deletePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      await socialAPI.adminDeletePost(postId);
      navigate('/admin/posts', { 
        state: { message: 'Post deleted successfully' } 
      });
    } catch (err) {
      console.error('Error deleting post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while deleting the post');
      setConfirmDelete(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, navigate]);

  // Moderate post
  const moderatePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      await socialAPI.moderatePost(postId, moderationReason);
      setConfirmModerate(false);
      setModerationReason('');
      setSuccessMessage('Post moderated successfully');
      await fetchPostDetails();
    } catch (err) {
      console.error('Error moderating post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while moderating the post');
      setConfirmModerate(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, moderationReason, fetchPostDetails]);

  // Restore post
  const restorePost = useCallback(async () => {
    try {
      setActionLoading(true);
      setError(null);
      await socialAPI.restorePost(postId);
      setConfirmRestore(false);
      setSuccessMessage('Post restored successfully');
      await fetchPostDetails();
    } catch (err) {
      console.error('Error restoring post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while restoring the post');
      setConfirmRestore(false);
    } finally {
      setActionLoading(false);
    }
  }, [postId, fetchPostDetails]);

  // Delete a comment
  const deleteComment = useCallback(async (commentId) => {
    try {
      await socialAPI.deleteComment(commentId);
      setSuccessMessage('Comment deleted successfully');
      fetchComments();
    } catch (err) {
      console.error('Error deleting comment:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while deleting the comment');
    }
  }, [fetchComments]);

  // Moderate a comment
  const moderateComment = useCallback(async (commentId, reason) => {
    try {
      await socialAPI.moderateComment(postId, commentId, reason);
      setSuccessMessage('Comment moderated successfully');
      fetchComments();
    } catch (err) {
      console.error('Error moderating comment:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while moderating the comment');
    }
  }, [postId, fetchComments]);

  // Restore a comment
  const restoreComment = useCallback(async (commentId) => {
    try {
      await socialAPI.restoreComment(postId, commentId);
      setSuccessMessage('Comment restored successfully');
      fetchComments();
    } catch (err) {
      console.error('Error restoring comment:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while restoring the comment');
    }
  }, [postId, fetchComments]);

  // Export post data
  const exportPostData = useCallback(async () => {
    try {
      const exportData = {
        post: post,
        comments: comments,
        analytics: analytics,
        exportDate: new Date().toISOString()
      };
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `post_${postId}_export_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setSuccessMessage('Data exported successfully');
    } catch (err) {
      console.error('Export error:', err);
      setError('An error occurred during export');
    }
  }, [post, comments, analytics, postId]);

  // Date formatter
  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return 'Unknown date';
    }
  }, []);

  // Render hashtags
  const renderHashtags = useCallback((hashtags) => {
    if (!hashtags || !hashtags.length) return null;
    return (
      <div className={styles.hashtagsContainer}>
        {hashtags.map((tag, index) => (
          <span key={index} className={styles.hashtag}>
            #{tag}
          </span>
        ))}
      </div>
    );
  }, []);

  // Render media (accepts string or object)
  const renderMedia = useCallback((media, type) => {
    const mediaUrl = toAbsoluteUrl(media);
    if (!mediaUrl) return null;

    return (
      <div className={styles.mediaContainer}>
        {type === 'IMAGE' ? (
          <img
            src={mediaUrl}
            alt="Post media"
            className={styles.mediaImage}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : type === 'VIDEO' ? (
          <video
            src={mediaUrl}
            controls
            className={styles.mediaVideo}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : type === 'AUDIO' ? (
          <audio
            src={mediaUrl}
            controls
            className={styles.mediaAudio}
            onError={(e) => { e.target.style.display = 'none'; }}
          />
        ) : (
          <div className={styles.unknownMedia}>
            <i className="fas fa-file"></i>
            <span>Unsupported media</span>
          </div>
        )}
      </div>
    );
  }, []);

  // Preset moderation reasons
  const moderationReasons = [
    'Inappropriate content',
    'Terms of use violation',
    'Offensive content',
    'Misinformation',
    'Spam or unwanted content',
    'Duplicate content'
  ];

  // Initial loading
  if (loading && !post) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loadingSpinner}></div>
        <p>Loading post details...</p>
      </div>
    );
  }

  // Critical error
  if (error && !post) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorIcon}>
          <i className="fas fa-exclamation-triangle"></i>
        </div>
        <h2>An error occurred</h2>
        <p>{error}</p>
        <div className={styles.errorActions}>
          <button 
            onClick={() => navigate('/admin/posts')}
            className={styles.errorButton}
          >
            Back to list
          </button>
          <button 
            onClick={fetchPostDetails}
            className={styles.errorButton}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Not found
  if (!post) {
    return (
      <div className={styles.notFoundContainer}>
        <div className={styles.notFoundIcon}>
          <i className="fas fa-search"></i>
        </div>
        <h2>Post not found</h2>
        <p>The post you are looking for does not exist or has been deleted.</p>
        <Link to="/admin/posts" className={styles.backButton}>
          Back to posts list
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.postDetails}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.breadcrumbs}>
          <Link to="/admin/posts">Posts of user</Link>
          <i className="fas fa-chevron-right"></i>
          <span>Details</span>
        </div>
        <div className={styles.actions}>
          <button 
            className={styles.backButton}
            onClick={() => navigate('/admin/posts')}
          >
            <i className="fas fa-arrow-left"></i>
            Back
          </button>
          <button 
            className={styles.exportButton}
            onClick={exportPostData}
            disabled={actionLoading}
          >
            <i className="fas fa-download"></i>
            Export
          </button>
          {post.modere ? (
            <button 
              className={styles.restoreButton}
              onClick={() => setConfirmRestore(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-check"></i>
              Restore
            </button>
          ) : (
            <button 
              className={styles.moderateButton}
              onClick={() => setConfirmModerate(true)}
              disabled={actionLoading}
            >
              <i className="fas fa-shield-alt"></i>
              Moderate
            </button>
          )}
          <button 
            className={styles.deleteButton}
            onClick={() => setConfirmDelete(true)}
            disabled={actionLoading}
          >
            <i className="fas fa-trash"></i>
            Delete
          </button>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className={styles.successMessage}>
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button onClick={() => setSuccessMessage('')}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button onClick={() => setError(null)}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Post title & info */}
      <div className={styles.postHeader}>
        <div className={styles.postId}>
          <span>ID:</span> {post._id}
        </div>
        <div className={styles.postStatus}>
          {post.epingle && (
            <span className={`${styles.statusBadge} ${styles.status_pinned}`}>
              <i className="fas fa-thumbtack"></i>
              Pinned
            </span>
          )}
          <span className={`${styles.statusBadge} ${styles[`status_${post.modere ? 'moderated' : 'active'}`]}`}>
            {post.modere ? 'Moderated' : 'Active'}
          </span>
          <span className={`${styles.visibilityBadge} ${styles[`visibility_${post.visibilite?.toLowerCase()}`]}`}>
            {post.visibilite}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tabButton} ${tab === 'details' ? styles.activeTab : ''}`}
          onClick={() => setTab('details')}
        >
          Details
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'comments' ? styles.activeTab : ''}`}
          onClick={() => setTab('comments')}
        >
          Comments ({post.commentaires?.length || 0})
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'reports' ? styles.activeTab : ''}`}
          onClick={() => setTab('reports')}
        >
          Reports ({post.signalements?.length || 0})
        </button>
        <button 
          className={`${styles.tabButton} ${tab === 'analytics' ? styles.activeTab : ''}`}
          onClick={() => setTab('analytics')}
        >
          Analytics
        </button>
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {/* Details tab */}
        {tab === 'details' && (
          <div className={styles.detailsTab}>
            <div className={styles.postContent}>
              {/* Author */}
              <div className={styles.authorSection}>
                <div className={styles.authorInfo}>
                  <div className={styles.authorAvatar}>
                    {post.auteur?.photo_profil ? (
                      <img
                        src={toAbsoluteUrl(post.auteur.photo_profil) || undefined}
                        alt={`${post.auteur?.prenom || ''} ${post.auteur?.nom || ''}`}
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        {post.auteur?.prenom?.[0] || ''}{post.auteur?.nom?.[0] || ''}
                      </div>
                    )}
                  </div>
                  <div className={styles.authorName}>
                    <h3>{post.auteur?.prenom} {post.auteur?.nom}</h3>
                    <Link to={`/admin/users/${post.auteur?._id}`} className={styles.authorLink}>
                      View profile
                    </Link>
                  </div>
                </div>
                <div className={styles.postDate}>
                  <div className={styles.dateItem}>
                    <i className="fas fa-calendar-alt"></i>
                    <span>Created on: {formatDate(post.createdAt)}</span>
                  </div>
                  {post.updatedAt && post.updatedAt !== post.createdAt && (
                    <div className={styles.dateItem}>
                      <i className="fas fa-edit"></i>
                      <span>Updated on: {formatDate(post.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Main content */}
              <div className={styles.mainContent}>
                <div className={styles.postText}>
                  {post.contenu}
                </div>
                
                {/* Hashtags */}
                {renderHashtags(post.hashtags)}
                
                {/* Media */}
                {renderMedia(post.media, post.type_media)}
              </div>

              {/* Stats */}
              <div className={styles.statsSection}>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-heart"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.likes?.length || 0}</span>
                    <span className={styles.statLabel}>Likes</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-comment"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.commentaires?.length || 0}</span>
                    <span className={styles.statLabel}>Comments</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-share"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.partages || 0}</span>
                    <span className={styles.statLabel}>Shares</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-flag"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.signalements?.length || 0}</span>
                    <span className={styles.statLabel}>Reports</span>
                  </div>
                </div>
                <div className={styles.statsItem}>
                  <div className={styles.statIcon}>
                    <i className="fas fa-eye"></i>
                  </div>
                  <div className={styles.statInfo}>
                    <span className={styles.statCount}>{post.vues || 0}</span>
                    <span className={styles.statLabel}>Views</span>
                  </div>
                </div>
              </div>

              {/* Mentions */}
              {post.mentions && post.mentions.length > 0 && (
                <div className={styles.mentionsSection}>
                  <h3>Mentions</h3>
                  <div className={styles.mentionsList}>
                    {post.mentions.map((mention, index) => (
                      <Link 
                        key={index} 
                        to={`/admin/users/${mention._id}`}
                        className={styles.mentionItem}
                      >
                        <div className={styles.mentionAvatar}>
                          {mention.photo_profil ? (
                            <img
                              src={toAbsoluteUrl(mention.photo_profil) || undefined}
                              alt={`${mention.prenom} ${mention.nom}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {mention.prenom?.[0] || ''}{mention.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <span>{mention.prenom} {mention.nom}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Moderation info */}
              {post.modere && (
                <div className={styles.moderationSection}>
                  <h3>Moderation information</h3>
                  <div className={styles.moderationInfo}>
                    <div className={styles.moderationItem}>
                      <span className={styles.moderationLabel}>Moderated on:</span>
                      <span>{formatDate(post.date_moderation || post.updatedAt)}</span>
                    </div>
                    {post.modere_par && (
                      <div className={styles.moderationItem}>
                        <span className={styles.moderationLabel}>Moderated by:</span>
                        <Link to={`/admin/users/${post.modere_par}`} className={styles.moderatorLink}>
                          {post.modere_par_nom || 'Administrator'}
                        </Link>
                      </div>
                    )}
                    {post.raison_moderation && (
                      <div className={styles.moderationItem}>
                        <span className={styles.moderationLabel}>Reason:</span>
                        <span className={styles.moderationReason}>{post.raison_moderation}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments tab */}
        {tab === 'comments' && (
          <div className={styles.commentsTab}>
            {commentLoading ? (
              <div className={styles.loadingCommentsContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading comments...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className={styles.noCommentsContainer}>
                <div className={styles.noCommentsIcon}>
                  <i className="fas fa-comments"></i>
                </div>
                <p>No comments on this post</p>
              </div>
            ) : (
              <div className={styles.commentsList}>
                {comments.map(comment => (
                  <div key={comment._id} className={styles.commentItem}>
                    <div className={styles.commentHeader}>
                      <div className={styles.commentAuthor}>
                        <div className={styles.authorAvatar}>
                          {comment.auteur?.photo_profil ? (
                            <img
                              src={toAbsoluteUrl(comment.auteur.photo_profil) || undefined}
                              alt={`${comment.auteur?.prenom || ''} ${comment.auteur?.nom || ''}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {comment.auteur?.prenom?.[0] || ''}{comment.auteur?.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div className={styles.authorInfo}>
                          <span className={styles.authorName}>
                            {comment.auteur?.prenom} {comment.auteur?.nom}
                          </span>
                          <span className={styles.commentDate}>
                            {formatDate(comment.creation_date)}
                          </span>
                        </div>
                      </div>
                      <div className={styles.commentActions}>
                        {comment.statut === 'MODERE' ? (
                          <button 
                            className={styles.commentActionButton}
                            title="Restore comment"
                            onClick={() => restoreComment(comment._id)}
                          >
                            <i className="fas fa-check"></i>
                          </button>
                        ) : (
                          <button 
                            className={styles.commentActionButton}
                            title="Moderate comment"
                            onClick={() => {
                              const reason = prompt('Moderation reason:');
                              if (reason) moderateComment(comment._id, reason);
                            }}
                          >
                            <i className="fas fa-shield-alt"></i>
                          </button>
                        )}
                        <button 
                          className={styles.commentActionButton}
                          title="Delete comment"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this comment?')) {
                              deleteComment(comment._id);
                            }
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                        <Link 
                          to={`/admin/users/${comment.auteur?._id}`}
                          className={styles.commentActionButton}
                          title="View profile"
                        >
                          <i className="fas fa-user"></i>
                        </Link>
                      </div>
                    </div>
                    <div className={styles.commentContent}>
                      {comment.contenu}
                    </div>
                    <div className={styles.commentFooter}>
                      <div className={styles.commentStats}>
                        <span className={styles.commentStat}>
                          <i className="fas fa-heart"></i>
                          {comment.likes || 0}
                        </span>
                        <span className={styles.commentStat}>
                          <i className="fas fa-thumbs-down"></i>
                          {comment.dislikes || 0}
                        </span>
                        <span className={styles.commentStat}>
                          <i className="fas fa-reply"></i>
                          {comment.totalReplies || 0}
                        </span>
                      </div>
                      <span className={`${styles.commentStatus} ${comment.statut !== 'ACTIF' ? styles.commentModerated : ''}`}>
                        {comment.statut === 'ACTIF' ? 'Active' : 
                         comment.statut === 'MODERE' ? 'Moderated' : 
                         comment.statut === 'SUPPRIME' ? 'Deleted' : 
                         comment.statut}
                      </span>
                    </div>

                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className={styles.commentReplies}>
                        {comment.replies.map(reply => (
                          <div key={reply._id} className={styles.replyItem}>
                            <div className={styles.replyHeader}>
                              <div className={styles.replyAuthor}>
                                <div className={styles.authorAvatar}>
                                  {reply.auteur?.photo_profil ? (
                                    <img
                                      src={toAbsoluteUrl(reply.auteur.photo_profil) || undefined}
                                      alt={`${reply.auteur?.prenom || ''} ${reply.auteur?.nom || ''}`}
                                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                    />
                                  ) : (
                                    <div className={styles.defaultAvatar}>
                                      {reply.auteur?.prenom?.[0] || ''}{reply.auteur?.nom?.[0] || ''}
                                    </div>
                                  )}
                                </div>
                                <div className={styles.authorInfo}>
                                  <span className={styles.authorName}>
                                    {reply.auteur?.prenom} {reply.auteur?.nom}
                                  </span>
                                  <span className={styles.commentDate}>
                                    {formatDate(reply.creation_date)}
                                  </span>
                                </div>
                              </div>
                              <button 
                                className={styles.commentActionButton}
                                title="Delete reply"
                                onClick={() => {
                                  if (window.confirm('Are you sure you want to delete this reply?')) {
                                    deleteComment(reply._id);
                                  }
                                }}
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                            <div className={styles.replyContent}>
                              {reply.contenu}
                            </div>
                          </div>
                        ))}
                        
                        {comment.hasMoreReplies && (
                          <button className={styles.loadMoreReplies}>
                            View more replies ({comment.totalReplies - comment.replies.length})
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Comments pagination */}
            {totalPages > 1 && (
              <div className={styles.commentsPagination}>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <i className="fas fa-chevron-left"></i>
                </button>
                <span className={styles.paginationInfo}>
                  Page {currentPage} of {totalPages}
                </span>
                <button 
                  className={styles.paginationButton}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Reports tab */}
        {tab === 'reports' && (
          <div className={styles.reportsTab}>
            {post.signalements && post.signalements.length > 0 ? (
              <div className={styles.reportsList}>
                {post.signalements.map((report, index) => (
                  <div key={index} className={styles.reportItem}>
                    <div className={styles.reportHeader}>
                      <div className={styles.reportUser}>
                        <div className={styles.authorAvatar}>
                          {report.utilisateur?.photo_profil ? (
                            <img
                              src={toAbsoluteUrl(report.utilisateur.photo_profil) || undefined}
                              alt={`${report.utilisateur?.prenom || ''} ${report.utilisateur?.nom || ''}`}
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {report.utilisateur?.prenom?.[0] || ''}{report.utilisateur?.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <div className={styles.reportUserInfo}>
                          <span className={styles.userName}>
                            {report.utilisateur?.prenom} {report.utilisateur?.nom}
                          </span>
                          <span className={styles.reportDate}>
                            {formatDate(report.date)}
                          </span>
                        </div>
                      </div>
                      <Link 
                        to={`/admin/users/${report.utilisateur?._id}`}
                        className={styles.viewUserButton}
                      >
                        <i className="fas fa-user"></i>
                        View profile
                      </Link>
                    </div>
                    <div className={styles.reportReason}>
                      <span className={styles.reasonLabel}>Reason:</span>
                      <span className={styles.reasonText}>{report.raison}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className={styles.noReportsContainer}>
                <div className={styles.noReportsIcon}>
                  <i className="fas fa-flag"></i>
                </div>
                <p>No reports for this post</p>
              </div>
            )}
          </div>
        )}

        {/* Analytics tab */}
        {tab === 'analytics' && (
          <div className={styles.analyticsTab}>
            {analyticsLoading ? (
              <div className={styles.loadingContainer}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading analytics...</p>
              </div>
            ) : analytics ? (
              <div className={styles.analyticsContent}>
                <div className={styles.analyticsGrid}>
                  <div className={styles.analyticsCard}>
                    <h4>Views</h4>
                    <div className={styles.analyticsValue}>{analytics.vues || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Engagements</h4>
                    <div className={styles.analyticsValue}>{analytics.engagements || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Reach</h4>
                    <div className={styles.analyticsValue}>{analytics.portee || 0}</div>
                  </div>
                  <div className={styles.analyticsCard}>
                    <h4>Engagement rate</h4>
                    <div className={styles.analyticsValue}>{analytics.tauxEngagement || 0}%</div>
                  </div>
                </div>
                
                {analytics.graphiques && (
                  <div className={styles.chartsSection}>
                    <h4>Performance over time</h4>
                    <div className={styles.chartPlaceholder}>
                      <p>30-day performance charts</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.noAnalyticsContainer}>
                <div className={styles.noAnalyticsIcon}>
                  <i className="fas fa-chart-bar"></i>
                </div>
                <p>No analytics data available</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {confirmDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Confirm deletion</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmDelete(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to delete this post? This action is irreversible.</p>
              <p>All associated comments will also be deleted.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deletePost}
                disabled={actionLoading}
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmModerate && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Moderate post</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmModerate(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Please provide the moderation reason.</p>
              <textarea 
                className={styles.moderationTextarea}
                placeholder="Moderation reason..."
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
              ></textarea>
              <div className={styles.reasonTemplates}>
                {moderationReasons.map((reason, index) => (
                  <button 
                    key={index}
                    onClick={() => setModerationReason(reason)}
                    type="button"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setConfirmModerate(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.moderateConfirmButton}
                onClick={moderatePost}
                disabled={!moderationReason.trim() || actionLoading}
              >
                {actionLoading ? 'Moderating...' : 'Moderate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmRestore && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3>Restore post</h3>
              <button 
                className={styles.modalCloseButton}
                onClick={() => setConfirmRestore(false)}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <p>Are you sure you want to restore this post?</p>
              <p>The post will be visible to all users again.</p>
            </div>
            <div className={styles.modalFooter}>
              <button 
                className={styles.cancelButton}
                onClick={() => setConfirmRestore(false)}
              >
                Cancel
              </button>
              <button 
                className={styles.restoreConfirmButton}
                onClick={restorePost}
                disabled={actionLoading}
              >
                {actionLoading ? 'Restoring...' : 'Restore'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostDetails;
