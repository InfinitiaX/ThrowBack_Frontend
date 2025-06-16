import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import AddVideoModal from './AddVideoModal';
import EditVideoModal from './EditVideoModal';
import VideoDetailModal from './AdminVideoDetailModal';
import DeleteConfirmModal from './DeleteConfirmModal';
import styles from './Videos.module.css';

// Liste des genres disponibles (normalement importé du modèle Video)
const GENRES = [
  'Pop', 'Rock', 'Hip-Hop', 'Rap', 'R&B', 'Soul', 'Jazz', 'Blues', 
  'Electronic', 'Dance', 'House', 'Techno', 'Country', 'Folk', 
  'Classical', 'Opera', 'Reggae', 'Reggaeton', 'Latin', 'World', 
  'Alternative', 'Indie', 'Metal', 'Punk', 'Funk', 'Disco', 
  'Gospel', 'Soundtrack', 'Other'
];

const Videos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showError, setShowError] = useState(false);
  
  // Modals state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  
  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [decadeFilter, setDecadeFilter] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats
  const [stats, setStats] = useState({
    total: 0,
    music: 0,
    podcast: 0,
    short: 0
  });

  // Toggle view mode (grid or table)
  const [viewMode, setViewMode] = useState('grid');
  
  // Screen size detection for responsive behavior
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size changes
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      // Auto switch to grid on mobile for better UX
      if (window.innerWidth <= 768 && viewMode === 'table') {
        setViewMode('grid');
      }
    };

    handleResize(); // Check initial size
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Fetch videos with filters
  const fetchVideos = async () => {
    try {
      setLoading(true);
      setShowError(false);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (typeFilter) params.append('type', typeFilter);
      if (decadeFilter) params.append('decade', decadeFilter);
      if (genreFilter) params.append('genre', genreFilter);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const response = await fetch(`/api/admin/videos?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }
      
      const data = await response.json();
      setVideos(data.videos || []);
      setTotalPages(data.totalPages || 1);
      
      // Set total count
      if (data.total) {
        setStats(prev => ({
          ...prev,
          total: data.total
        }));
      }
      
      // Fetch video stats if we're on the first page with no filters
      if (currentPage === 1 && !typeFilter && !decadeFilter && !genreFilter && !searchQuery) {
        fetchVideoStats();
      }
    } catch (err) {
      setError(err.message);
      setShowError(true);
      console.error('Error fetching videos:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch video stats
  const fetchVideoStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/videos/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        return; // Silently fail stats
      }
      
      const data = await response.json();
      if (data.success) {
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching video stats:', err);
    }
  };

  // Load videos on mount and when filters change
  useEffect(() => {
    fetchVideos();
  }, [typeFilter, decadeFilter, genreFilter, currentPage]);

  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVideos();
  };

  // Handle filters reset
  const handleReset = () => {
    setSearchQuery('');
    setTypeFilter('');
    setDecadeFilter('');
    setGenreFilter('');
    setCurrentPage(1);
  };

  // Toggle view mode between grid and table
  const toggleViewMode = () => {
    if (!isMobile) { // Prevent table view on mobile
      setViewMode(prev => prev === 'grid' ? 'table' : 'grid');
    }
  };

  // Handle video creation
  const handleVideoCreated = (newVideo) => {
    setVideos(prevVideos => [newVideo, ...prevVideos]);
    setAddModalOpen(false);
    fetchVideoStats();
  };

  // Handle video update
  const handleVideoUpdated = (updatedVideo) => {
    setVideos(prevVideos => 
      prevVideos.map(video => 
        video._id === updatedVideo._id ? updatedVideo : video
      )
    );
    setEditModalOpen(false);
    setSelectedVideo(null);
  };

  // Handle video deletion
  const handleDeleteClick = (video) => {
    setSelectedVideo(video);
    setDeleteModalOpen(true);
  };

  const handleVideoDeleted = (deletedId) => {
    setVideos(prevVideos => 
      prevVideos.filter(video => video._id !== deletedId)
    );
    setDeleteModalOpen(false);
    setSelectedVideo(null);
    fetchVideoStats();
  };

  // Handle video detail view
  const handleViewDetails = (video) => {
    setSelectedVideo(video);
    setDetailModalOpen(true);
  };

  // Handle video edit
  const handleEditClick = (video) => {
    setSelectedVideo(video);
    setEditModalOpen(true);
  };

  // Render video grid item
  const renderVideoGridItem = (video) => (
    <div key={video._id} className={styles.videoCard}>
      <div className={styles.videoType}>{video.type.toUpperCase()}</div>
      <div 
        className={styles.videoThumbnail}
        onClick={() => handleViewDetails(video)}
      >
        <img 
          src={`https://img.youtube.com/vi/${getYouTubeVideoId(video.youtubeUrl)}/mqdefault.jpg`} 
          alt={video.titre}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/placeholder-video.jpg';
          }}
        />
        
        {video.decennie && (
          <div className={styles.videoDecade}>{video.decennie}</div>
        )}
        
        {video.genre && (
          <div className={styles.videoGenre}>{video.genre}</div>
        )}
        
        {video.type === 'short' && video.duree && (
          <div className={styles.videoDuration}>{video.duree}s</div>
        )}
      </div>
      
      <div className={styles.videoInfo}>
        <h3 className={styles.videoTitle} title={video.titre}>
          {video.titre}
        </h3>
        <div className={styles.videoMeta}>
          <div className={styles.videoArtist}>{video.artiste || 'Unknown artist'}</div>
          <div className={styles.videoYear}>{video.annee || ''}</div>
        </div>
      </div>
      
      <div className={styles.videoActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => handleViewDetails(video)}
          title="View details"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleEditClick(video)}
          title="Edit video"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleDeleteClick(video)}
          title="Delete video"
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  // Render video table row
  const renderVideoTableRow = (video) => (
    <tr key={video._id} className={styles.videoTableRow}>
      <td className={styles.thumbnailCell}>
        <img 
          src={`https://img.youtube.com/vi/${getYouTubeVideoId(video.youtubeUrl)}/default.jpg`} 
          alt={video.titre}
          className={styles.tableThumbnail}
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/placeholder-video.jpg';
          }}
        />
      </td>
      <td>{video.titre}</td>
      <td>{video.artiste || '-'}</td>
      <td>
        <span className={`${styles.typeTag} ${styles[video.type]}`}>
          {video.type}
        </span>
      </td>
      <td>{video.genre || '-'}</td>
      <td>{video.decennie || '-'}</td>
      <td>{video.annee || '-'}</td>
      <td className={styles.tableActions}>
        <button 
          className={styles.actionButton} 
          onClick={() => handleViewDetails(video)}
          title="View details"
        >
          <i className="fas fa-eye"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleEditClick(video)}
          title="Edit video"
        >
          <i className="fas fa-edit"></i>
        </button>
        <button 
          className={styles.actionButton} 
          onClick={() => handleDeleteClick(video)}
          title="Delete video"
        >
          <i className="fas fa-trash"></i>
        </button>
      </td>
    </tr>
  );

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        
      <div>
      <h1>Video Management</h1>
      <br/>
      <p>Welcome to the videos management panel 👋</p>
      </div>
  
        <div className={styles.headerActions}>
          {!isMobile && (
            <button 
              className={styles.viewToggleButton}
              onClick={toggleViewMode}
              title={viewMode === 'grid' ? 'Switch to table view' : 'Switch to grid view'}
            >
              <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
            </button>
          )}
          <button 
            className={styles.addButton}
            onClick={() => setAddModalOpen(true)}
          >
            <i className="fas fa-plus"></i> 
            <span>{isMobile ? 'Add' : 'Add video'}</span>
          </button>
        </div>
      </div>
      
      {/* Stats cards */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-film"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.total}</div>
            <div className={styles.statLabel}>Total Videos</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{backgroundColor: '#4c6ef5'}}>
            <i className="fas fa-music"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.music || 0}</div>
            <div className={styles.statLabel}>Music Videos</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{backgroundColor: '#40c057'}}>
            <i className="fas fa-podcast"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.podcast || 0}</div>
            <div className={styles.statLabel}>Podcasts</div>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{backgroundColor: '#fab005'}}>
            <i className="fas fa-bolt"></i>
          </div>
          <div className={styles.statContent}>
            <div className={styles.statValue}>{stats.short || 0}</div>
            <div className={styles.statLabel}>Shorts</div>
          </div>
        </div>
      </div>

      {/* Search and filters */}
      <div className={styles.filtersContainer}>
        <div className={styles.filtersTop}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <input
              type="text"
              placeholder={isMobile ? "Search videos..." : "Search for a video..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <button type="submit" className={styles.searchButton}>
              <i className="fas fa-search"></i>
            </button>
          </form>
          
          <div className={styles.filterButtons}>
            {(searchQuery || typeFilter || decadeFilter || genreFilter) && (
              <button 
                onClick={handleReset} 
                className={styles.resetButton}
              >
                <i className="fas fa-times"></i> 
                <span>{isMobile ? 'Clear' : 'Clear filters'}</span>
              </button>
            )}
          </div>
        </div>
        
        <div className={styles.filtersBottom}>
          <div className={styles.filterGroup}>
            <label htmlFor="typeFilter" className={styles.filterLabel}>Type:</label>
            <select
              id="typeFilter"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All types</option>
              <option value="music">Music</option>
              <option value="podcast">Podcast</option>
              <option value="short">Short</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="genreFilter" className={styles.filterLabel}>Genre:</label>
            <select
              id="genreFilter"
              value={genreFilter}
              onChange={(e) => {
                setGenreFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All genres</option>
              {GENRES.map(genre => (
                <option key={genre} value={genre}>{genre}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <label htmlFor="decadeFilter" className={styles.filterLabel}>Decade:</label>
            <select
              id="decadeFilter"
              value={decadeFilter}
              onChange={(e) => {
                setDecadeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className={styles.filterSelect}
            >
              <option value="">All decades</option>
              <option value="60s">60s</option>
              <option value="70s">70s</option>
              <option value="80s">80s</option>
              <option value="90s">90s</option>
              <option value="2000s">2000s</option>
              <option value="2010s">2010s</option>
              <option value="2020s">2020s</option>
            </select>
          </div>
          
          <div className={styles.resultCount}>
            {videos.length > 0 && (
              <>
                <span className={styles.countValue}>
                  {videos.length}
                </span> 
                <span className={styles.countLabel}>
                  {videos.length === 1 ? 'video' : 'videos'}
                  {!isMobile && ' found'}
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && videos.length === 0 && (
        <div className={styles.loadingState}>
          <div className={styles.loadingSpinner}>
            <i className="fas fa-spinner fa-spin"></i>
          </div>
          <div className={styles.loadingText}>Loading videos...</div>
        </div>
      )}

      {/* Error state */}
      {showError && error && (
        <div className={styles.errorState}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button 
            className={styles.retryButton}
            onClick={() => fetchVideos()}
          >
            <i className="fas fa-redo"></i> Retry
          </button>
        </div>
      )}

      {/* Video grid or table */}
      {!loading && videos.length === 0 && !showError ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>
            <i className="fas fa-film"></i>
          </div>
          <h3 className={styles.emptyTitle}>No videos found</h3>
          <p className={styles.emptyMessage}>
            {searchQuery || typeFilter || decadeFilter || genreFilter ? 
              'Try adjusting your filters or search query' :
              'Add your first video to get started'
            }
          </p>
          <button 
            onClick={() => setAddModalOpen(true)}
            className={styles.addEmptyButton}
          >
            <i className="fas fa-plus"></i> Add your first video
          </button>
        </div>
      ) : viewMode === 'grid' || isMobile ? (
        <div className={styles.videoGrid}>
          {videos.map(video => renderVideoGridItem(video))}
        </div>
      ) : (
        <div className={styles.videoTableContainer}>
          <table className={styles.videoTable}>
            <thead>
              <tr>
                <th className={styles.thumbnailHeader}>Thumbnail</th>
                <th>Title</th>
                <th>Artist</th>
                <th>Type</th>
                <th>Genre</th>
                <th>Decade</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => renderVideoTableRow(video))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {videos.length > 0 && totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            className={styles.paginationButton}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            <i className="fas fa-chevron-left"></i> 
            {!isMobile && 'Previous'}
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
            {!isMobile && 'Next'} <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Modals */}
      <AddVideoModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onVideoCreated={handleVideoCreated}
      />
      
      {selectedVideo && (
        <>
          <EditVideoModal
            isOpen={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedVideo(null);
            }}
            video={selectedVideo}
            onVideoUpdated={handleVideoUpdated}
          />
          
          <VideoDetailModal
            isOpen={detailModalOpen}
            onClose={() => {
              setDetailModalOpen(false);
              setSelectedVideo(null);
            }}
            video={selectedVideo}
          />
          
          <DeleteConfirmModal
            isOpen={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedVideo(null);
            }}
            videoId={selectedVideo._id}
            videoTitle={selectedVideo.titre}
            onVideoDeleted={handleVideoDeleted}
          />
        </>
      )}
    </div>
  );
};

// Helper function to extract YouTube video ID
const getYouTubeVideoId = (url) => {
  try {
    const videoUrl = new URL(url);
    let videoId = '';
    
    if (videoUrl.hostname.includes('youtube.com')) {
      videoId = videoUrl.searchParams.get('v');
    } else if (videoUrl.hostname.includes('youtu.be')) {
      videoId = videoUrl.pathname.substring(1);
    }
    
    return videoId || 'placeholder';
  } catch (error) {
    return 'placeholder';
  }
};

export default Videos;