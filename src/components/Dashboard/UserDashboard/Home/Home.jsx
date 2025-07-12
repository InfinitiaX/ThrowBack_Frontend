import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../../../contexts/AuthContext';
import VideoCard from '../../../Common/VideoCard';
import ShortCard from '../../../Common/ShortCard';
import PodcastCard from '../../../Common/PodcastCard';
import LivestreamCard from '../../../Common/LivestreamCard';
import TrendingCarousel from './TrendingCarousel';
import CategoryTabs from './CategoryTabs';
import LoadingSpinner from '../../../Common/LoadingSpinner';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [trendingVideos, setTrendingVideos] = useState([]);
  const [recommendedVideos, setRecommendedVideos] = useState([]);
  const [shorts, setShorts] = useState([]);
  const [podcasts, setPodcasts] = useState([]);
  const [liveStreams, setLiveStreams] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [error, setError] = useState(null);
  
  // Catégories disponibles
  const categories = [
    { id: 'all', name: 'Tous' },
    { id: '80s', name: '80s' },
    { id: '90s', name: '90s' },
    { id: '2000s', name: '2000s' },
    { id: 'pop', name: 'Pop' },
    { id: 'rock', name: 'Rock' },
    { id: 'hiphop', name: 'Hip-Hop' },
    { id: 'rnb', name: 'R&B' }
  ];

  useEffect(() => {
    const fetchHomeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Récupérer les vidéos tendances
        const trendingResponse = await axios.get('/api/public/videos/trending');
        setTrendingVideos(trendingResponse.data.data || []);
        
        // Récupérer les vidéos recommandées
        const recommendedResponse = await axios.get('/api/public/videos', {
          params: { 
            category: selectedCategory !== 'all' ? selectedCategory : undefined,
            limit: 8
          }
        });
        setRecommendedVideos(recommendedResponse.data.data || []);
        
        // Récupérer les shorts
        const shortsResponse = await axios.get('/api/videos/shorts', {
          params: { limit: 10 }
        });
        setShorts(shortsResponse.data.data || []);
        
        // Récupérer les podcasts
        const podcastsResponse = await axios.get('/api/podcasts', {
          params: { limit: 4 }
        });
        setPodcasts(podcastsResponse.data.data || []);
        
        // Récupérer les live streams
        const liveStreamsResponse = await axios.get('/api/liveStreams', {
          params: { status: 'SCHEDULED', limit: 3 }
        });
        setLiveStreams(liveStreamsResponse.data.data || []);
      } catch (err) {
        console.error('Erreur lors du chargement de la page d\'accueil:', err);
        setError('Impossible de charger les données. Veuillez réessayer plus tard.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchHomeData();
  }, [selectedCategory]);
  
  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId);
  };
  
  if (isLoading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Oups! Une erreur s'est produite</h2>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Bannière de bienvenue pour les nouveaux utilisateurs */}
      {user && (
        <div className="welcome-banner">
          <h2>Bienvenue, {user.prenom}!</h2>
          <p>Découvrez ou redécouvrez les meilleurs moments musicaux de toutes les époques</p>
        </div>
      )}
      
      {/* Carrousel des vidéos tendances */}
      {trendingVideos.length > 0 && (
        <section className="trending-section">
          <TrendingCarousel videos={trendingVideos} />
        </section>
      )}
      
      {/* Filtres par catégories */}
      <CategoryTabs 
        categories={categories} 
        selectedCategory={selectedCategory} 
        onCategoryChange={handleCategoryChange} 
      />
      
      {/* Vidéos recommandées */}
      <section className="videos-section">
        <div className="section-header">
          <h2>Vidéos recommandées</h2>
          <Link to="/dashboard/videos" className="see-all">Voir tout</Link>
        </div>
        
        <div className="videos-grid">
          {recommendedVideos.length > 0 ? (
            recommendedVideos.map(video => (
              <VideoCard key={video._id} video={video} />
            ))
          ) : (
            <p className="no-content">Aucune vidéo disponible dans cette catégorie.</p>
          )}
        </div>
      </section>
      
      {/* Shorts */}
      {shorts.length > 0 && (
        <section className="shorts-section">
          <div className="section-header">
            <h2>Shorts populaires</h2>
            <Link to="/dashboard/shorts" className="see-all">Voir tout</Link>
          </div>
          
          <div className="shorts-container">
            {shorts.map(short => (
              <ShortCard key={short._id} short={short} />
            ))}
          </div>
        </section>
      )}
      
      {/* Podcasts */}
      {podcasts.length > 0 && (
        <section className="podcasts-section">
          <div className="section-header">
            <h2>Podcasts récents</h2>
            <Link to="/dashboard/podcast" className="see-all">Voir tout</Link>
          </div>
          
          <div className="podcasts-grid">
            {podcasts.map(podcast => (
              <PodcastCard key={podcast._id} podcast={podcast} />
            ))}
          </div>
        </section>
      )}
      
      {/* Live Streams */}
      {liveStreams.length > 0 && (
        <section className="livestreams-section">
          <div className="section-header">
            <h2>Lives à venir</h2>
            <Link to="/dashboard/live" className="see-all">Voir tout</Link>
          </div>
          
          <div className="livestreams-grid">
            {liveStreams.map(stream => (
              <LivestreamCard key={stream._id} stream={stream} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;