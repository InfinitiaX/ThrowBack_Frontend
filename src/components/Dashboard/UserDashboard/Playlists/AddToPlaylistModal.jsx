import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faSearch, faPlus, faCheck, faLock, faGlobe, faUserFriends, faSpinner } from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import styles from './AddToPlaylistModal.module.css';

const AddToPlaylistModal = ({ isOpen, onClose, video, existingPlaylists = [] }) => {
  const { user } = useAuth();
  const [playlists, setPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [adding, setAdding] = useState({});

  const baseUrl = process.env.REACT_APP_API_URL || '';
  const img = (p) => !p ? '/images/playlist-placeholder.jpg' : (p.startsWith('http')?p:`${baseUrl}${p.startsWith('/')?p:`/${p}`}`);

  useEffect(() => {
    const load = async () => {
      if (!isOpen || !user) return;
      try {
        setLoading(true);
        const mine = await playlistAPI.getUserPlaylists();
        const withStatus = (mine || []).map(pl => ({ ...pl, hasVideo: existingPlaylists.includes(pl._id) }));
        setPlaylists(withStatus);
      } catch (e) {
        setPlaylists([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [isOpen, user, existingPlaylists]);

  const add = async (playlistId) => {
    try {
      setAdding(a=>({ ...a, [playlistId]: true }));
      await playlistAPI.addVideoToPlaylist(playlistId, video._id);
      setPlaylists(pls => pls.map(p => p._id === playlistId ? { ...p, hasVideo:true } : p));
    } finally {
      setAdding(a=>({ ...a, [playlistId]: false }));
    }
  };

  if (!isOpen) return null;

  const filtered = playlists.filter(p => p.nom?.toLowerCase().includes(searchTerm.toLowerCase()));
  const vis = (v) => v==='PRIVE' ? <FontAwesomeIcon icon={faLock}/> : v==='AMIS' ? <FontAwesomeIcon icon={faUserFriends}/> : <FontAwesomeIcon icon={faGlobe}/>;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>Add to a playlist</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Close"><FontAwesomeIcon icon={faTimes}/></button>
        </div>

        <div className={styles.videoPreview}>
          <div className={styles.videoThumbnail}>
            <img src={img(video.thumbnail) || '/images/video-placeholder.jpg'} alt={video.titre || 'Video'}
                 onError={(e)=>{e.currentTarget.src='/images/video-placeholder.jpg';}} />
          </div>
          <div className={styles.videoInfo}>
            <h3 className={styles.videoTitle}>{video.titre || 'Video'}</h3>
            <p className={styles.videoArtist}>{video.artiste || 'Artist'}</p>
          </div>
        </div>

        <div className={styles.searchContainer}>
          <FontAwesomeIcon className={styles.searchIcon} icon={faSearch}/>
          <input className={styles.searchInput} value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} placeholder="Search..." />
        </div>

        {loading ? (
          <div className={styles.loading}><FontAwesomeIcon icon={faSpinner} spin/> Loading…</div>
        ) : (
          <div className={styles.playlistsList}>
            {filtered.length === 0 ? (
              <div className={styles.empty}>No playlist</div>
            ) : filtered.map(pl => (
              <div key={pl._id} className={styles.item}>
                <div className={styles.left}>
                  <img src={img(pl.image_couverture)} alt={pl.nom} onError={(e)=>{e.currentTarget.src='/images/playlist-placeholder.jpg';}}/>
                  <div className={styles.meta}>
                    <div className={styles.name}>{pl.nom}</div>
                    <div className={styles.desc}>{pl.nb_videos || pl.videos?.length || 0} videos</div>
                  </div>
                </div>
                <div className={styles.right}>
                  <span className={styles.visibility}>{vis(pl.visibilite)}</span>
                  <button
                    className={`${styles.addBtn} ${pl.hasVideo ? styles.added : ''}`}
                    onClick={()=>add(pl._id)}
                    disabled={pl.hasVideo || adding[pl._id]}
                  >
                    {pl.hasVideo ? (<><FontAwesomeIcon icon={faCheck}/> Added</>) : adding[pl._id] ? (<FontAwesomeIcon icon={faSpinner} spin/>) : (<><FontAwesomeIcon icon={faPlus}/> Add</>)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddToPlaylistModal;
