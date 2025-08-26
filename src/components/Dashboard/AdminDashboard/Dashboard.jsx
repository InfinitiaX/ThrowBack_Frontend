import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import styles from './Dashboard.module.css';

// Couleurs pour les graphiques
const COLORS = [
  '#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088FE', '#00C49F', '#FFBB28', '#FF8042',
  '#a4de6c', '#d0ed57', '#83a6ed', '#8dd1e1', '#82ca9d', '#8884d8', '#ff8042'
];

// API URL configuration - utilise l'URL en environnement ou rien en local
const API_URL = process.env.REACT_APP_API_URL || '';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    setLoading(true);
    
    // Récupérer le token de manière plus robuste
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.error("Token d'authentification non trouvé");
      setError("Authentification requise. Veuillez vous reconnecter.");
      setLoading(false);
      return;
    }

    console.log("Tentative de récupération du dashboard avec token:", token.substring(0, 15) + "...");
    
    // Construire l'URL complète
    const dashboardUrl = `${API_URL}/api/admin/dashboard`;
    console.log("URL de l'API:", dashboardUrl);
    
    fetch(dashboardUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      credentials: 'include' // Pour inclure les cookies
    })
      .then(res => {
        console.log("Réponse API:", res.status, res.statusText);
        setDebugInfo({
          status: res.status,
          statusText: res.statusText,
          headers: Object.fromEntries([...res.headers.entries()])
        });
        
        if (!res.ok) {
          return res.json().then(errorData => {
            console.error("Détails de l'erreur:", errorData);
            throw new Error(errorData.message || `Erreur ${res.status}: ${res.statusText}`);
          }).catch(err => {
            // Si pas de JSON dans la réponse d'erreur
            if (err.name === 'SyntaxError') {
              throw new Error(`Erreur ${res.status}: ${res.statusText}`);
            }
            throw err;
          });
        }
        return res.json();
      })
      .then(data => {
        console.log("Données reçues:", data);
        setStats(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Erreur complète:', err);
        setError(err.message || "Une erreur s'est produite lors de la récupération des données");
        setLoading(false);
        
        // Si erreur 401/403, suggérer de se reconnecter
        if (err.message && (err.message.includes('401') || err.message.includes('403'))) {
          setError("Votre session a expiré ou vous n'avez pas les droits nécessaires. Veuillez vous reconnecter.");
        }
      });
  }, []);

  // Fonction pour générer des données de remplacement pour les graphiques
  const generateMockData = (type) => {
    switch(type) {
      case 'contentDistribution':
        return [
          { name: 'Vidéos Musicales', value: 120 },
          { name: 'Shorts', value: 45 },
          { name: 'Podcasts', value: 30 },
          { name: 'Livestreams', value: 15 }
        ];
        
      case 'userStatusStats':
        return [
          { name: 'ACTIF', value: 85 },
          { name: 'INACTIF', value: 10 },
          { name: 'VERROUILLE', value: 3 },
          { name: 'SUPPRIME', value: 2 }
        ];
        
      default:
        return [];
    }
  };

  // Formater les données pour le graphique de répartition du contenu
  const formatContentDistribution = () => {
    if (!stats || !stats.contentDistribution) {
      return generateMockData('contentDistribution');
    }
    
    return [
      { name: 'Vidéos Musicales', value: stats.contentDistribution.music || 0 },
      { name: 'Shorts', value: stats.contentDistribution.shorts || 0 },
      { name: 'Podcasts', value: stats.contentDistribution.podcasts || 0 },
      { name: 'Livestreams', value: stats.contentDistribution.liveStreams || 0 }
    ];
  };

  // Formater les données pour le graphique de statut utilisateur
  const formatUserStatusStats = () => {
    if (!stats || !stats.userStatusStats || !Array.isArray(stats.userStatusStats) || stats.userStatusStats.length === 0) {
      return generateMockData('userStatusStats');
    }
    
    return stats.userStatusStats.map(item => ({
      name: item._id,
      value: item.count
    }));
  };

  // Fonction pour récupérer des données en toute sécurité
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

  // Afficher l'état de chargement
  if (loading) return (
    <div className={styles.loading_container}>
      <div className={styles.spinner}></div>
      <p>Chargement des statistiques du tableau de bord...</p>
      <p className={styles.loading_info}>Connexion à l'API en cours...</p>
    </div>
  );

  // Afficher les erreurs avec plus de détails
  if (error) return (
    <div className={styles.error_container}>
      <h2>Erreur lors du chargement du tableau de bord</h2>
      <p className={styles.error_message}>{error}</p>
      
      {debugInfo && (
        <div className={styles.debug_info}>
          <p>Statut HTTP: {debugInfo.status} {debugInfo.statusText}</p>
          <p>Vérifiez votre connexion et vos permissions</p>
        </div>
      )}
      
      <div className={styles.error_actions}>
        <button 
          className={styles.retry_button} 
          onClick={() => window.location.reload()}
        >
          <i className="fas fa-sync-alt"></i> Réessayer
        </button>
        <Link to="/login" className={styles.login_button}>
          <i className="fas fa-sign-in-alt"></i> Se reconnecter
        </Link>
      </div>
    </div>
  );

  // Si pas de données mais pas d'erreur non plus, générer des données par défaut
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
        <h1 className={styles.page_title}>Tableau de bord administrateur</h1>
        {/* Filtres temporels supprimés */}
      </div>

      {/* Statistiques de base */}
      <div className={styles.dashboard_stats}>
        <div className={`${styles.stat_card} ${styles.stat_users}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-users"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.userCount', 0)}</h3>
            <p>Utilisateurs</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_videos}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-video"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.videoCount', 0)}</h3>
            <p>Vidéos</p>
          </div>
        </div>

        <div className={`${styles.stat_card} ${styles.stat_comments}`}>
          <div className={styles.stat_icon}>
            <i className="fas fa-comments"></i>
          </div>
          <div className={styles.stat_info}>
            <h3>{getSafeValue(stats, 'basicStats.commentCount', 0)}</h3>
            <p>Commentaires</p>
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

      {/* Graphiques principaux (restants) */}
      <div className={styles.charts_grid}>
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
              {stats && stats.topVideos && stats.topVideos.length > 0 ? (
                stats.topVideos.map(video => (
                  <tr key={video._id}>
                    <td>{video.titre}</td>
                    <td>{video.artiste || 'N/A'}</td>
                    <td>
                      <span className={`${styles.badge} ${styles[`badge_${video.type}`]}`}>
                        {video.type === 'music' ? 'Musique' : 
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
                  <td colSpan="5" className={styles.no_data}>Aucune donnée disponible</td>
                </tr>
              )}
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
              {stats && stats.recentUsers && stats.recentUsers.length > 0 ? (
                stats.recentUsers.map(user => (
                  <tr key={user._id}>
                    <td>{user.prenom} {user.nom}</td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`${styles.status} ${styles[`status_${(user.statut_compte || '').toLowerCase()}`]}`}>
                        {user.statut_compte || 'INCONNU'}
                      </span>
                    </td>
                    <td>{user.date_inscription ? new Date(user.date_inscription).toLocaleDateString() : 'N/A'}</td>
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
                ))
              ) : (
                <tr>
                  <td colSpan="5" className={styles.no_data}>Aucune donnée disponible</td>
                </tr>
              )}
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
                          `${activity.id_user.prenom || ''} ${activity.id_user.nom || ''}`.trim() || 'Utilisateur' 
                          : 'Système'}
                      </strong>
                      {' '}{getActivityDescription(activity.type_action, activity.description_action)}
                    </p>
                    <p className={styles.activity_time}>
                      {activity.date_action ? new Date(activity.date_action).toLocaleString() : 'Date inconnue'}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className={styles.no_data_container}>
              <p className={styles.no_data}>Aucune activité récente disponible</p>
            </div>
          )}
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

// Fonction pour formater la description de l'action
function getActivityDescription(actionType, description) {
  if (!actionType) return description || 'Action inconnue';
  
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
    case 'MODIFICATION_STATUT': return description || 'a changé de statut';
    default: return description || 'Action inconnue';
  }
}

export default Dashboard;
