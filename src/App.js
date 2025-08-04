// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Common/PrivateRoute';
import ApiRedirect from './components/Common/ApiRedirect';
import PrivateAdminRoute from './components/Common/PrivateAdminRoute';
import UserTempPage from './components/Common/UserTempPage';

// Pages
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import EmailVerify from './components/EmailVerify';
import EmailSent from './components/EmailSent';
import LandingPage from './pages/LandingPage';

// Dashboard
import DashboardLayout from './components/Dashboard/UserDashboard/DashboardLayout';
import ProfilePage from './components/Profile/Profile';          
import DashboardHome from './components/Dashboard/UserDashboard/Home/Home';
import Settings from './components/Dashboard/UserDashboard/Settings/Settings';
import Shorts from './components/Dashboard/UserDashboard/Short/Shorts';
import WeeklyPodcast from './components/Dashboard/UserDashboard/PodCast/WeeklyPodcast';
import PodcastDetail from './components/Dashboard/UserDashboard/PodCast/PodcastDetail';
import ThrowbackVideos from './components/Dashboard/UserDashboard/ThrowbackVideos/ThrowbackVideos';
import VideoDetail from './components/Dashboard/UserDashboard/ThrowbackVideos/VideoDetail';
import LiveThrowback from './components/Dashboard/UserDashboard/LiveThrowback/LiveThrowback';
import UserPlaylists from './components/Dashboard/UserDashboard/Playlists';
import UserPlaylistDetail from './components/Dashboard/UserDashboard/Playlists/UserPlaylistDetail';
import PlaylistForm from './components/Dashboard/UserDashboard/Playlists/PlaylistForm';
import PlaylistPlayer from './components/Dashboard/UserDashboard/Playlists/PlaylistPlayer';
import Search from './components/Dashboard/UserDashboard/Search/Search';

// Admin Dashboard
import AdminDashboard from './components/Dashboard/AdminDashboard';
import Dashboard from './components/Dashboard/AdminDashboard/Dashboard';
import Users from './components/Dashboard/AdminDashboard/admin/Users';
import UserDetails from './components/Dashboard/AdminDashboard/admin/UserDetails';
import UserForm from './components/Dashboard/AdminDashboard/admin/UserForm';
import AdminShorts from './components/Dashboard/AdminDashboard/Shorts';
import AdminVideos from './components/Dashboard/AdminDashboard/Videos';
import AdminPodcasts from './components/Dashboard/AdminDashboard/Podcasts'; 
import AdminLivethrowback from './components/Dashboard/AdminDashboard/LiveStreams';
import Playlists from './components/Dashboard/AdminDashboard/Playlists';
import PlaylistDetail from './components/Dashboard/AdminDashboard/Playlists/PlaylistDetail';
import PlaylistEdit from './components/Dashboard/AdminDashboard/Playlists/PlaylistEdit';

// Composants temporaires pour les pages admin
const TempPage = ({ title }) => (
  <div style={{ padding: '20px' }}>
    <h1>{title}</h1>
    <p>Cette page est en cours de développement.</p>
  </div>
);

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/email-verify/:id/:token" element={<EmailVerify />} />
          <Route path="/email-sent" element={<EmailSent />} />

          {/* redirections API */}
          <Route path="/api/auth/verify/:id/:token" element={<ApiRedirect endpoint="/api/auth/verify/:id/:token" />} />
          <Route path="/api/auth/verify-reset/:token" element={<ApiRedirect endpoint="/api/auth/verify-reset/:token" />} />

          {/* Dashboard Protected + Nested Routes */}
          <Route path="/dashboard/" element={
            <PrivateRoute allowedRoles={['user']}>
              <DashboardLayout />
            </PrivateRoute>
          }>
            {/* /dashboard affiche LiveThrowback par défaut */}
            <Route index element={<LiveThrowback />} />
            
            {/* Routes existantes */}
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="shorts" element={<Shorts />} />
            <Route path="podcast" element={<WeeklyPodcast />} />
            <Route path="podcast/:id" element={<PodcastDetail />} />
            <Route path="videos" element={<ThrowbackVideos />} />
            <Route path="videos/:id" element={<VideoDetail />} />
            <Route path="playlists" element={<UserPlaylists />} />
            <Route path="playlists/:id" element={<UserPlaylistDetail />} />
            <Route path="playlists/new" element={<PlaylistForm />} />
            <Route path="playlists/:id/edit" element={<PlaylistForm />} />
            <Route path="playlists/:id/play" element={<PlaylistPlayer />} />
            <Route path="search" element={<Search />} />
            
            {/* Ajouter les routes manquantes avec pages temporaires */}
            <Route path="live" element={<LiveThrowback />} /> {/* Redirection vers la même page que l'index */}
            <Route path="wall" element={<UserTempPage title="ThrowBack Wall" />} />
            <Route path="chat" element={<UserTempPage title="ThrowBack Chat" />} />
            <Route path="discover" element={<UserTempPage title="Discover" />} />
            <Route path="favorites" element={<UserTempPage title="Your Favorites" />} />
          </Route>

          {/* Admin Dashboard */}
          <Route path="/admin" element={
            <PrivateAdminRoute>
              <AdminDashboard />
            </PrivateAdminRoute>
          }>
            <Route index element={<Dashboard />} />
            
            {/* Gestion des utilisateurs */}
            <Route path="users" element={<Users />} />
            <Route path="users/:id" element={<UserDetails />} />
            <Route path="users/create" element={<UserForm />} />
            <Route path="users/:id/edit" element={<UserForm />} />
            
            {/* Gestion des vidéos */}
            <Route path="videos" element={<AdminVideos />} />
            
            {/* Gestion des shorts */}
            <Route path="shorts" element={<AdminShorts />} />

            {/* Gestion des livestreams  */}
            <Route path="livestreams" element={<AdminLivethrowback />} />

            {/* Gestion des podcasts */}
            <Route path="podcasts" element={<AdminPodcasts />} />
            
            {/* Gestion des playlists */}
            <Route path="playlists" element={<Playlists />} />
            <Route path="playlists/:id" element={<PlaylistDetail />} />
            <Route path="playlists/:id/edit" element={<PlaylistEdit />} />
            <Route path="playlists/new" element={<PlaylistEdit />} />
            
            {/* Modération */}
            <Route path="comments" element={<TempPage title="Modération des Commentaires" />} />
            <Route path="posts" element={<TempPage title="Modération des Posts" />} />
            <Route path="likes" element={<TempPage title="Gestion des Likes" />} />
            <Route path="messages" element={<TempPage title="Gestion des Messages" />} />
            <Route path="friends" element={<TempPage title="Gestion des Amis" />} />
            
            {/* Système */}
            <Route path="security" element={<TempPage title="Sécurité" />} />
            <Route path="logs" element={<TempPage title="Logs Système" />} />
          </Route>

          {/* fallback */}
          <Route path="/" element={<LandingPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;