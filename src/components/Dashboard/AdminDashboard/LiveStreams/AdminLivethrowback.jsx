// components/LiveThrowback/AdminLiveThrowback.jsx
import React, { useState, useEffect, useCallback } from 'react';
import styles from './LiveThrowback.module.css';
import adminStyles from '../AdminLayout.module.css';
import DeleteConfirmModal from './DeleteConfirmModal';
import LiveStreamDetailModal from './LiveStreamDetailModal';
import LiveStreamEditModal from './LiveStreamEditModal';

// Internal components for modularity
import LiveStreamList from './LiveStreamList';
import VideoUrlImport from './VideoUrlImport';
import CompilationBuilder from './CompilationBuilder';
import LiveStreamScheduler from './LiveStreamScheduler';

// URL configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

const AdminLiveThrowback = () => {
  // Main state
  const [liveStreams, setLiveStreams] = useState([]);
  const [selectedLiveStream, setSelectedLiveStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // UI states
  const [activeTab, setActiveTab] = useState('streams');
  const [viewMode, setViewMode] = useState('grid');
  const [createMode, setCreateMode] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  
  // Compilation states
  const [selectedVideos, setSelectedVideos] = useState([]);
  
  // Filtering/pagination states
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Stats and metrics
  const [stats, setStats] = useState({
    total: 0,
    live: 0,
    scheduled: 0,
    views: 0,
    categories: []
  });

  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('Authentication token not found');
      setError('You are not authenticated. Please sign in again.');
      return null;
    }
    return token;
  };

  // Load livestreams and statistics
  const fetchLiveStreams = useCallback(async () => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      // Build request with filters
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      params.append('page', currentPage);
      params.append('limit', 12);
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/admin/all?${params.toString()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to fetch livestreams');
      }
      
      const data = await response.json();
      setLiveStreams(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      
      // Load stats on first page without filters
      if (currentPage === 1 && !filters.status && !filters.category && !filters.search) {
        fetchStats();
      }
    } catch (err) {
      console.error('fetchLiveStreams error:', err);
      setError(err.message || 'Failed to fetch livestreams');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  // Load statistics
  const fetchStats = async () => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/admin/stats`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Statistics error:', errorData.message || 'Failed to fetch statistics');
        return;
      }
      
      const data = await response.json();
      if (data.success) {
        // Format stats for display
        const liveCount = data.data?.byStatus?.find(s => s._id === 'LIVE')?.count || 0;
        const scheduledCount = data.data?.byStatus?.find(s => s._id === 'SCHEDULED')?.count || 0;
        
        setStats({
          total: data.data?.total || 0,
          live: liveCount,
          scheduled: scheduledCount,
          views: data.data?.totalViews || 0,
          categories: data.data?.byCategory || []
        });
      }
    } catch (err) {
      console.error('Error while fetching statistics:', err);
    }
  };

  // Add a video to the compilation
  const addVideoToCompilation = (video) => {
    // Avoid duplicates
    if (!selectedVideos.some(v => v.videoId === video.videoId)) {
      setSelectedVideos([...selectedVideos, {
        ...video,
        duration: video.duration || '0:00',
        order: selectedVideos.length + 1
      }]);
    }
  };

  // Remove a video from the compilation
  const removeVideoFromCompilation = (videoId) => {
    const updatedVideos = selectedVideos.filter(v => v.videoId !== videoId);
    // Reorder
    const reorderedVideos = updatedVideos.map((video, index) => ({
      ...video,
      order: index + 1
    }));
    setSelectedVideos(reorderedVideos);
  };

  // Reorder videos in the compilation
  const reorderCompilation = (fromIndex, toIndex) => {
    const updatedVideos = [...selectedVideos];
    const [movedVideo] = updatedVideos.splice(fromIndex, 1);
    updatedVideos.splice(toIndex, 0, movedVideo);
    
    // Update orders
    const reorderedVideos = updatedVideos.map((video, index) => ({
      ...video,
      order: index + 1
    }));
    
    setSelectedVideos(reorderedVideos);
  };

  // Create a new LiveThrowback
  const createLiveThrowback = async (schedulingData) => {
    if (selectedVideos.length === 0) {
      setError('You must select at least one video for the compilation');
      return;
    }
    
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      // Prepare payload
      const compilationData = {
        title: schedulingData.title,
        description: schedulingData.description,
        scheduledStartTime: schedulingData.startDate,
        scheduledEndTime: schedulingData.endDate,
        category: schedulingData.category,
        hostName: schedulingData.hostName || 'ThrowBack Host',
        isPublic: schedulingData.isPublic !== false,
        chatEnabled: schedulingData.chatEnabled !== false,
        // Ensure tags is a string before split
        tags: typeof schedulingData.tags === 'string' && schedulingData.tags 
          ? schedulingData.tags.split(',').map(tag => tag.trim()) 
          : [],
        
        // Compilation data
        compilationType: 'VIDEO_COLLECTION',
        compilationVideos: selectedVideos.map(video => ({
          sourceId: video.videoId,
          sourceType: video.source || 'YOUTUBE',
          title: video.title,
          thumbnailUrl: video.thumbnail,
          duration: video.duration,
          channel: video.channel,
          order: video.order,
          originalUrl: video.url
        })),
        
        // Playback config
        playbackConfig: {
          loop: schedulingData.loop !== false,
          autoplay: true,
          shuffle: schedulingData.shuffle || false,
          transitionEffect: schedulingData.transitionEffect || 'none'
        }
      };
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(compilationData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to create LiveThrowback');
      }
      
      const newLiveStream = await response.json();
      
      // Reset and refresh
      setSelectedVideos([]);
      setCreateMode(false);
      setActiveTab('streams');
      fetchLiveStreams();
      
      return newLiveStream.data;
    } catch (err) {
      console.error('createLiveThrowback error:', err);
      setError(err.message || 'Failed to create LiveThrowback');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update a LiveThrowback
  const updateLiveStream = async (livestreamId, updatedData) => {
    try {
      setLoading(true);
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${livestreamId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedData)
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to update LiveThrowback');
      }
      
      const updatedLiveStream = await response.json();
      
      // Update list
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === livestreamId ? updatedLiveStream.data : stream
        )
      );
      
      return updatedLiveStream.data;
    } catch (err) {
      console.error('updateLiveStream error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a LiveThrowback (open modal)
  const handleDelete = (livestream) => {
    setSelectedLiveStream(livestream);
    setDeleteModalOpen(true);
  };

  // View details (open modal)
  const handleViewDetails = (livestream) => {
    setSelectedLiveStream(livestream);
    setDetailModalOpen(true);
  };

  // Edit (open modal)
  const handleEdit = (livestream) => {
    setSelectedLiveStream(livestream);
    setEditModalOpen(true);
  };

  // Confirm deletion
  const handleLiveStreamDeleted = (deletedId) => {
    setLiveStreams(prevStreams => 
      prevStreams.filter(stream => stream._id !== deletedId)
    );
    setDeleteModalOpen(false);
    setSelectedLiveStream(null);
    fetchStats();
  };

  // Start a livestream
  const startLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/start`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to start stream');
      }
      
      const data = await response.json();
      
      // Update list
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('startLiveStream error:', err);
      setError(err.message || 'Failed to start stream');
    }
  };

  // End a livestream
  const endLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/end`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to end stream');
      }
      
      const data = await response.json();
      
      // Update list
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('endLiveStream error:', err);
      setError(err.message || 'Failed to end stream');
    }
  };

  // Cancel a livestream
  const cancelLiveStream = async (id) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      const response = await fetch(`${API_BASE_URL}/api/livestreams/${id}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Server error' }));
        throw new Error(errorData.message || 'Failed to cancel stream');
      }
      
      const data = await response.json();
      
      // Update list
      setLiveStreams(prevStreams => 
        prevStreams.map(stream => 
          stream._id === id ? data.data : stream
        )
      );
      
      fetchStats();
    } catch (err) {
      console.error('cancelLiveStream error:', err);
      setError(err.message || 'Failed to cancel stream');
    }
  };

  // Load streams on mount and when filters change
  useEffect(() => {
    fetchLiveStreams();
  }, [fetchLiveStreams]);

  // Apply filters
  const applyFilters = (newFilters) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  // Close error alert
  const dismissError = () => {
    setError('');
  };

  // Tab content
  const renderTabContent = () => {
    if (createMode) {
      return (
        <div className={styles.creationContainer}>
          <div className={styles.creationHeader}>
            <h2>Create a new LiveThrowback</h2>
            <button 
              className={styles.backButton}
              onClick={() => setCreateMode(false)}
            >
              <i className="fas fa-arrow-left"></i> Back
            </button>
          </div>
          
          <div className={styles.creationLayout}>
            <div className={styles.searchSection}>
              <VideoUrlImport 
                onVideoSelect={addVideoToCompilation}
                apiBaseUrl={API_BASE_URL}
              />
            </div>
            
            <div className={styles.compilationSection}>
              <CompilationBuilder 
                selectedVideos={selectedVideos}
                onRemoveVideo={removeVideoFromCompilation}
                onReorderVideos={reorderCompilation}
              />
            </div>
            
            <div className={styles.schedulingSection}>
              <LiveStreamScheduler 
                onSchedule={createLiveThrowback}
                videosSelected={selectedVideos.length > 0}
                isLoading={loading}
              />
            </div>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'streams':
        return (
          <LiveStreamList 
            livestreams={liveStreams}
            viewMode={viewMode}
            loading={loading}
            filters={filters}
            onFilterChange={applyFilters}
            onDelete={handleDelete}
            onViewDetails={handleViewDetails}
            onEditStream={handleEdit}
            onStartStream={startLiveStream}
            onEndStream={endLiveStream}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        );
      default:
        return <div>Content not available</div>;
    }
  };

  return (
    <div className={adminStyles.pageContainer}>
      <div className={adminStyles.card}>
        <div className={styles.header}>
          <div>
            <h1>LiveThrowback</h1>
            <p>Create and manage video compilations that loop for your users</p>
          </div>
          
          <div className={styles.headerActions}>
            {!createMode && (
              <>
                <button 
                  className={styles.viewToggleButton}
                  onClick={() => setViewMode(prev => prev === 'grid' ? 'table' : 'grid')}
                  title={viewMode === 'grid' ? 'Switch to table view' : 'Switch to grid view'}
                >
                  <i className={`fas fa-${viewMode === 'grid' ? 'list' : 'th'}`}></i>
                </button>
                <button 
                  className={styles.addButton}
                  onClick={() => setCreateMode(true)}
                >
                  <i className="fas fa-plus"></i> Create LiveThrowback
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      
      {!createMode && (
        <div className={styles.statsRow}>
          <div className={styles.statCard}>
            <div className={styles.statIcon}>
              <i className="fas fa-film"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.total}</div>
              <div className={styles.statLabel}>Total LiveThrowbacks</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#e74c3c'}}>
              <i className="fas fa-broadcast-tower"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.live}</div>
              <div className={styles.statLabel}>Live Now</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#3498db'}}>
              <i className="fas fa-calendar-alt"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.scheduled}</div>
              <div className={styles.statLabel}>Scheduled</div>
            </div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{backgroundColor: '#9c27b0'}}>
              <i className="fas fa-eye"></i>
            </div>
            <div className={styles.statContent}>
              <div className={styles.statValue}>{stats.views}</div>
              <div className={styles.statLabel}>Total Views</div>
            </div>
          </div>
        </div>
      )}
      
      {error && (
        <div className={styles.errorMessage}>
          <i className="fas fa-exclamation-circle"></i>
          <span>{error}</span>
          <button 
            className={styles.dismissButton}
            onClick={dismissError}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}
      
      {renderTabContent()}
      
      {/* Modals */}
      {deleteModalOpen && selectedLiveStream && (
        <DeleteConfirmModal
          isOpen={deleteModalOpen}
          onClose={() => {
            setDeleteModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestreamId={selectedLiveStream._id}
          livestreamTitle={selectedLiveStream.title}
          onLiveStreamDeleted={handleLiveStreamDeleted}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {detailModalOpen && selectedLiveStream && (
        <LiveStreamDetailModal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestream={selectedLiveStream}
          onStartStream={startLiveStream}
          onEndStream={endLiveStream}
          onCancelStream={cancelLiveStream}
          onEditStream={handleEdit}
          apiBaseUrl={API_BASE_URL}
        />
      )}
      
      {editModalOpen && selectedLiveStream && (
        <LiveStreamEditModal
          isOpen={editModalOpen}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedLiveStream(null);
          }}
          livestream={selectedLiveStream}
          onSave={updateLiveStream}
          apiBaseUrl={API_BASE_URL}
        />
      )}
    </div>
  );
};

export default AdminLiveThrowback;
