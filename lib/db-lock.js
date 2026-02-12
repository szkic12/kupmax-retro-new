// Simple file-based lock for database operations
const fs = require('fs');
const path = require('path');

const LOCK_FILE = './data/.db.lock';
const LOCK_TIMEOUT = 10000; // 10 seconds

class DatabaseLock {
  constructor() {
    this.lockPath = path.resolve(LOCK_FILE);
  }

  async acquire() {
    const startTime = Date.now();

    while (true) {
      try {
        // Try to create lock file (exclusive)
        fs.writeFileSync(this.lockPath, process.pid.toString(), { flag: 'wx' });
        return true;
      } catch (error) {
        // Lock exists
        if (Date.now() - startTime > LOCK_TIMEOUT) {
          // Timeout - force remove stale lock
          console.warn('[DatabaseLock] Timeout - removing stale lock');
          this.release();
          continue;
        }

        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }
  }

  release() {
    try {
      if (fs.existsSync(this.lockPath)) {
        fs.unlinkSync(this.lockPath);
      }
    } catch (error) {
      console.error('[DatabaseLock] Error releasing lock:', error);
    }
  }

  async withLock(fn) {
    await this.acquire();
    try {
      return await fn();
    } finally {
      this.release();
    }
  }
}

module.exports = new DatabaseLock();
