// src/components/Common/Unauthorized.jsx (corrigé)
import React from 'react';
import { Link } from 'react-router-dom';
import styles from './styles.module.css'; // Changer l'extension

const Unauthorized = () => {
  return (
    <div className={styles.unauthorized_container}>
      <div className={styles.unauthorized_content}>
        <h1>403</h1>
        <h2>Accès non autorisé</h2>
        <p>
          Vous n'avez pas les permissions nécessaires pour accéder à cette page.
        </p>
        <div className={styles.unauthorized_actions}>
          <Link to="/login" className={`${styles.btn} ${styles.btn_primary}`}>
            Se connecter
          </Link>
          <Link to="/dashboard" className={`${styles.btn} ${styles.btn_secondary}`}>
            Retour au tableau de bord
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;