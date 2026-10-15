# ERGON One-click Collection Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Preserve the existing direct/native execution preference; do not dispatch per-task implementers.

**Goal:** 최초 한 번의 native 허용 뒤 시설 버튼 한 번으로 자동 안전 점검·과거 잠금 판정·해당 시설 이동/완료품 수령을 수행한다.

**Architecture:** 기존 소비 executor와 전역 실행 lease를 재사용한다. 원본 unknown은 변경하지 않고 별도 DPAPI 정책/정리 이력으로 현재 실행 차단과 분리한다. native가 허용과 자동 정리를 통제하고 UI는 고정된 수령 요청/진행/예외만 표시한다.

**Tech Stack:** Windows .NET Framework C#, PowerShell fixtures, WebView2, Next.js/React/TypeScript, Node test, Playwright synthetic browser.

**Spec:** `docs/superpowers/specs/2026-10-15-ergon-one-click-collection-design.md` — 한설이 이번 턴에 서면 설계 진행 승인. 서면 설계·구현 계획 모두 승인, 직접 구현·검증 선택.

## Global Constraints

- “원본 `ergon-actions-v1.dpapi`의 과거 unknown을 성공/거절/삭제로 고치지 않는다.”
- “경과 시간만으로는 절대 해제하지 않는다.” 최소 경과 시간은 12분이다.
- “간격은 최소 1초이며 각 응답은 15초 미만의 신선한 값이어야 한다.”
- “먼저 읽기 작업의 종료를 최대 10초 기다리고 실행 lease를 획득한다.”
- “클릭 요청의 유효기간은 2분이며 최초 허용창에서 오래 머물러도 연장하지 않는다.”
- “기존 채집·제작의 native 최종 확인은 이번에 변경하지 않는다.”
- “앱 재시작 뒤 대기 중이던 클릭을 자동 재개하지 않는다.”
- “공식 push는 별도 요청이 있을 때만 한다.” 한설 최신 요청으로 5시간 잔여15% 새 작업 중단·안전 인계 약속을 다시 적용한다. 이전 적용 제외 지시는 철회됐으며 무제한 소비나 배포 승인은 없다.
- 현재 checkout/사용자 dirty 유지. 개인 삭제·문서·미추적 파일을 되돌리거나 함께 스테이징하지 않는다. 실제 개인 원장은 합성 시험에 사용하지 않는다.

## Review Focus

1. 과거 unknown 자동 분리 직후 crash: 원본/백업과 정리 이력의 원자성, 재시작 후 중복 수령0 — Task1/2 시험.
2. 현재 실행처럼 보이지 않는 orphan CLI·다른 Windows 세션 IRIS: 증거 불충분이면 차단, 프로세스 강제 종료0 — Task2 시험.
3. 초기 허용창 중 문맥 변경·유효기간 경과: 권한 저장과 해당 클릭 실행을 구분, 오래된 클릭 실행0 — Task2/3 시험.
4. 다른 환경/계정 unknown 및 원본 변경: 잘못된 정리 이력 재사용/정보 노출0 — Task1/3 시험.
5. confirm 이후 숨김·응답 손실·idle 조회 경합: 잠금/관측 유지, 소비 재전송0, 회복한 조회 경고는 제거 — Task2/3 시험.

## File Structure

