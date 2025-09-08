import { describe, it, expect } from 'vitest'
import { validateFile, validateFiles, sanitizeFileName, generateSecureFileName } from '../file-validation'

describe('File Validation', () => {
  // Helper to create mock File objects with specific size
  const createMockFile = (name: string, type: string, size: number) => {
    // Create content of the desired size
    const content = new Array(size).fill('a').join('');
    const file = new File([content], name, { type, lastModified: Date.now() });
    return file;
  }

  describe('validateFile', () => {
    it('should accept valid image files', () => {
      const file = createMockFile('test.jpg', 'image/jpeg', 1024 * 1024) // 1MB
      const result = validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.error).toBeUndefined()
    })

    it('should reject files that are too large', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 15 * 1024 * 1024) // 15MB
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('too large')
    })

    it('should reject unsupported file types', () => {
      const file = createMockFile('document.pdf', 'application/pdf', 1024)
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('not supported')
    })

    it('should detect extension/type mismatches', () => {
      const file = createMockFile('fake.exe', 'image/jpeg', 1024)
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('security risk')
    })

    it('should warn about large files', () => {
      const file = createMockFile('large.jpg', 'image/jpeg', 7 * 1024 * 1024) // 7MB
      const result = validateFile(file)
      
      expect(result.isValid).toBe(true)
      expect(result.warnings).toBeDefined()
      expect(result.warnings?.[0]).toContain('Large file')
    })

    it('should reject suspicious file names', () => {
      const file = createMockFile('../../malicious.jpg', 'image/jpeg', 1024)
      const result = validateFile(file)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('suspicious characters')
    })
  })

  describe('validateFiles', () => {
    it('should accept valid file arrays', () => {
      const files = [
        createMockFile('test1.jpg', 'image/jpeg', 1024),
        createMockFile('test2.png', 'image/png', 2048),
      ]
      const result = validateFiles(files)
      
      expect(result.isValid).toBe(true)
    })

    it('should reject too many files', () => {
      const files = Array.from({ length: 10 }, (_, i) => 
        createMockFile(`test${i}.jpg`, 'image/jpeg', 1024)
      )
      const result = validateFiles(files, { maxFiles: 5 })
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Too many files')
    })

    it('should reject if total size is too large', () => {
      const files = [
        createMockFile('test1.jpg', 'image/jpeg', 8 * 1024 * 1024), // 8MB
        createMockFile('test2.jpg', 'image/jpeg', 8 * 1024 * 1024), // 8MB
      ]
      const result = validateFiles(files)
      
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Total file size')
    })
  })

  describe('sanitizeFileName', () => {
    it('should remove dangerous characters', () => {
      const input = 'my<file>name?.jpg'
      const result = sanitizeFileName(input)
      
      expect(result).toBe('my_file_name_.jpg')
    })

    it('should replace multiple underscores', () => {
      const input = 'my___file___name.jpg'
      const result = sanitizeFileName(input)
      
      expect(result).toBe('my_file_name.jpg')
    })

    it('should remove leading and trailing underscores', () => {
      const input = '___filename___.jpg'
      const result = sanitizeFileName(input)
      
      expect(result).toBe('filename.jpg')
    })

    it('should convert to lowercase', () => {
      const input = 'MyFileName.JPG'
      const result = sanitizeFileName(input)
      
      expect(result).toBe('myfilename.jpg')
    })
  })

  describe('generateSecureFileName', () => {
    it('should generate unique names', () => {
      const name1 = generateSecureFileName('test.jpg')
      const name2 = generateSecureFileName('test.jpg')
      
      expect(name1).not.toBe(name2)
      expect(name1).toMatch(/test_\d+_[a-z0-9]+\.jpg/)
      expect(name2).toMatch(/test_\d+_[a-z0-9]+\.jpg/)
    })

    it('should preserve file extension', () => {
      const result = generateSecureFileName('document.pdf')
      
      expect(result).toMatch(/\.pdf$/)
    })

    it('should sanitize the base name', () => {
      const result = generateSecureFileName('my<dangerous>file.jpg')
      
      expect(result).toMatch(/my_dangerous_file_\d+_[a-z0-9]+\.jpg/)
    })
  })
})
