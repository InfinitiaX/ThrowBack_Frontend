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
  faTrash,
  faEllipsisV,
  faThumbsUp
} from '@fortawesome/free-solid-svg-icons';

const MemoryCard = ({
  memory,
  baseUrl = '',
  onLike,
  onAddReply,
  onRequestDelete,
  currentVideoId,
  replies = [],
  showReplies = false,
  onToggleReplies,
  isMobile = false
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showActions, setShowActions] = useState(false);

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

  const handleLike = () => { 
    if (onLike && memory.id) {
      console.log(`Like requested for memory ${memory.id}`);
      onLike(memory.id);
    }
  };

  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    console.log(`Submitting reply to memory ${memory.id}: "${replyText}"`);
    
    setIsSubmitting(true);
    if (onAddReply) {
      onAddReply(memory.id, replyText.trim())
        .then((success) => { 
          if (success) {
            console.log('Reply added successfully');
            setReplyText(''); 
            setShowReplyForm(false);
          } else {
            console.log('Reply failed');
          }
        })
        .finally(() => setIsSubmitting(false));
    } else {
      setIsSubmitting(false);
    }
  };

  const askDelete = () => { 
    console.log(`Request to delete memory: ${memory.id}`);
    if (onRequestDelete) onRequestDelete(memory.id);
    if (showActions) setShowActions(false);
  };

  const handleDeleteReply = (replyId) => {
    console.log(`Request to delete reply: ${replyId}`);
    if (onRequestDelete) {
      onRequestDelete(replyId);
    }
  };

  const toggleActions = () => {
    setShowActions(!showActions);
  };

  const cardStyle = isMatchingCurrentVideo() ? {} : { borderLeft: '3px solid #e74c3c' };

  return (
    <div className={`${styles.memoryCard} ${isMobile ? styles.mobileMemoryCard : ''}`} style={cardStyle}>
      {/* Header */}
      <div className={styles.memoryHeader}>
        <div className={styles.memoryHeaderLeft}>
          <img
            src={getImageUrl(memory.imageUrl || memory.auteur?.photo_profil)}
            alt={`User ${memory.username || ''}`}
            className={styles.memoryUserImage}
            onError={(e) => { e.target.src = '/images/default-avatar.jpg'; e.target.onerror = null; }}
          />
          <div className={styles.memoryHeaderMeta}>
            <span className={styles.memoryUsername}>
              {memory.username || (memory.auteur && `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim()) || 'User'}
            </span>
            <span className={styles.memoryType}>
              {getMemoryTypeText()}
            </span>
          </div>
        </div>

        {/* Actions menu (mobile style) */}
        {isMobile ? (
          <div className={styles.mobileActions}>
            <button 
              className={styles.mobileActionsButton}
              onClick={toggleActions}
              aria-label="Memory options"
            >
              <FontAwesomeIcon icon={faEllipsisV} />
            </button>
            
            {showActions && (
              <div className={styles.mobileActionsMenu}>
                {memory.userInteraction?.isAuthor && (
                  <button 
                    className={styles.mobileActionItem} 
                    onClick={askDelete}
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    <span>Delete</span>
                  </button>
                )}
                <button 
                  className={`${styles.mobileActionItem} ${memory.userInteraction?.liked ? styles.liked : ''}`} 
                  onClick={handleLike}
                >
                  <FontAwesomeIcon icon={faThumbsUp} />
                  <span>{memory.userInteraction?.liked ? 'Unlike' : 'Like'}</span>
                </button>
                <button 
                  className={styles.mobileActionItem} 
                  onClick={() => {
                    setShowReplyForm(!showReplyForm);
                    setShowActions(false);
                  }}
                >
                  <FontAwesomeIcon icon={faReply} />
                  <span>Reply</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Desktop delete button */
          memory.userInteraction?.isAuthor && (
            <button
              className={styles.deleteButton}
              onClick={askDelete}
              title="Delete this memory"
            >
              <FontAwesomeIcon icon={faTrash} />
            </button>
          )
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

      {/* Footer / Actions */}
      <div className={styles.memoryFooter}>
        <div
          className={`${styles.memoryLikes} ${memory.userInteraction?.liked ? styles.liked : ''}`}
          onClick={handleLike}
          title={memory.userInteraction?.liked ? 'Unlike' : 'Like'}
        >
          <FontAwesomeIcon icon={isMobile ? faThumbsUp : faHeart} className={styles.memoryIcon} />
          <span>{memory.likes || 0}</span>
        </div>
        <div
          className={styles.memoryComments}
          onClick={() => onToggleReplies && onToggleReplies(memory.id)}
          title={showReplies ? 'Hide replies' : 'Show replies'}
        >
          <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          <span>{memory.nb_commentaires || memory.comments || (replies?.length || 0)}</span>
        </div>
        {!isMobile && (
          <div
            className={styles.memoryReply}
            onClick={() => setShowReplyForm(!showReplyForm)}
            title={showReplyForm ? 'Cancel' : 'Reply'}
          >
            <FontAwesomeIcon icon={faReply} className={styles.memoryIcon} />
          </div>
        )}
      </div>

      {/* Reply form */}
      {showReplyForm && (
        <form className={styles.replyForm} onSubmit={handleSubmitReply}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className={styles.replyInput}
            disabled={isSubmitting}
            autoFocus
          />
          <button
            type="submit"
            className={styles.replyButton}
            disabled={isSubmitting || !replyText.trim()}
            title="Send"
          >
            {isSubmitting ? <FontAwesomeIcon icon={faSpinner} spin /> : <FontAwesomeIcon icon={faPaperPlane} />}
          </button>
        </form>
      )}

      {/* Replies */}
      {showReplies && replies.length > 0 && (
        <div className={styles.repliesSection}>
          {replies.map(reply => {
            const replyId = reply.id || reply._id;
            return (
              <div key={replyId} className={styles.replyCard}>
                <img
                  src={getImageUrl(reply.auteur?.photo_profil)}
                  alt="User"
                  className={styles.replyUserImage}
                  onError={(e) => { e.target.src = '/images/default-avatar.jpg'; e.target.onerror = null; }}
                />
                <div className={styles.replyContent}>
                  <div className={styles.replyUsername}>
                    {reply.auteur ? `${reply.auteur.prenom || ''} ${reply.auteur.nom || ''}`.trim() : 'User'}
                  </div>
                  <div className={styles.replyText}>{reply.contenu || reply.content}</div>
                  <div className={styles.replyFooter}>
                    <div
                      className={`${styles.replyLikes} ${reply.userInteraction?.liked ? styles.liked : ''}`}
                      onClick={() => onLike && onLike(replyId)}
                      title={reply.userInteraction?.liked ? 'Unlike' : 'Like'}
                    >
                      <FontAwesomeIcon icon={isMobile ? faThumbsUp : faHeart} className={styles.replyIcon} />
                      <span>{reply.likes || 0}</span>
                    </div>
                    {reply.userInteraction?.isAuthor && (
                      <div
                        className={styles.replyDelete}
                        onClick={() => handleDeleteReply(replyId)}
                        title="Delete this reply"
                      >
                        <FontAwesomeIcon icon={faTrash} className={styles.replyIcon} />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;