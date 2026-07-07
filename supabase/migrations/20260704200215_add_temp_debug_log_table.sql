create table if not exists public._debug_ai_errors (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  detail text
);
