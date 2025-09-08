import { useState } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { ImagePreview } from "@/components/ImagePreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage, VideoSize } from "@/types/common";
import { useSmartSession } from "@/hooks/useSmartSession";

const Video = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [videoSize, setVideoSize] = useState<VideoSize>('horizontal');
  const [movementDescription, setMovementDescription] = useState<string>("");
  const [sfxDescription, setSfxDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | undefined>();
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isPlaying, setIsPlaying] = useState(false);
  const { createSession, setCurrentSession, getCurrentSession } = useChat();
  
  const { startNewSession } = useSmartSession('video', [
    () => uploadedImages.length > 0,
    () => movementDescription.trim().length > 0,
    () => sfxDescription.trim().length > 0,
    () => !!generatedVideo,
    () => !!currentPrompt
  ]);

  const handleGenerateVideo = async () => {
    if (!uploadedImages || uploadedImages.length === 0) {
      toast.error("Please upload an image to convert to video");
      return;
    }

    if (!movementDescription.trim()) {
      toast.error("Please describe the movement you want to see");
      return;
    }

    const formatLabel = {
      horizontal: 'Horizontal (16:9)',
      vertical: 'Vertical (9:16)', 
      square: 'Square (1:1)',
      portrait: 'Portrait (4:5)',
      all: 'All formats'
    }[videoSize];
    
    const prompt = `${formatLabel} video: ${movementDescription}${sfxDescription ? ` with ${sfxDescription}` : ''}`;
    setCurrentPrompt(prompt);
    
    console.log("🎬 Starting video generation for:", uploadedImages[0].name, "Size:", videoSize);
    
    // Check rate limit first
    const { allowed, resetTime, remaining } = imageGenerationRateLimiter.isAllowed();
    if (!allowed) {
      const timeUntilReset = Math.ceil((resetTime! - Date.now()) / 1000);
      toast.error(`Rate limit exceeded. You can generate ${remaining} more videos. Try again in ${timeUntilReset} seconds.`);
      return;
    }
    
    // Show remaining generations
    if (remaining !== undefined && remaining <= 2) {
      toast.warning(`${remaining} video generations remaining in this session.`);
    }
    
    setIsGenerating(true);
    setGeneratedVideo(undefined);

    try {
      // Here you would call your video generation API
      // For now, simulate the video generation process
      await new Promise(resolve => setTimeout(resolve, 8000));
      
      // Mock video URL (in real implementation, this would come from your API)
      setGeneratedVideo("https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4");
      
      toast.success("Video generated successfully!");
    } catch (err) {
      // Use centralized error handling
      const appError = handleError(err, 'Video Generation');
      
      // Check if it's a retryable error and offer retry
      if (appError.retryable) {
        console.log('Retryable error encountered:', appError.code);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const togglePlayPause = () => {
    const video = document.querySelector('video') as HTMLVideoElement;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleNewChat = () => {
    startNewSession(() => {
      setGeneratedVideo(undefined);
      setCurrentPrompt(undefined);
      setUploadedImages([]);
      setMovementDescription("");
      setSfxDescription("");
    });
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Desktop Layout */}
      <div className="hidden md:block h-full">
        <ResizablePanelGroup direction="horizontal" className="h-full">
          {/* Input Panel */}
          <ResizablePanel defaultSize={70} minSize={50}>
            <div className="h-full flex flex-col px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-6 md:py-8 relative">
              {/* New Chat Button */}
              <div className="absolute top-4 right-4 md:top-6 md:right-6 lg:right-8 xl:right-12 z-10">
                <Button
                  onClick={handleNewChat}
                  variant="outline"
                  size="sm"
                  className="h-9 w-9 rounded-full p-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent"
                  title="New Video Project"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex-1 flex flex-col space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload Image</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload one image to convert to video. Supports JPEG, PNG, WebP.
                  </p>
                  <ImageUpload
                    images={uploadedImages}
                    onImagesChange={setUploadedImages}
                    maxImages={1}
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Video Size</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Choose the orientation for your video
                  </p>
                  <Select value={videoSize} onValueChange={(value: VideoSize) => setVideoSize(value)}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select video format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="horizontal">Horizontal (16:9 Landscape)</SelectItem>
                      <SelectItem value="vertical">Vertical (9:16 Portrait)</SelectItem>
                      <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                      <SelectItem value="square">Square (1:1)</SelectItem>
                      <SelectItem value="all">All Formats</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Describe Movement</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Describe what kind of movement or animation you want to see
                  </p>
                  <Textarea
                    placeholder="e.g., Slow camera pan from left to right, gentle zoom in on the pool, subtle water ripples..."
                    value={movementDescription}
                    onChange={(e) => setMovementDescription(e.target.value)}
                    className="min-h-[120px]"
                  />
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Sound Effects (Optional)</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Describe specific sounds you want, or leave blank for our AI to choose
                  </p>
                  <Textarea
                    placeholder="e.g., Ocean waves, birds chirping, soft jazz music, restaurant ambience..."
                    value={sfxDescription}
                    onChange={(e) => setSfxDescription(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                
                {uploadedImages.length > 0 && movementDescription.trim() && (
                  <div className="pt-4 border-t">
                    <Button 
                      onClick={handleGenerateVideo}
                      className="w-full"
                      size="lg"
                      disabled={isGenerating}
                    >
                      <VideoIcon className="w-5 h-5 mr-2" />
                      {isGenerating ? "Generating Video..." : "Generate 7-Second Video"}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200" />
          
          {/* Video Preview Panel */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
            <div className="bg-card h-full">
              <ImagePreview 
                currentPrompt={currentPrompt}
                isGenerating={isGenerating}
                generatedImage={generatedVideo}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex-1 min-h-0 px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-6 md:py-8 relative">
        {/* New Chat Button - Mobile */}
        <div className="absolute top-4 right-4 z-10">
          <Button
            onClick={handleNewChat}
            variant="outline"
            size="sm"
            className="h-9 w-9 rounded-full p-0 bg-background/80 backdrop-blur-sm border-border/50 hover:bg-accent"
            title="New Video Project"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-2">Upload Image</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Upload one image to convert to video. Supports JPEG, PNG, WebP.
            </p>
            <ImageUpload
              images={uploadedImages}
              onImagesChange={setUploadedImages}
              maxImages={1}
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Video Size</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Choose the orientation for your video
            </p>
            <Select value={videoSize} onValueChange={(value: VideoSize) => setVideoSize(value)}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select video format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="horizontal">Horizontal (16:9 Landscape)</SelectItem>
                <SelectItem value="vertical">Vertical (9:16 Portrait)</SelectItem>
                <SelectItem value="portrait">Portrait (4:5)</SelectItem>
                <SelectItem value="square">Square (1:1)</SelectItem>
                <SelectItem value="all">All Formats</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Describe Movement</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Describe what kind of movement or animation you want to see
            </p>
            <Textarea
              placeholder="e.g., Slow camera pan from left to right, gentle zoom in on the pool, subtle water ripples..."
              value={movementDescription}
              onChange={(e) => setMovementDescription(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <div>
            <h3 className="text-lg font-medium mb-2">Sound Effects (Optional)</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Describe specific sounds you want, or leave blank for our AI to choose
            </p>
            <Textarea
              placeholder="e.g., Ocean waves, birds chirping, soft jazz music, restaurant ambience..."
              value={sfxDescription}
              onChange={(e) => setSfxDescription(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          {uploadedImages.length > 0 && movementDescription.trim() && (
            <Button 
              onClick={handleGenerateVideo}
              className="w-full"
              size="lg"
              disabled={isGenerating}
            >
              <VideoIcon className="w-5 h-5 mr-2" />
              {isGenerating ? "Generating Video..." : "Generate 7-Second Video"}
            </Button>
          )}
          
          {(isGenerating || generatedVideo) && (
            <div className="mt-6">
              {isGenerating ? (
                <div className="text-center space-y-4 py-12">
                  <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                  <div>
                    <p className="font-medium">Creating your video...</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      This typically takes 30-60 seconds
                    </p>
                  </div>
                </div>
              ) : generatedVideo ? (
                <div className="space-y-4">
                  <div className="relative bg-black rounded-lg overflow-hidden">
                    <video
                      src={generatedVideo}
                      className="w-full h-auto"
                      loop
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                    />
                    <div className="absolute bottom-4 left-4 flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={togglePlayPause}
                        className="bg-black/50 hover:bg-black/70 text-white border-0"
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Download Video
                  </Button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Video;