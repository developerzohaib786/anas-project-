-- =============================================
-- COMPLETE PROFILE & BRAND SYSTEM RESTRUCTURE (FIXED)
-- =============================================

-- First, clear out all existing storage objects
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');

-- Now we can safely delete and recreate buckets
DELETE FROM storage.buckets WHERE id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');

-- Create clean storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('brand-assets', 'brand-assets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

-- =============================================
-- RESTRUCTURED USER PROFILES TABLE
-- =============================================
-- Drop and recreate profiles table with cleaner structure
DROP TABLE IF EXISTS profiles CASCADE;

CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT,
    
    -- Onboarding State
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- NEW BRAND PROFILES TABLE
-- =============================================
DROP TABLE IF EXISTS brand_profiles CASCADE;

CREATE TABLE public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Basic Brand Info
    brand_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    industry TEXT DEFAULT 'Hospitality & Travel',
    website_url TEXT,
    
    -- Brand Visual Identity
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    
    -- Brand Voice & Messaging
    brand_tone TEXT,
    brand_voice TEXT,
    key_messages TEXT,
    core_values TEXT,
    
    -- Content Guidelines
    content_dos TEXT,
    content_donts TEXT,
    
    -- Additional Notes
    additional_notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id) -- One brand profile per user for now
);

-- Enable RLS
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

-- Brand profiles policies
CREATE POLICY "Users can view own brand profile" ON public.brand_profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profile" ON public.brand_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profile" ON public.brand_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand profile" ON public.brand_profiles 
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- RESTRUCTURED BRAND ASSETS TABLE
-- =============================================
-- Drop and recreate brand assets table
DROP TABLE IF EXISTS brand_photos CASCADE;

CREATE TABLE public.brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- File Information
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    
    -- Asset Metadata
    asset_type TEXT DEFAULT 'photo' CHECK (asset_type IN ('photo', 'logo', 'graphic', 'document')),
    title TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

-- Brand assets policies
CREATE POLICY "Users can view own brand assets" ON public.brand_assets 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand assets" ON public.brand_assets 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand assets" ON public.brand_assets 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand assets" ON public.brand_assets 
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- User Avatars Storage Policies
CREATE POLICY "Users can view all avatars" ON storage.objects 
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload their own avatar" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Brand Assets Storage Policies
CREATE POLICY "Users can view their own brand assets" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own brand assets" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own brand assets" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own brand assets" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================

-- Update profiles trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update brand_profiles trigger
CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON public.brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Update brand_assets trigger
CREATE TRIGGER update_brand_assets_updated_at
    BEFORE UPDATE ON public.brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- CLEAN UP OLD TABLES
-- =============================================
-- The old brand_guidelines table is no longer needed as we've moved 
-- everything to brand_profiles
DROP TABLE IF EXISTS brand_guidelines CASCADE;