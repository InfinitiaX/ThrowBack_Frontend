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

/* ===== Confirm dialog (léger) ===== */
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
          <button className={styles.modalClose} onClick={onCancel} aria-label="Close"><FontAwesomeIcon icon={faTimes}/></button>
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

/* ===== Bottom sheet mobile ===== */
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

  // Video & lists
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);

  // UI loading / error
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [error, setError] = useState(null);

  // Interactions vidéo
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);

  // Comments / memories
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoryText, setMemoryText] = useState('');

  // Modales / menus
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);

  const [confirm, setConfirm] = useState({ open: false, onConfirm: null });

  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  /* ---------- Init ---------- */
  useEffect(() => {
    fetchAllVideos();
  }, []);

  useEffect(() => {
    if (!id) return;
    fetchVideoById(id);
    fetchVideoMemories(id);
    window.scrollTo(0, 0);
    localStorage.setItem('currentVideoId', id);
  }, [id]);

  /* ---------- Fetch ---------- */
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const videosData = await videoAPI.getAllVideos({ type: 'music', limit: '50' });
      setAllVideos(Array.isArray(videosData) ? videosData : []);
    } finally {
      setVideosLoading(false);
    }
  };

  const fetchVideoById = async (videoId) => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoAPI.getVideoById(videoId);
      if (!data) {
        setError('Unable to load video');
        return;
      }
      setVideo(data);
      setUserLiked(data.userInteraction?.liked || false);
      setViewCount(data.vues || 0);
      setLikeCount(data.likes || 0);
    } catch {
      setError('Error loading video');
    } finally {
      setLoading(false);
    }
  };

  const fetchVideoMemories = async (videoId) => {
    try {
      setMemoriesLoading(true);
      const list = await videoAPI.getVideoMemories(videoId);
      const filtered = Array.isArray(list) ? list.filter(m => {
        const vid = (m.video && typeof m.video === 'object') ? m.video._id : (typeof m.video === 'string' ? m.video : m.videoId || m.video_id);
        return vid && vid.toString() === videoId.toString();
      }) : [];
      setMemories(formatMemories(filtered, videoId));
    } catch {
      setMemories([]);
    } finally {
      setMemoriesLoading(false);
    }
  };

  const formatMemories = (arr, currentVideoId = id) => {
    if (!Array.isArray(arr)) return [];
    return arr.map(m => ({
      id: m._id || m.id,
      username: m.auteur?.prenom || m.username ? `${m.auteur?.prenom || ''} ${m.auteur?.nom || ''}`.trim() || m.username : 'User',
      type: m.type || 'posted',
      videoId: currentVideoId,
      videoTitle: m.video?.titre || m.videoTitle || video?.titre || 'Untitled',
      videoArtist: m.video?.artiste || m.videoArtist || video?.artiste || 'Artist',
      videoYear: m.video?.annee || m.videoYear || video?.annee || '—',
      imageUrl: m.auteur?.photo_profil || m.imageUrl || '/images/default-avatar.jpg',
      content: m.contenu || m.content || '',
      likes: m.likes || 0,
      comments: m.nb_commentaires || m.comments || 0,
      userInteraction: m.userInteraction || { liked: false, disliked: false, isAuthor: false },
      replies: m.replies || [],
      showReplies: false
    }));
  };

  /* ---------- Actions ---------- */
  const handleLikeVideo = async () => {
    if (isLiking || !video?._id) return;
    setIsLiking(true);
    setUserLiked(prev => !prev);
    setLikeCount(prev => (userLiked ? Math.max(0, prev - 1) : prev + 1));
    try { await videoAPI.likeVideo(video._id); } catch {}
    setIsLiking(false);
  };

  const handleSendComment = async () => {
    const text = memoryText.trim();
    if (!text || !video?._id) return;
    try {
      setMemoryText('');
      // Optimistic add
      const temp = {
        id: `tmp-${Date.now()}`,
        username: 'You',
        type: 'posted',
        videoId: id,
        videoTitle: video?.titre,
        videoArtist: video?.artiste,
        videoYear: video?.annee,
        imageUrl: '/images/default-avatar.jpg',
        content: text,
        likes: 0,
        comments: 0,
        userInteraction: { liked: false, disliked: false, isAuthor: true },
        replies: []
      };
      setMemories((m) => [temp, ...m]);

      // API (auth route -> public fallback)
      try {
        await api.post('/api/memories', { contenu: text, video: id });
      } catch {
        await api.post('/api/public/memories', { contenu: text, video: id });
      }
      // re-fetch pour consolider
      fetchVideoMemories(id);
    } catch {
      // rollback soft (on garde optimistic si tu préfères, sinon on peut enlever)
    }
  };

  const handleLikeMemory = async (memoryId) => {
    try {
      setMemories(m => m.map(it => it.id === memoryId
        ? { ...it, likes: it.userInteraction?.liked ? Math.max(0,(it.likes||0)-1) : (it.likes||0)+1, userInteraction: { ...(it.userInteraction||{}), liked: !it.userInteraction?.liked } }
        : it
      ));
      await videoAPI.likeMemory(memoryId);
    } catch {}
  };

  /* ---------- Share ---------- */
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(currentUrl); setShowShareOptions(false); alert('Link copied'); } catch {}
  };

  /* ---------- Renders ---------- */
  const renderMemoriesList = () => (
    <>
      {/* Champ de saisie (dans la feuille mobile et dans la sidebar desktop) */}
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
      ) : memories.length ? (
        memories.map(m => (
          <MemoryCard
            key={m.id}
            memory={m}
            baseUrl={baseUrl}
            onLike={handleLikeMemory}
            onAddReply={async()=>true}
          />
        ))
      ) : (
        <div className={styles.emptyMemories}>No comments yet.</div>
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
              ) : (
                <div style={{padding:'16px', color:'#fff'}}>No video url</div>
              )}
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
                <FontAwesomeIcon icon={faComment}/><span>Comments</span>
              </div>
              <div className={styles.statItem} onClick={()=>setShowShareOptions(v=>!v)}>
                <FontAwesomeIcon icon={faShare}/><span>Share</span>
                {showShareOptions && (
                  <div className={styles.shareOptions} onClick={(e)=>e.stopPropagation()}>
                    <a className={styles.shareBtn} href={`https://wa.me/?text=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faWhatsapp}/> WhatsApp</a>
                    <a className={styles.shareBtn} href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faTwitter}/> X/Twitter</a>
                    <a className={styles.shareBtn} href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentUrl)}`} target="_blank" rel="noreferrer"><FontAwesomeIcon icon={faFacebook}/> Facebook</a>
                    <button className={styles.shareBtn} onClick={handleCopy}><FontAwesomeIcon icon={faCopy}/> Copy link</button>
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
                (allVideos || []).slice(0, 12).map((v) => (
                  <Link to={`/dashboard/videos/${v._id}`} key={v._id} className={`${styles.recommendedVideo} ${v._id === id ? styles.currentVideo : ''}`}>
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

        {/* Sidebar desktop : commentaires (masquée sur mobile via CSS) */}
        <aside className={styles.rightCards}>
          {renderMemoriesList()}
        </aside>
      </div>

      {/* Modale Add playlist */}
      {showPlaylistModal && (
        <PlaylistModal
          videoId={id}
          onClose={()=>setShowPlaylistModal(false)}
          onSuccess={()=>setShowPlaylistModal(false)}
        />
      )}

      {/* Bottom-sheet mobile pour comments */}
      <CommentsSheet open={showCommentsSheet} onClose={()=>setShowCommentsSheet(false)}>
        {renderMemoriesList()}
      </CommentsSheet>

      {/* Confirm générique */}
      <ConfirmDialog
        open={confirm.open}
        onCancel={()=>setConfirm({open:false,onConfirm:null})}
        onConfirm={()=>{confirm.onConfirm?.(); setConfirm({open:false,onConfirm:null});}}
      />
    </div>
  );
};

export default VideoDetail;
