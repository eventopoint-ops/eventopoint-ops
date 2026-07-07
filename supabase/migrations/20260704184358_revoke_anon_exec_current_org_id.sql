revoke execute on function public.current_org_id() from anon;
alter function public.handle_new_user() set search_path = public;