| 영역 | 파일 | 책임 |
| --- | --- | --- |
| native 정책 저장 | 새 `iris/desktop-life-automation.cs` | 계정별 수령 허용, 원본 해시와 정리 이력, private 백업/원자 저장 |
| native 자동 판정 | 새 `iris/desktop-life-reconciliation.cs` | previous-session/12분/두 fresh idle/동일 문맥 증거 검증 |
| CLI 실행 증거 | 새 `iris/desktop-cli-activity.cs` | 자체 read/action PID 등록·종료, 남은/미분류 CLI 판정 |
| 기존 native | `iris/desktop-life-journal.cs`, `desktop-life-executor.cs`, `desktop-life-cli.cs`, `desktop-life-read.cs`, `desktop-bridge.cs`, `desktop-webview.cs` | 차단 분리·단일 실행·좁은 bridge·최초 허용창 |
| runtime/build | `iris/desktop.ps1`, `iris/build-beta.ps1`, 관련 Add-Type 시험 스크립트 | 새 소스 포함, 실제 제품 경로와 합성 경로 동일한 의존성 |
| TS 계약 | 새 `lib/irisErgonAutomation.ts`, 기존 `irisDesktopStore.ts`, `irisErgonCollection.ts`, `irisErgonErrors.ts` | strict DTO 파서·고정 endpoint·클릭 id/기한·짧은 오류 |
| UI | `components/iris/DesktopErgon.tsx`, `DesktopErgonExecution.tsx`, `DesktopErgonWorkbench.tsx` | 원클릭/진행/권한 철회/과거 기록 구분, 단일 상태 관측 |

### Task 1: 원본을 보존하는 정책·정리 이력 저장과 차단 계산

**Files:** Create `iris/desktop-life-automation.cs`, `iris/desktop-life-automation.fixture.cs`, `iris/desktop-life-automation.tests.ps1`; modify `iris/desktop-life-journal.cs`, `iris/desktop-life-journal.tests.ps1`.

**Interfaces:**
- `DesktopLifeAutomationStore(string root,string environment)` — `<root>/<environment>/ergon-automation-v1.dpapi`, 별도 entropy `SANCTUM:IRIS:ErgonAutomation:v1:<environment>`, schemaVersion1, 최대1MiB, collectionGrants 최대40/정리 이력 최대300. 누락은 미허용/미정리, 손상은 fail-closed.
- `bool CollectionAllowed(string accountId,int policyVersion)` / `void GrantCollection(string accountId,int policyVersion)` / `void RevokeCollection(string accountId)` — native 전용. 정책 버전1. UI에서 임의 granted boolean을 받지 않는다.
- `string RecordHash(Dictionary<string,object> original)` / `bool IsSeparated(string environment,Dictionary<string,object> original)` / `void RecordSeparation(string environment,Dictionary<string,object> original,Dictionary<string,object> evidence)`.
- 원본 해시는 검증된 JSON 객체의 키를 재귀적으로 ordinal 정렬한 UTF-8 JSON의 SHA256. evidence는 sessionStartedAt/checkedAt/firstObservedAt/secondObservedAt/gameProcessId/contextVersion/policyVersion/CLI 없음 판정만 허용하며 원시 게임·개인 응답은 저장하지 않는다.
- `DesktopLifeJournal.BindSeparation(Func<string,Dictionary<string,object>,bool> predicate)` — 초기 native 구성 때만 연결. `HasUnresolved`/`Begin`/peer 판정 모두 같은 predicate를 사용한다. 연결되지 않은 구형 경로는 기존 엄격 차단 유지. 원본 state는 그대로이며 state/history schema1/2/3도 유지한다.
- `IReadOnlyList<string> SeparatedRequestIds(string accountId)` — 현재 계정의 기록 ID만 최대300개 반환.

