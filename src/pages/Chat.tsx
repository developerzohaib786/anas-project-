import { useState } from "react";
import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

const Chat = () => {
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();

  const handleGenerateImage = async (prompt: string) => {
    console.log("🎨 Starting image generation for prompt:", prompt);
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setGeneratedImage(undefined); // Clear previous image

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      console.log("📡 Calling generate-image function...");
      
      const { data, error } = await supabase.functions.invoke("generate-image", {
        body: { prompt },
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
    <div className="h-screen">
      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Chat Interface Panel */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <ChatInterface onGenerateImage={handleGenerateImage} />
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
      <div className="md:hidden h-full">
        <ChatInterface onGenerateImage={handleGenerateImage} />
      </div>
    </div>
  );
};

export default Chat;
