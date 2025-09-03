import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { Camera, Sparkles, Wand2, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface UploadedImage {
  file: File;
  url: string;
  name: string;
  id: string;
}

const QuickCapture = () => {
  const navigate = useNavigate();
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [customDescription, setCustomDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | undefined>();
  const [currentPrompt, setCurrentPrompt] = useState<string>();

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
    setGeneratedImage(undefined); // Clear previous result when new images are uploaded
  };

  const handleQuickTransform = async () => {
    if (uploadedImages.length === 0) return;
    
    const prompt = "Transform this iPhone photo into a luxury, commercial-quality editorial image with professional lighting and composition. Apply the Nino aesthetic to create a polished, high-end marketing visual.";
    await generateImage(prompt);
  };

  const handleCustomTransform = async () => {
    if (uploadedImages.length === 0 || !customDescription.trim()) return;
    
    const prompt = `Transform this iPhone photo into a luxury, commercial-quality editorial image. Style direction: ${customDescription}. Apply the Nino aesthetic with professional lighting and composition for marketing use.`;
    await generateImage(prompt);
  };

  const generateImage = async (prompt: string) => {
    setCurrentPrompt(prompt);
    setIsGenerating(true);
    setGeneratedImage(undefined);

    try {
      const { supabase } = await import("@/integrations/supabase/client");
      
      // Convert uploaded images to base64
      let imageData = undefined;
      if (uploadedImages.length > 0) {
        const convertToBase64 = (file: File): Promise<string> => {
          return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        };

        const base64Images = await Promise.all(
          uploadedImages.map(async (img) => ({
            data: await convertToBase64(img.file),
            name: img.name
          }))
        );
        imageData = base64Images;
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
          {/* Main Interface Panel */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => navigate('/')}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Back to routes
                    </Button>
                  </div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <Camera className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <h1 className="text-2xl font-semibold text-foreground">Quick Scene Capture</h1>
                  </div>
                  <p className="text-muted-foreground">
                    Turn your iPhone photo into luxury marketing visuals instantly
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6 overflow-auto">
                {/* Upload Section */}
                <div className="mb-8">
                  <h3 className="text-lg font-medium text-foreground mb-4">1. Upload Your iPhone Photo</h3>
                  <ImageUpload
                    images={uploadedImages}
                    onImagesChange={handleImagesChange}
                    maxImages={1}
                  />
                </div>

                {/* Transformation Options */}
                {uploadedImages.length > 0 && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-medium text-foreground">2. Choose Your Transformation</h3>
                    
                    {/* Option A: One-Click Transform */}
                    <div className="bg-card border border-border rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <h4 className="font-medium text-foreground">Option A: Instant Luxury</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Let Nino automatically transform your photo into a professional, commercial-quality image.
                      </p>
                      <Button 
                        onClick={handleQuickTransform}
                        disabled={isGenerating}
                        className="w-full apple-button"
                        size="lg"
                      >
                        <Wand2 className="w-4 h-4 mr-2" />
                        {isGenerating ? "Creating magic..." : "Make This Beautiful"}
                      </Button>
                    </div>

                    {/* Option B: Custom Description */}
                    <div className="bg-card border border-border rounded-xl p-6">
                      <div className="flex items-center gap-3 mb-4">
                        <Camera className="w-5 h-5 text-primary" />
                        <h4 className="font-medium text-foreground">Option B: Add Your Style</h4>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Describe the look you want in everyday language.
                      </p>
                      <div className="space-y-4">
                        <Input
                          placeholder="e.g., 'make it commercial' or 'luxury hotel style' or 'moody and elegant'"
                          value={customDescription}
                          onChange={(e) => setCustomDescription(e.target.value)}
                          className="w-full"
                        />
                        <Button 
                          onClick={handleCustomTransform}
                          disabled={isGenerating || !customDescription.trim()}
                          className="w-full apple-button"
                          variant="outline"
                          size="lg"
                        >
                          <Wand2 className="w-4 h-4 mr-2" />
                          {isGenerating ? "Transforming..." : "Transform with Style"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Tips */}
                {uploadedImages.length === 0 && (
                  <div className="bg-muted/50 rounded-xl p-6 mt-8">
                    <h4 className="font-medium text-foreground mb-3">💡 Quick Tips for Best Results</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Clear, well-lit iPhone photos work best</li>
                      <li>• Rooms, food, cocktails, pools, and spaces are perfect</li>
                      <li>• No photography skills needed - we handle the rest!</li>
                      <li>• Results are ready for marketing and social media</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          
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
          <div className="flex items-center gap-4 mb-3">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground p-2"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-primary" />
              <h1 className="text-lg font-semibold text-foreground">Quick Capture</h1>
            </div>
          </div>
        </div>

        {/* Mobile Content */}
        <div className="flex-1 p-4 overflow-auto">
          <ImageUpload
            images={uploadedImages}
            onImagesChange={handleImagesChange}
            maxImages={1}
          />
          
          {uploadedImages.length > 0 && (
            <div className="mt-6 space-y-4">
              <Button 
                onClick={handleQuickTransform}
                disabled={isGenerating}
                className="w-full apple-button"
                size="lg"
              >
                <Wand2 className="w-4 h-4 mr-2" />
                Make Beautiful
              </Button>
              
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-background px-2 text-muted-foreground">or add custom style</span>
                </div>
              </div>
              
              <Input
                placeholder="Describe your style..."
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
              />
              
              <Button 
                onClick={handleCustomTransform}
                disabled={isGenerating || !customDescription.trim()}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Transform
              </Button>
            </div>
          )}

          {/* Mobile Preview */}
          {(isGenerating || generatedImage) && (
            <div className="mt-6">
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

export default QuickCapture;