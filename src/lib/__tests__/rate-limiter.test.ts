import { describe, it, expect, beforeEach, vi } from 'vitest'
import { withRateLimit } from '../rate-limiter'

// Import the actual classes to create fresh instances for each test
import { RateLimiter } from '../rate-limiter'

// Create fresh instances for each test to avoid shared state
const createChatRateLimiter = () => new RateLimiter({
  maxRequests: 10,
  windowMs: 60 * 1000,
})

const createImageGenerationRateLimiter = () => new RateLimiter({
  maxRequests: 5,
  windowMs: 5 * 60 * 1000,
})

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clear rate limiter state between tests
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Rate Limiting Logic', () => {
    it('should allow requests within limit', () => {
      const chatRateLimiter = createChatRateLimiter()
      const result1 = chatRateLimiter.isAllowed()
      const result2 = chatRateLimiter.isAllowed()
      
      expect(result1.allowed).toBe(true)
      expect(result2.allowed).toBe(true)
      expect(result1.remaining).toBe(9)
      expect(result2.remaining).toBe(8)
    })

    it('should block requests when limit exceeded', () => {
      const chatRateLimiter = createChatRateLimiter()
      // Make 10 requests (the limit)
      for (let i = 0; i < 10; i++) {
        chatRateLimiter.isAllowed()
      }
      
      // 11th request should be blocked
      const result = chatRateLimiter.isAllowed()
      
      expect(result.allowed).toBe(false)
      expect(result.remaining).toBe(0)
      expect(result.resetTime).toBeDefined()
    })

    it('should reset after time window', () => {
      // Exhaust the rate limit
      for (let i = 0; i < 10; i++) {
        chatRateLimiter.isAllowed()
      }
      
      // Should be blocked
      expect(chatRateLimiter.isAllowed().allowed).toBe(false)
      
      // Advance time past the window (1 minute for chat)
      vi.advanceTimersByTime(61 * 1000)
      
      // Should be allowed again
      const result = chatRateLimiter.isAllowed()
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(9)
    })

    it('should track status correctly', () => {
      // Make 3 requests
      chatRateLimiter.isAllowed()
      chatRateLimiter.isAllowed()
      chatRateLimiter.isAllowed()
      
      const status = chatRateLimiter.getStatus()
      expect(status.remaining).toBe(7)
      expect(status.resetTime).toBeGreaterThan(Date.now())
    })
  })

  describe('withRateLimit HOF', () => {
    it('should allow function execution within limit', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const rateLimitedFn = withRateLimit(mockFn, imageGenerationRateLimiter)
      
      const result = await rateLimitedFn('test')
      
      expect(result).toBe('success')
      expect(mockFn).toHaveBeenCalledWith('test')
    })

    it('should throw error when rate limit exceeded', async () => {
      const mockFn = vi.fn().mockResolvedValue('success')
      const rateLimitedFn = withRateLimit(mockFn, imageGenerationRateLimiter)
      
      // Exhaust rate limit (5 for image generation)
      for (let i = 0; i < 5; i++) {
        await rateLimitedFn('test')
      }
      
      // 6th call should throw
      await expect(rateLimitedFn('test')).rejects.toThrow('Rate limit exceeded')
      
      // Original function should not be called
      expect(mockFn).toHaveBeenCalledTimes(5)
    })

    it('should provide custom error message', async () => {
      const mockFn = vi.fn()
      const customMessage = 'Custom rate limit message'
      const rateLimitedFn = withRateLimit(mockFn, imageGenerationRateLimiter, customMessage)
      
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        await rateLimitedFn()
      }
      
      await expect(rateLimitedFn()).rejects.toThrow(customMessage)
    })
  })

  describe('Different Rate Limiters', () => {
    it('should have independent limits', () => {
      // Chat allows 10 per minute
      for (let i = 0; i < 10; i++) {
        expect(chatRateLimiter.isAllowed().allowed).toBe(true)
      }
      expect(chatRateLimiter.isAllowed().allowed).toBe(false)
      
      // Image generation should still work (5 per 5 minutes)
      expect(imageGenerationRateLimiter.isAllowed().allowed).toBe(true)
    })
  })
})
