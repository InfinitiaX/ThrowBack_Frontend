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
  baseUrl = '', 
  onLike, 
  onAddReply,
  onDeleteMemory,
  currentVideoId,
  replies = [],
  showReplies = false,
  onToggleReplies
}) => {
  const [replyText, setReplyText] = useState('');
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!memory) return null;

  // Fonction pour construire des URLs complètes pour les images
  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http') || path.startsWith('/images/')) return path;
    
    // Nettoyer l'URL de base pour éviter les doubles slash
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    
    return `${cleanBaseUrl}${cleanPath}`;
  };

  // Construire le texte adapté au type de mémoire
  const getMemoryTypeText = () => {
    switch (memory.type) {
      case 'shared':
        return 'just shared a throwback to the iconic music video:';
      case 'posted':
      default:
        return 'posted a memory on the music video:';
    }
  };

  // Gérer le clic sur le bouton like
  const handleLike = () => {
    if (onLike && memory.id) {
      onLike(memory.id);
    }
  };

  // Vérifier si le souvenir correspond à la vidéo actuelle
  const isMatchingCurrentVideo = () => {
    if (!currentVideoId || !memory.videoId) return true; // Par défaut, considérer comme correspondant
    
    return memory.videoId.toString() === currentVideoId.toString() || 
           (memory.originalVideoId && memory.originalVideoId.toString() === currentVideoId.toString());
  };

  // Gérer l'ajout d'une réponse
  const handleSubmitReply = (e) => {
    e.preventDefault();
    if (!replyText.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    
    // Appeler la fonction de soumission de réponse
    if (onAddReply) {
      onAddReply(memory.id, replyText.trim())
        .then(() => {
          setReplyText(''); // Réinitialiser le champ de texte
          setShowReplyForm(false); // Masquer le formulaire
        })
        .finally(() => {
          setIsSubmitting(false);
        });
    } else {
      setIsSubmitting(false);
    }
  };

  // Gérer la suppression d'un souvenir
  const handleDelete = () => {
    if (onDeleteMemory && window.confirm('Êtes-vous sûr de vouloir supprimer ce souvenir ?')) {
      onDeleteMemory(memory.id);
    }
  };

  // Style spécial pour les souvenirs non correspondants
  const cardStyle = isMatchingCurrentVideo() ? {} : { borderLeft: '3px solid #e74c3c' };

  return (
    <div className={styles.memoryCard} style={cardStyle}>
      <div className={styles.memoryHeader}>
        <span className={styles.memoryUsername}>
          {memory.username || (memory.auteur && `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim()) || 'Utilisateur'}
        </span>
        <span> {getMemoryTypeText()}</span>
        
        {memory.userInteraction?.isAuthor && (
          <button 
            className={styles.deleteButton} 
            onClick={handleDelete}
            title="Supprimer ce souvenir"
          >
            <FontAwesomeIcon icon={faTrash} />
          </button>
        )}
      </div>
      
      <img 
        src={getImageUrl(memory.imageUrl || (memory.auteur && memory.auteur.photo_profil))} 
        alt={`Photo de ${memory.username || 'utilisateur'}`}
        className={styles.memoryUserImage}
        onError={(e) => {
          e.target.src = '/images/default-avatar.jpg';
        }}
      />
      
      <div className={styles.memoryBody}>
        {memory.videoArtist || 'Artiste inconnu'} - {memory.videoTitle || 'Vidéo sans titre'} ({memory.videoYear || '----'})
        
        {/* Avertissement si le souvenir ne correspond pas à la vidéo actuelle */}
        {!isMatchingCurrentVideo() && (
          <div className={styles.wrongVideoWarning}>
            <FontAwesomeIcon icon={faExclamationTriangle} className={styles.warningIcon} />
            <span>Ce souvenir concerne une autre vidéo</span>
          </div>
        )}
      </div>
      
      {memory.content && (
        <div className={styles.memoryText}>
          {memory.content}
        </div>
      )}
      
      <div className={styles.memoryFooter}>
        <div 
          className={`${styles.memoryLikes} ${memory.userInteraction?.liked ? styles.liked : ''}`} 
          onClick={handleLike}
        >
          <FontAwesomeIcon icon={faHeart} className={styles.memoryIcon} />
          <span>{memory.likes || 0}</span>
        </div>
        <div 
          className={styles.memoryComments}
          onClick={() => onToggleReplies && onToggleReplies(memory.id)}
        >
          <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          <span>{memory.nb_commentaires || memory.comments || 0}</span>
        </div>
        <div 
          className={styles.memoryReply}
          onClick={() => setShowReplyForm(!showReplyForm)}
        >
          <FontAwesomeIcon icon={faReply} className={styles.memoryIcon} />
          <span>Reply</span>
        </div>
      </div>
      
      {/* Formulaire de réponse */}
      {showReplyForm && (
        <form className={styles.replyForm} onSubmit={handleSubmitReply}>
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Write a reply..."
            className={styles.replyInput}
            disabled={isSubmitting}
          />
          <button 
            type="submit" 
            className={styles.replyButton}
            disabled={isSubmitting || !replyText.trim()}
          >
            {isSubmitting ? (
              <FontAwesomeIcon icon={faSpinner} spin />
            ) : (
              <FontAwesomeIcon icon={faPaperPlane} />
            )}
          </button>
        </form>
      )}
      
      {/* Section des réponses */}
      {showReplies && replies.length > 0 && (
        <div className={styles.repliesSection}>
          {replies.map(reply => (
            <div key={reply.id || reply._id} className={styles.replyCard}>
              <img 
                src={getImageUrl(reply.auteur?.photo_profil)} 
                alt="User" 
                className={styles.replyUserImage}
                onError={(e) => {
                  e.target.src = '/images/default-avatar.jpg';
                }}
              />
              <div className={styles.replyContent}>
                <div className={styles.replyUsername}>
                  {reply.auteur ? `${reply.auteur.prenom || ''} ${reply.auteur.nom || ''}`.trim() : 'Utilisateur'}
                </div>
                <div className={styles.replyText}>{reply.contenu || reply.content}</div>
                <div className={styles.replyFooter}>
                  <div 
                    className={`${styles.replyLikes} ${reply.userInteraction?.liked ? styles.liked : ''}`}
                    onClick={() => onLike && onLike(reply.id || reply._id)}
                  >
                    <FontAwesomeIcon icon={faHeart} className={styles.replyIcon} />
                    <span>{reply.likes || 0}</span>
                  </div>
                  {reply.userInteraction?.isAuthor && (
                    <div 
                      className={styles.replyDelete}
                      onClick={() => onDeleteMemory && onDeleteMemory(reply.id || reply._id)}
                    >
                      <FontAwesomeIcon icon={faTrash} className={styles.replyIcon} />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MemoryCard;