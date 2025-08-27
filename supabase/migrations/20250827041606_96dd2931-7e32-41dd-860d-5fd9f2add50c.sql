-- Buckets creation (idempotent)
INSERT INTO storage.buckets (id, name, public) VALUES
  ('brand-photos', 'brand-photos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-sources', 'project-sources', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('project-outputs', 'project-outputs', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('chat-attachments', 'chat-attachments', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) VALUES
  ('exports', 'exports', false)
ON CONFLICT (id) DO NOTHING;

-- Helper conditions used across policies (inlined per policy)
-- team_scope: first folder segment is team_id
-- user_scope: first folder segment is auth.uid()

-- Brand Photos (team-scoped, private)
DROP POLICY IF EXISTS "Team members can view brand photos" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload brand photos" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can update brand photos" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can delete brand photos" ON storage.objects;

CREATE POLICY "Team members can view brand photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can upload brand photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can update brand photos"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete brand photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'brand-photos'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Project Sources (team-scoped)
DROP POLICY IF EXISTS "Team members can view project sources" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload project sources" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can update project sources" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can delete project sources" ON storage.objects;

CREATE POLICY "Team members can view project sources"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-sources'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can upload project sources"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-sources'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can update project sources"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-sources'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete project sources"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-sources'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Project Outputs (team-scoped)
DROP POLICY IF EXISTS "Team members can view project outputs" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload project outputs" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can update project outputs" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can delete project outputs" ON storage.objects;

CREATE POLICY "Team members can view project outputs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-outputs'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can upload project outputs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'project-outputs'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can update project outputs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'project-outputs'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete project outputs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'project-outputs'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Documents (team-scoped)
DROP POLICY IF EXISTS "Team members can view documents" ON storage.objects;
DROP POLICY IF EXISTS "Team members can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can update documents" ON storage.objects;
DROP POLICY IF EXISTS "Team admins can delete documents" ON storage.objects;

CREATE POLICY "Team members can view documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team members can upload documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can update documents"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

CREATE POLICY "Team admins can delete documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'documents'
  AND EXISTS (
    SELECT 1 FROM public.team_memberships tm
    WHERE tm.team_id::text = (storage.foldername(name))[1]
      AND tm.user_id = auth.uid()
      AND tm.role IN ('owner','admin')
      AND tm.invitation_accepted = true
  )
);

-- Chat Attachments (user-scoped)
DROP POLICY IF EXISTS "Users can view own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own chat attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own chat attachments" ON storage.objects;

CREATE POLICY "Users can view own chat attachments"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own chat attachments"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own chat attachments"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own chat attachments"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'chat-attachments'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Exports (user-scoped)
DROP POLICY IF EXISTS "Users can view own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own exports" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own exports" ON storage.objects;

CREATE POLICY "Users can view own exports"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can upload own exports"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own exports"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete own exports"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'exports'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
