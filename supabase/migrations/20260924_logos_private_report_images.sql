-- After confirming a recent backup, apply before deploying the matching server API.
-- Existing inquiries and replies are preserved. Images remain in a private Storage bucket.
begin;

alter table public.inquiries
  add column if not exists attachment_paths text[] not null default '{}'::text[];
alter table public.inquiries
  add column if not exists reporter_account_id uuid;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('logos-reports', 'logos-reports', false, 358400, array['image/webp'])
on conflict (id) do nothing;

-- Service-role server routes access this bucket. Do not add anon/authenticated policies.
notify pgrst, 'reload schema';
commit;
