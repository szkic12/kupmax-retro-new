'use client';

import { useState, useEffect, useCallback } from 'react';
import styles from './WindowControls.module.scss';

/**
 * Uniwersalne przyciski okna Windows 95
 * - Minimalizuj (ukrywa zawartość)
 * - Maksymalizuj (pełny ekran)
 * - Otwórz w nowej karcie (opcjonalnie)
 * - Zamknij
 */
export default function WindowControls({
  onClose,
  onMinimize,
  newTabUrl,
  windowRef,
  canMinimize = true,
  canMaximize = true,
  canNewTab = true,
  canClose = true
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const [originalStyles, setOriginalStyles] = useState(null);

  // Obsługa maksymalizacji
  const handleMaximize = useCallback(() => {
    if (!windowRef?.current) return;

    const element = windowRef.current;

    if (!isMaximized) {
      // Zapisz oryginalne style
      setOriginalStyles({
        position: element.style.position,
        top: element.style.top,
        left: element.style.left,
        right: element.style.right,
        bottom: element.style.bottom,
        width: element.style.width,
        height: element.style.height,
        maxWidth: element.style.maxWidth,
        maxHeight: element.style.maxHeight,
        margin: element.style.margin,
        zIndex: element.style.zIndex,
        borderRadius: element.style.borderRadius
      });

      // Maksymalizuj
      element.style.position = 'fixed';
      element.style.top = '0';
      element.style.left = '0';
      element.style.right = '0';
      element.style.bottom = '0';
      element.style.width = '100vw';
      element.style.height = '100vh';
      element.style.maxWidth = '100vw';
      element.style.maxHeight = '100vh';
      element.style.margin = '0';
      element.style.zIndex = '9999';
      element.style.borderRadius = '0';

      setIsMaximized(true);
    } else {
      // Przywróć oryginalne style
      if (originalStyles) {
        element.style.position = originalStyles.position || '';
        element.style.top = originalStyles.top || '';
        element.style.left = originalStyles.left || '';
        element.style.right = originalStyles.right || '';
        element.style.bottom = originalStyles.bottom || '';
        element.style.width = originalStyles.width || '';
        element.style.height = originalStyles.height || '';
        element.style.maxWidth = originalStyles.maxWidth || '';
        element.style.maxHeight = originalStyles.maxHeight || '';
        element.style.margin = originalStyles.margin || '';
        element.style.zIndex = originalStyles.zIndex || '';
        element.style.borderRadius = originalStyles.borderRadius || '';
      }

      setIsMaximized(false);
    }
  }, [isMaximized, originalStyles, windowRef]);

  // Obsługa ESC dla wyjścia z maksymalizacji
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isMaximized) {
        handleMaximize();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMaximized, handleMaximize]);

  // Obsługa otwierania w nowej karcie
  const handleNewTab = () => {
    if (newTabUrl) {
      window.open(newTabUrl, '_blank');
    }
  };

  return (
    <div className={styles.windowControls}>
      {/* Otwórz w nowej karcie */}
      {canNewTab && newTabUrl && (
        <button
          className={`${styles.controlButton} ${styles.newTabButton}`}
          onClick={handleNewTab}
          title="Otwórz w nowej karcie"
          type="button"
        >
          <span className={styles.icon}>↗</span>
        </button>
      )}

      {/* Minimalizuj */}
      {canMinimize && onMinimize && (
        <button
          className={`${styles.controlButton} ${styles.minimizeButton}`}
          onClick={onMinimize}
          title="Minimalizuj"
          type="button"
        >
          <span className={styles.icon}>−</span>
        </button>
      )}

      {/* Maksymalizuj */}
      {canMaximize && windowRef && (
        <button
          className={`${styles.controlButton} ${styles.maximizeButton}`}
          onClick={handleMaximize}
          title={isMaximized ? "Przywróć (ESC)" : "Maksymalizuj"}
          type="button"
        >
          <span className={styles.icon}>{isMaximized ? '❐' : '□'}</span>
        </button>
      )}

      {/* Zamknij */}
      {canClose && onClose && (
        <button
          className={`${styles.controlButton} ${styles.closeButton}`}
          onClick={onClose}
          title="Zamknij"
          type="button"
        >
          <span className={styles.icon}>×</span>
        </button>
      )}
    </div>
  );
}
