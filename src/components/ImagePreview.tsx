import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, RotateCcw } from "lucide-react";

interface ImagePreviewProps {
  currentPrompt?: string;
  isGenerating?: boolean;
}

type AspectRatio = "1:1" | "4:5" | "9:16";

const aspectRatioClasses = {
  "1:1": "aspect-square",
  "4:5": "aspect-[4/5]", 
  "9:16": "aspect-[9/16]",
};

export function ImagePreview({ currentPrompt, isGenerating = false }: ImagePreviewProps) {
  const [selectedRatio, setSelectedRatio] = useState<AspectRatio>("1:1");
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  const aspectRatios: AspectRatio[] = ["1:1", "4:5", "9:16"];

  return (
    <div className="flex flex-col h-full bg-background rounded-2xl border border-border shadow-lg">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-lg">Preview</h3>
            <p className="text-sm text-muted-foreground mt-1">Your generated image</p>
          </div>
          
          {/* Aspect Ratio Controls */}
          <div className="flex gap-1 p-1.5 bg-secondary/50 rounded-xl border border-border/30">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio}
                variant={selectedRatio === ratio ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRatio(ratio)}
                className={`text-xs h-8 px-4 rounded-lg transition-all duration-200 font-medium ${
                  selectedRatio === ratio 
                    ? "shadow-sm" 
                    : "hover:bg-secondary/80"
                }`}
              >
                {ratio}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-6">
        <div className="flex items-center justify-center h-full">
          <div
            className={`${aspectRatioClasses[selectedRatio]} w-full max-w-sm bg-preview-background border-2 border-dashed border-preview-border rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-primary/30`}
          >
            {isGenerating ? (
              <div className="text-center animate-fade-in">
                <div className="animate-spin w-10 h-10 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground font-medium">Generating...</p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-2xl shadow-inner animate-scale-in"
              />
            ) : (
              <div className="text-center animate-float">
                <div className="w-20 h-20 bg-muted rounded-2xl mx-auto mb-6 flex items-center justify-center shadow-sm">
                  <div className="w-10 h-10 bg-muted-foreground/20 rounded-xl"></div>
                </div>
                <p className="text-sm text-muted-foreground font-medium leading-relaxed max-w-[200px]">
                  {currentPrompt ? "Ready to generate" : "Start a conversation to generate an image"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-5 border-t border-border/50">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-xl font-medium shadow-sm hover:shadow-md transition-all duration-200 hover:scale-[1.02] disabled:hover:scale-100"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}