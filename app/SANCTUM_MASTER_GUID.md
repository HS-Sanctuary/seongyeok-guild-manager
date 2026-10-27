# 🏛️ SANCTUM Master Guide

### 2026-10-27 C/N04 기능 브랜치 선별 전송

한설의 최종 승인으로 아래 로컬 C 및 N04 검증 변경만 전송한다. 사용자 공개 구조·서버/API/DB/RLS·IRIS0.4.3 설치본 구조 변경 없음. PC 로컬 목재 진행 저장/관측 경계는 앞선 C 설명을 따르며 native raw production 소비 route는 없다. 기준 B971a4d8·최종 source19 검증본 일치, 전체714/711 PASS/FAIL0/기존3 SKIP. 정확 SHA/미구현/금지 경계는 [최신 인계](../docs/ERGON_NEWOL_HANDOFF.md)와 [N04 QA](../docs/ERGON_N04_HOME_RECOVERY_QA_20261027.md)를 대조한다.

### 2026-10-27 집 N04/C 후속 — 로컬 검증 마감, 전송 승인 대기

기존 C 구조는 재사용한다. native journal의 game run-lock 공유 충돌만 내부 LifeExecutionLeaseBusyException으로 구분하고 executor 생성자는 다른 복구 IOException을 전파한다. 파일 형식·원장 정책·실제 소비 경로·서버/DB 구조 변경 없음. N04 FirstChance/fielddiff/소유 GC fixture는 시험 runner에만 포함한다. 최종 전체714/711 PASS/FAIL0/기존3 SKIP이며 [미확정/승인 경계](../docs/ERGON_N04_HOME_RECOVERY_QA_20261027.md)를 따른다. main/공개 설치본·잠금은 그대로이고 commit/push하지 않았다.

### 2026-10-26 집 C 로컬 후보 — 전송 보류

기존 공통 writer/game lease·journal/ProgressStore를 재사용하는 별도 DesktopWoodProgressStore DPAPI wood-v1·암호화 head/원자 저장 후보와 DesktopWoodProgressConnection의 고정 load/observe를 추가했다. 합성 manager의 native persistence port를 검증하며 production raw receipt writer/실제 실행은 열지 않는다. 기존 보호/저장 형식·DB·서버/공개 설치본 구조 변경 없음. 전체 N04 실패로 C는 미전송, [범위/미완료](../docs/ERGON_WOOD_DPAPI_C_QA_20261026.md) 참고.

### 2026-10-26 KST — ERGON B native 관측 로컬 후보

`DesktopLifeEvidenceProvider`가 기존 DesktopLifeReader와 actor scope/document/contextVersion·state를 대조하고 `game.life.evidence.read` 고정 bridge로 읽기 모델만 전달한다. webview의 기존 collect 응답 observer는 제한 보상 행만 메모리 관측하며 실행 결과/원장/확정 진척은 바꾸지 않는다. TS `irisErgonNativeObservation`은 기존 readonly 판정기를 재사용하며 store 내부 객체 신원/epoch/context generation을 구분한다. 실제 게임 캐릭터 귀속은 미확인이고 자동 실행/진척 false/null이다. C 저장·DB/API/서버 사용·공개 ERGON·IRIS0.4.3 설치본은 변경하지 않았다. [검증과 미지원](../docs/ERGON_NATIVE_OBSERVATION_B_QA_20261026.md). 로컬 미전송, 배포 승인 아님.

## 2026-10-26 KST — v2.322 개발 후보 후속 / 목재 후보 A 선별 전송

- 이번에 완료한 것: 목재 추가100 합성 관리자·pending 새 프로세스 복구·readonly DTO. 기존 검증 소스 SHA256 12개 일치. Node688 중685 PASS/기존3 SKIP/0 FAIL, 타입·관련 lint PASS. 목재13·pending9복구 조합·DTO8 유지. 검증된 A와 최소 인계를 기능 브랜치에만 전송한다. 정확한 수신 SHA는 이 문서를 포함한 커밋과 원격 HEAD다.
- 아직 안 되는 것: 실제 자동 생산·native 가공 저장·호스트 연결. 기존 pending 배타는 정상 helper를 사용하는 동일 합성 root의 협력 프로세스에 한정된다. helper 자체 사망은 다음 필수 검증으로 남기며 production 안전 보장이 아니다. 현재 DTO는 순수 계약으로 native 출처를 인증하지 않는다.
- 다음 작업: 기존 reader 기반 native 관측 B와 별도 버전 DPAPI 가공 저장 C. workId·정원·실수령 귀속·실비용·외부 배제 근거는 unsupported로 유지한다. B/C는 독립 검증 후 별도 전송한다.
- 구조 변경: 공통 순수 회차 계산과 합성 전용 TS/시험 추가. 서버/API/DB/공개 UI 구조 변경 없음. 실제 CLI·게임·공개 잠금·executionConnected=false·운영 main/IRIS0.4.3 ZIP/metadata·Production 변경0. 신규 서버 호출0.
- 보존/위험: 개인16항목·기존 ACK·사용자 원장·ignored 원본 로그는 보존/전송 제외. 과거 S01/N04 normal/최초 수령 간헐 원인 미확정과 새 목표 교체 이벤트 구 native 역방향 호환 미검증 유지. 아래 미승인·미전송 문구는 당시 경과이며 이번 승인으로 검증된 A/B/C의 선별 commit·일반 push가 허용되었다.
- 근거: docs/ERGON_WOOD_PRODUCTION_SYNTHETIC_QA_20261026.md, docs/ERGON_WOOD_PROCESS_RECOVERY_QA_20261026.md, docs/ERGON_READONLY_EVIDENCE_QA_20261026.md.

### 2026-10-26 KST — ERGON 비공개 목표 관리

기존 작업대 결과 패널/useErgonProgress/useErgonSession → `irisErgonGoalManagement` → 고정 typed `replaceEmptyGoal`/native connection → 기존 Store 단일 `ReplaceEmptyGoal` mutation을 연결했다. 빈 제작 루트만 이전 기록 보존·비활성/분리·신규 루트 단일 생성하며 common writer/CAS/operationId를 재사용한다. native ACK·재조회 뒤에만 기존 로컬 계획을 변경하고 불일치 계획의 대기열 예약을 보류한다. 기존 취소·미저장 초안·CHRONOS 보호 유지.

신규 mutation의 nullable 필드는 이전 canonical digest와 호환되며 구 문서 판독 PASS다. 새 이벤트의 구 native 역방향 호환은 미검증/미보장이다. 서버/API/DB/권한·기존 실행 원장 구조 변경 없음, 운영 IRIS0.4.3/ZIP/metadata·공개 gate/executionConnected=false 유지. 실제 게임·자동 생산 연결은 활성화하지 않는다. [목표 관리 QA](../docs/ERGON_ATOMIC_GOAL_REPLACEMENT_QA_20261026.md).

### 2026-10-24 KST — ERGON 비공개 작업대·목표 진척 연결

DesktopPage의 requestClose/beforeunload/onBeforeApply/changeContext/로그아웃 보호 → DesktopErgon의 기존 결과 패널/useErgonProgress → 기존 native 암호화 진행 저장소를 연결했다. `irisErgonGoalBinding`은 정확한 scope/sourcePlanId/루트/행동/품목/목표 수량을 대조하고 createGoal/bindPrepared의 저장 결과를 권위 있는 최신 기록으로 재확인한다. 등록 확인은 실행 허가가 아니며 executionAllowed=false다.

패널의 native 확인 수량만 작업대·Queue에 전달하며 조회 실패/범위 불일치에는 예상량이나 과거 메모리 진척으로 대체하지 않는다. 결과 전용 모드는 기존 수령 UI와 직접 callback도 차단한다. N-R1/U-R1/V15는 기존 저장 문맥·operation ACK 보호의 최소 보완이며 원장 형식/정리 정책은 그대로다. 서버/API/DB/권한 구조 변경 없음. 공개 ERGON 잠금·executionConnected=false와 운영 main IRIS0.4.3 유지, 공개 설치 파일 변경 없음. [현재 범위와 미완료](../docs/ERGON_GOAL_BINDING_QA_20261023.md).

### 2026-10-23 KST — 독립 ERGON 결과 UI 후보

신규 DesktopErgonResultConfirmation/useErgonProgress는 native projection과 미저장 입력만 보유한다. typed load/capabilities/confirmQuantity/correctQuantity/setLifecycle 및 revision·goal/request·operation 이벤트 ACK 대조를 사용하고 localStorage 확정 진척 저장은 없다. ACK 유실은 같은 요청 재전달/명시적 native 상태조회로 조정한다. CSS는 iris-ergon-result 범위다. 실제 DesktopErgon/page/종료·전환/Queue/CraftGoal 연결은 미완료라 import/mount하지 않았다. 공개gatefalse/서버·DB·native원장구조변경없음.

### 2026-10-23 KST — native 수량 재확인 비활성 후보

DesktopLifeProgressConnection.QuantityAsync → readonly ProgressQuantityPreview → 기존 DesktopLifeProgressApproval/작은 Windows 확인창 → native terminal·문맥·revision·단조120초 재대조 → 기존 Store.Commit ACK. 사용자 수량은 user-confirmed만 기록하고 native unknown을 해제하지 않는다. writer는 승인 대기 중 해제, mutation/game lease는 유지한다. Store/원장 형식·DB·React 구조 변경 없음. ErgonAvailable=false/executionConnected=false 유지. N04 interruption fixture는 시험 소스만이며 실제 앱 목록에 포함하지 않는다.

### 2026-10-23 KST — ERGON B-2 비활성 native 연결 후보

기존 ProgressStore·ProgressCoordinator → 신규 DesktopLifeProgressConnection → 실제 DesktopLifeExecutor의 Prepare/Confirm/Run/native terminal 경계를 연결했다. 저장 ACK/revision·동결 intent·계정/캐릭터/epoch/nonce를 재검증하며 actor mutation → game lease → writer → 짧은 Store 잠금 순서다. DesktopLifeProgressApproval은 비동기 승인/owner 파괴 거절을 담당하고 Run은 admission writer 해제 후 시작하여 terminal 관측까지 lease를 보유한다. 두 수령 경로도 진행-원장 대조를 통과한다. journal 형식/정리 정책은 변경하지 않았다.

desktop-bridge의 고정 game.life.progress 경로 → desktop-webview의 native adapter, desktop.ps1/build-beta.ps1의 소스 목록, irisDesktopStore의 strict scoped load를 연결했다. ErgonAvailable=false 및 executionConnected=false 유지, 실제 UI·자동 반복·실게임 활성화 아님. 운영 웹/API/DB/권한·공개 ZIP 구조 변경 없음, 서버 신규 호출0. [검증·미실행·후속 승인 경계](../docs/ERGON_B2_QA_20261023.md) 참조. 운영0.4.2와 기능브랜치 기존 공개파일 차이는 보존한다.

### 2026-10-22 — IRIS 0.4.2 운영 반영 확인 / 인계 구조 변경 없음

저장/전환/재화 캐시만 main0d2b432에 선별했고 문서마감b0b63c7·Production dpl_GimXVW6ejrr2xcu4n27msrbNrdb9 Ready/정확SHA 확인. 기능브랜치 미공개ERGON/GNOSIS/B-1 전체 병합0·DB/실게임0. 운영은 app/DesktopCenter의 상단저장줄 위치/CSS6줄과 새ZIP/metadata를 포함하며 기능브랜치의 이전 ZIP으로 덮어쓰지 않는다. 이번 후속은 운영상태를 기록하는 문서만 추가한다.

### 2026-10-22 — IRIS 저장 안정성 로컬 후보

`irisDesktopQueue`의 최초 기한/`irisDesktopController` 전환 save/keep와 owner/epoch를 보강했다. `desktop-currency-store.cs`는 queue/ERGON 원장과 별도 DPAPI 캐시이며 native 정상 관측만 보관한다. `store.currencies.load`/`game.currencies.refreshCache` 및 strict `irisCurrencyCache`를 통해 DesktopCurrencies에 마지막 시각·귀속 미확인으로 표시한다. 기존 `readCurrencies`/ERGON 비용 경로에는 캐시를 전달하지 않는다. UI·build source 목록과0.4.2 노트 후보만 변경했으며 API/DB/권한·B-1/원장은 유지한다. [최신 QA·공개 승인 경계](../docs/IRIS_SAVE_STABILITY_QA_20261022.md) 참조.

### 2026-10-22 KST — ERGON B-1 후보 안전 기반 / 실제 연결 구조 변경 없음

`iris/desktop-life-progress.cs`의 모든 Commit은 공통 cross-process writer 제외 및 활성 admission 객체 신원 검증을 거친다. `desktop-life-progress-coordinator.cs`는 명시적 잠금 순위와 비동기 승인 전후 문맥 재검증, Offer/Claim 기반 실행 lease 인계를 제공한다. 합성 시험은 B20+A22/기존 저장34 PASS다. 기존 executor/bridge/webview/컴파일 목록/UI/API/DB·저장 형식·실제 원장 연결은 변경하지 않았다. 서버 신규 호출0, 공개 버전·잠금 유지. 실제 Confirm 우회 차단·모든 실제 writer 참여·Run terminal lease·unknown 보호·S01 간헐 실패 진단은 B-2 필수 게이트이며 별도 승인 전 활성화 금지다.

### 2026-10-22 KST — ERGON 2차 A 후보 / 기존 구조 연결 없음

신규 `desktop-life-progress-coordinator.cs`가 기존 Store와 주입형 native actor 경계 사이에서 저장 ACK/재조회·동결 명령 지문·세션/epoch·필수 mutation/writer/lease 핸들을 검증한다. integration fixture/PowerShell/Node 시험은 합성22개로 순서를 확인한다. 기존 executor/bridge/webview/소스 목록/lib store/API/DB는 변경0. B의 실제 어댑터·전 writer 공통 제외·구 confirm 필수 바인딩·terminal 대조는 승인 전 미연결이다. 구조 변경 없음, 서버 호출0, 공개 버전 유지.

### 2026-10-22 KST — ERGON 로컬 진행 저장 기반 / 구조 연결 없음

신규 `iris/desktop-life-progress.cs`는 목표별 확인·정정 이벤트와 별도 Windows DPAPI 저장소를 제공하고 `lib/irisErgonProgress.ts`는 읽기 계약을 정의한다. 신규 fixture와 두 test runner가 합성 검증을 제공한다. 기존 desktop host 컴파일 목록, 실행기, bridge, UI, 보호 원장, API/DB에 연결하지 않았다. 저장은 로컬이며 서버 호출0. 합성 소유34개 통과, 후속27개 미실행. Task 1·2 기능 브랜치 인계이며 2차 원장 연결/3차 UI는 별도 승인 대기.

### 2026-10-21 23:56 KST — ERGON 수량 정확성 인계 / 구조 변경 없음

`irisErgonCraftGoal`의 confirmedOutput만 목표/예약에 반영하고 native completed/expectedOutput는 확보 증거로 사용하지 않는다. DesktopErgon/Execution/Queue/PlanRow가 수량 미확인 상태와 선행 제작 보호를 공유한다. native/bridge/API/DB·계획 저장 구조는 변경하지 않았다. 별도 암호화 진행 저장소는 승인된 설계이며 아직 소스/연결/UI가 없다. [마감 인계](../docs/ERGON_CLOSEOUT_20261021.md)와 그 문서의 Git 이력을 기준으로 순월이 수신·ACK/시작 가능 여부부터 확인한다. 공개 버전·잠금 유지, 신규 구현/실게임/운영 변경0.

최종 집 마감 코드 `040e03d0ddc545af5fc91b45a786cfbe0bd6fbac` 뒤 인계 문서만 추가한다. 제품 구조 변경 없음. 순월은 `docs/HOME_CLOSEOUT_20261020.md`를 마지막으로 변경한 최종 문서 커밋과 원격 브랜치 최신 HEAD를 대조한다. 이번 구조도 변경은 표시 설명뿐이며 운영/DB/새 실행 구현은 아니다.

### 2026-10-20 22:27 KST — 집 마감 인계 / 구조 변경 없음

한설이 CHRONOS 표시 최소 수정·ERGON 통합 설계·관련 시험과 인계 기록의 기능 브랜치 commit/push를 승인했다. 아래 로컬 후보/미전송 설명은 작업 당시 경과이며 최신 결과는 `docs/HOME_CLOSEOUT_20261020.md`와 릴레이를 따른다. 제품 구조·API/DB/저장 키·운영 버전은 그대로다. 새 자동 생산 코드·실게임·main/Production/공개 IRIS/DB 변경은 없다. Codex에서 직접 검토하며 VS Code 조작을 요구하지 않는다.

### 2026-10-20 — CHRONOS 공식 표시·ERGON 통합 설계 / 로컬 후보

사용자 표시만 CHRONOS/크로노스로 통일한다. `types/layout.ts`는 PC/모바일 메뉴 공용, 홈 체크보드·버스 확인/탑승 가이드도 동일 표기. `/character`·기존 API/DB/RLS·`kronos` 파일/타입/함수/저장 키/프로토콜은 유지하며 제품 구조 변경 없음. IRIS 탭은 이미 CHRONOS, 플로팅 명령은 내부kronos 유지. 과거 릴레이/릴리스 이력은 소급 치환하지 않는다.

ERGON 설계 후속은 `docs/superpowers/specs/2026-10-20-ergon-goal-production-integration-design.md` 및 `docs/ERGON_NEWOL_HANDOFF.md`. CHRONOS 부족분 진입·즉시 시작/목표 생산·진척 보존/재개 재조회·현재 가공분 시간 예측·Supabase Free/Vercel Hobby 로컬 우선 비용 검토를 담는다. 신규 자동 실행/부족분 버튼/원격/DB 구현·공개 잠금 해제·push/배포는 없음. 검증 결과는 최신 작업 인계를 따른다.

### 2026-10-20 — IRIS 야간 후속 UI·난이도 기준 / 인계 후보

제품2549718의 기능브랜치 Preview dpl_Cj6zrxhT62oXjENHhxEH5M11WcUv Ready·정확SHA 확인. 실제Preview파티 통합난이도 화면에서 신규기준 표시·순서·취소를 확인했고 제출은 하지 않았다. 운영main/IRIS설치파일은유지. 이결과마감은문서만추가/추가구조변경없음.

검증: Node608/605PASS3skip0fail·관련browser16 PASS·scopedlint/독립tsc/격리Next60 exit0. 실게임 소비/공개ERGON해제/추가운영배포0. 아래 구조 보완을 feature branch로 인계하며 정상 운영 구조를 대체 배포하지 않는다.

- `DesktopSaveStatus.inline`를 floating mode에 한정해 DesktopCenter sticky header에 배치. 일반 overlay portal·position/preview 유지, 저장 controller/API/15초 변경0.
- 기존 ERGON session/plan/goal을 그대로 사용하며 빈 작업대 catalog 자동 노출, 선택목록·재료·실행 연결/행 과잉 산출/가공 reason 표시만 보완. `DesktopContextHelp`는 in-flow 문맥 안내와 outside/Escape 해제를 담당하며 native dialog를 추가하지 않는다. 실제 새 consuming API/자동 묶음 가공/공개 gate 해제0.
- DesktopFontPicker+font-picker.css에서 native 설치 가족 목록을 직접 탐색/선택적 검색/미리보기/초기화. native 열거·검증·bridge method는 변경하지 않는다.
- partyContentCatalog에 DB 값 기반 난이도 순서 공통화(매우어려움2 포함), partySurfacePolicy도 재사용. 어비스 누락5개 기준 자료만 승인 후 추가(DDL/RLS 없음), 세부 원장/복구는 SUPABASE_SCHEMA와 전용 야간 인계. 운영 main/IRIS ZIP은 유지한다.

### 2026-10-19 21:25 KST — 0.4.1 운영 반영 확인 / 구조 변경 없음

제품4480646은운영배포dpl_3Z2KVcSMJnMxuZmp8ye3HZ5E75ds Ready/Production/현재도메인·SHA확인, 실제0.4.1metadata/ZIP·요약‘버그픽스’만제공됨을검증했다. 신규공지게시없음. 아래저장portal핫픽스구조의운영반영결과이며 본마감은문서만추가, queue/controller/API/DB권한변경0.

## 2026-10-19 0.4.1 핫픽스 구조 (배포 결과 후속)

DesktopSaveStatus의 body portal을 마운트후 안정된 .iris-floating-workspace로 옮긴다(일반 독립컴포넌트는bodyfallback). cleanupguard/microtask호스트준비전렌더보류로 첫프레임bodyescape를막고, floating-hub.css가 기존 --iris-dialog-x/y/width/height(native panel좌표)를재사용해 저장오버레이를4모서리에제한한다. Hub의outside영역안에들어가 저장클릭이close를발행하지않고, workspace hidden일때저장안내도함께숨는다. queue/controller·15초타이머/보호저장/API/DB권한/native production 변경없음. IRIS0.4.1/웹v2.321, notes0.4.1앱요약‘버그픽스’만·신규공개공지없음. 기존0.4.0시스템공지id19는정상UI게시완료.

## 2026-10-19 21:00 KST 운영 반영 확인 (결과 기록, 구조 변경 없음)

제품3e6f7ae를main에정상push, Vercel dpl_7rwKTwyaDQNrYN49xnvTLcRhCh5V Ready/Production/Current domain/정확SHA와 운영웹v2.32·IRIS0.4.0 metadata/ZIP해시·공개notes를실제로확인했다. 기존업데이트버튼과 `/iris/download`가같은0.4.0패키지를가리킨다. ERGON잠금/GNOSIS메뉴준비중은유지, DB·API권한/RLS·저장형식변경0. 아래 ‘미배포’는당시경과이며 이번은문서만추가/구조변경없음. 공지데이터는현재계정권한부족으로아직게시전, 정상권한UI로만후속게시한다.

### 2026-10-19 표시 아이콘 구분 구조 추가

production ReleaseProgram이 소유권을 획득한 뒤 DesktopReleaseFiles.EnsureIconName을 호출한다. 기존 IRIS.ico payload는 원본0.3 updater allowlist/hash 호환을 위해 그대로 두고, 동일바이트 `아이리스 로고.ico`를 로컬 생성·가시화하며 원본만hidden 처리한다. 기존 다른내용 파일/링크는 거절·readonly는failsoft, 사용자저장소/원장 접근0. build-beta는 새 source를 컴파일하고 ZIP의 IRIS.ico hidden bit를명시, 패키지는기존10파일이며manifest원래이름 유지. 업데이트 원본helper실교체/보호지문/새표시파일까지 검증. 최종ZIP595194/SHAea2a4f784fde6e79b632582681525e651b9ac1debcbb61aab57d58ce4ec04fd3. 운영DB·권한구조변경없음.

## 2026-10-19 v2.32 / IRIS0.4.0 출시 후보 (공개 승인, 결과 후속)

한설의 공개 업데이트 승인에 따라 public/IRIS/downloads의 ZIP+metadata를0.4.0으로 생성하고 웹표시v2.32를 사용한다. 구조 변경 없음: 기존 native updater→원본 helper→manifest/hash 교체와 단일 DesktopUpdater portal 요약 구조를 그대로 사용한다. 공개 ZIP10개 allowlist/unsigned beta, 원본0.3.0 helper의 새EXE·fresh offline WebView 교체 및 보호 파일 지문 보존 시험 PASS. ERGON defaultfalse/UI/native gate와 GNOSIS PC/모바일 comingSoon 메뉴는 유지한다. GNOSIS 직접URL 시제품은 메뉴 잠금과 별개이며 서버 접근제어를 추가하지 않았다. 운영 DB/API권한/RLS·저장 형식 변경0. 배포·운영 확인 결과는 후속 마감에 기록한다.

## 2026-10-19 20:07 KST — 통합 인계 전송 마감 (구조 변경 없음)

통합 제품 `64cdd50c36619677a50900d41ac15d28d080e39d`는 `origin/codex/home-gnosis-iris-integration-20261019`에 정상 push·원격 exact 확인했다. 이 결과 문서 마감까지 최신 HEAD를 받는다. 아래 구조 설명의 운영 미적용 경계는 그대로이며 main/DB/운영 배포·ZIP·공지 변경0, 자동 Preview GitHub 상태 pending/Ready·실화면 미확인이다. 이 마감은 문서만 추가하며 구조 변경 없음. 다음 작업 순서는 `docs/HOME_INTEGRATION_20261019.md`.

## 2026-10-19 집 통합·IRIS 출시 준비 후속 (기능 브랜치, 운영 미적용)

GNOSIS 구조는 아래 순월 인계의 로컬 시제품 모델 그대로 통합했다. `lib/irisFeatureAvailability.ts`는 ERGON 기본false(환경으로해제0), Center는 callback/session 미마운트·stale section 거절, MainTabs/Hub는 disabled LockIcon·준비중. 실제 native host/bridge도 ergon진입/prepare·confirm·collect를 차단하고 stop/cancel/history/reconciliation은 보존한다. `DesktopUpdater.inlineTarget`이 한 updater에서 floating workspace slot으로만 요약 portal을 보낸다. 버전별 notes는 React state cache/중단되는 bounded fetch, 기존 보호설치 dialog 경로는 그대로다. `IRIS_BETA_VERSION`과 표시용 notes0.4.0은 후보이며 공개 package metadata0.3.0 유지. 임시 focus-debug route/trace코드 제거(ignored 원본보존), native 초점복귀 안전검사는 유지. 운영DB/API권한/RLS·보호원장 스키마 변경0. 소스/문서 비교·검증·다음순서는 `docs/HOME_INTEGRATION_20261019.md`; 운영main/배포는 한설 별도 승인 전 실행하지 않는다.

## 2026-10-19 — GNOSIS 기능 브랜치 구조 (운영 미적용)

- app/gnosis/page: compact브랜드·시뮬레이터링크·별도글쓰기·전체/클래스/전투/생활/패션/악보/기타. GnosisMark와gnosisCategories/ClassGroups/Navigation·useGnosisNavigation으로 SVG/하위분류/브라우저표시설정 공유.
- app/gnosis/write → GnosisRichEditor → 기존 KerygmaEditorToolbar 재사용. gnosisRichText의 허용AST/스타일/URL/이미지 제한, GnosisContent/RichContent React 렌더. gnosisPoll 검증·로컬투표, gnosisImage 클라이언트압축. 링크·투표·취소는dialog, 추가도구는접기.
- app/gnosis/[id] → GnosisComments·GnosisPoll·GnosisContent. gnosisLocal에서 기존gnosis_mock_db/작성초안/댓글트리 보존·손상기록덮어쓰기 방지. 실제서버게시/계정권한은미연결.
- app/gnosis/dressroom → gnosisFashion(개인저장10개/WORK/전달값검증·글합치기) → gnosisFashionCapture(canvas PNG/Clipboard). 원본스크린샷200KB이하WebP·염색팔레트, 패션작성은기존본문/투표보존+이미지AST추가. 실제3D모델/의상렌더러 없음.
- GnosisNavigationEditor는기존admin탭과개발전용gnosis/admin-preview에연결. 설정은로컬브라우저미리보기이며운영설정API/DB신설없음. 프로덕션admin-preview는notFound. admin기존인증유지.
- API/DB/RLS/환경변수/패키지의존성/IRIS코드/케리그마공용컴포넌트 변경없음. docs/GNOSIS_HOME_MERGE_20261019.md 순서로 집 코드와 통합할 것.

## 2026-10-18 22:55 KST — native 초점 복귀·지연 접기 경합 (로컬)

`FloatingState()`가 실제 `gameFocus=true` capability를 발행하도록 누락을 고쳤고 실제 DTO 직렬화 회귀로 보호한다. `ReturnGameFocus`의 성공한 의도적 초점 복귀는 native `gameFocusHandoff`로 Activated까지 구분한다. Deactivate callback은 해당 handoff와 `floatingInteraction` 세대를 검사해 게임 복귀/새 command·activation을 바깥 클릭으로 접지 않는다. 중복 실패 요청도 앞선 성공을 무효화하지 않는다. 타 앱 선택·모달·텍스트 편집 보호와 strict null-payload bridge/기존 tracked game 검증 유지, 키 합성·전달/후킹 없음. 개발 한정 임시 `/api/iris/focus-debug`와 `irisFocusTrace`는 정확한 enum/boolean 메타데이터만 ignored 고정64KiB 로그로 제한하고 production404이다. 운영 API/DB/RLS/원장 구조·공개 ZIP 변경 없음. 한설 WASD 복귀 확인 후 기능창 즉시 접힘 후속은 재실행·동시 실사용 확인 전이다.

## 2026-10-18 WASD 후속 경로 (로컬)

`useDesktopFloatingFocus`는 mode/menu/surface 응답으로 창이 열리는 경우, 일반 pointer release·80ms wheel 안정화에도 기존 bounded game-focus 요청을 보낸다. pointer-held·입력/모달/선택 텍스트·명시적 UI 탐색은 유지하며 WASD를 UI 탐색으로 오인하지 않는다. 전역 활성화 감시/게임 키 전달/새 native API·DB 변경 없음. 실제 게임 성공은 사용자 검증 전이다.

## 2026-10-18 플로팅 설정·초점/헤더 후속 (로컬)

`useDesktopFloatingFocus`가 마우스의 일반 조작 완료 뒤 strict `window.game.focus`(null payload/boolean focused 응답)를 호출한다. optional `FloatingState.gameFocus`는 구 host 파싱/기능 차단을 보존한다. native tracker는 현재 IRIS foreground와 기존 tracked game의 PID/lifetime/제목/가시성/최소화를 검증하며 arbitrary HWND/키 전송은 없다. 게임 복귀는 모듈을 접지 않고 메뉴 단축키도 게임 초점을 빼앗지 않는다. `useDesktopFloating`의 partial preference edits는 직렬 실행 시점 latest 확정값에 병합한다. 설정 UI는 전체 busy 잠금 대신 개별 submit 중복 방어·초안/실패 복원, 표시 명칭 ‘사이드 바’. Hub 중복 tools 행/로고 외곽선 제거, floating `.iris-context-header`의 sticky top:0 범위 보정. shared modal 자연 높이 getter를 native 기존 timer가 읽어 80..680 DIP 모달 region에 반영하고 원 모듈 geometry는 별도 복원한다. 운영 API/DB/RLS/게임 명령·원장 변경 없음.

