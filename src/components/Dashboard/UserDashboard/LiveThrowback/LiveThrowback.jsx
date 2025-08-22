// LiveThrowback.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHeart, faEye, faShare, faExclamationTriangle, faClock } from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import CommentSection from './CommentSection';
import VideoPlayer from '../../../Common/VideoPlayer';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';

const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';
const logger = {
  debug: (...a) => LOG_LEVEL === 'debug' && console.log(...a),
  error: (...a) => console.error(...a),
};

const LiveThrowback = () => {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [comment, setComment] = useState('');
  const [chatDisabled, setChatDisabled] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const isStreamValid = (stream) => {
    if (!stream) return false;
    const now = new Date();
    const end = new Date(stream.scheduledEndTime);
    const start = new Date(stream.scheduledStartTime);
    return stream.status === 'LIVE' && end > now && start <= now;
  };

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const s = /youtu\.be\/([^?&]+)/.exec(url);
    const l = /youtube\.com\/watch\?v=([^?&]+)/.exec(url);
    return s ? s[1] : l ? l[1] : null;
  };

  /** ⛑️ URL de lecture STABLE — ne change PAS pendant la lecture */
  const playerSrc = useMemo(() => {
    if (!currentStream || !isStreamValid(currentStream)) return '';

    const autoplay = currentStream.playbackConfig?.autoplay !== false;
    const loop     = currentStream.playbackConfig?.loop !== false;
    const shuffle  = currentStream.playbackConfig?.shuffle === true;

    // Compilation : on privilégie UNE URL playlist YouTube (ou vidéo unique)
    if (currentStream.compilationType === 'VIDEO_COLLECTION' &&
        Array.isArray(currentStream.compilationVideos) &&
        currentStream.compilationVideos.length > 0) {

      const vids = currentStream.compilationVideos;

      // Tous YouTube → construire une playlist d’IDs. ⚠️ URL STABLE : pas d’index dynamique
      if (vids.every(v => v.sourceType === 'YOUTUBE')) {
        const ids = vids.map(v => v.sourceId).join(',');
        let url = `https://www.youtube.com/embed/?playlist=${ids}&autoplay=${autoplay ? 1 : 0}`;
        if (loop)    url += '&loop=1';
        if (shuffle) url += '&shuffle=1';
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }

      // Sinon : on fixe la première vidéo comme point d’entrée (URL stable)
      const first = vids[0];
      if (first?.sourceType === 'YOUTUBE') {
        let url = `https://www.youtube.com/embed/${first.sourceId}?autoplay=${autoplay ? 1 : 0}`;
        if (loop) url += `&loop=1&playlist=${first.sourceId}`;
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }
      if (first?.sourceType === 'VIMEO')
        return `https://player.vimeo.com/video/${first.sourceId}?autoplay=${autoplay ? 1 : 0}&loop=${loop ? 1 : 0}&transparent=0&dnt=1&playsinline=1`;
      if (first?.sourceType === 'DAILYMOTION')
        return `https://www.dailymotion.com/embed/video/${first.sourceId}?autoplay=${autoplay ? 1 : 0}`;
    }

    // URL directe
    if (currentStream.playbackUrl) return currentStream.playbackUrl;

    // YouTube unique
    if (currentStream.youtubeUrl) {
      const id = extractYoutubeId(currentStream.youtubeUrl);
      if (id) {
        let url = `https://www.youtube.com/embed/${id}?autoplay=${autoplay ? 1 : 0}`;
        if (loop) url += `&loop=1&playlist=${id}`;
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }
      return currentStream.youtubeUrl;
    }

    // Fallback
    if (currentStream.embedCode) return currentStream.embedCode;
    return '';
  }, [currentStream]); // ⚠️ ne dépend QUE du stream (pas d’index/temps)

  useEffect(() => {
    let mounted = true;

    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        setError(null);

        const res = await api.get('/api/user/livestreams?activeOnly=true');
        if (!mounted) return;

        if (res.data?.success) {
          const valid = (res.data.data || []).filter(isStreamValid);
          setLiveStreams(valid);

          setCurrentStream((prev) => {
            if (!prev) return valid[0] || null;
            const still = valid.find(s => s._id === prev._id);
            return still || valid[0] || null;
          });

          if (valid[0]) {
            setViewCount(valid[0].statistics?.totalUniqueViewers || 0);
            setLikeCount(valid[0].statistics?.likes || 0);
            setChatDisabled(valid[0].chatEnabled === false);
            if (user && valid[0].userLiked) setLiked(true);
          }
        } else {
          setError('Invalid API response');
        }
      } catch (e) {
        logger.error(e);
        setError('Failed to load livestreams');
      } finally {
        mounted && setLoading(false);
      }
    };

    fetchLiveStreams();
    const intv = setInterval(fetchLiveStreams, 60000);
    return () => { mounted = false; clearInterval(intv); };
  }, [user]);

  // Incrément UX de vues au chargement du stream (sans recharger la page)
  useEffect(() => {
    const bumpViews = async () => {
      try {
        if (currentStream && user && isStreamValid(currentStream)) {
          await api.get(`/api/user/livestreams/${currentStream._id}`);
          setViewCount((p) => p + 1);
        }
      } catch (e) {
        logger.error(e);
      }
    };
    bumpViews();
  }, [currentStream, user]);

  const handleLike = async () => {
    if (!user) return navigate('/login');
    if (!isStreamValid(currentStream)) return setError('This livestream is no longer active');

    try {
      if (!liked) {
        setLiked(true);
        setLikeCount((p) => p + 1);
        await api.post(`/api/user/livestreams/${currentStream._id}/like`);
      } else {
        // pas d’API "unlike" — on garde un toggle local
        setLiked(false);
        setLikeCount((p) => Math.max(0, p - 1));
      }
    } catch (e) {
      logger.error(e);
      // rollback
      setLiked((x) => !x);
      setLikeCount((p) => (liked ? Math.max(0, p - 1) : p + 1));
    }
  };

  const handleShare = async () => {
    if (!currentStream) return;
    const url = `${window.location.origin}/dashboard/live/${currentStream._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: currentStream.title, url }); }
      catch { await navigator.clipboard.writeText(url); }
    } else {
      await navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user || !currentStream) return;
    if (!isStreamValid(currentStream)) return setError('This livestream is no longer active');

    const content = comment;
    setComment('');
    try {
      const res = await api.post(`/api/livechat/${currentStream._id}`, { content });
      if (!res.data?.success) throw new Error('Post failed');
      // le composant <CommentSection> se met à jour par polling
    } catch (e) {
      logger.error(e);
      setComment(content); // restore
    }
  };

  const renderCompilationRail = () => {
    if (!currentStream?.compilationVideos?.length) return null;
    const videos = currentStream.compilationVideos;

    return (
      <div className={styles.compilationRail}>
        {videos.map((v, i) => (
          <div key={`${v.sourceId}_${i}`} className={styles.compilationItem} title={v.title || `Video ${i+1}`}>
            <img
              src={v.thumbnailUrl || '/images/default-thumb.jpg'}
              alt={v.title || `Video ${i+1}`}
              onError={(e) => { e.currentTarget.src = '/images/default-thumb.jpg'; }}
            />
            <div className={styles.compilationItemTitle} title={v.title || ''}>
              {v.title || `Video ${i+1}`}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <h2>Oops! Something went wrong</h2>
        <p>{error}</p>
      </div>
    );
  }

  if (!liveStreams.length || !currentStream) {
    return (
      <div className={styles.noStreamContainer}>
        <FontAwesomeIcon icon={faClock} className={styles.noStreamIcon} />
        <h2>No live streams available</h2>
        <p>Please check back later.</p>
      </div>
    );
  }

  const hasVideo = !!playerSrc;

  return (
    <div className={styles.liveThrowbackContainer}>
      <h1 className={styles.pageTitle}>Livethrowback</h1>

      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            <div className={styles.videoPlayer}>
              {hasVideo ? (
                <VideoPlayer
                  ref={playerRef}
                  src={playerSrc}
                  poster={currentStream.thumbnailUrl || '/images/default-livestream.jpg'}
                  autoPlay={currentStream.playbackConfig?.autoplay !== false}
                  muted={false}
                  controls
                  loop={currentStream.playbackConfig?.loop !== false}
                />
              ) : (
                <div className={styles.noVideoMessage}>
                  <p>This stream doesn't have a valid video URL.</p>
                </div>
              )}

              {isStreamValid(currentStream) && (
                <>
                  <div className={styles.liveIndicator}><span className={styles.liveIcon} />LIVE</div>
                  <div className={styles.viewCount}><FontAwesomeIcon icon={faEye} /> {viewCount}</div>
                </>
              )}
            </div>
          </div>

          <div className={styles.videoInfo}>
            <h2 className={styles.streamTitle}>{currentStream.title}</h2>
            <p className={styles.hostInfo}>Hosted by: {currentStream.hostName || 'ThrowBack Host'}</p>

            {/* rail complète et scrollable */}
            {renderCompilationRail()}

            <div className={styles.interactionBar}>
              <button className={`${styles.interactionButton} ${liked ? styles.liked : ''}`} onClick={handleLike} disabled={!isStreamValid(currentStream)}>
                <FontAwesomeIcon icon={faHeart} />
                <span>{likeCount}</span>
              </button>
              <button className={styles.interactionButton} onClick={handleShare}>
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </button>
            </div>

            {!chatDisabled && isStreamValid(currentStream) && (
              <form onSubmit={handleCommentSubmit} className={styles.commentForm}>
                <img
                  src={user?.photo_profil || '/images/default-user.jpg'}
                  alt={user?.prenom || 'User'}
                  className={styles.userAvatar}
                  onError={(e) => { e.currentTarget.src = '/images/default-user.jpg'; }}
                />
                <input
                  type="text"
                  placeholder="Share a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className={styles.commentInput}
                />
                <button type="submit" className={styles.commentSubmit} disabled={!comment.trim()}>
                  Chat
                </button>
              </form>
            )}
          </div>
        </div>

        {currentStream.chatEnabled !== false && isStreamValid(currentStream)
          ? (
            <div className={styles.commentsSection}>
              <h3 className={styles.commentsTitle}>Live Chat</h3>
              <CommentSection streamId={currentStream._id} />
            </div>
          )
          : (
            <div className={styles.commentsSection}>
              <h3 className={styles.commentsTitle}>
                {!isStreamValid(currentStream) ? 'Livestream ended' : 'Chat disabled'}
              </h3>
            </div>
          )}
      </div>
    </div>
  );
};

export default LiveThrowback;
