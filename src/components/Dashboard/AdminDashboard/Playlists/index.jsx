// components/Dashboard/AdminDashboard/Playlists/index.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import PlaylistsTable from './PlaylistsTable';
import PlaylistStats from './PlaylistStats';
import FilterBar from './FilterBar';
import styles from './Playlists.module.css';

const Playlists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);
  const [filters, setFilters] = useState({
    search: '',
    userId: '',
    visibilite: '',
    type: ''
  });
  const [viewMode, setViewMode] = useState('list'); 

  const navigate = useNavigate();

  useEffect(() => {
    fetchPlaylists();
  }, [currentPage, limit, filters]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', limit);
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
      const response = await axios.get(`/api/admin/playlists?${params.toString()}`);
      if (response.data.success) {
        setPlaylists(response.data.data.playlists);
        setTotalPages(response.data.data.pagination.total);
        setTotalItems(response.data.data.pagination.totalItems);
      } else {
        setError('Error loading playlists');
        toast.error('Error loading playlists');
      }
    } catch (err) {
      console.error('Error fetchPlaylists:', err);
      setError('Error loading playlists');
      toast.error('Error loading playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/api/admin/playlists/stats');
      if (response.data.success) setStats(response.data.data);
      else toast.warning('Unable to load playlist statistics');
    } catch (err) {
      console.error('Error fetchStats:', err);
      toast.warning('Unable to load playlist statistics');
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePageChange = (newPage) => setCurrentPage(newPage);

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1);
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({ ...prev, [name]: value }));
    setCurrentPage(1);
  };

  const handleResetFilters = () => {
    setFilters({ search: '', userId: '', visibilite: '', type: '' });
    setCurrentPage(1);
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm("Are you sure you want to delete this playlist? This action is irreversible.")) {
      try {
        const response = await axios.delete(`/api/admin/playlists/${playlistId}`);
        if (response.data.success) {
          toast.success('Playlist successfully deleted');
          fetchPlaylists();
          fetchStats();
        } else {
          toast.error('Error deleting playlist');
        }
      } catch (err) {
        console.error('Error handleDeletePlaylist:', err);
        toast.error('Error deleting playlist');
      }
    }
  };

  const handleViewPlaylist = (playlistId) => navigate(`/admin/playlists/${playlistId}`);
  const handleEditPlaylist = (playlistId) => navigate(`/admin/playlists/${playlistId}/edit`);

  const toggleViewMode = () => setViewMode(prev => prev === 'list' ? 'stats' : 'list');

  return (
    <div className={styles.playlistsContainer}>
      <div className={styles.header}>
        <h1>Playlist Management</h1>
        <br/>
        <p>Create and manage your Playlists</p>
        <div className={styles.actions}>
          <button className={`${styles.viewModeButton} ${viewMode === 'stats' ? styles.active : ''}`} onClick={toggleViewMode}>
            <i className={`fas ${viewMode === 'list' ? 'fa-chart-bar' : 'fa-list'}`}></i>
            {viewMode === 'list' ? 'View Statistics' : 'View List'}
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <>
          <FilterBar filters={filters} onFilterChange={handleFilterChange} onResetFilters={handleResetFilters} />
          <PlaylistsTable playlists={playlists} loading={loading} error={error} currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} limit={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} onDelete={handleDeletePlaylist} onView={handleViewPlaylist} onEdit={handleEditPlaylist} />
        </>
      ) : (
        <PlaylistStats stats={stats} loading={statsLoading} onRefresh={fetchStats} />
      )}
    </div>
  );
};

export default Playlists;
