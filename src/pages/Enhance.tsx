import { useState, useEffect, useCallback } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage } from "@/types/common";
import { useImageGeneration } from "@/hooks/useImageGeneration";
import { useSmartSession } from "@/hooks/useSmartSession";

const Enhance = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [hasAutoPrompted, setHasAutoPrompted] = useState(false);
  const [isInGenerationFlow, setIsInGenerationFlow] = useState(false);
  const [stateRestored, setStateRestored] = useState(false);
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

  const handleGenerateImage = useCallback(async (prompt: string, images?: UploadedImage[]) => {
    setIsInGenerationFlow(true);
    try {
      await generateImage(prompt, images, uploadedImages);
    } finally {
      setIsInGenerationFlow(false);
    }
  }, [generateImage, uploadedImages]);

  // Restore complete state when session changes - only once per session
  useEffect(() => {
    // Don't clear state if we're in the middle of generating
    if (isInGenerationFlow) {
      return;
    }
    
    if (currentSessionId && !stateRestored) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        console.log('🔄 Restoring state from session:', session.id);
        
        // Restore state from session
        if (session.generatedImage) {
          setGeneratedImage(session.generatedImage);
          setCurrentPrompt(session.currentPrompt);
        }
        
        // Restore uploaded images
        if (session.uploadedImages && session.uploadedImages.length > 0) {
          setUploadedImages(session.uploadedImages);
          setHasAutoPrompted(true); // If images were uploaded before, we've already prompted
        } else {
          setUploadedImages([]);
          setHasAutoPrompted(false);
        }
        
        setStateRestored(true);
        console.log('✅ State restoration complete');
      }
    } else if (!currentSessionId) {
      // Reset restoration flag when no session
      setStateRestored(false);
    }
  }, [currentSessionId, sessions, isInGenerationFlow, stateRestored, setGeneratedImage, setCurrentPrompt]);

  // Reset restoration flag when session changes
  useEffect(() => {
    setStateRestored(false);
  }, [currentSessionId]);

  // Removed auto-prompt functionality - user will provide their own prompts

  // Emergency backup to localStorage for extra persistence (tab changes, crashes, etc.)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentSessionId && (uploadedImages.length > 0 || generatedImage)) {
        const backupKey = `enhance-backup-${currentSessionId}`;
        const backup = {
          uploadedImages,
          generatedImage,
          currentPrompt,
          hasAutoPrompted,
          timestamp: Date.now()
        };
        localStorage.setItem(backupKey, JSON.stringify(backup));
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleBeforeUnload(); // Save when tab becomes hidden
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentSessionId, uploadedImages, generatedImage, currentPrompt, hasAutoPrompted]);

  // Restore from emergency backup if session data is missing
  useEffect(() => {
    if (currentSessionId && stateRestored && uploadedImages.length === 0 && !generatedImage) {
      const backupKey = `enhance-backup-${currentSessionId}`;
      const backup = localStorage.getItem(backupKey);
      if (backup) {
        try {
          const parsed = JSON.parse(backup);
          const age = Date.now() - (parsed.timestamp || 0);
          
          // Only restore if backup is less than 1 hour old
          if (age < 60 * 60 * 1000) {
            console.log('🔄 Restoring from emergency backup');
            if (parsed.uploadedImages?.length > 0) {
              setUploadedImages(parsed.uploadedImages);
            }
            if (parsed.generatedImage) {
              setGeneratedImage(parsed.generatedImage);
            }
            if (parsed.currentPrompt) {
              setCurrentPrompt(parsed.currentPrompt);
            }
            if (parsed.hasAutoPrompted !== undefined) {
              setHasAutoPrompted(parsed.hasAutoPrompted);
            }
          } else {
            // Clean up old backup
            localStorage.removeItem(backupKey);
          }
        } catch (e) {
          console.warn('Failed to restore emergency backup:', e);
          localStorage.removeItem(backupKey);
        }
      }
    }
  }, [currentSessionId, stateRestored, uploadedImages.length, generatedImage, setGeneratedImage, setCurrentPrompt]);

  // Save uploaded images to session when they change - but only after state is restored
  useEffect(() => {
    if (currentSessionId && uploadedImages.length >= 0 && stateRestored) {
      updateSession(currentSessionId, {
        uploadedImages: uploadedImages
      });
    }
  }, [uploadedImages, currentSessionId, updateSession, stateRestored]);

  const handleNewChat = () => {
    startNewSession(() => {
      clearGenerated();
      setUploadedImages([]);
      setHasAutoPrompted(false);
      setStateRestored(false);
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
                  showImageUpload={true}
                  showPrompts={false}
                  initialMessage="Upload an image and provide your own prompt to enhance it."
                  flowType="enhance"
                  uploadedImages={uploadedImages}
                  onImagesChange={setUploadedImages}
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
          showImageUpload={true}
          showPrompts={false}
          initialMessage="Upload an image and provide your own prompt to enhance it."
          flowType="enhance"
          uploadedImages={uploadedImages}
          onImagesChange={setUploadedImages}
        />
      </div>
    </div>
  );
};

export default Enhance;