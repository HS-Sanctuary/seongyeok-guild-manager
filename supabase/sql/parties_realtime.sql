-- Approved by 한설 on 2026-10-09 for online SYNAXIS notifications.
-- Applied via MCP: publication only; data, grants, RLS, replica identity unchanged.
-- Supabase CLI unavailable on this host; retain a repeatable SQL change record.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'parties'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.parties;
  END IF;
END $$;
-- Rollback to the verified previous disabled state, only with operator approval:
-- ALTER PUBLICATION supabase_realtime DROP TABLE public.parties;
