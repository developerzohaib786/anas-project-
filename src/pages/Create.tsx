import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage } from "@/types/common";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSmartSession } from "@/hooks/useSmartSession";

const Create = () => {
  const [searchParams] = useSearchParams();
  const sessionFromQuery = searchParams.get('session');
  const [isInGenerationFlow, setIsInGenerationFlow] = useState(false);
  const { currentSessionId, updateSession, sessions, createSession, setCurrentSession } = useChat();
  
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
    setIsInGenerationFlow(true);
    try {
      await generateImage(prompt, images);
    } finally {
      setIsInGenerationFlow(false);
    }
  };

  // Handle session switching from URL parameters
  useEffect(() => {
    if (sessionFromQuery && sessionFromQuery !== currentSessionId) {
      console.log('🔄 Create: Switching to session from URL:', sessionFromQuery);
      setCurrentSession(sessionFromQuery);
    }
  }, [sessionFromQuery, currentSessionId, setCurrentSession]);

  // Create session if none exists
  useEffect(() => {
    if (!currentSessionId && !sessionFromQuery) {
      console.log("🆕 No current session, creating new one for Create");
      const newSessionId = createSession("Chat to Create", 'create');
      setCurrentSession(newSessionId);
    }
  }, [currentSessionId, sessionFromQuery, createSession, setCurrentSession]);

  // Restore image state when session changes
  useEffect(() => {
    // Don't clear state if we're in the middle of generating
    if (isInGenerationFlow) {
      console.log("🔄 Skipping session clear - generation in progress");
      return;
    }
    
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        // Only restore if session has saved data
        if (session.generatedImage) {
          setGeneratedImage(session.generatedImage);
          setCurrentPrompt(session.currentPrompt);
          console.log("✅ Restored image from session:", session.id);
        }
        console.log("🔄 Session found - keeping current state");
      } else {
        console.log("🆕 New session - keeping current state");
      }
    }
  }, [currentSessionId, sessions, isInGenerationFlow, setGeneratedImage, setCurrentPrompt]);

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
            <ChatInterface 
              onGenerateImage={handleGenerateImage} 
              showImageUpload={false} 
              flowType="create"
              generatedImage={generatedImage}
              currentPrompt={currentPrompt}
            />
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
          showImageUpload={false} 
          flowType="create"
          generatedImage={generatedImage}
          currentPrompt={currentPrompt}
        />
        </div>
    </div>
  );
};

export default Create;