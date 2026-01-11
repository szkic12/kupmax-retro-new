// Kompaktowy komponent Webring dla bocznego panelu
import { useState, useEffect } from 'react';
import styles from './Webring.module.scss';

export default function WebringCompact({ currentUrl }) {
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSiteUrl, setCurrentSiteUrl] = useState(currentUrl);

  const fetchNavigation = async (direction = 'next') => {
    if (!currentSiteUrl) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `/api/webring/navigate?currentUrl=${encodeURIComponent(currentSiteUrl)}&direction=${direction}&t=${Date.now()}`
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success && data.targetSite) {
        setNavigation(data);
        // Aktualizuj aktualny URL po nawigacji
        setCurrentSiteUrl(data.targetSite.url);
      } else {
        setError(data.error || 'Failed to fetch navigation');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Webring navigation error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUrl) {
      setCurrentSiteUrl(currentUrl);
      fetchNavigation('next');
    }
  }, [currentUrl]);

  const handleNavigation = (direction) => {
    fetchNavigation(direction);
  };

  if (loading) {
    return (
      <div className={`${styles.webringCompact} ${styles.retro}`}>
        <div className={styles.loading}>Ładowanie...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${styles.webringCompact} ${styles.retro}`}>
        <div className={styles.error}>Błąd: {error}</div>
      </div>
    );
  }

  if (!navigation || !navigation.targetSite) {
    return (
      <div className={`${styles.webringCompact} ${styles.retro}`}>
        <div className={styles.empty}>Brak stron</div>
      </div>
    );
  }

  const { targetSite, navigation: navInfo } = navigation;

  return (
    <div className={`${styles.webringCompact} ${styles.retro}`}>
      <div className={styles.compactHeader}>
        <span className={styles.retroBadge}>WEBRING</span>
        <span className={styles.counter}>{navInfo.currentIndex + 1}/{navInfo.totalSites}</span>
      </div>

      <div className={styles.compactSite}>
        <a
          href={targetSite.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`${targetSite.name} - ${targetSite.description}`}
        >
          {targetSite.icon || '🌐'} {targetSite.name}
        </a>
      </div>

      <div className={styles.compactControls}>
        <button
          onClick={() => handleNavigation('prev')}
          title="Poprzednia"
        >
          ◄
        </button>
        <button
          onClick={() => handleNavigation('random')}
          title="Losowa"
        >
          ?
        </button>
        <button
          onClick={() => handleNavigation('next')}
          title="Następna"
        >
          ►
        </button>
      </div>
    </div>
  );
}
