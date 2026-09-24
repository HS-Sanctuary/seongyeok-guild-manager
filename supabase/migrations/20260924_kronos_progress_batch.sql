-- Apply only after the previous Kronos workspace migration and a recent backup.
-- Allows one atomic request to mark several purchases complete, including MAX.
-- Existing progress rows and catalog data are preserved. The server still checks character ownership.
begin;
create or replace function public.sanctum_kronos_progress(p_account uuid, p_character text, p_kind text, p_item bigint, p_delta integer, p_bookmarked boolean default null)
returns setof public.kronos_progress language plpgsql security definer
set search_path = pg_catalog, public as $$
declare v_max integer; v_cycle text := '주간'; v_scope text := '캐릭당'; v_character text := p_character; v_period timestamptz;
begin
  if p_delta not between -9999 and 9999 or not exists (
    select 1 from public.characters c join public.accounts a on a.nickname = c.owner
    where a.id = p_account and c.nickname = p_character
  ) then raise exception '캐릭터 수정 권한이 없습니다.'; end if;
  if p_kind = 'shop' then
    select s."limit", s.reset_type, s.scope into v_max, v_cycle, v_scope from public.kronos_shop_items s where s.id = p_item and s.is_active;
  elsif p_kind = 'mission' then
    select m.max_count into v_max from public.kronos_missions m where m.id = p_item and m.is_active;
  end if;
  if v_max is null then raise exception '활성 항목을 찾을 수 없습니다.'; end if;
  if v_scope = '계정당' then v_character := null; end if;
  v_period := (date_trunc(case when v_cycle = '일간' then 'day' else 'week' end, (now() at time zone 'Asia/Seoul') - interval '6 hours') + interval '6 hours') at time zone 'Asia/Seoul';
  return query insert into public.kronos_progress as old (account_id, character_name, kind, item_id, period_start, count, bookmarked)
    values (p_account, v_character, p_kind, p_item, v_period, greatest(0, least(v_max, p_delta)), coalesce(p_bookmarked, false))
    on conflict (account_id, target_key, kind, item_id) do update set
      count = greatest(0, least(v_max, (case when old.period_start = v_period then old.count else 0 end) + p_delta)),
      period_start = v_period, bookmarked = coalesce(p_bookmarked, old.bookmarked)
    returning *;
end;
$$;
revoke all on function public.sanctum_kronos_progress(uuid,text,text,bigint,integer,boolean) from public, anon, authenticated;
grant execute on function public.sanctum_kronos_progress(uuid,text,text,bigint,integer,boolean) to service_role;
notify pgrst, 'reload schema';
commit;
