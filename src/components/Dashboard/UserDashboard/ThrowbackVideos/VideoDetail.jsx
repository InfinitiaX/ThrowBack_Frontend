import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
  faTimes,
  faPlus
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

/* --------- Mini confirm --------- */
const ConfirmDialog = ({ open, title='Delete', message='Are you sure?', onConfirm, onCancel }) => {
  const cardRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onCancel?.(); if (e.key === 'Enter') onConfirm?.(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel, onConfirm]);
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onMouseDown={(e)=>{ if (cardRef.current && !cardRef.current.contains(e.target)) onCancel?.(); }}>
      <div className={styles.modalCard} ref={cardRef} onMouseDown={(e)=>e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h4>{title}</h4>
          <button className={styles.modalClose} onClick={onCancel} aria-label="Close">×</button>
        </div>
        <div className={styles.modalBody}><p>{message}</p></div>
        <div className={styles.modalFooter}>
          <button className={styles.modalCancel} onClick={onCancel}>Cancel</button>
          <button className={styles.modalConfirm} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </div>
  );
};

/* --------- Bottom-sheet mobile pour les comments --------- */
const CommentsSheet = ({ open, onClose, children }) => {
  if (!open) return null;
  return (
    <div className={styles.sheetOverlay} onClick={onClose}>
      <div className={styles.sheet} role="dialog" aria-modal="true" onClick={(e)=>e.stopPropagation()}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h4>Comments</h4>
          <button className={styles.sheetClose} onClick={onClose} aria-label="Close comments">×</button>
        </div>
        <div className={styles.sheetBody}>{children}</div>
      </div>
    </div>
  );
};

