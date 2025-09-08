import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Check, ChevronDown, Crop, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface PreviewPanelProps {
  currentPrompt?: string;
  isGenerating?: boolean;
  generatedImage?: string;
  contentType?: "image" | "video";
  className?: string;
}

type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

const aspectRatioClasses = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]", 
  "9:16": "aspect-[9/16]",
  "16:9": "aspect-[16/9]",
};

const aspectRatioLabels = {
  "1:1": "Square",
  "4:5": "Portrait", 
  "9:16": "Story",
  "16:9": "Landscape",
};

export function PreviewPanel({ 
  currentPrompt, 
  isGenerating = false, 
  generatedImage: generatedContent, 
  contentType = "image",
  className = ""
}: PreviewPanelProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [showDone, setShowDone] = useState(false);
  const [contentError, setContentError] = useState(false);
  const [isResizeMode, setIsResizeMode] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const displayedContent = generatedContent;

  useEffect(() => {
    setContentError(false);
  }, [generatedContent]);

  const handleDone = () => {
    setShowDone(true);
    setTimeout(() => setShowDone(false), 2000);
  };

  const handleDownload = (format: string) => {
    if (!displayedContent) return;
    
    const projectData = {
      id: Date.now().toString(),
      name: `Generated ${contentType} ${new Date().toLocaleDateString()}`,
      category: "AI Generated",
      thumbnail: displayedContent,
      prompt: currentPrompt || `Generated ${contentType}`,
      aspectRatio: selectedRatio,
      format: format,
      createdAt: new Date().toISOString()
    };

    try {
      const existingProjects = JSON.parse(localStorage.getItem('ninoprojects') || '[]');
      existingProjects.unshift(projectData);
      localStorage.setItem('ninoprojects', JSON.stringify(existingProjects.slice(0, 50)));
      
      toast.success(`${contentType === 'video' ? 'Video' : 'Image'} saved to projects!`);
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error('Failed to save to projects');
    }

    // Trigger download
    const link = document.createElement('a');
    link.href = displayedContent;
    link.download = `nino-${contentType}-${Date.now()}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRegenerateImage = () => {
    // Regeneration logic would be passed from parent component
    toast.info("Regenerating...");
  };

  const handleCropStart = () => {
    setIsCropping(true);
    setIsResizeMode(true);
  };

  const handleCropCancel = () => {
    setIsCropping(false);
    setIsResizeMode(false);
    setCropArea({ x: 10, y: 10, width: 80, height: 80 });
  };

  const handleCropApply = () => {
    setIsCropping(false);
    setIsResizeMode(false);
    toast.success("Crop applied!");
  };

  // Mouse event handlers for smooth cropping
  const handleMouseDown = (e: React.MouseEvent, action: 'move' | 'resize') => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (action === 'move') {
      setIsDragging(true);
      setDragStart({ x: x - cropArea.x, y: y - cropArea.y });
    } else {
      setIsResizing(true);
      setDragStart({ x, y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && !isResizing) return;
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isDragging) {
      const newX = Math.max(0, Math.min(100 - cropArea.width, x - dragStart.x));
      const newY = Math.max(0, Math.min(100 - cropArea.height, y - dragStart.y));
      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing) {
      const newWidth = Math.max(10, Math.min(100 - cropArea.x, x - cropArea.x));
      const newHeight = Math.max(10, Math.min(100 - cropArea.y, y - cropArea.y));
      setCropArea(prev => ({ ...prev, width: newWidth, height: newHeight }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-4 border-b bg-background/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-sm">Preview</h3>
            <p className="text-xs text-muted-foreground">
              {contentType === 'video' ? 'Generated video' : 'Generated image'} will appear here
            </p>
          </div>
          
          {/* Aspect Ratio Selector */}
          {displayedContent && !isGenerating && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="text-xs h-7">
                  {aspectRatioLabels[selectedRatio]}
                  <ChevronDown className="w-3 h-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {Object.entries(aspectRatioLabels).map(([ratio, label]) => (
                  <DropdownMenuItem 
                    key={ratio}
                    onClick={() => setSelectedRatio(ratio as AspectRatio)}
                    className="text-xs"
                  >
                    {label} ({ratio})
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-4 flex items-center justify-center bg-muted/20">
        {isGenerating ? (
          <div className="text-center animate-fade-in">
            <div className="animate-spin w-8 h-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-xs text-muted-foreground">
              {contentType === 'video' ? 'Creating video...' : 'Generating...'}
            </p>
          </div>
        ) : displayedContent && !contentError ? (
          <div className="w-full max-w-sm mx-auto">
            <div 
              ref={containerRef}
              className={`relative bg-white rounded-lg shadow-sm overflow-hidden border ${aspectRatioClasses[selectedRatio]}`}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            >
              {contentType === 'video' ? (
                <video
                  src={displayedContent}
                  className="w-full h-full object-cover"
                  controls
                  onError={() => setContentError(true)}
                />
              ) : (
                <img
                  src={displayedContent}
                  alt="Generated content"
                  className="w-full h-full object-cover"
                  onError={() => setContentError(true)}
                />
              )}
              
              {/* Crop Overlay */}
              {isCropping && (
                <>
                  <div className="absolute inset-0 bg-black/50 pointer-events-none" />
                  <div
                    className="absolute border-2 border-white bg-transparent cursor-move"
                    style={{
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                    }}
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                  >
                    {/* Resize handle */}
                    <div
                      className="absolute bottom-0 right-0 w-3 h-3 bg-white border border-gray-400 cursor-se-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        handleMouseDown(e, 'resize');
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-3">
              <div className="w-6 h-6 bg-muted-foreground/20 rounded"></div>
            </div>
            <p className="text-xs">
              {contentType === 'video' ? 'Your video will appear here' : 'Your image will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {displayedContent && !isGenerating && (
        <div className="p-4 border-t bg-background/50 space-y-2">
          {!isCropping ? (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCropStart}
                className="flex-1 text-xs h-7"
              >
                <Crop className="w-3 h-3 mr-1" />
                Crop
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleRegenerateImage}
                className="flex-1 text-xs h-7"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Retry
              </Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCropCancel}
                className="flex-1 text-xs h-7"
              >
                <X className="w-3 h-3 mr-1" />
                Cancel
              </Button>
              
              <Button
                size="sm"
                onClick={handleCropApply}
                className="flex-1 text-xs h-7"
              >
                <Check className="w-3 h-3 mr-1" />
                Apply
              </Button>
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                size="sm" 
                className="w-full text-xs h-7"
                disabled={showDone}
              >
                {showDone ? (
                  <>
                    <Check className="w-3 h-3 mr-1" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Download className="w-3 h-3 mr-1" />
                    Save
                  </>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => handleDownload('png')}>
                Save as PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDownload('jpg')}>
                Save as JPG
              </DropdownMenuItem>
              {contentType === 'video' && (
                <DropdownMenuItem onClick={() => handleDownload('mp4')}>
                  Save as MP4
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
