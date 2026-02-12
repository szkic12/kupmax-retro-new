'use client';
import { logger } from '@/lib/logger';

import React, { useState, useRef } from 'react';
import { useDownloads } from '../../hooks/useDownloads';
import styles from './Downloads.module.scss';

// Notification system
const showNotification = (message, type = 'info') => {
  // Remove existing notifications
  const existingNotifications = document.querySelectorAll('.upload-notification');
  existingNotifications.forEach(notification => notification.remove());

  const notification = document.createElement('div');
  notification.className = `upload-notification upload-notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
      <span class="notification-message">${message}</span>
    </div>
  `;

  // Add styles
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    z-index: 10000;
    font-family: Arial, sans-serif;
    font-size: 14px;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
    cursor: pointer;
  `;

  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  document.body.appendChild(notification);

  // Auto remove after 5 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  }, 5000);

  // Click to dismiss
  notification.addEventListener('click', () => {
    if (notification.parentNode) {
      notification.style.animation = 'slideOut 0.3s ease-in';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }
  });
};

// Success sound
const playSuccessSound = () => {
  try {
    // Create a simple success sound using Web Audio API
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime); // C5
    oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1); // E5
    oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2); // G5
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  } catch (error) {
    logger.log('Audio not supported or blocked');
  }
};

const FileUploadModal = ({ onClose }) => {
  const { uploadFile, uploadMultipleFiles } = useDownloads();
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      // Check total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 500 * 1024 * 1024; // 500MB total

      if (totalSize > maxTotalSize) {
        showNotification(`Total size exceeds 500MB limit. Current: ${formatFileSize(totalSize)}`, 'error');
        return;
      }

      // Check individual file sizes
      const oversized = files.filter(f => f.size > 200 * 1024 * 1024);
      if (oversized.length > 0) {
        showNotification(`Some files exceed 200MB limit: ${oversized.map(f => f.name).join(', ')}`, 'error');
        return;
      }

      setSelectedFiles(files);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      showNotification('Please select at least one file', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      let result;

      // Progress callback
      const onProgress = (percent) => {
        setProgress(percent);
      };

      if (selectedFiles.length === 1) {
        // Single file upload (backwards compatibility)
        result = await uploadFile(selectedFiles[0], description, category, onProgress);
      } else {
        // Multiple files upload
        result = await uploadMultipleFiles(selectedFiles, category, onProgress);
      }

      if (result.success) {
        // Play success sound
        playSuccessSound();

        // Show success notification
        const fileCount = selectedFiles.length;
        const message = fileCount === 1
          ? '✅ File uploaded successfully!'
          : `✅ ${fileCount} files uploaded successfully!`;

        if (result.partialSuccess) {
          showNotification(`⚠️ Uploaded ${result.files?.length || 0} of ${fileCount} files`, 'info');
        } else {
          showNotification(message, 'success');
        }

        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        showNotification('❌ Upload failed: ' + result.error, 'error');
        setProgress(0);
      }
    } catch (error) {
      logger.error('Upload error:', error);
      showNotification('❌ Upload failed: ' + error.message, 'error');
      setProgress(0);
    } finally {
      setUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      // Check total size
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      const maxTotalSize = 500 * 1024 * 1024;

      if (totalSize > maxTotalSize) {
        showNotification(`Total size exceeds 500MB limit. Current: ${formatFileSize(totalSize)}`, 'error');
        return;
      }

      // Check individual file sizes
      const oversized = files.filter(f => f.size > 200 * 1024 * 1024);
      if (oversized.length > 0) {
        showNotification(`Some files exceed 200MB limit: ${oversized.map(f => f.name).join(', ')}`, 'error');
        return;
      }

      setSelectedFiles(files);
    }
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>📤 UPLOAD FILE</h2>
          <button onClick={onClose} className={styles.closeButton}>✖️</button>
        </div>

        <div className={styles.modalContent}>
          {/* Drop Zone */}
          <div
            className={styles.dropZone}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            {selectedFiles.length > 0 ? (
              <div className={styles.fileSelected}>
                <div className={styles.filesHeader}>
                  <span>{selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFiles([]);
                    }}
                    className={styles.removeFile}
                  >
                    ❌ Clear All
                  </button>
                </div>
                <div className={styles.filesList}>
                  {selectedFiles.slice(0, 5).map((file, index) => (
                    <div key={index} className={styles.fileItem}>
                      <span className={styles.fileIcon}>{getFileIcon(file.type)}</span>
                      <span className={styles.fileName}>{file.name}</span>
                      <span className={styles.fileSize}>{formatFileSize(file.size)}</span>
                    </div>
                  ))}
                  {selectedFiles.length > 5 && (
                    <div className={styles.moreFiles}>
                      +{selectedFiles.length - 5} more file{selectedFiles.length - 5 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
                <div className={styles.totalSize}>
                  Total: {formatFileSize(selectedFiles.reduce((sum, f) => sum + f.size, 0))}
                </div>
              </div>
            ) : (
              <div className={styles.dropZoneContent}>
                <div className={styles.dropZoneIcon}>📁</div>
                <div className={styles.dropZoneText}>
                  <p>CLICK TO SELECT FILES</p>
                  <p>OR DRAG & DROP HERE</p>
                  <p className={styles.dropZoneHint}>
                    Max 500MB total • Multiple files supported
                  </p>
                </div>
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Folder upload button */}
          <div className={styles.folderUpload}>
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className={styles.folderButton}
              disabled={uploading}
            >
              📂 SELECT FOLDER
            </button>
            <input
              ref={folderInputRef}
              type="file"
              multiple
              webkitdirectory="true"
              directory="true"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
          </div>

          {/* Progress Bar */}
          {uploading && (
            <div className={styles.progressContainer}>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className={styles.progressText}>
                {progress < 100 ? `UPLOADING... ${progress}%` : 'COMPLETE!'}
              </div>
              {progress > 85 && progress < 100 && (
                <div className={styles.progressHint}>
                  Processing large file... This may take a while. Please wait.
                </div>
              )}
            </div>
          )}

          {/* Form Fields */}
          <div className={styles.formFields}>
            <div className={styles.formGroup}>
              <label>DESCRIPTION (OPTIONAL)</label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter file description..."
                className={styles.textInput}
              />
            </div>

            <div className={styles.formGroup}>
              <label>CATEGORY (OPTIONAL)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Enter category name..."
                className={styles.textInput}
              />
            </div>
          </div>
        </div>

        <div className={styles.modalActions}>
          <button 
            onClick={onClose}
            className={styles.cancelButton}
            disabled={uploading}
          >
            CANCEL
          </button>
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={styles.uploadButton}
          >
            {uploading
              ? 'UPLOADING...'
              : selectedFiles.length > 1
              ? `UPLOAD ${selectedFiles.length} FILES`
              : 'UPLOAD FILE'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper functions
const getFileIcon = (fileType) => {
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('zip') || fileType.includes('rar')) return '📦';
  if (fileType.includes('audio')) return '🎵';
  if (fileType.includes('video')) return '🎬';
  if (fileType.includes('text')) return '📝';
  return '📁';
};

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default FileUploadModal;
