// src/components/Dashboard/UserDashboard/Home.jsx
import React from 'react';
import styles from './styles.module.css';

const Home = () => (
  <main className={styles.main_content}>
    <div className={styles.welcome_section}>
      <h1 className={styles.friendly_message}>Friendly Message</h1>
      <p className={styles.playlist_title}>My ThrowBack Playlist</p>
    </div>
    
    <div className={styles.dashboard_grid}>
      <div className={styles.card}>
        <div className={styles.card_header}>
          <h2>Mes Playlists</h2>
          <div className={styles.card_icon}>🎵</div>
        </div>
        <p className={styles.card_description}>
          Créez et gérez vos playlists musicales personnalisées
        </p>
        <button className={styles.card_button}>
          Voir mes playlists
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.card_header}>
          <h2>Mes Vidéos</h2>
          <div className={styles.card_icon}>📹</div>
        </div>
        <p className={styles.card_description}>
          Parcourez et organisez vos vidéos favorites
        </p>
        <button className={styles.card_button}>
          Voir mes vidéos
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.card_header}>
          <h2>Mon Profil</h2>
          <div className={styles.card_icon}>👤</div>
        </div>
        <p className={styles.card_description}>
          Modifiez vos informations personnelles et préférences
        </p>
        <button className={styles.card_button}>
          Modifier mon profil
        </button>
      </div>

      <div className={styles.card}>
        <div className={styles.card_header}>
          <h2>Découvrir</h2>
          <div className={styles.card_icon}>🔍</div>
        </div>
        <p className={styles.card_description}>
          Explorez de nouvelles musiques et découvertes
        </p>
        <button className={styles.card_button}>
          Explorer
        </button>
      </div>
    </div>
  </main>
);

export default Home;