## 2026-10-18 플로팅 공통 modal/geometry·settings 후속 (로컬)

`useDesktopFloatingDialogs`/`floating-dialogs.css`가 role=dialog fixed backdrop을 native panel에 맞춘다. `FloatingState.dialogOpen?`와 내부 dialog-open/close, 종료결정 독립 region으로 normal강제전환을 제거한다. FocusDialog는 ref-count inert/최상위 focus trap·교체순서보호 및 SSRmarkup; stats/currency/close가 공유. native SetWorkspace floating420/980·WM_MOVING liveanchor. optionalnoticeheight80..360과 Hub ResizeObserver·둥근nativebubble, 초기추천manual왼쪽/큰닉네임. Settings4분류·floating전체와normalopacity분리. taskbar양보는 실제overlap로제한. 운영API/DB/RLS/원장스키마·게임명령변경0. QA `docs/IRIS_FLOATING_DIALOG_QA_20261018.md`; 수량가공100개 반복연결은미완료/출시범위결정별도.

## 2026-10-18 IRIS compact·사용성 후속 (로컬)

FloatingLayout:default36/badge57×20/gap2·logo기준xclamp/badge별도clamp, 메뉴ellipse/메뉴·panelopen알림geometry억제. prefs같은파일v3쓰기/v1·v2old52만36이전/v3명시52유지. Host폭산식7+8. normalCharacterPrompt는FocusDialog, floatingcompactContent와dismissDisabled·기존cue/선택검증유지. Hub알림panel fallback제거/provider표시대기·기존10초deadline유지, 잘리는customlabel은title/aria로대체. Settingsrange draft→blur최종저장/수동font·사용안내접기. DB/API·게임명령·원장변경0. QA `docs/IRIS_USABILITY_POLISH_QA_20261018.md`; native재시작·실사용별도.

## 2026-10-18 추천 표시 위치·키캡 잘림 후속

Notifications View의floating여부로CharacterPrompt normal상태는기존characterStatus자리inlineHost, floating은globalLayerbubble로분리한다. info10초·character유지/선택계약보존. nativeBadgeRegion은9DIP roundedGraphicsPath, CSS반경9px로동기화(폰트/폭높이유지). DB/API·게임명령/원장변경0. 실사용native잘림재시작은별도, QA `docs/IRIS_NOTICE_KEYCAP_QA_20261018.md`.

## 2026-10-18 플로팅 종료·창모드 설정 (로컬)

Hub 다섯째 전원 아이콘은 기존 requestClose/Decision에 연결한다. FloatingLayout5영역과 boolean WindowedFloating·Presentation정책 추가, settings체크박스가 기존prefs bridge재사용. 로컬설정은같은window-floating-v1.json의내부v2쓰기/v1읽기, browser는구4/new5영역·optionalboolean허용/구host신기능숨김·비활성. 기본off·창모드즉시적용/재실행기억/명시전체작업창override유지. DB/API·원장/게임명령·공개ZIP변경없음. 상세 `docs/IRIS_FLOATING_EXIT_WINDOWED_QA_20261018.md`.

## 2026-10-18 게임 client 내부 플로팅 (로컬)

기존 tracker에 readonly ClientBounds를 추가했다. PID/HWND/제목확인·IRIS DPI context에서client를읽고 coordinator가 게임이동offset/가시영역clamp/임시상실마지막경계를 담당한다. WndProc의WM_MOVING은 실제드래그RECT를보정한다. WindowsSC_MINIMIZE와기존bridge최소화는같은 MinimizeToFloating으로통일한다. 게임주도WindowState최소화/일반창좌표·원장/DB계약은그대로다. game최초미탐지·가시영역96×128DIP미만은monitor복구예외 유지. `FloatingLayout.FitsContainer`가 DPI별 공간검사를 공유한다. 새browser HWND입력·게임명령없음. 상세QA `docs/IRIS_GAME_BOUND_FLOATING_QA_20261018.md`.

## 2026-10-18 키캡 최종 표시 후속 (로컬)

`floatingShortcutCaption`이 bridge의 괄호표기를 표시부에서만 제거해 Hub/Settings에 동일 적용한다. 실제키/DTO검증은 변경없음. native문구폭도괄호2글자를제외해 기본79DIP, 높이28/로고크기설정은유지한다. 아래97DIP은이전디자인경과이며 새폭은정상재시작후반영.

## 2026-10-18 키캡 비율 후속 (로컬)

FloatingLayout의 badge는28DIP높이/문구길이 기반폭(기본97DIP)으로 실제창 Region/경계에 포함한다. 아이콘 크기 설정은 변경하지 않는다. CSS는 큰둥근굵은글자·밝은2px테두리이며 native배치와 함께 적용하려면 정상재시작해야 한다. 게임bridge/운영API/DB 구조 변경 없음.

## 2026-10-18 — 플로팅 가시성/초기화 수정 (로컬)

- 표시전용 schema1 FloatingState에 optional bool windowVisible 추가. 엄격키/타입 검증은 유지하고 기존 host 누락은 document.visibilityState로 호환한다. native VisibleChanged/Resize가 표시 revision에 포함되어 새정보의 최초표시10초·소리만 가시 상태에서 시작한다. 이미 표시한 정보 deadline/캐릭터 무만료/unknown상태는 별개다.
- InitializeFloating과 SetFloatingMode가 같은 ApplyFloatingAccessories로 resize edge 표시를 동기화한다. savedcompact 시작의 Browser/Region 좌표 불일치를 실제Form 회귀로 검증했다. 게임실행/저장원장·운영API/DB/RLS 구조 변경 없음. Minor labelRegion/실사용전체화면 검증은 여전히 남았다. 아래 중요2미수정은10월17일 인계 시점이다.

## 2026-10-17 — 플로팅 개발 인계 경계

- 전송결과15:20KST: 코드/인계27e8252 원격정확일치, 결과마감 최신HEAD까지 pull. Vercel403/CLI없음·Ready/실Preview 미확인. 결과기록 자체는 구조변경없음/운영미승격.

사용자 사용량 사유로 새 구현·앱 시작 중단/기능브랜치 인계만 한다. 최우선 문서는 `docs/IRIS_FLOATING_SOONWOL_HANDOFF_20261017.md`. `useIrisNotifications` 숨김가시성/첫표시수명, native InitializeFloating compact accessory 초기화, CSS label과 nativeRegion 불일치가 C0/I2/M1 미해결이다. 아래 구조는 로컬 후보/운영미배포이며 출시완료가 아니다. 기존 게임실행/unknown원장·API/DB/RLS 구조 변경 없음.

## 2026-10-17 — IRIS 플로팅 허브 로컬 구조 (운영 미배포)

- native `desktop-floating.cs`는 DIP/화면 경계→단일 CSS 좌표 adapter·표시 Region·교체 가능한 앱 소유 단축키를 담당한다. `desktop-floating-store.cs`는 환경별 일반 bounds/앵커/크기/불투명도/키를 별도 `window-floating-v1.json` 원자 저장하며 손상 원본을 보존한다.
- `desktop-floating-host.cs` partial WebView coordinator가 기존 Addon/Overlay/Presentation을 조정한다. normal과 floating 좌표/투명도는 별도이며 메뉴/알림에 필요 없는 투명 영역은 Region에서 빠진다. 기존 게임 실행 bridge/원장 계약은 그대로다.
- 새 `window.floating.state/command/notice/preferences`, `window.floating.changed` 계약은 `irisFloating.ts` parser 및 store/hook에서 버전/epoch/environment/revision을 검증한다. 기존 native 미지원 시 기존 복구 경로를 유지한다. 로고와 settings는 `DesktopFloatingHub/Settings`, 기존 Center 모듈은 한 번만 유지한다.
- `irisNotificationQueue.ts`/`useIrisNotifications`/`DesktopNotificationHost`는10초 정보와 무만료 캐릭터 slot을 분리한다. Watch/StatsSession은 renderPrompt로 기존 확인·신선도·명시 선택 핸들러를 그대로 쓴다. 정보 만료는 실행/저장/unknown 상태를 바꾸지 않는다.
- `irisDeepReports.ts`는 기존 `deep_holes` 읽기를 검증/투영한다. 기존 hook의 SELECT/Realtime을 재사용해 목록·최초/재접속 baseline·변경/삭제를 처리한다. 새 API/DB/RLS/publication 변경 없음. 설정·CSS/브라우저/native 회귀와 남은 실제 확인은 날짜별 QA 문서를 따른다.

## 2026-10-17 — ERGON 게임 작업/내부 편집 잠금 분리

- desktop page의 `locked`는 내부 편집, `gameLocked`는 계정·캐릭터와 게임 조회/요청용이다. `DesktopCenter.identityLocked`, `DesktopContextActions.accountDisabled`를 분리해 일반 메뉴와 설정 탐색을 유지한다. `DesktopStats`/`DesktopCurrencies.readPaused`로 해당 탭을 열어도 실행 중 native 조회를 시작하지 않는다.
- `DesktopErgon.gameBusy`와 `pinnedTarget`은 계획 편집과 이미 요청한 실행 대상을 분리한다. 캐시 품목으로 다음 계획을 편집할 수 있지만 추가 실행/시설 수령·갱신은 차단한다. 선택/교체로 전송한 collection 요청ID를 제거하지 않는다.
- `DesktopErgonExecution.sentRequestId`는 접수 뒤 늦은 idle 응답에 의해 잠금/관측이 풀리지 않게 한다. 숨긴 화면에서도 동일ID 종료를 관측하며 실제 완료량은 기존 목표 identity 일치 때만 반영한다. 미전송 준비 숨김 취소는 유지한다.
- native/정책/원장 형식·운영 API/DB/RLS·공개 버전/ZIP 구조 변경 없음. 과거 금속 unknown의 실제 원인은 미확정이며 성공 주입/재전송하지 않는다.

## 2026-10-17 — ERGON 카탈로그 동명 식별·행 밀도

- `DesktopErgonCatalog`는 같은 이름의 공식 행을 유지하며 분류/이름/동명 등장순으로 필터 이전의 rowKey를 만든다. 검색·즐겨찾기/목록 갱신 시 React 중복 key와 DOM 잔존을 방지한다. 원본 레시피나 행동 이름을 변경하지 않는다.
- `DesktopErgonPlanRow`는 header(품목/분류·교체/제거)/footer(수량·예상비용)의 기본 두 줄이다. 기존 quantity draft/Enter-blur/Escape/중복방어 콜백과 confirmed progress는 동일하다. scoped rem CSS만 압축하고 새 저장/예약/native 경로는 없다.
- 운영 API/DB/RLS·게임/native 소비·원장·공개 버전/ZIP 구조 변경 없음. 합성 확인과 실제 앱 수령·원격 비용/주간창은 별개다.

## 2026-10-16 영겁 — ERGON 목록형 작업대 로컬 구조

- `irisErgonPlanEdit`은 기존 schema1 검증으로 수량/제거/새ID 교체를 처리하며 중복 품목은 병합하지 않는다. `irisErgonFavorites`는 환경/계정 키의 schema1·최대200개/32KiB 메타데이터만 저장하고 손상 원본 보존·쓰기 실패 시 현재 창 fallback을 제공한다.
- `DesktopErgonPlanRow`를 `DesktopErgonQueue`의 상시 목록/기존 disclosure 양쪽에서 재사용한다. 수량 draft·Enter/blur 중복 방지·Esc 복원, 선택/교체/제거를 분리했다. 공유 재료/최종품 예약은 기존 Supply 계산이다. Queue는 명시적 현재 계정/캐릭터와 계획ID/품목/목표/현재 산출량이 일치하는 완료량만 차감한다.
- `DesktopErgonCatalog`는 공식 현재 품목·분류/검색/즐겨찾기·담기/교체를 표시한다. `ConnectedErgon`이 기존 save/selection/Execution 상태를 조정하고 실패한 추가는 선택을 바꾸지 않는다. 새 교체는 freshID·기존 수량 유지, 중복은 기존행 선택만 한다. `useErgonSession`은 환경/계정 plan scope 일치 전 이전 계획을 숨긴다.
- CSS는 넓은 품목/목록/상세3영역·좁은 목록 우선/품목 펼침, 기존 역할색·rem을 사용한다. Workbench는 가방·계정창고·캐릭터창고 및 조건부 원격 사용을 분리한다. Execution은 준비취소 시 일반조회 pause를 동기적으로 풀고 확인 중 수량 변경을 막는다.
- 공용 `DesktopFocusDialog`는 닫힘이 허용된 backdrop pointer의 기본 초점 이동을 억제해 닫힌 뒤 원래 교체 버튼으로 초점을 복구한다. 내부 클릭/닫힘 금지 조건·Escape/초점 잠금은 유지한다.
- 기존15초 직렬 일반조회/숨김·준비·실행 pause·복귀 갱신/실행2초 관측과 native 소비/DPAPI journal 계약을 보존한다. 운영 API·DB·RLS/다운로드·공개 버전 구조 변경 없음. 실제 앱 수령/원격 비용·주간창/완전BOM·무인chain은 별도 미검증·미구현이다.

- 2026-10-16 인계전송: 코드d63fd03/원격일치/선행34e6aef포함. 이번결과기록은 구조변경없음. GitHubVercelpending·직접403/CLI없음·Ready/실Preview미확인, 운영main/공개버전·ZIP·DB유지. 다음큰작업대는 요구/제안문서 단계다.

## 2026-10-16 후속 — 최소프로세스조회·collect직접body·조건부창고

- 인계 마감은 위 개발 후보/요구 문서 전달이며 추가 구조변경 없음. 공개버전/운영main/다운로드/DB는 유지한다.
- `DesktopCliActivity.ProbeAsync`: QUERY_LIMITED_INFORMATION만 요청해 OpenProcess/GetProcessTimes 생성·종료메타데이터 확인. PID/생성시각전후·CLI없음·idle 유지, 메모리/디버그/상승/제어없음. API근거 https://learn.microsoft.com/en-us/windows/win32/api/processthreadsapi/nf-processthreadsapi-getprocesstimes
- `DesktopLifePolicy.Outcome`: collect direct-body만 사전완료건수일치·후시설완료0·알려진보상대조. 명시status/body·error/pipe/타행동을 성공추정하지 않음. DPAPI/기존unknown보존/재전송금지 유지.
- Needs의stored=fresh·동명/잠김방어 후 계정/캐릭터창고합계, owned=가방과분리. Workbench는 원격조건·전송기/부스러기를표시. Supply.storedLeft는 조건부1회예약+막힌수동원격확인 단계라 자동사용아님. 설치/비용/주간창자동API 미확인.
- 새편집목록/즐겨찾기·작업대는 ERGON_WORKBENCH_REQUIREMENTS_20261016의 요구/제안이며 구현구조아님. 운영API/DB/RLS/공개배포변경없음.

## 2026-10-16 — ERGON 현황 직렬조회·다음작업 로컬 구조

- `useErgonPolling`이 보이는 대기화면의 카탈로그/overview를15초 단일직렬흐름으로 갱신한다. `DesktopErgonExecution.onReadPauseChange`는 준비·최종확인·실행의 일반조회 정지를 실행버튼 잠금과 분리한다. busy종료·표시복귀 때 즉시 재조회, 기존 실행관측2초/native신선도15초 유지. `useErgonSession` 재화·오류는 환경/계정/캐릭터 scope로 표시한다.
- `irisErgonNextStep.selectErgonNextStep`은 기존 partial공급미리보기+fresh공식스냅샷에서 명시적 다음단계를 권유한다. 등록품은 보유재고로 더하지 않고 대기/안전한시설수령을 먼저 선택한다. 지원통나무100상한/가공1회/실제가능한제작, 불명·오래됨·다중경로는 차단한다.
- `DesktopErgonSupplyPanel` 다음작업→`ConnectedErgon`의 scope별 임시선행계획→같은Execution의 기존준비/native동의. 루트계획/확인진척·localStorage는 보존하고 자신의terminal응답만 루트복귀에 사용한다. `onActionSettled`는 본인 requestID·계정·캐릭터 일치 뒤 보고, unknown은성공으로 바꾸지 않는다.
- 현재 게임행동 오류인 `life_game_blocked`를 `ProbeCollection`에서 그대로 전파해 던전·자동행동을 과거원장오류로 잘못 안내하지 않는다. 안전조건/다른실패코드/수령정책1/DPAPI원장스키마·bridge권한은 유지한다.
- 한설 좁은/넓은 실화면 확인, 실제수령은 검증 중. 운영API/DB/RLS·공개버전/배포 구조 변경 없음, 전체BOM/native무인chain/정원·총비용 계약은 미완료.

- 2026-10-15 23:38 KST 전송 마감: 기능 인계 e7fa78d 원격 일치 확인. 이번 후속은 구조 변경 없음, Vercel pending/직접403·실화면 미확인, 운영 승격 없음.

- 2026-10-15 23:33 KST 인계 마감: 원클릭 수령 구조는 아래 승인 후보대로이며 이번 문서 마감 자체는 구조 변경 없음. 공개 버전/운영 API·DB·RLS 유지. 생활 현황 한 줄3칸/15초 갱신은 후속 미구현 제안이며 현재10초다. 실게임 수령 검증 전 운영 배포 완료로 표시하지 않는다.

## 2026-10-15 — ERGON 원클릭 수령 정책1 로컬 구조

- 최종 검토 보완: bridge의 읽기 대기를 `BindCollectionReadWait`로 actor 안에서 수행해 클릭 ID의 취소 수명을 끊지 않는다. 새 정확한 읽기 전용 `collectionObservation(requestId/accountId/characterId)`는 checking/running/완료·unknown·취소·거절만 반환한다. 메모리 시도 기록은40개로 한정하고 최종 결과는 원본 journal과 실행 task를 확인한다. 소스/epoch/monotonic bridge ID·계정 경계는 유지하고 임의 행동은 받지 않는다. UI는 전송 전 ID를 관측자에 등록해 receipt 유실/숨김 중에도 terminal까지 관측하며 예전 flight가 새 요청을 풀지 못하게 한다.

- `DesktopLifeAutomationStore`: 환경별 별도 DPAPI 허용/감사 이력, 원본의 정렬 JSON SHA256 결합, 첫 감사 전 암호화 원장 백업·원자 교체. `DesktopLifeJournal.BindSeparation`은 원본 state/history1..3를 보존하며 own/peer/Begin 차단만 동일하게 계산한다. 구형 미연결 경로는 기존 엄격 차단이다.
- `DesktopCliActivity`: 고정 런처 3종의 read/action PID 등록, 미분류 CLI/조회 종료 대기, 게임 프로세스 PID·시작 시각만 확인하며 게임 메모리/파일에 접근하지 않는다. `DesktopLifeReconciliation`은 이전 세션/12분·lease·CLI·두 fresh idle·동일 문맥/epoch/hash의 순수 복합 판정이다.
- `DesktopLifeExecutor.CollectOneClickAsync`: 정확한 클릭 요청 ID/120초→최초 native 허용→읽기 대기/전역 lease→과거 unknown 감사 분리→fresh 전체 조건/시설 고정→Begin→기존 Run 1회. 이탈 취소는 기존 nonce cancel로 커밋 전만 무효화한다. native Busy는 조정 중에도 잠그되 state의 idle/busy 계약은 보존한다. 기존 채집/제작 최종 동의·중지·수량/예산은 그대로다.
- bridge는 `game.life.actions.collect`, `collectionPolicy`, `revokeCollection`만 추가하며 capability schema4에 원클릭/자동 정리/정책 버전을 명시한다. 페이지가 허용 boolean이나 임의 명령/경로를 쓸 수 없다. 문맥 변경은 준비를 무효화하지만 실행 중 Run에서는 거절한다. 자체 read 충돌은 최대10초 기다린다.
- `irisErgonAutomation`의 exact policy/요청/capability 파서→`irisDesktopStore` 고정 메서드→`irisErgonCollection` 한 flight/기한/소비 재전송0. `DesktopErgonExecution` 단일 결과 관측/분리된 과거 기록·조회 오류 회복, `DesktopErgonCollectionPermission` 기존 focus dialog로 철회. 시설 카드의 표시 이름만 ‘금속 가공’처럼 줄이고 container 두 열/좁은 한 열로 배치한다. 실제 anchor/시설 문자열은 바꾸지 않는다.
- 로컬 후보이며 실제 권한 허용/과거 원장 자동 분리/실게임 비용 검증은 사용자 정상 재시작 후 별도다. DB·서버API·RLS·공개 버전/ZIP·main·배포 변경 없음. 아래 이전 구조는 작업 경과로 보존한다.

## 2026-10-15 — ERGON 시설 버튼 직접 최종 동의 연결

- 앞선 미리보기 전용 해석을 한설 요청으로 정정. 시설 버튼→`requestErgonCollection`의 현재 문맥/busy/unknown·완료품 검사→기존 native prepare/응답 시설·신원 대조→기존 native confirm 1회. `complete_altering_work`가 시설 이동과 그 시설의 완료품 전체 수령을 포함한다. 새 bridge/API/DB/게임 파일 변경 없이 기존 executor·원장·시설 고정을 재사용한다.
- ConnectedErgon의 클릭 ref 잠금/범위 sequence로 연타·늦은 응답을 막고 기존 Execution busy와 합친다. 단일 Execution은 상태·보호 기록을 계속 관측하며 수령 전용 중간 준비 버튼만 숨긴다. 작은 화면은 자동 실행 확인 영역으로 초점·스크롤을 이동한다. 자동 수령 반복/재등록/unknown 해제는 없다. 설치본 호출 추적 근거는 `docs/IRIS_COLLECTION_COMMAND_TRACE_20261015.md`.

## 2026-10-15 — ERGON 시설 수령·컴팩트 현황 로컬 구조

- Workbench의 시설별 짧은 수령 진입→ConnectedErgon의 계정/캐릭터 scope 수령 미리보기→같은 Execution 인스턴스의 collect 준비/취소/최종 동의. `irisErgonCollection`은 fresh 완료목록·동명시설 모호성 검사, 응답 시설·계정 일치 후에만 nonce 유지. 준비 전 비용 미확인/시설 완료품 전체를 표시하며 자동 행동/unknown 해제는 없다.
- `DesktopLifeExecutor`의 기존 collect 준비 nonce에 내부 collectionFacility를 고정하고 동의 전후 재검한다. 외부 bridge/원장 스키마/서버 API/DB/RLS 권한 변경 없음. 과거 결과불명은 계속 차단한다.
- `ErgonFacilityIcon`은 사용자 첨부 PNG6종/Next Image 최적화 사용, 원본은 public/IRIS/facilities에 보관. 시설행은 아이콘·이름/완료수·수령버튼 1~2줄, 공통 안내만 details. 새 native는 정상 재시작 후 적용하며 로컬 후보/공개버전·ZIP·운영main은 유지한다.

## 2026-10-15 — B1 기능브랜치 전송 결과 문서 마감

- 구조 변경 없음. 기능02cde76/리뷰수정520d136 일반push·원격일치/main1d8e374유지. 아래 B1 로컬모델/큐/진척 구조만 인계하며 운영 API/DB/RLS·공개IRIS0.3.0 구조는 그대로다.
- GitHub Vercel success는 확인, 동일scope MCP403/CLI없음으로 직접Ready·실화면미확인. 정상운영배포/전체자동생활완료 의미가 아니다. 집 수신·REA별도설치·실검증 경계는 HANDOFF와 IRIS_YEONGGEOP_HANDOFF를 따른다.

## 2026-10-15 — ERGON B1 통합 큐·추가 제작 진척 로컬 구조

- 최종후보 whole629/626PASS3skip/독립타입·lint·격리58 PASS, 완료최종품 예약 회귀수정으로 한계·구조 검증. 운영 DB/API/RLS/native bridge/원장/공개버전 구조변경 없음. 기능브랜치 전송은 운영배포 완료를 뜻하지 않는다.

- 최종 리뷰 후 `reservedOutputs`는 확인된 최종 목표 산출 중 `min(원래목표,확인량)`을 실제 가방의 가용량에서 별도로 공제한다. 완료 root를 남은목표 목록에서 제거한 뒤에도 예약은 유지하며 초과분만 다른 목표에 사용한다. 부분완료/중복품목 예약도 동일 컨텍스트다. native 원장/실제 소비 재고에 예약을 강제하는 구조가 아니라 읽기전용 계획 계산이다.

- `lib/irisErgonSupply.ts`는 기존 단일 preview(32노드/8깊이)를 유지하며 같은 예약 컨텍스트의 `buildErgonSupplyBatchPreview`(50목표/32노드/4깊이)를 제공한다. 추가 root 결과물은 예약하고 단위 잔량만 공유한다. installed-reference는 complete:false/자동실행 false 유지, 소비 API를 갖지 않는다.
- `DesktopErgonQueue.tsx`는 보관 원본 계획과 별도 임시 제작진척을 받아 남은 목표의 부족분을 한 번에 계산한다. 펼친 경우만 선택 참고32품목을 직렬 조회/실패기억·늦은범위폐기, 계정·캐릭터·환경 key를 따른다. `ConnectedErgon`은 큐가 열린 idle에 필요한3종 catalog를 기존 세션으로 갱신하며 실행중 잠금/오류 시 중단한다. 기존 실행 인스턴스/작업계획 localStorage v1은 그대로다.
- `lib/irisErgonFacilities.ts`는 works를 시설별로 집계하고 capacity:null을 유지한다. 현재 등록된 작업의 절반 완료는 수령 검토 안내일 뿐 실제 정원/자동수령 계약이 아니다. Workbench overview가 이를 표시한다.
- `lib/irisErgonCraftGoal.ts`는 추가 목표·확인 산출·own receipt·최대5명령/25날개/5분 예산을 별도 순수 상태로 관리한다. native schema3의 verified completed/정확 debit5/metadata 일치만 진척, pending/unknown은 후속 차단, 장비 재고null 허용. 원장/nonce/typed native 한 요청1..5 craftCount는 변경하지 않는다.
- Execution은 `savedCraftGoal/onCraftProgress`로 현재 계획ID/계정/캐릭터의 임시 목표상태를 부모에 전달/선택왕복 복원한다. 부모는 원본 목표를 저장한 채 남은 수량만 Workbench/Queue에 주며, 새 추가 목표·수량편집은 명시적으로 진척을 분리한다. 영속 자동재개나 과거 unknown 해제 기능은 없다.
- 새 게임 소비·임의 CLI·native 원장 마이그레이션·운영 API/DB/RLS/공개 버전·패키지 구조 변경 없음. 관련 회귀·REA 집 설치·실게임/B2 미완료 경계는 HANDOFF/REA_SETUP/IRIS_YEONGGEOP_HANDOFF를 따른다.

## 2026-10-15 — 순월 검증용 기능 브랜치 인계

- 전송 결과 문서 마감은 구조 변경 없음. 기능 코드 `24c7534`의 인계 브랜치 push·원격 일치 확인, Preview 상태는 MCP 권한403/CLI 부재로 미확인(GitHub 검사 pending 관측). main/운영 구조는 그대로 유지한다.
- 아래 10월 14일 관제실·bool 창 전환·버전별 업데이트 요약 구조를 `codex/iris-checkboard-classes`로 인계한다. 이번 문서 마감의 추가 구조 변경 없음. 운영 main/SANCTUM v2.31/IRIS Beta 0.3.0/공개 ZIP/DB/API/RLS/권한은 변경하지 않는다.
- 한설 요청에 따라 실제 앱·게임·업데이트 설치 검증은 순월이 이어받는다. 합성 검증을 실게임 성공으로 취급하지 않고 unknown 원장 잠금과 기존 설치 검증 계약을 유지한다. 수신·재시작·검증 순서는 HANDOFF와 IRIS_SOONWOL_HANDOFF 최신 항목을 따른다.

## 2026-10-14 — ERGON 관제실·업데이트 요약 로컬 구조

- `ConnectedErgon`은 같은 session/실행 인스턴스를 유지하며 overview/catalog/focus 1~3영역으로 재배치한다. Workbench view=overview/materials로 현황을 중복조회하지 않고 선택재료를 실행 수량 아래에 배치. Execution historyVisible은 같은 계정의 기존 native history를 표시하며 unknown 해제/명령 추가 없음. 역할색 CSS는 iris-ergon 범위와 전역 변수 기반, 다른 모듈 버튼은 변경하지 않는다.
- `createDesktopStore.setWorkspace(bool)`→strict same-origin/epoch `window.workspace`→DesktopWebView.SetWorkspace. DesktopWorkspaceLayout은 모니터 작업영역 clamp/1240확장·원래bounds복원. 저장폭 파일/컴팩트 설정 미변경. Tracker의 별도 independent placement 소유권은 일반창 도킹 덮어쓰기를 막고 기존 compact 배치는 보존한다. 실제 Tick이 사용하는 ApplyPlacement 경로를 합성프레임으로 시험한다.
- `DesktopUpdater`→`readIrisUpdateNotes`→고정 `/IRIS/notes/<semver>.json`: 버전별 schema1/섹션 plain-text,16KiB/8초/strict구조·버전일치. 대상불일치·실패는 노트링크 안내, 닫힌창/지난버전 응답폐기. 설명은 설치 권위가 아니며 기존 download.json/ZIP hash/native updater 계약은 그대로다. 새공개버전마다 같은버전 설명 JSON을 함께 작성한다.
- 운영 버전/공개ZIP/DB/API/RLS/권한 변경 없음. 로컬 dev만 webpack 파일접근오류 우회로Turbopack3000 실행, 캐시백업 보존. 실게임·설치·운영 검증과 UI/합성/컴파일 결과는 HANDOFF에서 구분한다.

## 2026-10-14 — 부족분 수급 프리뷰·안전 준비 오류 / 인계 구조

