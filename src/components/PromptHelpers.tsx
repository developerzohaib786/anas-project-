import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  UtensilsCrossed, 
  Building, 
  Bed, 
  Waves, 
  Users, 
  Sparkles,
  Copy,
  ArrowRight
} from "lucide-react";

interface PromptHelpersProps {
  onPromptSelect: (prompt: string) => void;
}

const promptCategories = {
  "food-beverage": {
    icon: UtensilsCrossed,
    label: "Food & Beverage",
    prompts: [
      "A high-flash photo of a martini on a bar top with dramatic shadows",
      "An overhead editorial shot of colorful dishes and cocktails artfully arranged",
      "A moody, commercial-style shot of wine glasses clinking at golden hour",
      "A cinematic close-up of a craft cocktail with garnish and steam",
      "An elegant food styling shot of a gourmet dish with perfect lighting",
      "A lifestyle photo of friends toasting champagne on a hotel terrace",
      "A dramatic flash-lit photo of a signature cocktail with ice and bubbles",
      "An editorial breakfast spread with natural morning light streaming in"
    ]
  },
  "pools-amenities": {
    icon: Waves,
    label: "Pools & Amenities",
    prompts: [
      "A golden hour aerial shot of our hotel pool with reflective water",
      "A cinematic lifestyle photo of sun loungers with cocktails at sunset",
      "A night-time luxury shot of the pool glowing under ambient lighting",
      "An editorial wide shot of the pool deck with city skyline views",
      "A commercial photo of guests enjoying the infinity pool at dusk",
      "A moody evening shot of the spa area with soft, warm lighting",
      "A lifestyle image of the fitness center with natural lighting",
      "An elegant shot of the hotel lobby with guests and ambient lighting"
    ]
  },
  "rooms-interiors": {
    icon: Bed,
    label: "Rooms & Interiors",
    prompts: [
      "A golden hour editorial shot of a hotel suite with sunlight spilling in",
      "A commercial lifestyle shot of a guest reading on the balcony at sunrise",
      "A wide editorial shot of a king bed styled with luxurious linens",
      "A moody interior shot of the bathroom with elegant lighting",
      "An architectural photo of the suite living area with city views",
      "A lifestyle image of afternoon tea service in the room",
      "A cinematic shot of the hotel room at dusk with warm lighting",
      "An editorial close-up of room amenities and luxury details"
    ]
  },
  "architecture-exteriors": {
    icon: Building,
    label: "Architecture & Exteriors",
    prompts: [
      "A dramatic sunset shot of the hotel exterior with glowing windows",
      "A flash-lit night photo of the hotel entrance with arriving guests",
      "A golden hour shot of the rooftop terrace with city skyline views",
      "An architectural photo showcasing the hotel's unique design elements",
      "A commercial exterior shot highlighting the hotel's landscaping",
      "A cinematic wide shot of the hotel facade during blue hour",
      "A lifestyle photo of the hotel's outdoor dining area at sunset",
      "An editorial shot of the hotel's entrance with elegant lighting"
    ]
  },
  "lifestyle-experience": {
    icon: Users,
    label: "Lifestyle & Experience",
    prompts: [
      "An editorial photo of a couple toasting champagne on a balcony at dusk",
      "A cinematic travel-style photo of friends laughing at the poolside bar",
      "An elegant lifestyle shot of spa treatments with tea service",
      "A commercial photo of guests enjoying the hotel's signature experience",
      "A lifestyle image of a romantic dinner setup on the terrace",
      "An editorial shot of the concierge providing personalized service",
      "A cinematic photo of guests exploring the hotel's art collection",
      "A lifestyle shot of the hotel's unique cultural experiences"
    ]
  }
};

export const PromptHelpers = ({ onPromptSelect }: PromptHelpersProps) => {
  const [selectedCategory, setSelectedCategory] = useState<string>("food-beverage");
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  const handlePromptClick = (prompt: string) => {
    onPromptSelect(prompt);
  };

  const handleCopyPrompt = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    setCopiedPrompt(prompt);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  const categories = Object.entries(promptCategories);
  const currentCategory = promptCategories[selectedCategory as keyof typeof promptCategories];

  return (
    <div className="h-full bg-card border-l border-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Prompt Helpers</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Professional prompts for hotel marketing
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex-1 flex flex-col">
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="flex-1 flex flex-col">
          <div className="border-b border-border p-2">
            <ScrollArea className="w-full">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-1 h-auto bg-muted/50">
                {categories.map(([key, category]) => {
                  const Icon = category.icon;
                  return (
                    <TabsTrigger 
                      key={key} 
                      value={key}
                      className="flex items-center gap-2 p-3 data-[state=active]:bg-background text-xs lg:text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden lg:inline">{category.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </ScrollArea>
          </div>

          {/* Prompt Lists */}
          <div className="flex-1">
            {categories.map(([key, category]) => (
              <TabsContent key={key} value={key} className="h-full m-0">
                <ScrollArea className="h-full">
                  <div className="p-4 space-y-3">
                    <div className="flex items-center gap-2 mb-4">
                      <category.icon className="w-4 h-4 text-primary" />
                      <h4 className="font-medium text-foreground">{category.label}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {category.prompts.length}
                      </Badge>
                    </div>
                    
                    {category.prompts.map((prompt, index) => (
                      <div 
                        key={index}
                        className="group bg-background border border-border rounded-lg p-3 hover:border-primary/50 transition-colors cursor-pointer"
                        onClick={() => handlePromptClick(prompt)}
                      >
                        <p className="text-sm text-foreground mb-3 leading-relaxed">
                          {prompt}
                        </p>
                        <div className="flex items-center justify-between">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyPrompt(prompt);
                            }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity h-6 px-2"
                          >
                            <Copy className="w-3 h-3 mr-1" />
                            {copiedPrompt === prompt ? "Copied!" : "Copy"}
                          </Button>
                          <div className="flex items-center text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                            Generate
                            <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </div>
        </Tabs>
      </div>
    </div>
  );
};