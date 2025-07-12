import React, { useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

const VideoPlayer = React.forwardRef(({ 
  src, 
  poster, 
  autoPlay = false,
  controls = true,
  muted = false,
  loop = false,
  onError,
  onPlay,
  onPause,
  onEnded
}, ref) => {
  const internalRef = useRef(null);
  const combinedRef = ref || internalRef;
  
  // Détecter si c'est une URL YouTube
  const isYouTubeEmbed = src && (
    src.includes('youtube.com/embed') || 
    src.includes('youtu.be') ||
    src.includes('youtube.com/watch')
  );
  
  // Détecter si c'est une URL Vimeo
  const isVimeoEmbed = src && src.includes('vimeo.com');
  
  // Traiter l'URL YouTube si nécessaire
  const getProcessedYouTubeUrl = () => {
    let videoUrl = src;
    
    // Convertir youtu.be URL
    if (src.includes('youtu.be/')) {
      const videoId = src.split('youtu.be/')[1].split('?')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Convertir watch URL
    if (src.includes('youtube.com/watch?v=')) {
      const videoId = src.split('watch?v=')[1].split('&')[0];
      videoUrl = `https://www.youtube.com/embed/${videoId}`;
    }
    
    // Ajouter les paramètres pour une meilleure apparence
    const params = [];
    if (autoPlay) params.push('autoplay=1');
    if (muted) params.push('mute=1');
    if (loop) params.push('loop=1');
    
    // Paramètres pour améliorer l'affichage YouTube
    params.push('rel=0'); 
    params.push('showinfo=0'); 
    params.push('modestbranding=1'); 
    params.push('iv_load_policy=3'); 
    params.push('fs=1'); 
    params.push('enablejsapi=1');
    params.push('origin=' + window.location.origin); 
    
    // Assembler l'URL finale
    if (videoUrl.includes('?')) {
      videoUrl += '&' + params.join('&');
    } else {
      videoUrl += '?' + params.join('&');
    }
    
    return videoUrl;
  };
  
  // Traiter l'URL Vimeo si nécessaire
  const getProcessedVimeoUrl = () => {
    let videoUrl = src;
    
    // Convertir l'URL standard Vimeo en URL d'intégration
    if (src.includes('vimeo.com/') && !src.includes('player.vimeo.com/')) {
      const videoId = src.split('vimeo.com/')[1].split('?')[0];
      videoUrl = `https://player.vimeo.com/video/${videoId}`;
    }
    
    // Paramètres Vimeo
    const params = [];
    if (autoPlay) params.push('autoplay=1');
    if (muted) params.push('muted=1');
    if (loop) params.push('loop=1');
    params.push('transparent=0'); 
    params.push('dnt=1'); 
    params.push('playsinline=1'); 
    
    // Assembler l'URL
    if (videoUrl.includes('?')) {
      videoUrl += '&' + params.join('&');
    } else {
      videoUrl += '?' + params.join('&');
    }
    
    return videoUrl;
  };
  
  // Effets pour gérer les erreurs
  useEffect(() => {
    const videoElement = combinedRef.current;
    
    if (videoElement && !isYouTubeEmbed && !isVimeoEmbed) {
      const handleError = (error) => {
        console.error('Video playback error:', error);
        if (onError) onError(error);
      };
      
      videoElement.addEventListener('error', handleError);
      
      return () => {
        videoElement.removeEventListener('error', handleError);
      };
    }
  }, [src, isYouTubeEmbed, isVimeoEmbed, onError]);
  
  if (isYouTubeEmbed) {
    return (
      <div className={styles.videoContainer}>
        <iframe 
          ref={combinedRef}
          src={getProcessedYouTubeUrl()}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          title="YouTube video player"
          className={styles.embedFrame}
          loading="lazy"
          onError={onError}
        ></iframe>
      </div>
    );
  }
  
  if (isVimeoEmbed) {
    return (
      <div className={styles.videoContainer}>
        <iframe 
          ref={combinedRef}
          src={getProcessedVimeoUrl()}
          frameBorder="0"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Vimeo video player"
          className={styles.embedFrame}
          loading="lazy"
          onError={onError}
        ></iframe>
      </div>
    );
  }
  
  // Vidéo standard pour les autres sources
  return (
    <div className={styles.videoContainer}>
      <video 
        ref={combinedRef}
        controls={controls}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        className={styles.videoPlayer}
        onError={onError}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
        playsInline
      >
        <source src={src} type="video/mp4" />
        Your browser does not support video playback.
      </video>
    </div>
  );
});

// Ajouter un displayName pour éviter les avertissements React
VideoPlayer.displayName = 'VideoPlayer';

export default VideoPlayer;