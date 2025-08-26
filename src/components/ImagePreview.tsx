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
    <div className="flex flex-col h-full bg-white/80 backdrop-blur-xl rounded-3xl border border-black/5 shadow-2xl shadow-black/5">
      {/* Aspect Ratio Controls */}
      <div className="p-8 pb-4">
        <div className="flex gap-2 justify-center">
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio}
              variant={selectedRatio === ratio ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRatio(ratio)}
              className={`text-sm h-10 px-5 rounded-2xl transition-all duration-300 font-medium border-0 ${
                selectedRatio === ratio 
                  ? "bg-black text-white shadow-lg shadow-black/20" 
                  : "hover:bg-gray-100 text-gray-600"
              }`}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 px-8 pb-4">
        <div className="flex items-center justify-center h-full">
          <div
            className={`${aspectRatioClasses[selectedRatio]} w-full max-w-xs bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-500 hover:border-gray-300`}
          >
            {isGenerating ? (
              <div className="text-center animate-fade-in">
                <div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full mx-auto mb-6"></div>
              </div>
            ) : generatedImage ? (
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-full object-cover rounded-3xl animate-scale-in"
              />
            ) : (
              <div className="w-16 h-16 bg-gray-200 rounded-2xl animate-float opacity-40"></div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="px-8 pb-8">
        <div className="flex gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-12 rounded-2xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-30"
          >
            <RotateCcw className="w-4 h-4 mr-3" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-12 rounded-2xl font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 border-0 transition-all duration-300 hover:scale-[1.02] disabled:hover:scale-100 disabled:opacity-30"
          >
            <Download className="w-4 h-4 mr-3" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}