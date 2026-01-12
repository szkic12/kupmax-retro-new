// Professional Rate Limiter for Webring API - 2025 Best Practices
// Uses in-memory store for simplicity, consider Redis for production

class RateLimiter {
  constructor() {
    this.requests = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 60 * 1000); // Cleanup every minute
  }

  // Clean up old entries to prevent memory leaks
  cleanup() {
    const now = Date.now();
    for (const [key, data] of this.requests.entries()) {
      if (now - data.lastReset > 60 * 60 * 1000) { // 1 hour
        this.requests.delete(key);
      }
    }
  }

  // Check if request is allowed
  isAllowed(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const now = Date.now();
    const key = `${identifier}`;
    
    if (!this.requests.has(key)) {
      this.requests.set(key, {
        count: 1,
        lastReset: now,
        windowStart: now
      });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    const data = this.requests.get(key);
    
    // Reset if window has passed
    if (now - data.windowStart > windowMs) {
      data.count = 1;
      data.windowStart = now;
      data.lastReset = now;
      return { allowed: true, remaining: maxRequests - 1 };
    }

    // Check if limit exceeded
    if (data.count >= maxRequests) {
      return { 
        allowed: false, 
        remaining: 0,
        resetTime: data.windowStart + windowMs
      };
    }

    // Increment count
    data.count++;
    data.lastReset = now;
    
    return { 
      allowed: true, 
      remaining: maxRequests - data.count
    };
  }

  // Get rate limit info without consuming a request
  getRateLimitInfo(identifier, maxRequests = 100, windowMs = 15 * 60 * 1000) {
    const key = `${identifier}`;
    
    if (!this.requests.has(key)) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: Date.now() + windowMs
      };
    }

    const data = this.requests.get(key);
    const now = Date.now();
    
    // Reset if window has passed
    if (now - data.windowStart > windowMs) {
      return {
        allowed: true,
        remaining: maxRequests,
        resetTime: now + windowMs
      };
    }

    return {
      allowed: data.count < maxRequests,
      remaining: Math.max(0, maxRequests - data.count),
      resetTime: data.windowStart + windowMs
    };
  }

  // Destroy the rate limiter (for cleanup)
  destroy() {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Create singleton instance
const rateLimiter = new RateLimiter();

// Rate limiting middleware for Next.js API routes
export const withRateLimit = (handler, options = {}) => {
  const {
    maxRequests = 100,
    windowMs = 15 * 60 * 1000, // 15 minutes
    identifier = 'ip' // 'ip' or 'user'
  } = options;

  return async (req, res) => {
    // Get identifier (IP address or user ID)
    let identifierValue;
    
    if (identifier === 'ip') {
      // Get IP address from request
      identifierValue = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress ||
                       (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                       'unknown';
    } else {
      // For user-based rate limiting, you would use user ID from auth
      identifierValue = req.user?.id || 'anonymous';
    }

    // Check rate limit
    const rateLimitInfo = rateLimiter.isAllowed(identifierValue, maxRequests, windowMs);
    
    if (!rateLimitInfo.allowed) {
      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', maxRequests);
      res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000));
      
      return res.status(429).json({
        success: false,
        error: 'Too many requests',
        message: `Rate limit exceeded. Please try again in ${Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)} seconds.`,
        retryAfter: Math.ceil((rateLimitInfo.resetTime - Date.now()) / 1000)
      });
    }

    // Set rate limit headers for successful requests
    res.setHeader('X-RateLimit-Limit', maxRequests);
    res.setHeader('X-RateLimit-Remaining', rateLimitInfo.remaining);
    res.setHeader('X-RateLimit-Reset', Math.ceil(rateLimitInfo.resetTime / 1000));

    return handler(req, res);
  };
};

// Export the rate limiter instance for direct use
export default rateLimiter;
