// components/Dashboard/AdminDashboard/Playlists/FilterBar.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './FilterBar.module.css';

const FilterBar = ({ filters, onFilterChange, onResetFilters }) => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Charger les utilisateurs pour le filtre
  useEffect(() => {
    fetchUsers();
  }, []);

  // Mise à jour du terme de recherche avec debounce
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeoutId = setTimeout(() => {
      onFilterChange('search', searchTerm);
    }, 500);
    
    setSearchTimeout(timeoutId);
    
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchTerm]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get('/api/admin/users?limit=100');
      
      if (response.data.success || response.data.users) {
        // Adapter selon la structure de réponse
        setUsers(response.data.users || response.data.data || []);
      }
    } catch (err) {
      console.error('Erreur fetchUsers:', err);
    } finally {
      setUsersLoading(false);
    }
  };

  return (
    <div className={styles.filterBar}>
      <div className={styles.searchBox}>
        <i className="fas fa-search"></i>
        <input
          type="text"
          placeholder="Rechercher une playlist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button 
            className={styles.clearButton}
            onClick={() => setSearchTerm('')}
          >
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>
      
      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="visibility-filter">Visibilité:</label>
          <select
            id="visibility-filter"
            value={filters.visibilite}
            onChange={(e) => onFilterChange('visibilite', e.target.value)}
          >
            <option value="">Toutes</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVE">Privé</option>
            <option value="AMIS">Amis</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            <option value="">Tous</option>
            <option value="MANUELLE">Manuelle</option>
            <option value="AUTO_GENRE">Auto (Genre)</option>
            <option value="AUTO_DECENNIE">Auto (Décennie)</option>
            <option value="AUTO_ARTISTE">Auto (Artiste)</option>
          </select>
        </div>
        
        <div className={styles.filterGroup}>
          <label htmlFor="user-filter">Propriétaire:</label>
          <select
            id="user-filter"
            value={filters.userId}
            onChange={(e) => onFilterChange('userId', e.target.value)}
            disabled={usersLoading}
          >
            <option value="">Tous</option>
            {usersLoading ? (
              <option value="" disabled>Chargement...</option>
            ) : (
              users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.prenom} {user.nom}
                </option>
              ))
            )}
          </select>
        </div>
        
        <button 
          className={styles.resetButton}
          onClick={onResetFilters}
        >
          <i className="fas fa-undo"></i>
          Réinitialiser
        </button>
      </div>
    </div>
  );
};

export default FilterBar;