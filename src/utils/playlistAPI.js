import api from './api';

const playlistAPI = {
  // Récupérer toutes les playlists de l'utilisateur
  getUserPlaylists: async () => {
    try {
      console.log("Appel API: getUserPlaylists");
      const response = await api.get('/api/playlists/user');
      console.log("Réponse API getUserPlaylists:", response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists:', error);
      // Essayer avec une route alternative
      try {
        console.log("Tentative avec route alternative...");
        const fallbackResponse = await api.get('/api/playlists');
        console.log("Réponse alternative:", fallbackResponse.data);
        return fallbackResponse.data.data || [];
      } catch (fallbackError) {
        console.error('Erreur également avec la route alternative:', fallbackError);
        throw error;
      }
    }
  },

  // Récupérer les playlists populaires
  getPopularPlaylists: async (limit = 5) => {
    try {
      console.log(`Appel API: getPopularPlaylists (limit=${limit})`);
      const response = await api.get(`/api/playlists/popular?limit=${limit}`);
      console.log("Réponse API getPopularPlaylists:", response.data);
      return response.data.data || [];
    } catch (error) {
      console.error('Erreur lors de la récupération des playlists populaires:', error);
      // Fallback vers les playlists publiques
      try {
        console.log("Tentative avec route alternative...");
        const fallbackResponse = await api.get(`/api/public/playlists?limit=${limit}`);
        console.log("Réponse alternative:", fallbackResponse.data);
        return fallbackResponse.data.data || [];
      } catch (fallbackError) {
        console.error('Erreur également avec la route alternative:', fallbackError);
        return []; // Retourner un tableau vide plutôt que de propager l'erreur
      }
    }
  },

  // Récupérer les détails d'une playlist
  getPlaylistById: async (playlistId) => {
    try {
      console.log(`Appel API: getPlaylistById (id=${playlistId})`);
      const response = await api.get(`/api/playlists/${playlistId}`);
      console.log("Réponse API getPlaylistById:", response.data);
      return response.data.data || null;
    } catch (error) {
      console.error(`Erreur lors de la récupération de la playlist ${playlistId}:`, error);
      // Essayer avec une route alternative
      try {
        console.log("Tentative avec route alternative...");
        const fallbackResponse = await api.get(`/api/public/playlists/${playlistId}`);
        console.log("Réponse alternative:", fallbackResponse.data);
        return fallbackResponse.data.data || null;
      } catch (fallbackError) {
        console.error('Erreur également avec la route alternative:', fallbackError);
        throw error;
      }
    }
  },

  // Créer une nouvelle playlist
  createPlaylist: async (playlistData) => {
    try {
      console.log("Appel API: createPlaylist");
      console.log("Données envoyées:", playlistData);
      const response = await api.post('/api/playlists', playlistData);
      console.log("Réponse API createPlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la playlist:', error);
      throw error;
    }
  },

  // Mettre à jour une playlist existante
  updatePlaylist: async (playlistId, playlistData) => {
    try {
      console.log(`Appel API: updatePlaylist (id=${playlistId})`);
      console.log("Données envoyées:", playlistData);
      
      // Formater correctement les données des vidéos
      const formattedData = {
        ...playlistData,
        // Si les vidéos sont des objets complets, extraire seulement les IDs
        videos: playlistData.videos?.map((videoItem, index) => {
          // Si video est un objet complexe avec un _id
          if (typeof videoItem === 'object' && videoItem !== null) {
            const videoId = videoItem.videoId || videoItem._id;
            return {
              videoId: videoId,
              ordre: index + 1
            };
          }
          // Si c'est déjà un objet au format attendu
          else if (typeof videoItem === 'object' && videoItem.videoId) {
            return {
              ...videoItem,
              ordre: videoItem.ordre || index + 1
            };
          }
          // Si c'est juste l'ID sous forme de string
          else {
            return {
              videoId: videoItem,
              ordre: index + 1
            };
          }
        })
      };
      
      const response = await api.put(`/api/playlists/${playlistId}`, formattedData);
      console.log("Réponse API updatePlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la mise à jour de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Supprimer une playlist
  deletePlaylist: async (playlistId) => {
    try {
      console.log(`Appel API: deletePlaylist (id=${playlistId})`);
      const response = await api.delete(`/api/playlists/${playlistId}`);
      console.log("Réponse API deletePlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Ajouter une vidéo à la playlist
  addVideoToPlaylist: async (playlistId, videoId) => {
    try {
      console.log(`Appel API: addVideoToPlaylist (playlist=${playlistId}, video=${videoId})`);
      const response = await api.post(`/api/playlists/${playlistId}/videos`, { videoId });
      console.log("Réponse API addVideoToPlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de l'ajout de la vidéo à la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Supprimer une vidéo de la playlist
  removeVideoFromPlaylist: async (playlistId, videoId) => {
    try {
      console.log(`Appel API: removeVideoFromPlaylist (playlist=${playlistId}, video=${videoId})`);
      const response = await api.delete(`/api/playlists/${playlistId}/videos/${videoId}`);
      console.log("Réponse API removeVideoFromPlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la suppression de la vidéo de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Réorganiser l'ordre des vidéos dans une playlist
  reorderPlaylist: async (playlistId, videoOrders) => {
    try {
      console.log(`Appel API: reorderPlaylist (id=${playlistId})`);
      console.log("Données d'ordre:", videoOrders);
      const response = await api.put(`/api/playlists/${playlistId}/reorder`, { videoOrders });
      console.log("Réponse API reorderPlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors de la réorganisation de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

  // Ajouter/retirer une playlist des favoris
  // toggleFavorite: async (playlistId) => {
  //   try {
  //     console.log(`Appel API: toggleFavorite (id=${playlistId})`);
  //     const response = await api.post(`/api/playlists/${playlistId}/favorite`);
  //     console.log("Réponse API toggleFavorite:", response.data);
  //     return response.data;
  //   } catch (error) {
  //     console.error(`Erreur lors de la gestion des favoris pour la playlist ${playlistId}:`, error);
  //     throw error;
  //   }
  // },

  // Partager une playlist
  sharePlaylist: async (playlistId, shareData) => {
    try {
      console.log(`Appel API: sharePlaylist (id=${playlistId})`);
      console.log("Données de partage:", shareData);
      const response = await api.post(`/api/playlists/${playlistId}/share`, shareData);
      console.log("Réponse API sharePlaylist:", response.data);
      return response.data;
    } catch (error) {
      console.error(`Erreur lors du partage de la playlist ${playlistId}:`, error);
      throw error;
    }
  },

    // Incrémenter le nombre de vues d'une playlist
  incrementPlaylistViews: async (playlistId) => {
    try {
      const response = await api.post(`/api/playlists/${playlistId}/view`);
      return response.data;
    } catch (error) {
      console.error("Erreur lors de l'incrémentation des vues:", error);
      throw error;
    }
  },
  
  // Ajouter/retirer un like (même fonction que toggleFavorite)
  togglePlaylistLike: async (playlistId, isLiked) => {
    try {
      const response = await api.post(`/api/playlists/${playlistId}/like`, { isLiked });
      return response.data;
    } catch (error) {
      console.error("Erreur lors de la modification du like:", error);
      throw error;
    }
  }

};

export default playlistAPI;