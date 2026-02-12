import { useState, useEffect } from 'react';

export const useDownloads = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalFiles: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState({
    totalFiles: 0,
    totalDownloads: 0,
    totalSize: 0,
  });

  // Pobierz listę plików
  const fetchFiles = async (params = {}) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({
        page: params.page || pagination.currentPage,
        limit: params.limit || 20,
        ...params,
      });

      const response = await fetch(`/api/downloads/files?${queryParams}`);
      const data = await response.json();

      if (data.success) {
        setFiles(data.files);
        setPagination(data.pagination);
        setCategories(data.categories);
        setStats(data.stats);
      } else {
        setError(data.error || 'Failed to fetch files');
      }
    } catch (err) {
      setError('Network error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Upload pliku z prawdziwym progress tracking
  const uploadFile = async (file, description = '', category = '', onProgress = null) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', description);
      formData.append('category', category);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Success
      xhr.addEventListener('load', async () => {
        setLoading(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              await fetchFiles();
              resolve({ success: true, file: data.file });
            } else {
              setError(data.error || 'Upload failed');
              resolve({ success: false, error: data.error });
            }
          } catch (err) {
            setError('Failed to parse response');
            resolve({ success: false, error: 'Failed to parse response' });
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || 'Upload failed');
            resolve({ success: false, error: data.error || 'Upload failed' });
          } catch (err) {
            setError(`Upload failed: ${xhr.status}`);
            resolve({ success: false, error: `Upload failed: ${xhr.status}` });
          }
        }
      });

      // Error
      xhr.addEventListener('error', () => {
        setLoading(false);
        const error = 'Network error during upload';
        setError(error);
        resolve({ success: false, error });
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        setLoading(false);
        const error = 'Upload timeout - file too large or connection too slow';
        setError(error);
        resolve({ success: false, error });
      });

      // Abort
      xhr.addEventListener('abort', () => {
        setLoading(false);
        const error = 'Upload cancelled';
        setError(error);
        resolve({ success: false, error });
      });

      // Configure and send
      xhr.open('POST', '/api/downloads/upload');
      xhr.timeout = 600000; // 10 minutes timeout
      xhr.send(formData);
    });
  };

  // Upload wielu plików z prawdziwym progress tracking
  const uploadMultipleFiles = async (files, category = '', onProgress = null) => {
    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const formData = new FormData();

      // Append all files
      files.forEach((file) => {
        formData.append('files', file);
      });

      formData.append('category', category);

      const xhr = new XMLHttpRequest();

      // Progress tracking
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable && onProgress) {
          const percentComplete = Math.round((e.loaded / e.total) * 100);
          onProgress(percentComplete);
        }
      });

      // Success
      xhr.addEventListener('load', async () => {
        setLoading(false);

        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            if (data.success) {
              await fetchFiles();
              resolve({
                success: true,
                files: data.files,
                partialSuccess: data.partialSuccess,
                errors: data.errors,
              });
            } else {
              setError(data.error || 'Upload failed');
              resolve({ success: false, error: data.error });
            }
          } catch (err) {
            setError('Failed to parse response');
            resolve({ success: false, error: 'Failed to parse response' });
          }
        } else {
          try {
            const data = JSON.parse(xhr.responseText);
            setError(data.error || 'Upload failed');
            resolve({ success: false, error: data.error || 'Upload failed' });
          } catch (err) {
            setError(`Upload failed: ${xhr.status}`);
            resolve({ success: false, error: `Upload failed: ${xhr.status}` });
          }
        }
      });

      // Error
      xhr.addEventListener('error', () => {
        setLoading(false);
        const error = 'Network error during upload';
        setError(error);
        resolve({ success: false, error });
      });

      // Timeout
      xhr.addEventListener('timeout', () => {
        setLoading(false);
        const error = 'Upload timeout - files too large or connection too slow';
        setError(error);
        resolve({ success: false, error });
      });

      // Abort
      xhr.addEventListener('abort', () => {
        setLoading(false);
        const error = 'Upload cancelled';
        setError(error);
        resolve({ success: false, error });
      });

      // Configure and send
      xhr.open('POST', '/api/downloads/upload');
      xhr.timeout = 600000; // 10 minutes timeout
      xhr.send(formData);
    });
  };

  // Pobierz plik
  const downloadFile = async (fileId) => {
    try {
      const response = await fetch(`/api/downloads/${fileId}/download`);
      const data = await response.json();

      if (data.success) {
        // Otwórz URL do pobrania w nowej zakładce
        window.open(data.downloadUrl, '_blank');
        return { success: true };
      } else {
        setError(data.error || 'Download failed');
        return { success: false, error: data.error };
      }
    } catch (err) {
      setError('Download error: ' + err.message);
      return { success: false, error: err.message };
    }
  };

  // Zmień stronę
  const changePage = (page) => {
    fetchFiles({ page });
  };

  // Wyszukaj pliki
  const searchFiles = (searchTerm) => {
    fetchFiles({ search: searchTerm, page: 1 });
  };

  // Filtruj po kategorii
  const filterByCategory = (category) => {
    fetchFiles({ category, page: 1 });
  };

  // Sortuj pliki
  const sortFiles = (sortBy, sortOrder) => {
    fetchFiles({ sortBy, sortOrder, page: 1 });
  };

  // Załaduj początkową listę
  useEffect(() => {
    fetchFiles();
  }, []);

  return {
    files,
    loading,
    error,
    pagination,
    categories,
    stats,
    fetchFiles,
    uploadFile,
    uploadMultipleFiles,
    downloadFile,
    changePage,
    searchFiles,
    filterByCategory,
    sortFiles,
  };
};
