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
import { InputModal } from "@/components/ui/input-modal";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { supabase } from "@/integrations/supabase/client";
import { useBrand } from "@/contexts/BrandContext";
import { toast } from "sonner";

interface BrandAsset {
  id: string;
  storage_path: string;
  file_name: string;
  tags: string[];
  asset_type: string;
  url?: string;
  signedUrl?: string;
}

export default function BrandKit() {
  const [activeTab, setActiveTab] = useState("photos");
  const [assets, setAssets] = useState<BrandAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingAssets, setUploadingAssets] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [tagModal, setTagModal] = useState<{ open: boolean; assetId?: string }>({ open: false });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; asset?: BrandAsset }>({ open: false });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { brandProfile, updateBrandProfile } = useBrand();

  // Load brand assets
  useEffect(() => {
    const loadBrandAssets = async () => {
      if (!brandProfile) {
        setLoading(false);
        return;
      }
      
      try {
        // Load brand assets
        const { data: brandAssets, error: assetsError } = await supabase
          .from('brand_assets')
          .select('*')
          .eq('brand_profile_id', brandProfile.id)
          .order('created_at', { ascending: false });

        if (assetsError) {
          console.error('Error fetching assets:', assetsError);
        } else {
          // Get signed URLs for assets
          const assetsWithUrls = await Promise.all(
            (brandAssets || []).map(async (asset) => {
              const { data: pub } = supabase.storage
                .from('brand-assets')
                .getPublicUrl(asset.storage_path);
              
              // Also prepare a signed URL fallback (1 hour)
              const { data: signed } = await supabase.storage
                .from('brand-assets')
                .createSignedUrl(asset.storage_path, 3600);
              
              return {
                ...asset,
                url: pub.publicUrl,
                signedUrl: signed?.signedUrl
              } as BrandAsset;
            })
          );
          setAssets(assetsWithUrls);
        }
      } catch (error) {
        console.error('Error loading brand assets:', error);
        toast.error("Failed to load brand assets");
      } finally {
        setLoading(false);
      }
    };

    loadBrandAssets();
  }, [brandProfile]);

  const handleAssetUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || !brandProfile) return;

    setUploadingAssets(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        // Upload to storage
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const storagePath = `${brandProfile.user_id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('brand-assets')
          .upload(storagePath, file);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw uploadError;
        }

        // Save metadata to database
        const { data: assetData, error: dbError } = await supabase
          .from('brand_assets')
          .insert({
            brand_profile_id: brandProfile.id,
            user_id: brandProfile.user_id,
            storage_path: storagePath,
            file_name: file.name,
            file_size: file.size,
            content_type: file.type,
            asset_type: 'photo',
            tags: []
          })
          .select()
          .single();

        if (dbError) {
          console.error('Database insert error:', dbError);
          throw dbError;
        }

        // Get public and signed URLs
        const { data: pub } = supabase.storage
          .from('brand-assets')
          .getPublicUrl(storagePath);
        const { data: signed } = await supabase.storage
          .from('brand-assets')
          .createSignedUrl(storagePath, 3600);

        return {
          ...assetData,
          url: pub.publicUrl,
          signedUrl: signed?.signedUrl
        } as BrandAsset;
      });

      const newAssets = await Promise.all(uploadPromises);
      setAssets(prev => [...newAssets, ...prev]);
      toast.success(`${newAssets.length} asset(s) uploaded successfully`);
    } catch (error) {
      console.error('Error uploading assets:', error);
      toast.error("Failed to upload assets");
    } finally {
      setUploadingAssets(false);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAsset = async (asset: BrandAsset) => {
    if (!brandProfile) return;

    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('brand-assets')
        .remove([asset.storage_path]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('brand_assets')
        .delete()
        .eq('id', asset.id);

      if (dbError) {
        console.error('Database delete error:', dbError);
        throw dbError;
      }

      setAssets(prev => prev.filter(a => a.id !== asset.id));
      toast.success("Asset deleted successfully");
    } catch (error) {
      console.error('Error deleting asset:', error);
      toast.error("Failed to delete asset");
    }
  };

  const handleAddTag = async (assetId: string, tag: string) => {
    if (!tag.trim()) return;

    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const newTags = [...asset.tags, tag.trim()];

      const { error } = await supabase
        .from('brand_assets')
        .update({ tags: newTags })
        .eq('id', assetId);

      if (error) {
        console.error('Error adding tag:', error);
        throw error;
      }

      setAssets(prev => prev.map(a => 
        a.id === assetId ? { ...a, tags: newTags } : a
      ));
      toast.success("Tag added successfully");
    } catch (error) {
      console.error('Error adding tag:', error);
      toast.error("Failed to add tag");
    }
  };

  const handleRemoveTag = async (assetId: string, tagIndex: number) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const newTags = asset.tags.filter((_, index) => index !== tagIndex);

      const { error } = await supabase
        .from('brand_assets')
        .update({ tags: newTags })
        .eq('id', assetId);

      if (error) {
        console.error('Error removing tag:', error);
        throw error;
      }

      setAssets(prev => prev.map(a => 
        a.id === assetId ? { ...a, tags: newTags } : a
      ));
      toast.success("Tag removed successfully");
    } catch (error) {
      console.error('Error removing tag:', error);
      toast.error("Failed to remove tag");
    }
  };

  const handleSaveProfile = async () => {
    if (!brandProfile) return;

    setSavingProfile(true);
    try {
      // Profile is already being updated through the form inputs via updateBrandProfile
      toast.success("Brand profile saved successfully");
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error("Failed to save brand profile");
    } finally {
      setSavingProfile(false);
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

  if (!brandProfile) {
    return (
      <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
        <EmptyState
          icon={Edit3}
          title="Complete your brand profile"
          description="Please complete the onboarding process to access your brand kit."
          actionLabel="Go to Settings"
          onAction={() => window.location.href = '/settings'}
        />
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
          <TabsTrigger value="photos">Assets</TabsTrigger>
          <TabsTrigger value="guidelines">Guidelines</TabsTrigger>
        </TabsList>

        <TabsContent value="photos" className="mt-6">
          {/* Header - always show upload button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-medium text-foreground">Brand Assets</h2>
              <p className="text-muted-foreground">Upload photos to help AI learn your brand's visual identity</p>
            </div>
            <Button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAssets}
              className="shadow-lg"
              size="lg"
            >
              {uploadingAssets ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Assets
                </>
              )}
            </Button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleAssetUpload}
            className="hidden"
          />

          {/* Assets Grid */}
          {assets.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {assets.map((asset) => (
                <div
                  key={asset.id}
                  className="group relative bg-card rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 border"
                >
                  <div className="relative overflow-hidden aspect-square">
                    <img
                      src={asset.url}
                      alt={asset.file_name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                      onError={(e) => {
                        if (asset.signedUrl && (e.currentTarget as HTMLImageElement).src !== asset.signedUrl) {
                          (e.currentTarget as HTMLImageElement).src = asset.signedUrl;
                        }
                      }}
                    />
                    
                    {/* Delete button */}
                    <button
                      onClick={() => setDeleteModal({ open: true, asset })}
                      className="absolute top-3 right-3 w-8 h-8 bg-background/95 hover:bg-background rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-sm shadow-lg hover:scale-110"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </button>

                    {/* Add tag button */}
                    <button
                      onClick={() => setTagModal({ open: true, assetId: asset.id })}
                      className="absolute bottom-3 right-3 w-8 h-8 bg-primary hover:bg-primary/90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-lg hover:scale-110"
                    >
                      <Plus className="h-4 w-4 text-primary-foreground" />
                    </button>
                    
                    {/* Tags overlay */}
                    {asset.tags.length > 0 && (
                      <div className="absolute bottom-3 left-3 flex flex-wrap gap-1.5 max-w-[calc(100%-4rem)] opacity-0 group-hover:opacity-100 transition-all duration-300">
                        {asset.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => handleRemoveTag(asset.id, index)}
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

          {/* Empty state for assets */}
          {assets.length === 0 && (
            <EmptyState
              icon={Image}
              title="No brand assets yet"
              description="Upload your brand photos to help AI understand your visual identity and create consistent, high-quality content."
              actionLabel="Upload Your First Assets"
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
                    value={brandProfile?.brand_tone || ''}
                    onChange={(e) => updateBrandProfile({ brand_tone: e.target.value })}
                    placeholder="e.g., Luxurious, Friendly, Professional, Sophisticated" 
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Describe the personality and feeling your brand should convey</p>
                </div>
                <div>
                  <Label htmlFor="brand-voice">Brand Voice</Label>
                  <Textarea 
                    id="brand-voice" 
                    value={brandProfile?.brand_voice || ''}
                    onChange={(e) => updateBrandProfile({ brand_voice: e.target.value })}
                    placeholder="e.g., We speak with confidence and warmth, using inclusive language that makes every guest feel valued..."
                    className="mt-2 min-h-[100px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">How does your brand communicate? What words and phrases do you use?</p>
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
                    value={brandProfile?.content_dos || ''}
                    onChange={(e) => updateBrandProfile({ content_dos: e.target.value })}
                    placeholder="e.g., Ocean views, Local culture, Premium amenities, Personalized service..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements that should always be highlighted in your content</p>
                </div>
                <div>
                  <Label htmlFor="content-donts">Never Include</Label>
                  <Textarea 
                    id="content-donts" 
                    value={brandProfile?.content_donts || ''}
                    onChange={(e) => updateBrandProfile({ content_donts: e.target.value })}
                    placeholder="e.g., Crowded spaces, Generic stock photo feel, Overly promotional language..."
                    className="mt-2 min-h-[80px]"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Elements to avoid in your content</p>
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="w-full"
                  >
                    {savingProfile ? (
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
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tag Modal */}
      <InputModal
        open={tagModal.open}
        onOpenChange={(open) => setTagModal({ open })}
        title="Add Tag"
        description="Add a descriptive tag to help organize your brand assets"
        placeholder="Enter tag name..."
        onConfirm={(tag) => {
          if (tagModal.assetId) {
            handleAddTag(tagModal.assetId, tag);
          }
        }}
        confirmText="Add Tag"
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        open={deleteModal.open}
        onOpenChange={(open) => setDeleteModal({ open })}
        title="Delete Asset"
        description="Are you sure you want to delete this asset? This action cannot be undone."
        onConfirm={() => {
          if (deleteModal.asset) {
            handleDeleteAsset(deleteModal.asset);
          }
        }}
        confirmText="Delete"
        variant="destructive"
      />
    </div>
  );
}