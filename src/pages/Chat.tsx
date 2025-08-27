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
    <div className="flex h-screen">
      {/* Chat Interface - Full width on left */}
      <div className="flex-1 border-r border-border">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </div>

      {/* Image Preview - Fixed sidebar */}
      <div className="w-80 bg-card">
        <ImagePreview 
          currentPrompt={currentPrompt}
          isGenerating={isGenerating}
        />
      </div>
    </div>
  );
};

export default Chat;
