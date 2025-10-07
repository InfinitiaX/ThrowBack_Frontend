// components/Dashboard/AdminDashboard/Posts/AdminPosts.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import styles from './AdminPosts.module.css';
import socialAPI from '../../../../utils/socialAPI';

const AdminPosts = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // UI state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPosts, setTotalPosts] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    visibility: '',
    status: '',
    hasMedia: '',
    hasReports: '',
    sortBy: 'newest'
  });
  
  // Bulk actions
  const [selectedPosts, setSelectedPosts] = useState([]);
  const [bulkActionOpen, setBulkActionOpen] = useState(false);
  const [showBulkModerationModal, setShowBulkModerationModal] = useState(false);
  const [bulkModerationReason, setBulkModerationReason] = useState('');
  const [bulkActionType, setBulkActionType] = useState('');
  
  // Individual actions
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [postToModerate, setPostToModerate] = useState(null);
  const [moderationReason, setModerationReason] = useState('');
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    reported: 0,
    moderated: 0,
    active: 0
  });

  const searchTimeoutRef = React.useRef(null);

  useEffect(() => {
    fetchPosts();
    fetchStats();
  }, [currentPage, filters]);

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate, location.pathname]);

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

  const fetchStats = useCallback(async () => {
    try {
      const response = await socialAPI.getModerationStats();
      setStats(response.data || {
        total: 0,
        reported: 0,
        moderated: 0,
        active: 0
      });
    } catch (err) {
      console.error('Error loading statistics:', err);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = {
        page: currentPage,
        limit: 10,
        search: searchTerm.trim() || undefined,
        visibility: filters.visibility || undefined,
        status: filters.status || undefined,
        hasMedia: filters.hasMedia || undefined,
        hasReports: filters.hasReports === 'true' ? true : undefined,
        sortBy: filters.sortBy || 'newest',
        isAdmin: true
      };
      
      const response = await socialAPI.getAllPosts(params);
      
      setPosts(Array.isArray(response.data) ? response.data : []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalPosts(response.pagination?.total || 0);
      
    } catch (err) {
      console.error('Error loading posts:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while loading posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filters]);

  const handleSearchChange = useCallback((e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
    }, 500);
  }, []);

  const handleSearch = useCallback((e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPosts();
  }, [fetchPosts]);

  const resetFilters = useCallback(() => {
    setFilters({
      visibility: '',
      status: '',
      hasMedia: '',
      hasReports: '',
      sortBy: 'newest'
    });
    setSearchTerm('');
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((filterName, value) => {
    setFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page) => {
    if (page < 1 || page > totalPages || page === currentPage) return;
    setCurrentPage(page);
  }, [totalPages, currentPage]);

  const handleSelectAll = useCallback((e) => {
    if (e.target.checked) {
      setSelectedPosts(posts.map(post => post._id));
    } else {
      setSelectedPosts([]);
    }
  }, [posts]);

  const handleSelectPost = useCallback((e, postId) => {
    if (e.target.checked) {
      setSelectedPosts(prev => [...prev, postId]);
    } else {
      setSelectedPosts(prev => prev.filter(id => id !== postId));
    }
  }, []);

  const prepareBulkAction = useCallback((action) => {
    if (selectedPosts.length === 0) {
      setError('No post selected');
      return;
    }
    setBulkActionType(action);
    if (action === 'moderate') {
      setShowBulkModerationModal(true);
    } else {
      performBulkAction(action);
    }
  }, [selectedPosts.length]);

  const performBulkAction = useCallback(async (action, reason = '') => {
    if (selectedPosts.length === 0) return;
    
    try {
      setLoading(true);
      setError(null);
      
      let response;
      switch (action) {
        case 'moderate':
          response = await socialAPI.bulkActionPosts('moderate', selectedPosts, reason);
          break;
        case 'restore':
          response = await socialAPI.bulkActionPosts('restore', selectedPosts);
          break;
        case 'delete':
          response = await socialAPI.bulkActionPosts('delete', selectedPosts);
          break;
        default:
          throw new Error('Unknown action');
      }
      
      await Promise.all([fetchPosts(), fetchStats()]);
      
      setSelectedPosts([]);
      setBulkActionOpen(false);
      setShowBulkModerationModal(false);
      setBulkModerationReason('');
      
      const actionText = action === 'moderate' ? 'moderated' : 
                         action === 'restore' ? 'restored' : 'deleted';
      setSuccessMessage(`${selectedPosts.length} post(s) ${actionText} successfully`);
      
    } catch (err) {
      console.error(`Error during bulk action "${action}":`, err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred during the bulk action');
    } finally {
      setLoading(false);
    }
  }, [selectedPosts, fetchPosts, fetchStats]);

  const confirmDeletePost = useCallback((postId) => {
    setPostToDelete(postId);
    setConfirmDelete(true);
  }, []);

  const deletePost = useCallback(async () => {
    if (!postToDelete) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await socialAPI.adminDeletePost(postToDelete);
      
      await Promise.all([fetchPosts(), fetchStats()]);
      
      setPostToDelete(null);
      setConfirmDelete(false);
      setSuccessMessage('Post deleted successfully');
      
    } catch (err) {
      console.error('Error deleting post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while deleting the post');
    } finally {
      setLoading(false);
    }
  }, [postToDelete, fetchPosts, fetchStats]);

  const togglePostModeration = useCallback(async (postId, isModerated) => {
    if (isModerated) {
      try {
        setLoading(true);
        await socialAPI.restorePost(postId);
        await Promise.all([fetchPosts(), fetchStats()]);
        setSuccessMessage('Post restored successfully');
      } catch (err) {
        console.error('Error restoring post:', err);
        const formattedError = socialAPI.formatApiError(err);
        setError(formattedError.message || 'An error occurred while restoring the post');
      } finally {
        setLoading(false);
      }
    } else {
      setPostToModerate(postId);
      setShowModerationModal(true);
    }
  }, [fetchPosts, fetchStats]);

  const moderatePost = useCallback(async () => {
    if (!postToModerate || !moderationReason.trim()) return;
    
    try {
      setLoading(true);
      setError(null);
      
      await socialAPI.moderatePost(postToModerate, moderationReason);
      
      await Promise.all([fetchPosts(), fetchStats()]);
      
      setPostToModerate(null);
      setShowModerationModal(false);
      setModerationReason('');
      setSuccessMessage('Post moderated successfully');
      
    } catch (err) {
      console.error('Error moderating post:', err);
      const formattedError = socialAPI.formatApiError(err);
      setError(formattedError.message || 'An error occurred while moderating the post');
    } finally {
      setLoading(false);
    }
  }, [postToModerate, moderationReason, fetchPosts, fetchStats]);

  const formatDate = useCallback((dateString) => {
    try {
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return 'Unknown date';
    }
  }, []);

  const truncateText = useCallback((text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
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

  return (
    <div className={styles.adminPosts}>
      {/* Header with stats */}
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <h1 className={styles.title}>Posts Management</h1>
          {stats && (
            <div className={styles.quickStats}>
              <span className={styles.statItem}>
                Total: <strong>{stats.total || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Reported: <strong>{stats.reported || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Moderated: <strong>{stats.moderated || 0}</strong>
              </span>
              <span className={styles.statItem}>
                Active: <strong>{stats.active || 0}</strong>
              </span>
            </div>
          )}
        </div>
        <div className={styles.actions}>
          {selectedPosts.length > 0 && (
            <div className={styles.bulkActionContainer}>
              <button 
                className={styles.bulkActionButton}
                onClick={() => setBulkActionOpen(!bulkActionOpen)}
              >
                Actions ({selectedPosts.length})
                <i className={`fas fa-chevron-${bulkActionOpen ? 'up' : 'down'}`}></i>
              </button>
              
              {bulkActionOpen && (
                <div className={styles.bulkActionDropdown}>
                  <button onClick={() => prepareBulkAction('restore')}>
                    <i className="fas fa-check"></i> Restore
                  </button>
                  <button onClick={() => prepareBulkAction('moderate')}>
                    <i className="fas fa-shield-alt"></i> Moderate
                  </button>
                  <button onClick={() => prepareBulkAction('delete')}>
                    <i className="fas fa-trash"></i> Delete
                  </button>
                </div>
              )}
            </div>
          )}
          {/* <button 
            className={styles.exportButton}
            onClick={handleExportCSV}
            disabled={loading}
            title="Export CSV"
          >
            <i className="fas fa-download"></i>
            Export CSV
          </button> */}
          <button 
            className={styles.moderationButton}
            onClick={() => navigate('/admin/posts/moderation')}
            title="Moderation page"
          >
            <i className="fas fa-shield-alt"></i>
            Moderation
          </button>
          <button 
            className={styles.refreshButton}
            onClick={() => {
              fetchPosts();
              fetchStats();
            }}
            disabled={loading}
            title="Refresh"
          >
            <i className={`fas fa-sync ${loading ? styles.spinning : ''}`}></i>
            Refresh
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

      {/* Filters & search */}
      <div className={styles.filters}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <div className={styles.searchInputContainer}>
            <input 
              type="text" 
              placeholder="Search by content, author..." 
              value={searchTerm}
              onChange={handleSearchChange}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>
        </form>
        
        <div className={styles.filterControls}>
          <select 
            value={filters.visibility}
            onChange={(e) => handleFilterChange('visibility', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All visibility types</option>
            <option value="PUBLIC">Public</option>
            <option value="FRIENDS">Friends only</option>
            <option value="PRIVATE">Private</option>
          </select>
          
          <select 
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="moderated">Moderated</option>
            <option value="reported">Reported</option>
          </select>
          
          <select 
            value={filters.hasMedia}
            onChange={(e) => handleFilterChange('hasMedia', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All media</option>
            <option value="true">With media</option>
            <option value="false">Without media</option>
          </select>
          
          <select 
            value={filters.hasReports}
            onChange={(e) => handleFilterChange('hasReports', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="">All reports</option>
            <option value="true">With reports</option>
            <option value="false">Without reports</option>
          </select>
          
          <select 
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className={styles.filterSelect}
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="most_liked">Most liked</option>
            <option value="most_commented">Most commented</option>
            <option value="most_reported">Most reported</option>
          </select>
          
          <button 
            onClick={resetFilters}
            className={styles.resetButton}
            title="Reset filters"
          >
            <i className="fas fa-times"></i>
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableContainer}>
        <table className={styles.postsTable}>
          <thead>
            <tr>
              <th>
                <input 
                  type="checkbox" 
                  checked={selectedPosts.length === posts.length && posts.length > 0}
                  onChange={handleSelectAll}
                />
              </th>
              <th>ID</th>
              <th>Content</th>
              <th>Author</th>
              <th>Visibility</th>
              <th>Date</th>
              <th>Likes</th>
              <th>Comments</th>
              <th>Reports</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && !posts.length ? (
              <tr>
                <td colSpan="11" className={styles.loadingCell}>
                  <div className={styles.loadingSpinner}></div>
                  Loading posts...
                </td>
              </tr>
            ) : posts.length === 0 ? (
              <tr>
                <td colSpan="11" className={styles.noDataCell}>
                  {searchTerm || Object.values(filters).some(f => f) ? 
                    'No posts found with these criteria' : 
                    'No posts found'
                  }
                </td>
              </tr>
            ) : (
              posts.map(post => (
                <tr key={post._id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedPosts.includes(post._id)}
                      onChange={(e) => handleSelectPost(e, post._id)}
                    />
                  </td>
                  <td className={styles.idCell}>{post._id}</td>
                  <td className={styles.contentCell}>
                    <div className={styles.contentPreview}>
                      {post.media && (
                        <div className={styles.mediaIndicator}>
                          <i className={`fas ${
                            post.type_media === 'IMAGE' ? 'fa-image' : 
                            post.type_media === 'VIDEO' ? 'fa-video' : 
                            post.type_media === 'AUDIO' ? 'fa-music' : 'fa-file'
                          }`}></i>
                        </div>
                      )}
                      <span>{truncateText(post.contenu)}</span>
                    </div>
                  </td>
                  <td className={styles.authorCell}>
                    {post.auteur ? (
                      <div className={styles.authorInfo}>
                        <div className={styles.authorAvatar}>
                          {post.auteur.photo_profil ? (
                            <img 
                              src={post.auteur.photo_profil}
                              alt={`${post.auteur.prenom} ${post.auteur.nom}`}
                            />
                          ) : (
                            <div className={styles.defaultAvatar}>
                              {post.auteur.prenom?.[0] || ''}{post.auteur.nom?.[0] || ''}
                            </div>
                          )}
                        </div>
                        <Link 
                          to={`/admin/users/${post.auteur._id}`}
                          className={styles.authorName}
                        >
                          {post.auteur.prenom} {post.auteur.nom}
                        </Link>
                      </div>
                    ) : (
                      <span className={styles.unknownAuthor}>Unknown user</span>
                    )}
                  </td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${post.visibilite?.toLowerCase()}`]}`}>
                      {post.visibilite}
                    </span>
                  </td>
                  <td>{formatDate(post.createdAt)}</td>
                  <td className={styles.likesCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-heart"></i>
                      {post.likes?.length || 0}
                    </div>
                  </td>
                  <td className={styles.commentsCell}>
                    <div className={styles.statBadge}>
                      <i className="fas fa-comment"></i>
                      {post.commentaires?.length || post.commentCount || 0}
                    </div>
                  </td>
                  <td className={styles.reportsCell}>
                    <div className={`${styles.statBadge} ${post.signalements?.length > 0 ? styles.hasReports : ''}`}>
                      <i className="fas fa-flag"></i>
                      {post.signalements?.length || 0}
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.statusBadge} ${styles[`status_${post.modere ? 'moderated' : 'active'}`]}`}>
                      {post.modere ? 'Moderated' : 'Active'}
                    </span>
                  </td>
                  <td className={styles.actionsCell}>
                    <div className={styles.actionButtons}>
                      <Link 
                        to={`/admin/posts/${post._id}`} 
                        className={styles.actionButton}
                        title="View details"
                      >
                        <i className="fas fa-eye"></i>
                      </Link>
                      <button 
                        className={styles.actionButton}
                        title={post.modere ? 'Restore' : 'Moderate'}
                        onClick={() => togglePostModeration(post._id, post.modere)}
                        disabled={loading}
                      >
                        <i className={`fas ${post.modere ? 'fa-check' : 'fa-shield-alt'}`}></i>
                      </button>
                      <button 
                        className={`${styles.actionButton} ${styles.deleteButton}`}
                        title="Delete"
                        onClick={() => confirmDeletePost(post._id)}
                        disabled={loading}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-double-left"></i>
          </button>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <i className="fas fa-angle-left"></i>
          </button>
          
          <div className={styles.pageInfo}>
            Page {currentPage} of {totalPages} ({totalPosts} posts)
          </div>
          
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-right"></i>
          </button>
          <button 
            className={styles.pageButton}
            onClick={() => handlePageChange(totalPages)}
            disabled={currentPage === totalPages}
          >
            <i className="fas fa-angle-double-right"></i>
          </button>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Confirm deletion</h3>
            <p>Are you sure you want to delete this post? This action is irreversible.</p>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setConfirmDelete(false);
                  setPostToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={deletePost}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Individual moderation modal */}
      {showModerationModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Moderate post</h3>
            <p>Please provide the moderation reason:</p>
            <textarea
              className={styles.moderationTextarea}
              placeholder="Moderation reason..."
              value={moderationReason}
              onChange={(e) => setModerationReason(e.target.value)}
            />
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
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowModerationModal(false);
                  setPostToModerate(null);
                  setModerationReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={moderatePost}
                disabled={!moderationReason.trim() || loading}
              >
                Moderate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk moderation modal */}
      {showBulkModerationModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <h3>Bulk moderation</h3>
            <p>You are about to moderate {selectedPosts.length} post(s). Please provide the reason:</p>
            <textarea
              className={styles.moderationTextarea}
              placeholder="Moderation reason..."
              value={bulkModerationReason}
              onChange={(e) => setBulkModerationReason(e.target.value)}
            />
            <div className={styles.reasonTemplates}>
              {moderationReasons.map((reason, index) => (
                <button 
                  key={index}
                  onClick={() => setBulkModerationReason(reason)}
                  type="button"
                >
                  {reason}
                </button>
              ))}
            </div>
            <div className={styles.modalActions}>
              <button 
                className={styles.cancelButton}
                onClick={() => {
                  setShowBulkModerationModal(false);
                  setBulkModerationReason('');
                }}
              >
                Cancel
              </button>
              <button 
                className={styles.deleteConfirmButton}
                onClick={() => performBulkAction('moderate', bulkModerationReason)}
                disabled={!bulkModerationReason.trim() || loading}
              >
                Moderate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPosts;
