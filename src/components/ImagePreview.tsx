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
    <div className="flex flex-col h-full bg-white/60 backdrop-blur-xl rounded-3xl border border-black/8">
      {/* Aspect Ratio Controls - Top */}
      <div className="px-8 py-6 border-b border-black/5">
        <div className="flex gap-2 justify-center">
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio}
              variant={selectedRatio === ratio ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRatio(ratio)}
              className={`text-sm h-9 px-6 rounded-2xl transition-all duration-300 font-medium border-0 ${
                selectedRatio === ratio 
                  ? "bg-black text-white" 
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Area - Center */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div
          className={`${aspectRatioClasses[selectedRatio]} w-full max-w-[280px] bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:border-gray-300`}
        >
          {isGenerating ? (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-xs text-gray-500">Creating...</p>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-cover rounded-3xl"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-2xl opacity-40"></div>
          )}
        </div>
      </div>

      {/* Actions - Bottom */}
      <div className="px-8 pb-6">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-2xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 transition-all duration-300 disabled:opacity-30"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-2xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 transition-all duration-300 disabled:opacity-30"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}