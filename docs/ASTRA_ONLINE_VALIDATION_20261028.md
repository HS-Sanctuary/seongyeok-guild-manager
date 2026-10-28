# ASTRA 실제 사용 검증 준비·격리 검증 — 2026-10-28

상태: **미커밋 로컬 검증 패키지. 운영 비활성·실제 PostgreSQL/Windows IRIS GUI 검증 미실행.**
기준 feature `codex/home-gnosis-iris-integration-20261019` / `c9a376fa5ecb28c575000a86e8a3e4241916d086`.
운영 main `ca697706a874d21668091588940ceb61338d0700` / IRIS0.4.3.

## 1. 전송·자료 보존 확인
원격 feature는 c9a376f로 그대로이며 ASTRA 온라인 후보32파일은 **아직 commit/push되지 않았다**. 앞선 요청은 선별 전송 준비까지만 승인했으므로 이번에도 push를 실행하지 않았다.
기존32파일 지문 모두 일치함을 이번 문서 갱신 전에 확인했다. 제품·SQL proposal은 이번 검증에서 수정0, 이후 한국어 인계 문서에만 누적한다.
집 원본 개인12/삭제 상태·옛 C/D-0 ACK/미전송4·사용자 원장·ignored 원본 로그 보존. force/reset/stash·원장 접근/삭제·게임 CLI·사용자 IRIS 실행/종료0.
원격 main/공개 ZIP/metadata 변경0. 최초 생성한 검증 EXE는 안전 검토 뒤 .disabled로 보관했으며 사용자 IRIS 파일을 이름 변경한 것이 아니다.

## 2. 이번 PASS/FAIL/미실행
| 대상 | 결과·실제 범위 |
|---|---|
|최종 전체 Node/native 보호|755 중752 PASS / FAIL0 / 기존 SKIP3|
|새 Node 도구 시험|계측1·PG preflight2 PASS|
|독립된 두 Chromium 컨텍스트 + 실제 loopback HTTP|10probes PASS. 실제 API handler/브라우저 네트워크이며 DB·인증 결과 저장소는 합성|
|HTTP 계측 이번 실행|HTTP22, 합성 RPC adapter19, 기대한401/409거절3, activity POST0. 실제 DB호출0|
|API 가상 하루4조건|40명·1/2연결·8/24h, 실패0. 실제 reporter/handler 실행, 월 수치는30일 환산|
|기존 실제 React9종|온라인/활동·CHRONOS 전환 저장·재화·ERGON C/D-0·결과/종료·ACK·공개잠금 PASS|
|TypeScript·관련 ESLint|PASS. 이전 Astra/layout22오류9경고는 별도 기존 상태|
|격리 IRIS0.4.3 native compile|PASS. 운영0.4.3 floating 소스는 ignored 사본에만 반영|
|검증 EXE 실행 차단|기본 실행과 유효 테스트 root 모두 exit2/NOT_RUN PASS. GUI/네트워크/기존 프로필 열기0|
|Compose YAML|정적 parse PASS: network:none, host port없음, pinned image/고유 project·owner 필수. Docker 실행 검증 아님|
|실제 PG 권한/RLS/경합/만료|**미실행**: Docker/psql/postgres/initdb/pg_ctl이 PATH·확인한 표준 설치 경로에서 발견되지 않음|
|실제 Windows IRIS sidebar/floating/tray·절전|**미실행**: 검증 entry를 컴파일 전용으로 잠갔음|
|실제 물리 PC2대/운영 사용자 계정2개|미실행. 실제 계정/세션은 만들거나 수정하지 않음|
|Vercel CPU/운영 DB SQL·용량/실사용 analytics|미측정. 새 Supabase/Vercel 운영 호출0|
|새 격리 Next build|이번 제품 source 불변으로 재실행하지 않음. 앞선 후보 격리 build PASS 기록을 유지|

기존3 SKIP은 mobile heading surface/separator/completion 스타일이다. 현재 미해결 전체 회귀 FAIL은 없다.
초기 HTTP fixture는 기존 CSP connect-src none·기록 없는 합성 계정의 잘못된 seed·인증 전환 이벤트 누락 때문에 실패했다. 원인을 분리해 새 fixture만 수정했고 동일 흐름 PASS했다. 기대값을 완화하거나 제품 코드를 고치지 않았다.
이전 PG/Windows 미검증을 합성 PASS로 대체하지 않는다. ERGON 과거 수령 예외 원인 미확정도 그대로다.

