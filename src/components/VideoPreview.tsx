import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Play, Pause, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface VideoPreviewProps {
  currentPrompt?: string;
  isGenerating?: boolean;
  generatedVideo?: string;
}

export const VideoPreview = ({ currentPrompt, isGenerating = false, generatedVideo }: VideoPreviewProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (video) {
      if (isPlaying) {
        video.pause();
      } else {
        video.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setIsMuted(!isMuted);
    }
  };

  const handleDownload = async () => {
    if (!generatedVideo) return;
    
    setIsDownloading(true);
    
    try {
      console.log('🔄 Starting video download from:', generatedVideo);
      
      // Show loading toast
      const loadingToast = toast.loading('Preparing video download...');
      
      // Fetch the video with proper headers
      const response = await fetch(generatedVideo, {
        method: 'GET',
        headers: {
          'Accept': 'video/*',
        },
        mode: 'cors', // Allow CORS
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch video: ${response.status} ${response.statusText}`);
      }
      
      // Get the video as a blob
      const blob = await response.blob();
      console.log('✅ Video blob received, size:', blob.size);
      
      // Create download URL from blob
      const downloadUrl = URL.createObjectURL(blob);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `nino-video-${Date.now()}.mp4`;
      link.style.display = 'none';
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      
      // Success toast
      toast.dismiss(loadingToast);
      toast.success('Video download started!');
      
    } catch (error) {
      console.error('❌ Download failed:', error);
      
      // Fallback: Try opening in new tab if direct download fails
      try {
        const link = document.createElement('a');
        link.href = generatedVideo;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.click();
        
        toast.info('Video opened in new tab. Right-click and "Save As" to download.');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        toast.error('Download failed. Please try again or contact support.');
      }
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b">
        <h3 className="font-medium">Video Preview</h3>
        {currentPrompt && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {currentPrompt}
          </p>
        )}
      </div>

      {/* Preview Area */}
      <div className="flex-1 px-4 pb-4">
        <div className="flex items-center justify-center h-full">
          <div className="w-full max-w-sm bg-muted/30 border border-dashed border-border rounded-3xl flex items-center justify-center relative overflow-hidden transition-all duration-300 hover:border-border/60 aspect-video">
            {isGenerating ? (
              <div className="text-center animate-fade-in">
                <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-4">Generating video...</p>
                <p className="text-xs text-muted-foreground mt-2">This may take 30-60 seconds</p>
              </div>
            ) : generatedVideo ? (
              <div className="relative w-full h-full">
                {videoError ? (
                  <div className="flex items-center justify-center h-full bg-muted/20 rounded-2xl">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-red-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <span className="text-red-500 text-2xl">⚠️</span>
                      </div>
                      <p className="text-sm text-red-600">Failed to load video</p>
                      <button 
                        onClick={() => setVideoError(false)}
                        className="text-xs text-blue-600 underline mt-2"
                      >
                        Try again
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <video
                      ref={videoRef}
                      src={generatedVideo}
                      className="w-full h-full object-cover rounded-3xl"
                      loop
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onError={() => setVideoError(true)}
                      onLoadedData={() => setVideoError(false)}
                    />
                    
                    {/* Video Controls Overlay */}
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={togglePlayPause}
                          className="bg-black/50 hover:bg-black/70 text-white border-0"
                        >
                          {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={toggleMute}
                          className="bg-black/50 hover:bg-black/70 text-white border-0"
                        >
                          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full bg-muted/20 rounded-2xl">
                <div className="text-center">
                  <div className="w-16 h-16 bg-muted/40 rounded-full mx-auto mb-4"></div>
                  <p className="text-sm text-muted-foreground">
                    Generated video will appear here
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Download Button */}
      {generatedVideo && !isGenerating && (
        <div className="px-4 pb-4 border-t">
          <Button 
            onClick={handleDownload}
            className="w-full"
            variant="outline"
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};