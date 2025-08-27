import { CheckCircle, Circle, Upload, FileText, Users, Palette } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  required: boolean;
}

interface OnboardingDashboardProps {
  profile: any;
  onStepClick: (stepId: string) => void;
  onComplete: () => void;
}

export const OnboardingDashboard = ({ profile, onStepClick, onComplete }: OnboardingDashboardProps) => {
  const steps: OnboardingStep[] = [
    {
      id: "photos",
      title: "Add Brand Photos",
      description: "Upload 10-30 images to train your AI agent",
      icon: Upload,
      completed: false, // TODO: Track photo uploads
      required: true
    },
    {
      id: "guidelines",
      title: "Brand Guidelines",
      description: "Define your brand voice, style, and preferences",
      icon: FileText,
      completed: false, // TODO: Track guidelines completion
      required: true
    },
    {
      id: "team",
      title: "Team Members",
      description: "Invite your team to collaborate",
      icon: Users,
      completed: false, // TODO: Check if team members added
      required: false
    },
    {
      id: "brand-kit",
      title: "Brand Kit",
      description: "Set up colors, fonts, and visual identity",
      icon: Palette,
      completed: false, // TODO: Track brand kit completion
      required: false
    }
  ];

  const completedSteps = steps.filter(step => step.completed).length;
  const requiredSteps = steps.filter(step => step.required && step.completed).length;
  const totalRequired = steps.filter(step => step.required).length;
  const canComplete = requiredSteps === totalRequired;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-gray-900 mb-2">
            Welcome to Nino, {profile?.brand_name || "there"}!
          </h1>
          <p className="text-lg text-gray-600">
            Let's get your AI agent trained and ready to go
          </p>
        </div>

        {/* Progress */}
        <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-medium">Setup Progress</h2>
            <Badge variant={canComplete ? "default" : "secondary"} className="text-sm">
              {completedSteps} of {steps.length} complete
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            {canComplete ? (
              <span className="text-green-600 font-medium">
                ✓ Required steps completed! You can finish setup anytime.
              </span>
            ) : (
              <span>
                Complete {totalRequired - requiredSteps} more required step{totalRequired - requiredSteps !== 1 ? 's' : ''} to finish setup
              </span>
            )}
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-4 md:grid-cols-2 mb-8">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  step.completed ? 'bg-green-50 border-green-200' : 'bg-white hover:bg-gray-50'
                }`}
                onClick={() => onStepClick(step.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        step.completed ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          step.completed ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{step.title}</CardTitle>
                        {step.required && (
                          <Badge variant="outline" className="text-xs mt-1">
                            Required
                          </Badge>
                        )}
                      </div>
                    </div>
                    {step.completed ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-300" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Complete Button */}
        <div className="text-center">
          <Button 
            onClick={onComplete}
            disabled={!canComplete}
            className="px-8 py-3 text-base"
            size="lg"
          >
            {canComplete ? "Complete Setup" : `Complete ${totalRequired - requiredSteps} more required steps`}
          </Button>
          
          {canComplete && (
            <p className="text-sm text-gray-500 mt-3">
              You can always return to add more details later
            </p>
          )}
        </div>
      </div>
    </div>
  );
};