// utils/searchAPI.js
import api from './api';

/**
 * Client de recherche
 * Toutes les méthodes renvoient la réponse axios.data
 */
const searchAPI = {
  /**
   * Recherche globale
   * @param {string} query
   * @param {Object} options { page=1, limit=10, type='all' }
   */
  globalSearch: async (query, options = {}) => {
    const { page = 1, limit = 10, type = 'all' } = options;
    const lim = Number(limit) || 10;

    const response = await api.get('/api/search', {
      params: { query, page, limit: lim, type },
    });
    return response.data;
  },

  /**
   * Recherche vidéos
   * @param {string} query
   * @param {Object} options { page=1, limit=12, genre, decennie, sort='relevance' }
   */
  searchVideos: async (query, options = {}) => {
    const {
      page = 1,
      limit = 12,
      genre = null,
      decennie = null,
      sort = 'relevance',
    } = options;
    const lim = Number(limit) || 12;

    const response = await api.get('/api/search/videos', {
      params: { query, page, limit: lim, genre, decennie, sort },
    });
    return response.data;
  },

  /**
   * Recherche playlists
   * @param {string} query
   * @param {Object} options { page=1, limit=12, sort='popularity' }
   */
  searchPlaylists: async (query, options = {}) => {
    const { page = 1, limit = 12, sort = 'popularity' } = options;
    const lim = Number(limit) || 12;

    const response = await api.get('/api/search/playlists', {
      params: { query, page, limit: lim, sort },
    });
    return response.data;
  },

  /**
   * Recherche podcasts
   * @param {string} query
   * @param {Object} options { page=1, limit=12, category, sort='newest' }
   */
  searchPodcasts: async (query, options = {}) => {
    const { page = 1, limit = 12, category = null, sort = 'newest' } = options;
    const lim = Number(limit) || 12;

    const response = await api.get('/api/search/podcasts', {
      params: { query, page, limit: lim, category, sort },
    });
    return response.data;
  },

  /**
   * Recherche livestreams
   * @param {string} query
   * @param {Object} options { page=1, limit=12, status='all', category }
   */
  searchLivestreams: async (query, options = {}) => {
    const { page = 1, limit = 12, status = 'all', category = null } = options;
    const lim = Number(limit) || 12;

    const response = await api.get('/api/search/livestreams', {
      params: { query, page, limit: lim, status, category },
    });
    return response.data;
  },

  /**
   * Suggestions d'auto-complétion
   * @param {string} query
   * @param {number} limit = 8
   * @returns {Promise<{success:boolean, data:Array}>}
   */
  getSearchSuggestions: async (query, limit = 8) => {
    try {
      const lim = Number(limit) || 8;
      const response = await api.get('/api/search/suggestions', {
        params: { query, limit: lim },
      });
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des suggestions:', error);
      return { success: false, data: [] };
    }
  },
};

export default searchAPI;
