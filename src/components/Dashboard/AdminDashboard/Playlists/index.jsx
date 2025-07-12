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

  // Charger les playlists
  useEffect(() => {
    fetchPlaylists();
  }, [currentPage, limit, filters]);

  // Charger les statistiques
  useEffect(() => {
    fetchStats();
  }, []);

  const fetchPlaylists = async () => {
    setLoading(true);
    try {
      // Construire les paramètres de requête
      const params = new URLSearchParams();
      params.append('page', currentPage);
      params.append('limit', limit);
      
      // Ajouter les filtres non vides
      Object.entries(filters).forEach(([key, value]) => {
        if (value) {
          params.append(key, value);
        }
      });
      
      const response = await axios.get(`/api/admin/playlists?${params.toString()}`);
      
      if (response.data.success) {
        setPlaylists(response.data.data.playlists);
        setTotalPages(response.data.data.pagination.total);
        setTotalItems(response.data.data.pagination.totalItems);
      } else {
        setError('Erreur lors du chargement des playlists');
        toast.error('Erreur lors du chargement des playlists');
      }
    } catch (err) {
      console.error('Erreur fetchPlaylists:', err);
      setError('Erreur lors du chargement des playlists');
      toast.error('Erreur lors du chargement des playlists');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const response = await axios.get('/api/admin/playlists/stats');
      
      if (response.data.success) {
        setStats(response.data.data);
      } else {
        toast.warning('Impossible de charger les statistiques des playlists');
      }
    } catch (err) {
      console.error('Erreur fetchStats:', err);
      toast.warning('Impossible de charger les statistiques des playlists');
    } finally {
      setStatsLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit);
    setCurrentPage(1); // Revenir à la première page
  };

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
    setCurrentPage(1); // Revenir à la première page
  };

  const handleResetFilters = () => {
    setFilters({
      search: '',
      userId: '',
      visibilite: '',
      type: ''
    });
    setCurrentPage(1);
  };

  const handleDeletePlaylist = async (playlistId) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette playlist ? Cette action est irréversible.")) {
      try {
        const response = await axios.delete(`/api/admin/playlists/${playlistId}`);
        
        if (response.data.success) {
          toast.success('Playlist supprimée avec succès');
          fetchPlaylists(); // Rafraîchir la liste
          fetchStats(); // Mettre à jour les statistiques
        } else {
          toast.error('Erreur lors de la suppression de la playlist');
        }
      } catch (err) {
        console.error('Erreur handleDeletePlaylist:', err);
        toast.error('Erreur lors de la suppression de la playlist');
      }
    }
  };

  const handleViewPlaylist = (playlistId) => {
    navigate(`/admin/playlists/${playlistId}`);
  };

  const handleEditPlaylist = (playlistId) => {
    navigate(`/admin/playlists/${playlistId}/edit`);
  };

  const toggleViewMode = () => {
    setViewMode(prev => prev === 'list' ? 'stats' : 'list');
  };

  return (
    <div className={styles.playlistsContainer}>
      <div className={styles.header}>
        <h1>Gestion des Playlists</h1>
        <div className={styles.actions}>
          <button 
            className={`${styles.viewModeButton} ${viewMode === 'stats' ? styles.active : ''}`}
            onClick={toggleViewMode}
          >
            <i className={`fas ${viewMode === 'list' ? 'fa-chart-bar' : 'fa-list'}`}></i>
            {viewMode === 'list' ? 'Voir les statistiques' : 'Voir la liste'}
          </button>
        </div>
      </div>

      {/* Afficher la vue liste ou statistiques */}
      {viewMode === 'list' ? (
        <>
          <FilterBar 
            filters={filters} 
            onFilterChange={handleFilterChange} 
            onResetFilters={handleResetFilters} 
          />
          
          <PlaylistsTable 
            playlists={playlists}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            limit={limit}
            onPageChange={handlePageChange}
            onLimitChange={handleLimitChange}
            onDelete={handleDeletePlaylist}
            onView={handleViewPlaylist}
            onEdit={handleEditPlaylist}
          />
        </>
      ) : (
        <PlaylistStats 
          stats={stats} 
          loading={statsLoading} 
          onRefresh={fetchStats} 
        />
      )}
    </div>
  );
};

export default Playlists;