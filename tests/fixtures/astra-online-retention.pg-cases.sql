\set ON_ERROR_STOP on
-- Actual PG assertions, intentionally NOT claimed executed without psql output.
begin;
set local statement_timeout='5s';
do $$
begin
 if current_user<>'astra_fixture_admin' or current_database()<>'astra_validation'
 or current_setting('astra.validation_mode',true) is distinct from 'isolated'
 or to_regclass('astra_fixture_guard.marker') is null
 then raise exception 'owned isolated synthetic fixture required'; end if;
end; $$;
-- Reproduce the existing auth migration index omitted by the tiny bootstrap.
create index if not exists sanctum_sessions_expires_at_idx on public.sanctum_sessions(expires_at);
delete from public.sanctum_online_connections;
insert into public.sanctum_online_connections
select 'local',repeat('a',64),md5('valid'||i)::uuid,'web',100,i=1,
 clock_timestamp()-interval '1 hour',clock_timestamp()-interval '25 hours'
from generate_series(1,2)i;
insert into public.sanctum_online_connections
select 'local',repeat('e',64),md5('expired'||i)::uuid,'web',100,true,
 clock_timestamp(),clock_timestamp() from generate_series(1,300)i;
insert into public.sanctum_online_connections
values('preview',repeat('e',64),md5('preview')::uuid,'iris',1,true,clock_timestamp(),clock_timestamp());
set local role service_role;
do $$
declare r jsonb; before_sessions jsonb; before_activity jsonb;
begin
 select jsonb_agg(to_jsonb(s) order by token_hash) into before_sessions from public.sanctum_sessions s;
 select jsonb_agg(to_jsonb(a) order by account_id) into before_activity from public.sanctum_account_activity a;
 foreach r in array array[
  public.sanctum_online_prune('local',0),public.sanctum_online_prune('local',257),
  public.sanctum_online_prune('local',null),public.sanctum_online_prune(null,128),
  public.sanctum_online_prune('invalid',128)
 ] loop if r<>jsonb_build_object('status','invalid','deleted',0) then raise exception 'invalid input mutated policy'; end if; end loop;
 if (select count(*) from public.sanctum_online_connections)<>303 then raise exception 'invalid call deleted rows'; end if;
 r:=public.sanctum_online_prune('local');
 if r->>'status'<>'completed' or (r->>'deleted')::integer<>128 then raise exception 'default batch not bounded: %',r; end if;
 r:=public.sanctum_online_prune('local',256);
 if (r->>'deleted')::integer<>172 then raise exception 'remaining batch wrong: %',r; end if;
 if (select count(*) from public.sanctum_online_connections where token_hash=repeat('a',64))<>2 then raise exception 'valid markers removed'; end if;
 if (select count(*) from public.sanctum_online_connections where environment='preview')<>1 then raise exception 'cross environment deletion'; end if;
 if before_sessions is distinct from(select jsonb_agg(to_jsonb(s) order by token_hash) from public.sanctum_sessions s)
 or before_activity is distinct from(select jsonb_agg(to_jsonb(a) order by account_id) from public.sanctum_account_activity a)
 then raise exception 'auth/activity data mutated'; end if;
 r:=public.sanctum_online_touch(repeat('a',64),'11111111-1111-4111-8111-111111111111',md5('valid1')::uuid,101,'web','touch','local');
 if r->>'status'<>'closed' then raise exception 'closed marker resurrected'; end if;
 r:=public.sanctum_online_touch(repeat('a',64),'11111111-1111-4111-8111-111111111111',md5('valid2')::uuid,2,'web','touch','local');
 if r->>'status'<>'stale' then raise exception 'highest sequence lost'; end if;
 r:=public.sanctum_online_touch(repeat('e',64),'11111111-1111-4111-8111-111111111111',md5('expired1')::uuid,101,'web','touch','local');
 if r->>'status'<>'unauthorized' then raise exception 'expired token replay admitted'; end if;
end; $$;
reset role;
delete from public.sanctum_online_connections;
insert into public.sanctum_sessions
select md5('retention'||i)||md5('token'||i),'11111111-1111-4111-8111-111111111111',clock_timestamp()-interval '2 days'
from generate_series(1,40)i;
insert into public.sanctum_online_connections
select 'local',md5('retention'||i)||md5('token'||i),md5('connection'||i)::uuid,'iris',1,true,clock_timestamp(),clock_timestamp()
from generate_series(1,40)i;
set local role service_role;
do $$
declare r jsonb;
begin
 r:=public.sanctum_online_prune('local',256);
 if (r->>'deleted')::integer<>32 or (r->>'sessions')::integer<>32 then raise exception 'returned session candidate batch exceeded or under-filled: %',r; end if;
 if (select count(*) from public.sanctum_online_connections)<>8 then raise exception 'session batch not bounded'; end if;
end; $$;
reset role;
delete from public.sanctum_online_connections;
insert into public.sanctum_online_connections
select 'local',repeat('a',64),md5('quota'||i)::uuid,'web',1,true,clock_timestamp(),clock_timestamp()-interval '25 hours'
from generate_series(1,256)i;
set local role service_role;
do $$
declare r jsonb;
begin
 r:=public.sanctum_online_prune('local',256);
 if (r->>'deleted')::integer<>0 then raise exception 'valid quota markers removed'; end if;
 r:=public.sanctum_online_touch(repeat('a',64),'11111111-1111-4111-8111-111111111111',md5('newquota')::uuid,1,'web','touch','local');
 if r->>'status'<>'limit' then raise exception '256 total connection limit changed'; end if;
end; $$;
reset role;
commit;
