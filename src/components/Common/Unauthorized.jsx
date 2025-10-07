// src/components/Common/Unauthorized.jsx (corrigé)
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css'; // Changer l'extension

const Unauthorized = () => {
  return (
    <div className={styles.unauthorized_container}>
      <div className={styles.unauthorized_content}>
        <h1>403</h1>
        <h2>Unauthorized access</h2>
        <p>
          You do not have the necessary permissions to access this page.
        </p>
        <div className={styles.unauthorized_actions}>
          <Link to="/login" className={`${styles.btn} ${styles.btn_primary}`}>
            Go to login
          </Link>
          <Link to="/dashboard" className={`${styles.btn} ${styles.btn_secondary}`}>
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;