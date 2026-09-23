# SANCTUM 작업 인계

이 문서는 **공식 push 직전 또는 직후** 현재 코드 상태를 다음 Codex 세션과 한설님에게 전달하기 위한 문서다.

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
