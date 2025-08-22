// CommentSection.jsx
import React, { useEffect, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faReply } from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import api from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';

const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';
const logger = {
  debug: (...a) => LOG_LEVEL === 'debug' && console.log(...a),
  error: (...a) => console.error(...a),
};

const CommentSection = ({ streamId }) => {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const containerRef = useRef(null);
  const loadingMoreRef = useRef(false);
  const pollRef = useRef(null);

  const fetchComments = async (pageToLoad = 1) => {
    if (!streamId) return;
    try {
      if (pageToLoad === 1) setLoading(true);
      const res = await api.get(`/api/livechat/${streamId}`, { params: { page: pageToLoad, limit: 10 } });

      if (!res.data?.success || !Array.isArray(res.data.data)) {
        throw new Error('Invalid response');
      }

      const list = res.data.data;
      setHasMore(list.length === 10);
      setComments((prev) => (pageToLoad === 1 ? list : [...prev, ...list]));
      setError(null);
    } catch (e) {
      logger.error(e);
      setError('Error loading comments');
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  useEffect(() => {
    setPage(1);
    setComments([]);
    setHasMore(true);
    fetchComments(1);

    // polling toutes les 15s sur la page 1 uniquement
    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (containerRef.current) {
        const nearBottom =
          containerRef.current.scrollHeight - containerRef.current.scrollTop - containerRef.current.clientHeight < 80;
        if (nearBottom) fetchComments(1);
      }
    }, 15000);

    return () => clearInterval(pollRef.current);
  }, [streamId]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (loadingMoreRef.current || !hasMore) return;
      if (el.scrollTop <= 0) {
        loadingMoreRef.current = true;
        const next = page + 1;
        setPage(next);
        fetchComments(next);
      }
    };

    el.addEventListener('scroll', onScroll);
    return () => el.removeEventListener('scroll', onScroll);
  }, [page, hasMore]);

  const toggleLike = async (id) => {
    if (!user) return;
    setComments((list) =>
      list.map((c) =>
        c._id === id
          ? { ...c, likes: c.userLiked ? c.likes - 1 : c.likes + 1, userLiked: !c.userLiked }
          : c
      )
    );
    try {
      await api.post(`/api/livechat/${streamId}/messages/${id}/like`);
    } catch (e) {
      // rollback en cas d’échec
      setComments((list) =>
        list.map((c) =>
          c._id === id
            ? { ...c, likes: c.userLiked ? c.likes - 1 : c.likes + 1, userLiked: !c.userLiked }
            : c
        )
      );
    }
  };

  if (error) {
    return <div className={styles.commentsError}><div className={styles.errorMessage}>{error}</div></div>;
  }

  return (
    <div className={styles.commentsContainer} ref={containerRef}>
      {loading && page === 1 ? (
        <div className={styles.loadingComments}>Loading comments...</div>
      ) : comments.length === 0 ? (
        <div className={styles.noComments}>No comments yet. Be the first to comment!</div>
      ) : (
        <div className={styles.commentsList}>
          {comments.map((c) => (
            <div key={c._id} className={styles.comment}>
              <img
                src={c.userId?.photo_profil || '/images/bob4.png'}
                alt={c.userId?.prenom || 'User'}
                className={styles.commentAvatar}
                onError={(e) => { e.currentTarget.src = '/images/bob4.png'; }}
              />
              <div className={styles.commentContent}>
                <div className={styles.commentHeader}>
                  <span className={styles.commentAuthor}>
                    {c.userId?.prenom} {c.userId?.nom}
                  </span>
                  <span className={styles.commentTime}>
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className={styles.commentText}>{c.content}</p>
                <div className={styles.commentActions}>
                  <button className={`${styles.commentAction} ${c.userLiked ? styles.liked : ''}`} onClick={() => toggleLike(c._id)}>
                    <FontAwesomeIcon icon={faThumbsUp} /> <span>{c.likes}</span>
                  </button>
                  <button className={styles.commentAction} onClick={() => { /* reply UI à rajouter si besoin */ }}>
                    <FontAwesomeIcon icon={faReply} /> <span>Reply</span>
                  </button>
                </div>
                {Array.isArray(c.replies) && c.replies.length > 0 && (
                  <div className={styles.replies}>
                    {c.replies.map((r) => (
                      <div key={r._id} className={styles.reply}>
                        <img
                          src={r.userId?.photo_profil || '/images/bob6.png'}
                          alt={r.userId?.prenom || 'User'}
                          className={styles.replyAvatar}
                          onError={(e) => { e.currentTarget.src = '/images/bob6.png'; }}
                        />
                        <div className={styles.replyContent}>
                          <div className={styles.replyHeader}>
                            <span className={styles.replyAuthor}>
                              {r.userId?.prenom} {r.userId?.nom}
                            </span>
                            <span className={styles.replyTime}>
                              {new Date(r.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p className={styles.replyText}>{r.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {loading && page > 1 && <div className={styles.loadingMoreComments}>Loading more…</div>}
    </div>
  );
};

export default CommentSection;
