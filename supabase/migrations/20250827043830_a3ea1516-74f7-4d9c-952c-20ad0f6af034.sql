-- Fix failed migration by recreating storage policies with drop-if-exists guards

-- View policy
drop policy if exists "Team members can view their brand photos" on storage.objects;
create policy "Team members can view their brand photos"
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

-- Insert policy
drop policy if exists "Team members can upload their brand photos" on storage.objects;
create policy "Team members can upload their brand photos"
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

-- Update policy
drop policy if exists "Team members can update their brand photos" on storage.objects;
create policy "Team members can update their brand photos"
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

-- Delete policy
drop policy if exists "Team members can delete their brand photos" on storage.objects;
create policy "Team members can delete their brand photos"
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
