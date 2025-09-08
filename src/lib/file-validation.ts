import { ValidationError } from "./error-handler";

export interface FileValidationOptions {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  maxFiles?: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

// Default validation settings
const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
  maxFiles: 5,
};

/**
 * Comprehensive file validation for uploads
 */
export function validateFile(file: File, options: FileValidationOptions = {}): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const warnings: string[] = [];
  
  // Check file size
  if (file.size > opts.maxSize) {
    return {
      isValid: false,
      error: `File "${file.name}" is too large. Maximum size is ${formatFileSize(opts.maxSize)}.`,
    };
  }

  // Check file type
  if (!opts.allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not supported. Allowed types: ${opts.allowedTypes.join(', ')}.`,
    };
  }

  // Security checks - file extension validation
  const fileExtension = getFileExtension(file.name);
  const allowedExtensions = opts.allowedTypes.map(type => getExtensionFromMimeType(type));
  
  if (!allowedExtensions.includes(fileExtension)) {
    return {
      isValid: false,
      error: `File extension "${fileExtension}" doesn't match the file type. This could be a security risk.`,
    };
  }

  // Performance warnings
  if (file.size > 5 * 1024 * 1024) { // 5MB
    warnings.push(`Large file (${formatFileSize(file.size)}) may take longer to process.`);
  }

  // Check for suspicious file names
  if (containsSuspiciousContent(file.name)) {
    return {
      isValid: false,
      error: `File name contains suspicious characters. Please rename the file.`,
    };
  }

  return {
    isValid: true,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[], options: FileValidationOptions = {}): ValidationResult {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // Check total number of files
  if (files.length > opts.maxFiles) {
    return {
      isValid: false,
      error: `Too many files selected. Maximum is ${opts.maxFiles} files.`,
    };
  }

  // Validate each file
  for (const file of files) {
    const result = validateFile(file, options);
    if (!result.isValid) {
      return result;
    }
  }

  // Check total size
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = opts.maxSize * opts.maxFiles;
  
  if (totalSize > maxTotalSize) {
    return {
      isValid: false,
      error: `Total file size is too large. Maximum combined size is ${formatFileSize(maxTotalSize)}.`,
    };
  }

  return { isValid: true };
}

/**
 * Sanitize file name for safe storage
 */
export function sanitizeFileName(fileName: string): string {
  // Split filename and extension to preserve the dot
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    // No extension
    return fileName
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .toLowerCase();
  }
  
  const name = fileName.substring(0, lastDotIndex);
  const extension = fileName.substring(lastDotIndex);
  
  const sanitizedName = name
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_{2,}/g, '_')
    .replace(/^_+|_+$/g, '');
    
  const sanitizedExtension = extension
    .replace(/[^a-zA-Z0-9.]/g, '')
    .toLowerCase();
  
  return (sanitizedName + sanitizedExtension).toLowerCase();
}

/**
 * Generate a secure file name with timestamp
 */
export function generateSecureFileName(originalName: string): string {
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const extension = getFileExtension(originalName);
  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  const sanitizedBase = sanitizeFileName(baseName);
  
  return `${sanitizedBase}_${timestamp}_${randomSuffix}.${extension}`;
}

/**
 * Check if file content matches its declared type (basic check)
 */
export async function validateFileContent(file: File): Promise<ValidationResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      if (!buffer) {
        resolve({
          isValid: false,
          error: 'Could not read file content.',
        });
        return;
      }

      const bytes = new Uint8Array(buffer.slice(0, 8));
      const isValidImage = validateImageMagicBytes(bytes, file.type);
      
      if (!isValidImage) {
        resolve({
          isValid: false,
          error: 'File content does not match its declared type. This could be a security risk.',
        });
        return;
      }

      resolve({ isValid: true });
    };

    reader.onerror = () => {
      resolve({
        isValid: false,
        error: 'Could not read file for validation.',
      });
    };

    reader.readAsArrayBuffer(file.slice(0, 8)); // Read first 8 bytes for magic number check
  });
}

// Helper functions

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getFileExtension(fileName: string): string {
  return fileName.split('.').pop()?.toLowerCase() || '';
}

function getExtensionFromMimeType(mimeType: string): string {
  const mimeToExt: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/gif': 'gif',
  };
  return mimeToExt[mimeType] || '';
}

function containsSuspiciousContent(fileName: string): boolean {
  const suspiciousPatterns = [
    /\.(exe|bat|cmd|scr|com|pif|vbs|js|jar|php|asp|jsp)$/i,
    /%[0-9a-f]{2}/i, // URL encoding
    /[<>:"\\|?*]/,    // Windows reserved chars
    /^\./,            // Hidden files (Unix)
    /\.\./,           // Path traversal
  ];
  
  return suspiciousPatterns.some(pattern => pattern.test(fileName));
}

function validateImageMagicBytes(bytes: Uint8Array, expectedType: string): boolean {
  // Check magic bytes for common image formats
  const magicNumbers: Record<string, number[][]> = {
    'image/jpeg': [[0xFF, 0xD8, 0xFF]],
    'image/png': [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    'image/webp': [[0x52, 0x49, 0x46, 0x46]], // Note: WebP also has "WEBP" at bytes 8-11
    'image/gif': [[0x47, 0x49, 0x46, 0x38]], // GIF87a or GIF89a
  };

  const expectedSignatures = magicNumbers[expectedType];
  if (!expectedSignatures) return true; // Unknown type, skip validation

  return expectedSignatures.some(signature =>
    signature.every((byte, index) => bytes[index] === byte)
  );
}
