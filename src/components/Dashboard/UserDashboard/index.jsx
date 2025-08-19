import React, { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import { useAuth } from '../../../contexts/AuthContext';

import styles from './styles.module.css';
import Header from './header/Header';
import Sidebar from './sidebar/Sidebar';
import Home from './Home';
import Profile from '../../Profile/Profile';
import ThrowbackVideos from './Videos/ThrowbackVideos';

const UserDashboard = () => {
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Vérifie l'authentification
  const fetch = useCallback(async () => {
    try {
      await api.get('/api/auth/me');
    } catch (e) {
      if (e.response?.status === 401) navigate('/login');
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.layout}>
      <Sidebar />

      <div className={styles.main}>
        <Header logout={logout} />

        <div className={styles.content}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="profile" element={<Profile />} />
            <Route path="videos/*" element={<ThrowbackVideos />} />
            {/* tu peux ajouter d'autres routes ici */}
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;