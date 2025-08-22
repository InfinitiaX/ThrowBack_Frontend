import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faEye, faHeart, faMusic, faGlobe, faLock, faUserFriends } from '@fortawesome/free-solid-svg-icons';
import styles from './PlaylistCard.module.css';

const PlaylistCard = ({ playlist }) => {
  const navigate = useNavigate();
  const baseUrl = process.env.REACT_APP_API_URL || '';
  const img = (p) => !p ? '/images/playlist-placeholder.jpg' : (p.startsWith('http') ? p : `${baseUrl}${p.startsWith('/')?p:`/${p}`}`);
  const go = () => navigate(`/dashboard/playlists/${playlist._id}`);
  const play = (e) => { e.stopPropagation(); navigate(`/dashboard/playlists/${playlist._id}/play`); };

  const vis = playlist.visibilite === 'PRIVE' ? faLock : (playlist.visibilite === 'AMIS' ? faUserFriends : faGlobe);
  const fmt = (n)=> !n ? '0' : n>=1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n>=1_000 ? `${(n/1_000).toFixed(1)}K` : n;

  return (
    <div className={styles.playlistCard} onClick={go}>
      <div className={styles.imageContainer}>
        <img src={img(playlist.image_couverture)} alt={playlist.nom || 'Playlist'}
             className={styles.playlistImage}
             onError={(e)=>{e.currentTarget.src='/images/playlist-placeholder.jpg';}} />
        <div className={styles.overlay}>
          <button className={styles.playButton} onClick={play}><FontAwesomeIcon icon={faPlay}/></button>
        </div>
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{playlist.nom || 'Playlist'}</h3>
          <div className={styles.visibility}><FontAwesomeIcon icon={vis}/></div>
        </div>
        <p className={styles.description}>{playlist.description || 'Aucune description'}</p>
        <div className={styles.stats}>
          <span><FontAwesomeIcon icon={faMusic}/> {playlist.nb_videos || playlist.videos?.length || 0} vidéos</span>
          <span><FontAwesomeIcon icon={faEye}/> {fmt(playlist.nb_lectures || 0)}</span>
          <span><FontAwesomeIcon icon={faHeart}/> {fmt(playlist.nb_favoris || 0)}</span>
        </div>
      </div>
    </div>
  );
};

export default PlaylistCard;
