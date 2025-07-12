import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart, BarChart, PieChart, Line, Bar, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

// Couleurs pour les graphiques
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#8884d8', '#ff8042'
];

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'year'

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/dashboard', {
      headers: {
        Authorization: 'Bearer ' + localStorage.getItem('token')
      }
    })
      .then(res => {
        if (!res.ok) {
          throw new Error('Erreur lors de la récupération des données');
        }
        return res.json();
      })
      .then(data => {
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [timeRange]);

  if (loading) return (
    <div className={styles.loading_container}>
      <div className={styles.spinner}></div>
      <p>Chargement des statistiques...</p>
    </div>
  );

  if (error) return (
    <div className={styles.error_container}>
      <h2>Erreur</h2>
      <p>{error}</p>
      <button onClick={() => window.location.reload()}>Réessayer</button>
    </div>
  );

  if (!stats) return null;

  // Formater les données pour les graphiques d'activité
  const formatDailyStats = () => {
    if (!stats.dailyStats) return [];
    
    // Remplir les jours manquants avec des compteurs à zéro
    const result = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const found = stats.dailyStats.find(item => item._id === dateStr);
      result.push({
        date: dateStr,
        count: found ? found.count : 0,
        day: new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short' })
      });
    }
    return result;
  };

  // Formater les données pour le graphique de répartition du contenu
  const formatContentDistribution = () => {
    if (!stats.contentDistribution) return [];
    
    return [
      { name: 'Vidéos Musicales', value: stats.contentDistribution.music || 0 },
      { name: 'Shorts', value: stats.contentDistribution.shorts || 0 },
      { name: 'Podcasts', value: stats.contentDistribution.podcasts || 0 },
      { name: 'Livestreams', value: stats.contentDistribution.liveStreams || 0 }
    ];
  };

  // Formater les données pour le graphique de répartition par décennie
  const formatDecadeStats = () => {
    if (!stats.decadeStats) return [];
    
    return stats.decadeStats.map(item => ({
      name: item._id,
      value: item.count
    }));
  };

  // Formater les données pour le graphique de statut utilisateur
  const formatUserStatusStats = () => {
    if (!stats.userStatusStats) return [];
    
    return stats.userStatusStats.map(item => ({
      name: item._id,
      value: item.count
    }));
  };

  return (
    <div className={styles.dashboard}>
      <div className={styles.dashboard_header}>
        <h1 className={styles.page_title}>Tableau de bord administrateur</h1>
        <div className={styles.time_range_selector}>
          <button 
            className={`${styles.range_btn} ${timeRange === 'week' ? styles.active : ''}`}
            onClick={() => setTimeRange('week')}
          >
            7 jours
          </button>
          <button 
            className={`${styles.range_btn} ${timeRange === 'month' ? styles.active : ''}`}
            onClick={() => setTimeRange('month')}
          >
            30 jours
          </button>
          <button 
            className={`${styles.range_btn} ${timeRange === 'year' ? styles.active : ''}`}
            onClick={() => setTimeRange('year')}
          >
            12 mois
          </button>
        </div>
      </div>

      {/* Statistiques de base */}
      <div className={styles.dashboard_stats}>
        <div className={`${styles.stat_card} ${styles.stat_users}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-users"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.userCount}</h3>
            <p>Utilisateurs</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_videos}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-video"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.videoCount}</h3>
            <p>Vidéos</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_comments}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-comments"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.commentCount}</h3>
            <p>Commentaires</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_playlists}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-list"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.playlistCount}</h3>
            <p>Playlists</p>
          </div>
        </div>
        
        <div className={`${styles.stat_card} ${styles.stat_podcasts}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-podcast"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.podcastCount}</h3>
            <p>Podcasts</p>
          </div>
        </div>
        
        <div className={`${styles.stat_card} ${styles.stat_streams}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-broadcast-tower"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{stats.basicStats.liveStreamCount}</h3>
            <p>Livestreams</p>
          </div>
        </div>
      </div>

      {/* Graphiques principaux */}
      <div className={styles.charts_grid}>
        {/* Graphique d'activité quotidienne */}
        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Activité des 7 derniers jours</h2>
          </div>
          <div className={styles.chart_container}>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={formatDailyStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8884d8" name="Activités" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique de répartition du contenu */}
        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Répartition du contenu</h2>
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

        {/* Graphique de vidéos par décennie */}
        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Vidéos par décennie</h2>
          </div>
          <div className={styles.chart_container}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={formatDecadeStats()}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="value" name="Nombre de vidéos" fill="#82ca9d">
                  {formatDecadeStats().map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique de statut utilisateur */}
        <div className={styles.chart_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Répartition des utilisateurs</h2>
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

      {/* Listes et tableaux */}
      <div className={styles.dashboard_grid}>
        {/* Top 5 des vidéos */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Top 5 des vidéos</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/videos" className={styles.btn_secondary}>
                <i className="fas fa-list"></i>
                <span>Toutes les vidéos</span>
              </Link>
            </div>
          </div>

          <table className={styles.data_table}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Artiste</th>
                <th>Type</th>
                <th>Vues</th>
                <th>Likes</th>
              </tr>
            </thead>
            <tbody>
              {stats.topVideos && stats.topVideos.map(video => (
                <tr key={video._id}>
                  <td>{video.titre}</td>
                  <td>{video.artiste || 'N/A'}</td>
                  <td>
                    <span className={`${styles.badge} ${styles[`badge_${video.type}`]}`}>
                      {video.type === 'music' ? 'Musique' : 'Short'}
                    </span>
                  </td>
                  <td>{video.vues}</td>
                  <td>{video.likes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Utilisateurs récents */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Utilisateurs récents</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/users/create" className={styles.btn_primary}>
                <i className="fas fa-plus"></i>
                <span>Nouvel utilisateur</span>
              </Link>
              <Link to="/admin/users" className={styles.btn_secondary}>
                <i className="fas fa-list"></i>
                <span>Tous les utilisateurs</span>
              </Link>
            </div>
          </div>

          <table className={styles.data_table}>
            <thead>
              <tr>
                <th>Utilisateur</th>
                <th>Email</th>
                <th>Statut</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers && stats.recentUsers.map(user => (
                <tr key={user._id}>
                  <td>{user.prenom} {user.nom}</td>
                  <td>{user.email}</td>
                  <td>
                    <span className={`${styles.status} ${styles['status_' + user.statut_compte.toLowerCase()]}`}>
                      {user.statut_compte}
                    </span>
                  </td>
                  <td>{new Date(user.date_inscription).toLocaleDateString()}</td>
                  <td>
                    <div className={styles.action_buttons}>
                      <Link to={`/admin/users/${user._id}`} className={styles.btn_icon} title="Voir les détails">
                        <i className="fas fa-eye"></i>
                      </Link>
                      <Link to={`/admin/users/${user._id}/edit`} className={styles.btn_icon} title="Modifier">
                        <i className="fas fa-edit"></i>
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Activités récentes */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Activités récentes</h2>
            <div className={styles.card_actions}>
              <Link to="/admin/logs" className={styles.btn_secondary}>
                <i className="fas fa-history"></i>
                <span>Historique complet</span>
              </Link>
            </div>
          </div>

          <ul className={styles.activity_list}>
            {stats.recentActivities && stats.recentActivities.map(activity => (
              <li key={activity._id} className={styles.activity_item}>
                <div className={styles.activity_icon}>
                  <i className={getActivityIcon(activity.type_action)}></i>
                </div>
                <div className={styles.activity_details}>
                  <p className={styles.activity_text}>
                    <strong>{activity.id_user ? `${activity.id_user.prenom} ${activity.id_user.nom}` : 'Système'}</strong>
                    {' '}{getActivityDescription(activity.type_action, activity.description_action)}
                  </p>
                  <p className={styles.activity_time}>
                    {new Date(activity.date_action).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions rapides */}
        <div className={styles.dashboard_card}>
          <div className={styles.card_header}>
            <h2 className={styles.card_title}>Actions rapides</h2>
          </div>

          <div className={styles.quick_actions}>
            <Link to="/admin/users/create" className={styles.quick_action_btn}>
              <i className="fas fa-user-plus"></i>
              <span>Nouvel utilisateur</span>
            </Link>
            
            <Link to="/admin/videos/create" className={styles.quick_action_btn}>
              <i className="fas fa-video"></i>
              <span>Nouvelle vidéo</span>
            </Link>
            
            <Link to="/admin/podcasts/create" className={styles.quick_action_btn}>
              <i className="fas fa-podcast"></i>
              <span>Nouveau podcast</span>
            </Link>
            
            <Link to="/admin/livestreams/create" className={styles.quick_action_btn}>
              <i className="fas fa-broadcast-tower"></i>
              <span>Nouveau livestream</span>
            </Link>
            
            <Link to="/admin/reports" className={styles.quick_action_btn}>
              <i className="fas fa-flag"></i>
              <span>Signalements</span>
            </Link>
            
            <Link to="/admin/settings" className={styles.quick_action_btn}>
              <i className="fas fa-cog"></i>
              <span>Paramètres</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

// Fonction pour obtenir l'icône appropriée selon le type d'action
function getActivityIcon(actionType) {
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

// Fonction pour formater la description de l'action
function getActivityDescription(actionType, description) {
  switch(actionType) {
    case 'INSCRIPTION': return 'a créé un compte';
    case 'CONNEXION': return 's\'est connecté(e)';
    case 'DECONNEXION': return 's\'est déconnecté(e)';
    case 'VIDEO_LIKEE': return 'a aimé une vidéo';
    case 'VIDEO_UNLIKEE': return 'a retiré son like d\'une vidéo';
    case 'CREATE_VIDEO': return 'a ajouté une vidéo';
    case 'UPDATE_VIDEO': return 'a modifié une vidéo';
    case 'DELETE_VIDEO': return 'a supprimé une vidéo';
    case 'MODIFICATION_UTILISATEUR': return 'a été modifié(e)';
    case 'MODIFICATION_STATUT': return description;
    default: return description;
  }
}

export default Dashboard;