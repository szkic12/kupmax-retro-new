'use client';
import { logger } from '@/lib/logger';

// Komponent Webring - nawigacja między stronami retro z pełną funkcjonalnością
import { useState, useEffect } from 'react';
import styles from './Webring.module.scss';

export default function Webring({ currentUrl, variant = 'full' }) {
  const [navigation, setNavigation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentSiteUrl, setCurrentSiteUrl] = useState(currentUrl);
  const [isAnimating, setIsAnimating] = useState(false);
  const [visitedSites, setVisitedSites] = useState([]);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(null);

  const fetchNavigation = async (direction = 'next') => {
    if (!currentSiteUrl) return;
    
    setIsAnimating(true);
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
        
        // Dodaj do historii odwiedzonych
        if (!visitedSites.includes(data.targetSite.url)) {
          setVisitedSites(prev => [...prev, data.targetSite.url]);
        }
      } else {
        setError(data.error || 'Failed to fetch navigation');
      }
    } catch (err) {
      setError('Network error occurred');
      logger.error('Webring navigation error:', err);
    } finally {
      setLoading(false);
      setTimeout(() => setIsAnimating(false), 300);
    }
  };

  useEffect(() => {
    if (currentUrl) {
      setCurrentSiteUrl(currentUrl);
      fetchNavigation('next');
    }
  }, [currentUrl]);

  const handleNavigation = (direction) => {
    if (autoPlay) {
      stopAutoPlay();
    }
    fetchNavigation(direction);
  };

  const handleRandom = () => {
    if (autoPlay) {
      stopAutoPlay();
    }
    fetchNavigation('random');
  };

  const toggleAutoPlay = () => {
    if (autoPlay) {
      stopAutoPlay();
    } else {
      startAutoPlay();
    }
  };

  const startAutoPlay = () => {
    setAutoPlay(true);
    const interval = setInterval(() => {
      fetchNavigation('next');
    }, 5000);
    setAutoPlayInterval(interval);
  };

  const stopAutoPlay = () => {
    setAutoPlay(false);
    if (autoPlayInterval) {
      clearInterval(autoPlayInterval);
      setAutoPlayInterval(null);
    }
  };

  useEffect(() => {
    return () => {
      if (autoPlayInterval) {
        clearInterval(autoPlayInterval);
      }
    };
  }, [autoPlayInterval]);

  if (loading && !navigation) {
    return (
      <div className={`${styles.webring} ${styles.retro}`}>
        <div className={styles.loading}>
          <div className={styles.loadingDots}>
            <span></span>
            <span></span>
            <span></span>
          </div>
          <span className={styles.loadingText}>Ładowanie webring...</span>
        </div>
      </div>
    );
  }

  if (error && !navigation) {
    return (
      <div className={`${styles.webring} ${styles.retro}`}>
        <div className={styles.error}>
          <span className={styles.errorIcon}>⚠️</span>
          <span>Błąd webring: {error}</span>
          <button onClick={() => fetchNavigation('next')} className={styles.retryButton}>
            Spróbuj ponownie
          </button>
        </div>
      </div>
    );
  }

  if (!navigation || !navigation.targetSite) {
    return (
      <div className={`${styles.webring} ${styles.retro}`}>
        <div className={styles.empty}>
          <span className={styles.emptyIcon}>📭</span>
          <span>Brak stron w webring</span>
        </div>
      </div>
    );
  }

  const { targetSite, navigation: navInfo } = navigation;

  if (variant === 'compact') {
    return (
      <div className={`${styles.webringCompact} ${styles.retro}`}>
        <div className={styles.compactHeader}>
          <span className={styles.retroBadge}>WEBRING</span>
          <span className={styles.counter}>{navInfo.currentIndex + 1}/{navInfo.totalSites}</span>
        </div>
        <div className={styles.compactSite}>
          <a href={targetSite.url} target="_blank" rel="noopener noreferrer">
            {targetSite.icon || '🌐'} {targetSite.name}
          </a>
        </div>
        <div className={styles.compactControls}>
          <button onClick={() => handleNavigation('prev')} title="Poprzednia">◄</button>
          <button onClick={handleRandom} title="Losowa">?</button>
          <button onClick={() => handleNavigation('next')} title="Następna">►</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${styles.webring} ${styles.retro} ${isAnimating ? styles.animating : ''}`}>
      <div className={styles.retroFrame}>
        <div className={styles.header}>
          <div className={styles.titleSection}>
            <div className={styles.blinkingLed}></div>
            <h3 className={styles.title}>
              <span className={styles.retroIcon}>◈</span>
              RETRO WEBRING
              <span className={styles.retroIcon}>◈</span>
            </h3>
          </div>
          <div className={styles.stats}>
            <div className={styles.lcd}>
              <span className={styles.lcdText}>SITE</span>
              <span className={styles.lcdNumber}>{String(navInfo.currentIndex + 1).padStart(3, '0')}</span>
              <span className={styles.lcdDivider}>/</span>
              <span className={styles.lcdNumber}>{String(navInfo.totalSites).padStart(3, '0')}</span>
            </div>
          </div>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.currentSite}>
            <div className={styles.siteFrame}>
              <div className={styles.siteIcon}>
                {targetSite.icon || '�'}
              </div>
              <div className={styles.siteInfo}>
                <a 
                  href={targetSite.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.siteLink}
                >
                  <h4 className={styles.siteName}>{targetSite.name}</h4>
                  <p className={styles.siteDescription}>{targetSite.description}</p>
                  <div className={styles.siteMeta}>
                    <span className={styles.category}>
                      <span className={styles.categoryIcon}>▸</span>
                      {targetSite.category}
                    </span>
                    {targetSite.owner && (
                      <span className={styles.owner}>
                        <span className={styles.ownerIcon}>👤</span>
                        {targetSite.owner}
                      </span>
                    )}
                  </div>
                  {targetSite.tags && targetSite.tags.length > 0 && (
                    <div className={styles.tags}>
                      {targetSite.tags.map(tag => (
                        <span key={tag} className={styles.tag}>#{tag}</span>
                      ))}
                    </div>
                  )}
                </a>
              </div>
            </div>
          </div>
          
          <div className={styles.navigation}>
            <button 
              className={`${styles.navButton} ${styles.prevButton}`}
              onClick={() => handleNavigation('prev')}
              title="Poprzednia strona"
              disabled={loading}
            >
              <span className={styles.arrow}>◄◄</span>
              <span className={styles.label}>PREV</span>
            </button>
            
            <div className={styles.centerControls}>
              <button 
                className={`${styles.controlButton} ${styles.randomButton}`}
                onClick={handleRandom}
                title="Losowa strona"
                disabled={loading}
              >
                <span className={styles.icon}>🎲</span>
                <span className={styles.label}>RANDOM</span>
              </button>
              
              <button 
                className={`${styles.controlButton} ${autoPlay ? styles.active : ''}`}
                onClick={toggleAutoPlay}
                title={autoPlay ? 'Zatrzymaj auto-play' : 'Włącz auto-play'}
              >
                <span className={styles.icon}>{autoPlay ? '⏸️' : '▶️'}</span>
                <span className={styles.label}>{autoPlay ? 'PAUSE' : 'AUTO'}</span>
              </button>
            </div>
            
            <button 
              className={`${styles.navButton} ${styles.nextButton}`}
              onClick={() => handleNavigation('next')}
              title="Następna strona"
              disabled={loading}
            >
              <span className={styles.label}>NEXT</span>
              <span className={styles.arrow}>►►</span>
            </button>
          </div>
        </div>
        
        <div className={styles.footer}>
          <div className={styles.footerLeft}>
            {visitedSites.length > 0 && (
              <span className={styles.visitedCount}>
                <span className={styles.visitedIcon}>✓</span>
                Odwiedzone: {visitedSites.length}
              </span>
            )}
          </div>
          
          <button 
            onClick={() => window.open('/webring', '_blank')}
            className={styles.viewAllButton}
            title="Zobacz wszystkie strony webring (otwiera się w nowej karcie)"
          >
            <span className={styles.icon}>📋</span>
            KATALOG STRON ({navInfo.totalSites})
          </button>
          
          <div className={styles.footerRight}>
            {autoPlay && (
              <span className={styles.autoPlayIndicator}>
                <span className={styles.blinkingDot}></span>
                AUTO-PLAY
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
