-- Read-only summary. Returns table names and counts only, never rows or secrets.
select
  count(*) as anon_writable_without_rls_count,
  coalesce(string_agg(c.relname, ', ' order by c.relname), '') as table_names
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'p')
  and not c.relrowsecurity
  and (
    has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE')
  );
