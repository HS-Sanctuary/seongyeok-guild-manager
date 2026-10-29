-- PROPOSAL ONLY. No operational execution or activation authorized.
-- Apply AFTER 20261028_account_online.sql, only after separate schema approval.
-- Target: online connection rows only. Sessions/accounts/activity are never changed.
-- Manual option selected: no cron, endpoint, heartbeat hook or paid service.
-- Optional request-piggyback was rejected for this minimum: a safe cross-instance
-- time gate needs persistent shared state and still costs an extra RPC per attempt.
-- This file creates NO automatic calls, time-based cap, or global storage bound.
-- Without an explicit maintenance invocation physical cleanup is ZERO.
-- Suggested initial cadence for <=40 members: once daily per used environment,
-- one batch first (128 default / 256 maximum); inspect backlog before more calls.
-- Cadence is operational advice, NOT an enforced interval or guaranteed throughput.
-- Run a standalone transaction with caller-side SET LOCAL statement_timeout='5s';
-- SELECT public.sanctum_online_prune('local',128); COMMIT;
-- Never retry in a loop. Investigate timeouts/backlog before an additional call.
-- Preflight: verify sanctum_sessions_expires_at_idx(expires_at), connection PK
-- (environment,token_hash,connection_id), real roles/RLS and EXPLAIN on actual size.
-- Old empty expired sessions can increase candidate reads despite bounded deletes;
-- the existing indexes do NOT imply an absolute read-work/time bound.
-- Each call: <=32 returned expired-session candidates, <=input_batch deletes,
-- indexed session expiry search + per-session connection PK reads, no gate writes.
-- Concurrent UPDATE/READ COMMITTED predicate re-evaluation may lock additional
-- rows that no longer qualify and therefore are not returned by LIMIT 32.
-- An absolute row-lock bound is NOT claimed; actual PG/EPQ behavior is unverified.
-- Execute only as service_role/server maintenance; anon/authenticated denied.
-- Retain ALL closed/sequence markers while their auth session remains valid.
-- Tradeoff: a valid session can reach its existing 256 total-connection cap until
-- logout/fresh login/session expiry. The 8-live / 256-total admission rules remain.
-- Current login creates a fresh token; no expired-token renewal exists in source.
-- If future auth renews/reuses an already expired token AFTER pruning, old markers
-- cannot be reconstructed. Re-review this policy BEFORE introducing that behavior.
-- Concurrent renewal BEFORE pruning locks/commits is skipped or rechecked safely.
begin;

-- Same original touch contract, with ONLY the unsafe own-session 24h DELETE
-- removed. No heartbeat/TTL/snapshot/activity/auth policy or grant changes.
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

create or replace function public.sanctum_online_prune(input_environment text,input_batch integer default 128)
returns jsonb language plpgsql security invoker set search_path=pg_catalog,public
set lock_timeout='1s'
as $$
declare t timestamptz:=clock_timestamp(); candidate record; valid_until timestamptz;
 removed integer:=0; affected integer; examined integer:=0;
begin
 if input_environment is null or input_environment not in ('production','preview','development','local')
 or input_batch is null or input_batch<1 or input_batch>256
 then return jsonb_build_object('status','invalid','deleted',0); end if;
 -- Session -> connection order agrees with existing writer/cascade ordering.
 -- No account lock is needed because no account/session data is mutated.
 -- FOR UPDATE excludes concurrent session renewal/deletion and another cleaner.
 -- SKIP LOCKED avoids row-lock waits on active writers/maintenance. LIMIT caps
 -- returned candidates, not absolute acquired locks or inspected index entries:
 -- concurrent predicate re-evaluation can lock a row omitted from the results.
 -- The deleted-connection count remains bounded by input_batch.
 for candidate in
  select s.token_hash from public.sanctum_sessions s
  where s.expires_at<=t and exists(
   select 1 from public.sanctum_online_connections c
   where c.environment=input_environment and c.token_hash=s.token_hash)
  order by s.expires_at,s.token_hash limit 32 for update of s skip locked
 loop
  exit when removed>=input_batch;
  examined:=examined+1;
  -- A separate statement rechecks after row locking (including READ COMMITTED
  -- predicate re-evaluation after a concurrent update). Session lock stays held.
  select s.expires_at into valid_until from public.sanctum_sessions s where s.token_hash=candidate.token_hash;
  if not found or valid_until>t then continue; end if;
  with batch as materialized(
   select c.environment,c.token_hash,c.connection_id
   from public.sanctum_online_connections c
   where c.environment=input_environment and c.token_hash=candidate.token_hash
   order by c.connection_id limit (input_batch-removed) for update of c skip locked
  )
  delete from public.sanctum_online_connections c using batch b
  where c.environment=b.environment and c.token_hash=b.token_hash and c.connection_id=b.connection_id;
  get diagnostics affected=row_count;
  removed:=removed+affected;
 end loop;
 return jsonb_build_object('status','completed','deleted',removed,'sessions',examined);
end; $$;
revoke all on function public.sanctum_online_prune(text,integer) from public,anon,authenticated;
grant execute on function public.sanctum_online_prune(text,integer) to service_role;
commit;
-- On statement failure/cancel, both connection deletes and locks roll back.
-- Rollback plan: disable flag first; stop explicit maintenance calls. Preserve
-- rows and keep safer touch marker retention; do NOT restore the unsafe 24h DELETE.
-- No DROP/TRUNCATE/session mutation, auth expiry changes or routine VACUUM FULL.
-- DELETE makes tuples reusable after normal autovacuum; it does not promise an
-- immediate physical file-size reduction. Backlog/lock/plan monitoring is required.
