import React, { useEffect } from 'react';
import styles from './PhotoGallery.module.scss';

const PhotoModal = ({ photo, onClose, onViewProduct }) => {
  useEffect(() => {
    // Blokowanie scrollowania body gdy modal jest otwarty
    document.body.style.overflow = 'hidden';
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div 
      className={styles.modalBackdrop}
      onClick={handleBackdropClick}
    >
      <div className={styles.modal}>
        {/* Nagłówek modala */}
        <div className={styles.modalHeader}>
          <div className={styles.modalTitle}>
            <span className={styles.modalIcon}>🖼️</span>
            ZDJĘCIE PRODUKTU
          </div>
          <button 
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Zamknij"
          >
            ✕
          </button>
        </div>

        {/* Zawartość modala */}
        <div className={styles.modalContent}>
          {/* Powiększone zdjęcie */}
          <div className={styles.modalPhotoContainer}>
            <img
              src={photo.imageUrl}
              alt={photo.altText}
              className={styles.modalPhoto}
            />
            {photo.isMainImage && (
              <div className={styles.modalMainImageBadge}>ZDJĘCIE GŁÓWNE</div>
            )}
          </div>

          {/* Informacje o produkcie */}
          <div className={styles.modalInfo}>
            <div className={styles.modalProductName}>
              {photo.productName}
            </div>
            
            <div className={styles.modalActions}>
              <button
                className={styles.viewProductButton}
                onClick={onViewProduct}
              >
                <span className={styles.buttonIcon}>▶</span>
                ZOBACZ PRODUKT W PRODUCT GALLERY
              </button>
              
              <button
                className={styles.closeModalButton}
                onClick={onClose}
              >
                <span className={styles.buttonIcon}>✕</span>
                ZAMKNIJ
              </button>
            </div>
          </div>
        </div>

        {/* Stopka modala */}
        <div className={styles.modalFooter}>
          <div className={styles.modalHint}>
            💡 <strong>WSKAZÓWKA:</strong> Kliknij "ZOBACZ PRODUKT" aby przejść do szczegółów produktu w Product Gallery
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhotoModal;
