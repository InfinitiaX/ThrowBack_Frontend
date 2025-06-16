// MemoryCard.jsx - Carte pour afficher un souvenir partagé
import React from 'react';
import styles from './ThrowbackVideos.module.css';

const MemoryCard = ({ memory, likeIcon, commentIcon }) => {
  return (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span style={{ color: '#d32f2f', fontWeight: 600 }}>
          {memory.username}
        </span>
        {memory.type === 'posted' ? (
          <span> posted a memory on the music video :</span>
        ) : (
          <span> just shared a throwback to the iconic music video :</span>
        )}
      </div>
      
      {memory.videoImage && (
        <img 
          src={memory.videoImage} 
          alt={`${memory.videoArtist} - ${memory.videoTitle}`}
          className={styles.memoryImage} 
        />
      )}
      
      <div className={styles.memoryBody}>
        {memory.videoArtist} - {memory.videoTitle} ({memory.videoYear}). 
        Please, like and comment{memory.type === 'posted' ? ' to show some love' : ''}! <br />
        <span style={{ color: '#d32f2f' }}>{memory.content}</span>
      </div>
      
      <div className={styles.memoryFooter}>
        <span>
          <img 
            src={likeIcon} 
            alt="like" 
            style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} 
          />
          {memory.likes}
        </span>
        <span>
          <img 
            src={commentIcon} 
            alt="comment" 
            style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} 
          />
          {memory.comments}
        </span>
      </div>
    </div>
  );
};

export default MemoryCard;