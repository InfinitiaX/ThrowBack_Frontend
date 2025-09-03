import React, { useState } from 'react';
import styles from './VideoDetail.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHeart,
  faComment,
  faExclamationTriangle,
  faReply,
  faPaperPlane,
  faSpinner,
  faTrash
} from '@fortawesome/free-solid-svg-icons';

const MemoryCard = ({
  memory,
  currentVideoId,
  onLike,        // (memoryId) => void
  onAddReply,    // (memoryId, text) => Promise<void>
  onLikeReply,   // (memoryId, replyId) => Promise<void>
  onDeleteReply  // (memoryId, replyId) => Promise<void>
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!memory) return null;

  const isMatchingCurrentVideo = () => {
    if (!currentVideoId) return true;
    const cur = currentVideoId.toString();
    const mem = (memory.videoId || memory.originalVideoId || memory.currentVideoId || memory.video?._id || '').toString();
    return mem === cur || !mem; // on reste permissif si le backend ne renvoie pas l’info
  };

  const handleLike = () => onLike?.(memory.id);

  const submitReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddReply?.(memory.id, text);
      setReplyText('');
      setShowReplyForm(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const cardStyle = isMatchingCurrentVideo() ? {} : { borderLeft: '3px solid #e74c3c' };

  return (
    <div className={styles.memoryCard} style={cardStyle}>
      {/* Header */}
      <div className={styles.memoryHeader}>
        <div className={styles.memoryHeaderLeft}>
          <img
            src={memory.imageUrl || '/images/default-avatar.jpg'}
            alt={`User ${memory.username || ''}`}
            className={styles.memoryUserImage}
            onError={(e) => { e.target.src = '/images/default-avatar.jpg'; }}
          />
          <div className={styles.memoryHeaderMeta}>
            <span className={styles.memoryUsername}>{memory.username || 'User'}</span>
            <span className={styles.memoryType}>
              {memory.type === 'shared'
                ? 'just shared a throwback to the iconic music video:'
                : 'posted a memory on the music video:'}
            </span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className={styles.memoryBody}>
        <div className={styles.memoryVideoLine}>
          <strong>{memory.videoArtist || 'Unknown artist'}</strong> - {memory.videoTitle || 'Untitled'} ({memory.videoYear || '----'})
        </div>
        {!isMatchingCurrentVideo() && (
          <div className={styles.wrongVideoWarning}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.warningIcon} />
            <span>This memory belongs to another video</span>
          </div>
        )}
        {memory.content && <div className={styles.memoryText}>{memory.content}</div>}
      </div>

      {/* Footer actions */}
      <div className={styles.memoryFooter}>
        <div className={`${styles.memoryLikes} ${memory.userInteraction?.liked ? styles.liked : ''}`} onClick={handleLike}>
          <FontAwesomeIcon icon={faHeart} />
          <span>{memory.likes || 0}</span>
        </div>

        <div className={styles.memoryComments}>
          <FontAwesomeIcon icon={faComment} />
          <span>{Array.isArray(memory.replies) ? memory.replies.length : 0}</span>
        </div>

        <div className={styles.memoryReply} onClick={() => setShowReplyForm((s) => !s)}>
          <FontAwesomeIcon icon={faReply} />
          <span>Reply</span>
        </div>
      </div>

      {/* Reply form (stylée) */}
      {showReplyForm && (
        <form className={styles.replyForm} onSubmit={submitReply}>
          <input
            type="text"
            className={styles.replyInput}
            placeholder="Reply…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button className={styles.replySendBtn} disabled={isSubmitting} title="Send">
            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
          </button>
        </form>
      )}

      {/* Replies (avec style CSS existant) */}
      {Array.isArray(memory.replies) && memory.replies.length > 0 && (
        <div className={styles.repliesContainer}>
          {memory.replies.map((r) => (
            <div key={r.id} className={styles.replyItem}>
              <div className={styles.replyHeader}>
                <span className={styles.replyUser}>{r.username || 'User'}</span>
                {r.userInteraction?.isAuthor && (
                  <button
                    className={styles.replyDeleteBtn}
                    title="Delete reply"
                    onClick={() => onDeleteReply?.(memory.id, r.id)}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                )}
              </div>

              <div className={styles.replyText}>{r.content}</div>

              <div className={styles.replyFooter}>
                <button
                  type="button"
                  className={`${styles.replyLikeBtn} ${r.userInteraction?.liked ? styles.liked : ''}`}
                  onClick={() => onLikeReply?.(memory.id, r.id)}
                >
                  <FontAwesomeIcon icon={faHeart} />
                  <span>{r.likes || 0}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;
