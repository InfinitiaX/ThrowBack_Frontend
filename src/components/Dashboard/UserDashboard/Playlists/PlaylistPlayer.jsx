import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward, faRandom, faRedo,
  faVolumeUp, faVolumeMute, faExpand, faCompress, faArrowLeft, 
  faList, faHeart, faShare
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Toast from '../../../Common/Toast';
import styles from './PlaylistPlayer.module.css';

const parseYouTubeId = (url) => {
  try {
    const s = url.toString();
    if (s.includes('youtube.com/watch')) { const u = new URL(s); return u.searchParams.get('v'); }
    if (s.includes('youtu.be/')) return s.split('youtu.be/')[1].split(/[?&]/)[0];
    if (s.includes('youtube.com/embed/')) return s.split('embed/')[1].split(/[?&]/)[0];
  } catch {}
  return null;
};
const parseVimeoId = (url) => {
  try { const m = url.toString().match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : null; } catch {} return null;
};
const getEmbedFromUrl = (rawUrl) => {
  if (!rawUrl) return null;
  const url = rawUrl.toString();
  const yt = parseYouTubeId(url);
  if (yt) return { provider:'youtube', id: yt, embedUrl:`https://www.youtube.com/embed/${yt}?autoplay=1&mute=1&rel=0&modestbranding=1`, thumb:`https://img.youtube.com/vi/${yt}/hqdefault.jpg` };
  const vm = parseVimeoId(url);
  if (vm) return { provider:'vimeo', id: vm, embedUrl:`https://player.vimeo.com/video/${vm}?autoplay=1&muted=1`, thumb:'/images/video-placeholder.jpg' };
  return { provider:'file', id:null, embedUrl:null, thumb:'/images/video-placeholder.jpg' };
};

const PlaylistPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [playlist, setPlaylist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [current, setCurrent] = useState(0);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // démarrer muet pour autoplay policy
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const containerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        if (!data) { setError('Playlist introuvable'); setLoading(false); return; }
        if (!data.videos || data.videos.length === 0) { setError('Cette playlist ne contient aucune vidéo'); setLoading(false); return; }
        data.videos.sort((a,b)=>a.ordre-b.ordre);
        setPlaylist(data);
        setLoading(false);
      } catch (e) {
        setError("Erreur lors du chargement de la playlist"); setLoading(false);
      }
    };
    load();
  }, [id]);

  const next = () => {
    if (!playlist?.videos?.length) return;
    if (repeat) return setCurrent(c=>c);
    if (shuffle) return setCurrent(Math.floor(Math.random()*playlist.videos.length));
    setCurrent(c => (c < playlist.videos.length-1 ? c+1 : c));
  };
  const prev = () => setCurrent(c=>Math.max(0,c-1));

  useEffect(() => {
    const onFs = () => setIsFullscreen(
      !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement)
    );
    document.addEventListener('fullscreenchange', onFs);
    document.addEventListener('webkitfullscreenchange', onFs);
    document.addEventListener('mozfullscreenchange', onFs);
    document.addEventListener('MSFullscreenChange', onFs);
    return () => {
      document.removeEventListener('fullscreenchange', onFs);
      document.removeEventListener('webkitfullscreenchange', onFs);
      document.removeEventListener('mozfullscreenchange', onFs);
      document.removeEventListener('MSFullscreenChange', onFs);
    };
  }, []);

  if (loading) return <LoadingSpinner/>;
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={()=>window.location.reload()}>Réessayer</button>
      </div>
    );
  }
  const list = playlist.videos;
  const now = list[current]?.video_id;
  const emb = getEmbedFromUrl(now?.youtubeUrl);

  return (
    <div className={styles.playerPage}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={()=>navigate(`/dashboard/playlists/${id}`)}>
          <FontAwesomeIcon icon={faArrowLeft}/> Retour
        </button>
        <div className={styles.topTitle}>{playlist.nom}</div>
        <div/>
      </div>

      <div className={styles.playerLayout} ref={containerRef}>
        <div className={styles.playerArea}>
          {emb?.embedUrl ? (
            <iframe
              key={emb.embedUrl}
              src={emb.embedUrl + (isMuted ? '' : '&mute=0')}
              title={now?.titre || 'Video'}
              className={styles.iframe}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className={styles.fallback}>
              <img src={emb?.thumb || '/images/video-placeholder.jpg'} alt="Preview" />
              <p>Impossible de lire cette source directement.</p>
            </div>
          )}

          <div className={styles.controls}>
            <button className={styles.ctrlBtn} onClick={prev}><FontAwesomeIcon icon={faStepBackward}/></button>
            <button className={`${styles.ctrlBtn} ${shuffle?styles.active:''}`} onClick={()=>setShuffle(s=>!s)} title="Aléatoire"><FontAwesomeIcon icon={faRandom}/></button>
            <button className={`${styles.ctrlBtn} ${repeat?styles.active:''}`} onClick={()=>setRepeat(r=>!r)} title="Répéter"><FontAwesomeIcon icon={faRedo}/></button>
            <button className={styles.ctrlBtn} onClick={next}><FontAwesomeIcon icon={faStepForward}/></button>
            <button className={styles.ctrlBtn} onClick={()=>setIsMuted(m=>!m)} title="Muet"><FontAwesomeIcon icon={isMuted?faVolumeMute:faVolumeUp}/></button>
            <button className={styles.ctrlBtn} onClick={()=>{
              if (!isFullscreen) {
                if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
                else if (containerRef.current.webkitRequestFullscreen) containerRef.current.webkitRequestFullscreen();
              } else {
                if (document.exitFullscreen) document.exitFullscreen();
                else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
              }
            }}>
              <FontAwesomeIcon icon={isFullscreen?faCompress:faExpand}/>
            </button>
          </div>
        </div>

        <div className={styles.sideList}>
          <h3>Liste de lecture</h3>
          <ol className={styles.videoList}>
            {list.map((it, idx) => {
              const v = it.video_id;
              const th = getEmbedFromUrl(v?.youtubeUrl)?.thumb || '/images/video-placeholder.jpg';
              return (
                <li key={v?._id || idx} className={`${styles.row} ${idx===current?styles.active:''}`} onClick={()=>setCurrent(idx)}>
                  <img src={th} alt={v?.titre || 'Video'} onError={(e)=>{e.currentTarget.src='/images/video-placeholder.jpg';}}/>
                  <div className={styles.info}>
                    <div className={styles.title}>{v?.titre || 'Sans titre'}</div>
                    <div className={styles.sub}>{v?.artiste || 'Artiste inconnu'} {v?.annee ? `(${v.annee})` : ''}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <Toast show={showToast} type={toastType} onClose={()=>setShowToast(false)}>{toastMessage}</Toast>
    </div>
  );
};

export default PlaylistPlayer;
