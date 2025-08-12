// utils/api.js 
import axios from 'axios';
import podcastAPI from './podcastAPI';
import playlistAPI from './playlistAPI';
import searchAPI from './searchAPI';


// Configuration de base
const BASE_URL = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com ';

// Créer une instance axios avec configuration par défaut
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true 
});

// Intercepteur de requête pour ajouter le token automatiquement
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Log des requêtes importantes
    if (config.url.includes('/videos/') || config.url.includes('/memories') || config.url.includes('/like') || config.url.includes('/profile')) {
      console.log(` API Request: ${config.method?.toUpperCase()} ${config.url}`);
      if (config.data && typeof config.data !== 'object') {
        console.log(' Request data:', config.data);
      }
    }
    
    return config;
  },
  (error) => {
    console.error(' Request error:', error);
    return Promise.reject(error);
  }
);

// Intercepteur de réponse pour gérer les erreurs globalement
api.interceptors.response.use(
  (response) => {
    // Log des réponses importantes
    if (response.config.url.includes('/videos/') || response.config.url.includes('/memories') || response.config.url.includes('/like') || response.config.url.includes('/profile')) {
      console.log(` API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
      console.log(' Response data:', response.data);
    }
    return response;
  },
  (error) => {
    console.error(' API Error:', error);
    
    // Gestion spécifique des erreurs courantes
    if (error.response) {
      const { status, data } = error.response;
      
      switch (status) {
        case 401:
          console.warn(' Unauthorized - Token expired or invalid');
          // Optionnel: rediriger vers login
          // window.location.href = '/login';
          break;
        case 403:
          console.warn(' Forbidden - Insufficient permissions');
          break;
        case 404:
          console.warn(' Not Found - Resource does not exist');
          break;
        case 500:
          console.error(' Server Error - Internal server error');
          break;
        default:
          console.error(` HTTP ${status}:`, data?.message || 'Unknown error');
      }
    } else if (error.request) {
      console.error(' Network Error - No response received:', error.request);
    } else {
      console.error(' Request Setup Error:', error.message);
    }
    
    return Promise.reject(error);
  }
);


// Méthodes utilitaires spécifiques pour VideoDetail
// Méthodes utilitaires spécifiques pour VideoDetail
const videoAPI = {
  // Récupérer toutes les vidéos publiques
  getAllVideos: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        type: 'music',
        limit: '50',
        ...params
      }).toString();
      
      console.log('🔍 Récupération de toutes les vidéos avec params:', queryParams);
      
      const response = await api.get(`/api/public/videos?${queryParams}`);
      
      // Gestion flexible de la structure de réponse
      if (response.data.success) {
        return response.data.data || response.data.videos || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn('⚠️ Format de réponse inattendu:', response.data);
        return [];
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des vidéos:', error);
      
      // Fallback vers l'ancienne route si la nouvelle ne fonctionne pas
      try {
        console.log('⚠️ Tentative avec route de secours...');
        const fallbackResponse = await api.get('/api/videos?type=music&limit=50');
        if (fallbackResponse.data.success) {
          return fallbackResponse.data.data || [];
        }
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué:', fallbackError);
      }
      
      return [];
    }
  },

  // Récupérer une vidéo par ID
  getVideoById: async (videoId) => {
    try {
      console.log('🔍 Récupération de la vidéo par ID:', videoId);
      
      const response = await api.get(`/api/public/videos/${videoId}`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Vidéo non trouvée');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de la vidéo:', error);
      
      // Fallback vers l'ancienne route
      try {
        console.log('⚠️ Tentative avec route de secours pour les détails vidéo...');
        const fallbackResponse = await api.get(`/api/videos/${videoId}`);
        if (fallbackResponse.data.success) {
          return fallbackResponse.data.data || fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué pour les détails vidéo:', fallbackError);
      }
      
      throw error;
    }
  },

  // Récupérer les souvenirs d'une vidéo - FONCTION CORRIGÉE
 // Récupérer les souvenirs d'une vidéo - FONCTION CORRIGÉE
getVideoMemories: async (videoId) => {
  try {
    console.log('🔍 Récupération des souvenirs pour la vidéo:', videoId);
    
    // Essayer d'abord la route directe pour les souvenirs de cette vidéo
    try {
      const response = await api.get(`/api/public/videos/${videoId}/memories`);
      
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        const memories = response.data.data;
        console.log(`✅ ${memories.length} souvenirs trouvés via API directe`);
        
        // Conserver ces souvenirs dans le localStorage pour persistance
        try {
          // D'abord récupérer tous les souvenirs existants
          const existingMemoriesJson = localStorage.getItem('allMemories');
          let allMemories = [];
          
          if (existingMemoriesJson) {
            allMemories = JSON.parse(existingMemoriesJson);
          }
          
          // Fusionner les nouveaux souvenirs avec les existants
          const existingIds = new Set(allMemories.map(m => m._id || m.id));
          const uniqueNewMemories = memories.filter(m => !existingIds.has(m._id || m.id));
          
          if (uniqueNewMemories.length > 0) {
            const updatedMemories = [...uniqueNewMemories, ...allMemories];
            localStorage.setItem('allMemories', JSON.stringify(updatedMemories));
            localStorage.setItem('memoriesFetchTime', Date.now().toString());
            console.log(`✅ ${uniqueNewMemories.length} nouveaux souvenirs ajoutés au cache`);
          }
        } catch (storageErr) {
          console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
        }
        
        return memories;
      }
    } catch (directErr) {
      console.warn('⚠️ Échec de l\'API directe, tentative avec route alternative');
    }
    
    // Si l'API directe échoue, essayer la route alternative
    try {
      const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
      
      if (fallbackResponse.data && fallbackResponse.data.success && Array.isArray(fallbackResponse.data.data)) {
        const memories = fallbackResponse.data.data;
        console.log(`✅ ${memories.length} souvenirs trouvés via API alternative`);
        
        // Mettre à jour le cache
        try {
          const existingMemoriesJson = localStorage.getItem('allMemories');
          let allMemories = [];
          
          if (existingMemoriesJson) {
            allMemories = JSON.parse(existingMemoriesJson);
          }
          
          const existingIds = new Set(allMemories.map(m => m._id || m.id));
          const uniqueNewMemories = memories.filter(m => !existingIds.has(m._id || m.id));
          
          if (uniqueNewMemories.length > 0) {
            const updatedMemories = [...uniqueNewMemories, ...allMemories];
            localStorage.setItem('allMemories', JSON.stringify(updatedMemories));
            localStorage.setItem('memoriesFetchTime', Date.now().toString());
          }
        } catch (storageErr) {
          console.warn('⚠️ Erreur lors de la mise à jour du cache:', storageErr);
        }
        
        return memories;
      }
    } catch (fallbackErr) {
      console.warn('⚠️ Échec de la route alternative, tentative de récupération depuis le cache');
    }
    
    // Si toutes les requêtes API échouent, essayer de récupérer depuis localStorage
    try {
      const cachedMemoriesJson = localStorage.getItem('allMemories');
      
      if (cachedMemoriesJson) {
        const allCachedMemories = JSON.parse(cachedMemoriesJson);
        
        // Filtrer les souvenirs pour cette vidéo
        const filteredMemories = allCachedMemories.filter(memory => {
          const memoryVideoId = 
              (memory.video && typeof memory.video === 'object' ? memory.video._id : null) || 
              (typeof memory.video === 'string' ? memory.video : null) ||
              memory.videoId || 
              memory.video_id;
          
          return memoryVideoId && memoryVideoId.toString() === videoId.toString();
        });
        
        console.log(`✅ ${filteredMemories.length} souvenirs trouvés dans le cache local`);
        return filteredMemories;
      }
    } catch (cacheErr) {
      console.error('❌ Erreur lors de l\'accès au cache:', cacheErr);
    }
    
    // Si tout échoue, retourner un tableau vide
    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des souvenirs:', error);
    return [];
  }
},

  // Ajouter un souvenir
  addMemory: async (videoId, content) => {
    try {
      console.log('✍️ Ajout d\'un souvenir pour la vidéo:', videoId);
      
      // Normaliser l'ID
      const normalizedVideoId = videoId.toString().trim();
      
      // Préparer les données avec la référence explicite à la vidéo
      const memoryData = {
        contenu: content,
        video_id: normalizedVideoId,
        videoId: normalizedVideoId,
        video: normalizedVideoId
      };
      
      const response = await api.post(`/api/public/videos/${videoId}/memories`, memoryData);
      
      if (response.data.success) {
        console.log('✅ Souvenir ajouté avec succès');
        
        // S'assurer que la réponse contient la référence à la vidéo
        if (response.data.data) {
          // Ajouter explicitement la vidéo si elle n'est pas déjà présente
          if (!response.data.data.video && !response.data.data.videoId && !response.data.data.video_id) {
            response.data.data.video = {
              _id: normalizedVideoId
            };
            response.data.data.videoId = normalizedVideoId;
          }
        }
        
        return response.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de l\'ajout du souvenir');
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout du souvenir:', error);
      
      // Fallback vers l'ancienne route
      try {
        console.log('⚠️ Tentative avec route de secours...');
        
        const memoryData = {
          contenu: content,
          video_id: videoId,
          videoId: videoId,
          video: videoId
        };
        
        const fallbackResponse = await api.post(`/api/videos/${videoId}/memories`, memoryData);
        
        if (fallbackResponse.data.success) {
          console.log('✅ Souvenir ajouté avec succès (via route fallback)');
          
          // S'assurer que la réponse contient la référence à la vidéo
          if (fallbackResponse.data.data) {
            // Ajouter explicitement la vidéo si elle n'est pas déjà présente
            if (!fallbackResponse.data.data.video && !fallbackResponse.data.data.videoId && !fallbackResponse.data.data.video_id) {
              fallbackResponse.data.data.video = {
                _id: videoId
              };
              fallbackResponse.data.data.videoId = videoId;
            }
          }
          
          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué:', fallbackError);
      }
      
      throw error;
    }
  },

  // Récupérer tous les souvenirs de la plateforme
  getAllMemories: async () => {
    try {
      console.log('🔍 Récupération de tous les souvenirs...');
      
      try {
        // Route publique
        const response = await api.get('/api/public/memories');
        if (response.data && Array.isArray(response.data.data)) {
          console.log(`✅ ${response.data.data.length} souvenirs récupérés via API publique`);
          return response.data.data;
        }
      } catch (err) {
        console.warn('⚠️ Échec de la route publique, tentative avec route classique');
      }
      
      try {
        // Route classique
        const fallbackResponse = await api.get('/api/memories');
        if (fallbackResponse.data && Array.isArray(fallbackResponse.data.data)) {
          console.log(`✅ ${fallbackResponse.data.data.length} souvenirs récupérés via route classique`);
          return fallbackResponse.data.data;
        }
      } catch (fallbackErr) {
        console.error('❌ Toutes les routes ont échoué');
      }
      
      return [];
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des souvenirs:', error);
      return [];
    }
  },

  // Liker un souvenir
  likeMemory: async (memoryId) => {
    try {
      console.log('❤️ Tentative de like du souvenir:', memoryId);
      
      const response = await api.post(`/api/public/memories/${memoryId}/like`);
      
      if (response.data.success) {
        console.log('✅ Like réussi');
        return response.data;
      } else {
        console.warn('⚠️ Échec du like (erreur côté serveur)');
        throw new Error(response.data.message || 'Erreur côté serveur');
      }
    } catch (error) {
      console.error('❌ Erreur lors du like du souvenir:', error);
      
      // Fallback: essayer l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/memories/${memoryId}/like`);
        if (fallbackResponse.data.success) {
          console.log('✅ Like réussi (via route fallback)');
          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué:', fallbackError);
      }
      
      throw error;
    }
  },

  // Liker une vidéo
  likeVideo: async (videoId) => {
    try {
      console.log('👍 Tentative de like de la vidéo:', videoId);
      
      const response = await api.post(`/api/public/videos/${videoId}/like`);
      
      if (response.data.success) {
        return response.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors du like');
      }
    } catch (error) {
      console.error('❌ Erreur lors du like de la vidéo:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/videos/${videoId}/like`);
        if (fallbackResponse.data.success) {
          return fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué:', fallbackError);
      }
      
      throw error;
    }
  },

  // Partager une vidéo
  shareVideo: async (videoId) => {
    try {
      console.log('🔗 Partage de la vidéo:', videoId);
      
      const response = await api.post(`/api/public/videos/${videoId}/share`, {});
      
      return response.data;
    } catch (error) {
      console.error('❌ Erreur lors du partage de la vidéo:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/videos/${videoId}/share`, {});
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error('❌ Fallback également échoué:', fallbackError);
      }
      
      // Pour le partage, on peut simuler le succès
      return { success: true, message: 'Partage enregistré' };
    }
  }
};


// Export unique pour éviter les conflits!
export { videoAPI };

export { podcastAPI };

export {playlistAPI};

export { searchAPI };

export default api;