/**
 * Client-side rate limiting to prevent API abuse
 * Note: This is not a security measure, but helps reduce server load
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
  keyGenerator?: () => string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

export class RateLimiter {
  private store = new Map<string, RateLimitEntry>();
  private config: Required<RateLimitConfig>;

  constructor(config: RateLimitConfig) {
    this.config = {
      keyGenerator: () => 'default',
      ...config,
    };
  }

  /**
   * Check if request is allowed under rate limit
   */
  isAllowed(): { allowed: boolean; resetTime?: number; remaining?: number } {
    const key = this.config.keyGenerator();
    const now = Date.now();
    
    // Clean up expired entries
    this.cleanup(now);
    
    const entry = this.store.get(key);
    
    if (!entry) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + this.config.windowMs,
      });
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: now + this.config.windowMs,
      };
    }
    
    if (now >= entry.resetTime) {
      // Reset window
      entry.count = 1;
      entry.resetTime = now + this.config.windowMs;
      
      return {
        allowed: true,
        remaining: this.config.maxRequests - 1,
        resetTime: entry.resetTime,
      };
    }
    
    if (entry.count >= this.config.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        resetTime: entry.resetTime,
        remaining: 0,
      };
    }
    
    // Increment count
    entry.count += 1;
    
    return {
      allowed: true,
      remaining: this.config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    };
  }

  /**
   * Get current rate limit status
   */
  getStatus(): { remaining: number; resetTime: number } {
    const key = this.config.keyGenerator();
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry || now >= entry.resetTime) {
      return {
        remaining: this.config.maxRequests,
        resetTime: now + this.config.windowMs,
      };
    }
    
    return {
      remaining: Math.max(0, this.config.maxRequests - entry.count),
      resetTime: entry.resetTime,
    };
  }

  private cleanup(now: number) {
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}

// Pre-configured rate limiters for different operations
export const chatRateLimiter = new RateLimiter({
  maxRequests: 10, // 10 messages per minute
  windowMs: 60 * 1000, // 1 minute
});

export const imageGenerationRateLimiter = new RateLimiter({
  maxRequests: 5, // 5 images per 5 minutes
  windowMs: 5 * 60 * 1000, // 5 minutes
});

export const uploadRateLimiter = new RateLimiter({
  maxRequests: 20, // 20 uploads per 10 minutes
  windowMs: 10 * 60 * 1000, // 10 minutes
});

/**
 * Higher-order function to add rate limiting to async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  rateLimiter: RateLimiter,
  errorMessage = 'Rate limit exceeded. Please try again later.'
): T {
  return (async (...args: any[]) => {
    const { allowed, resetTime } = rateLimiter.isAllowed();
    
    if (!allowed) {
      const resetDate = new Date(resetTime!);
      const timeUntilReset = Math.ceil((resetTime! - Date.now()) / 1000);
      
      throw new Error(`${errorMessage} Try again in ${timeUntilReset} seconds.`);
    }
    
    return fn(...args);
  }) as T;
}

/**
 * React hook for rate limiting
 */
export function useRateLimit(rateLimiter: RateLimiter) {
  const checkLimit = () => rateLimiter.isAllowed();
  const getStatus = () => rateLimiter.getStatus();
  
  return { checkLimit, getStatus };
}

/**
 * Decorator for adding rate limiting to class methods
 */
export function rateLimit(rateLimiter: RateLimiter, errorMessage?: string) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const { allowed, resetTime } = rateLimiter.isAllowed();
      
      if (!allowed) {
        const timeUntilReset = Math.ceil((resetTime! - Date.now()) / 1000);
        throw new Error(
          errorMessage || 
          `Rate limit exceeded for ${propertyKey}. Try again in ${timeUntilReset} seconds.`
        );
      }
      
      return originalMethod.apply(this, args);
    };
    
    return descriptor;
  };
}
