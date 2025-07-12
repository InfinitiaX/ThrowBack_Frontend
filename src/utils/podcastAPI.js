// utils/podcastAPI.js
import axios from 'axios';

// Configuration de base
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Intercepteur pour ajouter le token d'authentification si disponible
api.interceptors.request.use(config => {
  const token = localStorage.getItem('authToken') || localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, error => {
  return Promise.reject(error);
});

// Intercepteur pour gérer les erreurs côté serveur
api.interceptors.response.use(
  response => response,
  error => {
    // Log détaillé des erreurs pour le débogage
    if (error.response) {
      console.error('API Error Response:', error.response.status, error.response.data);
    } else if (error.request) {
      console.error('API Request Error (No Response):', error.request);
    } else {
      console.error('API Error Setup:', error.message);
    }
    return Promise.reject(error);
  }
);

// API pour les podcasts
const podcastAPI = {
  // Récupérer tous les podcasts (avec pagination et filtres)
  getAllPodcasts: async (params = {}) => {
    try {
      const response = await api.get('/podcasts/user', { params });
      console.log('getAllPodcasts response:', response.data);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      return [];
    }
  },

  // Récupérer un podcast par son ID
  getPodcastById: async (podcastId) => {
    try {
      const response = await api.get(`/podcasts/user/${podcastId}`);
      console.log('getPodcastById response:', response.data);
      return response.data.success ? response.data.data : null;
    } catch (error) {
      console.error('Error fetching podcast:', error);
      throw error;
    }
  },

  // Récupérer les podcasts populaires
  getPopularPodcasts: async (limit = 5) => {
    try {
      const response = await api.get('/podcasts/user/popular', { params: { limit } });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching popular podcasts:', error);
      return [];
    }
  },

  // Récupérer les saisons disponibles
  getAvailableSeasons: async () => {
    try {
      const response = await api.get('/podcasts/user/seasons');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching seasons:', error);
      return [];
    }
  },

  // Récupérer les catégories disponibles
  getAvailableCategories: async () => {
    try {
      const response = await api.get('/podcasts/user/categories');
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Récupérer les podcasts par catégorie
  getPodcastsByCategory: async (category, params = {}) => {
    try {
      const response = await api.get(`/podcasts/user/category/${category}`, { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error(`Error fetching podcasts for category ${category}:`, error);
      return [];
    }
  },

  // Récupérer les podcasts par saison
  getPodcastsBySeason: async (season, params = {}) => {
    try {
      const response = await api.get(`/podcasts/user/season/${season}`, { params });
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error(`Error fetching podcasts for season ${season}:`, error);
      return [];
    }
  },

  // Liker/unliker un podcast
  likePodcast: async (podcastId) => {
    try {
      console.log('Attempting to like podcast:', podcastId);
      const response = await api.post(`/podcasts/user/${podcastId}/like`);
      console.log('Like podcast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error liking podcast:', error);
      throw error;
    }
  },

  // Ajouter/retirer un podcast des favoris
  bookmarkPodcast: async (podcastId) => {
    try {
      console.log('Attempting to bookmark podcast:', podcastId);
      const response = await api.post(`/podcasts/user/${podcastId}/bookmark`);
      console.log('Bookmark podcast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error bookmarking podcast:', error);
      throw error;
    }
  },

  // Ajouter une mémoire à un podcast
  addMemory: async (podcastId, content, type = 'posted') => {
    try {
      console.log('Attempting to add memory:', { podcastId, content, type });
      const response = await api.post(`/podcasts/user/${podcastId}/memory`, { 
        content,
        type 
      });
      console.log('Add memory response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  },

  // Récupérer les mémoires d'un podcast
  getPodcastMemories: async (podcastId, params = {}) => {
    try {
      const response = await api.get(`/podcasts/user/${podcastId}/memories`, { params });
      console.log('Get memories response:', response.data);
      return response.data.success ? response.data.data : [];
    } catch (error) {
      console.error('Error fetching podcast memories:', error);
      return [];
    }
  },

  // Créer une nouvelle playlist
  createPlaylist: async (playlistData) => {
    try {
      console.log('Creating playlist with data:', playlistData);
      const response = await api.post('/podcasts/user/playlists', playlistData);
      console.log('Create playlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

// Fonction à corriger dans utils/podcastAPI.js

// Récupérer les playlists de l'utilisateur
getUserPlaylists: async () => {
  try {
    console.log("Fetching user playlists...");
    // Notez l'URL corrigée avec /podcasts/user/playlists (et non /playlists)
    const response = await api.get('/podcasts/user/playlists');
    console.log('Get user playlists response:', response.data);
    
    if (response.data.success) {
      return response.data.data || [];
    } else {
      console.warn("API returned success:false for playlists", response.data);
      return [];
    }
  } catch (error) {
    console.error('Error fetching user playlists:', error);
    // Vérifier s'il s'agit d'une erreur 404, ce qui pourrait indiquer un problème de route
    if (error.response && error.response.status === 404) {
      console.error('Route not found. Check if /podcasts/user/playlists exists on the server');
    }
    return [];
  }
},

// Créer une nouvelle playlist
createPlaylist: async (playlistData) => {
  try {
    console.log('Creating playlist with data:', playlistData);
    // Notez l'URL corrigée
    const response = await api.post('/podcasts/user/playlists', playlistData);
    console.log('Create playlist response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error creating playlist:', error);
    // Vérifier s'il s'agit d'une erreur 404, ce qui pourrait indiquer un problème de route
    if (error.response && error.response.status === 404) {
      console.error('Route not found. Check if /podcasts/user/playlists exists on the server');
    }
    throw error;
  }
},

  // Ajouter un podcast à une playlist
  addPodcastToPlaylist: async (podcastId, playlistId) => {
    try {
      console.log('Adding podcast to playlist:', { podcastId, playlistId });
      const response = await api.post(`/podcasts/user/${podcastId}/playlist`, { 
        playlistId 
      });
      console.log('Add to playlist response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding podcast to playlist:', error);
      throw error;
    }
  },

  // Enregistrer un partage de podcast
  sharePodcast: async (podcastId, platform = 'other') => {
    try {
      console.log('Sharing podcast:', { podcastId, platform });
      const response = await api.post(`/podcasts/user/${podcastId}/share`, { 
        platform 
      });
      console.log('Share podcast response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sharing podcast:', error);
      // Pour le partage, on continue même en cas d'erreur
      return { success: true, message: 'Partage enregistré' };
    }
  }
};

export default podcastAPI;