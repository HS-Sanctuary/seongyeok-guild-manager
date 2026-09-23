-- Phase B: run ONLY after Phase A, the server key, deployed server login/join
-- paths, and real login/join/admin checks have all passed. Requires separate approval.
-- No account rows or existing codes are deleted by this file.

begin;

do $$
begin
  if to_regclass('public.sanctum_sessions') is null then
    raise exception 'Phase A session table is missing';
  end if;
  if exists (
    select 1 from public.accounts
    where role not in ('승인대기', '가입대기') and code_hash is null
  ) then
    raise exception 'An approved account has no code hash';
  end if;
end;
$$;

revoke all on public.accounts from public, anon, authenticated;
grant all on public.accounts to service_role;

drop policy if exists "Allow public delete access for accounts" on public.accounts;
drop policy if exists "Allow public read access for accounts" on public.accounts;
drop policy if exists "Allow public update access for accounts" on public.accounts;
drop policy if exists "Enable access for all on accounts" on public.accounts;

revoke all on public.sanctum_sessions from public, anon, authenticated;
grant all on public.sanctum_sessions to service_role;
revoke all on public.sanctum_login_attempts from public, anon, authenticated;
grant all on public.sanctum_login_attempts to service_role;
revoke all on function public.sanctum_allow_login_attempt(text) from public, anon, authenticated;
grant execute on function public.sanctum_allow_login_attempt(text) to service_role;
revoke all on function public.sanctum_verify_login(text, text) from public, anon, authenticated;
grant execute on function public.sanctum_verify_login(text, text) to service_role;
revoke all on function public.sanctum_register_account(text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.sanctum_register_account(text, text, text, text, text) to service_role;

-- An older preparation script may have exposed this legacy signup RPC to anon.
do $$
begin
  if to_regprocedure('public.sanctum_request_join(text,text)') is not null then
    execute 'revoke all on function public.sanctum_request_join(text,text) from public, anon, authenticated';
  end if;
end;
$$;

commit;
