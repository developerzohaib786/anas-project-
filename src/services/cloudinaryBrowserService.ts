// Browser-compatible Cloudinary service using fetch API instead of Node.js SDK
export interface UploadedMedia {
  id: string;
  url: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  cloudinaryPublicId?: string;
  thumbnailUrl?: string;
}

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export interface CloudinaryUploadOptions {
  folder?: string;
  transformation?: any;
  resourceType?: 'image' | 'video' | 'raw' | 'auto';
  tags?: string[];
  context?: Record<string, string>;
}

export class CloudinaryBrowserService {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for Cloudinary
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/heic',
    'image/heif'
  ];
  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime',
    'video/mkv'
  ];

  private static getCloudinaryConfig() {
    return {
      cloudName: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
      apiKey: import.meta.env.VITE_CLOUDINARY_API_KEY,
      apiSecret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
    };
  }

  static validateFile(file: File): { isValid: boolean; error?: string } {
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      };
    }

    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: `File type ${file.type} is not supported`
      };
    }

    return { isValid: true };
  }

  static async uploadFile(
    file: File,
    user: any,
    options: CloudinaryUploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    const validation = this.validateFile(file);
    if (!validation.isValid) {
      throw new Error(validation.error);
    }

    const config = this.getCloudinaryConfig();
    if (!config.cloudName) {
      throw new Error('Cloudinary configuration is missing');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'unsigned_preset'); // You'll need to create this in Cloudinary
    
    if (options.folder) {
      formData.append('folder', options.folder);
    }
    
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }

    if (onProgress) {
      onProgress({ progress: 0, isUploading: true });
    }

    try {
      const resourceType = options.resourceType || (
        this.ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'video'
      );

      const uploadUrl = `https://api.cloudinary.com/v1_1/${config.cloudName}/${resourceType}/upload`;

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();

      if (onProgress) {
        onProgress({ progress: 100, isUploading: false });
      }

      return {
        id: result.public_id,
        url: result.secure_url,
        publicUrl: result.secure_url,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date(),
        cloudinaryPublicId: result.public_id,
        thumbnailUrl: result.eager?.[0]?.secure_url || result.secure_url,
      };
    } catch (error) {
      if (onProgress) {
        onProgress({ 
          progress: 0, 
          isUploading: false, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
      }
      throw error;
    }
  }

  static async uploadFromDataUrl(
    dataUrl: string,
    fileName: string,
    user: any,
    metadata: Record<string, any> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    // Convert data URL to blob
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    
    // Create a File object from the blob
    const file = new File([blob], fileName, { type: blob.type });
    
    return this.uploadFile(file, user, {
      context: metadata,
      tags: metadata.is_generated ? ['ai-generated'] : ['user-upload']
    }, onProgress);
  }

  static async uploadFromBlobUrl(
    blobUrl: string,
    fileName: string,
    user: any,
    options: CloudinaryUploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    // Convert blob URL to blob
    const response = await fetch(blobUrl);
    const blob = await response.blob();
    
    // Create a File object from the blob
    const file = new File([blob], fileName, { type: blob.type });
    
    return this.uploadFile(file, user, options, onProgress);
  }

  static generateOptimizedUrl(
    publicId: string,
    options: {
      width?: number;
      height?: number;
      quality?: string | number;
      format?: string;
      crop?: string;
      resourceType?: 'image' | 'video';
    } = {}
  ): string {
    const config = this.getCloudinaryConfig();
    const { width, height, quality = 'auto', format = 'auto', crop = 'fill', resourceType = 'image' } = options;
    
    let transformations = [];
    
    if (width || height) {
      transformations.push(`c_${crop}`);
      if (width) transformations.push(`w_${width}`);
      if (height) transformations.push(`h_${height}`);
    }
    
    transformations.push(`q_${quality}`);
    transformations.push(`f_${format}`);
    
    const transformString = transformations.join(',');
    
    return `https://res.cloudinary.com/${config.cloudName}/${resourceType}/upload/${transformString}/${publicId}`;
  }
}

export default CloudinaryBrowserService;