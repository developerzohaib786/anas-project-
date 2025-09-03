import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Camera, MessageSquare, Upload, Sparkles, ArrowRight, Image } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const handleRouteSelect = (route: 'quick' | 'creative') => {
    if (route === 'quick') {
      navigate('/quick-capture');
    } else {
      navigate('/creative-studio');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Nino AI</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto">
          {/* Main Heading */}
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Transform Your Hotel
              <br />
              <span className="text-primary">Marketing Visuals</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose your preferred way to create stunning, commercial-quality images that showcase your property beautifully.
            </p>
          </div>

          {/* Route Selection Cards */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            {/* Route 1: Quick Scene Capture */}
            <div className="group relative">
              <div 
                className="bg-card border border-border rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleRouteSelect('quick')}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Camera className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Quick Scene Capture</h3>
                    <p className="text-sm text-muted-foreground">Perfect for non-creatives</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <Upload className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Upload iPhone photo</p>
                      <p className="text-sm text-muted-foreground">Any room, dish, or space</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Simple transformation</p>
                      <p className="text-sm text-muted-foreground">"Make this beautiful" or add brief style note</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">iPhone → Editorial Quality</span>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>

            {/* Route 2: Creative Studio */}
            <div className="group relative">
              <div 
                className="bg-card border border-border rounded-2xl p-8 cursor-pointer transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:scale-[1.02]"
                onClick={() => handleRouteSelect('creative')}
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-foreground">Creative Studio</h3>
                    <p className="text-sm text-muted-foreground">AI Creative Director</p>
                  </div>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Chat with AI</p>
                      <p className="text-sm text-muted-foreground">Describe your vision in detail</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Image className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-foreground">Reference images</p>
                      <p className="text-sm text-muted-foreground">Upload photos for "make something like this"</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-primary">Full Creative Control</span>
                  <ArrowRight className="w-5 h-5 text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </div>

          {/* Example Prompts Preview */}
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-4">
              Not sure what you want? We'll help with creative suggestions in both modes.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                "High-flash martini shot"
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                "Golden hour pool scene"
              </span>
              <span className="px-3 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                "Editorial hotel suite"
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Landing;