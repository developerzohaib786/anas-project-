import { useState, useRef } from "react";
import { Upload, Plus, Trash2, Image, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const mockLogos = [
  { id: "1", name: "Primary Logo", type: "PNG", size: "2.3 MB", uploaded: "2024-08-20" },
  { id: "2", name: "Logo White", type: "SVG", size: "1.1 MB", uploaded: "2024-08-20" },
  { id: "3", name: "Logo Mark", type: "PNG", size: "890 KB", uploaded: "2024-08-20" },
];

const mockPhotos = [
  { id: "1", url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=600&fit=crop", tags: ["pool", "luxury", "villa"] },
  { id: "2", url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop", tags: ["bedroom", "suite", "ocean view"] },
  { id: "3", url: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=400&h=500&fit=crop", tags: ["dining", "restaurant", "elegant"] },
  { id: "4", url: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=280&fit=crop", tags: ["infinity pool", "sunset", "view"] },
  { id: "5", url: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=550&fit=crop", tags: ["presidential", "suite", "luxury"] },
  { id: "6", url: "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=350&fit=crop", tags: ["spa", "treatment", "wellness"] },
  { id: "7", url: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=480&fit=crop", tags: ["lobby", "grand", "entrance"] },
  { id: "8", url: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=400&h=320&fit=crop", tags: ["beachfront", "restaurant", "dining"] },
  { id: "9", url: "https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=400&h=600&fit=crop", tags: ["rooftop", "bar", "city view"] },
  { id: "10", url: "https://images.unsplash.com/photo-1587985064135-0366536eab42?w=400&h=250&fit=crop", tags: ["beach", "cabana", "relaxation"] },
  { id: "11", url: "https://images.unsplash.com/photo-1559599101-f09722fb4948?w=400&h=520&fit=crop", tags: ["wine", "cellar", "fine dining"] },
  { id: "12", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop", tags: ["garden", "terrace", "outdoor"] },
  { id: "13", url: "https://images.unsplash.com/photo-1573052905904-34ad8c27f0cc?w=400&h=450&fit=crop", tags: ["conference", "business", "meeting"] },
  { id: "14", url: "https://images.unsplash.com/photo-1566195992011-5f6b21e539aa?w=400&h=350&fit=crop", tags: ["fitness", "gym", "wellness"] },
  { id: "15", url: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=400&h=600&fit=crop", tags: ["penthouse", "balcony", "luxury"] },
  { id: "16", url: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=400&h=280&fit=crop", tags: ["breakfast", "buffet", "dining"] },
  { id: "17", url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=500&fit=crop", tags: ["yacht", "marina", "waterfront"] },
  { id: "18", url: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=380&fit=crop", tags: ["garden pool", "private", "tranquil"] },
  { id: "19", url: "https://images.unsplash.com/photo-1582719508461-905c673771fd?w=400&h=550&fit=crop", tags: ["executive", "lounge", "business"] },
  { id: "20", url: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=320&fit=crop", tags: ["sunset", "deck", "romantic"] },
];

export default function BrandKit() {
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState(mockPhotos);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      Array.from(files).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto = {
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
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Brand Kit</h1>
        <p className="text-gray-600">
          Manage your brand assets for consistent, high-end luxury photo creation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-gray-900">Brand Photos</h2>
              <p className="text-gray-600">Upload photos to help AI learn your brand's visual identity and spaces</p>
            </div>
            <Button onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              Upload Photos
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              className="hidden"
            />
          </div>

          {/* Modern Masonry Grid */}
          <div className="masonry-grid">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="masonry-item group relative bg-white rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2"
                style={{
                  boxShadow: 'var(--shadow-soft)',
                  breakInside: 'avoid',
                  marginBottom: '1rem'
                }}
              >
                <div className="relative overflow-hidden">
                  <img
                    src={photo.url}
                    alt="Brand photo"
                    className="w-full h-auto object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = `https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop`;
                    }}
                  />
                  
                  {/* Delete button - top right */}
                  <button
                    onClick={() => handleDeletePhoto(photo.id)}
                    className="absolute top-3 right-3 w-8 h-8 bg-white/95 hover:bg-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm shadow-lg hover:scale-110"
                  >
                    <Trash2 className="h-4 w-4 text-gray-600" />
                  </button>

                  {/* Add tag button - bottom right */}
                  <button
                    onClick={() => {
                      const tag = prompt("Add a tag:");
                      if (tag) handleAddTag(photo.id, tag);
                    }}
                    className="absolute bottom-3 right-3 w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                  >
                    <Plus className="h-4 w-4 text-white" />
                  </button>
                  
                  {/* Tags overlay */}
                  <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-4rem)]">
                    {photo.tags.map((tag, index) => (
                      <div
                        key={index}
                        className="group/tag bg-black/70 hover:bg-black/80 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5 transition-all duration-200 cursor-pointer"
                        onClick={() => handleRemoveTag(photo.id, index)}
                      >
                        <span>{tag}</span>
                        <X className="h-3 w-3 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-200" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {photos.length === 0 && (
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6" style={{ boxShadow: 'var(--shadow-minimal)' }}>
                <Image className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-3">No brand photos yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Upload your luxury resort photos to help AI understand your brand's visual identity and create consistent, high-end marketing content.</p>
              <Button 
                onClick={() => fileInputRef.current?.click()}
                className="apple-button bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-full font-medium"
                style={{ boxShadow: 'var(--shadow-button)' }}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload Your First Photos
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="logos" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-gray-900">Logo Assets</h2>
              <p className="text-gray-600">Upload and manage your brand logos</p>
            </div>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Logo
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockLogos.map((logo) => (
              <Card key={logo.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                    <div className="text-4xl">🏨</div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">{logo.name}</h3>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{logo.type}</Badge>
                      <span className="text-sm text-gray-600">{logo.size}</span>
                    </div>
                    <p className="text-sm text-gray-600">Uploaded {logo.uploaded}</p>
                    <div className="flex gap-2 mt-3">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Download className="mr-2 h-3 w-3" />
                        Download
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="settings" className="mt-6">
          <div className="max-w-2xl">
            <h2 className="text-xl font-medium text-gray-900 mb-6">Brand Settings</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Brand Information</CardTitle>
                  <CardDescription>
                    Basic information about your brand
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="brand-name">Brand Name</Label>
                    <Input id="brand-name" placeholder="Your Hotel/Resort Name" />
                  </div>
                  <div>
                    <Label htmlFor="brand-description">Description</Label>
                    <Input id="brand-description" placeholder="Brief description of your brand" />
                  </div>
                  <div>
                    <Label htmlFor="brand-industry">Industry</Label>
                    <Input id="brand-industry" value="Hospitality & Travel" disabled />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Content Guidelines</CardTitle>
                  <CardDescription>
                    Define how your brand should be represented
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="brand-tone">Brand Tone</Label>
                    <Input id="brand-tone" placeholder="e.g., Luxurious, Friendly, Professional" />
                  </div>
                  <div>
                    <Label htmlFor="brand-keywords">Key Messages</Label>
                    <Input id="brand-keywords" placeholder="e.g., Exceptional service, Unforgettable experiences" />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}