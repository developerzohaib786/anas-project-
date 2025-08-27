import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BrandNameModal } from "./BrandNameModal";
import { TeamMembersModal } from "./TeamMembersModal";
import { OnboardingDashboard } from "./OnboardingDashboard";
import { useNavigate } from "react-router-dom";

interface TeamMember {
  email: string;
  name: string;
}

export const OnboardingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState<'brand-name' | 'team-members' | 'dashboard'>('brand-name');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (error) throw error;

      setProfile(data);
      
      // Determine current step based on profile data
      if (!data.brand_name) {
        setCurrentStep('brand-name');
      } else if (data.onboarding_step < 2) {
        setCurrentStep('team-members');
      } else {
        setCurrentStep('dashboard');
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const saveBrandName = async (brandName: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          brand_name: brandName,
          onboarding_step: 1
        })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, brand_name: brandName, onboarding_step: 1 });
      setCurrentStep('team-members');
      toast.success('Brand name saved!');
    } catch (error) {
      console.error('Error saving brand name:', error);
      toast.error('Failed to save brand name');
    }
  };

  const saveTeamMembers = async (members: TeamMember[]) => {
    try {
      // For now, just update the onboarding step
      // TODO: Implement actual team member invitations
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_step: 2 })
        .eq('id', user?.id);

      if (error) throw error;

      setProfile({ ...profile, onboarding_step: 2 });
      setCurrentStep('dashboard');
      
      if (members.length > 0) {
        toast.success(`${members.length} team member${members.length > 1 ? 's' : ''} will be invited!`);
      } else {
        toast.success('Setup continued!');
      }
    } catch (error) {
      console.error('Error saving team members:', error);
      toast.error('Failed to save team members');
    }
  };

  const skipTeamMembers = async () => {
    await saveTeamMembers([]);
  };

  const handleStepClick = (stepId: string) => {
    // Navigate to appropriate page based on step
    switch (stepId) {
      case 'photos':
        navigate('/create');
        break;
      case 'guidelines':
        navigate('/brand-kit');
        break;
      case 'team':
        setCurrentStep('team-members');
        break;
      case 'brand-kit':
        navigate('/brand-kit');
        break;
    }
  };

  const completeOnboarding = async () => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completed: true })
        .eq('id', user?.id);

      if (error) throw error;

      toast.success('Welcome to Nino! 🎉');
      navigate('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Setting up your account...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <BrandNameModal 
        open={currentStep === 'brand-name'}
        onSave={saveBrandName}
      />
      
      <TeamMembersModal 
        open={currentStep === 'team-members'}
        onSave={saveTeamMembers}
        onSkip={skipTeamMembers}
      />
      
      {currentStep === 'dashboard' && (
        <OnboardingDashboard 
          profile={profile}
          onStepClick={handleStepClick}
          onComplete={completeOnboarding}
        />
      )}
    </>
  );
};