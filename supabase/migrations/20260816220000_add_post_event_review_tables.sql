-- Post-event review feature: quick notes at any stage of an event, a
-- per-event wrap-up (overall notes / guest feedback / improvements needed
-- / AI-generated summary+suggestions), and per-event ratings for staff and
-- vendors. Ratings are scoped to (event_id, team_member_id) and
-- (event_id, vendor_id) with a unique constraint so writes can upsert --
-- one rating per person per event, editable.
--
-- Note: team_members and vendors are currently created per-event (see
-- their event_id column), not as a persistent org-wide roster, so ratings
-- don't yet aggregate across events for the "same" staff member/vendor by
-- identity -- only by matching name. A shared roster is a bigger schema
-- change for later if cross-event rebooking history becomes a priority.

create table if not exists public.event_notes (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  stage text default 'during' check (stage in ('before', 'during', 'after')),
  note text not null,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.event_reviews (
  id uuid primary key default gen_random_uuid(),
  event_id uuid unique references public.events(id) on delete cascade,
  overall_notes text,
  guest_feedback text,
  improvements_needed text,
  ai_summary text,
  ai_suggestions text,
  ai_generated_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.staff_ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  team_member_id uuid references public.team_members(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  unique (event_id, team_member_id)
);

create table if not exists public.vendor_ratings (
  id uuid primary key default gen_random_uuid(),
  event_id uuid references public.events(id) on delete cascade,
  vendor_id uuid references public.vendors(id) on delete cascade,
  rating integer check (rating between 1 and 5),
  notes text,
  created_at timestamptz default now(),
  unique (event_id, vendor_id)
);

alter table public.event_notes enable row level security;
create policy "event_notes_all_org_members"
  on public.event_notes for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

alter table public.event_reviews enable row level security;
create policy "event_reviews_all_org_members"
  on public.event_reviews for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

alter table public.staff_ratings enable row level security;
create policy "staff_ratings_all_org_members"
  on public.staff_ratings for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));

alter table public.vendor_ratings enable row level security;
create policy "vendor_ratings_all_org_members"
  on public.vendor_ratings for all
  to authenticated
  using (event_id in (select id from public.events where org_id = public.current_org_id()))
  with check (event_id in (select id from public.events where org_id = public.current_org_id()));
