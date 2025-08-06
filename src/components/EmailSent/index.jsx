// src/components/EmailSent/index.jsx
import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './styles.module.css';

const EmailSent = () => {
  const location = useLocation();
  const email = location.state?.email || "your registered email";
  const type = location.state?.type || 'registration';
  const customMessage = location.state?.message;
  
  const isPasswordReset = type === 'password-reset';
  
  return (
    <div className={styles.auth_container}>
      <div className={styles.auth_left}>
        <div className={styles.logo_container}>
          <img src="/images/Logo.png" alt='Logo Throwback' className={styles.logo}/>
        </div>
        
        <div className={styles.email_sent_content}>
          <h1 className={styles.auth_title}>
            {isPasswordReset ? 'Password Reset Email Sent' : 'We\'ve sent you an email'}
          </h1>
          
          <p className={styles.auth_message}>
            {customMessage || (isPasswordReset 
              ? 'Password reset instructions have been sent to:'
              : 'To complete your registration, click the link we\'ve sent to:'
            )}
            <br />
            <span className={styles.highlight_email}>{email}</span>
          </p>
          
          <div className={styles.key_info}>
            <svg className={styles.key_icon} xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"></path>
            </svg>
            <span className={styles.key_text}>
              {isPasswordReset 
                ? 'This link will allow you to set a new password.'
                : 'This link will log you in directly to your account.'
              }
            </span>
          </div>
          
          <div className={styles.additional_info}>
            <p className={styles.helper_text}>
              Check your spam/junk folder if you don't see the email in your inbox.
            </p>
            <p className={styles.helper_text}>
              The link will expire in {isPasswordReset ? '1 hour' : '24 hours'} for security reasons.
            </p>
          </div>
          
          <div className={styles.back_to_login}>
            <Link to="/login" className={styles.btn_link}>
              {isPasswordReset ? 'Back to Login' : 'Return to Login'}
            </Link>
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

export default EmailSent;