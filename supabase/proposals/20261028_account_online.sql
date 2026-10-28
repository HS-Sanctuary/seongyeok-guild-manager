-- PROPOSAL ONLY. 승인 전 적용 금지. Existing activity aggregate is independent.
-- Preflight: verify sessions.token_hash unique + FK type, accounts approval fields,
-- actual service_role grants/RLS, query plans/lock contention and timeout support.
-- Scope is server deployment identity, never accepted from browser/native payload.
-- Enable SANCTUM_ACCOUNT_ONLINE_ENABLED only after approved PG + install verification.
begin;
create table if not exists public.sanctum_online_connections (
 environment text not null check(environment in ('production','preview','development','local')),
 token_hash text not null references public.sanctum_sessions(token_hash) on delete cascade,
 connection_id uuid not null,
 kind text not null check(kind in ('web','iris')),
 sequence integer not null check(sequence>0),
 closed boolean not null default false,
 expires_at timestamptz not null,
 updated_at timestamptz not null,
 primary key(environment,token_hash,connection_id)
);
create index if not exists sanctum_online_expiry on public.sanctum_online_connections(environment,expires_at);
alter table public.sanctum_online_connections enable row level security;
revoke all on public.sanctum_online_connections from public,anon,authenticated,service_role;
grant select,insert,update,delete on public.sanctum_online_connections to service_role;

