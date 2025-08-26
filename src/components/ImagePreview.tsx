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
    <div className="flex flex-col h-full bg-background rounded-xl border border-border">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground">Preview</h3>
            <p className="text-sm text-muted-foreground">Your generated image</p>
          </div>
          
          {/* Aspect Ratio Controls */}
          <div className="flex gap-1 p-1 bg-secondary rounded-lg">
            {aspectRatios.map((ratio) => (
              <Button
                key={ratio}
                variant={selectedRatio === ratio ? "default" : "ghost"}
                size="sm"
                onClick={() => setSelectedRatio(ratio)}
                className="text-xs h-7 px-3"
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
            className={`${aspectRatioClasses[selectedRatio]} w-full max-w-sm bg-preview-background border-2 border-dashed border-preview-border rounded-lg flex items-center justify-center relative overflow-hidden`}
          >
            {isGenerating ? (
              <div className="text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm text-muted-foreground">Generating...</p>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="text-center">
                <div className="w-16 h-16 bg-muted rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <div className="w-8 h-8 bg-muted-foreground/20 rounded"></div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {currentPrompt ? "Ready to generate" : "Start a conversation to generate an image"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-6 py-4 border-t border-border">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}