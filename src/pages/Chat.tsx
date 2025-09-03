import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { QuickCaptureInterface } from "@/components/QuickCaptureInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ModeToggle } from "@/components/ModeToggle";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Chat = () => {
  const [mode, setMode] = useState<'quick' | 'creative'>('quick');
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();

  const handleGenerateImage = async (prompt: string, images?: any[]) => {
    console.log("🎨 Starting image generation for prompt:", prompt);
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setGeneratedImage(undefined); // Clear previous image

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      console.log("📡 Calling generate-image function...");
      
      // Convert uploaded images to base64 for the API call
      let imageData = undefined;
      if (images && images.length > 0) {
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };

        try {
          const base64Images = await Promise.all(
            images.map(async (img) => ({
              data: await convertToBase64(img.file),
              name: img.name
            }))
          );
          imageData = base64Images;
        } catch (error) {
          console.error("Error converting images to base64:", error);
        }
      }

      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { 
          prompt,
          images: imageData
        },
      });
      
      console.log("📡 Generate-image response:", { data, error });
      
      if (error) {
        console.error("❌ Generate-image error:", error);
        throw error;
      }
      
      if (data?.image) {
        console.log("✅ Image generated successfully");
        setGeneratedImage(data.image);
      } else {
        console.warn("⚠️ No image in response data:", data);
      }
    } catch (err) {
      console.error("💥 Image generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header with Mode Toggle */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
        <div className="flex items-center justify-center">
          <ModeToggle mode={mode} onModeChange={setMode} />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1">
        {/* Desktop Layout */}
        <div className="hidden md:block h-full">
          <ResizablePanelGroup direction="horizontal" className="h-full">
            {/* Main Interface Panel */}
            <ResizablePanel defaultSize={70} minSize={50}>
              <div className="h-full transition-all duration-500 ease-out">
                {mode === 'quick' ? (
                  <QuickCaptureInterface 
                    onGenerateImage={handleGenerateImage}
                    isGenerating={isGenerating}
                  />
                ) : (
                  <ChatInterface onGenerateImage={handleGenerateImage} />
                )}
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
        <div className="md:hidden h-full flex flex-col">
          <div className="flex-1 transition-all duration-500 ease-out">
            {mode === 'quick' ? (
              <QuickCaptureInterface 
                onGenerateImage={handleGenerateImage}
                isGenerating={isGenerating}
              />
            ) : (
              <ChatInterface onGenerateImage={handleGenerateImage} />
            )}
          </div>
          
          {/* Mobile Preview (when generating or has result) */}
          {(isGenerating || generatedImage) && (
            <div className="border-t border-border bg-card max-h-80">
              <ImagePreview 
                currentPrompt={currentPrompt}
                isGenerating={isGenerating}
                generatedImage={generatedImage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