create or replace function public.sanctum_online_touch(
 input_token_hash text,input_expected_account_id text,input_connection_id uuid,
 input_sequence integer,input_kind text,input_action text,input_environment text
) returns jsonb language plpgsql security invoker set search_path=pg_catalog,public
as $$
declare owner_id uuid; valid_until timestamptz; t timestamptz; old_row public.sanctum_online_connections%rowtype; expiry timestamptz; was_closed boolean;
begin
 if input_token_hash is null or input_token_hash !~ '^[0-9a-f]{64}$'
 or input_connection_id is null or input_sequence is null or input_sequence<1
 or input_kind is null or input_kind not in ('web','iris')
 or input_action is null or input_action not in ('touch','leave')
 or input_environment is null or input_environment not in ('production','preview','development','local')
 or (input_kind='web' and input_expected_account_id is null)
 or (input_expected_account_id is not null and input_expected_account_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
 then return jsonb_build_object('status','unauthorized'); end if;
 perform set_config('lock_timeout','3s',true);
 -- Discover without lock; authorize again after approved account->session locks.
 select s.account_id into owner_id from public.sanctum_sessions s where s.token_hash=input_token_hash;
 if owner_id is null then return jsonb_build_object('status','unauthorized'); end if;
 perform a.id from public.accounts a where a.id=owner_id and a.status='승인' and a.role is not null and a.role not in ('pending','승인대기') for share of a;
 if not found then return jsonb_build_object('status','unauthorized'); end if;
 select s.expires_at into valid_until from public.sanctum_sessions s where s.token_hash=input_token_hash and s.account_id=owner_id for share of s;
 if not found or valid_until<=clock_timestamp() then return jsonb_build_object('status','unauthorized'); end if;
 if input_expected_account_id is not null and owner_id<>input_expected_account_id::uuid then return jsonb_build_object('status','conflict'); end if;
 perform pg_advisory_xact_lock(hashtextextended(input_environment||input_token_hash,1));
 t:=clock_timestamp();
 if valid_until<=t then return jsonb_build_object('status','unauthorized'); end if;
 -- Tombstones outlive the maximum request timeout by a day, no periodic job.
 -- A bounded live/total limit prevents generating arbitrary rows on one session.
 delete from public.sanctum_online_connections c where c.environment=input_environment and c.token_hash=input_token_hash and c.updated_at<t-interval '1 day';
 select * into old_row from public.sanctum_online_connections c where c.environment=input_environment and c.token_hash=input_token_hash and c.connection_id=input_connection_id;
 if found then
  if old_row.kind<>input_kind then return jsonb_build_object('status','conflict'); end if;
  if old_row.closed or old_row.sequence>=input_sequence then
   return jsonb_build_object('status',case when old_row.closed then 'closed' else 'stale' end,'accountId',owner_id,'sequence',input_sequence,'expiresAt',case when old_row.closed then null else old_row.expires_at end);
  end if;
 else
  if (select count(*) from public.sanctum_online_connections c where c.environment=input_environment and c.token_hash=input_token_hash)>=256
  or (input_action='touch' and (select count(*) from public.sanctum_online_connections c where c.environment=input_environment and c.token_hash=input_token_hash and not c.closed and c.expires_at>t)>=8)
  then return jsonb_build_object('status','limit'); end if;
 end if;
 was_closed:=input_action='leave';
 expiry:=least(valid_until,t+interval '12 minutes');
 insert into public.sanctum_online_connections as c(environment,token_hash,connection_id,kind,sequence,closed,expires_at,updated_at)
 values(input_environment,input_token_hash,input_connection_id,input_kind,input_sequence,was_closed,case when was_closed then t else expiry end,t)
 on conflict(environment,token_hash,connection_id) do update set sequence=excluded.sequence,closed=excluded.closed,expires_at=excluded.expires_at,updated_at=excluded.updated_at;
 return jsonb_build_object('status',case when was_closed then 'closed' else 'recorded' end,'accountId',owner_id,'sequence',input_sequence,'expiresAt',case when was_closed then null else expiry end);
end; $$;

create or replace function public.sanctum_online_snapshot(input_token_hash text,input_environment text)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public as $$
declare response jsonb;
begin
 if input_token_hash is null or input_token_hash !~ '^[0-9a-f]{64}$' or input_environment is null or input_environment not in ('production','preview','development','local') then return jsonb_build_object('status','unauthorized'); end if;
 -- A single statement snapshot covers auth, clock and rows. Do not sample t in
 -- a previous statement: a later committed touch may otherwise exceed t+TTL.
 with moment as materialized(select clock_timestamp() as at),
 viewer as materialized(
  select s.account_id from public.sanctum_sessions s join public.accounts a on a.id=s.account_id cross join moment m
  where s.token_hash=input_token_hash and s.expires_at>m.at and a.status='승인' and a.role is not null and a.role not in ('pending','승인대기')
 ),
 leases as(
  select s.account_id,max(least(c.expires_at,s.expires_at)) as expires_at
  from public.sanctum_online_connections c join public.sanctum_sessions s on s.token_hash=c.token_hash join public.accounts a on a.id=s.account_id cross join moment m
  where c.environment=input_environment and not c.closed and c.expires_at>m.at and s.expires_at>m.at and a.status='승인' and a.role is not null and a.role not in ('pending','승인대기')
  group by s.account_id
 )
 select case when exists(select 1 from viewer) then
  jsonb_build_object('enabled',true,'viewerId',(select account_id from viewer),'observedAt',m.at,
   'accounts',(select coalesce(jsonb_agg(jsonb_build_object('accountId',account_id,'expiresAt',expires_at)),'[]'::jsonb) from leases))
 else jsonb_build_object('status','unauthorized') end into response from moment m;
 return response;
end; $$;
revoke all on function public.sanctum_online_touch(text,text,uuid,integer,text,text,text) from public,anon,authenticated;
revoke all on function public.sanctum_online_snapshot(text,text) from public,anon,authenticated;
grant execute on function public.sanctum_online_touch(text,text,uuid,integer,text,text,text) to service_role;
grant execute on function public.sanctum_online_snapshot(text,text) to service_role;
commit;
-- Post-approval: test active/pending/revoked/expired auth, parallel close/touch,
-- same token multiple connections, separate sessions, cleanup/quota, lock waits,
-- account/session cascade/revocation, environment isolation, EXPLAIN and grants.
-- Retention is per session: expired sessions that never reconnect are NOT globally
-- pruned by this proposal. Review bounded stale-session/lease cleanup before
-- activation; logout/FK cascade alone does not prove a global storage bound.
-- DB time is authoritative. No recent activity/last_seen writes/triggers/backfill.
-- Rollback: disable flag everywhere first. Preserve rows, no routine DROP.
