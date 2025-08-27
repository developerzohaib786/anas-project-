import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";

const Chat = () => {
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
    <div className="flex h-screen bg-white">
      {/* Chat Interface */}
      <div className="flex-1 border-r border-gray-100">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </div>

      {/* Image Preview */}
      <div className="w-80">
        <ImagePreview 
          currentPrompt={currentPrompt}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};

export default Chat;
