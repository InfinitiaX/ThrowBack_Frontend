import React, { useEffect, useState } from 'react';
import AdminShortFormModal from './AdminShortFormModal';
import AdminShortDetailModal from './AdminShortDetailModal';
import styles from '../Videos/Videos.module.css';

// API Base URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const Shorts = () => {
  const [shorts, setShorts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editShort, setEditShort] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [viewShort, setViewShort] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [shortToDelete, setShortToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({ total: 0, recent: [] });
  
  // Function to get full video URL
  const getFullVideoUrl = (path) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
    const fullUrl = `${apiBaseUrl}${normalizedPath}`;
    return fullUrl;
  };
  
  // Auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please log in again.');
      return null;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // Fetch shorts
  const fetchShorts = async () => {
    setLoading(true);
    setError('');
    
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return;
    }
    
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/shorts?${params.toString()}`, {
        headers,
        credentials: 'include'
      });
      
      if (!res.ok) {
        try {
          const errorData = await res.json();
          throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
        } catch {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }
      }
      
      const data = await res.json();
      let shortsData = [];
      
      if (data.videos && Array.isArray(data.videos)) {
        shortsData = data.videos;
      } else if (data.data && Array.isArray(data.data)) {
        shortsData = data.data;
      } else if (Array.isArray(data)) {
        shortsData = data;
      }
      
      shortsData = shortsData.map((short) => {
        const videoUrl = getFullVideoUrl(short.youtubeUrl);
        return {
          ...short,
          youtubeUrl: videoUrl
        };
      });
      
      setShorts(shortsData);
      setTotalPages(data.totalPages || 1);
    } catch (err) {
      console.error('Shorts fetch error:', err);
      setError(err.message || 'An error occurred while loading shorts.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    const headers = getAuthHeaders();
    if (!headers) return;
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/shorts/stats`, {
        headers,
        credentials: 'include'
      });
      
      if (!res.ok) {
        return; // Continue without stats
      }
      
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
      } else {
        setStats({ total: shorts.length, recent: [] });
      }
    } catch (err) {
      console.error('Error fetching shorts stats:', err);
      setStats({ total: shorts.length, recent: [] });
    }
  };

  useEffect(() => {
    fetchShorts();
  }, [currentPage]);

  useEffect(() => {
    if (currentPage === 1 && !searchQuery) {
      fetchStats();
    }
  }, [currentPage, searchQuery]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchShorts();
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleShortSaved = (short) => {
    if (editShort) {
      setShorts((list) => list.map((s) => (s._id === short._id ? short : s)));
    } else {
      setShorts((list) => [short, ...list]);
    }
    setEditShort(null);
    fetchStats(); // Refresh stats
  };

  const handleDeleteClick = (short) => {
    setShortToDelete(short);
    setDeleteModalOpen(true);
  };

  // Delete handler
  const handleDelete = async () => {
    if (!shortToDelete) return;
    
    setDeleteLoading(shortToDelete._id);
    setError('');
    
    const headers = getAuthHeaders();
    if (!headers) {
      setDeleteLoading(null);
      return;
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/shorts/${shortToDelete._id}`, {
        method: 'DELETE',
        headers,
        credentials: 'include'
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
      }
      
      await res.json();
      
      setShorts((list) => list.filter((s) => s._id !== shortToDelete._id));
      fetchStats(); // Refresh stats
      setDeleteModalOpen(false);
      setShortToDelete(null);
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.message || 'An error occurred while deleting.');
    } finally {
      setDeleteLoading(null);
    }
  };

  const getVideoThumbnail = (short) => {
    const { youtubeUrl } = short;
    const isYouTubeVideo =
      youtubeUrl && (youtubeUrl.includes('youtube.com') || youtubeUrl.includes('youtu.be'));
    
    if (isYouTubeVideo) {
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (videoId && videoId !== 'placeholder') {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    } else if (youtubeUrl && (youtubeUrl.startsWith('/uploads/') || youtubeUrl.includes('/uploads/'))) {
      return `${API_BASE_URL}/images/video-thumbnail.jpg`;
    }
    return '/images/placeholder-video.jpg';
  };

  // Thumbnail component
  const VideoThumbnail = ({ short }) => {
    const [thumbnailSrc, setThumbnailSrc] = useState(getVideoThumbnail(short));
    const [isGenerating, setIsGenerating] = useState(false);

    const generateThumbnailFromVideo = (videoUrl) => {
      setIsGenerating(true);
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.currentTime = 1; // 1s frame
      
      video.onloadeddata = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 180;
        const ctx = canvas.getContext('2d');
        
        video.currentTime = 1;
        video.onseeked = () => {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const thumbnailDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          setThumbnailSrc(thumbnailDataUrl);
          setIsGenerating(false);
        };
      };
      
      video.onerror = () => {
        setThumbnailSrc('/images/placeholder-video.jpg');
        setIsGenerating(false);
      };
      
      video.src = videoUrl;
    };

    const handleImageError = () => {
      // If YouTube fails or local upload, try to generate from video file
      if (
        short.youtubeUrl &&
        (short.youtubeUrl.startsWith('/uploads/') || short.youtubeUrl.includes('/uploads/')) &&
        !isGenerating
      ) {
        generateThumbnailFromVideo(short.youtubeUrl);
      } else {
        setThumbnailSrc('/images/placeholder-video.jpg');
      }
    };

    return (
      <img
        src={thumbnailSrc}
        alt={short.titre}
        onError={handleImageError}
        crossOrigin="anonymous"
        style={{
          opacity: isGenerating ? 0.5 : 1,
          transition: 'opacity 0.3s ease'
        }}
      />
    );
  };

  const getYouTubeVideoId = (url) => {
    try {
      if (!url) return null;
      const videoUrl = new URL(url);
      let videoId = '';
      
      if (videoUrl.hostname.includes('youtube.com')) {
        // youtube.com/watch?v=VIDEO_ID
        if (videoUrl.searchParams.get('v')) {
          videoId = videoUrl.searchParams.get('v');
        }
        // youtube.com/shorts/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/shorts/')) {
          videoId = videoUrl.pathname.replace('/shorts/', '');
        }
        // youtube.com/embed/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/embed/')) {
          videoId = videoUrl.pathname.replace('/embed/', '');
        }
      } else if (videoUrl.hostname.includes('youtu.be')) {
        // youtu.be/VIDEO_ID
        videoId = videoUrl.pathname.substring(1);
      }
      
      return videoId;
    } catch (error) {
      // Fallback for malformed URLs
      const match =
        url && url.match
          ? url.match(
              /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i
            )
          : null;
      if (match && match[1]) {
        return match[1];
      }
      return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Shorts Management</h1>
        <p>Manage short videos</p>
        </div>
        <button
          className={styles.addButton}
          onClick={() => {
            setEditShort(null);
            setShowModal(true);
          }}
        >
          <i className="fas fa-plus"></i> Add Short
        </button>
      </div>

      {/* Stats Card */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ backgroundColor: '#fab005' }}>
            <i className="fas fa-bolt"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Shorts</div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <div className={styles.searchForm}>
            <input
              type="text"
              placeholder="Search shorts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className={styles.searchInput}
            />
            <button type="button" onClick={handleSearch} className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </div>

          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                setCurrentPage(1);
                fetchShorts();
              }}
              className={styles.resetButton}
            >
              <i className="fas fa-times"></i> Clear
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button className={styles.retryButton} onClick={fetchShorts}>
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {loading && shorts.length === 0 ? (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div className={styles.loadingText}>Loading shorts...</div>
        </div>
      ) : shorts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-bolt"></i>
          </div>
          <h3 className={styles.emptyTitle}>No shorts found</h3>
          <p className={styles.emptyMessage}>
            {searchQuery ? 'No shorts match your search' : 'Add your first short to get started'}
          </p>
          <button onClick={() => setShowModal(true)} className={styles.addEmptyButton}>
            <i className="fas fa-plus"></i> Add your first short
          </button>
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className={styles.videoGrid}>
            {shorts.map((short) => (
              <div key={short._id} className={styles.videoCard} data-type="short">
                <div className={styles.videoType}>SHORT</div>
                <div className={styles.videoThumbnail} onClick={() => setViewShort(short)}>
                  <VideoThumbnail short={short} />
                  {short.duree && <div className={styles.videoDuration}>{short.duree}s</div>}
                </div>

                <div className={styles.videoInfo}>
                  <h3 className={styles.videoTitle} title={short.titre}>
                    {short.titre}
                  </h3>
                  <div className={styles.videoMeta}>
                    <div className={styles.videoArtist}>{short.artiste || 'Unknown Artist'}</div>
                    <div className={styles.videoYear}>
                      {new Date(short.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                <div className={styles.videoActions}>
                  <button
                    className={styles.actionButton}
                    onClick={() => setViewShort(short)}
                    title="View details"
                  >
                    <i className="fas fa-eye"></i>
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => {
                      setEditShort(short);
                      setShowModal(true);
                    }}
                    title="Edit"
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className={styles.actionButton}
                    onClick={() => handleDeleteClick(short)}
                    title="Delete"
                    disabled={deleteLoading === short._id}
                  >
                    {deleteLoading === short._id ? (
                      <i className="fas fa-spinner fa-spin"></i>
                    ) : (
                      <i className="fas fa-trash"></i>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={styles.pagination}>
              <button
                className={styles.paginationButton}
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              >
                <i className="fas fa-chevron-left"></i> Previous
              </button>

              <div className={styles.pageNumbers}>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;

                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      className={`${styles.pageNumber} ${
                        currentPage === pageNum ? styles.currentPage : ''
                      }`}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                className={styles.paginationButton}
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              >
                Next <i className="fas fa-chevron-right"></i>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modals */}
      <AdminShortFormModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditShort(null);
        }}
        onShortSaved={handleShortSaved}
        initialData={editShort}
      />

      <AdminShortDetailModal
        isOpen={!!viewShort}
        onClose={() => setViewShort(null)}
        short={viewShort}
      />

      {/* Delete Confirmation Modal */}
      {deleteModalOpen && shortToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <h2>Confirm Deletion</h2>
              <button
                className={styles.closeButton}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setShortToDelete(null);
                }}
                disabled={deleteLoading}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className={styles.modalForm}>
              <div className={styles.deleteConfirmContent}>
                <div className={styles.deleteIcon}>
                  <i className="fas fa-exclamation-triangle"></i> Delete Short
                </div>

                <div className={styles.deleteMessage}>
                  <p>
                    <strong>Are you sure you want to delete this video?</strong>
                  </p>

                  <div className={styles.deleteDetails}>
                    <p>
                      You are about to delete: <strong>{shortToDelete.titre}</strong>
                    </p>
                    <p className={styles.deleteWarningText}>This action cannot be undone.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setDeleteModalOpen(false);
                  setShortToDelete(null);
                }}
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Shorts;
