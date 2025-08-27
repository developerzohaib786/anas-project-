-- Storage policies for brand-photos bucket
-- Enable RLS on storage.objects is enabled by default in Supabase projects. We create policies for controlled access.

-- Allow team members to view objects under their team folder in brand-photos
create policy if not exists "Team members can view their brand photos"
on storage.objects
for select
using (
  bucket_id = 'brand-photos'
  and exists (
    select 1 from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.invitation_accepted = true
      and tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to upload objects into their team folder
create policy if not exists "Team members can upload their brand photos"
on storage.objects
for insert
with check (
  bucket_id = 'brand-photos'
  and exists (
    select 1 from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.invitation_accepted = true
      and tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to update objects in their team folder
create policy if not exists "Team members can update their brand photos"
on storage.objects
for update
using (
  bucket_id = 'brand-photos'
  and exists (
    select 1 from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.invitation_accepted = true
      and tm.team_id::text = (storage.foldername(name))[1]
  )
);

-- Allow team members to delete objects in their team folder
create policy if not exists "Team members can delete their brand photos"
on storage.objects
for delete
using (
  bucket_id = 'brand-photos'
  and exists (
    select 1 from public.team_memberships tm
    where tm.user_id = auth.uid()
      and tm.invitation_accepted = true
      and tm.team_id::text = (storage.foldername(name))[1]
  )
);
