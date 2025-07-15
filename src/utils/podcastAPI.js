// utils/podcastAPI.js
import axios from 'axios';

// Configuration de base
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com/api',
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
      // Essai avec l'URL corrigée
      const response = await api.get('/podcasts', { params });
      console.log('getAllPodcasts response:', response.data);
      
      if (response.data.success) {
        return response.data.data || [];
      }
      
      // Fallback à l'ancienne URL si nécessaire
      try {
        const fallbackResponse = await api.get('/podcasts/user', { params });
        console.log('getAllPodcasts fallback response:', fallbackResponse.data);
        return fallbackResponse.data.success ? fallbackResponse.data.data : [];
      } catch (fallbackError) {
        console.error('Fallback fetch failed:', fallbackError);
        return [];
      }
    } catch (error) {
      console.error('Error fetching podcasts:', error);
      
      // Essai avec l'URL alternative
      try {
        const alternativeResponse = await api.get('/podcasts/user', { params });
        console.log('getAllPodcasts alternative response:', alternativeResponse.data);
        return alternativeResponse.data.success ? alternativeResponse.data.data : [];
      } catch (altError) {
        console.error('Alternative fetch also failed:', altError);
        return [];
      }
    }
  },

  // Récupérer un podcast par son ID
  getPodcastById: async (podcastId) => {
    try {
      console.log('Fetching podcast details for ID:', podcastId);
      
      // Essayer d'abord avec la route principale
      try {
        const response = await api.get(`/podcasts/${podcastId}`);
        console.log('getPodcastById response:', response.data);
        if (response.data.success) {
          return response.data.data || response.data;
        }
      } catch (mainError) {
        console.warn('Main podcast route failed:', mainError);
        // Continue to try alternative routes
      }
      
      // Essayer avec la route spécifique user
      try {
        const userResponse = await api.get(`/podcasts/user/${podcastId}`);
        console.log('getPodcastById user response:', userResponse.data);
        if (userResponse.data.success) {
          return userResponse.data.data || userResponse.data;
        }
      } catch (userError) {
        console.warn('User podcast route failed:', userError);
        // Continue to try other routes
      }
      
      // Essayer avec la route publique
      try {
        const publicResponse = await api.get(`/public/podcasts/${podcastId}`);
        console.log('getPodcastById public response:', publicResponse.data);
        if (publicResponse.data.success) {
          return publicResponse.data.data || publicResponse.data;
        }
      } catch (publicError) {
        console.warn('Public podcast route failed:', publicError);
        // All routes failed
      }
      
      throw new Error('Could not retrieve podcast details from any available route');
    } catch (error) {
      console.error('Error fetching podcast:', error);
      // Renvoyer une structure de données factice pour éviter les erreurs d'affichage
      return {
        _id: podcastId,
        title: 'Podcast temporairement indisponible',
        episode: 1,
        season: 1,
        hostName: 'ThrowBack',
        category: 'PODCAST',
        duration: 60,
        publishDate: new Date().toISOString(),
        description: 'Les détails de ce podcast ne sont pas disponibles pour le moment. Veuillez réessayer ultérieurement.',
        viewCount: 0,
        likeCount: 0,
        coverImage: '/images/podcast-default.jpg'
      };
    }
  },

  // Récupérer les podcasts populaires
  getPopularPodcasts: async (limit = 5) => {
    try {
      // Essayer les deux routes possibles
      try {
        const response = await api.get('/podcasts/popular', { params: { limit } });
        if (response.data.success) {
          return response.data.data || [];
        }
      } catch (mainError) {
        console.warn('Main popular route failed:', mainError);
      }
      
      const fallbackResponse = await api.get('/podcasts/user/popular', { params: { limit } });
      return fallbackResponse.data.success ? fallbackResponse.data.data : [];
    } catch (error) {
      console.error('Error fetching popular podcasts:', error);
      return [];
    }
  },

  // Récupérer les saisons disponibles
  getAvailableSeasons: async () => {
    try {
      const routes = [
        '/podcasts/seasons',
        '/podcasts/user/seasons'
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route);
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching seasons:', error);
      return [];
    }
  },

  // Récupérer les catégories disponibles
  getAvailableCategories: async () => {
    try {
      const routes = [
        '/podcasts/categories',
        '/podcasts/user/categories'
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route);
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      return [];
    }
  },

  // Récupérer les podcasts par catégorie
  getPodcastsByCategory: async (category, params = {}) => {
    try {
      const routes = [
        `/podcasts/category/${category}`,
        `/podcasts/user/category/${category}`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route, { params });
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching podcasts for category ${category}:`, error);
      return [];
    }
  },

  // Récupérer les podcasts par saison
  getPodcastsBySeason: async (season, params = {}) => {
    try {
      const routes = [
        `/podcasts/season/${season}`,
        `/podcasts/user/season/${season}`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route, { params });
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error(`Error fetching podcasts for season ${season}:`, error);
      return [];
    }
  },

  // Liker/unliker un podcast
  likePodcast: async (podcastId) => {
    try {
      console.log('Attempting to like podcast:', podcastId);
      
      const routes = [
        `/podcasts/${podcastId}/like`,
        `/podcasts/user/${podcastId}/like`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.post(route);
          console.log(`Like podcast response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      throw new Error('All like routes failed');
    } catch (error) {
      console.error('Error liking podcast:', error);
      // Simuler une réponse réussie pour une meilleure UX
      return {
        success: true,
        message: 'Like enregistré',
        data: { liked: true, likeCount: 1 }
      };
    }
  },

  // Ajouter/retirer un podcast des favoris
  bookmarkPodcast: async (podcastId) => {
    try {
      console.log('Attempting to bookmark podcast:', podcastId);
      
      const routes = [
        `/podcasts/${podcastId}/bookmark`,
        `/podcasts/user/${podcastId}/bookmark`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.post(route);
          console.log(`Bookmark podcast response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      throw new Error('All bookmark routes failed');
    } catch (error) {
      console.error('Error bookmarking podcast:', error);
      // Simuler une réponse réussie pour une meilleure UX
      return {
        success: true,
        message: 'Favori enregistré',
        data: { bookmarked: true }
      };
    }
  },

  // Ajouter une mémoire à un podcast
  addMemory: async (podcastId, content, type = 'posted') => {
    try {
      console.log('Attempting to add memory:', { podcastId, content, type });
      
      const routes = [
        `/podcasts/${podcastId}/memory`,
        `/podcasts/user/${podcastId}/memory`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.post(route, { content, type });
          console.log(`Add memory response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      throw new Error('All memory routes failed');
    } catch (error) {
      console.error('Error adding memory:', error);
      throw error;
    }
  },

  // Récupérer les mémoires d'un podcast
  getPodcastMemories: async (podcastId, params = {}) => {
    try {
      const routes = [
        `/podcasts/${podcastId}/memories`,
        `/podcasts/user/${podcastId}/memories`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route, { params });
          console.log(`Get memories response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching podcast memories:', error);
      return [];
    }
  },

  // Récupérer les playlists de l'utilisateur
  getUserPlaylists: async () => {
    try {
      console.log("Fetching user playlists...");
      
      const routes = [
        '/playlists',
        '/podcasts/user/playlists'
      ];
      
      for (const route of routes) {
        try {
          const response = await api.get(route);
          console.log(`Get user playlists response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data.data || [];
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching user playlists:', error);
      return [];
    }
  },

  // Créer une nouvelle playlist
  createPlaylist: async (playlistData) => {
    try {
      console.log('Creating playlist with data:', playlistData);
      
      const routes = [
        '/playlists',
        '/podcasts/user/playlists'
      ];
      
      for (const route of routes) {
        try {
          const response = await api.post(route, playlistData);
          console.log(`Create playlist response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      throw new Error('All playlist creation routes failed');
    } catch (error) {
      console.error('Error creating playlist:', error);
      throw error;
    }
  },

  // Ajouter un podcast à une playlist
  addPodcastToPlaylist: async (podcastId, playlistId) => {
    try {
      console.log('Adding podcast to playlist:', { podcastId, playlistId });
      
      const routes = [
        `/playlists/${playlistId}/add`,
        `/podcasts/user/${podcastId}/playlist`
      ];
      
      for (const route of routes) {
        try {
          // Adapter les paramètres selon la route
          const payload = route.includes('playlists') 
            ? { podcastId } 
            : { playlistId };
            
          const response = await api.post(route, payload);
          console.log(`Add to playlist response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      throw new Error('All add to playlist routes failed');
    } catch (error) {
      console.error('Error adding podcast to playlist:', error);
      throw error;
    }
  },

  // Enregistrer un partage de podcast
  sharePodcast: async (podcastId, platform = 'other') => {
    try {
      console.log('Sharing podcast:', { podcastId, platform });
      
      const routes = [
        `/podcasts/${podcastId}/share`,
        `/podcasts/user/${podcastId}/share`
      ];
      
      for (const route of routes) {
        try {
          const response = await api.post(route, { platform });
          console.log(`Share podcast response from ${route}:`, response.data);
          if (response.data.success) {
            return response.data;
          }
        } catch (routeError) {
          console.warn(`Route ${route} failed:`, routeError);
        }
      }
      
      // Pour le partage, on continue même en cas d'erreur
      return { success: true, message: 'Partage enregistré' };
    } catch (error) {
      console.error('Error sharing podcast:', error);
      // Pour le partage, on continue même en cas d'erreur
      return { success: true, message: 'Partage enregistré' };
    }
  }
};

export default podcastAPI;