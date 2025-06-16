import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment,
  faSpinner,
  faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons';

const ThrowbackVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);

  // Mock memories pour démonstration
  const mockMemories = [
    {
      id: 1,
      username: 'Alice Perry',
      videoTitle: 'Tears In Heaven',
      videoArtist: 'Eric Clapton',
      videoYear: '1992',
      imageUrl: '/images/image2.png',
      content: '* This song always reminds me of my late father. He was everything for me and I still miss him.😢',
      likes: 43,
      comments: 11
    },
    {
      id: 2,
      username: 'James Taylor',
      videoTitle: "You've Got a Friend",
      videoArtist: 'Carole King',
      videoYear: '1971',
      imageUrl: '/images/image.png',
      content: '* This song always brings a smile to my face. 😊 It reminds me of sunny afternoons with my dad, singing along while driving with the windows down.*',
      likes: 20,
      comments: 8
    }
  ];

  useEffect(() => {
    // Charger les souvenirs mockés
    setMemories(mockMemories);
    
    // Récupérer les vidéos depuis l'API
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      console.log('Tentative de récupération des vidéos...');
      
      // Utilisation de la route API correcte avec le type 'music'
      const response = await axios.get('/api/videos?type=music');
      console.log('Réponse API reçue:', response);
      
      if (response.status === 200) {
        console.log('Vidéos récupérées avec succès:', response.data);
        
        // Vérifier si la réponse contient les vidéos dans data ou directement
        const videosData = response.data.data || response.data;
        
        if (Array.isArray(videosData) && videosData.length > 0) {
          setVideos(videosData);
          setError(null);
        } else {
          console.warn('Tableau de vidéos vide ou non valide:', videosData);
          setError('Aucune vidéo disponible pour le moment.');
        }
      } else {
        console.error('Erreur de réponse API:', response);
        setError('Erreur lors du chargement des vidéos: ' + (response.data?.message || 'Réponse invalide'));
      }
    } catch (err) {
      console.error('Exception lors du chargement des vidéos:', err);
      setError(`Erreur lors du chargement des vidéos: ${err.message || 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Composant de carte mémoire
  const MemoryCard = ({ memory }) => (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span style={{color:'#d32f2f',fontWeight:600}}>{memory.username}</span> posted a memory on the music video :
      </div>
      <img src={memory.imageUrl} alt={memory.videoTitle} className={styles.memoryImage} />
      <div className={styles.memoryBody}>
        {memory.videoArtist} - {memory.videoTitle} ({memory.videoYear}). Please, like and comment to show some love! <br/>
        <span style={{color:'#d32f2f'}}>{memory.content}</span>
      </div>
      <div className={styles.memoryFooter}>
        <span>
          <FontAwesomeIcon icon={faHeart} style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
          {memory.likes}
        </span>
        <span>
          <FontAwesomeIcon icon={faComment} style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
          {memory.comments}
        </span>
      </div>
    </div>
  );

  // Composant de carte vidéo
  const VideoCard = ({ video }) => {
    // Récupérer l'URL de la vignette YouTube si c'est une URL YouTube
    const getYouTubeThumbnail = (url) => {
      if (!url) return null;
      
      // Si l'URL est déjà une image locale
      if (url.startsWith('/') || url.startsWith('./')) {
        return url;
      }
      
      // Si c'est une URL YouTube, extraire l'ID de la vidéo
      let videoId = '';
      
      try {
        if (url.includes('youtube.com/watch?v=')) {
          const urlObj = new URL(url);
          videoId = urlObj.searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1];
        } else if (url.includes('youtube.com/embed/')) {
          videoId = url.split('youtube.com/embed/')[1];
        }
        
        if (videoId) {
          // Nettoyer l'ID
          if (videoId.includes('&')) {
            videoId = videoId.split('&')[0];
          }
          
          // Retourner l'URL de la vignette haute qualité
          return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        }
      } catch (error) {
        console.error('Erreur de parsing URL YouTube:', error);
      }
      
      // Fallback sur l'URL originale
      return url;
    };
    
    // Obtenir l'URL de la vignette
    const thumbnailUrl = getYouTubeThumbnail(video.youtubeUrl);
    
    return (
      <Link to={`/dashboard/videos/${video._id}`} className={styles.videoCard}>
        <img 
          src={thumbnailUrl} 
          alt={`${video.artiste || 'Artiste'} - ${video.titre || 'Titre'}`} 
          className={styles.videoImg} 
          onError={(e) => {
            // Image de secours en cas d'erreur
            e.target.src = '/images/video-placeholder.jpg';
          }}
        />
        <div className={styles.videoTitle}>
          {video.artiste || 'Artiste'} : {video.titre || 'Titre'} ({video.annee || '----'})
        </div>
      </Link>
    );
  };

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          <h2 className={styles.sectionTitle}>Today's Pick</h2>
          
          {loading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading videos...</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
              <p>{error}</p>
            </div>
          ) : (
            <div className={styles.videosGrid}>
              {videos && videos.length > 0 ? (
                videos.map((video) => (
                  <VideoCard key={video._id} video={video} />
                ))
              ) : (
                <div className={styles.noVideosMessage}>
                  <p>No videos available at the moment.</p>
                </div>
              )}
            </div>
          )}
        </main>
        
        <aside className={styles.rightCards}>
          <div className={styles.verticalTicker}>
            <div className={styles.tickerContent}>
              {memories.map((memory) => (
                <MemoryCard key={memory.id} memory={memory} />
              ))}
              {/* Duplication pour effet infini */}
              {memories.slice(0, 2).map((memory) => (
                <MemoryCard key={`duplicate-${memory.id}`} memory={memory} />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ThrowbackVideos;