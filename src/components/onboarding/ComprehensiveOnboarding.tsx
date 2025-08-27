import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Upload, User, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { useBrand } from "@/contexts/BrandContext";

interface ComprehensiveOnboardingProps {
  onComplete: () => void;
}

interface OnboardingData {
  // Step 1: Basic Info
  brandName: string;
  avatarFile: File | null;
  avatarPreview: string | null;
  
  // Step 2: Brand Details
  location: string;
  description: string;
  
  // Step 3: Brand Voice
  brandTone: string;
  additionalBrandNotes: string;
  
  // Step 4: Content Guidelines
  contentDos: string;
  contentDonts: string;
}

export const ComprehensiveOnboarding = ({ onComplete }: ComprehensiveOnboardingProps) => {
  const { updateProfile, uploadAvatar, createBrandProfile } = useBrand();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<OnboardingData>({
    brandName: "",
    avatarFile: null,
    avatarPreview: null,
    location: "",
    description: "",
    brandTone: "",
    additionalBrandNotes: "",
    contentDos: "",
    contentDonts: ""
  });

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setData(prev => ({ ...prev, avatarFile: file }));
      const preview = URL.createObjectURL(file);
      setData(prev => ({ ...prev, avatarPreview: preview }));
    }
  };

  const canProceedToNext = () => {
    switch (currentStep) {
      case 1:
        return data.brandName.trim().length > 0;
      case 2:
        return data.location.trim().length > 0 && data.description.trim().length > 0;
      case 3:
        return data.brandTone.trim().length > 0;
      case 4:
        return data.contentDos.trim().length > 0 && data.contentDonts.trim().length > 0;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNext() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setLoading(true);
    try {
      let avatarUrl = null;
      
      // Upload avatar if provided
      if (data.avatarFile) {
        avatarUrl = await uploadAvatar(data.avatarFile);
        if (!avatarUrl) {
          toast.error("Failed to upload avatar");
          setLoading(false);
          return;
        }
      }

      // Update user profile
      await updateProfile({
        avatar_url: avatarUrl,
        onboarding_completed: true,
        onboarding_step: 4
      });

      // Create brand profile
      await createBrandProfile({
        brand_name: data.brandName.trim(),
        location: data.location.trim(),
        description: data.description.trim(),
        industry: 'Hospitality & Travel',
        brand_tone: data.brandTone.trim(),
        brand_voice: data.additionalBrandNotes.trim(),
        content_dos: data.contentDos.trim(),
        content_donts: data.contentDonts.trim()
      });

      toast.success("Welcome! Your profile is complete.");
      onComplete();
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error("An error occurred during setup");
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 4) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="px-6 py-6">
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <CardContent className="space-y-6">
          {/* Step 1: Basic Info */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Basic Information</h3>
                <p className="text-sm text-muted-foreground">Upload your brand logo and enter your brand name</p>
              </div>
              
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-20 h-20 border-2 border-border">
                    {data.avatarPreview ? (
                      <AvatarImage src={data.avatarPreview} alt="Profile" />
                    ) : (
                      <AvatarFallback>
                        <User className="w-8 h-8" />
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <Label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                  </Label>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="sr-only"
                  />
                </div>
                <p className="text-sm text-muted-foreground">Upload your brand logo</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="brand-name">Brand Name</Label>
                <Input
                  id="brand-name"
                  type="text"
                  placeholder="Enter your brand name"
                  value={data.brandName}
                  onChange={(e) => setData(prev => ({ ...prev, brandName: e.target.value }))}
                  required
                />
              </div>
            </div>
          )}

          {/* Step 2: Brand Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Brand Details</h3>
                <p className="text-sm text-muted-foreground">Tell us about your location and what makes you special</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    type="text"
                    placeholder="e.g., Waikiki Beach, Honolulu, Hawaii"
                    value={data.location}
                    onChange={(e) => setData(prev => ({ ...prev, location: e.target.value }))}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your brand and what makes it unique..."
                    value={data.description}
                    onChange={(e) => setData(prev => ({ ...prev, description: e.target.value }))}
                    className="min-h-[100px]"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Brand Voice */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Brand Voice</h3>
                <p className="text-sm text-muted-foreground">Define your brand's personality and communication style</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="brand-tone">Brand Tone</Label>
                  <Input
                    id="brand-tone"
                    type="text"
                    placeholder="e.g., Luxurious, Friendly, Professional, Sophisticated"
                    value={data.brandTone}
                    onChange={(e) => setData(prev => ({ ...prev, brandTone: e.target.value }))}
                    required
                  />
                  <p className="text-xs text-muted-foreground">Describe the personality your brand should convey</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="additional-notes">Additional Brand Notes</Label>
                  <Textarea
                    id="additional-notes"
                    placeholder="Any additional notes about your brand voice, style, or communication preferences..."
                    value={data.additionalBrandNotes}
                    onChange={(e) => setData(prev => ({ ...prev, additionalBrandNotes: e.target.value }))}
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Content Guidelines */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-lg font-medium mb-2">Content Guidelines</h3>
                <p className="text-sm text-muted-foreground">Define what should and shouldn't be in your content</p>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="content-dos">Always Include</Label>
                  <Textarea
                    id="content-dos"
                    placeholder="e.g., Ocean views, Local culture, Premium amenities, Personalized service..."
                    value={data.contentDos}
                    onChange={(e) => setData(prev => ({ ...prev, contentDos: e.target.value }))}
                    className="min-h-[80px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Elements that should always be highlighted</p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="content-donts">Never Include</Label>
                  <Textarea
                    id="content-donts"
                    placeholder="e.g., Crowded spaces, Generic stock photo feel, Overly promotional language..."
                    value={data.contentDonts}
                    onChange={(e) => setData(prev => ({ ...prev, contentDonts: e.target.value }))}
                    className="min-h-[80px]"
                    required
                  />
                  <p className="text-xs text-muted-foreground">Elements to avoid in your content</p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            
            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={loading || !canProceedToNext()}
                className="flex items-center gap-2"
              >
                {loading ? "Setting up..." : "Complete Setup"}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};