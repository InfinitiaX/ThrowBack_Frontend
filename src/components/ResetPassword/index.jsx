// src/components/ResetPassword/index.jsx
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
    // Get token from URL
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    const messageParam = params.get('message');

    if (tokenParam) {
      setToken(tokenParam);
      if (messageParam) {
        setMessage(messageParam);
      }
    } else {
      // If no token in URL, coming directly
      setError('Missing token. Please request a new password reset.');
    }
  }, [location]);

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
      // Appel direct au backend en utilisant axios
      const backendUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';
      const response = await axios.put(`${backendUrl}/api/auth/reset-password`, {
        token,
        password: formData.password
      });
      
      if (response.data.success) {
        setMessage('Password reset successfully!');
        setTimeout(() => {
          navigate('/login?message=Password reset successfully. You can now sign in with your new password.');
        }, 2000);
      }
    } catch (error) {
      console.error('Error:', error);
      setError(error.response?.data?.message || 'An error occurred');
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