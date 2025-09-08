import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage } from "@/types/common";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSmartSession } from "@/hooks/useSmartSession";

const Create = () => {
  const { currentSessionId, updateSession, sessions } = useChat();
  
  // Use consolidated hooks
  const { 
    isGenerating, 
    currentPrompt, 
    generatedImage, 
    generateImage,
    clearGenerated,
    setGeneratedImage,
    setCurrentPrompt
  } = useImageGeneration('create');
  
  const { startNewSession } = useSmartSession('create', [
    () => !!generatedImage,
    () => !!currentPrompt
  ]);

  const handleGenerateImage = async (prompt: string, images?: UploadedImage[]) => {
    await generateImage(prompt, images);
  };

  // Restore image state when session changes
  useEffect(() => {
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session && session.generatedImage) {
        setGeneratedImage(session.generatedImage);
        setCurrentPrompt(session.currentPrompt);
        console.log("✅ Restored image from session:", session.id);
      } else {
        // Clear state for new sessions
        clearGenerated();
        console.log("🆕 New session - cleared image state");
      }
    } else {
      // No session - clear state
      clearGenerated();
    }
  }, [currentSessionId, sessions, setGeneratedImage, setCurrentPrompt, clearGenerated]);

  const handleNewChat = () => {
    startNewSession(() => {
      clearGenerated();
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Interface Panel */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <ChatInterface onGenerateImage={handleGenerateImage} showImageUpload={false} flowType="create" />
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200" />
          
          {/* Image Preview Panel */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
            <div className="bg-card h-full">
              <ImagePreview 
                currentPrompt={currentPrompt}
                isGenerating={isGenerating}
                generatedImage={generatedImage}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden flex-1 min-h-0">
        <ChatInterface onGenerateImage={handleGenerateImage} showImageUpload={false} flowType="create" />
        </div>
    </div>
  );
};

export default Create;