// components/Common/EmptyState.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './EmptyState.module.css';

/**
 * Composant EmptyState pour afficher un état vide avec une icône, un titre, un message et éventuellement une action
 * 
 * @param {Object} icon 
 * @param {string} title 
 * @param {string} message 
 * @param {string} actionText
 * @param {Function} onAction 
 * @param {string} imageUrl 
 * @param {string} imageAlt 
 * @param {string} className 
 */
const EmptyState = ({
  icon,
  title,
  message,
  actionText,
  onAction,
  imageUrl,
  imageAlt = 'Empty state illustration',
  className = ''
}) => {
  return (
    <div className={`${styles.emptyState} ${className}`}>
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={imageAlt}
          className={styles.illustration}
        />
      ) : icon ? (
        <div className={styles.iconContainer}>
          <FontAwesomeIcon icon={icon} className={styles.icon} />
        </div>
      ) : null}
      
      {title && (
        <h3 className={styles.title}>{title}</h3>
      )}
      
      {message && (
        <p className={styles.message}>{message}</p>
      )}
      
      {actionText && onAction && (
        <button
          className={styles.actionButton}
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;