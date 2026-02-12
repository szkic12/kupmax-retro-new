// Database for file metadata and download tracking
// Uses local storage for persistence on client, JSON file on server

const STORAGE_KEY = 'kupmax-downloads-files';
const SERVER_DB_PATH = './data/downloads.json';

// Initialize database
const initializeDatabase = () => {
  if (typeof window !== 'undefined') {
    // Client-side - use localStorage
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      const initialData = {
        files: [],
        downloadStats: {},
        totalDownloads: 0,
        totalSize: 0
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialData));
      return initialData;
    }
    return JSON.parse(stored);
  } else {
    // Server-side - use JSON file
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.resolve(SERVER_DB_PATH);
      
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        return JSON.parse(fileContent);
      } else {
        const initialData = {
          files: [],
          downloadStats: {},
          totalDownloads: 0,
          totalSize: 0
        };
        // Create directory if it doesn't exist
        const dir = path.dirname(dbPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(dbPath, JSON.stringify(initialData, null, 2));
        return initialData;
      }
    } catch (error) {
      console.error('Error loading server database:', error);
      return {
        files: [],
        downloadStats: {},
        totalDownloads: 0,
        totalSize: 0
      };
    }
  }
};

// Get database
const getDatabase = () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : initializeDatabase();
  } else {
    return initializeDatabase();
  }
};

// Save database
const saveDatabase = (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    try {
      const fs = require('fs');
      const path = require('path');
      const dbPath = path.resolve(SERVER_DB_PATH);
      
      // Create directory if it doesn't exist
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Error saving server database:', error);
    }
  }
};

// File operations
export const FileDatabase = {
  // Add a new file
  addFile: (fileData) => {
    const db = getDatabase();

    // Check for duplicate ID to prevent overwrite
    const existingFile = db.files.find(f => f.id === fileData.id);
    if (existingFile) {
      console.warn(`File with ID ${fileData.id} already exists, skipping duplicate`);
      return existingFile;
    }

    const file = {
      id: fileData.id || Date.now().toString(),
      name: fileData.name,
      s3Key: fileData.s3Key,
      size: fileData.size,
      type: fileData.type,
      downloads: 0,
      uploadedAt: fileData.uploadedAt || new Date().toISOString(),
      description: fileData.description || '',
      category: fileData.category || '',
      tags: fileData.tags || []
    };

    db.files.push(file);
    db.totalSize += file.size;
    saveDatabase(db);
    return file;
  },

  // Add multiple files at once (batch operation)
  addFiles: (filesData) => {
    const db = getDatabase();
    const addedFiles = [];

    for (const fileData of filesData) {
      // Check for duplicate ID
      const existingFile = db.files.find(f => f.id === fileData.id);
      if (existingFile) {
        console.warn(`File with ID ${fileData.id} already exists, skipping duplicate`);
        continue;
      }

      const file = {
        id: fileData.id || Date.now().toString(),
        name: fileData.name,
        s3Key: fileData.s3Key,
        size: fileData.size,
        type: fileData.type,
        downloads: 0,
        uploadedAt: fileData.uploadedAt || new Date().toISOString(),
        description: fileData.description || '',
        category: fileData.category || '',
        tags: fileData.tags || []
      };

      db.files.push(file);
      db.totalSize += file.size;
      addedFiles.push(file);
    }

    // Save once at the end for better performance
    saveDatabase(db);
    return addedFiles;
  },

  // Get all files
  getFiles: (filters = {}) => {
    const db = getDatabase();
    let files = [...db.files];

    // Apply filters
    if (filters.category && filters.category !== 'all') {
      files = files.filter(file => 
        file.category?.toLowerCase() === filters.category.toLowerCase()
      );
    }

    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      files = files.filter(file =>
        file.name.toLowerCase().includes(searchLower) ||
        file.description?.toLowerCase().includes(searchLower) ||
        file.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Sort
    const sortBy = filters.sortBy || 'uploadedAt';
    const sortOrder = filters.sortOrder || 'desc';
    
    files.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];

      if (sortBy === 'uploadedAt') {
        aValue = new Date(aValue).getTime();
        bValue = new Date(bValue).getTime();
      }

      if (sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return files;
  },

  // Get file by ID
  getFileById: (id) => {
    const db = getDatabase();
    return db.files.find(file => file.id === id);
  },

  // Get file by S3 key
  getFileByS3Key: (s3Key) => {
    const db = getDatabase();
    return db.files.find(file => file.s3Key === s3Key);
  },

  // Increment download count
  incrementDownload: (fileId) => {
    const db = getDatabase();
    const file = db.files.find(f => f.id === fileId);
    if (file) {
      file.downloads += 1;
      db.totalDownloads += 1;
      
      // Track download stats
      const today = new Date().toISOString().split('T')[0];
      if (!db.downloadStats[today]) {
        db.downloadStats[today] = 0;
      }
      db.downloadStats[today] += 1;
      
      saveDatabase(db);
      return file;
    }
    return null;
  },

  // Update file
  updateFile: (fileId, updates) => {
    const db = getDatabase();
    const fileIndex = db.files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      db.files[fileIndex] = { ...db.files[fileIndex], ...updates };
      saveDatabase(db);
      return db.files[fileIndex];
    }
    return null;
  },

  // Delete file
  deleteFile: (fileId) => {
    const db = getDatabase();
    const fileIndex = db.files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      const file = db.files[fileIndex];
      db.totalSize -= file.size;
      db.files.splice(fileIndex, 1);
      saveDatabase(db);
      return true;
    }
    return false;
  },

  // Get statistics
  getStats: () => {
    const db = getDatabase();
    const files = db.files;
    
    return {
      totalFiles: files.length,
      totalDownloads: db.totalDownloads,
      totalSize: db.totalSize,
      categories: [...new Set(files.map(file => file.category).filter(Boolean))],
      recentDownloads: Object.entries(db.downloadStats)
        .sort(([a], [b]) => new Date(b) - new Date(a))
        .slice(0, 30)
        .reduce((acc, [date, count]) => {
          acc[date] = count;
          return acc;
        }, {})
    };
  },

  // Get paginated files
  getPaginatedFiles: (page = 1, limit = 20, filters = {}) => {
    const files = FileDatabase.getFiles(filters);
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;

    const paginatedFiles = files.slice(startIndex, endIndex);
    const totalFiles = files.length;
    const totalPages = Math.ceil(totalFiles / limitNum);

    return {
      files: paginatedFiles,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalFiles,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      }
    };
  }
};

export default FileDatabase;
