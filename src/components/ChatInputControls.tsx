import { useState, useRef } from "react";
import { Plus, Image, Sparkles } from "lucide-react";
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
        <PopoverContent className="w-64 p-0 border-0 shadow-lg" align="start">
          <div className="bg-card rounded-xl border border-border/50 backdrop-blur-sm">
            <div className="p-2 space-y-1">
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium hover:bg-muted/80 rounded-lg transition-all duration-200"
                onClick={handleImageUpload}
                disabled={images.length >= maxImages}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                  <Image className="h-4 w-4 text-primary" />
                </div>
                <span className="text-foreground">Upload reference images</span>
              </Button>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 h-12 px-4 text-sm font-medium hover:bg-muted/80 rounded-lg transition-all duration-200"
                onClick={handleViewPrompts}
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                </div>
                <span className="text-foreground">View all prompts</span>
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