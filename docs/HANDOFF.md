# SANCTUM 작업 인계

이 문서는 **공식 push 직전 또는 직후** 현재 코드 상태를 다음 Codex 세션과 한설님에게 전달하기 위한 문서다.

## 현재 기준 — 2026-09-22 KST, 아직 push 전

- 최신 기존 Git 기능 표기: `v1.9`
- 작업 폴더: `C:\Users\Moon\seongyeok-guild-manager`
- 현재 문서 변경: `AGENTS.md`, `app/SANCTUM_MASTER_GUID.md`, `docs/RELEASE_NOTES.md`, `docs/HANDOFF.md`
- Supabase 운영 DB에는 변경을 적용하지 않았다.
- 현재 코드 변경: 1차 알림함 구현(`hooks/useNoticeNotifications.ts`, `components/layout/NotificationInbox.tsx`, `Navbar.tsx` 연동). KERYGMA 공지 기반 읽지 않음 수와 브라우저 알림 권한 요청을 제공한다. 헤더는 브랜드 락업과 우측 `SpiritWingsMenu`로 재구성했고, <xl 폭에서는 하단 메뉴로 전환한다.
- 알림 1차 제한: 읽음 상태는 브라우저 `localStorage` 기준이며, 사이트가 완전히 닫힌 뒤 전달되는 Push는 아직 없다.
- 계정 보안 1차 코드 준비: `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`, `app/api/auth/*`, `lib/server/sanctumSession.ts`를 추가했다. 입장 코드 bcrypt 해시, 신규 가입 RPC, HttpOnly 서버 세션으로 전환하는 내용이다. **운영 DB에는 아직 미적용**이므로, SQL 적용 전에는 새 로그인 API를 실제 사용하면 안 된다.
- SQL 적용 뒤 검증할 흐름: 기존 승인 계정 로그인 → 로그아웃 → 가입 신청 → 관리자 승인 → 승인 계정 로그인. 성공 확인 전 `accounts.code` 평문 컬럼을 삭제하지 않는다.
- 확정된 다음 알림 범위: KRONOS 초기화/미완료, AGORA 판테온 순위 변동, EMPORION 가격 목표, SYNAXIS 매칭 완료·길드 버스, GNOSIS 구독 게시물, 운영진 가입 승인 대기. 먼저 범용 알림 DB·사용자 설정·중복 방지 기반을 설계한다.
- 다음 구현 우선순위: 알림 화면 확인 후 P0/P1 점검, 권한·RLS 점검, 핵심 동선 테스트.

## 매 push 시 갱신할 항목

1. 적용한 버전, 커밋 해시, KST 시간
2. 변경 파일 및 기능 영향
3. DB 스키마·RLS·환경변수 변경 여부
4. 실행한 검증과 결과
5. Vercel 배포 상태 및 실제 확인한 화면
6. 다음 작업의 우선순위와 금지/주의 사항
