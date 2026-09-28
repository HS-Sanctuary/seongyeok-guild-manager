-- Read-only verification after the weekly shop catalog insert.
-- Compare shop_rows_after to the preflight count; expected increase is 127 when Alvin's sandpaper existed.
select
  (select count(*) from public.kronos_shop_items) as shop_rows_after,
  (select count(*) from public.kronos_shop_items
   where map = '두갈드아일' and npc = '앨빈' and reward = '사포') as alvin_sandpaper_rows,
  (select count(*) from (
     select map, npc, reward from public.kronos_shop_items
     group by map, npc, reward having count(*) > 1
   ) duplicates) as duplicate_item_keys,
  (select relrowsecurity from pg_class where oid = 'public.kronos_shop_items'::regclass) as rls_enabled,
  has_table_privilege('anon', 'public.kronos_shop_items', 'SELECT') as anon_can_select,
  has_table_privilege('anon', 'public.kronos_shop_items', 'INSERT') as anon_can_insert;
