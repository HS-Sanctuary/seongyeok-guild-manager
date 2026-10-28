-- PROPOSAL ONLY / 미적용. Do not run before Hanseol's explicit DB approval.
-- New aggregate: at most one row per account. No history/backfill, triggers,
-- session timestamps, characters, account rows, or existing policies are changed.
-- Preflight (read-only, after approval): confirm accounts.id UUID PK,
-- accounts.status/role text-compatible, sanctum_sessions token_hash unique,
-- expires_at timestamptz, service_role BYPASSRLS + SELECT/row-lock permissions.
-- Confirm no incompatible objects with these names before running this transaction.
-- Enable SANCTUM_ACCOUNT_ACTIVITY_ENABLED=true only after approved apply,
-- privilege/RLS checks, session denial + 20-minute multi-device SQL verification.
-- Rollback: first disable the flag in every deployed web/IRIS server instance.
-- Revoke RPC execution only after callers are disabled; preserve aggregate rows.
-- Never drop/overwrite this aggregate as routine rollback or backfill guessed times.

begin;

create table if not exists public.sanctum_account_activity (
  account_id uuid primary key references public.accounts(id) on delete cascade,
  last_active_at timestamptz not null
);
alter table public.sanctum_account_activity enable row level security;
-- Reset possible default grants too: GRANT alone does not remove extra rights.
revoke all on public.sanctum_account_activity from public, anon, authenticated, service_role;
grant select, insert, update on public.sanctum_account_activity to service_role;

create or replace function public.sanctum_touch_account_activity(
  input_token_hash text,
  input_expected_account_id text
)
returns jsonb
language plpgsql
security invoker
set search_path = pg_catalog, public
as $$
declare
  session_account_id uuid;
  session_expires_at timestamptz;
  expected_id uuid;
  write_time timestamptz;
  recorded_time timestamptz;
begin
  if input_token_hash is null or input_token_hash !~ '^[0-9a-f]{64}$'
    or input_expected_account_id is null
    or input_expected_account_id !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('status', 'unauthorized');
  end if;
  expected_id := input_expected_account_id::uuid;

  -- Discover the owner without a row lock, then explicitly lock account before
  -- session, matching account deletion/code-change and the FK cascade order.
  -- This lookup alone is NOT authorization: both rows are validated below.
  select s.account_id into session_account_id
  from public.sanctum_sessions as s
  where s.token_hash = input_token_hash;
  if session_account_id is null then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  perform a.id from public.accounts as a
  where a.id = session_account_id and a.status = '승인'
    and a.role is not null and a.role not in ('승인대기', 'pending')
  for share of a;
  if not found then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  -- Re-read after the account wait: logout/revocation/owner changes between
  -- discovery and this lock must not authorize a write from the earlier row.
  select s.expires_at into session_expires_at
  from public.sanctum_sessions as s
  where s.token_hash = input_token_hash and s.account_id = session_account_id
  for share of s;
  if not found or session_expires_at <= clock_timestamp() then
    return jsonb_build_object('status', 'unauthorized');
  end if;
  if session_account_id <> expected_id then
    return jsonb_build_object('status', 'conflict');
  end if;

  -- Every writer uses the same transaction lock, including the first insert
  -- where no aggregate row yet exists. A hash collision only serializes unrelated
  -- accounts; it cannot grant ownership. No session expiry is extended.
  perform pg_advisory_xact_lock(hashtextextended(session_account_id::text, 0));
  -- Recheck expiry after ALL lock waits using DB time, not transaction now().
  write_time := clock_timestamp();
  if session_expires_at <= write_time then
    return jsonb_build_object('status', 'unauthorized');
  end if;

  -- Unique account key serializes simultaneous web/IRIS devices; PostgreSQL
  -- evaluates this condition against the conflicting locked row. No append log.
  insert into public.sanctum_account_activity as activity (account_id, last_active_at)
  values (session_account_id, write_time)
  on conflict (account_id) do update
    set last_active_at = greatest(activity.last_active_at, excluded.last_active_at)
    where activity.last_active_at <= excluded.last_active_at - interval '20 minutes'
  returning last_active_at into recorded_time;

  if recorded_time is not null then
    return jsonb_build_object('status', 'recorded', 'accountId', session_account_id, 'lastActiveAt', recorded_time);
  end if;
  select last_active_at into recorded_time
  from public.sanctum_account_activity where account_id = session_account_id;
  return jsonb_build_object('status', 'throttled', 'accountId', session_account_id, 'lastActiveAt', recorded_time);
end;
$$;

revoke all on function public.sanctum_touch_account_activity(text, text) from public, anon, authenticated;
grant execute on function public.sanctum_touch_account_activity(text, text) to service_role;

commit;

-- Post-approval verification must inspect actual RLS/grants/EXECUTE and exercise:
-- missing/expired/revoked/pending session => unauthorized and zero writes;
-- cookie B + expected A => conflict and zero writes; repeated + parallel valid
-- sessions => one account row, <=1 changed time per 20 minutes across devices;
-- DB-clock rollback => never decreasing; account deletion cascades only its row.
-- Concurrent activity + account deletion/code-change must not invert row locks;
-- logout or session owner replacement during discovery must deny stale writes.
-- Actual PostgreSQL concurrency/runtime validation has NOT been executed.
