import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useBrand } from "@/contexts/BrandContext";
import { ChevronRight, ChevronLeft, Upload, Image } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onComplete: () => void;
}

interface BrandData {
  brand_name: string;
  description: string;
  location: string;
  industry: string;
  website_url: string;
  primary_color: string;
  secondary_color: string;
  brand_tone: string;
  brand_voice: string;
  content_dos: string;
  content_donts: string;
  logo_url?: string;
}

export function OnboardingModal({ open, onComplete }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { createBrandProfile, updateProfile, uploadAvatar } = useBrand();

  const [formData, setFormData] = useState<BrandData>({
    brand_name: "",
    description: "",
    location: "",
    industry: "Hospitality & Travel",
    website_url: "",
    primary_color: "#000000",
    secondary_color: "#666666",
    brand_tone: "",
    brand_voice: "",
    content_dos: "",
    content_donts: "",
  });

  const steps = [
    {
      title: "Basic Information",
      subtitle: "Tell us about your property",
      fields: [
        {
          key: "brand_name" as keyof BrandData,
          label: "Hotel/Resort Name",
          type: "input",
          placeholder: "The Grand Palazzo Resort",
          required: true,
        },
        {
          key: "location" as keyof BrandData,
          label: "Location",
          type: "input",
          placeholder: "Santorini, Greece",
          required: true,
        },
        {
          key: "website_url" as keyof BrandData,
          label: "Website",
          type: "input",
          placeholder: "https://yourhotel.com",
          required: false,
        },
      ]
    },
    {
      title: "Brand Story",
      subtitle: "What makes your property unique?",
      fields: [
        {
          key: "description" as keyof BrandData,
          label: "Tell us about your property",
          type: "textarea",
          placeholder: "A luxury beachfront resort offering world-class amenities and breathtaking ocean views...",
          required: true,
        },
      ]
    },
    {
      title: "Brand Style",
      subtitle: "How does your brand communicate?",
      fields: [
        {
          key: "brand_tone" as keyof BrandData,
          label: "Brand Tone",
          type: "input",
          placeholder: "Luxurious, Warm, Sophisticated, Welcoming",
          required: false,
        },
        {
          key: "brand_voice" as keyof BrandData,
          label: "Brand Style",
          type: "textarea",
          placeholder: "We speak with confidence and warmth, using elegant language that makes every guest feel valued and special...",
          required: false,
        },
      ]
    },
    {
      title: "Content Guidelines",
      subtitle: "Help us understand your content preferences",
      fields: [
        {
          key: "content_dos" as keyof BrandData,
          label: "Always Include",
          type: "textarea",
          placeholder: "Ocean views, Local culture, Premium amenities, Personalized service...",
          required: false,
        },
        {
          key: "content_donts" as keyof BrandData,
          label: "Never Include",
          type: "textarea",
          placeholder: "Crowded spaces, Generic stock photo feel, Overly promotional language...",
          required: false,
        },
      ]
    },
    {
      title: "Hotel Profile Image",
      subtitle: "Upload a profile image for your hotel",
      fields: []
    }
  ];

  const handleInputChange = (key: keyof BrandData, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const preview = URL.createObjectURL(file);
      setLogoPreview(preview);
    }
  };

  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const canProceed = () => {
    const currentStepData = steps[currentStep];
    const requiredFields = currentStepData.fields.filter(field => field.required);
    
    return requiredFields.every(field => formData[field.key].trim() !== "");
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      console.log('🚀 Starting onboarding completion...');
      
      let logoUrl = "";
      
      if (logoFile) {
        console.log('📸 Uploading logo...');
        const uploadedUrl = await uploadAvatar(logoFile);
        if (uploadedUrl) {
          logoUrl = uploadedUrl;
          console.log('✅ Logo uploaded successfully');
        }
      }
      
      console.log('📝 Creating brand profile...');
      await createBrandProfile({
        ...formData,
        logo_url: logoUrl,
      });
      console.log('✅ Brand profile created');
      
      console.log('👤 Updating user profile...');
      await updateProfile({ onboarding_completed: true });
      console.log('✅ User profile updated');
      
      toast({
        title: "Welcome to Nino!",
        description: "Your brand profile has been created. You're ready to start generating luxury visuals.",
      });
      
      // Small delay to ensure state updates are processed
      setTimeout(() => {
        console.log('🎉 Calling onComplete callback...');
        onComplete();
      }, 500);
      
    } catch (error: any) {
      console.error('❌ Onboarding completion error:', error);
      toast({
        title: "Setup failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (field: any) => {
    const value = formData[field.key];
    
    if (field.type === "textarea") {
      return (
        <Textarea
          id={field.key}
          value={value}
          onChange={(e) => handleInputChange(field.key, e.target.value)}
          placeholder={field.placeholder}
          className="min-h-[100px]"
          required={field.required}
        />
      );
    }
    
    if (field.type === "color") {
      return (
        <div className="flex gap-3">
          <Input
            type="color"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            className="w-16 h-10 p-1 border rounded cursor-pointer"
          />
          <Input
            type="text"
            value={value}
            onChange={(e) => handleInputChange(field.key, e.target.value)}
            placeholder={field.placeholder}
            className="flex-1"
          />
        </div>
      );
    }
    
    return (
      <Input
        id={field.key}
        type={field.type === "url" ? "url" : "text"}
        value={value}
        onChange={(e) => handleInputChange(field.key, e.target.value)}
        placeholder={field.placeholder}
        required={field.required}
      />
    );
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center space-y-3">
          <DialogTitle className="text-xl font-semibold">
            {steps[currentStep].title}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            {steps[currentStep].subtitle}
          </p>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Progress indicator */}
          <div className="flex justify-center space-x-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index <= currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          {/* Form steps */}
          {currentStep >= 0 && steps[currentStep].fields.length > 0 && (
            <div className="space-y-4">
              {steps[currentStep].fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <Label htmlFor={field.key} className="text-sm font-medium">
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Image upload step */}
          {currentStep === steps.length - 1 && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              
              <div className="flex flex-col items-center space-y-4">
                {logoPreview ? (
                  <div className="relative">
                    <img
                      src={logoPreview}
                      alt="Hotel logo preview"
                      className="w-32 h-32 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerImageUpload}
                      className="mt-2 w-full"
                    >
                      Change Image
                    </Button>
                  </div>
                ) : (
                  <div
                    onClick={triggerImageUpload}
                    className="w-32 h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-muted-foreground/50 transition-colors"
                  >
                    <Upload className="w-8 h-8 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground text-center px-2">
                      Click to upload
                    </span>
                  </div>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  Upload your hotel logo or a representative image (optional)
                </p>
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex justify-between pt-4">
            <Button
              variant="ghost"
              onClick={() => setCurrentStep(currentStep - 1)}
              disabled={currentStep === 0}
              className="flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </Button>

            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                "Setting up..."
              ) : currentStep === steps.length - 1 ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
