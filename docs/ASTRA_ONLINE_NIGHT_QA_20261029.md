# ASTRA 통합 온라인 야간 검증·인계

기준 날짜: 2026-10-29 KST. 기능 기준 `c9a376fa5ecb28c575000a86e8a3e4241916d086`.
대상 브랜치: `codex/home-gnosis-iris-integration-20261019`.
운영 기준: main `ca697706a874d21668091588940ceb61338d0700` / IRIS 0.4.3.
이 문서는 이전 로컬 보고서의 **실제 PostgreSQL 미실행** 상태를 갱신한다. 과거 실패와 당시 보고는 삭제하지 않는다.

## 구현과 운영 경계

웹 공통 reporter, IRIS native 연결 수명, ASTRA 온라인 인원·필터·길드원 카드를 통합한 비활성 후보다.
HttpOnly 서버 세션으로 소유권을 확인하고 연결별 sequence와 종료 표식을 관리한다.
기기 수와 무관하게 계정당 한 명으로 집계한다.
온라인 갱신 300초, 임대 720초, ASTRA 조회 최소 60초를 유지한다.
`kind=iris`는 클라이언트 종류 표시이며 기기 인증이나 권한 근거가 아니다.
최근 활동은 실제 입력·포커스에 따른 별도 기록이며 백그라운드 heartbeat로 갱신하지 않는다.

`SANCTUM_ACCOUNT_ONLINE_ENABLED`와 `SANCTUM_ACCOUNT_ACTIVITY_ENABLED`는 배포 환경에서 설정하지 않으면 false다.
격리 시험 프로세스 안에서만 true를 사용했다.
공개 ERGON 잠금과 `executionConnected=false`, CHRONOS 저장·재화 캐시·원장 계약은 유지했다.
운영 DB, 기존 사용자 세션/원장, main, Production, 공개 IRIS 파일에 적용한 변경은 없다.

## 실제 PostgreSQL 결과

Docker Desktop 4.97.0 / Engine 29.9.2 / Compose 5.6.1에서 PostgreSQL **17.11**을 실행했다.
공식 `docker.io/library/postgres:17-bookworm`의 amd64 manifest를 확인하고 다음 digest로 고정했다.

`postgres@sha256:2cd2c0f809604aaeff6f0ec8f40aecbd025613107561015c69369a1a7f1d3416`

새 owner/project, 합성 비밀번호·계정·세션만 사용했다.
network:none, 호스트 포트 없음, tmpfs 데이터, Unix socket psql만 사용했다.
매 SQL 실행 전 owner/project/image/마운트/네트워크를 대조했다.
운영 주소·키·환경 파일을 읽거나 전달하지 않는다.
소유권 확인 실패 시 SQL과 종료 작업 모두 진행하지 않는다.

실제 시험 **17그룹 PASS**:

1. 두 proposal 적용 및 기존 SQL 기본 사례.
2. anon/authenticated의 직접 조회·삭제·RPC 실행 거부, 두 테이블 RLS 확인.
3. 타 계정·없는 세션·만료·승인 대기 요청은 쓰기 0.
4. DB 시각 기준 720초와 더 짧은 세션 만료 우선, 만료 행 온라인 제외.
5. 활동 20분 제한과 heartbeat의 활동 기록 미변경.
6. 두 활동 writer의 명시적 잠금 대기 후 기록 1회/나머지 throttled.
7. touch 보유 → leave 대기 → commit → closed.
8. leave 보유 → 늦은 touch 대기 → commit → closed.
9. 미커밋 행 비공개와 rollback 후 행 없음.
10. 계정 잠금 3초 timeout 및 쓰기 0.
11. 계정 잠금 대기 중 세션 삭제 후 stale 요청 unauthorized.
12. 발견 후 세션 소유권 변경 시 새 계정으로 전이하지 않음.
13. 동시 commit/snapshot 반복에서 권위 시각·TTL 범위 보존.
14. 활성 8/전체 256 제한과 해당 세션의 24시간 지난 행 정리.
15. 7개에서 두 신규 writer를 실제 잠금 대기시켜 최종 8개만 허용.
16. writer 보유 중 계정 삭제가 대기한 뒤 교착 없이 FK 정리.
17. 세션/계정 FK 삭제와 별도 활동 기록의 보존·정리.

