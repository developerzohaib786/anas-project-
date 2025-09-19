import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
});

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

export class CloudinaryService {
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

  /**
   * Validate file before upload
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      };
    }

    // Check file type
    const isValidImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isValidVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isValidImage && !isValidVideo) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload images or videos only.'
      };
    }

    return { isValid: true };
  }

  /**
   * Upload file to Cloudinary using unsigned upload
   */
  static async uploadFile(
    file: File,
    user: any,
    options: CloudinaryUploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    try {
      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Check if user is authenticated
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Determine resource type
      const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);
      const resourceType = options.resourceType || (isVideo ? 'video' : 'image');

      // Create form data for upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      // Add folder structure
      const folder = options.folder || import.meta.env.VITE_CLOUDINARY_FOLDER || 'chat-app';
      const userFolder = `${folder}/${user.id}`;
      formData.append('folder', userFolder);

      // Add tags
      const tags = [
        'chat-app',
        resourceType,
        user.id,
        ...(options.tags || [])
      ];
      formData.append('tags', tags.join(','));

      // Add context metadata
      const context = {
        user_id: user.id,
        upload_timestamp: new Date().toISOString(),
        original_filename: file.name,
        ...(options.context || {})
      };
      formData.append('context', Object.entries(context).map(([k, v]) => `${k}=${v}`).join('|'));

      // Update progress
      onProgress?.({ progress: 0, isUploading: true });

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();

      // Update progress to complete
      onProgress?.({ progress: 100, isUploading: false });

      // Generate thumbnail URL for videos
      let thumbnailUrl: string | undefined;
      if (resourceType === 'video') {
        thumbnailUrl = cloudinary.url(result.public_id, {
          resource_type: 'video',
          format: 'jpg',
          transformation: [
            { width: 300, height: 200, crop: 'fill' },
            { quality: 'auto' }
          ]
        });
      }

      const uploadedMedia: UploadedMedia = {
        id: result.public_id,
        url: result.secure_url,
        publicUrl: result.secure_url,
        fileName: file.name,
        fileSize: result.bytes,
        mimeType: file.type,
        uploadedAt: new Date(),
        cloudinaryPublicId: result.public_id,
        thumbnailUrl
      };

      return uploadedMedia;

    } catch (error) {
      onProgress?.({ 
        progress: 0, 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
      throw error;
    }
  }

  /**
   * Upload from data URL (for AI-generated content)
   */
  static async uploadFromDataUrl(
    dataUrl: string,
    fileName: string,
    user: any,
    metadata: Record<string, any> = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    try {
      if (!user) {
        throw new Error('User not authenticated');
      }

      onProgress?.({ progress: 0, isUploading: true });

      // Create form data
      const formData = new FormData();
      formData.append('file', dataUrl);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
      
      // Add folder
      const folder = import.meta.env.VITE_CLOUDINARY_FOLDER || 'chat-app';
      const userFolder = `${folder}/${user.id}/generated`;
      formData.append('folder', userFolder);

      // Add tags for generated content
      const tags = ['chat-app', 'generated', 'ai-image', user.id];
      formData.append('tags', tags.join(','));

      // Add context metadata
      const context = {
        user_id: user.id,
        generated: 'true',
        upload_timestamp: new Date().toISOString(),
        original_filename: fileName,
        ...metadata
      };
      formData.append('context', Object.entries(context).map(([k, v]) => `${k}=${v}`).join('|'));

      // Upload to Cloudinary
      const uploadUrl = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Upload failed');
      }

      const result = await response.json();

      onProgress?.({ progress: 100, isUploading: false });

      const uploadedMedia: UploadedMedia = {
        id: result.public_id,
        url: result.secure_url,
        publicUrl: result.secure_url,
        fileName,
        fileSize: result.bytes,
        mimeType: 'image/png',
        uploadedAt: new Date(),
        cloudinaryPublicId: result.public_id
      };

      return uploadedMedia;

    } catch (error) {
      onProgress?.({ 
        progress: 0, 
        isUploading: false, 
        error: error instanceof Error ? error.message : 'Upload failed' 
      });
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  static async uploadFiles(
    files: File[],
    user: any,
    options: CloudinaryUploadOptions = {},
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadedMedia[]> {
    const uploadedFiles: UploadedMedia[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const uploadedFile = await this.uploadFile(
          files[i],
          user,
          options,
          (progress) => onProgress?.(i, progress)
        );
        uploadedFiles.push(uploadedFile);
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error);
        onProgress?.(i, { 
          progress: 0, 
          isUploading: false, 
          error: error instanceof Error ? error.message : 'Upload failed' 
        });
        // Continue with other files instead of failing completely
      }
    }

    return uploadedFiles;
  }

  /**
   * Delete file from Cloudinary
   */
  static async deleteFile(publicId: string, resourceType: 'image' | 'video' = 'image'): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Failed to delete file from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Generate optimized URL with transformations
   */
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
    return cloudinary.url(publicId, {
      resource_type: options.resourceType || 'image',
      transformation: [
        {
          width: options.width,
          height: options.height,
          crop: options.crop || 'fill',
          quality: options.quality || 'auto',
          format: options.format || 'auto'
        }
      ]
    });
  }

  /**
   * Get file info from Cloudinary
   */
  static async getFileInfo(publicId: string, resourceType: 'image' | 'video' = 'image') {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: resourceType
      });
      return result;
    } catch (error) {
      console.error('Failed to get file info from Cloudinary:', error);
      return null;
    }
  }
}

export default CloudinaryService;