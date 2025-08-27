-- Fix circular RLS dependencies causing "infinite recursion" and add safe storage policies

-- TEAMS: replace policies to use SECURITY DEFINER helper functions  
DROP POLICY IF EXISTS "Team members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Team owners can update their teams" ON public.teams;

CREATE POLICY "Team members can view their teams"
ON public.teams
FOR SELECT
USING (
  public.check_team_membership(id, auth.uid(), ARRAY['owner','admin','member'])
);

CREATE POLICY "Team owners can update their teams"
ON public.teams
FOR UPDATE
USING (
  public.is_team_admin(id, auth.uid())
);

-- TEAM MEMBERSHIPS: avoid referencing teams directly to prevent recursion
DROP POLICY IF EXISTS "Team owners and admins can manage memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Team owners and admins can view all team memberships" ON public.team_memberships;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.team_memberships;

CREATE POLICY "Users can view their own memberships"
ON public.team_memberships
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Admins can view all memberships"
ON public.team_memberships
FOR SELECT
USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can insert memberships"
ON public.team_memberships
FOR INSERT
WITH CHECK (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can update memberships"
ON public.team_memberships
FOR UPDATE
USING (public.is_team_admin(team_id, auth.uid()));

CREATE POLICY "Admins can delete memberships"
ON public.team_memberships
FOR DELETE
USING (public.is_team_admin(team_id, auth.uid()));

-- TEAM INVITATIONS: use helper function instead of cross-referencing tables
DROP POLICY IF EXISTS "Team owners and admins can create invitations" ON public.team_invitations;
DROP POLICY IF EXISTS "Invited users can view their invitations" ON public.team_invitations;

CREATE POLICY "Team owners and admins can create invitations"
ON public.team_invitations
FOR INSERT
WITH CHECK (
  public.is_team_admin(team_id, auth.uid())
);

CREATE POLICY "Invited users or admins can view invitations"
ON public.team_invitations
FOR SELECT
USING (
  (email = ((SELECT users.email FROM auth.users WHERE users.id = auth.uid()))::text)
  OR public.is_team_admin(team_id, auth.uid())
);

-- STORAGE: Drop existing problematic storage policies and create new safe ones
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users manage their brand assets" ON storage.objects;

-- User Avatars bucket policies
CREATE POLICY "Users can upload their own avatar"
ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'user-avatars'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view avatars"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user-avatars');

-- Brand Assets bucket (user-scoped by folder to avoid team recursion)
CREATE POLICY "Users manage their brand assets"
ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'brand-assets'
  AND auth.uid()::text = (storage.foldername(name))[1]
);