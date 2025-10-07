// components/Dashboard/AdminDashboard/Comments/ModerationModal.jsx
import React, { useState } from 'react';
import styles from './ModerationModal.module.css';

const ModerationModal = ({ comment, onModerate, onClose }) => {
  const [selectedAction, setSelectedAction] = useState('approve');
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const actions = [
    {
      id: 'approve',
      label: 'Approve',
      icon: 'fas fa-check',
      color: 'success',
      description: 'Approve this comment and make it visible'
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: 'fas fa-times',
      color: 'warning', 
      description: 'Reject this comment (moderation)'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'fas fa-trash',
      color: 'danger',
      description: 'Permanently delete this comment'
    }
  ];

  const predefinedReasons = {
    reject: [
      'Inappropriate content',
      'Spam or advertising',
      'Harassment',
      'Hate speech',
      'Violation of community rules',
      'Off-topic content'
    ],
    delete: [
      'Severe rule violation',
      'Illegal content',
      'Repeated spam',
      'Severe harassment',
      'Extremely inappropriate content'
    ]
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      await onModerate(selectedAction, reason);
    } catch (error) {
      console.error('Error during moderation:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedActionData = actions.find(a => a.id === selectedAction);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>Moderate Comment</h3>
          <button className={styles.closeBtn} onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className={styles.modalContent}>
          {/* Comment preview */}
          <div className={styles.commentPreview}>
            <div className={styles.commentContent}>
              <p>"{comment.contenu}"</p>
            </div>
            <div className={styles.commentMeta}>
              <span>
                <i className="fas fa-user"></i>
                {comment.auteur ? `${comment.auteur.prenom} ${comment.auteur.nom}` : 'Deleted user'}
              </span>
              <span>
                <i className="fas fa-clock"></i>
                {new Date(comment.creation_date).toLocaleDateString('en-GB')}
              </span>
              {comment.signale_par && comment.signale_par.length > 0 && (
                <span className={styles.reported}>
                  <i className="fas fa-flag"></i>
                  {comment.signale_par.length} report{comment.signale_par.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Action selection */}
            <div className={styles.actionSelection}>
              <label>Action to perform:</label>
              <div className={styles.actionButtons}>
                {actions.map(action => (
                  <button
                    key={action.id}
                    type="button"
                    className={`${styles.actionBtn} ${styles[action.color]} ${
                      selectedAction === action.id ? styles.selected : ''
                    }`}
                    onClick={() => setSelectedAction(action.id)}
                  >
                    <i className={action.icon}></i>
                    {action.label}
                  </button>
                ))}
              </div>
              {selectedActionData && (
                <p className={styles.actionDescription}>
                  {selectedActionData.description}
                </p>
              )}
            </div>

            {/* Reason */}
            {(selectedAction === 'reject' || selectedAction === 'delete') && (
              <div className={styles.reasonSection}>
                <label htmlFor="reason">
                  Reason {selectedAction === 'delete' ? '(recommended)' : '(optional)'}
                </label>
                
                {predefinedReasons[selectedAction] && (
                  <div className={styles.predefinedReasons}>
                    {predefinedReasons[selectedAction].map((predefinedReason, index) => (
                      <button
                        key={index}
                        type="button"
                        className={`${styles.reasonBtn} ${
                          reason === predefinedReason ? styles.selected : ''
                        }`}
                        onClick={() => setReason(reason === predefinedReason ? '' : predefinedReason)}
                      >
                        {predefinedReason}
                      </button>
                    ))}
                  </div>
                )}

                <textarea
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Enter a custom reason..."
                  className={styles.reasonTextarea}
                  rows="3"
                />
              </div>
            )}

            {/* Warning for deletion */}
            {selectedAction === 'delete' && (
              <div className={styles.warningBox}>
                <i className="fas fa-exclamation-triangle"></i>
                <div>
                  <strong>Warning:</strong> This action is irreversible. 
                  The deleted comment cannot be recovered.
                </div>
              </div>
            )}

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
                className={`${styles.submitBtn} ${selectedActionData ? styles[selectedActionData.color] : ''}`}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={selectedActionData?.icon}></i>
                    {selectedActionData?.label}
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

// components/Dashboard/AdminDashboard/Comments/ReplyModal.jsx
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

export { ModerationModal, ReplyModal };
export default ModerationModal;
