alter table public.tasks
  add column if not exists assigned_team_member_id uuid references public.team_members(id) on delete set null;
