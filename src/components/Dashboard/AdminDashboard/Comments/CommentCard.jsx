// components/Dashboard/AdminDashboard/Comments/CommentCard.jsx
import React, { useState } from 'react';
import styles from './CommentCard.module.css';
import ModerationModal from './ModerationModal';
import ReplyModal from './ReplyModal';

const CommentCard = ({ 
  comment, 
  isSelected, 
  onSelect, 
  onModerate, 
  onReply 
}) => {
  const [showModerationModal, setShowModerationModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [showFullContent, setShowFullContent] = useState(false);

  // Format date
  const formatDate = (date) => {
    const now = new Date();
    const commentDate = new Date(date);
    const diffInHours = Math.floor((now - commentDate) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      return 'Less than an hour ago';
    } else if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) {
        return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
      } else {
        return commentDate.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
    }
  };

  // Context (video, post, memory)
  const getContext = () => {
    if (comment.video_id) {
      return {
        type: 'video',
        title: comment.video_id.titre,
        artist: comment.video_id.artiste,
        icon: 'fas fa-play-circle'
      };
    } else if (comment.post_id) {
      return {
        type: 'post',
        title: comment.post_id.contenu?.substring(0, 50) + '...',
        icon: 'fas fa-file-alt'
      };
    } else {
      return {
        type: 'memory',
        title: 'Shared memory',
        icon: 'fas fa-heart'
      };
    }
  };

  // Status badge
  const getStatusBadge = () => {
    const statusConfig = {
      ACTIF: { className: styles.statusActive, icon: 'fas fa-check-circle', label: 'Active' },
      MODERE: { className: styles.statusModerated, icon: 'fas fa-exclamation-triangle', label: 'Moderated' },
      SUPPRIME: { className: styles.statusDeleted, icon: 'fas fa-trash', label: 'Deleted' },
      SIGNALE: { className: styles.statusReported, icon: 'fas fa-flag', label: 'Reported' }
    };
    
    const config = statusConfig[comment.statut] || statusConfig.ACTIF;
    
    return (
      <span className={`${styles.statusBadge} ${config.className}`}>
        <i className={config.icon}></i>
        {config.label}
      </span>
    );
  };

  // Author info
  const getAuthorInfo = () => {
    if (!comment.auteur) {
      return {
        name: 'Deleted user',
        email: '',
        avatar: '/images/default-avatar.jpg',
        isActive: false
      };
    }

    return {
      name: `${comment.auteur.prenom || ''} ${comment.auteur.nom || ''}`.trim() || 'User',
      email: comment.auteur.email || '',
      avatar: comment.auteur.photo_profil || '/images/default-avatar.jpg',
      isActive: comment.auteur.statut_compte === 'ACTIF'
    };
  };

  const context = getContext();
  const author = getAuthorInfo();

  return (
    <div className={`${styles.commentCard} ${isSelected ? styles.selected : ''}`}>
      {/* Selection checkbox */}
      <div className={styles.checkboxColumn}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onSelect}
          className={styles.checkbox}
        />
      </div>

      {/* Comment content */}
      <div className={styles.contentColumn}>
        <div className={styles.commentContent}>
          <p className={showFullContent ? '' : styles.truncated}>
            {comment.contenu}
          </p>
          {comment.contenu.length > 150 && (
            <button
              className={styles.toggleContent}
              onClick={() => setShowFullContent(!showFullContent)}
            >
              {showFullContent ? 'See less' : 'See more'}
            </button>
          )}
        </div>

        {/* Comment metadata */}
        <div className={styles.commentMeta}>
          <span className={styles.metaItem}>
            <i className="fas fa-thumbs-up"></i>
            {comment.likes || 0} likes
          </span>
          <span className={styles.metaItem}>
            <i className="fas fa-thumbs-down"></i>
            {comment.dislikes || 0} dislikes
          </span>
          {comment.parent_comment && (
            <span className={styles.metaItem}>
              <i className="fas fa-reply"></i>
              Reply
            </span>
          )}
          {comment.signale_par?.length > 0 && (
            <span className={`${styles.metaItem} ${styles.reported}`}>
              <i className="fas fa-flag"></i>
              {comment.signale_par.length} report{comment.signale_par.length > 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Author */}
      <div className={styles.authorColumn}>
        <div className={styles.authorInfo}>
          <img
            src={author.avatar}
            alt={author.name}
            className={styles.authorAvatar}
            onError={(e) => {
              e.target.src = '/images/default-avatar.jpg';
            }}
          />
          <div className={styles.authorDetails}>
            <div className={`${styles.authorName} ${!author.isActive ? styles.inactiveUser : ''}`}>
              {author.name}
            </div>
            <div className={styles.authorEmail}>{author.email}</div>
          </div>
        </div>
      </div>

      {/* Context */}
      <div className={styles.contextColumn}>
        <div className={styles.contextInfo}>
          <i className={`${context.icon} ${styles.contextIcon}`}></i>
          <div className={styles.contextDetails}>
            <div className={styles.contextType}>
              {context.type === 'video' ? 'Video' : context.type === 'post' ? 'Post' : 'Memory'}
            </div>
            <div className={styles.contextTitle} title={context.title}>
              {context.title}
            </div>
            {context.artist && (
              <div className={styles.contextArtist}>{context.artist}</div>
            )}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className={styles.statusColumn}>
        {getStatusBadge()}
      </div>

      {/* Date */}
      <div className={styles.dateColumn}>
        <div className={styles.dateInfo}>
          <div className={styles.dateRelative}>
            {formatDate(comment.creation_date)}
          </div>
          <div className={styles.dateAbsolute}>
            {new Date(comment.creation_date).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: '2-digit',
              year: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actionsColumn}>
        <div className={styles.actionButtons}>
          {/* Moderate button */}
        <button
            className={styles.actionBtn}
            onClick={() => setShowModerationModal(true)}
            title="Moderate this comment"
          >
            <i className="fas fa-gavel"></i>
          </button> 

          {/* Reply button 
          <button
            className={styles.actionBtn}
            onClick={() => setShowReplyModal(true)}
            title="Reply to this comment"
          >
            <i className="fas fa-reply"></i>
          </button> */}

          {/* Quick actions */}
          {comment.statut !== 'ACTIF' && (
            <button
              className={`${styles.actionBtn} ${styles.approveBtn}`}
              onClick={() => onModerate(comment._id, 'approve')}
              title="Approve"
            >
              <i className="fas fa-check"></i>
            </button>
          )}

          {comment.statut !== 'SUPPRIME' && (
            <button
              className={`${styles.actionBtn} ${styles.deleteBtn}`}
              onClick={() => onModerate(comment._id, 'delete')}
              title="Delete"
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showModerationModal && (
        <ModerationModal
          comment={comment}
          onModerate={(action, reason) => {
            onModerate(comment._id, action, reason);
            setShowModerationModal(false);
          }}
          onClose={() => setShowModerationModal(false)}
        />
      )}

      {showReplyModal && (
        <ReplyModal
          comment={comment}
          onReply={(content) => {
            onReply(comment._id, content);
            setShowReplyModal(false);
          }}
          onClose={() => setShowReplyModal(false)}
        />
      )}
    </div>
  );
};

export default CommentCard;
