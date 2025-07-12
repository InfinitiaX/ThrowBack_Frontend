// components/Common/EmptyState.jsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import styles from './EmptyState.module.css';

/**
 * Composant EmptyState pour afficher un état vide avec une icône, un titre, un message et éventuellement une action
 * 
 * @param {Object} icon - Icône FontAwesome à afficher
 * @param {string} title - Titre de l'état vide
 * @param {string} message - Message détaillé
 * @param {string} actionText - Texte du bouton d'action (optionnel)
 * @param {Function} onAction - Fonction à appeler lors du clic sur le bouton d'action
 * @param {string} imageUrl - URL d'une image à afficher à la place de l'icône (optionnel)
 * @param {string} imageAlt - Texte alternatif pour l'image (optionnel)
 * @param {string} className - Classes CSS supplémentaires (optionnel)
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