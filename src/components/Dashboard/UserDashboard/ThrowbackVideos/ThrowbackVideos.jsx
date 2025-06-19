import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import api from '../../../../utils/api';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment,
  faSpinner,
  faExclamationTriangle,
  faEye
} from '@fortawesome/free-solid-svg-icons';

// Définition des données mockées pour le fallback
const mockMemories = [
  {
    id: 'mock1',
    username: 'User Demo',
    videoTitle: 'Sample Video',
    videoArtist: 'Artist',
    videoYear: '2000',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This is a sample memory',
    likes: 5,
    comments: 2
  },
  {
    id: 'mock2',
    username: 'Another User',
    videoTitle: 'Another Video',
    videoArtist: 'Another Artist',
    videoYear: '1990',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This is another sample memory',
    likes: 10,
    comments: 3
  }
];

const ThrowbackVideos = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);

  useEffect(() => {
    // Récupérer les vidéos
    fetchVideos();
    
    // Récupérer les souvenirs récents
    fetchRecentMemories();
  }, []);

  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      // Utiliser le même client HTTP que pour fetchVideos pour la cohérence
      const response = await axios.get('/api/public/memories/recent');
      
      if (response.data && response.data.success) {
        const memoriesData = response.data.data || [];
        // Formater les données pour l'affichage
        const formattedMemories = memoriesData.map(memory => ({
          id: memory._id || 'unknown',
          username: memory.auteur ? `${memory.auteur.prenom || ''} ${memory.auteur.nom || ''}`.trim() || 'Utilisateur' : 'Utilisateur',
          videoTitle: memory.video?.titre || 'Vidéo sans titre',
          videoArtist: memory.video?.artiste || 'Artiste inconnu',
          videoYear: memory.video?.annee || '----',
          imageUrl: memory.auteur?.photo_profil || '/images/default-avatar.jpg',
          content: memory.contenu || 'Pas de contenu',
          likes: memory.likes || 0,
          comments: memory.nb_commentaires || 0
        }));
        
        setMemories(formattedMemories.length > 0 ? formattedMemories : mockMemories);
        setMemoriesError(null);
      } else {
        console.warn('Réponse API souvenirs non valide:', response);
        // Utiliser les données mockées en fallback
        setMemories(mockMemories);
        setMemoriesError("Format de réponse invalide");
      }
    } catch (err) {
      console.error('Erreur lors du chargement des souvenirs:', err);
      // Utiliser les données mockées en fallback
      setMemories(mockMemories);
      setMemoriesError(err.message || "Erreur lors du chargement des souvenirs");
    } finally {
      setMemoriesLoading(false);
    }
  };

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
          setVideos([]);
        }
      } else {
        console.error('Erreur de réponse API:', response);
        setError('Erreur lors du chargement des vidéos: ' + (response.data?.message || 'Réponse invalide'));
        setVideos([]);
      }
    } catch (err) {
      console.error('Exception lors du chargement des vidéos:', err);
      setError(`Erreur lors du chargement des vidéos: ${err.message || 'Erreur inconnue'}`);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  // Composant de carte mémoire avec gestion des valeurs manquantes
  const MemoryCard = ({ memory }) => (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span style={{color:'#d32f2f',fontWeight:600}}>{memory.username || 'Utilisateur'}</span> posted a memory on the music video :
      </div>
      <img 
        src={memory.imageUrl || '/images/default-avatar.jpg'} 
        alt={memory.videoTitle || 'Vidéo'} 
        className={styles.memoryImage}
        onError={(e) => {
          e.target.src = '/images/default-avatar.jpg';
        }}
      />
      <div className={styles.memoryBody}>
        {memory.videoArtist || 'Artiste'} - {memory.videoTitle || 'Titre'} ({memory.videoYear || '----'}). Please, like and comment to show some love! <br/>
        <span style={{color:'#d32f2f'}}>{memory.content || 'Aucun contenu'}</span>
      </div>
      <div className={styles.memoryFooter}>
        <span>
          <FontAwesomeIcon icon={faHeart} style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
          {memory.likes || 0}
        </span>
        <span>
          <FontAwesomeIcon icon={faComment} style={{ width: 22, height: 22, verticalAlign: 'middle', marginRight: 6 }} />
          {memory.comments || 0}
        </span>
      </div>
    </div>
  );

  // Composant de carte vidéo avec amélioration de la fonction getYouTubeThumbnail
  const VideoCard = ({ video }) => {
    // Récupérer l'URL de la vignette YouTube avec gestion améliorée des erreurs
    const getYouTubeThumbnail = (url) => {
      if (!url) return '/images/video-placeholder.jpg';
      
      // Si l'URL est déjà une image locale
      if (url.startsWith('/') || url.startsWith('./')) {
        return url;
      }
      
      // Si c'est une URL YouTube, extraire l'ID de la vidéo
      let videoId = '';
      
      try {
        // Vérifier si l'URL est valide
        const urlString = url.toString();
        
        if (urlString.includes('youtube.com/watch?v=')) {
          const urlObj = new URL(urlString);
          videoId = urlObj.searchParams.get('v');
        } else if (urlString.includes('youtu.be/')) {
          const parts = urlString.split('youtu.be/');
          if (parts.length > 1) {
            videoId = parts[1];
          }
        } else if (urlString.includes('youtube.com/embed/')) {
          const parts = urlString.split('youtube.com/embed/');
          if (parts.length > 1) {
            videoId = parts[1];
          }
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
      
      // Fallback sur l'image par défaut
      return '/images/video-placeholder.jpg';
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
            e.target.src = '/images/video-placeholder.jpg';
          }}
        />
        <div className={styles.videoTitle}>
          <span style={{ fontWeight: 600 }}>{video.artiste || 'Artiste'}</span> : {video.titre || 'Titre'} ({video.annee || '----'})
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
                  <VideoCard key={video._id || `video-${Math.random()}`} video={video} />
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
              {memoriesLoading ? (
                <div className={styles.loadingContainer}>
                  <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                  <p>Loading memories...</p>
                </div>
              ) : memoriesError ? (
                <div className={styles.errorContainer}>
                  <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
                  <p>Error loading memories</p>
                </div>
              ) : (
                <>
                  {memories.map((memory) => (
                    <MemoryCard key={memory.id || `memory-${Math.random()}`} memory={memory} />
                  ))}
                  {/* Duplication pour effet infini */}
                  {memories.slice(0, 2).map((memory) => (
                    <MemoryCard key={`duplicate-${memory.id || Math.random()}`} memory={memory} />
                  ))}
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ThrowbackVideos;