import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

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
    <ResizablePanelGroup direction="horizontal" className="h-screen">
      {/* Chat Interface - Resizable, full width on mobile */}
      <ResizablePanel defaultSize={70} minSize={50} className="md:flex hidden">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </ResizablePanel>
      
      {/* Mobile-first single panel layout */}
      <div className="md:hidden flex flex-col h-screen w-full">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </div>
      
      {/* Resizable Handle - Only on desktop */}
      <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200 md:block hidden" />
      
      {/* Image Preview - Resizable on desktop, hidden on mobile */}
      <ResizablePanel defaultSize={30} minSize={25} maxSize={50} className="md:block hidden">
        <div className="bg-card h-full">
          <ImagePreview 
            currentPrompt={currentPrompt}
            isGenerating={isGenerating}
          />
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};

export default Chat;