- 전달마감 문서 후속은 구조변경없음. 코드885e97f 기능branch push·원격일치/동일PreviewREADY 확인, 실화면접근은임시공유권한별도승인없어미확인. 운영main/서비스권한/공개제품에승격하지않음.

- `buildErgonSupplyPreview`: fresh 공식 자료+선택 installed-reference, root 추가결과 수량, 정확이름 provider, 공유가방 예약·단위산출 잔량, 공식 missing 합집합/불명 수량 차단. 창고·잠김·다중경로·순환·미해금 방어, 32노드/8깊이/품목별32재료. 가공 등록·수령 분리, `automaticReady:false`, 추정 날개는 실행예산 아님.
- `DesktopErgonSupplyPanel`: 필요 하위자료 하나씩 직렬 조회(max31+root), sibling 갱신으로 다음 조회 취소·중복 방지, scope/active cleanup으로 늦은값 폐기. Workbench 접힌 순서와 단계 계획 추가만 제공, native 자동 실행 없음.
- `DesktopBridge` action 비동기 오류는 정해진 safe code만, `irisErgonErrors`의 안내는 active epoch/environment에서만 적용. raw 예외/stale frame은 일반 오류. Stop/nonce/원장 보호 유지.
- 기능브랜치 인계 push·15%중단 재승인, 운영 구조/제품버전/공개ZIP/DB/RLS/공지 변화 없음. commit/Preview는 HANDOFF 마감 참조.

## 2026-10-14 — ERGON 수량 제작·통합 작업대 로컬 구조

- `DesktopLifeCli.CraftAsync(name,count)`는1..5 execute_crafting만 전송, 명령당날개5. actor `BindCraft`/strict5-field craft intent/산출 baseline동결/native수량 동의, returned craftCount·debit·조회가능재고 대조. `CraftOwned`는 get_items에 없는 장비수량을null로 보존. 제작완료응답을 재료재고0→0만으로 실패처리하지 않는다.
- action capabilities schema3(quantityCrafting/maxCraftCount5), crafting metadata craftCount/outputPerCraft/expectedOutput가 nonce/current/history/DPAPI schema3에 연결. schema1/2 및 entropy/path v1 유지. 구앱은신규수량기능이없으며 원장손상·unknown은닫힌실행상태로유지한다. 실제 행동이 결과불명인 과거행을 새코드로완료/삭제하지 않는다.
- `DesktopLifeReference`/bridge game.life.reference({kind,displayName})는 crafting/altering 및 설치 두 고정 파일만 읽는다. 최대1MiB/2048items/32ingredients/중복·수량·reparse 방어. selected normalized facts/date/installed-reference/completefalse만 UI전달, cached Owned/Craftable·raw DB·파일경로·스크립트 실행0. 선택자료 parser와 `calculateErgonNeeds`는 fresh bag/partial provenance/공식 충돌을 구분한다.
- `DesktopErgonWorkbench`: 현재캐릭터현황·재료비교·시설 details/부족품계획shortcut. `DesktopErgon`은 실행영역을계속mount해상태유지, 선택후목록접기/작업카드우선. `useErgonSession.refreshOverview`는materials/works/inventory/currency 순차·single-flight, 문맥reset/늦은값폐기. idle10초poll·선택catalog갱신, 준비/동의/running때읽기정지·실패보존.
- `DesktopErgonExecution` local flight와 native busy를 함께부모에전달; idle status가준비잠금을풀지못함. quantity change는동일저장계획/필요량에반영, 반대방향live read중에는새준비잠금. 구형수동묶음5/25/5분·채집목표/stop/ABA 원칙보존.
- DB/서버API/RLS/제품버전/공개ZIP/공지 변화없음. 완전BOM 기반자동부족분chain/시설50%수령재충전/Chronos/모바일은구현전.

## 2026-10-14 — ERGON 수량·현재 채집 중지 A 로컬 구조

- `DesktopLifeExecutor` gathering intent는 additionalQuantity1..100/allowAutoStop과 확정 가방 baseline을 nonce에 묶는다. 동의 뒤 동일 baseline/조건을 재검하고 소비1명령/날개5를 보낸다. runtime 목표와 문맥/epoch는 불변; `WatchGathering`은 약1초 간격으로 별도 native 조회를 소유하여 창 숨김 뒤에도 관측한다.
- `DesktopLifePolicy.GatherStock`는 named complete 자료의 정확한 Ingredient·정상 위치·잠금 해제 inventory1행만 사용한다. 정상 빈/창고만 있는 결과는 가방0, 불완전 위치/다른 분류/중복/불명 count는 차단한다. 활동은 현재 Stop+Gathering과 모든 안전 flags를 확인하며, 교체/미확인은 자동·수동 control 전송을 차단한다.
- `DesktopLifeCli.StopAsync()` 고정 stop_action/body 없음/8초/1MiB. `DesktopBridge`의 game.life.actions.stop({requestId,accountId,characterId})는 별도 control busy로 일반 gameBusy를 우회하되 origin/epoch/replay/정확 payload를 유지한다. actor의 request/context/확정 epoch + 원래 performTask.IsCompleted를 journal IO 이후 전송 직전 재검한다. invalid_state만 최대3회·10초 시도창; 원래 CLI·이미 보낸 control 응답 이후까지 실행 잠금 유지.
- 원장 파일/entropy v1 유지, schema1/2 읽기와 gathering 메타/부분 stopped 저장을 지원한다. accepted stop은 접수일 뿐; 원래 stopped/completed·최종 재고/날개5·idle과 일치한 경우만 중지/목표 완료, 불명은 unknown으로 차단한다. 재시작 inflight→unknown·300건/30일/전역 실행 lease·환경/계정 분리는 유지한다.
- typed client capabilities schema2로 새 실행을 gate, 구형 응답 파서는 유지. `DesktopErgonExecution` 수량/동의/진행·주 중지/새 계획/details, generation+request+상태 관측 revision으로 늦은 stop 응답 폐기. 연결된 부모 실행 view는 선택+실행 카드로 정리, read-only preflight와 기존 제작 예산/deadline/ABA 동작은 보존한다.
- 운영 DB/API/RLS/공개 v2.31·IRIS0.3.0/ZIP/공지 변화 없음. 실제 game stop/최종 날개 검증 전 후보이며 B 완전 재료표/부족분 chain·Chronos·시설 반복은 별도 남은 작업이다.

## 2026-10-13 — 사무실 인계 체크포인트 구조 경계

- 전송마감문서후속은구조변경없음. 후보코드c1f302d/설계117af74가인계브랜치에일반push·원격SHA일치, main1d8e374유지. 새수량/실제stop구조는설계검토대기이며현재다운로드제품에반영됐다고표시하지않는다.

- 기능브랜치후보의수동묶음모델/지속실행영역/세대폐기/현재mainButtonState 검사구조는아래최신항목대로유지. 서버/API/운영DB/RLS·공개패키지구조변경없음. 정상운영 v2.31/IRIS0.3.0에새자동채집완료를추가한것이아니다.
- `docs/IRIS_SOONWOL_HANDOFF.md` 최신수신명령/사용자전달문장과 `superpowers/specs/2026-10-13-ergon-quantity-stop-design.md` A(목표감시실제stop/추가수량/압축UI)→B(확인BOM부족분chain) 설계검토대기를인계. 새native goal/stop bridge·부분stopped원장·순차chain은아직구현하지않았다. 기존원장·본인소유권·보호대기함을재사용할예정이지변경완료아님.

## 2026-10-13 — 제한 수동 묶음 후속 로컬 구조

- 준비 차단 핫픽스: native 활동 정규화에 `mainButtonState=Mode.MainButtonState`, client 활동 형식은 구형 frame을 `null`로 호환 조회(실행 허용 아님). native/client 안전조건은 NotInDungeon·기존15flags=false·Compass만 허용. `interactionType`은 공식 LastRunningInteractionType 이력을 보존하되 현재 busy 조건으로 쓰지 않는다. Stop/Fishing/FishingPull/Combat/Hide/누락/미확인 상태는 실행 전/최종 동의 후 재검에서도 차단. DB·브리지 명령 종류·nonce/원장·cost 한도 변경 없음.

- `irisErgonRunQueue`는 순수 수동 묶음 예산/중지/만료 모델. `refreshErgonQueue`는 관측값만 갱신하고 예산·완료ID·중지·첫 준비5분 기한을 유지한다. `advanceErgonQueue`는 중복이 아닌 완료 관측의 재고 증가/날개5 감소만 차감한다. 자동 명령 발송기가 아니다.
- `ConnectedErgon`의 실행 section은 내부 메뉴 이동 시 unmount 대신 hidden 유지, 활성 실행 영역만 `active` 전달. `DesktopErgonExecution`은 요청 세대 번호로 화면/계획/계정 ABA 응답을 취소하고, 결과 관측을 이어가되 비활성 idle polling은 정지한다. 상태 조회 중첩 및 늦은 다른 문맥 이력 반영도 차단한다. 수동 명시적 새 묶음·다음 작업 중지 버튼과 만료 타이머만 추가, native CLI/DPAPI/고정 bridge/API/DB 구조 변경 없음.
- 운영 v2.31/IRIS0.3.0·공개ZIP 유지. 합성 검증 통과와 통나무1회 실게임 시험은 구분하며 후자는 아직 사용자 화면 확인 대기다.

## 2026-10-13 — ERGON 단일 생활 동작 로컬 후보 구조 (운영 미배포)

- native `DesktopLifeActionPolicy`/`DesktopLifeCli`/`DesktopLifeExecutor`가 기존 `DesktopLifeReader` 조회를 바탕으로 고정 4명령(채집·가공 등록·제작·시설 완료분 수령)의 요청/조건/비용을 검사한다. `DesktopLifeJournal`은 DPAPI·원자 저장·전역 배타 파일잠금·계정/환경 경계와 결과불명 차단을 담당한다. 준비 nonce/네이티브 Yes/No/승인 뒤 재조회 후에만 명령을 발송한다.
- `DesktopBridge` 고정 `game.life.actions.*` → `irisDesktopStore`/`irisErgonActions` → `DesktopErgonExecution`으로 단일 동작 준비/승인/상태/계정별 기록을 연결한다. page는 실행 중 전환/닫힘 잠금, native는 진짜 소비 명령 실행 시 자체 가드를 둔다. `irisErgonRunQueue`는 최대 5회·25날개 **순수 미리보기**, 자동 발송/재시작 재개가 아니다. 완료가 관측돼도 다음 명령은 새 사용자 확인이 필요하다.
- 공식 읽기 7종·15초 숙제 저장·보호 대기함·SANCTUM 서버/API/DB/RLS는 변경하지 않는다. 공개 IRIS0.3.0 패키지와 운영 v2.31에는 포함되지 않았다. 실제 게임 행동/사용자 설치 시험 전 완료 기능으로 분류하지 않는다. 전체 BOM·Chronos 연결·반복 시설 운영/푸시 알림은 미구현.

- 2026-10-13 체크포인트 최종검증: Node484/481PASS3skip·tsc/lint·격리webpack·생활native/보호원장/host/packagePASS. 구조도추가만인계브랜치에공유하며운영구조·공개버전·DB변경없음. 실제종료복구및소비명령미연결은HANDOFF참고.

- 개발체크포인트추가: `irisDesktopStore` 요청번호는Symbol.for globalWeakMap의channel별수명으로FastRefresh 재생성에도연속유지한다. native origin/epoch/lastId 검증은그대로다. `DesktopLifeJournal` 동기화는LocalMutex가아닌로그인세션간배타FileShare.None파일잠금이며30일완료분정리는다음Begin에서실시,미확정은보존한다. 아래원장NamedMutex표기는교체전경과다. 실제게임실행endpoint는여전히없음.

## 2026-10-13 — ERGON 읽기·계획 및 자동 작업 안전 기반 로컬 구현

- `DesktopCenter.ergonPanel(active)`→`DesktopErgon`→`useErgonSession`→`irisErgonSession`/`irisErgonRead`. 페이지의 공유 nativeReads 직렬 큐·종류별합치기·시작 전/응답 문맥 및 visibility generation을 검사한다. 활동/가방무게/재료/가공현황/채집·가공·제작목록7종, 최신15초 판정. 가공 현황은 수동 성공 후 활성 재료 화면에서만10초 조회, 오류 시 중지.
- native `DesktopLifeReader` 고정7명령/Ingredient고정필터/UTF8 1MiB/2048행/8초/nullable. `DesktopBridge.BindLifeRead`, `game.life.capabilities`(readOnly)/`game.life.read`(kind enum1개)로 origin/epoch/replay/gameBusy 잠금을 유지. 기존 stats/currency64KB 상한은 유지. error/pipe/거부status/body.error 응답은 성공으로 만들지 않는다. WebView Visible/실제최소화/종료 상태 재확인.
- `irisErgonPlan`: localStorage `iris_ergon_plans:v1:<환경>:<계정>` 목표의도50개/32KiB. 검색·수량1..1000000/개별삭제/손상원본 보존·명시적초기화/저장실패세션보존. 산출량으로ceil 횟수; 제작 배치날개범위/채집최소/가공등록소모, 부족분은현재1회만. 전체BOM·실제신원·일반채집/낚시분류·시설정원 추측 금지.
- `irisErgonStart`/시작전점검은 최신 활동14필드/던전·무게·날개5·후보조건·캐릭터확인·미확정기록을 **읽기만** 검사. 모든 상태에서 `canExecute:false`, game.execute/stop endpoint 없음. 조회 중 화면/계정/잠금이 바뀌면 후속 단계와 늦은 재화 응답 폐기.
- `DesktopLifeJournal`은 native-only 보호원장 기반 클래스/독립합성시험이다. DPAPI CurrentUser/환경분리/atomic flush+replace/NamedMutex, 최근300/30일(미확정은삭제금지), 다른계정 포함미확정 차단·재생거부·재시작 inflight→unknown·손상보존. native 소스목록에는 포함하되 **호스트/브라우저 실행·기록 UI와 아직 연결하지 않음**. 실행nonce/사전native 재조회/명령·결과확인/반복큐는 남음.
- 기존 SANCTUM 서버/API/DB/RLS/보호저장큐·운영버전·공개패키지·공지 변경 없음. 아래 UI-only/구조변경없음은 이 조회착수 이전 경과다. 새 native 출력을 포함한 compile은 scratch에서만 검증한다.

## 2026-10-13 — IRIS 에르곤·저장 안내 로컬 후보 (미배포)

- DesktopCenter→DesktopMainTabs(kronos/synaxis/ergon), 기존 숨김 유지 패널/초안 유지. DesktopErgon 소개·4영역은 UI만, 생활 API/native 명령·게임 실행 큐 미연결.
- DesktopIcons.ErgonIcon: `public/svgs/UI mark/생활 마크.svg` currentColor CSS mask. 배경/비트맵/외부 리소스 없음.
- DesktopSaveStatus는 기존 controller pending/confirmation을 body 포털로 표시. 유휴숨김/완료3초/미리보기4초/오류복구 유지, visible aria-modal 동안 CSS로 숨김(숨겨 둔 패널 제외). DesktopAddonSettings→useDesktopAppearance→irisAppearance의 `iris_appearance:v1:<environment>:save-position` 4모서리 로컬 설정, DB·계정 공유 없음.
- 기존 저장 controller/보호 대기함/서버/API/DB/RLS/native 구조 변경 없음. 운영 버전·다운로드·공지 변경 없음.

## 2026-10-12 — v2.31 / IRIS0.3.0 공식 적용

- 후속 문서9cfcfb2의 Git정보조회 배포 오류는 같은 커밋 정상재배포 dpl_6W4wLEF8k1CBbwjBXEku8Zv2ChUg READY/공식domain 연결 확인으로 복구했다. 코드/패키지·구조 변경 없음. 정확한 실패/복구 경과는 RELEASE_NOTES/HANDOFF에 있다.

- 제품 커밋 d70b0e5·Production dpl_GwtYnzwu2YndBELvBR9TgB98Eitk READY·실제 운영 표시/ZIP 확인, 공지17(생텀)/18(IRIS) 정상 UI 게시 완료. 아래 새 구조는 운영 적용됐다. 이번 마감 문서 후속은 구조 변경 없음·제품 버전 유지/DB스키마·RLS 변경 없음. 실제 게임/다른 DPI 사용 확인은 HANDOFF 첫 과제다.

## 2026-10-12 — 메인 Kronos 15초 묶음 저장 구조

- app/page→useHomeChecklistAutosave→homeChecklistAutosave의 캐릭터별 baseline/의도/version/단일 flight, 기존 memberMutationClient→member-mutations→mergeChecklistEdit/CAS. 승인 응답의 실제 값만 ACK하며 전송 후 입력은 유지한다. Board는 즉시 overlay·수동 저장/카운트다운/실패 상태, 홈 모든 widget router와 파티 참가 버튼은 navigate flush를 거친다.
- pageSaveGuard의 before-account 이벤트는 모든 pending drain 후 인증을 시작하고 홈 편집 잠금을 새 화면/세션까지 유지한다. 저장 준비 실패만 abort 이벤트로 해제, 불명확 인증 결과는 Layout 재조회(reload). beforeunload/링크/popstate 보호는 강제 종료 복구를 보장하지 않는다.
- 서버 선택적 _checklistPeriods는 UI가 캡처한 daily/weekly 기간을 진입/조회 후/갱신 직전 비교한다. 기존 인증·owner 범위·길드버스 병합/CAS 유지. DB 구조/RLS 변경 없음, DB 자체 기간 원자성은 기존 제약이다.

## 2026-10-12 — v2.31/IRIS0.3.0 최종 후보 구조 (배포 전)

- hooks/useHeaderPanelPosition: Navbar data-sanctum-header와각패널data-header-panel, 기존owner안의absolute좌표를ResizeObserver/windowresize·scroll에서requestAnimationFrame1회로갱신·정리. 계정/NotificationInbox/SpiritWingsMenu 공통사용, 기존Esc/바깥클릭 유지.
- desktop native: ApplyAnchoredBounds는compact패널600/아래공간제한·top유지. expanded독립창은640초기높이로본문별자동맞춤을중지. tracker의compactPlacement는fullscreen에서만독립처리, 일반창은Place(matchGameHeight=false)로도킹상태/실제좌우를복원. fullscreen drag는side설정을지우지않는다.
- 기존overlay.opacity 고정bridge범위를30~100으로확장/실제ownalpha만변경. irisAppearance 환경별opacity기억→useDesktopAppearance→page의100msdebounce·직렬native적용; 테마선택/투명도slider. protectedqueue·인증·게임HWND·DBschema/RLS 변경없음. 공개ZIP는Beta0.3.0후보이며Ready/운영검증후최종상태를기록한다.

## 2026-10-12 — IRIS 화면 밖 연동·접기 높이 후속

- AddonWindowPolicy.Place는 게임의 보이는 세로 구간으로 위치/높이를 계산한다. Tracker.FollowGameVisibility는 모든 모니터 밖 게임에 대해 소유 IRIS만 숨김/복원하며 직접 숨김·연동 끔·종료 확인을 구분한다.
- DesktopPage compact 진입 시 설정 닫음, classes 100dvh는 expanded에만 적용. DesktopWebView는 패널 닫힐 때 측정 높이를 폐기하고 layoutRevision으로 늦은 이전 측정을 거른다. 기존 bridge/보호 대기함/API/DB 구조 변경 없음.

## 2026-10-12 — IRIS 글꼴·presentation·알림·캐릭터관리 로컬 후보 구조

- `DesktopInstalledFonts`→fixed `window.fonts.list/refresh`→store exact parser→page owner `useDesktopFonts`→`DesktopFontPicker`. 이름만캐시/검색, 파일업로드·다운로드0. `useDesktopAppearance`의 IRIS 로컬font는main과포털dialog에만적용하고route해제시CSS변수를정리한다.
- `DesktopPresentationState`/별도window-presentation-v1 로컬파일→`window.presentation.state/toggle/panel`/epoch event→`useDesktopPresentation`→Titlebar□/Center hidden 유지. Tracker는read-only 최대화/모니터frame으로관측, compact높이는게임높이와분리/패널임시높이. WebView폼Region은GraphicsPath로크기/DPI변경시소유자원정리하며갱신한다. 기존addon 상태와protectedQueue 형식은그대로.
- `sanctumEventTimes`는홈과IRIS KST 규칙공유. `irisContentAlerts` 설정/once tracker, `useDesktopContentAlerts` 단일page owner의bounded조회/2Realtime구독/로컬초시계, `DesktopContentAlerts/Report/AlertModal`은기존SVG/FocusDialog/명시적reports POST. `DesktopAlertSound` 고정자가WAV→`window.alert.sound`, browser가URL/파일/볼륨을전달할수없음. 크로노스하위8개버튼(4+4,좁거나큰글자는2열).
- `/api/iris/character-management` GET/POST + `irisCharacterManagement` 서버/클라이언트 검증; existing `characters`(id/owner/nickname/job/is_main)와활성 `nexus_classes`만 사용. Controller는기존큐save/drain/reconcile 뒤메타변경하고directory/selected를갱신,legacy읽기전용행을보존한다. `DesktopCharacterPicker/Editor`는실제카드+추가1카드/연필/대표, 모든실제추천수동선택과스탯확인other는단일선택창으로연결. metadata변경에만추천목록1회재조회.
- page는picker/report/추천/종료의modal 우선순위·busy를연결, 종료확인취소에초안이복귀한다. DB스키마/RLS/권한/게임행동/운영배포 변경없음; 대표clear/set는cross-client원자성없으며현재값postread/부분실패로방어한다. 이 항목은미커밋로컬후보이지production완료표시가아니다.

## 2026-10-12 — IRIS 로컬 폰트/바탕화면 경계 후보

- DesktopGameWindowTracker는 Progman/WorkerW/desktop root를 일반앱 yield 대상에서 제외하고 게임같은층을 유지한다. 다른앱은 여전히 뒤로 이동. 시스템배경/게임/다른창은 수정하지 않는다.
- irisAppearance/useDesktopAppearance/설정은6~22pt를px로환산한 기존font키에 기억(이전18/20/22px호환), font-family별도환경키/80자설치이름검사. DesktopPage main fontFamily만 적용하고웹전역변경없음, RootLayout은IRIS폰트dataset를웹이동시정리. CSS큰글자 메뉴2열/숙제1열. DB/API/nativebridge/운영버전변경없음.
- 축소바/알림/캐릭터관리 새구조는 현재설계후보이며 실제구조도에 구현완료로 넣지 않는다. 기준은docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md.

## 2026-10-12 — IRIS 상시 하위 버튼 복원 로컬 후보

- `DesktopFeaturePicker.tsx`는 드롭다운/effect 없이 기존7개 기능을 4+3 두줄에 상시 표시한다. `DesktopCenter`의 featureOpen만 제거, contextPanelOpen 잠금/본문hidden·초안 유지. desktop.css의 하위7버튼과 축소 상위버튼은 rem/테마 기반. 사용자가 인계 드롭다운을 거부해 기존 버튼형으로 복원한 결정이며 기능/저장/API/DB/native 변경 없음.

## 2026-10-12 — IRIS 창 순서/종료 설명 로컬 후속

- `DesktopGameWindowTracker.ApplySameLayer`는 NOTOPMOST 해제 후 다른 foreground 창보다 앞에 있는 자신의 HWND만 뒤로 배치한다. `IsAbove`는 실제 Z-order를 제한 순회한다. 게임/다른 앱 창·초점/geometry 변경 없음, sameLayer 해제·작업표시줄/종료·기존 복귀raise 유지.
- `DesktopCloseDialog`의 `hasPending`을 DesktopPage가 현재계정 큐/invalid draft에서 계산. DB저장/PC보관 이름·설명 제공, clean은 기존save 경계를 사용하는 단일 종료. store/close 오류는 복구 선택 유지. API/DB/보호store·native bridge 메서드/버전·패키지 변경 없음.

## 2026-10-12 — IRIS 수동 폭·글자와 감시 경계 로컬 후보

- `irisCharacterSwitch.baselineObservation`/`DesktopCharacterWatch`: 후보 관측 대신 계정 세션의 비교 기준을 보존하고 장시간 숨김 후 역사 기준을 허용한다. 실제 추천은 새로운 신선한2관측을 요구한다. 자동DB 쓰기·새 주기DB 조회 없음.
- `GameWindowSession`/`DesktopGameWindowTracker`: frame 읽기와 최소화 결정을 분리, 수동 표시 복귀 후 최소화 재적용. `AddonPreferencesFile`은 기존 창 설정과 별개인 `window-width-v1.json`을 엄격히 저장/로드한다. `DesktopWebView` 양쪽 네이티브5px resize edge와360~720 폭/재실행 복원, fit/dock은 사용자 폭 유지.
- `irisAppearance`/`useDesktopAppearance`/`DesktopAddonSettings`: 환경별18/20/22 font 저장·root 적용. `RootLayout`은 IRIS font의 소유권을 넘기고 웹 이동 시 기존 전역 기준을 다시 적용한다. desktop CSS의 가변 폭/큰글자 좁은 숙제1열. DB/API/브리지 메서드/패키지·버전 변경 없음.

## 2026-10-12 — 웹 크로노스 15초 저장 로컬 후보

- `lib/kronosAutosave.ts`: 마지막 수정 후15초·최신 snapshot 단일 진행·명시 flush·미저장 leaf 수·실패 보류·진행 중 새 수정/되돌림을 관리한다. 페이지 세션 메모리만 사용하며 영구 보호 큐를 새로 만들지 않는다.
- `/character`: 기존 mutation/checklist 병합 경로에 미저장/저장/오류 때만 나타나는 우측 상단 반투명 패널·지금/다시 저장·로딩/전환 잠금·링크/뒤로 이동 전 flush·beforeunload 경고를 연결한다. 기능 필터 버튼은 고정 최소 높이 없이 작은 세로 여백을 쓴다. 캐릭터 관리창도 기존 변경을 먼저 저장한다. 공유 교환 dirty ID는 전체 관련 쓰기 성공 뒤 해제한다.
- `KronosWorkspace`: 상점/임무 count·즐겨찾기를 동일 autosave 정책에 등록하고 페이지 합산 상태/flush에 참여한다. delta 결과 유실은 수동 retry 전에 기존 GET으로 재확인한다. 메모는 기존 별도 저장, API/DB/RLS/native/권한 구조 변경 없음. 운영 반영·새 버전은 아직 없다.

## 2026-10-12 KST — 순월 인계 브랜치 공유

- 이번 인계 문서 후속은 **구조 변경 없음**. `docs/IRIS_SOONWOL_HANDOFF.md`에 수신 안내를 추가하고 기존 릴레이에 푸시 승인 범위를 누적했다. 아래 탐색 후보는 main에 통합하지 않은 개발 브랜치다. 운영 SANCTUMv2.3/IRISBeta0.2.2·API/native/DB/RLS/보호 기록은 그대로이며 미래 HUD 구현/공개 배포는 별도다.

## 2026-10-11 — IRIS 탐색 정리 로컬 후보

- `DesktopFeaturePicker`는 기존 KronosTab 7개/이름을 export하고 생텀 기록·캐릭터 관리·게임 정보로 분류한다. 현재 기능 줄은 상시 표시, 목록은 필요할 때만 mount한다. 선택/Escape/바깥 조작·초점·남은 뷰포트 높이 측정/리스너 해제는 이 컴포넌트가 담당한다.
- `DesktopCenter`는 기존 본문을 숨김으로 유지해 클래스 초안/패널 수명을 보존한다. 기능 선택과 캐릭터 선택을 상호 닫고, 상위 메뉴·잠금·설정·선택 캐릭터·계정 메뉴 변경 시 기능 목록을 닫는다. `DesktopPage`는 기존 accountOpen을 내부 prop `contextPanelOpen`으로 연결한다. 기존 API/native/보호 대기함/권한/DB 계약은 변경하지 않았다.
- desktop CSS는 기존 7개 상시 탭 배열을 테마·rem 기반 현재 기능/선택 그룹/내부 스크롤로 교체한다. 미래 HUD/게임 조회 명령은 추가하지 않았다. 후속 5설계/49항목은 `docs/IRIS_FORWARD_DESIGNS.md`에 보관하며 구현 승인은 별도다. 아직 로컬 후보이고 새 버전·배포는 없다.

## 2026-10-11 19:51 KST — IRIS0.2.2 운영 확인

- main48d5611 / Vercel Production dpl_DP47tvp3qsVdrzpomVmJarb5XrTu READY/동일SHA, 운영 Beta0.2.2·metadata/ZIPhash·실제EXE 최신 HTTPS감지·핵심7GET/authready/화면 확인. 검증 문서 후속은 **구조 변경 없음**, DB/RLS/권한/공개 게시 변경 없음. 구버전0.2.0/0.2.1 HTTPS실패는 nativeZIP수동교체1회 필요하며 사용자 앱 대신 교체하지 않았다.

## 2026-10-11 19:43 KST — IRIS0.2.2 업데이트 조회/스탯 표시

- 19:47 KST 최종 후보 검증 후속: 완성 패키지 어셈블리의 실제 CheckAsync HTTPS 감지 및 최종ZIP 원본helper/WebView0.2.1→0.2.2 교체/보호기록불변 PASS. 구조 변경 없음, 새 시험용 product API/bridge 추가 없음. native 네트워크 fixture의 optional PackagedExe는 테스트 호스트에서 어셈블리의 공용 CheckAsync만 호출한다.

