-- Run after the approved Logos image migration. This query changes no data.
select
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inquiries' and column_name = 'attachment_paths'
  ) as attachment_column_exists,
  exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'inquiries' and column_name = 'reporter_account_id'
  ) as reporter_account_column_exists,
  exists (
    select 1 from storage.buckets
    where id = 'logos-reports' and public = false
      and file_size_limit = 358400
      and allowed_mime_types @> array['image/webp']::text[]
  ) as private_bucket_ready,
  has_table_privilege('anon', 'public.inquiries', 'select') as anon_can_read_inquiries,
  has_table_privilege('authenticated', 'public.inquiries', 'insert') as authenticated_can_insert_inquiries;
