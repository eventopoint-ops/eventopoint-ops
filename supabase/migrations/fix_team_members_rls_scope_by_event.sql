-- team_members RLS was checking org_id = current_org_id(), but the app
-- (TeamTab.jsx) never sets org_id on insert -- team members are scoped
-- by event_id, matching every other per-event table (tasks, vendors,
-- vendor_files, post_event_notes). This mismatch made every team_members
-- insert/select fail RLS with org_id always null.
drop policy if exists "team_members_all_org_members" on public.team_members;

create policy "team_members_all_org_members"
  on public.team_members for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));
