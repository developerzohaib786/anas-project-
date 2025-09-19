/**
 * HEIC to JPEG/PNG conversion utility
 * Handles conversion of HEIC/HEIF images to more widely supported formats
 */

/**
 * Convert HEIC/HEIF image file to JPEG format
 * @param file - The HEIC/HEIF file to convert
 * @param quality - JPEG quality (0.1 to 1.0, default: 0.8)
 * @returns Promise<File> - Converted JPEG file
 */
export async function convertHeicToJpeg(file: File, quality: number = 0.8): Promise<File> {
  // Check if file needs conversion
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    console.log('🔄 Converting HEIC file to JPEG:', file.name);
    
    // Dynamic import to avoid bundling heic2any if not needed
    const heic2any = await import('heic2any');
    
    const convertedBlob = await heic2any.default({
      blob: file,
      toType: 'image/jpeg',
      quality: Math.max(0.1, Math.min(1.0, quality)) // Ensure quality is within valid range
    });
    
    // Handle both single blob and array of blobs
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    // Create new file with converted content
    const convertedFile = new File(
      [blob as Blob], 
      file.name.replace(/\.heic?$/i, '.jpg'), 
      {
        type: 'image/jpeg',
        lastModified: file.lastModified
      }
    );
    
    console.log('✅ HEIC conversion successful:', {
      original: { name: file.name, size: file.size, type: file.type },
      converted: { name: convertedFile.name, size: convertedFile.size, type: convertedFile.type }
    });
    
    return convertedFile;
  } catch (error) {
    console.error('❌ HEIC conversion failed:', error);
    throw new Error(`Failed to convert HEIC image "${file.name}". Please try converting it to JPEG manually.`);
  }
}

/**
 * Convert HEIC/HEIF image file to PNG format
 * @param file - The HEIC/HEIF file to convert
 * @returns Promise<File> - Converted PNG file
 */
export async function convertHeicToPng(file: File): Promise<File> {
  // Check if file needs conversion
  if (!isHeicFile(file)) {
    return file;
  }

  try {
    console.log('🔄 Converting HEIC file to PNG:', file.name);
    
    const heic2any = await import('heic2any');
    
    const convertedBlob = await heic2any.default({
      blob: file,
      toType: 'image/png'
    });
    
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
    
    const convertedFile = new File(
      [blob as Blob], 
      file.name.replace(/\.heic?$/i, '.png'), 
      {
        type: 'image/png',
        lastModified: file.lastModified
      }
    );
    
    console.log('✅ HEIC to PNG conversion successful:', {
      original: { name: file.name, size: file.size, type: file.type },
      converted: { name: convertedFile.name, size: convertedFile.size, type: convertedFile.type }
    });
    
    return convertedFile;
  } catch (error) {
    console.error('❌ HEIC to PNG conversion failed:', error);
    throw new Error(`Failed to convert HEIC image "${file.name}" to PNG. Please try converting it manually.`);
  }
}

/**
 * Check if a file is a HEIC/HEIF format
 * @param file - File to check
 * @returns boolean - True if file is HEIC/HEIF
 */
export function isHeicFile(file: File): boolean {
  const fileName = file.name.toLowerCase();
  const mimeType = file.type.toLowerCase();
  
  // Check by file extension
  const isHeicExtension = fileName.endsWith('.heic') || fileName.endsWith('.heif');
  
  // Check by MIME type (some browsers may detect it correctly)
  const isHeicMimeType = mimeType === 'image/heic' || mimeType === 'image/heif';
  
  return isHeicExtension || isHeicMimeType;
}

/**
 * Batch convert multiple HEIC files to JPEG
 * @param files - Array of files to convert
 * @param quality - JPEG quality (0.1 to 1.0, default: 0.8)
 * @returns Promise<File[]> - Array of converted files
 */
export async function convertMultipleHeicFiles(files: File[], quality: number = 0.8): Promise<File[]> {
  console.log(`🔄 Converting ${files.length} files, checking for HEIC formats...`);
  
  const conversionPromises = files.map(async (file) => {
    try {
      return await convertHeicToJpeg(file, quality);
    } catch (error) {
      console.error(`❌ Failed to convert ${file.name}:`, error);
      // Return original file if conversion fails
      return file;
    }
  });
  
  const convertedFiles = await Promise.all(conversionPromises);
  
  const heicCount = files.filter(isHeicFile).length;
  if (heicCount > 0) {
    console.log(`✅ Processed ${heicCount} HEIC files out of ${files.length} total files`);
  }
  
  return convertedFiles;
}

/**
 * Get supported file extensions including HEIC
 * @returns string[] - Array of supported extensions
 */
export function getSupportedImageExtensions(): string[] {
  return [
    '.jpg', '.jpeg', '.png', '.webp', '.gif', 
    '.heic', '.heif', '.avif', '.tiff', '.tif', 
    '.bmp', '.svg'
  ];
}

/**
 * Get MIME types including HEIC
 * @returns string[] - Array of supported MIME types
 */
export function getSupportedImageMimeTypes(): string[] {
  return [
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'image/heic', 'image/heif', 'image/avif', 'image/tiff', 'image/tif',
    'image/bmp', 'image/svg+xml'
  ];
}