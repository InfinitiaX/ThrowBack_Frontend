import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './Settings.module.css';
import { MdLock, MdNotifications, MdPrivacyTip, MdLanguage, MdPalette } from 'react-icons/md';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// Configuration d'axios
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com',
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

  const handlePrivacyChange = (type, value) => {
    setSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [type]: value
      }
    }));
  };

  const handleLanguageChange = (e) => {
    setSettings(prev => ({
      ...prev,
      language: e.target.value
    }));
  };

  const handleThemeChange = (e) => {
    setSettings(prev => ({
      ...prev,
      theme: e.target.value
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
          <button
            className={`${styles.tab} ${activeTab === 'notifications' ? styles.active : ''}`}
            onClick={() => setActiveTab('notifications')}
          >
            NOTIFICATIONS
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'privacy' ? styles.active : ''}`}
            onClick={() => setActiveTab('privacy')}
          >
            PRIVACY
          </button>
          <button
            className={`${styles.tab} ${activeTab === 'Language and theme' ? styles.active : ''}`}
            onClick={() => setActiveTab('Language and theme')}
          >
            Language and theme
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

        {/* Notifications Block */}
        {activeTab === 'notifications' && (
          <div>
            <div className={styles.sectionHeader}>
              <MdNotifications className={styles.sectionIcon} />
              <h2>Notifications</h2>
            </div>
            <div className={styles.settingGroup}>
              <label className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Email Notifications</span>
                  <span className={styles.settingDescription}>Receive email updates about your account</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.email}
                  onChange={() => handleNotificationChange('email')}
                  className={styles.toggle}
                />
              </label>
              <label className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Push Notifications</span>
                  <span className={styles.settingDescription}>Get notified about new activities</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.push}
                  onChange={() => handleNotificationChange('push')}
                  className={styles.toggle}
                />
              </label>
              <label className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Marketing Emails</span>
                  <span className={styles.settingDescription}>Receive updates about new features and offers</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.notifications.marketing}
                  onChange={() => handleNotificationChange('marketing')}
                  className={styles.toggle}
                />
              </label>
            </div>
          </div>
        )}

        {/* Privacy Block */}
        {activeTab === 'privacy' && (
          <div>
            <div className={styles.sectionHeader}>
              <MdPrivacyTip className={styles.sectionIcon} />
              <h2>Privacy</h2>
            </div>
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Profile Visibility</span>
                  <span className={styles.settingDescription}>Control who can see your profile</span>
                </div>
                <select
                  value={settings.privacy.profileVisibility}
                  onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                  className={styles.select}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
              <label className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Show Email Address</span>
                  <span className={styles.settingDescription}>Display your email on your profile</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showEmail}
                  onChange={(e) => handlePrivacyChange('showEmail', e.target.checked)}
                  className={styles.toggle}
                />
              </label>
              <label className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Show Phone Number</span>
                  <span className={styles.settingDescription}>Display your phone number on your profile</span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.privacy.showPhone}
                  onChange={(e) => handlePrivacyChange('showPhone', e.target.checked)}
                  className={styles.toggle}
                />
              </label>
            </div>
          </div>
        )}

        {/* Preferences Block */}
        {activeTab === 'Language and theme' && (
          <div>
            <div className={styles.sectionHeader}>
              <MdLanguage className={styles.sectionIcon} />
              <h2>Language and theme</h2>
            </div>
            <div className={styles.settingGroup}>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Language</span>
                  <span className={styles.settingDescription}>Choose your preferred language</span>
                </div>
                <select
                  value={settings.language}
                  onChange={handleLanguageChange}
                  className={styles.select}
                >
                  <option value="en">English</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div className={styles.settingItem}>
                <div className={styles.settingLabel}>
                  <span>Theme</span>
                  <span className={styles.settingDescription}>Choose your preferred theme</span>
                </div>
                <select
                  value={settings.theme}
                  onChange={handleThemeChange}
                  className={styles.select}
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System</option>
                </select>
              </div>
            </div>
            <div className={styles.actions}>
              <button onClick={handleSave} className={styles.saveButton}>
                Save All Changes
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings; 