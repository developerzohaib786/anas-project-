-- =============================================
-- 🚀 NINO APP - COMPLETE PRODUCTION DATABASE SETUP
-- =============================================
-- This is the complete SQL setup for production deployment
-- Run this in your Supabase SQL editor for a fresh setup
-- =============================================

-- =============================================
-- 1. UTILITY FUNCTIONS
-- =============================================

-- Create function for updating timestamps (if not exists)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Drop and recreate team administration helper functions
DROP FUNCTION IF EXISTS public.is_team_admin(uuid, uuid);
CREATE FUNCTION public.is_team_admin(team_id_param UUID, user_id_param UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_admin BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.team_memberships
        WHERE team_id = team_id_param
        AND user_id = user_id_param
        AND role IN ('owner', 'admin')
    ) INTO is_admin;
    
    RETURN is_admin;
END;
$$;

DROP FUNCTION IF EXISTS public.check_team_membership(uuid, uuid, text[]);
CREATE FUNCTION public.check_team_membership(team_id_param UUID, user_id_param UUID, allowed_roles TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    has_access BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.team_memberships
        WHERE team_id = team_id_param
        AND user_id = user_id_param
        AND role = ANY(allowed_roles)
    ) INTO has_access;
    
    RETURN has_access;
END;
$$;

-- =============================================
-- 2. STORAGE BUCKETS
-- =============================================

-- Clean up existing buckets and objects
DELETE FROM storage.objects WHERE bucket_id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');
DELETE FROM storage.buckets WHERE id IN ('avatars', 'brand-photos', 'user-avatars', 'brand-assets');

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('user-avatars', 'user-avatars', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('brand-assets', 'brand-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']);

-- =============================================
-- 3. CORE TABLES
-- =============================================

-- Drop existing tables (careful - this deletes data!)
DROP TABLE IF EXISTS public.asset_analysis CASCADE;
DROP TABLE IF EXISTS public.brand_training_profiles CASCADE;
DROP TABLE IF EXISTS public.training_jobs CASCADE;
DROP TABLE IF EXISTS public.brand_assets CASCADE;
DROP TABLE IF EXISTS public.brand_profiles CASCADE;
DROP TABLE IF EXISTS public.team_invitations CASCADE;
DROP TABLE IF EXISTS public.team_memberships CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table
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

-- Create brand profiles table
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

-- Create brand assets table
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

-- Create teams table
CREATE TABLE public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create team memberships table
CREATE TABLE public.team_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Create team invitations table
CREATE TABLE public.team_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'member')),
    invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, email)
);

-- =============================================
-- 4. AI TRAINING TABLES
-- =============================================

-- Create training jobs table to track training progress
CREATE TABLE public.training_jobs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    total_assets INTEGER NOT NULL DEFAULT 0,
    processed_assets INTEGER NOT NULL DEFAULT 0,
    flagged_assets INTEGER NOT NULL DEFAULT 0,
    categories TEXT[] NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create asset analysis table to store individual image analysis
