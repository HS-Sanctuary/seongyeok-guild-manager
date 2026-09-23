# SANCTUM 작업 인계

이 문서는 **공식 push 직전 또는 직후** 현재 코드 상태를 다음 Codex 세션과 한설님에게 전달하기 위한 문서다.

## v1.96 Preview 인계 — 2026-09-23 16:32 KST

- 운영 서비스는 아직 정상 기준선 v1.95(`13a62ec`, Vercel 배포 `6604812049`)다. 이 커밋은 Preview 후보이며 Production 실제 로그인 검증 전에는 베타 초대를 확대하지 않는다.
- 한설이 운영 DB에 `supabase/migrations/20260923_accounts_prepare.sql`(Phase A)을 실행했다. 읽기 전용 결과: 계정 13개, 해시 누락 0, 세션·로그인 제한 테이블 및 로그인·가입·제한 함수 모두 존재. Vercel Production·Preview에 서버 전용 키가 저장됐고 값은 공유받지 않았다.
- `supabase/migrations/20260923_accounts_lockdown.sql`(Phase B)은 미실행이다. 공개 계정 권한과 다른 관리자 테이블의 직접 쓰기 문제는 남아 있다. 새 로그인·가입·승인 및 핵심 화면을 실제 확인한 뒤 별도 승인으로 적용한다.
- 최근 자동 백업은 2026-09-23 08:14:31 KST다. 전체 복원은 이후 기록을 잃을 수 있다. 코드 배포 문제는 우선 직전 v1.95 배포로 되돌리고 Phase A의 호환 DB 객체는 유지한다.
- 새 배포에서는 기존 사용자가 접속 코드를 한 번 다시 입력해야 한다. 다중 계정 전환도 각 계정에 대해 다시 로그인한 뒤 서버 쿠키로 동작한다.
- Preview 첫 배포는 Ready였고 한설이 `/api/auth/health`의 `ready: true`, 본인 로그인 및 관리자 계정 13명 목록을 확인했다. 가입 대기 목록은 오류 없이 0건이다. 실제 신규 가입·승인·캐릭터·공지·파티 확인은 아직 남았다.
- 서버 키 활성화로 호출자 확인 없이 DB를 수정할 수 있게 된 기존 `/api/sync-client`·`/api/sync-weekly`를 발견해 운영진 인증을 추가했다. Tampermonkey 스크립트는 v8.3으로 갱신해야 동기화가 계속된다. 인증 패치의 Preview 재배포·403 확인 전에는 Production에 올리지 않는다.
- 순월의 누적 작업 상세와 영겁에게 보낼 ACK 메시지는 `docs/relay/TO_YEONGGEOP.md`에 있다.

## 현재 기준 — v1.95, 2026-09-23 11:06 KST

- 작업 폴더: `C:\Users\sungw\sanc\seongyeok-guild-manager`
- v1.94에서 운영 DB 미적용 상태의 `sanctum_verify_login`·`sanctum_sessions`를 즉시 사용해 CBT 전체 로그인이 중단됐다.
- v1.95는 `app/login/page.tsx`의 로그인·가입 신청과 `app/layout.tsx`의 계정 복원을 현재 운영 DB 구조에 맞는 기존 경로로 복구했다.
- 한설이 기존 계정 로그인 성공을 확인했다. 프로덕션 빌드도 통과했다.
- v1.95 코드 커밋은 `13a62ec`이며 Vercel Production 배포 `6604812049`가 성공했다. 배포 URL은 Vercel 로그인 보호가 있어 비로그인 자동 화면 확인은 제한됐다.
- Supabase 운영 DB, RLS, 환경변수는 변경하지 않았다.
- `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`, `app/api/auth/*`, `lib/server/sanctumSession.ts`는 후속 보안 전환용으로 보존되어 있다. **운영 DB 적용·검증 전 로그인 UI에 다시 연결하면 안 된다.**
- 후속 보안 전환 순서: 변경 대상·복구 방법 보고 및 승인 → SQL 적용 → 기존 승인 계정 로그인 → 로그아웃 → 가입 신청 → 관리자 승인 → 승인 계정 로그인 → 성공 확인 뒤 평문 컬럼 제거 여부 별도 결정.
- 되돌리기 기준선은 v1.94 커밋 `87af6ff`지만, 해당 버전은 로그인 장애를 포함하므로 v1.95 배포 성공 뒤에는 v1.95를 새 정상 기준선으로 삼는다.
- 다음 우선순위: CBT 사용자의 운영 주소 로그인 재확인, 핵심 경로 점검, 권한·RLS 점검.

## 매 push 시 갱신할 항목

1. 적용한 버전, 커밋 해시, KST 시간
2. 변경 파일 및 기능 영향
3. DB 스키마·RLS·환경변수 변경 여부
4. 실행한 검증과 결과
5. Vercel 배포 상태 및 실제 확인한 화면
6. 다음 작업의 우선순위와 금지/주의 사항
