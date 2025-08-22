import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlus, faMusic, faPlay, faEllipsisV, faTrash, faEdit, faShare, 
  faHeart, faEye, faGlobe, faLock, faUserFriends
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import EmptyState from '../../../Common/EmptyState';
import ConfirmModal from '../../../Common/ConfirmModal';
import Toast from '../../../Common/Toast';
import styles from './UserPlaylists.module.css';

const UserPlaylists = () => {
  const [playlists, setPlaylists] = useState([]);
  const [popularPlaylists, setPopularPlaylists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');
  const [activeDropdown, setActiveDropdown] = useState(null);

  const { user } = useAuth();
  const navigate = useNavigate();

  const baseUrl = process.env.REACT_APP_API_URL || '';

  const imgUrl = (p) => {
    if (!p) return '/images/playlist-placeholder.jpg';
    if (p.startsWith('http')) return p;
    return `${baseUrl}${p.startsWith('/') ? p : `/${p}`}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        // ⚠️ Important : n’appelle /api/playlists/user QUE si user existe (sinon 401)
        if (user) {
          try {
            const mine = await playlistAPI.getUserPlaylists();
            setPlaylists(mine || []);
          } catch (e) {
            // On log l’erreur mais on ne bloque pas l’écran
            console.warn('getUserPlaylists failed:', e?.response?.status || e);
            setPlaylists([]);
          }
        } else {
          setPlaylists([]); // pas connecté → pas de 401
        }

        // Playlists populaires (route publique)
        try {
          const popular = await playlistAPI.getPopularPlaylists(8);
          setPopularPlaylists(popular || []);
        } catch (e) {
          console.warn('getPopularPlaylists failed:', e);
          setPopularPlaylists([]);
        }

        setLoading(false);
      } catch (err) {
        setError("Impossible de charger les playlists pour le moment.");
        setLoading(false);
      }
    };

    load();

    const off = () => setActiveDropdown(null);
    document.addEventListener('click', off);
    return () => document.removeEventListener('click', off);
  }, [user]);

  const formatCount = (n) => {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n/1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n/1_000).toFixed(1)}K`;
    return n;
  };

  const iconForVisibility = (v) => {
    if (v === 'PRIVE') return <FontAwesomeIcon icon={faLock} title="Privé" />;
    if (v === 'AMIS') return <FontAwesomeIcon icon={faUserFriends} title="Amis" />;
    return <FontAwesomeIcon icon={faGlobe} title="Public" />;
  };

  const toCreate = () => navigate('/dashboard/playlists/new');
  const toDetail = (id) => navigate(`/dashboard/playlists/${id}`);
  const toPlay = (e, id) => { e.stopPropagation(); navigate(`/dashboard/playlists/${id}/play`); };

  const askDelete = (e, p) => { e.stopPropagation(); setSelectedPlaylist(p); setShowConfirmDelete(true); };
  const doDelete = async () => {
    try {
      await playlistAPI.deletePlaylist(selectedPlaylist._id);
      setPlaylists((l) => l.filter(x => x._id !== selectedPlaylist._id));
      setToastMessage('Playlist supprimée'); setToastType('success'); setShowToast(true);
    } catch (e) {
      setToastMessage('Erreur lors de la suppression'); setToastType('error'); setShowToast(true);
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const edit = (e, p) => { e.stopPropagation(); navigate(`/dashboard/playlists/${p._id}/edit`); setActiveDropdown(null); };
  const share = (e, p) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/playlists/${p._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('Lien copié'); setToastType('success'); setShowToast(true);
    });
    setActiveDropdown(null);
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className={styles.playlistsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Vos playlists</h1>
        <button className={styles.createButton} onClick={toCreate}>
          <FontAwesomeIcon icon={faPlus} /> <span>Créer une playlist</span>
        </button>
      </div>

      <section className={styles.userPlaylistsSection}>
        <h2 className={styles.sectionTitle}>Mes playlists</h2>
        {(!user || playlists.length === 0) ? (
          <EmptyState
            icon={faMusic}
            title={user ? "Aucune playlist" : "Connectez‑vous pour créer des playlists"}
            message={user 
              ? "Créez une playlist pour organiser vos vidéos." 
              : "Vous devez être connecté pour gérer vos playlists."}
            actionText={user ? "Créer une playlist" : "Créer un compte / Se connecter"}
            onAction={toCreate}
          />
        ) : (
          <div className={styles.playlistsGrid}>
            {playlists.map((p, i) => (
              <div key={p._id} className={styles.playlistCard} onClick={() => toDetail(p._id)}>
                <div className={styles.playlistImageContainer}>
                  <img className={styles.playlistImage} src={imgUrl(p.image_couverture)} alt={p.nom || 'Playlist'} 
                       onError={(e)=>{e.currentTarget.src='/images/playlist-placeholder.jpg';}} />
                  <div className={styles.playlistOverlay}>
                    <button className={styles.playButton} onClick={(e)=>toPlay(e, p._id)}>
                      <FontAwesomeIcon icon={faPlay} />
                    </button>
                  </div>
                </div>

                <div className={styles.playlistInfo}>
                  <div className={styles.playlistMeta}>
                    <h3 className={styles.playlistTitle}>{p.nom || 'Playlist'}</h3>
                    <div className={styles.visibility}>{iconForVisibility(p.visibilite)}</div>
                  </div>

                  <p className={styles.playlistDescription}>{p.description || 'Aucune description'}</p>

                  <div className={styles.stats}>
                    <span><FontAwesomeIcon icon={faMusic}/> {p.nb_videos || p.videos?.length || 0} vidéos</span>
                    <span><FontAwesomeIcon icon={faEye}/> {formatCount(p.nb_lectures || 0)}</span>
                    <span><FontAwesomeIcon icon={faHeart}/> {formatCount(p.nb_favoris || 0)}</span>
                  </div>

                  <div className={styles.actions}>
                    <button className={styles.iconBtn} onClick={(e)=>edit(e, p)} title="Modifier">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e)=>askDelete(e, p)} title="Supprimer">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e)=>share(e, p)} title="Partager">
                      <FontAwesomeIcon icon={faShare} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className={styles.popularSection}>
        <h2 className={styles.sectionTitle}>Playlists populaires</h2>
        <div className={styles.playlistsGrid}>
          {popularPlaylists.map((p) => (
            <div key={p._id} className={styles.playlistCard} onClick={()=>toDetail(p._id)}>
              <div className={styles.playlistImageContainer}>
                <img className={styles.playlistImage} src={imgUrl(p.image_couverture)} alt={p.nom || 'Playlist'}
                     onError={(e)=>{e.currentTarget.src='/images/playlist-placeholder.jpg';}} />
                <div className={styles.playlistOverlay}>
                  <button className={styles.playButton} onClick={(e)=>toPlay(e, p._id)}>
                    <FontAwesomeIcon icon={faPlay} />
                  </button>
                </div>
              </div>
              <div className={styles.playlistInfo}>
                <div className={styles.playlistMeta}>
                  <h3 className={styles.playlistTitle}>{p.nom || 'Playlist'}</h3>
                  <div className={styles.visibility}>{iconForVisibility(p.visibilite)}</div>
                </div>
                <p className={styles.playlistDescription}>{p.description || 'Aucune description'}</p>
                <div className={styles.stats}>
                  <span><FontAwesomeIcon icon={faMusic}/> {p.nb_videos || p.videos?.length || 0} vidéos</span>
                  <span><FontAwesomeIcon icon={faEye}/> {formatCount(p.nb_lectures || 0)}</span>
                  <span><FontAwesomeIcon icon={faHeart}/> {formatCount(p.nb_favoris || 0)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Supprimer la playlist ?"
        message={`Voulez‑vous vraiment supprimer "${selectedPlaylist?.nom}" ?`}
        onCancel={()=>setShowConfirmDelete(false)}
        onConfirm={doDelete}
      />

      <Toast show={showToast} type={toastType} onClose={()=>setShowToast(false)}>{toastMessage}</Toast>
    </div>
  );
};

export default UserPlaylists;
