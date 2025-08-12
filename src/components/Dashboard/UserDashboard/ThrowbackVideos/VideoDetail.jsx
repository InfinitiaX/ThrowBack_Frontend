import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api, { videoAPI } from '../../../../utils/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFacebook, faTwitter, faWhatsapp } from '@fortawesome/free-brands-svg-icons';
import { 
  faHeart, 
  faComment, 
  faEye, 
  faShare,
  faSpinner,
  faExclamationTriangle,
  faCopy,
  faList,
  faFilter
} from '@fortawesome/free-solid-svg-icons';
import styles from './VideoDetail.module.css';
import PlaylistModal from './PlaylistModal';
import MemoryCard from './MemoryCard';

const VideoDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // États principaux
  const [video, setVideo] = useState(null);
  const [allVideos, setAllVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [memories, setMemories] = useState([]);
  const [allMemories, setAllMemories] = useState([]);
  const [memoryText, setMemoryText] = useState('');
  const [showAllMemories, setShowAllMemories] = useState(false);
  
  // États d'interaction
  const [userLiked, setUserLiked] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiking, setIsLiking] = useState(false);
  const [isAddingMemory, setIsAddingMemory] = useState(false);
  
  // États d'interface
  const [videosLoading, setVideosLoading] = useState(false);
  const [memoriesLoading, setMemoriesLoading] = useState(false);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  
  // Références pour le système de réessai
  const retryCount = useRef(0);
  const maxRetries = 3;

  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Charger toutes les vidéos au montage du composant
  useEffect(() => {
    fetchAllVideos();
    fetchAllMemories();
  }, []);

  // Charger la vidéo spécifique quand l'ID change
  useEffect(() => {
    if (id) {
      fetchVideoById(id);
      fetchVideoMemories(id);
      window.scrollTo(0, 0);
    }
  }, [id]);

  // Filtrer les souvenirs quand la vidéo ou les souvenirs changent
  useEffect(() => {
    if (id && allMemories.length > 0) {
      filterMemoriesForCurrentVideo();
    }
  }, [id, allMemories]);

  // Récupérer toutes les vidéos disponibles
  const fetchAllVideos = async () => {
    try {
      setVideosLoading(true);
      console.log('🎬 Chargement de toutes les vidéos...');
      
      const videosData = await videoAPI.getAllVideos({
        type: 'music',
        limit: '50'
      });
      
      if (Array.isArray(videosData) && videosData.length > 0) {
        setAllVideos(videosData);
        console.log(`✅ ${videosData.length} vidéos chargées`);
      } else {
        console.warn('⚠️ Aucune vidéo trouvée');
        setAllVideos([]);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des vidéos:', err);
      setAllVideos([]);
    } finally {
      setVideosLoading(false);
    }
  };

  // Récupérer tous les souvenirs de la plateforme
  const fetchAllMemories = async () => {
    try {
      setMemoriesLoading(true);
      console.log('🔍 Chargement de tous les souvenirs...');
      
      let memoriesData = [];
      
      // Essayer plusieurs routes pour récupérer tous les souvenirs
      try {
        // Route publique
        const response = await api.get('/api/public/memories');
        if (response.data && Array.isArray(response.data.data)) {
          memoriesData = response.data.data;
          console.log(`✅ ${memoriesData.length} souvenirs récupérés via API publique`);
        }
      } catch (err) {
        console.warn('⚠️ Échec de la route publique, tentative avec route classique');
        
        try {
          // Route classique
          const fallbackResponse = await api.get('/api/memories');
          if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
            memoriesData = fallbackResponse.data.data;
            console.log(`✅ ${memoriesData.length} souvenirs récupérés via route classique`);
          }
        } catch (fallbackErr) {
          console.error('❌ Toutes les routes ont échoué');
        }
      }
      
      // Si on a récupéré des souvenirs, les stocker
      if (memoriesData.length > 0) {
        setAllMemories(memoriesData);
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des souvenirs:', err);
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Filtrer les souvenirs pour la vidéo actuelle
  const filterMemoriesForCurrentVideo = () => {
    if (!id || !allMemories.length) return;
    
    console.log('🔍 Filtrage des souvenirs pour la vidéo:', id);
    
    // Normaliser l'ID de la vidéo actuelle pour les comparaisons
    const currentVideoId = id.toString().trim();
    
    // Filtrer les souvenirs associés à cette vidéo
    const matchingMemories = allMemories.filter(memory => {
      // Extraire l'ID de la vidéo du souvenir (avec différents formats possibles)
      const memoryVideoId = 
        (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
        (memory.video && typeof memory.video === 'string' ? memory.video : null) ||
        (memory.videoId ? memory.videoId : null) ||
        (memory.video_id ? memory.video_id : null);
      
      // Normaliser l'ID du souvenir pour comparaison
      const normalizedMemoryVideoId = memoryVideoId ? memoryVideoId.toString().trim() : '';
      
      // Vérification stricte de correspondance
      const isMatch = normalizedMemoryVideoId === currentVideoId;
      
      if (isMatch) {
        console.log(`✅ Souvenir correspondant trouvé: ID=${memory._id || memory.id}, vidéo=${memoryVideoId}`);
      }
      
      return isMatch;
    });
    
    console.log(`🎯 ${matchingMemories.length} souvenirs correspondent à la vidéo actuelle`);
    
    // Si on a trouvé des souvenirs, les formater pour l'affichage
    if (matchingMemories.length > 0) {
      const formattedMemories = formatMemories(matchingMemories);
      setMemories(formattedMemories);
    } else {
      setMemories([]);
    }
  };

  // Récupérer une vidéo spécifique par son ID
  const fetchVideoById = async (videoId) => {
    try {
      setLoading(true);
      setError(null);
      console.log('🎬 Chargement de la vidéo:', videoId);
      
      const videoData = await videoAPI.getVideoById(videoId);
      
      if (videoData) {
        setVideo(videoData);
        
        // Vérifier si l'utilisateur a aimé la vidéo
        setUserLiked(videoData.userInteraction?.liked || false);
        
        // Définir les compteurs
        setViewCount(videoData.vues || 0);
        setLikeCount(videoData.likes || 0);
        
        console.log('✅ Vidéo chargée:', videoData.titre);
      } else {
        setError('Impossible de charger les détails de la vidéo');
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement de la vidéo:', err);
      setError('Erreur lors du chargement de la vidéo');
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les souvenirs spécifiques à cette vidéo avec système de réessai
  const fetchVideoMemories = async (videoId) => {
    try {
      setMemoriesLoading(true);
      console.log('🔍 Récupération des souvenirs pour la vidéo:', videoId);
      
      const memoriesData = await videoAPI.getVideoMemories(videoId);
      
      if (Array.isArray(memoriesData) && memoriesData.length > 0) {
        // Double vérification pour s'assurer que les souvenirs correspondent à la vidéo actuelle
        const strictlyFilteredMemories = memoriesData.filter(memory => {
          const memoryVideoId = 
              (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
              (typeof memory.video === 'string' ? memory.video : null) ||
              memory.videoId || 
              memory.video_id;
          
          return memoryVideoId && memoryVideoId.toString() === videoId.toString();
        });
        
        console.log(`Double vérification: ${strictlyFilteredMemories.length}/${memoriesData.length} souvenirs correspondent réellement à cette vidéo`);
        
        const formattedMemories = formatMemories(strictlyFilteredMemories);
        setMemories(formattedMemories);
        retryCount.current = 0; // Réinitialiser le compteur en cas de succès
      } else if (retryCount.current < maxRetries) {
        // Si aucun souvenir n'est trouvé, réessayer après un délai
        retryCount.current++;
        console.log(`⚠️ Aucun souvenir trouvé, tentative ${retryCount.current}/${maxRetries}`);
        
        setTimeout(() => {
          fetchVideoMemories(videoId);
        }, 1000); // Attendre 1 seconde avant de réessayer
      } else {
        console.warn('❌ Aucun souvenir trouvé après plusieurs tentatives');
        setMemories([]);
        retryCount.current = 0; // Réinitialiser le compteur
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des souvenirs:', err);
      
      if (retryCount.current < maxRetries) {
        // Réessayer en cas d'erreur
        retryCount.current++;
        console.log(`⚠️ Erreur, tentative ${retryCount.current}/${maxRetries}`);
        
        setTimeout(() => {
          fetchVideoMemories(videoId);
        }, 1000);
      } else {
        setMemories([]);
        retryCount.current = 0;
      }
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Formater les données des souvenirs pour l'affichage
  const formatMemories = (memoriesData) => {
    if (!Array.isArray(memoriesData) || memoriesData.length === 0) {
      return [];
    }
    
    return memoriesData.map(memory => {
      // Extraire correctement le nom d'utilisateur
      let username = 'Utilisateur';
      
      if (memory.auteur) {
        if (typeof memory.auteur === 'object') {
          // Si auteur est un objet (cas d'un populate)
          const prenom = memory.auteur.prenom || '';
          const nom = memory.auteur.nom || '';
          
          if (prenom || nom) {
            username = `${prenom} ${nom}`.trim();
          } else if (memory.auteur.username) {
            username = memory.auteur.username;
          }
        } else if (typeof memory.auteur === 'string' && memory.auteurDetails) {
          // Si auteur est un ID mais que les détails sont disponibles ailleurs
          const prenom = memory.auteurDetails.prenom || '';
          const nom = memory.auteurDetails.nom || '';
          username = `${prenom} ${nom}`.trim() || memory.auteurDetails.username || 'Utilisateur';
        }
      } else if (memory.username) {
        username = memory.username;
      }
      
      // S'assurer que les données de la vidéo sont correctes
      const videoDetails = {
        id: memory.video?._id || 
            (typeof memory.video === 'string' ? memory.video : null) || 
            memory.videoId || 
            memory.video_id ||
            id, // id vient du contexte (id de la vidéo actuelle)
        title: memory.video?.titre || memory.videoTitle || video?.titre || 'Vidéo sans titre',
        artist: memory.video?.artiste || memory.videoArtist || video?.artiste || 'Artiste inconnu',
        year: memory.video?.annee || memory.videoYear || video?.annee || '----'
      };
      
      // Forcer l'ID de la vidéo actuelle si on a un souci d'association
      if (!videoDetails.id || videoDetails.id === 'undefined') {
        videoDetails.id = id;
      }
      
      return {
        id: memory._id || memory.id || `memory-${Math.random()}`,
        username: username,
        type: memory.type || 'posted',
        videoId: videoDetails.id,
        videoTitle: videoDetails.title,
        videoArtist: videoDetails.artist,
        videoYear: videoDetails.year,
        imageUrl: memory.auteur?.photo_profil || memory.imageUrl || '/images/default-avatar.jpg',
        content: memory.contenu || memory.content || '',
        likes: memory.likes || 0,
        comments: memory.nb_commentaires || memory.comments || 0,
        // Conserver les références originales pour les interactions
        auteur: memory.auteur,
        video: memory.video || { _id: id }
      };
    });
  };

  // Formater tous les souvenirs pour l'affichage (mode "Tous les souvenirs")
  const getAllFormattedMemories = () => {
    return formatMemories(allMemories);
  };

  // Gérer le like d'une mémoire
  const handleLikeMemory = async (memoryId) => {
    try {
      console.log('❤️ Tentative de like de la mémoire:', memoryId);
      
      // Mise à jour optimiste
      const updatedMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            likes: memory.likes + 1
          };
        }
        return memory;
      });
      
      setMemories(updatedMemories);
      
      // Aussi mettre à jour dans allMemories
      const updatedAllMemories = allMemories.map(memory => {
        if ((memory._id || memory.id) === memoryId) {
          return {
            ...memory,
            likes: (memory.likes || 0) + 1
          };
        }
        return memory;
      });
      
      setAllMemories(updatedAllMemories);
      
      // Appel API
      try {
        await videoAPI.likeMemory(memoryId);
      } catch (apiErr) {
        console.warn('⚠️ API de like indisponible, mise à jour locale uniquement');
      }
      
    } catch (err) {
      console.error('❌ Erreur lors du like de la mémoire:', err);
      
      if (err.response?.status === 401) {
        alert('Veuillez vous connecter pour aimer ce souvenir');
      }
    }
  };

  // Gérer le like d'une vidéo
  const handleLikeVideo = async () => {
    if (isLiking) return; // Éviter les clics multiples
    
    try {
      setIsLiking(true);
      
      // Mise à jour optimiste de l'interface
      const newLikedState = !userLiked;
      const newLikeCount = newLikedState ? likeCount + 1 : Math.max(0, likeCount - 1);
      
      setUserLiked(newLikedState);
      setLikeCount(newLikeCount);
      
      console.log('👍 Tentative de like/unlike...');
      
      // Appel API
      const response = await videoAPI.likeVideo(id);
      
      if (response.success) {
        // Mettre à jour avec les vraies données du serveur
        if (response.data) {
          setUserLiked(response.data.liked);
          setLikeCount(response.data.likes);
        }
        console.log('✅ Like/unlike réussi');
      } else {
        // Revenir à l'état précédent en cas d'échec
        setUserLiked(!newLikedState);
        setLikeCount(likeCount);
        console.warn('⚠️ Échec du like:', response.message);
      }
    } catch (err) {
      // Revenir à l'état précédent en cas d'erreur
      setUserLiked(!userLiked);
      setLikeCount(likeCount);
      
      console.error('❌ Erreur lors du like:', err);
      
      if (err.response?.status === 401) {
        alert('Veuillez vous connecter pour aimer cette vidéo');
      } else {
        alert('Erreur lors du like. Veuillez réessayer.');
      }
    } finally {
      setIsLiking(false);
    }
  };

  // Gérer le partage de vidéo
  const handleShareVideo = () => {
    setShowShareOptions(!showShareOptions);
  };
  
  const handleShareOption = async (option) => {
    const videoUrl = window.location.href;
    const videoTitle = video ? `${video.artiste} - ${video.titre}` : 'ThrowBack video';
    
    try {
      switch (option) {
        case 'copy':
          await navigator.clipboard.writeText(videoUrl);
          setShareMessage('URL copiée dans le presse-papier!');
          setTimeout(() => setShareMessage(''), 3000);
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out this awesome throwback: ${videoTitle}`)}&url=${encodeURIComponent(videoUrl)}`, '_blank');
          break;
        case 'whatsapp':
          window.open(`https://wa.me/?text=${encodeURIComponent(`Check out this awesome throwback: ${videoTitle} ${videoUrl}`)}`, '_blank');
          break;
        default:
          return;
      }
      
      // Log le partage via l'API (non bloquant)
      videoAPI.shareVideo(id).catch(err => 
        console.warn('⚠️ Échec du logging de partage:', err)
      );
      
    } catch (err) {
      console.error('❌ Erreur lors du partage:', err);
      setShareMessage('Erreur lors du partage.');
      setTimeout(() => setShareMessage(''), 3000);
    }
    
    setShowShareOptions(false);
  };

  // Gérer l'ajout d'un souvenir
  const handleAddMemory = async (e) => {
    e.preventDefault();
    
    if (!memoryText.trim()) {
      alert('Veuillez saisir un souvenir à partager');
      return;
    }
    
    if (isAddingMemory) return; 
    
    try {
      setIsAddingMemory(true);
      console.log('✍️ Ajout d\'un souvenir...');
      
      // Inclure EXPLICITEMENT l'ID de la vidéo dans les données du souvenir
      const memoryData = {
        contenu: memoryText.trim(),
        video_id: id,
        videoId: id,
        video: id
      };
      
      // Essayer plusieurs routes pour l'ajout
      let success = false;
      let newMemoryData = null;
      
      // D'abord essayer l'API publique
      try {
        const response = await api.post(`/api/public/videos/${id}/memories`, memoryData);
        
        if (response.data && response.data.success) {
          success = true;
          newMemoryData = response.data.data;
          console.log('✅ Souvenir ajouté avec succès via API publique');
        }
      } catch (err) {
        console.warn('⚠️ Échec de l\'API publique pour l\'ajout, tentative alternative');
      }
      
      // Si l'API publique échoue, essayer l'API alternative
      if (!success) {
        try {
          const fallbackResponse = await api.post(`/api/videos/${id}/memories`, memoryData);
          
          if (fallbackResponse.data && fallbackResponse.data.success) {
            success = true;
            newMemoryData = fallbackResponse.data.data;
            console.log('✅ Souvenir ajouté avec succès via API alternative');
          }
        } catch (fallbackErr) {
          console.error('❌ Toutes les tentatives d\'ajout ont échoué');
        }
      }
      
      if (success && newMemoryData) {
        // S'assurer que la référence à la vidéo est correcte
        if (!newMemoryData.video) {
          newMemoryData.video = {
            _id: id,
            titre: video?.titre,
            artiste: video?.artiste,
            annee: video?.annee
          };
        }
        
        // Ajouter à la liste des souvenirs
        const newMemory = formatMemories([newMemoryData])[0];
        setMemories(prevMemories => [newMemory, ...prevMemories]);
        
        setMemoryText('');
        setShareMessage('Souvenir ajouté avec succès!');
        setTimeout(() => setShareMessage(''), 3000);
        
        // Recharger les souvenirs après un court délai pour s'assurer que le nouveau souvenir est bien récupéré
        setTimeout(() => {
          fetchVideoMemories(id);
        }, 1000);
      } else {
        alert('Erreur lors de l\'ajout du souvenir. Veuillez réessayer.');
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du souvenir:', err);
      
      if (err.response?.status === 401) {
        alert('Veuillez vous connecter pour partager un souvenir');
      } else {
        alert('Erreur lors de l\'ajout du souvenir. Veuillez réessayer.');
      }
    } finally {
      setIsAddingMemory(false);
    }
  };

  // Utilitaires pour les URLs YouTube
  const getYouTubeThumbnail = (url) => {
    if (!url) return '/images/video-placeholder.jpg';
    
    if (url.startsWith('/') || url.startsWith('./')) {
      return url;
    }
    
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
        if (videoId.includes('&')) {
          videoId = videoId.split('&')[0];
        }
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      }
    } catch (error) {
      console.error('Erreur de parsing URL YouTube:', error);
    }
    
    return url;
  };

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
    if (!recommendedVideo) return null;
    
    const isCurrentVideo = video && recommendedVideo._id === video._id;
    
    const handleClick = (e) => {
      e.preventDefault();
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
          alt={`${recommendedVideo.artiste || 'Artiste'} - ${recommendedVideo.titre || 'Titre'}`} 
          className={styles.recommendedImg}
          onError={(e) => {
            e.target.src = '/images/video-placeholder.jpg';
          }}
        />
        <div className={styles.recommendedInfo}>
          <div className={styles.recommendedArtist}>{recommendedVideo.artiste || 'Artiste'}</div>
          <div className={styles.recommendedTitle}>: {recommendedVideo.titre || 'Titre'} ({recommendedVideo.annee || '----'})</div>
        </div>
        {isCurrentVideo && <div className={styles.currentlyPlaying}>▶ Now Playing</div>}
      </a>
    );
  };

  // Alterner entre tous les souvenirs et seulement ceux de la vidéo actuelle
  const toggleAllMemories = () => {
    setShowAllMemories(!showAllMemories);
  };

  // États de chargement et d'erreur
  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
        <p>Chargement de la vidéo...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className={styles.errorContainer}>
        <FontAwesomeIcon icon={faExclamationTriangle} className={styles.errorIcon} />
        <p>{error || 'Vidéo non trouvée'}</p>
        <Link to="/dashboard/videos" className={styles.backButton}>
          Retour aux vidéos
        </Link>
      </div>
    );
  }

  const embedUrl = getEmbedUrl(video?.youtubeUrl);
  const isYoutubeEmbed = embedUrl && embedUrl.includes('youtube.com/embed/');
  
  // Déterminer les souvenirs à afficher
  const memoriesToDisplay = showAllMemories ? getAllFormattedMemories() : memories;

  return (
    <div className={styles.throwbackVideosBg}>
      {showPlaylistModal && (
        <PlaylistModal 
          videoId={id} 
          onClose={() => setShowPlaylistModal(false)}
          onSuccess={() => {
            setShowPlaylistModal(false);
            fetchVideoById(id);
          }}
        />
      )}
      
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
                  onError={(e) => {
                    e.target.src = '/images/video-placeholder.jpg';
                  }}
                />
                <div className={styles.playButton}>▶</div>
              </div>
            )}
          </div>

          {/* Video Title and Stats */}
          <div className={styles.videoInfoBar}>
            <h1 className={styles.videoTitle}>
              {video.artiste || 'Artiste'} : <span style={{ fontWeight: 300, fontSize: 18 }}>{video.titre || 'Titre'} ({video.annee || '----'})</span>
            </h1>
            <div className={styles.videoStats}>
              <div className={styles.statItem}>
                <FontAwesomeIcon icon={faEye} />
                <span>{viewCount}</span>
              </div>
              <div 
                className={`${styles.statItem} ${userLiked ? styles.liked : ''} ${isLiking ? styles.loading : ''}`}
                onClick={handleLikeVideo}
              >
                <FontAwesomeIcon icon={isLiking ? faSpinner : faHeart} spin={isLiking} />
                <span>{likeCount}</span>
              </div>
              <div className={styles.statItem} onClick={handleShareVideo}>
                <FontAwesomeIcon icon={faShare} />
                <span>Share</span>
              </div>
              <div className={styles.statItem} onClick={() => setShowPlaylistModal(true)}>
                <FontAwesomeIcon icon={faList} />
                <span>Add Playlist</span>
              </div>
            </div>
            
            {/* Share Options */}
            {showShareOptions && (
              <div className={styles.shareOptions}>
                <div className={styles.shareOption} onClick={() => handleShareOption('copy')}>
                  <FontAwesomeIcon icon={faCopy} /> Copy Link
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('facebook')}>
                  <FontAwesomeIcon icon={faFacebook} /> Facebook
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('twitter')}>
                  <FontAwesomeIcon icon={faTwitter} /> Twitter
                </div>
                <div className={styles.shareOption} onClick={() => handleShareOption('whatsapp')}>
                  <FontAwesomeIcon icon={faWhatsapp} /> WhatsApp
                </div>
              </div>
            )}
            
            {/* Share/Success Message */}
            {shareMessage && (
              <div className={styles.shareMessage}>
                {shareMessage}
              </div>
            )}
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
                if (e.key === 'Enter' && !isAddingMemory) {
                  handleAddMemory(e);
                }
              }}
              disabled={isAddingMemory}
            />
            <button 
              className={`${styles.commentButton} ${isAddingMemory ? styles.loading : ''}`}
              onClick={handleAddMemory}
              disabled={isAddingMemory}
            >
              <FontAwesomeIcon icon={isAddingMemory ? faSpinner : faComment} spin={isAddingMemory} />
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
                allVideos.map((videoItem) => (
                  <RecommendedVideo key={videoItem._id || `video-${Math.random()}`} video={videoItem} />
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
          {/* En-tête avec filtre */}
          <div className={styles.memoriesHeader}>
            <h3>Souvenirs {!showAllMemories && "de cette vidéo"}</h3>
            <button 
              className={styles.filterToggleButton} 
              onClick={toggleAllMemories}
              title={showAllMemories ? "Voir uniquement les souvenirs de cette vidéo" : "Voir tous les souvenirs"}
            >
              <FontAwesomeIcon icon={faFilter} />
              <span>{showAllMemories ? "Filtrer" : "Tous"}</span>
            </button>
          </div>
          
          {/* Loader pour les souvenirs */}
          {memoriesLoading ? (
            <div className={styles.memoriesLoading}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Chargement des souvenirs...</p>
            </div>
          ) : memoriesToDisplay.length > 0 ? (
            // Affichage des souvenirs
            memoriesToDisplay.map((memory) => (
              <MemoryCard 
                key={memory.id || `memory-${Math.random()}`} 
                memory={memory}
                baseUrl={baseUrl}
                onLike={handleLikeMemory}
                currentVideoId={id}
              />
            ))
          ) : (
            // Message si aucun souvenir
            <div className={styles.emptyMemories}>
              <p>Aucun souvenir partagé{!showAllMemories && " pour cette vidéo"}.</p>
              <p>Soyez le premier à partager un souvenir!</p>
              
              {!showAllMemories && allMemories.length > 0 && (
                <button 
                  className={styles.showAllButton}
                  onClick={toggleAllMemories}
                >
                  Voir tous les souvenirs
                </button>
              )}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;