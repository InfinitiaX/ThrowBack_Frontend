// src/components/Login/index.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Captcha from '../Common/Captcha';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { login, user, isAuthenticated } = useAuth();

  useEffect(() => {
    // Redirect if already logged in
    if (isAuthenticated && user) {
      console.log('👤 User data:', user);
      console.log('👤 User role:', user.role);
      
      // Vérification du rôle unique
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      
      console.log('🎯 Is admin:', isAdmin);
      const redirectUrl = isAdmin ? '/admin' : '/dashboard';
      console.log('🔄 Redirecting to:', redirectUrl);
      
      navigate(redirectUrl);
      return;
    }

    // Check URL parameters for messages
    const params = new URLSearchParams(location.search);
    const success = params.get('verified');
    const error = params.get('error');
    const messageParam = params.get('message');

    if (success === 'true') {
      setSuccessMessage(messageParam || 'Email verified successfully. You can now sign in.');
      setError(''); // Clear any existing error
    } else if (error) {
      setError(messageParam || 'An error occurred');
      setSuccessMessage(''); // Clear any existing success message
    } else if (messageParam) {
      // Check if this is a success message (like password reset)
      if (messageParam.includes('successfully') || messageParam.includes('verified')) {
        setSuccessMessage(messageParam);
        setError('');
      } else {
        setError(messageParam);
        setSuccessMessage('');
      }
    }

    // Récupérer le compteur de tentatives depuis le localStorage
    const savedAttempts = localStorage.getItem(`login_attempts_${formData.email}`);
    if (savedAttempts) {
      const attempts = parseInt(savedAttempts, 10);
      setAttemptCount(attempts);
      if (attempts >= 3) {
        setShowCaptcha(true);
      }
    }
  }, [location, isAuthenticated, user, navigate, formData.email]);

  // Gérer les changements du CAPTCHA
  const handleCaptchaChange = (id, answer) => {
    setCaptchaId(id);
    setCaptchaAnswer(answer);
    // Effacer l'erreur si elle concerne le CAPTCHA
    if (error.includes('CAPTCHA')) {
      setError('');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset attempt count when email changes
    if (name === 'email') {
      const savedAttempts = localStorage.getItem(`login_attempts_${value}`);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        setAttemptCount(attempts);
        setShowCaptcha(attempts >= 3);
      } else {
        setAttemptCount(0);
        setShowCaptcha(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    // Vérifier le CAPTCHA si nécessaire
    if (showCaptcha && (!captchaId || !captchaAnswer)) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    // Préparer les données à envoyer
    const loginData = { ...formData };
    if (showCaptcha) {
      loginData.captchaId = captchaId;
      loginData.captchaAnswer = captchaAnswer;
    }

    try {
      console.log('🔐 Tentative de connexion...');
      const response = await api.post('/api/auth/login', loginData);
      
      console.log('📨 Réponse complète:', response.data);
      
      if (response.data.success) {
        // Réinitialiser le compteur de tentatives en cas de succès
        localStorage.removeItem(`login_attempts_${formData.email}`);
        setAttemptCount(0);
        setShowCaptcha(false);
        
        // Correction : gestion robuste du token et de l'utilisateur
        let token, user;
        if (response.data.token && response.data.data) {
          // Cas 1 : token à la racine, user dans data
          token = response.data.token;
          user = response.data.data;
        } else if (response.data.data && response.data.data.token && response.data.data.user) {
          // Cas 2 : tout dans data
          token = response.data.data.token;
          user = response.data.data.user;
        }

        if (token && user) {
          login(token, user);
          console.log('✅ Connexion réussie');
          console.log('👤 User data complet:', user);
          console.log('👤 User role:', user.role);
          
          // Vérification du rôle unique
          const isAdmin = user.role === 'admin' || user.role === 'superadmin';
          
          console.log('🎯 Is admin:', isAdmin);
          const redirectUrl = isAdmin ? '/admin' : '/dashboard';
          console.log('🔄 Redirecting to:', redirectUrl);
          
          navigate(redirectUrl);
        } else {
          console.error('❌ Token or user data missing');
          setError('Erreur lors de la récupération du token ou de l\'utilisateur.');
        }
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      // Incrémenter le compteur de tentatives
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      localStorage.setItem(`login_attempts_${formData.email}`, newAttemptCount.toString());
      
      // Gérer différents types d'erreurs
      if (error.response?.data?.captchaError) {
        setError('Invalid CAPTCHA. Please try again.');
        // Régénérer le CAPTCHA
        setCaptchaReset(prev => prev + 1);
        setCaptchaId('');
        setCaptchaAnswer('');
      } else if (error.response?.data?.captchaRequired || newAttemptCount >= 3) {
        setShowCaptcha(true);
        setError(error.response?.data?.message || `Too many failed attempts. CAPTCHA verification required.`);
      } else if (error.response?.status === 403) {
        setError(error.response.data.message || 'Please verify your email before signing in.');
      } else if (error.response?.status === 401) {
        setError(error.response.data.message || 'Invalid email or password.');
        // Afficher le nombre de tentatives restantes
        const remainingAttempts = 3 - newAttemptCount;
        if (remainingAttempts > 0) {
          setError(prev => `${prev} (${remainingAttempts} attempts remaining before CAPTCHA required)`);
        }
      } else {
        setError(error.response?.data?.message || 'An error occurred during login.');
      }
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour réinitialiser les tentatives
  const resetAttempts = () => {
    localStorage.removeItem(`login_attempts_${formData.email}`);
    setAttemptCount(0);
    setShowCaptcha(false);
    setError('');
    setCaptchaId('');
    setCaptchaAnswer('');
  };
  
  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
        </div>
        
        <h1 className={styles.auth_title}>Welcome back</h1>
        <p className={styles.auth_subtitle}>Sign in and let the music take you back in time!</p>
        
        <form onSubmit={handleSubmit} className={styles.auth_form}>
          {/* Success message should appear prominently at the top */}
          {successMessage && (
            <div className={styles.success_message}>
              {successMessage}
            </div>
          )}
          
          {/* Error message */}
          {error && (
            <div className={styles.error_message}>
              {error}
            </div>
          )}

          {/* Show attempt counter */}
          {attemptCount > 0 && attemptCount < 3 && (
            <div className={styles.warning_message}>
              Failed attempts: {attemptCount}/3
              {attemptCount >= 2 && (
                <span className={styles.captcha_warning}>
                  {' '}(CAPTCHA required after 3 failed attempts)
                </span>
              )}
            </div>
          )}
          
          <div className={styles.form_group}>
            <input
              type="email"
              name="email"
              placeholder="Your email"
              value={formData.email}
              onChange={handleChange}
              className={styles.form_input}
              required
            />
          </div>
          
          <div className={styles.form_group}>
            <input
              type="password"
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              className={styles.form_input}
              required
            />
          </div>

          {/* CAPTCHA conditionnel */}
          {showCaptcha && (
            <div className={styles.form_group}>
              <Captcha 
                onCaptchaChange={handleCaptchaChange}
                resetTrigger={captchaReset}
              />
            </div>
          )}
          
          <div className={styles.form_options}>
            <label className={styles.checkbox_label}>
              <input
                type="checkbox"
                name="remember"
                checked={formData.remember}
                onChange={handleChange}
              />
              Remember me
            </label>
            
            <div className={styles.forgot_password}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </div>

          {/* Reset attempts button */}
          {attemptCount > 0 && (
            <div className={styles.reset_attempts}>
              <button
                type="button"
                onClick={resetAttempts}
                className={styles.reset_attempts_btn}
              >
                Reset attempts
              </button>
            </div>
          )}
          
          <button 
            type="submit" 
            className={`${styles.btn} ${styles.btn_primary} ${styles.btn_block}`}
            disabled={loading || (showCaptcha && (!captchaId || !captchaAnswer))}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
          
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          
          <Link to="/register" className={`${styles.btn} ${styles.btn_outline} ${styles.btn_block}`}>
            Create account
          </Link>
        </form>
      </div>
      
      <div className={styles.auth_right}>
        <img 
          src="/images/banniere_gauche.png"
          alt="ThrowBack Music Experience" 
          className={styles.music_collage}
        />
      </div>
    </div>   
  );
};

export default Login;