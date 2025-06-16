// videoService.js - Service d'API pour les vidéos
import axios from 'axios';

// Configuration de base
const apiClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  },
  // Important: Délai de timeout augmenté pour éviter les erreurs de timeout
  timeout: 15000
});

// Intercepteur pour gérer le token d'authentification
apiClient.interceptors.request.use(
  (config) => {
    // Récupérer le token d'authentification du localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Erreur dans l\'intercepteur de requête:', error);
    return Promise.reject(error);
  }
);

// Intercepteur pour la gestion globale des erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Gérer les erreurs de réseau ou de timeout
    if (!error.response) {
      console.error('Erreur réseau ou timeout:', error.message);
      // Vous pouvez implémenter une logique de retry ici
    }
    // Gérer les erreurs d'authentification (401)
    else if (error.response.status === 401) {
      console.error('Erreur d\'authentification:', error.response.data);
      // Rediriger vers la page de login
      // window.location.href = '/login';
    }
    // Autres erreurs
    else {
      console.error('Erreur API:', error.response?.data || error.message);
    }
    
    return Promise.reject(error);
  }
);

// Service pour les vidéos
const videoService = {
  // Récupérer toutes les vidéos
  getVideos: async (params = {}) => {
    try {
      console.log('Requête getVideos avec paramètres:', params);
      const response = await apiClient.get('/videos', { params });
      console.log('Réponse getVideos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getVideos:', error);
      throw error;
    }
  },
  
  // Récupérer une vidéo par ID
  getVideoById: async (id) => {
    try {
      console.log('Requête getVideoById:', id);
      const response = await apiClient.get(`/videos/${id}`);
      console.log('Réponse getVideoById:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur getVideoById(${id}):`, error);
      throw error;
    }
  },
  
  // Récupérer les vidéos en tendance
  getTrendingVideos: async (params = {}) => {
    try {
      console.log('Requête getTrendingVideos avec paramètres:', params);
      const response = await apiClient.get('/public/videos/trending', { params });
      console.log('Réponse getTrendingVideos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getTrendingVideos:', error);
      throw error;
    }
  },
  
  // Récupérer les vidéos par genre
  getVideosByGenre: async (genre, params = {}) => {
    try {
      console.log(`Requête getVideosByGenre(${genre}) avec paramètres:`, params);
      const response = await apiClient.get(`/public/videos/genre/${genre}`, { params });
      console.log('Réponse getVideosByGenre:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur getVideosByGenre(${genre}):`, error);
      throw error;
    }
  },
  
  // Récupérer les vidéos par décennie
  getVideosByDecade: async (decade, params = {}) => {
    try {
      console.log(`Requête getVideosByDecade(${decade}) avec paramètres:`, params);
      const response = await apiClient.get(`/public/videos/decade/${decade}`, { params });
      console.log('Réponse getVideosByDecade:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur getVideosByDecade(${decade}):`, error);
      throw error;
    }
  },
  
  // Rechercher des vidéos
  searchVideos: async (query, params = {}) => {
    try {
      console.log(`Requête searchVideos(${query}) avec paramètres:`, params);
      const searchParams = { ...params, q: query };
      const response = await apiClient.get('/public/videos/search', { params: searchParams });
      console.log('Réponse searchVideos:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur searchVideos(${query}):`, error);
      throw error;
    }
  },
  
  // Liker une vidéo
  likeVideo: async (id) => {
    try {
      console.log(`Requête likeVideo(${id})`);
      const response = await apiClient.post(`/videos/${id}/like`);
      console.log('Réponse likeVideo:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur likeVideo(${id}):`, error);
      throw error;
    }
  },
  
  // Disliker une vidéo
  dislikeVideo: async (id) => {
    try {
      console.log(`Requête dislikeVideo(${id})`);
      const response = await apiClient.post(`/videos/${id}/dislike`);
      console.log('Réponse dislikeVideo:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur dislikeVideo(${id}):`, error);
      throw error;
    }
  },
  
  // Ajouter un commentaire à une vidéo
  addComment: async (videoId, content) => {
    try {
      console.log(`Requête addComment pour la vidéo ${videoId}`);
      const response = await apiClient.post(`/public/videos/${videoId}/comments`, { content });
      console.log('Réponse addComment:', response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur addComment(${videoId}):`, error);
      throw error;
    }
  },
  
  // Récupérer les vidéos favorites de l'utilisateur
  getFavoriteVideos: async (params = {}) => {
    try {
      console.log('Requête getFavoriteVideos avec paramètres:', params);
      const response = await apiClient.get('/videos/my-favorites', { params });
      console.log('Réponse getFavoriteVideos:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getFavoriteVideos:', error);
      throw error;
    }
  },
  
  // Récupérer l'historique de visionnage de l'utilisateur
  getWatchHistory: async (params = {}) => {
    try {
      console.log('Requête getWatchHistory avec paramètres:', params);
      const response = await apiClient.get('/videos/my-history', { params });
      console.log('Réponse getWatchHistory:', response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur getWatchHistory:', error);
      throw error;
    }
  }
};

export default videoService;