## 3. 두 세션에서 실제로 확인한 것
- 로그인 계정A/B와 추가B세션은 메모리의 합성 소유자이며, 운영 DB 계정이 아니다.
- 독립 browser context2개에 HttpOnly cookie를 넣고 renderer에서 읽을 수 없음을 확인했다.
- 실제 fetch→localhost HTTP→제품 POST/GET/명단 handler→합성 RPC 경계를 통과했다. 익명 Presence를 통합 온라인 증거로 쓰지 않는다.
- 두 계정 온라인2명, 온라인 필터,320/390px, 최근 활동과 온라인 별도 표시를 확인했다. 기존12폭/글자 조합 React도 별도 PASS.
- browser context의 **실제 offline** 전환에서 요청 실패→온라인 확인 불가, 복구 후 재조회 확인. 타 context는 유지했다.
- A→별도B세션으로 cookie 교체 시 늦은A쓰기409 거절, 한B세션 철회 후 다른B세션 유지,720초 경과 합성 시각 이후0명, 재갱신·명시적leave 후0명을 확인했다.
- heartbeat로 activity POST가 발생하지 않아0건이었다.
여기서 세션·임대 판단은 in-memory adapter다. 실제 SQL의 RLS/row lock/동시성 또는 native IRIS GUI 증명은 아니다.

관련 도구: tests/account-online.http.fixture.mjs, tests/account-online.sessions.browser.mjs.
브라우저는 loopback origin 외 요청을 차단했고 fixture 종료 후 소유 browser/server만 닫았다.

## 4. PostgreSQL 환경 준비
현재 [preflight](../tests/account-online-pg-preflight.mjs)는 NOT_RUN이다. DB URL을 받거나 운영으로 fallback하지 않고 Docker version/image inspect만 허용한다. 자동 설치·pull·start·DB 접속0.
[Compose](../tests/fixtures/astra-online.compose.yml)는 공식 Postgres17의 검토된 digest를 지정하고 로컬에 준비한 경우만 쓴다(pull_policy never). 다른 major의 PGDATA 구성을 그대로 사용하지 않는다.
고유 ASTRA_VALIDATION_PROJECT/OWNER, ignored의 합성 password 파일이 필요하다. network:none·TCP listen없음·host port없음·새 tmpfs 데이터다. 기존 Docker project/container가 있으면 재사용/정리하지 않고 고유 owner를 대조한다.
SQL은 docker exec의 Unix socket으로만 실행하며 다른 PG URL·운영 .env·실제 계정 데이터를 전달하지 않는다.

