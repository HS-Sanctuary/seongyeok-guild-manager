\set ON_ERROR_STOP on
begin;
-- UNEXECUTED fixture. Run only inside the owned network:none ephemeral container.
-- Caller sets: SET astra.validation_mode='isolated';
do $$
begin
 if current_user<>'astra_fixture_admin' or current_database()<>'astra_validation' or current_setting('astra.validation_mode',true) is distinct from 'isolated'
 then raise exception 'isolated fixture database required'; end if;
 if to_regclass('public.accounts') is not null or to_regclass('public.sanctum_sessions') is not null
 or exists(select 1 from pg_roles where rolname in ('anon','authenticated','service_role'))
 then raise exception 'fresh synthetic cluster required; never reuse an existing database'; end if;
end; $$;
create schema astra_fixture_guard;
create table astra_fixture_guard.marker(kind text primary key check(kind='synthetic-empty-cluster'));
insert into astra_fixture_guard.marker values('synthetic-empty-cluster');
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create table public.accounts(id uuid primary key,nickname text unique not null,role text not null,status text not null);
create table public.sanctum_sessions(token_hash text primary key,account_id uuid not null references public.accounts(id) on delete cascade,expires_at timestamptz not null);
grant usage on schema public to service_role,anon,authenticated;
grant select,update on public.accounts,public.sanctum_sessions to service_role;
insert into public.accounts values
 ('11111111-1111-4111-8111-111111111111','합성A','길드원','승인'),
 ('22222222-2222-4222-8222-222222222222','합성B','길드원','승인'),
 ('33333333-3333-4333-8333-333333333333','합성대기','pending','승인대기');
insert into public.sanctum_sessions values
 (repeat('a',64),'11111111-1111-4111-8111-111111111111',clock_timestamp()+interval '1 day'),
 (repeat('c',64),'11111111-1111-4111-8111-111111111111',clock_timestamp()+interval '1 day'),
 (repeat('b',64),'22222222-2222-4222-8222-222222222222',clock_timestamp()+interval '1 day'),
 (repeat('d',64),'33333333-3333-4333-8333-333333333333',clock_timestamp()+interval '1 day'),
 (repeat('e',64),'11111111-1111-4111-8111-111111111111',clock_timestamp()-interval '1 minute');
-- Next apply the exact two proposal files in this empty synthetic database only.

commit;
