import React, { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api, { videoAPI } from '../../../../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faExclamationTriangle,
  faHeart,
  faComment,
  faEye,
  faShare,
  faCopy,
  faPlus,
  faArrowUp,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

/* ———————————————————————————————— */
/* Helpers visuels optionnels (confirm + bottom-sheet) */
const ConfirmDialog = ({ open, title='Delete', message='Are you sure?', onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" onClick={onCancel}>
      <div className={styles.modalCard} onClick={(e)=>e.stopPropagation()}>
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

const CommentsSheet = ({ isOpen, onClose, commentCount, children }) => {
  return (
    <>
      <div 
        className={`${styles.sheetBackdrop} ${isOpen ? styles.sheetBackdropVisible : ''}`}
        onClick={onClose}
      />
      <div className={`${styles.commentsSheet} ${isOpen ? styles.commentsSheetOpen : ''}`}>
        <div className={styles.sheetHandle} />
        <div className={styles.sheetHeader}>
          <h3 className={styles.sheetTitle}>Comments ({commentCount || 0})</h3>
          <button className={styles.sheetCloseBtn} onClick={onClose}>×</button>
        </div>
        <div className={styles.sheetContent}>
          {children}
        </div>
      </div>
    </>
  );
};
/* ———————————————————————————————— */

const VideoDetail = () => {
  const { id } = useParams();

  // Vidéo
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Recommandées (optionnel)
  const [allVideos, setAllVideos] = useState([]);
  const [videosLoading, setVideosLoading] = useState(false);

  // Stats vidéo
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking,  setIsLiking]  = useState(false);

  // Comments & replies
  const [memories, setMemories] = useState([]);      // [{ id, content, replies:[{id,...}] }]
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [memoryText, setMemoryText] = useState('');

  // UI
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showCommentsSheet, setShowCommentsSheet] = useState(false);
  const [showShareOptions,  setShowShareOptions]  = useState(false);
  const [confirm, setConfirm] = useState({ open:false, onConfirm:null });
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 992);
  
  // Refs
  const commentsRef = useRef(null);

  // anti-race conditions
  const reqRef = useRef({ video:0, memories:0 });

  /* ——— init ——— */
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 992);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => { (async () => {
    try {
      setVideosLoading(true);
      const list = await videoAPI.getAllVideos({ type:'music', limit:'50' });
      setAllVideos(Array.isArray(list) ? list : []);
    } finally { setVideosLoading(false); }
  })(); }, []);

  useEffect(() => {
    if (!id) return;
    // reset pour nouvelle vidéo
    setMemories([]); setMemoryText('');
    fetchVideoById(id);
    fetchVideoMemories(id);
    window.scrollTo(0, 0);
  }, [id]);

  // Fonction pour défiler jusqu'aux commentaires
  const scrollToComments = () => {
    if (commentsRef.current) {
      commentsRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  /* ——— fetch vidéo ——— */
  const fetchVideoById = async (videoId) => {
    const token = ++reqRef.current.video;
    try {
      setLoading(true); setError(null);
      const data = await videoAPI.getVideoById(videoId);
      if (token !== reqRef.current.video) return; // ignore obsolète
      setVideo(data);
      setUserLiked(Boolean(data?.userInteraction?.liked));
      setViewCount(data?.vues || 0);
      setLikeCount(data?.likes || 0);
    } catch (e) {
      if (token !== reqRef.current.video) return;
      setError('Failed to load video');
    } finally {
      if (token === reqRef.current.video) setLoading(false);
    }
  };

  /* ——— normalisation mémoire & reply ——— */
  const normReply = (r) => ({
    id: r._id || r.id,
    content: r.contenu || r.content || '',
    likes: r.likes || 0,
    userInteraction: r.userInteraction || { liked:false, disliked:false, isAuthor:false },
    auteur: r.auteur,
    username: (r.auteur && `${r.auteur.prenom || ''} ${r.auteur.nom || ''}`.trim()) || r.username || 'User',
    createdAt: r.createdAt
  });

  const normMemory = (m) => ({
    id: m._id || m.id,
    username: (m.auteur && `${m.auteur.prenom || ''} ${m.auteur.nom || ''}`.trim()) || m.username || 'User',
    type: m.type || 'posted',
    imageUrl: m.auteur?.photo_profil || m.imageUrl || '/images/default-avatar.jpg',
    content: m.contenu || m.content || '',
    likes: m.likes || 0,
    userInteraction: m.userInteraction || { liked:false, disliked:false, isAuthor:false },
    // meta vidéo (utile à l'affichage dans MemoryCard)
    videoArtist: m.video?.artiste || video?.artiste || 'Artist',
    videoTitle:  m.video?.titre   || video?.titre   || 'Title',
    videoYear:   m.video?.annee   || video?.annee   || '—',
    // replies
    replies: Array.isArray(m.replies) ? m.replies.map(normReply) : []
  });

  const belongsTo = (m, videoId) => {
    if (!m) return false;
    const vid =
      (m.video && typeof m.video === 'object' ? m.video._id : null) ||
      (typeof m.video === 'string' ? m.video : null) ||
      m.videoId || m.video_id;
    return vid && vid.toString() === videoId.toString();
  };

  /* ——— fetch comments (par vidéo) ——— */
  const fetchVideoMemories = async (videoId) => {
    const token = ++reqRef.current.memories;
    try {
      setMemoriesLoading(true);
      let list = await videoAPI.getVideoMemories(videoId);
      list = Array.isArray(list) ? list.filter(m => belongsTo(m, videoId)) : [];
      if (token !== reqRef.current.memories) return;
      setMemories(list.map(normMemory));
    } catch (error) {
      console.error("Error fetching memories:", error);
      if (token !== reqRef.current.memories) return;
      setMemories([]);
    } finally {
      if (token === reqRef.current.memories) setMemoriesLoading(false);
    }
  };

  /* ——— add comment (optimiste + remplacement par la réponse serveur) ——— */
  const handleSendComment = async () => {
    const text = (memoryText || '').trim();
    if (!text) return;

    const tmpId = `tmp-${Date.now()}`;
    
    // Ajout optimiste
    setMemories((arr) => [{
      id: tmpId,
      username: 'You',
      type: 'posted',
      imageUrl: '/images/default-avatar.jpg',
      content: text,
      likes: 0,
      userInteraction: { liked:false, disliked:false, isAuthor:true },
      videoArtist: video?.artiste, videoTitle: video?.titre, videoYear: video?.annee,
      replies: []
    }, ...arr]);
    setMemoryText('');

    try {
      // utilise ton helper → /api/public/videos/:id/memories (fallback interne)
      const res = await videoAPI.addMemory(id, text);
      const created = res?.data || res; // compat
      if (created && (created._id || created.id)) {
        setMemories((arr)=>arr.map(m => m.id === tmpId ? normMemory(created) : m));
      } else {
        // en dernier recours, refetch strict
        fetchVideoMemories(id);
      }
    } catch {
      // on laisse l'optimiste (ou retire si tu préfères)
    }
  };

  /* ——— like comment (et reply: même endpoint côté utilitaire) ——— */
  const handleToggleLikeMemory = async (memoryId) => {
    setMemories((arr)=>arr.map(m => m.id===memoryId
      ? { ...m, userInteraction:{ ...(m.userInteraction||{}), liked: !m.userInteraction?.liked },
          likes: m.userInteraction?.liked ? Math.max(0,(m.likes||0)-1) : (m.likes||0)+1 }
      : m
    ));
    try { await videoAPI.likeMemory(memoryId); } catch {}
  };

  /* ——— replies ——— */
  const addReply = async (memoryId, text) => {
    const replyTmp = { id:`tmp-r-${Date.now()}`, content:text, likes:0, userInteraction:{ liked:false, disliked:false, isAuthor:true }, username:'You' };
    setMemories((arr)=>arr.map(m => m.id===memoryId ? { ...m, replies:[replyTmp, ...m.replies] } : m));

    try {
      // on tente d'abord route interne, puis publique
      try {
        const r = await api.post(`/api/memories/${memoryId}/replies`, { contenu:text });
        const created = r?.data?.data || r?.data;
        if (created && (created._id || created.id)) {
          setMemories((arr)=>arr.map(m => {
            if (m.id !== memoryId) return m;
            return { ...m, replies: m.replies.map(rep => rep.id===replyTmp.id ? normReply(created) : rep) };
          }));
          return;
        }
      } catch {}
      const r2 = await api.post(`/api/public/memories/${memoryId}/replies`, { contenu:text });
      const created2 = r2?.data?.data || r2?.data;
      if (created2 && (created2._id || created2.id)) {
        setMemories((arr)=>arr.map(m => {
          if (m.id !== memoryId) return m;
          return { ...m, replies: m.replies.map(rep => rep.id===replyTmp.id ? normReply(created2) : rep) };
        }));
      } else {
        fetchVideoMemories(id);
      }
    } catch { /* on garde l'optimiste */ }
  };

  const toggleLikeReply = async (memoryId, replyId) => {
    setMemories((arr)=>arr.map(m => {
      if (m.id !== memoryId) return m;
      const replies = m.replies.map(r => r.id===replyId
        ? { ...r, userInteraction:{ ...(r.userInteraction||{}), liked: !r.userInteraction?.liked },
            likes: r.userInteraction?.liked ? Math.max(0,(r.likes||0)-1) : (r.likes||0)+1 }
        : r
      );
      return { ...m, replies };
    }));
    try {
      // comme dans ton helper: même endpoint de like pour une reply (id de reply)
      await videoAPI.likeMemory(replyId);
    } catch {}
  };

  const deleteReply = async (memoryId, replyId) => {
    setConfirm({
      open:true,
      onConfirm: async () => {
        setConfirm({ open:false, onConfirm:null });
        setMemories((arr)=>arr.map(m => m.id===memoryId ? { ...m, replies: m.replies.filter(r => r.id !== replyId) } : m));
        try {
          await api.delete(`/api/memories/${memoryId}/replies/${replyId}`);
        } catch {
          try { await api.delete(`/api/public/memories/${memoryId}/replies/${replyId}`); }
          catch { fetchVideoMemories(id); }
        }
      }
    });
  };

  /* ——— like vidéo ——— */
  const handleLikeVideo = async () => {
    if (!video?._id || isLiking) return;
    setIsLiking(true);
    setUserLiked(v => !v);
    setLikeCount(c => userLiked ? Math.max(0,c-1) : c+1);
    try { await videoAPI.likeVideo(video._id); } catch {}
    setIsLiking(false);
  };

  /* ——— render helpers ——— */
  const commentsCount = memories.length; // nb de commentaires racines (style YouTube)
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const copyLink = async () => { try { await navigator.clipboard.writeText(currentUrl); setShowShareOptions(false);} catch {} };

  const renderComments = () => (
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
        memories.map(m => (
          <MemoryCard
            key={m.id}
            memory={m}
            currentVideoId={id}
            onLike={handleToggleLikeMemory}
            onAddReply={addReply}
            onLikeReply={toggleLikeReply}
            onDeleteReply={deleteReply}
          />
        ))
      )}
    </>
  );

  /* ——— UI ——— */
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
        {/* Colonne principale */}
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

          {/* Titre + actions */}
          <div className={styles.videoInfoBar}>
            <h2 className={styles.videoTitle}>
              <span style={{fontWeight:700}}>{video?.artiste || 'Artist'}</span> – {video?.titre || 'Title'} ({video?.annee || '----'})
            </h2>
            <div className={styles.videoStats}>
              <div className={`${styles.statItem} ${userLiked ? styles.liked : ''}`} onClick={handleLikeVideo}>
                <FontAwesomeIcon icon={faHeart}/><span>{likeCount}</span>
              </div>
              <div className={styles.statItem}>
                <FontAwesomeIcon icon={faEye}/><span>{viewCount}</span>
              </div>
              <div className={styles.statItem} onClick={isMobile ? () => setShowCommentsSheet(true) : scrollToComments}>
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

          {/* Bouton "Voir les commentaires" (style YouTube) pour mobile */}
          {isMobile && (
            <div className={styles.commentsToggle} onClick={() => setShowCommentsSheet(true)}>
              <span>Comments</span>
              <span className={styles.commentCount}>{memories.length}</span>
            </div>
          )}

          {/* Référence pour le défilement */}
          <div ref={commentsRef} />

          {/* Recommandations (mini) */}
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

        {/* Sidebar (desktop) : comments */}
        <aside className={styles.rightCards}>
          {renderComments()}
        </aside>
      </div>

      {/* Bottom Sheet pour commentaires sur mobile */}
      {isMobile && (
        <CommentsSheet 
          isOpen={showCommentsSheet} 
          onClose={() => setShowCommentsSheet(false)}
          commentCount={memories.length}
        >
          {renderComments()}
        </CommentsSheet>
      )}

      {/* Bouton flottant pour sauter aux commentaires */}
      {isMobile && !showCommentsSheet && memories.length > 0 && (
        <button className={styles.jumpToComments} onClick={scrollToComments} aria-label="Jump to comments">
          <FontAwesomeIcon icon={faComment} />
        </button>
      )}

      {/* Modales */}
      {showPlaylistModal && (
        <PlaylistModal
          videoId={id}
          onClose={()=>setShowPlaylistModal(false)}
          onSuccess={()=>setShowPlaylistModal(false)}
        />
      )}

      <ConfirmDialog open={confirm.open} onCancel={()=>setConfirm({open:false,onConfirm:null})} onConfirm={()=>confirm.onConfirm?.()}/>
    </div>
  );
};

export default VideoDetail;