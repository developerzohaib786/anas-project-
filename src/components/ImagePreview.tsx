import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw, Check, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

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
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [showDone, setShowDone] = useState(false);
  const displayedImage = generatedImageProp ?? generatedImage;

  const handleDone = () => {
    setShowDone(true);
  };

  const handleDownload = (format: string) => {
    console.log(`Downloading in ${format} format`);
    // Add download logic here
  };

  const aspectRatios: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9"];

  return (
    <div className="flex flex-col h-screen">
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
            ) : displayedImage ? (
              <img
                src={displayedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-3xl animate-scale-in"
              />
            ) : (
              <div className="w-12 h-12 bg-muted rounded-2xl opacity-40"></div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 pb-6">
        {!showDone ? (
          <Button
            variant="secondary"
            size="sm"
            disabled={!displayedImage}
            onClick={handleDone}
            className="apple-button w-full h-11 rounded-full font-medium bg-primary hover:bg-primary/90 text-primary-foreground border-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              boxShadow: displayedImage ? 'var(--shadow-minimal)' : 'none'
            }}
          >
            <Check className="w-4 h-4 mr-2" />
            Done
          </Button>
        ) : (
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDone(false)}
              className="apple-button flex-1 h-11 rounded-full font-medium bg-transparent hover:bg-muted/50 border border-border/40 text-foreground"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="sm"
                  className="apple-button flex-1 h-11 rounded-full font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0"
                  style={{
                    boxShadow: 'var(--shadow-minimal)'
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                className="w-48 bg-background/95 backdrop-blur-xl border border-border/40 rounded-xl shadow-lg"
                style={{
                  boxShadow: 'var(--shadow-minimal)'
                }}
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
      </div>
    </div>
  );
}