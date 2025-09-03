import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/ImageUpload";
import { Wand2, Sparkles, Camera, MessageSquare } from "lucide-react";

interface UploadedImage {
  file: File;
  url: string;
  name: string;
  id: string;
}

interface QuickCaptureInterfaceProps {
  onGenerateImage: (prompt: string, images?: any[]) => void;
  isGenerating: boolean;
}

export const QuickCaptureInterface = ({ onGenerateImage, isGenerating }: QuickCaptureInterfaceProps) => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [customDescription, setCustomDescription] = useState("");

  const handleImagesChange = (images: UploadedImage[]) => {
    setUploadedImages(images);
  };

  const handleQuickTransform = async () => {
    if (uploadedImages.length === 0) return;
    
    const prompt = "Transform this iPhone photo into a luxury, commercial-quality editorial image with professional lighting and composition. Apply the Nino aesthetic to create a polished, high-end marketing visual.";
    onGenerateImage(prompt, uploadedImages);
  };

  const handleCustomTransform = async () => {
    if (uploadedImages.length === 0 || !customDescription.trim()) return;
    
    const prompt = `Transform this iPhone photo into a luxury, commercial-quality editorial image. Style direction: ${customDescription}. Apply the Nino aesthetic with professional lighting and composition for marketing use.`;
    onGenerateImage(prompt, uploadedImages);
  };

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* iPhone Preview Area */}
      <div className="flex-shrink-0 flex items-center justify-center p-4 md:p-8 bg-muted/20 order-2 md:order-1">
        <div className="relative">
          {/* iPhone Frame */}
          <div className="w-48 md:w-64 h-96 md:h-[520px] bg-black rounded-[2rem] md:rounded-[2.5rem] p-1.5 md:p-2 shadow-2xl">
            <div className="w-full h-full bg-white rounded-[1.5rem] md:rounded-[2rem] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 md:w-32 h-4 md:h-6 bg-black rounded-b-xl md:rounded-b-2xl z-10"></div>
              
              {/* Screen Content */}
              <div className="w-full h-full flex items-center justify-center p-3 md:p-4 pt-6 md:pt-8">
                {uploadedImages.length > 0 ? (
                  <img
                    src={uploadedImages[0].url}
                    alt="Uploaded"
                    className="w-full h-full object-cover rounded-lg md:rounded-xl"
                  />
                ) : (
                  <div className="text-center text-muted-foreground">
                    <Camera className="w-8 md:w-12 h-8 md:h-12 mx-auto mb-2 md:mb-4 opacity-50" />
                    <p className="text-xs md:text-sm">Upload your iPhone photo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Upload Area Overlay for when no image */}
          {uploadedImages.length === 0 && (
            <div className="absolute inset-1.5 md:inset-2 rounded-[1.5rem] md:rounded-[2rem] border-2 border-dashed border-primary/30 bg-primary/5 flex items-center justify-center">
              <div className="w-full h-full flex items-center justify-center">
                <ImageUpload
                  images={uploadedImages}
                  onImagesChange={handleImagesChange}
                  maxImages={1}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Chat Options */}
      <div className="flex-1 flex flex-col justify-center p-4 md:p-8 max-w-none md:max-w-md order-1 md:order-2">
        <div className="space-y-4 md:space-y-6">
          <div className="text-center mb-4 md:mb-8">
            <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-1 md:mb-2">Quick Scene Capture</h3>
            <p className="text-sm md:text-base text-muted-foreground">Turn your iPhone photo into luxury marketing visuals</p>
          </div>

          {uploadedImages.length === 0 && (
            <div className="text-center md:hidden">
              <ImageUpload
                images={uploadedImages}
                onImagesChange={handleImagesChange}
                maxImages={1}
              />
            </div>
          )}

          {uploadedImages.length > 0 && (
            <div className="space-y-3 md:space-y-4">
              {/* Option A: Quick Transform */}
              <div className="bg-card border border-border rounded-lg md:rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <Sparkles className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  <h4 className="font-medium text-foreground text-sm md:text-base">Option A: Instant Magic</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Let Nino automatically transform your photo with luxury styling.
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
              <div className="bg-card border border-border rounded-lg md:rounded-xl p-4 md:p-6">
                <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                  <MessageSquare className="w-4 md:w-5 h-4 md:h-5 text-primary" />
                  <h4 className="font-medium text-foreground text-sm md:text-base">Option B: Add Your Style</h4>
                </div>
                <p className="text-xs md:text-sm text-muted-foreground mb-3 md:mb-4">
                  Describe the look you want in everyday language.
                </p>
                <div className="space-y-3 md:space-y-4">
                  <Input
                    placeholder="e.g., 'make it commercial' or 'luxury hotel style'"
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

              {/* Replace Image Button */}
              <div className="text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setUploadedImages([])}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Upload Different Photo
                </Button>
              </div>
            </div>
          )}

          {/* Tips */}
          {uploadedImages.length === 0 && (
            <div className="bg-muted/50 rounded-lg md:rounded-xl p-3 md:p-4 mt-4 md:mt-6">
              <h4 className="font-medium text-foreground mb-2 text-sm md:text-base">💡 Best Results</h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>• Clear, well-lit iPhone photos</li>
                <li>• Rooms, food, cocktails, pools</li>
                <li>• No photography skills needed!</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};