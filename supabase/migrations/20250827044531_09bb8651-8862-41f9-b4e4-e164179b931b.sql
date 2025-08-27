-- Fix infinite recursion in team_memberships RLS policies
-- The issue is that the policies are referencing the same table they're applied to

-- First, create a security definer function to safely check team membership
CREATE OR REPLACE FUNCTION public.check_team_membership(
  target_team_id UUID,
  target_user_id UUID DEFAULT auth.uid(),
  required_roles TEXT[] DEFAULT ARRAY['owner', 'admin', 'member']
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM team_memberships tm
    WHERE tm.team_id = target_team_id
      AND tm.user_id = target_user_id
      AND tm.invitation_accepted = true
      AND (required_roles IS NULL OR tm.role = ANY(required_roles))
  );
$$;

-- Create function to check if user is team admin/owner
CREATE OR REPLACE FUNCTION public.is_team_admin(
  target_team_id UUID,
  target_user_id UUID DEFAULT auth.uid()
)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM team_memberships tm
    WHERE tm.team_id = target_team_id
      AND tm.user_id = target_user_id
      AND tm.invitation_accepted = true
      AND tm.role IN ('owner', 'admin')
  );
$$;

-- Drop and recreate team_memberships policies to fix infinite recursion
DROP POLICY IF EXISTS "Team members can view team memberships" ON team_memberships;
DROP POLICY IF EXISTS "Team owners and admins can manage memberships" ON team_memberships;

-- Create new non-recursive policies for team_memberships
CREATE POLICY "Users can view their own memberships"
ON team_memberships
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Team owners and admins can view all team memberships"
ON team_memberships
FOR SELECT
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_memberships.team_id 
      AND t.created_by = auth.uid()
  )
);

CREATE POLICY "Team owners and admins can manage memberships"
ON team_memberships
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_memberships.team_id 
      AND t.created_by = auth.uid()
  )
);

-- Fix team invitations security issue - restrict access to invited users and team admins only
DROP POLICY IF EXISTS "Team members can view team invitations" ON team_invitations;

CREATE POLICY "Invited users can view their invitations"
ON team_invitations
FOR SELECT
USING (
  -- Either the user is the one invited
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
  OR
  -- Or the user is a team owner/admin
  EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_invitations.team_id 
      AND t.created_by = auth.uid()
  )
);

-- Fix avatars storage bucket policies
-- Ensure avatars bucket exists and is public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Create storage policies for avatars (public bucket)
DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Public avatar access"
ON storage.objects
FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Ensure brand-photos bucket exists with correct settings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-photos', 'brand-photos', false, 104857600, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;