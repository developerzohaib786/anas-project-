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
import { ImageUploadSection } from "./ImageUploadSection";
import { supabase } from "@/integrations/supabase/client";
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

  // Training Steps
  lifestyleImages: File[];
  exteriorImages: File[];
  lobbyImages: File[];
  restaurantImages: File[];
  roomImages: File[];
  poolImages: File[];
  
  // Custom location choice
  wantsCustomLocations: boolean | null;
  customLocation1Name: string;
  customLocation1Images: File[];
  customLocation2Name: string;
  customLocation2Images: File[];
}

export const ComprehensiveOnboarding = ({ onComplete }: ComprehensiveOnboardingProps) => {
  const { updateProfile, uploadAvatar, createBrandProfile, brandProfile } = useBrand();
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
    contentDonts: "",
    lifestyleImages: [],
    exteriorImages: [],
    lobbyImages: [],
    restaurantImages: [],
    roomImages: [],
    poolImages: [],
    wantsCustomLocations: null,
    customLocation1Name: "",
    customLocation1Images: [],
    customLocation2Name: "",
    customLocation2Images: []
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
      case 5: // Training intro
        return true;
      case 6: // Lifestyle images
        return true; // Optional
      case 7: // Exterior images
        return true; // Optional
      case 8: // Lobby images
        return true; // Optional
      case 9: // Restaurant images
        return true; // Optional
      case 10: // Room images
        return true; // Optional
      case 11: // Pool images
        return true; // Optional
      case 12: // Custom location choice
        return data.wantsCustomLocations !== null;
      case 13: // Custom location 1
        return true; // Optional - user can skip entirely
      case 14: // Custom location 2
        return true; // Optional - user can skip entirely
      case 15: // Welcome completion
        return true;
      default:
        return false;
    }
  };

  // Upload helpers for training assets
  const uploadCategory = async (categoryKey: string, displayName: string, files: File[]) => {
    if (!files?.length || !brandProfile) return;
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    const user = userData?.user;
    if (!user) throw new Error("Not authenticated");

    for (const [idx, file] of files.entries()) {
      const ext = file.name.split('.').pop();
      const safeCategory = categoryKey.toLowerCase().replace(/\s+/g, '-');
      const path = `${user.id}/${brandProfile.id}/${safeCategory}/${Date.now()}-${idx}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('brand-assets')
        .upload(path, file, { upsert: false });
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      const { error: insertError } = await supabase
        .from('brand_assets')
        .insert({
          storage_path: path,
          file_name: file.name,
          content_type: file.type,
          file_size: file.size,
          asset_type: 'photo',
          tags: [safeCategory, displayName],
          user_id: user.id,
          brand_profile_id: brandProfile.id
        });
      if (insertError) {
        console.error('Insert asset error:', insertError);
        throw insertError;
      }
    }
  };

  const uploadAllTrainingImages = async () => {
    await uploadCategory('lifestyle', 'Lifestyle References', data.lifestyleImages);
    await uploadCategory('exterior', 'Exterior Spaces', data.exteriorImages);
    await uploadCategory('lobby', 'Lobby & Gathering Spaces', data.lobbyImages);
    await uploadCategory('restaurant', 'Restaurants/Dining', data.restaurantImages);
    await uploadCategory('rooms', 'Rooms', data.roomImages);
    await uploadCategory('pools', 'Pools', data.poolImages);
    if (data.customLocation1Name) {
      await uploadCategory(data.customLocation1Name, data.customLocation1Name, data.customLocation1Images);
    }
    if (data.customLocation2Name) {
      await uploadCategory(data.customLocation2Name, data.customLocation2Name, data.customLocation2Images);
    }
  };

  const startTraining = async () => {
    if (!brandProfile?.id) return;
    const { data, error } = await supabase.functions.invoke('training-orchestrator', {
      body: { brand_profile_id: brandProfile.id }
    });
    if (error) {
      console.error('Start training error:', error);
      throw error;
    }
    
    toast.success(`Training started! Processing ${data.total_assets} images across ${data.categories.length} categories.`);
  };

  const handleNext = () => {
    if (canProceedToNext()) {
      // Skip custom location steps if user doesn't want them
      if (currentStep === 12 && data.wantsCustomLocations === false) {
        setCurrentStep(15); // Skip to completion
      } else if (currentStep < 15) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (currentStep === 15) {
      // Move to dashboard immediately, let training run in background
      onComplete();
      
      // Run training in background without blocking UI
      setTimeout(async () => {
        try {
          await uploadAllTrainingImages();
          await startTraining();
          toast.success("Training completed! Your assistant is now ready.");
        } catch (error) {
          console.error('Background training error:', error);
          toast.warning("Training couldn't be completed, but you can restart it from the Brand Kit page.");
        }
      }, 100);
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = null;
      
      // Upload avatar if provided
      if (data.avatarFile) {
        try {
          avatarUrl = await uploadAvatar(data.avatarFile);
        } catch (error) {
          console.error('Avatar upload error:', error);
          toast.warning("Avatar upload failed, but continuing with onboarding.");
        }
      }

      // Update user profile
      try {
        await updateProfile({
          avatar_url: avatarUrl,
          onboarding_completed: true,
          onboarding_step: 14
        });
      } catch (error) {
        console.error('Profile update error:', error);
        toast.warning("Profile update failed, but continuing with onboarding.");
      }

      // Create brand profile - handle duplicate gracefully
      try {
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
      } catch (error) {
        console.error('Brand profile creation error:', error);
        // If it's a duplicate key error, that's fine - user already has a profile
        if (error?.code === '23505') {
          toast.success("Brand profile already exists. Moving to training setup.");
        } else {
          toast.warning("Brand profile creation failed, but continuing with onboarding.");
        }
      }

      setCurrentStep(5); // Move to training flow
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.warning("Some setup steps failed, but you can complete them later from your dashboard.");
      // Still proceed to training flow even if there were errors
      setCurrentStep(5);
    } finally {
      setLoading(false);
    }
  };

  const progressPercentage = (currentStep / 15) * 100;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Progress Bar */}
        <div className="px-6 py-6 flex-shrink-0">
          <Progress value={progressPercentage} className="w-full" />
        </div>

        <CardContent className="space-y-6 overflow-y-auto flex-1 px-6">
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

          {/* Step 5: Training Introduction */}
          {currentStep === 5 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-xl font-semibold mb-3">Train your creative agent</h3>
                <p className="text-muted-foreground mb-4">
                  Your creative assistant gets better and better the more information you train it on. 
                  We are going to upload 5-20 images of each location at your hotel.
                </p>
                <p className="text-sm text-muted-foreground">
                  This will take 15-20 minutes and is incredibly important for training your model.
                </p>
              </div>
            </div>
          )}

          {/* Step 6: Lifestyle References */}
          {currentStep === 6 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Any existing or lifestyle references you like"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.lifestyleImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, lifestyleImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 7: Exterior Spaces */}
          {currentStep === 7 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Exterior Spaces"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.exteriorImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, exteriorImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 8: Lobby & Gathering Spaces */}
          {currentStep === 8 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Lobby & Gathering Spaces"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.lobbyImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, lobbyImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 9: Restaurants/Dining + food images */}
          {currentStep === 9 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Restaurants/Dining + food images"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.restaurantImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, restaurantImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 10: Rooms */}
          {currentStep === 10 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Rooms"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.roomImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, roomImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 11: Pools */}
          {currentStep === 11 && (
            <div className="space-y-6">
              <ImageUploadSection
                title="Pools"
                description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                images={data.poolImages}
                onImagesChange={(images) => setData(prev => ({ ...prev, poolImages: images }))}
                maxImages={20}
              />
            </div>
          )}

          {/* Step 12: Custom Location Choice */}
          {currentStep === 12 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-lg font-medium mb-2">Custom Locations</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  Do you want to add any custom location categories beyond the standard hotel areas?
                </p>
                <div className="flex gap-4 justify-center">
                  <Button
                    variant={data.wantsCustomLocations === true ? "default" : "outline"}
                    onClick={() => setData(prev => ({ ...prev, wantsCustomLocations: true }))}
                    className="flex-1 max-w-32"
                  >
                    Yes
                  </Button>
                  <Button
                    variant={data.wantsCustomLocations === false ? "default" : "outline"}
                    onClick={() => setData(prev => ({ ...prev, wantsCustomLocations: false }))}
                    className="flex-1 max-w-32"
                  >
                    No
                  </Button>
                </div>
                {data.wantsCustomLocations === false && (
                  <p className="text-xs text-muted-foreground mt-4">
                    You can always add custom categories later from your Brand Kit page.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Step 13: Custom Location 1 */}
          {currentStep === 13 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-location-1">Custom location (optional)</Label>
                <Input
                  id="custom-location-1"
                  type="text"
                  placeholder="e.g., Beach, Mountain, Chalet, Kids room - or leave blank to skip"
                  value={data.customLocation1Name}
                  onChange={(e) => setData(prev => ({ ...prev, customLocation1Name: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Leave blank if you don't have additional categories</p>
              </div>
              {data.customLocation1Name && (
                <ImageUploadSection
                  title={data.customLocation1Name}
                  description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                  images={data.customLocation1Images}
                  onImagesChange={(images) => setData(prev => ({ ...prev, customLocation1Images: images }))}
                  maxImages={20}
                />
              )}
            </div>
          )}

          {/* Step 14: Custom Location 2 */}
          {currentStep === 14 && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="custom-location-2">Second custom location (optional)</Label>
                <Input
                  id="custom-location-2"
                  type="text"
                  placeholder="e.g., Private residence suite, Hottub, Fire pits - or leave blank to skip"
                  value={data.customLocation2Name}
                  onChange={(e) => setData(prev => ({ ...prev, customLocation2Name: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">Leave blank if you don't have additional categories</p>
              </div>
              {data.customLocation2Name && (
                <ImageUploadSection
                  title={data.customLocation2Name}
                  description="Please upload 5-20 images of each location at your hotel, if you do not have any skip"
                  images={data.customLocation2Images}
                  onImagesChange={(images) => setData(prev => ({ ...prev, customLocation2Images: images }))}
                  maxImages={20}
                />
              )}
            </div>
          )}

          {/* Step 15: Welcome to Dashboard */}
          {currentStep === 15 && (
            <div className="space-y-6 text-center">
              <div>
                <h3 className="text-xl font-semibold mb-3">Welcome to your dashboard</h3>
                <p className="text-muted-foreground">
                  Your assistant is being trained now and will be ready in 5-10 minutes
                </p>
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
            ) : currentStep === 4 ? (
              <Button
                onClick={handleComplete}
                disabled={loading || !canProceedToNext()}
                className="flex items-center gap-2"
              >
                {loading ? "Setting up..." : "Start Training"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : currentStep < 15 ? (
              <Button
                onClick={handleNext}
                disabled={!canProceedToNext()}
                className="flex items-center gap-2"
              >
                {currentStep === 5 ? "Start Upload Process" : "Next"}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                className="flex items-center gap-2"
                disabled={loading}
              >
                {loading ? "Finalizing..." : "Go to Dashboard"}
                <Check className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};