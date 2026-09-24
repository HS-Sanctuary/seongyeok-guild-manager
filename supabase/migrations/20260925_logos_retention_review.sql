-- Apply after a recent backup, before deploying the matching LOGOS API.
-- This schedules a review; it never deletes reports or Storage objects automatically.
begin;

alter table public.inquiries
  add column if not exists retention_review_at timestamptz;

update public.inquiries
set retention_review_at = created_at + interval '60 days'
where category in ('생텀 버그 제보', '생텀 건의사항')
  and retention_review_at is null;

create index if not exists inquiries_retention_review_at_idx
  on public.inquiries (retention_review_at)
  where category in ('생텀 버그 제보', '생텀 건의사항');

notify pgrst, 'reload schema';
commit;
