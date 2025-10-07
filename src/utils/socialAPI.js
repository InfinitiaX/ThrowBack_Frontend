// utils/socialAPI.js - API complète pour le module Throwback Wall (Users + Admin)
import api from './api';

const socialAPI = {
  // ========================================
  // POSTS - CRUD UTILISATEURS
  // ========================================

  /**
   * Récupérer tous les posts avec filtres
   * Supporte les filtres utilisateur ET admin
   */
  getAllPosts: async (params = {}) => {
    try {
      // Déterminer si c'est un appel admin ou utilisateur basé sur les paramètres
      const isAdminCall = params.isAdmin || 
                         params.hasReports !== undefined || 
                         params.status === 'moderated' || 
                         params.sortBy === 'most_reported';
      
      const endpoint = isAdminCall ? '/api/admin/posts' : '/api/posts';
      const response = await api.get(endpoint, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  },

  /**
   * Récupérer un post par ID
   * Utilise l'endpoint admin si disponible pour plus de détails
   */
  getPostById: async (postId, useAdminEndpoint = false) => {
    try {
      const endpoint = useAdminEndpoint ? `/api/admin/posts/${postId}` : `/api/posts/${postId}`;
      const response = await api.get(endpoint);
      return response.data;
    } catch (error) {
      console.error('Error fetching post:', error);
      throw error;
    }
  },

  /**
   * Créer un nouveau post
   */
  createPost: async (formData) => {
    try {
      const response = await api.post('/api/posts', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating post:', error);
      throw error;
    }
  },

  /**
   * Mettre à jour un post
   */
  updatePost: async (postId, data) => {
    try {
      const response = await api.put(`/api/posts/${postId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  },

  /**
   * Supprimer un post (utilisateur)
   */
  deletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  },

  /**
   * Supprimer un post (admin)
   */
  adminDeletePost: async (postId) => {
    try {
      const response = await api.delete(`/api/admin/posts/${postId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting post (admin):', error);
      throw error;
    }
  },

  /**
   * Liker/Unliker un post
   */
  likePost: async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  /**
   * Partager un post
   */
  sharePost: async (postId) => {
    try {
      const response = await api.post(`/api/posts/${postId}/share`);
      return response.data;
    } catch (error) {
      console.error('Error sharing post:', error);
      throw error;
    }
  },

  /**
   * Signaler un post
   */
  reportPost: async (postId, raison) => {
    try {
      const response = await api.post(`/api/posts/${postId}/report`, { raison });
      return response.data;
    } catch (error) {
      console.error('Error reporting post:', error);
      throw error;
    }
  },

  // ========================================
  // COMMENTAIRES
  // ========================================

  /**
   * Récupérer les commentaires d'un post
   */
  getPostComments: async (postId, params = {}) => {
    try {
      const response = await api.get(`/api/posts/${postId}/comments`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  },

  /**
   * Ajouter un commentaire
   */
  addComment: async (postId, data) => {
    try {
      const response = await api.post(`/api/posts/${postId}/comments`, data);
      return response.data;
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  /**
   * Récupérer les réponses d'un commentaire
   */
  getCommentReplies: async (commentId, params = {}) => {
    try {
      const response = await api.get(`/api/comments/${commentId}/replies`, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      throw error;
    }
  },

  /**
   * Répondre à un commentaire
   */
  replyToComment: async (commentId, contenu) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/reply`, { contenu });
      return response.data;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  },

  /**
   * Liker un commentaire
   */
  likeComment: async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/like`);
      return response.data;
    } catch (error) {
      console.error('Error liking comment:', error);
      throw error;
    }
  },

  /**
   * Disliker un commentaire
   */
  dislikeComment: async (commentId) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/dislike`);
      return response.data;
    } catch (error) {
      console.error('Error disliking comment:', error);
      throw error;
    }
  },

  /**
   * Modifier un commentaire
   */
  updateComment: async (commentId, data) => {
    try {
      const response = await api.put(`/api/comments/${commentId}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating comment:', error);
      throw error;
    }
  },

  /**
   * Supprimer un commentaire
   */
  deleteComment: async (commentId) => {
    try {
      const response = await api.delete(`/api/comments/${commentId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },

  /**
   * Signaler un commentaire
   */
  reportComment: async (commentId, raison) => {
    try {
      const response = await api.post(`/api/comments/${commentId}/report`, { raison });
      return response.data;
    } catch (error) {
      console.error('Error reporting comment:', error);
      throw error;
    }
  },

  // ========================================
  // ADMIN - MODÉRATION
  // ========================================

  /**
   * Récupérer les statistiques de modération
   */
  getModerationStats: async () => {
    try {
      const response = await api.get('/api/admin/posts/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching moderation stats:', error);
      throw error;
    }
  },

  /**
   * Modérer un post (ADMIN)
   */
  moderatePost: async (postId, raison) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/moderate`, {
        raison_moderation: raison
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating post:', error);
      throw error;
    }
  },

  /**
   * Restaurer un post modéré (ADMIN)
   */
  restorePost: async (postId) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring post:', error);
      throw error;
    }
  },

  /**
   * Actions en masse sur les posts (ADMIN) - Corrigée
   */
  bulkActionPosts: async (action, postIds, raison = '') => {
    try {
      const payload = {
        action,
        postIds,
        raison_moderation: raison
      };
      
      const response = await api.post('/api/admin/posts/bulk-action', payload);
      return response.data;
    } catch (error) {
      console.error('Error performing bulk action:', error);
      throw error;
    }
  },

  /**
   * Modérer plusieurs posts
   */
  moderateMultiplePosts: async (postIds, raison = 'Modération en masse') => {
    return socialAPI.bulkActionPosts('moderate', postIds, raison);
  },

  /**
   * Restaurer plusieurs posts
   */
  restoreMultiplePosts: async (postIds) => {
    return socialAPI.bulkActionPosts('restore', postIds);
  },

  /**
   * Supprimer plusieurs posts
   */
  deleteMultiplePosts: async (postIds) => {
    return socialAPI.bulkActionPosts('delete', postIds);
  },

  /**
   * Approuver plusieurs posts (alias pour restore)
   */
  approveMultiplePosts: async (postIds) => {
    return socialAPI.restoreMultiplePosts(postIds);
  },

  /**
   * Rejeter les signalements d'un post
   */
  dismissPostReports: async (postId) => {
    try {
      const response = await api.post(`/api/admin/posts/${postId}/dismiss-reports`);
      return response.data;
    } catch (error) {
      console.error('Error dismissing post reports:', error);
      throw error;
    }
  },

  /**
   * Modérer un commentaire (ADMIN)
   */
  moderateComment: async (postId, commentId, raison) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/comments/${commentId}/moderate`, {
        raison_moderation: raison
      });
      return response.data;
    } catch (error) {
      console.error('Error moderating comment:', error);
      throw error;
    }
  },

  /**
   * Restaurer un commentaire modéré (ADMIN)
   */
  restoreComment: async (postId, commentId) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/comments/${commentId}/restore`);
      return response.data;
    } catch (error) {
      console.error('Error restoring comment:', error);
      throw error;
    }
  },

  /**
   * Récupérer le résumé des signalements (ADMIN)
   */
  getReportsSummary: async () => {
    try {
      const response = await api.get('/api/admin/posts/reports/summary');
      return response.data;
    } catch (error) {
      console.error('Error fetching reports summary:', error);
      throw error;
    }
  },

  /**
   * Exporter les données des posts en CSV (ADMIN)
   */
  exportPostsCSV: async () => {
    try {
      const response = await api.get('/api/admin/posts/export/csv', {
        responseType: 'blob'
      });
      
      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `posts_export_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      return { success: true, message: 'Export CSV téléchargé avec succès' };
    } catch (error) {
      console.error('Error exporting posts CSV:', error);
      throw error;
    }
  },

  // ========================================
  // NOUVELLES FONCTIONNALITÉS MANQUANTES
  // ========================================

  /**
   * Rechercher des posts avec filtres avancés
   */
  searchPosts: async (searchQuery, filters = {}) => {
    try {
      const params = {
        search: searchQuery,
        ...filters
      };
      
      const response = await api.get('/api/posts/search', { params });
      return response.data;
    } catch (error) {
      console.error('Error searching posts:', error);
      throw error;
    }
  },

  /**
   * Récupérer les posts d'un utilisateur spécifique
   */
  getUserPosts: async (userId, params = {}) => {
    try {
      const queryParams = {
        userId,
        ...params
      };
      
      const response = await api.get('/api/posts', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching user posts:', error);
      throw error;
    }
  },

  /**
   * Récupérer les posts par hashtag
   */
  getPostsByHashtag: async (hashtag, params = {}) => {
    try {
      const queryParams = {
        hashtag,
        ...params
      };
      
      const response = await api.get('/api/posts', { params: queryParams });
      return response.data;
    } catch (error) {
      console.error('Error fetching posts by hashtag:', error);
      throw error;
    }
  },

  /**
   * Récupérer les posts tendances
   */
  getTrendingPosts: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/trending', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending posts:', error);
      throw error;
    }
  },

  /**
   * Récupérer le feed personnalisé
   */
  getPersonalizedFeed: async (params = {}) => {
    try {
      const response = await api.get('/api/posts/feed', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching personalized feed:', error);
      throw error;
    }
  },

  /**
   * Épingler/Désépingler un post (ADMIN)
   */
  togglePinPost: async (postId, pin = true) => {
    try {
      const response = await api.put(`/api/admin/posts/${postId}/pin`, { pin });
      return response.data;
    } catch (error) {
      console.error('Error toggling pin post:', error);
      throw error;
    }
  },

  /**
   * Récupérer les analytics d'un post (ADMIN)
   */
  getPostAnalytics: async (postId, timeRange = '7d') => {
    try {
      const response = await api.get(`/api/admin/posts/${postId}/analytics`, {
        params: { timeRange }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching post analytics:', error);
      throw error;
    }
  },

  /**
   * Récupérer les hashtags populaires
   */
  getPopularHashtags: async (limit = 10) => {
    try {
      const response = await api.get('/api/posts/hashtags/popular', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular hashtags:', error);
      throw error;
    }
  },

  // ========================================
  // HELPERS POUR LA GESTION D'ÉTAT
  // ========================================

  /**
   * Vérifier si l'utilisateur actuel est admin
   */
  isCurrentUserAdmin: () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Décoder le token JWT pour vérifier le rôle
      const payload = JSON.parse(atob(token.split('.')[1]));
      return ['admin', 'superadmin'].includes(payload.role);
    } catch (error) {
      return false;
    }
  },

  /**
   * Formater la réponse d'erreur API
   */
  formatApiError: (error) => {
    if (error.response) {
      // Erreur avec réponse du serveur
      return {
        status: error.response.status,
        message: error.response.data?.message || 'Une erreur est survenue',
        details: error.response.data
      };
    } else if (error.request) {
      // Erreur réseau
      return {
        status: 0,
        message: 'Erreur de connexion au serveur',
        details: null
      };
    } else {
      // Erreur de configuration
      return {
        status: -1,
        message: error.message || 'Erreur inconnue',
        details: null
      };
    }
  },

  /**
   * Cache simple pour optimiser les requêtes répétées
   */
  _cache: new Map(),
  
  /**
   * Récupérer avec cache
   */
  getCached: async (key, fetchFn, ttl = 5 * 60 * 1000) => {
    const cached = socialAPI._cache.get(key);
    
    if (cached && (Date.now() - cached.timestamp) < ttl) {
      return cached.data;
    }
    
    try {
      const data = await fetchFn();
      socialAPI._cache.set(key, {
        data,
        timestamp: Date.now()
      });
      return data;
    } catch (error) {
      // Si erreur et qu'on a une version en cache, la retourner
      if (cached) {
        console.warn('Using cached data due to API error:', error);
        return cached.data;
      }
      throw error;
    }
  },

  /**
   * Vider le cache
   */
  clearCache: () => {
    socialAPI._cache.clear();
  },

  /**
   * Invalider une clé de cache spécifique
   */
  invalidateCache: (key) => {
    socialAPI._cache.delete(key);
  },

  // ========================================
  // UTILITAIRES DE NOTIFICATION
  // ========================================

  /**
   * Afficher une notification de succès
   */
  showSuccessNotification: (message) => {
    // Intégration avec un système de notification (ex: react-toastify)
    console.log('SUCCESS:', message);
  },

  /**
   * Afficher une notification d'erreur
   */
  showErrorNotification: (message) => {
    // Intégration avec un système de notification (ex: react-toastify)
    console.error('ERROR:', message);
  },

  /**
   * Afficher une notification d'avertissement
   */
  showWarningNotification: (message) => {
    // Intégration avec un système de notification (ex: react-toastify)
    console.warn('WARNING:', message);
  }
};

export default socialAPI;