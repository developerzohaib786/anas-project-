import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SimpleOnboarding } from "@/components/onboarding/SimpleOnboarding";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) return;
      
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          setProfileLoading(false);
          return;
        }

        setShowOnboarding(!profile?.onboarding_completed);
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    if (user) {
      checkOnboardingStatus();
    }
  }, [user]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (showOnboarding) {
    return (
      <SimpleOnboarding 
        onComplete={() => setShowOnboarding(false)} 
      />
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;