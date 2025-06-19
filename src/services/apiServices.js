// services/apiServices.js
import axios from 'axios';

// Configuration d'Axios avec des headers communs
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Service d'API pour les vidéos
export const videoService = {
  // Récupérer toutes les vidéos avec filtres
  getVideos: async (params = {}) => {
    try {
      const response = await api.get('/videos', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching videos:', error);
      throw error;
    }
  },

  // Récupérer une vidéo par son ID
  getVideoById: async (id) => {
    try {
      const response = await api.get(`/videos/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching video ${id}:`, error);
      throw error;
    }
  },

  // Aimer une vidéo
  likeVideo: async (id) => {
    try {
      const response = await api.post(`/videos/${id}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking video ${id}:`, error);
      throw error;
    }
  },

  // Ne pas aimer une vidéo
  dislikeVideo: async (id) => {
    try {
      const response = await api.post(`/videos/${id}/dislike`);
      return response.data;
    } catch (error) {
      console.error(`Error disliking video ${id}:`, error);
      throw error;
    }
  },

  // Récupérer les vidéos tendance
  getTrendingVideos: async (params = {}) => {
    try {
      const response = await api.get('/videos/trending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending videos:', error);
      throw error;
    }
  },

  // Rechercher des vidéos
  searchVideos: async (query, params = {}) => {
    try {
      const response = await api.get('/videos/search', { 
        params: { q: query, ...params } 
      });
      return response.data;
    } catch (error) {
      console.error('Error searching videos:', error);
      throw error;
    }
  }
};

// Service d'API pour les souvenirs (commentaires)
export const memoryService = {
  // Récupérer les souvenirs d'une vidéo
  getVideoMemories: async (videoId, params = {}) => {
    try {
      const response = await api.get(`/videos/${videoId}/memories`, { params });
      return response.data;
    } catch (error) {
      console.error(`Error fetching memories for video ${videoId}:`, error);
      throw error;
    }
  },

  // Ajouter un souvenir à une vidéo
  addMemory: async (videoId, contenu) => {
    try {
      const response = await api.post(`/videos/${videoId}/memories`, { contenu });
      return response.data;
    } catch (error) {
      console.error(`Error adding memory to video ${videoId}:`, error);
      throw error;
    }
  },

  // Supprimer un souvenir
  deleteMemory: async (memoryId) => {
    try {
      const response = await api.delete(`/memories/${memoryId}`);
      return response.data;
    } catch (error) {
      console.error(`Error deleting memory ${memoryId}:`, error);
      throw error;
    }
  },

  // Aimer un souvenir
  likeMemory: async (memoryId) => {
    try {
      const response = await api.post(`/memories/${memoryId}/like`);
      return response.data;
    } catch (error) {
      console.error(`Error liking memory ${memoryId}:`, error);
      throw error;
    }
  },

  // Signaler un souvenir
  reportMemory: async (memoryId, raison) => {
    try {
      const response = await api.post(`/memories/${memoryId}/report`, { raison });
      return response.data;
    } catch (error) {
      console.error(`Error reporting memory ${memoryId}:`, error);
      throw error;
    }
  }
};

// Service d'API pour les playlists
export const playlistService = {
  // Récupérer toutes les playlists de l'utilisateur
  getUserPlaylists: async () => {
    try {
      const response = await api.get('/playlists/user');
      return response.data;
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      throw error;
    }
  },

  // Créer une nouvelle playlist
  createPlaylist: async (playlistData) => {
    try {
      const response = await api.post('/playlists', playlistData);
      return response.data;
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  // Récupérer les détails d'une playlist
  getPlaylistById: async (id) => {
    try {
      const response = await api.get(`/playlists/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching playlist ${id}:`, error);
      throw error;
    }
  },

  // Ajouter une vidéo à une playlist
  addVideoToPlaylist: async (playlistId, videoId) => {
    try {
      const response = await api.post(`/playlists/${playlistId}/videos`, { videoId });
      return response.data;
    } catch (error) {
      console.error(`Error adding video to playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Supprimer une vidéo d'une playlist
  removeVideoFromPlaylist: async (playlistId, videoId) => {
    try {
      const response = await api.delete(`/playlists/${playlistId}/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing video from playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Mettre une playlist en favori
  toggleFavorite: async (playlistId) => {
    try {
      const response = await api.post(`/playlists/${playlistId}/favorite`);
      return response.data;
    } catch (error) {
      console.error(`Error toggling favorite for playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Récupérer les playlists populaires
  getPopularPlaylists: async (params = {}) => {
    try {
      const response = await api.get('/playlists/popular', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular playlists:', error);
      throw error;
    }
  }
};

export default {
  videoService,
  memoryService,
  playlistService
};