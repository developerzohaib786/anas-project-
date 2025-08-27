-- Create brand_photos table to store metadata about uploaded photos
CREATE TABLE public.brand_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  content_type text,
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on brand_photos
ALTER TABLE public.brand_photos ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_photos
CREATE POLICY "Team members can view brand photos metadata"
ON public.brand_photos
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_photos.team_id
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can insert brand photos metadata"
ON public.brand_photos
FOR INSERT
WITH CHECK (
  user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_photos.team_id
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can update brand photos metadata"
ON public.brand_photos
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_photos.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete brand photos metadata"
ON public.brand_photos
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_photos.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Create brand_guidelines table to store brand guidelines
CREATE TABLE public.brand_guidelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  tone text,
  voice text,
  key_messages text,
  core_values text,
  content_dos text,
  content_donts text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(team_id)
);

-- Enable RLS on brand_guidelines
ALTER TABLE public.brand_guidelines ENABLE ROW LEVEL SECURITY;

-- RLS policies for brand_guidelines
CREATE POLICY "Team members can view brand guidelines"
ON public.brand_guidelines
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_guidelines.team_id
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can insert brand guidelines"
ON public.brand_guidelines
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_guidelines.team_id
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can update brand guidelines"
ON public.brand_guidelines
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_guidelines.team_id
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete brand guidelines"
ON public.brand_guidelines
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id = brand_guidelines.team_id
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Add update triggers
CREATE TRIGGER update_brand_photos_updated_at
  BEFORE UPDATE ON public.brand_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_brand_guidelines_updated_at
  BEFORE UPDATE ON public.brand_guidelines
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create default team for existing users who don't have one
-- This ensures users can immediately start using brand kit
INSERT INTO public.teams (name, description, created_by)
SELECT 
  COALESCE(p.brand_name, p.first_name || '''s Team', 'My Team') as name,
  'Default team for ' || COALESCE(p.brand_name, p.first_name, 'user') as description,
  p.id as created_by
FROM public.profiles p
WHERE p.onboarding_completed = true
  AND NOT EXISTS (
    SELECT 1 FROM public.team_memberships tm 
    WHERE tm.user_id = p.id AND tm.invitation_accepted = true
  )
ON CONFLICT DO NOTHING;