import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";

const Index = () => {
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateImage = async (prompt: string) => {
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    
    // Simulate image generation delay
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="h-full flex">
      {/* Chat Interface */}
      <div className="flex-1 p-6">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </div>

      {/* Image Preview */}
      <div className="w-96 p-6 pl-0">
        <ImagePreview 
          currentPrompt={currentPrompt}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};

export default Index;
