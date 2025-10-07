import React, { useState } from 'react';
import styles from './LiveThrowback.module.css';

const VideoUrlImport = ({ onVideoSelect, apiBaseUrl }) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [showBatchInput, setShowBatchInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [importedVideos, setImportedVideos] = useState([]);

  const baseUrl = apiBaseUrl || process.env.REACT_APP_API_URL || 'https://throwback-backend.onrender.com';

  const getVideoSourceType = (url) => {
    if (!url) return null;
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
    if (url.includes('vimeo.com')) return 'vimeo';
    if (url.includes('dailymotion.com') || url.includes('dai.ly')) return 'dailymotion';
    return null;
  };

  const extractVideoId = (url, sourceType) => {
    if (!url || !sourceType) return null;
    try {
      let videoId = null;
      if (sourceType === 'youtube') {
        if (url.includes('youtube.com/watch')) {
          const urlParams = new URL(url).searchParams;
          videoId = urlParams.get('v');
        } else if (url.includes('youtu.be/')) {
          videoId = url.split('youtu.be/')[1];
          if (videoId && videoId.includes('?')) videoId = videoId.split('?')[0];
        }
      } else if (sourceType === 'vimeo') {
        if (url.includes('player.vimeo.com/video/')) videoId = url.split('player.vimeo.com/video/')[1];
        else videoId = url.split('vimeo.com/')[1];
        if (videoId && videoId.includes('?')) videoId = videoId.split('?')[0];
      } else if (sourceType === 'dailymotion') {
        if (url.includes('dailymotion.com/video/')) videoId = url.split('dailymotion.com/video/')[1];
        else if (url.includes('dai.ly/')) videoId = url.split('dai.ly/')[1];
        if (videoId && videoId.includes('?')) videoId = videoId.split('?')[0];
      }
      return videoId;
    } catch (error) {
      console.error('Error extracting video ID:', error);
      return null;
    }
  };

  const fetchVideoMetadata = async (url) => {
    if (!url || !url.trim()) {
      setError('Please enter a valid video URL.');
      return null;
    }
    setIsProcessing(true);
    setError('');
    try {
      const sourceType = getVideoSourceType(url);
      if (!sourceType) throw new Error('Unsupported URL. Please use YouTube, Vimeo, or Dailymotion.');
      const videoId = extractVideoId(url, sourceType);
      if (!videoId) throw new Error('Unable to extract video ID from the URL.');
      const token = localStorage.getItem('token');
      if (!token) throw new Error('You are not authenticated. Please log in again.');
      const response = await fetch(`${baseUrl}/api/video-info?url=${encodeURIComponent(url)}&id=${videoId}&source=${sourceType}`, {
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        console.warn('API failed, using simulated metadata');
        const simData = simulateMetadata(url, sourceType, videoId);
        setImportedVideos(prev => [simData, ...prev]);
        setVideoUrl('');
        onVideoSelect(simData);
        return simData;
      }
      const data = await response.json();
      const videoData = {
        videoId,
        title: data.title || 'Title not available',
        description: data.description || 'No description',
        thumbnail: data.thumbnail || '/images/video-placeholder.jpg',
        duration: data.duration || '0:00',
        source: sourceType,
        url,
        channel: data.channel || 'Unknown channel',
        published: data.publishedAt || 'Unknown date'
      };
      setImportedVideos(prev => [videoData, ...prev]);
      setVideoUrl('');
      onVideoSelect(videoData);
      return videoData;
    } catch (error) {
      setError(error.message);
      console.error('Error importing video:', error);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchImport = async () => {
    if (!batchUrls.trim()) {
      setError('Please enter at least one video URL.');
      return;
    }
    setIsProcessing(true);
    setError('');
    const urls = batchUrls.split('\n').map(url => url.trim()).filter(url => url.length > 0);
    if (urls.length === 0) {
      setError('No valid URL found.');
      setIsProcessing(false);
      return;
    }
    const results = [];
    const failures = [];
    for (const url of urls) {
      try {
        const videoData = await fetchVideoMetadata(url);
        if (videoData) results.push(videoData);
        else failures.push(url);
      } catch (error) {
        console.error(`Error importing ${url}:`, error);
        failures.push(url);
      }
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    if (failures.length > 0) setError(`${results.length} videos imported successfully. ${failures.length} failed.`);
    else setError('');
    setBatchUrls('');
    setShowBatchInput(false);
    setIsProcessing(false);
  };

  const handleSingleImport = async () => {
    if (!videoUrl.trim()) {
      setError('Please enter a video URL.');
      return;
    }
    await fetchVideoMetadata(videoUrl);
  };

  const simulateMetadata = (url, sourceType, videoId) => ({
    videoId,
    title: `Video ${sourceType} - ${videoId}`,
    description: 'Simulated description for this video',
    thumbnail: '/images/video-placeholder.jpg',
    duration: '3:45',
    source: sourceType,
    url,
    channel: 'Simulated Channel',
    published: '2 years ago'
  });

  return (
    <div className={styles.videoSourceContainer}>
      <div className={styles.sourceHeader}>
        <h3>Add Videos by URL</h3>
        <div className={styles.sourceTypeSelector}>
          <button className={`${styles.sourceTypeButton} ${!showBatchInput ? styles.activeSource : ''}`} onClick={() => setShowBatchInput(false)} disabled={isProcessing}>
            <i className="fas fa-link"></i> Single URL
          </button>
          <button className={`${styles.sourceTypeButton} ${showBatchInput ? styles.activeSource : ''}`} onClick={() => setShowBatchInput(true)} disabled={isProcessing}>
            <i className="fas fa-list"></i> Multiple URLs
          </button>
        </div>
      </div>

      <div className={styles.urlInputSection}>
        {!showBatchInput ? (
          <>
            <div className={styles.urlInputContainer}>
              <input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} placeholder="Paste YouTube, Vimeo or Dailymotion URL here" className={styles.urlInput} disabled={isProcessing} />
              <button className={styles.importButton} onClick={handleSingleImport} disabled={isProcessing || !videoUrl.trim()}>
                {isProcessing ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-plus"></i>}
              </button>
            </div>
            <p className={styles.inputHelp}><i className="fas fa-info-circle"></i> Paste a video URL to add it to your compilation</p>
          </>
        ) : (
          <>
            <div className={styles.batchInputContainer}>
              <textarea value={batchUrls} onChange={(e) => setBatchUrls(e.target.value)} placeholder="Paste multiple URLs (one per line)" className={styles.batchUrlInput} rows={5} disabled={isProcessing}></textarea>
              <button className={styles.batchImportButton} onClick={handleBatchImport} disabled={isProcessing || !batchUrls.trim()}>
                {isProcessing ? (<><i className="fas fa-spinner fa-spin"></i> Importing...</>) : (<><i className="fas fa-file-import"></i> Import All URLs</>)}
              </button>
            </div>
            <p className={styles.inputHelp}><i className="fas fa-info-circle"></i> Paste 3 URLs, one per line, to import in bulk</p>
          </>
        )}

        {error && (
          <div className={styles.importError}>
            <i className="fas fa-exclamation-circle"></i>
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className={styles.platformExamples}>
        <h4>Supported URL formats:</h4>
        <ul className={styles.examplesList}>
          <li><i className="fab fa-youtube"></i> YouTube: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID</li>
          <li><i className="fab fa-vimeo-v"></i> Vimeo: https://vimeo.com/VIDEO_ID</li>
          <li><i className="fas fa-play-circle"></i> Dailymotion: https://www.dailymotion.com/video/VIDEO_ID or https://dai.ly/VIDEO_ID</li>
        </ul>
      </div>

      {importedVideos.length > 0 && (
        <div className={styles.recentlyImportedSection}>
          <h4>Recently Imported Videos</h4>
          <div className={styles.recentImports}>
            {importedVideos.slice(0, 3).map((video, index) => (
              <div key={`${video.videoId}-${index}`} className={styles.recentImportItem}>
                <div className={styles.recentImportThumbnail}>
                  <img src={video.thumbnail} alt={video.title} onError={(e) => { e.target.src = '/images/video-placeholder.jpg'; }} />
                  <span className={styles.videoPlatformBadge}>
                    {video.source === 'youtube' && <i className="fab fa-youtube"></i>}
                    {video.source === 'vimeo' && <i className="fab fa-vimeo-v"></i>}
                    {video.source === 'dailymotion' && <i className="fas fa-play-circle"></i>}
                  </span>
                </div>
                <div className={styles.recentImportInfo}>
                  <h5 className={styles.recentImportTitle}>{video.title}</h5>
                  <p className={styles.recentImportMeta}>{video.duration} | {video.channel}</p>
                </div>
                <button className={styles.reImportButton} onClick={() => onVideoSelect(video)} title="Add again to compilation">
                  <i className="fas fa-plus"></i>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoUrlImport;