실제 12분을 기다린 만료 시험은 아니다. 격리 행/세션 만료 시각을 과거로 바꾸어 실제 SQL의 제외 동작을 확인했다.
동시성 시험은 두 psql 연결과 `pg_stat_activity`의 Lock 관측을 사용했다.
임의 sleep·성공할 때까지 재시도·운영 연결 fallback은 없다.
명시적 보유/대기/commit·rollback·timeout 사례를 확인한 것이며 모든 가능한 교착이나 운영 부하를 증명하지 않는다.
실제 Supabase의 기존 역할·권한·스키마와 동일하다는 보장은 별도 운영 사전 점검이 필요하다.

## HTTP·React·Windows 범위

실제 production API handler → localhost HTTP → 실제 격리 PG → 독립 Chromium 세션 2개: **12 probes PASS**.
HttpOnly, 계정 위조 409, 다중 연결 OR, 하나의 leave 후 나머지 보존, 종료 후 높은 sequence 재전송, 브라우저 offline/복구, API 장애, 마지막 leave, 활동 쓰기 0을 확인했다.
물리 PC는 한 대다. 테스트 계정과 쿠키는 합성 전용이며 운영 로그인/세션을 사용하지 않았다.
별도 기존 in-memory HTTP/모바일 10 probes도 PASS다. 이 시험을 실제 DB 시험으로 합산하지 않는다.

Windows 전용 빌드는 기본 실행을 차단하며, 별도 `--owned-gui --selftest`와 전용 profile·owner·localhost API·격리 PG 검증을 모두 요구한다.
전용 GUI 시험의 최종 판정은 아래 마감 항목에 기록한다.
실제 전체 DesktopWorkspace/로그인 화면의 완성이나 사용자 설치본 검증을 뜻하지 않는다.
운영 0.4.3의 native floating 파일과 웹 컴포넌트 3개를 **테스트 사본/번들에만** 적용했다.
원본 기능 브랜치에 핫픽스를 병합하거나 운영 ZIP을 덮어쓰지 않았다.
외부 WebView 자원·외부 창·전역 단축키·game.* bridge를 차단하고, 게임 창 tracker는 타이머와 모든 Tick 진입을 사본에서 차단했다.
기존 사용자 IRIS·게임은 종료하거나 재시작하지 않았다.

## 실패 이력과 보완

- 최초 GUI 상태 조회 3초 timeout: 정확한 원인은 미확정이다. 후속 성공으로 과거 실패를 소급 해결하지 않는다.
- 플로팅 전환의 protected_store_unavailable: 테스트 경로에서 원자 쓰기 임시 파일이 270자였다. 같은 .NET FileStream의 PathTooLongException으로 RED 재현했고 테스트 출력 경로만 짧게 변경했다. 제품 저장 코드 수정이나 보호 완화는 없다.
- 독립 리뷰 C0/I1/M2: 타이머를 꺼도 설정/너비 변경에서 게임 검색이 가능했다. 사본 Discover에 실패 주입 → RED, 사본 Tick 전체 차단 → GREEN. 실제 게임으로 재현하지 않았다.
- 준비 실패의 컨테이너 누수는 ready/bootstrap 실패에서 소유 확인 후 stop으로 보완했다. 소유 확인 자체가 실패하면 임의 종료하지 않고 진단 자료를 남긴다.
- 활동/정원 시험의 Promise.all만으로는 잠금 경합을 증명할 수 없어 실제 Lock 관측/barrier를 추가하고 17그룹 전체를 재검증했다.
- 새벽 React의 “2시간 전” 기대 실패: 실제 표시 “어제”가 올바른 달력 경계였다. 제품 formatter는 유지하고 두 합성 브라우저 시각을 정오로 고정했다. 기대값을 완화하지 않았다.
- 격리 Next 사본에 hooks/types가 빠진 첫 build 실패 후 필요한 소스 복사를 보완했다. 최종 62 route build PASS.
- GUI와 같은 3000 포트에 별도 HTTP 시험을 시작한 경우 EADDRINUSE로 안전 중단했다. 기존 서버는 건드리지 않았고 새 소유 컨테이너만 중단했다.
- GUI 쿠키 삭제 직후 로그아웃 판정 실패는 원본 결과를 보존했다. CookieManager 변경이 아직 반영되지 않은 readback을 확인했다. 변경은 한 번만 보내고 최대20회/50ms의 읽기 확인으로 완료 경계를 맞춘 뒤 최종 GUI 시험을 통과했다. 제품 cookie/native 실행 보호는 바꾸지 않았다.

