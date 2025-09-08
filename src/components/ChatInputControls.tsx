import { useState, useRef } from "react";
import { Plus, Image, Sparkles, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { PromptLibrary } from "@/components/PromptLibrary";

interface UploadedImage {
  id: string;
  file: File;
  url: string;
  name: string;
}

interface ChatInputControlsProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onPromptSelect: (prompt: string) => void;
  maxImages?: number;
}

export function ChatInputControls({ 
  images, 
  onImagesChange, 
  onPromptSelect, 
  maxImages = 3 
}: ChatInputControlsProps) {
  const [promptLibraryOpen, setPromptLibraryOpen] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => file.type.startsWith('image/'));
    
    if (validFiles.length === 0) return;

    const remainingSlots = maxImages - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    const newImages: UploadedImage[] = filesToAdd.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    onImagesChange([...images, ...newImages]);
    setPopoverOpen(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    e.target.value = ''; // Reset input
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleViewPrompts = () => {
    setPromptLibraryOpen(true);
    setPopoverOpen(false);
  };

  return (
    <div className="flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileInputChange}
        className="hidden"
      />
      
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 rounded-full hover:bg-muted"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0 border shadow-xl rounded-2xl" align="start">
          <div className="bg-background/95 backdrop-blur-sm rounded-2xl border border-border/20">
            <div className="p-3 space-y-2">
              {/* Add photos & files option */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 px-4 text-left hover:bg-muted/60 rounded-xl transition-colors"
                onClick={handleImageUpload}
                disabled={images.length >= maxImages}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600">
                  <Image className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Add photos & files</span>
                  <span className="text-xs text-muted-foreground">Upload reference images</span>
                </div>
              </Button>

              {/* Create image option */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 px-4 text-left hover:bg-muted/60 rounded-xl transition-colors"
                onClick={() => {
                  // This could trigger image generation directly
                  setPopoverOpen(false);
                }}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600">
                  <Camera className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">Create image</span>
                  <span className="text-xs text-muted-foreground">Generate AI images</span>
                </div>
              </Button>

              {/* View prompts option */}
              <Button
                variant="ghost"
                className="w-full justify-start gap-4 h-14 px-4 text-left hover:bg-muted/60 rounded-xl transition-colors"
                onClick={handleViewPrompts}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">View all prompts</span>
                  <span className="text-xs text-muted-foreground">Browse curated prompts</span>
                </div>
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <PromptLibrary
        open={promptLibraryOpen}
        onOpenChange={setPromptLibraryOpen}
        onPromptSelect={onPromptSelect}
      />
    </div>
  );
}