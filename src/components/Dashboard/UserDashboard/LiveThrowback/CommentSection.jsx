// CommentSection.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faThumbsUp, faReply } from '@fortawesome/free-solid-svg-icons';
import styles from './LiveThrowback.module.css';
import api from '../../../../utils/api';
import { useAuth } from '../../../../contexts/AuthContext';

const LOG_LEVEL = process.env.NODE_ENV === 'development' ? 'debug' : 'error';
const log = {
  d: (...a) => LOG_LEVEL === 'debug' && console.log('[CommentSection]', ...a),
  e: (...a) => console.error('[CommentSection]', ...a),
};

const PAGE_SIZE = 10;
const REPLIES_PAGE_SIZE = 10;

/** Initiales + couleur déterministe **/
const getInitials = (u) => {
  const first = (u?.prenom || '').trim();
  const last = (u?.nom || '').trim();
  if (first || last) return `${first?.[0] || ''}${last?.[0] || ''}`.toUpperCase() || 'U';
  const fallback = (u?.email || u?.displayName || 'User').trim();
  return (fallback[0] || 'U').toUpperCase();
};

const colorFromString = (str = 'User') => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return `hsl(${h}, 70%, 45%)`;
};

const InitialsAvatar = ({ user, className }) => {
  const initials = getInitials(user);
  const bg = colorFromString(`${user?.prenom || ''}${user?.nom || ''}${user?.email || ''}`);
  const baseStyle = {
    backgroundColor: bg,
    color: '#fff',
    borderRadius: '9999px',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    userSelect: 'none',
    textTransform: 'uppercase',
    fontWeight: 700,
    width: '40px',
    height: '40px',
    fontSize: '14px',
  };
  return (
    <div className={className} style={baseStyle} aria-label={`${user?.prenom || ''} ${user?.nom || ''}`.trim() || 'User'}>
      {initials}
    </div>
  );
};

