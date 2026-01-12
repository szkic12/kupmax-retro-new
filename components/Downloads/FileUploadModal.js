'use client';

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
    console.log('Audio not supported or blocked');
  }
};

const FileUploadModal = ({ onClose }) => {
  const { uploadFile } = useDownloads();
  const [selectedFile, setSelectedFile] = useState(null);
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 500 * 1024 * 1024) {
        alert('File size exceeds 500MB limit');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!selectedFile) {
      showNotification('Please select a file', 'error');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      // Symulacja progressu (w prawdziwej aplikacji użyjemy XMLHttpRequest z progress event)
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const result = await uploadFile(selectedFile, description, category);
      
      clearInterval(progressInterval);
      setProgress(100);

      if (result.success) {
        // Play success sound
        playSuccessSound();
        
        // Show success notification
        showNotification('✅ File uploaded successfully!', 'success');
        
        setTimeout(() => {
          onClose();
        }, 2000);
      } else {
        showNotification('❌ Upload failed: ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Upload error:', error);
      showNotification('❌ Upload failed: ' + error.message, 'error');
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.size > 500 * 1024 * 1024) {
        alert('File size exceeds 500MB limit');
        return;
      }
      setSelectedFile(file);
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
            {selectedFile ? (
              <div className={styles.fileSelected}>
                <div className={styles.fileIcon}>
                  {getFileIcon(selectedFile.type)}
                </div>
                <div className={styles.fileInfo}>
                  <div className={styles.fileName}>{selectedFile.name}</div>
                  <div className={styles.fileSize}>
                    {formatFileSize(selectedFile.size)}
                  </div>
                </div>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                  className={styles.removeFile}
                >
                  ❌
                </button>
              </div>
            ) : (
              <div className={styles.dropZoneContent}>
                <div className={styles.dropZoneIcon}>📁</div>
                <div className={styles.dropZoneText}>
                  <p>CLICK TO SELECT FILE</p>
                  <p>OR DRAG & DROP HERE</p>
                  <p className={styles.dropZoneHint}>
                    Max file size: 500MB
                  </p>
                </div>
              </div>
            )}
            
            <input
              ref={fileInputRef}
              type="file"
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
            disabled={!selectedFile || uploading}
            className={styles.uploadButton}
          >
            {uploading ? 'UPLOADING...' : 'UPLOAD FILE'}
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
