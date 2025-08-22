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

// Cache simple
const cache = {
  data: {},
  get: (k) => cache.data[k],
  set: (k, v, ttl = 60000) => cache.data[k] = { value: v, expiry: Date.now() + ttl },
  isValid: (k) => cache.data[k] && cache.data[k].expiry > Date.now(),
  clear: (k) => k ? delete cache.data[k] : (cache.data = {})
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
  const { user } = useAuth();
  const navigate = useNavigate();

  const isStreamValid = (s) => {
    if (!s) return false;
    const now = new Date();
    return s.status === 'LIVE' && new Date(s.scheduledEndTime) > now && new Date(s.scheduledStartTime) <= now;
  };

  const extractYoutubeId = (url) => {
    if (!url) return null;
    const short = url.match(/youtu\.be\/([^?&]+)/);
    const long = url.match(/youtube\.com\/watch\?v=([^?&]+)/);
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
        let url = `https://www.youtube.com/embed/?playlist=${ids}&autoplay=${autoplay?1:0}`;
        if (loop) url += '&loop=1';
        if (shuffle) url += '&shuffle=1';
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }
      const first = vids[0];
      if (first?.sourceType === 'YOUTUBE') {
        let url = `https://www.youtube.com/embed/${first.sourceId}?autoplay=${autoplay?1:0}`;
        if (loop) url += `&loop=1&playlist=${first.sourceId}`;
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }
      if (first?.sourceType === 'VIMEO') {
        return `https://player.vimeo.com/video/${first.sourceId}?autoplay=${autoplay?1:0}&loop=${loop?1:0}`;
      }
      if (first?.sourceType === 'DAILYMOTION') {
        return `https://www.dailymotion.com/embed/video/${first.sourceId}?autoplay=${autoplay?1:0}`;
      }
    }

    if (currentStream.playbackUrl) return currentStream.playbackUrl;

    if (currentStream.youtubeUrl) {
      const id = extractYoutubeId(currentStream.youtubeUrl);
      if (id) {
        let url = `https://www.youtube.com/embed/${id}?autoplay=${autoplay?1:0}`;
        if (loop) url += `&loop=1&playlist=${id}`;
        url += '&rel=0&modestbranding=1&enablejsapi=1&origin=' + window.location.origin;
        return url;
      }
      return currentStream.youtubeUrl;
    }

    if (currentStream.embedCode) return currentStream.embedCode;
    return '';
  };

  // Fetch streams
  useEffect(() => {
    const fetchLiveStreams = async () => {
      const ck = 'livestreams';
      if (cache.isValid(ck)) {
        const cached = cache.get(ck).value;
        const valid = cached.filter(isStreamValid);
        setLiveStreams(valid);
        if (!currentStream && valid.length > 0) setCurrentStream(valid[0]);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get('/api/user/livestreams?activeOnly=true');
        const valid = res.data.data.filter(isStreamValid);
        setLiveStreams(valid);
        cache.set(ck, valid, 60000);
        setCurrentStream(prev => {
          if (!prev) return valid[0] || null;
          return valid.find(s => s._id === prev._id) || valid[0] || null;
        });
        if (valid[0]) {
          setViewCount(valid[0].statistics?.totalUniqueViewers || 0);
          setLikeCount(valid[0].statistics?.likes || 0);
        }
        setLoading(false);
      } catch (e) {
        logger.error('fetch error', e);
        setError('Could not load live streams');
        setLoading(false);
      }
    };
    fetchLiveStreams();
    const interval = setInterval(fetchLiveStreams, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Expiration sans reload
  useEffect(() => {
    if (!currentStream) return;
    const checkExpiration = () => {
      if (!isStreamValid(currentStream)) setError('This livestream has ended');
    };
    const exp = setInterval(checkExpiration, 10000);
    return () => clearInterval(exp);
  }, [currentStream]);

  const handleLike = async () => {
    if (!user) return navigate('/login');
    if (!isStreamValid(currentStream)) return;
    try {
      setLiked(!liked);
      setLikeCount(p => Math.max(0, p + (liked ? -1 : 1)));
      await api.post(`/api/user/livestreams/${currentStream._id}/like`);
    } catch (e) {
      logger.error('like error', e);
    }
  };

  return (
    <div className={styles.liveThrowbackContainer}>
      <h1 className={styles.pageTitle}>Livethrowback</h1>
      <div className={styles.mainContent}>
        <div className={styles.videoSection}>
          <div className={styles.videoWrapper}>
            {currentStream && (
              <div className={styles.videoPlayer}>
                {isStreamValid(currentStream) ? (
                  <VideoPlayer src={getPlaybackUrl()} autoPlay controls />
                ) : (
                  <div className={styles.streamExpired}>
                    <FontAwesomeIcon icon={faExclamationTriangle}/>
                    <p>This livestream has ended</p>
                  </div>
                )}
              </div>
            )}
          </div>
          {currentStream && (
            <div className={styles.videoInfo}>
              <h2>{currentStream.title}</h2>
              <div className={styles.interactionBar}>
                <button onClick={handleLike}>
                  <FontAwesomeIcon icon={liked ? faHeart : faHeartBroken}/> {likeCount}
                </button>
                <button><FontAwesomeIcon icon={faShare}/> Share</button>
              </div>
            </div>
          )}
        </div>
        {currentStream && (
          <div className={styles.commentsSection}>
            <h3>Live Chat</h3>
            <CommentSection streamId={currentStream._id}/>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveThrowback;
