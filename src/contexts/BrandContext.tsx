import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';


export interface Profile {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  avatar_url?: string;
  onboarding_completed: boolean;
  onboarding_step: number;
}

export interface BrandProfile {
  id: string;
  user_id: string;
  brand_name: string;
  description?: string;
  location?: string;
  industry: string;
  website_url?: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  brand_tone?: string;
  brand_voice?: string;
  key_messages?: string;
  core_values?: string;
  content_dos?: string;
  content_donts?: string;
  additional_notes?: string;
  is_active: boolean;
}

interface BrandContextType {
  profile: Profile | null;
  brandProfile: BrandProfile | null;
  loading: boolean;
  
  // Profile methods
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  uploadAvatar: (file: File) => Promise<string | null>;
  
  // Brand profile methods
  createBrandProfile: (data: Omit<BrandProfile, 'id' | 'user_id' | 'is_active'>) => Promise<void>;
  updateBrandProfile: (updates: Partial<BrandProfile>) => Promise<void>;
  
  // Utility methods
  refreshData: () => Promise<void>;
}

const BrandContext = createContext<BrandContextType | undefined>(undefined);

export function BrandProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>({
    id: 'demo',
    onboarding_completed: true,
    onboarding_step: 0,
    first_name: 'Demo',
    last_name: 'User',
    email: 'demo@example.com'
  });
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>({
    id: 'demo-brand',
    user_id: 'demo',
    brand_name: 'Demo Brand',
    industry: 'Technology',
    is_active: true
  });
  const [loading, setLoading] = useState(false);

  const updateProfile = async (updates: Partial<Profile>) => {
    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    return URL.createObjectURL(file);
  };

  const createBrandProfile = async (data: Omit<BrandProfile, 'id' | 'user_id' | 'is_active'>) => {
    const newBrandProfile = {
      ...data,
      id: Date.now().toString(),
      user_id: 'demo',
      is_active: true
    };
    setBrandProfile(newBrandProfile);
  };

  const updateBrandProfile = async (updates: Partial<BrandProfile>) => {
    setBrandProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshData = async () => {
    // No-op for demo
  };

  return (
    <BrandContext.Provider value={{
      profile,
      brandProfile,
      loading,
      updateProfile,
      uploadAvatar,
      createBrandProfile,
      updateBrandProfile,
      refreshData
    }}>
      {children}
    </BrandContext.Provider>
  );
}

export function useBrand() {
  const context = useContext(BrandContext);
  if (context === undefined) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}