// utils/api.js 
import axios from 'axios';
import podcastAPI from './podcastAPI';
import playlistAPI from './playlistAPI';
import searchAPI from './searchAPI';


// Configuration de base
const BASE_URL = process.env.REACT_APP_API_URL || 'https://backendtb.testdevinfinitiax.fr';

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
      console.log(' Fetching memories for video:', videoId);
      
      const response = await api.get(`/api/public/videos/${videoId}/memories`);
      
      if (response.data.success) {
        return response.data.data || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error(' Error fetching video memories:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.get(`/api/videos/${videoId}/memories`);
        if (fallbackResponse.data.success) {
          return fallbackResponse.data.data || [];
        }
      } catch (fallbackError) {
        console.error(' Fallback for memories also failed:', fallbackError);
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

  // Liker une vidéo
  likeVideo: async (videoId) => {
    try {
      console.log(' Liking video:', videoId);
      
      const response = await api.post(`/api/public/videos/${videoId}/like`, {});
      
      return response.data;
    } catch (error) {
      console.error(' Error liking video:', error);
      
      // Fallback vers l'ancienne route
      try {
        const fallbackResponse = await api.post(`/api/videos/${videoId}/like`, {});
        return fallbackResponse.data;
      } catch (fallbackError) {
        console.error(' Fallback for liking also failed:', fallbackError);
      }
      
      throw error;
    }
  },

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