import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './styles.module.css';
import '@fortawesome/fontawesome-free/css/all.min.css';

// Configuration de l'URL de l'API
const API_BASE_URL = process.env.REACT_APP_API_URL || '';

const Users = () => {
  const location = useLocation();
  
  // States
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [successMessage, setSuccessMessage] = useState(location.state?.successMessage || '');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    search: '',
    status: '',
    role: ''
  });

  // Fonction pour obtenir les en-têtes d'authentification
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (!token) {
      console.error("No authentication token found");
      setError("Authentication required. Please login again.");
      return null;
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  };

  // Load users - Version améliorée
  const fetchUsers = async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    
    const headers = getAuthHeaders();
    if (!headers) {
      setLoading(false);
      return;
    }
    
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 10,
        ...filters
      });

      const url = `${API_BASE_URL}/api/admin/users?${queryParams}`;
      console.log("Fetching users from:", url);
      
      const response = await fetch(url, { headers });
      console.log("Users API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Users data received:", data.users ? `${data.users.length} users` : "No users array");
      
      // Support both response formats { users: [...] } and { success: true, users: [...] }
      const usersArray = data.users || (data.success && data.data?.users) || [];
      
      setUsers(usersArray);
      setTotalPages(data.totalPages || 1);
      setTotalUsers(data.total || 0);
      setCurrentPage(data.currentPage || page);
    } catch (err) {
      console.error('Loading error:', err);
      setError(err.message || 'Unable to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Initial effect to load users and handle success message
  useEffect(() => {
    fetchUsers(1, appliedFilters);
    
    // Clear location state after reading
    if (location.state?.successMessage) {
      window.history.replaceState({}, document.title);
    }
    
    // Clear messages after 5 seconds
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [appliedFilters, successMessage, location.state]);

  // Filter submission handler
  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setAppliedFilters({
      search: searchQuery,
      status: statusFilter,
      role: roleFilter
    });
    setCurrentPage(1); // Return to first page when filtering
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setRoleFilter('');
    setAppliedFilters({
      search: '',
      status: '',
      role: ''
    });
    setCurrentPage(1);
  };

  // Pagination handlers
  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    fetchUsers(page, appliedFilters);
  };

  // Delete preparation
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setShowDeleteModal(true);
  };

  // Delete confirmation and execution - Version améliorée
  const handleDeleteConfirm = async () => {
    if (!selectedUser) return;
    
    const headers = getAuthHeaders();
    if (!headers) return;
    
    try {
      // Check if user is not trying to delete themselves
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const currentUser = JSON.parse(userStr);
        if (currentUser && (currentUser.id === selectedUser._id || currentUser._id === selectedUser._id)) {
          setError("You cannot delete your own account");
          setShowDeleteModal(false);
          setSelectedUser(null);
          return;
        }
      }

      const url = `${API_BASE_URL}/api/admin/users/${selectedUser._id}`;
      console.log("Deleting user:", url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers
      });
      
      console.log("Delete response status:", response.status);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Error ${response.status}: ${response.statusText}`);
      }
      
      setUsers(users.filter(u => u._id !== selectedUser._id));
      setSuccessMessage(`User ${selectedUser.prenom} ${selectedUser.nom} has been successfully deleted`);
      setShowDeleteModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('Deletion error:', err);
      setError(err.message || "Network error during user deletion.");
    }
  };

  // Style utilities
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin':
        return styles.role_admin;
      case 'superadmin':
        return styles.role_superadmin;
      default:
        return styles.role_user;
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIF':
        return styles.status_active;
      case 'VERROUILLE':
        return styles.status_locked;
      case 'INACTIF':
        return styles.status_inactive;
      case 'SUSPENDU':
        return styles.status_pending;
      case 'SUPPRIME':
        return styles.status_inactive;
      default:
        return styles.status_inactive;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIF':
        return 'Active';
      case 'VERROUILLE':
        return 'Locked';
      case 'INACTIF':
        return 'Inactive';
      case 'SUSPENDU':
        return 'Suspended';
      case 'SUPPRIME':
        return 'Deleted';
      default:
        return 'Unknown';
    }
  };

  // Component rendering
  return (
    <div className={styles.dashboard}>
      <div className={styles.content_header}>
        <div>
          <h1 className={styles.page_title}>Manage Users</h1>
          <p>Welcome to the user management panel</p>
        </div>
      </div>

      {/* Success/error messages */}
      {successMessage && (
        <div className={styles.success_message}>
          <i className="fas fa-check-circle"></i>
          {successMessage}
          <button 
            className={styles.close_message} 
            onClick={() => setSuccessMessage('')}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {error && (
        <div className={styles.error_message}>
          <i className="fas fa-exclamation-circle"></i>
          {error}
          <button 
            className={styles.close_message} 
            onClick={() => setError(null)}
          >
            <i className="fas fa-times"></i>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className={styles.filters_container}>
        <form id="filter-form" onSubmit={handleFilterSubmit}>
          <div className={styles.filters_row}>
            <div className={styles.filter_group}>
              <label htmlFor="search" className={styles.filter_label}>Search</label>
              <input
                type="text"
                id="search"
                className={styles.filter_input}
                placeholder="Name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className={styles.filter_group}>
              <label htmlFor="status" className={styles.filter_label}>Status</label>
              <select
                id="status"
                className={styles.filter_select}
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All statuses</option>
                <option value="ACTIF">Active</option>
                <option value="INACTIF">Inactive</option>
                <option value="VERROUILLE">Locked</option>
                <option value="SUSPENDU">Suspended</option>
                <option value="SUPPRIME">Deleted</option>
              </select>
            </div>

            <div className={styles.filter_group}>
              <label htmlFor="role" className={styles.filter_label}>Role</label>
              <select
                id="role"
                className={styles.filter_select}
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="">All roles</option>
                <option value="user">User</option>
                <option value="admin">Administrator</option>
                <option value="superadmin">Super Administrator</option>
              </select>
            </div>
          </div>

          <div className={styles.filter_actions}>
            <div className={styles.filter_buttons}>
              <button type="submit" className={`${styles.btn} ${styles.btn_primary}`}>
                <i className="fas fa-filter"></i> Filter
              </button>
              <button
                type="button"
                className={`${styles.btn} ${styles.btn_secondary}`}
                onClick={resetFilters}
              >
                <i className="fas fa-sync-alt"></i> Reset
              </button>
            </div>

            <Link to="/admin/users/create" className={`${styles.btn} ${styles.btn_success}`}>
              <i className="fas fa-plus"></i> New user
            </Link>
          </div>
        </form>
      </div>

      {/* Users table */}
      <div className={styles.user_table}>
        {loading ? (
          <div className={styles.loading_container}>
            <div className={styles.loader}></div>
            <p>Loading users...</p>
          </div>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Registration date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length > 0 ? (
                  users.map(user => (
                    <tr key={user._id}>
                      <td>{user.prenom} {user.nom}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`${styles.role_badge} ${getRoleBadgeClass(user.role)}`}>
                          {user.role === 'admin' ? 'Admin' : user.role === 'superadmin' ? 'Super Admin' : 'User'}
                        </span>
                      </td>
                      <td>
                        <span className={`${styles.status_badge} ${getStatusBadgeClass(user.statut_compte)}`}>
                          {getStatusText(user.statut_compte)}
                        </span>
                      </td>
                      <td>{user.date_inscription ? new Date(user.date_inscription).toLocaleDateString('en-US') : 'N/A'}</td>
                      <td>
                        <div className={styles.action_buttons}>
                          <Link to={`/admin/users/${user._id}`} className={`${styles.btn_action} ${styles.btn_view}`} title="View details">
                            <i className="fas fa-eye"></i>
                          </Link>
                          <Link to={`/admin/users/${user._id}/edit`} className={`${styles.btn_action} ${styles.btn_edit}`} title="Edit">
                            <i className="fas fa-edit"></i>
                          </Link>
                          <button
                            type="button"
                            className={`${styles.btn_action} ${styles.btn_delete}`}
                            onClick={() => handleDeleteClick(user)}
                            title="Delete"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className={styles.no_results}>
                      <i className="fas fa-search"></i>
                      <p>No users found</p>
                      {Object.values(appliedFilters).some(filter => filter !== '') && (
                        <button onClick={resetFilters} className={`${styles.btn} ${styles.btn_secondary}`}>
                          Reset filters
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className={styles.pagination}>
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className={styles.pagination_button}
                >
                  <i className="fas fa-angle-double-left"></i>
                </button>
                
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={styles.pagination_button}
                >
                  <i className="fas fa-angle-left"></i>
                </button>
                
                <span className={styles.pagination_info}>
                  Page {currentPage} of {totalPages} ({totalUsers} users)
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={styles.pagination_button}
                >
                  <i className="fas fa-angle-right"></i>
                </button>
                
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className={styles.pagination_button}
                >
                  <i className="fas fa-angle-double-right"></i>
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete modal */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modal_content}>
            <div className={styles.modal_header}>
              <h3>Confirm deletion</h3>
              <span className={styles.close} onClick={() => setShowDeleteModal(false)}>&times;</span>
            </div>
            <div className={styles.modal_body}>
              <p>Are you sure you want to delete the user <strong>{selectedUser?.prenom} {selectedUser?.nom}</strong>?</p>
              <p>This action is irreversible.</p>
            </div>
            <div className={styles.modal_footer}>
              <button className={`${styles.btn} ${styles.btn_secondary}`} onClick={() => setShowDeleteModal(false)}>
                Cancel
              </button>
              <button className={`${styles.btn} ${styles.btn_danger}`} onClick={handleDeleteConfirm}>
                Delete permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;