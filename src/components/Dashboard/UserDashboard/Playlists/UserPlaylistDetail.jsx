import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faPlay, faPause, faStepForward, faStepBackward, faRandom, faRedo,
  faHeart, faShare, faEdit, faTrash,
  faArrowLeft, faPlus, faGlobe, faLock, faUserFriends,
  faEye, faCalendarAlt, faMusic, faVolumeMute, faVolumeUp
} from '@fortawesome/free-solid-svg-icons';
import playlistAPI from '../../../../utils/playlistAPI';
import { useAuth } from '../../../../contexts/AuthContext';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import ConfirmModal from '../../../Common/ConfirmModal';
import Toast from '../../../Common/Toast';
import styles from './PlaylistDetail.module.css';

/** --------- Helpers: IDs parsing --------- */
const parseYouTubeId = (url) => {
  try {
    const s = url?.toString() || '';
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
    const m = url?.toString().match(/vimeo\.com\/(?:video\/)?(\d+)/);
    return m ? m[1] : null;
  } catch {}
  return null;
};

/** --------- Script loader --------- */
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
const VideoEmbed = ({ videoUrl, muted, onEnded }) => {
  const containerRef = useRef(null);
  const vimeoRef = useRef(null);
  const playerRef = useRef(null);
  const youTubeId = parseYouTubeId(videoUrl);
  const vimeoId = parseVimeoId(videoUrl);

  useEffect(() => {
    let isMounted = true;

    const setupYouTube = async (id) => {
      await loadScriptOnce('https://www.youtube.com/iframe_api');
      await new Promise((res) => {
        if (window.YT && window.YT.Player) return res();
        window.onYouTubeIframeAPIReady = () => res();
      });

      if (!isMounted || !containerRef.current) return;

      if (playerRef.current && playerRef.current.destroy) {
        try { playerRef.current.destroy(); } catch {}
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: id,
        playerVars: {
          autoplay: 1,
          mute: muted ? 1 : 0,
          rel: 0,
          modestbranding: 1
        },
        events: {
          onReady: (e) => {
            if (muted) e.target.mute(); else e.target.unMute();
            e.target.playVideo();
          },
          onStateChange: (e) => {
            // 0 = ENDED
            if (e.data === 0 && typeof onEnded === 'function') onEnded();
          }
        }
      });
    };

    const setupVimeo = async (id) => {
      await loadScriptOnce('https://player.vimeo.com/api/player.js');
      if (!isMounted) return;

      // clean previous
      if (playerRef.current && playerRef.current.unload) {
        try { playerRef.current.unload(); } catch {}
      }
      const iframe = document.createElement('iframe');
      iframe.src = `https://player.vimeo.com/video/${id}?autoplay=1&muted=${muted ? 1 : 0}`;
      iframe.allow = 'autoplay; picture-in-picture';
      iframe.className = styles.iframe;
      if (vimeoRef.current) {
        vimeoRef.current.innerHTML = '';
        vimeoRef.current.appendChild(iframe);
      }
      playerRef.current = new window.Vimeo.Player(iframe);
      playerRef.current.on('ended', () => typeof onEnded === 'function' && onEnded());
    };

    const setupFileFallback = () => {
      // Nothing to control; just show a placeholder.
      if (containerRef.current) containerRef.current.innerHTML = '';
      if (vimeoRef.current) vimeoRef.current.innerHTML = '';
    };

    if (youTubeId) {
      setupYouTube(youTubeId);
    } else if (vimeoId) {
      setupVimeo(vimeoId);
    } else {
      setupFileFallback();
    }

    return () => {
      isMounted = false;
      try {
        if (playerRef.current?.destroy) playerRef.current.destroy();
        if (playerRef.current?.unload) playerRef.current.unload();
      } catch {}
    };
  }, [videoUrl, muted]);

  if (youTubeId) {
    return <div className={styles.player}><div ref={containerRef} className={styles.iframe} /></div>;
  }
  if (vimeoId) {
    return <div className={styles.player}><div ref={vimeoRef} className={styles.iframe} /></div>;
  }
  // Fallback
  return (
    <div className={styles.fallback}>
      <img src="/images/video-placeholder.jpg" alt="Preview" />
      <p>This source cannot be played inline. Open it on its platform.</p>
    </div>
  );
};