## 최종 회귀

- 전체 Node **756건: 753 PASS / FAIL 0 / 기존 SKIP 3**. native 저장·N04·C/D-0·미확인 결과 보호를 포함한다.
- 실제 React 9개 파일 PASS: ASTRA online/activity, CHRONOS 전환 저장, 재화 cache, ERGON wood/status/result/page/lifecycle/public lock.
- 별도 native 사본 검색 차단 시험 1 PASS(전체 Node에 포함).
- TypeScript·변경 범위 ESLint PASS.
- 격리 Next webpack build 62 routes PASS. 합성 URL/키만 제공하고 온라인/활동 flag false로 빌드했다.
- 기존 Astra/layout lint 22오류·9경고는 이전 HEAD와 동일한 별도 문제이며 이번에 수정하지 않았다.
- 합성 시험 PASS를 실제 게임이나 운영 사용자의 성공으로 보고하지 않는다.

## 비용과 보존 한계

40명×1/2연결, ASTRA viewer4개/60초, 실제 입력에 해당하는 활동 신호20분 조건의 기존 실제 reporter/API 가상 하루 계측이다.
임의로 활동 타이머를 제품에 넣은 것이 아니다.

| 연결/명 · 하루 | 월 API 정상 주기 | 월 RPC adapter |
|---|---:|---:|
| 1 · 8시간 | 204,480 | 201,600 |
| 2 · 8시간 | 348,480 | 345,600 |
| 1 · 24시간 | 613,440 | 604,800 |
| 2 · 24시간 | 1,045,440 | 1,036,800 |

