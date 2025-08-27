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
    <div className="flex flex-col h-screen bg-white">
      {/* Aspect Ratio Controls */}
      <div className="border-b border-gray-100 px-6 py-4">
        <div className="flex gap-1 justify-center">
          {aspectRatios.map((ratio) => (
            <Button
              key={ratio}
              variant={selectedRatio === ratio ? "default" : "ghost"}
              size="sm"
              onClick={() => setSelectedRatio(ratio)}
              className={`text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                selectedRatio === ratio 
                  ? "bg-gray-900 text-white" 
                  : "hover:bg-gray-50 text-gray-600"
              }`}
            >
              {ratio}
            </Button>
          ))}
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 p-6 flex items-center justify-center">
        <div
          className={`${aspectRatioClasses[selectedRatio]} w-full max-w-sm bg-gray-50 border border-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden transition-all duration-300`}
        >
          {isGenerating ? (
            <div className="text-center">
              <div className="animate-spin w-6 h-6 border-2 border-gray-900 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-xs text-gray-500">Creating...</p>
            </div>
          ) : generatedImage ? (
            <img
              src={generatedImage}
              alt="Generated"
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            <div className="w-12 h-12 bg-gray-200 rounded-xl opacity-40"></div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-100 px-6 py-4">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-lg font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Regenerate
          </Button>
          <Button
            variant="secondary"
            size="sm"
            disabled={!generatedImage}
            className="flex-1 h-10 rounded-lg font-medium bg-gray-50 hover:bg-gray-100 text-gray-700 border-0 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}