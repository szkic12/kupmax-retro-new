import { useState, useEffect, useCallback, useRef } from 'react';

export const usePhotos = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasNextPage, setHasNextPage] = useState(true);
  const observerRef = useRef(null);
  const loadingRef = useRef(null);

  const loadPhotos = useCallback(async (pageNum = 1, append = false) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/photos?page=${pageNum}&per_page=8`);
      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load photos');
      }

      if (append) {
        setPhotos(prev => [...prev, ...data.photos]);
      } else {
        setPhotos(data.photos);
      }

      setHasNextPage(data.pagination.has_next);
      setPage(pageNum);

      console.log(`✅ Loaded ${data.photos.length} photos, page ${pageNum}, has next: ${data.pagination.has_next}`);
    } catch (err) {
      console.error('Error loading photos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (!loading && hasNextPage) {
      console.log(`🔄 Loading more photos, page ${page + 1}`);
      loadPhotos(page + 1, true);
    }
  }, [loading, hasNextPage, page, loadPhotos]);

  // Reset and load initial photos
  const resetPhotos = useCallback(() => {
    setPhotos([]);
    setPage(1);
    setHasNextPage(true);
    loadPhotos(1, false);
  }, [loadPhotos]);

  // Load initial photos on mount
  useEffect(() => {
    resetPhotos();
  }, [resetPhotos]);

  // Custom infinite scroll with Intersection Observer
  useEffect(() => {
    if (!hasNextPage || loading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      {
        rootMargin: '0px 0px 400px 0px', // Load 400px before reaching the bottom
        threshold: 0.1
      }
    );

    if (loadingRef.current) {
      observer.observe(loadingRef.current);
    }

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current);
      }
    };
  }, [hasNextPage, loading, loadMore]);

  return {
    photos,
    loading,
    error,
    hasNextPage,
    loadMore,
    resetPhotos,
    infiniteRef: loadingRef
  };
};
