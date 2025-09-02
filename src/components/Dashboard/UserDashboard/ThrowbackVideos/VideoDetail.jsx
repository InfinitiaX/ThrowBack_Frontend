import React, { useState, useEffect, useRef } from 'react';
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

/* ---------- Confirm dialog (léger) ---------- */
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

/* ---------- Bottom-sheet “Comments” (mobile) ---------- */
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

  // Video
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interactions
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Comments/memories
  const [memories, setMemories] = useState([]);            // [{... , replies:[...] }]
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoryText, setMemoryText] = useState('');
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);

  // UI
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [confirm, setConfirm] = useState({ open:false, onConfirm:null });

  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  /* ---------------- Init ---------------- */
  useEffect(() => { fetchAllVideos(); }, []);
  useEffect(() => {
    if (!id) return;
    fetchVideoById(id);
    fetchVideoMemories(id);
    window.scrollTo(0, 0);
    localStorage.setItem('currentVideoId', id);
  }, [id]);

  /* ---------------- Data ---------------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const data = await videoAPI.getAllVideos?.({ type:'music', limit:'50' });
      setAllVideos(Array.isArray(data) ? data : []);
    } finally { setVideosLoading(false); }
  };

  const fetchVideoById = async (videoId) => {
    try {
      setLoading(true); setError(null);
      const data = await videoAPI.getVideoById?.(videoId);
      if (!data) { setError('Unable to load video'); return; }
      setVideo(data);
      setUserLiked(Boolean(data.userInteraction?.liked));
      setViewCount(data.vues || 0);
      setLikeCount(data.likes || 0);
    } catch { setError('Error loading video'); }
    finally { setLoading(false); }
  };

  const normalizeMemory = (m) => ({
    id: m._id || m.id,
    username:
      (m.auteur && `${m.auteur.prenom || ''} ${m.auteur.nom || ''}`.trim()) ||
      m.username || 'User',
    type: m.type || 'posted',
    imageUrl: m.auteur?.photo_profil || m.imageUrl || '/images/default-avatar.jpg',
    content: m.contenu || m.content || '',
    likes: m.likes || 0,
    comments: m.nb_commentaires ?? m.comments ?? ((Array.isArray(m.replies) ? m.replies.length : 0) + 1),
    userInteraction: m.userInteraction || { liked:false, disliked:false, isAuthor:false },
    videoArtist: m.video?.artiste || m.videoArtist || video?.artiste || 'Artist',
    videoTitle:  m.video?.titre   || m.videoTitle  || video?.titre   || 'Title',
    videoYear:   m.video?.annee   || m.videoYear   || video?.annee   || '—',
    video: m.video,
    replies: Array.isArray(m.replies) ? m.replies.map(r => ({
      id: r._id || r.id,
      content: r.contenu || r.content || '',
      auteur: r.auteur,
      username:
        (r.auteur && `${r.auteur.prenom || ''} ${r.auteur.nom || ''}`.trim()) ||
        r.username || 'User',
      likes: r.likes || 0,
      userInteraction: r.userInteraction || { liked:false, disliked:false, isAuthor:false },
      createdAt: r.createdAt
    })) : [],
    showReplies: false
  });

  const fetchVideoMemories = async (videoId) => {
    try {
      setMemoriesLoading(true);
      let list = await videoAPI.getVideoMemories?.(videoId);
      // fallback strict (si l’API utilitaire n’existe pas)
      if (!Array.isArray(list)) {
        const r = await api.get(`/api/public/memories/video/${videoId}`);
        list = Array.isArray(r?.data?.data) ? r.data.data : [];
      }
      setMemories(list.map(normalizeMemory));
    } catch {
      setMemories([]);
    } finally {
      setMemoriesLoading(false);
    }
  };

  /* ---------------- Helpers counts ---------------- */
  const computeCommentsCount = (arr) => {
    // #comments affiché près de l’icône : nb de “comments racines”
    return arr.length;
  };

  /* ---------------- Actions: video ---------------- */
  const handleLikeVideo = async () => {
    if (!video?._id || isLiking) return;
    setIsLiking(true);
    setUserLiked((v)=>!v);
    setLikeCount((c)=> userLiked ? Math.max(0, c-1) : c+1);
    try { await videoAPI.likeVideo?.(video._id); } catch {}
    setIsLiking(false);
  };

  /* ---------------- Actions: memories ---------------- */
  const handleSendComment = async () => {
    const text = memoryText.trim();
    if (!text || !id) return;
    setMemoryText('');
    // Optimistic
    const temp = {
      id: `tmp-${Date.now()}`, username:'You', type:'posted',
      imageUrl:'/images/default-avatar.jpg', content:text, likes:0,
      comments:1, userInteraction:{ liked:false, disliked:false, isAuthor:true },
      videoArtist: video?.artiste, videoTitle: video?.titre, videoYear: video?.annee, replies:[]
    };
    setMemories((m)=>[temp, ...m]);
    try {
      // Auth route -> fallback public
      try { await api.post('/api/memories', { contenu:text, video:id }); }
      catch { await api.post('/api/public/memories', { contenu:text, video:id }); }
      await fetchVideoMemories(id);
    } catch {
      // rollback simple si besoin
    }
  };

  const handleLikeMemory = async (memoryId) => {
    setMemories((arr)=>arr.map(m => m.id===memoryId
      ? { ...m,
          userInteraction:{ ...(m.userInteraction||{}), liked: !m.userInteraction?.liked },
          likes: m.userInteraction?.liked ? Math.max(0,(m.likes||0)-1) : (m.likes||0)+1
        }
      : m
    ));
    try {
      if (videoAPI.likeMemory) await videoAPI.likeMemory(memoryId);
      else await api.post(`/api/memories/${memoryId}/like`);
    } catch {}
  };

  const handleAddReply = async (memoryId, text) => {
    const reply = {
      id: `tmp-r-${Date.now()}`, content:text, likes:0,
      userInteraction:{ liked:false, disliked:false, isAuthor:true },
      username:'You'
    };
    // optimistic
    setMemories((arr)=>arr.map(m => m.id===memoryId
      ? { ...m, replies:[reply, ...(m.replies||[])], comments:(m.comments||1)+1, showReplies:true }
      : m
    ));
    try {
      if (videoAPI.addReply) await videoAPI.addReply(memoryId, text);
      else await api.post(`/api/memories/${memoryId}/replies`, { contenu:text });
      await fetchVideoMemories(id);
    } catch {}
  };

  const handleLikeReply = async (memoryId, replyId) => {
    setMemories((arr)=>arr.map(m => {
      if (m.id !== memoryId) return m;
      const replies = (m.replies||[]).map(r => r.id===replyId
        ? { ...r, userInteraction:{ ...(r.userInteraction||{}), liked: !r.userInteraction?.liked },
            likes: r.userInteraction?.liked ? Math.max(0,(r.likes||0)-1) : (r.likes||0)+1 }
        : r
      );
      return { ...m, replies };
    }));
    try {
      if (videoAPI.likeReply) await videoAPI.likeReply(memoryId, replyId);
      else await api.post(`/api/memories/${memoryId}/replies/${replyId}/like`);
    } catch {}
  };

  const handleDeleteMemory = (memoryId) => {
    setConfirm({
      open:true,
      onConfirm: async () => {
        setConfirm({ open:false, onConfirm:null });
        // optimistic
        setMemories((arr)=>arr.filter(m => m.id !== memoryId));
        try {
          if (videoAPI.deleteMemory) await videoAPI.deleteMemory(memoryId);
          else await api.delete(`/api/memories/${memoryId}`);
        } catch { await fetchVideoMemories(id); }
      }
    });
  };

  const handleDeleteReply = (memoryId, replyId) => {
    setConfirm({
      open:true,
      onConfirm: async () => {
        setConfirm({ open:false, onConfirm:null });
        // optimistic
        setMemories((arr)=>arr.map(m => {
          if (m.id !== memoryId) return m;
          const replies = (m.replies||[]).filter(r => r.id !== replyId);
          return { ...m, replies, comments: Math.max(1, (m.comments||1)-1) };
        }));
        try {
          if (videoAPI.deleteReply) await videoAPI.deleteReply(memoryId, replyId);
          else await api.delete(`/api/memories/${memoryId}/replies/${replyId}`);
        } catch { await fetchVideoMemories(id); }
      }
    });
  };

  /* ---------------- Render helpers ---------------- */
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const renderMemoriesList = () => (
    <>
      {/* zone de saisie */}
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

  /* ---------------- UI ---------------- */
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
                <FontAwesomeIcon icon={faComment}/>
                <span>{computeCommentsCount(memories)}</span>
              </div>
              <div className={styles.statItem} onClick={()=>setShowShareOptions(s=>!s)} style={{position:'relative'}}>
                <FontAwesomeIcon icon={faShare}/><span>Share</span>
                {showShareOptions && (
                  <div className={styles.shareOptions} onClick={(e)=>e.stopPropagation()}>
                    <a className={styles.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp}/> WhatsApp</a>
                    <a className={styles.shareBtn} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faTwitter}/> X/Twitter</a>
                    <a className={styles.shareBtn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebook}/> Facebook</a>
                    <button className={styles.shareBtn} onClick={async()=>{ try{ await navigator.clipboard.writeText(currentUrl);}catch{} }}>{/* no alert on mobile */}
                      <FontAwesomeIcon icon={faCopy}/> Copy link
                    </button>
                  </div>
                )}
              </div>
              <div className={styles.statItem} onClick={()=>setShowPlaylistModal(true)}>
                <FontAwesomeIcon icon={faPlus}/><span>Add playlist</span>
              </div>
            </div>
          </div>

          {/* Recommended */}
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

        {/* Sidebar desktop : commentaires (masquée sur mobile) */}
        <aside className={styles.rightCards}>
          {renderMemoriesList()}
        </aside>
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
