\set ON_ERROR_STOP on
begin;
-- UNEXECUTED PostgreSQL suite. No synthetic PASS claims without actual psql output.
do $$
begin
 if current_user<>'astra_fixture_admin' or current_database()<>'astra_validation' or current_setting('astra.validation_mode',true) is distinct from 'isolated'
 then raise exception 'isolated fixture required'; end if;
 if to_regclass('astra_fixture_guard.marker') is null then raise exception 'synthetic bootstrap marker missing'; end if;
 if not exists(select 1 from astra_fixture_guard.marker where kind='synthetic-empty-cluster') then raise exception 'synthetic marker mismatch'; end if;
 if not (select relrowsecurity from pg_class where oid='public.sanctum_online_connections'::regclass) then raise exception 'RLS missing'; end if;
 if has_table_privilege('anon','public.sanctum_online_connections','select')
 or has_table_privilege('authenticated','public.sanctum_online_connections','insert')
 or has_function_privilege('anon','public.sanctum_online_snapshot(text,text)','execute')
 then raise exception 'public access unexpectedly granted'; end if;
end; $$;
set local role service_role;
do $$
declare a text:='11111111-1111-4111-8111-111111111111'; b text:='22222222-2222-4222-8222-222222222222';
 c1 uuid:='00000001-1111-4111-8111-111111111111'; c2 uuid:='00000002-1111-4111-8111-111111111111';
 r jsonb; before_count integer;
begin
 select count(*) into before_count from public.sanctum_online_connections;
 foreach r in array array[
  public.sanctum_online_touch(repeat('b',64),a,c1,1,'web','touch','local'),
  public.sanctum_online_touch(repeat('d',64),null,c1,1,'iris','touch','local'),
  public.sanctum_online_touch(repeat('e',64),a,c1,1,'web','touch','local')
 ] loop if r->>'status' not in ('unauthorized','conflict') then raise exception 'unsafe authentication'; end if; end loop;
 if (select count(*) from public.sanctum_online_connections)<>before_count then raise exception 'denied request wrote data'; end if;
 r:=public.sanctum_online_touch(repeat('a',64),a,c1,1,'web','touch','local');
 if r->>'status'<>'recorded' then raise exception 'initial touch rejected'; end if;
 r:=public.sanctum_online_touch(repeat('c',64),a,c2,1,'web','touch','local');
 r:=public.sanctum_online_snapshot(repeat('a',64),'local');
 if jsonb_array_length(r->'accounts')<>1 then raise exception 'same account counted twice'; end if;
 r:=public.sanctum_online_touch(repeat('a',64),a,c1,2,'web','leave','local');
 r:=public.sanctum_online_touch(repeat('a',64),a,c1,99,'web','touch','local');
 if r->>'status'<>'closed' then raise exception 'late heartbeat resurrected close'; end if;
 r:=public.sanctum_online_snapshot(repeat('c',64),'local');
 if jsonb_array_length(r->'accounts')<>1 then raise exception 'other device lost online'; end if;
 r:=public.sanctum_online_touch(repeat('c',64),a,c2,2,'web','leave','local');
 r:=public.sanctum_online_snapshot(repeat('a',64),'local');
 if jsonb_array_length(r->'accounts')<>0 then raise exception 'last connection did not close'; end if;
 r:=public.sanctum_online_snapshot(repeat('a',64),'production');
 if jsonb_array_length(r->'accounts')<>0 then raise exception 'environment mixed'; end if;
end; $$;
reset role;
-- Remaining mandatory, separate two-connection phase:
-- hold account/session/advisory locks with an owned transaction, signal a barrier
-- from psql, then commit late touch / leave in opposite orders. No sleep/retry loop.
-- Verify session expiry/revocation, 720s lease boundary, 8/256 admission/cleanup,
-- single-statement snapshot under concurrent commit, independent activity table.
-- These checks are described in ASTRA_ONLINE_VALIDATION_20261028.md.

commit;
