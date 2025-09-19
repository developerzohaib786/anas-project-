-- Storage policies for brand-photos bucket
-- Enable RLS on storage.objects is enabled by default in Supabase projects. We create policies for controlled access.

-- Allow team members to view objects under their team folder in brand-photos
CREATE POLICY "Team members can view their brand photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
      AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to upload objects into their team folder
CREATE POLICY "Team members can upload their brand photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
      AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to update objects in their team folder
CREATE POLICY "Team members can update their brand photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
      AND tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to delete objects in their team folder
CREATE POLICY "Team members can delete their brand photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
      AND tm.team_id::text = (storage.foldername(name))[1]
  )
);
