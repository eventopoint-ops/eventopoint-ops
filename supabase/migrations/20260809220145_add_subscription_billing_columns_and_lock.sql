-- Subscription/billing state for each org, synced from Stripe via the
-- stripe-webhook Edge Function. subscription_status mirrors Stripe's own
-- subscription status values: trialing, active, past_due, canceled,
-- incomplete, incomplete_expired, unpaid.
alter table public.organizations
  add column if not exists stripe_customer_id text,
  add column if not exists stripe_subscription_id text,
  add column if not exists subscription_status text,
  add column if not exists trial_ends_at timestamptz,
  add column if not exists current_period_end timestamptz;

-- Fast lookup by Stripe customer/subscription id when a webhook event
-- comes in (Stripe events carry these ids, not our org id). Partial
-- unique indexes so multiple orgs can have null (not yet subscribed)
-- without violating uniqueness.
create unique index if not exists organizations_stripe_customer_id_idx
  on public.organizations (stripe_customer_id)
  where stripe_customer_id is not null;

create unique index if not exists organizations_stripe_subscription_id_idx
  on public.organizations (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- SECURITY: billing fields must only ever be written by the
-- stripe-webhook Edge Function (using its service-role key), never by a
-- client update -- otherwise any org admin could just UPDATE their own
-- row to subscription_status = 'active' and skip paying entirely. This
-- mirrors the same lockdown pattern used on profiles.org_id/role
-- (see migration close_profile_org_privilege_escalation_and_drop_legacy_policy).
-- Other columns on organizations (name, type, etc.) are untouched by
-- this trigger and remain editable by org admins as before.
create or replace function public.lock_organization_billing_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() = 'service_role' then
    return new;
  end if;

  if new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id
     or new.subscription_status is distinct from old.subscription_status
     or new.trial_ends_at is distinct from old.trial_ends_at
     or new.current_period_end is distinct from old.current_period_end
  then
    raise exception 'billing fields can only be updated by the billing system.';
  end if;

  return new;
end;
$$;

drop trigger if exists organizations_lock_billing_fields on public.organizations;
create trigger organizations_lock_billing_fields
  before update on public.organizations
  for each row
  execute function public.lock_organization_billing_fields();
