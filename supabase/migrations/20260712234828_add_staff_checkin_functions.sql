create or replace function public.get_checkin_info(p_token text)
returns table (
  member_name text,
  member_role text,
  checked_in boolean,
  checked_in_at timestamptz,
  event_name text,
  event_date date,
  venue text
)
language sql
security definer
stable
set search_path = public
as $$
  select
    tm.name,
    tm.role,
    tm.checked_in,
    tm.checked_in_at,
    e.name,
    e.event_date,
    e.venue
  from public.team_members tm
  join public.events e on e.id = tm.event_id
  where tm.token = p_token
  limit 1
$$;

create or replace function public.check_in_team_member(p_token text)
returns table (checked_in boolean, checked_in_at timestamptz)
language sql
security definer
set search_path = public
as $$
  update public.team_members
  set checked_in = true, checked_in_at = now()
  where token = p_token
  returning team_members.checked_in, team_members.checked_in_at
$$;

revoke execute on function public.get_checkin_info(text) from public;
revoke execute on function public.check_in_team_member(text) from public;

grant execute on function public.get_checkin_info(text) to anon, authenticated;
grant execute on function public.check_in_team_member(text) to anon, authenticated;
