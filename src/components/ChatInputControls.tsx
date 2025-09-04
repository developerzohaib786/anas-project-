import { useState, useRef } from "react";
import { Plus, ImagePlus, Lightbulb } from "lucide-react";
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
        <PopoverContent className="w-48 p-2" align="start">
          <div className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={handleImageUpload}
              disabled={images.length >= maxImages}
            >
              <ImagePlus className="h-4 w-4" />
              Upload reference images
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
              onClick={handleViewPrompts}
            >
              <Lightbulb className="h-4 w-4" />
              View all prompts
            </Button>
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