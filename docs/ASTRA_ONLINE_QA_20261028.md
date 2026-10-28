# ASTRA 웹·IRIS 통합 온라인 로컬 구현 보고 — 2026-10-28

> 최신 정책: [후속 마감·비용 비교](ASTRA_ONLINE_CLOSEOUT_20261028.md)의300초/720초가 현재 후보이며 아래180초/600초와 비용은 최초 구현 당시 결과다. 운영 비활성·미전송 유지.

기준 기능 브랜치: `codex/home-gnosis-iris-integration-20261019`.
수신 HEAD: `c9a376fa5ecb28c575000a86e8a3e4241916d086`.
상태: **별도 관리 worktree의 detached HEAD에 미커밋 보존. commit/push/운영 DB 적용/flag 활성화/배포 미실행.**

## 수신 및 기존 자료 보존
순월의 활동 후보와 SQL 제안·기본 비활성·과거 수령 terminal 예외 원인 미확정을 확인하고 TO_YEONGGEOP에 ACK했다.
집 원본 개인12/삭제 상태, 이전 worktree의 ACK 및 미전송4항목은 그대로 보존했다. 겹치는 ACK를 새 수신함에 누적했으며 과거 메시지를 교체하지 않았다.
ERGON B/C/D-0 제품·원장·unknown·공개 잠금·executionConnected=false, IRIS0.4.3 release/metadata는 수정하지 않았다.
실제 게임/CLI/사용자 보호 파일/운영 DB 네트워크 호출은0이다. Supabase 문서 검색은 구현 참고용이며 프로젝트 DB 조회가 아니다.

## 구현 범위와 동작
- 기존 Presence는 ASTRA 방문자 닉네임을 클라이언트가 게시했다. 새 온라인은 서버 HttpOnly 세션의 승인 계정/만료를 확인하는 연결별 임대로 분리했다.
- 웹 공통 layout reporter와 IRIS native 연결 관리자가 각각 180초 간격 heartbeat. 새 API POST/GET /api/account/online, 서버 flag는 `SANCTUM_ACCOUNT_ONLINE_ENABLED` 기본false.
- native는 전용 WebView CookieManager와 기존 고정 허용 origin만 사용. renderer로 쿠키/토큰을 전달하거나 파일에 저장하지 않는다. 플로팅/사이드바/숨김에 따른 Visible 조건을 온라인 유지 조건으로 사용하지 않는다.
- native 정상 종료는 bounded HTTP leave를 기다리고, Dispose fallback은 best effort이다. 네트워크 불명/강제 종료/절전은 DB lease600초 만료. 웹 종료 leave 역시 best effort이며 bfcache 복귀는 새 연결이다.
- 여러 기기/탭은 세션+connectionId로 분리하고 계정별 OR 집계. 한 연결 종료는 다른 연결을 삭제하지 않는다. sequence/closed tombstone으로 늦은 touch가 종료 연결을 부활시키지 않도록 제안했다.
- 계정 전환: native는 최대15초 쿠키 점검 때 구 쿠키 연결을 종료하고 새 ID를 만든다. 웹은 expectedAccountId로 잘못된 계정 기록을 차단한다. 쿠키 교체 뒤 구 계정 leave가 거절되면 구 연결은 TTL로 정리한다(다른 기기의 유효 연결은 유지).
- 로그아웃은 기존 세션 삭제와 snapshot join/FK 계약으로 제외한다. 기존 logout 구현이 세션 삭제 실패를 삼키는 경우 실제 삭제/leave의 즉시 해제를 보장하지 못하며 TTL이 안전장치다. 인증 경로를 이번에 확대 수정하지 않았다.
- ASTRA 온라인 인원/필터/모바일·PC 카드에 같은 인증 snapshot 적용. 통합 disabled는 기존 기능을 '웹 ASTRA 연결'로 한정 표기하며, 오류 때 anonymous Presence를 인증된 온라인으로 합치지 않는다.
- 최근 활동 reporter/활동 테이블은 재사용·독립 유지. heartbeat가 활동 POST나 character updated_at을 갱신하지 않는다.
- 서버 관측 시각+클라이언트 monotonic 경과로 PC 시계 차이에 따른 만료 오판 방지. 관측 실패는 '온라인 확인 불가'. 조회는 보이는 ASTRA에서 최대60초마다, focus/online/visibility 반복도 최소 간격 준수. disabled 확인 뒤 추가 주기 네트워크 요청 없음.
- 화면의 상태 반영은 조회 간격만큼 늦을 수 있다. 비정상 종료는 lease 약10분+최대1분 조회 간격이며 실시간 즉시 해제를 보장하지 않는다.

