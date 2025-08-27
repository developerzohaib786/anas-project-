import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TeamInvitations } from "@/components/TeamInvitations";
// Auth removed - Settings page disabled
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSettings } from "@/contexts/SettingsContext";
import { Loader2, LogOut } from "lucide-react";

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface Team {
  id: string;
  name: string;
  description: string;
}

export default function Settings() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const user = null; // Auth removed
  const signOut = () => {}; // Auth removed
  const { toast } = useToast();
  const { profile, brandSettings, updateProfile, updateBrandSettings } = useSettings();

  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      // Load user profile
      const { data: profileData } = await supabase
        .from('profiles')
        .select('first_name, last_name, email')
        .eq('id', user.id)
        .single();

      if (profileData) {
        updateProfile(profileData);
      }

      // Load user's teams
      const { data: teamsData } = await supabase
        .from('team_memberships')
        .select(`
          teams (
            id,
            name,
            description
          )
        `)
        .eq('user_id', user.id)
        .eq('invitation_accepted', true);

      const userTeams = teamsData?.map(tm => tm.teams).filter(Boolean) || [];
      setTeams(userTeams);
      
      if (userTeams.length > 0 && !selectedTeam) {
        setSelectedTeam(userTeams[0].id);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="px-4 md:px-6 lg:px-8 xl:px-12 py-8 w-full max-w-none">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ letterSpacing: '-0.02em' }}>
            Settings
          </h1>
          <p className="text-gray-600">
            Manage your account settings and team preferences
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={signOut}
          className="flex items-center gap-2 rounded-full"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 max-w-lg">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Update your personal information and contact details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="first-name">First Name</Label>
                    <Input 
                      id="first-name" 
                      value={profile.first_name}
                      onChange={(e) => updateProfile({ first_name: e.target.value })}
                      className="mt-2 rounded-full" 
                    />
                  </div>
                  <div>
                    <Label htmlFor="last-name">Last Name</Label>
                    <Input 
                      id="last-name" 
                      value={profile.last_name}
                      onChange={(e) => updateProfile({ last_name: e.target.value })}
                      className="mt-2 rounded-full" 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email Address</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="mt-2 rounded-full bg-muted" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>
                <Button type="submit" disabled={isLoading} className="rounded-full">
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="brand" className="space-y-6">
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
                <Input 
                  id="brand-name" 
                  value={brandSettings.name}
                  onChange={(e) => updateBrandSettings({ name: e.target.value })}
                  placeholder="Your Hotel/Resort Name" 
                  className="mt-2 rounded-full" 
                />
                <p className="text-xs text-gray-500 mt-1">The official name of your property</p>
              </div>
              <div>
                <Label htmlFor="brand-description">Description</Label>
                <Textarea 
                  id="brand-description" 
                  value={brandSettings.description}
                  onChange={(e) => updateBrandSettings({ description: e.target.value })}
                  placeholder="Brief description of your brand and what makes it unique..."
                  className="mt-2 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">A short overview of your property and its unique features</p>
              </div>
              <div>
                <Label htmlFor="brand-location">Location</Label>
                <Input 
                  id="brand-location" 
                  value={brandSettings.location}
                  onChange={(e) => updateBrandSettings({ location: e.target.value })}
                  placeholder="e.g., Waikiki Beach, Honolulu, Hawaii" 
                  className="mt-2 rounded-full" 
                />
                <p className="text-xs text-gray-500 mt-1">Primary location of your property</p>
              </div>
              <div>
                <Label htmlFor="brand-industry">Industry</Label>
                <Input 
                  id="brand-industry" 
                  value={brandSettings.industry} 
                  disabled 
                  className="mt-2 rounded-full bg-muted" 
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Brand Voice & Tone</CardTitle>
              <CardDescription>
                How should your brand communicate and what personality should it convey?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brand-tone">Brand Tone</Label>
                <Input 
                  id="brand-tone" 
                  value={brandSettings.tone}
                  onChange={(e) => updateBrandSettings({ tone: e.target.value })}
                  placeholder="e.g., Luxurious, Friendly, Professional, Sophisticated" 
                  className="mt-2 rounded-full"
                />
                <p className="text-xs text-gray-500 mt-1">Describe the personality and feeling your brand should convey</p>
              </div>
              <div>
                <Label htmlFor="brand-voice">Brand Voice</Label>
                <Textarea 
                  id="brand-voice" 
                  value={brandSettings.voice}
                  onChange={(e) => updateBrandSettings({ voice: e.target.value })}
                  placeholder="e.g., We speak with confidence and warmth, using inclusive language that makes every guest feel valued..."
                  className="mt-2 min-h-[100px]"
                />
                <p className="text-xs text-gray-500 mt-1">How does your brand communicate? What words and phrases do you use?</p>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button className="rounded-full">
              Save Brand Settings
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Team Selection</CardTitle>
              <CardDescription>
                Select a team to manage members and invitations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teams.length > 0 ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team) => (
                      <button
                        key={team.id}
                        onClick={() => setSelectedTeam(team.id)}
                        className={`p-4 border rounded-lg text-left transition-all ${
                          selectedTeam === team.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                      >
                        <h3 className="font-medium">{team.name}</h3>
                        {team.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {team.description}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">No teams found. Complete onboarding to create your first team.</p>
              )}
            </CardContent>
          </Card>

          {selectedTeam && (
            <TeamInvitations teamId={selectedTeam} />
          )}
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>
                Manage your account security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h3 className="font-medium mb-2">Password Management</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  To change your password, you'll need to reset it via email.
                </p>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Trigger password reset
                    supabase.auth.resetPasswordForEmail(profile.email, {
                      redirectTo: `${window.location.origin}/reset-password`,
                    });
                    toast({
                      title: "Reset email sent",
                      description: "Check your email for password reset instructions.",
                    });
                  }}
                  className="rounded-full"
                >
                  Reset Password
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}