-- Onboarding was impossible for every new user.
--
-- The INSERT into organizations was always permitted. What failed was the
-- RETURNING clause: PostgREST asks for the inserted row back
-- (return=representation), and RETURNING is subject to the SELECT
-- policies. Both existing SELECT policies identify an organization
-- through the caller's profile:
--
--   org_select_own        : id = current_org_id()
--   "Org members can read": id IN (select org_id from profiles where id = auth.uid())
--
-- A brand-new organization satisfies neither, because profiles.org_id is
-- only set AFTER the org exists. So the row was created and then made
-- invisible to its own creator in the same statement, and Postgres
-- reported it as "new row violates row-level security policy for table
-- organizations" -- which reads like the insert was refused, and sent us
-- looking at the INSERT policies for days.
--
-- Proof: the identical insert succeeds with the RETURNING clause removed.
--
-- The fix closes the loop: you may read an organization you created.
-- organizations.created_by is set by the BEFORE INSERT trigger
-- set_organization_created_by from auth.uid(), so the new row qualifies
-- immediately, and no row belonging to anyone else becomes visible.

create policy "org_select_creator"
on public.organizations
for select
to authenticated
using (created_by = auth.uid());
