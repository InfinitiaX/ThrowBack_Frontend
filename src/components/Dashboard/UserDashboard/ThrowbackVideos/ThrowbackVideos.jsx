import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSpinner,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

import MemoryCard from './MemoryCard';
import VideoCard from './VideoCard';
import VideoFilters from './VideoFilters';

// Données de secours (inchangées)
const mockMemories = [
  {
    id: 'mock1',
    username: 'User Demo',
    type: 'posted',
    videoTitle: 'Bohemian Rhapsody',
    videoArtist: 'Queen',
    videoYear: '1975',
    imageUrl: '/images/default-avatar.jpg',
    content: 'This song reminds me of my college days!',
    likes: 5,
    comments: 2
  },
  {
    id: 'mock2',
    username: 'Another User',
    type: 'shared',
    videoTitle: 'Thriller',
    videoArtist: 'Michael Jackson',
    videoYear: '1982',
    imageUrl: '/images/default-avatar.jpg',
    content: 'Best music video of all time!',
    likes: 10,
    comments: 3
  }
];

const mockVideos = [
  {
    _id: 'mock-video-1',
    titre: 'Bohemian Rhapsody',
    artiste: 'Queen',
    annee: '1975',
    youtubeUrl: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ',
    vues: 1200,
    likes: 450,
    type: 'music'
  },
  {
    _id: 'mock-video-2',
    titre: 'Thriller',
    artiste: 'Michael Jackson',
    annee: '1982',
    youtubeUrl: 'https://www.youtube.com/watch?v=sOnqjkJTMaA',
    vues: 980,
    likes: 320,
    type: 'music'
  },
  {
    _id: 'mock-video-3',
    titre: 'Hotel California',
    artiste: 'Eagles',
    annee: '1976',
    youtubeUrl: 'https://www.youtube.com/watch?v=EqPtz5qN7HM',
    vues: 750,
    likes: 280,
    type: 'music'
  }
];

