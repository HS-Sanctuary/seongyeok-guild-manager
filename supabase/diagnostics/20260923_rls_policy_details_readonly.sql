-- Read-only policy audit before expanding the beta. No account rows or codes.
select
  tablename,
  policyname,
  roles,
  cmd,
  qual as using_expression,
  with_check as check_expression
from pg_policies
where schemaname = 'public'
  and tablename in (
    'accounts', 'activity_logs', 'characters', 'inquiries',
    'lounge_posts', 'nexus_classes', 'parties'
  )
order by tablename, policyname;
