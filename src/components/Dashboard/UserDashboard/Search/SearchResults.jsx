import React from 'react';
import { Link } from 'react-router-dom';
import styles from './SearchResults.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faVideo, 
  faList, 
  faMicrophone, 
  faStream,
  faSearch,
  faEye,
  faHeart,
  faCalendarAlt,
  faUser,
  faMusic
} from '@fortawesome/free-solid-svg-icons';
import VideoCard from './Common/VideoCard';
import PlaylistCard from './Common/PlaylistCard';
import PodcastCard from './Common/PodcastCard';
import LivestreamCard from './Common/LivestreamCard';

const SearchResults = ({ results, searchQuery, activeTab }) => {
  // S'il n'y a pas de requête de recherche
  if (!searchQuery) {
    return (
      <div className={styles.emptyState}>
        <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
        <h2>Recherchez du contenu sur ThrowBack</h2>
        <p>Entrez un terme de recherche pour trouver des vidéos, playlists, podcasts et livestreams</p>
      </div>
    );
  }
  
  // S'il n'y a pas de résultats
  if (!results || Object.keys(results).length === 0) {
    return (
      <div className={styles.emptyState}>
        <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
        <h2>Aucun résultat trouvé pour "{searchQuery}"</h2>
        <p>Essayez avec d'autres termes ou filtres</p>
      </div>
    );
  }
  
  // Affichage des résultats pour la recherche globale
  if (activeTab === 'all') {
    return (
      <div className={styles.globalResults}>
        {/* Vidéos */}
        {results.videos && results.videos.items && results.videos.items.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <FontAwesomeIcon icon={faVideo} />
                <span>Vidéos</span>
              </h2>
              {results.videos.total > results.videos.items.length && (
                <Link to={`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=videos`} className={styles.viewMore}>
                  Voir plus ({results.videos.total})
                </Link>
              )}
            </div>
            
            <div className={styles.videoResults}>
              {results.videos.items.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
          </section>
        )}
        
        {/* Playlists */}
        {results.playlists && results.playlists.items && results.playlists.items.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <FontAwesomeIcon icon={faList} />
                <span>Playlists</span>
              </h2>
              {results.playlists.total > results.playlists.items.length && (
                <Link to={`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=playlists`} className={styles.viewMore}>
                  Voir plus ({results.playlists.total})
                </Link>
              )}
            </div>
            
            <div className={styles.playlistResults}>
              {results.playlists.items.map(playlist => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
          </section>
        )}
        
        {/* Podcasts */}
        {results.podcasts && results.podcasts.items && results.podcasts.items.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <FontAwesomeIcon icon={faMicrophone} />
                <span>Podcasts</span>
              </h2>
              {results.podcasts.total > results.podcasts.items.length && (
                <Link to={`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=podcasts`} className={styles.viewMore}>
                  Voir plus ({results.podcasts.total})
                </Link>
              )}
            </div>
            
            <div className={styles.podcastResults}>
              {results.podcasts.items.map(podcast => (
                <PodcastCard key={podcast._id} podcast={podcast} />
              ))}
            </div>
          </section>
        )}
        
        {/* Livestreams */}
        {results.livestreams && results.livestreams.items && results.livestreams.items.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <FontAwesomeIcon icon={faStream} />
                <span>Livestreams</span>
              </h2>
              {results.livestreams.total > results.livestreams.items.length && (
                <Link to={`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=livestreams`} className={styles.viewMore}>
                  Voir plus ({results.livestreams.total})
                </Link>
              )}
            </div>
            
            <div className={styles.livestreamResults}>
              {results.livestreams.items.map(livestream => (
                <LivestreamCard key={livestream._id} livestream={livestream} />
              ))}
            </div>
          </section>
        )}
        
        {/* Si aucun résultat n'a été trouvé dans aucune catégorie */}
        {(!results.videos || results.videos.items.length === 0) &&
         (!results.playlists || results.playlists.items.length === 0) &&
         (!results.podcasts || results.podcasts.items.length === 0) &&
         (!results.livestreams || results.livestreams.items.length === 0) && (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
            <h2>Aucun résultat trouvé pour "{searchQuery}"</h2>
            <p>Essayez avec d'autres termes ou filtres</p>
          </div>
        )}
      </div>
    );
  }
  
  // Affichage des résultats pour les vidéos
  if (activeTab === 'videos' && results.items) {
    return (
      <div className={styles.videosResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} résultat(s) pour "{searchQuery}"</h2>
            </div>
            
            <div className={styles.videoGrid}>
              {results.items.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
            
            {/* Pagination si nécessaire */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Composant de pagination à implémenter */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faVideo} size="3x" className={styles.emptyIcon} />
            <h2>Aucune vidéo trouvée pour "{searchQuery}"</h2>
            <p>Essayez avec d'autres termes ou filtres</p>
          </div>
        )}
      </div>
    );
  }
  
  // Affichage des résultats pour les playlists
  if (activeTab === 'playlists' && results.items) {
    return (
      <div className={styles.playlistsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} résultat(s) pour "{searchQuery}"</h2>
            </div>
            
            <div className={styles.playlistGrid}>
              {results.items.map(playlist => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
            
            {/* Pagination si nécessaire */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Composant de pagination à implémenter */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faList} size="3x" className={styles.emptyIcon} />
            <h2>Aucune playlist trouvée pour "{searchQuery}"</h2>
            <p>Essayez avec d'autres termes ou filtres</p>
          </div>
        )}
      </div>
    );
  }
  
  // Affichage des résultats pour les podcasts
  if (activeTab === 'podcasts' && results.items) {
    return (
      <div className={styles.podcastsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} résultat(s) pour "{searchQuery}"</h2>
            </div>
            
            <div className={styles.podcastGrid}>
              {results.items.map(podcast => (
                <PodcastCard key={podcast._id} podcast={podcast} />
              ))}
            </div>
            
            {/* Pagination si nécessaire */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Composant de pagination à implémenter */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faMicrophone} size="3x" className={styles.emptyIcon} />
            <h2>Aucun podcast trouvé pour "{searchQuery}"</h2>
            <p>Essayez avec d'autres termes ou filtres</p>
          </div>
        )}
      </div>
    );
  }
  
  // Affichage des résultats pour les livestreams
  if (activeTab === 'livestreams' && results.items) {
    return (
      <div className={styles.livestreamsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} résultat(s) pour "{searchQuery}"</h2>
            </div>
            
            <div className={styles.livestreamGrid}>
              {results.items.map(livestream => (
                <LivestreamCard key={livestream._id} livestream={livestream} />
              ))}
            </div>
            
            {/* Pagination si nécessaire */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Composant de pagination à implémenter */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faStream} size="3x" className={styles.emptyIcon} />
            <h2>Aucun livestream trouvé pour "{searchQuery}"</h2>
            <p>Essayez avec d'autres termes ou filtres</p>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback
  return (
    <div className={styles.emptyState}>
      <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
      <h2>Aucun résultat disponible</h2>
      <p>Veuillez réessayer votre recherche</p>
    </div>
  );
};

export default SearchResults;