- [x] **1. 실패 시험:** `OldUnknownRemainsByteIdentical`, `AlteredOriginalInvalidatesSeparation`, `ForeignEnvironmentCannotReuseGrantOrAudit`, `CorruptAutomationBlocks`, `FailedAuditWriteKeepsOldFile`, `SecondWriterCannotInterleave`, `BackupExistsBeforeFirstAudit`, `RollbackWithoutPredicateBlocksAgain`를 fixture에 추가. 고정 원본 unknown1건의 원문/암호화 해시가 동일하고 다른 계정의 목록이 비어 있음을 assert한다.
- [x] **2. RED 확인:** `powershell.exe -NoProfile -File iris/desktop-life-automation.tests.ps1`. 새 계약 미구현 실패를 확인하고 구문/fixture 문제는 먼저 수정한다.
- [x] **3. 최소 구현:** 기존 journal의 DPAPI/파일 공유 잠금/임시 파일+원자 교체 패턴을 사용한다. 정리 이력 첫 저장 전 원본 암호화 파일만 `reconciliation-backups` 아래 고유 이름으로 복사하고 덮어쓰지 않는다. 전역 실행 lease를 보유한 coordinator만 RecordSeparation을 호출하게 한다. original unknown은 기간 정리에서도 삭제하지 않는다.
- [x] **4. GREEN/회귀:** 새 automation 시험과 `iris/desktop-life-journal.tests.ps1` 통과. 반복 호출에도 동일 원본 정리 이력1건이며 쓰기/공유 잠금 실패 시 새 행동이 열리지 않아야 한다.
- [x] **5. 로컬 커밋:** 이 Task의 파일만 diff 확인/명시 스테이징. 개인 원장/백업은 포함하지 않고 push0.

### Task 2: native 원클릭 조정기·종료 증거·좁은 bridge

**Files:** Create `iris/desktop-life-reconciliation.cs`, `iris/desktop-cli-activity.cs`, `iris/desktop-life-collection.fixture.cs`, `iris/desktop-life-collection.tests.ps1`; modify native files listed above, `iris/desktop-life-executor.fixture.cs`, `iris/desktop-life-actions-bridge.tests.ps1`, `iris/desktop-life-cli.tests.ps1`, startup/build manifests.

**Interfaces:**
- `DesktopCliActivity.Track(int processId,bool readOnly):IDisposable`, `HasUnclassifiedOrActionCli():bool`, `WaitForReadsAsync(int timeoutMs):Task<bool>` — 조회/행동 런처 셋(DesktopLifeReader, DesktopLifeCli, DesktopGameStatsReader)에 등록한다. 미분류/확인 불가 CLI는 busy로 취급한다. 다른 프로세스를 종료하지 않는다.
- `DesktopLifeReconciliation.Evaluate(Dictionary<string,object> record,Dictionary<string,object> evidence):bool` — 단위 순수 판정. 입력의 previous-session/lease/execution 없음/CLI 없음/동일 game PID·context·epoch·원본 해시/두 activity/시간을 모두 검사. 시작 시간은 native SessionStartedAt 이전, 나이>=720000ms, fresh age>=0 && <15000ms, 두 관측 간격>=1000ms. 현재 세션 unknown/inflight는 false.
- `DesktopLifeExecutor.BindCollectionAutomation(DesktopLifeAutomationStore store,Func<object,bool> authorize,Func<Task<Dictionary<string,object>>> probe)`; `CollectOneClickAsync(Dictionary<string,object> value):Task<object>`; `CollectionPolicy(Dictionary<string,object> value):object`; `RevokeCollection(Dictionary<string,object> value):object`.
- 새 bridge: `game.life.actions.collect` payload exact `{requestId,requestedAt,accountId,characterId,facility,displayName}`. UUID/정수 ms/각 ID<=100·시설/품목<=160·제어문자 금지. requestedAt<=native now, deadline=requestedAt+120000ms. 소비 응답은 기존 receipt `{schemaVersion:1,id,state:'running'|'cancelled'}`. committed requestId 재수신은 `life_request_replayed`, 두 번째 실행0.
- `game.life.actions.collectionPolicy` / `game.life.actions.revokeCollection` payload exact `{accountId}`. 정책 응답 `{schemaVersion:1,policyVersion:1,granted:boolean,separatedRequestIds:string[]}`. context 계정과 반드시 일치. 프런트엔드 허용/정리 쓰기 endpoint는 만들지 않는다.
- capabilities만 schema4로 확장하고 기존 항목+`oneClickCollection:true`/`automaticReconciliation:true`/`collectionPolicyVersion:1`을 추가한다. challenge/state/history 버전과 legacy gather/craft consent는 바꾸지 않는다.

