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
            ) : generatedImage ? (
              <img
                src={generatedImage}
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
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="apple-button flex-1 h-11 rounded-full font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              boxShadow: generatedImage ? 'var(--shadow-minimal)' : 'none'
            }}
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="apple-button flex-1 h-11 rounded-full font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground border-0 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              boxShadow: generatedImage ? 'var(--shadow-minimal)' : 'none'
            }}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}