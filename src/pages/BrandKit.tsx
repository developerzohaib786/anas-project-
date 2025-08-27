import { useState, useRef, useEffect } from "react";
import { Upload, Plus, Trash2, Image, X, Edit3, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface BrandPhoto {
  id: string;
  storage_path: string;
  file_name: string;
  tags: string[];
  url?: string;
}

interface BrandGuidelines {
  tone: string;
  voice: string;
  key_messages: string;
  core_values: string;
  content_dos: string;
  content_donts: string;
}

export default function BrandKit() {
  const [activeTab, setActiveTab] = useState("photos");
  const [photos, setPhotos] = useState<BrandPhoto[]>([]);
  const [guidelines, setGuidelines] = useState<BrandGuidelines>({
    tone: "",
    voice: "",
    key_messages: "",
    core_values: "",
    content_dos: "",
    content_donts: ""
  });
  const [currentTeamId, setCurrentTeamId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [savingGuidelines, setSavingGuidelines] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  // Load user's team and brand data
  useEffect(() => {
    const loadBrandData = async () => {
      if (!user) return;
      
      try {
        // Get user's team
        const { data: teamMemberships, error: teamError } = await supabase
          .from('team_memberships')
          .select('team_id, teams(id, name)')
          .eq('user_id', user.id)
          .eq('invitation_accepted', true)
          .limit(1);

        if (teamError) {
          console.error('Error fetching team:', teamError);
          return;
        }

        if (!teamMemberships || teamMemberships.length === 0) {
          toast.error("No team found. Please complete onboarding first.");
          return;
        }

        const teamId = teamMemberships[0].team_id;
        setCurrentTeamId(teamId);

        // Load brand photos
        const { data: brandPhotos, error: photosError } = await supabase
          .from('brand_photos')
          .select('*')
          .eq('team_id', teamId)
          .order('created_at', { ascending: false });

        if (photosError) {
          console.error('Error fetching photos:', photosError);
        } else {
          // Get signed URLs for photos
          const photosWithUrls = await Promise.all(
            (brandPhotos || []).map(async (photo) => {
              const { data } = supabase.storage
                .from('brand-photos')
                .getPublicUrl(photo.storage_path);
              
              return {
                ...photo,
                url: data.publicUrl
              };
            })
          );
          setPhotos(photosWithUrls);
        }

        // Load brand guidelines
        const { data: brandGuidelines, error: guidelinesError } = await supabase
          .from('brand_guidelines')
          .select('*')
          .eq('team_id', teamId)
          .maybeSingle();

        if (guidelinesError) {
          console.error('Error fetching guidelines:', guidelinesError);
        } else if (brandGuidelines) {
          setGuidelines({
            tone: brandGuidelines.tone || "",
            voice: brandGuidelines.voice || "",
            key_messages: brandGuidelines.key_messages || "",
            core_values: brandGuidelines.core_values || "",
            content_dos: brandGuidelines.content_dos || "",
            content_donts: brandGuidelines.content_donts || ""
          });
        }
      } catch (error) {
        console.error('Error loading brand data:', error);
        toast.error("Failed to load brand data");
      } finally {
        setLoading(false);
      }
    };

    loadBrandData();
  }, [user]);

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !currentTeamId || !user) return;

    setUploadingPhotos(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const storagePath = `${currentTeamId}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('brand-photos')
          .upload(storagePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Save metadata to database
        const { data: photoData, error: dbError } = await supabase
          .from('brand_photos')
          .insert({
            team_id: currentTeamId,
            user_id: user.id,
            storage_path: storagePath,
            file_name: file.name,
            file_size: file.size,
            content_type: file.type,
            tags: []
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }

        // Get public URL
        const { data } = supabase.storage
          .from('brand-photos')
          .getPublicUrl(storagePath);

        return {
          ...photoData,
          url: data.publicUrl
        };
      });

      const newPhotos = await Promise.all(uploadPromises);
      setPhotos(prev => [...newPhotos, ...prev]);
      toast.success(`${newPhotos.length} photo(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading photos:', error);
      toast.error("Failed to upload photos");
    } finally {
      setUploadingPhotos(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeletePhoto = async (photo: BrandPhoto) => {
    if (!currentTeamId) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-photos')
        .remove([photo.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('brand_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      toast.success("Photo deleted successfully");
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error("Failed to delete photo");
    }
  };

  const handleAddTag = async (photoId: string, tag: string) => {
    if (!tag.trim()) return;

    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      const newTags = [...photo.tags, tag.trim()];

      const { error } = await supabase
        .from('brand_photos')
        .update({ tags: newTags })
        .eq('id', photoId);

      if (error) {
        console.error('Error adding tag:', error);
        throw error;
      }

      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, tags: newTags } : p
      ));
      toast.success("Tag added successfully");
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (photoId: string, tagIndex: number) => {
    try {
      const photo = photos.find(p => p.id === photoId);
      if (!photo) return;

      const newTags = photo.tags.filter((_, index) => index !== tagIndex);

      const { error } = await supabase
        .from('brand_photos')
        .update({ tags: newTags })
        .eq('id', photoId);

      if (error) {
        console.error('Error removing tag:', error);
        throw error;
      }

      setPhotos(prev => prev.map(p => 
        p.id === photoId ? { ...p, tags: newTags } : p
      ));
      toast.success("Tag removed successfully");
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error("Failed to remove tag");
    }
  };

  const handleSaveGuidelines = async () => {
    if (!currentTeamId) return;

    setSavingGuidelines(true);
    try {
      const { error } = await supabase
        .from('brand_guidelines')
        .upsert({
          team_id: currentTeamId,
          ...guidelines
        });

      if (error) {
        console.error('Error saving guidelines:', error);
        throw error;
      }

      toast.success("Guidelines saved successfully");
    } catch (error) {
      console.error('Error saving guidelines:', error);
      toast.error("Failed to save guidelines");
    } finally {
      setSavingGuidelines(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

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
          {/* Header - always show upload button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-foreground">Brand Photos</h2>
              <p className="text-muted-foreground">Upload photos to help AI learn your brand's visual identity</p>
            </div>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhotos}
              className="shadow-lg"
              size="lg"
            >
              {uploadingPhotos ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photos
                </>
              )}
            </Button>
          </div>

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
                      alt={photo.file_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => handleDeletePhoto(photo)}
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
                    value={guidelines.tone}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, tone: e.target.value }))}
                    placeholder="e.g., Luxurious, Friendly, Professional, Sophisticated" 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Describe the personality and feeling your brand should convey</p>
                </div>
                <div>
                  <Label htmlFor="brand-voice">Brand Voice</Label>
                  <Textarea 
                    id="brand-voice" 
                    value={guidelines.voice}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, voice: e.target.value }))}
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
                    value={guidelines.key_messages}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, key_messages: e.target.value }))}
                    placeholder="e.g., Exceptional service, Unforgettable experiences, Sustainable luxury" 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Main themes and messages to emphasize</p>
                </div>
                <div>
                  <Label htmlFor="brand-values">Core Values</Label>
                  <Textarea 
                    id="brand-values" 
                    value={guidelines.core_values}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, core_values: e.target.value }))}
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
                    value={guidelines.content_dos}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, content_dos: e.target.value }))}
                    placeholder="e.g., Ocean views, Local culture, Premium amenities, Personalized service..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements that should always be highlighted</p>
                </div>
                <div>
                  <Label htmlFor="content-donts">Never Include</Label>
                  <Textarea 
                    id="content-donts" 
                    value={guidelines.content_donts}
                    onChange={(e) => setGuidelines(prev => ({ ...prev, content_donts: e.target.value }))}
                    placeholder="e.g., Crowded spaces, Generic stock photo feel, Overly promotional language..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements to avoid in your content</p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button 
                onClick={handleSaveGuidelines}
                disabled={savingGuidelines}
                className="shadow-lg" 
                size="lg"
              >
                {savingGuidelines ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Guidelines
                  </>
                )}
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}