import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { ReactNode, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ComprehensiveOnboarding } from "@/components/onboarding/ComprehensiveOnboarding";
import { useChat } from "@/contexts/ChatContext";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { clearAllSessions } = useChat();
  const [profileLoading, setProfileLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCheckComplete, setOnboardingCheckComplete] = useState(false);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      console.log('ProtectedRoute: Checking onboarding status for user:', user?.id);
      
      if (!user) {
        console.log('ProtectedRoute: No user found, setting profileLoading to false');
        setProfileLoading(false);
        return;
      }
      
      try {
        console.log('ProtectedRoute: Fetching profile for user:', user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .maybeSingle(); // Use maybeSingle() instead of single() to avoid errors when no profile exists

        if (error) {
          console.error('ProtectedRoute: Error fetching profile:', error);
          // If profile doesn't exist, show onboarding
          setShowOnboarding(true);
          setProfileLoading(false);
          return;
        }

        console.log('ProtectedRoute: Profile data:', profile);

        // If no profile exists, show onboarding
        if (!profile) {
          console.log('ProtectedRoute: No profile found, showing onboarding');
          // Clear any existing chat sessions for new user
          clearAllSessions();
          setShowOnboarding(true);
        } else {
          console.log('ProtectedRoute: Profile found, onboarding_completed:', profile.onboarding_completed);
          // If onboarding not completed, clear chat sessions
          if (!profile.onboarding_completed) {
            clearAllSessions();
          }
          setShowOnboarding(!profile.onboarding_completed);
        }
      } catch (error) {
        console.error('ProtectedRoute: Error checking onboarding status:', error);
        // On any error, show onboarding to be safe
        setShowOnboarding(true);
      } finally {
        console.log('ProtectedRoute: Setting profileLoading to false');
        setProfileLoading(false);
        setOnboardingCheckComplete(true);
      }
    };

    // Always call the function to ensure profileLoading gets set to false
    checkOnboardingStatus();
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
      <ComprehensiveOnboarding 
        onComplete={() => setShowOnboarding(false)} 
      />
    );
  }

  // Don't show children until we've completed the onboarding check
  if (!onboardingCheckComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
};

export default ProtectedRoute;