매일 종료80건을 포함한 2연결/8시간은350,880+B, 24시간은1,047,840+B다.
B는 기존 다른 기능·시작/로그인/계정 변경·오류 요청이다.
월 내내 연속 실행이면 종료를 매일 더하지 않는다.
[Vercel Hobby 기준](https://vercel.com/docs/functions/usage-and-pricing) 100만 호출과 비교하면 24시간/2연결은 이 가정만으로도 초과한다.
[Supabase Free](https://supabase.com/pricing)의 API unlimited가 DB·compute·egress 여유를 뜻하지 않는다.
실제 PG에서 40계정/80연결을 넣은 한 샘플은 online 테이블/인덱스229,376B, snapshot 3.228ms였다.
빈 데이터로 되돌린 이전 시험 흔적의 페이지도 포함된 크기다. 계정당 용량·Vercel CPU·운영 지연으로 외삽하지 않는다.
RPC adapter 호출 수는 내부 SQL문 수나 DB 쓰기 횟수와 다르다.

전역 만료 session/lease 정리는 아직 미구현이다.
해당 세션이 다시 접속할 때의24h 정리와 세션 삭제 FK만으로는 전체 저장량 상한을 보장하지 못한다.
운영 활성화 전 별도 보존 정책·권한·주기·최대 행 수를 확정해야 한다. 기존 인증 세션 의미를 임의 변경하지 않았다.

## 순월의 다음 순서와 승인

1. 개인/미전송 변경을 먼저 보존하고 기능 브랜치 최신 원격을 안전하게 수신한 뒤 ACK한다.
2. 본 문서의 최종 전송·GUI 마감 항목과 [TO_SOONWOL](relay/TO_SOONWOL.md)을 확인한다.
3. 자체 격리 Docker에서 [PG 실행기](../tests/account-online.pg-run.mjs)를 사용한다. 공식 digest가 없으면 검토 후 준비하며 실제 운영 주소로 대체하지 않는다.
4. 미실행 Windows 항목, 절전/복귀, 실제 로그인 UI·운영0.4.3 전체 합성 조합을 보완한다.
5. 전역 정리·무료 한도·현재 운영 스키마/권한 사전 점검 및 되돌림 계획을 확정한다.
6. 운영 SQL 적용·flag 활성화·main 반영·Production·공개 IRIS 업데이트는 각각 한설의 별도 승인을 받는다.

기능 브랜치는 여전히 IRIS 0.4.2 release metadata/ZIP을 포함한다.
운영 main의 0.4.3 sidebar-return 관련4파일과 버전/설치 metadata를 통째로 되돌리면 안 된다.
향후 운영 후보는 0.4.3 위에 온라인 변경만 선별해 검증한다.
개인12·기존 ACK·원장·암호문·원본 로그·격리 DB/프로필·이미지는 전송하지 않는다.
10월27일 수신 ACK 두 문단은 원본에 보존하고 이번 ASTRA 전송에서 제외한다.

## 전송·GUI 마감

2026-10-29 00:57 KST Windows GUI 자기시험 **PASS**.
실제 WebView2/WinForms·전용 프로필·HTTP·격리 PG로 사이드바 → 플로팅 메뉴 → 실제 사이드바 전환 버튼 → 다시 플로팅 → tray icon을 둔 채 form 숨김 →316초 실제 heartbeat → A/B 쿠키 전환 → 로그아웃 → 재접속 → native 정상 종료를 확인했다.
최종 실제 DB의 온라인은0명, native touch4/leave3/활동 쓰기0이었다.
소유 확인 등 검증 제어를 포함한 HTTP24건/RPC adapter7건이며 운영 호출량으로 외삽하지 않는다.
외부 fetch/game bridge 거부와 native 사본의 게임 검색 차단도 확인했다.
캡처는 검증 폴더에만 보존하며 화면이 격리 안내 페이지임을 눈으로 확인했다.

**미실행:** 실제 전체 DesktopWorkspace/로그인·로그아웃 API UI, 사용자 설치본, 물리PC2대, 실제 host NIC 차단/절전·복귀, tray 메뉴를 사람이 클릭하는 조작, DPI 전 조합.
트레이 검증은 실제 NotifyIcon과 숨긴 form의 native 수명이지 전체 운영 트레이 메뉴 조작 검증이 아니다.
운영 연결과 실제 게임은 사용하지 않았다. GUI PASS를 자동 생산·운영 사용 완료로 해석하지 않는다.

전송은 기능 브랜치의 검증된53파일에 한정한다. 이전32+검증12+야간9파일이며, 원본 로그/프로필/암호문·개인 변경은 제외한다.
최종 전송 SHA는 후속 인계 기록과 기능 브랜치 원격 HEAD를 대조한다.

2026-10-29 영겁 전송 기준: 제품·시험·SQL proposal·검증53파일 커밋 `c091bc47450fc031034a3099600a595b390f7781`. 기능 브랜치 `codex/home-gnosis-iris-integration-20261019`에 이 문서 마감 커밋과 함께 일반 push한다. 최종 원격 SHA는 이 마감 기록을 포함한 기능 브랜치 HEAD이며 순월은 Git 이력과 대조한다. 운영 적용·flag 활성화·공개 배포는 없다.
