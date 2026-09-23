# SANCTUM 작업 인계

이 문서는 **공식 push 직전 또는 직후** 현재 코드 상태를 다음 Codex 세션과 한설님에게 전달하기 위한 문서다.

## 2026-09-23 22:35 KST — 자정 베타 오픈 준비 중

- 2026-09-24 00:05 KST v1.97 후속 배포 준비: 홈 숙제 체크 저장 중/완료/실패 표시를 추가하고 타입·빌드를 통과했다. 실제 Production Ready와 UI 확인은 아직 필요하다. 아래 이전 시각의 대기·미적용 문구는 당시 기록이며 현재 상태는 바로 아래 23:34 항목을 우선한다.

- 23:34 KST 운영 `main` 커밋 `e62d138` Production Ready. 한설이 운영 재로그인·관리자 계정 목록을 확인했다. Phase B/C/D SQL 적용 후 익명·authenticated 쓰기 가능 public 테이블 각 0, 계정 코드·해시와 문의의 익명 읽기 false. 배너 수정·공지 댓글·캐릭터 체크 저장·테스트 파티 삭제·문의/답변 조회 정상. 홈 체크 저장에 약 3~5초 걸려 저장 상태 표시 후속 패치를 준비했다.

- 23:12 KST Preview `5fa5f8a` Ready. 한설이 로그인·캐릭터 숙제 저장·파티 생성·공지 작성·문의 등록/답변·관리자 배너 등록 성공을 확인했다. 검증된 코드를 `main`에 fast-forward했으며 Production Ready와 실제 운영 동작 확인은 대기 중이다.

- Preview에서 로그인·캐릭터 숙제 저장·파티 생성·공지 작성·문의 등록/답변은 한설이 확인했다. 관리자 배너 저장은 `nexus_banners.bg_color` 컬럼 부재로 실패해 해당 필드와 선택 UI를 제거하고 재검증 대기 중이다.

- 집 영겁이 `codex/v1-96-beta`에서 익명 쓰기 차단 전 서버 경로를 추가했다. 관리자 카탈로그, 공지, 제보, 캐릭터, 파티, 문의가 대상이다. 1:1 문의 조회도 서버 세션 기준으로 분리했다.
- 타입 검사와 Production 빌드는 통과했다. 새 경로의 Preview 로그인 실사용 검증, Production 배포 및 운영 DB Phase B/C/D는 아직 하지 않았다. 검증 전 SQL을 실행하면 기존 쓰기 기능이 중단될 수 있다.
- 한설은 검증 후 Preview·main 푸시와 DB 권한 차단 순서에 동의했다. SQL은 대상·영향·복구 방법을 직전에 안내하고 한설이 Supabase SQL Editor에서 직접 실행한다.
- 운영 정책 상세 결과: `accounts`의 공개 SELECT/UPDATE/DELETE/ALL, `characters`·`parties`의 공개 ALL, `inquiries`의 공개 ALL, `activity_logs`·`lounge_posts`의 공개 INSERT, `nexus_classes` 공개 ALL. 확대 초대 전 권한 재검사 필수.
- 남은 순서: Preview 배포→한설이 로그인 상태 핵심 쓰기(캐릭터 저장, 파티 생성/참여, 공지·문의, 관리자 항목)를 확인→main 배포→Production 로그인·핵심 쓰기 확인→Phase B/C/D SQL 순차 적용→읽기 전용 권한 검증→같은 핵심 쓰기 재확인→초대 판단. 실패 시 초대 중단, 영향을 받은 권한만 검토 후 복구.

## v1.96 운영 배포 전 인계 — 2026-09-23 17:10 KST

- **퇴근 인계(17:13 KST):** 사무실 순월은 `codex/v1-96-beta` 브랜치만 push하고 멈춘다. 집 영겁은 먼저 `git fetch` 후 해당 브랜치를 checkout/pull하고 이 문서·`docs/relay/TO_YEONGGEOP.md`를 읽는다. `main`은 v1.95(`d7d3758`) 그대로이며 Production push·Phase B 운영 SQL은 미실행이다.
- **다음 순서:** 최신 Preview와 위 검증 결과 확인 → 익명 쓰기 18개 테이블의 기능 보존형 잠금 범위 결정 → 운영 push 전 명시 안내 → Production 실제 로그인 확인 → `accounts` Phase B의 대상·영향·복구 방법을 다시 설명하고 별도 승인받아 실행 → 권한 읽기 전용 재검사. 20~40명 초대 완료로 표시하지 않는다.
- 운영 서비스는 아직 정상 기준선 v1.95(`13a62ec`, Vercel 배포 `6604812049`)다. 이 커밋은 Preview 후보이며 Production 실제 로그인 검증 전에는 베타 초대를 확대하지 않는다.
- 한설이 운영 DB에 `supabase/migrations/20260923_accounts_prepare.sql`(Phase A)을 실행했다. 읽기 전용 결과: 계정 13개, 해시 누락 0, 세션·로그인 제한 테이블 및 로그인·가입·제한 함수 모두 존재. Vercel Production·Preview에 서버 전용 키가 저장됐고 값은 공유받지 않았다.
- `supabase/migrations/20260923_accounts_lockdown.sql`(Phase B)은 미실행이다. 공개 계정 권한과 다른 관리자 테이블의 직접 쓰기 문제는 남아 있다. 새 로그인·가입·승인 및 핵심 화면을 실제 확인한 뒤 별도 승인으로 적용한다.
- 운영 읽기 전용 검사에서 `accounts.code`·`code_hash`는 아직 anon SELECT 가능하고, RLS가 꺼진 18개 테이블 모두 anon 쓰기 권한이 확인됐다. 상세 목록은 `docs/SUPABASE_SCHEMA.md`; 다른 테이블을 무작정 revoke하면 현재 브라우저 쓰기 기능이 중단된다. 20~40명 베타 확대를 안전 완료로 선언하면 안 된다.
- 최근 자동 백업은 2026-09-23 08:14:31 KST다. 전체 복원은 이후 기록을 잃을 수 있다. 코드 배포 문제는 우선 직전 v1.95 배포로 되돌리고 Phase A의 호환 DB 객체는 유지한다.
- 새 배포에서는 기존 사용자가 접속 코드를 한 번 다시 입력해야 한다. 다중 계정 전환도 각 계정에 대해 다시 로그인한 뒤 서버 쿠키로 동작한다.
- Preview에서 한설이 `/api/auth/health`의 `ready: true`, 본인 로그인 및 관리자 계정 13명 목록을 확인했다. 처음 대기 0건 이후 테스트 계정 1건을 신규 신청했고 대기 목록 반영·승인에 성공했다. 최신 Preview에서 저장된 코드 붙여넣기로 새 계정 로그인, 첫 캐릭터·공지·파티 읽기, 일반 길드원 `/admin` 접근 차단을 확인했다. 테스트 계정의 `code`는 한설이 운영 DB에서 직접 변경했고 읽기 전용 검사에서 해시 일치·공백 없음 확인. 값은 공유받지 않았다. 테스트 계정은 임의 삭제하지 않는다.
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
