import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStepForward, faStepBackward, faRandom, faRedo,
  faVolumeUp, faVolumeMute, faExpand, faCompress, faArrowLeft
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import Toast from '../../../Common/Toast';
import styles from './PlaylistPlayer.module.css';

/** --------- Helpers: IDs parsing --------- */
const parseYouTubeId = (url) => {
  try {
    const s = url?.toString() || '';
    if (s.includes('youtube.com/watch')) { const u = new URL(s); return u.searchParams.get('v'); }
    if (s.includes('youtu.be/')) return s.split('youtu.be/')[1].split(/[?&]/)[0];
    if (s.includes('youtube.com/embed/')) return s.split('embed/')[1].split(/[?&]/)[0];
  } catch {}
  return null;
};
const parseVimeoId = (url) => {
  try { const m = url?.toString().match(/vimeo\.com\/(?:video\/)?(\d+)/); return m ? m[1] : null; } catch {} return null;
};
const loadScriptOnce = (src) =>
  new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    s.onerror = (e) => reject(e);
    document.body.appendChild(s);
  });

/** --------- Unified Player component --------- */
const VideoEmbed = ({ videoUrl, muted, onEnded, className }) => {
  const youTubeId = parseYouTubeId(videoUrl);
  const vimeoId = parseVimeoId(videoUrl);
  const ytRef = useRef(null);
  const vimContainerRef = useRef(null);
  const playerRef = useRef(null);

  useEffect(() => {
    let mounted = true;

    const setupYouTube = async (id) => {
      await loadScriptOnce('https://www.youtube.com/iframe_api');
      await new Promise((res) => {
        if (window.YT && window.YT.Player) return res();
        window.onYouTubeIframeAPIReady = () => res();
      });
      if (!mounted) return;

      if (playerRef.current?.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }

      playerRef.current = new window.YT.Player(ytRef.current, {
        videoId: id,
        playerVars: { autoplay: 1, mute: muted ? 1 : 0, rel: 0, modestbranding: 1 },
        events: {
          onReady: (e) => {
            if (muted) e.target.mute(); else e.target.unMute();
            e.target.playVideo();
          },
          onStateChange: (e) => {
            if (e.data === 0 && typeof onEnded === 'function') onEnded();
          }
        }
      });
    };

    const setupVimeo = async (id) => {
      await loadScriptOnce('https://player.vimeo.com/api/player.js');
      if (!mounted) return;

      if (playerRef.current?.unload) {
        try { playerRef.current.unload(); } catch {}
      }
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&muted=${muted ? 1 : 0}`;
      iframe.allow = 'autoplay; picture-in-picture';
      iframe.className = styles.iframe;
      if (vimContainerRef.current) {
        vimContainerRef.current.innerHTML = '';
        vimContainerRef.current.appendChild(iframe);
      }
      playerRef.current = new window.Vimeo.Player(iframe);
      playerRef.current.on('ended', () => typeof onEnded === 'function' && onEnded());
    };

    const setupFallback = () => {
      if (ytRef.current) ytRef.current.innerHTML = '';
      if (vimContainerRef.current) vimContainerRef.current.innerHTML = '';
    };

    if (youTubeId) setupYouTube(youTubeId);
    else if (vimeoId) setupVimeo(vimeoId);
    else setupFallback();

    return () => {
      mounted = false;
      try {
        if (playerRef.current?.destroy) playerRef.current.destroy();
        if (playerRef.current?.unload) playerRef.current.unload();
      } catch {}
    };
  }, [videoUrl, muted]);

  if (youTubeId) return <div className={className}><div ref={ytRef} className={styles.iframe} /></div>;
  if (vimeoId) return <div className={className}><div ref={vimContainerRef} className={styles.iframe} /></div>;
  return (
    <div className={styles.fallback}>
      <img src="/images/video-placeholder.jpg" alt="Preview" />
      <p>Cannot play this source directly.</p>
    </div>
  );
};

const getThumb = (url) => {
  const yt = parseYouTubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return '/images/video-placeholder.jpg';
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
  const [isMuted, setIsMuted] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const containerRef = useRef(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        if (!data) { setError('Playlist not found'); setLoading(false); return; }
        if (!data.videos || data.videos.length === 0) { setError('This playlist has no videos'); setLoading(false); return; }
        data.videos.sort((a,b)=>a.ordre-b.ordre);
        setPlaylist(data);
        setLoading(false);
      } catch (e) {
        setError("Error while loading the playlist"); setLoading(false);
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
        <button className={styles.retryButton} onClick={()=>window.location.reload()}>Retry</button>
      </div>
    );
  }
  const list = playlist.videos;
  const now = list[current]?.video_id;

  return (
    <div className={styles.playerPage}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={()=>navigate(`/dashboard/playlists/${id}`)}>
          <FontAwesomeIcon icon={faArrowLeft}/> Back
        </button>
        <div className={styles.topTitle}>{playlist.nom}</div>
        <div/>
      </div>

      <div className={styles.playerLayout} ref={containerRef}>
        <VideoEmbed
          className={styles.playerArea}
          videoUrl={now?.youtubeUrl}
          muted={isMuted}
          onEnded={() => {
            if (repeat) return;
            if (shuffle) return setCurrent(Math.floor(Math.random()*list.length));
            setCurrent((c)=> (c < list.length-1 ? c+1 : c));
          }}
        />

        <div className={styles.controls}>
          <button className={styles.ctrlBtn} onClick={prev}><FontAwesomeIcon icon={faStepBackward}/></button>
          <button className={`${styles.ctrlBtn} ${shuffle?styles.active:''}`} onClick={()=>setShuffle(s=>!s)} title="Shuffle"><FontAwesomeIcon icon={faRandom}/></button>
          <button className={`${styles.ctrlBtn} ${repeat?styles.active:''}`} onClick={()=>setRepeat(r=>!r)} title="Repeat"><FontAwesomeIcon icon={faRedo}/></button>
          <button className={styles.ctrlBtn} onClick={next}><FontAwesomeIcon icon={faStepForward}/></button>
          <button className={styles.ctrlBtn} onClick={()=>setIsMuted(m=>!m)} title="Mute"><FontAwesomeIcon icon={isMuted?faVolumeMute:faVolumeUp}/></button>
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

        <div className={styles.sideList}>
          <h3>Up next</h3>
          <ol className={styles.videoList}>
            {list.map((it, idx) => {
              const v = it.video_id;
              const th = getThumb(v?.youtubeUrl);
              return (
                <li key={v?._id || idx} className={`${styles.row} ${idx===current?styles.active:''}`} onClick={()=>setCurrent(idx)}>
                  <img src={th} alt={v?.titre || 'Video'} onError={(e)=>{e.currentTarget.src='/images/video-placeholder.jpg';}}/>
                  <div className={styles.info}>
                    <div className={styles.title}>{v?.titre || 'Untitled'}</div>
                    <div className={styles.sub}>{v?.artiste || 'Unknown artist'} {v?.annee ? `(${v.annee})` : ''}</div>
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
