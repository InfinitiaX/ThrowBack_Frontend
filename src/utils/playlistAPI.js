// utils/playlistAPI.js
import api from './api';

const playlistAPI = {
  // Récupérer toutes les playlists de l'utilisateur
  getUserPlaylists: async () => {
    try {
      const response = await api.get('/api/playlists/user');
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists:', error);
      throw error;
    }
  },

  // Récupérer les playlists populaires
  getPopularPlaylists: async (limit = 5) => {
    try {
      const response = await api.get(`/api/playlists/popular?limit=${limit}`);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists populaires:', error);
      throw error;
    }
  },

  // Récupérer les détails d'une playlist
  getPlaylistById: async (playlistId) => {
    try {
      const response = await api.get(`/api/playlists/${playlistId}`);
      return response.data.data || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Créer une nouvelle playlist
  createPlaylist: async (playlistData) => {
    try {
      const response = await api.post('/api/playlists', playlistData);
      return response.data.data || null;
    } catch (error) {
      console.error('Erreur lors de la création de la playlist:', error);
      throw error;
    }
  },

  // Mettre à jour une playlist existante
  updatePlaylist: async (playlistId, playlistData) => {
    try {
      const response = await api.put(`/api/playlists/${playlistId}`, playlistData);
      return response.data.data || null;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Supprimer une playlist
  deletePlaylist: async (playlistId) => {
    try {
      const response = await api.delete(`/api/playlists/${playlistId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Ajouter une vidéo à la playlist
  addVideoToPlaylist: async (playlistId, videoId) => {
    try {
      const response = await api.post(`/api/playlists/${playlistId}/videos`, { videoId });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout de la vidéo à la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Supprimer une vidéo de la playlist
  removeVideoFromPlaylist: async (playlistId, videoId) => {
    try {
      const response = await api.delete(`/api/playlists/${playlistId}/videos/${videoId}`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la vidéo de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Réorganiser l'ordre des vidéos dans une playlist
  reorderPlaylist: async (playlistId, videoOrders) => {
    try {
      const response = await api.put(`/api/playlists/${playlistId}/reorder`, { videoOrders });
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la réorganisation de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Ajouter/retirer une playlist des favoris
  toggleFavorite: async (playlistId) => {
    try {
      const response = await api.post(`/api/playlists/${playlistId}/favorite`);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la gestion des favoris pour la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Partager une playlist
  sharePlaylist: async (playlistId, shareData) => {
    try {
      const response = await api.post(`/api/playlists/${playlistId}/share`, shareData);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du partage de la playlist ${playlistId}:`, error);
      throw error;
    }
  }
};

export default playlistAPI;