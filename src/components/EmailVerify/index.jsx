// src/components/EmailVerify/index.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import styles from './styles.module.css';
import api from '../../utils/api';

const EmailVerify = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const [email, setEmail] = useState('');
  const [counter, setCounter] = useState(59);
  const [canResend, setCanResend] = useState(false);
  const [validUrl, setValidUrl] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    // Get email from location state if available
    if (location.state && location.state.email) {
      setEmail(location.state.email);
    }
  }, [location]);
  
  useEffect(() => {
    // Automatically verify if we have URL params
    if (params.id && params.token) {
      verifyEmailUrl();
    }
  }, [params]);
  
  useEffect(() => {
    // Set up countdown timer
    if (counter > 0 && !canResend) {
      const timer = setTimeout(() => setCounter(counter - 1), 1000);
      return () => clearTimeout(timer);
    } else if (counter === 0 && !canResend) {
      setCanResend(true);
    }
  }, [counter, canResend]);
  
  const verifyEmailUrl = async () => {
    try {
      setIsVerifying(true);
      // Use the correct API endpoint
      const response = await api.get(`/api/auth/verify/${params.id}/${params.token}`);
      
      if (response.data.success) {
        setValidUrl(true);
        setMessage('Email verified successfully!');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login?verified=true&message=Email verified successfully. You can now sign in.');
        }, 3000);
      }
    } catch (error) {
      console.error('Verification error:', error);
      setValidUrl(false);
      setMessage(error.response?.data?.message || 'Invalid verification link');
    } finally {
      setIsVerifying(false);
    }
  };
  
  const handleResend = async () => {
    // Reset the counter and disable resend button
    setCounter(59);
    setCanResend(false);
    
    try {
      if (email) {
        await api.post('/api/auth/resend-verification', { email });
        setMessage('Verification email sent successfully!');
      }
    } catch (error) {
      console.error('Error resending verification email:', error);
      setMessage('Error resending email');
    }
  };
  
  const handleGoToLogin = () => {
    navigate('/login');
  };

  // Display for automatic verification
  if (params.id && params.token) {
    return (
      <div className={styles.auth_container}>
        <div className={styles.auth_left}>
          <div className={styles.logo_container}>
            <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
          </div>
          
          <div className={styles.verify_content}>
            {isVerifying ? (
              <>
                <h1 className={styles.auth_title}>Verifying...</h1>
                <p className={styles.auth_message}>Please wait</p>
              </>
            ) : (
              <>
                <h1 className={styles.auth_title}>
                  {validUrl ? 'Email Verified!' : 'Verification Failed'}
                </h1>
                <p className={styles.auth_message}>{message}</p>
                
                {!validUrl && (
                  <button onClick={handleGoToLogin} className={styles.signin_link}>
                    Back to Login
                  </button>
                )}
              </>
            )}
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
  
  // Default display (verification waiting page)
  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt="ThrowBack Logo" className={styles.logo} />
        </div>
        
        <div className={styles.verify_content}>
          <h1 className={styles.auth_title}>Verify your email</h1>
          
          <p className={styles.auth_message}>
            A verification link has been sent to your email address.
            Click the link to activate your account.
          </p>
          
          <p className={styles.auth_instruction}>
            Open your email application.
          </p>
          
          <div className={styles.resend_container}>
            {canResend ? (
              <button onClick={handleResend} className={styles.resend_link}>
                Resend verification link
              </button>
            ) : (
              <span className={styles.resend_counter}>
                Resend verification link ({counter} sec)
              </span>
            )}
          </div>
          
          <div className={styles.signin_link_container}>
            <button onClick={handleGoToLogin} className={styles.signin_link}>
              Back to Login
            </button>
          </div>
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

export default EmailVerify;
