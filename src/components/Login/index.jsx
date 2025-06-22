// src/components/Login/index.jsx - VERSION CORRIGÉE
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

  // 🔧 CORRECTION: Gestion plus robuste des effets
  useEffect(() => {
    const handleRedirectAndMessages = () => {
      try {
        console.log('🔍 Login component mounted');
        console.log('🔍 Location:', location);
        console.log('🔍 Auth state:', { isAuthenticated, user });

        // Redirect if already logged in
        if (isAuthenticated && user) {
          console.log('👤 User data:', user);
          console.log('👤 User role:', user.role);
          
          const isAdmin = user.role === 'admin' || user.role === 'superadmin';
          const redirectUrl = isAdmin ? '/admin' : '/dashboard';
          console.log('🔄 Redirecting to:', redirectUrl);
          
          navigate(redirectUrl, { replace: true });
          return;
        }

        // 🔧 CORRECTION: Gestion sécurisée des paramètres URL
        const params = new URLSearchParams(location.search);
        const success = params.get('verified');
        const errorParam = params.get('error');
        const messageParam = params.get('message');

        console.log('🔍 URL Params:', { success, error: errorParam, message: messageParam });

        if (success === 'true') {
          const decodedMessage = messageParam ? 
            decodeURIComponent(messageParam) : 
            'Email verified successfully. You can now sign in.';
          setSuccessMessage(decodedMessage);
          setError('');
          console.log('✅ Success message set:', decodedMessage);
        } else if (errorParam) {
          const decodedError = messageParam ? 
            decodeURIComponent(messageParam) : 
            'An error occurred';
          setError(decodedError);
          setSuccessMessage('');
          console.log('❌ Error message set:', decodedError);
        }

        // 🔧 CORRECTION: Gestion sécurisée du localStorage
        const email = formData.email;
        if (email) {
          try {
            const savedAttempts = localStorage.getItem(`login_attempts_${email}`);
            if (savedAttempts) {
              const attempts = parseInt(savedAttempts, 10);
              if (!isNaN(attempts)) {
                setAttemptCount(attempts);
                if (attempts >= 3) {
                  setShowCaptcha(true);
                }
              }
            }
          } catch (storageError) {
            console.warn('⚠️ localStorage access failed:', storageError);
          }
        }
      } catch (error) {
        console.error('❌ Error in useEffect:', error);
        // Ne pas bloquer le rendu en cas d'erreur
      }
    };

    handleRedirectAndMessages();
  }, [location, isAuthenticated, user, navigate, formData.email]);

  // 🔧 CORRECTION: Gestion d'erreur pour le CAPTCHA
  const handleCaptchaChange = (id, answer) => {
    try {
      setCaptchaId(id);
      setCaptchaAnswer(answer);
      if (error.includes('CAPTCHA')) {
        setError('');
      }
    } catch (error) {
      console.error('❌ Captcha change error:', error);
    }
  };

  const handleChange = (e) => {
    try {
      const { name, value, type, checked } = e.target;
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));

      // Reset attempt count when email changes
      if (name === 'email') {
        try {
          const savedAttempts = localStorage.getItem(`login_attempts_${value}`);
          if (savedAttempts) {
            const attempts = parseInt(savedAttempts, 10);
            if (!isNaN(attempts)) {
              setAttemptCount(attempts);
              setShowCaptcha(attempts >= 3);
            }
          } else {
            setAttemptCount(0);
            setShowCaptcha(false);
          }
        } catch (storageError) {
          console.warn('⚠️ localStorage access failed:', storageError);
        }
      }
    } catch (error) {
      console.error('❌ Handle change error:', error);
    }
  };

  // 🔧 CORRECTION: Fonction de soumission plus robuste
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return; // Éviter les soumissions multiples
    
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      // Vérification CAPTCHA
      if (showCaptcha && (!captchaId || !captchaAnswer)) {
        setError('Please complete the CAPTCHA verification');
        return;
      }

      // Préparer les données
      const loginData = { ...formData };
      if (showCaptcha) {
        loginData.captchaId = captchaId;
        loginData.captchaAnswer = captchaAnswer;
      }

      console.log('🔐 Tentative de connexion...');
      
      // 🔧 CORRECTION: Appel API avec timeout
      const response = await Promise.race([
        api.post('/api/auth/login', loginData),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 10000)
        )
      ]);
      
      console.log('📨 Réponse reçue:', response.data);
      
      if (response.data.success) {
        // Réinitialiser les tentatives
        try {
          localStorage.removeItem(`login_attempts_${formData.email}`);
        } catch (storageError) {
          console.warn('⚠️ localStorage cleanup failed:', storageError);
        }
        
        setAttemptCount(0);
        setShowCaptcha(false);
        
        // 🔧 CORRECTION: Extraction plus robuste des données
        let token, userData;
        
        if (response.data.data) {
          token = response.data.data.token;
          userData = response.data.data.user;
        } else {
          token = response.data.token;
          userData = response.data.user;
        }

        if (token && userData) {
          console.log('✅ Données valides reçues');
          
          // 🔧 CORRECTION: Attendre que login soit terminé avant de naviguer
          try {
            await login(token, userData);
            console.log('✅ Login AuthContext terminé');
            
            const isAdmin = userData.role === 'admin' || userData.role === 'superadmin';
            const redirectUrl = isAdmin ? '/admin' : '/dashboard';
            console.log('🔄 Navigation vers:', redirectUrl);
            
            navigate(redirectUrl, { replace: true });
          } catch (loginError) {
            console.error('❌ Erreur login AuthContext:', loginError);
            setError('Erreur lors de la connexion. Veuillez réessayer.');
          }
        } else {
          console.error('❌ Données manquantes dans la réponse');
          setError('Erreur lors de la récupération des données de connexion.');
        }
      }
    } catch (error) {
      console.error('❌ Erreur de connexion:', error);
      
      // Incrémenter les tentatives
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      
      try {
        localStorage.setItem(`login_attempts_${formData.email}`, newAttemptCount.toString());
      } catch (storageError) {
        console.warn('⚠️ localStorage write failed:', storageError);
      }
      
      // 🔧 CORRECTION: Gestion d'erreurs plus spécifique
      if (error.message === 'Request timeout') {
        setError('Request timeout. Please check your connection and try again.');
      } else if (error.response?.data?.captchaError) {
        setError('Invalid CAPTCHA. Please try again.');
        setCaptchaReset(prev => prev + 1);
        setCaptchaId('');
        setCaptchaAnswer('');
      } else if (error.response?.data?.captchaRequired || newAttemptCount >= 3) {
        setShowCaptcha(true);
        setError(error.response?.data?.message || 'Too many failed attempts. CAPTCHA verification required.');
      } else if (error.response?.status === 403) {
        setError(error.response.data.message || 'Please verify your email before signing in.');
      } else if (error.response?.status === 401) {
        setError(error.response.data.message || 'Invalid email or password.');
        const remainingAttempts = 3 - newAttemptCount;
        if (remainingAttempts > 0) {
          setError(prev => `${prev} (${remainingAttempts} attempts remaining)`);
        }
      } else {
        setError(error.response?.data?.message || 'An error occurred during login.');
      }
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

  const resetAttempts = () => {
    try {
      localStorage.removeItem(`login_attempts_${formData.email}`);
      setAttemptCount(0);
      setShowCaptcha(false);
      setError('');
      setCaptchaId('');
      setCaptchaAnswer('');
    } catch (error) {
      console.error('❌ Reset attempts error:', error);
    }
  };

  // 🔧 AJOUT: Gestion d'erreur pour les images
  const handleImageError = (e, type) => {
    console.warn(`⚠️ ${type} image failed to load`);
    e.target.style.display = 'none';
  };
  
  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img 
            src="/images/Logo.png" 
            alt="ThrowBack Logo" 
            className={styles.logo}
            onError={(e) => handleImageError(e, 'Logo')}
          />
        </div>
        
        <h1 className={styles.auth_title}>Welcome back</h1>
        <p className={styles.auth_subtitle}>Sign in and let the music take you back in time!</p>
        
        <form onSubmit={handleSubmit} className={styles.auth_form}>
          {/* Success message */}
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

          {/* Attempt counter */}
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

          {/* CAPTCHA */}
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

          {/* Reset attempts */}
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
          onError={(e) => handleImageError(e, 'Banner')}
        />
      </div>
    </div>   
  );
};

export default Login; 