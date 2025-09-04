import { useState } from "react";
import { X, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";

interface PromptLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromptSelect: (prompt: string) => void;
}

const promptCategories = {
  "Food & Beverage": [
    "A high-flash photo of a martini on a bar top",
    "An overhead editorial shot of colorful dishes and cocktails",
    "A moody, commercial-style shot of wine glasses clinking at golden hour",
    "A vibrant lifestyle photo of a chef plating an elegant dish",
    "A dramatic close-up of champagne being poured into crystal glasses",
    "An artistic flat-lay of a gourmet breakfast spread with natural lighting",
    "A cinematic shot of a bartender crafting cocktails with flames",
    "An editorial photo of a wine tasting setup with vineyard views"
  ],
  "Pools & Amenities": [
    "A golden hour aerial shot of our hotel pool",
    "A cinematic lifestyle photo of sun loungers with cocktails",
    "A night-time luxury shot of the pool glowing under ambient lighting",
    "An editorial photo of a couple relaxing by the infinity pool at sunset",
    "A dramatic overhead shot of the pool deck with geometric shadows",
    "A lifestyle photo of friends enjoying poolside cabanas",
    "A commercial shot of the spa area with serene water features",
    "An artistic photo of pool reflections at blue hour"
  ],
  "Rooms & Interiors": [
    "A golden hour editorial shot of a hotel suite with sunlight spilling in",
    "A commercial lifestyle shot of a guest reading on the balcony",
    "A wide editorial shot of a king bed styled with plush linens",
    "A dramatic photo of a luxury bathroom with marble and ambient lighting",
    "An intimate shot of a couple enjoying room service on the terrace",
    "A design-focused photo showcasing the room's architectural details",
    "A lifestyle photo of a business traveler working in a modern suite",
    "An editorial shot of the presidential suite's living area at dusk"
  ],
  "Architecture & Exteriors": [
    "A dramatic sunset shot of the hotel exterior with glowing windows",
    "A flash-lit night photo of the hotel entrance with cars arriving",
    "A golden hour shot of the rooftop terrace with city skyline views",
    "An architectural photo highlighting the building's unique design elements",
    "A cinematic wide shot of the hotel set against natural landscapes",
    "A commercial photo of the valet area with luxury vehicles",
    "An editorial shot of the hotel's facade during blue hour",
    "A dramatic upward angle shot emphasizing the building's grandeur"
  ],
  "Lifestyle & Experience": [
    "An editorial photo of a couple toasting champagne on a balcony at dusk",
    "A cinematic travel-style photo of friends laughing at the poolside bar",
    "An elegant lifestyle shot of spa treatments with tea service",
    "A commercial photo of guests enjoying a sunset yoga session",
    "An editorial shot of a romantic dinner setup on a private terrace",
    "A lifestyle photo of a family enjoying hotel activities together",
    "A cinematic shot of guests arriving in style at the hotel entrance",
    "An artistic photo of a couple's silhouette against the hotel's backdrop"
  ]
};

export function PromptLibrary({ open, onOpenChange, onPromptSelect }: PromptLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = Object.entries(promptCategories).reduce((acc, [category, prompts]) => {
    const filteredPrompts = prompts.filter(prompt =>
      prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (filteredPrompts.length > 0) {
      acc[category] = filteredPrompts;
    }
    return acc;
  }, {} as Record<string, string[]>);

  const handlePromptClick = (prompt: string) => {
    onPromptSelect(prompt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-semibold">Prompt Library</DialogTitle>
          <div className="relative mt-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </DialogHeader>

        <ScrollArea className="px-6 pb-6 max-h-[60vh]">
          <div className="space-y-6">
            {Object.entries(filteredCategories).map(([category, prompts]) => (
              <div key={category} className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  {category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prompts.map((prompt, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      className="text-left p-4 h-auto justify-start text-wrap"
                      onClick={() => handlePromptClick(prompt)}
                    >
                      <span className="text-sm leading-relaxed">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          
          {Object.keys(filteredCategories).length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No prompts found matching your search.</p>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}