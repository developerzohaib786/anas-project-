import { describe, it, expect, vi, beforeEach } from 'vitest'
import { handleError, ApiError, NetworkError, ValidationError, AuthError } from '../error-handler'

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}))

// Mock analytics
vi.mock('../analytics', () => ({
  analytics: {
    trackError: vi.fn(),
  },
}))

describe('Error Handler', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('handleError', () => {
    it('should handle ApiError correctly', () => {
      const error = new ApiError('Test API error', 'TEST_CODE', 400)
      const result = handleError(error, 'Test context')
      
      expect(result).toBeInstanceOf(ApiError)
      expect(result.message).toBe('Test API error')
      expect(result.code).toBe('TEST_CODE')
      expect(result.statusCode).toBe(400)
    })

    it('should convert string errors to ApiError', () => {
      const result = handleError('Simple error message')
      
      expect(result).toBeInstanceOf(ApiError)
      expect(result.message).toBe('Simple error message')
      expect(result.code).toBe('API_ERROR')
    })

    it('should convert fetch errors to NetworkError', () => {
      const error = new Error('fetch failed')
      const result = handleError(error)
      
      expect(result).toBeInstanceOf(NetworkError)
      expect(result.retryable).toBe(true)
    })

    it('should convert auth errors to AuthError', () => {
      const error = new Error('unauthorized access')
      const result = handleError(error)
      
      expect(result).toBeInstanceOf(AuthError)
      expect(result.code).toBe('AUTH_ERROR')
    })

    it('should handle unknown error types', () => {
      const result = handleError(123)
      
      expect(result).toBeInstanceOf(ApiError)
      expect(result.message).toBe('An unexpected error occurred')
    })
  })

  describe('Error Classes', () => {
    it('should create ValidationError with correct properties', () => {
      const error = new ValidationError('Invalid input')
      
      expect(error.name).toBe('ValidationError')
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.statusCode).toBe(400)
      expect(error.retryable).toBe(false)
    })

    it('should create NetworkError with correct properties', () => {
      const error = new NetworkError('Connection failed')
      
      expect(error.name).toBe('NetworkError')
      expect(error.code).toBe('NETWORK_ERROR')
      expect(error.retryable).toBe(true)
    })

    it('should create AuthError with correct properties', () => {
      const error = new AuthError('Authentication failed')
      
      expect(error.name).toBe('AuthError')
      expect(error.code).toBe('AUTH_ERROR')
      expect(error.statusCode).toBe(401)
      expect(error.retryable).toBe(false)
    })
  })
})
