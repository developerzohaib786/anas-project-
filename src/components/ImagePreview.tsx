import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Check, ChevronDown, Crop } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

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

export function ImagePreview({ currentPrompt, isGenerating = false, generatedImage: generatedImageProp }: ImagePreviewProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [showDone, setShowDone] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [isResizeMode, setIsResizeMode] = useState(false);
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
    link.download = `generated-image.${format.toLowerCase()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Image saved to Projects and downloaded!');
  };

  const handleResize = () => {
    setIsResizeMode(!isResizeMode);
    toast.info(isResizeMode ? 'Resize mode disabled' : 'Resize mode enabled - adjust the aspect ratio above');
  };

  const aspectRatios: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9"];

  return (
    <div className="flex flex-col h-full">
      {/* Aspect Ratio Controls */}
      <div className="p-6">
        <div className="flex justify-center">
          <div 
            className="apple-toggle bg-[hsl(var(--toggle-bg))] p-1 rounded-full inline-flex gap-1"
            style={{
              boxShadow: 'var(--shadow-minimal)'
            }}
          >
            {aspectRatios.map((ratio) => (
              <button
                key={ratio}
                onClick={() => setSelectedRatio(ratio)}
                className={`apple-button px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
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
      <div className="flex-1 px-6 pb-4">
        <div className="flex items-center justify-center h-full">
          <div
            className={`${aspectRatioClasses[selectedRatio]} w-full max-w-sm bg-muted/30 border border-dashed border-border rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-border/60`}
            style={{
              boxShadow: 'var(--shadow-minimal)'
            }}
          >
            {isGenerating ? (
              <div className="text-center animate-fade-in">
                <div className="animate-spin w-7 h-7 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
              </div>
            ) : displayedImage && !imgError ? (
              <img
                src={displayedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-3xl animate-scale-in"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded-2xl opacity-40"></div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6 space-y-3">
        {!showDone ? (
          <Button
            variant="default"
            size="lg"
            disabled={!displayedImage}
            onClick={handleDone}
            className="w-full h-12 rounded-2xl font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground border-0 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg disabled:shadow-none transform hover:scale-[1.02] transition-all duration-200"
          >
            <Check className="w-5 h-5 mr-2" />
            Done
          </Button>
        ) : (
          <>
            {/* Resize Button */}
            <Button
              variant="outline"
              size="lg"
              disabled={!displayedImage}
              onClick={handleResize}
              className={`w-full h-12 rounded-2xl font-semibold border-2 transition-all duration-200 transform hover:scale-[1.02] ${
                isResizeMode 
                  ? 'border-primary bg-primary/10 text-primary hover:bg-primary/20' 
                  : 'border-border/50 bg-background/50 text-foreground hover:border-border'
              }`}
            >
              <Crop className="w-5 h-5 mr-2" />
              {isResizeMode ? 'Exit Resize' : 'Resize'}
            </Button>

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
          </>
        )}
      </div>
    </div>
  );
}