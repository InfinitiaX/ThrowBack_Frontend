// Dashboard.jsx (version traduite en anglais)
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

// Colors for charts
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#8884d8', '#ff8042'
];

// API URL configuration
const API_URL = process.env.REACT_APP_API_URL || '';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error("Authentication token not found");
      setError("Authentication required. Please log in again.");
      setLoading(false);
      return;
    }

    const dashboardUrl = `${API_URL}/api/admin/dashboard`;
    
    fetch(dashboardUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include'
    })
      .then(res => {
        setDebugInfo({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries([...res.headers.entries()])
        });
        
        if (!res.ok) {
          return res.json().then(errorData => {
            throw new Error(errorData.message || `Error ${res.status}: ${res.statusText}`);
          }).catch(err => {
            if (err.name === 'SyntaxError') {
              throw new Error(`Error ${res.status}: ${res.statusText}`);
            }
            throw err;
          });
        }
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message || "An error occurred while fetching data");
        setLoading(false);
        
        if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
          setError("Your session has expired or you don't have the required permissions. Please log in again.");
        }
      });
  }, []);

  const generateMockData = (type) => {
    switch(type) {
      case 'contentDistribution':
        return [
          { name: 'Music Videos', value: 120 },
          { name: 'Shorts', value: 45 },
          { name: 'Podcasts', value: 30 },
          { name: 'Livestreams', value: 15 }
        ];
      case 'userStatusStats':
        return [
          { name: 'ACTIVE', value: 85 },
          { name: 'INACTIVE', value: 10 },
          { name: 'LOCKED', value: 3 },
          { name: 'DELETED', value: 2 }
        ];
      default:
        return [];
    }
  };

  const formatContentDistribution = () => {
    if (!stats || !stats.contentDistribution) {
      return generateMockData('contentDistribution');
    }
    return [
      { name: 'Music Videos', value: stats.contentDistribution.music || 0 },
      { name: 'Shorts', value: stats.contentDistribution.shorts || 0 },
      { name: 'Podcasts', value: stats.contentDistribution.podcasts || 0 },
      { name: 'Livestreams', value: stats.contentDistribution.liveStreams || 0 }
    ];
  };

  const formatUserStatusStats = () => {
    if (!stats || !stats.userStatusStats || !Array.isArray(stats.userStatusStats) || stats.userStatusStats.length === 0) {
      return generateMockData('userStatusStats');
    }
    return stats.userStatusStats.map(item => ({
      name: item._id,
      value: item.count
    }));
  };

  const getSafeValue = (obj, path, defaultValue = 0) => {
    try {
      const keys = path.split('.');
      let current = obj;
      for (const key of keys) {
        if (current === undefined || current === null) return defaultValue;
        current = current[key];
      }
      return current !== undefined && current !== null ? current : defaultValue;
    } catch (e) {
      return defaultValue;
    }
  };

  if (loading) return (
    <div className={styles.loading_container}>
      <div className={styles.spinner}></div>
      <p>Loading dashboard statistics...</p>
      <p className={styles.loading_info}>Connecting to the API...</p>
    </div>
  );

  if (error) return (
    <div className={styles.error_container}>
      <h2>Error while loading dashboard</h2>
      <p className={styles.error_message}>{error}</p>
      
      {debugInfo && (
        <div className={styles.debug_info}>
          <p>HTTP Status: {debugInfo.status} {debugInfo.statusText}</p>
          <p>Check your connection and permissions</p>
        </div>
      )}
      
      <div className={styles.error_actions}>
        <button 
          className={styles.retry_button} 
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-sync-alt"></i> Retry
        </button>
        <Link to="/login" className={styles.login_button}>
          <i className="fas fa-sign-in-alt"></i> Log in
        </Link>
      </div>
    </div>
  );

  const basicStats = stats?.basicStats || {
    userCount: 0,
    videoCount: 0,
    commentCount: 0,
    playlistCount: 0,
    podcastCount: 0,
    liveStreamCount: 0
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboard_header}>
        <h1 className={styles.page_title}>Admin Dashboard</h1>
      </div>

      {/* Basic statistics */}
      <div className={styles.dashboard_stats}>
        <div className={`${styles.stat_card} ${styles.stat_users}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-users"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.userCount', 0)}</h3>
            <p>Users</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_videos}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-video"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.videoCount', 0)}</h3>
            <p>Videos</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_comments}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-comments"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.commentCount', 0)}</h3>
            <p>Comments</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_playlists}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-list"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.playlistCount', 0)}</h3>
            <p>Playlists</p>
          </div>
        </div>
        
        <div className={`${styles.stat_card} ${styles.stat_podcasts}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-podcast"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.podcastCount', 0)}</h3>
            <p>Podcasts</p>
          </div>
        </div>
        
        <div className={`${styles.stat_card} ${styles.stat_streams}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-broadcast-tower"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.liveStreamCount', 0)}</h3>
            <p>Livestreams</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className={styles.charts_grid}>
        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Content Distribution</h2>
          </div>
          <div className={styles.chart_container}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatContentDistribution()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {formatContentDistribution().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>User Distribution</h2>
          </div>
          <div className={styles.chart_container}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={formatUserStatusStats()}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {formatUserStatusStats().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables & Lists */}
      <div className={styles.dashboard_grid}>
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Top 5 Videos</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/videos" className={styles.btn_secondary}>
                <i className="fas fa-list"></i>
                <span>All Videos</span>
              </Link>
            </div>
          </div>

          <table className={styles.data_table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Artist</th>
                <th>Type</th>
                <th>Views</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {stats && stats.topVideos && stats.topVideos.length > 0 ? (
                stats.topVideos.map(video => (
                  <tr key={video._id}>
                    <td>{video.titre}</td>
                    <td>{video.artiste || 'N/A'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${video.type}`]}`}>
                        {video.type === 'music' ? 'Music' : 
                         video.type === 'short' ? 'Short' : 
                         video.type === 'podcast' ? 'Podcast' : video.type}
                      </span>
                    </td>
                    <td>{video.vues || 0}</td>
                    <td>{video.likes || 0}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.no_data}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Recent Users</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/users/create" className={styles.btn_primary}>
                <i className="fas fa-plus"></i>
                <span>New User</span>
              </Link>
              <Link to="/admin/users" className={styles.btn_secondary}>
                <i className="fas fa-list"></i>
                <span>All Users</span>
              </Link>
            </div>
          </div>

          <table className={styles.data_table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats && stats.recentUsers && stats.recentUsers.length > 0 ? (
                stats.recentUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.prenom} {user.nom}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.status} ${styles[`status_${(user.statut_compte || '').toLowerCase()}`]}`}>
                        {user.statut_compte || 'UNKNOWN'}
                      </span>
                    </td>
                    <td>{user.date_inscription ? new Date(user.date_inscription).toLocaleDateString() : 'N/A'}</td>
                    <td>
                      <div className={styles.action_buttons}>
                        <Link to={`/admin/users/${user._id}`} className={styles.btn_icon} title="View Details">
                          <i className="fas fa-eye"></i>
                        </Link>
                        <Link to={`/admin/users/${user._id}/edit`} className={styles.btn_icon} title="Edit">
                          <i className="fas fa-edit"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.no_data}>No data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Recent Activities</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/logs" className={styles.btn_secondary}>
                <i className="fas fa-history"></i>
                <span>Full History</span>
              </Link>
            </div>
          </div>

          {stats && stats.recentActivities && stats.recentActivities.length > 0 ? (
            <ul className={styles.activity_list}>
              {stats.recentActivities.map(activity => (
                <li key={activity._id} className={styles.activity_item}>
                  <div className={styles.activity_icon}>
                    <i className={getActivityIcon(activity.type_action)}></i>
                  </div>
                  <div className={styles.activity_details}>
                    <p className={styles.activity_text}>
                      <strong>
                        {activity.id_user ? 
                          `${activity.id_user.prenom || ''} ${activity.id_user.nom || ''}`.trim() || 'User' 
                          : 'System'}
                      </strong>
                      {' '}{getActivityDescription(activity.type_action, activity.description_action)}
                    </p>
                    <p className={styles.activity_time}>
                      {activity.date_action ? new Date(activity.date_action).toLocaleString() : 'Unknown Date'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.no_data_container}>
              <p className={styles.no_data}>No recent activities available</p>
            </div>
          )}
        </div>

        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Quick Actions</h2>
          </div>

          <div className={styles.quick_actions}>
            <Link to="/admin/users/create" className={styles.quick_action_btn}>
              <i className="fas fa-user-plus"></i>
              <span>New User</span>
            </Link>
            
            <Link to="/admin/videos/create" className={styles.quick_action_btn}>
              <i className="fas fa-video"></i>
              <span>New Video</span>
            </Link>
            
            <Link to="/admin/podcasts/create" className={styles.quick_action_btn}>
              <i className="fas fa-podcast"></i>
              <span>New Podcast</span>
            </Link>
            
            <Link to="/admin/livestreams/create" className={styles.quick_action_btn}>
              <i className="fas fa-broadcast-tower"></i>
              <span>New Livestream</span>
            </Link>
            
            <Link to="/admin/reports" className={styles.quick_action_btn}>
              <i className="fas fa-flag"></i>
              <span>Reports</span>
            </Link>
            
            <Link to="/admin/settings" className={styles.quick_action_btn}>
              <i className="fas fa-cog"></i>
              <span>Settings</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Icons for activities
function getActivityIcon(actionType) {
  if (!actionType) return 'fas fa-circle';
  
  switch(actionType) {
    case 'INSCRIPTION': return 'fas fa-user-plus';
    case 'CONNEXION': return 'fas fa-sign-in-alt';
    case 'DECONNEXION': return 'fas fa-sign-out-alt';
    case 'VIDEO_LIKEE': return 'fas fa-thumbs-up';
    case 'VIDEO_UNLIKEE': return 'fas fa-thumbs-down';
    case 'CREATE_VIDEO': return 'fas fa-video';
    case 'UPDATE_VIDEO': return 'fas fa-edit';
    case 'DELETE_VIDEO': return 'fas fa-trash';
    case 'MODIFICATION_UTILISATEUR': return 'fas fa-user-edit';
    case 'MODIFICATION_STATUT': return 'fas fa-user-cog';
    case 'RESET_TENTATIVES': return 'fas fa-unlock';
    default: return 'fas fa-circle';
  }
}

// Activity description in English
function getActivityDescription(actionType, description) {
  if (!actionType) return description || 'Unknown action';
  
  switch(actionType) {
    case 'INSCRIPTION': return 'created an account';
    case 'CONNEXION': return 'logged in';
    case 'DECONNEXION': return 'logged out';
    case 'VIDEO_LIKEE': return 'liked a video';
    case 'VIDEO_UNLIKEE': return 'removed a like from a video';
    case 'CREATE_VIDEO': return 'added a video';
    case 'UPDATE_VIDEO': return 'updated a video';
    case 'DELETE_VIDEO': return 'deleted a video';
    case 'MODIFICATION_UTILISATEUR': return 'was updated';
    case 'MODIFICATION_STATUT': return description || 'changed status';
    default: return description || 'Unknown action';
  }
}

export default Dashboard;
