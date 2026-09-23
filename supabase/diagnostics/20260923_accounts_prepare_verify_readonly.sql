-- Read-only verification after Phase A. Returns counts and object names, never codes.
select
  (select count(*) from public.accounts) as account_count,
  (select count(*) from public.accounts where code is not null and code_hash is not null) as accounts_with_legacy_code_and_hash,
  (select count(*) from public.accounts where code is not null and code_hash is null) as accounts_missing_hash,
  to_regclass('public.sanctum_sessions') is not null as sessions_table_exists,
  to_regclass('public.sanctum_login_attempts') is not null as login_limit_table_exists,
  to_regprocedure('public.sanctum_verify_login(text,text)') is not null as login_function_exists,
  to_regprocedure('public.sanctum_register_account(text,text,text,text,text)') is not null as register_function_exists,
  to_regprocedure('public.sanctum_allow_login_attempt(text)') is not null as login_limit_function_exists;
