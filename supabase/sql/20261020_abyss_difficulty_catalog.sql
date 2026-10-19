-- Approved by 한설 on 2026-10-20 KST: add five missing abyss standards,
-- copying the existing 허상의 정박지 standards. No existing row is updated.
-- Before: 31 rows; original-row md5 279d12e8cbc98a216a1ee1e4167d2cb3.
-- Repeatable; partial/conflicting registrations abort instead of overwriting.
BEGIN;
LOCK TABLE public.content_power_reqs IN SHARE ROW EXCLUSIVE MODE;
DO $$
DECLARE expected integer;
BEGIN
  SELECT count(*) INTO expected FROM public.content_power_reqs
  WHERE content_type='abyss' AND content_name='허상의 정박지'
    AND difficulty IN ('매우 어려움2','지옥3','지옥4');
  IF expected<>3 THEN RAISE EXCEPTION 'Source standards changed; recheck before applying'; END IF;
  SELECT count(*) INTO expected FROM public.nexus_contents
  WHERE type='abyss' AND is_active=true
    AND (id,name) IN ((5,'광기의 동굴'),(6,'흩어진 물길'));
  IF expected<>2 THEN RAISE EXCEPTION 'Target contents changed; recheck before applying'; END IF;
  IF EXISTS (
    SELECT 1 FROM (VALUES(5,'광기의 동굴','매우 어려움2'),(5,'광기의 동굴','지옥3'),
      (5,'광기의 동굴','지옥4'),(6,'흩어진 물길','매우 어려움2'),(6,'흩어진 물길','지옥4')) t(cid,name,diff)
    JOIN public.content_power_reqs s ON s.content_type='abyss' AND s.content_name='허상의 정박지' AND s.difficulty=t.diff
    JOIN public.content_power_reqs d ON d.content_type='abyss' AND d.content_name=t.name AND regexp_replace(d.difficulty,'\s','','g')=regexp_replace(t.diff,'\s','','g')
    WHERE ROW(d.content_id,d.max_members,d.min_cp,d.rec_cp,d.op_cp,d.rec_mr,d.op_mr)
      IS DISTINCT FROM ROW(t.cid,s.max_members,s.min_cp,s.rec_cp,s.op_cp,s.rec_mr,s.op_mr)
  ) THEN RAISE EXCEPTION 'Existing target differs; never overwrite'; END IF;
END $$;
INSERT INTO public.content_power_reqs(content_id,content_type,content_name,difficulty,max_members,min_cp,rec_cp,op_cp,rec_mr,op_mr)
SELECT t.cid,'abyss',t.name,s.difficulty,s.max_members,s.min_cp,s.rec_cp,s.op_cp,s.rec_mr,s.op_mr
FROM (VALUES(5,'광기의 동굴','매우 어려움2'),(5,'광기의 동굴','지옥3'),
  (5,'광기의 동굴','지옥4'),(6,'흩어진 물길','매우 어려움2'),(6,'흩어진 물길','지옥4')) t(cid,name,diff)
JOIN public.content_power_reqs s ON s.content_type='abyss' AND s.content_name='허상의 정박지' AND s.difficulty=t.diff
WHERE NOT EXISTS(SELECT 1 FROM public.content_power_reqs d WHERE d.content_type='abyss' AND d.content_name=t.name
  AND regexp_replace(d.difficulty,'\s','','g')=regexp_replace(t.diff,'\s','','g'))
RETURNING id,content_id,content_name,difficulty,max_members,min_cp,rec_cp,op_cp,rec_mr,op_mr;
COMMIT;
-- Rollback is NOT automatic. On a separately approved rollback, delete only
-- IDs returned by this first application, guarded by the exact recorded values.
-- Never delete pre-existing rows or broad content/difficulty matches.
