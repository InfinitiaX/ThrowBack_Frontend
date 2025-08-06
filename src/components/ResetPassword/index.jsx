import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styles from './styles.module.css';
import axios from 'axios';

const ResetPassword = () => {
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState('');
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    console.log("🔍 ResetPassword component mounted");
    console.log("📍 Current URL:", window.location.href);
    
    // Get token from URL - AVEC GESTION DE LA REDIRECTION GOOGLE
    const params = new URLSearchParams(window.location.search);
    let tokenParam = params.get('token');
    const messageParam = params.get('message');
    
    console.log("📝 URL Parameters:", params.toString());
    console.log("- Initial token:", tokenParam);
    
    // Vérifier si c'est une redirection Google (présence du paramètre q)
    if (!tokenParam && params.has('q')) {
      try {
        // Extraire l'URL originale de la redirection Google
        const googleRedirectUrl = params.get('q');
        console.log("📦 Détection redirection Google. URL originale:", googleRedirectUrl);
        
        // Décoder l'URL et extraire les paramètres
        const originalUrl = decodeURIComponent(googleRedirectUrl);
        console.log("📦 URL décodée:", originalUrl);
        
        // Utiliser URL API pour analyser l'URL et extraire les paramètres
        const originalUrlObj = new URL(originalUrl);
        const originalParams = new URLSearchParams(originalUrlObj.search);
        tokenParam = originalParams.get('token');
        
        console.log("🔑 Token extrait de la redirection Google:", tokenParam);
        
        // Nettoyer l'URL en redirigeant vers l'URL correcte si token trouvé
        if (tokenParam) {
          const cleanUrl = `/reset-password?token=${tokenParam}`;
          console.log("🧹 Nettoyage de l'URL:", cleanUrl);
          window.history.replaceState({}, '', cleanUrl);
        }
      } catch (e) {
        console.error("❌ Échec de l'extraction du token:", e);
      }
    }
    
    console.log("📝 Valeur finale du token:", tokenParam);
    
    if (tokenParam) {
      setToken(tokenParam);
      console.log("✅ Token défini avec succès");
      if (messageParam) {
        setMessage(messageParam);
        console.log("✅ Message défini avec succès");
      }
    } else {
      console.log("❌ Aucun token trouvé dans l'URL");
      setError('Token manquant. Veuillez demander une nouvelle réinitialisation de mot de passe.');
      
      // Rediriger vers forgot-password après 3 secondes si pas de token
      setTimeout(() => {
        navigate('/forgot-password');
      }, 3000);
    }
  }, [location, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    console.log("🚀 Submit password reset");
    console.log("📝 Using token:", token);

    // Check if passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    // Check minimum password length
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      console.log("📡 API Call to:", `${backendUrl}/api/auth/reset-password`);
      
      const response = await axios.put(`${backendUrl}/api/auth/reset-password`, {
        token,
        password: formData.password
      });
      
      console.log("✅ Password reset successful:", response.data);
      
      if (response.data.success) {
        setMessage('Password reset successfully!');
        setTimeout(() => {
          navigate('/login?message=Password reset successfully. You can now sign in with your new password.');
        }, 2000);
      }
    } catch (error) {
      console.error('❌ Password reset error:', error);
      setError(error.response?.data?.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Si pas de token, afficher message d'erreur et lien
  if (!token && !loading) {
    return (
      <div className={styles.auth_container}>
        <div className={styles.auth_left}>
          <div className={styles.logo_container}>
            <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
          </div>
          
          <div className={styles.error_state}>
            <h1 className={styles.auth_title}>Invalid Reset Link</h1>
            <p className={styles.error_message}>
              This password reset link is invalid or has expired.
            </p>
            <p className={styles.auth_subtitle}>
              Please request a new password reset.
            </p>
            
            <a href="/forgot-password" className={`${styles.btn} ${styles.btn_primary}`}>
              Request New Reset
            </a>
          </div>
        </div>
        
        <div className={styles.auth_right}>
          <img 
            src="/images/bannière_gauche.png" 
            alt="ThrowBack Music Experience" 
            className={styles.music_collage} 
          />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
        </div>
        
        <h1 className={styles.auth_title}>Create new password</h1>
        <p className={styles.auth_subtitle}>
          Please enter and confirm your new password below.
        </p>
        
        <form onSubmit={handleSubmit} className={styles.auth_form}>
          {error && <div className={styles.error_message}>{error}</div>}
          {message && <div className={styles.success_message}>{message}</div>}
          
          <div className={styles.form_group}>
            <label htmlFor="password">New password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your new password"
              value={formData.password}
              onChange={handleChange}
              className={styles.form_input}
              required
              minLength="6"
            />
          </div>
          
          <div className={styles.form_group}>
            <label htmlFor="confirmPassword">Confirm password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your new password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={styles.form_input}
              required
            />
          </div>
          
          <button
            type="submit"
            className={`${styles.btn} ${styles.btn_primary}`}
            disabled={loading || !token}
          >
            {loading ? 'Resetting...' : 'Reset password'}
          </button>
          
          {/* Debug info en mode développement */}
          {process.env.NODE_ENV === 'development' && (
            <div style={{ marginTop: '20px', padding: '10px', background: '#f0f0f0', fontSize: '12px' }}>
              <strong>Debug Info:</strong><br/>
              Token present: {token ? '✅ Yes' : '❌ No'}<br/>
              Token value: {token || 'None'}<br/>
              Current URL: {window.location.href}
            </div>
          )}
        </form>
      </div>
      
      <div className={styles.auth_right}>
        <img 
          src="/images/bannière_gauche.png" 
          alt="ThrowBack Music Experience" 
          className={styles.music_collage} 
        />
      </div>
    </div>
  );
};

export default ResetPassword;