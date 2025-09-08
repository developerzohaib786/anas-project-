import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useBrand } from "@/contexts/BrandContext";

export default function ProtectedAppLayout() {
  const [loading, setLoading] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const { profile, loading: brandLoading, refreshData } = useBrand();

  useEffect(() => {
    // Subscribe first
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setHasSession(!!session);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data }) => {
      setHasSession(!!data.session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading || brandLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!hasSession) {
    return <Navigate to="/auth" replace />;
  }

  const needsOnboarding = profile && !profile.onboarding_completed;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <main className="flex-1 min-w-0 overflow-auto">
          <Outlet />
        </main>
      </div>
      
      <OnboardingModal 
        open={!!needsOnboarding}
        onComplete={refreshData}
      />
    </SidebarProvider>
  );
}
