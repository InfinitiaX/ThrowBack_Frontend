// src/utils/adminAPI.js
import api from './api';

// Export par défaut + compatible avec tes appels existants
const adminAPI = {
  // ----- COMMENTS -----
  getComments: async (filters = {}) => {
    const { data } = await api.get('/api/admin/comments', { params: filters });
    return data;
  },

  getCommentsStats: async () => {
    const { data } = await api.get('/api/admin/comments/stats');
    return data;
  },

  moderateComment: async (commentId, action, reason = '') => {
    const { data } = await api.put(`/api/admin/comments/${commentId}/moderate`, { action, reason });
    return data;
  },

  bulkModerateComments: async (commentIds, action, reason = '') => {
    const { data } = await api.put('/api/admin/comments/bulk-moderate', { commentIds, action, reason });
    return data;
  },

  // ➕ Répondre à un commentaire (utilisé par Comments.jsx / ReplyModal.jsx)
  replyToComment: async (commentId, content) => {
    // adapte l’URL si ton backend utilise un autre chemin
    const { data } = await api.post(`/api/admin/comments/${commentId}/reply`, { content });
    return data;
  },

  // ----- LIKES -----
  getLikes: async ({ params }) => {
    const { data } = await api.get('/api/admin/likes', { params });
    return data;
  },

  getLikesStats: async () => {
    const { data } = await api.get('/api/admin/likes/stats');
    return data;
  },

  getLikeDetails: async (id) => {
    const { data } = await api.get(`/api/admin/likes/${id}`);
    return data;
  },

  deleteLike: async (id) => {
    const { data } = await api.delete(`/api/admin/likes/${id}`);
    return data;
  },

  bulkDeleteLikes: async ({ likeIds }) => {
    const { data } = await api.delete('/api/admin/likes/bulk', { data: { likeIds } });
    return data;
  },
};

export default adminAPI;
// (optionnel) export nommé si tu en as besoin ailleurs
export { adminAPI };
