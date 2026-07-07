-- Helper: resolve the org_id of the currently logged-in user
create or replace function public.current_org_id()
returns uuid
language sql
security definer
stable
set search_path = public
as $$
  select org_id from public.profiles where id = auth.uid()
$$;

-- organizations
alter table public.organizations enable row level security;

create policy "org_insert_authenticated"
  on public.organizations for insert
  to authenticated
  with check (true);

create policy "org_select_own"
  on public.organizations for select
  to authenticated
  using (id = public.current_org_id());

create policy "org_update_own"
  on public.organizations for update
  to authenticated
  using (id = public.current_org_id());

-- profiles
alter table public.profiles enable row level security;

create policy "profile_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

create policy "profile_select_self_or_orgmate"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or org_id = public.current_org_id());

create policy "profile_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid());

-- events
alter table public.events enable row level security;

create policy "events_all_org_members"
  on public.events for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());

-- tasks
alter table public.tasks enable row level security;

create policy "tasks_all_org_members"
  on public.tasks for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

-- vendors
alter table public.vendors enable row level security;

create policy "vendors_all_org_members"
  on public.vendors for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

-- vendor_files
alter table public.vendor_files enable row level security;

create policy "vendor_files_all_org_members"
  on public.vendor_files for all
  to authenticated
  using (
    vendor_id in (
      select v.id from public.vendors v
      join public.events e on e.id = v.event_id
      where e.org_id = public.current_org_id()
    )
  )
  with check (
    vendor_id in (
      select v.id from public.vendors v
      join public.events e on e.id = v.event_id
      where e.org_id = public.current_org_id()
    )
  );

-- post_event_notes
alter table public.post_event_notes enable row level security;

create policy "post_event_notes_all_org_members"
  on public.post_event_notes for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

-- team_members
alter table public.team_members enable row level security;

create policy "team_members_all_org_members"
  on public.team_members for all
  to authenticated
  using (org_id = public.current_org_id())
  with check (org_id = public.current_org_id());
