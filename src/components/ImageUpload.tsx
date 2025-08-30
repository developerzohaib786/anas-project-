import { useState, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  maxImages?: number;
}

export function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    onImagesChange([...images, ...newImages]);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const removeImage = (id: string) => {
    const updatedImages = images.filter(img => img.id !== id);
    // Clean up object URLs
    const removedImage = images.find(img => img.id === id);
    if (removedImage) {
      URL.revokeObjectURL(removedImage.url);
    }
    onImagesChange(updatedImages);
  };

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
      {images.length > 0 && (
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
}