// components/Dashboard/AdminDashboard/Playlists/PlaylistStats.jsx
import React from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import styles from './PlaylistStats.module.css';

// Colors for the charts
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
  // If loading
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.spinner}></div>
        <p>Loading statistics...</p>
      </div>
    );
  }

  // If no statistics
  if (!stats) {
    return (
      <div className={styles.errorContainer}>
        <i className="fas fa-exclamation-triangle"></i>
        <p>Unable to load statistics</p>
        <button onClick={onRefresh}>Retry</button>
      </div>
    );
  }

  // Format data for playlists by type chart
  const playlistsByTypeData = stats.playlistsByType.map(item => ({
    name: item._id === 'MANUELLE' ? 'Manual' :
          item._id === 'AUTO_GENRE' ? 'Auto (Genre)' :
          item._id === 'AUTO_DECENNIE' ? 'Auto (Decade)' :
          item._id === 'AUTO_ARTISTE' ? 'Auto (Artist)' : item._id,
    value: item.count,
    color: TYPE_COLORS[item._id] || COLORS[0]
  }));

  // Format data for playlists by visibility chart
  const playlistsByVisibilityData = stats.playlistsByVisibility.map(item => ({
    name: item._id,
    value: item.count,
    color: VISIBILITY_COLORS[item._id] || COLORS[0]
  }));

  // Sort data for playlist creation trend chart
  const sortedTrends = [...stats.playlistsCreationTrend].sort((a, b) => {
    return new Date(a.date) - new Date(b.date);
  });

  // Format data for top creators chart
  const topCreatorsData = stats.topPlaylistCreators.map(item => ({
    name: item.user.nom ? `${item.user.prenom} ${item.user.nom}` : 'Unknown user',
    playlists: item.count
  }));

  // Format data for top playlists chart
  const topPlaylistsData = stats.topPlaylists.map(playlist => ({
    name: playlist.nom,
    lectures: playlist.nb_lectures,
    favoris: playlist.nb_favoris,
    creator: playlist.proprietaire ? `${playlist.proprietaire.prenom} ${playlist.proprietaire.nom}` : 'Unknown'
  }));

  return (
    <div className={styles.statsContainer}>
      <div className={styles.statsHeader}>
        <h2>Playlist Statistics</h2>
        <button className={styles.refreshButton} onClick={onRefresh}>
          <i className="fas fa-sync-alt"></i>
          Refresh
        </button>
      </div>

      <div className={styles.overviewCards}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-list"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Total Playlists</h3>
            <p>{stats.totalPlaylists}</p>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="fas fa-globe"></i>
          </div>
          <div className={styles.statInfo}>
            <h3>Public Playlists</h3>
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
            <h3>Private Playlists</h3>
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
            <h3>Automatic Playlists</h3>
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
        {/* Playlists by type chart */}
        <div className={styles.chartCard}>
          <h3>Distribution by Type</h3>
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
                <Tooltip formatter={(value) => [`${value} playlists`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Playlists by visibility chart */}
        <div className={styles.chartCard}>
          <h3>Distribution by Visibility</h3>
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
                <Tooltip formatter={(value) => [`${value} playlists`, 'Count']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Playlist creation trend chart */}
        <div className={`${styles.chartCard} ${styles.fullWidth}`}>
          <h3>Trend of Created Playlists</h3>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart
                data={sortedTrends}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} playlists`, 'Created']} />
                <Area type="monotone" dataKey="count" name="Playlists" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top playlist creators chart */}
        <div className={styles.chartCard}>
          <h3>Top Playlist Creators</h3>
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
                <Tooltip formatter={(value) => [`${value} playlists`, 'Count']} />
                <Legend />
                <Bar dataKey="playlists" name="Playlists" fill="#0088FE" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Top playlists chart */}
        <div className={styles.chartCard}>
          <h3>Top Popular Playlists</h3>
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
                  formatter={(value, name) => [value, name === 'lectures' ? 'Plays' : 'Favorites']}
                  labelFormatter={(label) => {
                    const playlist = topPlaylistsData.find(p => p.name === label);
                    return `${label} (${playlist?.creator || 'Unknown'})`;
                  }}
                />
                <Legend />
                <Bar dataKey="lectures" name="Plays" fill="#00C49F" />
                <Bar dataKey="favoris" name="Favorites" fill="#FFBB28" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistStats;
