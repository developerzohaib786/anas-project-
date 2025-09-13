import { useState, useEffect } from "react";
import { ImageUpload } from "@/components/ImageUpload";
import { VideoPreview } from "@/components/VideoPreview";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Video as VideoIcon } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { UploadedImage, VideoSize } from "@/types/common";
import { useSmartSession } from "@/hooks/useSmartSession";
import { imageGenerationRateLimiter } from "@/lib/rate-limiter";
import { handleError } from "@/lib/error-handler";
import { supabase } from "@/integrations/supabase/client";

const Video = () => {
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [videoSize, setVideoSize] = useState<VideoSize>('horizontal');
  const [movementDescription, setMovementDescription] = useState<string>("");
  const [sfxDescription, setSfxDescription] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<string | undefined>();
  const [currentPrompt, setCurrentPrompt] = useState<string>();
  const [isInGenerationFlow, setIsInGenerationFlow] = useState(false);
  const { currentSessionId, updateSession, sessions } = useChat();

  // Debug uploaded images state
  console.log('🖼️ Video page - uploadedImages:', uploadedImages.length, uploadedImages);
  
  // Debug handler for image changes
  const handleImagesChange = (newImages: UploadedImage[]) => {
    console.log('📸 Images changed:', newImages.length, newImages);
    setUploadedImages(newImages);
  };
  
  const { startNewSession } = useSmartSession('video', [
    () => uploadedImages.length > 0,
    () => movementDescription.trim().length > 0,
    () => sfxDescription.trim().length > 0,
    () => !!generatedVideo,
    () => !!currentPrompt
  ]);

  // Convert uploaded image to base64
  const convertImageToBase64 = async (image: UploadedImage): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(image.file);
    });
  };

  const handleGenerateVideo = async () => {
    if (!uploadedImages || uploadedImages.length === 0) {
      toast.error("Please upload an image to convert to video");
      return;
    }

    if (!movementDescription.trim()) {
      toast.error("Please describe the movement you want to see");
      return;
    }

    // Check rate limit first
    const { allowed, resetTime, remaining } = imageGenerationRateLimiter.isAllowed();
    if (!allowed) {
      const timeUntilReset = Math.ceil((resetTime! - Date.now()) / 1000);
      toast.error(`Rate limit exceeded. Try again in ${timeUntilReset} seconds.`);
      return;
    }
    
    // Show remaining generations
    if (remaining !== undefined && remaining <= 2) {
      toast.warning(`${remaining} video generations remaining in this session.`);
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
    setIsInGenerationFlow(true);
    setIsGenerating(true);
    setGeneratedVideo(undefined);

    try {
      // Convert image to base64
      console.log('🔄 Converting image to base64...');
      const imageData = await convertImageToBase64(uploadedImages[0]);
      console.log('✅ Image converted, size:', imageData.length);

      console.log('🎬 Calling generate-video function with params:', {
        movement_description: movementDescription,
        sfx_description: sfxDescription,
        video_size: videoSize,
        prompt: prompt,
        hasImage: !!imageData
      });

      const { data, error } = await supabase.functions.invoke("generate-video", {
        body: { 
          image: imageData,
          movement_description: movementDescription,
          sfx_description: sfxDescription,
          video_size: videoSize,
          prompt: prompt
        }
      });

      console.log('📡 Function response received:', { data, error });
      console.log('🔍 Response data type:', typeof data);
      console.log('🔍 Response data keys:', data ? Object.keys(data) : 'null');
      console.log('🔍 Raw response data:', JSON.stringify(data, null, 2));

      if (error) {
        console.error('❌ Supabase function error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          status: error.status,
          context: error.context
        });
        throw new Error(error.message || 'Failed to generate video');
      }

      console.log('🔍 Response data:', data);
      
      // Handle potential JSON string response (similar to ChatInterface pattern)
      let parsedData = data;
      if (typeof data === 'string') {
        try {
          parsedData = JSON.parse(data);
          console.log('📝 Parsed string response:', parsedData);
        } catch (e) {
          console.warn('⚠️ Could not parse string response, using as-is');
          parsedData = data;
        }
      }
      
      const videoUrl = parsedData?.video;
      const isDemoVideo = parsedData?.isDemoVideo;
      const demoMessage = parsedData?.demoMessage;
      
      console.log('🎥 Video URL:', videoUrl);
      
      if (isDemoVideo) {
        console.log('⚠️ Demo video detected:', demoMessage);
        toast.warning('Demo Video', {
          description: demoMessage || 'This is a sample video. Real video generation is not implemented yet.',
          duration: 8000
        });
      }
      
      if (videoUrl) {
        setGeneratedVideo(videoUrl);
        console.log('✅ Video state updated');
        
        // Update session with generated video
        if (currentSessionId) {
          updateSession(currentSessionId, {
            generatedVideo: videoUrl,
            currentPrompt: prompt,
            uploadedImages: uploadedImages,
            videoMetadata: {
              movement: movementDescription,
              sfx: sfxDescription,
              size: videoSize,
              isDemoVideo: isDemoVideo,
              demoMessage: demoMessage
            }
          });
          console.log('💾 Session updated with video data');
        }

        toast.success('Video generated successfully!', {
          description: parsedData?.metadata?.duration || 'Your video is ready'
        });
      } else {
        console.error('❌ No video URL in response:', parsedData);
        throw new Error('Generated video URL not found in response');
      }
    } catch (err) {
      const appError = handleError(err, 'Video Generation');
      
      if (appError.retryable) {
        console.log('Retryable error encountered:', appError.code);
      }
    } finally {
      setIsGenerating(false);
      setIsInGenerationFlow(false);
    }
  };

  // Restore state when session changes
  useEffect(() => {
    if (isInGenerationFlow) {
      return;
    }
    
    if (currentSessionId) {
      const session = sessions.find(s => s.id === currentSessionId);
      if (session) {
        // Restore state from session
        if (session.generatedVideo) {
          setGeneratedVideo(session.generatedVideo);
          setCurrentPrompt(session.currentPrompt);
        }
        
        if (session.uploadedImages && session.uploadedImages.length > 0) {
          setUploadedImages(session.uploadedImages);
        } else {
          setUploadedImages([]);
        }

        // Restore video metadata if available
        if (session.videoMetadata) {
          setMovementDescription(session.videoMetadata.movement || "");
          setSfxDescription(session.videoMetadata.sfx || "");
          const videoSizeValue = session.videoMetadata.size as VideoSize;
          setVideoSize(videoSizeValue || 'horizontal');
        }
      }
    }
  }, [currentSessionId, sessions, isInGenerationFlow]);

  // Save uploaded images to session when they change
  useEffect(() => {
    if (currentSessionId && uploadedImages.length > 0) {
      updateSession(currentSessionId, {
        uploadedImages: uploadedImages
      });
    }
  }, [uploadedImages, currentSessionId, updateSession]);

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
            <div className="h-full flex flex-col px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-8 relative">
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
                    onImagesChange={handleImagesChange}
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
                
                {/* Generate Button Section */}
                <div className="pt-4 border-t">
                  {uploadedImages.length > 0 && movementDescription.trim() ? (
                    <Button 
                      onClick={handleGenerateVideo}
                      className="w-full"
                      size="lg"
                      disabled={isGenerating}
                    >
                      <VideoIcon className="w-5 h-5 mr-2" />
                      {isGenerating ? "Generating Video..." : "Generate 7-Second Video"}
                    </Button>
                  ) : (
                    <div className="text-center py-4">
                      <Button 
                        className="w-full"
                        size="lg"
                        disabled
                        variant="outline"
                      >
                        <VideoIcon className="w-5 h-5 mr-2" />
                        Generate 7-Second Video
                      </Button>
                      <p className="text-xs text-muted-foreground mt-2">
                        {uploadedImages.length === 0 && "Upload an image first"}
                        {uploadedImages.length > 0 && !movementDescription.trim() && "Describe the movement you want"}
                        {uploadedImages.length === 0 && !movementDescription.trim() && "Upload an image and describe movement"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </ResizablePanel>
          
          {/* Resizable Handle */}
          <ResizableHandle className="w-1 bg-border hover:bg-border/80 transition-colors duration-200" />
          
          {/* Video Preview Panel */}
          <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
            <div className="bg-card h-full">
              <VideoPreview 
                currentPrompt={currentPrompt}
                isGenerating={isGenerating}
                generatedVideo={generatedVideo}
              />
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
      
      {/* Mobile Layout */}
      <div className="md:hidden flex-1 min-h-0 px-4 py-4 space-y-6">
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
        
        <div>
          <h3 className="text-lg font-medium mb-2">Upload Image</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Upload one image to convert to video. Supports JPEG, PNG, WebP.
          </p>
          <ImageUpload
            images={uploadedImages}
            onImagesChange={handleImagesChange}
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
        
        {/* Generate Button Section - Mobile */}
        {uploadedImages.length > 0 && movementDescription.trim() ? (
          <Button 
            onClick={handleGenerateVideo}
            className="w-full"
            size="lg"
            disabled={isGenerating}
          >
            <VideoIcon className="w-5 h-5 mr-2" />
            {isGenerating ? "Generating Video..." : "Generate 7-Second Video"}
          </Button>
        ) : (
          <div className="text-center">
            <Button 
              className="w-full"
              size="lg"
              disabled
              variant="outline"
            >
              <VideoIcon className="w-5 h-5 mr-2" />
              Generate 7-Second Video
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              {uploadedImages.length === 0 && "Upload an image first"}
              {uploadedImages.length > 0 && !movementDescription.trim() && "Describe the movement you want"}
              {uploadedImages.length === 0 && !movementDescription.trim() && "Upload an image and describe movement"}
            </p>
          </div>
        )}
        
        {(isGenerating || generatedVideo) && (
          <div className="mt-6">
            <VideoPreview 
              currentPrompt={currentPrompt}
              isGenerating={isGenerating}
              generatedVideo={generatedVideo}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Video;