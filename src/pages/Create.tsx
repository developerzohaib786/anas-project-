import { useState } from "react";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  { id: 0, title: "Welcome", description: "Let's create something amazing" },
  { id: 1, title: "Content Type", description: "Choose what you want to create" },
  { id: 2, title: "Format & Size", description: "Select dimensions and platform" },
  { id: 3, title: "Style & Vibe", description: "Define the mood and aesthetic" },
  { id: 4, title: "Describe", description: "Tell us what you want to see" },
  { id: 5, title: "Brand Layer", description: "Apply your brand assets" },
  { id: 6, title: "Review", description: "Confirm your choices" },
  { id: 7, title: "Generate", description: "AI creates your content" },
];

export default function Create() {
  const [currentStep, setCurrentStep] = useState(0);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Ready to create amazing content?
            </h2>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              Nino will guide you through creating professional hotel and travel marketing content in just a few steps.
            </p>
            <Button onClick={nextStep} size="lg">
              Get Started
              <ChevronRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        );
      
      case 1:
        return (
          <div className="py-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">
              What would you like to create?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Card className="cursor-pointer hover:shadow-md transition-shadow border-2 border-gray-900">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">📸</div>
                  <h3 className="font-medium text-gray-900 mb-2">Photo</h3>
                  <p className="text-sm text-gray-600">High-quality images for marketing</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-not-allowed opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎥</div>
                  <h3 className="font-medium text-gray-900 mb-2">Video</h3>
                  <p className="text-sm text-gray-600">Coming Soon</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-not-allowed opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">📱</div>
                  <h3 className="font-medium text-gray-900 mb-2">Ad Banner</h3>
                  <p className="text-sm text-gray-600">Coming Soon</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-not-allowed opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🎠</div>
                  <h3 className="font-medium text-gray-900 mb-2">Carousel</h3>
                  <p className="text-sm text-gray-600">Coming Soon</p>
                </CardContent>
              </Card>
              
              <Card className="cursor-not-allowed opacity-50">
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-4">🔄</div>
                  <h3 className="font-medium text-gray-900 mb-2">GIF/Loop</h3>
                  <p className="text-sm text-gray-600">Coming Soon</p>
                </CardContent>
              </Card>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="py-12 text-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              {steps[currentStep].title}
            </h2>
            <p className="text-gray-600 mb-8">
              This step is coming soon. We're building an amazing experience for you.
            </p>
          </div>
        );
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Progress Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  index <= currentStep
                    ? "bg-gray-900 text-white"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {index < currentStep ? (
                  <Check className="h-4 w-4" />
                ) : (
                  index + 1
                )}
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    index < currentStep ? "bg-gray-900" : "bg-gray-200"
                  }`}
                />
              )}
            </div>
          ))}
        </div>
        <div className="text-center">
          <h1 className="text-sm font-medium text-gray-900">
            {steps[currentStep].title}
          </h1>
          <p className="text-sm text-gray-600">
            {steps[currentStep].description}
          </p>
        </div>
      </div>

      {/* Step Content */}
      <Card>
        <CardContent className="p-8">
          {renderStepContent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      {currentStep > 0 && (
        <div className="flex justify-between mt-6">
          <Button variant="outline" onClick={prevStep}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>
          <Button onClick={nextStep} disabled={currentStep >= steps.length - 1}>
            Next
            <ChevronRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}