// components/Dashboard/AdminDashboard/Comments/ReplyModal.jsx
import React, { useState } from 'react';
import styles from './ModerationModal.module.css';

const ReplyModal = ({ comment, onReply, onClose }) => {
  const [content, setContent] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;

    setIsProcessing(true);
    try {
      await onReply(content.trim());
    } catch (error) {
      console.error('Error while replying:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Reply to Comment</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Original comment */}
          <div className={styles.commentPreview}>
            <div className={styles.originalComment}>
              <div className={styles.commentHeader}>
                <i className="fas fa-quote-left"></i>
                <span>Original comment:</span>
              </div>
              <p>"{comment.contenu}"</p>
              <div className={styles.commentMeta}>
                <span>
                  <i className="fas fa-user"></i>
                  {comment.auteur ? `${comment.auteur.prenom} ${comment.auteur.nom}` : 'Deleted user'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className={styles.replySection}>
              <label htmlFor="replyContent">Your reply (as administrator):</label>
              <textarea
                id="replyContent"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply..."
                className={styles.replyTextarea}
                rows="4"
                maxLength="500"
                required
              />
              <div className={styles.charCount}>
                {content.length}/500 characters
              </div>
            </div>

            <div className={styles.replyInfo}>
              <i className="fas fa-info-circle"></i>
              <p>
                This reply will be publicly visible and marked as an administrative response.
              </p>
            </div>

            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={onClose}
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                className={styles.replyBtn}
                disabled={isProcessing || !content.trim()}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Sending...
                  </>
                ) : (
                  <>
                    <i className="fas fa-reply"></i>
                    Send Reply
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReplyModal;
