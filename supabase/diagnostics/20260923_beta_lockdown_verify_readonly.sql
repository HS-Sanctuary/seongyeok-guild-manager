-- Final beta gate. Read-only; returns no account rows, codes, or user content.
-- Expected: both writable counts = 0; all can_read_* = false.
select
  count(*) filter (where
    has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE')
  ) as anon_writable_table_count,
  count(*) filter (where
    has_table_privilege('authenticated', c.oid, 'INSERT')
    or has_table_privilege('authenticated', c.oid, 'UPDATE')
    or has_table_privilege('authenticated', c.oid, 'DELETE')
  ) as authenticated_writable_table_count,
  coalesce(string_agg(c.relname, ', ' order by c.relname) filter (where
    has_table_privilege('anon', c.oid, 'INSERT')
    or has_table_privilege('anon', c.oid, 'UPDATE')
    or has_table_privilege('anon', c.oid, 'DELETE')
  ), '') as anon_writable_tables,
  has_column_privilege('anon', 'public.accounts', 'code', 'SELECT') as can_read_account_code,
  has_column_privilege('anon', 'public.accounts', 'code_hash', 'SELECT') as can_read_account_hash,
  has_table_privilege('anon', 'public.inquiries', 'SELECT') as can_read_private_inquiries
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p');
