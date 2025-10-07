// components/Dashboard/AdminDashboard/Playlists/FilterBar.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './FilterBar.module.css';

const FilterBar = ({ filters, onFilterChange, onResetFilters }) => {
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const [searchTimeout, setSearchTimeout] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);
    const timeoutId = setTimeout(() => {
      onFilterChange('search', searchTerm);
    }, 500);
    setSearchTimeout(timeoutId);
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchTerm]);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const response = await axios.get('/api/admin/users?limit=100');
      if (response.data.success || response.data.users) {
        setUsers(response.data.users || response.data.data || []);
      }
    } catch (err) {
      console.error('Error fetchUsers:', err);
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
          placeholder="Search a playlist..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className={styles.clearButton} onClick={() => setSearchTerm('')}>
            <i className="fas fa-times"></i>
          </button>
        )}
      </div>

      <div className={styles.filters}>
        <div className={styles.filterGroup}>
          <label htmlFor="visibility-filter">Visibility:</label>
          <select
            id="visibility-filter"
            value={filters.visibilite}
            onChange={(e) => onFilterChange('visibilite', e.target.value)}
          >
            <option value="">All</option>
            <option value="PUBLIC">Public</option>
            <option value="PRIVE">Private</option>
            <option value="AMIS">Friends</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="type-filter">Type:</label>
          <select
            id="type-filter"
            value={filters.type}
            onChange={(e) => onFilterChange('type', e.target.value)}
          >
            <option value="">All</option>
            <option value="MANUELLE">Manual</option>
            <option value="AUTO_GENRE">Auto (Genre)</option>
            <option value="AUTO_DECENNIE">Auto (Decade)</option>
            <option value="AUTO_ARTISTE">Auto (Artist)</option>
          </select>
        </div>

        <div className={styles.filterGroup}>
          <label htmlFor="user-filter">Owner:</label>
          <select
            id="user-filter"
            value={filters.userId}
            onChange={(e) => onFilterChange('userId', e.target.value)}
            disabled={usersLoading}
          >
            <option value="">All</option>
            {usersLoading ? (
              <option value="" disabled>Loading...</option>
            ) : (
              users.map(user => (
                <option key={user._id} value={user._id}>
                  {user.prenom} {user.nom}
                </option>
              ))
            )}
          </select>
        </div>

        <button className={styles.resetButton} onClick={onResetFilters}>
          <i className="fas fa-undo"></i> Reset
        </button>
      </div>
    </div>
  );
};

export default FilterBar;
