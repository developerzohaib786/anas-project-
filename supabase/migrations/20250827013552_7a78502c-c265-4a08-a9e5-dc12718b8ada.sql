-- Secure functions with fixed search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.email
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Bootstrap owner membership on team creation
CREATE OR REPLACE FUNCTION public.handle_team_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.team_memberships (team_id, user_id, role, invitation_accepted, invited_by, joined_at)
  VALUES (NEW.id, NEW.created_by, 'owner', true, NEW.created_by, now())
  ON CONFLICT (team_id, user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_team_created ON public.teams;
CREATE TRIGGER on_team_created
AFTER INSERT ON public.teams
FOR EACH ROW EXECUTE FUNCTION public.handle_team_created();

-- Accept team invitation via secure function
CREATE OR REPLACE FUNCTION public.accept_team_invitation(invite_token uuid)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation RECORD;
BEGIN
  SELECT * INTO v_invitation
  FROM public.team_invitations
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now()
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Insert or update membership for the current user
  INSERT INTO public.team_memberships (team_id, user_id, role, invited_by, invitation_accepted, joined_at)
  VALUES (v_invitation.team_id, auth.uid(), v_invitation.role, v_invitation.invited_by, true, now())
  ON CONFLICT (team_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    invitation_accepted = true,
    joined_at = now();

  -- Mark invitation as accepted
  UPDATE public.team_invitations
  SET accepted_at = now()
  WHERE id = v_invitation.id;

  RETURN TRUE;
END;
$$;