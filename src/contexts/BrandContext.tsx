import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load profile and brand data
  const loadData = async () => {
    if (!user) {
      setProfile(null);
      setBrandProfile(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error loading profile:', profileError);
      } else {
        setProfile(profileData);
      }

      // Load brand profile
      const { data: brandData, error: brandError } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (brandError) {
        console.error('Error loading brand profile:', brandError);
      } else {
        setBrandProfile(brandData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load data when user changes
  useEffect(() => {
    loadData();
  }, [user]);

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) throw new Error('No user logged in');

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id);

    if (error) throw error;

    setProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    if (!user) throw new Error('No user logged in');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/avatar.${fileExt}`;

    // Upload to the new bucket
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
      .upload(fileName, file, { upsert: true });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('user-avatars')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const createBrandProfile = async (data: Omit<BrandProfile, 'id' | 'user_id' | 'is_active'>) => {
    if (!user) throw new Error('No user logged in');

    const { data: newBrandProfile, error } = await supabase
      .from('brand_profiles')
      .insert({
        ...data,
        user_id: user.id,
        is_active: true
      })
      .select()
      .single();

    if (error) throw error;

    setBrandProfile(newBrandProfile);
  };

  const updateBrandProfile = async (updates: Partial<BrandProfile>) => {
    if (!user || !brandProfile) throw new Error('No user or brand profile');

    const { error } = await supabase
      .from('brand_profiles')
      .update(updates)
      .eq('id', brandProfile.id);

    if (error) throw error;

    setBrandProfile(prev => prev ? { ...prev, ...updates } : null);
  };

  const refreshData = async () => {
    await loadData();
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