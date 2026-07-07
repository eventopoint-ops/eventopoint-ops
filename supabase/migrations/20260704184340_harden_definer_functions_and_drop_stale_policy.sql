-- Lock the search_path on the security-definer helper (best practice, prevents hijacking)
alter function public.current_org_id() set search_path = public;

-- Restrict direct RPC calls to these definer functions to what's actually needed
revoke execute on function public.current_org_id() from public;
grant execute on function public.current_org_id() to authenticated;

-- handle_new_user is the signup trigger function; it doesn't need to be callable
-- directly via the REST RPC endpoint by anyone, only fired by the trigger itself
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- Stale policy from an earlier prototype: allowed ANY request (anon or authenticated,
-- no token check at the database level) to flip any team member's checked_in status.
-- The current app doesn't query team_members from Supabase at all, so nothing
-- depends on this — dropping it removes a live open write-hole.
drop policy if exists "Token holders can update checkin" on public.team_members;
