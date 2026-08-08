-- Basic client-side error/monitoring log. Populated by a global
-- window.onerror / unhandledrejection listener and a React error
-- boundary (see src/lib/logError.js and src/components/ErrorBoundary.jsx).
-- Insert-only from the app; org-scoped so any signed-in member can log an
-- error but only see their own org's log history.
create table if not exists public.error_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,
  message text not null,
  stack text,
  context text,
  url text,
  created_at timestamptz not null default now()
);

alter table public.error_logs enable row level security;

-- Any authenticated user can log an error, tagged to their own org via
-- current_org_id() (already used by vendor-files storage policies) so
-- they can't spoof another org's id.
create policy "error_logs_insert_own_org"
  on public.error_logs
  for insert
  to authenticated
  with check (org_id = public.current_org_id() or org_id is null);

-- Members can review their own org's error history.
create policy "error_logs_select_own_org"
  on public.error_logs
  for select
  to authenticated
  using (org_id = public.current_org_id());

create index if not exists error_logs_org_id_created_at_idx
  on public.error_logs (org_id, created_at desc);
