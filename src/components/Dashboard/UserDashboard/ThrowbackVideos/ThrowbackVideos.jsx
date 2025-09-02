import React, { useEffect, useRef, useState } from 'react';
import styles from './ThrowbackVideos.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSpinner, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

import VideoCard from './VideoCard';
import VideoFilters from './VideoFilters';

const ThrowbackVideos = () => {
  // liste accumulée des vidéos (pagination serveur)
  const [videos, setVideos] = useState([]);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false);

  // UI / erreurs globales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // filtres du module
  const [activeFilters, setActiveFilters] = useState({
    genre: 'all',
    decade: 'all',
    sortBy: 'All' // "All" = récent (backend: sortBy=recent)
  });

  // base URL backend
  const baseUrl = process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  // Reset de pagination à chaque changement de filtres
  useEffect(() => {
    setVideos([]);
    setPage(1);
    setHasNextPage(true);
  }, [activeFilters]);

  // Chargement des données (page courante)
  useEffect(() => {
    fetchMusicVideos(page);
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
        'All': 'recent',
        'Most popular': 'popular'
      };

      const params = new URLSearchParams({
        type: 'music',
        genre: activeFilters.genre,
        decade: activeFilters.decade,
        sortBy: sortMap[activeFilters.sortBy] || 'recent',
        page: String(pageToLoad),
        limit: '12'
      });

      // route publique avec pagination (contrôleur)
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

  // ---- IntersectionObserver (scroll infini) ----
  const onHitSentinel = () => {
    if (!isPageLoading && hasNextPage) setPage(p => p + 1);
  };

  return (
    <div className={styles.throwbackVideosBg}>
      {/* Colonne unique */}
      <div className={styles.mainContentOnly}>
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

              {hasNextPage && <Sentinel onHit={onHitSentinel} />}
              {isPageLoading && (
                <div className={styles.loadingContainer} style={{ height: 80 }}>
                  <FontAwesomeIcon icon={faSpinner} spin className={styles.spinnerIcon} />
                </div>
              )}
            </>
          )}
        </main>
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
