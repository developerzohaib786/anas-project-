import { useState, useEffect } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ImageUpload } from "@/components/ImageUpload";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage } from "@/types/common";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSmartSession } from "@/hooks/useSmartSession";

const Enhance = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
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
  } = useImageGeneration('enhance');
  
  const { startNewSession } = useSmartSession('enhance', [
    () => uploadedImages.length > 0,
    () => !!generatedImage,
    () => !!currentPrompt
  ]);

  const handleGenerateImage = async (prompt: string, images?: UploadedImage[]) => {
    await generateImage(prompt, images, uploadedImages);
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

  // Auto-trigger "make this beautiful" when image is uploaded
  useEffect(() => {
    if (uploadedImages.length > 0 && !hasAutoPrompted) {
      // Auto-generate with "make this beautiful" prompt
      setTimeout(() => {
        handleGenerateImage("Make this image beautiful with luxury hotel marketing aesthetic - add cinematic lighting, rich shadows, golden warmth, and editorial composition");
        setHasAutoPrompted(true);
      }, 500);
    } else if (uploadedImages.length === 0) {
      setHasAutoPrompted(false);
    }
  }, [uploadedImages, hasAutoPrompted]);

  const handleNewChat = () => {
    startNewSession(() => {
      clearGenerated();
      setUploadedImages([]);
      setHasAutoPrompted(false);
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Interface Panel with Image Upload */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Chat Interface */}
              <div className="flex-1">
                <ChatInterface 
                  onGenerateImage={handleGenerateImage}
                  initialPrompt={uploadedImages.length > 0 ? "Make this image beautiful with luxury hotel marketing aesthetic" : undefined}
                  showImageUpload={true}
                  showPrompts={false}
                  initialMessage="Upload a simple iPhone snap, or any photo and watch it transform into a cinematic masterpiece."
                  onNewChat={handleNewChat}
                />
              </div>
            </div>
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
        <ChatInterface 
          onGenerateImage={handleGenerateImage}
          initialPrompt={uploadedImages.length > 0 ? "Make this image beautiful with luxury hotel marketing aesthetic" : undefined}
          showImageUpload={true}
          showPrompts={false}
          initialMessage="Upload a simple iPhone snap, or any photo and watch it transform into a cinematic masterpiece."
          onNewChat={handleNewChat}
        />
      </div>
    </div>
  );
};

export default Enhance;