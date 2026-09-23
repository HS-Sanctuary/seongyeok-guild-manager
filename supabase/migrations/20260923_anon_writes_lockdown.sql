-- SANCTUM v1.96 beta write lockdown (Phase C).
-- Apply ONLY after the new server routes are deployed and verified:
-- /api/admin/catalog, /api/notices/mutate, /api/reports,
-- /api/sync-client, /api/sync-weekly, /api/auth/*.
-- This changes privileges, not rows. Keep a current backup and the previous
-- grants from the read-only privilege diagnostic for a targeted rollback.

begin;

do $$
begin
  if to_regclass('public.sanctum_sessions') is null then
    raise exception 'Phase A is missing';
  end if;
  if to_regclass('public.accounts') is null then
    raise exception 'accounts table is missing';
  end if;
end;
$$;

revoke insert, update, delete on table
  public.abyss_reports,
  public.boards,
  public.content_power_reqs,
  public.deep_holes,
  public.gnosis_guides,
  public.guild_settings,
  public.nexus_banners,
  public.nexus_contents,
  public.nexus_missions,
  public.nexus_purchases,
  public.nexus_tasks,
  public.nexus_titles,
  public.nexus_trades,
  public.notice_comments,
  public.notices,
  public.server_events,
  public.sync_batches,
  public.weekly_stat_snapshots,
  public.nexus_classes
from public, anon, authenticated;

grant all on table
  public.abyss_reports,
  public.boards,
  public.content_power_reqs,
  public.deep_holes,
  public.gnosis_guides,
  public.guild_settings,
  public.nexus_banners,
  public.nexus_contents,
  public.nexus_missions,
  public.nexus_purchases,
  public.nexus_tasks,
  public.nexus_titles,
  public.nexus_trades,
  public.notice_comments,
  public.notices,
  public.server_events,
  public.sync_batches,
  public.weekly_stat_snapshots,
  public.nexus_classes
to service_role;

commit;
