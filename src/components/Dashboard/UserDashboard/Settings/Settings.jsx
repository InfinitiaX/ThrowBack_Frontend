import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Settings.module.css';
import { MdLock, MdNotifications, MdPrivacyTip, MdLanguage, MdPalette, MdInfo } from 'react-icons/md';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Configuration d'axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token à chaque requête
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Style pour le badge Coming Soon
const comingSoonStyle = {
  fontSize: '0.6rem',
  padding: '2px 4px',
  backgroundColor: '#8b0000',
  color: 'white',
  borderRadius: '4px',
  marginLeft: '8px',
  fontWeight: 'bold',
  display: 'inline-block',
  verticalAlign: 'middle',
  lineHeight: 1,
};

// Style pour la notification "Feature in development"
const developmentNoticeStyle = {
  backgroundColor: 'rgba(139, 0, 0, 0.05)',
  border: '1px solid rgba(139, 0, 0, 0.1)',
  borderRadius: '8px',
  padding: '15px',
  marginTop: '15px',
  marginBottom: '15px',
  display: 'flex',
  alignItems: 'center',
  color: '#8b0000',
};

const Settings = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [serverError, setServerError] = useState(null);
  const [activeTab, setActiveTab] = useState('security');
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      marketing: false
    },
    privacy: {
      profileVisibility: 'public',
      showEmail: false,
      showPhone: false
    },
    language: 'en',
    theme: 'light'
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [saveSuccess, setSaveSuccess] = useState('');
  const [saveError, setSaveError] = useState('');

  const navigate = useNavigate();

  // Vérifier la connexion au serveur au chargement du composant
  useEffect(() => {
    const checkServerConnection = async () => {
      try {
        setIsLoading(true);
        setServerError(null);
        const response = await api.get('/api/auth/me');
        console.log('Server connection successful:', response.data);
      } catch (error) {
        console.error('Server connection error:', error);
        setServerError('Unable to connect to the server. Please check if the server is running.');
      } finally {
        setIsLoading(false);
      }
    };

    checkServerConnection();
  }, []);

  const handleNotificationChange = (type) => {
    setSettings(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [type]: !prev.notifications[type]
      }
    }));
  };


  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear messages when user starts typing
    setPasswordError('');
    setPasswordSuccess('');
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!user) {
      setPasswordError('You must be logged in to change your password');
      return;
    }

    // Validation
    if (passwordData.newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters long');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.put('/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      
      console.log('Password change response:', response.data);
      setPasswordSuccess('Password changed successfully');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Password change error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      setPasswordError(error.response?.data?.error || 'Failed to change password. Please check your current password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) {
      setSaveError('You must be logged in to save settings');
      return;
    }

    try {
      setIsLoading(true);
      setSaveError('');
      setSaveSuccess('');
      
      const response = await api.put('/api/users/settings', settings);
      
      console.log('Settings save response:', response.data);
      setSaveSuccess('Settings saved successfully');
      setTimeout(() => setSaveSuccess(''), 3000);
    } catch (error) {
      console.error('Settings save error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      setSaveError(error.response?.data?.error || 'Failed to save settings. Please try again.');
      setTimeout(() => setSaveError(''), 3000);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading...</div>;
  }

  // Composant pour afficher la notification de fonctionnalité en développement
  const DevelopmentNotice = () => (
    <div style={developmentNoticeStyle}>
      <MdInfo size={24} style={{ marginRight: '10px' }} />
      <div>
        <p style={{ margin: '0', fontWeight: 'bold' }}>This feature is currently under development</p>
        <p style={{ margin: '5px 0 0 0' }}>We're working hard to bring you this functionality soon. Stay tuned!</p>
      </div>
    </div>
  );

  return (
    <div className={styles.settingsContainer}>
      {serverError && (
        <div className={styles.errorMessage}>{serverError}</div>
      )}
      <button onClick={() => navigate(-1)} className={styles.backButton} style={{marginBottom: '18px', marginTop: '8px'}}>Back</button>
      <section className={styles.section}>
        <h1 className={styles.title}>Settings</h1>
        {/* Onglets harmonisés avec le profil */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${activeTab === 'security' ? styles.active : ''}`}
            onClick={() => setActiveTab('security')}
          >
            SECURITY
          </button>

        </div>

        {/* Security Block */}
        {activeTab === 'security' && (
          <div>
            <div className={styles.sectionHeader}>
              <MdLock className={styles.sectionIcon} />
              <h2>Security</h2>
            </div>
            <form onSubmit={handlePasswordSubmit} className={styles.passwordForm}>
              <div className={styles.settingGroup}>
                <label className={styles.settingItem}>
                  <span>Current Password</span>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordChange}
                    className={styles.passwordInput}
                    required
                  />
                </label>
                <label className={styles.settingItem}>
                  <span>New Password</span>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={passwordData.newPassword}
                    onChange={handlePasswordChange}
                    className={styles.passwordInput}
                    required
                  />
                </label>
                <label className={styles.settingItem}>
                  <span>Confirm New Password</span>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={passwordData.confirmPassword}
                    onChange={handlePasswordChange}
                    className={styles.passwordInput}
                    required
                  />
                </label>
              </div>
              {passwordError && (
                <div className={styles.errorMessage}>{passwordError}</div>
              )}
              {passwordSuccess && (
                <div className={styles.successMessage}>{passwordSuccess}</div>
              )}
              <div className={styles.actions}>
                <button type="submit" className={styles.saveButton}>
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}


      </section>
    </div>
  );
};

export default Settings;