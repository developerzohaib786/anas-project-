-- =============================================
-- CLEAN SLATE MIGRATION
-- =============================================

-- Drop all existing storage policies first
DROP POLICY IF EXISTS "Users can view all avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own brand assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own brand assets" ON storage.objects;

-- Clear out all existing storage objects and buckets
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');

-- Create new storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('brand-assets', 'brand-assets', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

-- Clean up old tables
DROP TABLE IF EXISTS brand_guidelines CASCADE;
DROP TABLE IF EXISTS brand_photos CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create new profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT,
    last_name TEXT,
    email TEXT,
    avatar_url TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    onboarding_step INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- Create brand profiles table
CREATE TABLE public.brand_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    description TEXT,
    location TEXT,
    industry TEXT DEFAULT 'Hospitality & Travel',
    website_url TEXT,
    logo_url TEXT,
    primary_color TEXT,
    secondary_color TEXT,
    brand_tone TEXT,
    brand_voice TEXT,
    key_messages TEXT,
    core_values TEXT,
    content_dos TEXT,
    content_donts TEXT,
    additional_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand profile" ON public.brand_profiles 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand profile" ON public.brand_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand profile" ON public.brand_profiles 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand profile" ON public.brand_profiles 
    FOR DELETE USING (auth.uid() = user_id);

-- Create brand assets table
CREATE TABLE public.brand_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size INTEGER,
    content_type TEXT,
    asset_type TEXT DEFAULT 'photo' CHECK (asset_type IN ('photo', 'logo', 'graphic', 'document')),
    title TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own brand assets" ON public.brand_assets 
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own brand assets" ON public.brand_assets 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own brand assets" ON public.brand_assets 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own brand assets" ON public.brand_assets 
    FOR DELETE USING (auth.uid() = user_id);

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars" ON storage.objects 
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "Users can upload own avatar" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own avatar" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own avatar" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'user-avatars' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Storage policies for brand assets
CREATE POLICY "Users can view own brand assets in storage" ON storage.objects 
    FOR SELECT USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload own brand assets to storage" ON storage.objects 
    FOR INSERT WITH CHECK (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update own brand assets in storage" ON storage.objects 
    FOR UPDATE USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own brand assets in storage" ON storage.objects 
    FOR DELETE USING (
        bucket_id = 'brand-assets' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Add update triggers
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON public.brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_assets_updated_at
    BEFORE UPDATE ON public.brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();