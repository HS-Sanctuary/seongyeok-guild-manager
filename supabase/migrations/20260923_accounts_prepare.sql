-- Phase A (additive): prepare server-side account authentication while the
-- existing site remains usable. Run only after a production backup and approval.
-- This file deliberately does NOT revoke any existing account grants.

begin;

create extension if not exists pgcrypto;

alter table public.accounts add column if not exists code_hash text;

update public.accounts
set code_hash = crypt(code, gen_salt('bf', 12))
where code is not null and length(code) > 0;

-- While the old site is still live, new direct signups must also get a hash.
create or replace function public.sanctum_hash_legacy_code()
returns trigger
language plpgsql
set search_path = pg_catalog, extensions, public
as $$
begin
  if new.code is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.code_hash := crypt(new.code, gen_salt('bf', 12));
  elsif new.code_hash is null or new.code is distinct from old.code then
    new.code_hash := crypt(new.code, gen_salt('bf', 12));
  end if;
  return new;
end;
$$;
drop trigger if exists sanctum_hash_legacy_code_trigger on public.accounts;
create trigger sanctum_hash_legacy_code_trigger
before insert or update of code on public.accounts
for each row execute function public.sanctum_hash_legacy_code();

create table if not exists public.sanctum_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sanctum_sessions_account_id_idx on public.sanctum_sessions (account_id);
create index if not exists sanctum_sessions_expires_at_idx on public.sanctum_sessions (expires_at);
alter table public.sanctum_sessions enable row level security;
revoke all on public.sanctum_sessions from public, anon, authenticated;
grant all on public.sanctum_sessions to service_role;

-- Server-side, persistent login attempt limit (the browser cooldown is cosmetic).
create table if not exists public.sanctum_login_attempts (
  nickname text primary key,
  window_started_at timestamptz not null default now(),
  attempts integer not null default 0
);
alter table public.sanctum_login_attempts enable row level security;
revoke all on public.sanctum_login_attempts from public, anon, authenticated;
grant all on public.sanctum_login_attempts to service_role;

create or replace function public.sanctum_allow_login_attempt(input_nickname text)
returns boolean
language sql security definer
set search_path = pg_catalog, public
as $$
  with bumped as (
    insert into public.sanctum_login_attempts as existing (nickname, window_started_at, attempts)
    values (lower(btrim(input_nickname)), now(), 1)
    on conflict (nickname) do update set
      attempts = case when existing.window_started_at < now() - interval '15 minutes'
        then 1 else least(existing.attempts + 1, 100000) end,
      window_started_at = case when existing.window_started_at < now() - interval '15 minutes'
        then now() else existing.window_started_at end
    returning attempts
  )
  select attempts <= 20 from bumped;
$$;
revoke all on function public.sanctum_allow_login_attempt(text) from public, anon, authenticated;
grant execute on function public.sanctum_allow_login_attempt(text) to service_role;

create or replace function public.sanctum_verify_login(input_nickname text, input_code text)
returns table (id uuid, nickname text, role text, status character varying)
language plpgsql security definer
set search_path = pg_catalog, extensions, public
as $$
begin
  return query
  select a.id, a.nickname, a.role, a.status
  from public.accounts a
  where a.nickname = btrim(input_nickname)
    and a.code_hash is not null
    and a.code_hash = crypt(input_code, a.code_hash)
  limit 1;
end;
$$;

create or replace function public.sanctum_register_account(
  input_nickname text,
  input_code text,
  input_job text,
  input_combat_power text,
  input_magic_resistance text
)
returns table (id uuid, nickname text, role text, status character varying)
language plpgsql security definer
set search_path = pg_catalog, extensions, public
as $$
declare
  clean_nickname text := btrim(input_nickname);
  created_id uuid;
begin
  if clean_nickname = '' or length(clean_nickname) > 12 or length(input_code) < 6 then
    raise exception '가입 정보가 올바르지 않습니다.';
  end if;

  -- Retain legacy code during the staged cutover so rollback to v1.95 still works.
  -- Remove it only in a separately approved post-beta rotation migration.
  insert into public.accounts (nickname, code, code_hash, role, status)
  values (clean_nickname, input_code, crypt(input_code, gen_salt('bf', 12)), '승인대기', '승인대기')
  returning accounts.id into created_id;

  insert into public.characters (owner, nickname, job, combat_power, magic_resistance, is_main)
  values (clean_nickname, clean_nickname, input_job, input_combat_power, input_magic_resistance, true);

  return query
  select a.id, a.nickname, a.role, a.status from public.accounts a where a.id = created_id;
end;
$$;

revoke all on function public.sanctum_verify_login(text, text) from public, anon, authenticated;
grant execute on function public.sanctum_verify_login(text, text) to service_role;
revoke all on function public.sanctum_register_account(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.sanctum_register_account(text, text, text, text, text) to service_role;

commit;
