-- SECURITY FIX: profiles.org_id / profiles.role had no WITH CHECK on their
-- UPDATE policy, so any signed-in user could run
--   update profiles set org_id = '<someone else''s org id>' where id = auth.uid()
-- and immediately gain full read/write access to another organization's
-- events, vendors, and team members via every other table's
-- current_org_id()-scoped RLS. role could be self-escalated the same way.
-- This closes that gap with a BEFORE UPDATE trigger, while preserving the
-- one legitimate client-side write this table needs: OnboardingPage.jsx's
-- one-time `update profiles set org_id = <new org>, onboarding_complete = true`
-- right after the user creates their own org.

-- Provenance: track who created each organization, so the trigger below can
-- verify a user is only ever linking themselves to an org they just made.
alter table public.organizations
  add column if not exists created_by uuid references auth.users(id) on delete set null;

-- Backfill the one existing org/profile pair (pre-revenue, single known user).
update public.organizations o
set created_by = p.id
from public.profiles p
where p.org_id = o.id
  and o.created_by is null;

create or replace function public.set_organization_created_by()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists organizations_set_created_by on public.organizations;
create trigger organizations_set_created_by
  before insert on public.organizations
  for each row
  execute function public.set_organization_created_by();

-- The actual lockdown: role can never be changed by a client update, full
-- stop (every profile is created with role='admin' by default -- there's
-- no team-invite/role-management flow yet, so there is no legitimate
-- client path that should ever change it). org_id may move exactly once,
-- from NULL to a value, and only to an organization the same user just
-- created (checked via organizations.created_by). Once set, org_id is
-- locked -- no re-parenting to a different org via client update.
-- service_role (support tooling / future admin actions) bypasses both
-- checks entirely.
create or replace function public.lock_profile_org_and_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.role is distinct from old.role then
    raise exception 'role cannot be changed directly. Contact support.';
  end if;

  if new.org_id is distinct from old.org_id then
    if old.org_id is not null then
      raise exception 'org_id cannot be changed once set. Contact support.';
    end if;

    if new.org_id is not null and not exists (
      select 1 from public.organizations o
      where o.id = new.org_id and o.created_by = auth.uid()
    ) then
      raise exception 'org_id can only be set to an organization you created.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_lock_org_and_role on public.profiles;
create trigger profiles_lock_org_and_role
  before update on public.profiles
  for each row
  execute function public.lock_profile_org_and_role();

-- Legacy stale policy cleanup: "Users can manage own profile" was an ALL
-- (select/insert/update/delete) policy with no WITH CHECK, layered on top
-- of the narrower profile_select_self_or_orgmate / profile_insert_self /
-- profile_update_self policies added later. Dropping it removes an
-- unintended DELETE grant that no narrower policy provides.
drop policy if exists "Users can manage own profile" on public.profiles;
