import React from 'react';
import styles from './Downloads.module.scss';

const FileDetailsModal = ({ file, onClose, onDownload }) => {
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFileIcon = (fileType) => {
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
    if (fileType.includes('audio')) return '🎵';
    if (fileType.includes('video')) return '🎬';
    if (fileType.includes('text')) return '📝';
    return '📁';
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📄 FILE DETAILS</h2>
          <button onClick={onClose} className={styles.closeButton}>✖️</button>
        </div>

        <div className={styles.modalContent}>
          {/* File Header */}
          <div className={styles.fileHeader}>
            <div className={styles.fileIconLarge}>
              {getFileIcon(file.type)}
            </div>
            <div className={styles.fileTitle}>
              <h3>{file.name}</h3>
              <div className={styles.fileType}>{file.type}</div>
            </div>
          </div>

          {/* File Information */}
          <div className={styles.fileInfoGrid}>
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Size:</span>
              <span className={styles.infoValue}>{formatFileSize(file.size)}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Downloads:</span>
              <span className={styles.infoValue}>{file.downloads}</span>
            </div>
            
            <div className={styles.infoRow}>
              <span className={styles.infoLabel}>Uploaded:</span>
              <span className={styles.infoValue}>{formatDate(file.uploadedAt)}</span>
            </div>
            
            {file.category && (
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Category:</span>
                <span className={styles.infoValue}>
                  <span className={styles.categoryTag}>{file.category}</span>
                </span>
              </div>
            )}
          </div>

          {/* Description */}
          {file.description && (
            <div className={styles.descriptionSection}>
              <h4>DESCRIPTION</h4>
              <div className={styles.descriptionText}>
                {file.description}
              </div>
            </div>
          )}

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className={styles.tagsSection}>
              <h4>TAGS</h4>
              <div className={styles.tagsList}>
                {file.tags.map((tag, index) => (
                  <span key={index} className={styles.tag}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* File Preview (for images) */}
          {file.type.includes('image') && (
            <div className={styles.previewSection}>
              <h4>PREVIEW</h4>
              <div className={styles.imagePreview}>
                <img 
                  src={`/api/downloads/${file.id}/download`} 
                  alt={file.name}
                  className={styles.previewImage}
                />
              </div>
            </div>
          )}
        </div>

        <div className={styles.modalActions}>
          <button 
            onClick={onClose}
            className={styles.cancelButton}
          >
            CLOSE
          </button>
          <button 
            onClick={onDownload}
            className={styles.downloadButton}
          >
            ⬇️ DOWNLOAD FILE
          </button>
        </div>
      </div>
    </div>
  );
};

export default FileDetailsModal;
