-- Read-only verification after the notice_reads migration; no names or codes.
select
  to_regclass('public.notice_reads') is not null as notice_reads_exists,
  (select c.relrowsecurity from pg_class c
     where c.oid = to_regclass('public.notice_reads')) as rls_enabled,
  has_table_privilege('anon', 'public.notice_reads', 'SELECT') as anon_can_select,
  has_table_privilege('anon', 'public.notice_reads', 'INSERT') as anon_can_insert,
  has_table_privilege('authenticated', 'public.notice_reads', 'SELECT') as authenticated_can_select,
  has_table_privilege('authenticated', 'public.notice_reads', 'INSERT') as authenticated_can_insert,
  has_table_privilege('service_role', 'public.notice_reads', 'SELECT,INSERT') as service_can_read_write;
