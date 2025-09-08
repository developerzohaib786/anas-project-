import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LoadingStateProps {
  loading?: boolean;
  error?: string | null;
  success?: boolean;
  loadingText?: string;
  errorText?: string;
  successText?: string;
  children?: React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingState({
  loading = false,
  error = null,
  success = false,
  loadingText = "Loading...",
  errorText,
  successText,
  children,
  className,
  size = 'md'
}: LoadingStateProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (error) {
    return (
      <div className={cn("flex items-center gap-2 text-destructive", className)}>
        <AlertCircle className={sizeClasses[size]} />
        <span className={textSizeClasses[size]}>{errorText || error}</span>
      </div>
    );
  }

  if (success && successText) {
    return (
      <div className={cn("flex items-center gap-2 text-green-600", className)}>
        <CheckCircle2 className={sizeClasses[size]} />
        <span className={textSizeClasses[size]}>{successText}</span>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={cn("flex items-center gap-2 text-muted-foreground", className)}>
        <Loader2 className={cn("animate-spin", sizeClasses[size])} />
        <span className={textSizeClasses[size]}>{loadingText}</span>
      </div>
    );
  }

  return <>{children}</>;
}

// Specialized loading components

export function ButtonLoadingState({ 
  loading, 
  children, 
  loadingText = "Loading...",
  disabled 
}: {
  loading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  disabled?: boolean;
}) {
  return (
    <>
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {loading ? loadingText : children}
    </>
  );
}

export function PageLoadingState({ 
  message = "Loading page..." 
}: { 
  message?: string 
}) {
  return (
    <div className="flex items-center justify-center min-h-[400px] w-full">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}

export function InlineLoadingState({ 
  size = 'sm',
  className 
}: { 
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6'
  };

  return (
    <Loader2 className={cn("animate-spin text-muted-foreground", sizeClasses[size], className)} />
  );
}
