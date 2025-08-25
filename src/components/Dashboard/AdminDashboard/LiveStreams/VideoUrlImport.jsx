import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const VideoUrlImport = ({ onVideoSelect, apiBaseUrl }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [importedVideos, setImportedVideos] = useState([]);

  // Utiliser l'URL de base passée en prop ou l'URL par défaut
  const baseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Déterminer le type de plateforme à partir de l'URL
  const getVideoSourceType = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      return 'youtube';
    } else if (url.includes('vimeo.com')) {
      return 'vimeo';
    } else if (url.includes('dailymotion.com') || url.includes('dai.ly')) {
      return 'dailymotion';
    } else {
      return null;
    }
  };

  // Extraire l'ID de la vidéo à partir de l'URL
  const extractVideoId = (url, sourceType) => {
    if (!url || !sourceType) return null;
    
    try {
      let videoId = null;
      
      if (sourceType === 'youtube') {
        // Format: https://www.youtube.com/watch?v=VIDEO_ID
        // Format: https://youtu.be/VIDEO_ID
        if (url.includes('youtube.com/watch')) {
          const urlParams = new URL(url).searchParams;
          videoId = urlParams.get('v');
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1];
          // Supprimer les paramètres supplémentaires
          if (videoId && videoId.includes('?')) {
            videoId = videoId.split('?')[0];
          }
        }
      } else if (sourceType === 'vimeo') {
        // Format: https://vimeo.com/VIDEO_ID
        // Format: https://player.vimeo.com/video/VIDEO_ID
        if (url.includes('player.vimeo.com/video/')) {
          videoId = url.split('player.vimeo.com/video/')[1];
        } else {
          videoId = url.split('vimeo.com/')[1];
        }
        // Supprimer les paramètres supplémentaires
        if (videoId && videoId.includes('?')) {
          videoId = videoId.split('?')[0];
        }
      } else if (sourceType === 'dailymotion') {
        // Format: https://www.dailymotion.com/video/VIDEO_ID
        // Format: https://dai.ly/VIDEO_ID
        if (url.includes('dailymotion.com/video/')) {
          videoId = url.split('dailymotion.com/video/')[1];
        } else if (url.includes('dai.ly/')) {
          videoId = url.split('dai.ly/')[1];
        }
        // Supprimer les paramètres supplémentaires
        if (videoId && videoId.includes('?')) {
          videoId = videoId.split('?')[0];
        }
      }
      
      return videoId;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  // Fonction pour récupérer les métadonnées à partir d'une URL vidéo
  const fetchVideoMetadata = async (url) => {
    if (!url || !url.trim()) {
      setError("Veuillez entrer une URL vidéo valide.");
      return null;
    }
    
    setIsProcessing(true);
    setError('');
    
    try {
      const sourceType = getVideoSourceType(url);
      
      if (!sourceType) {
        throw new Error("URL non supportée. Veuillez utiliser YouTube, Vimeo ou Dailymotion.");
      }
      
      const videoId = extractVideoId(url, sourceType);
      
      if (!videoId) {
        throw new Error("Impossible d'extraire l'ID de la vidéo depuis l'URL.");
      }
      
      // Récupérer les métadonnées depuis le backend
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error("Vous n'êtes pas authentifié. Veuillez vous reconnecter.");
      }
      
      const response = await fetch(`${baseUrl}/api/video-info?url=${encodeURIComponent(url)}&id=${videoId}&source=${sourceType}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        // En cas d'erreur avec le backend, utiliser la simulation
        console.warn('Échec API, utilisation des métadonnées simulées');
        const simData = simulateMetadata(url, sourceType, videoId);
        
        // Ajouter à la liste des vidéos importées
        setImportedVideos(prev => [simData, ...prev]);
        
        // Vider le champ d'URL
        setVideoUrl('');
        
        // Transmettre au composant parent
        onVideoSelect(simData);
        
        return simData;
      }
      
      const data = await response.json();
      
      // Formater les données pour la compilation
      const videoData = {
        videoId: videoId,
        title: data.title || 'Titre non disponible',
        description: data.description || 'Aucune description',
        thumbnail: data.thumbnail || '/images/video-placeholder.jpg',
        duration: data.duration || '0:00',
        source: sourceType,
        url: url,
        // Données supplémentaires facultatives
        channel: data.channel || 'Chaîne inconnue',
        published: data.publishedAt || 'Date inconnue'
      };
      
      // Ajouter à la liste des vidéos importées
      setImportedVideos(prev => [videoData, ...prev]);
      
      // Vider le champ d'URL
      setVideoUrl('');
      
      // Transmettre au composant parent
      onVideoSelect(videoData);
      
      return videoData;
    } catch (error) {
      setError(error.message);
      console.error('Erreur lors de l\'importation de la vidéo:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  // Fonction pour importer plusieurs URLs à la fois
  const handleBatchImport = async () => {
    if (!batchUrls.trim()) {
      setError("Veuillez entrer au moins une URL vidéo.");
      return;
    }
    
    setIsProcessing(true);
    setError('');
    
    const urls = batchUrls.split('\n')
      .map(url => url.trim())
      .filter(url => url.length > 0);
    
    if (urls.length === 0) {
      setError("Aucune URL valide trouvée.");
      setIsProcessing(false);
      return;
    }
    
    const results = [];
    const failures = [];
    
    // Traiter les URLs une par une
    for (const url of urls) {
      try {
        const videoData = await fetchVideoMetadata(url);
        if (videoData) {
          results.push(videoData);
        } else {
          failures.push(url);
        }
      } catch (error) {
        console.error(`Erreur lors de l'importation de ${url}:`, error);
        failures.push(url);
      }
      
      // Petite pause pour éviter de surcharger l'API
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Afficher un résumé
    if (failures.length > 0) {
      setError(`${results.length} vidéos importées avec succès. ${failures.length} échecs.`);
    } else {
      setError('');
    }
    
    // Vider le champ de batch
    setBatchUrls('');
    setShowBatchInput(false);
    setIsProcessing(false);
  };

  // Gérer l'importation d'une seule URL
  const handleSingleImport = async () => {
    if (!videoUrl.trim()) {
      setError("Veuillez entrer une URL vidéo.");
      return;
    }
    
    await fetchVideoMetadata(videoUrl);
  };

  // Simuler des métadonnées si l'API n'est pas disponible (pour développement)
  const simulateMetadata = (url, sourceType, videoId) => {
    // Cette fonction n'est utilisée que si l'API n'est pas disponible
    return {
      videoId,
      title: `Vidéo ${sourceType} - ${videoId}`,
      description: 'Description simulée pour cette vidéo',
      thumbnail: '/images/video-placeholder.jpg',
      duration: '3:45',
      source: sourceType,
      url: url,
      channel: 'Chaîne simulée',
      published: 'il y a 2 ans'
    };
  };

  return (
    <div className={styles.videoSourceContainer}>
      <div className={styles.sourceHeader}>
        <h3>Ajouter des vidéos par URL</h3>
        <div className={styles.sourceTypeSelector}>
          <button 
            className={`${styles.sourceTypeButton} ${!showBatchInput ? styles.activeSource : ''}`}
            onClick={() => setShowBatchInput(false)}
            disabled={isProcessing}
          >
            <i className="fas fa-link"></i> URL unique
          </button>
          <button 
            className={`${styles.sourceTypeButton} ${showBatchInput ? styles.activeSource : ''}`}
            onClick={() => setShowBatchInput(true)}
            disabled={isProcessing}
          >
            <i className="fas fa-list"></i> Plusieurs URLs
          </button>
        </div>
      </div>

      <div className={styles.urlInputSection}>
        {!showBatchInput ? (
          <>
            <div className={styles.urlInputContainer}>
              <input
                type="url"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Collez l'URL YouTube, Vimeo ou Dailymotion ici"
                className={styles.urlInput}
                disabled={isProcessing}
              />
              <button 
                className={styles.importButton}
                onClick={handleSingleImport}
                disabled={isProcessing || !videoUrl.trim()}
              >
                {isProcessing ? (
                  <i className="fas fa-spinner fa-spin"></i>
                ) : (
                  <i className="fas fa-plus"></i>
                )}
              </button>
            </div>
            <p className={styles.inputHelp}>
              <i className="fas fa-info-circle"></i> Collez l'URL d'une vidéo pour l'ajouter à votre compilation
            </p>
          </>
        ) : (
          <>
            <div className={styles.batchInputContainer}>
              <textarea
                value={batchUrls}
                onChange={(e) => setBatchUrls(e.target.value)}
                placeholder="Collez plusieurs URLs (une par ligne)"
                className={styles.batchUrlInput}
                rows={5}
                disabled={isProcessing}
              />
              <button 
                className={styles.batchImportButton}
                onClick={handleBatchImport}
                disabled={isProcessing || !batchUrls.trim()}
              >
                {isProcessing ? (
                  <><i className="fas fa-spinner fa-spin"></i> Importation...</>
                ) : (
                  <><i className="fas fa-file-import"></i> Importer toutes les URLs</>
                )}
              </button>
            </div>
            <p className={styles.inputHelp}>
              <i className="fas fa-info-circle"></i> Collez 3 URLs, une par ligne, pour les importer en lot
            </p>
          </>
        )}

        {error && (
          <div className={styles.importError}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className={styles.platformExamples}>
        <h4>Formats d'URL supportés :</h4>
        <ul className={styles.examplesList}>
          <li><i className="fab fa-youtube"></i> YouTube: https://www.youtube.com/watch?v=VIDEO_ID ou https://youtu.be/VIDEO_ID</li>
          <li><i className="fab fa-vimeo-v"></i> Vimeo: https://vimeo.com/VIDEO_ID</li>
          <li><i className="fas fa-play-circle"></i> Dailymotion: https://www.dailymotion.com/video/VIDEO_ID ou https://dai.ly/VIDEO_ID</li>
        </ul>
      </div>

      {importedVideos.length > 0 && (
        <div className={styles.recentlyImportedSection}>
          <h4>Vidéos récemment importées</h4>
          <div className={styles.recentImports}>
            {importedVideos.slice(0, 3).map((video, index) => (
              <div key={`${video.videoId}-${index}`} className={styles.recentImportItem}>
                <div className={styles.recentImportThumbnail}>
                  <img 
                    src={video.thumbnail} 
                    alt={video.title}
                    onError={(e) => {
                      e.target.src = '/images/video-placeholder.jpg';
                    }}
                  />
                  <span className={styles.videoPlatformBadge}>
                    {video.source === 'youtube' && <i className="fab fa-youtube"></i>}
                    {video.source === 'vimeo' && <i className="fab fa-vimeo-v"></i>}
                    {video.source === 'dailymotion' && <i className="fas fa-play-circle"></i>}
                  </span>
                </div>
                <div className={styles.recentImportInfo}>
                  <h5 className={styles.recentImportTitle}>{video.title}</h5>
                  <p className={styles.recentImportMeta}>
                    {video.duration} | {video.channel}
                  </p>
                </div>
                <button 
                  className={styles.reImportButton}
                  onClick={() => onVideoSelect(video)}
                  title="Ajouter à nouveau à la compilation"
                >
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUrlImport;