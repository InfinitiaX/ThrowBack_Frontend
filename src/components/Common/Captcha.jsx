// src/components/Common/Captcha.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import styles from './Captcha.module.css';

const Captcha = ({ onCaptchaChange, resetTrigger }) => {
  const [captcha, setCaptcha] = useState(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Générer un nouveau CAPTCHA
  const generateCaptcha = async (type = 'math') => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com '}/api/captcha/generate?type=${type}`
      );
      
      if (response.data.success) {
        setCaptcha(response.data.data);
        setUserAnswer('');
        // Notifier le parent des changements
        onCaptchaChange(response.data.data.captchaId, '');
      }
    } catch (error) {
      console.error('Erreur génération CAPTCHA:', error);
      setError('Erreur lors de la génération du CAPTCHA');
    } finally {
      setLoading(false);
    }
  };

  // Effet pour générer un CAPTCHA initial
  useEffect(() => {
    generateCaptcha();
  }, []);

  // Effet pour régénérer le CAPTCHA quand resetTrigger change
  useEffect(() => {
    if (resetTrigger) {
      generateCaptcha();
    }
  }, [resetTrigger]);

  // Gérer le changement de réponse
  const handleAnswerChange = (e) => {
    const value = e.target.value;
    setUserAnswer(value);
    
    // Notifier le parent
    if (captcha) {
      onCaptchaChange(captcha.captchaId, value);
    }
  };

  if (loading) {
    return (
      <div className={styles.captcha_container}>
        <div className={styles.captcha_loading}>Loading CAPTCHA...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.captcha_container}>
        <div className={styles.captcha_error}>
          {error}
          <button 
            onClick={() => generateCaptcha()} 
            className={styles.captcha_retry}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.captcha_container}>
      <div className={styles.captcha_wrapper}>
        <div className={styles.captcha_question}>
          <div className={styles.captcha_label}>Solve this to verify you're human:</div>
          {captcha && (
            <div className={styles.captcha_display}>
              {captcha.question ? (
                // CAPTCHA mathématique
                <span className={styles.math_question}>
                  {captcha.question} = ?
                </span>
              ) : (
                // CAPTCHA textuel
                <span className={styles.text_captcha}>
                  {captcha.text}
                </span>
              )}
            </div>
          )}
        </div>
        
        <div className={styles.captcha_input_wrapper}>
          <input
            type="text"
            value={userAnswer}
            onChange={handleAnswerChange}
            placeholder="Enter your answer"
            className={styles.captcha_input}
            autoComplete="off"
          />
          <button 
            type="button" 
            onClick={() => generateCaptcha()}
            className={styles.captcha_refresh}
            title="Generate new CAPTCHA"
          >
            🔄
          </button>
        </div>
      </div>
    </div>
  );
};

export default Captcha;