-- Read-only. Does not return account values or access codes.
select
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='accounts' and column_name='favorite_word') as favorite_column_exists,
  exists(select 1 from information_schema.columns where table_schema='public' and table_name='accounts' and column_name='birthday_mmdd') as birthday_column_exists,
  to_regprocedure('public.sanctum_register_account_with_profile(text,text,text,text,text,text,text)') is not null as profile_registration_exists,
  has_table_privilege('anon','public.accounts','SELECT') as anon_can_read_accounts,
  has_table_privilege('authenticated','public.accounts','SELECT') as authenticated_can_read_accounts,
  has_function_privilege('anon','public.sanctum_register_account_with_profile(text,text,text,text,text,text,text)','EXECUTE') as anon_can_register_profile;