## 제품 및 시험 파일
서버/공통: lib/accountOnline.ts, lib/server/accountOnline.ts, lib/useAccountOnline.ts, app/api/account/online/route.ts.
웹: components/common/AccountOnlineReporter.tsx, app/layout.tsx, app/lounge/components/AstraView.tsx.
native: iris/desktop-online.cs, iris/desktop-webview.cs, build-beta.ps1/desktop.ps1 및 기존 native compile fixture의 소스 목록.
시험: tests/account-online*.mjs, iris/desktop-online.fixture.cs·tests.ps1. 기존 account-activity.browser는 새 기능 disabled 응답만 합성했다.
[미적용 SQL 제안](../supabase/proposals/20261028_account_online.sql), [설계](superpowers/specs/2026-10-28-astra-online-design.md), [계획](superpowers/plans/2026-10-28-astra-online.md).

## 최종 검증
| 범위 | 결과 |
|---|---|
| 전체 Node / 포함 native 보호 | 752 중749 PASS / FAIL0 / 기존 SKIP3 |
| 신규 온라인 Node | 12 PASS (native 수명 합성1 포함) |
| 실제 ASTRA+웹 reporter React | PASS: 통합 count/filter/card, no-focus, ABA/늦은 응답, 조회13→1, 시계 차이, 320/390/768/1280 ×18/20/22 |
| 기존 활동 React | PASS: 기록/저장 분리, disabled, 계정 전환/늦은 응답, 12 크기 |
| 기존 보호 React7 | PASS: D-0, 결과 작업대, page 전환/종료, lifecycle ACK, CHRONOS 저장, 재화 캐시, 공개 잠금 |
| native 수명 합성 | PASS: 숨김/트레이 동등 tick, 쿠키 ABA, single flight, 종료, 응답 지연, disabled, 네트워크 실패 |
| 실제 native private compile | PASS, 격리 출력만 생성·실행/공개 설치본 변경0 |
| TypeScript / 신규·관련 ESLint | PASS |
| 격리 Next build | PASS, 합성 환경변수·운영 DB0 |
| 기존 Astra/layout 전체 lint | 기존22오류/9경고 유지(HEAD 대비 규칙/건수 동일), 신규 오류0 |
| 실제 PostgreSQL / 실제 설치본 트레이·절전 | 미실행 / 배포 전 별도 승인·검증 필수 |

기존3 SKIP은 320px heading surface/left marker, thin separator, completion pill 스타일 시험이다.
원본 로그·스크린샷·synthetic DPAPI 및 EXE는 ignored 격리 영역에만 보존한다.

## 실패 재현과 검토 결과
- 최초 전체749 시험:745 PASS/1 FAIL/3 SKIP. 이번 PS 목록 편집이 BOM을 제거하여 tray 한글 인코딩 시험이 실패했다. 원래 UTF-8 BOM을 복구하고 해당 시험 및 최종752 전체 GREEN. 최초 실패 로그도 보존한다.
- 기존 HEAD ASTRA는 통합 온라인2명 시험 RED. 새 구현 GREEN.
- 같은 계정 재확인 이벤트에서 React batching으로 read effect가 재시작되지 않는 문제 RED→revision fencing GREEN.
- PostgreSQL ISO timezone/microsecond 반환은 strict browser DTO와 달라 RED→서버 UTC 정규화 GREEN.
- PC 시계 하루 오차 RED→서버 시각/monotonic 경과 GREEN.
- 독립 검토1회: Critical0 / Important3 / Minor0. focus12회→GET13, 무기한 POST flight, SQL 시각/집계 별도 statement race.
- 앞의2건은 실제 합성 RED→최소 수정 GREEN. heartbeat 전체 fetch+JSON 대기에10초 deadline, 이후180초 주기 복구·늦은 ACK 무효.
- SQL은 권한/관측 시각/leases를 **하나의 statement snapshot + MATERIALIZED clock CTE**로 수정했다. +1ms expiry parser 거부는 합성 확인했지만 **두 실제 PostgreSQL 연결 경합 검증은 미실행**이다. 이를 runtime PASS나 운영 적용 가능 확정으로 보고하지 않는다.
- 기존 순월 수령 terminal 저장 예외의 정확 원인은 이번 온라인 작업으로 해결됐다고 주장하지 않는다.

