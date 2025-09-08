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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session-bound data
  useEffect(() => {
    let mounted = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      if (!mounted) return;
      if (session?.user) {
        loadData(session.user.id, session.user.email ?? undefined);
      } else {
        setProfile(null);
        setBrandProfile(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      if (user) {
        loadData(user.id, user.email ?? undefined);
      } else {
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const loadData = async (userId: string, email?: string) => {
    setLoading(true);
    try {
      // Profile
      const { data: prof, error: profErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      let finalProfile = prof as Profile | null;
      if (profErr) console.error('Profile fetch error', profErr);

      if (!finalProfile) {
        const { data: created, error: insertErr } = await supabase
          .from('profiles')
          .insert({ id: userId, email })
          .select()
          .single();
        if (insertErr) {
          console.error('Profile insert error', insertErr);
        } else {
          finalProfile = created as Profile;
        }
      }
      setProfile(finalProfile ?? null);

      // Brand profile (first active)
      const { data: bps, error: bpErr } = await supabase
        .from('brand_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (bpErr) console.error('Brand profile fetch error', bpErr);
      setBrandProfile((bps && bps[0]) ? (bps[0] as BrandProfile) : null);
    } catch (e) {
      console.error('Load brand/profile error', e);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!profile) return;
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates })
      .eq('id', profile.id);
    if (error) console.error('Update profile error', error);
    setProfile(prev => prev ? { ...prev, ...updates } : prev);
  };

  const uploadAvatar = async (file: File): Promise<string | null> => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return null;
    const ext = file.name.split('.').pop();
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from('user-avatars').upload(path, file);
    if (upErr) { console.error('Avatar upload error', upErr); return null; }
    const { data: pub } = supabase.storage.from('user-avatars').getPublicUrl(path);
    await updateProfile({ avatar_url: pub.publicUrl });
    return pub.publicUrl;
  };

  const createBrandProfile = async (data: Omit<BrandProfile, 'id' | 'user_id' | 'is_active'>) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) return;
    const { data: created, error } = await supabase
      .from('brand_profiles')
      .insert({ ...data, user_id: userId, is_active: true })
      .select()
      .single();
    if (error) { console.error('Create brand profile error', error); return; }
    setBrandProfile(created as BrandProfile);
  };

  const updateBrandProfile = async (updates: Partial<BrandProfile>) => {
    if (!brandProfile) {
      throw new Error('No brand profile found to update');
    }
    
    const { data: updated, error } = await supabase
      .from('brand_profiles')
      .update(updates)
      .eq('id', brandProfile.id)
      .select()
      .single();
      
    if (error) {
      console.error('Update brand profile error', error);
      throw new Error(`Failed to update brand profile: ${error.message}`);
    }
    
    setBrandProfile(updated as BrandProfile);
  };

  const refreshData = async () => {
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (user) await loadData(user.id, user.email ?? undefined);
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