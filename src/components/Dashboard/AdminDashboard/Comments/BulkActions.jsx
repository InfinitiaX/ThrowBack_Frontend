// components/Dashboard/AdminDashboard/Comments/BulkActions.jsx
import React, { useState } from 'react';
import styles from './BulkActions.module.css';

const BulkActions = ({ selectedCount, onBulkModerate, onCancel }) => {
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Available actions
  const actions = [
    {
      id: 'approve',
      label: 'Approve',
      icon: 'fas fa-check',
      color: 'success',
      description: 'Approve all selected comments'
    },
    {
      id: 'reject',
      label: 'Reject',
      icon: 'fas fa-times',
      color: 'warning',
      description: 'Reject the selected comments (moderation)'
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: 'fas fa-trash',
      color: 'danger',
      description: 'Permanently delete the selected comments'
    }
  ];

  const handleActionSelect = (action) => {
    setSelectedAction(action);
    setShowConfirmation(true);
    setReason('');
  };

  const handleConfirm = async () => {
    if (!selectedAction) return;

    setIsProcessing(true);
    try {
      await onBulkModerate(selectedAction.id, reason);
      setShowConfirmation(false);
      setSelectedAction(null);
      setReason('');
    } catch (error) {
      console.error('Error during bulk action:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (showConfirmation) {
      setShowConfirmation(false);
      setSelectedAction(null);
      setReason('');
    } else {
      onCancel();
    }
  };

  // Confirmation messages
  const getConfirmationMessage = () => {
    if (!selectedAction) return '';

    const actionMessages = {
      approve: `Are you sure you want to approve ${selectedCount} comment${selectedCount > 1 ? 's' : ''}?`,
      reject: `Are you sure you want to reject ${selectedCount} comment${selectedCount > 1 ? 's' : ''}?`,
      delete: `Are you sure you want to permanently delete ${selectedCount} comment${selectedCount > 1 ? 's' : ''}?`
    };

    return actionMessages[selectedAction.id];
  };

  // Predefined reasons
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

  return (
    <>
      <div className={styles.bulkActionsBar}>
        <div className={styles.selectionInfo}>
          <i className="fas fa-check-square"></i>
          <span className={styles.selectedCount}>
            {selectedCount} selected comment{selectedCount > 1 ? 's' : ''}
          </span>
        </div>

        <div className={styles.actionButtons}>
          {actions.map(action => (
            <button
              key={action.id}
              className={`${styles.actionBtn} ${styles[action.color]}`}
              onClick={() => handleActionSelect(action)}
              title={action.description}
              disabled={isProcessing}
            >
              <i className={action.icon}></i>
              {action.label}
            </button>
          ))}
        </div>

        <div className={styles.cancelContainer}>
          <button
            className={styles.cancelBtn}
            onClick={handleCancel}
            disabled={isProcessing}
          >
            <i className="fas fa-times"></i>
            Cancel
          </button>
        </div>
      </div>

      {/* Confirmation modal */}
      {showConfirmation && selectedAction && (
        <div className={styles.modalOverlay}>
          <div className={styles.confirmationModal}>
            <div className={styles.modalHeader}>
              <h3>
                <i className={selectedAction.icon}></i>
                Confirm action
              </h3>
            </div>

            <div className={styles.modalContent}>
              <div className={styles.confirmationMessage}>
                <div className={`${styles.actionIcon} ${styles[selectedAction.color]}`}>
                  <i className={selectedAction.icon}></i>
                </div>
                <p>{getConfirmationMessage()}</p>
              </div>

              {/* Reason (optional for approve, recommended for reject/delete) */}
              {(selectedAction.id === 'reject' || selectedAction.id === 'delete') && (
                <div className={styles.reasonSection}>
                  <label htmlFor="reason">
                    Reason {selectedAction.id === 'delete' ? '(recommended)' : '(optional)'}
                  </label>
                  
                  {/* Predefined reasons */}
                  {predefinedReasons[selectedAction.id] && (
                    <div className={styles.predefinedReasons}>
                      {predefinedReasons[selectedAction.id].map((predefinedReason, index) => (
                        <button
                          key={index}
                          type="button"
                          className={`${styles.reasonBtn} ${reason === predefinedReason ? styles.selected : ''}`}
                          onClick={() => setReason(reason === predefinedReason ? '' : predefinedReason)}
                        >
                          {predefinedReason}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Custom input */}
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

              {/* Warning for delete */}
              {selectedAction.id === 'delete' && (
                <div className={styles.warningBox}>
                  <i className="fas fa-exclamation-triangle"></i>
                  <div>
                    <strong>Warning:</strong> This action is irreversible. 
                    Deleted comments cannot be recovered.
                  </div>
                </div>
              )}
            </div>

            <div className={styles.modalActions}>
              <button
                className={styles.cancelModalBtn}
                onClick={handleCancel}
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                className={`${styles.confirmBtn} ${styles[selectedAction.color]}`}
                onClick={handleConfirm}
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Processing...
                  </>
                ) : (
                  <>
                    <i className={selectedAction.icon}></i>
                    Confirm {selectedAction.label.toLowerCase()}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BulkActions;
