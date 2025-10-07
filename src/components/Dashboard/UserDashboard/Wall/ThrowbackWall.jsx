// pages/ThrowbackWall.jsx
import React, { useState, useEffect, useCallback } from 'react';
import PostList from './PostList';
import CreatePostForm from './CreatePostForm';
import WallSidebar from './WallSidebar';
import ErrorBoundary from '../../../Common/ErrorBoundary';
import { useAuth } from '../../../../contexts/AuthContext';
import socialAPI from '../../../../utils/socialAPI';
import styles from './ThrowbackWall.module.css';

const ThrowbackWall = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [currentFilter, setCurrentFilter] = useState('all'); // all, trending, personal
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { user, isAuthenticated, token, loadUser } = useAuth();

  // Fonction pour extraire l'ID utilisateur de manière sécurisée
  const getUserId = useCallback(() => {
    if (!user) return null;
    
    // Vérifier toutes les propriétés possibles où l'ID pourrait se trouver
    if (typeof user === 'string') return user;
    
    // Option 1: ID direct au premier niveau
    if (user.id) return user.id;
    if (user._id) return user._id;
    
    // Option 2: ID dans un sous-objet (userData)
    if (user.userData && typeof user.userData === 'object') {
      if (user.userData.id) return user.userData.id;
      if (user.userData._id) return user.userData._id;
    }
    
    // Option 3: Extraction d'autres champs potentiels contenant l'ID
    if (user.userId) return user.userId;
    if (user.user_id) return user.user_id;
    
    // Option 4: Recherche dans toutes les clés de l'objet utilisateur
    for (const key in user) {
      if ((key.toLowerCase().includes('id') || key === '_id') && 
          typeof user[key] === 'string' && 
          user[key].length > 8) {
        return user[key];
      }
    }
    
    // Journaliser l'objet utilisateur pour débogage
    console.log("Structure de l'objet utilisateur:", JSON.stringify(user, null, 2));
    
    return null;
  }, [user]);

  // Fonction améliorée pour récupérer les posts avec une meilleure gestion des erreurs
  const fetchPosts = useCallback(async (page = 1, filter = 'all') => {
    try {
      setLoading(true);
      setError(null);
      
      // Vérifier l'authentification pour le filtre personnel
      if (filter === 'personal') {
        if (!isAuthenticated || !token) {
          console.log('Utilisateur non authentifié, basculement vers tous les posts');
          setCurrentFilter('all');
          filter = 'all'; // Forcer le filtre à 'all'
        } else if (!user) {
          // Essayer de recharger l'utilisateur
          try {
            await loadUser();
          } catch (err) {
            console.error("Impossible de charger les données utilisateur:", err);
          }
          
          // Si toujours pas d'utilisateur, basculer vers 'all'
          if (!user) {
            console.log('Objet utilisateur non disponible, basculement vers tous les posts');
            setCurrentFilter('all');
            filter = 'all'; // Forcer le filtre à 'all'
          }
        }
      }
      
      // Construire les paramètres de requête
      let params = { page, limit: 10 };
      
      // Extraction sécurisée de l'ID utilisateur pour le filtre personnel
      if (filter === 'personal') {
        const userId = getUserId();
        
        if (!userId) {
          console.warn('ID utilisateur introuvable', user);
          throw new Error('Unable to identify your user account');
        }
        
        params.auteur = userId;
        console.log(`Filtrage des posts par utilisateur: ${userId}`);
      }
      
      console.log('Paramètres de requête:', params);
      
      // Utiliser socialAPI au lieu de api directement
      const response = await socialAPI.getAllPosts(params);
      
      // Vérification des résultats
      const newPosts = response.data || (Array.isArray(response) ? response : []);
      console.log(`Posts reçus: ${newPosts.length}`);
      
      const pagination = response.pagination || {
        page: page,
        totalPages: Math.ceil(newPosts.length / 10),
        total: newPosts.length
      };
      
      // Si c'est la première page, remplacer les posts
      // Sinon, ajouter les nouveaux posts à la liste existante
      if (page === 1) {
        setPosts(newPosts);
      } else {
        setPosts(prevPosts => [...prevPosts, ...newPosts]);
      }
      
      // Vérifier s'il y a plus de pages à charger
      setHasMore(pagination.page < pagination.totalPages);
      setCurrentPage(pagination.page);
    } catch (err) {
      console.error('Erreur lors du chargement des posts:', err);
      
      // Message d'erreur spécifique selon le type d'erreur
      if (err.response?.status === 401) {
        setError('Your session has expired. Please sign in again.');
      } else if (err.message.includes('identify your user account')) {
        setError(err.message);
      } else {
        setError('Unable to load posts. Please try again later.');
      }
      
      // Initialiser un tableau vide en cas d'erreur sur la première page
      if (page === 1) {
        setPosts([]);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, token, user, loadUser, getUserId]);

  // Recharger les posts lorsque le contexte d'authentification change
  useEffect(() => {
    fetchPosts(1, currentFilter);
  }, [currentFilter, refreshTrigger, isAuthenticated, fetchPosts]);

  // Fonction pour charger plus de posts
  const loadMore = () => {
    if (!loading && hasMore) {
      fetchPosts(currentPage + 1, currentFilter);
    }
  };

  // Fonction pour rafraîchir les posts
  const refreshPosts = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Fonction pour changer le filtre avec vérification d'authentification
  const changeFilter = (filter) => {
    // Si on essaie de passer au filtre personnel sans être authentifié
    if (filter === 'personal' && (!isAuthenticated || !token)) {
      console.log('Tentative de filtrage personnel sans authentification');
      alert('Please sign in to view your personal posts');
      return;
    }
    
    // Si on essaie de passer au filtre personnel sans pouvoir identifier l'utilisateur
    if (filter === 'personal' && !getUserId()) {
      console.log('Tentative de filtrage personnel sans ID utilisateur');
      alert('Your user profile is incomplete. Please sign in again.');
      return;
    }
    
    if (filter !== currentFilter) {
      console.log(`Changement de filtre: ${currentFilter} -> ${filter}`);
      setCurrentFilter(filter);
      setCurrentPage(1);
      setPosts([]); // Vider les posts lors du changement de filtre
      
      // Forcer un petit délai pour éviter les problèmes de rendu
      setTimeout(() => {
        fetchPosts(1, filter);
      }, 10);
    }
  };

  // Fonction pour ajouter un nouveau post à la liste
  const addPost = (newPost) => {
    if (newPost && (newPost._id || newPost.id)) {
      setPosts(prevPosts => [newPost, ...prevPosts]);
    }
  };

  // Fonction pour mettre à jour un post
  const updatePost = (updatedPost) => {
    if (!updatedPost || (!updatedPost._id && !updatedPost.id)) {
      console.error('Invalid post update received');
      return;
    }
    
    const postId = updatedPost._id || updatedPost.id;
    
    setPosts(prevPosts => 
      prevPosts.map(post => {
        const currentId = post._id || post.id;
        return currentId === postId ? updatedPost : post;
      })
    );
  };

  // Fonction pour supprimer un post
  const deletePost = (postId) => {
    if (!postId) return;
    
    setPosts(prevPosts => prevPosts.filter(post => {
      const currentId = post._id || post.id;
      return currentId !== postId;
    }));
  };

  return (
    <ErrorBoundary fallback={<div className={styles.errorState}>An error occurred while displaying the wall.</div>}>
      <div className={styles.wallContainer}>
        <div className={styles.wallContent}>
          <div className={styles.mainContent}>
            <div className={styles.createPostContainer}>
              <CreatePostForm onPostCreated={addPost} />
            </div>
            
            {/* Barre de filtres améliorée avec état d'authentification */}
            <div className={styles.filterBar}>
              <button 
                className={`${styles.filterButton} ${currentFilter === 'all' ? styles.active : ''}`}
                onClick={() => changeFilter('all')}
                data-filter="all"
              >
                All posts
                {posts.length > 0 && currentFilter === 'all' && (
                  <span className={styles.filterCount}>{posts.length}</span>
                )}
              </button>
              
              {isAuthenticated && token ? (
                <button 
                  className={`${styles.filterButton} ${currentFilter === 'personal' ? styles.active : ''}`}
                  onClick={() => changeFilter('personal')}
                  data-filter="personal"
                  disabled={!getUserId()}
                >
                  My posts
                  {posts.length > 0 && currentFilter === 'personal' && (
                    <span className={styles.filterCount}>{posts.length}</span>
                  )}
                </button>
              ) : (
                <button 
                  className={`${styles.filterButton} ${styles.disabled}`}
                  onClick={() => alert('Please log in to view your posts')}
                >
                  My posts
                  <span className={styles.loginRequired}>(Login required)</span>
                </button>
              )}
            </div>
                      
            {error && (
              <div className={styles.errorMessage}>
                {error}
                <button 
                  className={styles.retryButton}
                  onClick={refreshPosts}
                >
                  Retry
                </button>
              </div>
            )}
            
            <PostList 
              posts={posts} 
              loading={loading} 
              onLoadMore={loadMore} 
              hasMore={hasMore}
              onUpdatePost={updatePost}
              onDeletePost={deletePost}
            />
          </div>
          
          <div className={styles.sidebar}>
            <WallSidebar onRefresh={refreshPosts} />
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ThrowbackWall;
