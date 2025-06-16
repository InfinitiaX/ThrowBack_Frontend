// src/components/ForgotPassword/index.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';
import Captcha from '../Common/Captcha';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [captchaId, setCaptchaId] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaReset, setCaptchaReset] = useState(0);
  const navigate = useNavigate();

  // Gérer les changements du CAPTCHA
  const handleCaptchaChange = (id, answer) => {
    setCaptchaId(id);
    setCaptchaAnswer(answer);
    // Effacer l'erreur si elle concerne le CAPTCHA
    if (error.includes('CAPTCHA')) {
      setError('');
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    
    if (!captchaId || !captchaAnswer) {
      setError('Please complete the CAPTCHA verification');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Utiliser l'instance API correcte avec CAPTCHA
      const response = await api.post('/api/auth/forgot-password', { 
        email,
        captchaId,
        captchaAnswer
      });
      
      if (response.data.success) {
        // Rediriger vers email sent page avec type spécial pour reset password
        navigate('/email-sent', { 
          state: { 
            email: email,
            type: 'password-reset',
            message: 'Password reset instructions have been sent to your email address.'
          } 
        });
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      
      // Gérer les erreurs spécifiques
      if (err.response?.data?.captchaError) {
        setError('Invalid CAPTCHA. Please try again.');
        // Déclencher la régénération du CAPTCHA
        setCaptchaReset(prev => prev + 1);
      } else {
        setError(err.response?.data?.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
        </div>
        
        <h1 className={styles.auth_title}>Reset your password</h1>
        <p className={styles.auth_subtitle}>
          Enter the verified email address linked to your account, and we will
          send you a link to reset your password.
        </p>
        
        <form onSubmit={handleForgotPassword} className={styles.auth_form}>
          {error && <div className={styles.error_message}>{error}</div>}
          
          <div className={styles.form_group}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={styles.form_input}
              required
            />
          </div>
          
          {/* Composant CAPTCHA */}
          <div className={styles.form_group}>
            <Captcha 
              onCaptchaChange={handleCaptchaChange}
              resetTrigger={captchaReset}
            />
          </div>
          
          <button
            type="submit"
            className={`${styles.btn} ${styles.btn_primary}`}
            disabled={loading || !captchaId || !captchaAnswer}
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </form>
        
        <div className={styles.auth_links}>
          <Link to="/login">Back to login</Link>
        </div>
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

export default ForgotPassword;