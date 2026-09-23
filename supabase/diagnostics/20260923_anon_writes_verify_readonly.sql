-- Read-only verification after Phase C. Expected write permissions: false.
select
  c.relname as table_name,
  has_table_privilege('anon', c.oid, 'INSERT') as anon_insert,
  has_table_privilege('anon', c.oid, 'UPDATE') as anon_update,
  has_table_privilege('anon', c.oid, 'DELETE') as anon_delete,
  has_table_privilege('service_role', c.oid, 'INSERT') as service_insert,
  has_table_privilege('service_role', c.oid, 'UPDATE') as service_update,
  has_table_privilege('service_role', c.oid, 'DELETE') as service_delete
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relname in (
    'abyss_reports', 'boards', 'content_power_reqs', 'deep_holes',
    'gnosis_guides', 'guild_settings', 'nexus_banners', 'nexus_contents',
    'nexus_missions', 'nexus_purchases', 'nexus_tasks', 'nexus_titles',
    'nexus_trades', 'notice_comments', 'notices', 'server_events',
    'sync_batches', 'weekly_stat_snapshots', 'nexus_classes'
  )
order by c.relname;
