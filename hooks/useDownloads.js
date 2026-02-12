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

  // Upload pliku - automatyczny fallback z S3 do Vercel
  const uploadFile = async (file, description = '', category = '', onProgress = null) => {
    setLoading(true);
    setError(null);

    const maxVercelSize = 3 * 1024 * 1024; // 3MB - bezpieczny limit Vercel (hard limit ~4.5MB)
    const maxS3Size = 200 * 1024 * 1024; // 200MB - max rozmiar

    // Walidacja rozmiaru
    if (file.size > maxS3Size) {
      setLoading(false);
      const error = `File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is 200MB.`;
      setError(error);
      return { success: false, error };
    }

    // Dla małych plików (< 3MB) użyj bezpośrednio Vercel
    if (file.size < maxVercelSize) {
      console.log(`📤 Small file (${(file.size / 1024 / 1024).toFixed(2)}MB) - uploading via Vercel`);
      return uploadViaVercel(file, description, category, onProgress);
    }

    // Dla dużych plików (>= 3MB) TYLKO S3 (Vercel ma limit ~4.5MB i zwraca 413)
    console.log(`📤 Large file (${(file.size / 1024 / 1024).toFixed(2)}MB) - REQUIRES S3 direct upload`);

    try {
      // Krok 1: Pobierz presigned URL z API
      const presignedResponse = await fetch('/api/downloads/presigned-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        }),
      });

      const presignedData = await presignedResponse.json();

      if (!presignedData.success) {
        setError(presignedData.error || 'Failed to get upload URL');
        setLoading(false);
        return { success: false, error: presignedData.error };
      }

      // Krok 2: Upload bezpośrednio do S3
      return new Promise((resolve) => {
        const xhr = new XMLHttpRequest();

        // Progress tracking dla S3 upload
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable && onProgress) {
            const percentComplete = Math.round((e.loaded / e.total) * 100);
            onProgress(percentComplete);
          }
        });

        // Success - plik uploadowany do S3
        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            console.log('✅ S3 upload successful');
            // Krok 3: Zapisz metadata do bazy danych
            try {
              const saveResponse = await fetch('/api/downloads/save-metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  s3Key: presignedData.s3Key,
                  fileName: file.name,
                  fileSize: file.size,
                  fileType: file.type,
                  description,
                  category,
                }),
              });

              const saveData = await saveResponse.json();

              if (saveData.success) {
                setLoading(false);
                await fetchFiles();
                resolve({ success: true, file: saveData.file });
              } else {
                setLoading(false);
                setError(saveData.error || 'Failed to save file metadata');
                resolve({ success: false, error: saveData.error });
              }
            } catch (err) {
              setLoading(false);
              setError('Failed to save file metadata');
              resolve({ success: false, error: 'Failed to save file metadata' });
            }
          } else if (xhr.status === 403) {
            // CORS error - S3 CORS nie jest skonfigurowany
            console.error('❌ S3 CORS error - CORS configuration required');
            setLoading(false);
            const error = `Upload failed: S3 CORS not configured. Files larger than 3MB require S3 CORS setup. Please configure CORS in AWS S3 Console (instructions in S3_CORS_CONFIG.md file)`;
            setError(error);
            resolve({ success: false, error });
          } else {
            setLoading(false);
            const error = `S3 upload failed: ${xhr.status}`;
            setError(error);
            resolve({ success: false, error });
          }
        });

        // Error - najprawdopodobniej CORS
        xhr.addEventListener('error', async () => {
          console.error('❌ S3 upload error - likely CORS issue');
          setLoading(false);
          const error = 'Upload failed: Cannot upload to S3. This is likely because S3 CORS is not configured. Files larger than 3MB require S3 CORS configuration. See S3_CORS_CONFIG.md for instructions.';
          setError(error);
          resolve({ success: false, error });
        });

        // Timeout
        xhr.addEventListener('timeout', () => {
          setLoading(false);
          const error = 'S3 upload timeout - file too large or connection too slow';
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

        // Configure and send directly to S3
        xhr.open('PUT', presignedData.uploadUrl);
        xhr.timeout = 600000; // 10 minutes timeout
        xhr.setRequestHeader('Content-Type', file.type);
        xhr.send(file); // Send file directly (not FormData)
      });
    } catch (error) {
      console.error('❌ Upload error:', error);
      setLoading(false);
      setError(error.message || 'Upload failed');
      return { success: false, error: error.message };
    }
  };

  // FALLBACK: Upload przez Vercel API (dla plików < 3MB)
  const uploadViaVercel = async (file, description = '', category = '', onProgress = null) => {
    console.log(`📤 Uploading via Vercel API: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    return new Promise((resolve) => {
      const formData = new FormData();
      formData.append('file', file);
      if (description) formData.append('description', description);
      if (category) formData.append('category', category);

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
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const result = JSON.parse(xhr.responseText);
            if (result.success) {
              setLoading(false);
              await fetchFiles();
              resolve({ success: true, file: result.file });
            } else {
              setLoading(false);
              setError(result.error || 'Upload failed');
              resolve({ success: false, error: result.error });
            }
          } catch (err) {
            setLoading(false);
            setError('Failed to parse response');
            resolve({ success: false, error: 'Failed to parse response' });
          }
        } else if (xhr.status === 413) {
          // Vercel ma twardy limit na rozmiar body
          setLoading(false);
          const error = `File too large for Vercel (${(file.size / 1024 / 1024).toFixed(2)}MB). Vercel has a ~4MB limit. For larger files, you must configure S3 CORS (see S3_CORS_CONFIG.md)`;
          setError(error);
          console.error('❌ Vercel 413: File too large');
          resolve({ success: false, error });
        } else {
          setLoading(false);
          const error = `Upload failed: ${xhr.status}`;
          setError(error);
          resolve({ success: false, error });
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
        const error = 'Upload timeout';
        setError(error);
        resolve({ success: false, error });
      });

      // Send request
      xhr.open('POST', '/api/downloads/upload');
      xhr.timeout = 600000; // 10 minutes
      xhr.send(formData);
    });
  };

  // Upload wielu plików (używa odpowiedniej metody dla każdego)
  const uploadMultipleFiles = async (files, category = '', onProgress = null) => {
    setLoading(true);
    setError(null);

    try {
      const uploadedFiles = [];
      const errors = [];
      let totalBytes = 0;
      let uploadedBytes = 0;

      // Calculate total size
      files.forEach(f => totalBytes += f.size);

      // Upload each file sequentially (używa uploadFile który sam wybiera metodę)
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        try {
          // Track progress for this file
          const fileProgress = (percent) => {
            const fileBytes = Math.floor((file.size * percent) / 100);
            const totalPercent = Math.floor(((uploadedBytes + fileBytes) / totalBytes) * 100);
            if (onProgress) onProgress(totalPercent);
          };

          // Upload single file (auto-selects Vercel or S3 based on size)
          const result = await uploadFile(file, '', category, fileProgress);

          if (result.success) {
            uploadedFiles.push(result.file);
            uploadedBytes += file.size;
          } else {
            errors.push(`${file.name}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`${file.name}: ${error.message}`);
        }
      }

      setLoading(false);

      if (uploadedFiles.length === 0) {
        setError('All uploads failed. For files larger than 3MB, you must configure S3 CORS - see S3_CORS_CONFIG.md');
        return {
          success: false,
          error: 'All uploads failed',
          errors,
        };
      }

      return {
        success: true,
        files: uploadedFiles,
        partialSuccess: errors.length > 0,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      setLoading(false);
      setError(error.message || 'Upload failed');
      return { success: false, error: error.message };
    }
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
