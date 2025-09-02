import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { videoAPI } from '../../../../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import {
  faHeart,
  faComment,
  faEye,
  faShare,
  faSpinner,
  faExclamationTriangle,
  faCopy,
  faList,
  faFilter,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

/* ========= Confirm Dialog (inchangé, compact) ========= */
const ConfirmDialog = ({ open, title='Delete', message='Are you sure?', confirmText='Delete', cancelText='Cancel', onConfirm, onCancel }) => {
  const cardRef = useRef(null);
  const confirmBtnRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); if (e.key === 'Enter') onConfirm?.(); };
    document.addEventListener('keydown', onKey);
    const t = setTimeout(() => confirmBtnRef.current?.focus(), 0);
    return () => { clearTimeout(t); document.removeEventListener('keydown', onKey); };
  }, [open, onCancel, onConfirm]);
  const handleOverlayClick = (e) => { if (cardRef.current && !cardRef.current.contains(e.target)) onCancel?.(); };
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={handleOverlayClick}>
      <div className={styles.modalCard} ref={cardRef} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4>{title}</h4>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Close">
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        <div className={styles.modalBody}><p>{message}</p></div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancel} onClick={onCancel}>{cancelText}</button>
          <button className={styles.modalConfirm} onClick={onConfirm} ref={confirmBtnRef}>{confirmText}</button>
        </div>
      </div>
    </div>
  );
};
/* ========= /Confirm Dialog ========= */

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Main states
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Memories
  const [memories, setMemories] = useState([]);
  const [allMemories, setAllMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);

  // Video interactions
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // UI
  const [videosLoading, setVideosLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState('');

  // Confirm
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', onConfirm: null });

  // *** Mobile comments bottom sheet ***
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);

  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const requestTokenRef = useRef({ video: 0, memories: 0 });

  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  useEffect(() => {
    fetchAllVideos();
    fetchAllMemories();
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchVideoById(id);
    fetchVideoMemories(id);
    window.scrollTo(0, 0);
    localStorage.setItem('currentVideoId', id);
  }, [id]);

  const handleStorageChange = (event) => {
    if (event.key === 'memoriesUpdated' && event.newValue) fetchVideoMemories(id);
  };

  /* ---------- Data fetching ---------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const videosData = await videoAPI.getAllVideos({ type: 'music', limit: '50' });
      setAllVideos(Array.isArray(videosData) ? videosData : []);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchAllMemories = async () => {
    try {
      setMemoriesLoading(true);
      let memoriesData = await videoAPI.getAllMemories();
      if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
        try {
          const cached = localStorage.getItem('allMemories');
          if (cached) memoriesData = JSON.parse(cached);
        } catch {}
      }
      setAllMemories(Array.isArray(memoriesData) ? memoriesData : []);
      try {
        localStorage.setItem('allMemories', JSON.stringify(Array.isArray(memoriesData) ? memoriesData : []));
        localStorage.setItem('memoriesFetchTime', Date.now().toString());
      } catch {}
    } finally {
      setMemoriesLoading(false);
    }
  };

  const filterMemoriesForCurrentVideo = (memoriesArray, videoId) => {
    if (!videoId || !Array.isArray(memoriesArray) || !memoriesArray.length) return [];
    const currentVideoId = videoId.toString().trim();
    return memoriesArray.filter(memory => {
      const memoryVideoId =
        (memory.video && typeof memory.video === 'object' ? memory.video._id : null) ||
        (memory.video && typeof memory.video === 'string' ? memory.video : null) ||
        memory.videoId ||
        memory.video_id;
      const normalized = memoryVideoId ? memoryVideoId.toString().trim() : '';
      return normalized === currentVideoId;
    });
  };

  const fetchVideoById = async (videoId) => {
    const myToken = ++requestTokenRef.current.video;
    try {
      setLoading(true);
      setError(null);
      const videoData = await videoAPI.getVideoById(videoId);
      if (myToken !== requestTokenRef.current.video) return;
      if (videoData) {
        setVideo(videoData);
        setUserLiked(videoData.userInteraction?.liked || false);
        setViewCount(videoData.vues || 0);
        setLikeCount(videoData.likes || 0);
      } else {
        setError('Unable to load video details');
      }
    } catch {
      if (myToken !== requestTokenRef.current.video) return;
      setError('Error loading video');
    } finally {
      if (myToken === requestTokenRef.current.video) setLoading(false);
    }
  };

  const fetchVideoMemories = async (videoId) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    const myToken = ++requestTokenRef.current.memories;
    try {
      setMemoriesLoading(true);

      // 1) cache local
      const memFromState = allMemories.length > 0 ? filterMemoriesForCurrentVideo(allMemories, videoId) : [];
      if (myToken !== requestTokenRef.current.memories) return;
      if (memFromState.length > 0) {
        setMemories(formatMemories(memFromState, videoId));
        return;
      }

      // 2) localStorage
      try {
        const cached = localStorage.getItem('allMemories');
        if (cached) {
          const parsed = JSON.parse(cached);
          const filtered = filterMemoriesForCurrentVideo(parsed, videoId);
          if (myToken !== requestTokenRef.current.memories) return;
          if (filtered.length > 0) {
            setMemories(formatMemories(filtered, videoId));
            setAllMemories(parsed);
            return;
          }
        }
      } catch {}

      // 3) API stricte
      const apiMem = await videoAPI.getVideoMemories(videoId);
      if (myToken !== requestTokenRef.current.memories) return;
      if (Array.isArray(apiMem)) {
        const strictly = apiMem.filter(m => {
          const vid =
            (m.video && typeof m.video === 'object' ? m.video._id : null) ||
            (typeof m.video === 'string' ? m.video : null) ||
            m.videoId || m.video_id;
        return vid && vid.toString() === videoId.toString();
        });
        setMemories(formatMemories(strictly, videoId));
        retryCountRef.current = 0;
      } else {
        setMemories([]);
      }
    } catch {
      setMemories([]);
    } finally {
      if (myToken === requestTokenRef.current.memories) {
        fetchingRef.current = false;
        setMemoriesLoading(false);
        retryCountRef.current = 0;
      }
    }
  };

  /* ---------- Memories helpers ---------- */
  const formatMemories = (memoriesData, currentVideoId = id) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) return [];
    return memoriesData.map(memory => {
      let username = 'User';
      if (memory.auteur) {
        if (typeof memory.auteur === 'object') {
          const prenom = memory.auteur.prenom || '';
          const nom = memory.auteur.nom || '';
          username = (prenom || nom) ? `${prenom} ${nom}`.trim() : (memory.auteur.username || 'User');
        }
      } else if (memory.username) {
        username = memory.username;
      }

      const videoDetails = {
        id: currentVideoId,
        title: memory.video?.titre || memory.videoTitle || video?.titre || 'Untitled video',
        artist: memory.video?.artiste || memory.videoArtist || video?.artiste || 'Unknown artist',
        year: memory.video?.annee || memory.videoYear || video?.annee || '----'
      };

      return {
        id: memory._id || memory.id || `memory-${Math.random()}`,
        username,
        type: memory.type || 'posted',
        videoId: videoDetails.id,
        videoTitle: videoDetails.title,
        videoArtist: videoDetails.artist,
        videoYear: videoDetails.year,
        imageUrl: memory.auteur?.photo_profil || memory.imageUrl || '/images/default-avatar.jpg',
        content: memory.contenu || memory.content || '',
        likes: memory.likes || 0,
        comments: memory.nb_commentaires || memory.comments || 0,
        auteur: memory.auteur,
        video: memory.video,
        userInteraction: memory.userInteraction || { liked: false, disliked: false, isAuthor: false },
        replies: memory.replies || [],
        showReplies: false
      };
    });
  };

  const handleLikeMemory = async (memoryId) => {
    try {
      setMemories(memories.map(m => (m.id === memoryId
        ? { ...m, likes: (m.userInteraction?.liked ? Math.max(0, (m.likes || 0) - 1) : (m.likes || 0) + 1), userInteraction: { ...(m.userInteraction || {}), liked: !m.userInteraction?.liked } }
        : m
      )));
      const r = await videoAPI.likeMemory(memoryId);
      if (r?.success && r.data) {
        setMemories(cur => cur.map(m => (m.id === memoryId ? {
          ...m, likes: r.data.likes, userInteraction: { ...(m.userInteraction || {}), liked: r.data.liked }
        } : m)));
      }
    } catch {}
  };

  const handleAddReply = async (memoryId, replyText) => {
    try {
      const response = await api.post(`/api/memories/${memoryId}/replies`, { contenu: replyText });
      if (response.data?.success) {
        const updated = memories.map(m => (m.id === memoryId)
          ? { ...m, nb_commentaires: (m.nb_commentaires || 0) + 1, replies: [...(m.replies || []), response.data.data] }
          : m
        );
        setMemories(updated);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const openConfirm = (title, message, onConfirm) => {
    setConfirm({ open: true, title, message, onConfirm: () => {
      setConfirm({ open: false, title: '', message: '', onConfirm: null });
      onConfirm();
    }});
  };
  const cancelConfirm = () => setConfirm({ open: false, title: '', message: '', onConfirm: null });

  /* ---------- Video interactions ---------- */
  const handleLikeVideo = async () => {
    if (isLiking || !video?._id) return;
    try {
      setIsLiking(true);
      setUserLiked((prev) => !prev);
      setLikeCount((prev) => (userLiked ? Math.max(0, prev - 1) : prev + 1));
      try {
        await videoAPI.likeVideo(video._id);
      } catch {
        // revert if needed
      }
    } finally {
      setIsLiking(false);
    }
  };

  /* ---------- Renders helpers ---------- */
  const renderMemoriesList = () => (
    <>
      {memoriesLoading ? (
        <div className={styles.recommendedLoading}>
          <FontAwesomeIcon icon={faSpinner} spin /> Loading comments…
        </div>
      ) : memories?.length ? (
        memories.map(m => (
          <MemoryCard
            key={m.id}
            memory={m}
            baseUrl={baseUrl}
            onLike={handleLikeMemory}
            onAddReply={handleAddReply}
          />
        ))
      ) : (
        <div className={styles.emptyMemories}>No comments yet.</div>
      )}
    </>
  );

  /* ---------- JSX ---------- */
  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          {/* Player */}
          <div className={styles.videoPlayerContainer}>
            <div className={styles.videoWrapper}>
              {/* Intégration iframe/lecteur selon ton implémentation */}
              {video?.youtubeUrl ? (
                <iframe
                  src={video.youtubeUrl.replace('watch?v=', 'embed/')}
                  title={video?.titre || 'Video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div style={{padding:'16px', color:'#fff'}}>No video url</div>
              )}
            </div>
          </div>

          {/* Info / actions */}
          <div className={styles.videoInfoBar}>
            <h2 className={styles.videoTitle}>
              <span>{video?.artiste || 'Artist'}</span> – {video?.titre || 'Title'} ({video?.annee || '----'})
            </h2>
            <div className={styles.videoStats}>
              <div className={`${styles.statItem} ${userLiked ? styles.liked : ''}`} onClick={handleLikeVideo}>
                <FontAwesomeIcon icon={faHeart} />
                <span>{likeCount}</span>
              </div>
              <div className={styles.statItem}>
                <FontAwesomeIcon icon={faEye} />
                <span>{viewCount}</span>
              </div>
              <div className={styles.statItem} onClick={() => setShowCommentsSheet(true)}>
                <FontAwesomeIcon icon={faComment} />
                <span>Comments</span>
              </div>
              <div className={styles.statItem} onClick={() => setShowShareOptions(v => !v)}>
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </div>
            </div>
          </div>

          {/* Bouton Comments mobile */}
          <div className={styles.mobileCommentsBar}>
            <button
              className={styles.mobileCommentsButton}
              onClick={() => setShowCommentsSheet(true)}
              aria-label="Show comments"
            >
              <FontAwesomeIcon icon={faComment} />
              <span>Comments</span>
              {!!memories?.length && <span className={styles.badge}>{memories.length}</span>}
            </button>
          </div>

          {/* Recommandations (sous le bouton comme YouTube) */}
          <section className={styles.recommendedVideosSection}>
            <h3 className={styles.recommendedSectionTitle}>Recommended</h3>
            <div className={styles.recommendedVideosGrid}>
              {videosLoading ? (
                <div className={styles.recommendedLoading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Loading…
                </div>
              ) : (
                (allVideos || []).slice(0, 12).map((v) => (
                  <Link
                    to={`/dashboard/videos/${v._id}`}
                    key={v._id}
                    className={`${styles.recommendedVideo} ${v._id === id ? styles.currentVideo : ''}`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${(v.youtubeUrl||'').split('v=')[1]?.split('&')[0] || ''}/hqdefault.jpg`}
                      alt={`${v.artiste || 'Artist'} - ${v.titre || 'Title'}`}
                      className={styles.recommendedImg}
                      onError={(e)=>{e.target.src='/images/video-placeholder.jpg';}}
                    />
                    <div className={styles.recommendedInfo}>
                      <span className={styles.recommendedArtist}>{v.artiste || 'Artist'}</span>
                      <span className={styles.recommendedTitle}>– {v.titre || 'Title'} ({v.annee || '----'})</span>
                    </div>
                    {v._id === id && <span className={styles.currentlyPlaying}>Playing</span>}
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>

        {/* (Optionnel) Sidebar desktop pour commentaires — masquée en mobile via CSS */}
        <aside className={styles.rightCards}>
          {renderMemoriesList()}
        </aside>
      </div>

      {/* Modales */}
      {showPlaylistModal && (
        <PlaylistModal
          videoId={id}
          onClose={() => setShowPlaylistModal(false)}
          onSuccess={() => setShowPlaylistModal(false)}
        />
      )}

      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        onConfirm={confirm.onConfirm}
        onCancel={() => setConfirm({ open: false, title: '', message: '', onConfirm: null })}
      />

      {/* Bottom sheet mobile pour commentaires */}
      <CommentsSheet open={showCommentsSheet} onClose={() => setShowCommentsSheet(false)}>
        {renderMemoriesList()}
      </CommentsSheet>
    </div>
  );
};

/* ====== Bottom Sheet component ====== */
const CommentsSheet = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div
        className={styles.sheet}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h4>Comments</h4>
          <button className={styles.sheetClose} onClick={onClose} aria-label="Close comments">×</button>
        </div>
        <div className={styles.sheetBody}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default VideoDetail;
