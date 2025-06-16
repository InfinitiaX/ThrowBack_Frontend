import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHeart, 
  faComment, 
  faEye, 
  faShare,
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [memoryText, setMemoryText] = useState('');
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(165);
  const [likeCount, setLikeCount] = useState(94);
  const [videosLoading, setVideosLoading] = useState(false);

  useEffect(() => {
    // Charger toutes les vidéos disponibles
    fetchAllVideos();
    // Charger les souvenirs mockés
    loadMockMemories();
  }, []);

  // Charger la vidéo spécifique quand l'ID change
  useEffect(() => {
    if (id) {
      fetchVideoById(id);
      window.scrollTo(0, 0);
    }
  }, [id]);

  // Récupérer toutes les vidéos disponibles
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      const response = await axios.get('/api/videos?type=music');
      
      if (response.status === 200) {
        const videosData = response.data.data || response.data;
        
        if (Array.isArray(videosData) && videosData.length > 0) {
          setAllVideos(videosData);
        }
      }
    } catch (err) {
      console.error('Error fetching all videos:', err);
    } finally {
      setVideosLoading(false);
    }
  };

  // Récupérer une vidéo spécifique par son ID
  const fetchVideoById = async (videoId) => {
    try {
      setLoading(true);
      
      // Utilisation de la route API correcte
      const response = await axios.get(`/api/videos/${videoId}`);
      
      if (response.status === 200) {
        // Vérifier si la réponse contient les données dans data ou directement
        const videoData = response.data.data || response.data;
        
        if (videoData) {
          setVideo(videoData);
          
          // Vérifier si l'utilisateur a aimé la vidéo
          setUserLiked(videoData.userInteraction?.liked || false);
          
          // Définir les compteurs
          if (videoData.vues) setViewCount(videoData.vues);
          if (videoData.likes) setLikeCount(videoData.likes);
          
          setError(null);
        } else {
          console.error('Invalid video data received');
          setError('Could not load video details');
        }
      } else {
        console.error('Error response from API:', response);
        setError('Error loading video');
      }
    } catch (err) {
      console.error('Exception lors du chargement des détails de la vidéo:', err);
      setError('Error loading video details');
    } finally {
      setLoading(false);
    }
  };

  const loadMockMemories = () => {
    // Souvenirs mockés pour démonstration
    const mockMemories = [
      {
        id: 1,
        username: 'James Taylor',
        type: 'shared',
        videoTitle: "You've Got a Friend",
        videoArtist: 'Carole King',
        videoYear: '1971',
        imageUrl: '/images/profile1.jpg',
        content: "* This song always brings a smile to my face. 😊 It reminds me of sunny afternoons with my dad, singing along while driving with the windows down.*",
        likes: 20,
        comments: 8
      },
      {
        id: 2,
        username: 'Earth, Wind & Fire',
        type: 'shared',
        videoTitle: "September",
        videoArtist: 'Earth, Wind & Fire',
        videoYear: '1978',
        imageUrl: '/images/profile2.jpg',
        content: "*This song instantly lifts my mood!* 😊\n\nIt reminds me of family road trips, singing at the top of our lungs with no cares in the world. 🚗✨",
        likes: 43,
        comments: 11
      }
    ];
    setMemories(mockMemories);
  };

  const handleLikeVideo = () => {
    if (userLiked) {
      setLikeCount(prev => Math.max(0, prev - 1));
    } else {
      setLikeCount(prev => prev + 1);
    }
    setUserLiked(!userLiked);
  };

  const handleShareVideo = () => {
    alert('Share feature coming soon!');
  };

  const handleAddMemory = (e) => {
    e.preventDefault();
    
    if (!memoryText.trim()) {
      alert('Please enter a memory to share');
      return;
    }
    
    // Simuler l'ajout d'un souvenir en l'ajoutant localement
    const newMemory = {
      id: Date.now(),
      username: 'Current User',
      type: 'posted',
      videoTitle: video?.titre,
      videoArtist: video?.artiste,
      videoYear: video?.annee,
      content: memoryText,
      likes: 0,
      comments: 0
    };
    
    setMemories([newMemory, ...memories]);
    setMemoryText('');
    
    // Simuler un appel API
    alert('Memory successfully added!');
  };

  // Récupérer l'URL de la vignette YouTube
  const getYouTubeThumbnail = (url) => {
    if (!url) return '/images/video-placeholder.jpg';
    
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

  // Obtenir l'URL d'intégration YouTube
  const getEmbedUrl = (url) => {
    if (!url) return null;
    
    if (url.includes('youtube.com/embed/')) {
      return url;
    }
    
    let videoId = '';
    
    if (url.includes('youtube.com/watch?v=')) {
      try {
        const urlObj = new URL(url);
        videoId = urlObj.searchParams.get('v');
      } catch (e) {
        return url;
      }
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1];
    } else if (url.includes('youtube.com/embed/')) {
      videoId = url.split('youtube.com/embed/')[1];
    } else {
      return url;
    }
    
    if (videoId && videoId.includes('&')) {
      videoId = videoId.split('&')[0];
    }
    
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
    
    return url;
  };

  // Composant pour les vidéos recommandées
  const RecommendedVideo = ({ video: recommendedVideo }) => {
    // Détermine si cette vidéo est celle actuellement affichée
    const isCurrentVideo = video && recommendedVideo._id === video._id;
    
    const handleClick = (e) => {
      e.preventDefault();
      // Naviguer vers la nouvelle vidéo (change l'URL)
      navigate(`/dashboard/videos/${recommendedVideo._id}`);
    };
    
    return (
      <a 
        href={`/dashboard/videos/${recommendedVideo._id}`}
        className={`${styles.recommendedVideo} ${isCurrentVideo ? styles.currentVideo : ''}`}
        onClick={handleClick}
      >
        <img 
          src={getYouTubeThumbnail(recommendedVideo.youtubeUrl)} 
          alt={`${recommendedVideo.artiste} - ${recommendedVideo.titre}`} 
          className={styles.recommendedImg}
          onError={(e) => {
            e.target.src = '/images/video-placeholder.jpg';
          }}
        />
        <div className={styles.recommendedInfo}>
          <div className={styles.recommendedArtist}>{recommendedVideo.artiste}</div>
          <div className={styles.recommendedTitle}>: {recommendedVideo.titre} ({recommendedVideo.annee})</div>
        </div>
        {isCurrentVideo && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
      </a>
    );
  };

  // Composant pour les souvenirs partagés
  const MemoryCard = ({ memory }) => (
    <div className={styles.memoryCard}>
      <div className={styles.memoryHeader}>
        <span className={styles.memoryUsername}>{memory.username}</span> 
        {memory.type === 'posted' ? (
          <span> posted a memory on the music video:</span>
        ) : (
          <span> just shared a throwback to the iconic music video:</span>
        )}
      </div>
      <div className={styles.memoryContent}>
        <div className={styles.memoryVideoInfo}>
          🎵 {memory.videoArtist} - {memory.videoTitle} ({memory.videoYear}). Please, like and comment! 👍
        </div>
        {memory.imageUrl && (
          <img 
            src={memory.imageUrl} 
            alt={memory.username} 
            className={styles.memoryUserImage} 
          />
        )}
        <div className={styles.memoryText}>{memory.content}</div>
      </div>
      <div className={styles.memoryFooter}>
        <div className={styles.memoryLikes}>
          <FontAwesomeIcon icon={faHeart} className={styles.memoryIcon} />
          <span>{memory.likes}</span>
        </div>
        <div className={styles.memoryComments}>
          <FontAwesomeIcon icon={faComment} className={styles.memoryIcon} />
          <span>{memory.comments}</span>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
        <p>Loading video...</p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <p>Video not found</p>
        <Link to="/dashboard/videos" className={styles.backButton}>
          Back to videos
        </Link>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(video?.youtubeUrl);
  const isYoutubeEmbed = embedUrl && embedUrl.includes('youtube.com/embed/');

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        <main className={styles.mainContent}>
          {/* Video Player */}
          <div className={styles.videoPlayerContainer}>
            {isYoutubeEmbed ? (
              <div className={styles.videoWrapper}>
                <iframe
                  src={embedUrl}
                  title={`${video.artiste} - ${video.titre}`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
            ) : (
              <div className={styles.videoThumbnail}>
                <img 
                  src={getYouTubeThumbnail(video.youtubeUrl)} 
                  alt={`${video.artiste} - ${video.titre}`} 
                  className={styles.thumbnailImg}
                />
                <div className={styles.playButton}>▶</div>
              </div>
            )}
          </div>

          {/* Video Title and Stats */}
          <div className={styles.videoInfoBar}>
            <h1 className={styles.videoTitle}>
              {video.artiste} : {video.titre} ({video.annee})
            </h1>
            <div className={styles.videoStats}>
              <div className={styles.statItem}>
                <FontAwesomeIcon icon={faEye} />
                <span>{viewCount}</span>
              </div>
              <div 
                className={`${styles.statItem} ${userLiked ? styles.liked : ''}`}
                onClick={handleLikeVideo}
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>{likeCount}</span>
              </div>
              <div className={styles.statItem} onClick={handleShareVideo}>
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </div>
            </div>
          </div>

          {/* Memory Input */}
          <div className={styles.memoryInputContainer}>
            <input 
              type="text" 
              className={styles.memoryInput}
              placeholder="Share A Memory......"
              value={memoryText}
              onChange={(e) => setMemoryText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddMemory(e);
                }
              }}
            />
            <button 
              className={styles.commentButton}
              onClick={handleAddMemory}
            >
              <FontAwesomeIcon icon={faComment} />
            </button>
          </div>

          {/* Recommended Videos */}
          <div className={styles.recommendedVideosSection}>
            <h3 className={styles.recommendedSectionTitle}>All Music Videos</h3>
            <div className={styles.recommendedVideosGrid}>
              {videosLoading ? (
                <div className={styles.recommendedLoading}>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  <span>Loading videos...</span>
                </div>
              ) : allVideos.length > 0 ? (
                allVideos.map(videoItem => (
                  <RecommendedVideo key={videoItem._id} video={videoItem} />
                ))
              ) : (
                <div className={styles.emptyRecommendations}>
                  <p>We're adding new videos soon!</p>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Memories Sidebar */}
        <aside className={styles.rightCards}>
          {memories.map(memory => (
            <MemoryCard key={memory.id} memory={memory} />
          ))}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;