// src/components/Login/index.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import Captcha from '../Common/Captcha';

const LS_KEYS = {
  remember: 'tb_remember',
  email: 'tb_email',
  token: 'tb_auth_token',
  user: 'tb_auth_user',
};

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

  // 1) Charger le remember/email au tout premier rendu
  useEffect(() => {
    const savedRemember = localStorage.getItem(LS_KEYS.remember) === '1';
    const savedEmail = localStorage.getItem(LS_KEYS.email) || '';
    if (savedRemember) {
      setFormData(prev => ({ ...prev, email: savedEmail, remember: true }));
      // Met à jour les tentatives liées à cet email si existantes
      const savedAttempts = localStorage.getItem(`login_attempts_${savedEmail}`);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        setAttemptCount(attempts);
        setShowCaptcha(attempts >= 3);
      }
    }
  }, []);

  useEffect(() => {
    // Redirect si déjà connecté
    if (isAuthenticated && user) {
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      navigate(isAdmin ? '/admin' : '/dashboard');
      return;
    }

    // Messages via URL
    const params = new URLSearchParams(location.search);
    const success = params.get('verified');
    const errorParam = params.get('error');
    const messageParam = params.get('message');

    if (success === 'true') {
      setSuccessMessage(messageParam || 'Email verified successfully. You can now sign in.');
      setError(''); 
    } else if (errorParam) {
      setError(messageParam || 'An error occurred');
      setSuccessMessage(''); 
    } else if (messageParam) {
      if (messageParam.includes('successfully') || messageParam.includes('verified')) {
        setSuccessMessage(messageParam);
        setError('');
      } else {
        setError(messageParam);
        setSuccessMessage('');
      }
    }

    // Récupérer le compteur pour l'email courant
    const savedAttempts = localStorage.getItem(`login_attempts_${formData.email}`);
    if (savedAttempts) {
      const attempts = parseInt(savedAttempts, 10);
      setAttemptCount(attempts);
      if (attempts >= 3) setShowCaptcha(true);
    }
  }, [location, isAuthenticated, user, navigate, formData.email]);

  // Gérer les changements du CAPTCHA
  const handleCaptchaChange = (id, answer) => {
    setCaptchaId(id);
    setCaptchaAnswer(answer);
    if (error.includes('CAPTCHA')) setError('');
  };

  // 2) Gérer les changements de champs + storage remember/email
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'remember') {
      if (checked) {
        localStorage.setItem(LS_KEYS.remember, '1');
        // Sauvegarder l’email courant si présent
        if (formData.email) localStorage.setItem(LS_KEYS.email, formData.email);
      } else {
        localStorage.removeItem(LS_KEYS.remember);
        localStorage.removeItem(LS_KEYS.email);
      }
    }

    if (name === 'email') {
      // Mettre à jour les tentatives & captcha pour ce nouvel email
      const savedAttempts = localStorage.getItem(`login_attempts_${value}`);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        setAttemptCount(attempts);
        setShowCaptcha(attempts >= 3);
      } else {
        setAttemptCount(0);
        setShowCaptcha(false);
      }
      // Si remember actif, on met aussi à jour l'email mémorisé
      const remembered = localStorage.getItem(LS_KEYS.remember) === '1';
      if (remembered) {
        localStorage.setItem(LS_KEYS.email, value);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    if (showCaptcha && (!captchaId || !captchaAnswer)) {
      setError('Please complete the CAPTCHA verification');
      setLoading(false);
      return;
    }

    const loginData = { ...formData };
    if (showCaptcha) {
      loginData.captchaId = captchaId;
      loginData.captchaAnswer = captchaAnswer;
    }

    try {
      const response = await api.post('/api/auth/login', loginData);
      if (response.data.success) {
        // reset tentatives
        localStorage.removeItem(`login_attempts_${formData.email}`);
        setAttemptCount(0);
        setShowCaptcha(false);
        
        // Récup token/user selon payload
        let token, userObj;
        if (response.data.token && response.data.data) {
          token = response.data.token;
          userObj = response.data.data;
        } else if (response.data.data?.token && response.data.data?.user) {
          token = response.data.data.token;
          userObj = response.data.data.user;
        }

        if (token && userObj) {
          // 3) Persister selon remember
          if (formData.remember) {
            localStorage.setItem(LS_KEYS.token, token);
            localStorage.setItem(LS_KEYS.user, JSON.stringify(userObj));
            localStorage.setItem(LS_KEYS.remember, '1');
            if (formData.email) localStorage.setItem(LS_KEYS.email, formData.email);
          } else {
            sessionStorage.setItem(LS_KEYS.token, token);
            sessionStorage.setItem(LS_KEYS.user, JSON.stringify(userObj));
            // Ne pas garder le flag remember/email
            localStorage.removeItem(LS_KEYS.remember);
            // On laisse tb_email si tu veux pré-remplir, sinon décommente la ligne suivante:
            // localStorage.removeItem(LS_KEYS.email);
          }

          // Optionnel : si ton AuthContext accepte une option remember
          try {
            login(token, userObj, { remember: formData.remember });
          } catch {
            // fallback si signature différente
            login(token, userObj);
          }

          const isAdmin = userObj.role === 'admin' || userObj.role === 'superadmin';
          navigate(isAdmin ? '/admin' : '/dashboard');
        } else {
          setError('Erreur lors de la récupération du token ou de l’utilisateur.');
        }
      }
    } catch (error) {
      const newAttemptCount = attemptCount + 1;
      setAttemptCount(newAttemptCount);
      localStorage.setItem(`login_attempts_${formData.email}`, newAttemptCount.toString());
      
      if (error.response?.data?.captchaError) {
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
        let msg = error.response.data.message || 'Invalid email or password.';
        const remainingAttempts = 3 - newAttemptCount;
        if (remainingAttempts > 0) msg = `${msg} (${remainingAttempts} attempts remaining before CAPTCHA required)`;
        setError(msg);
      } else {
        setError(error.response?.data?.message || 'An error occurred during login.');
      }
      setSuccessMessage('');
    } finally {
      setLoading(false);
    }
  };

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