const ThrowbackVideos = () => {
  const [videos, setVideos] = useState([]);
  const [activeFilters, setActiveFilters] = useState({
    genre: 'all',
    decade: 'all',
    sortBy: 'Newest'
  });

  // rendu paginé façon YouTube (12 par 12)
  const [visibleCount, setVisibleCount] = useState(12);
  const sentinelRef = useRef(null);

  // côté droite
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);

  // état chargement/erreur des vidéos
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl =
    process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // ---- fetch ----
  useEffect(() => {
    fetchMusicVideos();
    fetchRecentMemories();
  }, []);

  const fetchMusicVideos = async () => {
    try {
      setLoading(true);
      try {
        const r = await fetch(`${baseUrl}/api/public/videos?type=music`);
        if (r.ok) {
          const j = await r.json();
          const arr = j.data || j.videos || [];
          if (arr.length) {
            setVideos(arr);
            setError(null);
            return;
          }
        }
        throw new Error('public route failed');
      } catch {
        const fb = await fetch(`${baseUrl}/api/videos?type=music`);
        if (fb.ok) {
          const j = await fb.json();
          const arr = j.data || j.videos || [];
          if (arr.length) {
            setVideos(arr);
            setError(null);
            return;
          }
        }
        // fallback mock
        setVideos(mockVideos);
        setError('Temporary data displayed - Unable to connect to server');
      }
    } catch (e) {
      setVideos(mockVideos);
      setError(`Temporary data displayed - ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      try {
        const r = await fetch(`${baseUrl}/api/public/memories/recent`);
        if (r.ok) {
          const j = await r.json();
          if (j.success && j.data) {
            setMemories(formatMemories(j.data));
            setMemoriesError(null);
            return;
          }
        }
        throw new Error('main route failed');
      } catch {
        const fb = await fetch(`${baseUrl}/api/memories/recent`);
        if (fb.ok) {
          const j = await fb.json();
          if (j.success && j.data) {
            setMemories(formatMemories(j.data));
            setMemoriesError(null);
            return;
          }
        }
        setMemories(mockMemories);
        setMemoriesError('Unable to load memories, displaying static data');
      }
    } catch {
      setMemories(mockMemories);
      setMemoriesError('Error loading memories, displaying static data');
    } finally {
      setMemoriesLoading(false);
    }
  };

  const formatMemories = (arr) => {
    if (!Array.isArray(arr) || !arr.length) return mockMemories;
    return arr.map((m) => ({
      id: m._id || m.id || `memory-${Math.random()}`,
      username: m.auteur
        ? `${m.auteur.prenom || ''} ${m.auteur.nom || ''}`.trim() || 'User'
        : 'User',
      type: m.type || 'posted',
      videoTitle: m.video?.titre || m.videoTitle || 'Untitled video',
      videoArtist: m.video?.artiste || m.videoArtist || 'Unknown artist',
      videoYear: m.video?.annee || m.videoYear || '----',
      imageUrl: getImageUrl(m.auteur?.photo_profil || m.imageUrl),
      content: m.contenu || m.content || 'No content',
      likes: m.likes || 0,
      comments: m.nb_commentaires || m.comments || 0
    }));
  };

  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http')) return path;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  // ---- Filtres robustes ----
  const filteredVideos = useMemo(() => {
    if (!videos.length) return [];

    let result = [...videos];

    // décennie
    if (activeFilters.decade !== 'all') {
      const map = {
        '60s': 1960,
        '70s': 1970,
        '80s': 1980,
        '90s': 1990,
        '2000s': 2000,
        '2010s': 2010,
        '2020s': 2020
      };
      const decadeStart = map[activeFilters.decade] ?? 0;
      const decadeEnd = decadeStart + 9;
      result = result.filter((v) => {
        const y = parseInt(v.annee);
        return !isNaN(y) && y >= decadeStart && y <= decadeEnd;
      });
    }

    // genre tolérant (casse/espaces, tableau ou string)
    if (activeFilters.genre !== 'all') {
      const wanted = activeFilters.genre.toLowerCase().trim();
      result = result.filter((v) => {
        const one = (v.genre || '').toLowerCase().trim();
        const many = (v.genres || []).map((g) => (g || '').toLowerCase().trim());
        return one === wanted || many.includes(wanted);
      });
    }

    // tri
    switch (activeFilters.sortBy) {
      case 'Newest':
        result.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
        );
        break;
      case 'Most popular':
        result.sort((a, b) => (b.vues || 0) - (a.vues || 0));
        break;
      case 'Most liked':
        result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
        break;
      default:
        break;
    }

    return result;
  }, [videos, activeFilters]);

  // reset pagination quand les filtres changent
  useEffect(() => {
    setVisibleCount(12);
  }, [filteredVideos]);

  // IntersectionObserver pour charger +12 quand on arrive en bas
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          setVisibleCount((c) => Math.min(c + 12, filteredVideos.length));
        }
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [filteredVideos.length]);

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        {/* Colonne principale */}
        <main className={styles.mainContent}>
          <h1 className={styles.title}>Today's Pick</h1>

          <VideoFilters
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            videoCount={filteredVideos.length}
          />

          {loading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading videos…</p>
            </div>
          ) : error ? (
            <div className={styles.errorContainer}>
              <div className={styles.errorIcon}>
                <FontAwesomeIcon icon={faExclamationTriangle} />
              </div>
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className={styles.videosGrid}>
                {filteredVideos.length ? (
                  filteredVideos.slice(0, visibleCount).map((video) => (
                    <VideoCard key={video._id} video={video} baseUrl={baseUrl} />
                  ))
                ) : (
                  <div className={styles.noVideosMessage}>
                    <p>No videos match your search criteria.</p>
                  </div>
                )}
              </div>

              {/* sentinelle pour le scroll infini */}
              {visibleCount < filteredVideos.length && (
                <div ref={sentinelRef} style={{ height: 1 }} />
              )}
            </>
          )}
        </main>

        {/* Colonne commentaires (même hauteur/scroll alignés) */}
        <aside className={styles.rightCards}>
          {memoriesLoading ? (
            <div className={styles.loadingContainer}>
              <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
              <p>Loading recent memories…</p>
            </div>
          ) : (
            <div className={styles.verticalTicker}>
              <div className={styles.tickerContent}>
                {(memories || []).map((m) => (
                  <div key={m.id} className={styles.memoryCard}>
                    <MemoryCard memory={m} baseUrl={baseUrl} />
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default ThrowbackVideos;
