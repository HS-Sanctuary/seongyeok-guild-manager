-- Additive KERYGMA read receipts. Run only after a current backup is confirmed.
-- Existing notices/accounts and browser-local notification state are untouched.
begin;

create table if not exists public.notice_reads (
  notice_id bigint not null references public.notices(id) on delete cascade,
  account_id uuid not null references public.accounts(id) on delete cascade,
  read_at timestamptz not null default now(),
  primary key (notice_id, account_id)
);

create index if not exists notice_reads_account_id_idx
  on public.notice_reads (account_id);

alter table public.notice_reads enable row level security;
revoke all on public.notice_reads from public, anon, authenticated;
grant all on public.notice_reads to service_role;

commit;
