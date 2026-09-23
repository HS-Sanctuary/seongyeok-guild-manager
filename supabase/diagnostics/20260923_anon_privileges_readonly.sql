-- Read-only preflight for the beta security cutover.
-- No account rows, codes, or API keys are returned.
select
  c.relname as table_name,
  c.relrowsecurity as rls_enabled,
  has_table_privilege('anon', c.oid, 'SELECT') as anon_select,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
  has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
  (select count(*) from pg_policy p where p.polrelid = c.oid) as policy_count
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind in ('r', 'p')
order by c.relname;

select
  has_column_privilege('anon', 'public.accounts', 'code', 'SELECT') as anon_can_read_account_code,
  has_column_privilege('anon', 'public.accounts', 'code_hash', 'SELECT') as anon_can_read_account_hash;
