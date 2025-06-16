import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './styles.module.css';

const UserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // States
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [user, setUser] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loginAttempts, setLoginAttempts] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Configuration des requêtes API
  const API_BASE_URL = '/api/admin'; // Assurez-vous que cela correspond à votre backend
  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  });

  // Load user data
  useEffect(() => {
    const fetchUserDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Parallel requests for user, logs and login attempts
        const [userRes, logsRes, attemptsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/users/${id}`, {
            headers: getAuthHeaders()
          }),
          fetch(`${API_BASE_URL}/logs?userId=${id}&limit=20`, {
            headers: getAuthHeaders()
          }).catch(() => ({ json: async () => ({ logs: [] }) })),
          fetch(`${API_BASE_URL}/login-attempts/${id}`, {
            headers: getAuthHeaders()
          }).catch(() => ({ json: async () => ({ attempts: null }) }))
        ]);

        if (!userRes.ok) {
          throw new Error(`Error ${userRes.status}: ${userRes.statusText}`);
        }

        // Process data
        const userData = await userRes.json();
        const logsData = await logsRes.json();
        const attemptsData = await attemptsRes.json();

        setUser(userData.user || userData); // Handle both formats
        setLogs(logsData.logs || []);
        setLoginAttempts(attemptsData.attempts || null);
      } catch (err) {
        console.error("Error loading user data:", err);
        setError("Unable to load user data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [id]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Handle status change - fonction générique
  const handleStatusChange = async (status) => {
    setLoading(true);
    try {
      // Utilisez les routes spécifiques pour chaque type de statut
      let endpoint;
      switch(status) {
        case 'ACTIF':
          endpoint = `${API_BASE_URL}/users/${id}/activate`;
          break;
        case 'INACTIF':
          endpoint = `${API_BASE_URL}/users/${id}/deactivate`;
          break;
        case 'VERROUILLE':
          endpoint = `${API_BASE_URL}/users/${id}/lock`;
          break;
        case 'SUPPRIME':
          endpoint = `${API_BASE_URL}/users/${id}/mark-deleted`;
          break;
        default:
          // Fallback à la route générique de statut
          endpoint = `${API_BASE_URL}/users/${id}/status`;
      }
      
      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify({ newStatus: status })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "An error occurred while changing status");
      }
      
      // Update local state
      setUser({ ...user, statut_compte: status });
      setSuccessMessage(`Status has been changed to "${getStatusText(status)}"`);
      setShowStatusModal(false);
    } catch (err) {
      console.error("Error changing status:", err);
      setError(err.message || "An error occurred while changing status");
    } finally {
      setLoading(false);
    }
  };

  // Fonctions spécifiques pour chaque bouton
  const activateAccount = () => handleStatusChange('ACTIF');
  const deactivateAccount = () => handleStatusChange('INACTIF');
  const lockAccount = () => handleStatusChange('VERROUILLE');
  const markAsDeleted = () => handleStatusChange('SUPPRIME');

  // Fonction pour ouvrir le modal de confirmation de changement de statut
  const openStatusModal = (status) => {
    setNewStatus(status);
    setShowStatusModal(true);
  };

  // Gestion du changement de statut depuis le modal
  const confirmStatusChange = () => {
    if (!newStatus) return;
    handleStatusChange(newStatus);
  };

  // Reset login attempts
  const handleResetLoginAttempts = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}/reset-login-attempts`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "An error occurred during reset");
      }
      
      // Update local state
      setLoginAttempts({
        ...loginAttempts,
        nb_tentatives: 0,
        compte_verrouille: 'N'
      });
      
      // If user was locked due to attempts, update status
      if (user.statut_compte === 'VERROUILLE') {
        setUser({ ...user, statut_compte: 'ACTIF' });
      }
      
      setSuccessMessage("Login attempts have been reset");
    } catch (err) {
      console.error("Error resetting attempts:", err);
      setError(err.message || "An error occurred during reset");
    }
  };

  // Delete user
  const handleDelete = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || "An error occurred while deleting");
      }
      
      setSuccessMessage("User has been successfully deleted");
      setTimeout(() => {
        navigate('/admin/users');
      }, 1500);
    } catch (err) {
      console.error("Error deleting user:", err);
      setError(err.message || "An error occurred while deleting");
      setShowDeleteModal(false);
    }
  };

  // CSS class utilities
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'superadmin':
        return styles.role_superadmin;
      case 'admin':
        return styles.role_admin;
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

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate days since registration
  const getDaysSinceRegistration = (dateString) => {
    if (!dateString) return '';
    const days = Math.floor((new Date() - new Date(dateString)) / (1000 * 60 * 60 * 24));
    return `(${days} days)`;
  };

  // Loading display
  if (loading) {
    return (
      <div className={styles.loading_container}>
        <div className={styles.loader}></div>
        <p>Loading user data...</p>
      </div>
    );
  }

  // Error display
  if (error && !user) {
    return (
      <div className={styles.error_container}>
        <i className="fas fa-exclamation-triangle"></i>
        <h2>An error occurred</h2>
        <p>{error}</p>
        <button 
          className={`${styles.btn} ${styles.btn_primary}`}
          onClick={() => navigate('/admin/users')}
        >
          Back to users list
        </button>
      </div>
    );
  }

  // If user doesn't exist
  if (!user) {
    return (
      <div className={styles.error_container}>
        <i className="fas fa-user-slash"></i>
        <h2>User not found</h2>
        <p>The requested user doesn't exist or has been deleted.</p>
        <button 
          className={`${styles.btn} ${styles.btn_primary}`}
          onClick={() => navigate('/admin/users')}
        >
          Back to users list
        </button>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      {/* User header */}
      <div className={styles.user_header}>
        <div className={styles.user_avatar_large}>
          {user.prenom?.charAt(0)}{user.nom?.charAt(0)}
        </div>
        <div className={styles.user_header_info}>
          <h2>{user.prenom} {user.nom}</h2>
          <span className={`${styles.role_badge} ${getRoleBadgeClass(user.role)}`}>
            {user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User'}
          </span>
        </div>
      </div>

      {/* Messages */}
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

      {/* Details grid */}
      <div className={styles.user_details_grid}>
        <div className={styles.user_details_main}>
          <div className={styles.dashboard_card}>
            <div className={styles.tab_container}>
              <div className={styles.tabs}>
                <div 
                  className={`${styles.tab} ${activeTab === 'profile' ? styles.active : ''}`}
                  onClick={() => setActiveTab('profile')}
                >
                  Profile
                </div>
                <div 
                  className={`${styles.tab} ${activeTab === 'activity' ? styles.active : ''}`}
                  onClick={() => setActiveTab('activity')}
                >
                  Activity
                </div>
                <div 
                  className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
                  onClick={() => setActiveTab('security')}
                >
                  Security
                </div>
              </div>

              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <div className={styles.tab_content}>
                  <div className={styles.detail_item}>
                    <div className={styles.detail_label}>Email</div>
                    <div className={styles.detail_value}>{user.email}</div>
                  </div>

                  <div className={styles.detail_item}>
                    <div className={styles.detail_label}>Registration date</div>
                    <div className={styles.detail_value}>
                      {formatDate(user.date_inscription)} 
                      {user.date_inscription && (
                        <span className={styles.detail_subtext}>
                          {getDaysSinceRegistration(user.date_inscription)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={styles.detail_item}>
                    <div className={styles.detail_label}>Last login</div>
                    <div className={styles.detail_value}>
                      {formatDate(user.derniere_connexion)}
                    </div>
                  </div>

                  <div className={styles.detail_item}>
                    <div className={styles.detail_label}>Email verified</div>
                    <div className={styles.detail_value}>
                      {user.statut_verification ? (
                        <span className={styles.success_text}>
                          <i className="fas fa-check-circle"></i> Yes
                        </span>
                      ) : (
                        <span className={styles.danger_text}>
                          <i className="fas fa-times-circle"></i> No
                        </span>
                      )}
                    </div>
                  </div>

                  {user.telephone && (
                    <div className={styles.detail_item}>
                      <div className={styles.detail_label}>Phone</div>
                      <div className={styles.detail_value}>{user.telephone}</div>
                    </div>
                  )}

                  {user.date_naissance && (
                    <div className={styles.detail_item}>
                      <div className={styles.detail_label}>Date of birth</div>
                      <div className={styles.detail_value}>
                        {new Date(user.date_naissance).toLocaleDateString('en-US')}
                      </div>
                    </div>
                  )}

                  {(user.ville || user.code_postal) && (
                    <div className={styles.detail_item}>
                      <div className={styles.detail_label}>City / Postal code</div>
                      <div className={styles.detail_value}>
                        {user.ville} {user.code_postal && `(${user.code_postal})`}
                      </div>
                    </div>
                  )}

                  {user.pays && (
                    <div className={styles.detail_item}>
                      <div className={styles.detail_label}>Country</div>
                      <div className={styles.detail_value}>{user.pays}</div>
                    </div>
                  )}

                  {user.bio && (
                    <div className={styles.detail_item}>
                      <div className={styles.detail_label}>Biography</div>
                      <div className={`${styles.detail_value} ${styles.user_bio}`}>{user.bio}</div>
                    </div>
                  )}

                  <div className={styles.form_actions}>
                    <Link 
                      to={`/admin/users/${user._id}/edit`} 
                      className={`${styles.btn} ${styles.btn_primary}`}
                    >
                      <i className="fas fa-edit"></i> Edit profile
                    </Link>
                  </div>
                </div>
              )}

              {/* Activity Tab */}
              {activeTab === 'activity' && (
                <div className={styles.tab_content}>
                  <h3 className={styles.section_title}>Action history</h3>
                  
                  <div className={styles.activity_timeline}>
                    {logs.length === 0 ? (
                      <div className={styles.no_data}>
                        <i className="fas fa-history"></i>
                        <p>No activity recorded for this user.</p>
                      </div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className={styles.timeline_item}>
                          <div className={styles.timeline_icon}>
                            {log.type_action === 'CONNEXION' && <i className="fas fa-sign-in-alt"></i>}
                            {log.type_action === 'DECONNEXION' && <i className="fas fa-sign-out-alt"></i>}
                            {log.type_action === 'MODIFICATION_STATUT' && <i className="fas fa-exchange-alt"></i>}
                            {log.type_action === 'RESET_TENTATIVES' && <i className="fas fa-redo"></i>}
                            {log.type_action === 'MODIFICATION_UTILISATEUR' && <i className="fas fa-user-edit"></i>}
                            {log.type_action === 'MODIFICATION_PROFIL' && <i className="fas fa-user-edit"></i>}
                            {log.type_action === 'COMPTE_VERROUILLE' && <i className="fas fa-lock"></i>}
                            {log.type_action === 'TENTATIVE_CONNEXION_ECHOUEE' && <i className="fas fa-user-times"></i>}
                            {log.type_action === 'INSCRIPTION' && <i className="fas fa-user-plus"></i>}
                            {log.type_action === 'EMAIL_VERIFIE' && <i className="fas fa-check-circle"></i>}
                            {log.type_action === 'MOT_DE_PASSE_REINITIALISE' && <i className="fas fa-key"></i>}
                            {log.type_action === 'MOT_DE_PASSE_MODIFIE' && <i className="fas fa-key"></i>}
                            {!log.type_action && <i className="fas fa-history"></i>}
                          </div>
                          <div className={styles.timeline_content}>
                            <div className={styles.timeline_date}>
                              {formatDate(log.date_action || log.creation_date)}
                            </div>
                            <div className={styles.timeline_text}>
                              <strong>{log.type_action}</strong>
                            </div>
                            <div className={styles.timeline_desc}>
                              {log.description_action}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <div className={styles.tab_content}>
                  <h3 className={styles.section_title}>Login attempts</h3>
                  
                  {loginAttempts ? (
                    <div className={styles.security_details}>
                      <div className={styles.detail_item}>
                        <div className={styles.detail_label}>Recent attempts</div>
                        <div className={styles.detail_value}>
                          {loginAttempts.nb_tentatives || 0} attempt(s)
                        </div>
                      </div>

                      <div className={styles.detail_item}>
                        <div className={styles.detail_label}>Last attempt</div>
                        <div className={styles.detail_value}>
                          {formatDate(loginAttempts.derniere_tentative)}
                        </div>
                      </div>

                      <div className={styles.detail_item}>
                        <div className={styles.detail_label}>Account locked due to attempts</div>
                        <div className={styles.detail_value}>
                          {loginAttempts.compte_verrouille === 'Y' ? (
                            <span className={styles.danger_text}>
                              <i className="fas fa-lock"></i> Yes
                            </span>
                          ) : (
                            <span className={styles.success_text}>
                              <i className="fas fa-unlock"></i> No
                            </span>
                          )}
                        </div>
                      </div>

                      {(loginAttempts.compte_verrouille === 'Y' || loginAttempts.nb_tentatives > 0) && (
                        <button 
                          className={`${styles.btn} ${styles.btn_warning}`}
                          onClick={handleResetLoginAttempts}
                        >
                          <i className="fas fa-redo"></i>
                          Reset attempts
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={styles.no_data}>
                      <i className="fas fa-shield-alt"></i>
                      <p>No login attempts recorded.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className={styles.user_details_sidebar}>
          {/* Account status */}
          <div className={styles.user_status_box}>
            <div className={styles.status_header}>
              <div className={styles.status_title}>Account status</div>
            </div>

            <div className={styles.status_current}>
              <div className={styles.status_label}>Current status</div>
              <div className={styles.status_value}>
                <span className={`${styles.status_badge} ${getStatusBadgeClass(user.statut_compte)}`}>
                  {getStatusText(user.statut_compte)}
                </span>
              </div>
            </div>

            <div className={styles.status_actions}>
              {user.statut_compte !== 'ACTIF' && (
                <button 
                  className={`${styles.btn} ${styles.btn_primary}`}
                  onClick={activateAccount}
                >
                  <i className="fas fa-check-circle"></i>
                  Activate account
                </button>
              )}

              {user.statut_compte !== 'INACTIF' && (
                <button 
                  className={`${styles.btn} ${styles.btn_secondary}`}
                  onClick={deactivateAccount}
                >
                  <i className="fas fa-pause-circle"></i>
                  Deactivate account
                </button>
              )}

              {user.statut_compte !== 'VERROUILLE' && (
                <button 
                  className={`${styles.btn} ${styles.btn_warning}`}
                  onClick={lockAccount}
                >
                  <i className="fas fa-lock"></i>
                  Lock account
                </button>
              )}

              {user.statut_compte !== 'SUPPRIME' && (
                <button 
                  className={`${styles.btn} ${styles.btn_danger}`}
                  onClick={markAsDeleted}
                >
                  <i className="fas fa-ban"></i>
                  Mark as deleted
                </button>
              )}
            </div>
          </div>

          {/* Account information */}
          <div className={styles.user_status_box}>
            <div className={styles.status_header}>
              <div className={styles.status_title}>Account information</div>
            </div>

            <div className={styles.detail_item}>
              <div className={styles.detail_label}>User ID</div>
              <div className={styles.detail_value} style={{ fontSize: '12px', wordBreak: 'break-all' }}>
                {user._id}
              </div>
            </div>

            <div className={styles.detail_item}>
              <div className={styles.detail_label}>Role</div>
              <div className={styles.detail_value}>
                {user.role === 'superadmin' ? 'Super Administrator' :
                 user.role === 'admin' ? 'Administrator' : 'Standard user'}
              </div>
            </div>

            <div className={styles.status_actions}>
              <Link 
                to={`/admin/users/${user._id}/edit`} 
                className={`${styles.btn} ${styles.btn_primary}`}
              >
                <i className="fas fa-edit"></i>
                Edit user
              </Link>

              <button 
                className={`${styles.btn} ${styles.btn_danger}`}
                onClick={() => setShowDeleteModal(true)}
              >
                <i className="fas fa-trash"></i>
                Delete user
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className={styles.modal}>
          <div className={styles.modal_content}>
            <div className={styles.modal_header}>
              <h3>Confirm deletion</h3>
              <span className={styles.close} onClick={() => setShowDeleteModal(false)}>&times;</span>
            </div>
            <div className={styles.modal_body}>
              <p>Are you sure you want to delete user <strong>{user.prenom} {user.nom}</strong>?</p>
              <p className={styles.warning_text}>
                <i className="fas fa-exclamation-triangle"></i> This action is irreversible.
              </p>
            </div>
            <div className={styles.modal_footer}>
              <button 
                className={`${styles.btn} ${styles.btn_secondary}`}
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.btn} ${styles.btn_danger}`}
                onClick={handleDelete}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status change modal */}
      {showStatusModal && (
        <div className={styles.modal}>
          <div className={styles.modal_content}>
            <div className={styles.modal_header}>
              <h3>Change status</h3>
              <span className={styles.close} onClick={() => setShowStatusModal(false)}>&times;</span>
            </div>
            <div className={styles.modal_body}>
              <p>Are you sure you want to change <strong>{user.prenom} {user.nom}</strong>'s status to <strong>{getStatusText(newStatus)}</strong>?</p>
              
              {newStatus === 'SUPPRIME' && (
                <p className={styles.warning_text}>
                  <i className="fas fa-exclamation-triangle"></i> This will hide the user in the system without permanently deleting them.
                </p>
              )}
              
              {newStatus === 'VERROUILLE' && (
                <p className={styles.warning_text}>
                  <i className="fas fa-exclamation-triangle"></i> The user will not be able to log in until their account is unlocked.
                </p>
              )}
            </div>
            <div className={styles.modal_footer}>
              <button 
                className={`${styles.btn} ${styles.btn_secondary}`}
                onClick={() => setShowStatusModal(false)}
              >
                Cancel
              </button>
              <button 
                className={`${styles.btn} ${styles.btn_primary}`}
                onClick={confirmStatusChange}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetails;