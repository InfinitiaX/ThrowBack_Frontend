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

/**
 * MemoryCard
 * - Affiche un commentaire (memory) + ses replies
 * - Callbacks fournis par le parent (VideoDetail) pour toutes les actions
 */
const MemoryCard = ({
  memory,
  baseUrl = '',
  currentVideoId,
  onLike,
  onAddReply,
  onLikeReply,
  onDeleteReply,
  onRequestDelete, // delete memory
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!memory) return null;

  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http') || path.startsWith('/images/')) return path;
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBaseUrl}${cleanPath}`;
  };

  const getMemoryTypeText = () => {
    switch (memory.type) {
      case 'shared': return 'just shared a throwback to the iconic music video:';
      case 'posted':
      default: return 'posted a memory on the music video:';
    }
  };

  const isMatchingCurrentVideo = () => {
    if (!currentVideoId) return true;
    const cur = currentVideoId.toString();
    const mem = (memory.videoId || memory.originalVideoId || memory.currentVideoId || '').toString();
    return mem === cur;
  };

  const handleLike = () => { onLike && memory.id && onLike(memory.id); };

  const handleSubmitReply = async (e) => {
    e.preventDefault();
    const text = replyText.trim();
    if (!text || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onAddReply?.(memory.id, text);
      setReplyText('');
      setShowReplyForm(false);
    } finally { setIsSubmitting(false); }
  };

  const cardStyle = isMatchingCurrentVideo() ? {} : { borderLeft: '3px solid #e74c3c' };

  return (
    <div className={styles.memoryCard} style={cardStyle}>
      {/* Header */}
      <div className={styles.memoryHeader}>
        <div className={styles.memoryHeaderLeft}>
          <img
            src={getImageUrl(memory.imageUrl || memory.auteur?.photo_profil)}
            alt={`User ${memory.username || ''}`}
            className={styles.memoryUserImage}
            onError={(e) => { e.target.src = '/images/default-avatar.jpg'; }}
          />
          <div className={styles.memoryHeaderMeta}>
            <span className={styles.memoryUsername}>
              {memory.username ||
                (memory.auteur && `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim()) ||
                'User'}
            </span>
            <span className={styles.memoryType}>{getMemoryTypeText()}</span>
          </div>
        </div>

        {memory.userInteraction?.isAuthor && (
          <button
            className={styles.deleteButton}
            onClick={() => onRequestDelete?.(memory.id)}
            title="Delete this comment"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
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

        <div className={styles.memoryComments} onClick={() => { if (!memory.showReplies && (memory.replies||[]).length === 0) { /* rien à charger ici (déjà fourni par parent) */ }}}>
          <FontAwesomeIcon icon={faComment} />
          <span>{Array.isArray(memory.replies) ? memory.replies.length : 0}</span>
        </div>

        <div className={styles.memoryReply} onClick={() => setShowReplyForm((s) => !s)}>
          <FontAwesomeIcon icon={faReply} />
          <span>Reply</span>
        </div>
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form className={styles.replyForm} onSubmit={handleSubmitReply}>
          <input
            type="text"
            className={styles.replyInput}
            placeholder="Reply..."
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
          />
          <button className={styles.replySendBtn} disabled={isSubmitting} title="Send">
            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
          </button>
        </form>
      )}

      {/* Replies */}
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
