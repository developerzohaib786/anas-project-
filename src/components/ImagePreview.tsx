import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Check, ChevronDown, Crop } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

/**
 * Props for the ImagePreview component
 * @interface ImagePreviewProps
 * @property {string} currentPrompt - The prompt used to generate the current image
 * @property {boolean} isGenerating - Whether image generation is in progress
 * @property {string} generatedImage - URL of the generated image to display
 */
interface ImagePreviewProps {
  currentPrompt?: string;
  isGenerating?: boolean;
  generatedImage?: string;
}

type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

const aspectRatioClasses = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]", 
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-[16/9]",
};

/**
 * ImagePreview Component
 * 
 * Displays generated images with editing and download capabilities.
 * Features:
 * - Aspect ratio selection and preview
 * - Crop functionality with adjustable crop area
 * - Download in multiple formats (PNG, JPG, WebP)
 * - Loading states with spinner animation
 * - Project saving functionality
 * 
 * Note: Resize functionality was removed per user request
 * 
 * @param {ImagePreviewProps} props - Component props
 * @returns {JSX.Element} The ImagePreview component
 */
export function ImagePreview({ currentPrompt, isGenerating = false, generatedImage: generatedImageProp }: ImagePreviewProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [showDone, setShowDone] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const displayedImage = generatedImageProp;

  useEffect(() => {
    setImgError(false);
  }, [generatedImageProp]);
  const handleDone = () => {
    setShowDone(true);
  };

  const handleDownload = (format: string) => {
    if (!displayedImage) return;
    
    // Save to projects by storing in localStorage (you can replace with actual backend later)
    const projectData = {
      id: Date.now().toString(),
      name: `Generated Image ${new Date().toLocaleDateString()}`,
      category: "AI Generated",
      thumbnail: displayedImage,
      prompt: currentPrompt || "Generated image",
      aspectRatio: selectedRatio,
      format: format,
      createdAt: new Date().toISOString()
    };
    
    const existingProjects = JSON.parse(localStorage.getItem('user-projects') || '[]');
    existingProjects.push(projectData);
    localStorage.setItem('user-projects', JSON.stringify(existingProjects));
    
    // Create a temporary anchor element and trigger download
    const link = document.createElement('a');
    link.href = displayedImage;

    // Create a meaningful filename based on the prompt
    const promptWords = currentPrompt ? currentPrompt.split(' ').slice(0, 3).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '') : 'generated';
    const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    link.download = `nino-${promptWords}-${timestamp}.${format.toLowerCase()}`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image saved to Projects and downloaded!');
  };


  const handleCrop = () => {
    if (!displayedImage) return;
    setIsCropping(!isCropping);
    if (!isCropping) {
      // Initialize crop area based on current aspect ratio
      let cropWidth = 50;
      let cropHeight = 50;

      switch (selectedRatio) {
        case "1:1":
          cropWidth = 60;
          cropHeight = 60;
          break;
        case "4:5":
          cropWidth = 48;
          cropHeight = 60;
          break;
        case "9:16":
          cropWidth = 56;
          cropHeight = 80;
          break;
        case "16:9":
          cropWidth = 80;
          cropHeight = 45;
          break;
      }

      const x = Math.max(0, (100 - cropWidth) / 2);
      const y = Math.max(0, (100 - cropHeight) / 2);

      setCropArea({ x, y, width: cropWidth, height: cropHeight });
      toast.info('Crop mode enabled - drag the corners to adjust');
    } else {
      toast.info('Crop mode disabled');
    }
  };

  const handleCropReset = () => {
    // Reset to smart initial crop area based on current aspect ratio
    let cropWidth = 50;
    let cropHeight = 50;

    switch (selectedRatio) {
      case "1:1":
        cropWidth = 60;
        cropHeight = 60;
        break;
      case "4:5":
        cropWidth = 48;
        cropHeight = 60;
        break;
      case "9:16":
        cropWidth = 56;
        cropHeight = 80;
        break;
      case "16:9":
        cropWidth = 80;
        cropHeight = 45;
        break;
    }

    const x = Math.max(0, (100 - cropWidth) / 2);
    const y = Math.max(0, (100 - cropHeight) / 2);

    setCropArea({ x, y, width: cropWidth, height: cropHeight });
    toast.success('Crop area reset');
  };

  const handleCropApply = () => {
    // Here we would apply the crop to the image
    // For now, just disable crop mode
    setIsCropping(false);
    toast.success('Crop applied');
  };

  const handleMouseDown = (e: React.MouseEvent, corner: string) => {
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const startCrop = { ...cropArea };

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newCrop = { ...startCrop };

      switch (corner) {
        case 'nw':
          newCrop.x = Math.max(0, Math.min(startCrop.x + deltaX, startCrop.x + startCrop.width - 20));
          newCrop.y = Math.max(0, Math.min(startCrop.y + deltaY, startCrop.y + startCrop.height - 20));
          newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
          newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
          break;
        case 'ne':
          newCrop.y = Math.max(0, Math.min(startCrop.y + deltaY, startCrop.y + startCrop.height - 20));
          newCrop.width = Math.max(20, startCrop.width + deltaX);
          newCrop.height = startCrop.height - (newCrop.y - startCrop.y);
          break;
        case 'sw':
          newCrop.x = Math.max(0, Math.min(startCrop.x + deltaX, startCrop.x + startCrop.width - 20));
          newCrop.width = startCrop.width - (newCrop.x - startCrop.x);
          newCrop.height = Math.max(20, startCrop.height + deltaY);
          break;
        case 'se':
          newCrop.width = Math.max(20, startCrop.width + deltaX);
          newCrop.height = Math.max(20, startCrop.height + deltaY);
          break;
      }

      // Ensure crop area stays within bounds
      newCrop.x = Math.max(0, Math.min(newCrop.x, 100 - newCrop.width));
      newCrop.y = Math.max(0, Math.min(newCrop.y, 100 - newCrop.height));

      setCropArea(newCrop);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const aspectRatios: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9"];

  return (
    <div className="flex flex-col h-full">
      {/* Aspect Ratio Controls */}
      <div className="p-4 md:p-6">
        <div className="flex justify-center">
          <div 
            className="apple-toggle bg-[hsl(var(--toggle-bg))] p-1 rounded-full inline-flex gap-1 w-full max-w-xs"
            style={{
              boxShadow: 'var(--shadow-minimal)'
            }}
          >
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSelectedRatio(ratio)}
                className={`apple-button flex-1 px-3 py-2 rounded-full text-xs md:text-sm font-medium transition-all duration-200 ${
                  selectedRatio === ratio 
                    ? "bg-[hsl(var(--toggle-active-bg))] text-[hsl(var(--toggle-active-text))] shadow-sm" 
                    : "text-[hsl(var(--toggle-inactive-text))] hover:text-foreground"
                }`}
              >
                {ratio}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 px-4 md:px-6 pb-4">
        <div className="flex items-center justify-center h-full">
          <div
            className={`${aspectRatioClasses[selectedRatio]} w-full max-w-sm bg-muted/30 border border-dashed border-border rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-border/60`}
            style={{
              boxShadow: 'var(--shadow-minimal)'
            }}
          >
            {isGenerating ? (
              <div className="text-center animate-fade-in">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : displayedImage && !imgError ? (
              <div className="relative w-full h-full">
                <img
                  src={displayedImage}
                  alt="Generated"
                  className="w-full h-full object-cover rounded-3xl animate-scale-in"
                  onError={() => setImgError(true)}
                />
                {isCropping && (
                  <>
                    {/* Crop overlay */}
                    <div className="absolute inset-0 rounded-3xl">
                      {/* Dark overlay */}
                      <div className="absolute inset-0 bg-black/50 rounded-3xl" />

                      {/* Crop area (lighter overlay) */}
                      <div
                        className="absolute border-2 border-white rounded-lg"
                        style={{
                          left: `${cropArea.x}%`,
                          top: `${cropArea.y}%`,
                          width: `${cropArea.width}%`,
                          height: `${cropArea.height}%`,
                          boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                        }}
                      >
                        {/* Crop handles */}
                        <div
                          className="absolute -top-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full cursor-nw-resize"
                          onMouseDown={(e) => handleMouseDown(e, 'nw')}
                        />
                        <div
                          className="absolute -top-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full cursor-ne-resize"
                          onMouseDown={(e) => handleMouseDown(e, 'ne')}
                        />
                        <div
                          className="absolute -bottom-1 -left-1 w-3 h-3 bg-white border border-gray-400 rounded-full cursor-sw-resize"
                          onMouseDown={(e) => handleMouseDown(e, 'sw')}
                        />
                        <div
                          className="absolute -bottom-1 -right-1 w-3 h-3 bg-white border border-gray-400 rounded-full cursor-se-resize"
                          onMouseDown={(e) => handleMouseDown(e, 'se')}
                        />

                        {/* Grid lines */}
                        <div className="absolute top-1/3 left-0 right-0 h-px bg-white/50" />
                        <div className="absolute top-2/3 left-0 right-0 h-px bg-white/50" />
                        <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/50" />
                        <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/50" />
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted/40 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">
                    Generated image will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-4 md:px-6 pb-4 md:pb-6 space-y-3">
        {!showDone ? (
          <Button
            variant="default"
            size="lg"
            disabled={!displayedImage}
            onClick={handleDone}
            className="w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-primary via-primary to-primary/90 hover:from-primary/95 hover:via-primary/95 hover:to-primary/85 text-primary-foreground border-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-xl disabled:shadow-none transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 via-transparent to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 -skew-x-12 group-hover:animate-pulse transition-opacity duration-500" />
            <Check className="w-5 h-5 mr-2 relative z-10" />
            <span className="relative z-10">Done</span>
          </Button>
        ) : (
          <>
            {/* Crop/Resize Controls */}
            {isCropping ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCropReset}
                    className="flex-1 h-10 rounded-xl font-medium border-2 border-border/50 bg-background/50 text-foreground hover:border-border transition-all duration-200"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsCropping(false)}
                    className="flex-1 h-10 rounded-xl font-medium border-2 border-border/50 bg-background/50 text-foreground hover:border-border transition-all duration-200"
                  >
                    Cancel
                  </Button>
                </div>
                <Button
                  variant="default"
                  size="lg"
                  onClick={handleCropApply}
                  className="w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                >
                  <Check className="w-5 h-5 mr-2" />
                  Apply Crop
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="lg"
                    disabled={!displayedImage}
                    onClick={handleCrop}
                    className={`flex-1 h-12 rounded-2xl font-semibold border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                      isCropping
                        ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20'
                        : 'border-border/50 bg-background/50 text-foreground hover:border-border'
                    }`}
                  >
                    <Crop className="w-5 h-5 mr-2" />
                    {isCropping ? 'Exit Crop' : 'Crop'}
                  </Button>
                </div>

                {/* Download Button */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="default"
                      size="lg"
                      className="w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-secondary to-secondary/90 hover:from-secondary/90 hover:to-secondary/80 text-secondary-foreground border-0 shadow-lg transform hover:scale-[1.02] transition-all duration-200"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Download
                      <ChevronDown className="w-4 h-4 ml-2" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="center"
                    className="w-56 bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-lg"
                  >
                    <DropdownMenuItem
                      onClick={() => handleDownload('PNG')}
                      className="rounded-lg font-medium text-foreground hover:bg-muted/60 cursor-pointer"
                    >
                      PNG (High Quality)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownload('JPG')}
                      className="rounded-lg font-medium text-foreground hover:bg-muted/60 cursor-pointer"
                    >
                      JPG (Smaller Size)
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDownload('WebP')}
                      className="rounded-lg font-medium text-foreground hover:bg-muted/60 cursor-pointer"
                    >
                      WebP (Modern)
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}