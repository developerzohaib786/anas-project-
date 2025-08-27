import { useState, useRef } from "react";
import { Upload, Plus, Trash2, Image, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { useSettings } from "@/contexts/SettingsContext";

interface Photo {
  id: string;
  url: string;
  tags: string[];
}

export default function BrandKit() {
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState<Photo[]>([]); // Empty photos array - users will upload their own
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { brandSettings, updateBrandSettings } = useSettings();

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: Photo = {
            id: Date.now().toString() + Math.random(),
            url: e.target?.result as string,
            tags: []
          };
          setPhotos(prev => [newPhoto, ...prev]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleDeletePhoto = (id: string) => {
    setPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  const handleAddTag = (photoId: string, tag: string) => {
    if (!tag.trim()) return;
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, tags: [...photo.tags, tag.trim()] }
        : photo
    ));
  };

  const handleRemoveTag = (photoId: string, tagIndex: number) => {
    setPhotos(prev => prev.map(photo => 
      photo.id === photoId 
        ? { ...photo, tags: photo.tags.filter((_, index) => index !== tagIndex) }
        : photo
    ));
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-foreground mb-2" style={{ letterSpacing: '-0.02em' }}>
          Brand Kit
        </h1>
        <p className="text-muted-foreground">
          Manage your brand assets for consistent, high-end content creation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6">
          {/* Header - only show upload button if there are photos */}
          {photos.length > 0 && (
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-medium text-foreground">Brand Photos</h2>
                <p className="text-muted-foreground">Upload photos to help AI learn your brand's visual identity</p>
              </div>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="shadow-lg"
                size="lg"
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Photos Grid */}
          {photos.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {photos.map((photo) => (
                <div
                  key={photo.id}
                  className="group relative bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border"
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={photo.url}
                      alt="Brand photo"
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeletePhoto(photo.id)}
                      className="absolute top-3 right-3 w-8 h-8 bg-background/95 hover:bg-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm shadow-lg hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Add tag button */}
                    <button
                      onClick={() => {
                        const tag = prompt("Add a tag:");
                        if (tag) handleAddTag(photo.id, tag);
                      }}
                      className="absolute bottom-3 right-3 w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                    >
                      <Plus className="h-4 w-4 text-primary-foreground" />
                    </button>
                    
                    {/* Tags overlay */}
                    {photo.tags.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-4rem)] opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {photo.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => handleRemoveTag(photo.id, index)}
                          >
                            {tag}
                            <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state for photos */}
          {photos.length === 0 && (
            <EmptyState
              icon={Image}
              title="No brand photos yet"
              description="Upload your brand photos to help AI understand your visual identity and create consistent, high-quality content."
              actionLabel="Upload Your First Photos"
              onAction={() => fileInputRef.current?.click()}
            />
          )}
        </TabsContent>

        <TabsContent value="guidelines" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit3 className="w-5 h-5" />
                  Brand Voice & Tone
                </CardTitle>
                <CardDescription>
                  Define how your brand should communicate and what personality it should convey
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brand-tone">Brand Tone</Label>
                  <Input 
                    id="brand-tone" 
                    value={brandSettings.tone || ""}
                    onChange={(e) => updateBrandSettings({ tone: e.target.value })}
                    placeholder="e.g., Luxurious, Friendly, Professional, Sophisticated" 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Describe the personality and feeling your brand should convey</p>
                </div>
                <div>
                  <Label htmlFor="brand-voice">Brand Voice</Label>
                  <Textarea 
                    id="brand-voice" 
                    value={brandSettings.voice || ""}
                    onChange={(e) => updateBrandSettings({ voice: e.target.value })}
                    placeholder="e.g., We speak with confidence and warmth, using inclusive language that makes every guest feel valued..."
                    className="mt-2 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How does your brand communicate? What words and phrases do you use?</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Messages & Values</CardTitle>
                <CardDescription>
                  Core messages and values your brand should always communicate
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="brand-keywords">Key Messages</Label>
                  <Input 
                    id="brand-keywords" 
                    value={brandSettings.keyMessages || ""}
                    onChange={(e) => updateBrandSettings({ keyMessages: e.target.value })}
                    placeholder="e.g., Exceptional service, Unforgettable experiences, Sustainable luxury" 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Main themes and messages to emphasize</p>
                </div>
                <div>
                  <Label htmlFor="brand-values">Core Values</Label>
                  <Textarea 
                    id="brand-values" 
                    value={brandSettings.coreValues || ""}
                    onChange={(e) => updateBrandSettings({ coreValues: e.target.value })}
                    placeholder="e.g., Sustainability, Guest satisfaction, Cultural authenticity, Innovation..."
                    className="mt-2 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">What does your brand stand for?</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Content Guidelines</CardTitle>
                <CardDescription>
                  Specific guidelines for what should and shouldn't be included in your content
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="content-dos">Always Include</Label>
                  <Textarea 
                    id="content-dos" 
                    value={brandSettings.contentDos || ""}
                    onChange={(e) => updateBrandSettings({ contentDos: e.target.value })}
                    placeholder="e.g., Ocean views, Local culture, Premium amenities, Personalized service..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements that should always be highlighted</p>
                </div>
                <div>
                  <Label htmlFor="content-donts">Never Include</Label>
                  <Textarea 
                    id="content-donts" 
                    value={brandSettings.contentDonts || ""}
                    onChange={(e) => updateBrandSettings({ contentDonts: e.target.value })}
                    placeholder="e.g., Crowded spaces, Generic stock photo feel, Overly promotional language..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements to avoid in your content</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button className="shadow-lg" size="lg">
                Save Guidelines
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}