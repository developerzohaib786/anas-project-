import { useState, useRef, useCallback, memo } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { validateFiles, validateFileContent, generateSecureFileName } from "@/lib/file-validation";
import { handleError } from "@/lib/error-handler";
import { toast } from "sonner";

import { UploadedImage } from "@/types/common";

/**
 * Props for the ImageUpload component
 * @interface ImageUploadProps
 * @property {UploadedImage[]} images - Array of currently uploaded images
 * @property {function} onImagesChange - Callback when images change (add/remove)
 * @property {number} maxImages - Maximum number of images allowed (default: 5)
 * @property {boolean} showPreview - Whether to show image previews with delete buttons (default: true)
 */
interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
  showPreview?: boolean;
}

/**
 * ImageUpload Component
 * 
 * Handles drag-and-drop and click-to-upload functionality for images.
 * Features:
 * - File validation (type, size, content)
 * - Drag and drop support
 * - Optional image preview with delete functionality
 * - Secure file handling with magic byte verification
 * - Toast notifications for user feedback
 * 
 * @param {ImageUploadProps} props - Component props
 * @returns {JSX.Element} The ImageUpload component
 */
const ImageUpload = memo(function ImageUpload({ images, onImagesChange, maxImages = 5, showPreview = true }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    
    // Validate files first
    const validation = validateFiles(fileArray, {
      maxFiles: maxImages - images.length,
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    });

    if (!validation.isValid) {
      toast.error(validation.error || 'Invalid file selection');
      return;
    }

    // Show warnings if any
    if (validation.warnings) {
      validation.warnings.forEach(warning => toast.warning(warning));
    }

    const remainingSlots = maxImages - images.length;
    const filesToAdd = fileArray.slice(0, remainingSlots);

    // Process files with enhanced security
    const newImages: UploadedImage[] = [];
    
    for (const file of filesToAdd) {
      try {
        // Validate file content
        const contentValidation = await validateFileContent(file);
        if (!contentValidation.isValid) {
          toast.error(`${file.name}: ${contentValidation.error}`);
          continue;
        }

        // Create secure file reference
        const newImage: UploadedImage = {
          id: `${Date.now()}-${Math.random()}`,
          file,
          url: URL.createObjectURL(file),
          name: file.name
        };

        newImages.push(newImage);
      } catch (error) {
        handleError(error, 'File Upload');
      }
    }

    if (newImages.length > 0) {
      onImagesChange([...images, ...newImages]);
      toast.success(`Added ${newImages.length} image(s)`);
    }
  }, [images, maxImages, onImagesChange]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const removeImage = useCallback((id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    // Clean up object URLs
    const removedImage = images.find(img => img.id === id);
    if (removedImage) {
      URL.revokeObjectURL(removedImage.url);
    }
    onImagesChange(updatedImages);
  }, [images, onImagesChange]);

  return (
    <div className="space-y-3">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-4 transition-colors cursor-pointer
            ${isDragging 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
            }
          `}
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileInputChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-2">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
            <div className="text-center">
              <p className="text-sm font-medium text-foreground">
                Upload reference images
              </p>
              <p className="text-xs text-muted-foreground">
                Drag & drop or click to browse ({images.length}/{maxImages})
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Uploaded Images Preview */}
      {showPreview && images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((image) => (
            <div key={image.id} className="relative group">
              <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted">
                <img
                  src={image.url}
                  alt={image.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 truncate w-16">
                {image.name}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
});

export { ImageUpload };