-- Read-only check after applying the review migration. No report contents are returned.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inquiries' and column_name = 'retention_review_at'
  ) as review_column_exists,
  not has_table_privilege('anon', 'public.inquiries', 'SELECT') as anon_cannot_read_inquiries,
  not has_table_privilege('authenticated', 'public.inquiries', 'DELETE') as authenticated_cannot_delete_inquiries,
  (select count(*) from public.inquiries
   where category in ('생텀 버그 제보', '생텀 건의사항') and retention_review_at is null) as unscheduled_report_count,
  (select not public from storage.buckets where id = 'logos-reports') as report_bucket_is_private;
