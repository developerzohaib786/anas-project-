import { useState, useRef } from "react";
import { Upload, Plus, Edit2, Trash2, Download, Palette, Image, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

const mockColors = [
  { name: "Primary Blue", hex: "#1E40AF", usage: "Main brand color" },
  { name: "Ocean Teal", hex: "#0891B2", usage: "Accent color" },
  { name: "Sunset Orange", hex: "#EA580C", usage: "Call-to-action" },
  { name: "Warm White", hex: "#FAFAF9", usage: "Background" },
  { name: "Charcoal", hex: "#374151", usage: "Text & headers" },
];

const mockLogos = [
  { id: "1", name: "Primary Logo", type: "PNG", size: "2.3 MB", uploaded: "2024-08-20" },
  { id: "2", name: "Logo White", type: "SVG", size: "1.1 MB", uploaded: "2024-08-20" },
  { id: "3", name: "Logo Mark", type: "PNG", size: "890 KB", uploaded: "2024-08-20" },
];

const mockFonts = [
  { name: "Inter", style: "Primary", usage: "Headers & body text", weights: ["Regular", "Medium", "Semibold"] },
  { name: "Playfair Display", style: "Secondary", usage: "Elegant headers", weights: ["Regular", "Bold"] },
];

const mockPhotos = [
  { id: "1", url: "/api/placeholder/400/300", name: "Lobby Interior", uploaded: "2024-08-20", size: "2.1 MB" },
  { id: "2", url: "/api/placeholder/300/400", name: "Pool Area", uploaded: "2024-08-19", size: "1.8 MB" },
  { id: "3", url: "/api/placeholder/500/300", name: "Dining Room", uploaded: "2024-08-18", size: "2.5 MB" },
  { id: "4", url: "/api/placeholder/350/500", name: "Suite Bedroom", uploaded: "2024-08-17", size: "1.9 MB" },
  { id: "5", url: "/api/placeholder/400/250", name: "Ocean View", uploaded: "2024-08-16", size: "2.3 MB" },
  { id: "6", url: "/api/placeholder/300/350", name: "Spa Treatment", uploaded: "2024-08-15", size: "1.7 MB" },
  { id: "7", url: "/api/placeholder/450/400", name: "Restaurant", uploaded: "2024-08-14", size: "2.0 MB" },
  { id: "8", url: "/api/placeholder/320/480", name: "Fitness Center", uploaded: "2024-08-13", size: "1.6 MB" },
];

export default function BrandKit() {
  const [activeTab, setActiveTab] = useState("colors");
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
            name: file.name.split('.')[0],
            uploaded: new Date().toISOString().split('T')[0],
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
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

  return (
    <div className="p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900 mb-2">Brand Kit</h1>
        <p className="text-gray-600">
          Manage your brand assets to ensure consistent, on-brand content creation
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="logos">Logos</TabsTrigger>
          <TabsTrigger value="fonts">Fonts</TabsTrigger>
          <TabsTrigger value="photos">Photos</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-gray-900">Brand Colors</h2>
              <p className="text-gray-600">Define your brand color palette</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Color
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockColors.map((color, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg border border-gray-200"
                      style={{ backgroundColor: color.hex }}
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{color.name}</h3>
                      <p className="text-sm text-gray-600">{color.hex}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{color.usage}</p>
                </CardContent>
              </Card>
            ))}
          </div>
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

        <TabsContent value="fonts" className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-gray-900">Typography</h2>
              <p className="text-gray-600">Define your brand typography system</p>
            </div>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Font
            </Button>
          </div>

          <div className="space-y-4">
            {mockFonts.map((font, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-medium" style={{ fontFamily: font.name }}>
                          {font.name}
                        </h3>
                        <Badge variant="secondary">{font.style}</Badge>
                      </div>
                      <p className="text-gray-600 text-sm">{font.usage}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex gap-2">
                    {font.weights.map((weight) => (
                      <Badge key={weight} variant="outline">
                        {weight}
                      </Badge>
                    ))}
                  </div>
                  
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <p className="text-lg" style={{ fontFamily: font.name }}>
                      The quick brown fox jumps over the lazy dog
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

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

          {/* Masonry Grid */}
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="break-inside-avoid bg-white rounded-2xl overflow-hidden group relative transition-all duration-200 hover:shadow-lg"
                style={{
                  boxShadow: 'var(--shadow-minimal)'
                }}
              >
                <div className="relative">
                  <img
                    src={photo.url}
                    alt={photo.name}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                  
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-white/90 hover:bg-white text-gray-900"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleDeletePhoto(photo.id)}
                        className="bg-white/90 hover:bg-white text-gray-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
                
                {/* Photo info */}
                <div className="p-4">
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{photo.name}</h3>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{photo.size}</span>
                    <span>{photo.uploaded}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {photos.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Image className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No photos yet</h3>
              <p className="text-gray-600 mb-6">Upload your first brand photos to get started</p>
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="mr-2 h-4 w-4" />
                Upload Photos
              </Button>
            </div>
          )}
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