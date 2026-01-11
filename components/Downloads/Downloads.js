import React, { useState } from 'react';
import { useDownloads } from '../../hooks/useDownloads';
import FileUploadModal from './FileUploadModal';
import FileDetailsModal from './FileDetailsModal';
import styles from './Downloads.module.scss';

const Downloads = () => {
  const {
    files,
    loading,
    error,
    pagination,
    categories,
    stats,
    downloadFile,
    changePage,
    searchFiles,
    filterByCategory,
  } = useDownloads();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const handleSearch = (e) => {
    e.preventDefault();
    searchFiles(searchTerm);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    filterByCategory(category);
  };

  const handleDownload = async (fileId) => {
    await downloadFile(fileId);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  if (loading && files.length === 0) {
    return (
      <div className={styles.loading}>
        <div className={styles.retroSpinner}>LOADING...</div>
      </div>
    );
  }

  return (
    <div className={styles.downloads}>
      {/* Nagłówek */}
      <div className={styles.header}>
        <div className={styles.title}>
          <h1>📁 RETRO DOWNLOADS</h1>
          <div className={styles.stats}>
            <span>Files: {stats.totalFiles}</span>
            <span>Downloads: {stats.totalDownloads}</span>
            <span>Size: {formatFileSize(stats.totalSize)}</span>
          </div>
        </div>
        
        <button 
          className={styles.uploadButton}
          onClick={() => setShowUploadModal(true)}
        >
          📤 UPLOAD FILE
        </button>
      </div>

      {/* Pasek wyszukiwania i filtrów */}
      <div className={styles.toolbar}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="SEARCH FILES..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button type="submit" className={styles.searchButton}>
            🔍
          </button>
        </form>

        <div className={styles.filters}>
          <select 
            value={selectedCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className={styles.categorySelect}
          >
            <option value="all">ALL CATEGORIES</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista plików */}
      {error && (
        <div className={styles.error}>
          ERROR: {error}
        </div>
      )}

      <div className={styles.fileList}>
        {files.length === 0 ? (
          <div className={styles.empty}>
            📭 NO FILES FOUND
          </div>
        ) : (
          files.map(file => (
            <div key={file.id} className={styles.fileItem}>
              <div className={styles.fileIcon}>
                {getFileIcon(file.type)}
              </div>
              
              <div className={styles.fileInfo}>
                <div className={styles.fileName}>{file.name}</div>
                <div className={styles.fileMeta}>
                  <span>{formatFileSize(file.size)}</span>
                  <span>•</span>
                  <span>{file.downloads} downloads</span>
                  <span>•</span>
                  <span>{formatDate(file.uploadedAt)}</span>
                  {file.category && (
                    <>
                      <span>•</span>
                      <span className={styles.category}>{file.category}</span>
                    </>
                  )}
                </div>
                {file.description && (
                  <div className={styles.fileDescription}>
                    {file.description}
                  </div>
                )}
              </div>

              <div className={styles.fileActions}>
                <button
                  onClick={() => handleDownload(file.id)}
                  className={styles.downloadButton}
                >
                  ⬇️ DOWNLOAD
                </button>
                <button
                  onClick={() => setSelectedFile(file)}
                  className={styles.detailsButton}
                >
                  ℹ️ INFO
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Paginacja */}
      {pagination.totalPages > 1 && (
        <div className={styles.pagination}>
          <button
            onClick={() => changePage(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className={styles.pageButton}
          >
            ◀️ PREV
          </button>
          
          <span className={styles.pageInfo}>
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => changePage(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className={styles.pageButton}
          >
            NEXT ▶️
          </button>
        </div>
      )}

      {/* Modale */}
      {showUploadModal && (
        <FileUploadModal onClose={() => setShowUploadModal(false)} />
      )}
      
      {selectedFile && (
        <FileDetailsModal 
          file={selectedFile} 
          onClose={() => setSelectedFile(null)}
          onDownload={() => handleDownload(selectedFile.id)}
        />
      )}
    </div>
  );
};

// Helper function do ikon plików
const getFileIcon = (fileType) => {
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('text')) return '📝';
  return '📁';
};

export default Downloads;
