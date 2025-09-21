/**
 * Image optimization utilities for better performance and loading
 */

export interface ImageOptimizationOptions {
  quality?: number;
  format?: 'auto' | 'webp' | 'jpg' | 'png';
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'scale' | 'crop';
}

/**
 * Generate optimized Cloudinary URL with transformations
 */
export function getOptimizedImageUrl(
  originalUrl: string, 
  options: ImageOptimizationOptions = {}
): string {
  if (!originalUrl || !originalUrl.includes('cloudinary.com')) {
    return originalUrl;
  }

  const {
    quality = 'auto:good',
    format = 'auto',
    width,
    height,
    crop = 'fill'
  } = options;

  try {
    const url = new URL(originalUrl);
    const pathParts = url.pathname.split('/');
    
    // Find the upload part in the path
    const uploadIndex = pathParts.findIndex(part => part === 'upload');
    if (uploadIndex === -1) return originalUrl;

    // Build transformation string
    const transformations = [];
    
    if (quality) transformations.push(`q_${quality}`);
    if (format) transformations.push(`f_${format}`);
    if (width) transformations.push(`w_${width}`);
    if (height) transformations.push(`h_${height}`);
    if (crop && (width || height)) transformations.push(`c_${crop}`);
    
    // Add progressive loading for better perceived performance
    transformations.push('fl_progressive');
    
    // Insert transformations after 'upload'
    if (transformations.length > 0) {
      pathParts.splice(uploadIndex + 1, 0, transformations.join(','));
    }
    
    url.pathname = pathParts.join('/');
    return url.toString();
  } catch (error) {
    console.warn('Failed to optimize image URL:', error);
    return originalUrl;
  }
}

/**
 * Generate responsive image URLs for different screen sizes
 */
export function getResponsiveImageUrls(originalUrl: string) {
  return {
    thumbnail: getOptimizedImageUrl(originalUrl, { width: 150, height: 150, quality: 'auto:low' }),
    small: getOptimizedImageUrl(originalUrl, { width: 400, quality: 'auto:good' }),
    medium: getOptimizedImageUrl(originalUrl, { width: 800, quality: 'auto:good' }),
    large: getOptimizedImageUrl(originalUrl, { width: 1200, quality: 'auto:best' }),
    original: originalUrl
  };
}

/**
 * Preload critical images for better performance
 */
export function preloadImage(url: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error(`Failed to preload image: ${url}`));
    img.src = url;
  });
}

/**
 * Lazy load images with intersection observer
 */
export function setupLazyLoading(selector: string = 'img[loading="lazy"]') {
  if (!('IntersectionObserver' in window)) {
    return; // Fallback for older browsers
  }

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px 0px', // Start loading 50px before the image enters viewport
    threshold: 0.01
  });

  document.querySelectorAll(selector).forEach(img => {
    imageObserver.observe(img);
  });
}

/**
 * Compress image file before upload
 */
export function compressImage(
  file: File, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080, 
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width *= ratio;
        height *= ratio;
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const compressedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(compressedFile);
          } else {
            reject(new Error('Failed to compress image'));
          }
        },
        file.type,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if image format is supported for optimization
 */
export function isOptimizableFormat(mimeType: string): boolean {
  const optimizableFormats = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/gif'
  ];
  return optimizableFormats.includes(mimeType.toLowerCase());
}

/**
 * Get optimal image dimensions based on container size
 */
export function getOptimalDimensions(
  containerWidth: number,
  containerHeight: number,
  devicePixelRatio: number = window.devicePixelRatio || 1
) {
  return {
    width: Math.ceil(containerWidth * devicePixelRatio),
    height: Math.ceil(containerHeight * devicePixelRatio)
  };
}