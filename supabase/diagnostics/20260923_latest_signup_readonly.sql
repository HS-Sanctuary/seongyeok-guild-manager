-- Read-only latest signup check. Never returns the code or the hash.
select
  nickname,
  role,
  status,
  code is not null as has_legacy_code,
  code_hash is not null as has_code_hash,
  (code_hash = crypt(code, code_hash)) as stored_code_matches_hash,
  (code = btrim(code)) as code_has_no_edge_spaces,
  (code !~ '[[:cntrl:]]') as code_has_no_control_characters
from public.accounts
order by created_at desc
limit 1;
