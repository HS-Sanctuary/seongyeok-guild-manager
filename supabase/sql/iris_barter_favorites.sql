-- PREPARED ONLY: 운영 DB 적용은 한설의 별도 승인 후 진행한다.
-- 대상: 계정 공통 물물교환 즐겨찾기 1개 신규 테이블.
-- 기존 계정/캐릭터/카탈로그/완료 기록은 변경하지 않는다.
-- accounts.id uuid, nexus_trades.id bigint는 운영 읽기 전용 점검으로 확인했다.
-- 2026-10-10 한설 전달 진단 JSON: 위 타입 재확인, 신규 테이블 없음.
-- 상점/임무는 기존 kronos_progress.bookmarked 및 RPC를 그대로 사용한다.
-- false 행은 해제 기록이다. 삭제하면 오래된 기기에서 다시 가져올 수 있으므로 보존한다.

BEGIN;

CREATE TABLE IF NOT EXISTS public.kronos_barter_favorites (
  account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  trade_id bigint NOT NULL REFERENCES public.nexus_trades(id) ON DELETE CASCADE,
  favorited boolean NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, trade_id)
);

CREATE INDEX IF NOT EXISTS kronos_barter_favorites_trade_id_idx
  ON public.kronos_barter_favorites (trade_id);

-- 이 경로는 SANCTUM 서버 세션을 검증한 뒤 service_role로만 접근한다.
-- Supabase Auth 사용자/공개 클라이언트 정책이나 함수를 만들지 않는다.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'kronos_barter_favorites'
  ) THEN
    RAISE EXCEPTION 'kronos_barter_favorites has unexpected policies; review before applying';
  END IF;
END;
$$;

ALTER TABLE public.kronos_barter_favorites ENABLE ROW LEVEL SECURITY;
-- service_role도 기본 DELETE 등 과다 권한을 제거한 뒤 필요한 권한만 복원한다.
REVOKE ALL ON TABLE public.kronos_barter_favorites FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON TABLE public.kronos_barter_favorites TO service_role;

COMMIT;

-- 적용 후 읽기 전용 검증. 데이터 값이나 계정 식별자는 출력하지 않는다.
SELECT jsonb_build_object(
  'table', c.relname,
  'rls_enabled', c.relrowsecurity,
  'policy_count', (SELECT count(*) FROM pg_policies p
    WHERE p.schemaname = 'public' AND p.tablename = c.relname),
  'public_grant_count', (
    SELECT count(*) FROM aclexplode(COALESCE(c.relacl, acldefault('r', c.relowner))) a
    WHERE a.grantee = 0
  ),
  'privileges', (
    SELECT jsonb_agg(jsonb_build_object(
      'role', role_name,
      'select', has_table_privilege(role_name, c.oid, 'SELECT'),
      'insert', has_table_privilege(role_name, c.oid, 'INSERT'),
      'update', has_table_privilege(role_name, c.oid, 'UPDATE'),
      'delete', has_table_privilege(role_name, c.oid, 'DELETE'),
      'truncate', has_table_privilege(role_name, c.oid, 'TRUNCATE'),
      'references', has_table_privilege(role_name, c.oid, 'REFERENCES'),
      'trigger', has_table_privilege(role_name, c.oid, 'TRIGGER')
    ) ORDER BY role_name)
    FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS roles(role_name)
  ),
  'constraints', (
    SELECT jsonb_agg(jsonb_build_object(
      'name', con.conname, 'type', con.contype,
      'definition', pg_get_constraintdef(con.oid)
    ) ORDER BY con.conname)
    FROM pg_constraint con WHERE con.conrelid = c.oid
  ),
  'indexes', (
    SELECT jsonb_agg(i.indexdef ORDER BY i.indexname) FROM pg_indexes i
    WHERE i.schemaname = 'public' AND i.tablename = c.relname
  )
) AS result
FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' AND c.relname = 'kronos_barter_favorites';
-- 기대: RLS true / 정책 0 / PUBLIC 권한 0.
-- anon/authenticated 모두 false. service_role SELECT/INSERT/UPDATE만 true.

-- 문제 발생 시 별도 승인 후 기능만 닫는 복구 절차 (아래는 자동 실행하지 않는다).
-- 1. 웹/IRIS를 직전 정상 코드로 되돌려 서버 즐겨찾기 조작을 비활성화한다.
-- 2. 새 테이블의 행과 false 해제 기록은 보존한다. DROP/DELETE하지 않는다.
-- 3. 필요하면 아래 한 줄만 별도 실행해 새 경로의 DB 접근을 닫는다.
-- REVOKE SELECT, INSERT, UPDATE ON TABLE public.kronos_barter_favorites FROM service_role;
-- 4. 기존 테이블/완료 기록에는 복구 작업이 필요 없다.
--    원인을 해결한 뒤 승인된 본문을 재실행하면 보존된 행 그대로 접근을 복원한다.
