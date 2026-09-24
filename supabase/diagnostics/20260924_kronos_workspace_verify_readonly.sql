-- Read-only. Results contain no credentials, account names or memo contents.
with expected(name) as (values ('kronos_shop_items'),('kronos_missions'),('kronos_progress'),('kronos_reminders'))
select e.name as table_name,
  c.oid is not null as exists,
  coalesce(c.relrowsecurity,false) as rls_enabled,
  case when c.oid is null then null else has_table_privilege('anon',c.oid,'SELECT') end as anon_can_read,
  case when c.oid is null then null else has_table_privilege('anon',c.oid,'INSERT,UPDATE,DELETE') end as anon_can_write,
  case when c.oid is null then null else has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE') end as authenticated_can_write,
  case when c.oid is null then null else has_table_privilege('service_role',c.oid,'SELECT,INSERT,UPDATE,DELETE') end as server_can_access
from expected e left join pg_class c on c.oid=to_regclass('public.'||e.name);

select to_regprocedure('public.sanctum_kronos_progress(uuid,text,text,bigint,integer,boolean)') is not null as progress_function_exists;
