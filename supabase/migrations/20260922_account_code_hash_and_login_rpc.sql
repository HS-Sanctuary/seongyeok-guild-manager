-- SANCTUM 계정 보안 1차: 접속 코드를 bcrypt 해시로 전환하고,
-- 브라우저가 accounts.code를 직접 읽지 않는 로그인 RPC를 제공한다.
-- 실행 전 Supabase Database Backup을 만든다.

create extension if not exists pgcrypto;

alter table public.accounts
  add column if not exists code_hash text;

update public.accounts
set code_hash = crypt(code, gen_salt('bf', 12))
where code_hash is null
  and code is not null
  and length(code) > 0;

create or replace function public.sanctum_verify_login(input_nickname text, input_code text)
returns table (id uuid, nickname text, role text, status character varying)
language plpgsql
security definer
set search_path = public
as $$
begin
  return query
  select a.id, a.nickname, a.role, a.status
  from public.accounts a
  where a.nickname = trim(input_nickname)
    and a.code_hash = crypt(input_code, a.code_hash)
  limit 1;
end;
$$;

revoke all on function public.sanctum_verify_login(text, text) from public;
grant execute on function public.sanctum_verify_login(text, text) to anon, authenticated;

comment on column public.accounts.code_hash is 'bcrypt 접속 코드 해시. 코드 평문은 마이그레이션 검증 후 별도 제거한다.';

-- 신규 가입도 브라우저에서 평문 코드를 accounts 테이블에 쓰지 않도록 처리한다.
create or replace function public.sanctum_request_join(input_nickname text, input_code text)
returns table (id uuid, nickname text, role text, status character varying)
language plpgsql
security definer
set search_path = public
as $$
declare
  clean_nickname text := trim(input_nickname);
begin
  if clean_nickname = '' or length(input_code) < 6 then
    raise exception '가입 정보가 올바르지 않습니다.';
  end if;

  insert into public.accounts (nickname, code_hash, role, status)
  values (
    clean_nickname,
    crypt(input_code, gen_salt('bf', 12)),
    '승인대기',
    '승인대기'
  )
  returning accounts.id, accounts.nickname, accounts.role, accounts.status
  into id, nickname, role, status;

  return next;
exception
  when unique_violation then
    raise exception '이미 등록된 대표 캐릭터 닉네임입니다.';
end;
$$;

revoke all on function public.sanctum_request_join(text, text) from public;
grant execute on function public.sanctum_request_join(text, text) to anon, authenticated;

-- 세션 원문 토큰은 브라우저의 HttpOnly 쿠키에만 존재하고 DB에는 SHA-256 해시만 저장한다.
create table if not exists public.sanctum_sessions (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create index if not exists sanctum_sessions_account_id_idx
  on public.sanctum_sessions (account_id);
create index if not exists sanctum_sessions_expires_at_idx
  on public.sanctum_sessions (expires_at);

alter table public.sanctum_sessions enable row level security;

comment on table public.sanctum_sessions is 'SANCTUM 웹 로그인용 서버 세션. service role API만 접근한다.';