다음 준비 순서:
1. [공식 Windows Docker 준비 조건](https://docs.docker.com/desktop/setup/install/windows-install/)을 확인하고 설치/WSL·가상화 등 시스템 변경이 필요하면 한설에게 먼저 설명한다. 승인된 별도 일회용 PostgreSQL이 있으면 그 격리 근거를 먼저 확인한다.
2. 승인된 공식17 digest를 로컬에 준비하고 고유 project/owner·새 합성 secret을 만든다. 실제 서비스 비밀값을 복사하지 않는다.
3. **소유한 새 컨테이너/네트워크:none/tmpfs** 확인 뒤 psql -X 및 ON_ERROR_STOP=1로만 실행한다. 기존 클러스터나 운영 SQL Editor에는 아래 파일을 넣지 않는다.
4. current DB=astra_validation, user=astra_fixture_admin, validation_mode=isolated를 확인한 세션에서 [bootstrap](../tests/fixtures/astra-online.pg-bootstrap.sql) 실행. 기존 accounts/sessions/역할이 있으면 중단한다.
5. 두 proposal을 빈 합성 DB에 각각/함께 적용하고 [cases](../tests/fixtures/astra-online.pg-cases.sql) 실행. fixture marker 없으면 중단한다.
6. 아래 동시성·보존·부하 단계를 별도 두 SQL 연결에서 수행한다.
7. 실패 시 결과/SQL을 보존하고 **소유 표식이 일치하는 이번 테스트 컨테이너만** 종료한다. 기존 프로젝트·사용자 DB·원장은 정리 대상으로 삼지 않는다.

두 SQL 파일 자체에도 ON_ERROR_STOP+BEGIN/COMMIT·현재DB/사용자/mode·bootstrap marker 검사를 넣었다. 이 방어가 실제 PG에서 잘못된 환경 후속 문장을 막는지 아직 실행하지 못했다.

### 실제 PG 필수 잔여 시험
- anon/authenticated/PUBLIC의 직접 SELECT/INSERT·RPC 거부, service_role invoker 최소권한·RLS·FK 실검사.
- null/만료/철회/pending·다른 계정 기대값은 쓰기0, 승인 계정만 허용.
- 같은 계정의 여러 session/connection은1명, 한 연결leave가 다른 연결을 지우지 않음.
- 연결1에서touch 후 잠금을 유지하고 psql barrier를 출력, 연결2에서leave를 보낸 뒤1commit. 반대 순서도 수행해 최종closed·늦은높은seq부활0. 고정 sleep이나 무한 재시도를 사용하지 않음.
- account→session 재검사 잠금 중 logout/삭제·코드 변경,3초 lock timeout 후 불확실한 결과를 성공으로 만들지 않음.
- session 만료와720초 lease의 빠른쪽 이후 자동 제외. 행 물리 삭제와 온라인 여부를 구분.
- 단일 statement snapshot과 동시touch commit 반복. observedAt+720초 상한/중복/잘못된 DTO를 확인.
- active8/보존256·24h cleanup·env분리·FK, 실제 index/query plan·row/index 크기 측정.
- 전역 만료 session/lease GC가 없는 현재 제안의 보존정책을 별도로 확정. 운영 활성화 차단 조건 유지.
최근 활동 테이블/RPC/flag는 독립이며 heartbeat가 last_active_at/last_seen_at을 쓰지 않는다.
[PostgreSQL 공식 격리 설명](https://www.postgresql.org/docs/17/transaction-iso.html)과 실제 두 연결 결과를 함께 판단한다. 지금은 정적 검토/준비만 완료했다.

## 5. Windows IRIS 검증 빌드
[빌더](../tests/iris-online-validation-build.ps1)는 c9a376f 후보를 소스 사본으로 복사하고 운영 main ca69770의 floating4파일을 **ignored에만** 읽어 적용했다. 원본 feature/main·release/ZIP/metadata는 그대로다.
게임 bridge 전체/게임 포커스/전역 단축키를 사본에서 차단했고 프로필·DPAPI 경로는 EXE 아래 고유 test root만 허용하는 entry를 마련했다. 운영 singleton/updater를 실행하지 않는다.
초기 owner handshake만으로는 이후 API의 합성DB 격리를 보장하지 못한다는 리뷰에 따라 **GuiIsolationReady=false를 고정**했다. 그래서 올바른 test root를 줘도 창/네트워크/사용자 프로필을 열지 않는다. WebView 외부 요청·외부 브라우저 열기도 사본에서 차단했으나 실제 GUI 동작 검증은 아직 아니다.
결과 manifest와 compile source/EXE는 ignored 검증 폴더에만 있다. 최초 생성본은 .disabled로 보존했다. 공개 설치 파일이나 지금 사용할 앱으로 배포하지 않는다.

GUI를 열기 전에 남은 기술 작업:
- 소유 확인 endpoint가 있는 localhost:3000 전용 test API와 실제 격리 PG adapter를 연결. 현재 browser HTTP fixture는127.0.0.1:3011이고 native용 서버가 아니다.
- 전용 서버가 운영 환경변수/키/DB로 접속할 수 없음을 검증하고 의도적인 외부 URL/API가 모두 거절되는지 확인.
- web-overrides의 운영0.4.3 파일3개를 실제 제공 모듈에 연결하고 렌더된 지문을 확인. **복사·native compile만으로 공식0.4.3 웹 검증을 했다고 하지 않음.**
- 그 뒤에만 GUI gate를 재검토. sidebar/floating/tray·정상 종료·로그아웃·네트워크·A→B→A·절전/복귀를 테스트 계정/프로필에서 검증.
- 한PC의 browser contexts2개를 물리PC2대 검증으로 바꾸어 부르지 않는다.
운영 IRIS를 닫거나 실제 세션을 바꾸지 않고 검증할 수 있어야 한다.

## 6. 호출량 실측 범위와 무료 여유
[계측 도구](../tests/account-online.metrics.mjs)는 실제 reporter와 API handler를 가상 시각으로 하루 실행했다. 네트워크/DB는 합성으로 대체했고 actual SQL·Vercel CPU는 측정하지 않았다.
40명·1/2연결, viewer4개가 매60초 읽고, 각 client에20분마다 실제 입력에 해당하는 합성 event를 주는 정상 조건이다. 백그라운드 IRIS에 활동 타이머를 추가한 것이 아니다.
종료 요청은 기대 계정 수를 출력하지 않고 **실제 leave callback과 종료 후 RPC 증가량**으로 계측한다.

| 연결/명·시간 |월 API 정상 주기|월 RPC adapter|가상 하루 실제 leave|
|---|---:|---:|---:|
|1·8h|204,480|201,600|40|
|2·8h|348,480|345,600|80|
|1·24h|613,440|604,800|40|
|2·24h|1,045,440|1,036,800|80|

API에는 online touch/read·activity POST·activity ACK directory GET가 포함된다. RPC열에는 directory 내부 query와 session lookup SQL이 포함되지 않으며 **실제 SQL문 수/DB쓰기 수가 아니다**. DB 내부 함수의 여러 statement도1 RPC 안에 들어간다.
2연결8h 가상 하루는API11,616건·RPC11,520건, 종료80건 후 RPC11,600건이다. 모두 성공했으며 다른 API/시작·로그인·계정 변경·오류는 별도다.
매일 정상 종료까지 포함하면2연결8h 월350,880건+B,24h는1,047,840건+B다.24h 연속 월1회 종료라면 종료80건만 추가해야 하며 일별 종료 가정을 혼동하지 않는다.
[Vercel Hobby](https://vercel.com/docs/functions/usage-and-pricing) 월100만 호출 기준8h의 호출 여유는649,120-B이고24h는이미47,840건 초과(매일 종료 가정). CPU/메모리·기존 트래픽 여유는 미측정이다.
[Supabase Free](https://supabase.com/pricing)의 API unlimited 표기는 shared compute/DB500MB/egress5GB의 여유를 증명하지 않는다. 실제 PG 실행기반이 없어 SQL시간·DB용량/egress는 측정하지 못했다.
Node virtual day wall-time을 Vercel CPU나 운영 지연으로 외삽하지 않는다. 무료 운영 확정·유료 전환·활성화 승인 아님.

## 7. 독립 검토·최종 상태
독립 검토1회 C0/I2/M2.
- I1 SQL guard 실패 후 뒤 문장이 진행할 위험: ON_ERROR_STOP·전체 transaction·SET LOCAL ROLE·fixture marker를 보완. 실제 PG 오류/rollback 시험은 미실행.
- I2 GUI 향후격리 미완결: 현재 GUI를 무조건 차단하여 위험을 막고 컴파일 전용으로 명확히 제한. 전용 서버/외부요청 거절의 실제GUI 검증은 남음.
- M leave 기대값을 실측으로 출력하던 문제: 종료 후 RPC11600 기대 시험 RED→실제 leave/RPC 카운터 GREEN, 최종 전체755건(752 PASS/기존3 SKIP) 기준 포함.
- M 운영0.4.3 web override loader 미연결: **보류**, GUI 검증 전 필수 항목.
중요 지적을 해결한 것과 환경 미확인 때문에 실행을 차단한 것을 구분한다. 별도 재리뷰는 하지 않았다.

다음은 분리 PostgreSQL 실행기반 확보와 native용 전용 API/웹 loader 연결이다. Docker/WSL 설치·OS 기능 변경이 필요하면 별도 설명/확인한다. **격리 SQL·합성 검증 자체는 이번 승인 범위**이고 중복 승인을 요구하지 않는다.
commit/push, 운영 DB 적용, main/Production·공개 IRIS 업데이트·실제 게임 행동은 여전히 별도 승인 사항이다.
