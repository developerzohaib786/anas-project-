import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Camera, MessageSquare } from "lucide-react";

interface ModeToggleProps {
  mode: 'quick' | 'creative';
  onModeChange: (mode: 'quick' | 'creative') => void;
}

export const ModeToggle = ({ mode, onModeChange }: ModeToggleProps) => {
  return (
    <div className="bg-muted/50 p-1 rounded-xl backdrop-blur-sm border border-border">
      <div className="flex">
        <button
          onClick={() => onModeChange('quick')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-out font-medium text-sm ${
            mode === 'quick'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Quick Capture</span>
        </button>
        <button
          onClick={() => onModeChange('creative')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg transition-all duration-300 ease-out font-medium text-sm ${
            mode === 'creative'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="hidden sm:inline">Creative Studio</span>
        </button>
      </div>
    </div>
  );
};