- 기존 desktop-update.cs Download(metadata/ZIP)는 .NET4-target 기본 SSL3/TLS1.0 대신 프로세스 내부 TLS1.2를 지정한다. OS/레지스트리/인증서 검증/프록시·고정 origin·버전·파일 정책은 변경하지 않는다. desktop-update-network.tests.ps1/fixture는 실제 같은 컴파일러 EXE의 CheckAsync로 공개 metadata만 조회해 신버전 탐지를 검증한다(설치·게임·로그인/큐 읽기 없음).
- DesktopUpdater는 native check_failed 상태를 실제 installed Beta 옆 표시한다. availableVersion이 없는 실패를 업데이트 가능으로 오인하지 않는다. DesktopStats 공통 StatsList는 기존 score 검증 후 ko-KR 쉼표 표시, 숫자 문자열/0/null 처리와 저장 원본 보존. 독립 IRIS0.2.2 native/manifest/download metadata 및 README 구버전 수동 교체 안내.
- **구조 변경 없음**: 새 API/bridge 명령/DB/RLS/권한/게임 쓰기/보호 기록 스키마 없음. 이전0.2.0/0.2.1의 HTTPS 실패는 웹 배포만으로 native를 수정할 수 없으므로 최신 ZIP 전체 수동 교체1회가 필요하다. 별도 공개 업데이트 글 없음.

## 2026-10-11 19:21 KST — IRIS0.2.1 운영 확인

- 해산/탈퇴 확인 경로 및 동일버전native패키지는 main b343f24 / Vercel Production dpl_Bad1AjApPg5ri5ukj5LVMRoyhwpK READY/동일SHA로 공개됐다. 운영 다운로드0.2.1/metadata·ZIP해시 일치/desktop 브라우저 편집방어·핵심8GET200/authready 확인. 후속 문서 **구조 변경 없음**, DB/RLS/권한/공개노트 변경 없음. 실제 계정 운영 버스 삭제/탈퇴 시험을 했다는 뜻은 아니다.

## 2026-10-11 19:18 KST — IRIS0.2.1 길드버스 확인 경로 핫픽스

- `GuildBusCard` 해산/탈퇴 → 기존 `PartySurfaceContext.confirm/notify` → IRIS `DesktopSynaxisSurface` 확인창/결과 안내. 해산은 기존 삭제 callback을 await, 탈퇴는 기존 `_busMemberAction:leave` 요청으로 서버의 최신 명단·본인 소유권 검사를 재사용한다. 확인 중 단일 actionLock과 비활성/잠금 guard, 취소/실패 해제; 웹은 기본 confirm fallback 유지.
- `lib/irisRelease.ts`의 독립 IRIS0.2.1 → native generated version/manifest/download.json/최종 공개 ZIP 동일 버전. 기존 native updater의 고정 URL/해시/파일 allowlist/보호 보관·helper 재시작 구조 재사용, 새 명령/bridge/API/DB/RLS/권한 구조 변경 없음. README는 해산/탈퇴 지원 및 남는 회차 완료/인계 제한을 구분한다.
- `tests/iris-bus-controls.test.mjs`는 실제 두 핸들러·탈퇴 전송의 native confirm 차단/취소/중복/실패/권한/웹 fallback 회귀8개, 합성 React fixture는 leave 행동을 명단에 반영한다. 운영 파티 시험 쓰기 없음. 공개 출시글16은 기존0.2.0 유지하고 이번 별도 공개 노트는 만들지 않는다.

## 2026-10-11 14:30 KST — IRIS0.2.0 운영 검증 / 조사 문서

- updater·다운로드·헤더·케리그마 하위 분리 구조는 코드44a958c로 main 공개, 동일커밋 Vercel GitHub success 및 운영 다운로드/metadata/ZIP 실제 일치를 확인했다. 아래 공개 후보/미배포 기록은 당시 상태이며 최신 상태는 RELEASE_NOTES/HANDOFF를 따른다. SANCTUM v2.3/IRIS0.2.0.
- docs/IRIS_CONNECTOR_COMPARISON_20261011.md는 외부 생활커넥터/MoFo/MobiWorks의 기능·49항목 도입 검토 근거다. IRIS native/API/DB/권한·실행 가능 명령을 추가하지 않는다. 이 문서 후속은 **구조 변경 없음**. 케리그마 출시 본문은 준비됐지만 게시 연결 차단으로 공개 글은 아직 없다.

## 2026-10-11 14:22 KST — IRIS Beta 0.2.0 공개 후보

- 독립 IRIS0.2.0, ZIP/manifest/download.json/updater helper를 동일 배포로 공개 준비했다. 아래 14:13의 실제시험 권한 차단은 오프라인 새 WebView user-data 시험으로 해소됐으며 제품 파일 그대로 교체·준비 handshake 성공을 확인했다. 보호 파일/설정 해시 동일, 운영 웹/DB 시험쓰기 없음. 첫 지원 앱은 수동1회, 다음 새 지원 버전부터 내부 업데이트 가능.
- 테스트 전용 desktop-update-live 옵션은 명시적 offline fresh profile과 전체 DNS 차단을 검증하며 임시 설치 외 앱 파일을 교체하지 않는다. 제품에는 시험용 URL/경로/명령/브리지 API를 추가하지 않았다. 새 외부 프로그램 비교는 문서 조사만이며 IRIS native 허용 메서드를 확장하지 않는다. 공식 구조의 상세는 아래 updater·하위탭 절을 따른다.

## 2026-10-11 14:13 KST 로컬 출시 준비 — IRIS 0.2.0

- lib/irisRelease.ts의 독립 버전은 0.2.0 로컬 후보다. 아래 0.1.0/공개 ZIP 보존 기록은 당시 상태를 유지한다. 현재 공개 패키지·운영 코드에는 아직 적용하지 않았다.
- lib/kerygmaUpdates.ts는 기존 고정 IRIS 제목과 엄격한 버전 형식의 `IRIS Beta x.y.z 출시!`를 시스템 작성자/생텀 업데이트 분류일 때만 IRIS 이력으로 분리한다. note=iris 최신 글 진입과 기존 글 ID 경로를 유지하며 새 DB/API/권한 변경은 없다.
- iris/desktop-update-live.fixture.cs/.tests.ps1는 실제 두 release 패키지를 별도 임시 설치에 복사하고 sandbox AppData에서만 시험한다. 현재 sandbox 파일 rename 거부로 준비 단계 실패, 실앱 교체 미검증이다. 자동 업데이트 공개와 케리그마 게시는 HANDOFF의 차단 조건 해소 뒤 진행한다.

## 2026-10-11 로컬 후속 — IRIS native updater

- `DesktopUpdater.tsx` → `irisDesktopStore`의 고정 `window.update.state/check/prepare/apply(null)` 및 epoch-scoped event → production `DesktopBridge` → `desktop-update.cs`. 설치된 native 버전만 비교하며 같은/낮은 버전·구형 bridge에는 업데이트 버튼이 없다. parent는 기존 `shutdown('keep')` 보호 보관 성공 뒤에만 apply한다. native 종료 결정 방어/모달 inert/작업 잠금은 유지한다.
- `desktop-update-policy.cs`는 고정 운영 HTTPS의 release metadata와 ZIP9 payload+manifest를 검증한다. `desktop-update-install.cs`는 설치 폴더 원본 hash/백업/journal/marker/원자 교체·restore/ready PID·시작시각·버전 확인을 담당한다. `desktop-update-helper.cs`는 설치된 검증 helper를 transaction으로 복사해 정상 종료 이후 실행한다. 정상 교체/복구 모두 공유 queue mutex와 실행 중 설치 확인을 사용한다. 시작 시 미완료 marker는 복구 helper로 연결한다.
- `build-beta.ps1`은 `lib/irisRelease.ts`의 버전을 native 상수에 주입하고 standalone helper/strict manifest/download.json을 생성한다. 임의 파일·URL·명령·DB/RLS/API 권한 확장은 없다. 프로필·보호 큐·게임·CLI는 교체 대상 밖이다. 무료 unsigned; 최초 지원 패키지는 수동1회 교체 필요. 현재 공개 ZIP/metadata·버전·운영 배포는 보존하며 실제 사용자 앱 업그레이드는 검증 대기다.


## 2026-10-11 로컬 후속 — 업데이트 하위 탭 / IRIS 실행 4단계

- KerygmaCategoryTabs → 생텀 업데이트 선택 시 생텀 업데이트/IRIS 업데이트 하위 버튼. app/kerygma/page.tsx는 updates=sanctum|iris URL에서 선택/필터를 파생한다. lib/kerygmaUpdates.ts의 정확한 시스템 IRIS 노트 판별을 목록 분리와 기존 note=iris 읽기에 공유한다. 글 읽기/목록 복귀/새로고침/뒤로가기에서 하위 분류를 유지하고 numeric id 경로도 보존한다. 기존 목록 조회 재사용, DB type/스키마/API/권한 변경 없음.
- 다운로드 실행 안내에 한설 제공 인게임 설정 → 게임 탭 → "마비노기 모바일 AI 커넥터 beta" 켜기를 추가해 4단계로 구성한다. 카드열은 모바일1/md2/xl4, 전역 테마·rem·긴 문구 방어는 유지한다. 공개 ZIP·빌드 메타데이터·native 계약은 변경하지 않는다.
- IRIS 누적 공지 초안/기록 규칙만 갱신하며 운영 게시와 푸시는 별도 배포 승인/성공 확인 이후다.

## 2026-10-11 로컬 후보 — 홈 IRIS 다운로드 / 안내 구조

- 최신 승인 후속: 홈 IrisDownloadEntry 카드 대신 전역 Navbar 빠른 도구 2×2(날개/테마, 알림/IRIS) → /iris/download. 별도 홈 카드 컴포넌트는 제거했다. IRIS는 accent 배경/contrast SVG/정적 광원, 네 도구는 같은 크기다. 기존 홈 숙제/파티/랭킹·상단 메뉴를 보존한다.
- layout 기존 헤더 측정 → --sanctum-header-height → 날개/알림/계정 팝오버의 헤더 아래 위치·남은 화면 높이 제한. 기존 session GET/성공한 switch 확인 ID → Navbar → IrisWelcomeGuide. 새 조회나 저장 API 없이 localStorage 계정별 첫 안내, native dialog/버튼 강조·화살표/명시적 닫기·Esc·바깥/다운로드 이동 완료 기록이다. 숨은 헤더 안내 유예/애니메이션 완료 후 측정/nav·target 관찰, 종료 시 비동기 취소·스크롤 복원, 인증 load/switch/logout의 늦은 GET 무효화 방어를 적용한다.
- 독립 IRIS Beta 0.1.0을 lib/irisRelease.ts에서 관리한다(SANCTUM v2.3·ZIP 빌드 메타데이터와 별개). DesktopTitlebar·다운로드·IrisWelcomeGuide에 같은 버전 표시. 안내 완료 키는 버전+계정, 새 버전마다 브라우저별 재안내이며 다운로드/노트/닫기/바깥/Esc에서 완료한다. 무료 미서명 유지/사용자 실행 선택/보안 프로그램 유지/문제 시 중단·제보 문구는 다운로드 화면에 적용했다.
- 정규 노트 링크 /kerygma?note=iris → 기존 notices 목록의 IRIS 업데이트 노트/생텀 업데이트/SANCTUM 시스템 정확 일치 글 선택. numeric id 이동/닫기는 기존 유지, 미게시/조회 실패는 상태 안내와 /iris/download 링크로 처리하며 추가 조회·정책 변경 없음. docs/IRIS_UPDATE_POST.md 초안을 준비했지만 공개 게시/글 ID는 없다. 실제 배포 확인 뒤 한 글에 최신 버전부터 누적한다.
- /iris/download는 정적 manifest 유효성 검사를 보존한다. 소개/테마 로고/고정 ZIP 링크/실행3단계, 항상 보이는 미서명 경고·길드버스 웹 우회, 네이티브 details의 Runtime/CLI/로그인·정상 종료/확인값 안내로 분리한다. IrisBrandMark는 원본 public/IRIS/logo/IRIS 로고 마크.svg의 accent 마스크만 재사용한다.
- 전역 panel/inner-box/accent/accent-fg/text-main/text-sub·rem을 적용, 768px부터 2열 소개/3열 단계다. 배지/단계 수는 text-main을 상속하며 배경은 accent12%/panel88% 혼합으로 사용자 지정 테마에도 대응한다. 외부 Runtime 안내는 기존 공식 링크/new-tab noopener를 유지한다.
- 공개 ZIP/API/DB/RLS/권한/native·자동 설치/업데이트 계약 변경 없음. 운영 미배포, 새 디자인과 IRIS 버전 안내는 로컬 확인 후 명시적 push 승인 대상이다.

## 2026-10-10 v2.3 IRIS 베타 공식 배포 범위

- 운영확인 후속 — 2026-10-11 02:18 KST: 코드2b9067e/main, dpl_Bk8w2ww62gSTqaXaqLHbkEYV5cVt Production Ready·동일커밋·운영도메인. 실제다운로드/최종ZIP SHA 및 공용party읽기화면·콘솔0 확인, 공개9경로/health/비로그인IRIS차단 통과. 이하 후보 미완료는 이 범위에서 해소, 실제native재시작/다른PC/장시간·버스확인창잔여/운영쓰기·Realtime실수신은 남는다. 후속 문서는 구조 변경 없음, DB/권한/공지0.

- 아래 누적 로컬 IRIS 크로노스/시낙시스/헤더/브랜드/스크롤바/다운로드 구조를 v2.3 공식 후보에 포함한다. 실제 Ready/운영 확인은 후속 기록 전까지 미완료다. `/iris/download`의 Windows x64 미서명 ZIP는 CLI·개인 기록·소스·비밀값 없이 9파일만 포함한다.
- 기존 물물교환 계정 공통 즐겨찾기 변경을 이번 노트에 통합하되 DB 구조/RLS/권한/Realtime 추가 변경 없음. workspace 보호 큐 schema3를 구형 앱으로 역변환하지 않는다. 버스의 일부 기본 대화상자·일반 파티 쓰기 원자성·실제 다른 PC/장시간 검증은 잔여 과제이며 웹 `/party` 우회 안내를 유지한다.

## 2026-10-10 로컬 후보 — IRIS 브랜드 / 베타 다운로드

- DesktopTitlebar → public/IRIS/logo/IRIS 로고 마크.svg 테마색 마스크/제목+창조작. DesktopCenter contextActions → DesktopContextActions 계정·운영홈·설정, page의 기존 상호닫기/잠금 연결. 로그인 전에도 도구가 남는다. desktop.css 좁은 폭의 선택정보/도구 행 전환, API/DB 계약 변경 없음.
- desktop-host.ValidateHomeExternal/desktop-webview user-initiated NewWindow allowlist는 운영홈 루트만 추가, 기존 파티 링크·외부 차단은 유지. AbortUninitializedStartup은 초기화 실패/편집 문서 부재 때만 close 보호를 해제한다.
- desktop-release.cs → production 전용 Windows x64 WinExe/기존 single-instance·DPAPI·큐mutex·트레이. build-beta.ps1 → 원본 PNG의 7크기 ICO/컴파일/SDK3런타임파일·license·notice·readme·hashmanifest/ZIP. -PrepareDownload → public/IRIS/downloads ZIP/metadata·sourceICO. desktop.ps1은 해당ICO를 창/트레이에 적용하고 없으면 기존아이콘 fallback.
- /iris/download는 정적 공개metadata import로 다운로드/확인값/미서명·WebView2·공식CLI·보호대기 안내, /iris에 진입 링크. 서버 런타임 filesystem 의존 없이 빌드에 manifest를 포함한다. 운영배포 전 로컬 후보, 인증/SQL/게임 설치·자동업데이트·코드서명은 추가하지 않는다.

## 2026-10-10 로컬 후보 — IRIS 전체 스크롤바

- desktop.css의 :root:has(.iris-desktop) 문서/자손 규칙으로 문서·모달 포털·미래 overflow까지 테마 scrollbar를 적용한다. WebKit pseudo/.65rem 둥근 rail 및 standard thin/color fallback, forced-colors에서는 native 기본. IRIS 없는 생텀 웹에는 비적용, API/DB/네이티브 변경 없음. tests/iris-scrollbars.browser.mjs는 실제 CSS/합성 IO에서6테마·범위·휠·고대비를 확인한다.

## 2026-10-10 로컬 후보 — IRIS 간격 리듬

- desktop.css: IRIS 범위 control/group 간격 토큰 .4/.7rem을 하위 메뉴·숙제 필터·2열 칸·분류에 적용한다. desktop-synaxis-surface.css: 툴바 grid .6rem, 하단 .9rem, 검색 필터 .45rem으로 조작 묶음을 분리한다. 기존 행/참가 카드 크기·2열·콜백·SVG·API/DB는 변경하지 않는다.
- tests/iris-spacing.browser.mjs와 합성 fixture의 spacing 분기는 실제 React/CSS의 간격·넘침·편집 payload 및 큰 글자 카드 높이의 이전 툴바 대비 보존을 검사한다. 실제 새 UI 사용자 확인/공식 배포는 별도다.

## 2026-10-10 로컬 후보 — IRIS 메뉴 계층 / 스탯 확인창

- DesktopCenter → DesktopIcons의 가방·레이드 마크: 기존 public SVG를 currentColor 마스크로 표시하며 상위 메뉴 전용 실제 문양 크기/중심 보정. desktop.css는 상위 두 메뉴를 채워진 선택 배경·넓은 탭으로 구분하고 하위 기능은 기존 테두리 강조를 유지한다. 기존 마지막 하위 탭 복귀·잠금·새 개설 레드닷 계약은 그대로다.
- DesktopStatsConfirmation → iris-stats-confirm-actions: 네/아니요/취소 한 줄, 취소 오른쪽. 선택 모드는 취소만 오른쪽에 두고 기존 캐릭터/확인 콜백과 모달 초점·Escape·진행 중 방어를 유지한다.
- tests/iris-navigation.browser.mjs는 실제 React/CSS·SVG 렌더 픽셀,6테마 대비/계층,4폭·PC3글자,버튼 배치/초점/콜백/쓰기0을 합성 IO로 확인한다. DB/권한/API/네이티브 정책 변경 없음. 실제 앱 새 UI 확인과 공식 배포는 별도다.

## 2026-10-10 로컬 후보 — IRIS 시낙시스 공용 화면

- 일반 파티 조작 후속(로컬): PartySurfaceContext 선택적 confirm/notify → DesktopSynaxisSurface 내부 확인창·결과 안내, useIrisPartyDialogs 초점/Escape/배경 방어 재사용. usePartyManager 탈퇴 및 PartyCard 관리자 삭제가 사용하며 웹 context=null은 기본 confirm/alert 유지. 탈퇴 승인 후 최신 parties 단일 행 비교로 대기 중 변경/삭제 시 쓰기 없이 재조회한다. 서버 읽기→쓰기 원자성은 기존 일반 파티 API 한계이며 DB/권한 변화 없음.
- IRIS 카드 밀도 후속: PartyCard의 party-member/identity/stats/time/empty-slot 의미 클래스에 범위 CSS만 적용, 닉네임·역할·수치·시간 보존. 별도 참가 시간 수정 API 대신 탈퇴 후 재가입을 제공한다. 기존 버스/매칭/unknown 복구의 나머지 기본 대화상자 경로는 후속 이식 대상이며 이번 전체 대체 완료로 간주하지 않는다.
- app/party/page.tsx → components/party/SynaxisSurface.tsx 공용 추출. 웹 context=null은 기존 동작을 유지하고 app/iris/desktop → DesktopSynaxisSurface → PartySurfaceContext에서 로그인 계정·활성/잠금·쓰기·새 개설 표시를 제공한다. 생성 전용 DesktopSynaxis 초안/기존 보호 큐는 보존한다.
- 공용 usePartyManager·PartyCreateForm·PartyCard·GuildBusCard·가입/콘텐츠/달력/BusCreate/BusEdit 모달·기존 매칭/버스 엔진 재사용. 본인 전체 캐릭터와 크로노스 완료 상태, 운영진 생성 및 운행자 컨트롤러 판정을 유지한다. IRIS는 목록 우선·일반/버스 탭·접는 매칭 리모컨·좁은 카드/모달이며 useIrisPartyDialogs가 포털/중첩 달력 초점과 뒤쪽 조작을 관리한다.
- partySurfacePolicy: 유효 난이도 기본값, 계정별 결과 불명 marker·20초 요청 제한·중복 차단·expectedAccountId. memberMutationClient/guildBusActions/busUtils는 주입된 fetch를 전달한다. sync-checklist는 쿠키 계정과 expectedAccountId가 다르면 쓰기 전에403을 반환한다. 웹은 기존 optional 기본값 유지.
- 공급자 Realtime parties 채널 하나 → 신규 일반/버스 INSERT 중복 없는 dot → 활성 목록200ms 묶음 재조회 / 숨긴 탭 읽기0 → 실제 반영 목록에만 확인 처리. 계정 해제 시 구독 해제; 재연결은 목록 최신화하며 과거 알림 소급 없음. existing publication 재사용, SQL/DB/RLS/권한 변경 없음.
- 상세 설계/계획: docs/superpowers/specs/2026-10-10-iris-synaxis-full-design.md 및 plans/2026-10-10-iris-synaxis-full.md. 실제 게임·운영 시험 쓰기·배포는 미실행이며 아래 v2.21 운영 기록과 구분한다.

## 2026-10-10 v2.21 유지 — 물물교환 즐겨찾기 구조

- 운영 확인 — 2026-10-10 12:55 KST: main 62bd6786b4d792b141159cdcc740d34727b3fe9d, Vercel dpl_PWxBfDz2QPfKUbHmhrYiM7cRfD45 대시보드 Ready/Production/Current·운영 도메인·동일 커밋 확인(27초). 실제 Chrome 한설 /character?char=순월에서 계정 공통 즐겨찾기 정상 안내·저장된 앨빈 별표·기존 브라우저5개 가져오기/본인 확인 전 비활성 버튼·관찰 콘솔 error/warn0 확인. 공개 핵심5경로 GET200·health200 ready true·새 API 비로그인401. 실제 별표 POST/가져오기·IRIS 운영 동시 저장은 미시험, 사용자 조작으로 확인할 것. 버전 상승/공개 공지/추가 SQL 없음. 후속 기록은 구조 변경 없음.

- app/character는 /api/auth/session에서 승인된 본인 계정 UUID를 확인해 TradeList에 전달한다. 표시용 로컬 계정 객체를 인증으로 간주하지 않는다.
- hooks/useBarterFavorites → /api/kronos/barter-favorites → 서버 세션 검증 → public.kronos_barter_favorites. 계정별 별표를 웹/기존 IRIS 로컬 연결이 공유하며 이번 배포는 웹/API만 포함한다.
- TradeList·BarterFavoritesFeedback·barter-favorites.css: 계정 공통 별표, 실패 재조회, 본인 확인 후 구형 브라우저 값 가져오기. 범위 제한 POST·카탈로그 검증·기존 true/false 보존·계정 세대 방어를 사용한다. 교환 횟수와 기존 기능은 그대로다.
- supabase/sql/iris_barter_favorites.sql은 한설이 이미 적용한 테이블의 재실행 가능한 SQL 기록이다. 이번 작업은 운영 DDL/RLS/권한 실행 없음. 버전 v2.21 유지·공개 업데이트는 다음 버전에 통합, 미배포 IRIS/native·시낙시스는 제외한다.

## 2026-10-10 즐겨찾기 DB 준비 완료 — 앱 로컬 미배포

- 한설이 supabase/sql/iris_barter_favorites.sql을 실행하고 전달한 검증 JSON으로 public.kronos_barter_favorites의 PK(account_id,trade_id)·양쪽 CASCADE FK·trade_id 인덱스·RLS/서버 최소 권한을 확인했다. 공개 정책/anon/authenticated 접근은 없다. 아래 준비 SQL 미적용 표기는 이전 경과다.
- 기존 로컬 /api/kronos/barter-favorites → useBarterFavorites → 웹 TradeList / IRIS DesktopBarter 연결을 사용한다. 브라우저의 nexus_pinned_trades는 BarterFavoritesFeedback에서 현재 계정 확인 후 명시적으로 가져오며 원본과 DB true/false 기록을 보존한다. 상점/임무 별표는 기존 kronos_progress.bookmarked를 공유한다.
- 웹 CharacterPage의 별표 계정 UUID는 UUID 없는 nexus_user 표시 프리셋에서 읽지 않고, 페이지 진입 시 기존 /api/auth/session GET으로 닉네임 일치·승인 상태·UUID를 확인한 barterAccountId로 전달한다. 정리 후 늦은 응답은 active/abort로 차단한다. 별표 busy 때만 wait 커서, 인증 미확인 때는 비활성 커서다. 실제 로컬 로그인에서 조회/재조회·버튼 활성 확인, 실제 별표 POST/IRIS 대조는 별도 사용자 확인이다.
- 새 DB 구조 준비와 앱 배포/실저장/동기화 확인을 구분한다. API/UI 운영 배포·실제 가져오기·웹/IRIS 대조는 미완료, 공식 버전은 v2.21 그대로다.

## 2026-10-10 IRIS 상점·임무·시낙시스 생성 — 로컬 미배포

- `lib/irisWorkspace.ts`의 WorkspaceRow/WorkspaceEdit(count|bookmark) → `/api/iris/kronos` optional details.workspace → DesktopWorkspace의 상점/임무 독립 탭. `lib/server/irisWorkspaceWrite.ts` + `/api/iris/workspace`는 서버 세션의 본인 캐릭터, 기간/카탈로그 지문/공용 scope/기준값을 확인하고 기존 kronos_progress 해당 필드만 조건부 update 또는 없는 행 insert(no upsert)한다. 계정 공용과 캐릭터별 진행을 분리하고 즐겨찾기는 초기화 기간과 독립적으로 유지한다.
- desktop Queue/Controller/Transport/Store와 native desktop-store/bridge: schema3 workspace variant, 본인/공용 항목별 coalesce, count9999/bookmark1 상한, DPAPI 보호 대기함·15초·수동 저장·unknown 복구 재사용. 네이티브 workspace capability를 확인한 실행에서만 편집 허용. 기존 큰 저장 횟수는 clamp하지 않는다. 상점/임무 카탈로그 조회 실패가 다른 모듈을 지우거나 대기 변경을 conflict로 확정하지 않게 한다.
- `lib/irisSynaxis.ts` DTO·파서 / `lib/server/irisSynaxis.ts` bounded parallel catalog+own-character 조회 및 authoritative payload / `/api/iris/synaxis` GET·bounded same-origin POST → 기존 `/api/member-mutations` POST에 expectedAccountId 바인딩. 기존 parties 컬럼/역할/엔진을 사용하며 DB 정원4/8 없는 난이도는 생성 불가. 완료 숙제는 UI 열람용, 생성 시 is_completed=false는 버스 회차 상태다.
- DesktopSynaxis의 일반 파티·길드버스·본인 선택·반복·일정·공지·명시 확인. 생성은 자동 저장/보호 대기함 재전송 대상이 아니며 계정별 생성 결과 marker만 localStorage(v1)에 보관한다. unknown 때 자동 반복 금지, 실제 목록 확인 후 해제. 네이티브 NewWindow는 desktop-ready/user initiated/동일 환경의 정확한 `/party`만 OS 기본 브라우저로 열고 iframe/외부/쿼리/fragment popup은 차단한다. 내장 브라우저 navigation·permission·download 제한은 유지한다.
- 모바일/PC 전역 테마·rem·단어 줄바꿈·버튼 nowrap·입력 min-width0, narrow time layout 재배치. 기존 전체 웹 시낙시스 가입·출발·회차 운영은 유지한다. 새로운 폴링/채널/DB 구조·권한 변경 없음. 생성 exact-once/실제 운영 쓰기/hosting 부하·native 실사용은 아직 미검증이며 자동 매칭은 IRIS 생성 단계에 추가하지 않았다.

## 2026-10-10 v2.21 공식 배포 범위

- 운영 반영 확인: 코드89034a5 / Vercel dpl_3weipgZgD3d5AVtrdTFoaXX1ZQao 대시보드 Ready·Production·운영 도메인. 실제 /party v2.21·만료 안내 차단 해소 확인. 기존 공지 경로의 통합 업데이트 ID15·SANCTUM 시스템 작성자 확인(2026-10-10 02:25 KST). 후속 문서 commit은 구조 변경 없음, 아래 로컬 절은 당시 경과다.

- v2.2 길드버스 묶음 이후 만료 안내 담당자 제한 후속. lib/release.ts=v2.21, 구조는 아래 만료 안내 절의 현재 운행자 판정/페이지 수명 닫기 관리만 변경된다. API/DB/RLS/권한/Realtime 추가 변경 없음. IRIS/즐겨찾기 로컬 변경은 이번에도 제외한다.
- 업데이트 공지는 기존 app/api/notices/mutate의 길드마스터 save·생텀 업데이트 카테고리를 사용한다. 작성자 SANCTUM 시스템 강제와 같은 제목 중복 방어가 기존에 구현되어 있다. 새 자동 게시/권한 우회 기능은 만들지 않는다. 배포 후 화면/게시 결과는 HANDOFF·RELEASE_NOTES 최신 절을 따른다.
- staged 후보 전체 Node/독립 tsc/52경로 webpack Production 빌드 exit0, 범위 한정 독립 리뷰 blocking0. 환경 제한으로 실패한 첫 Node 실행과 허용 환경 재검증을 구분해 RELEASE_NOTES에 기록한다.

## 2026-10-10 SYNAXIS 만료 안내 담당자 제한 — 로컬 미배포

- hooks/usePartyManager.checkTimeouts는 길드버스에 공통 isBusOperator(현재 리더 계정/본인 캐릭터+운영진)를 적용한다. 초기 조회가 state 갱신 전 역할을 읽지 않게 timeoutActor ref 사용, 이후 조회에서 대상이 없어지면 안내 제거. 서버 권한과 기존 연장/취소 API는 유지한다.
- /party 만료 안내에 닫기·바깥·기존 Escape 연결, dismissTimeout은 일정/현재 리더 키를 현재 페이지 동안 보관해 같은 안내 재노출을 막는다. 일정이 바뀌면 다시 안내, 페이지 새로고침은 보관을 초기화한다. 일반 파티 만료의 참가 범위/버스 목록/DB 구조 변경 없음. 18 신규 회귀 및 관련86·타입 통과, 공식 버전은 아직v2.2/미배포.

## 2026-10-10 v2.2 배포 범위

