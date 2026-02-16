import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import PhotoModal from './PhotoModal';
import styles from './PhotoGallery.module.scss';

const PhotoGallery = () => {
  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'moje' | 'reklamy'
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchPhotos = async () => {
      setLoading(true);
      setError(null);
      setPhotos([]);

      try {
        let url = '';
        if (activeTab === 'products') {
          url = '/api/photos?source=products&per_page=40';
        } else if (activeTab === 'moje') {
          url = '/api/gallery-photos';
        } else if (activeTab === 'reklamy') {
          url = '/api/advertisement?all=true';
        }

        const res = await fetch(url);
        const data = await res.json();

        if (activeTab === 'products') {
          if (data.success && data.photos) {
            setPhotos(data.photos);
          }
        } else if (activeTab === 'moje') {
          if (data.photos) {
            setPhotos(data.photos.map(p => ({
              ...p,
              imageUrl: p.image_url || p.imageUrl,
              productName: p.title || p.name || 'Moje Zdjęcie'
            })));
          }
        } else if (activeTab === 'reklamy') {
          const allSlides = [];

          // Try to get slides from all advertisements
          if (data.advertisements && data.advertisements.length > 0) {
            data.advertisements.forEach((ad) => {
              if (ad.slides && ad.slides.length > 0) {
                ad.slides.forEach((slide, index) => {
                  allSlides.push({
                    id: `${ad.id}-${index}`,
                    imageUrl: slide.image_url,
                    productName: slide.title || ad.title,
                  });
                });
              }
            });
          }

          // If no slides found, fallback to active advertisement (has default slides)
          if (allSlides.length === 0) {
            const resSingle = await fetch('/api/advertisement');
            const dataSingle = await resSingle.json();
            if (dataSingle.advertisement?.slides) {
              dataSingle.advertisement.slides.forEach((slide, index) => {
                allSlides.push({
                  id: `default-${index}`,
                  imageUrl: slide.image_url,
                  productName: slide.title || dataSingle.advertisement.title,
                });
              });
            }
          }

          setPhotos(allSlides);
        }
      } catch (err) {
        console.error('Error fetching photos:', err);
        setError('Błąd ładowania zdjęć');
      } finally {
        setLoading(false);
      }
    };

    fetchPhotos();
  }, [activeTab]);

  const handlePhotoClick = (photo) => {
    setSelectedPhoto(photo);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPhoto(null);
  };

  const handleViewProduct = () => {
    if (selectedPhoto && selectedPhoto.productSlug) {
      window.location.href = `/retro-portal?view=gallery&product=${selectedPhoto.productSlug}`;
    } else {
        alert("To zdjęcie nie jest przypisane do konkretnego produktu.");
    }
  };

  const tabs = [
    { id: 'products', label: 'Produkty', icon: '🛒' },
    { id: 'moje', label: 'Moje Zdjęcia', icon: '📷' },
    { id: 'reklamy', label: 'Reklamy', icon: '📺' },
  ];

  if (error) {
    return (
      <div className={styles.container} style={{ minHeight: 'auto' }}>
        <div className={styles.error}>
          <div className={styles.errorIcon}>⚠️</div>
          <h3>{error}</h3>
          <button className={styles.retryButton} onClick={() => window.location.reload()}>
            SPRÓBUJ PONOWNIE
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container} style={{ minHeight: 'auto', background: 'transparent', padding: '10px' }}>
      <div className={styles.header} style={{ marginBottom: '20px', paddingBottom: '10px' }}>
        <div className={styles.title} style={{ fontSize: '1.5rem' }}>
          <span className={styles.icon}>📸</span>
          PHOTO GALLERY
        </div>
        <div className={styles.tabsContainer}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${activeTab === tab.id ? styles.active : ''}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.photosGrid} style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px' }}>
        {photos.map((photo) => (
          <div
            key={photo.id}
            className={styles.photoCard}
            onClick={() => handlePhotoClick(photo)}
          >
            <div className={styles.photoContainer} style={{ height: '120px' }}>
              <img
                src={photo.imageUrl}
                alt={photo.productName}
                className={styles.photo}
                loading="lazy"
              />
            </div>
            <div className={styles.photoInfo} style={{ padding: '8px' }}>
              <div className={styles.productName} style={{ fontSize: '0.8rem' }}>
                {photo.productName}
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner}>⟳</div>
            <div className={styles.loadingText}>ŁADOWANIE...</div>
          </div>
        </div>
      )}

      {!loading && photos.length === 0 && (
        <div className={styles.noPhotos}>
          <div className={styles.noPhotosIcon}>📷</div>
          <div className={styles.noPhotosText}>
            BRAK ZDJĘĆ W TEJ KATEGORII
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
