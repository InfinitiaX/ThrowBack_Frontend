import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faEye, faHeart, faMusic, faGlobe, faLock, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import styles from './PlaylistCard.module.css';

const PlaylistCard = ({ playlist }) => {
  const navigate = useNavigate();
  const go = () => navigate(`/dashboard/playlists/${playlist._id}`);
  const play = (e) => { e.stopPropagation(); navigate(`/dashboard/playlists/${playlist._id}/play`); };

  const vis = playlist.visibilite === 'PRIVE' ? faLock : (playlist.visibilite === 'AMIS' ? faUserFriends : faGlobe);
  const fmt = (n)=> !n ? '0' : n>=1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n>=1_000 ? `${(n/1_000).toFixed(1)}K` : n;
  
  const getInitials = () => {
    const owner = playlist.proprietaire || {};
    const nom = owner.nom || '';
    const prenom = owner.prenom || '';
    let initials = '';
    if (prenom) initials += prenom.charAt(0).toUpperCase();
    if (nom) initials += nom.charAt(0).toUpperCase();
    return initials || 'PL';
  };
  
  const getBackgroundColor = () => {
    const colors = [
      '#4a6fa5', '#6fb98f', '#2c786c', '#f25f5c', '#a16ae8', 
      '#ffa600', '#58508d', '#bc5090', '#ff6361', '#003f5c'
    ];
    if (!playlist._id) return colors[0];
    const sum = playlist._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  return (
    <div className={styles.playlistCard} onClick={go}>
      <div className={styles.imageContainer}>
        <div 
          className={styles.initialsContainer}
          style={{ backgroundColor: getBackgroundColor() }}
        >
          <span className={styles.initials}>{getInitials()}</span>
        </div>
        <div className={styles.overlay}>
          <button className={styles.playButton} onClick={play}><FontAwesomeIcon icon={faPlay}/></button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{playlist.nom || 'Playlist'}</h3>
          <div className={styles.visibility}><FontAwesomeIcon icon={vis}/></div>
        </div>
        <p className={styles.description}>{playlist.description || 'No description'}</p>
        <div className={styles.stats}>
          <span><FontAwesomeIcon icon={faMusic}/> {playlist.nb_videos || playlist.videos?.length || 0} videos</span>
          <span><FontAwesomeIcon icon={faEye}/> {fmt(playlist.nb_lectures || 0)}</span>
          <span><FontAwesomeIcon icon={faHeart}/> {fmt(playlist.nb_favoris || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