- fb9150d origin/main·Vercel GitHub 성공 9FedV9MiUDCvv5JNsPcgP4CnDaVC 이후 운영 party/character/kerygma v2.2와 실제 데이터 확인. 핵심6주소 GET200, 콘솔 오류 없음. MCP 직접 Ready 접근 제한 및 기존 만료 팝업으로 새 모달 운영 열람 제한은 HANDOFF에 남긴다. 이후 아래의 '로컬 미배포' 절 제목은 작업 당시 경과이며 길드버스 묶음은 이번 공식 배포에 포함됐다.

- 공식 버전 lib/release.ts=v2.2. 이번 후보는 아래 SYNAXIS 길드버스 공지 보존·설정 수정·본인 참가 제한·변경/출발 알림·일정순·완료 상태 열람만 배포한다. 구조는 아래 해당 절의 컴포넌트/API/캐시 판정 경로를 따른다.
- IRIS 물물교환/집중 UI·캐릭터 추천/창 정책 후속과 즐겨찾기 서버 연동은 로컬 미배포 상태로 보존한다. 기존 웹 물물교환의 브라우저 즐겨찾기는 유지한다. 즐겨찾기 SQL은 실행하지 않으며 기존 승인 parties Realtime 외 추가 DB 변경 없음.
- 업데이트 노트는 RELEASE_NOTES 및 UPDATE_POST_v2.2.md에 기록한다. staged 후보 Node384통과/3skip·독립 타입·분리 Production 빌드52경로 통과. 공개 공지 자동 게시나 신규 테이블 활성화는 이번 push에 포함하지 않는다. 실제 배포/운영 확인은 HANDOFF 최신 기록을 따른다.

## 2026-10-10 SYNAXIS 길드버스 출발 가능 알림 — 로컬 미배포

- lib/guildBusNotifications.ts의 BusLiveTracker.takeReadyBuses(now,isAdmin)는 guildBusPolicy.eligibleBusCandidates/isBusOperator를 재사용해 현재 모집중 버스의 정원4/8·신청 시간·완료/반복·서로 다른 계정을 판정한다. 계정 필드의 명시적 별칭은 합치며 UUID 혼재 행의 미연결 닉네임/소유 미확인은 제외한다. 관리 권한은 기존 카드와 동일하며 UUID-only 리더 권한을 새로 만들지 않는다.
- hooks/useNoticeNotifications.ts 기존 parties 채널 INSERT/UPDATE/DELETE에서 준비 전이를 소비한다. baseline 로딩 중 최신 행/삭제 tombstone 병합, seed 시 과거 알림 억제, forget 시 삭제 캐시 제거. 새 채널 없이 관리자의 로컬60초 시계만 캐시를 평가하고 cleanup/계정 전환에서 폐기한다. DB 반복 조회·저장·DDL/RLS/publication 변경 없음.
- 기존 알림 정책·알림함·허용된 브라우저 알림을 재사용한다. 메시지는 `길드버스 출발 가능합니다!`, href=/party#guild-bus-ID. 미달→충족 한 번/다음 준비 전이 재알림, 운영중·종료/타 관리자·일반 참가자는 제외. 초기 접속/재연결 당시 이미 충족된 버스는 알리지 않으며 브라우저 절전 시 시계 지연 가능. 자동 출발 기능은 아니다.
- 최종 관련87/87·tsc·새 lib lint 통과, 독립 리뷰의 삭제/계정 중복 및 권한 경계 회귀 수정. 새 알림의 실제 운영 수신은 사용자 확인 대기. 이전 일정 정렬/완료 상태 열람은 한설 정상 확인. 미커밋·미푸시이며 운영 배포 완료로 해석하지 않는다.

## 2026-10-09 SYNAXIS 버스 일정순·캐릭터 레이드/어비스 상태 열람 — 로컬 미배포

- usePartyManager.filteredParties는 길드버스 그룹 안에서 party_date→time_start 오름차순, 동률 created_at 내림차순으로 정렬한다. 기존 지난 일정 필터/일반 파티 정렬 유지.
- components/party/CharacterCompletionStatus.tsx의 이름 버튼·읽기 전용 상태 영역을 JoinPartyModal, GuildBusJoinModal, BusCreateModal에 공유한다. 모달별 열린 캐릭터 키만 로컬 상태로 보관, 기존 myCharacters.raid_checks와 PartyCatalog.contents→matchingUtils.isTaskChecked로 활성 raid/abyss 목록 및 합계를 계산한다. null/빈 체크는 미완료, 누락/손상·기준 로딩/오류는 별도 안내. 일반 가입의 참가 선택은 독립 radio, 버스는 기존 checkbox/반복 설정 보존. PartyModals 및 /party에서 기존 카탈로그를 전달한다.
- 새로운 API·DB 객체·저장·클릭별 조회·Realtime 변경 없음. /party 목록·생성/가입 경로에 적용, 홈 요약 정렬이나 수정 전용 캐릭터 조회 컬럼은 확대하지 않는다. 이전 수정/알림은 한설 실사용 확인 완료, 이번 열람 기능은 실제 크로노스 대조 확인 대기.

## 2026-10-09 SYNAXIS 본인 참가 수정·접속 중 변경 알림 후속

- 아래 이전 전체 참가/개별 시간 편집 설계를 정정한다. BusEditModal.accountNickname→characters.owner 필터, 본인 추가·교체만. BusCreateModal.retainedMembers로 타 계정 참가자/시간을 읽기 전용 표시하고 개별 시간 입력 제거. 서버 saveGuildBusSettings(..., ownNames)는 타인 입력403, 기존 타인 보존/본인 기존 시간 보존/신규 본인만 버스 시간 적용.
- lib/guildBusNotifications.ts BusLiveTracker/describeBusChanges→기존 useNoticeNotifications parties 채널 UPDATE. 최초/재연결 baseline 조회, 공지/컨텐츠/일정/정원/참가 설정 변경만 등록 계정에게 표시, 완료/스탯/정렬 제외. Navbar→현재 account.id/nickname과 소유 이름 판별, 중복·늦은 응답·계정/cleanup·저장소 실패 방어. /party#guild-bus-ID와 GuildBusCard anchor.
- 신규 폴링·채널·영속 알림 테이블 없음. 한설이 별도 승인한 운영 public.parties Realtime publication 활성화만 적용, identity d/RLS/권한/데이터 그대로. SQL 이력 supabase/sql/parties_realtime.sql, 구조 기준서 참조. 코드 미배포/실제2계정 수신 대기.

## 2026-10-09 미배포 SYNAXIS 길드버스 공지 보존·설정 수정

- 공통 `GuildBusCard`의 현재 운행자 컨트롤러에 `버스 수정`을 추가한다. `modals/BusEditModal.tsx`가 동결된 원본 설정과 캐릭터 목록을 읽고 기존 `BusCreateModal`을 편집 모드로 재사용한다. 컨텐츠/난이도·일시·공지·참가자 검색/추가/해제·개별 시간/익일·반복 여부를 수정한다. 배경/Escape/초점·중복 저장 방어와 오류 후 입력 보존, 명시적 최신 조회를 제공한다.
- `/api/member-mutations`의 `_busSettings`는 현재 운행자 운영진 전용이다. `lib/server/guildBusSettings.ts`가 운영 카탈로그의 정원·현재 캐릭터 역할/스탯·소유 계정 UUID와 기존 완료 체크를 검증하고 설정 전체 snapshot을 조건 비교해 기존 parties 행만 갱신한다. `memo/sub_content`를 함께 저장하며 8→4인 축소 때 등록 인원을 자동 삭제하지 않는다. 성공 후 공통 편성 엔진이 새 조건을 적용한다. 현재 회차 완료 확인·명시적 참가 제외 확인, 충돌409/입력 유지 제공.
- `lib/guildBusSettings.ts`는 순수 snapshot·공지 보존·시간 파서, `lib/partyRosterValues.ts`는 browser Supabase 초기화 없이 역할/수치 해석을 공유한다. 생성 모달 컨텐츠/어비스 재적용은 수동 공지를 덮지 않는다. `guildBusPolicy`는 KST 익일 시간 및 당일/익일 참가 구간을 판정한다.
- `guildBusActions.completeBusRound`→`sync-checklist.finishRound`는 baseline 비교 후 숙제를 쓰며 마지막 parties 저장도 전체 조건 CAS다. 구 화면은 새로고침 필요. 여러 캐릭터 체크 쓰기는 여전히 단일 트랜잭션이 아니다. 새 테이블/RPC/RLS/권한 변경 없음, 기존 스키마는 읽기 전용 확인만 했다.
- 관련57/57·합성 브라우저5/5·타입/새 파일 lint·diff check 통과. 실제 운영 수정/배포는 대기, 전체 회귀의 별도 IRIS 집계1건 실패는 BETA_FEEDBACK 참조.

## 2026-10-09 미배포 물물교환 계정 공통 즐겨찾기

- 웹 `app/character/page.tsx`→`TradeList`, IRIS `DesktopBarter`가 `hooks/useBarterFavorites.ts`→`/api/kronos/barter-favorites`를 공유한다. 별표·즐겨찾기 우선 정렬·전용 필터, 진입/창 복귀/다시 조회 제공. 별표는 즉시 원하는 boolean 저장, 기존 횟수와 15초 보호 큐/native는 변경하지 않는다.
- `BarterFavoritesFeedback`/범위 CSS는 저장 상태와 웹의 기존 브라우저 목록을 계정 확인 후 가져오는 경로다. 원본 보존/현재 true·false 비덮어쓰기, 계정 전환 늦은 응답 무시/중복 쓰기 차단/POST 실패 시 GET 확인 전 잠금. 주기 DB 호출 없음.
- 신규 `public.kronos_barter_favorites` 계정/품목 복합 PK·해제 기록·FK/인덱스·RLS·service_role SELECT/INSERT/UPDATE 전용 SQL은 `supabase/sql/iris_barter_favorites.sql`에 준비, **운영 미적용/승인 대기**다. API는 승인 세션·계정 일치·Origin·입력 범위 검증. 기존 상점/임무 progress·초기화·RPC 변경 없음. 실제 확인과 준비 구조는 `docs/SUPABASE_SCHEMA.md`에서 구분한다.
- Node27/화면11/타입·대상 lint 및 좁힌 리뷰 통과. 실제 운영 즐겨찾기 쓰기·배포·native 전체 재검증은 하지 않았다.

## 2026-10-09 미배포 IRIS 물물교환·집중 UI

- 초기 접속 추천 버튼 후속: 변경 추천3버튼용 배치를 초기2버튼에도 적용한 줄바꿈 회귀를 확인하고 `iris-switch-actions-pair` 동등2열과 `네, 선택`/`직접 선택` 문구로 수정했다. 닉네임은 질문에 전체 표시한다. 실제 JSX6폭/글자 조합 RED→GREEN·관련 UI21/21/대상lint 통과, 추천 판정·저장 구조 변화 없음.

- 화면: `DesktopCenter`의 크로노스 하위 물물교환 탭을 활성화하고 `DesktopBarter`와 범위 한정 CSS를 추가했다. 기존 DB 값에 검색/NPC·마을/보상·소모품, 계정당/캐릭당, 일간/주간, 미완료 필터와 횟수 버튼을 제공한다. 상점구매/임무게시판은 아직 비활성이다. 게임 교환 실행 기능은 아니다.
- 데이터 경로: 기존 `/api/iris/kronos` GET에 본인 전체 캐릭터의 `trade_checks`와 `nexus_trades` 카탈로그를 읽는 optional 물물교환 payload/writeContext를 추가한다. 카탈로그 실패는 기존 숙제/클래스 조회를 막지 않는다. `irisBarter`는 기존 `period_version:2`/KST06시 일간·월요일 주간/기존 범위 표기를 검증한다. `irisBarterWrite`와 새 `/api/iris/barter` POST는 승인된 세션·동일 출처·입력 크기·소유권·카탈로그 및 각 사본 기준 fingerprint를 검증한다. 기존 전체 JSON CAS로 관련 없는 항목을 보존하며 저장 후 최신 카탈로그/기간/모든 소유 사본을 다시 확인한다. schema/RLS/RPC/운영 권한 변경 없음.
- 저장 경로: Queue/Controller/Transport/Presentation의 새 `barter` kind는 15초 debounce·즉시 저장·보호 보관을 재사용한다. 계정당 편집은 선택 캐릭터와 별개로 공유하고 마지막 편집 캐릭터를 보존한다. 다중 행 일부 성공/불명확 결과는 unknown으로 멈추며 자동 재전송하지 않는다. 명시적 재시도만 기존 fingerprint 또는 정확히 같은 목표 기록을 허용한다. 감소도 전체 사본에서 확인되어야 saved다. 기존 숙제 Checkboard는 `kind:task`만 투영한다.
- native: `desktop-store.cs`/`desktop-bridge.cs`의 큐 schema3·`store.capabilities`를 웹 저장소와 함께 갱신한다. capability 확인 전 load/replace 금지. 기존 v1/v2를 검증한 후 새 DPAPI 파일을 검증하고 원본을 복구 백업으로 보존한다. 복수 활성 버전 파일/손상 파일은 덮어쓰지 않는다. 게임 bridge 명령이나 OS 창 정책에는 추가 변경이 없다.
- 집중 UI: 새 `DesktopFocusDialog`는 portal/중앙 배치/배경 inert/DOM 초점 제한·복원/Escape/배경 닫기를 제공한다. `DesktopTitlebar` 사람 아이콘→계정 대화상자→기억 계정 직접 선택, 다른 로그인/로그아웃을 연결한다. account/settings/closing 동안 추천을 중지·무효화하여 겹침과 늦은 선택을 방지한다. 변경 추천은 후보당 짧은 음향을 한 번 시도하며 자동 선택·게임 활성 변경·DB 저장은 하지 않는다. `DesktopClasses`와 desktop CSS의 세로 flex chain은 전체 목록에 남은 창 공간, 짧은 계열에 자연 높이를 제공한다.
- 영향 검증: Node129·타입·대상 lint, 격리 실제 페이지 DOM4폭/2테마/15초·수동 물물교환/직접 계정 및 native store/bridge/WebView 통과. 독립 리뷰 중요 문제 없음. 실계정 물물교환/개인 DPAPI/게임 초점·소리는 사용자 새 앱 확인 대기다. 구조는 위 범위만 변경, 운영 DB 구조/버전/배포/공지 없음.

## 2026-10-08 미배포 IRIS 애드온 바·캐릭터 변경 추천

### 후속 애드온 바 후보

- 단일 오래된 스탯 후속(2026-10-09 로컬): `irisCharacterSwitch` 전용 `rankSwitchCandidates`는 기존 동일직업 평균에 양수3개 상대차이 각20% 이내 평균을 병용한다. 모든 후보에 같은 방식으로 순위를 매겨8% 미만 차이면 보류한다. 기존2양수 일반매칭과 새관측2회·네재조회·직업/다중변화 조건은 유지한다. 로그인 `rankStatsCandidates`/`recommendStatsCharacter`, DB/API/native/자동저장/조회 주기는 변경하지 않았다. tracker17/stats8·신규합성DOM3·타입/대상lint 통과, 독립리뷰는 사용량 제한으로 미완료·실게임 확인 대기다.

- 추천 관측 이어받기(2026-10-08 로컬): 계정 key의 `DesktopStatsSession`은 정상 읽기/네 재조회에서 마지막 fresh 양수2개 관측을 메모리 ref로 보관한다. `DesktopCharacterWatch` selected/watchVersion remount는 이 관측으로 `createCharacterSwitchTracker`를 seed한다. seed는60초 신선도/양수2개를 검사하며 확인 횟수로 세지 않는다. 계정 변경/앱 종료 시 보존되지 않고 localStorage/보호 큐/DB에 기록하지 않는다. 기존 새 distinct 관측2회·점수/후보 차이·늦은 응답/version/generation 방어·3초/첫 후보1초 주기 및 API 호출 수는 유지한다. 합성 tracker12/DOM21·tsc/대상 lint 통과, 연속 전환 실게임 재검증 대기.

- 작업표시줄 후속(2026-10-08 로컬): `YieldToTaskbar` 정책과 adapter의 shell read-only probe가 기본/보조 작업표시줄에 양보한다. 물리 monitor/rect/cursor로 자동 숨김 가장자리 접근 또는 실제 노출을 판정하고 자체 topmost를 해제, 숨김 후 기존 게임/IRIS 활성 정책으로 복귀한다. 고정 taskbar는 실제 IRIS와 겹칠 때 양보한다. OS 설정·외부 HWND·입력·계정/저장 계약 변경 없음. native52/52/WebView 통과, 사용자 정상 재실행 후 실화면 확인 대기. 앞선 창 해제/복귀와 계정 전환·다른 로그인·전환 계정 캐릭터 목록은 사용자 확인 완료이며 로그아웃/미저장 보존 개별 실검증은 별도다.

- `IRIS for SANCTUM` 제목줄과 `DesktopTitlebar`/`DesktopAddonSettings`가 창 이동·최소화·종료·테마·게임 창 붙이기를 담당한다. 네이티브 추적기(`desktop-addon-policy.cs`, `desktop-addon.cs`)는 게임을 소유하거나 조작하지 않고 IRIS 위치와 수명 반응만 관리한다. 같은 층 설정은 게임/IRIS 활성 동안만 자체 HWND에 topmost/비활성을 적용하고 다른 앱·숨김·미확인/최소화 게임·종료질문·설정해제·Dispose에서 해제한다. 영구 전역 TopMost·게임 HWND 변경·포커스 강제 이동은 없다. 계정 관리는 설정에서 전환/다른 계정 로그인/로그아웃을 직접 제공하며 성공한 로그아웃 후 로그인 화면으로 돌아간다. 기존 계정별 보호 큐·인증 API 계약은 유지한다(2026-10-08 로컬 후속, 실제 해제/복귀·계정 전환 확인 대기).
- `lib/irisAppearance.ts`와 `useDesktopAppearance`는 환경별 테마 및 계정별 재화 강조를 검증·복원한다. 잔액·조회 시각·재화 이력은 저장하지 않는다. `DesktopCurrencies` 편집은 localStorage만 사용한다.
- 고정 네이티브 브리지에는 `window.addon.state`, `window.addon.preferences`, `window.drag`, `window.minimize`, `window.decision`만 추가했다. 외부 HWND·경로·명령은 브라우저에서 받지 않는다.
- 보호 큐·Supabase 스키마/RLS/권한/API 쓰기 계약은 변경하지 않았다. 실제 창/DPI/게임 종료 수동 확인은 push 후 집 호스트에서 수행한다.

- 최종 속도 후속: Watch는 평소3초, tracker.unconfirmedCandidate의 첫 후보에는1초 뒤 재확인을1회 제공한다. 조회 완료 후 단일timeout, 중복 timestamp/실패 이후3초 복귀·숨김 중timer중단·confirm 종료 후 안전 재개. 두 fresh 관측/이전응답/version 방어·카탈로그 재사용·fallback1회 유지; 주기DB/Vercel호출 추가 없음. 아래10초 구조는 최초 설계이며 이 타이머가 현재 기준이다.

- 제품 기준: 현 IRIS는 게임 옆 컴팩트 애드온 바를 우선 개발하며 공통 데이터/추천/저장 기반으로 오버레이 버전을 별도 확장한다. 완성된 게임 오버레이나 공식 게임 승인으로 안내하지 않는다.
- `lib/irisCharacterSwitch.ts`는 선택별 기준/연속 관측/후보/거절 억제를 관리하는 순수 판정기다. 신선한 서로 다른 관측2회, 양수 겹침2개, 직업 또는 다중 수치 변화, 점수/후보 차이를 요구한다. 판정만으로 선택/쓰기하지 않는다.
- `DesktopCharacterWatch.tsx`는 visible/selected 약10초 native 읽기·중복 방어·최초 기준·숨김/잠금 invalidate를 맡는다. 기존 세션 catalog 재사용, 없으면1회 fallback GET 후 세션에 공개. 네 재조회/일치 후 기존 선택, 아니요 유지/반복 억제, 다른 캐릭터 기존 picker 호출; Escape/바깥 클릭은 아니요와 동일한 닫기다.
- DesktopPage의 동기 watchContext/watchVersion은 선택·계정·종료·스탯 저장 의도 때 먼저 invalidate한다. Watch는 version/generation을 await 이후 검사해 이전 응답이 새 의도를 덮지 못하게 한다. DesktopStatsSession은 계정 catalog와 추천 슬롯, DesktopStats는 수동 읽기/저장 후 catalog 갱신을 공유한다. Center pickerRequest는 기존 선택창만 호출하며 선택/계정 변경 때 초기화한다.
- desktop.css 분류 제목은 테마색 띠/왼쪽 표식/완료 배지, 보이는 분류 사이 얇은 선으로 구분한다. 주기 DB 조회/스탯 POST·DB 구조/RLS/권한·보호 큐/저장 API/native 명령 계약 변경 없음. 실제 게임 변경 추천은 사용자 확인 대기이며 합성/빌드 결과는 HANDOFF를 따른다.

## 2026-10-08 미배포 IRIS 숙제 약칭 체크보드

- 최종 UI: DesktopCheckboard 로컬 분류 선택은 처음 모두 켜진4개 토글이며 section hidden으로 표시만 변경한다. Center가 기존 remaining 필터 상태를 미완료만 체크로 연결한다. 아코디언/외곽 테두리는 제거, 분류 제목·완료 수만 유지. 어비스/레이드는 full canonical clean 이름(구형 displayName도 무시), task만 optional 약칭을 사용한다. 준비 메뉴의 보조3줄 제거·disabled 유지.

- /api/iris/kronos GET은 nexus_tasks.mobile_name 및 nexus_contents.mobile_name/short_name의 기존 컬럼을 읽는다. irisKronos는 원명과 ID/체크 매칭을 보존한 optional displayName을 만들고 irisDesktopTransport는 이를 검증하되 name-only 구형 응답을 유지한다. 신규 DB 컬럼/권한/쓰기 계약은 없다.
- DesktopCheckboard/desktop.css는 체크형2열·횟수형 전체 폭, 분류별 완료항목/전체항목 합계를 제공한다. pending 투영 이후 합계를 계산하며 remaining 필터는 표시만 바꾼다. 보류 행/원명 aria-label과 title/빈 상태를 유지한다. 큐·캐릭터 선택·15초 저장/클래스/스탯 구조 변경 없음.

## 2026-10-08 미배포 IRIS 상단·메뉴 계층

- DesktopCenter는 상위 크로노스/시낙시스/설정과 기억되는 크로노스 하위 숙제/클래스/스탯/재화를 분리한다. 준비 중3개는 비활성 위치 미리보기다. 기존 pane을 유지해 draft/큐를 보존하고 실질 탭 변경만 기존 조회를 호출한다. 시낙시스 연결은 아직 미구현이다.
- desktop.css의 sticky 컨텍스트 헤더는 생텀 선택 닉네임/직업과 선택창을 관리한다. DesktopSaveStatus의 빈 행은 제거하고 확인 시각/15초 설명은 details에 배치; 오류·복구 경고는 계속 노출한다.
- desktop-webview.cs는 네이티브 Label `:: 창 이동`으로 기존 caption 이동을 호출한다. 자동 높이는 손잡이/리사이즈 실제 높이를 합산하며 desktop-grip.tests.ps1은 세션 없는 구성/네이티브 메시지를 검증한다. 웹 메뉴 변경에 API/DB/권한/큐 구조 변경 없음. 기존 실행 native는 정상 재실행 필요.

## 2026-10-08 미배포 IRIS 스탯 수동 연결

- 외부 RAM 연동 제거: desktop/overlay 자동 시작·트레이 메뉴 및 ram-companion/configure/전용 테스트 삭제. 외부 EXE는 IRIS 구성요소가 아니며 기존 로컬 설정도 읽지 않는다. 공식 CLI와 생텀 연결만 유지한다. 이전 RAM 문서는 역사적 기록이다.

- 재화 후속: `DesktopCurrencies.tsx`/`lib/irisCurrencies.ts`, 고정 native `game.currencies.read`→`get_currencies` 읽기 전용. Center6탭/3열2행, 탭 활성 상태로 스탯·재화1회 읽기; 숙제/클래스는 기존 controller.refresh. 초기 추천 관측을 스탯에 재사용하지 않는다. native 읽기는 직렬화/진행 공유, 큐·draft 보존. 스탯 좌 재조회/우 DB업데이트·닉네임강조. DB 구조 변경 없음, 시낙시스 다음 작업 미구현.

- UI 후속: `DesktopStatsSession.tsx`는 계정 로그인 후 후보 추천/4초 지연 건너뛰기/수동 선택 우선을 관리하고 Center에 추천 슬롯·초기 관측을 제공한다. `DesktopStatsConfirmation.tsx`는 수동 업데이트 클릭 시만 나타나는 확인·본인 캐릭터 선택·취소/키보드 초점 경계다. background 조회는 다른 편집을 잠그지 않으며 저장 중에만 전역 잠금한다.
- 클래스 목록은 전체/긴 필터 목록만 내부 스크롤을 제한하고 네 행 이하 계열 목록은 자연 높이를 쓴다. DB/큐/클래스15초 저장/API 구조는 이번 UI 후속에서 바뀌지 않았다.

- `DesktopStats.tsx` → `irisStatsTransport.ts` → `/api/iris/stats` → `server/irisStatsWrite.ts`: 본인 저장값 조회 및 사용자가 확인한 네 개 스탯 수동 CAS 갱신. 계정/캐릭터 keyed remount로 확인/관측 격리, 저장 중 전환·종료 잠금.
- 게임 읽기: `irisDesktopStore.gameStats` → 내장 WebView `HandleAsync` → `DesktopGameStatsReader.ReadAsync` → 고정 공식 CLI get_my_info. 현재 앱 문서/epoch/요청 순서/동시 조회 검증, 제한된 값만 반환. 별도 reader 서버 실행은 필요 없다.
- 상단 생텀/하단 인게임 비교, 직업·수치 후보 안내와 수동 확인, 가운데 ↑버튼. DB는 기존 characters.combat_power/life_energy/magic_resistance/charm만 사용. 새 테이블/권한/보호 큐 형식/클래스 저장 변경 없음. 게임 자동 신원/클래스 읽기·공헌도·시낙시스는 범위 밖이다.

## 2026-10-07 미배포 IRIS 클래스 수동 편집

- UI 후속: `DesktopClasses.tsx` 전용 클래스 탭/계열 필터/숫자·게이지 입력/내부 높이 제한. `DesktopCheckboard.tsx`는 숙제만 표시하며 Center는5기능 탭을 제공한다. 기존65초과 값/미등록/오류·복구 행 보존, 저장/API/DB 구조 변경 없음.

- `lib/irisClassWrite.ts`/`lib/server/irisClassWrite.ts`와 `POST /api/iris/classes`: 요청6필드, 기존 세션 소유자·활성 클래스 검증, `characters.levels` 한 키 병합/전체 원본 CAS. DB 구조/RLS/권한 변화 없음. `/api/iris/kronos` GET의 `writeContext.classes`는 읽기 정규화와 별개로 원본 편집 가능 여부/nullable 기준값을 제공한다.
- `irisDesktopQueue.ts`는 schema2의 `kind:task|class`를 같은 대기·단일 전송·복구 흐름에 넣는다. task는 기간·completed, class는 기간 없이classId/baseLevel/desiredLevel. `desktop-store.cs`는 DPAPIv2와 엄격한v1→v2 검증/암호문 recovery 백업을 소유한다. 기존 큐 문서의 schema1은 이 후보부터 대체되며 구버전 역변환은 없다.
- Controller가 계정/캐릭터/클래스 입력 원문·오류를 소유하고 invalid 캐릭터의 저장·전환을 막는다. Transport는 task의 기존 `/kronos` 계약과 class의 새 `/classes` 계약을 구분한다. Checkboard/Center/Page/SaveStatus는 DB 기본값의 작은 클래스 입력,15초/지금 저장, 오류 되돌리기·캐릭터별 확인 시각을 공유한다.
- 자동 게임 클래스 조회/스탯 저장/시낙시스는 활성화하지 않는다. 실제 계정 수동 확인·DPI/장시간/실충돌 검증 대기, 기존 웹 전체levels 저장의 후속 덮어쓰기 방지는 별도 과제. 로컬 검증 결과는 HANDOFF에 기록하며 push/배포/버전 변경 없음.

운영 확인 — 2026-10-07 14:53 KST:94637ce/GitHub Vercel success(2xTYjZq58ApFTjdvhRbgBez24ga1), 핵심7화면/health200·비로그인 IRIS API401, 실제 브라우저 전용 앱 제한 및 새 인증 안내 배포 자산 확인. 후속 기록 push는 구조 변경 없음·v2.153 유지·DB/권한/공개 공지 변경 없음. 대시보드 Ready 직접 열람과 운영 실로그인 후검증은 별도 미확인.

## 2026-10-07 v2.153 유지 후속 배포 후보

DesktopLogin은 공통 SecretCodeInput의 선택 disabled/required/maxLength props를 사용한다. irisDesktopTransport는 로그인401/403·세션401 안내를 구분한다. desktop.ps1은 Windows PowerShell5 한글 메뉴를 위한 UTF-8 BOM을 유지한다. 아래 램 도구 구조를 이번 후보에 포함하며 DB/권한/숙제 API 구조는 변경하지 않는다. 최종269/269·타입·분리 빌드static50 및 사용자 로그인/숙제/재실행/트레이 검증 완료, 장시간/DPI/실충돌·미지원 스탯/시낙시스 경계는 유지한다. 배포 결과는 HANDOFF 참조.

## 2026-10-07 로컬 IRIS 램 도구 연결

`iris/ram-companion.ps1`은 PC별 로컬 설정/동시 시작 잠금/기존 프로세스 재사용/외부 프로그램 시작과 트레이 설정을 소유한다. `configure-ram-companion.ps1`로 명시 연결, `ram-companion.tests.ps1`로 회귀 검증. desktop/overlay 두 실행기의 트레이에 연결하며 외부 EXE/설정 파일은 Git에 포함하지 않는다. IRIS 종료로 램 도구를 종료하지 않는다. 앱의 게임 조회·숙제 저장·DB·권한 구조는 변경하지 않았다. 버전업·배포 없음.

