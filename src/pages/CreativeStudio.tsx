import { ChatInterface } from "@/components/ChatInterface";
import { ImagePreview } from "@/components/ImagePreview";
import { PromptHelpers } from "@/components/PromptHelpers";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, Lightbulb } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const CreativeStudio = () => {
  const navigate = useNavigate();
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [showPromptHelpers, setShowPromptHelpers] = useState(false);

  const handleGenerateImage = async (prompt: string, images?: any[]) => {
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setGeneratedImage(undefined);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
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
      
      if (error) throw error;
      
      if (data?.image) {
        setGeneratedImage(data.image);
      }
    } catch (err) {
      console.error("Image generation failed:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen bg-background">
      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Main Chat Panel */}
          <ResizablePanel defaultSize={showPromptHelpers ? 50 : 70} minSize={40}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to routes
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPromptHelpers(!showPromptHelpers)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {showPromptHelpers ? 'Hide' : 'Show'} Helpers
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">Creative Studio</h1>
                  </div>
                  <p className="text-muted-foreground">
                    Your AI creative director - chat, upload references, get inspired
                  </p>
                </div>
              </div>

              {/* Chat Interface */}
              <div className="flex-1">
                <ChatInterface onGenerateImage={handleGenerateImage} />
              </div>
            </div>
          </ResizablePanel>
          
          {/* Prompt Helpers Panel (conditional) */}
          {showPromptHelpers && (
            <>
              <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200" />
              <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                <div className="h-full">
                  <PromptHelpers onPromptSelect={(prompt) => {
                    // This would typically send the prompt to the chat interface
                    handleGenerateImage(prompt);
                  }} />
                </div>
              </ResizablePanel>
            </>
          )}
          
          {/* Resizable Handle */}
          <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200" />
          
          {/* Preview Panel */}
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
        {/* Mobile Header */}
        <div className="border-b border-border bg-card/50 backdrop-blur-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPromptHelpers(!showPromptHelpers)}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <Lightbulb className="w-4 h-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h1 className="text-lg font-semibold text-foreground">Creative Studio</h1>
          </div>
        </div>

        {/* Mobile Content */}
        {showPromptHelpers ? (
          <div className="flex-1">
            <PromptHelpers onPromptSelect={(prompt) => {
              handleGenerateImage(prompt);
              setShowPromptHelpers(false); // Hide helpers after selection on mobile
            }} />
          </div>
        ) : (
          <div className="flex-1">
            <ChatInterface onGenerateImage={handleGenerateImage} />
          </div>
        )}

        {/* Mobile Preview (when generating or has result) */}
        {(isGenerating || generatedImage) && !showPromptHelpers && (
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
  );
};

export default CreativeStudio;