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
  faFilter,
  faSync
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
  
  // Références pour suivre l'état des requêtes
  const fetchingRef = useRef(false);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Construire l'URL de base en fonction de l'environnement
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Charger toutes les vidéos et tous les souvenirs au montage du composant
  useEffect(() => {
    fetchAllVideos();
    fetchAllMemories();
    
    // Ajouter un listener pour événement de stockage localStorage qui sera utilisé comme mécanisme de partage d'état
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // Charger la vidéo spécifique quand l'ID change
  useEffect(() => {
    if (id) {
      fetchVideoById(id);
      fetchVideoMemories(id);
      window.scrollTo(0, 0);
      
      // Sauvegarder l'ID de la vidéo actuelle dans localStorage
      localStorage.setItem('currentVideoId', id);
    }
  }, [id]);

  // Gérer les changements de localStorage (pour la communication entre onglets)
  const handleStorageChange = (event) => {
    if (event.key === 'memoriesUpdated' && event.newValue) {
      // Si les souvenirs ont été mis à jour dans un autre onglet
      fetchVideoMemories(id);
    }
  };

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
      
      // Si on a récupéré des souvenirs, les mettre en cache
      if (memoriesData.length > 0) {
        setAllMemories(memoriesData);
        
        // Stocker les souvenirs dans localStorage pour persistance entre les rafraîchissements
        try {
          localStorage.setItem('allMemories', JSON.stringify(memoriesData));
          localStorage.setItem('memoriesFetchTime', Date.now().toString());
        } catch (storageErr) {
          console.warn('⚠️ Impossible de stocker les souvenirs dans localStorage:', storageErr);
        }
      } else {
        // Si aucun souvenir n'a été récupéré, essayer de charger depuis localStorage
        try {
          const cachedMemories = localStorage.getItem('allMemories');
          if (cachedMemories) {
            const parsedMemories = JSON.parse(cachedMemories);
            setAllMemories(parsedMemories);
            console.log(`✅ ${parsedMemories.length} souvenirs récupérés depuis le cache`);
          }
        } catch (parseErr) {
          console.warn('⚠️ Erreur lors de la récupération du cache:', parseErr);
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des souvenirs:', err);
      
      // Essayer de charger depuis localStorage en cas d'erreur
      try {
        const cachedMemories = localStorage.getItem('allMemories');
        if (cachedMemories) {
          const parsedMemories = JSON.parse(cachedMemories);
          setAllMemories(parsedMemories);
          console.log(`✅ ${parsedMemories.length} souvenirs récupérés depuis le cache après erreur`);
        }
      } catch (parseErr) {
        console.warn('⚠️ Erreur lors de la récupération du cache:', parseErr);
      }
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Filtrer les souvenirs pour la vidéo actuelle
  const filterMemoriesForCurrentVideo = (memoriesArray, videoId) => {
    if (!videoId || !memoriesArray || !Array.isArray(memoriesArray) || memoriesArray.length === 0) return [];
    
    console.log('🔍 Filtrage des souvenirs pour la vidéo:', videoId);
    
    // Normaliser l'ID de la vidéo actuelle pour les comparaisons
    const currentVideoId = videoId.toString().trim();
    
    // Filtrer les souvenirs associés à cette vidéo
    const matchingMemories = memoriesArray.filter(memory => {
      // Extraire l'ID de la vidéo du souvenir (avec différents formats possibles)
      const memoryVideoId = 
        (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
        (memory.video && typeof memory.video === 'string' ? memory.video : null) ||
        memory.videoId || 
        memory.video_id;
      
      // Normaliser l'ID du souvenir
      const normalizedMemoryVideoId = memoryVideoId ? memoryVideoId.toString().trim() : '';
      
      // Vérification de correspondance avec logging pour débuggage
      const isMatch = normalizedMemoryVideoId === currentVideoId;
      if (isMatch) {
        console.log(`✅ Souvenir correspondant trouvé: ID=${memory._id || memory.id}, vidéo=${memoryVideoId}`);
      }
      
      return isMatch;
    });
    
    console.log(`🎯 ${matchingMemories.length} souvenirs correspondent à la vidéo actuelle`);
    return matchingMemories;
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

  // Récupérer les souvenirs spécifiques à cette vidéo avec gestion de cache et retries
  const fetchVideoMemories = async (videoId) => {
    // Éviter les requêtes multiples simultanées
    if (fetchingRef.current) {
      console.log('⏳ Une requête est déjà en cours, annulation');
      return;
    }
    
    fetchingRef.current = true;
    
    try {
      setMemoriesLoading(true);
      console.log('🔍 Récupération des souvenirs pour la vidéo:', videoId);
      
      // D'abord essayer de récupérer depuis le cache local
      const memoriesFromState = allMemories.length > 0 ? filterMemoriesForCurrentVideo(allMemories, videoId) : [];
      
      if (memoriesFromState.length > 0) {
        console.log(`✅ ${memoriesFromState.length} souvenirs trouvés dans l'état local`);
        const formattedMemories = formatMemories(memoriesFromState, videoId);
        setMemories(formattedMemories);
        fetchingRef.current = false;
        setMemoriesLoading(false);
        return;
      }
      
      // Essayer de récupérer depuis le localStorage
      try {
        const cachedMemories = localStorage.getItem('allMemories');
        if (cachedMemories) {
          const parsedMemories = JSON.parse(cachedMemories);
          const filteredMemories = filterMemoriesForCurrentVideo(parsedMemories, videoId);
          
          if (filteredMemories.length > 0) {
            console.log(`✅ ${filteredMemories.length} souvenirs trouvés dans le cache localStorage`);
            const formattedMemories = formatMemories(filteredMemories, videoId);
            setMemories(formattedMemories);
            
            // Mettre à jour l'état global aussi
            setAllMemories(parsedMemories);
            
            fetchingRef.current = false;
            setMemoriesLoading(false);
            return;
          }
        }
      } catch (cacheErr) {
        console.warn('⚠️ Erreur lors de la récupération du cache:', cacheErr);
      }
      
      // Si pas de cache ou cache vide, requête à l'API
      console.log('🔄 Tentative de récupération depuis l\'API...');
      
      // Essayer d'abord avec l'API spécifique à cette vidéo
      try {
        const memoriesData = await videoAPI.getVideoMemories(videoId);
        
        if (Array.isArray(memoriesData) && memoriesData.length > 0) {
          console.log(`✅ ${memoriesData.length} souvenirs récupérés via API`);
          
          // Filtrer strictement pour cette vidéo
          const strictlyFilteredMemories = memoriesData.filter(memory => {
            const memoryVideoId = 
                (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
                (typeof memory.video === 'string' ? memory.video : null) ||
                memory.videoId || 
                memory.video_id;
            
            return memoryVideoId && memoryVideoId.toString() === videoId.toString();
          });
          
          const formattedMemories = formatMemories(strictlyFilteredMemories, videoId);
          setMemories(formattedMemories);
          
          // Réinitialiser le compteur de tentatives
          retryCountRef.current = 0;
        } else if (retryCountRef.current < maxRetries) {
          // Augmenter le compteur de tentatives et réessayer après un délai
          retryCountRef.current++;
          console.log(`⚠️ Pas de souvenirs trouvés, tentative ${retryCountRef.current}/${maxRetries}`);
          
          setTimeout(() => {
            fetchingRef.current = false;
            fetchVideoMemories(videoId);
          }, 1000 * retryCountRef.current); // Attendre de plus en plus longtemps
          
          return;
        } else {
          console.warn('❌ Aucun souvenir trouvé après plusieurs tentatives');
          setMemories([]);
          retryCountRef.current = 0;
        }
      } catch (apiErr) {
        console.error('❌ Erreur lors de la récupération des souvenirs via API:', apiErr);
        
        // Fallback: récupérer tous les souvenirs et filtrer
        if (retryCountRef.current < maxRetries) {
          retryCountRef.current++;
          console.log(`⚠️ Tentative de fallback ${retryCountRef.current}/${maxRetries}`);
          
          try {
            // Récupérer tous les souvenirs
            await fetchAllMemories();
            
            // Filtrer pour cette vidéo
            const newFilteredMemories = filterMemoriesForCurrentVideo(allMemories, videoId);
            if (newFilteredMemories.length > 0) {
              const formattedMemories = formatMemories(newFilteredMemories, videoId);
              setMemories(formattedMemories);
            } else {
              setMemories([]);
            }
          } catch (fallbackErr) {
            console.error('❌ Erreur lors du fallback:', fallbackErr);
            setMemories([]);
          }
        } else {
          console.warn('❌ Échec après plusieurs tentatives');
          setMemories([]);
        }
      }
    } finally {
      fetchingRef.current = false;
      setMemoriesLoading(false);
      retryCountRef.current = 0;
    }
  };

  // Rafraîchir les souvenirs manuellement
  const refreshMemories = () => {
    if (id) {
      fetchVideoMemories(id);
    }
  };

  // Formater les données des souvenirs pour l'affichage
  const formatMemories = (memoriesData, currentVideoId = id) => {
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
            currentVideoId, // id vient du contexte (id de la vidéo actuelle)
        title: memory.video?.titre || memory.videoTitle || video?.titre || 'Vidéo sans titre',
        artist: memory.video?.artiste || memory.videoArtist || video?.artiste || 'Artiste inconnu',
        year: memory.video?.annee || memory.videoYear || video?.annee || '----'
      };
      
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
        video: memory.video,
        // Pour la vérification de correspondance
        originalVideoId: videoDetails.id,
        currentVideoId: currentVideoId,
        // Information sur l'interaction utilisateur
        userInteraction: memory.userInteraction || {
          liked: false,
          disliked: false,
          isAuthor: false
        }
      };
    });
  };

  // Formater tous les souvenirs pour l'affichage (mode "Tous les souvenirs")
  const getAllFormattedMemories = () => {
    return formatMemories(allMemories);
  };

  // Charger les réponses à un souvenir
  const fetchReplies = async (memoryId) => {
    try {
      setMemoriesLoading(true);
      console.log('🔍 Chargement des réponses pour le souvenir:', memoryId);
      
      try {
        // Route principale
        const response = await api.get(`/api/memories/${memoryId}/replies`);
        
        if (response.data && response.data.success) {
          console.log(`✅ ${response.data.data.length} réponses récupérées`);
          return response.data.data;
        }
      } catch (err) {
        console.warn('⚠️ Échec de la route principale, tentative avec route alternative');
        
        // Route alternative
        try {
          const fallbackResponse = await api.get(`/api/public/memories/${memoryId}/replies`);
          
          if (fallbackResponse.data && fallbackResponse.data.success) {
            console.log(`✅ ${fallbackResponse.data.data.length} réponses récupérées via route alternative`);
            return fallbackResponse.data.data;
          }
        } catch (fallbackErr) {
          console.error('❌ Toutes les routes ont échoué');
        }
      }
      
      return [];
    } catch (err) {
      console.error('❌ Erreur lors du chargement des réponses:', err);
      return [];
    } finally {
      setMemoriesLoading(false);
    }
  };

  // Pour gérer l'affichage des réponses d'un souvenir
  const handleToggleReplies = async (memoryId) => {
    // Vérifier si c'est déjà en cours de chargement
    if (memoriesLoading) return;
    
    // Trouver le souvenir dans l'état
    const memoryIndex = memories.findIndex(m => m.id === memoryId);
    if (memoryIndex === -1) return;
    
    const memory = memories[memoryIndex];
    
    // Si les réponses sont déjà affichées, les masquer
    if (memory.showReplies) {
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        showReplies: false
      };
      setMemories(updatedMemories);
      return;
    }
    
    // Charger les réponses si elles ne sont pas déjà chargées
    if (!memory.replies || memory.replies.length === 0) {
      const replies = await fetchReplies(memoryId);
      
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        replies,
        showReplies: true
      };
      setMemories(updatedMemories);
    } else {
      // Simplement afficher les réponses déjà chargées
      const updatedMemories = [...memories];
      updatedMemories[memoryIndex] = {
        ...memory,
        showReplies: true
      };
      setMemories(updatedMemories);
    }
  };


// Dans VideoDetail.jsx, mettez à jour la fonction handleAddReply
const handleAddReply = async (memoryId, replyText) => {
  try {
    console.log('✍️ Ajout d\'une réponse au souvenir:', memoryId);
    
    // Appel API - essayer avec la route complète pour s'assurer qu'elle est correcte
    const response = await api.post(`/api/memories/${memoryId}/replies`, {
      contenu: replyText
    });
    
    if (response.data && response.data.success) {
      // Traitement en cas de succès
      console.log('✅ Réponse ajoutée avec succès:', response.data);
      
      // Mettre à jour la liste des réponses en temps réel
      const updatedMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          return {
            ...memory,
            nb_commentaires: (memory.nb_commentaires || 0) + 1,
            replies: memory.replies 
              ? [...memory.replies, response.data.data] 
              : [response.data.data]
          };
        }
        return memory;
      });
      
      setMemories(updatedMemories);
      return true;
    }
    
    return false;
  } catch (err) {
    console.error('❌ Erreur lors de l\'ajout de la réponse:', err);
    
    // Essayer avec une route alternative
    try {
      console.log('🔄 Tentative avec route alternative...');
      const fallbackResponse = await api.post(`/api/public/memories/${memoryId}/replies`, {
        contenu: replyText
      });
      
      if (fallbackResponse.data && fallbackResponse.data.success) {
        console.log('✅ Réponse ajoutée avec succès (via fallback):', fallbackResponse.data);
        
        // Mettre à jour la liste des réponses
        const updatedMemories = memories.map(memory => {
          if (memory.id === memoryId) {
            return {
              ...memory,
              nb_commentaires: (memory.nb_commentaires || 0) + 1,
              replies: memory.replies 
                ? [...memory.replies, fallbackResponse.data.data] 
                : [fallbackResponse.data.data]
            };
          }
          return memory;
        });
        
        setMemories(updatedMemories);
        return true;
      }
    } catch (fallbackErr) {
      console.error('❌ Erreur lors de la tentative alternative:', fallbackErr);
    }
    
    if (err.response?.status === 401) {
      alert('Veuillez vous connecter pour ajouter une réponse');
    } else {
      alert('Erreur lors de l\'ajout de la réponse. Veuillez réessayer.');
    }
    
    return false;
  }
};

  // Gérer le like d'une mémoire
  const handleLikeMemory = async (memoryId) => {
    try {
      console.log(' Tentative de like de la mémoire:', memoryId);
      
      // Mise à jour optimiste
      const updatedMemories = memories.map(memory => {
        if (memory.id === memoryId) {
          const isLiked = memory.userInteraction?.liked;
          return {
            ...memory,
            likes: isLiked ? Math.max(0, memory.likes - 1) : memory.likes + 1,
            userInteraction: {
              ...memory.userInteraction,
              liked: !isLiked
            }
          };
        }
        return memory;
      });
      
      setMemories(updatedMemories);
      
      // Aussi mettre à jour dans allMemories
      const updatedAllMemories = allMemories.map(memory => {
        if ((memory._id || memory.id) === memoryId) {
          const isLiked = memory.userInteraction?.liked;
          return {
            ...memory,
            likes: isLiked ? Math.max(0, memory.likes - 1) : (memory.likes || 0) + 1,
            userInteraction: {
              ...memory.userInteraction,
              liked: !isLiked
            }
          };
        }
        return memory;
      });
      
      setAllMemories(updatedAllMemories);
      
      // Mettre à jour le cache localStorage
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
      } catch (storageErr) {
        console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
      }
      
      // Appel API
      try {
        const response = await api.post(`/api/memories/${memoryId}/like`);
        
        // Si la réponse contient de nouvelles données, mettre à jour avec les vraies valeurs
        if (response.data && response.data.success && response.data.data) {
          const { liked, likes } = response.data.data;
          
          const updatedWithResponse = memories.map(memory => {
            if (memory.id === memoryId) {
              return {
                ...memory,
                likes: likes,
                userInteraction: {
                  ...memory.userInteraction,
                  liked: liked
                }
              };
            }
            return memory;
          });
          
          setMemories(updatedWithResponse);
        }
      } catch (apiErr) {
        console.warn('⚠️ API de like indisponible, mise à jour locale uniquement:', apiErr);
        
        // Essayer avec une route alternative
        try {
          await api.post(`/api/public/memories/${memoryId}/like`);
        } catch (fallbackErr) {
          console.warn('⚠️ Route alternative également indisponible:', fallbackErr);
        }
      }
      
    } catch (err) {
      console.error('❌ Erreur lors du like de la mémoire:', err);
      
      if (err.response?.status === 401) {
        alert('Veuillez vous connecter pour aimer ce souvenir');
      }
    }
  };

  // Gérer la suppression d'un souvenir
  const handleDeleteMemory = async (memoryId) => {
    try {
      console.log('🗑️ Suppression du souvenir:', memoryId);
      
      if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce souvenir ?')) {
        return;
      }
      
      // Mise à jour optimiste
      const updatedMemories = memories.filter(memory => memory.id !== memoryId);
      setMemories(updatedMemories);
      
      // Aussi mettre à jour dans allMemories
      const updatedAllMemories = allMemories.filter(memory => 
        (memory._id || memory.id) !== memoryId
      );
      
      setAllMemories(updatedAllMemories);
      
      // Mettre à jour le cache localStorage
      try {
        localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
      } catch (storageErr) {
        console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
      }
      
      // Appel API
      try {
        await api.delete(`/api/memories/${memoryId}`);
        console.log('✅ Souvenir supprimé avec succès');
      } catch (apiErr) {
        console.warn('⚠️ API de suppression indisponible:', apiErr);
        
        if (apiErr.response?.status === 401) {
          alert('Vous devez être connecté pour supprimer ce souvenir');
          // Restaurer le souvenir
          fetchVideoMemories(id);
        } else if (apiErr.response?.status === 403) {
          alert('Vous ne pouvez pas supprimer ce souvenir');
          // Restaurer le souvenir
          fetchVideoMemories(id);
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de la suppression du souvenir:', err);
      // Restaurer en cas d'erreur
      fetchVideoMemories(id);
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
      
      const response = await api.post(`/api/public/videos/${id}/memories`, memoryData);
      
      if (response.data && response.data.success) {
        // Ajouter le nouveau souvenir à la liste avec référence explicite à la vidéo actuelle
        if (response.data.data) {
          const newMemoryData = {
            ...response.data.data,
            video: {
              _id: id,
              titre: video?.titre,
              artiste: video?.artiste,
              annee: video?.annee
            },
            videoId: id // Ajouter explicitement l'ID de la vidéo
          };
          
          // Ajouter à la liste des souvenirs filtrés
          const newMemory = formatMemories([newMemoryData])[0];
          setMemories(prevMemories => [newMemory, ...prevMemories]);
          
          // Ajouter aussi à la liste complète
          const updatedAllMemories = [newMemoryData, ...allMemories];
          setAllMemories(updatedAllMemories);
          
          // Mettre à jour le cache localStorage
          try {
            localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
            // Notifier les autres onglets que les souvenirs ont été mis à jour
            localStorage.setItem('memoriesUpdated', Date.now().toString());
          } catch (storageErr) {
            console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
          }
        }
        
        setMemoryText('');
        
        console.log('✅ Souvenir ajouté avec succès');
        
        // Notification de succès discrète
        setShareMessage('Souvenir ajouté avec succès!');
        setTimeout(() => setShareMessage(''), 3000);
      } else {
        // Fallback: essayer la route alternative
        const fallbackResponse = await api.post(`/api/videos/${id}/memories`, memoryData);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          // Même traitement que ci-dessus
          if (fallbackResponse.data.data) {
            const newMemoryData = {
              ...fallbackResponse.data.data,
              video: {
                _id: id,
                titre: video?.titre,
                artiste: video?.artiste,
                annee: video?.annee
              },
              videoId: id
            };
            
            const newMemory = formatMemories([newMemoryData])[0];
            setMemories(prevMemories => [newMemory, ...prevMemories]);
            
            const updatedAllMemories = [newMemoryData, ...allMemories];
            setAllMemories(updatedAllMemories);
            
            try {
              localStorage.setItem('allMemories', JSON.stringify(updatedAllMemories));
              localStorage.setItem('memoriesUpdated', Date.now().toString());
            } catch (storageErr) {
              console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
            }
          }
          
          setMemoryText('');
          setShareMessage('Souvenir ajouté avec succès!');
          setTimeout(() => setShareMessage(''), 3000);
        } else {
          alert(fallbackResponse.data?.message || 'Erreur lors de l\'ajout du souvenir');
        }
      }
    } catch (err) {
      console.error('❌ Erreur lors de l\'ajout du souvenir:', err);
      
      // Essayer le fallback
      try {
        const memoryData = {
          contenu: memoryText.trim(),
          video_id: id,
          videoId: id,
          video: id
        };
        
        const fallbackResponse = await api.post(`/api/videos/${id}/memories`, memoryData);
        
        if (fallbackResponse.data && fallbackResponse.data.success) {
          console.log('✅ Souvenir ajouté avec succès (via fallback)');
          
          // Mêmes actions que ci-dessus
          if (fallbackResponse.data.data) {
            const newMemoryData = {
              ...fallbackResponse.data.data,
              video: {
                _id: id,
                titre: video?.titre,
                artiste: video?.artiste,
                annee: video?.annee
              },
              videoId: id
            };
            
            const newMemory = formatMemories([newMemoryData])[0];
            setMemories(prevMemories => [newMemory, ...prevMemories]);
            setAllMemories(prevAllMemories => [newMemoryData, ...prevAllMemories]);
            
            try {
              localStorage.setItem('allMemories', JSON.stringify([newMemoryData, ...allMemories]));
              localStorage.setItem('memoriesUpdated', Date.now().toString());
            } catch (storageErr) {
              console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
            }
          }
          
          setMemoryText('');
          setShareMessage('Souvenir ajouté avec succès!');
          setTimeout(() => setShareMessage(''), 3000);
        } else {
          if (err.response?.status === 401) {
            alert('Veuillez vous connecter pour partager un souvenir');
          } else {
            alert('Erreur lors de l\'ajout du souvenir. Veuillez réessayer.');
          }
        }
      } catch (fallbackErr) {
        console.error('❌ Fallback également échoué:', fallbackErr);
        
        if (err.response?.status === 401) {
          alert('Veuillez vous connecter pour partager un souvenir');
        } else {
          alert('Erreur lors de l\'ajout du souvenir. Veuillez réessayer.');
        }
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
          {/* En-tête avec filtre et bouton de rafraîchissement */}
          <div className={styles.memoriesHeader}>
            <h3>Souvenirs {!showAllMemories && "de cette vidéo"}</h3>
            <div className={styles.memoriesControls}>
              <button 
                className={styles.refreshButton}
                onClick={refreshMemories}
                title="Rafraîchir les souvenirs"
              >
                <FontAwesomeIcon icon={faSync} spin={memoriesLoading} />
              </button>
              <button 
                className={styles.filterToggleButton} 
                onClick={toggleAllMemories}
                title={showAllMemories ? "Voir uniquement les souvenirs de cette vidéo" : "Voir tous les souvenirs"}
              >
                <FontAwesomeIcon icon={faFilter} />
                <span>{showAllMemories ? "Filtrer" : "Tous"}</span>
              </button>
            </div>
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
                onAddReply={handleAddReply}
                onDeleteMemory={handleDeleteMemory}
                onToggleReplies={handleToggleReplies}
                currentVideoId={id}
                replies={memory.replies || []}
                showReplies={memory.showReplies || false}
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
              
              <button 
                className={styles.refreshButton}
                onClick={refreshMemories}
                style={{ marginTop: '12px' }}
              >
                <FontAwesomeIcon icon={faSync} /> Rafraîchir
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default VideoDetail;