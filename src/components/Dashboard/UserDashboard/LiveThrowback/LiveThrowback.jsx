// LiveThrowback.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faEye, 
  faShare, 
  faHeartBroken,
  faExclamationTriangle,
  faClock
} from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import CommentSection from './CommentSection';
import VideoPlayer from '../../../Common/VideoPlayer';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import { useAuth } from '../../../../contexts/AuthContext';
import api from '../../../../utils/api';

// Cache utilitaire
const cache = {
  data: {},
  get: (key) => cache.data[key],
  set: (key, value, ttl = 60000) => {
    cache.data[key] = { value, expiry: Date.now() + ttl };
  },
  isValid: (key) => {
    const item = cache.data[key];
    return item && item.expiry > Date.now();
  },
  clear: (key) => {
    if (key) delete cache.data[key];
    else cache.data = {};
  }
};

const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';
const logger = {
  debug: (...a) => LOG_LEVEL === 'debug' && console.log(...a),
  error: (...a) => console.error(...a)
};

const LiveThrowback = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [liveStreams, setLiveStreams] = useState([]);
  const [currentStream, setCurrentStream] = useState(null);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [comment, setComment] = useState('');
  const [chatDisabled, setChatDisabled] = useState(false);
  const videoRef = useRef(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const isStreamValid = (stream) => {
    if (!stream) return false;
    const now = new Date();
    const end = new Date(stream.scheduledEndTime);
    const start = new Date(stream.scheduledStartTime);
    return stream.status === 'LIVE' && end > now && start <= now;
  };

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const short = /youtu\.be\/([^?&]+)/.exec(url);
    const long = /youtube\.com\/watch\?v=([^?&]+)/.exec(url);
    return short ? short[1] : long ? long[1] : null;
  };

  const getPlaybackUrl = () => {
    if (!currentStream) return '';
    if (!isStreamValid(currentStream)) return '';

    const loop = currentStream.playbackConfig?.loop !== false;
    const shuffle = currentStream.playbackConfig?.shuffle || false;
    const autoplay = currentStream.playbackConfig?.autoplay !== false;

    if (currentStream.compilationType === 'VIDEO_COLLECTION' &&
        Array.isArray(currentStream.compilationVideos) &&
        currentStream.compilationVideos.length > 0) {
      const vids = currentStream.compilationVideos;

      if (vids.every(v => v.sourceType === 'YOUTUBE')) {
        const ids = vids.map(v => v.sourceId).join(',');
        let url = `https://www.youtube.com/embed/?playlist=${ids}&autoplay=${autoplay ? 1 : 0}`;
        if (loop) url += '&loop=1';
        if (shuffle) url += '&shuffle=1';
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }

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

    if (currentStream.playbackUrl) return currentStream.playbackUrl;

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

    if (currentStream.embedCode) return currentStream.embedCode;
    return '';
  };

  useEffect(() => {
    const fetchLiveStreams = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await api.get('/api/user/livestreams?activeOnly=true');
        if (res.data?.success) {
          const valid = res.data.data.filter(isStreamValid);
          setLiveStreams(valid);
          cache.set('livestreams', valid, 60000);

          setCurrentStream(prev => {
            if (!prev) return valid[0] || null;
            const still = valid.find(s => s._id === prev._id);
            return still ? { ...still } : valid[0] || null;
          });

          if (valid[0]) {
            setViewCount(valid[0].statistics?.totalUniqueViewers || 0);
            setLikeCount(valid[0].statistics?.likes || 0);
            setChatDisabled(valid[0].chatEnabled === false);
            if (user && valid[0].userLiked) setLiked(true);
          }
        }
      } catch (e) {
        setError('Failed to load livestreams');
        logger.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchLiveStreams();
    const intv = setInterval(fetchLiveStreams, 60000);
    return () => clearInterval(intv);
  }, [user]);

  useEffect(() => {
    if (currentStream && user && isStreamValid(currentStream)) {
      api.get(`/api/user/livestreams/${currentStream._id}`)
        .then(() => setViewCount(p => p + 1))
        .catch(err => logger.error(err));
    }
  }, [currentStream, user]);

  useEffect(() => {
    if (!currentStream) return;
    const intv = setInterval(() => {
      if (!isStreamValid(currentStream)) setError('This livestream has ended');
    }, 10000);
    return () => clearInterval(intv);
  }, [currentStream]);

  const handleLike = async () => {
    if (!user) return navigate('/login');
    if (!isStreamValid(currentStream)) return setError('This livestream is no longer active');
    try {
      if (!liked) {
        setLiked(true); setLikeCount(p => p + 1);
        await api.post(`/api/user/livestreams/${currentStream._id}/like`);
      } else {
        setLiked(false); setLikeCount(p => Math.max(0, p - 1));
      }
    } catch (err) {
      logger.error(err);
      setLiked(!liked);
    }
  };

  const handleShare = async () => {
    if (!currentStream) return;
    const url = `${window.location.origin}/dashboard/live/${currentStream._id}`;
    if (navigator.share) {
      try { await navigator.share({ title: currentStream.title, url }); }
      catch { navigator.clipboard.writeText(url); }
    } else navigator.clipboard.writeText(url);
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !user || !currentStream) return;
    if (!isStreamValid(currentStream)) return setError('This livestream is no longer active');
    const content = comment;
    setComment('');
    try {
      const res = await api.post(`/api/livechat/${currentStream._id}`, { content });
      if (res.data?.success) cache.clear(`comments_${currentStream._id}_page_1`);
    } catch (err) {
      logger.error(err);
      setComment(content);
    }
  };

  const renderCompilationRail = () => {
    if (!currentStream?.compilationVideos?.length) return null;
    return (
      <div className={styles.compilationRail}>
        {currentStream.compilationVideos.map((v, i) => (
          <button key={v.sourceId + '_' + i} className={styles.compilationItem} type="button" title={v.title}>
            <img src={v.thumbnailUrl || '/images/default-thumb.jpg'} alt={v.title}
                 onError={e => { e.currentTarget.src = '/images/default-thumb.jpg'; }} />
            <span className={styles.compilationItemTitle}>{v.title}</span>
          </button>
        ))}
      </div>
    );
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className={styles.errorContainer}><p>{error}</p></div>;
  if (!liveStreams.length) return <div className={styles.noStreamContainer}><p>No streams</p></div>;

  return (
    <div className={styles.liveThrowbackContainer}>
      <h1>Livethrowback</h1>
      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          {currentStream && (
            <div className={styles.videoWrapper}>
              <VideoPlayer src={getPlaybackUrl()} ref={videoRef} autoPlay controls loop />
              {!isStreamValid(currentStream) && <div className={styles.streamExpired}>This livestream has ended</div>}
              {isStreamValid(currentStream) && (
                <div className={styles.viewCount}><FontAwesomeIcon icon={faEye}/> {viewCount}</div>
              )}
            </div>
          )}
          {currentStream && (
            <div>
              <h2>{currentStream.title}</h2>
              {renderCompilationRail()}
              <button onClick={handleLike}>{liked ? '♥' : '♡'} {likeCount}</button>
              <button onClick={handleShare}><FontAwesomeIcon icon={faShare}/> Share</button>
              {!chatDisabled && isStreamValid(currentStream) && (
                <form onSubmit={handleCommentSubmit}>
                  <input value={comment} onChange={e => setComment(e.target.value)} />
                  <button disabled={!comment.trim()}>Chat</button>
                </form>
              )}
            </div>
          )}
        </div>
        {currentStream && (
          currentStream.chatEnabled !== false && isStreamValid(currentStream)
            ? <CommentSection streamId={currentStream._id}/>
            : <div>Chat disabled</div>
        )}
      </div>
    </div>
  );
};
export default LiveThrowback;
