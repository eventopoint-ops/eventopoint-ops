-- The vendor-files storage policies referenced `e.name` inside a subquery
-- aliased `events e`. Both `events` and `storage.objects` have a `name`
-- column, so `e.name` bound to the EVENT's name rather than the storage
-- object's path. The check compared the event's UUID against the first
-- path segment of the event's title, which is never equal, so every
-- vendor-file upload, read and delete was denied with
-- "new row violates row-level security policy".
--
-- Qualifying it as storage.objects.name binds it to the outer row, which
-- is what the path convention {event_id}/{vendor_id}/{uuid}-{filename}
-- always intended.

drop policy if exists "vendor_files_storage_write_org_members" on storage.objects;
drop policy if exists "vendor_files_storage_read_org_members" on storage.objects;
drop policy if exists "vendor_files_storage_delete_org_members" on storage.objects;

create policy "vendor_files_storage_write_org_members"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.org_id = public.current_org_id()
  )
);

create policy "vendor_files_storage_read_org_members"
on storage.objects for select to authenticated
using (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.org_id = public.current_org_id()
  )
);

create policy "vendor_files_storage_delete_org_members"
on storage.objects for delete to authenticated
using (
  bucket_id = 'vendor-files'
  and exists (
    select 1 from public.events e
    where e.id::text = (storage.foldername(storage.objects.name))[1]
      and e.org_id = public.current_org_id()
  )
);