- [x] **1. 실패 시험:** 기존 source와 실제 제어 흐름을 사용하는 가짜 IO fixture에 `OldUnknownSeparatesThenCollectsOnce`, `RecentUnknownOrInflightBlocks`, `LivePeerLeaseBlocks`, `OrphanOrUnreadableCliBlocks`, `SecondIdleBusyOrStaleBlocks`, `ContextChangesDuringProbeBlocks`, `GrantCancelSendsNothing`, `GrantWaitExpiryDoesNotExtendClick`, `PermissionCannotEnableCraftOrOtherAccount`, `CrashAfterAuditBeforeBeginDoesNotReplay`, `DuplicateRequestAcrossRestartSendsOnce`, `LostResponseCreatesNewUnknownNotRetry` 추가. count/정리 state/백업을 검증한다.
- [x] **2. RED 확인:** `powershell.exe -NoProfile -File iris/desktop-life-collection.tests.ps1`와 bridge의 새 endpoint 시험이 기대한 미구현으로 실패하는지 확인한다.
- [x] **3. native 최소 구현:** mutation gate→정해진 최초 native 허용→기존 read 최대10000ms 대기→전역 실행 lease→자동 정리 증거2회→전체 fresh preflight/시설 고정→Begin→기존 Run을 공유한다. 어느 경로에서도 이전 unknown 명령을 재전송하지 않는다. native 단일 소비 task와 lease 수명을 기존 실행과 동일하게 유지한다. 첫 허용창은 spec4절의 현재 게임 캐릭터/시설 전체/비용 미확인/다른 자동화 동시사용 제한을 표시하고 허용 이후 반복하지 않는다.
- [x] **4. bridge/런처 통합:** source/epoch/environment/계정 검사·allowlist 오류를 유지한다. 새 실행은 UI가 blocked만 보고 abort하지 않고 native coordinator가 과거 차단을 판정한다. gameBusy인 자체 read만 최대10초 대기시키고 소비 작업 busy는 대기/우회하지 않는다. `life_reconcile_unavailable`, `life_request_replayed`, `life_collection_permission`, `life_permission_corrupt`만 새 오류로 허용한다.
- [x] **5. 컴파일 경로:** `desktop.ps1`/`build-beta.ps1`에 새3파일을 추가한다. 같은 클래스를 컴파일하는 `desktop-bridge`, `desktop-grip`, `desktop-fonts`, `desktop-life-actions-bridge`, `desktop-life-bridge`, `desktop-life-cli`, `desktop-life-executor`, `desktop-life-journal`, `desktop-life-quantity`, `desktop-life-read`, `desktop-startup-close`, `desktop-webview`, `desktop-workspace-bridge`의 `.tests.ps1` 의존성 목록을 실제 참조에 맞게 갱신한다. fixture-only 메서드를 제품 클래스에 추가하지 않는다.
- [x] **6. GREEN/회귀:** 새 collection/automation 및 기존 executor/quantity/CLI/journal/read/actions-bridge 시험을 모두 실행한다. command count1, 취소0, wrong facility0, 여전히 unknown인 원본, 신규 unknown 차단과 기존 craft/gather 최종 동의 유지를 확인한다.
- [x] **7. 로컬 커밋:** native 코드/합성 시험만 명시 스테이징. 실제 native 앱/게임은 이 단계에서 실행하지 않는다.

### Task 3: TS 계약과 반복 확인 없는 수령 화면

**Files:** Create `lib/irisErgonAutomation.ts`, `tests/iris-ergon-automation.test.mjs`; modify `lib/irisDesktopStore.ts`의 capability 파서/메서드, `lib/irisErgonCollection.ts`, `lib/irisErgonErrors.ts`, ERGON3컴포넌트, `tests/iris-ergon-collection.test.mjs`, `tests/iris-ergon-collection.browser.mjs`, `tests/iris-ui.fixture.mjs`.

