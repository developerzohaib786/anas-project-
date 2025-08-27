import { createContext, useContext, useState, ReactNode } from 'react';

interface UserProfile {
  first_name: string;
  last_name: string;
  email: string;
}

interface BrandSettings {
  name: string;
  description: string;
  location: string;
  industry: string;
  tone: string;
  voice: string;
  keyMessages: string;
  coreValues: string;
  contentDos: string;
  contentDonts: string;
}

interface SettingsContextType {
  profile: UserProfile;
  brandSettings: BrandSettings;
  updateProfile: (profile: Partial<UserProfile>) => void;
  updateBrandSettings: (settings: Partial<BrandSettings>) => void;
}

const defaultProfile: UserProfile = {
  first_name: '',
  last_name: '',
  email: ''
};

const defaultBrandSettings: BrandSettings = {
  name: '',
  description: '',
  location: '',
  industry: 'Hospitality & Travel',
  tone: '',
  voice: '',
  keyMessages: '',
  coreValues: '',
  contentDos: '',
  contentDonts: ''
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(defaultProfile);
  const [brandSettings, setBrandSettings] = useState<BrandSettings>(defaultBrandSettings);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  const updateBrandSettings = (updates: Partial<BrandSettings>) => {
    setBrandSettings(prev => ({ ...prev, ...updates }));
  };

  return (
    <SettingsContext.Provider value={{
      profile,
      brandSettings,
      updateProfile,
      updateBrandSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}