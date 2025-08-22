import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward, faRandom, faRedo,
  faHeart, faShare, faEllipsisV, faEdit, faTrash,
  faArrowLeft, faPlus, faGlobe, faLock, faUserFriends,
  faEye, faCalendarAlt, faMusic, faVolumeMute, faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import ConfirmModal from '../../../Common/ConfirmModal';
import Toast from '../../../Common/Toast';
import styles from './PlaylistDetail.module.css';

const parseYouTubeId = (url) => {
  try {
    const s = url.toString();
    if (s.includes('youtube.com/watch')) {
      const u = new URL(s);
      return u.searchParams.get('v');
    }
    if (s.includes('youtu.be/')) return s.split('youtu.be/')[1].split(/[?&]/)[0];
    if (s.includes('youtube.com/embed/')) return s.split('embed/')[1].split(/[?&]/)[0];
  } catch {}
  return null;
};

const parseVimeoId = (url) => {
  try {
    const m = url.toString().match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  } catch {}
  return null;
};

const getEmbedFromUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const url = rawUrl.toString();

  const yt = parseYouTubeId(url);
  if (yt) {
    return {
      provider: 'youtube',
      id: yt,
      embedUrl: `https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&rel=0&modestbranding=1`,
      thumb: `https://img.youtube.com/vi/${yt}/hqdefault.jpg`
    };
  }

  const vm = parseVimeoId(url);
  if (vm) {
    return {
      provider: 'vimeo',
      id: vm,
      embedUrl: `https://player.vimeo.com/video/${vm}?autoplay=1&muted=1`,
      thumb: '/images/video-placeholder.jpg'
    };
  }

  // Fichier local ou URL directe : on ne peut pas iframe -> fallback image
  return { provider: 'file', id: null, embedUrl: null, thumb: '/images/video-placeholder.jpg' };
};

const UserPlaylistDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [current, setCurrent] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const baseUrl = process.env.REACT_APP_API_URL || '';
  const media = (p) => !p ? '' : (p.startsWith('http') ? p : `${baseUrl}${p.startsWith('/')?p:`/${p}`}`);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        if (!data) { setError('Playlist introuvable'); setLoading(false); return; }
        if (data.videos?.length) data.videos.sort((a,b)=>a.ordre-b.ordre);
        setPlaylist(data);
        setLoading(false);
      } catch (e) {
        setError("Erreur lors du chargement de la playlist");
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const onPrev = () => setCurrent((i)=> Math.max(0, i-1));
  const onNext = () => {
    if (!playlist?.videos?.length) return;
    if (repeat) return setCurrent((i)=>i); 
    if (shuffle) return setCurrent(Math.floor(Math.random()*playlist.videos.length));
    setCurrent((i)=> Math.min(playlist.videos.length-1, i+1));
  };

  const removeVideo = async (videoId) => {
    try {
      await playlistAPI.removeVideoFromPlaylist(id, videoId);
      const rest = playlist.videos.filter(v => v.video_id._id !== videoId);
      setPlaylist({ ...playlist, videos: rest });
      setToastMessage('Vidéo supprimée de la playlist'); setToastType('success'); setShowToast(true);
      if (current >= rest.length) setCurrent(Math.max(0, rest.length-1));
    } catch (e) {
      setToastMessage("Erreur lors de la suppression"); setToastType('error'); setShowToast(true);
    }
  };

  const embed = playlist?.videos?.length ? getEmbedFromUrl(playlist.videos[current].video_id?.youtubeUrl) : null;

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={()=>window.location.reload()}>Réessayer</button>
      </div>
    );
  }
  if (!playlist) return null;

  const videoList = playlist.videos || [];
  const now = videoList[current]?.video_id;

  const visIcon = (v) => v==='PRIVE' ? <FontAwesomeIcon icon={faLock}/> : v==='AMIS' ? <FontAwesomeIcon icon={faUserFriends}/> : <FontAwesomeIcon icon={faGlobe}/>;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={()=>navigate('/dashboard/playlists')}>
        <FontAwesomeIcon icon={faArrowLeft}/> Retour aux playlists
      </button>

      <div className={styles.header}>
        <div className={styles.cover}>
          <img src={media(playlist.image_couverture) || '/images/playlist-placeholder.jpg'}
               onError={(e)=>{e.currentTarget.src='/images/playlist-placeholder.jpg';}}
               alt={playlist.nom || 'Playlist'} />
        </div>
        <div className={styles.meta}>
          <div className={styles.visibility}>{visIcon(playlist.visibilite)}</div>
          <h1 className={styles.title}>{playlist.nom}</h1>
          <p className={styles.description}>{playlist.description || 'Aucune description'}</p>
          <div className={styles.stats}>
            <span><FontAwesomeIcon icon={faMusic}/> {videoList.length} vidéos</span>
            <span><FontAwesomeIcon icon={faEye}/> {playlist.nb_lectures || 0}</span>
            <span><FontAwesomeIcon icon={faCalendarAlt}/> {playlist.creation_date ? new Date(playlist.creation_date).toLocaleDateString() : '—'}</span>
          </div>
          <div className={styles.actions}>
            <button onClick={()=>navigate(`/dashboard/playlists/${id}/edit`)} className={styles.actionBtn}><FontAwesomeIcon icon={faEdit}/> Modifier</button>
            <button onClick={()=>{const u=`${window.location.origin}/dashboard/playlists/${id}`; navigator.clipboard.writeText(u); setToastMessage('Lien copié'); setToastType('success'); setShowToast(true);}} className={styles.actionBtn}><FontAwesomeIcon icon={faShare}/> Partager</button>
            <button onClick={()=>setShowConfirmDelete(true)} className={styles.dangerBtn}><FontAwesomeIcon icon={faTrash}/> Supprimer</button>
          </div>
        </div>
      </div>

      {/* PLAYER */}
      <div className={styles.playerSection}>
        <div className={styles.playerLeft}>
          <div className={styles.player}>
            {embed?.embedUrl ? (
              <iframe
                key={embed.embedUrl} // force refresh quand on change de vidéo
                src={embed.embedUrl}
                title={now?.titre || 'Video'}
                className={styles.iframe}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className={styles.fallback}>
                <img src={embed?.thumb || '/images/video-placeholder.jpg'} alt="Preview" />
                <p>Cette source ne peut pas être lue en direct. Ouvrez la vidéo sur sa plateforme.</p>
              </div>
            )}
          </div>

          <div className={styles.controls}>
            <button onClick={onPrev} className={styles.ctrlBtn}><FontAwesomeIcon icon={faStepBackward}/></button>
            <button onClick={onNext} className={styles.ctrlBtn}><FontAwesomeIcon icon={faStepForward}/></button>
            <button onClick={()=>setShuffle(s=>!s)} className={`${styles.ctrlBtn} ${shuffle?styles.active:''}`} title="Aléatoire"><FontAwesomeIcon icon={faRandom}/></button>
            <button onClick={()=>setRepeat(r=>!r)} className={`${styles.ctrlBtn} ${repeat?styles.active:''}`} title="Répéter"><FontAwesomeIcon icon={faRedo}/></button>
            <button onClick={()=>setIsMuted(m=>!m)} className={styles.ctrlBtn} title="Muet (autoplay)">
              <FontAwesomeIcon icon={isMuted?faVolumeMute:faVolumeUp}/>
            </button>
          </div>

          {now && (
            <div className={styles.nowPlaying}>
              <strong>Lecture :</strong> {now.artiste || 'Artiste'} – {now.titre || 'Titre'} {now.annee ? `(${now.annee})` : ''}
            </div>
          )}
        </div>

        <div className={styles.playlistRight}>
          <h3>Vidéos dans cette playlist</h3>
          <ol className={styles.videoList}>
            {videoList.map((it, idx) => {
              const vd = it.video_id;
              const emb = getEmbedFromUrl(vd?.youtubeUrl);
              return (
                <li key={vd?._id || idx} className={`${styles.videoRow} ${idx===current ? styles.activeRow : ''}`} onClick={()=>setCurrent(idx)}>
                  <img src={(emb?.thumb)||'/images/video-placeholder.jpg'}
                       alt={vd?.titre || 'Vidéo'}
                       onError={(e)=>{e.currentTarget.src='/images/video-placeholder.jpg';}} />
                  <div className={styles.videoInfo}>
                    <div className={styles.videoTitle}>{vd?.titre || 'Sans titre'}</div>
                    <div className={styles.videoSub}>{vd?.artiste || 'Artiste inconnu'} {vd?.annee ? `(${vd.annee})` : ''}</div>
                  </div>
                  <button className={styles.removeBtn} onClick={(e)=>{e.stopPropagation(); removeVideo(vd._id);}} title="Retirer">
                    <FontAwesomeIcon icon={faTrash}/>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Supprimer la playlist ?"
        message={`Voulez‑vous vraiment supprimer "${playlist.nom}" ?`}
        onCancel={()=>setShowConfirmDelete(false)}
        onConfirm={async ()=>{
          try{
            await playlistAPI.deletePlaylist(id);
            navigate('/dashboard/playlists');
          }catch(e){
            setToastMessage('Erreur lors de la suppression'); setToastType('error'); setShowToast(true);
            setShowConfirmDelete(false);
          }
        }}
      />

      <Toast show={showToast} type={toastType} onClose={()=>setShowToast(false)}>{toastMessage}</Toast>
    </div>
  );
};

export default UserPlaylistDetail;
