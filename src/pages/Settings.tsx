import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

import { useBrand } from "@/contexts/BrandContext";
import { useChat } from "@/contexts/ChatContext";
import { Loader2, LogOut, Upload, User, Trash2 } from "lucide-react";

interface Team {
  id: string;
  name: string;
  description: string;
}

export default function Settings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  
  // Local state for form inputs to prevent buggy typing
  const [localBrandName, setLocalBrandName] = useState('');
  const [localLocation, setLocalLocation] = useState('');
  const [localWebsite, setLocalWebsite] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  
  // Local state for email/password updates
  const [localEmail, setLocalEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const { profile, brandProfile, updateProfile, updateBrandProfile, uploadAvatar } = useBrand();
  const { clearAllSessions } = useChat();

  // Initialize local state when profile/brandProfile loads
  useEffect(() => {
    if (brandProfile) {
      setLocalBrandName(brandProfile.brand_name || '');
      setLocalLocation(brandProfile.location || '');
      setLocalWebsite(brandProfile.website_url || '');
      setLocalDescription(brandProfile.description || '');
    }
  }, [brandProfile]);

  useEffect(() => {
    if (profile) {
      setLocalEmail(profile.email || '');
    }
  }, [profile]);

  const loadTeams = async () => {
    // Demo teams for UI purposes
    const demoTeams = [
      { id: '1', name: 'Demo Team', description: 'A sample team for demonstration' }
    ];
    setTeams(demoTeams);
    setSelectedTeam(demoTeams[0].id);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const preview = URL.createObjectURL(file);
      setAvatarPreview(preview);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;

    setIsLoading(true);
    
    try {
      let avatarUrl = profile.avatar_url;
      
      if (avatarFile) {
        const newAvatarUrl = await uploadAvatar(avatarFile);
        if (newAvatarUrl) {
          avatarUrl = newAvatarUrl;
        }
      }

      await updateProfile({
        avatar_url: avatarUrl,
      });

      // Save brand profile changes with local state values
      await updateBrandProfile({
        brand_name: localBrandName,
        location: localLocation,
        website_url: localWebsite,
        description: localDescription,
      });

      setAvatarFile(null);
      setAvatarPreview(null);

      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error("Failed to update profile: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateEmailPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Validate password match
      if (newPassword && newPassword !== confirmPassword) {
        toast.error("Passwords do not match");
        return;
      }

      // Update email if changed
      if (localEmail !== profile?.email) {
        const { error: emailError } = await supabase.auth.updateUser({
          email: localEmail
        });
        
        if (emailError) throw emailError;
        toast.success("Email update initiated. Please check your new email for confirmation.");
      }

      // Update password if provided
      if (newPassword) {
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        });
        
        if (passwordError) throw passwordError;
        toast.success("Password updated successfully!");
        setNewPassword('');
        setConfirmPassword('');
      }

      if (!newPassword && localEmail === profile?.email) {
        toast.info("No changes to save");
      }

    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="px-4 py-4 md:px-6 lg:px-8 xl:px-12 md:py-6 md:py-8 w-full max-w-none min-h-screen md:min-h-0">

      <div className="space-y-6 max-w-4xl">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="profile" className="text-xs md:text-sm">Profile</TabsTrigger>
            <TabsTrigger value="teams" className="text-xs md:text-sm">Teams</TabsTrigger>
            <TabsTrigger value="security" className="text-xs md:text-sm">Email/Password</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            {/* Profile Information */}
            <div>
              <h3 className="text-lg font-medium mb-2">Profile Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your personal information and brand details
              </p>
              <Card>
                <CardContent className="space-y-4 pt-6">
              <form onSubmit={handleSaveProfile} className="space-y-6">
                {/* Avatar Upload */}
                <div className="flex flex-col items-center space-y-4">
                  <div className="relative">
                    <Avatar className="w-20 h-20 border-2 border-border">
                      {avatarPreview ? (
                        <AvatarImage src={avatarPreview} alt="Profile" />
                      ) : profile?.avatar_url ? (
                        <AvatarImage src={profile.avatar_url} alt="Profile" />
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

                

                {/* Hotel/Brand Information */}
                <div className="space-y-2">
                  <Label htmlFor="brand-name">Hotel/Brand Name</Label>
                  <Input 
                    id="brand-name" 
                    value={localBrandName}
                    onChange={(e) => setLocalBrandName(e.target.value)}
                    placeholder="Enter your hotel or brand name"
                    className="mt-2" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input 
                    id="location" 
                    value={localLocation}
                    onChange={(e) => setLocalLocation(e.target.value)}
                    placeholder="Enter your hotel location"
                    className="mt-2" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website (Optional)</Label>
                  <Input 
                    id="website" 
                    type="text"
                    value={localWebsite}
                    onChange={(e) => setLocalWebsite(e.target.value)}
                    placeholder="https://yourhotel.com"
                    className="mt-2" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Brand Description</Label>
                  <Textarea 
                    id="description" 
                    value={localDescription}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    placeholder="Tell us about your hotel or brand..."
                    className="mt-2"
                    rows={4}
                  />
                </div>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
                </CardContent>
              </Card>
            </div>

            {/* Data Management */}
            <div>
              <h3 className="text-lg font-medium mb-2">Data Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Manage your chat history and data
              </p>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="space-y-1">
                        <h4 className="font-medium text-destructive">Clear All Chat Sessions</h4>
                        <p className="text-sm text-muted-foreground">
                          This will permanently delete all your chat sessions and messages. This action cannot be undone.
                        </p>
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={async () => {
                          if (window.confirm('Are you sure you want to delete all chat sessions? This action cannot be undone.')) {
                            try {
                              setIsLoading(true);
                              await clearAllSessions();
                              toast.success('All chat sessions cleared successfully');
                            } catch (error) {
                              console.error('Failed to clear sessions:', error);
                              toast.error('Failed to clear sessions. Please try again.');
                            } finally {
                              setIsLoading(false);
                            }
                          }
                        }}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Clear All Sessions
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>


          <TabsContent value="teams" className="space-y-6">
            {/* Team Management */}
            <div>
              <h3 className="text-lg font-medium mb-2">Team Management</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Collaborate with team members on your projects
              </p>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <User className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h4 className="text-lg font-medium mb-2">Feature Coming Soon</h4>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                      Team collaboration features are in development. Soon you'll be able to invite team members, assign roles, and work together on your projects.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            {/* Email/Password Management */}
            <div>
              <h3 className="text-lg font-medium mb-2">Email & Password</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Update your email address and password
              </p>
              <Card>
                <CardContent className="space-y-4 pt-6">
                  <form onSubmit={handleUpdateEmailPassword} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="email-update">Email Address</Label>
                      <Input 
                        id="email-update"
                        type="email" 
                        value={localEmail}
                        onChange={(e) => setLocalEmail(e.target.value)}
                        placeholder="Enter your email address"
                        className="mt-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password"
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (leave blank to keep current)"
                        className="mt-2"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password"
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="mt-2"
                        disabled={!newPassword}
                      />
                    </div>

                    <Button type="submit" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Update Email & Password
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}