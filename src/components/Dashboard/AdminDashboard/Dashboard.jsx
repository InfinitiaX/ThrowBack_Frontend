import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/dashboard', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    })
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  if (!stats) return <div>Loading...</div>;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.page_title}>Dashboard</h1>
      <p>Welcome to the dashboard, here you have an overview of the activities in your system 👋</p>
      <br></br>

      {/* Stats */}
      <div className={styles.dashboard_stats}>
        <div className={`${styles.stat_card} ${styles.stat_users}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-users"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.userCount}</h3>
            <p>Users</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_videos}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-video"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.videoCount}</h3>
            <p>Videos</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_comments}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-comments"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.commentCount}</h3>
            <p>Comments</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_playlists}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-list"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.playlistCount}</h3>
            <p>Playlists</p>
          </div>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className={styles.dashboard_grid}>
        {/* Recent Users */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Recent Users</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/users/create" className={styles.btn_primary}>
                <i className="fas fa-plus"></i>
                <span>Add User</span>
              </Link>
            </div>
          </div>

          <table className={styles.recent_table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.prenom} {user.nom}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.status} ${styles['status_' + user.statut_compte.toLowerCase()]}`}>
                      {user.statut_compte}
                    </span>
                  </td>
                  <td>{new Date(user.date_inscription).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Recent Activities */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Recent Activities</h2>
          </div>

          <ul className={styles.activity_list}>
            <li className={styles.activity_item}>
              <div className={styles.activity_icon}>
                <i className="fas fa-user-plus"></i>
              </div>
              <div className={styles.activity_details}>
                <p className={styles.activity_text}><strong>John Doe</strong> registered</p>
                <p className={styles.activity_time}>2 hours ago</p>
              </div>
            </li>
            <li className={styles.activity_item}>
              <div className={styles.activity_icon}>
                <i className="fas fa-video"></i>
              </div>
              <div className={styles.activity_details}>
                <p className={styles.activity_text}><strong>Jane Smith</strong> added a video</p>
                <p className={styles.activity_time}>5 hours ago</p>
              </div>
            </li>
            <li className={styles.activity_item}>
              <div className={styles.activity_icon}>
                <i className="fas fa-comment"></i>
              </div>
              <div className={styles.activity_details}>
                <p className={styles.activity_text}><strong>Mike Johnson</strong> commented on a video</p>
                <p className={styles.activity_time}>8 hours ago</p>
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 