const getEmbedThumb = (rawUrl) => {
  const yt = parseYouTubeId(rawUrl);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return '/images/video-placeholder.jpg';
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
  const [isMuted, setIsMuted] = useState(true);
  const [isOwner, setIsOwner] = useState(false);

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const getInitials = () => {
    if (!playlist || !playlist.proprietaire) return 'PL';
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
    if (!playlist?._id) return colors[0];
    const sum = playlist._id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await playlistAPI.getPlaylistById(id);
        if (!data) { setError('Playlist not found'); setLoading(false); return; }
        if (data.videos?.length) data.videos.sort((a,b)=>a.ordre-b.ordre);
        setPlaylist(data);
        setLoading(false);
      } catch (e) {
        setError("Error while loading the playlist");
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    if (playlist && user) {
      const ownerId = typeof playlist.proprietaire === 'object' 
        ? playlist.proprietaire._id 
        : playlist.proprietaire;
      const userId = user.id || user._id;
      setIsOwner(ownerId && userId && ownerId.toString() === userId.toString());
    }
  }, [playlist, user]);

  useEffect(() => {
    const recordView = async () => {
      try {
        await playlistAPI.incrementPlaylistViews(id);
        setPlaylist(prev => ({
          ...prev,
          nb_lectures: (prev.nb_lectures || 0) + 1
        }));
      } catch (error) {
        console.error("View increment error:", error);
      }
    };
    if (playlist && !loading) {
      recordView();
    }
  }, [id, playlist?._id, loading]);

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
      setToastMessage('Video removed from playlist'); setToastType('success'); setShowToast(true);
      if (current >= rest.length) setCurrent(Math.max(0, rest.length-1));
    } catch (e) {
      setToastMessage("Error while removing the video"); setToastType('error'); setShowToast(true);
    }
  };

  const toggleLike = async () => {
    try {
      const isLiked = playlist.userHasLiked;
      await playlistAPI.togglePlaylistLike(id, !isLiked);
      setPlaylist(prev => ({
        ...prev,
        nb_favoris: isLiked 
          ? Math.max(0, (prev.nb_favoris || 0) - 1) 
          : (prev.nb_favoris || 0) + 1,
        userHasLiked: !isLiked
      }));
      setToastMessage(isLiked ? 'Like removed' : 'Playlist liked');
      setToastType('success');
      setShowToast(true);
    } catch (error) {
      console.error("Like toggle error:", error);
      setToastMessage("Something went wrong");
      setToastType('error');
      setShowToast(true);
    }
  };

  if (loading) return <LoadingSpinner />;
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p className={styles.errorMessage}>{error}</p>
        <button className={styles.retryButton} onClick={()=>window.location.reload()}>Retry</button>
      </div>
    );
  }
  if (!playlist) return null;

  const videoList = playlist.videos || [];
  const now = videoList[current]?.video_id;

  const visIcon = (v) => v==='PRIVE' ? <FontAwesomeIcon icon={faLock}/> : v==='AMIS' ? <FontAwesomeIcon icon={faUserFriends}/> : <FontAwesomeIcon icon={faGlobe}/>;
  const fmt = (n)=> !n ? '0' : n>=1_000_000 ? `${(n/1_000_000).toFixed(1)}M` : n>=1_000 ? `${(n/1_000).toFixed(1)}K` : n;

  return (
    <div className={styles.container}>
      <button className={styles.backBtn} onClick={()=>navigate('/dashboard/playlists')}>
        <FontAwesomeIcon icon={faArrowLeft}/> Back to playlists
      </button>

      <div className={styles.header}>
        <div className={styles.cover}>
          <div 
            className={styles.initialsContainer}
            style={{ backgroundColor: getBackgroundColor() }}
          >
            <span className={styles.initials}>{getInitials()}</span>
          </div>
        </div>
        <div className={styles.meta}>
          <div className={styles.visibility}>{visIcon(playlist.visibilite)}</div>
          <h1 className={styles.title}>{playlist.nom}</h1>
          <p className={styles.description}>{playlist.description || 'No description'}</p>
          <div className={styles.stats}>
            <span><FontAwesomeIcon icon={faMusic}/> {videoList.length} videos</span>
            <span><FontAwesomeIcon icon={faEye}/> {fmt(playlist.nb_lectures || 0)}</span>
            <span><FontAwesomeIcon icon={faCalendarAlt}/> {playlist.creation_date ? new Date(playlist.creation_date).toLocaleDateString() : '—'}</span>
            <span><FontAwesomeIcon icon={faHeart}/> {fmt(playlist.nb_favoris || 0)}</span>
          </div>
          <div className={styles.actions}>
            <button 
              onClick={toggleLike}
              className={`${styles.actionBtn} ${playlist.userHasLiked ? styles.likedBtn : ''}`}
            >
              <FontAwesomeIcon icon={faHeart} /> 
              {playlist.userHasLiked ? 'Liked' : 'Like'}
            </button>
            <button onClick={()=>{const u=`${window.location.origin}/dashboard/playlists/${id}`; navigator.clipboard.writeText(u); setToastMessage('Link copied'); setToastType('success'); setShowToast(true);}} className={styles.actionBtn}>
              <FontAwesomeIcon icon={faShare}/> Share
            </button>
            {isOwner && (
              <>
                <button onClick={()=>navigate(`/dashboard/playlists/${id}/edit`)} className={styles.actionBtn}>
                  <FontAwesomeIcon icon={faEdit}/> Edit
                </button>
                <button onClick={()=>setShowConfirmDelete(true)} className={styles.dangerBtn}>
                  <FontAwesomeIcon icon={faTrash}/> Delete
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* PLAYER */}
      <div className={styles.playerSection}>
        <div className={styles.playerLeft}>
          <VideoEmbed
            videoUrl={now?.youtubeUrl}
            muted={isMuted}
            onEnded={() => {
              if (repeat) return;
              if (shuffle) return setCurrent(Math.floor(Math.random()*videoList.length));
              setCurrent((i)=> Math.min(videoList.length-1, i+1));
            }}
          />

          <div className={styles.controls}>
            <button onClick={onPrev} className={styles.ctrlBtn}><FontAwesomeIcon icon={faStepBackward}/></button>
            <button onClick={onNext} className={styles.ctrlBtn}><FontAwesomeIcon icon={faStepForward}/></button>
            <button onClick={()=>setShuffle(s=>!s)} className={`${styles.ctrlBtn} ${shuffle?styles.active:''}`} title="Shuffle"><FontAwesomeIcon icon={faRandom}/></button>
            <button onClick={()=>setRepeat(r=>!r)} className={`${styles.ctrlBtn} ${repeat?styles.active:''}`} title="Repeat"><FontAwesomeIcon icon={faRedo}/></button>
            <button onClick={()=>setIsMuted(m=>!m)} className={styles.ctrlBtn} title="Mute (autoplay)">
              <FontAwesomeIcon icon={isMuted?faVolumeMute:faVolumeUp}/>
            </button>
          </div>

          {now && (
            <div className={styles.nowPlaying}>
              <strong>Now playing:</strong> {now.artiste || 'Artist'} — {now.titre || 'Title'} {now.annee ? `(${now.annee})` : ''}
            </div>
          )}
        </div>

        <div className={styles.playlistRight}>
          <h3>Videos in this playlist</h3>
          <ol className={styles.videoList}>
            {videoList.map((it, idx) => {
              const vd = it.video_id;
              const thumb = getEmbedThumb(vd?.youtubeUrl);
              return (
                <li key={vd?._id || idx} className={`${styles.videoRow} ${idx===current ? styles.activeRow : ''}`} onClick={()=>setCurrent(idx)}>
                  <img src={thumb}
                       alt={vd?.titre || 'Video'}
                       onError={(e)=>{e.currentTarget.src='/images/video-placeholder.jpg';}} />
                  <div className={styles.videoInfo}>
                    <div className={styles.videoTitle}>{vd?.titre || 'Untitled'}</div>
                    <div className={styles.videoSub}>{vd?.artiste || 'Unknown artist'} {vd?.annee ? `(${vd.annee})` : ''}</div>
                  </div>
                  {isOwner && (
                    <button className={styles.removeBtn} onClick={(e)=>{e.stopPropagation(); removeVideo(vd._id);}} title="Remove">
                      <FontAwesomeIcon icon={faTrash}/>
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <ConfirmModal
        isOpen={showConfirmDelete}
        title="Delete playlist?"
        message={`Do you really want to delete "${playlist.nom}"?`}
        onCancel={()=>setShowConfirmDelete(false)}
        onConfirm={async ()=>{
          try{
            await playlistAPI.deletePlaylist(id);
            navigate('/dashboard/playlists');
          }catch(e){
            setToastMessage('Error while deleting'); setToastType('error'); setShowToast(true);
            setShowConfirmDelete(false);
          }
        }}
      />

      <Toast show={showToast} type={toastType} onClose={()=>setShowToast(false)}>{toastMessage}</Toast>
    </div>
  );
};

export default UserPlaylistDetail;
