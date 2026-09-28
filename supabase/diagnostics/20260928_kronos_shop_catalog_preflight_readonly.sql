-- Read-only baseline before applying the weekly shop catalog. Does not expose account data.
select count(*) as shop_rows_before, coalesce(max(id), 0) as max_shop_id_before,
  count(*) filter (where map = '두갈드아일' and npc = '앨빈' and reward = '사포') as alvin_sandpaper_rows
from public.kronos_shop_items;
