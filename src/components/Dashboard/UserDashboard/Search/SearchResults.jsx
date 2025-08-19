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
  // If there's no search query
  if (!searchQuery) {
    return (
      <div className={styles.emptyState}>
        <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
        <h2>Search for content on ThrowBack</h2>
        <p>Enter a search term to find videos, playlists, podcasts, and livestreams</p>
      </div>
    );
  }
  
  // If there are no results
  if (!results || Object.keys(results).length === 0) {
    return (
      <div className={styles.emptyState}>
        <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
        <h2>No results found for "{searchQuery}"</h2>
        <p>Try different terms or filters</p>
      </div>
    );
  }
  
  // Display results for global search
  if (activeTab === 'all') {
    return (
      <div className={styles.globalResults}>
        {/* Videos */}
        {results.videos && results.videos.items && results.videos.items.length > 0 && (
          <section className={styles.resultSection}>
            <div className={styles.sectionHeader}>
              <h2>
                <FontAwesomeIcon icon={faVideo} />
                <span>Videos</span>
              </h2>
              {results.videos.total > results.videos.items.length && (
                <Link to={`/dashboard/search?q=${encodeURIComponent(searchQuery)}&type=videos`} className={styles.viewMore}>
                  View more ({results.videos.total})
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
                  View more ({results.playlists.total})
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
                  View more ({results.podcasts.total})
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
                  View more ({results.livestreams.total})
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
        
        {/* If no results were found in any category */}
        {(!results.videos || results.videos.items.length === 0) &&
         (!results.playlists || results.playlists.items.length === 0) &&
         (!results.podcasts || results.podcasts.items.length === 0) &&
         (!results.livestreams || results.livestreams.items.length === 0) && (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
            <h2>No results found for "{searchQuery}"</h2>
            <p>Try different terms or filters</p>
          </div>
        )}
      </div>
    );
  }
  
  // Display results for videos
  if (activeTab === 'videos' && results.items) {
    return (
      <div className={styles.videosResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} result(s) for "{searchQuery}"</h2>
            </div>
            
            <div className={styles.videoGrid}>
              {results.items.map(video => (
                <VideoCard key={video._id} video={video} />
              ))}
            </div>
            
            {/* Pagination if needed */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Pagination component to be implemented */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faVideo} size="3x" className={styles.emptyIcon} />
            <h2>No videos found for "{searchQuery}"</h2>
            <p>Try different terms or filters</p>
          </div>
        )}
      </div>
    );
  }
  
  // Display results for playlists
  if (activeTab === 'playlists' && results.items) {
    return (
      <div className={styles.playlistsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} result(s) for "{searchQuery}"</h2>
            </div>
            
            <div className={styles.playlistGrid}>
              {results.items.map(playlist => (
                <PlaylistCard key={playlist._id} playlist={playlist} />
              ))}
            </div>
            
            {/* Pagination if needed */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Pagination component to be implemented */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faList} size="3x" className={styles.emptyIcon} />
            <h2>No playlists found for "{searchQuery}"</h2>
            <p>Try different terms or filters</p>
          </div>
        )}
      </div>
    );
  }
  
  // Display results for podcasts
  if (activeTab === 'podcasts' && results.items) {
    return (
      <div className={styles.podcastsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} result(s) for "{searchQuery}"</h2>
            </div>
            
            <div className={styles.podcastGrid}>
              {results.items.map(podcast => (
                <PodcastCard key={podcast._id} podcast={podcast} />
              ))}
            </div>
            
            {/* Pagination if needed */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Pagination component to be implemented */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faMicrophone} size="3x" className={styles.emptyIcon} />
            <h2>No podcasts found for "{searchQuery}"</h2>
            <p>Try different terms or filters</p>
          </div>
        )}
      </div>
    );
  }
  
  // Display results for livestreams
  if (activeTab === 'livestreams' && results.items) {
    return (
      <div className={styles.livestreamsResults}>
        {results.items.length > 0 ? (
          <>
            <div className={styles.resultsHeader}>
              <h2>{results.total} result(s) for "{searchQuery}"</h2>
            </div>
            
            <div className={styles.livestreamGrid}>
              {results.items.map(livestream => (
                <LivestreamCard key={livestream._id} livestream={livestream} />
              ))}
            </div>
            
            {/* Pagination if needed */}
            {results.totalPages > 1 && (
              <div className={styles.pagination}>
                {/* Pagination component to be implemented */}
              </div>
            )}
          </>
        ) : (
          <div className={styles.emptyState}>
            <FontAwesomeIcon icon={faStream} size="3x" className={styles.emptyIcon} />
            <h2>No livestreams found for "{searchQuery}"</h2>
            <p>Try different terms or filters</p>
          </div>
        )}
      </div>
    );
  }
  
  // Fallback
  return (
    <div className={styles.emptyState}>
      <FontAwesomeIcon icon={faSearch} size="3x" className={styles.emptyIcon} />
      <h2>No results available</h2>
      <p>Please try your search again</p>
    </div>
  );
};

export default SearchResults;