import api from './api';

// API pour les fonctionnalités de recherche
const searchAPI = {
  /**
   * Effectue une recherche globale sur tous les types de contenu
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} - Résultats de recherche
   */
  globalSearch: async (query, options = {}) => {
    try {
      const { page = 1, limit = 10, type = 'all' } = options;
      
      const response = await api.get('/api/search', {
        params: {
          query,
          page,
          limit,
          type
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche globale:', error);
      throw error;
    }
  },
  
  /**
   * Effectue une recherche spécifique de vidéos
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} - Résultats de recherche
   */
  searchVideos: async (query, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        genre = null, 
        decennie = null, 
        sort = 'relevance' 
      } = options;
      
      const params = {
        query,
        page,
        limit,
        sort
      };
      
      // Ajouter les paramètres optionnels uniquement s'ils sont définis
      if (genre) params.genre = genre;
      if (decennie) params.decennie = decennie;
      
      const response = await api.get('/api/search/videos', { params });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de vidéos:', error);
      throw error;
    }
  },
  
  /**
   * Effectue une recherche spécifique de playlists
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} - Résultats de recherche
   */
  searchPlaylists: async (query, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        sort = 'popularity' 
      } = options;
      
      const response = await api.get('/api/search/playlists', {
        params: {
          query,
          page,
          limit,
          sort
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de playlists:', error);
      throw error;
    }
  },
  
  /**
   * Effectue une recherche spécifique de podcasts
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} - Résultats de recherche
   */
  searchPodcasts: async (query, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        category = null, 
        sort = 'newest' 
      } = options;
      
      const params = {
        query,
        page,
        limit,
        sort
      };
      
      if (category) params.category = category;
      
      const response = await api.get('/api/search/podcasts', { params });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de podcasts:', error);
      throw error;
    }
  },
  
  /**
   * Effectue une recherche spécifique de livestreams
   * @param {string} query - Terme de recherche
   * @param {Object} options - Options de recherche
   * @returns {Promise<Object>} - Résultats de recherche
   */
  searchLivestreams: async (query, options = {}) => {
    try {
      const { 
        page = 1, 
        limit = 12, 
        status = 'all', 
        category = null 
      } = options;
      
      const params = {
        query,
        page,
        limit,
        status
      };
      
      if (category) params.category = category;
      
      const response = await api.get('/api/search/livestreams', { params });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la recherche de livestreams:', error);
      throw error;
    }
  },
  
  /**
   * Récupère les suggestions de recherche
   * @param {string} query - Terme de recherche
   * @param {number} limit - Nombre maximum de suggestions
   * @returns {Promise<Object>} - Suggestions de recherche
   */
  getSearchSuggestions: async (query, limit = 5) => {
    if (!query || query.length < 2) {
      return { success: true, data: [] };
    }
    
    try {
      const response = await api.get('/api/search/suggestions', {
        params: {
          query,
          limit
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      // En cas d'erreur, retourner un tableau vide pour éviter de bloquer l'interface
      return { success: false, data: [] };
    }
  }
};

export default searchAPI;