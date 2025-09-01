import React, { useEffect, useRef, useState } from 'react';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import MemoryCard from './MemoryCard';
import VideoCard from './VideoCard';
import VideoFilters from './VideoFilters';

// Données de secours (fallback si l’API n’est pas atteignable)
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

const ThrowbackVideos = () => {
  // liste accumulée des vidéos (pagination serveur)
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // UI / erreurs globales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // memories colonne droite
  const [memories, setMemories] = useState([]);
  const [memoriesLoading, setMemoriesLoading] = useState(true);
  const [memoriesError, setMemoriesError] = useState(null);

  // filtres du module
  const [activeFilters, setActiveFilters] = useState({
    genre: 'all',
    decade: 'all',
    sortBy: 'Newest'
  });

  // base URL backend
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Reset de pagination à chaque changement de filtres
  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasNextPage(true);
  }, [activeFilters]);

  // Chargement des données
  useEffect(() => {
    fetchMusicVideos(page);
    fetchRecentMemories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ---- Fetch vidéos paginées ----
  const fetchMusicVideos = async (pageToLoad = 1) => {
    try {
      if (pageToLoad === 1) setLoading(true);
      setIsPageLoading(true);
      setError(null);

      // mapping tri front -> backend
      const sortMap = {
        'Newest': 'recent',
        'Most popular': 'popular',
        'Most liked': 'mostLiked'
      };

      const params = new URLSearchParams({
        type: 'music',
        genre: activeFilters.genre,
        decade: activeFilters.decade,
        sortBy: sortMap[activeFilters.sortBy] || 'recent',
        page: String(pageToLoad),
        limit: '12'
      });

      // route publique avec pagination (contrôleur fourni)
      const res = await fetch(`${baseUrl}/api/public/videos?${params.toString()}`);
      if (!res.ok) throw new Error('Public route failed');
      const json = await res.json();

      const pageData = json?.data || json?.videos || [];
      setVideos(prev => pageToLoad === 1 ? pageData : [...prev, ...pageData]);
      setHasNextPage(Boolean(json?.pagination?.hasNextPage));
    } catch (e) {
      // fallback : on arrête le scroll infini et on signale
      setHasNextPage(false);
      setError('Unable to load videos from server.');
    } finally {
      setIsPageLoading(false);
      if (pageToLoad === 1) setLoading(false);
    }
  };

  // ---- Fetch memories (colonne droite) ----
  const fetchRecentMemories = async () => {
    try {
      setMemoriesLoading(true);
      setMemoriesError(null);

      const r = await fetch(`${baseUrl}/api/public/memories/recent`);
      if (!r.ok) throw new Error('memories public route failed');
      const j = await r.json();

      const data = Array.isArray(j?.data) ? j.data : [];
      setMemories(formatMemories(data));
    } catch {
      setMemories(mockMemories);
      setMemoriesError('Unable to load recent memories (showing static data).');
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
        : (m.username || 'User'),
      type: m.type || 'posted',
      videoTitle: m.video?.titre || m.videoTitle || 'Untitled',
      videoArtist: m.video?.artiste || m.videoArtist || 'Unknown artist',
      videoYear: m.video?.annee || m.videoYear || '—',
      imageUrl: getImageUrl(m.auteur?.photo_profil || m.imageUrl),
      content: m.contenu || m.content || '',
      likes: m.likes || 0,
      comments: m.nb_commentaires || m.comments || 0
    }));
  };

  const getImageUrl = (path) => {
    if (!path) return '/images/default-avatar.jpg';
    if (path.startsWith('http') || path.startsWith('/images/')) return path;
    const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${cleanBase}${cleanPath}`;
  };

  // ---- IntersectionObserver (scroll infini) ----
  const onHitSentinel = () => {
    if (!isPageLoading && hasNextPage) setPage(p => p + 1);
  };

  return (
    <div className={styles.throwbackVideosBg}>
      <div className={styles.mainContentWrap}>
        {/* Colonne gauche : vidéos */}
        <main className={styles.mainContent}>
          <h1 className={styles.title}>Today's Pick</h1>

          <VideoFilters
            activeFilters={activeFilters}
            onFilterChange={setActiveFilters}
            videoCount={videos.length}
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
                {videos.length ? (
                  videos.map((video) => (
                    <VideoCard key={video._id} video={video} baseUrl={baseUrl} />
                  ))
                ) : (
                  <div className={styles.noVideosMessage}>
                    <p>No videos match your search criteria.</p>
                  </div>
                )}
              </div>

              {/* Sentinelle pour charger la page suivante */}
              {hasNextPage && <Sentinel onHit={onHitSentinel} />}
              {isPageLoading && (
                <div className={styles.loadingContainer} style={{ height: 80 }}>
                  <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                </div>
              )}
            </>
          )}
        </main>

        {/* Colonne droite : memories */}
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
          {/* {memoriesError && <small style={{ color: '#b31217' }}>{memoriesError}</small>} */}
        </aside>
      </div>
    </div>
  );
};

/** Composant invisible qui observe le bas de la liste */
const Sentinel = ({ onHit }) => {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) onHit?.();
      },
      { rootMargin: '600px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [onHit]);
  return <div ref={ref} style={{ height: 1 }} />;
};

export default ThrowbackVideos;
