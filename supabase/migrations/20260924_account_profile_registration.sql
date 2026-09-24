-- Add explicit signup profile fields. Existing credentials and accounts stay intact.
-- Apply before deploying the matching register/admin API changes.
begin;

alter table public.accounts add column if not exists favorite_word text;
alter table public.accounts add column if not exists birthday_mmdd text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'accounts_favorite_word_length_check' and conrelid = 'public.accounts'::regclass) then
    alter table public.accounts add constraint accounts_favorite_word_length_check
      check (favorite_word is null or (char_length(favorite_word) between 1 and 7 and favorite_word !~ '[[:space:]]'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'accounts_birthday_mmdd_check' and conrelid = 'public.accounts'::regclass) then
    alter table public.accounts add constraint accounts_birthday_mmdd_check
      check (birthday_mmdd is null or (
        birthday_mmdd ~ '^[0-9]{4}$'
        and substring(birthday_mmdd from 1 for 2)::integer between 1 and 12
        and substring(birthday_mmdd from 3 for 2)::integer between 1 and
          case substring(birthday_mmdd from 1 for 2)::integer
            when 2 then 29
            when 4 then 30 when 6 then 30 when 9 then 30 when 11 then 30
            else 31
          end
      ));
  end if;
end;
$$;

create or replace function public.sanctum_register_account_with_profile(
  input_nickname text,
  input_code text,
  input_job text,
  input_combat_power text,
  input_magic_resistance text,
  input_favorite_word text,
  input_birthday_mmdd text
)
returns table (id uuid, nickname text, role text, status character varying)
language plpgsql security definer
set search_path = pg_catalog, public
as $$
declare
  created_id uuid;
begin
  if input_favorite_word is null or input_birthday_mmdd is null
    or char_length(input_favorite_word) not between 1 and 7
    or input_favorite_word ~ '[[:space:]]'
    or input_birthday_mmdd !~ '^[0-9]{4}$' then
    raise exception '가입 프로필이 올바르지 않습니다.';
  end if;

  -- The existing registration function creates the account and character.
  -- A failure in the profile update rolls back that registration as one RPC.
  select registered.id into created_id
  from public.sanctum_register_account(
    input_nickname, input_code, input_job, input_combat_power, input_magic_resistance
  ) registered;

  update public.accounts a
  set favorite_word = input_favorite_word,
      birthday_mmdd = input_birthday_mmdd
  where a.id = created_id;

  return query
  select a.id, a.nickname, a.role, a.status
  from public.accounts a where a.id = created_id;
end;
$$;

revoke all on function public.sanctum_register_account_with_profile(text,text,text,text,text,text,text)
  from public, anon, authenticated;
grant execute on function public.sanctum_register_account_with_profile(text,text,text,text,text,text,text)
  to service_role;

notify pgrst, 'reload schema';
commit;