CREATE TABLE public.asset_analysis (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    training_job_id UUID NOT NULL REFERENCES public.training_jobs(id) ON DELETE CASCADE,
    brand_asset_id UUID NOT NULL REFERENCES public.brand_assets(id) ON DELETE CASCADE,
    analysis_result JSONB,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    flagged_reasons TEXT[],
    quality_score NUMERIC(3,2),
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create brand training profiles table for versioned training results
CREATE TABLE public.brand_training_profiles (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_profile_id UUID NOT NULL REFERENCES public.brand_profiles(id) ON DELETE CASCADE,
    training_job_id UUID NOT NULL REFERENCES public.training_jobs(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    version INTEGER NOT NULL DEFAULT 1,
    style_summary TEXT,
    prompt_modifiers TEXT,
    negative_modifiers TEXT,
    categories_analyzed TEXT[],
    total_images_used INTEGER NOT NULL DEFAULT 0,
    quality_metrics JSONB,
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asset_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_training_profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 6. RLS POLICIES - USER PROFILES
-- =============================================

CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles 
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE USING (auth.uid() = id);

-- =============================================
-- 7. RLS POLICIES - BRAND PROFILES
-- =============================================

CREATE POLICY "Users can view own brand profile" ON public.brand_profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand profile" ON public.brand_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand profile" ON public.brand_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand profile" ON public.brand_profiles 
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 8. RLS POLICIES - BRAND ASSETS
-- =============================================

CREATE POLICY "Users can view own brand assets" ON public.brand_assets 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand assets" ON public.brand_assets 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand assets" ON public.brand_assets 
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand assets" ON public.brand_assets 
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- 9. RLS POLICIES - TEAMS
-- =============================================

CREATE POLICY "Team members can view their teams" ON public.teams
    FOR SELECT USING (
        public.check_team_membership(id, auth.uid(), ARRAY['owner','admin','member'])
    );

CREATE POLICY "Team owners can update their teams" ON public.teams
    FOR UPDATE USING (
        public.is_team_admin(id, auth.uid())
    );

CREATE POLICY "Users can create teams" ON public.teams
    FOR INSERT WITH CHECK (auth.uid() = created_by);

-- =============================================
-- 10. RLS POLICIES - TEAM MEMBERSHIPS
-- =============================================

CREATE POLICY "Users can view their own memberships" ON public.team_memberships
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships" ON public.team_memberships
    FOR SELECT USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can insert memberships" ON public.team_memberships
    FOR INSERT WITH CHECK (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can update memberships" ON public.team_memberships
    FOR UPDATE USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can delete memberships" ON public.team_memberships
    FOR DELETE USING (public.is_team_admin(team_id, auth.uid()));

-- =============================================
-- 11. RLS POLICIES - TEAM INVITATIONS
-- =============================================

CREATE POLICY "Team owners and admins can create invitations" ON public.team_invitations
    FOR INSERT WITH CHECK (
        public.is_team_admin(team_id, auth.uid())
    );

CREATE POLICY "Invited users or admins can view invitations" ON public.team_invitations
    FOR SELECT USING (
        (email = (auth.jwt() ->> 'email')::text)
        OR public.is_team_admin(team_id, auth.uid())
    );

CREATE POLICY "Admins can delete invitations" ON public.team_invitations
    FOR DELETE USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Invited users can delete their invitation" ON public.team_invitations
    FOR DELETE USING (email = (auth.jwt() ->> 'email')::text);

-- =============================================
-- 12. RLS POLICIES - AI TRAINING TABLES
-- =============================================

-- Training jobs policies
CREATE POLICY "Users can view their own training jobs" ON public.training_jobs 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training jobs" ON public.training_jobs 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training jobs" ON public.training_jobs 
    FOR UPDATE USING (auth.uid() = user_id);

-- Asset analysis policies (system-level access for AI processing)
CREATE POLICY "Users can view their own asset analysis" ON public.asset_analysis 
    FOR SELECT USING (training_job_id IN (SELECT id FROM training_jobs WHERE user_id = auth.uid()));

CREATE POLICY "System can create asset analysis" ON public.asset_analysis 
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update asset analysis" ON public.asset_analysis 
    FOR UPDATE USING (true);

-- Brand training profiles policies
CREATE POLICY "Users can view their own training profiles" ON public.brand_training_profiles 
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own training profiles" ON public.brand_training_profiles 
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own training profiles" ON public.brand_training_profiles 
    FOR UPDATE USING (auth.uid() = user_id);

-- =============================================
-- 13. STORAGE POLICIES
-- =============================================

-- User Avatars Storage Policies (public read, user-scoped write)
CREATE POLICY "Anyone can view avatars" ON storage.objects 
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

-- Brand Assets Storage Policies (public read for display, user-scoped write)
CREATE POLICY "Anyone can view brand assets" ON storage.objects 
    FOR SELECT USING (bucket_id = 'brand-assets');

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
-- 14. PERFORMANCE INDEXES
-- =============================================

-- Core table indexes
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_brand_profiles_user_id ON public.brand_profiles(user_id);
CREATE INDEX idx_brand_profiles_is_active ON public.brand_profiles(is_active);
CREATE INDEX idx_brand_assets_brand_profile_id ON public.brand_assets(brand_profile_id);
CREATE INDEX idx_brand_assets_user_id ON public.brand_assets(user_id);
CREATE INDEX idx_brand_assets_asset_type ON public.brand_assets(asset_type);

-- Team indexes
CREATE INDEX idx_team_memberships_team_id ON public.team_memberships(team_id);
CREATE INDEX idx_team_memberships_user_id ON public.team_memberships(user_id);
CREATE INDEX idx_team_memberships_role ON public.team_memberships(role);
CREATE INDEX idx_team_invitations_team_id ON public.team_invitations(team_id);
CREATE INDEX idx_team_invitations_email ON public.team_invitations(email);

-- AI training indexes
CREATE INDEX idx_training_jobs_brand_profile_id ON public.training_jobs(brand_profile_id);
CREATE INDEX idx_training_jobs_user_id ON public.training_jobs(user_id);
CREATE INDEX idx_training_jobs_status ON public.training_jobs(status);
CREATE INDEX idx_asset_analysis_training_job_id ON public.asset_analysis(training_job_id);
CREATE INDEX idx_asset_analysis_brand_asset_id ON public.asset_analysis(brand_asset_id);
CREATE INDEX idx_brand_training_profiles_brand_profile_id ON public.brand_training_profiles(brand_profile_id);
CREATE INDEX idx_brand_training_profiles_is_active ON public.brand_training_profiles(is_active);

-- =============================================
-- 15. AUTOMATIC TIMESTAMP TRIGGERS
-- =============================================

-- Profiles
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Brand profiles
CREATE TRIGGER update_brand_profiles_updated_at
    BEFORE UPDATE ON public.brand_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Brand assets
CREATE TRIGGER update_brand_assets_updated_at
    BEFORE UPDATE ON public.brand_assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Teams
CREATE TRIGGER update_teams_updated_at
    BEFORE UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Team memberships
CREATE TRIGGER update_team_memberships_updated_at
    BEFORE UPDATE ON public.team_memberships
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Training jobs
CREATE TRIGGER update_training_jobs_updated_at
    BEFORE UPDATE ON public.training_jobs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 16. PRODUCTION OPTIMIZATIONS
-- =============================================

-- Enable automatic vacuum and analyze
ALTER TABLE public.profiles SET (autovacuum_enabled = true, autovacuum_analyze_threshold = 100);
ALTER TABLE public.brand_profiles SET (autovacuum_enabled = true, autovacuum_analyze_threshold = 100);
ALTER TABLE public.brand_assets SET (autovacuum_enabled = true, autovacuum_analyze_threshold = 100);
ALTER TABLE public.training_jobs SET (autovacuum_enabled = true, autovacuum_analyze_threshold = 100);
ALTER TABLE public.asset_analysis SET (autovacuum_enabled = true, autovacuum_analyze_threshold = 100);

-- =============================================
-- 🎉 SETUP COMPLETE!
-- =============================================
-- Your Nino app database is now production-ready with:
-- ✅ User authentication and profiles
-- ✅ Brand management system
-- ✅ Asset storage and management
-- ✅ Team collaboration features
-- ✅ AI training infrastructure
-- ✅ Row Level Security (RLS) enabled
-- ✅ Performance optimizations
-- ✅ Automatic timestamp management
-- ✅ Comprehensive indexing
-- 
-- Next steps:
-- 1. Set environment variables in Supabase Dashboard
-- 2. Deploy Edge Functions
-- 3. Configure your frontend with Supabase URL and keys
-- 4. Test the full application flow
-- =============================================
