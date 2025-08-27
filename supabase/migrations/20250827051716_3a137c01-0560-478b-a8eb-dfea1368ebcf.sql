-- Security fixes: update team_invitations policies to avoid querying auth.users and add DELETE policies

-- TEAM INVITATIONS: replace SELECT policy to use JWT email claim and add DELETE policies
DROP POLICY IF EXISTS "Invited users or admins can view invitations" ON public.team_invitations;

CREATE POLICY "Invited users or admins can view invitations"
ON public.team_invitations
FOR SELECT
USING (
  (email = (auth.jwt() ->> 'email')::text)
  OR public.is_team_admin(team_id, auth.uid())
);

-- Allow team admins to delete invitations
CREATE POLICY "Admins can delete invitations"
ON public.team_invitations
FOR DELETE
USING (public.is_team_admin(team_id, auth.uid()));

-- Allow invited users to delete their own invitations
CREATE POLICY "Invited users can delete their invitation"
ON public.team_invitations
FOR DELETE
USING (email = (auth.jwt() ->> 'email')::text);
