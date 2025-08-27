import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, User } from "lucide-react";

interface SimpleOnboardingProps {
  onComplete: () => void;
}

export const SimpleOnboarding = ({ onComplete }: SimpleOnboardingProps) => {
  const { user } = useAuth();
  const [brandName, setBrandName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarFile || !user) return null;

    const fileExt = avatarFile.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('avatars')
      .upload(fileName, avatarFile, { upsert: true });

    if (error) {
      console.error('Error uploading avatar:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!brandName.trim()) {
      toast.error("Please enter a brand name");
      return;
    }

    setLoading(true);
    try {
      let avatarUrl = null;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar();
        if (!avatarUrl) {
          toast.error("Failed to upload avatar");
          setLoading(false);
          return;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          brand_name: brandName.trim(),
          avatar_url: avatarUrl,
          onboarding_completed: true,
          onboarding_step: 1
        })
        .eq('id', user?.id);

      if (error) {
        toast.error("Failed to save profile");
        console.error(error);
        return;
      }

      toast.success("Profile completed!");
      onComplete();
    } catch (error) {
      toast.error("An error occurred");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Welcome to Nino!</CardTitle>
          <p className="text-muted-foreground">Let's set up your profile</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Upload */}
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <Avatar className="w-20 h-20 border-2 border-border">
                  {avatarPreview ? (
                    <AvatarImage src={avatarPreview} alt="Profile" />
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
              <p className="text-sm text-muted-foreground">Upload a profile picture</p>
            </div>

            {/* Brand Name */}
            <div className="space-y-2">
              <Label htmlFor="brand-name">Brand Name</Label>
              <Input
                id="brand-name"
                type="text"
                placeholder="Enter your brand name"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || !brandName.trim()}
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};