const VideoDetail = () => {
  const { id } = useParams();

  /* Video + recommandations */
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState(null);

  /* Interactions vidéo */
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  /* Comments (memories) */
  const [memories, setMemories] = useState([]); // { id, content, replies: [...] }
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoryText, setMemoryText] = useState('');

  /* UI divers */
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [confirm, setConfirm] = useState({ open:false, onConfirm:null });

  /* Anti course conditions */
  const requestRef = useRef({ video:0, memories:0 });

  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  /* ------------ INIT ------------- */
  useEffect(() => { fetchAllVideos(); }, []);
  useEffect(() => {
    if (!id) return;
    fetchVideoById(id);
    /* on force un fetch "strict" des comments pour CETTE vidéo */
    fetchVideoMemoriesStrict(id);
    window.scrollTo(0,0);
    localStorage.setItem('currentVideoId', id);
  }, [id]);

  /* ------------ Fetch vidéos ------------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const list = await videoAPI.getAllVideos({ type:'music', limit:'50' });
      setAllVideos(Array.isArray(list)? list : []);
    } finally { setVideosLoading(false); }
  };

  const fetchVideoById = async (videoId) => {
    const token = ++requestRef.current.video;
    try {
      setLoading(true); setError(null);
      const data = await videoAPI.getVideoById(videoId);
      if (token !== requestRef.current.video) return;
      if (!data) { setError('Unable to load video'); return; }
      setVideo(data);
      setUserLiked(Boolean(data.userInteraction?.liked));
      setViewCount(data.vues || 0);
      setLikeCount(data.likes || 0);
    } catch {
      if (token !== requestRef.current.video) return;
      setError('Error loading video');
    } finally {
      if (token === requestRef.current.video) setLoading(false);
    }
  };

  /* ------------ Fetch comments/replies (STRICT par vidéo) ------------- */
  const normalizeId = (x) => (x? x.toString() : '');
  const belongsToVideo = (m, videoId) => {
    const vid =
      (m.video && typeof m.video === 'object' ? m.video._id : null) ||
      (typeof m.video === 'string' ? m.video : null) ||
      m.videoId || m.video_id;
    return normalizeId(vid) === normalizeId(videoId);
  };

  const normalizeReply = (r) => ({
    id: r._id || r.id,
    content: r.contenu || r.content || '',
    likes: r.likes || 0,
    userInteraction: r.userInteraction || { liked:false, disliked:false, isAuthor:false },
    auteur: r.auteur,
    username: (r.auteur && `${r.auteur.prenom || ''} ${r.auteur.nom || ''}`.trim()) || r.username || 'User',
    createdAt: r.createdAt
  });

  const normalizeMemory = (m, currentVideo) => ({
    id: m._id || m.id,
    username:
      (m.auteur && `${m.auteur.prenom || ''} ${m.auteur.nom || ''}`.trim()) ||
      m.username || 'User',
    type: m.type || 'posted',
    imageUrl: m.auteur?.photo_profil || m.imageUrl || '/images/default-avatar.jpg',
    content: m.contenu || m.content || '',
    likes: m.likes || 0,
    userInteraction: m.userInteraction || { liked:false, disliked:false, isAuthor:false },
    videoArtist: m.video?.artiste || m.videoArtist || currentVideo?.artiste || 'Artist',
    videoTitle:  m.video?.titre   || m.videoTitle  || currentVideo?.titre   || 'Title',
    videoYear:   m.video?.annee   || m.videoYear   || currentVideo?.annee   || '—',
    replies: Array.isArray(m.replies) ? m.replies.map(normalizeReply) : []
  });

  /** ALWAYS hits the strict endpoint first, then merges safely with cache (no overwrite) */
  const fetchVideoMemoriesStrict = async (videoId) => {
    const token = ++requestRef.current.memories;
    try {
      setMemoriesLoading(true);

      // 1) strict route (prioritaire) — utils/api expose déjà cette route publique
      let list = await videoAPI.getVideoMemories(videoId); // /api/public/videos/:id/memories  :contentReference[oaicite:1]{index=1}
      list = Array.isArray(list) ? list.filter(m => belongsToVideo(m, videoId)) : [];

      // 2) merge éventuel avec cache local (sans écraser ce qui vient d’être posté en optimiste)
      try {
        const cached = localStorage.getItem('allMemories');
        if (cached) {
          const parsed = JSON.parse(cached).filter(m => belongsToVideo(m, videoId));
          // dédupe par id
          const ids = new Set(list.map(m => (m._id || m.id)));
          const merged = [...list, ...parsed.filter(m => !ids.has(m._id || m.id))];
          list = merged;
        }
      } catch {}

      if (token !== requestRef.current.memories) return;
      setMemories(list.map(m => normalizeMemory(m, video)));
    } catch {
      // fallback très simple: aucun écrasement
      if (token !== requestRef.current.memories) return;
      setMemories((cur) => cur); // conserve l’existant si l’appel échoue
    } finally {
      if (token === requestRef.current.memories) setMemoriesLoading(false);
    }
  };

  /* ------------ Décompte affiché (YouTube-like = nb de root comments) ------------- */
  const commentsCount = memories.length;

  /* ------------ Actions vidéo ------------- */
  const handleLikeVideo = async () => {
    if (!video?._id || isLiking) return;
    setIsLiking(true);
    setUserLiked((v)=>!v);
    setLikeCount((c)=> userLiked ? Math.max(0, c-1) : c+1);
    try { await videoAPI.likeVideo?.(video._id); } catch {}
    setIsLiking(false);
  };

  /* ------------ Actions comments ------------- */
  const handleSendComment = async () => {
    const text = memoryText.trim();
    if (!text || !id) return;

    // 1) Optimistic add (ne disparaît plus)
    const tmpId = `tmp-${Date.now()}`;
    setMemories((arr) => [{
      id: tmpId,
      username: 'You',
      type: 'posted',
      imageUrl: '/images/default-avatar.jpg',
      content: text,
      likes: 0,
      userInteraction: { liked:false, disliked:false, isAuthor:true },
      videoArtist: video?.artiste,
      videoTitle: video?.titre,
      videoYear: video?.annee,
      replies: []
    }, ...arr]);
    setMemoryText('');

    // 2) POST robuste (plusieurs fallbacks)
    try {
      // a) route publique liée à la vidéo (si présente côté backend)
      try {
        const r = await api.post(`/api/public/videos/${id}/memories`, { contenu:text });
        const created = r?.data?.data || r?.data;
        if (created && (created._id || created.id)) {
          setMemories((arr)=>arr.map(m => m.id===tmpId ? normalizeMemory(created, video) : m));
          // alimente le cache
          try {
            const cache = JSON.parse(localStorage.getItem('allMemories') || '[]');
            localStorage.setItem('allMemories', JSON.stringify([created, ...cache]));
          } catch {}
          return;
        }
      } catch {}

      // b) route auth
      try {
        const r = await api.post('/api/memories', { contenu:text, video:id });
        const created = r?.data?.data || r?.data;
        if (created && (created._id || created.id)) {
          setMemories((arr)=>arr.map(m => m.id===tmpId ? normalizeMemory(created, video) : m));
          try {
            const cache = JSON.parse(localStorage.getItem('allMemories') || '[]');
            localStorage.setItem('allMemories', JSON.stringify([created, ...cache]));
          } catch {}
          return;
        }
      } catch {}

      // c) route publique simple
      const r = await api.post('/api/public/memories', { contenu:text, video:id });
      const created = r?.data?.data || r?.data;
      if (created && (created._id || created.id)) {
        setMemories((arr)=>arr.map(m => m.id===tmpId ? normalizeMemory(created, video) : m));
        try {
          const cache = JSON.parse(localStorage.getItem('allMemories') || '[]');
          localStorage.setItem('allMemories', JSON.stringify([created, ...cache]));
        } catch {}
      } else {
        // refetch strict si pas de payload exploitable
        fetchVideoMemoriesStrict(id);
      }
    } catch {
      // rollback soft: on laisse l’optimiste (ou on peut la retirer si tu préfères)
    }
  };

  const handleLikeMemory = async (memoryId) => {
    setMemories((arr)=>arr.map(m => m.id===memoryId
      ? { ...m, userInteraction:{ ...(m.userInteraction||{}), liked: !m.userInteraction?.liked }, likes: m.userInteraction?.liked ? Math.max(0,(m.likes||0)-1) : (m.likes||0)+1 }
      : m
    ));
    try {
      // utilitaire si dispo, sinon endpoint direct
      if (videoAPI.likeMemory) await videoAPI.likeMemory(memoryId);
      else await api.post(`/api/memories/${memoryId}/like`);
    } catch {}
  };

  const handleAddReply = async (memoryId, text) => {
    const replyTmp = {
      id: `tmp-r-${Date.now()}`,
      content: text,
      likes: 0,
      userInteraction: { liked:false, disliked:false, isAuthor:true },
      username: 'You'
    };
    setMemories((arr)=>arr.map(m => m.id===memoryId ? { ...m, replies:[replyTmp, ...m.replies] } : m));
    try {
      // auth puis public
      try {
        const r = await api.post(`/api/memories/${memoryId}/replies`, { contenu:text });
        const created = r?.data?.data || r?.data;
        if (created && (created._id || created.id)) {
          setMemories((arr)=>arr.map(m => {
            if (m.id !== memoryId) return m;
            const fixed = m.replies.map(rep => rep.id===replyTmp.id ? normalizeReply(created) : rep);
            return { ...m, replies: fixed };
          }));
          return;
        }
      } catch {}
      const r = await api.post(`/api/public/memories/${memoryId}/replies`, { contenu:text });
      const created = r?.data?.data || r?.data;
      if (created && (created._id || created.id)) {
        setMemories((arr)=>arr.map(m => {
          if (m.id !== memoryId) return m;
          const fixed = m.replies.map(rep => rep.id===replyTmp.id ? normalizeReply(created) : rep);
          return { ...m, replies: fixed };
        }));
      } else {
        fetchVideoMemoriesStrict(id);
      }
    } catch {
      // noop: on laisse l’optimiste
    }
  };

  const handleLikeReply = async (memoryId, replyId) => {
    setMemories((arr)=>arr.map(m => {
      if (m.id !== memoryId) return m;
      const replies = m.replies.map(r => r.id===replyId
        ? { ...r, userInteraction:{ ...(r.userInteraction||{}), liked: !r.userInteraction?.liked }, likes: r.userInteraction?.liked ? Math.max(0,(r.likes||0)-1) : (r.likes||0)+1 }
        : r
      );
      return { ...m, replies };
    }));
    try {
      await api.post(`/api/memories/${memoryId}/replies/${replyId}/like`);
    } catch {
      try { await api.post(`/api/public/memories/${memoryId}/replies/${replyId}/like`); } catch {}
    }
  };

  const handleDeleteMemory = (memoryId) => {
    setConfirm({
      open:true,
      onConfirm: async () => {
        setConfirm({ open:false, onConfirm:null });
        setMemories((arr)=>arr.filter(m=>m.id!==memoryId));
        try {
          await api.delete(`/api/memories/${memoryId}`);
        } catch {
          try { await api.delete(`/api/public/memories/${memoryId}`); }
          catch { fetchVideoMemoriesStrict(id); }
        }
      }
    });
  };

  const handleDeleteReply = (memoryId, replyId) => {
    setConfirm({
      open:true,
      onConfirm: async () => {
        setConfirm({ open:false, onConfirm:null });
        setMemories((arr)=>arr.map(m => {
          if (m.id !== memoryId) return m;
          return { ...m, replies: m.replies.filter(r => r.id !== replyId) };
        }));
        try {
          await api.delete(`/api/memories/${memoryId}/replies/${replyId}`);
        } catch {
          try { await api.delete(`/api/public/memories/${memoryId}/replies/${replyId}`); }
          catch { fetchVideoMemoriesStrict(id); }
        }
      }
    });
  };

  /* ------------ Share helpers ------------- */
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = async () => {
    try { await navigator.clipboard.writeText(currentUrl); setShowShareOptions(false); } catch {}
  };

  /* ------------ Renders ------------- */
  const renderMemoriesList = () => (
    <>
      {/* Zone de saisie */}
      <div className={styles.memoryInputContainer}>
        <input
          className={styles.memoryInput}
          type="text"
          placeholder="Add a public comment…"
          value={memoryText}
          onChange={(e)=>setMemoryText(e.target.value)}
          onKeyDown={(e)=>{ if (e.key==='Enter') handleSendComment(); }}
        />
        <button className={styles.commentButton} onClick={handleSendComment} aria-label="Send">
          <FontAwesomeIcon icon={faComment}/>
        </button>
      </div>

      {memoriesLoading ? (
        <div className={styles.recommendedLoading}><FontAwesomeIcon icon={faSpinner} spin/> Loading comments…</div>
      ) : (
        (memories||[]).map(m => (
          <MemoryCard
            key={m.id}
            memory={m}
            baseUrl={baseUrl}
            currentVideoId={id}
            onLike={handleLikeMemory}
            onAddReply={handleAddReply}
            onLikeReply={handleLikeReply}
            onDeleteReply={handleDeleteReply}
            onRequestDelete={handleDeleteMemory}
          />
        ))
      )}
    </>
  );

  if (loading) {
    return (
      <div className={styles.throwbackVideosBg}>
        <div className={styles.loadingContainer}>
          <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon}/>
          <p>Loading…</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className={styles.throwbackVideosBg}>
        <div className={styles.errorContainer}>
          <div className={styles.errorIcon}><FontAwesomeIcon icon={faExclamationTriangle}/></div>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          {/* Player */}
          <div className={styles.videoPlayerContainer}>
            <div className={styles.videoWrapper}>
              {video?.youtubeUrl ? (
                <iframe
                  src={video.youtubeUrl.replace('watch?v=', 'embed/')}
                  title={video?.titre || 'Video player'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : <div style={{padding:'16px',color:'#fff'}}>No video url</div>}
            </div>
          </div>

          {/* Infos + actions */}
          <div className={styles.videoInfoBar}>
            <h2 className={styles.videoTitle}>
              <span style={{fontWeight:700}}>{video?.artiste || 'Artist'}</span> – {video?.titre || 'Title'} ({video?.annee || '----'})
            </h2>
            <div className={styles.videoStats}>
              <div className={`${styles.statItem} ${userLiked ? styles.liked : ''}`} onClick={handleLikeVideo}>
                <FontAwesomeIcon icon={faHeart}/><span>{likeCount}</span>
              </div>
              <div className={styles.statItem}><FontAwesomeIcon icon={faEye}/><span>{viewCount}</span></div>
              <div className={styles.statItem} onClick={()=>setShowCommentsSheet(true)}>
                <FontAwesomeIcon icon={faComment}/><span>{commentsCount}</span>
              </div>
              <div className={styles.statItem} onClick={()=>setShowShareOptions(s=>!s)} style={{position:'relative'}}>
                <FontAwesomeIcon icon={faShare}/><span>Share</span>
                {showShareOptions && (
                  <div className={styles.shareOptions} onClick={(e)=>e.stopPropagation()}>
                    <a className={styles.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp}/> WhatsApp</a>
                    <a className={styles.shareBtn} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faTwitter}/> X/Twitter</a>
                    <a className={styles.shareBtn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebook}/> Facebook</a>
                    <button className={styles.shareBtn} onClick={copyLink}><FontAwesomeIcon icon={faCopy}/> Copy link</button>
                  </div>
                )}
              </div>
              <div className={styles.statItem} onClick={()=>setShowPlaylistModal(true)}>
                <FontAwesomeIcon icon={faPlus}/><span>Add playlist</span>
              </div>
            </div>
          </div>

          {/* Recommandations */}
          <section className={styles.recommendedVideosSection}>
            <h3 className={styles.recommendedSectionTitle}>Recommended</h3>
            <div className={styles.recommendedVideosGrid}>
              {videosLoading ? (
                <div className={styles.recommendedLoading}><FontAwesomeIcon icon={faSpinner} spin/> Loading…</div>
              ) : (
                (allVideos||[]).slice(0,12).map(v => (
                  <Link to={`/dashboard/videos/${v._id}`} key={v._id} className={`${styles.recommendedVideo} ${v._id===id ? styles.currentVideo : ''}`}>
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
                    {v._id===id && <span className={styles.currentlyPlaying}>Playing</span>}
                  </Link>
                ))
              )}
            </div>
          </section>
        </main>

        {/* Sidebar desktop : comments */}
        <aside className={styles.rightCards}>{renderMemoriesList()}</aside>
      </div>

      {/* Modales */}
      {showPlaylistModal && (
        <PlaylistModal
          videoId={id}
          onClose={()=>setShowPlaylistModal(false)}
          onSuccess={()=>setShowPlaylistModal(false)}
        />
      )}
      <CommentsSheet open={showCommentsSheet} onClose={()=>setShowCommentsSheet(false)}>
        {renderMemoriesList()}
      </CommentsSheet>
      <ConfirmDialog open={confirm.open} onCancel={()=>setConfirm({open:false,onConfirm:null})} onConfirm={()=>confirm.onConfirm?.()}/>
    </div>
  );
};

export default VideoDetail;