## 비용 비교와 무료 운영 조건
[Supabase Presence](https://supabase.com/docs/guides/realtime/presence)는 느린 상태 변경에 적합하지만 현 인증은 Supabase Auth JWT가 아니다. 안전한 커스텀 JWT·Presence payload 검증/권한과 native WebSocket을 추가하는 비용을 피하고 기존 서버 세션을 재사용했다.
[Realtime Free](https://supabase.com/docs/guides/realtime/limits)는200 동시연결, [메시지 포함량](https://supabase.com/docs/guides/realtime/pricing)은월200만이며 Presence fan-out도 고려해야 한다.
선택한 heartbeat는 신규 Realtime 연결/메시지/Storage0이고, DB 임대1테이블+server-only touch/snapshot RPC2의 **제안만** 추가한다. 환경은 서버 VERCEL_ENV/로컬 개발 환경으로 결정해 production/preview/development/local 분리, 클라이언트 scope 선택 불가.

- 40명×2연결×8시간×30일 /180초 = POST384,000회/월.
- ASTRA 동시4명×8시간×30일 /60초 = GET57,600회/월.
- 합계441,600회+기동·종료·계정 변경·재접속. 임대 갱신과 snapshot 모두 요청당1 RPC이며 항목별 N+1은 없다. 세션별 active8/당일256 보존 상한 및 touch 시 자기 세션의 하루 지난 행 정리, 세션 삭제 FK cascade를 제안했다. 활동 집계20분 요청은 이 비용에 합치지 않았고 별도 기존 부하다.
- 80연결24시간이면 heartbeat만1,152,000회/월로 Hobby 포함 호출수를 넘는다.
- [Vercel Hobby 현재 기준](https://vercel.com/docs/functions/usage-and-pricing): 월100만 invocations, active CPU4시간, provisioned memory360GB-hours.441,600회라면 CPU 평균10ms→약1.23시간, 메모리1GB/요청 wall300ms 단순 합산→약36.8GB-hours라는 가정치다. 실제 latency/concurrency/기존 트래픽/DB/egress 여유는 측정하지 않았다.
- 따라서 무료를 보장하거나 유료 전환을 전제하지 않는다. 실제 남은 quota와 켜두는 시간을 확인한 뒤 cadence·노출·동시 사용 조건을 정하고 활성화한다. 초과 예상 시 비활성 유지/heartbeat를 늘려 만료 여유를 함께 조정/ASTRA 열 때만 batch 확인/세션 범위 대표 연결 등 무료 대안을 별도 검토한다.

## 배포 전 필요한 승인과 남은 제약
1. 로컬 diff 검토 후 기능 브랜치 선별 commit·push 승인.
2. 새 SQL의 실제 staging PG 권한/RLS/FK·경합·정원/cleanup·session revoke·환경 분리 검증과 운영 DB 적용 별도 승인. 기존 활동 DB 제안 적용을 온라인의 전제로 가정하지 않는다.
3. 무료 잔여량 및 운영 cadence 승인 후 flag 활성화. disabled client는 reload/쿠키 변화 후 재확인이 필요하다.
4. 후보 native 설치본에서 실제 HttpOnly cookie/normal·floating·tray·정상 종료/절전·복귀·다중 PC를 승인된 테스트 계정으로 확인.
5. main/Production 및 공개 IRIS 업데이트 별도 승인. 공개0.4.3 바이너리에는 새 native heartbeat가 없으므로 웹만 배포해 IRIS 통합이 완성됐다고 안내하지 않는다.
이번에는 위 승인 어떤 것도 실행하지 않았다. 사용자가 볼 화면 경로는 AGORA → ASTRA(`/lounge`)이며 실제 운영 화면 변화는 아직 없다.
