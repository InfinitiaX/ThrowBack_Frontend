// src/components/Register/index.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.confirmEmail || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (formData.email !== formData.confirmEmail) {
      setError('Email addresses do not match');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least 8 characters, including one uppercase letter, one lowercase letter, and one number');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const response = await api.post('/api/auth/register', {
        nom: formData.lastName,
        prenom: formData.firstName,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: true
      });
      
      if (response.data && response.data.success) {
        // Redirect to email sent page with email in state
        navigate('/email-sent', { 
          state: { email: formData.email } 
        });
      } else {
        setError('Unexpected server response');
      }
    } catch (err) {
      console.error('Registration error:', err);
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('Connection error. Please check if the backend server is running.');
      } else {
        setError('An error occurred during registration');
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
        
        <form onSubmit={handleSubmit} className={styles.auth_form}>
          {error && <div className={styles.error_message}>{error}</div>}
          
          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="firstName">First Name :</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="Enter your name.."
                value={formData.firstName}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
            
            <div className={styles.form_group}>
              <label htmlFor="lastName">Last Name :</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Enter your name.."
                value={formData.lastName}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
          </div>
          
          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="email">Email :</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
            
            <div className={styles.form_group}>
              <label htmlFor="confirmEmail">Confirm Email :</label>
              <input
                type="email"
                id="confirmEmail"
                name="confirmEmail"
                placeholder="Enter your email"
                value={formData.confirmEmail}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
          </div>
          
          <div className={styles.form_row}>
            <div className={styles.form_group}>
              <label htmlFor="password">Password :</label>
              <input
                type="password"
                id="password"
                name="password"
                placeholder="xxxxxxxx"
                value={formData.password}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
            
            <div className={styles.form_group}>
              <label htmlFor="confirmPassword">Confirm Password :</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="xxxxxxxx"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`${styles.form_input} ${styles.light_bg}`}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            className={`${styles.btn} ${styles.btn_primary} ${styles.btn_block}`}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Sign up now'}
          </button>
          
          <div className={styles.divider}>
            <span>OR</span>
          </div>
          
          <Link to="/login" className={`${styles.btn} ${styles.btn_outline} ${styles.btn_block}`}>
            Login now
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

export default Register;