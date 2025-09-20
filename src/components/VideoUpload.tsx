import { useState, useRef, useCallback, memo } from "react";
import { Video, X, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";
import VideoUploadService from "@/services/videoUploadService";
import { useAuth } from "@/contexts/AuthContext";

export interface UploadedVideo {
  id: string;
  name: string;
  url: string;
  file?: File;
  size?: number;
  type?: string;
  duration?: number;
  metadata?: Record<string, any>;
}

interface VideoUploadProps {
  videos: UploadedVideo[];
  onVideosChange: (videos: UploadedVideo[]) => void;
  maxVideos?: number;
  showPreview?: boolean;
}

const VideoUpload = memo(function VideoUpload({ 
  videos, 
  onVideosChange, 
  maxVideos = 3, 
  showPreview = true 
}: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    console.log('🎯 VideoUpload: handleFileSelect called with:', files?.length, 'files');
    if (!files || !user) {
      console.log('❌ No files provided or user not authenticated');
      return;
    }

    const fileArray = Array.from(files);
    const remainingSlots = maxVideos - videos.length;
    
    if (fileArray.length > remainingSlots) {
      toast.error(`Can only upload ${remainingSlots} more video(s). Maximum is ${maxVideos}.`);
      return;
    }

    setIsUploading(true);

    try {
      const validFiles: File[] = [];
      
      // Validate each file
      for (const file of fileArray) {
        const validation = VideoUploadService.validateVideoFile(file);
        if (!validation.isValid) {
          toast.error(`${file.name}: ${validation.error}`);
          continue;
        }
        validFiles.push(file);
      }

      if (validFiles.length === 0) {
        setIsUploading(false);
        return;
      }

      console.log('📤 Uploading', validFiles.length, 'valid video files to Cloudinary');
      
      // Upload videos to Cloudinary
      const uploadedVideos = await VideoUploadService.uploadMultipleVideos(
        validFiles,
        user,
        { uploaded_at: new Date().toISOString() }
      );

      console.log('✅ Videos uploaded successfully:', uploadedVideos);

      // Add uploaded videos to the list
      const newVideos = [...videos, ...uploadedVideos];
      onVideosChange(newVideos);

      toast.success(`Successfully uploaded ${uploadedVideos.length} video(s)`);
    } catch (error) {
      console.error('❌ Error uploading videos:', error);
      handleError(error, 'Failed to upload videos');
    } finally {
      setIsUploading(false);
    }
  }, [videos, onVideosChange, maxVideos, user]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset the input value so the same file can be selected again
    e.target.value = '';
  }, [handleFileSelect]);

  const removeVideo = useCallback((videoId: string) => {
    const newVideos = videos.filter(video => video.id !== videoId);
    onVideosChange(newVideos);
    toast.success('Video removed');
  }, [videos, onVideosChange]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          }
          ${isUploading ? 'opacity-50 pointer-events-none' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          multiple
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isUploading}
        />
        
        <div className="flex flex-col items-center space-y-2">
          {isUploading ? (
            <>
              <Upload className="h-8 w-8 text-blue-500 animate-pulse" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Uploading videos...
              </p>
            </>
          ) : (
            <>
              <Video className="h-8 w-8 text-gray-400" />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Drag and drop videos here, or click to select
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Supports MP4, WebM, OGG, AVI, MOV, WMV, FLV (max 100MB each)
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                {videos.length}/{maxVideos} videos uploaded
              </p>
            </>
          )}
        </div>
      </div>

      {/* Video Previews */}
      {showPreview && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {videos.map((video) => (
            <div key={video.id} className="relative group">
              <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-3">
                  <Video className="h-8 w-8 text-blue-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                      {video.name}
                    </p>
                    <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                      <p>Size: {formatFileSize(video.size || 0)}</p>
                      <p>Duration: {formatDuration(video.duration)}</p>
                    </div>
                  </div>
                </div>
                
                {/* Video Preview */}
                <div className="mt-3">
                  <video
                    src={video.url}
                    className="w-full h-24 object-cover rounded border"
                    controls={false}
                    muted
                    preload="metadata"
                  />
                </div>

                {/* Remove Button */}
                <Button
                  variant="destructive"
                  size="sm"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => removeVideo(video.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export { VideoUpload };