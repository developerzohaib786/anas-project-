import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Building2, Users, Target } from "lucide-react";

interface OnboardingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function OnboardingModal({ open, onOpenChange }: OnboardingModalProps) {
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

      onOpenChange(false);
      window.location.reload(); // Refresh to update the app state
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

  const getStepIcon = () => {
    switch (currentStep) {
      case 1:
        return <Building2 className="h-5 w-5 text-primary" />;
      case 2:
        return <Users className="h-5 w-5 text-primary" />;
      case 3:
        return <Target className="h-5 w-5 text-primary" />;
      default:
        return null;
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Tell us about your business";
      case 2:
        return "Set up your team";
      case 3:
        return "What are your goals?";
      default:
        return "";
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 1:
        return "Help us understand your company so we can tailor the experience";
      case 2:
        return "Create a team workspace for collaboration";
      case 3:
        return "Select what you'd like to accomplish with Nino";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-4">
          <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            {getStepIcon()}
          </div>
          <DialogTitle className="text-xl font-semibold">
            {getStepTitle()}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {getStepDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mb-6">
          <Progress value={progress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground text-center">
            Step {currentStep} of {totalSteps}
          </p>
        </div>

        <div className="space-y-4">
          {currentStep === 1 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="company-name" className="text-sm font-medium">Company Name</Label>
                <Input
                  id="company-name"
                  placeholder="Enter your company name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="rounded-full h-11"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company-type" className="text-sm font-medium">Business Type</Label>
                <Select value={companyType} onValueChange={setCompanyType}>
                  <SelectTrigger className="rounded-full h-11">
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
                <Label htmlFor="company-size" className="text-sm font-medium">Company Size</Label>
                <Select value={companySize} onValueChange={setCompanySize}>
                  <SelectTrigger className="rounded-full h-11">
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
                <Label htmlFor="role" className="text-sm font-medium">Your Role</Label>
                <Select value={role} onValueChange={setRole}>
                  <SelectTrigger className="rounded-full h-11">
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
            </>
          )}

          {currentStep === 2 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="team-name" className="text-sm font-medium">Team Name</Label>
                <Input
                  id="team-name"
                  placeholder={`${companyName} Creative Team` || "Enter team name"}
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  className="rounded-full h-11"
                  style={{ fontSize: '16px' }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="team-description" className="text-sm font-medium">Team Description (Optional)</Label>
                <Textarea
                  id="team-description"
                  placeholder="Describe what this team will work on..."
                  value={teamDescription}
                  onChange={(e) => setTeamDescription(e.target.value)}
                  className="rounded-lg min-h-[80px] text-sm"
                  rows={3}
                  style={{ fontSize: '16px' }}
                />
              </div>
            </>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              {goalOptions.map((goal) => (
                <button
                  key={goal}
                  onClick={() => toggleGoal(goal)}
                  className={`w-full p-3 rounded-lg border text-left transition-all duration-200 text-sm touch-manipulation ${
                    goals.includes(goal)
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {goal}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-6 space-x-3">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={currentStep === 1}
            className="rounded-full flex-1 h-11"
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
              className="rounded-full flex-1 h-11"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={isLoading}
              className="rounded-full flex-1 h-11"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Complete
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}