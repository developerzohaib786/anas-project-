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
    <div className="h-full flex max-h-[900px]">
      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-8">
        {/* Top Section - Chat */}
        <div className="h-[400px] mb-6">
          <ChatInterface onGenerateImage={handleGenerateImage} />
        </div>
        
        {/* Bottom Section - Preview */}
        <div className="flex-1 min-h-[300px]">
          <ImagePreview 
            currentPrompt={currentPrompt}
            isGenerating={isGenerating}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
