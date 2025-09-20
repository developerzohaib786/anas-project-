import { Navigate, Outlet } from "react-router-dom";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { OnboardingModal } from "@/components/OnboardingModal";
import { useBrand } from "@/contexts/BrandContext";
import { useAuth } from "@/contexts/AuthContext";

export default function ProtectedAppLayout() {
  const { user, loading, hasSession } = useAuth();
  const { profile, loading: brandLoading, refreshData } = useBrand();

  if (loading || brandLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!hasSession) {
    return <Navigate to="/auth" replace />;
  }

  const needsOnboarding = profile && !profile.onboarding_completed;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
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