운영 확인 — 2026-10-06 18:53 KST: v2.153 a99481f / dpl_54HeX3xKBDPYjGDgDR5Gefnxew5p READY/production. 실제 비로그인 핵심7페이지200·desktop 전용 앱 안내/전역 메뉴 숨김·pageerror0, IRIS 조회 API401·홈 v2.153 확인. 수동 로그인/숙제저장·게임/DPI는 미완료. 검증 기록 후속 push는 구조 변경 없음. 공지/DB 구조/RLS/권한/운영 직접 데이터 쓰기 없음.

## v2.153 IRIS 후보 배포 범위 — 2026-10-06 18:47 KST

사용자가 조용한 push를 승인했다. /iris/desktop 작은 인증 센터, Desktop*·irisDesktop* 보호 저장 구조와 선택 Windows 실행기, /api/iris/kronos의 본인 소유·기간·CAS 숙제 저장, /api/iris/characters ID·캐시 차단, 공통 irisKronos 목록 투영을 배포 후보에 포함한다. 운영 DB 구조/RLS/권한 변경은 없다. 기본 구형 실행기를 자동 교체하거나 게임 동작·미지원 스탯 저장·시낙시스 상태를 활성화하지 않는다. 공개 공지 게시 없음. 자동/운영 확인과 수동 게이트는 HANDOFF/RELEASE_NOTES를 따른다.

## 2026-10-06 미배포 컴팩트 IRIS HUD

`components/iris/DesktopCenter.tsx`는 단일 작은 센터/캐릭터 선택/4기능 버튼/6테마를, `irisDesktopPresentation.ts`는 캐릭터별 저장 요약을 담당한다. 체크보드는1열 아코디언과 남은 항목 필터로 전환했다. `iris/desktop-overlay.cs`는 기존 단축키 복구 정책을 재사용해 항상 위·클릭 통과·50~100% 불투명도·작업 영역 제한을 소유한다. desktop-webview/bridge/store에는 허용된 overlay.state/input/opacity 계약만 추가했다. 기존 인증·15초 숙제 큐·보호 schema1·DB 구조/RLS/권한은 유지한다. 실제 게임/DPI 검증 대기, 기본 실행기/운영 배포 변경 없음. 스탯 계약 조사 및 미지원 경계는 `docs/IRIS_STATS_CONTRACT.md`에 기록한다.

## 2026-10-06 미배포 IRIS 데스크톱 후보

`app/iris/desktop/`는 전용 내장 창의 계정·캐릭터·체크보드·저장/복구/종료 화면이다. 전역 웹 헤더는 이 경로에서만 숨겨 큐를 거치지 않는 계정 전환을 막는다. `components/iris/Desktop*`와 `lib/irisDesktop*`가 UI·계정/캐릭터별 큐·same-origin 전송·보호 브리지 클라이언트를 담당한다. 기존 auth/iris API 계약을 재사용하며 DB 구조·권한 변경은 없다.

선택 실행기 `iris/desktop.ps1` 및 native host/store/bridge/lifecycle, 두 실행기 공유 `execution-lock.ps1`을 추가했다. 공식 WebView2 프로젝트 캐시만 사용한다. 기본 실행기 전환·게임 위젯/단축키 통합·실제 저장/유지 검증은 대기며 운영 기능으로 게시하지 않는다.


운영 확인 — 2026-10-05 21:01 KST: v2.152 코드 4d43fd9를 main에 push하고 Vercel dpl_FSt8AvKkjTp3UXyJgnCKmGzbKRsM READY/production 및 운영 도메인 연결을 확인했다. 운영 로그인된 브라우저에서 공지14→목록(/kerygma)→같은14 재열기, 읽은14 알림 숨김, 분야별 설정 5개, 케리그마 끄기 시 빈 목록·숫자 숨김/다시 켜기 시 복원을 확인했다. 설정은 전부 켜짐으로 복원했다. 브라우저 수집 오류·경고0. /·/character·/party·/kerygma·/admin HTTP200·v2.152, /login HTTP200, 인증 헬스200/ready true. 공개 공지 게시·IRIS 배포·DB 구조/RLS/권한 변경 없음. 이 후속 push는 검증 기록만 추가하며 구조 변경 없음. 다른 분야 실제 팝업·계정 전환·전체 모바일 폭 검증은 미완료다.

## v2.152 알림 설정·케리그마 이동 수정 — 2026-10-05 20:55 KST

검증 — 2026-10-05 20:58 KST: 실제 staged 웹 후보만 임시 폴더에 추출해 자동 테스트 55/55, 별도 TypeScript 검사, Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 후보에는 미커밋 IRIS 코드·문서·테스트를 포함하지 않았다. 운영 배포 확인은 다음 기록을 따른다.

- 읽은 알림을 알림함과 숫자에서 숨깁니다. 직접 공지를 열어 읽은 경우도 반영하며 기존 읽음 기록을 보존합니다.
- 알림 설정에서 케리그마·크로노스·아고라·시낙시스·로고스 수신을 개별로 켜고 끕니다. 목록·숫자·브라우저 팝업에 적용합니다. 계정별 현재 브라우저에 저장하며 가입 승인 등 운영 알림은 유지합니다.
- 공지에서 목록으로 돌아온 뒤 같은 글이 열리지 않거나 메뉴 재진입 시 이전 글이 남던 URL·화면 불일치를 수정합니다.
- 구조 변경: notificationPolicy 도우미, 알림 훅·상단 알림 설정 UI, 공지 열림 이벤트와 동기적인 브라우저 이력 갱신. DB 구조·RLS·권한 변경 없음.
- 한설 요청으로 조용히 웹 변경만 배포합니다. IRIS 변경과 공개 공지·업데이트 글 게시는 제외합니다. 기존 미커밋 IRIS 변경과 미확인 릴레이 기록은 보존합니다.
- 로컬: 회귀 테스트 RED→GREEN, 전체 194/194·타입 검사·빌드 통과, 실제 브라우저 공지 재열기·메뉴 복귀·읽음 숨김·설정 토글 확인 및 한설 확인 완료. 배포 후보의 독립 검증과 운영 확인 결과는 후속 기록에 남깁니다.
- 알려진 제한: 설정은 기기 간 동기화되지 않습니다. 실제 다른 분야 팝업·계정 전환·모바일 전체 폭 검증은 별도 대상입니다. 케리그마 기존 ESLint 오류 12개/경고 4개와 알림 훅 기존 오류 1개는 남아 있습니다.
- 직전 정상 기준선: v2.151 e17eb92, Vercel dpl_75bxSt92bsbZuNvCXDhwiqXsTQfD READY/production.


운영 확인 — 2026-10-05 18:23 KST: 코드 9ff2414 main push, Vercel dpl_EaPngNa9nqNzJLUCCjcUiGMmMbFT READY/production 확인. 운영 /·/character·/party·/kerygma·/admin HTTP200 및 HTML v2.151, /login HTTP200, 인증 헬스200/ready true. 기존 로그인된 운영 크로노스에서 캐릭터 정보·월요일 검은 구멍 최대8·3목록 패널색 마스크를 읽기 확인했고 물물교환 더보기9→14개 펼침을 확인했다. 브라우저 수집 오류 로그0. 체크/저장 등 운영 데이터 쓰기·실제06시 시간 전환 테스트는 하지 않았다. docs/UPDATE_POST_v2.151.md는 공개 안내 초안이며 공지 게시 없음. 이 후속 기록 push는 문서만 변경하며 구조 변경 없음.

검증 — 2026-10-05 18:18 KST: 웹 커밋 후보만 별도 폴더로 추출해 node --test 58/58, 별도 TypeScript, 관련 ESLint, 기본 Turbopack Production 빌드(static48), staged diff 검사를 통과했다. 자정 방식으로 되돌린 회귀3건은 모두 실패, 수정 복원 후3/3 통과. 더보기 합성 화면의 밝은/어두운 캡처 및 6테마 배경 계산 확인. 임시 의존성 junction의 첫 빌드 실패는 실제 파일 복사 후 해소했다. 실제 최신 정상 롤백 배포는 a8f7d78 / dpl_89vTuY8joQuZ1jJBsxHnDurb789s(READY/production)다. 운영 로그인 조작/실제06시 경계·공지 게시는 이 검증에 포함되지 않는다.

## 2026-10-05 v2.151 크로노스 웹 핫픽스

- lib/kronos.ts getKronosResetDay는 기존 KST06 일간 기간 시작에서 날짜 key와 weekday를 파생한다. app/character/page.tsx 검은 구멍 최대 횟수와 초기화 안내가 사용한다.
- 검은 구멍은 월06시8·화9·수10·목11·금12·토13·일14, 다음 월05:59까지14다. 저장된 완료 기록은 수정하지 않는다.
- app/globals.css 더보기 디바이더의 배경 마스크는 --panel을 따른다. 공개 버전 lib/release.ts v2.151.
- API/DB/RLS/권한 구조 변경 없음. 배포 및 실제 운영 확인 결과는 RELEASE_NOTES/HANDOFF 후속 기록을 따른다.

## 2026-10-05 크로노스 게임 날짜 경계 수정 — 로컬, 미배포

- lib/kronos.ts getKronosResetDay(now): KST06시 기간 시작으로 게임 날짜 key/weekday 반환. 웹 초기화 안내와 lib/irisKronos.ts 검은 구멍 한도에서 공통 사용. 월06시8→일14, 월 자정에 조기 축소하지 않는다. DB·권한·저장 구조 변경 없음, 기존 완료 기록 보존. BETA-068/D-019 참고.

## 2026-10-04 IRIS 야간 표시/안전 기반 — 로컬 후보, 미배포

- overlay.ps1 단일 센터 그룹 배치 및 위젯별 투명도 대상 선택. overlay-support.cs WidgetDisplayPreferences는 알려진6위젯과40~100 값만 별도 로컬 파일로 저장/복원한다. 전체 적용은 개별 override 초기화.
- lib/irisRelay.ts 수정 동의 응답 유실 시 lease 갱신 중단/연결 폐기, app/iris/page.tsx 재연결 안내. 기존 인증·CAS 저장 경로 유지.
- iris/action-queue.mjs 순수 유한 작업 상태; iris/action-contract.mjs 공식 CLI metadata 기반 요청/결과 판정. executor/API/게임 실행 배선 없음. Supabase 구조·권한 변경 없음. 합성178/178·tsc·lint·빌드 통과, 실제 게임/설정 모달/DB 저장 대기.

## 2026-10-04 IRIS 크로노스 명시 저장 — 최신 로컬 후보, 미배포

- 신규 `lib/irisKronosWrite.ts`(Edit/기간/부분 계산)와 `lib/server/irisKronosWrite.ts`(소유·활성 카탈로그·CAS) 및 `/api/iris/kronos` POST. GET writeContext.periodKeys 추가, 기존 체크 컬럼만 이용한다. owner 없는 대표 쓰기 차단, 통합 legacy 키/구형 반복 모순 보존, 무관 완료가 바뀌면409. DB/RLS/스키마 변경 없음.
- `iris/kronos-edits.mjs` 메모리 큐, native edits/submit/discard 및 browser write-consent/edits/results 경로. 최대200·전송64KiB 경계·세대/계정/선택/동의 검증. `/iris` 별도 수정 허용, `IrisRelay` 항목별 직렬 저장/재조회 성공 확인/유실 재조회만/부분 실패 보존. 읽기 동의로 쓰기를 자동 승인하지 않는다.
- `ConnectionDisplay` typed write 상태와 `CheckboardWindow.ApplyDisplay`, 수정 이벤트·단일 체크·반복 −/+·명시 저장/폐기. `overlay.ps1` stage/submit 연결·전환/종료 폐기 경고. 폴링이 미저장을 덮지 않으며 숨김/× 큐 유지. 강제종료 복구·원자적 일괄 저장 미보장.
- 실제 DB 저장·게임 자동화·시낙시스 상태/센터 카테고리 개편은 미완료. 자동 합성 검증과 사용자 실검증을 구분하며 공개 버전·배포·공지 없음. 아래 과거 절의 읽기 전용 표현은 해당 날짜 당시 상태다.

## 2026-10-04 IRIS 항목별 숙제·클래스 저장값 — 로컬 후보, 미배포

- `/api/iris/kronos`는 기존 소유 검증 뒤 `characters.levels`와 활성 `nexus_classes(id,name)`를 추가로 읽는다. `lib/irisKronos.ts`가 동일 원본 행에서 기존 요약과 4범주 상세/클래스 저장 레벨을 생성한다. 운영 DB·스키마·RLS·쓰기 변경 없음.
- `lib/irisRelay.ts`→`connection-http.mjs`→`connection-state.mjs`는 기존 순차 중계/동의/선택 버전에 상세를 함께 배선한다. `kronos-details.mjs`의 상한/중복/합계 검증, UTF8 JSON64KiB 제한, native `ConnectionDisplay` 재검증 및 만료/전환 시 비우기. 상세 없는 구형 요약은 유지한다.
- 새 `overlay-checkboard.cs/CheckboardWindow`: 센터 상단 숙제/트레이 진입, 일일·주간·어비스·레이드 항목 아코디언, 남은 숙제 필터, 저장 클래스 레벨/null 미등록. 기존 테마·투명도·모듈 수명주기/공유 폴링 사용. 상세 데이터 저장/체크 쓰기/게임 클래스 자동 수집/게임 수령·채집·제작은 없다.
- 실제 새 체크보드 항목 대조/DPI/장시간 확인과 독립 리뷰는 대기. 기능 목표는 `docs/IRIS_AUTOMATION_PARITY.md`의 전체 목록으로 추적한다. 공개 버전/공지/배포 없음.

## 2026-10-03 IRIS 인증 읽기 연결 — 로컬 후보, 미배포

- `/api/iris/characters`는 인증된 본인 캐릭터 ID/계정 구분값을 최소 반환, `/api/iris/kronos` GET은 캐릭터 소유 확인 뒤 완료/총수 4개만 반환한다. `lib/irisKronos.ts`의 한국 요일 숙제 목록을 `/character`와 공유하며 기록 수정/초기화는 하지 않는다. 구형 반복 체크의 기간 경계 모순은503으로 중단하고 BETA-065에 기록했다.
- `/iris`는 명시 동의 뒤 `lib/irisRelay.ts`로 순차 읽기 중계한다. 쿠키는 same-origin API에만, 별도 browser capability는 정확한 loopback에만 사용한다. URL fragment 즉시 제거, 브라우저 저장소 미사용, 지연 응답/계정 전환 거부.
- `overlay.ps1`→`OwnedServer`→`owned-server.mjs` 소유 child stdin pipe bootstrap. native capability는 메모리 전용, legacy/server 직접 실행은 새 권한 비활성이다. 새 `생텀 · 크로노스` 모듈에서 전체 닉네임/수동 확인/읽기 요약과 계정별 마지막 선택 제안, 60초 만료/숨김 응답 폐기. 기존 게임 미션과 구분한다.
- 운영 DB/권한/쓰기/배포 구조 변경 없음. 체크보드 쓰기·게임 자동 조작·음악/미디어는 아직 없다. 실제 로그인/OS 초점/게임 표시 검증 대기.

## 2026-10-02 IRIS Windows 알파 안정화 — 로컬 후보, 미배포

- `iris/overlay.ps1`은 Windows PowerShell/WinForms UI와 트레이 메뉴를 담당한다. 200ms 메시지 타이머가 완료 여부만 소비하며 `overlay-support.cs/SnapshotPoller`는 고정 127.0.0.1:4317의 snapshot을 비동기로 하나씩 읽는다. 성공 뒤 5초, 실패 뒤 5/10/20/30초 대기, HTTP 45초 제한, 숨기기 전 응답 폐기를 적용한다. `reader.mjs`/`server.mjs`는 유지한다.
- `SnapshotDisplay`는 연결/관측 시각과 8개 행을 함께 관리하고 실패·잘못된 JSON·30초 경과 시 비운다. `OverlayPreferences`는 창 위치·접힘만 LocalApplicationData/SanctumIRIS/overlay-settings.json에 원자 저장하며 현재 모니터 작업 영역으로 복귀시킨다. 게임 값/개인 정보/토큰은 저장하지 않는다.
- `overlay-native.cs/OverlayWindow`는 자기 HWND의 입력 통과와 Ctrl+Alt+I/O 등록/해제를 담당한다. 둘 중 하나라도 실패하면 부분 등록 해제/클릭 통과 차단, 트레이에서 표시·조작 복구/종료 가능. 시작은 항상 보이고 클릭 가능하며 저장된 접힘만 복구한다. 키보드 후킹·입력 주입 없음.
- `iris/overlay.test.mjs`가 Windows에서 .NET 컴파일 및 `overlay-support.tests.ps1`의 실제 core/PowerShell 함수 회귀를 실행한다. 전체 73건·타입·빌드·AST 통과, 실제 새 GUI/게임 입력/다중 모니터/DPI 검증은 별도 대기다. D-015·README·HANDOFF를 따른다. 웹 페이지/인증/API/DB/권한 구조와 운영 버전은 변경하지 않았다.

## 2026-10-02 v2.15 공식 배포 범위

- 최종 결과: 코드 1b1b401의 Production/Ready와 로그인된 운영 화면·등록 레이드 난이도를 확인하고, 기존 작성 UI/서버 권한 경로로 업데이트 공지 ID 13(SANCTUM 시스템)을 1회 게시했다. `docs/UPDATE_POST_v2.15.md`는 게시본 보관이다. 후속 결과 문서 push는 구조 변경 없음. 실제 회차/저장 검증 및 과거 기록 복구는 별도 남은 과제다.

- 21:46 KST Vercel 대시보드에서 코드 배포 `CrGH4wg7wJeAfadsg5UJUnLiMFeR`의 Production/Ready/운영 도메인 확인을 완료했다. 공지 게시에는 별도 생텀 길드마스터 서버 세션이 필요하다.

- 코드 `1b1b401`의 Vercel 성공 배포와 운영 HTML v2.15를 확인했다. 공지 초안은 `docs/UPDATE_POST_v2.15.md`이며 세션 만료 후 한설의 운영 재로그인을 기다린다. 이 문서 초안만으로 게시된 것으로 간주하지 않는다. 후속 배포 확인 문서 변경에는 구조 변경이 없다.

- 한설의 공식 push/공지 게시 요청에 따라 아래 10월 1~2일 로컬 시낙시스·크로노스 변경을 v2.15에 통합한다. `lib/release.ts`가 화면 버전 기준이다. 구조는 아래 공통 카탈로그/액션/체크 병합/카드 이름 측정 항목을 따른다. 신규 DB 객체·RLS·SQL 변경은 없다.
- 공지는 기존 `/kerygma/write`→`/api/notices/mutate`의 길드마스터 권한 경로로 게시하며 새 `생텀 업데이트`의 서버 작성자는 `SANCTUM 시스템`이다. 배포 성공 및 운영 화면 확인 뒤 제목별 중복 방어를 사용한다. 실제 결과는 RELEASE_NOTES/HANDOFF에 기록한다. IRIS 내부 시제품은 이번 공개 노트 범위 밖이다.

## 2026-10-02 길드버스 카드·목록 헤더 반응형 — 로컬 수정, 미배포

- 공통 `GuildBusCard`의 본문만 `GuildBusCard.module.css`의 `guild-bus-card` 크기 쿼리 컨테이너가 된다. 실제 카드 폭에 따라 출전자 1/2/4열(20rem/39rem)을 적용한다. 출전자 칸은 클래스/역할/전체 전투력 윗줄과 이름 아랫줄의 2줄이다. `ResponsiveMemberName.tsx`가 실제 전체 이름 폭을 관찰해 들어갈 때 전체 닉네임, 부족하면 저장 애칭 최대 3자 또는 이름 앞 3자를 선택한다. 한설의 후속 승인으로 항상 전체 이름을 줄바꿈하던 이전 동작을 대체한다. 컨트롤러 버튼 전체 줄바꿈, 본인 캐릭터 칩 래핑은 유지한다. 화면 전체 폭으로 중첩 홈 카드를 4열로 강제하지 않는다. fixed 인계/참가 모달은 쿼리 컨테이너 밖에 유지한다.
- `PartyFilterHeader.module.css`가 제목·탭 래핑 및 실제 헤더 폭 기준 검색/필터 행 전환(42rem)을 담당한다. 테마 변수·전역 rem 글자 크기와 기존 콜백을 유지한다. API/DB/권한 구조 변경 없음. 내부 합성 브라우저 검증 도구는 `tests/party-layout-preview.mjs`, 기록은 BETA-061/HANDOFF를 따른다.
- 저장 애칭은 버스 참가 JSON이 아닌 캐릭터 프로필이 기준이다. 홈 `allCharactersList`→`SynaxisPartySection.characterProfiles`와 `/party`의 기존 `allCharactersMap`→`GuildBusCard.characterProfiles`→이름 위젯으로 전달해 두 화면이 같은 현재 애칭을 사용한다. 추가 DB 요청이나 참가 JSON 보정은 없다.

## 2026-10-01 길드버스/크로노스 공통 경로 — 로컬 수정, 미배포

- 홈 `SynaxisPartySection`과 `/party`는 동일 `PartyCard`/`GuildBusCard` 및 필수 `PartyCatalog`를 사용한다. `hooks/usePartyCatalog.ts`가 `nexus_classes`, `nexus_contents`, `content_power_reqs`를 병렬 조회하고 60초 캐시·탭 활성/주기 갱신·중복 요청 방어를 제공한다. 역할은 현재 클래스 설정이 과거 저장 역할보다 우선하며 서포터는 음유시인 전용이다.
- `/party`→`PartyModals`→`ContentSelectModal` 및 `BusCreateModal`의 내부 선택 모달도 같은 필수 카탈로그를 사용한다. `lib/partyContentCatalog.ts`는 기존 `CONTENT_DB`의 ID/이름을 유지하되 선택 가능한 난이도는 DB의 종류+콘텐츠명으로만 구성하며 어비스 다중은 공통 난이도만 허용한다. 난이도별 정격 인원 및 레거시 지옥 공백 조회를 호환한다. 로딩/오류/미등록 시 적용·신청/개설을 방어하며 현재 유효 콘텐츠/난이도를 적용 콜백으로 전달한다. DB 객체·기존 파티 일괄 변경 없음.
- `lib/guildBusPolicy.ts`의 버스 판별·시간 eligibility·운행자 판정을 공통 사용한다. `GuildBusCard`→`lib/guildBusActions.ts`→`/api/member-mutations`의 `_busMemberAction`으로 반복/선택 탈퇴/대기 순서 재구성을 처리한다. 서버는 본인 소유 캐릭터와 현재 운행자 권한을 확인하고 최신 `members` JSON을 조건 비교해 저장한다. 탑승은 모달에 전달된 파티 ID로 최신 행을 읽는다.
- `lib/busUtils.ts`는 콘텐츠 접두사 정규화 후 난이도별 기준을 조회한다. 계정별 후보를 함께 평가하여 4인 각 전투력 등급 1~2명, 8인 압도 3명·권장 2~3명·그 외 2~3명 목표를 적용한다. 부족한 등급은 가능한 후보로 충원하고 중복 계정은 제외한다. `parties.members[].selection_order`는 재구성/회차 이후 우선순위를 보존하는 앱 JSON 메타데이터다.
- `/api/parties/sync-checklist`의 `finishRound`가 실제 출전자 숙제를 콘텐츠 ID로 추가하고 그 멤버만 완료 처리/순서 갱신한다. 길드버스는 현재 운행자 전용이다. 여러 행은 단일 트랜잭션이 아니며 일부 저장 실패를 사용자에게 반환한다. 일반 파티도 동기화 실패를 무시하고 종료하지 않는다.
- `lib/matchingUtils.ts`가 구형 체크 JSON 읽기·완료/해제·기준값 대비 병합을 공유한다. 홈 `_checklistAction`은 해당 항목만, 크로노스 `_checklistBase`는 로드 이후 직접 수정한 항목만 최신 서버 상태에 반영한다. 크로노스 저장 요청은 직렬 처리한다. 새 DB 객체·RLS·운영 SQL 변경 없음. 과거 실제 손실 복구는 별도 승인/백업 과제다.
- 검증/남은 실제 화면 확인은 `docs/HANDOFF.md` 2026-10-01 항목을 따른다. 이번 작업은 한설 지시로 다음 릴리스에 노트를 통합하며 버전·공개 공지는 변경하지 않는다.
- 일반 자동 매칭의 난이도 비교도 `normalizeDifficulty`를 사용해 기존 `지옥 1`과 DB 표준 `지옥1` 신청이 같은 파티 후보에 포함되도록 한다. 기존 파티 저장값을 일괄 수정하지 않는다.

`527c134` main push 후 운영 공개 경로와 비로그인 IRIS API 차단을 1차 확인했다. 이어지는 운영 확인 문서 push에는 구조·DB·권한 변경이 없다.

## 2026-09-28 PC 동반 프로그램 시제품 — 로컬·운영 미배포

- 공식 명칭은 `Sanctum IRIS`, 프로젝트명은 `프로젝트_IRIS`다. 목표·확인된 사실·미확인 과제·단계별 완료 기준은 `docs/PROJECT_IRIS.md`를 따른다. 엠포리온·그노시스 융합은 장기 검토이며 기존 구조는 유지한다.
- `app/companion-preview/page.tsx`는 개발 환경에서만 `/companion-preview`를 열고 운영 빌드에서는 404로 응답한다. `CompanionPreview.tsx`·`preview.module.css`는 게임 위 오버레이 형태, 크로노스 일일·주간 체크, 내 캐릭터 스탯 변경분 확인, 시낙시스 파티 요약·기존 `/party` 진입을 샘플 데이터로 시연한다. 실제 게임·AI 커넥터·운영 DB와 연결하지 않으며 자동 게임 명령도 실행하지 않는다.
- 실연동 후보는 게임에서 허용된 본인 데이터만 로컬에서 확인한 뒤 변경된 값만 계정·캐릭터에 연결해 전송하는 방향이다. 시낙시스 실제 신청은 기존 웹 로그인·권한 경로를 재사용하며 샘플 오버레이에서는 신청을 수행하지 않는다. 운영용 PC 프로그램, 인증, 데이터 저장 구조, 게임 초상화 취득은 아직 설계·승인 전이다.
- 넥슨 AI 커넥터 안내는 내 능력치·미션 조회를 명시하지만 초상화 이미지 제공은 확인되지 않았다. 설치된 AI(아님)커넥터 스크립트에서도 초상화 요청·이미지 필드를 찾지 못했다. 모비라이프의 초상화 표시 방식은 확인되지 않았으므로 동일 경로로 수집 가능하다고 가정하지 않는다.

## 2026-09-28 케리그마 업데이트 글 편집 권한 — 로컬 구현, 운영 미배포

- `app/kerygma/write/page.tsx`와 `/api/notices/mutate`는 부마스터에게 기존 `생텀 업데이트`의 수정만 허용한다. 새 업데이트 발행·일반 글에서 업데이트로 변경·업데이트의 다른 카테고리 변경은 길드마스터 전용으로 유지한다. `생텀 공지사항`도 길드마스터만 저장한다.
- 서버는 기존 공지 카테고리를 조회해 권한을 판정하고 기존 작성자·반응 수는 수정 시 보존한다. DB 스키마·RLS·운영 공지 데이터 변경 없음. 운영 배포와 부마스터 계정 실검증은 남아 있다.

## 2026-09-29 IRIS 로컬 읽기 시제품 (`v2.14` 유지, 비공개 경로)

- 크로노스 `CharacterSelector`의 캐릭터 버튼 목록을 `OwnedCharacterPicker`로 분리했다. 모바일에서 닉네임 3글자 절단을 없애고 전체 이름이 읽히도록 했다. 기존 캐릭터 전환·관리 동작은 그대로다.
- 생텀 `/iris`는 비공개 메뉴 경로의 클라이언트 미리보기다. `/api/iris/characters`는 서버 세션의 승인 계정과 `characters.owner`를 확인해 본인 캐릭터만 읽고, 구형 대표 캐릭터 중 owner가 없는 자기 닉네임 행만 보완한다. 사용자가 캐릭터를 직접 선택·확인하며 새로고침 시 초기화한다.
- 로컬 `iris/server.mjs`는 127.0.0.1:4317 전용이고 허용 Origin·30분 토큰을 만족하는 브라우저에만 `/api/bridge/snapshot` 읽기를 허용한다. 로컬 승인 페이지에서 토큰을 URL fragment로 전달하고 생텀 화면에서 즉시 주소에서 지운다. 승인 후 15초마다 읽으며 연결 해제로 토큰을 폐기한다. 개발 Origin만 허용하므로 운영 사이트에서 이 브리지는 연결되지 않는다.
- `iris/reader.mjs`의 읽기 허용 명령·정규화 계약은 `iris/DATA_CONTRACT.md`, 지원 여부는 `iris/CAPABILITY_AUDIT.md` 참조. 게임 닉네임/초상화·장착 룬·랭킹·길드 공헌도·나이트메어 드릴 층·크로노스 항목별 완료는 확인된 읽기 API에 없다. 어비스·레이드·필드보스는 주간 목표 횟수만 보인다. 게임 자동 조작, SANCTUM DB 쓰기/스키마/권한 변경, 서버 전송, 영구 페어링은 없다.
- `iris/overlay.ps1`은 Windows PowerShell의 작은 항상 위 창으로 로컬 `/api/snapshot`을 5초 간격으로 읽는다. 한설의 일반 PC 환경에서 실제 수치 표시를 확인했다. 게임 전체 화면 위 표시, 설치형 배포, 자동 시작은 아직 검증·구현하지 않았다.

## 2026-09-28 v2.14 크로노스 카드·교환 기간