**Interfaces:**
- `ErgonCollectionPolicy={schemaVersion:1;policyVersion:1;granted:boolean;separatedRequestIds:string[]}` / `parseErgonCollectionPolicy(value:unknown):ErgonCollectionPolicy` — exact shape, UUID 중복/초과300/다른 타입 거절.
- store `collectLifeAction(value:{requestId:string;requestedAt:number;accountId:string;characterId:string;facility:string;displayName:string})`, `collectionPolicy(accountId:string)`, `revokeCollection(accountId:string)` — Task2의 고정 bridge만 호출, 기존 receipt parser 재사용.
- `requestErgonCollection`은 최신 capability가 있으면 정확한 한 번의 collect endpoint를 사용한다. requestId/시각은 사용자 클릭 때 생성해 한 flight에 고정한다. 새 기능이 없는 native는 업데이트 필요 안내, 기존 prepare+confirm을 원클릭처럼 자동 대체하지 않는다.
- `DesktopErgonExecution`은 Task2 정책 응답의 정리 ID 집합을 받아 과거 unknown은 `과거 결과 미확인 · 실행 종료 확인`으로 표시한다. 결과/재료·목표 진척에는 반영하지 않는다. 기존 externalActionId 관측 경로와 busy 합산 유지.

- [x] **1. 실패 시험:** store의 정확 payload/타임아웃/foreign epoch/정책 파서 변형과 collection 흐름을 real TS 테스트로 추가한다. `OneClickUsesOnlyCollectEndpoint`, `NativeReconciliationNotPreemptedByOldBlockedFlag`, `LegacyCapabilitiesDoNotPretendAutomation`, `RevocationCannotGrant`, `ReconciledUnknownAddsNoProgress`를 literal 결과로 assert.
- [x] **2. RED 확인:** `node --test tests/iris-ergon-automation.test.mjs tests/iris-ergon-collection.test.mjs`에서 신규 정책/endpoint 미구현 실패를 확인한다.
- [x] **3. 최소 UI 구현:** 정상은 버튼→확인 중→이동·수령 중→수령 완료. 계정/시설/epoch 변경은 실행 전 취소하고, 실행 뒤 이탈은 결과 관측만 계속한다. 접힌 수령 안내에 현재 허용 상태와 `원클릭 수령 끄기` 제공, 해제는 취소 가능·바깥 클릭/Escape 가능한 기존 패널 패턴을 따른다. 반복 긴 문구/새 상시 배너는 넣지 않는다.
- [x] **4. 조회 회복 처리:** read/context/history 실패 알림과 실제 실행 notice를 분리하고 성공한 해당 조회에서만 회복 경고를 지운다. transient gameBusy를 영구 작업 실패로 남기지 않는다. 소비 오류/unknown 경고를 조회 성공만으로 지우지 않는다.
- [x] **5. 실제 React 실패 시험:** fixture의 native 경계만 synthetic으로 대체. 원클릭1회/최초 허용 취소/권한 기억·철회/연타·새로고침재전송0/late prepare·late running hidden/계정 변경/모든 완료품 표시/오래된 unknown 자동분리상태/현재 unknown 차단/조회오류 회복을 검증한다. 준비/최종 확인 버튼이 없고 좁은 창에서 현재 진행이 보이는지 검사한다.
- [x] **6. GREEN/회귀:** collection browser 및 기존 workspace/queue/craft/quantity/goal-workbench/workbench browser를 통과시킨다. 320/390/768/1280 폭과 글자18/20/22에서 가로넘침·버튼 잘림0, 작은 안내12px 이상. `npx tsc --noEmit`/관련 eslint exit0.
- [x] **7. 로컬 커밋:** TS/UI/fixture·테스트만 명시 diff·스테이징. 공개 버전·다운로드 파일은 변경하지 않는다.

