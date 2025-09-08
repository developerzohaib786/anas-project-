import { useState } from "react";
import { Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/EmptyState";
import { useBrand } from "@/contexts/BrandContext";
import { toast } from "sonner";

export default function BrandKit() {
  const [savingProfile, setSavingProfile] = useState(false);
  const { brandProfile, updateBrandProfile, loading } = useBrand();

  const handleSaveProfile = async () => {
    if (!brandProfile) return;

    setSavingProfile(true);
    try {
      toast.success("Brand assets saved successfully");
    } catch (error) {
      console.error('Error saving brand assets:', error);
      toast.error("Failed to save brand assets");
    } finally {
      setSavingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-8 w-full max-w-none min-h-screen md:min-h-0">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!brandProfile) {
    return (
      <div className="px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-6 md:py-8 w-full max-w-none min-h-screen md:min-h-0">
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
    <div className="px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-6 md:py-8 w-full max-w-none min-h-screen md:min-h-0">

      <div className="space-y-6 max-w-4xl">
        {/* Brand Story */}
        <div>
          <h3 className="text-lg font-medium mb-2">Brand Story</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Tell us about your brand and what makes it unique
          </p>
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <Label htmlFor="brand-description">Brand Description</Label>
              <Textarea 
                id="brand-description" 
                value={brandProfile?.description || ''}
                onChange={(e) => updateBrandProfile({ description: e.target.value })}
                placeholder="A luxury beachfront resort offering world-class amenities and breathtaking ocean views..."
                className="mt-2 min-h-[100px]"
              />
              <p className="text-xs text-muted-foreground mt-1">Tell us about your property and what makes it special</p>
            </div>
          </CardContent>
        </Card>
        </div>

        {/* Brand Style */}
        <div>
          <h3 className="text-lg font-medium mb-2">Brand Style</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Define how your brand should communicate and what personality it should convey
          </p>
          <Card>
            <CardContent className="space-y-4 pt-6">
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
        </div>

        {/* Content Guidelines */}
        <div>
          <h3 className="text-lg font-medium mb-2">Content Guidelines</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Specific guidelines for what should and shouldn't be included in your content
          </p>
          <Card>
            <CardContent className="space-y-4 pt-6">
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
                    Save Brand Assets
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}