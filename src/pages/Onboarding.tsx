import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, Target } from "lucide-react";

export default function Onboarding() {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form data
  const [companyName, setCompanyName] = useState("");
  const [companyType, setCompanyType] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [role, setRole] = useState("");
  const [teamName, setTeamName] = useState("");
  const [teamDescription, setTeamDescription] = useState("");
  const [goals, setGoals] = useState<string[]>([]);

  const totalSteps = 3;
  const progress = (currentStep / totalSteps) * 100;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleGoal = (goal: string) => {
    setGoals(prev => 
      prev.includes(goal) 
        ? prev.filter(g => g !== goal)
        : [...prev, goal]
    );
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Update profile
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
        })
        .eq('id', user.id);

      // Create team
      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          name: teamName || `${companyName} Team`,
          description: teamDescription || `${companyName} creative team`,
          created_by: user.id,
        })
        .select()
        .single();

      if (teamError) throw teamError;

      toast({
        title: "Welcome aboard!",
        description: "Your account has been set up successfully.",
      });

      window.location.href = '/';
    } catch (error: any) {
      toast({
        title: "Setup failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const goalOptions = [
    "Create marketing materials",
    "Generate social media content",
    "Design website assets",
    "Produce promotional videos",
    "Build brand consistency",
    "Improve guest experience"
  ];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30 p-4">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Nino!</h1>
          <p className="text-muted-foreground">
            Let's set up your account to get the most out of our AI creative assistant
          </p>
        </div>

        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <p className="text-sm text-muted-foreground text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        <Card className="border-0 shadow-lg">
          {currentStep === 1 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Tell us about your business</CardTitle>
                <CardDescription>
                  Help us understand your company so we can tailor the experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter your company name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-type">Business Type</Label>
                  <Select value={companyType} onValueChange={setCompanyType}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select your business type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hotel">Hotel</SelectItem>
                      <SelectItem value="resort">Resort</SelectItem>
                      <SelectItem value="boutique-hotel">Boutique Hotel</SelectItem>
                      <SelectItem value="bed-breakfast">Bed & Breakfast</SelectItem>
                      <SelectItem value="vacation-rental">Vacation Rental</SelectItem>
                      <SelectItem value="hospitality-group">Hospitality Group</SelectItem>
                      <SelectItem value="marketing-agency">Marketing Agency</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-size">Company Size</Label>
                  <Select value={companySize} onValueChange={setCompanySize}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-10">1-10 employees</SelectItem>
                      <SelectItem value="11-50">11-50 employees</SelectItem>
                      <SelectItem value="51-200">51-200 employees</SelectItem>
                      <SelectItem value="201-500">201-500 employees</SelectItem>
                      <SelectItem value="500+">500+ employees</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger className="rounded-full">
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="marketing-manager">Marketing Manager</SelectItem>
                      <SelectItem value="creative-director">Creative Director</SelectItem>
                      <SelectItem value="social-media-manager">Social Media Manager</SelectItem>
                      <SelectItem value="general-manager">General Manager</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 2 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Set up your team</CardTitle>
                <CardDescription>
                  Create a team workspace for collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="team-name">Team Name</Label>
                  <Input
                    id="team-name"
                    placeholder={`${companyName} Creative Team` || "Enter team name"}
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="rounded-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="team-description">Team Description (Optional)</Label>
                  <Textarea
                    id="team-description"
                    placeholder="Describe what this team will work on..."
                    value={teamDescription}
                    onChange={(e) => setTeamDescription(e.target.value)}
                    className="rounded-lg"
                    rows={3}
                  />
                </div>
              </CardContent>
            </>
          )}

          {currentStep === 3 && (
            <>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>What are your goals?</CardTitle>
                <CardDescription>
                  Select what you'd like to accomplish with Nino
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {goalOptions.map((goal) => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(goal)}
                      className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                        goals.includes(goal)
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium">{goal}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          <div className="flex justify-between p-6 pt-0">
            <Button
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
              className="rounded-full"
            >
              Back
            </Button>
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !companyName) ||
                  (currentStep === 2 && !teamName && !companyName)
                }
                className="rounded-full"
              >
                Next
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={isLoading}
                className="rounded-full"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Complete Setup
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}