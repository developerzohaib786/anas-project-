import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  className?: string;
}

export const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}: EmptyStateProps) => {
  return (
    <div className={`text-center py-20 ${className}`}>
      <div className="w-20 h-20 bg-gradient-to-br from-muted/50 to-muted/30 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-fade-in">
        <Icon className="w-10 h-10 text-muted-foreground/60" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-medium text-foreground mb-3 animate-fade-in">{title}</h3>
      <p className="text-muted-foreground mb-8 max-w-md mx-auto leading-relaxed animate-fade-in">
        {description}
      </p>
      <Button 
        onClick={onAction}
        className="animate-fade-in hover-scale shadow-lg"
        size="lg"
      >
        {actionLabel}
      </Button>
    </div>
  );
};