import React, { useState } from 'react';
import Image from 'next/image';
import { usePhotos } from '../../hooks/usePhotos';
import PhotoModal from './PhotoModal';
import styles from './PhotoGallery.module.scss';

// Funkcje pomocnicze do tworzenia placeholdera typu "shimmer"
const shimmer = (w, h) => `
<svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <linearGradient id="g">
      <stop stop-color="#f0f0f0" offset="20%" />
      <stop stop-color="#e0e0e0" offset="50%" />
      <stop stop-color="#f0f0f0" offset="70%" />
    </linearGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="#f0f0f0" />
  <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
  <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
</svg>`;

const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str);

const PhotoGallery = () => {
  const { photos, loading, error, hasNextPage, infiniteRef } = usePhotos();
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleViewProduct = () => {
    if (selectedPhoto) {
      window.location.href = `/retro-portal?view=gallery&product=${selectedPhoto.productSlug}`;
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>Błąd ładowania zdjęć</h3>
          <p>{error}</p>
          <button 
            className={styles.retryButton}
            onClick={() => window.location.reload()}
          >
            SPRÓBUJ PONOWNIE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>📸</span>
          PHOTO GALLERY v2.0
        </div>
        <div className={styles.subtitle}>
          Szybkie przeglądanie zdjęć produktów z infinite scroll
        </div>
      </div>

      <div className={styles.photosGrid}>
        {photos.map((photo, index) => (
          <div
            key={`${photo.id}-${index}`}
            className={styles.photoCard}
            onClick={() => handlePhotoClick(photo)}
          >
            <div className={styles.photoContainer}>
              <Image
                src={photo.imageUrl}
                alt={photo.altText}
                width={photo.width || 800}
                height={photo.height || 800}
                className={styles.photo}
                placeholder="blur"
                blurDataURL={`data:image/svg+xml;base64,${toBase64(shimmer(photo.width || 800, photo.height || 800))}`}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                quality={75}
              />
              {photo.isMainImage && (
                <div className={styles.mainImageBadge}>GŁÓWNE</div>
              )}
            </div>
            <div className={styles.photoInfo}>
              <div className={styles.productName}>
                {photo.productName}
              </div>
              <div className={styles.viewProduct}>
                ▶ KLIKNIJ ABY ZOBACZYĆ PRODUKT
              </div>
            </div>
          </div>
        ))}
      </div>

      {(loading || hasNextPage) && (
        <div ref={infiniteRef} className={styles.loadingContainer}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}>⟳</div>
            <div className={styles.loadingText}>
              {loading ? 'ŁADOWANIE ZDJĘĆ...' : 'PRZYGOTOWYWANIE KOLEJNYCH ZDJĘĆ'}
            </div>
          </div>
        </div>
      )}

      {!hasNextPage && photos.length > 0 && (
        <div className={styles.endMessage}>
          <div className={styles.endIcon}>🏁</div>
          <div className={styles.endText}>
            TO JUŻ WSZYSTKIE ZDJĘCIA!<br />
            Przejdź do Product Gallery aby zobaczyć więcej produktów.
          </div>
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className={styles.noPhotos}>
          <div className={styles.noPhotosIcon}>📷</div>
          <div className={styles.noPhotosText}>
            BRAK ZDJĘĆ DO WYŚWIETLENIA<br />
            Sprawdź czy produkty mają przypisane zdjęcia w WordPress.
          </div>
        </div>
      )}

      {isModalOpen && selectedPhoto && (
        <PhotoModal
          photo={selectedPhoto}
          onClose={handleCloseModal}
          onViewProduct={handleViewProduct}
        />
      )}
    </div>
  );
};

export default PhotoGallery;