-- READ ONLY: three Kronos favorites paths, schema/privileges only.
-- Run in Supabase SQL Editor and return the single result JSON.
-- No account rows, character rows, login codes, keys, or favorite data are read.
-- Missing tables are reported as exists=false, not treated as empty favorites.
WITH targets(table_name) AS (
  VALUES ('accounts'), ('nexus_trades'), ('kronos_shop_items'),
         ('kronos_missions'), ('kronos_progress'), ('kronos_barter_favorites')
), objects AS (
  SELECT t.table_name, c.oid, c.relrowsecurity, c.relforcerowsecurity
  FROM targets t
  LEFT JOIN pg_namespace n ON n.nspname = 'public'
  LEFT JOIN pg_class c ON c.relnamespace = n.oid
    AND c.relname = t.table_name AND c.relkind IN ('r', 'p')
), role_names AS (
  SELECT oid, rolname FROM pg_roles
  WHERE rolname IN ('anon', 'authenticated', 'service_role')
)
SELECT jsonb_build_object(
  'tables', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', o.table_name,
      'exists', o.oid IS NOT NULL,
      'rls_enabled', o.relrowsecurity,
      'rls_forced', o.relforcerowsecurity,
      'columns', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'name', a.attname,
          'type', format_type(a.atttypid, a.atttypmod),
          'not_null', a.attnotnull,
          'generated', a.attgenerated
        ) ORDER BY a.attnum)
        FROM pg_attribute a
        WHERE a.attrelid = o.oid AND a.attnum > 0 AND NOT a.attisdropped
          AND (o.table_name <> 'accounts' OR a.attname = 'id')
      ), '[]'::jsonb),
      'constraints', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'name', con.conname, 'type', con.contype,
          'definition', pg_get_constraintdef(con.oid)
        ) ORDER BY con.conname)
        FROM pg_constraint con WHERE con.conrelid = o.oid
          AND o.table_name <> 'accounts'
      ), '[]'::jsonb),
      'indexes', COALESCE((
        SELECT jsonb_agg(i.indexdef ORDER BY i.indexname)
        FROM pg_indexes i WHERE i.schemaname = 'public'
          AND i.tablename = o.table_name AND o.table_name <> 'accounts'
      ), '[]'::jsonb),
      'policy_count', (
        SELECT count(*) FROM pg_policy p WHERE p.polrelid = o.oid
      ),
      'privileges', COALESCE((
        SELECT jsonb_agg(jsonb_build_object(
          'role', r.rolname,
          'select', has_table_privilege(r.oid, o.oid, 'SELECT'),
          'insert', has_table_privilege(r.oid, o.oid, 'INSERT'),
          'update', has_table_privilege(r.oid, o.oid, 'UPDATE'),
          'delete', has_table_privilege(r.oid, o.oid, 'DELETE')
        ) ORDER BY r.rolname)
        FROM role_names r WHERE o.oid IS NOT NULL
      ), '[]'::jsonb)
    ) ORDER BY o.table_name) FROM objects o
  ),
  'progress_functions', COALESCE((
    SELECT jsonb_agg(jsonb_build_object(
      'name', p.proname,
      'arguments', pg_get_function_arguments(p.oid),
      'returns', pg_get_function_result(p.oid),
      'security_definer', p.prosecdef,
      'execute_privileges', (
        SELECT jsonb_agg(jsonb_build_object(
          'role', r.rolname,
          'execute', has_function_privilege(r.oid, p.oid, 'EXECUTE')
        ) ORDER BY r.rolname) FROM role_names r
      )
    ) ORDER BY p.oid)
    FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'sanctum_kronos_progress'
  ), '[]'::jsonb)
) AS result;