- `components/character/ProgressiveGrid.tsx`는 기존 즐겨찾기 우선 목록을 반응형 열 수에 따라 첫 3줄, 버튼마다 추가 3줄씩 보인다. `public/svgs/logo/더보기.svg`를 `app/globals.css`의 테마색 마스크·어두운 글자 음영과 함께 카드 경계에 겹친 얇은 디바이더로 사용한다.
- `TradeList`와 `KronosWorkspace`의 물물교환·상점·임무 카드는 왼쪽 강조선, 제목/내용/하단 횟수 조작 영역, 한도 도달 시 초록 테두리·수량 표시를 공유한다. 물물교환도 MAX/MIN을 제공하며 긴 이름은 버튼과 겹치지 않도록 감싼다.
- `app/character/page.tsx`의 교환 횟수는 `lib/kronos.ts`의 한국 시간 06시 일간·주간 시작값과 각 품목의 `period_version: 2`/`period_start`를 비교한다. 구형 기록은 현재 완료로 보지 않되 JSON 원본은 보존한다. 실제 수정한 품목만 기간을 갱신하고 계정당 교환의 기간·횟수·완료자를 함께 동기화한다. DB 테이블·RLS·API 변경 없음.
- `be5d1c2` 운영 제공 확인 뒤 추가한 검증 기록 문서 push에는 구조 변경 없음. 공개 경로와 SVG 제공은 확인했지만 로그인 후 카드 실조작·기간 경계는 후속 확인 사항이다.

## 2026-09-28 v2.13 공지·헤더·크로노스 목록

- `KerygmaReaderView`의 운영진용 `읽은 길드원 목록`은 기존 브라우저별 `sanctum_notice_readers_*` 값 대신 `/api/notices/reads`를 사용하도록 변경했다. 서버는 로그인 세션의 계정 ID로 공지당 최초 읽음 1건만 기록하고, 목록은 길드마스터·부마스터에게만 제공한다. `supabase/migrations/20260928_notice_reads.sql`의 비공개 `notice_reads` 테이블은 한설이 운영 적용했고 RLS·역할별 권한을 읽기 전용으로 검증했다. 적용 전 기기별 읽음 기록은 신뢰할 수 없어 합치지 않는다. 알림함 자체의 읽지 않음 상태는 기존 기기별 localStorage 그대로다.
- `app/layout.tsx`는 페이지 이동 시 상단 스크롤과 헤더 표시를 복원하고, 배너로 고정 헤더 높이가 늘어날 때 사용자가 상단 근처에 있으면 가려진 조작부가 다시 보이도록 맨 위로 정렬한다. `app/kerygma/page.tsx`는 공지 열기·닫기처럼 같은 경로의 쿼리만 바뀔 때도 상단으로 이동한다. DB 영향 없음.
- `components/character/ProgressiveGrid.tsx`는 물물교환·상점·임무의 기존 즐겨찾기 우선 결과를 반응형 1/2/3열에서 6줄씩 노출한다. 검색어가 바뀌면 첫 6줄로 돌아간다. `app/character/page.tsx`의 중복 필터 안내 문장은 제거했다.
- `components/character/KronosWorkspace.tsx`는 상점의 마을·NPC·품목 안정 정렬과 사포/도면 구매 조건 표시를 추가했다. `supabase/migrations/20260928_kronos_weekly_shop_catalog.sql`의 128개 원본 품목은 한설이 운영에 적용했고 기존 앨빈 사포를 건너뛰어 127개가 추가됐다. 사전 1행·사후 128행, 중복 0, RLS/익명 접근 차단을 읽기 전용으로 확인했다. DB 구조·RLS·API 형태 변경 없음.
- `d9e6fe9` 운영 제공 확인 뒤 추가한 배포 기록 문서 push는 코드·DB·구조 변경 없음. 로그인 후 크로노스 6줄/더보기, 다른 기기의 공지 읽음, 캐릭터 저장은 후속 실검증 항목이다.

## 2026-09-27 v2.11 케리그마 화면·업데이트 게시

- `KerygmaCategoryTabs`: 700px 이상에서는 7개 카테고리를 스크롤 없는 단일 행 그리드로 보여 주고, 중간 폭의 긴 라벨을 짧게 표시한다. 운영진용 작성 버튼은 그 아래 줄로 분리한다. 700px 미만은 기존 카테고리 선택 모달을 유지한다.
- `KerygmaHeader`: 전체 소개가 두 줄을 넘을 수 있는 1280px 미만에서는 `(i)` 안내 버튼과 모달로 전환한다. 바깥 클릭·Escape로 닫힌다.
- `/api/notices/mutate`: 새 `생텀 업데이트`는 길드마스터만 등록하며 작성자는 서버에서 `SANCTUM 시스템`으로 기록한다. 동일 제목의 업데이트 글은 중복 등록하지 않는다. DB 스키마·기존 공지 데이터 변경 없음.
- 운영 확인 후속 문서 push는 구조 변경 없음. v2.11 `41a8fe9`의 화면과 `생텀 업데이트` 글 ID 11·시스템 작성자 표시를 확인했다.

## 2026-09-27 관리자 헤더·전역 알림·시낙시스 카드 로컬 수정

- `components/layout/MobileBottomSheet.tsx`와 `app/globals.css`: 모바일 플로팅 메뉴는 `public/svgs/logo/바텀메뉴버튼.svg`를 전역 `--accent` 색 마스크로 표시하고 중앙 내부는 `--panel`로 채운다. 로고 뒤 단일 후광과 닫힌 상태의 드문 두 박자 하트비트를 사용한다. 누르는 동안 로고·중앙 배경이 같이 축소되고 열린 상태는 약간 작은 로고·강한 후광으로 구별한다. 동작 감소 설정에서는 반복 애니메이션을 중지한다. 접근성 이름과 클릭·드래그는 유지한다.
- `components/character/KronosWorkspace.tsx`: 임무 카드의 안쪽 간격을 줄이고 보상 목록과 횟수 조작을 넓은 카드에서는 나란히, 좁은 카드에서는 줄바꿈 배치한다. 보상명·수량과 임무 설명은 말줄임 없이 표시한다. 데이터 구조 변경 없음.
- `components/character/ClassLevelManager.tsx`: 640px 이상 클래스 카드의 첫 줄에 마크·전체 클래스명·레벨 직접 입력, 둘째 줄에 1~65 범위 게이지를 표시한다. 이 구간의 증감/MAX/MIN 버튼은 제거하고 게이지 드래그·키보드 또는 숫자 입력으로 수정한다. 640px 미만의 기존 모바일 버튼은 유지한다. API·DB 구조 변경 없음.

- `app/admin/page.tsx`: 서버 세션 확인으로 관리자 본문이 늦게 나타날 때 이전 스크롤 복원을 맨 위로 되돌려 고정 메뉴가 제목을 가리지 않게 한다.
- `app/layout.tsx`의 `nexus_banners`는 Realtime 변경 이벤트와 열린 탭 30초 재조회로 새 활성 배너를 반영한다. `BannerAdminTab`은 저장 직후 같은 탭의 전역 헤더 갱신 이벤트를 보낸다. `hooks/useNoticeNotifications.ts`의 `notices` 알림도 Realtime과 30초 재조회로 갱신하며, 공지 외 운영 알림을 재조회 시 보존한다. DB publication·스키마·권한은 변경하지 않았다.
- `components/party/PartyCard.tsx`·`PartyCard.module.css`: 파티원 슬롯의 아이콘·닉네임을 상단에 배치한다. 전투력·마도저항은 큰 상태 아이콘과 전체 숫자만 각각 한 줄로, 신청 시간은 시계 아이콘과 시간만 한 줄로 표시한다. 카드 컨테이너 폭에 따라 슬롯을 1·2·4열로 전환해 좁은 목록 열에서 닉네임이 한 글자씩 꺾이거나 시간이 넘치지 않도록 한다. 보조 문구는 화면 판독기용으로 유지한다. 데이터 구조 변경 없음.
- `PantheonRankingSection`의 홈 Top 3 수치는 단위를 제거하고 닉네임과 다른 행에 놓는다. 긴 카테고리 탭명은 한 줄을 유지하되 화면 폭에 비례한 rem 최소·최대 글자 크기로 축소하고 말줄임을 쓰지 않는다. `useNoticeNotifications`는 판테온 이전/현재 Top 3를 비교해 순위별 변경자를 다음 알림부터 표시한다. 홈 `SynaxisPartySection`의 신청 버튼은 `app/page.tsx`에서 `/party?join=ID`로 이동하고 `app/party/page.tsx`가 해당 파티에 대해 공통 `JoinPartyModal`을 연다. 별도 홈 신청 모달과 저장 함수는 제거했다. DB·권한 구조 변경 없음.
- `lib/pantheonNotifications.ts`는 알림용 Top 3 스냅샷과 변동 설명을 만든다. 테크네는 계정별 최고 생활력 캐릭터, 피에타스는 계정별 메인 캐릭터(없으면 최고 공헌도)를 대표로 점수를 산정하되 알림의 순위 식별자는 캐릭터 닉네임이 아닌 계정 소유자다. 심포니아도 계정 단위로 비교한다. `useNoticeNotifications`는 v3 로컬 스냅샷으로 최초 기준값을 세우며 대표 캐릭터만 바뀌었을 때는 알리지 않는다. DB·권한 구조 변경 없음.

## 2026-09-26 케리그마 가이드 링크 핫픽스

- `app/kerygma/page.tsx`는 목록 복귀와 링크 없는 목록 진입에서 카테고리를 `전체`로 초기화한다.
- `components/kerygma/KerygmaReaderView.tsx`는 `Notice.link`가 유효한 http(s) URL일 때 `생텀 가이드 열기` 링크를 새 탭으로 표시한다. 버전·DB·API 구조 변경 없음.

## 2026-09-25 v2.022 시낙시스 권한 핫픽스

- `hooks/usePartyManager.ts`의 길드 버스 생성 전 역할 판정을 `app/api/member-mutations/route.ts`의 운영진 역할(길드마스터·부마스터·부마스터 대행)과 일치시켰다. 세션 없는 클라이언트의 관리자 기본값도 제거했다. API·DB 구조 변경 없음.

## 2026-09-25 v2.021 로고·버전 정렬

- `components/layout/Navbar.tsx`의 로고 오른쪽에 `SANCTUM`, 길드 플랫폼 설명, `BETA v2.021`을 3줄로 배치한다. 중간 폭은 메뉴 가용 공간을 위해 버전만 축약 표시한다. 버전 값은 `lib/release.ts`에서 관리한다. DB·API 구조 변경 없음.

## 2026-09-25 v2.02 베타 메뉴 안내

- 버전 표시는 홈 본문 대신 모든 비로그인 제외 페이지의 `components/layout/Navbar.tsx` 로고 아래에서 `lib/release.ts` 값을 사용한다.
- `types/layout.ts`의 엠포리온·그노시스 메뉴 항목을 `comingSoon`으로 지정했다. PC `Navbar`와 모바일 `MobileBottomSheet`는 링크 대신 `[준비중]` 비활성 항목을 렌더링한다. `/market`·`/gnosis` 라우트 자체와 직접 주소 접근은 유지한다. DB·API 구조 변경 없음.

## 2026-09-25 v2.01 베타 화면 안내

- 홈 `app/page.tsx`는 `lib/release.ts`의 버전을 `SANCTUM BETA` 배지로 표시한다. 공식 버전이 바뀔 때 표시값도 릴리스 노트와 함께 수동 갱신한다.
- `app/market/page.tsx`와 `app/gnosis/page.tsx`는 개발 중 안내를 표시한다. 엠포리온의 시험용 가격은 실시간 정보가 아니고, 그노시스 예시 자료는 확정 공략이 아니다.
- 길드원 안내 원고는 `docs/BETA_MEMBER_GUIDE_DRAFT.md`; 아직 운영 `생텀 가이드` 게시물로 등록되지 않았다. 기존 링크형 분류·작성자 권한 구조는 그대로다. DB·API 구조 변경 없음.

## 2026-09-25 폐쇄 베타 운영 배포 후보

- **02:05 KST 운영 확인 완료:** 앱 코드 포함 `main` 커밋 `08f0f78` Vercel Ready, 운영 헬스·비로그인 API와 한설의 로그인 후 캐릭터 저장·공지/파티·관리자·로고스 화면 확인 통과. 길드원 대상 최대 40명 폐쇄 베타 초대 가능. 기능 동결 상태에서 P0/P1만 우선 대응한다. 시스템 공지 게시 전이며 아래 배포 후보 문구는 배포 직전 기록이다.

- 한설 승인 아래 v1.994/1.994.1 Preview 검증 코드를 운영 `main`에 fast-forward해 v2.0 폐쇄 베타 후보로 준비한다. 이 문서 아래의 "로컬/미배포" 문구는 작성 당시 기록이며, 이번 운영 push 후 Vercel Ready·실화면 확인 전에는 베타 오픈 완료가 아니다.
- 운영 DB의 가입 프로필, 크로노스 4개 테이블/진행 함수, 로고스 비공개 사진과 `inquiries.retention_review_at`은 이미 한설이 적용·읽기 전용 진단을 확인했다. 이번 push에서 SQL을 재실행하거나 기존 글을 삭제하지 않는다. 현재 앱 구조는 `/login`→서버 세션·프로필 가입, `/admin`→권한/카탈로그, `/character`→크로노스 상점/임무/메모, `/support`→1:1 문의·비공개 제보/건의 및 길드마스터 60일 검토다.
- 운영 확인 순서: Vercel Ready→실제 로그인·캐릭터 저장·공지·파티·운영진 접근/일반 회원 차단·로고스 비공개 조회→릴리스 노트 실결과 기록→길드원 초대. 기존 정상 코드 기준선은 v1.993 `db06f7e`; DB는 이미 확장됐으므로 복구 시 추가 컬럼/함수를 임의 삭제하지 않는다.

## 2026-09-24 가입 프로필·로그인 화면 로컬 보완 (미배포)

- 로컬 로그인 실패는 서버 DB 네트워크 연결 문제로 확인됐고, 서버 재시작 뒤 한설이 한글 코드 직접 입력 로그인을 확인했다. 기존/신규 접속 코드는 한글을 영문 키로 변환하지 않는다.
- `components/common/SecretCodeInput.tsx` 안내 문구의 배경 대비와 `app/login/page.tsx` 자물쇠 위치를 보정했다.
- `app/api/auth/register/route.ts`는 좋아하는 것과 월일 생일을 새 서버 등록 함수에 전달한다. `app/api/admin/accounts/route.ts`와 `AccountApprovalTab.tsx`는 길드마스터 재확인 뒤 길드원 프로필을 조회·수정한다. 목록은 계정별 직책·프로필을 독립 카드로 묶고 길드마스터→부마스터→부마스터 대행→길드원 순으로 표시한다. 부마스터·대행 응답에는 접속 코드의 재료인 두 값이 포함되지 않는다. 기존 계정은 프로필을 직접 등록하지 않았다면 미등록이며 접속 코드는 응답에 포함하지 않는다.
- 추가 SQL: `supabase/migrations/20260924_account_profile_registration.sql` (한설이 운영 Success와 읽기 전용 권한 확인 완료). 공개 생일 배너는 구상 단계이며 이번 변경에 포함하지 않는다.

## 2026-09-24 크로노스 확장 — 로컬 구현, 운영 미배포

- `app/login/page.tsx` → `components/common/SecretCodeInput.tsx`: 한글 IME용 text 입력과 CSS 시각적 마스킹, 보기/숨김, 조합 중 Enter 제출 방어. 코드 내용을 변환하지 않으며 가입 후 로그인칸에 자동 삽입하지 않는다.
- `app/admin/page.tsx` → `TradeAdminTab`: 확인된 `nexus_trades` 실제 컬럼 사용. 별도 상점 탭은 `kronos_shop_items`에 골드 구매 카탈로그 등록. 두 카탈로그 모두 확인창을 거친 삭제와 기존 행 수정 지원. `MissionAdminTab`은 `kronos_missions`에 5개 마을·내용·최대 횟수·보상 1~6개 등록/수정/삭제, 모바일에서 보상과 횟수를 분리해 표시.
- `app/api/admin/catalog/route.ts`: 세션 기반 운영진 GET 카탈로그 읽기 추가; 신규 카탈로그 POST 입력 검증. 미적용 테이블은 준비 오류로 표시한다.
- `app/character/page.tsx`: 6개 다중 선택 탭, 선택 없음=전체, 고정 순서. 기존 `ContentChecklist` 진행률 옆 리마인드 진입점. `CharacterSelector` 관리 버튼은 테마 강조색·10초 주기 짧은 톱니 회전(reduced-motion 제외).
- `components/character/KronosWorkspace.tsx` → `/api/kronos`: 상점 검색·횟수·북마크·MAX/MIN(상한 전량 완료/0으로 복귀), 단가×상한 고정 `총합` 골드 안내, 즉시 화면 반영과 연속 조작 묶음 저장. 임무는 마을 탭 없이 전체 표시·마을 이름 검색, 즐겨찾기 우선과 이멘마하→반호르→콜헨→던바튼→티르코네일 순 정렬, 임무 MAX/MIN 지원. 카드의 `임무`/`보상` 이름 시작선을 맞추고 보상 수량은 품목 바로 뒤에 붙이며, 제목 옆에 현재 캐릭터 배지와 `초기화: 매주 월 06시`를 표시한다. 실제 주간 카운터는 한국 시간 월요일 06시에 새 기간으로 계산한다. 임무 내용/소모는 호박색, 보상은 청록색으로 구분하며 라이트 테마에서는 더 짙은 색을 쓴다. 물물교환·상점·임무의 초기화/범위/마을 배지는 공통 규격, 물품 수량은 `× N` 표기다. ☆/★는 모두 카드 제목 왼쪽에 배치해 횟수 조작과 분리한다. 현재 캐릭터의 메모 읽기. 구매 ID와 물물교환 ID를 섞지 않는다.
- `components/character/ReminderWindows.tsx`: 캐릭터별 2개 메모, 제목·본문·색·글꼴·크기, 이동·크기 조절·활성 창 전면 표시. 위치와 미저장 초안은 계정/캐릭터별 localStorage, 저장 버튼은 서버. 다른 숙제를 함께 조작하는 비모달 창으로 바깥 클릭 시 유지, X/Escape로 닫는다.
- `app/api/kronos/route.ts` → `kronos_shop_items`, `kronos_missions`, `kronos_progress`, `kronos_reminders`: 세션·캐릭터 소유 확인. 진행은 `sanctum_kronos_progress`의 원자적 갱신. `supabase/migrations/20260924_kronos_progress_batch.sql`은 한설이 운영 Success를 보고했고, 함수의 ±9999 증감 허용으로 MAX/연속 클릭을 한 요청에 저장한다. 메모는 슬롯별 갱신/삭제. 공개 DB 직접 읽기·쓰기 없음.
- `lib/kronos.ts`: 카탈로그 타입, 5개 마을/모바일 줄임말, 한국 시간 월요일 06시 주간 기준. 자세한 적용 순서는 `docs/KRONOS_MORNING_CHECKLIST.md`.
- `components/layout/MobileBottomSheet.tsx`: 닫힌 메뉴는 transform뿐 아니라 visibility/inert로 숨긴다.

기존 `nexus_purchases`·`nexus_missions`는 컬럼·제약 미확인으로 보존한다. 운영 SQL 적용과 실제 로그인/개인 기록 저장 확인 후 배포를 결정한다.

> **문서 기준일:** 2026-09-23 (KST)
>
> **문서 성격:** Git push 때마다 실제 구조·운영 규약을 갱신하는 살아있는 기준 문서
>
> **프로젝트:** `seongyeok-guild-manager`
>
> **서비스:** 마비노기 모바일 데이안 서버 「성역」 길드 전용 플랫폼
>
> **운영 책임자:** 한설
>
> **현재 단계:** 폐쇄 베타 출시 준비 — 길드원 최대 40명

---

## 1. 서비스 목적과 출시 원칙

SANCTUM은 성역 길드원이 캐릭터·숙제·파티·공지·길드 운영 정보를 한 곳에서 관리하는 웹 플랫폼이다. 외부 공개 서비스가 아닌 길드 전용 폐쇄형 서비스이며, 베타는 소수의 테스터가 실제 길드 활동에서 사용하며 오류를 찾는 것을 목적으로 한다.

### 베타에 포함하는 기능

- 길드원 가입 신청, 운영진 승인, 역할 표시
- CHRONOS 캐릭터·스탯·일일/주간/레이드 체크
- KERYGMA 공지, 투표, 댓글
- AGORA 길드원 현황 및 랭킹
- SYNAXIS 파티 모집, 일정 조율, 길드 버스
- 관리자 컨텐츠·클래스·교환·임무·배너 관리
- 사이트 내부 알림함과 읽지 않음 표시

### 알림 서비스 현황과 확장 명세

**현재 적용됨 — 1차:** KERYGMA `notices`의 새 공지를 사이트 내 알림함·빨간 읽지 않음 수로 표시한다. 사용자가 브라우저 권한을 허용했을 때, **SANCTUM 탭이 열려 있는 동안** 운영체제 브라우저 알림도 표시한다. 읽음 상태는 현재 기기별 `localStorage` 기준이다.

**아직 미적용 — 이후 알림 종류:**

1. CHRONOS: 일일/주간 숙제 초기화, 주간 숙제 미완료 임박
2. AGORA: 판테온 1·2·3위 순위 변동
3. EMPORION: 사용자가 북마크한 아이템이 설정 가격 이하로 하락
4. SYNAXIS: 내 파티 매칭 완료, 길드 버스 신규 생성
5. GNOSIS: 사용자가 구독/북마크한 분류의 새 게시물
6. 운영진: 신규 가입 신청 및 승인 대기

**공통 기반이 먼저 필요하다:** 공지 전용 `notices`와 별도로 대상 사용자·종류·원본 링크·발생 시각·읽음 시각을 저장하는 범용 `notifications`/`notification_reads` 구조, 사용자별 알림 설정, 중복 방지 키, 서버에서 이벤트를 만드는 작업이 필요하다. 숙제·가격·순위처럼 시간 또는 외부 데이터에 의존하는 알림은 Vercel Cron 또는 Supabase Edge Function/스케줄러를 사용한다.

**종료 후 모바일 알림:** 현재는 불가능하다. Service Worker·PWA manifest·Push 구독 저장소·VAPID 비밀키·서버 Push 발송을 갖춘 Web Push 2차를 구현해야 한다. Android는 지원 브라우저에서, iPhone/iPad는 홈 화면에 추가한 웹 앱에서 권한을 허용하는 방식으로 제공한다.

### 정식 오픈 이후 고도화하는 기능

- GNOSIS: 라이브러리, 특화 에디터, 클래스별 공략, 룬/펫/세팅 데이터
- EMPORION: 모비라이프 실거래 API, 즐겨찾기 가격 알림, 제작 대 구매 계산기
- LOGOS: 문의 운영 경험을 반영한 고도화
- 브라우저/모바일 푸시, 문서 기반 Q&A 챗봇

### 출시 판단 기준

베타는 완벽한 정식 서비스가 아니라, 길드원이 안전하게 로그인하고 핵심 길드 활동을 수행할 수 있는 검증 버전이다. 신규 기능보다 기존 기능의 오류 수정, 권한 보호, 모바일 사용성, 백업 가능성이 우선이다.

---

## 2. 운영·권한 원칙

| 역할 | 대상 | 기본 운영 범위 |
| --- | --- | --- |
| 길드마스터 | 한설 | 전체 설정, 권한 위임, 최종 운영·백업 판단 |
| 부마스터 | 신파랑, 제스, 수도사는수도사 | 가입 승인 및 지정된 길드 운영 기능 |
| 부마스터 대행 | 향후 지정 | 길드마스터가 정한 제한적 운영 권한 |
| 길드원 | 그 외 모든 사용자 | 본인 캐릭터·숙제·파티·글 작성 |

- 서비스는 길드원만 사용한다.
- 계정 복구는 개인정보를 수집하지 않고, 운영진이 입장 코드를 재발급하는 방식으로 한다.
- 탈퇴·추방 시 계정, 캐릭터, 파티 관련 데이터는 삭제한다.
- GNOSIS 게시물은 남기되 작성자 표기는 `탈퇴한 길드원`으로 익명화하는 것을 원칙으로 한다.
- 게임 닉네임, 캐릭터 직업, 전투력, 길드 활동 정보는 길드 내부에 공개한다.

---

## 3. 기술 스택과 실제 구조

### 기술 스택

- **Framework:** Next.js 16 App Router
- **Language:** TypeScript / React 19
- **Styling:** Tailwind CSS v4 + `app/globals.css` CSS 변수 테마
- **Database:** Supabase Postgres + Realtime
- **Server routes:** Next.js Route Handlers
- **Deployment:** Vercel
- **외부 연동:** 모비라이프 API, Gemini 아이템 이미지 분석 API

### 주요 디렉터리

```text
app/
  admin/              관리자 제어 센터와 탭 컴포넌트
  api/                분석·이벤트·거래소·동기화 Route Handlers
  character/          CHRONOS
  customize/          테마·스티커 설정
  gnosis/             GNOSIS
  kerygma/            KERYGMA
  lounge/             AGORA
  login/              길드원 로그인·가입 신청
  market/             EMPORION
  party/              SYNAXIS
  support/            LOGOS
  layout.tsx          전역 계정/테마/네비게이션/스티커 레이아웃
components/
  character/ common/ layout/ party/ sanctum/ kerygma/
hooks/
  usePartyManager.ts  파티·길드 버스 상태와 DB 연동
lib/
  busUtils.ts, matchingUtils.ts, partyDateUtils.ts, supabase.ts
public/
  svgs/classes/       21개 직업 SVG
  svgs/UI mark/       UI·메뉴 마크
  items_catalog.json  엠포리온 아이템 카탈로그
```

### 페이지·라우트 상세 지도

| URL / 파일 | 역할 | 주요 연결 |
| --- | --- | --- |
| `/` · `app/page.tsx` | SANCTUM 홈 대시보드. 숙제, 심연 제보, 파티 요약과 헤더 위젯을 조합한다. | `characters`, `nexus_tasks`, `nexus_contents`, `parties`, `deep_holes`, `abyss_reports`; `components/sanctum/*` |
| `/login` · `app/login/page.tsx` | 닉네임·입장 코드 로그인, 가입 신청·승인대기 처리, 최초 캐릭터 생성 흐름. | `/api/auth/login`, `/api/auth/register`, HttpOnly 세션 쿠키, 브라우저 표시 설정 |
| `/account/settings` · `app/account/settings/page.tsx` | 계정 드롭다운에서 들어가는 개인 설정. 현재 접속 코드를 확인한 뒤 새 코드로 변경하고 재로그인한다. | `/api/auth/session`, `/api/auth/change-code`, `accounts`, `sanctum_sessions` |
| `/character` · `app/character/page.tsx` | CHRONOS. 캐릭터 선택/편집, 숙제·교환·구매 체크, 대표 캐릭터와 기여도 관리. | `characters`, `nexus_classes`, `nexus_tasks`, `nexus_contents`, `nexus_trades`, `nexus_purchases`; `components/character/*` |
| `/character/detail` · `app/character/detail/page.tsx` | 특정 캐릭터 상세 조회 화면. | `characters` |
| `/kerygma` · `app/kerygma/page.tsx` | 공지 목록·상세, 고정/삭제, 투표·댓글 관련 화면, 공지 Realtime 구독. | `notices`, `accounts`, `characters`; `components/kerygma/*` |
| `/kerygma/write` · `app/kerygma/write/page.tsx` | 공지 작성·수정 에디터. | `notices`, `KerygmaEditorToolbar`, `KerygmaPollModal` |
| `/party` · `app/party/page.tsx` | SYNAXIS 파티와 길드 버스 화면의 진입점. | `hooks/usePartyManager.ts`, `components/party/*`, `nexus_classes` |
| `/lounge` · `app/lounge/page.tsx` | AGORA 컨테이너. ASTRA 길드원 현황과 PANTHEON 랭킹을 전환한다. | `AstraView`, `PantheonView` |

| `/market` · `app/market/page.tsx` | EMPORION 검색·카탈로그·가격 비교 UI. | `public/items_catalog.json`, `/api/market`; 현재 화면 가격 시뮬레이션 존재 |
| `/gnosis` · `app/gnosis/page.tsx` | GNOSIS 가이드 목록·필터·카드 UI. | `nexus_classes`, `app/gnosis/[id]`, `app/gnosis/write` |
| `/gnosis/[id]` | GNOSIS 개별 글 상세. | 라우트 파라미터 `id` |
| `/gnosis/write` | GNOSIS 작성 화면. | `nexus_classes` |
| `/support` · `app/support/page.tsx` | LOGOS 1:1 문의·생텀 버그 제보·건의사항의 탭/작성/조회/길드마스터 답변. `?tab=bug|idea`로 새로고침 후 선택 탭 유지. 제보 사진 붙여넣기·WebP 축소 미리보기. 2026-09-25 로컬 후속: 제보·건의의 60일 검토 안내와 길드마스터의 글별 삭제/60일 보류 UI. | `inquiries`, 비공개 `logos-reports` Storage |
| `/customize` · `app/customize/page.tsx` | 테마·스티커 개인화 화면. | `ThemeModal`, `StickerCanvas`, 브라우저 저장소 |
| `/admin` · `app/admin/page.tsx` | 관리자 탭 허브. 가입 승인, 배너, 클래스, 컨텐츠, 교환, 임무, GNOSIS 관리. PC 글자 단계에 따른 관리자 전용 밀도 조정. | `/api/auth/session`으로 진입 역할 확인, `app/admin/components/*`, `app/admin/admin.css`; 다른 관리자 테이블 직접 쓰기는 후속 보안 과제 |

아스트라의 파티 배지는 `lib/activeParty.ts`에서 KST 날짜와 시작·종료 시각을 확인한다. 지난 파티는 참가자로 표시하지 않는다. `lib/approvedCharacters.ts`는 승인 계정 디렉터리와 캐릭터 소유자를 대조하며 아스트라·판테온·홈 요약·판테온 알림에 적용된다. 조회 실패 시 오래된 길드원 데이터를 그대로 노출하지 않는다. 추방 계정의 기존 캐릭터/파티 레코드는 보존하며, 정리는 별도 운영 승인 과제다.