### Task 4: 전체 검증·실제 후보 연결·인계

**Files:** modify `docs/BETA_FEEDBACK.md`, `docs/DECISIONS.md`, `docs/HANDOFF.md`, `app/SANCTUM_MASTER_GUID.md`, `docs/relay/TO_SOONWOL.md`; update the accepted spec/plan checkboxes with actual evidence.

**Interfaces:** 앞 Task의 새 native/TS 계약과 실행/원본 보존 결과만 사용. 새 기능 확대 없음.

- [ ] **1. 전체 Node 시험:** `$taskTests=@(rg --files tests -g '*.test.mjs'); node --test $taskTests` — fail0, 기존 skip은 이름과 수를 보고. IRIS 별도 reader Node 시험도 기존 manifest대로 확인.
- [ ] **2. native/웹 검증:** Task2의 새/기존 PowerShell과 startup/webview/workspace/bridge 회귀를 실행한다. `node tests/iris-isolated-build.mjs`와 `powershell.exe -NoProfile -File iris/build-beta.ps1 -OutputRoot .superpowers/ergon-one-click-private` exit0. 환경/실제 보호파일/원본 앱을 빌드에 복사하지 않는다.
- [ ] **3. 독립 최종 리뷰1회:** `requesting-code-review`를 사용해 이번 정책 전체를 읽기 전용으로 검토한다. Critical/Important는 재현 시험 후 수정하고 같은 시험과 영향 회귀를 다시 실행한다. 새로운 reviewer loop는 시작하지 않는다.
- [ ] **4. 문서/원본 확인:** diff를 읽고 제품/개인 변경을 구분한다. 실제 개인 원장의 해당 과거 레코드 해시를 채팅에 출력하지 않고 보존 여부만 확인한다. 새 수령 요청이 원장에 추가돼 전체 파일이 바뀌는 것과 과거 레코드 변경을 구분한다. 자동 정리가 실제로 수행된 경우 원본 보존·private 백업·정리 이력 생성 사실을 별도로 보고한다. 합성 자료를 실제 결과로 기록하지 않는다.
- [ ] **5. 사용자 재시작:** 게임은 그대로 두고 IRIS만 정상 X 종료를 요청한다. 동의 뒤 Development 후보를 `-WindowStyle Hidden` 백그라운드 런처로 한 번 시작하고 페이지/스크립트/프로세스 응답을 확인한다. 강제 종료·중복 실행 없음.
- [ ] **6. 실제 한 시설 확인:** 사용자가 선택한 시설 완료품 전체/비용 미확인/현재 게임 캐릭터 범위를 짧게 안내한다. 사용자의 첫 원클릭 허용 뒤 클릭에 따라 실행하고 전후 완료 건수·가방·날개/응답을 비교한다. 에이전트가 임의 품목을 실행하거나 재시도하지 않는다. 사용자의 결과 확인 없이는 실게임 완료로 닫지 않는다.
- [ ] **7. 교차 보고/인계:** 정상·남은 제한·원클릭 철회/보수 모드 복귀를 짧게 안내한다. 최신 요청대로 5시간 잔여15% 중단을 적용한다. push는 새 명시 요청 전0이며, 요청 시에만 릴리즈노트 포함 공식 문서·원격 상태를 갱신한다.

## Self-review / handoff

- 원본 보존/롤백/복합 판정은 Task1/2, 동의·실행·중복/범위는 Task2, 사용자 자동화 동선/회복은 Task3, 배포와 실검증 경계는 Task4가 담당한다.
- Task1 store와 Task2 actor, Task2 wire와 Task3 parser의 이름/필드/버전을 맞췄다. live 게임 신원 자동 일치나 수령 비용0은 보장하지 않는다.
- 계획 및 직접 구현 승인 후 Task1~3 로컬 구현·검증 완료. Task4 독립 리뷰·정상 재시작·사용자 실게임 확인은 실제 결과에 따라 마감한다.
