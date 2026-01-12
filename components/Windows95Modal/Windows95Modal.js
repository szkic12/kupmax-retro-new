'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Windows95Modal.module.scss';

const Windows95Modal = ({ isOpen, onClose, title, children }) => {
  const [isMaximized, setIsMaximized] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Blokuj scroll body gdy modal otwarty
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const handleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  const modalContent = (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.window} ${isMaximized ? styles.maximized : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Title Bar */}
        <div className={styles.titleBar}>
          <div className={styles.titleText}>
            <span className={styles.icon}>📄</span>
            {title}
          </div>
          <div className={styles.windowControls}>
            <button
              className={styles.controlButton}
              onClick={handleMaximize}
              aria-label={isMaximized ? 'Restore' : 'Maximize'}
            >
              <span className={styles.maximizeIcon}>
                {isMaximized ? '❐' : '□'}
              </span>
            </button>
            <button
              className={styles.controlButton}
              onClick={onClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className={styles.content}>
          {children}
        </div>

        {/* Status Bar */}
        <div className={styles.statusBar}>
          <div className={styles.statusText}>
            📄 Dokument gotowy
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default Windows95Modal;
