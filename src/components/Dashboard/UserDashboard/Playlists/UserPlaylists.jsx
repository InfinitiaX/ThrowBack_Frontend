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
import ConfirmModal from '../../..//Common/ConfirmModal';
import Toast from '../../..//Common/Toast';
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

  // Initials for owner or playlist name
  const getInitials = (playlist) => {
    if (playlist.proprietaire && typeof playlist.proprietaire === 'object') {
      const nom = playlist.proprietaire.nom || '';
      const prenom = playlist.proprietaire.prenom || '';
      let initials = '';
      if (prenom) initials += prenom.charAt(0).toUpperCase();
      if (nom) initials += nom.charAt(0).toUpperCase();
      return initials || 'PL';
    }
    const playlistName = playlist.nom || '';
    if (playlistName) {
      const words = playlistName.split(' ');
      if (words.length >= 2) {
        return (words[0].charAt(0) + words[1].charAt(0)).toUpperCase();
      } else if (words.length === 1) {
        return words[0].substring(0, 2).toUpperCase();
      }
    }
    return 'PL';
  };
  
  const getBackgroundColor = (playlistId) => {
    const colors = [
      '#4a6fa5', '#6fb98f', '#2c786c', '#f25f5c', '#a16ae8', 
      '#ffa600', '#58508d', '#bc5090', '#ff6361', '#003f5c'
    ];
    if (!playlistId) return colors[0];
    const sum = playlistId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  const isOwner = (playlist) => {
    if (!user || !playlist) return false;
    const ownerId = typeof playlist.proprietaire === 'object' 
      ? playlist.proprietaire._id 
      : playlist.proprietaire;
    const userId = user.id || user._id;
    return ownerId && userId && ownerId.toString() === userId.toString();
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);

        if (user) {
          try {
            const mine = await playlistAPI.getUserPlaylists();
            setPlaylists(mine || []);
          } catch (e) {
            console.warn('getUserPlaylists failed:', e?.response?.status || e);
            setPlaylists([]);
          }
        } else {
          setPlaylists([]);
        }

        try {
          const popular = await playlistAPI.getPopularPlaylists(8);
          setPopularPlaylists(popular || []);
        } catch (e) {
          console.warn('getPopularPlaylists failed:', e);
          setPopularPlaylists([]);
        }

        setLoading(false);
      } catch (err) {
        setError("Unable to load playlists at the moment.");
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
    if (v === 'PRIVE') return <FontAwesomeIcon icon={faLock} title="Private" />;
    if (v === 'AMIS') return <FontAwesomeIcon icon={faUserFriends} title="Friends" />;
    return <FontAwesomeIcon icon={faGlobe} title="Public" />;
  };

  const toCreate = () => navigate('/dashboard/playlists/new');
  const toDetail = (id) => navigate(`/dashboard/playlists/${id}`);
  const toPlay = (e, id) => { e.stopPropagation(); navigate(`/dashboard/playlists/${id}/play`); };

  const askDelete = (e, p) => { 
    e.stopPropagation(); 
    setSelectedPlaylist(p); 
    setShowConfirmDelete(true); 
  };
  
  const doDelete = async () => {
    try {
      await playlistAPI.deletePlaylist(selectedPlaylist._id);
      setPlaylists((l) => l.filter(x => x._id !== selectedPlaylist._id));
      setToastMessage('Playlist deleted'); setToastType('success'); setShowToast(true);
    } catch (e) {
      setToastMessage('Failed to delete'); setToastType('error'); setShowToast(true);
    } finally {
      setShowConfirmDelete(false);
    }
  };

  const edit = (e, p) => { 
    e.stopPropagation(); 
    navigate(`/dashboard/playlists/${p._id}/edit`); 
  };
  
  const share = (e, p) => {
    e.stopPropagation();
    const url = `${window.location.origin}/dashboard/playlists/${p._id}`;
    navigator.clipboard.writeText(url).then(() => {
      setToastMessage('Link copied'); setToastType('success'); setShowToast(true);
    });
  };

  const toggleLike = async (e, playlist) => {
    e.stopPropagation();
    try {
      const isLiked = playlist.userHasLiked;
      await playlistAPI.togglePlaylistLike(playlist._id, !isLiked);
      
      const updatedPlaylists = playlists.map(p => {
        if (p._id === playlist._id) {
          return {
            ...p,
            nb_favoris: isLiked 
              ? Math.max(0, (p.nb_favoris || 0) - 1) 
              : (p.nb_favoris || 0) + 1,
            userHasLiked: !isLiked
          };
        }
        return p;
      });
      setPlaylists(updatedPlaylists);
      
      const updatedPopularPlaylists = popularPlaylists.map(p => {
        if (p._id === playlist._id) {
          return {
            ...p,
            nb_favoris: isLiked 
              ? Math.max(0, (p.nb_favoris || 0) - 1) 
              : (p.nb_favoris || 0) + 1,
            userHasLiked: !isLiked
          };
        }
        return p;
      });
      setPopularPlaylists(updatedPopularPlaylists);
      
      setToastMessage(isLiked ? 'Like removed' : 'Playlist liked');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error("Error while toggling like:", error);
      setToastMessage("An error occurred");
      setToastType('error');
      setShowToast(true);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <div className={styles.playlistsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Your playlists</h1>
        <button className={styles.createButton} onClick={toCreate}>
          <FontAwesomeIcon icon={faPlus} /> <span>Create playlist</span>
        </button>
      </div>

      <section className={styles.userPlaylistsSection}>
        <h2 className={styles.sectionTitle}>My playlists</h2>
        {(!user || playlists.length === 0) ? (
          <EmptyState
            icon={faMusic}
            title={user ? "No playlist" : "Sign in to create playlists"}
            message={user 
              ? "Create a playlist to organize your videos." 
              : "You need to be signed in to manage your playlists."}
            actionText={user ? "Create playlist" : "Create account / Sign in"}
            onAction={toCreate}
          />
        ) : (
          <div className={styles.playlistsGrid}>
            {playlists.map((p) => (
              <div key={p._id} className={styles.playlistCard} onClick={() => toDetail(p._id)}>
                <div className={styles.playlistImageContainer}>
                  <div 
                    className={styles.initialsContainer}
                    style={{ backgroundColor: getBackgroundColor(p._id) }}
                  >
                    <span className={styles.initials}>{getInitials(p)}</span>
                  </div>
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

                  <p className={styles.playlistDescription}>{p.description || 'No description'}</p>

                  <div className={styles.stats}>
                    <span><FontAwesomeIcon icon={faMusic}/> {p.nb_videos || p.videos?.length || 0} videos</span>
                    <span><FontAwesomeIcon icon={faEye}/> {formatCount(p.nb_lectures || 0)}</span>
                    <span><FontAwesomeIcon icon={faHeart}/> {formatCount(p.nb_favoris || 0)}</span>
                  </div>

                  <div className={styles.actions}>
                    <button 
                      className={`${styles.iconBtn} ${p.userHasLiked ? styles.likedBtn : ''}`} 
                      onClick={(e) => toggleLike(e, p)} 
                      title={p.userHasLiked ? "Unlike" : "Like"}
                    >
                      <FontAwesomeIcon icon={faHeart} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e)=>edit(e, p)} title="Edit">
                      <FontAwesomeIcon icon={faEdit} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e)=>askDelete(e, p)} title="Delete">
                      <FontAwesomeIcon icon={faTrash} />
                    </button>
                    <button className={styles.iconBtn} onClick={(e)=>share(e, p)} title="Share">
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
        <h2 className={styles.sectionTitle}>Popular playlists</h2>
        <div className={styles.playlistsGrid}>
          {popularPlaylists.map((p) => (
            <div key={p._id} className={styles.playlistCard} onClick={()=>toDetail(p._id)}>
              <div className={styles.playlistImageContainer}>
                <div 
                  className={styles.initialsContainer}
                  style={{ backgroundColor: getBackgroundColor(p._id) }}
                >
                  <span className={styles.initials}>{getInitials(p)}</span>
                </div>
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
                <p className={styles.playlistDescription}>{p.description || 'No description'}</p>
                <div className={styles.stats}>
                  <span><FontAwesomeIcon icon={faMusic}/> {p.nb_videos || p.videos?.length || 0} videos</span>
                  <span><FontAwesomeIcon icon={faEye}/> {formatCount(p.nb_lectures || 0)}</span>
                  <span><FontAwesomeIcon icon={faHeart}/> {formatCount(p.nb_favoris || 0)}</span>
                </div>
                <div className={styles.actions}>
                  <button 
                    className={`${styles.iconBtn} ${p.userHasLiked ? styles.likedBtn : ''}`} 
                    onClick={(e) => toggleLike(e, p)} 
                    title={p.userHasLiked ? "Unlike" : "Like"}
                  >
                    <FontAwesomeIcon icon={faHeart} />
                  </button>
                  {isOwner(p) && (
                    <>
                      <button className={styles.iconBtn} onClick={(e)=>edit(e, p)} title="Edit">
                        <FontAwesomeIcon icon={faEdit} />
                      </button>
                      <button className={styles.iconBtn} onClick={(e)=>askDelete(e, p)} title="Delete">
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </>
                  )}
                  <button className={styles.iconBtn} onClick={(e)=>share(e, p)} title="Share">
                    <FontAwesomeIcon icon={faShare} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete playlist?"
        message={`Do you really want to delete "${selectedPlaylist?.nom}"?`}
        onCancel={()=>setShowConfirmDelete(false)}
        onConfirm={doDelete}
      />

      <Toast show={showToast} type={toastType} onClose={()=>setShowToast(false)}>{toastMessage}</Toast>
    </div>
  );
};

export default UserPlaylists;