v2.12 운영 확인: 홈 버전 표시·개인 설정 입력 화면·아스트라 승인 계정/캐릭터 목록과 지난 파티 배지 제거를 확인했다. 이 확인 기록은 구조 변경이 아니다. 접속 코드의 실변경과 기존 레코드 정리는 수행하지 않았다.

캐릭터 관리 상세의 숙제 체크는 500ms 디바운스 뒤 서버 세션 경로로 자동 저장된다. 변경되지 않은 대표·기여도·계정 공통 교환 정보는 별도 서버 요청으로 다시 쓰지 않는다. 기존 캐릭터의 일반 저장은 `nickname`과 로그인 계정 `owner`를 동시에 조건으로 건 단일 수정 요청이며, 새 캐릭터는 기존 등록 경로를 사용한다. `app/character/page.tsx`의 저장 상태 알림은 홈 체크보드의 상태 표시와 별개다. v1.991부터 `document.body` 포털의 작은 반투명 플로팅 알림만 잠깐 표시한다. 완료 표시 뒤 새로고침해야 한다.

### 서버 API 상세 지도

| Route Handler | 현재 목적 | 관련 데이터/외부 연동 | 운영 유의점 |
| --- | --- | --- | --- |
| `/api/market` | 모비라이프 거래소 요청을 중계한다. | 모비라이프 API | 키 노출, 캐시, 호출 제한, 실제 가격 표기 여부를 정식 오픈 전에 정비 |
| `/api/analyze-item` | Gemini 기반 아이템 이미지 분석 요청. | Gemini API | API 키는 서버 환경변수만 사용 |
| `/api/game-events` | 게임 이벤트 데이터 제공. | `server_events` | 데이터 갱신 주기 확인 필요 |
| `/api/guild-characters` | 길드 캐릭터 이름 목록 제공. | `characters` | 공개 범위·호출 권한 점검 필요 |
| `/api/sync-client` | 캐릭터 동기화/보정 처리. 관리자 세션 또는 운영진 닉네임·접속 코드 재확인 후 실행한다. | `characters`, Tampermonkey v8.3 | 기존 무인증 호출 차단, 스크립트 갱신 필요. 중복 호출과 동시 수정 방어 후속 과제 |
| `/api/sync-weekly` | 주간 교환/체크 상태 동기화. 관리자 세션 또는 운영진 코드 재확인 후 실행한다. | `nexus_trades`, `characters` | 기존 무인증 호출 차단. 주간 초기화 기준과 대상 범위 확인 필요 |
| `/api/auth/login`, `/api/auth/register`, `/api/auth/session`, `/api/auth/logout`, `/api/auth/switch` | 서버 로그인·가입·세션 확인·종료·저장 계정 전환. | `accounts`, `sanctum_sessions`, `sanctum_login_attempts`, `characters` | 서버 전용 키 사용; Preview 실제 로그인 검증 전 |
| `/api/auth/change-code` | 현재 코드·세션·요청 출처를 검증하고 새 코드를 저장한다. 기존 모든 세션은 변경 전에 무효화한다. | `accounts.code`와 기존 해시 트리거, `sanctum_sessions`, 로그인 시도 제한 RPC | 운영 계정의 실제 변경은 미검증; 새 코드 로그인과 다른 기기 로그아웃을 전용 테스트 계정으로 확인 필요 |
| `/api/auth/health` | 서버 키와 인증 DB 객체 연결 점검. | 인증 함수·세션·시도 제한 테이블 | 응답에 계정·키를 담지 않음 |
| `/api/admin/accounts`, `/api/admin/pending`, `/api/accounts/directory` | 운영진 가입 승인·대기 알림·길드원 표시 정보. | `accounts`, 서버 세션 | 계정 목록은 비밀 코드를 반환하지 않음 |
| `/api/admin/catalog` | 운영진 카탈로그 8개 테이블의 서버 저장·수정·삭제. | `nexus_*`, `content_power_reqs`, `gnosis_guides` | 운영진 세션·요청 출처 검사. Phase C 적용 전 Preview 쓰기 확인 |
| `/api/notices/mutate` | 공지 저장·고정·삭제와 로그인 이용자 투표·댓글. | `notices` | 작성 권한과 댓글 작성자 확인. Phase C 적용 전 검증 |
| `/api/reports` | 로그인 이용자의 심층/어비스 제보. | `deep_holes`, `abyss_reports` | 제보자 이름은 세션에서 설정 |
| `/api/member-mutations` | 본인 캐릭터, 참여 파티, 문의의 서버 저장·수정·삭제. 기존 캐릭터의 닉네임 기준 수정은 소유자 조건을 같은 DB 요청에 적용. | `characters`, `parties`, `inquiries` | 세션·소유자/참여자·운영진 권한 확인. Phase D 적용 후에도 서버 경로 유지 |
| `/api/parties/sync-checklist` | 파티 완료 시 참여 캐릭터 숙제 체크 동기화. | `parties`, `characters` | 파티 참가자/운영진만 요청 가능 |
| `/api/inquiries` | 본인 문의 또는 운영진 문의 목록·대기 건수. 새 제보·건의의 타인 기록은 길드마스터만 조회. | `inquiries` | 비로그인·타인 제보 조회 차단. Phase D에서 공개 SELECT 제거 |
| `/api/inquiries/reports`, `/api/inquiries/attachments` | 새 제보·건의의 글/사진 저장, 작성자·길드마스터의 비공개 사진 URL 조회. | `inquiries.attachment_paths`, `inquiries.reporter_account_id`, 비공개 `logos-reports` Storage | SQL·읽기 전용 진단 확인. Preview 역할별 검증 전 배포 금지. 계정 ID 권한 확인·용량·형식 검사; 사진 URL 5분 유효 |
| `/api/inquiries/retention` | 2026-09-25 로컬 후속: 길드마스터 전용 만기 제보 목록·60일 보류·글/첨부 삭제. 상단 알림함은 사이트가 열려 있을 때 만기 항목을 조회한다. | `inquiries.retention_review_at`, `logos-reports` Storage | 신규 SQL `20260925_logos_retention_review.sql` 운영 적용·읽기 전용 진단 통과, 앱 미배포. 자동 삭제·종료 상태 푸시 없음. 1:1 문의 제외 |

### 전역 레이아웃·상태 흐름

```text
app/layout.tsx
  ├─ 전역 CSS / 폰트 / 메타데이터
  ├─ 현재 사용자·테마·배너·운영 문의 수 조회
  ├─ Navbar.tsx
  │    └─ 브랜드 락업, 데스크톱 메뉴, 우측 도구(정령의 날개·테마·알림함·계정) 표시
  ├─ SpiritWingsMenu.tsx
  │    └─ 우측 도구 영역의 게임 관련 외부 빠른 이동 메뉴
  ├─ MobileBottomSheet.tsx
  │    └─ 모바일 및 좁은 노트북 폭(<xl)의 네비게이션·보조 조작
  ├─ ThemeModal.tsx
  │    └─ CSS 변수 기반 6개 테마 선택
  └─ StickerCanvas.tsx
       └─ 일반 UI와 분리된 최상위 장식 레이어
```

- v1.96 Preview 후보는 서버 전용 로그인·가입 API와 HttpOnly 세션 쿠키를 사용한다. 운영 DB Phase A가 적용됐고 계정 13개의 해시 및 새 객체를 읽기 전용으로 확인했다. Production 배포·실로그인 검증·계정 공개 권한 차단 Phase B는 아직 완료되지 않았다. 다른 관리자 테이블의 브라우저 직접 쓰기도 후속 보안 과제다.
- 파티 상태는 `usePartyManager.ts`에 집중되어 있으며 `parties` Realtime 채널(`realtime-parties-sync`)을 구독한다. 파티 생성, 참여, 수정, 종료·삭제, 길드 버스 흐름을 이 훅과 모달 컴포넌트가 나눠 맡는다.
- `lib/supabase.ts`는 브라우저 측 Supabase 클라이언트의 공통 진입점이다. 서버 전용 키가 필요한 로직은 Route Handler로 분리한다.
- `hooks/useNoticeNotifications.ts`는 로그인한 계정별로 KERYGMA `notices`를 읽고 새 공지를 Realtime으로 감지한다. 읽음 상태는 현재 해당 브라우저의 `localStorage`에만 저장한다.
- `components/layout/NotificationInbox.tsx`는 Navbar에서 열리는 알림함이다. 알림 권한은 사용자가 버튼을 눌렀을 때만 요청하며, 허용된 경우 SANCTUM을 열어 둔 동안 새 공지를 운영체제 브라우저 알림으로 표시한다. 날개·알림·계정 드롭다운은 하나씩만 열리고, 작은 화면에서는 최대 높이 안에서 내용만 스크롤하며 긴 제목을 숨기지 않는다. `ThemeModal.tsx`는 배경 클릭·Escape로 닫히고 열려 있는 동안 배경 스크롤과 키보드 초점 이탈을 막는다.

### 컴포넌트 책임 상세 지도

| 구역 | 파일군 | 책임 |
| --- | --- | --- |
| 공통 아이콘 | `components/common/ClassIcon.tsx`, `MarkIcon.tsx` | 직업 SVG 마스크/등급 오라, UI 마크 선택과 테마 대응 |
| CHRONOS | `CharacterSelector`, `CharacterManageModal`, `CharacterStats`, `ClassLevelManager`, `ContentChecklist`, `TradeList` | 캐릭터 선택·등록·수정, 스탯, 직업/레벨, 숙제와 교환 체크 |
| KERYGMA | `KerygmaHeader`, `CategoryTabs`, `TableList`, `ReaderView`, `EditorToolbar`, `PollModal`, `TableContextMenu` | 공지 탐색·읽기·작성·투표와 운영 메뉴 |
| SYNAXIS | `PartyCard`, `PartyCreateForm`, `PartyFilterHeader`, `PartyModals`, `GuildBusCard`, `GuildBusJoinModal`, `GuildBusAccountDetailModal`, `CustomTimePicker`, `components/party/modals/*` | 파티 카드/필터/생성/참여/시간 조율, 길드 버스, 역할 조합과 세부 팝업 |
| 홈 | `SanctumHeaderWidgets`, `KronosCheckboardSection`, `PantheonRankingSection`, `SynaxisPartySection`, `SanctumModals` | 홈의 요약 위젯, 숙제/랭킹/파티 섹션과 홈 모달 |
| AGORA | `AstraView`, `PantheonView` | 길드원 현황·온라인 presence, 랭킹/직업 데이터 시각화 |
| 관리자 | `AccountApprovalTab`, `BannerAdminTab`, `ClassAdminTab`, `ContentAdminTab`, `TradeAdminTab`, `TaskAdminTab`, `MissionAdminTab`, `GnosisAdminTab` | 운영 데이터별 CRUD와 승인 처리 |
| 공통 로직 | `usePartyManager`, `usePressAndHold`, `busUtils`, `matchingUtils`, `partyDateUtils`, `imageUtils` | 파티 상태/길게 누르기/버스 배정/매칭/날짜/이미지 처리 |
| 알림 | `useNoticeNotifications`, `NotificationInbox` | 공지 Realtime 감지, 계정별 읽음 상태, 상단 알림함, 사용자 선택형 브라우저 알림 |

홈의 테크네 Top 3는 AGORA 판테온과 동일하게 계정(`owner`)별 최고 생활력 캐릭터 한 명만 선발한다. 모바일 요약 위젯은 작은 마크를 왼쪽, 이름·수치를 오른쪽에 놓는다. 길드·도감 마크의 과도한 원본 `viewBox` 여백만 `MarkIcon.maskZoom`으로 해당 화면 안에서 보정하며 다른 화면의 원본 SVG와 배율에는 영향을 주지 않는다.

### 데이터 호출 실제 지도

| 테이블 | 코드에서 확인된 사용 영역 | 주요 동작 |
| --- | --- | --- |
| `accounts` | 로그인, 전역 레이아웃, KERYGMA, 길드 버스, 관리자 승인 | 로그인/가입 승인/역할/계정 삭제 |
| `characters` | 홈, CHRONOS, 상세, KERYGMA, AGORA, 파티/버스, API | 조회·등록·수정·대표 지정·삭제·랭킹/숙제 데이터 |
| `parties` | 홈, SYNAXIS 훅, AGORA, 길드 버스 | 생성·참여·수정·삭제·Realtime |
| `notices` | KERYGMA 목록/작성/수정 | 공지 CRUD·Realtime |
| `inquiries` | LOGOS, 전역 운영 알림 | 문의 작성·답변·대기 수 조회 |
| `nexus_classes` | CHRONOS, 파티, AGORA, GNOSIS, 관리자, 버스 | 직업 마스터 데이터 CRUD/조회 |
| `nexus_tasks`, `nexus_contents`, `nexus_trades`, `nexus_purchases` | CHRONOS·홈·주간 동기화·관리자 | 숙제/컨텐츠/교환/구매 기준 데이터 |
| `nexus_banners`, `nexus_missions`, `content_power_reqs`, `gnosis_guides` | 전역 배너·관리자 | 운영 데이터 CRUD |
| `deep_holes`, `abyss_reports` | 홈 | 심연/어비스 제보 생성·목록 |
| `server_events` | 게임 이벤트 API | 서버 이벤트 제공 |

#### DB-코드 불일치 후보

- 현재 확인된 Supabase 테이블 목록에는 `members`, `homework_status`가 없지만, `CharacterStats.tsx`와 `AstraView.tsx`에서 이 이름을 조회한다. 이는 과거 테이블 잔재, 별도 스키마, 또는 실제 런타임 오류 후보이므로 베타 점검 첫 단계에서 확인한다.
- 확인된 테이블 중 `boards`, `lounge_posts`, `notice_comments`, `weekly_stat_snapshots`, `sync_batches`, `nexus_titles`, `guild_settings` 등은 현재 소스 직접 호출 여부·운영 목적을 별도 점검 대상으로 둔다. "테이블이 존재한다"와 "현재 화면이 사용한다"를 같은 뜻으로 취급하지 않는다.
- 2026-09-23 읽기 전용 검사에서 `accounts.code`·`code_hash`의 anon SELECT와 RLS가 꺼진 18개 테이블의 anon 쓰기 권한이 확인됐다. 이번 검증 문서 push는 구조 변경 없음. 실제 권한 차단은 현재 브라우저 직접 쓰기·외부 동기화를 서버 경로로 옮기고 별도 승인받은 뒤에만 한다.

### 자산·테마 구조

- `public/svgs/classes/`: 21개 직업 SVG. `ClassIcon`에서 표시한다.
- `public/svgs/UI mark/`, `status mark/`, `contens mark/`, `logo/`: 메뉴·상태·컨텐츠·브랜드 SVG. 상단 도구는 신규 `정령의 날개 마크.svg`·`테마 팔레트 마크.svg`와 기존 `우편함 마크.svg`를 `MarkIcon` 마스크로 표시해 전역 테마 색을 따른다.
- `public/images/bg-login-pc.webp`, `bg-login-mobile.webp`: 로그인 반응형 배경.
- `public/items_catalog.json`: 엠포리온 아이템 검색의 로컬 카탈로그.
- `app/globals.css`: AUREUM, LUMEN, NEMETON, VESPER, ROSARIUM, ELYSIUM의 전역 CSS 변수와 공통 스타일의 기준점.

### 전역 UI 구조

- 전역 테마, 일반 UI, `StickerCanvas`는 서로 레이어를 분리한다.
- 모바일은 단순 축소가 아니라 바텀시트, 터치 조작, 정보 밀도를 고려해 재배치한다.
- `sm` 경계(640px)까지는 모바일로 취급한다. 3열 카드·6열 탭·가로형 Top 3는 `md`(768px)부터 사용하며, 고정 플로팅 메뉴와 본문이 겹치지 않도록 전역 하단 안전 여백을 둔다.
- 직업 SVG는 `ClassIcon`, 컨텐츠/UI SVG는 `MarkIcon`을 우선 사용한다.
- 테마 색상은 하드코딩보다 `var(--panel)`, `var(--accent)`, `var(--text-main)`, `var(--text-sub)` 등 전역 변수를 우선한다.

---

## 4. 현재 기능 지도

| 영역 | 현재 구현 | 베타 판단 |
| --- | --- | --- |
| SANCTUM 홈 | 길드 상태 위젯, 숙제·랭킹·파티 요약 | 점검 후 유지 |
| CHRONOS | 다중 캐릭터, 직업/레벨, 전투력·마도저항, 숙제·교환 체크 | 베타 핵심 |
| KERYGMA | 공지 CRUD, 고정, 투표, 댓글/대댓글, Realtime 구독 | 베타 핵심 |
| AGORA | ASTRA 길드원 현황, PANTHEON 랭킹 | 베타 포함 |
| SYNAXIS | 파티 생성/참여, 역할 조합, 일정 겹침 검사, 길드 버스 | 베타 핵심 |
| 관리자 | 가입 승인, 배너, 숙제·컨텐츠·클래스·교환·임무·GNOSIS 관리 | 베타 핵심 |
| EMPORION | 카탈로그/검색 UI, API Route 존재 | 화면 가격은 현재 시뮬레이션이므로 정식 오픈 과제 |
| GNOSIS | 가이드 목록·작성 프로토타입 | 베타에서는 최소 유지 |
| LOGOS | 1:1 문의·답변 | 최소 유지, 이후 고도화 |
| 알림 | 상단 알림함, 공지 실시간 감지, 읽지 않음 수, 브라우저 알림 허용 버튼 | 1차 구현 완료; 브라우저/탭 완전 종료 후 푸시는 후속 과제 |

---

## 5. Supabase 현재 상태 (2026-09-22 확인)

### Public schema 테이블

| 분류 | 테이블 |
| --- | --- |
| 계정·캐릭터 | `accounts`, `characters`, `activity_logs`, `weekly_stat_snapshots`, `sync_batches` |
| 공지·커뮤니티 | `notices`, `notice_comments`, `boards`, `gnosis_guides`, `lounge_posts`, `inquiries` |
| 파티·이벤트 | `parties`, `abyss_reports`, `deep_holes`, `server_events` |
| 운영 카탈로그 | `nexus_banners`, `nexus_classes`, `nexus_contents`, `content_power_reqs`, `nexus_tasks`, `nexus_trades`, `nexus_missions`, `nexus_purchases`, `nexus_titles`, `guild_settings` |

### RLS 확인 결과

RLS가 켜진 테이블은 `accounts`, `activity_logs`, `characters`, `inquiries`, `lounge_posts`, `nexus_classes`, `parties`다. 나머지 다수의 public 테이블은 RLS가 꺼져 있다.

2026-09-23 정책 상세 확인에서 위 테이블의 RLS가 켜져 있어도 `PUBLIC` 대상 `true` 쓰기 정책이 있었음을 확인했다. 서버 쓰기 경로를 배포·검증한 뒤 Phase B/C/D SQL로 공개 권한을 차단했다.

2026-09-23 23:27 KST Phase B/C/D를 운영 DB에 적용했다. 익명 쓰기 가능한 public 테이블은 0개이며 계정 코드·해시와 비공개 문의의 익명 읽기는 차단됐다. 기존 RLS 정책 이름 자체가 남은 테이블도 테이블 권한이 없어 브라우저 익명 쓰기를 허용하지 않는다. 이후 DB 변경 시 서버 API 경로와 권한을 함께 갱신한다.

특히 `notices`는 정책이 존재하지만 RLS 자체가 꺼져 있으므로 정책이 적용되지 않는다. RLS를 한꺼번에 활성화하면 기존 클라이언트 직접 호출이 중단될 수 있으므로, 베타 전에는 핵심 테이블부터 코드와 함께 단계적으로 정비한다.

### 데이터 모델 유의점

- `accounts.code`는 현재 일반 텍스트 입장 코드다. 로그·백업·Git에 노출하지 않는다. `supabase/migrations/20260922_account_code_hash_and_login_rpc.sql`로 bcrypt 해시·서버 세션 전환을 준비했으나, 운영 DB 적용 전이므로 아직 평문 컬럼을 삭제하지 않는다.
- `characters.combat_power`, `magic_resistance`, `life_energy`, `charm`은 텍스트 타입이다. 수치 계산/정렬 시 변환을 일관되게 처리한다.
- 숙제, 레벨, 랭킹, 파티 멤버 등의 일부 데이터는 JSONB다. 동시 수정 시 기존 값을 덮어쓰지 않도록 주의한다.
- 기존 백업 CSV는 데이터 참고용이며, 앞으로 DB 구조 변경은 `supabase/migrations/` SQL 마이그레이션으로 기록한다.

---

## 6. 베타 전 우선 위험 요소

1. **권한 검증:** 브라우저 `localStorage`의 역할값만으로 관리자 기능을 신뢰하지 않는다. 로그인 세션과 역할은 서버의 HttpOnly 쿠키·DB 조회를 기준으로 하며, 관리자 데이터 변경 API도 다음 단계에서 서버 검증으로 옮긴다.
2. **RLS 미적용:** 공개 테이블의 조회·수정 범위를 코드 흐름과 함께 점검한다.
3. **계정 코드 노출:** 입장 코드가 포함된 백업 및 Git 추적 파일을 정리하고 코드 교체 계획을 수립한다.
4. **공지 HTML:** `dangerouslySetInnerHTML` 출력 전 허용 HTML 정제(sanitization)를 적용한다.
5. **엠포리온 표기:** 현재 시뮬레이션 가격을 실시간 데이터처럼 표시하지 않는다.
6. **코드 품질:** 현재 `npm run lint`에는 기존 오류가 다수 있으므로, 베타 수정으로 새 오류를 추가하지 않고 `npm run build` 통과를 최소 출시 조건으로 삼는다.

---

## 7. UI/UX 절대 원칙

1. **맥락형 반응형:** PC와 모바일의 사용 목적에 맞춰 레이아웃을 재구성한다.
   - 헤더에서는 브랜드·주요 메뉴·도구 영역을 독립적으로 확보한다. 공간이 모자라는 폭에서는 주요 메뉴를 하단 메뉴로 전환하며, 버튼이나 글자가 서로 겹치는 상태를 허용하지 않는다.
2. **가로 스크롤 방지:** 데이터 테이블을 제외하고 모바일 가로 스크롤을 만들지 않는다.
3. **방어적 레이아웃:** 긴 닉네임, 큰 수치, 빈 데이터, 로딩/실패 상태에서도 깨지지 않게 한다.
4. **실용적 미니멀리즘:** 장식보다 길드원이 즉시 읽고 행동할 수 있는 정보 구조를 우선한다.
5. **테마 일관성:** 신규 컴포넌트도 6개 전역 테마에서 읽을 수 있어야 한다.
6. **글자 단계와 정보 보존:** PC는 전역 18/20/22px 루트 단계에 맞춰 rem으로 비례하고, 모바일은 18px 루트와 최소 보조 글자 크기를 지킨다. 관리자 전용 비례 토큰은 `app/admin/admin.css`를 사용한다. 12자 닉네임·제목·값은 말줄임 대신 행/열 재배치와 안전한 줄바꿈으로 전체를 읽게 한다.
7. **전역 탐색 헤더:** `components/layout/Navbar.tsx`는 메뉴를 보여 줄 수 있는 중간 폭에서 로고 문양만 남겨 공간을 확보하고, 모바일에서는 로고 옆 브랜드 설명을 표시한다. 영어 메뉴명은 호버·키보드 포커스 시 전체가 보이는 세로 슬롯 전환을 사용한다. 우측 정령의 날개는 버튼과 열린 메뉴 모두 `정령날개 마크.svg`, 테마 설정은 `테마 팔레트 마크.svg`, 알림함은 인게임 형상의 `우편함 마크.svg`를 전역 테마색으로 사용한다. 상단 드롭다운은 겹치지 않게 하나씩 열리고 열린 패널은 화면 높이 안에서 스크롤된다. `components/layout/MobileBottomSheet.tsx`의 단일 플로팅 호출점은 실제 모바일 폭에서만 나타나고, `메뉴/닫기` 표기와 절제된 맥동으로 조작 가능성을 알린다. 모션 감소 설정에서는 반복 애니메이션을 끈다.

---

## 8. Codex 협업 규칙

### 작업 모드

- **`의논:`** 코드·DB를 변경하지 않고 선택지와 추천안을 제시한다.
- **`점검:`** 현재 상태를 읽고 문제를 보고한다.
- **`구현:`** 실제 파일을 수정하고 검증한다.
- **`베타 우선:`** 이틀 베타 범위에 필요한 것만 다룬다.
- **`정식 오픈:`** 장기 확장성과 데이터 구조까지 고려한다.
- **`배포:`** 빌드, 환경변수, 배포 상태, 핵심 페이지 스모크 테스트를 확인한다.

### 구현 원칙

- 기존 파일, 연동 컴포넌트, 타입, DB 호출을 확인한 뒤 변경한다.
- 모르는 DB 구조는 추측하지 않고 스키마/대시보드에서 확인한다.
- 새 패키지, 외부 API, DB 삭제, 권한 변경, 배포는 이유와 영향을 먼저 설명한다.
- 전체 파일을 채팅에 반복 출력하지 않는다. 실제 파일 변경, 변경 요약, 검증 결과를 제공한다.
- 작업 완료 시 `의도 → 변경 파일 → 검증 결과 → 남은 위험` 순서로 보고한다.

### Git·문서 규칙

- Git 푸시는 한설의 명시적 요청이 있을 때만 한다.
- 푸시 전 변경 파일, 빌드 결과, 버전 상승안, 릴리스 노트 초안을 확인한다.
- 기존 최신 Git 기능 표기 `v1.9`를 보존한다. 기능 단위는 `v1.9 → v2.0`처럼 다음 `0.1`/정수 마일스톤으로, 그보다 작은 후속·핫픽스는 `v1.91 → v1.92`처럼 세부 버전으로 올린다.
- 매 push에는 `docs/RELEASE_NOTES.md`(KST 시간·변경·검증·Vercel 결과), `docs/HANDOFF.md`(프로젝트 전체 상태), 이 마스터 가이드의 실제 구조 변경, 현재 호스트의 Codex 릴레이 발신함을 함께 갱신한다.
- 구조 변경이 없으면 업데이트 노트에 명시하며, 구조 변경이 있으면 페이지·컴포넌트·API·DB·권한 중 바뀐 부분만 근거를 가지고 갱신한다.
- `docs/DECISIONS.md`에는 장기 운영 결정을, `docs/BETA_FEEDBACK.md`에는 한설이 전달한 베타 피드백의 처리 상태를 기록한다.

### 시스템 공지 규칙

- 향후 시스템 공지 기능이 구현되면, 공식 push와 Vercel `Ready` 확인 뒤 `SANCTUM 시스템` 작성자의 `생텀 업데이트` 공지를 게시한다.
- 공지는 길드원이 이해할 수 있게 버전·날짜·사용자 변화·필요 행동만 설명한다. 내부 파일명·DB·오류 로그·비밀값은 공개하지 않는다.
- 사용 방법이나 운영 규칙이 달라질 때만 `생텀 가이드`를 갱신한다. 모든 배포에 가이드 글을 중복 게시하지 않는다.
- 이 자동 게시 기능은 아직 구현 전이다. 서버 전용 권한, 같은 버전 중복 방지, 배포 성공 확인을 갖춘 뒤 활성화한다.

### 알림 기능 단계

- **1차 구현 완료:** KERYGMA 새 공지 알림함, 읽지 않음 표시, 알림 클릭 시 해당 공지 이동, 사용자 선택형 브라우저 알림.
- **현재 제한:** 읽음 상태는 계정별 브라우저 저장소에만 저장되며, 탭 또는 브라우저가 완전히 종료된 뒤에는 알림을 보낼 수 없다.
- **후속 단계:** DB 기반 알림 기록, 운영진/개인 대상 알림, 읽음 상태의 여러 기기 동기화, 서비스 워커와 Web Push 기반의 종료 후 푸시 알림.

### 베타 우선순위

| 등급 | 처리 기준 | 예시 |
| --- | --- | --- |
| P0 | 즉시 점검·핫픽스 | 로그인 불가, 데이터 삭제/유출, 관리자 권한 노출, 전체 접속 불가 |
| P1 | 다음 베타 배포 우선 | 캐릭터·공지·파티·가입 승인 오류, 모바일에서 조작을 막는 UI |
| P2 | 피드백에 기록 후 보류 | 취향성 UI 조정, 새로운 장기 아이디어, 엠포리온·그노시스 로고스 확장 |

한설이 직접 우선 구현을 지정하면 P2도 진행할 수 있으나, 현재 작업 중인 영겁 또는 순월은 베타 핵심 일정에 주는 영향을 먼저 알린다.

---

## 9. 다음 우선순위

1. 계정 보안 1차 SQL 적용 후 로그인·가입 신청·승인 계정의 실제 흐름 테스트
2. 관리자 승인·계정 관리의 브라우저 직접 DB 변경을 서버 권한 검증 API로 전환
3. CHRONOS, KERYGMA, SYNAXIS, 관리자 기능의 실제 흐름 테스트
4. 모바일 화면·빈 상태·실패 상태 점검
5. 8명 베타 테스터 배포 및 핫픽스
6. 범용 알림 데이터 구조와 사용자별 설정 설계 후, CHRONOS·SYNAXIS·운영진 이벤트부터 내부 알림함에 단계적으로 연결
7. Service Worker/PWA/Web Push를 추가해 종료 후 모바일·브라우저 알림 지원
8. 베타 안정화 후 GNOSIS와 EMPORION 고도화

- 2026-10-19 17:07 KST 문서마감: 제품83b437a/자동Preview dpl_33y9Lt9E7XyUhUnBuJZrdyXnXqdL READY(실화면은Vercel로그인보호로미확인). 구조변경없음/운영미적용. 집통합은전용병합안내참조.
