import React, { useEffect, useState } from 'react';
import AdminShortFormModal from './AdminShortFormModal';
import AdminShortDetailModal from './AdminShortDetailModal';
import styles from '../Videos/Videos.module.css';

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

  // Fetch shorts with pagination and search
  const fetchShorts = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const res = await fetch(`/api/admin/shorts?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error loading shorts');
      
      setShorts(data.videos || []);
      setTotalPages(data.totalPages || 1);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch stats
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/shorts/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      }
    } catch (err) {
      console.error('Error fetching shorts stats:', err);
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
      setShorts(list => list.map(s => s._id === short._id ? short : s));
    } else {
      setShorts(list => [short, ...list]);
    }
    setEditShort(null);
    fetchStats(); // Refresh stats
  };

  const handleDeleteClick = (short) => {
    setShortToDelete(short);
    setDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (!shortToDelete) return;
    
    setDeleteLoading(shortToDelete._id);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/shorts/${shortToDelete._id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error deleting short');
      
      setShorts(list => list.filter(s => s._id !== shortToDelete._id));
      fetchStats(); // Refresh stats
      setDeleteModalOpen(false);
      setShortToDelete(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleteLoading(null);
    }
  };

  const getVideoThumbnail = (short) => {
    const { youtubeUrl } = short;
    
    // Check if it's a YouTube video
    const isYouTubeVideo = youtubeUrl && (
      youtubeUrl.includes('youtube.com') || 
      youtubeUrl.includes('youtu.be')
    );
    
    if (isYouTubeVideo) {
      // For YouTube videos, get video ID and use YouTube thumbnail
      const videoId = getYouTubeVideoId(youtubeUrl);
      if (videoId && videoId !== 'placeholder') {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
      }
    } else if (youtubeUrl && youtubeUrl.startsWith('/uploads/')) {
      // For uploaded files, we could use the video file itself as poster
      // or generate thumbnails server-side. For now, use placeholder.
      return '/images/placeholder-video.jpg';
    }
    
    // Default fallback
    return '/images/placeholder-video.jpg';
  };

  // Component for displaying video thumbnails
  const VideoThumbnail = ({ short }) => {
    const [thumbnailSrc, setThumbnailSrc] = useState(getVideoThumbnail(short));
    const [isGenerating, setIsGenerating] = useState(false);

    const generateThumbnailFromVideo = (videoUrl) => {
      setIsGenerating(true);
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.currentTime = 1; // Get frame at 1 second
      
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
      // If YouTube thumbnail fails or uploaded file, try to generate thumbnail
      if (short.youtubeUrl && short.youtubeUrl.startsWith('/uploads/') && !isGenerating) {
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
        // Classic format: youtube.com/watch?v=VIDEO_ID
        if (videoUrl.searchParams.get('v')) {
          videoId = videoUrl.searchParams.get('v');
        }
        // Shorts format: youtube.com/shorts/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/shorts/')) {
          videoId = videoUrl.pathname.replace('/shorts/', '');
        }
        // Embed format: youtube.com/embed/VIDEO_ID
        else if (videoUrl.pathname.startsWith('/embed/')) {
          videoId = videoUrl.pathname.replace('/embed/', '');
        }
      } else if (videoUrl.hostname.includes('youtu.be')) {
        // Short format: youtu.be/VIDEO_ID
        videoId = videoUrl.pathname.substring(1);
      }
      
      return videoId;
    } catch (error) {
      return null;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1>Shorts Management</h1>
          <p>Manage short videos (10-30 seconds) 🎬</p>
        </div>
        <button 
          className={styles.addButton} 
          onClick={() => { setEditShort(null); setShowModal(true); }}
        >
          <i className="fas fa-plus"></i> Add short
        </button>
      </div>

      {/* Stats Card */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{backgroundColor: '#fab005'}}>
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
          <button 
            onClick={() => setShowModal(true)}
            className={styles.addEmptyButton}
          >
            <i className="fas fa-plus"></i> Add your first short
          </button>
        </div>
      ) : (
        <>
          {/* Grid View */}
          <div className={styles.videoGrid}>
            {shorts.map(short => (
              <div key={short._id} className={styles.videoCard}>
                <div className={styles.videoType}>SHORT</div>
                <div 
                  className={styles.videoThumbnail}
                  onClick={() => setViewShort(short)}
                >
                  <VideoThumbnail short={short} />
                  
                  {short.duree && (
                    <div className={styles.videoDuration}>{short.duree}s</div>
                  )}
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
                    onClick={() => { setEditShort(short); setShowModal(true); }}
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
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
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
                      className={`${styles.pageNumber} ${currentPage === pageNum ? styles.currentPage : ''}`}
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
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
        onClose={() => { setShowModal(false); setEditShort(null); }}
        onShortSaved={handleShortSaved}
        initialData={editShort}
      />
      
      <AdminShortDetailModal
        isOpen={!!viewShort}
        onClose={() => setViewShort(null)}
        short={viewShort}
      />

      {/* Delete Confirmation Modal - Style like Video Management */}
      {deleteModalOpen && shortToDelete && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '450px' }}>
            <div className={styles.modalHeader}>
              <h2>Confirm Delete</h2>
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
                  <p><strong>Are you sure you want to delete this video?</strong></p>
                  
                  <div className={styles.deleteDetails}>
                    <p>You are about to delete: <strong>{shortToDelete.titre}</strong></p>
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