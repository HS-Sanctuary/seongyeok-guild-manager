-- SANCTUM beta Phase D: move member mutations behind server sessions.
-- Apply only after /api/member-mutations, /api/inquiries and
-- /api/parties/sync-checklist are deployed and verified in Preview/Production.
-- This changes privileges only; no rows or policies are deleted.
-- If a core flow fails, restore only the affected table privilege temporarily
-- with a reviewed GRANT and keep beta invitations paused until fixed.

begin;

revoke insert, update, delete on table
  public.characters,
  public.parties,
  public.inquiries,
  public.activity_logs,
  public.lounge_posts
from public, anon, authenticated;

-- 1:1 inquiries must not be readable through the public Supabase API.
revoke select on table public.inquiries from public, anon, authenticated;

grant all on table
  public.characters,
  public.parties,
  public.inquiries,
  public.activity_logs,
  public.lounge_posts
to service_role;

commit;
