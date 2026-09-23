-- Read-only check after Phase D. All can_* values should be false for anon.
select table_name,
  has_table_privilege('anon', format('public.%I', table_name), 'INSERT') as anon_insert,
  has_table_privilege('anon', format('public.%I', table_name), 'UPDATE') as anon_update,
  has_table_privilege('anon', format('public.%I', table_name), 'DELETE') as anon_delete,
  case when table_name = 'inquiries'
    then has_table_privilege('anon', format('public.%I', table_name), 'SELECT')
    else null
  end as anon_select_private
from (values ('characters'), ('parties'), ('inquiries'), ('activity_logs'), ('lounge_posts')) as t(table_name)
order by table_name;
