import { supabase } from '@/lib/supabase';

export interface UploadedMedia {
  id: string;
  url: string;
  publicUrl: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface UploadProgress {
  progress: number;
  isUploading: boolean;
  error?: string;
}

export class MediaUploadService {
  private static readonly BUCKET_NAME = 'chat-attachments';
  private static readonly MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
  private static readonly ALLOWED_IMAGE_TYPES = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml'
  ];
  private static readonly ALLOWED_VIDEO_TYPES = [
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/avi',
    'video/mov',
    'video/quicktime'
  ];

  /**
   * Initialize the storage bucket if it doesn't exist
   */
  static async initializeBucket(): Promise<void> {
    try {
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.BUCKET_NAME);

      if (!bucketExists) {
        const { error } = await supabase.storage.createBucket(this.BUCKET_NAME, {
          public: true,
          allowedMimeTypes: [...this.ALLOWED_IMAGE_TYPES, ...this.ALLOWED_VIDEO_TYPES],
          fileSizeLimit: this.MAX_FILE_SIZE
        });

        if (error) {
          console.error('Failed to create bucket:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error initializing bucket:', error);
      throw error;
    }
  }

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
    const isImage = this.ALLOWED_IMAGE_TYPES.includes(file.type);
    const isVideo = this.ALLOWED_VIDEO_TYPES.includes(file.type);

    if (!isImage && !isVideo) {
      return {
        isValid: false,
        error: 'File type not supported. Please upload images or videos only.'
      };
    }

    return { isValid: true };
  }

  /**
   * Generate a unique file path
   */
  private static generateFilePath(file: File, userId: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileExtension = file.name.split('.').pop() || '';
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    return `${userId}/${timestamp}_${randomId}_${sanitizedName}`;
  }

  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(
    file: File,
    user: any,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadedMedia> {
    try {
      // Check if user is provided
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Validate file
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        throw new Error(validation.error);
      }

      // Initialize bucket
      await this.initializeBucket();

      // Generate unique file path
      const filePath = this.generateFilePath(file, user.id);

      // Update progress
      onProgress?.({ progress: 0, isUploading: true });

      // Upload file
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        onProgress?.({ progress: 0, isUploading: false, error: error.message });
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(filePath);

      // Update progress to complete
      onProgress?.({ progress: 100, isUploading: false });

      const uploadedMedia: UploadedMedia = {
        id: data.path,
        url: data.path,
        publicUrl: publicUrlData.publicUrl,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedAt: new Date()
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
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadedMedia[]> {
    const uploadedFiles: UploadedMedia[] = [];
    
    for (let i = 0; i < files.length; i++) {
      try {
        const uploadedFile = await this.uploadFile(
          files[i],
          user,
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
   * Delete a file from storage
   */
  static async deleteFile(filePath: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([filePath]);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  }

  /**
   * Get file info from storage
   */
  static async getFileInfo(filePath: string): Promise<any> {
    try {
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .list(filePath.split('/').slice(0, -1).join('/'), {
          search: filePath.split('/').pop()
        });

      if (error) {
        throw error;
      }

      return data?.[0] || null;
    } catch (error) {
      console.error('Failed to get file info:', error);
      throw error;
    }
  }

  /**
   * Generate thumbnail for images (client-side)
   */
  static async generateThumbnail(
    file: File, 
    maxWidth: number = 200, 
    maxHeight: number = 200
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File is not an image'));
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and convert to base64
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }
}