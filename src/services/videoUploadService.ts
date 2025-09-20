import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY,
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET,
});

export interface UploadedVideo {
  id: string;
  name: string;
  url: string;
  publicUrl: string;
  size: number;
  type: string;
  duration?: number;
  metadata?: Record<string, any>;
}

export class VideoUploadService {
  /**
   * Upload a video file to Cloudinary
   */
  static async uploadVideo(
    file: File,
    user: any,
    metadata?: Record<string, any>
  ): Promise<UploadedVideo> {
    try {
      // Convert file to base64 for upload
      const base64 = await this.fileToBase64(file);
      
      // Upload to Cloudinary
      const result = await cloudinary.uploader.upload(base64, {
        resource_type: 'video',
        folder: `videos/${user.id}`,
        public_id: `video_${Date.now()}`,
        transformation: [
          { quality: 'auto' },
          { format: 'mp4' }
        ],
        metadata: metadata || {}
      });

      return {
        id: result.public_id,
        name: file.name,
        url: result.secure_url,
        publicUrl: result.secure_url,
        size: file.size,
        type: file.type,
        duration: result.duration,
        metadata: {
          ...metadata,
          cloudinary_id: result.public_id,
          format: result.format,
          width: result.width,
          height: result.height,
          bit_rate: result.bit_rate,
          frame_rate: result.frame_rate
        }
      };
    } catch (error) {
      console.error('Error uploading video to Cloudinary:', error);
      throw new Error(`Failed to upload video: ${error.message}`);
    }
  }

  /**
   * Upload multiple video files
   */
  static async uploadMultipleVideos(
    files: File[],
    user: any,
    metadata?: Record<string, any>
  ): Promise<UploadedVideo[]> {
    const uploadPromises = files.map(file => 
      this.uploadVideo(file, user, metadata)
    );
    
    return Promise.all(uploadPromises);
  }

  /**
   * Delete a video from Cloudinary
   */
  static async deleteVideo(publicId: string): Promise<boolean> {
    try {
      const result = await cloudinary.uploader.destroy(publicId, {
        resource_type: 'video'
      });
      return result.result === 'ok';
    } catch (error) {
      console.error('Error deleting video from Cloudinary:', error);
      return false;
    }
  }

  /**
   * Get video information from Cloudinary
   */
  static async getVideoInfo(publicId: string): Promise<any> {
    try {
      const result = await cloudinary.api.resource(publicId, {
        resource_type: 'video'
      });
      return result;
    } catch (error) {
      console.error('Error getting video info from Cloudinary:', error);
      throw error;
    }
  }

  /**
   * Generate optimized video URL with transformations
   */
  static generateOptimizedVideoUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      quality?: string;
      format?: string;
    }
  ): string {
    const transformations: any[] = [];

    if (options?.width || options?.height) {
      transformations.push({
        width: options.width,
        height: options.height,
        crop: 'fill'
      });
    }

    if (options?.quality) {
      transformations.push({ quality: options.quality });
    }

    if (options?.format) {
      transformations.push({ format: options.format });
    }

    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: transformations
    });
  }

  /**
   * Convert File to base64 string
   */
  private static fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Validate video file
   */
  static validateVideoFile(file: File): { isValid: boolean; error?: string } {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const allowedTypes = [
      'video/mp4',
      'video/webm',
      'video/ogg',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/flv'
    ];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Invalid video format. Supported formats: MP4, WebM, OGG, AVI, MOV, WMV, FLV'
      };
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'Video file too large. Maximum size is 100MB'
      };
    }

    return { isValid: true };
  }
}

export default VideoUploadService;