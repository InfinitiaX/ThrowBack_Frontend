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
const videoAPI = {
  // Récupérer toutes les vidéos publiques
  getAllVideos: async (params = {}) => {
    try {
      const queryParams = new URLSearchParams({
        type: 'music',
        limit: '50',
        ...params
      }).toString();
      
      console.log(' Fetching all videos with params:', queryParams);
      
      const response = await api.get(`/api/public/videos?${queryParams}`);
      
      // Gestion flexible de la structure de réponse
      if (response.data.success) {
        return response.data.data || response.data.videos || [];
      } else if (Array.isArray(response.data)) {
        return response.data;
      } else {
        console.warn(' Unexpected response format:', response.data);
        return [];
      }
    } catch (error) {
      console.error(' Error fetching all videos:', error);
      
      // Fallback vers l'ancienne route si la nouvelle ne fonctionne pas
      try {
        console.log(' Trying fallback route...');
        const fallbackResponse = await api.get('/api/videos?type=music&limit=50');
        if (fallbackResponse.data.success) {
          return fallbackResponse.data.data || [];
        }
      } catch (fallbackError) {
        console.error(' Fallback also failed:', fallbackError);
      }
      
      return [];
    }
  },

  // Récupérer une vidéo par ID
  getVideoById: async (videoId) => {
    try {
      console.log(' Fetching video by ID:', videoId);
      
      const response = await api.get(`/api/public/videos/${videoId}`);
      
      if (response.data.success) {
        return response.data.data || response.data;
      } else {
        throw new Error(response.data.message || 'Video not found');
      }
    } catch (error) {
      console.error(' Error fetching video by ID:', error);
      
      // Fallback vers l'ancienne route
      try {
        console.log(' Trying fallback route for video details...');
        const fallbackResponse = await api.get(`/api/videos/${videoId}`);
        if (fallbackResponse.data.success) {
          return fallbackResponse.data.data || fallbackResponse.data;
        }
      } catch (fallbackError) {
        console.error(' Fallback for video details also failed:', fallbackError);
      }
      
      throw error;
    }
  },

  // Récupérer les souvenirs d'une vidéo

getVideoMemories: async (videoId) => {
  try {
    console.log('🔍 Récupération des souvenirs pour la vidéo:', videoId);
    
    // Essayer d'abord avec la nouvelle API
    const response = await api.get(`/api/public/videos/${videoId}/memories`);
    
    if (response.data && response.data.success) {
      console.log(`✅ ${response.data.data?.length || 0} souvenirs récupérés via API publique`);
      return response.data.data || [];
    } else {
      // Fallback vers l'ancienne route si nécessaire
      console.log('⚠️ Échec API publique, tentative avec route classique...');
      const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
      
      if (fallbackResponse.data && fallbackResponse.data.success) {
        console.log(`✅ ${fallbackResponse.data.data?.length || 0} souvenirs récupérés via route classique`);
        return fallbackResponse.data.data || [];
      }
    }
    
    console.warn('❌ Aucune donnée de souvenirs trouvée');
    return [];
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des souvenirs:', error);
    
    // En cas d'erreur, essayer le fallback
    try {
      const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
      
      if (fallbackResponse.data && fallbackResponse.data.success) {
        console.log(`✅ ${fallbackResponse.data.data?.length || 0} souvenirs récupérés via route de secours`);
        return fallbackResponse.data.data || [];
      }
    } catch (fallbackError) {
      console.error('❌ Échec également sur la route de secours:', fallbackError);
    }
    
    return [];
  }
},

  // Ajouter un souvenir
  addMemory: async (videoId, content) => {
    try {
      console.log(' Adding memory to video:', videoId);
      
      const response = await api.post(`/api/public/videos/${videoId}/memories`, {
        contenu: content
      });
      
      return response.data;
    } catch (error) {
      console.error(' Error adding memory:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/videos/${videoId}/memories`, {
          contenu: content
        });
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error(' Fallback for adding memory also failed:', fallbackError);
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

//   // Liker une vidéo
// // Ajouter cette fonction à videoAPI si elle n'existe pas
// likeMemory: async (memoryId) => {
//   try {
//     console.log('❤️ Tentative de like du souvenir:', memoryId);
    
//     const response = await api.post(`/api/public/memories/${memoryId}/like`);
    
//     if (response.data.success) {
//       console.log('✅ Like réussi');
//       return response.data;
//     } else {
//       console.warn('⚠️ Échec du like (erreur côté serveur)');
//       throw new Error(response.data.message || 'Erreur côté serveur');
//     }
//   } catch (error) {
//     console.error('❌ Erreur lors du like du souvenir:', error);
    
//     // Fallback: essayer l'ancienne route
//     try {
//       const fallbackResponse = await api.post(`/api/memories/${memoryId}/like`);
//       if (fallbackResponse.data.success) {
//         console.log('✅ Like réussi (via route fallback)');
//         return fallbackResponse.data;
//       }
//     } catch (fallbackError) {
//       console.error('❌ Fallback également échoué:', fallbackError);
//     }
    
//     throw error;
//   }
// },

  // Partager une vidéo
  shareVideo: async (videoId) => {
    try {
      console.log(' Sharing video:', videoId);
      
      const response = await api.post(`/api/public/videos/${videoId}/share`, {});
      
      return response.data;
    } catch (error) {
      console.error(' Error sharing video:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/videos/${videoId}/share`, {});
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error(' Fallback for sharing also failed:', fallbackError);
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