const CommentSection = ({ streamId }) => {
  const { user } = useAuth();

  const [comments, setComments] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isBanned, setIsBanned] = useState(false);
  const [chatDisabled, setChatDisabled] = useState(false);

  // repliesMap: { [commentId]: { items, page, hasMore, loading, open } }
  const [repliesMap, setRepliesMap] = useState({});

  const [replyingTo, setReplyingTo] = useState(null);
  const containerRef = useRef(null);
  const pollRef = useRef(null);
  const loadingMoreRef = useRef(false);

  const nearBottom = () => {
    const el = containerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  };

  const formatDate = (iso) => {
    const d = new Date(iso);
    const diffMs = Date.now() - d.getTime();
    const m = Math.floor(diffMs / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 7) return `${days}d ago`;
    return d.toLocaleDateString();
  };

  // --- accès / état du chat ---
  useEffect(() => {
    const checkAccess = async () => {
      try {
        if (!streamId) return;
        const res = await api.get(`/api/user/livestreams/${streamId}`);
        const s = res?.data?.data;
        if (!s) return;
        if (s.chatEnabled === false) {
          setChatDisabled(true);
          setError('Chat has been disabled for this livestream.');
        }
        if (user && Array.isArray(s.bannedUsers) && s.bannedUsers.includes?.(user.id)) {
          setIsBanned(true);
          setError('You have been banned from this chat by the moderator.');
        }
      } catch (e) {
        log.e('checkAccess', e);
      }
    };
    setChatDisabled(false);
    setIsBanned(false);
    setError(null);
    checkAccess();
  }, [streamId, user]);

  // --- fetch comments ---
  const fetchComments = async (pageToLoad = 1, { preserveScroll = false } = {}) => {
    if (!streamId || chatDisabled || isBanned) return;
    try {
      if (pageToLoad === 1) setLoading(true);
      const el = containerRef.current;
      const prevHeight = el?.scrollHeight || 0;
      const prevTop = el?.scrollTop || 0;

      const res = await api.get(`/api/livechat/${streamId}`, {
        params: { page: pageToLoad, limit: PAGE_SIZE }
      });

      if (!res.data?.success || !Array.isArray(res.data.data)) throw new Error('Invalid response');

      const list = res.data.data;
      setHasMore(list.length === PAGE_SIZE);
      setComments((prev) => (pageToLoad === 1 ? list : [...prev, ...list]));

      if (preserveScroll && el) {
        setTimeout(() => {
          const newHeight = el.scrollHeight;
          el.scrollTop = newHeight - prevHeight + prevTop;
        }, 0);
      }

      setError(null);
    } catch (e) {
      log.e('fetchComments', e);
      setError('Error loading comments.');
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  };

  // init + polling (seulement si on est vers le bas)
  useEffect(() => {
    if (!streamId || chatDisabled || isBanned) return;

    setComments([]);
    setPage(1);
    setHasMore(true);
    setRepliesMap({});
    fetchComments(1);

    clearInterval(pollRef.current);
    pollRef.current = setInterval(() => {
      if (nearBottom()) fetchComments(1);
    }, 15000);

    return () => clearInterval(pollRef.current);
  }, [streamId, chatDisabled, isBanned]);

  // infinite scroll (chargement des pages suivantes en remontant en haut)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onScroll = () => {
      if (loadingMoreRef.current || !hasMore || loading) return;
      if (el.scrollTop <= 10) {
        loadingMoreRef.current = true;
        const next = page + 1;
        setPage(next);
        fetchComments(next, { preserveScroll: true });
      }
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [page, hasMore, loading]);

  // --- likes ---
  const toggleLike = async (id, isReply = false, parentId = null) => {
    try {
      if (!user || chatDisabled || isBanned) return;

      if (!isReply) {
        setComments((list) =>
          list.map((c) =>
            c._id === id
              ? { ...c, likes: c.userLiked ? c.likes - 1 : c.likes + 1, userLiked: !c.userLiked }
              : c
          )
        );
      } else {
        setRepliesMap((map) => {
          const bucket = map[parentId] || { items: [], page: 1, hasMore: true, loading: false, open: true };
          const newItems = bucket.items.map((r) =>
            r._id === id ? { ...r, likes: r.userLiked ? r.likes - 1 : r.likes + 1, userLiked: !r.userLiked } : r
          );
          return { ...map, [parentId]: { ...bucket, items: newItems } };
        });
      }

      await api.post(`/api/livechat/${streamId}/messages/${id}/like`);
    } catch (e) {
      log.e('toggleLike', e);
    }
  };

  // --- replies ---
  const ensureRepliesBucket = (commentId) =>
    setRepliesMap((map) => map[commentId] ? map : { ...map, [commentId]: { items: [], page: 1, hasMore: true, loading: false, open: false } });

  const openReplies = async (comment) => {
    ensureRepliesBucket(comment._id);
    setRepliesMap((map) => ({ ...map, [comment._id]: { ...(map[comment._id] || {}), open: true } }));
    if (!(repliesMap[comment._id]?.items?.length)) {
      await loadMoreReplies(comment._id, 1);
    }
  };

  const loadMoreReplies = async (commentId, pageToLoad = null) => {
    try {
      const bucket = repliesMap[commentId] || { items: [], page: 1, hasMore: true, loading: false, open: true };
      if (bucket.loading || (!bucket.hasMore && pageToLoad !== 1)) return;

      const nextPage = pageToLoad || bucket.page;
      setRepliesMap((map) => ({ ...map, [commentId]: { ...bucket, loading: true } }));

      const res = await api.get(`/api/livechat/${streamId}/messages/${commentId}/replies`, {
        params: { page: nextPage, limit: REPLIES_PAGE_SIZE }
      });

      if (!res.data?.success || !Array.isArray(res.data.data)) throw new Error('Invalid replies response');

      const items = res.data.data;
      const newItems = nextPage === 1 ? items : [...bucket.items, ...items];

      setRepliesMap((map) => ({
        ...map,
        [commentId]: {
          ...bucket,
          items: newItems,
          page: nextPage + 1,
          hasMore: items.length === REPLIES_PAGE_SIZE,
          loading: false,
          open: true
        }
      }));
    } catch (e) {
      log.e('loadMoreReplies', e);
      setRepliesMap((map) => ({
        ...map,
        [commentId]: { ...(map[commentId] || {}), loading: false }
      }));
    }
  };

  // ✅ REFRESH local d’un fil pour “réafficher” les replies
  const refreshReplies = async (commentId) => {
    setRepliesMap((map) => ({
      ...map,
      [commentId]: { items: [], page: 1, hasMore: true, loading: false, open: true }
    }));
    await loadMoreReplies(commentId, 1);
  };

  const submitReply = async (parentId, raw) => {
    try {
      if (!user || !raw.trim() || chatDisabled || isBanned) return;
      const content = raw.trim();

      const res = await api.post(`/api/livechat/${streamId}`, { content, parentId });
      if (!res.data?.success || !res.data.data) throw new Error('Reply failed');

      setRepliesMap((map) => {
        const bucket = map[parentId] || { items: [], page: 1, hasMore: true, loading: false, open: true };
        return { ...map, [parentId]: { ...bucket, items: [...bucket.items, res.data.data], open: true } };
      });

      setComments((list) =>
        list.map((c) => (c._id === parentId ? { ...c, replyCount: (c.replyCount || 0) + 1 } : c))
      );

      setReplyingTo(null);
    } catch (e) {
      log.e('submitReply', e);
    }
  };

  const beginReply = (comment) => {
    setReplyingTo({ id: comment._id, name: `${comment?.userId?.prenom || ''} ${comment?.userId?.nom || ''}`.trim() });
    openReplies(comment);
  };

  const commentList = useMemo(() => comments, [comments]);

  if (error) {
    return (
      <div className={styles.commentsError}>
        <div className={styles.errorMessage}>{error}</div>
      </div>
    );
  }

  return (
    <div className={styles.commentsContainer} ref={containerRef}>
      {loading && page === 1 ? (
        <div className={styles.loadingComments}>Loading comments...</div>
      ) : commentList.length === 0 ? (
        <div className={styles.noComments}>No comments yet. Be the first to comment!</div>
      ) : (
        <div className={styles.commentsList}>
          {commentList.map((c) => {
            const bucket = repliesMap[c._id] || { items: [], page: 1, hasMore: true, loading: false, open: false };
            const replies = bucket.items;

            return (
              <div key={c._id} className={styles.comment}>
                <InitialsAvatar user={c.userId} className={styles.commentAvatar} />

                <div className={styles.commentContent}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>
                      {c.userId?.prenom} {c.userId?.nom}
                    </span>
                    <span className={styles.commentTime}>{formatDate(c.createdAt)}</span>
                  </div>

                  <p className={styles.commentText}>{c.content}</p>

                  <div className={styles.commentActions}>
                    <button
                      className={`${styles.commentAction} ${c.userLiked ? styles.liked : ''}`}
                      onClick={() => toggleLike(c._id)}
                    >
                      <FontAwesomeIcon icon={faThumbsUp} /> <span>{c.likes}</span>
                    </button>

                    <button className={styles.commentAction} onClick={() => beginReply(c)}>
                      <FontAwesomeIcon icon={faReply} /> <span>Reply</span>
                    </button>

                    <span className={styles.commentAction} style={{ cursor: 'default' }}>
                      {c.replyCount ?? 0} replies
                    </span>

                    {!bucket.open ? (
                      <button className={styles.commentAction} onClick={() => openReplies(c)}>
                        View replies
                      </button>
                    ) : (
                      <>
                        {bucket.hasMore && (
                          <button className={styles.commentAction} onClick={() => loadMoreReplies(c._id)}>
                            Load more
                          </button>
                        )}
                        {/* ✅ Bouton Refresh pour relire toutes les replies */}
                        <button className={styles.commentAction} onClick={() => refreshReplies(c._id)}>
                          Refresh
                        </button>
                      </>
                    )}
                  </div>

                  {bucket.open && (
                    <div className={styles.replies}>
                      {replies.map((r) => (
                        <div key={r._id} className={styles.reply}>
                          <InitialsAvatar user={r.userId} className={styles.replyAvatar} />
                          <div className={styles.replyContent}>
                            <div className={styles.replyHeader}>
                              <span className={styles.replyAuthor}>
                                {r.userId?.prenom} {r.userId?.nom}
                              </span>
                              <span className={styles.replyTime}>{formatDate(r.createdAt)}</span>
                            </div>
                            <p className={styles.replyText}>{r.content}</p>
                            <div className={styles.commentActions}>
                              <button
                                className={`${styles.commentAction} ${r.userLiked ? styles.liked : ''}`}
                                onClick={() => toggleLike(r._id, true, c._id)}
                              >
                                <FontAwesomeIcon icon={faThumbsUp} /> <span>{r.likes}</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}

                      {replyingTo?.id === c._id && (
                        <div className={styles.replyFormContainer}>
                          <form
                            className={styles.replyInputForm}
                            onSubmit={(e) => {
                              e.preventDefault();
                              const input = e.currentTarget.querySelector('input');
                              const value = input?.value || '';
                              if (value.trim()) submitReply(c._id, value);
                              if (input) input.value = '';
                            }}
                          >
                            <input
                              type="text"
                              placeholder={`Reply to ${replyingTo?.name || 'this message'}...`}
                              className={styles.replyInput}
                              autoFocus
                            />
                            <div className={styles.replyFormActions}>
                              <button type="button" className={styles.cancelReplyBtn} onClick={() => setReplyingTo(null)}>
                                Cancel
                              </button>
                              <button type="submit" className={styles.submitReplyBtn}>
                                Reply
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CommentSection;
