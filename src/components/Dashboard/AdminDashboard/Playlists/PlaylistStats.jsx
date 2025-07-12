// components/Dashboard/AdminDashboard/Playlists/PlaylistStats.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import styles from './PlaylistStats.module.css';

// Couleurs pour les graphiques
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#d88489'];
const VISIBILITY_COLORS = {
  'PUBLIC': '#00C49F',
  'PRIVE': '#FF8042',
  'AMIS': '#FFBB28'
};
const TYPE_COLORS = {
  'MANUELLE': '#0088FE',
  'AUTO_GENRE': '#00C49F',
  'AUTO_DECENNIE': '#FFBB28',
  'AUTO_ARTISTE': '#FF8042'
};

const PlaylistStats = ({ stats, loading, onRefresh }) => {
  // Si chargement en cours
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Chargement des statistiques...</p>
      </div>
    );
  }

  // Si aucune statistique
  if (!stats) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>Impossible de charger les statistiques</p>
        <button onClick={onRefresh}>Réessayer</button>
      </div>
    );
  }

  // Formater les données pour le graphique des playlists par type
  const playlistsByTypeData = stats.playlistsByType.map(item => ({
    name: item._id === 'MANUELLE' ? 'Manuelle' :
          item._id === 'AUTO_GENRE' ? 'Auto (Genre)' :
          item._id === 'AUTO_DECENNIE' ? 'Auto (Décennie)' :
          item._id === 'AUTO_ARTISTE' ? 'Auto (Artiste)' : item._id,
    value: item.count,
    color: TYPE_COLORS[item._id] || COLORS[0]
  }));

  // Formater les données pour le graphique des playlists par visibilité
  const playlistsByVisibilityData = stats.playlistsByVisibility.map(item => ({
    name: item._id,
    value: item.count,
    color: VISIBILITY_COLORS[item._id] || COLORS[0]
  }));

  // Formater les données pour le graphique d'évolution
  const sortedTrends = [...stats.playlistsCreationTrend].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Formater les données pour le graphique des top créateurs
  const topCreatorsData = stats.topPlaylistCreators.map(item => ({
    name: item.user.nom ? `${item.user.prenom} ${item.user.nom}` : 'Utilisateur inconnu',
    playlists: item.count
  }));

  // Formater les données pour le graphique des top playlists
  const topPlaylistsData = stats.topPlaylists.map(playlist => ({
    name: playlist.nom,
    lectures: playlist.nb_lectures,
    favoris: playlist.nb_favoris,
    creator: playlist.proprietaire ? `${playlist.proprietaire.prenom} ${playlist.proprietaire.nom}` : 'Inconnu'
  }));

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsHeader}>
        <h2>Statistiques des Playlists</h2>
        <button className={styles.refreshButton} onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i>
          Rafraîchir
        </button>
      </div>

      <div className={styles.overviewCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-list"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Total des Playlists</h3>
            <p>{stats.totalPlaylists}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-globe"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Playlists Publiques</h3>
            <p>
              {
                stats.playlistsByVisibility.find(item => item._id === 'PUBLIC')?.count || 0
              }
            </p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-lock"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Playlists Privées</h3>
            <p>
              {
                stats.playlistsByVisibility.find(item => item._id === 'PRIVE')?.count || 0
              }
            </p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-magic"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Playlists Automatiques</h3>
            <p>
              {
                (stats.playlistsByType.find(item => item._id === 'AUTO_GENRE')?.count || 0) +
                (stats.playlistsByType.find(item => item._id === 'AUTO_DECENNIE')?.count || 0) +
                (stats.playlistsByType.find(item => item._id === 'AUTO_ARTISTE')?.count || 0)
              }
            </p>
          </div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        {/* Graphique des playlists par type */}
        <div className={styles.chartCard}>
          <h3>Distribution par Type</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playlistsByTypeData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {playlistsByTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} playlists`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique des playlists par visibilité */}
        <div className={styles.chartCard}>
          <h3>Distribution par Visibilité</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={playlistsByVisibilityData}
                  cx="50%"
                  cy="50%"
                  labelLine={true}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  nameKey="name"
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                >
                  {playlistsByVisibilityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value} playlists`, 'Nombre']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique d'évolution des créations de playlists */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <h3>Évolution des Playlists Créées</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={sortedTrends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} playlists`, 'Créées']} />
                <Area type="monotone" dataKey="count" name="Playlists" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique des top créateurs de playlists */}
        <div className={styles.chartCard}>
          <h3>Top Créateurs de Playlists</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topCreatorsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={150} />
                <Tooltip formatter={(value) => [`${value} playlists`, 'Nombre']} />
                <Legend />
                <Bar dataKey="playlists" name="Playlists" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Graphique des top playlists */}
        <div className={styles.chartCard}>
          <h3>Top Playlists Populaires</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={topPlaylistsData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, name === 'lectures' ? 'Lectures' : 'Favoris']}
                  labelFormatter={(label) => {
                    const playlist = topPlaylistsData.find(p => p.name === label);
                    return `${label} (${playlist?.creator || 'Inconnu'})`;
                  }}
                />
                <Legend />
                <Bar dataKey="lectures" name="Lectures" fill="#00C49F" />
                <Bar dataKey="favoris" name="Favoris" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistStats;