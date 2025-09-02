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
  password: 'tb_password', // NEW: mot de passe (obfusqué)
  token: 'tb_auth_token',
  user: 'tb_auth_user',
};

// Helpers d'obfuscation légère (⚠️ pas une vraie crypto)
const encode = (str) => {
  try { return btoa(unescape(encodeURIComponent(str))); } catch { return ''; }
};
const decode = (str) => {
  try { return decodeURIComponent(escape(atob(str))); } catch { return ''; }
};

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false); // NEW: œil
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

  // Charger remember/email/password au premier rendu
  useEffect(() => {
    const savedRemember = localStorage.getItem(LS_KEYS.remember) === '1';
    const savedEmail = localStorage.getItem(LS_KEYS.email) || '';
    const savedPwdEnc = localStorage.getItem(LS_KEYS.password) || '';
    const savedPassword = savedPwdEnc ? decode(savedPwdEnc) : '';

    if (savedRemember) {
      setFormData(prev => ({
        ...prev,
        email: savedEmail,
        password: savedPassword,
        remember: true
      }));
      const savedAttempts = localStorage.getItem(`login_attempts_${savedEmail}`);
      if (savedAttempts) {
        const attempts = parseInt(savedAttempts, 10);
        setAttemptCount(attempts);
        setShowCaptcha(attempts >= 3);
      }
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      const isAdmin = user.role === 'admin' || user.role === 'superadmin';
      navigate(isAdmin ? '/admin' : '/dashboard');
      return;
    }

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

    const savedAttempts = localStorage.getItem(`login_attempts_${formData.email}`);
    if (savedAttempts) {
      const attempts = parseInt(savedAttempts, 10);
      setAttemptCount(attempts);
      if (attempts >= 3) setShowCaptcha(true);
    }
  }, [location, isAuthenticated, user, navigate, formData.email]);

  const handleCaptchaChange = (id, answer) => {
    setCaptchaId(id);
    setCaptchaAnswer(answer);
    if (error.includes('CAPTCHA')) setError('');
  };

  // Gérer les changements + persistance email/password si remember actif
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (name === 'remember') {
      if (checked) {
        localStorage.setItem(LS_KEYS.remember, '1');
        if (formData.email) localStorage.setItem(LS_KEYS.email, formData.email);
        if (formData.password) localStorage.setItem(LS_KEYS.password, encode(formData.password));
      } else {
        localStorage.removeItem(LS_KEYS.remember);
        localStorage.removeItem(LS_KEYS.email);
        localStorage.removeItem(LS_KEYS.password);
      }
    }

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
      if (localStorage.getItem(LS_KEYS.remember) === '1') {
        localStorage.setItem(LS_KEYS.email, value);
      }
    }

    if (name === 'password') {
      if (localStorage.getItem(LS_KEYS.remember) === '1') {
        localStorage.setItem(LS_KEYS.password, encode(value));
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
        localStorage.removeItem(`login_attempts_${formData.email}`);
        setAttemptCount(0);
        setShowCaptcha(false);
        
        let token, userObj;
        if (response.data.token && response.data.data) {
          token = response.data.token;
          userObj = response.data.data;
        } else if (response.data.data?.token && response.data.data?.user) {
          token = response.data.data.token;
          userObj = response.data.data.user;
        }

        if (token && userObj) {
          if (formData.remember) {
            localStorage.setItem(LS_KEYS.token, token);
            localStorage.setItem(LS_KEYS.user, JSON.stringify(userObj));
            localStorage.setItem(LS_KEYS.remember, '1');
            if (formData.email) localStorage.setItem(LS_KEYS.email, formData.email);
            if (formData.password) localStorage.setItem(LS_KEYS.password, encode(formData.password));
          } else {
            sessionStorage.setItem(LS_KEYS.token, token);
            sessionStorage.setItem(LS_KEYS.user, JSON.stringify(userObj));
            localStorage.removeItem(LS_KEYS.remember);
            // Laisse ou supprime l’email/mot de passe mémorisés selon ta politique:
            localStorage.removeItem(LS_KEYS.email);
            localStorage.removeItem(LS_KEYS.password);
          }

          try {
            login(token, userObj, { remember: formData.remember });
          } catch {
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
        
        <form onSubmit={handleSubmit} className={styles.auth_form} autoComplete="on">
          {successMessage && <div className={styles.success_message}>{successMessage}</div>}
          {error && <div className={styles.error_message}>{error}</div>}

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
              autoComplete="email"
              required
            />
          </div>
          
          {/* Password + œil */}
          <div className={`${styles.form_group} ${styles.password_wrapper || ''}`}>
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="Your password"
              value={formData.password}
              onChange={handleChange}
              className={styles.form_input}
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(p => !p)}
              className={styles.eye_btn || ''}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {/* petit SVG œil/œil barré */}
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M2 5.27 3.28 4l16.97 16.97-1.27 1.27-2.26-2.26A11.36 11.36 0 0 1 12 20C6 20 2 12 2 12a20.7 20.7 0 0 1 5.06-6.58L2 5.27zm7.73 7.73a2.27 2.27 0 0 0 3.27 3.27l-3.27-3.27zM12 6c6 0 10 8 10 8a20.7 20.7 0 0 1-3.3 4.46l-1.43-1.43A11.36 11.36 0 0 0 22 14s-4-8-10-8a11.36 11.36 0 0 0-4.46 1.73L6.1 6.29A13.48 13.48 0 0 1 12 6zm0 3a5 5 0 0 1 5 5c0 .7-.14 1.37-.38 1.98l-1.57-1.57c.06-.14.1-.29.1-.45a3.15 3.15 0 0 0-3.15-3.15c-.16 0-.31.04-.45.1L9.02 9.38A4.9 4.9 0 0 1 12 9z"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5c7 0 11 7 11 7s-4 7-11 7S1 12 1 12 5 5 12 5zm0 2C7.5 7 4.1 10.6 3.2 12c.9 1.4 4.3 5 8.8 5s7.9-3.6 8.8-5c-.9-1.4-4.3-5-8.8-5zm0 2.5A2.5 2.5 0 1 1 9.5 12 2.5 2.5 0 0 1 12 9.5z"/>
                </svg>
              )}
            </button>
          </div>

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
          
          <div className={styles.divider}><span>OR</span></div>
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
