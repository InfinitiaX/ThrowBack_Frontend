// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import PrivateRoute from './components/Common/PrivateRoute';
import ApiRedirect from './components/Common/ApiRedirect';
import PrivateAdminRoute from './components/Common/PrivateAdminRoute';

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
import DashboardHome from './components/Dashboard/UserDashboard/Home'
import Settings from './components/Dashboard/UserDashboard/Settings/Settings';
import Shorts from './components/Dashboard/UserDashboard/Short/Shorts';
import ThrowbackVideos from './components/Dashboard/UserDashboard/ThrowbackVideos/ThrowbackVideos';
import VideoDetail from './components/Dashboard/UserDashboard/ThrowbackVideos/VideoDetail';

// Admin Dashboard
import AdminDashboard from './components/Dashboard/AdminDashboard';
import Dashboard from './components/Dashboard/AdminDashboard/Dashboard';
import Users from './components/Dashboard/AdminDashboard/admin/Users';
import UserDetails from './components/Dashboard/AdminDashboard/admin/UserDetails';
import UserForm from './components/Dashboard/AdminDashboard/admin/UserForm';
import AdminShorts from './components/Dashboard/AdminDashboard/Shorts';
import AdminVideos from './components/Dashboard/AdminDashboard/Videos';

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
            {/* /dashboard affiche un Home par défaut */}
            <Route index element={<DashboardHome />} />
            {/* /dashboard/profile affiche ta page profil */}
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="shorts" element={<Shorts />} />
            
            {/* Routes pour le module ThrowbackVideos */}
            <Route path="videos" element={<ThrowbackVideos />} />
            <Route path="videos/:id" element={<VideoDetail />} />
            
            {/* tu peux ajouter d'autres sous-routes ici */}
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
            
            {/* Gestion des playlists */}
            <Route path="playlists" element={<TempPage title="Gestion des Playlists" />} />
            
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