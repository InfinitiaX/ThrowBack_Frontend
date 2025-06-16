import React, { useState, useRef, useEffect } from 'react';
import styles from './Shorts.module.css';
import { FaHeart, FaShareAlt, FaStar, FaPlay, FaPause, FaTimes, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';
import axios from 'axios';

// Fonction utilitaire pour formater les secondes en mm:ss
function formatTime(sec) {
  if (!sec || isNaN(sec)) return '00:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export default function Shorts() {
  // Index dynamique de la vidéo centrale (mise en avant)
  const [centerIdx, setCenterIdx] = useState(2);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ titre: '', artiste: '', video: null });
  const [errDuree, setErrDuree] = useState('');
  const [shorts, setShorts] = useState([]);
  const videoRef = useRef();
  const centerVideoRef = useRef(null);
  const [isCenterPaused, setIsCenterPaused] = useState(false);
  const [isCenterPlaying, setIsCenterPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(true);

  const fetchShorts = async () => {
    try {
      const res = await axios.get('/api/videos?type=short');
      setShorts(res.data.data);
    } catch (err) {
      setShorts([]);
    }
  };

  useEffect(() => {
    fetchShorts();
    // Réinitialise le centre au milieu de la liste quand on recharge
    setCenterIdx(2);
  }, []);

  // Met en pause toutes les vidéos du carousel à chaque changement de centerIdx, de shorts ou de pause
  useEffect(() => {
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      // On met tout en pause
      video.pause();
      video.currentTime = 0;
    });
  }, [centerIdx, shorts, isCenterPaused]);

  // Ajoute un event listener pour détecter la pause sur la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    const handlePause = () => setIsCenterPaused(true);
    const handlePlay = () => setIsCenterPaused(false);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [centerIdx, shorts]);

  // Ajoute un event listener pour suivre l'état de lecture de la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    const handlePause = () => setIsCenterPlaying(false);
    const handlePlay = () => setIsCenterPlaying(true);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);
    return () => {
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
    };
  }, [centerIdx, shorts]);

  // Synchronise la barre de progression avec la vidéo centrale
  useEffect(() => {
    const video = centerVideoRef.current;
    if (!video) return;
    const updateProgress = () => {
      setProgress(video.currentTime);
      setDuration(video.duration || 0);
    };
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    return () => {
      video.removeEventListener('timeupdate', updateProgress);
      video.removeEventListener('loadedmetadata', updateProgress);
    };
  }, [centerIdx, shorts]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setErrDuree('');
    if (file) {
      const url = URL.createObjectURL(file);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(url);
        const duration = video.duration;
        if (duration < 10 || duration > 30) {
          setErrDuree('The video must be between 10 and 30 seconds long.');
          setForm(f => ({ ...f, video: null }));
        } else {
          setErrDuree('');
          setForm(f => ({ ...f, video: file, duree: Math.round(duration) }));
        }
      };
      video.src = url;
    }
  };

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.video) {
      setErrDuree('Please select a valid video.');
      return;
    }
    const data = new FormData();
    data.append('titre', form.titre);
    data.append('artiste', form.artiste);
    data.append('duree', form.duree || 15);
    data.append('videoFile', form.video);

    try {
      const token = localStorage.getItem('token');
      await axios.post('https://throwback-backend.onrender.com/api/videos/short', data, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      alert('Short added!');
      setShowModal(false);
      setForm({ titre: '', artiste: '', video: null });
      setErrDuree('');
      fetchShorts(); // recharge la liste après ajout
    } catch (err) {
      setErrDuree(err.response?.data?.message || err.message);
    }
  };

  // Quand on clique sur une sideCard, la vidéo centrale doit être en pause et toutes les vidéos du carrousel aussi
  const handleSideCardClick = (realIdx) => {
    setCenterIdx(realIdx);
    setIsCenterPlaying(false);
    // Met en pause toutes les vidéos du carrousel
    const videos = document.querySelectorAll(`.${styles.carouselRow} video`);
    videos.forEach((video) => {
      video.pause();
      video.currentTime = 0;
    });
    // On ne joue pas la vidéo centrale automatiquement !
  };

  // Quand on clique sur mute/unmute
  const handleMuteToggle = () => {
    setIsMuted(m => !m);
    if (centerVideoRef.current) {
      centerVideoRef.current.muted = !isMuted;
    }
  };

  return (
    <div className={styles.shorts_bg}>
      <div className={styles.shortsContentBg}>
        <div className={styles.headerRow}>
          <button className={styles.newPostBtn} onClick={() => setShowModal(true)}>Add Short</button>
        </div>
        <div className={styles.carouselRow}>
          {shorts.length === 0 && <div>No shorts to display.</div>}
          {shorts.length > 0 && (() => {
            // Calcul de la fenêtre de 5 shorts centrée sur centerIdx
            let window = [];
            for (let i = centerIdx - 2; i <= centerIdx + 2; i++) {
              if (i < 0 || i >= shorts.length) {
                window.push(null);
              } else {
                window.push({ short: shorts[i], realIdx: i });
              }
            }
            return window.map((item, idx) => {
              if (!item) {
                return <div className={styles.sideCard} key={idx} style={{opacity:0.3}} />;
              }
              const { short, realIdx } = item;
              if (idx === 2) {
                // Card centrale
                return (
                  <div className={styles.centerCard} key={short._id}>
                    <div className={styles.centerImgWrap}>
                      <video
                        key={short._id}
                        ref={centerVideoRef}
                        src={short.youtubeUrl}
                        controls={false}
                        className={styles.centerImg}
                        autoPlay={false}
                        muted={isMuted}
                      />
                      <div className={styles.centerOverlay}></div>
                      <button
                        className={styles.playBtn}
                        onClick={() => {
                          if (centerVideoRef.current) {
                            if (isCenterPlaying) {
                              centerVideoRef.current.pause();
                            } else {
                              centerVideoRef.current.play();
                            }
                          }
                        }}
                      >
                        {isCenterPlaying ? <FaPause /> : <FaPlay />}
                      </button>
                      <button
                        className={styles.muteBtn}
                        onClick={handleMuteToggle}
                        style={{position: 'absolute', bottom: 18, right: 18, zIndex: 3, background: 'rgba(255,255,255,0.85)', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer'}}
                      >
                        {isMuted ? <FaVolumeMute style={{color: '#b31217', fontSize: '1.5rem'}} /> : <FaVolumeUp style={{color: '#b31217', fontSize: '1.5rem'}} />}
                      </button>
                    </div>
                    {/* Barre de progression */}
                    <input
                      type="range"
                      min={0}
                      max={duration || 0}
                      value={progress}
                      step={0.1}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setProgress(val);
                        if (centerVideoRef.current) {
                          centerVideoRef.current.currentTime = val;
                        }
                      }}
                      className={styles.progressBar}
                      style={{ width: '90%', margin: '12px auto 0 auto', display: 'block' }}
                      disabled={duration === 0}
                    />
                    <div style={{width: '90%', margin: '0 auto 8px auto', display: 'flex', justifyContent: 'space-between', fontSize: '0.98rem', color: '#fff', opacity: 0.85}}>
                      <span>{formatTime(progress)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                    <div className={styles.centerInfo}>
                      <div className={styles.centerUserRow}>
                        <span className={styles.username}>{short.artiste}</span>
                      </div>
                      <div className={styles.centerDesc}>{short.description}</div>
                      <div className={styles.centerMusic}>🎵 {short.artiste}</div>
                      <div className={styles.centerActions}>
                        <span className={styles.featured}><FaStar /> Featured</span>
                        <button className={styles.actionBtn}><FaHeart /></button>
                        <button className={styles.actionBtn}><FaShareAlt /></button>
                      </div>
                    </div>
                  </div>
                );
              } else {
                // Cards latérales, cliquables pour changer le centre
                return (
                  <div className={styles.sideCard} key={short._id} onClick={() => handleSideCardClick(realIdx)} style={{cursor:'pointer'}}>
                    <video
                      src={short.youtubeUrl}
                      controls={false}
                      className={styles.sideImg}
                      autoPlay={false}
                      muted
                    />
                    <div className={styles.views}><FaPlay /> {short.duree || 0}s</div>
                  </div>
                );
              }
            });
          })()}
        </div>
      </div>
      {showModal && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <button className={styles.closeBtn} onClick={() => setShowModal(false)}><FaTimes /></button>
            <h2>Add a Short</h2>
            <form onSubmit={handleSubmit} className={styles.modalForm}>
              <label>
                Title
                <input name="titre" value={form.titre} onChange={handleChange} required />
              </label>
              <label>
                Artist
                <input name="artiste" value={form.artiste} onChange={handleChange} required />
              </label>
              <label>
                Video (10–30 s)
                <input id="videoFile" name="videoFile" type="file" accept="video/*" required onChange={handleFileChange} ref={videoRef} />
              </label>
              {errDuree && <small className={styles.errDuree}>{errDuree}</small>}
              <button type="submit" className={styles.uploadBtn}>Upload</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 