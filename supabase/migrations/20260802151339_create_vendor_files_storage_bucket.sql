-- Private bucket for vendor file uploads (contracts, insurance docs,
-- floor plans, etc). Not public — access is via short-lived signed URLs
-- generated server-side/client-side after an RLS check, same org-scoping
-- pattern as every other table (current_org_id()).
--
-- Path convention: {event_id}/{vendor_id}/{uuid-filename}. We scope
-- storage policies by looking up event_id -> org_id, since vendor_id
-- alone isn't in the events/org join path without an extra hop.
insert into storage.buckets (id, name, public)
values ('vendor-files', 'vendor-files', false)
on conflict (id) do nothing;

create policy "vendor_files_storage_read_org_members"
on storage.objects for select
to authenticated
using (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.org_id = public.current_org_id()
  )
);

create policy "vendor_files_storage_write_org_members"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.org_id = public.current_org_id()
  )
);

create policy "vendor_files_storage_delete_org_members"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(name))[1]
      and e.org_id = public.current_org_id()
  )
);
