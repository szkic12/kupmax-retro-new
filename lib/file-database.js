// Database for file metadata and download tracking
// Uses local storage for persistence on client, S3 for server

const STORAGE_KEY = 'kupmax-downloads-files';
const S3_DB_KEY = 'downloads'; // Will be saved as data/downloads.json in S3

// Initialize database
const initializeDatabase = async () => {
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
    // Server-side - use S3
    try {
      const S3Service = require('./aws-s3').default;
      const initialData = {
        files: [],
        downloadStats: {},
        totalDownloads: 0,
        totalSize: 0
      };

      const result = await S3Service.loadJsonData(S3_DB_KEY, initialData);
      return result.data;
    } catch (error) {
      console.error('[FileDatabase] Error loading from S3:', error);
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
const getDatabase = async () => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : await initializeDatabase();
  } else {
    return await initializeDatabase();
  }
};

// Save database to S3
const saveDatabase = async (data) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } else {
    try {
      const S3Service = require('./aws-s3').default;
      console.log(`[FileDatabase] Saving ${data.files.length} files to S3`);

      const result = await S3Service.saveJsonData(S3_DB_KEY, data);

      if (result.success) {
        console.log(`[FileDatabase] Successfully saved database with ${data.files.length} files to S3`);
      } else {
        console.error('[FileDatabase] Failed to save to S3:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('[FileDatabase] Error saving to S3:', error);
      throw error;
    }
  }
};

// File operations
export const FileDatabase = {
  // Get raw database (for admin/sync operations)
  getDatabase: async () => {
    return await getDatabase();
  },

  // Add a new file (async for server-side S3 storage)
  addFile: async (fileData) => {
    const db = await getDatabase();

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
    await saveDatabase(db);
    return file;
  },

  // Add multiple files at once (batch operation) - server-side only
  addFiles: async (filesData) => {
    // Client-side fallback
    if (typeof window !== 'undefined') {
      const results = [];
      for (const fd of filesData) {
        results.push(await FileDatabase.addFile(fd));
      }
      return results;
    }

    // Server-side with lock
    const dbLock = require('./db-lock');

    return await dbLock.withLock(async () => {
      console.log('[FileDatabase] Acquired lock, adding files...');

      // Re-read database inside lock to get fresh state
      const db = await getDatabase();
      const addedFiles = [];

      for (const fileData of filesData) {
        // Check for duplicate ID
        const existingFile = db.files.find(f => f.id === fileData.id);
        if (existingFile) {
          console.warn(`[FileDatabase] File with ID ${fileData.id} already exists, skipping duplicate`);
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
      console.log(`[FileDatabase] Saving ${addedFiles.length} new files (total: ${db.files.length})`);
      await saveDatabase(db);

      return addedFiles;
    });
  },

  // Get all files
  getFiles: async (filters = {}) => {
    const db = await getDatabase();
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
  getFileById: async (id) => {
    const db = await getDatabase();
    return db.files.find(file => file.id === id);
  },

  // Get file by S3 key
  getFileByS3Key: async (s3Key) => {
    const db = await getDatabase();
    return db.files.find(file => file.s3Key === s3Key);
  },

  // Increment download count
  incrementDownload: async (fileId) => {
    const db = await getDatabase();
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

      await saveDatabase(db);
      return file;
    }
    return null;
  },

  // Update file
  updateFile: async (fileId, updates) => {
    const db = await getDatabase();
    const fileIndex = db.files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      db.files[fileIndex] = { ...db.files[fileIndex], ...updates };
      await saveDatabase(db);
      return db.files[fileIndex];
    }
    return null;
  },

  // Delete file
  deleteFile: async (fileId) => {
    const db = await getDatabase();
    const fileIndex = db.files.findIndex(f => f.id === fileId);
    if (fileIndex !== -1) {
      const file = db.files[fileIndex];
      db.totalSize -= file.size;
      db.files.splice(fileIndex, 1);
      await saveDatabase(db);
      return true;
    }
    return false;
  },

  // Get statistics
  getStats: async () => {
    const db = await getDatabase();
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
  getPaginatedFiles: async (page = 1, limit = 20, filters = {}) => {
    const files = await FileDatabase.getFiles(filters);
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
