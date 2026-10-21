# ERGON Progress Preservation — Three-stage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans for the recommended native/inline execution, or superpowers:subagent-driven-development only if the user chooses that method. Steps use checkbox (`- [ ]`) syntax for tracking. **설계 방향은 승인됐다. 2026-10-21 마감 요청으로 기존 수정·문서의 기능 브랜치 선별 commit/push만 승인됐으며 신규 구현은 시작하지 않는다. 순월은 수신·환경 확인 후 시작 가능 여부를 보고한다.** [최신 인계·승인 경계](../../ERGON_CLOSEOUT_20261021.md).

**Goal:** 사용자 확인 수량과 정정 이력을 PC 로컬에 보존하고, native 실행 안전과 대조한 뒤에만 ERGON의 남은 목표를 표시한다.

**Architecture:** 1차는 고립된 native DPAPI 진행 저장소와 strict 읽기 모델만 구현한다. 2차에 기존 실행기의 nonce/원장 대조·실행 전 바인딩을 연결하고, 3차에 실제 ERGON UI/종료 보호를 연결한다. 기존 안전 원장·서버 저장 대기함은 수정/대체하지 않으며, 최소 종료 증거도 실행 허가로 사용하지 않는다.

**Tech Stack:** 기존 Windows C# native host/DPAPI/FileStream, TypeScript·React, Node test runner, PowerShell native fixture, 기존 합성 브라우저 fixture. 신규 서비스/의존 패키지 없음.

**Spec:** [승인된 기본 설계와 장기 보존 보완](../specs/2026-10-21-ergon-progress-result-confirmation-design.md), [61개 합성 검증 계획·단계 소유권](../../ERGON_PROGRESS_SYNTHETIC_VALIDATION_PLAN_20261021.md).

## Global Constraints

- 기준 2026-10-21 KST, branch `codex/home-gnosis-iris-integration-20261019`, HEAD `a6bea6824fcff9c7566834c83a979d9985869b6b` + 로컬 1차 수정. 원래 개인 변경28항목과 직전 설계 문서2개도 보존한다.
- targetQuantity 1~1,000,000, 확인 quantity 0~5,000,000 정수. null/빈칸은 미확인, 명시적0은 확인0이다. 입력 상한은 실제 게임 보상 상한의 검증 결과가 아니다.
- 환경별 100목표·1,000요청·4,000감사 이벤트·평문4MiB 한도 및 80% 경고. 실행 요청 바인딩 때 종료 기록용 이벤트/바이트 여유를 예약한다. 자동 이력/unknown 삭제 없음.
- 현재 출처는 `user-confirmed`만. rewards/criticalRewards 파서 및 official-verified 입력 API 없음. native completed/registered·예상 산출을 실제 확보량으로 사용하지 않는다.
- 새 진행 기록은 native 단일 권위 저장소. UI localStorage 진척 fallback 및 임의 전체 스냅샷 교체 API 없음.
- native 원장 파일/entropy/스키마/30일·300건 정책·unknown·nonce·lease 유지. 실제 보호 파일에 테스트 생성자/복구기를 연결하지 않는다.
- 원장 누락/불일치 시 기존 이력은 보존하지만 현재 완료·추가 소비는 차단한다. sidecar 증거/사용자 진술로 실행 보호를 해제하지 않는다.
- 숙제 15초 자동 저장·서버 payload·변경 버리기와 ERGON 저장을 섞지 않는다. Supabase/Vercel 신규 호출·비용0.
- 게임·추가 CLI·앱 강제 재시작·실제 원장 변경·DB·main·공개 잠금 해제·자동 생산/가공 페이즈·주간 루틴·원격 기능은 제외한다.
- 각 단계는 별도 시작 승인과 검토를 받는다. 단계 통과가 다음 단계 구현/게임 시험/commit/push 승인을 뜻하지 않는다. 10% 근접 시 중단·보고, 무승인 전송 없음.

## Review Focus

1. 교체는 성공했지만 ACK만 유실: 같은 확인 재전달은1회 반영하고 이후 정정 값을 롤백하지 않아야 한다 — Task 1·2, Q07/S05.
2. native 종료가 기록됐지만 진행 파일 저장은 실패: native outcome을 바꾸지 않고 진행/실행을 보호해야 한다 — Task 3, N05.
3. 오래된 목표의 원장 행만 정리됨: 최소 증거·사용자 확인을 보존하되 자동 완료/재개하지 않아야 한다 — Task 3, N08.
4. 공용 계획 삭제/캐릭터 이동 중 저장 ACK 도착: 다른 캐릭터 목표·현재 화면을 수정하지 않아야 한다 — Task 4, I03/L04.
5. 저장 한도 직전에 실행을 허용한 뒤 종료 증거를 못 남김: 바인딩 때 종료 저장 예산을 확보하고 무관한 쓰기가 소진하지 못해야 한다 — Task 2·3, S13/N01/N05.

## 단계별 범위·검토 게이트

| 단계 | 변경 범위 | 선행 조건 | 필수 검증 | 완료/다음 단계 조건 |
| --- | --- | --- | --- | --- |
| 1차 저장 기반 | 아래 신규5파일만. native 저장/확인·정정 도메인, TS strict 읽기/입력 parser, 합성 시험 | 설계 보완·본 계획·1차 시작 승인, dirty 기준선 재확인 | 기본61개 중 소유34개, 신규 네트워크/게임/원장 접근0 | 원자성·중복·정정·복원/실패를 새 인스턴스로 확인. native/Node 합성 결과 보고 후 2차 승인 대기 |
| 2차 실행 원장 연결 | 기존 실행기/bridge·소스 목록, 새 코디네이터·native fixtures | 1차 통과 및2차 별도 승인 | 소유13개 + 1차34개 재실행, 기존 nonce/lease/journal/bridge 회귀 | 실제 원장 없이도 합성 IO에서 소비 전 바인딩/정합성/종료 증거 검증. 공개 gate 유지. 3차 승인 대기 |
| 3차 UI 연결 | 기존 ERGON 화면·새 결과 확인/hook·종료 조정, UI 시험 | 2차 통과 및3차 별도 승인 | 소유14개 + 마지막 통합61개 전체 | 결과 확인/정정/보류/삭제/복원·미저장 보호 및 실패 UI 검증. 실제 게임·공개 출시와 분리하여 완료 보고 |

### 공통 자료형과 책임

1차 `lib/irisErgonProgress.ts`에서 다음 읽기 계약을 정의하고 C# native DTO와 동일 필드/정수 범위를 합성 벡터로 검증한다.

- `ProgressScope = {environment:'development'|'production';accountId:string;characterId:string}`.
- `ProgressView = {schemaVersion:1;revision:number;health:'ok'|'review-required'|'unavailable';goals:GoalView[]}`. GoalView는 goalId·원래 목표·lifecycle·confirmedQuantity·quantityUnconfirmed·request별 최신 확인 출처/시각·선행 관계를 포함한다.
- `parseErgonProgressView(value:unknown,scope:ProgressScope):ProgressView`: 범위·중복·이벤트/합계 모순을 거절. native 읽기 결과를 파싱할 뿐 파일을 쓰지 않는다.
- `parseErgonQuantityInput(text:string):{kind:'empty'}|{kind:'invalid'}|{kind:'valid';quantity:number}`: Number('')를0으로 취급하지 않음.

1차 C#의 새 `DesktopErgonProgressStore`는 명시적 absoluteRoot/environment를 받으며 생성만으로 파일 생성·원장 복구를 하지 않는다. 타입/연산은 새 `desktop-life-progress.cs` 안에 모아 native 초기 골격의 범위를 제한한다.

- `ProgressSnapshot Load(ProgressScope scope)`: 새 파일 검증/읽기. 모순/누락/미지원 버전은 읽기 건강 상태로 반환하며 자동 초기화/복구하지 않는다.
- `ProgressCommitResult Commit(ProgressMutation mutation, long expectedRevision, Guid operationId)`: 내부 사용 전용. 소유 범위와 goal/request 식별자를 갖는 의미별 이벤트를 CAS 커밋한다. 원문 JSON 교체나 임의 native outcome 인자를 bridge에 노출하지 않는다.
- `ProgressProjection Project(ProgressScope scope)`: 최신 확인 이벤트만 계산한 읽기 모델. 저장 ACK 전 projection을 성공 결과로 노출하지 않는다.
- mutation 종류: CreateGoal, BindPreparedRequest, ObserveNativeTerminal, ConfirmQuantity, CorrectQuantity, SetLifecycle, DetachPlan, Recover. lifecycle·정정·요청 연결·증거는 설계의 불변 조건을 적용한다.
- 내부 `NativeTerminalEvidence`는 goal/request/소유 범위/action/품목/동결 메타데이터/outcome/원장 startedAt/관측 시각/검증기 버전/row digest만 가진다. phase1 fixture가 합성 증거를 공급하는 것은 게임 검증이 아니다. 실제 생성 권위는2차 코디네이터이며 UI payload로 받지 않는다.

`Load/Commit/Project`의 DTO·예외·필드 정의는 Task 1에서 고정한다. 후속 단계가 이름을 바꿔 별도 저장 모델을 만들지 않는다. `health=ok`도 실행 허가가 아니며 native 안전 gate는2차에 별도로 대조한다.

`ProgressCommitResult`는 status(`committed`/`already-applied`/`conflict`/`rejected`/`unavailable`), operationId, 현재 revision, 해당 scope의 view(읽을 수 없으면 null), 오류 분류를 반환한다. `already-applied`도 최신 view를 반환해 과거 정정값으로 롤백하지 않는다. 저장 미완료인 오류에는 성공 문구/진척을 돌려주지 않는다. `ProgressSnapshot`은 schemaVersion/environment/storeId/revision/health 및 범위별 목표·요청·감사 읽기 모델이며, 타 계정 자료나 원문 원장/CLI를 bridge로 내보내지 않는다.

각 `ProgressMutation`은 kind+scope+goalId와 의미별 필드만 가진다. ConfirmQuantity는 requestId/quantity/초과·0개 명시 확인, CorrectQuantity는 이에 최신 supersedesEventId/정정 사유를 추가한다. SetLifecycle은 lifecycle, DetachPlan은 sourcePlanId, BindPreparedRequest는 내부 동결 요청/가공 회차, ObserveNativeTerminal은 내부 NativeTerminalEvidence만 받는다. Recover는 복구 후보 commit 식별자·기준 revision을 받되 검토 상태를 자동 해제하지 않는다. revision CAS·operationId는 공통 Commit 인자이며, UI가 내부 Bind/Observe 증거를 직접 구성할 수 없다.

## 1차 — 목표 진행 저장 기반

### Task 1: 확인·정정·중복 도메인과 strict 읽기 계약

**Files — 신규 생성:** `iris/desktop-life-progress.cs`, `iris/desktop-life-progress.fixture.cs`, `iris/desktop-life-progress.tests.ps1`, `lib/irisErgonProgress.ts`, `tests/iris-ergon-progress.test.mjs`.

**Interfaces:** 위 Load/Commit/Project 및 parser를 제공한다. 기존 bridge/executor/UI/native 컴파일 목록에는 연결하지 않는다. 테스트의 native C# 컴파일에만 새 소스를 명시한다.

- [ ] **실패 시험 작성:** native `UnconfirmedFourNeverCompletes`, `ConfirmedThreeLeavesOne`, `ExplicitZeroDiffersFromNull`, `CorrectionReplacesContribution`, `DuplicateOperationAfterCorrectionReturnsLatest`, `ScopeAndRequestOwnershipAreExact`. Node `empty quantity is not zero`·`foreign scope and invalid native projection are rejected`.
- [ ] **RED 확인:** `node --test tests/iris-ergon-progress.test.mjs`, `powershell.exe -NoProfile -File iris/desktop-life-progress.tests.ps1`. 누락 계약/잘못된 합산 때문에 실패해야 하며 임시 루트/컴파일 경로 오류를 RED 증거로 삼지 않는다.
- [ ] **최소 구현:** request별 최신 확인만 합산. 3→2 정정은2, 목표4에 확인3은 남은1, quantity=null은 미확인,0은 명시 확인. 같은 operationId/의미는 멱등, 다른 의미는 충돌. 사용자 출처만 허용하고 예상량/선행품을 합계에 더하지 않는다.
- [ ] **GREEN 확인:** 위 명령과1차 소유 Q/I 사례20개. 음수/소수·허용 한도·정정 체인·역전된 ACK·시계 변경·scope·가공 회차를 검사한다. 입력 상한을 게임 상한으로 표현하지 않는다.
- [ ] **검토 후 정지점:** 실제 native 종료 검증·실제 가방 검증·UI 사용 가능을 주장하지 않는다. diff와 시험 결과만 보존하고 commit은 별도 승인 대기한다.

### Task 2: DPAPI 원자 저장·복원·고장 주입

**Files:** Task 1의 native3파일·Node 계약 시험. 필요 없는 공용 저장 프레임워크/기존 파일 리팩터링을 추가하지 않는다.

**Interfaces:** 동일 Store 계약에 실제 새 파일 암호화 저장을 연결한다. 파일 IO 경계는 내부 `IProgressFileIO`로 분리해 `ReadCipher`, `WriteNewAndFlush`, `ReplaceWithBackup`, `MoveNew`, `AcquireExclusiveLock`의 실패만 fixture에서 주입한다. 프로덕션은 실제 IO를 사용하며 테스트 전용 성공/원장 해제 API는 없다.

- [ ] **실패 시험 작성:** `InterruptedTempPreservesCurrent`, `ReplaceFailureNeverOverwrites`, `CommittedAckLossAppliesOnce`, `BackupRecoveryDoesNotAuthorize`, `ConcurrentRevisionCommitsHaveSingleWinner`, `AdmissionReservesTerminalBudget`, `UnknownSchemaAndCapacityPreserveHistory`.
- [ ] **RED 확인:** native 저장 시험 실행. 새 임시 디렉터리 밖 경로를 쓰려 하면 시험 시작 전에 실패해야 한다. 실제 IRIS나 게임을 종료하지 않는다.
- [ ] **최소 구현:** 같은 디렉터리 암호문 tmp/Flush(true)/검증/Replace 또는 최초Move/재검증/ACK. 파일 잠금·CAS·operationId 검사를 한 임계구역으로 묶고 duplicate 판정을 CAS보다 먼저 한다. tmp·backup 자동 승격/원문 덮어쓰기 fallback은 없다.
- [ ] **용량 사전 점검:** 실제 직렬화 크기와 미종료 요청의 예약 종료 증거/이벤트 최악 크기를 합해4MiB/이벤트 상한을 검사한다. 한도80% 경고, 한도 도달 시 새 바인딩/쓰기를 거절하고 기존 이력을 자르지 않는다. 정상 백업2세대와 장애 후보 보존을 구분한다.
- [ ] **GREEN 확인:** S01~S14 전부. 매 실패/재시작을 새 Store 인스턴스로 읽어 직전 커밋·정정·중복 방지 ID·보류 상태를 검사한다. 2프로세스는 합성 저장기 자식 프로세스만 사용한다.
- [ ] **1차 마감:** 전체 Node 회귀와 수정 범위 lint/별도 타입 검사를 추가한다. 1차 소유34개 통과·원장/게임/네트워크 호출0·비밀/실데이터 없는 diff를 보고한다. **이5파일만으로는 화면에 새 기능이 나타나지 않는 것이 정상**이다. 2차 연결 전 현재 앱 진척 방식이 바뀌었다고 말하지 않는다.

## 2차 — 기존 실행 원장 연결

### Task 3: 요청 바인딩·최소 종료 증거·보호 gate

**Create:** `iris/desktop-life-progress-coordinator.cs`, `iris/desktop-life-progress-integration.fixture.cs`, `iris/desktop-life-progress-integration.tests.ps1`, `tests/iris-ergon-progress-bridge.test.mjs`.
**Modify:** `iris/desktop-bridge.cs`, `iris/desktop-webview.cs`, `iris/desktop-life-executor.cs`, `lib/irisDesktopStore.ts`, native 소스 목록인 `iris/desktop.ps1`·`iris/build-beta.ps1`. 두 목록에 새 Store/Coordinator를 추가하되 실제 앱 실행/빌드 산출물 배포는 하지 않는다. `desktop-life-journal.cs`·기존 queue 저장 형식은 수정 대상이 아니다.

**Interfaces:** `ProgressCoordinator`가 현재 native actor의 동결 prepared 요청·원장 snapshot을 소비하고 Store의 내부 mutation/evidence를 생성한다. 후보 bridge 메서드는 `game.life.progress.capabilities/load/createGoal/bindPrepared/confirmQuantity/correctQuantity/setLifecycle/detachPlan`의 고정 allowlist이며 모두 **아직 존재하지 않는다**. 계정/캐릭터/epoch·revision·operationId를 검증하고 파일 경로나 임의 증거/총합을 받지 않는다.

- [ ] **실패 시험 작성:** `BindingFailureStopsBeforeJournalBegin`, `LegacyConfirmCannotBypassBinding`, `UnknownNeverBecomesQuantitySuccess`, `TerminalSaveFailureKeepsNativeOutcome`, `MissingJournalKeepsHistoryButBlocksContinuation`, `ConflictingOrDuplicateEvidenceCannotReplaceOriginal`, `NoReverseLockOrder`.
- [ ] **RED 확인:** `powershell.exe -NoProfile -File iris/desktop-life-progress-integration.tests.ps1`, `node --test tests/iris-ergon-progress-bridge.test.mjs`. 실제 CLI는 fixture 시작부터 금지한다.
- [ ] **최소 바인딩:** goal 저장 ACK→native prepared nonce 연결 저장 ACK→기존 최종 동의/재검증/lease→journal.Begin→기존 실행의 순서를 연결한다. 저장 필수 gate를 구 confirm 경로가 우회하지 못하게 하고1차 한도 예약을 소비 직전에 재검증한다.
- [ ] **종료 관측:** native journal terminal 기록 후에만 최소 증거를 만들고 한 요청에1개 저장한다. 이 저장의 실패로 native completed를 unknown으로 덮지 않는다. unknown/inflight·상반된/없는 원장 행에는 증거를 발급하지 않는다. 기존 normal native 오류/unknown 처리 자체는 유지한다.
- [ ] **장기 보존:** 원장30일/300건 정리를 합성으로 재현한다. 진행 파일 이력·최소 증거가 남아도 native 원장이 없으면 N08에 따라 완료·추가 소비를 막는다. 사후 사용자 진술로 누락된 종료 증거를 만들지 않는다.
- [ ] **GREEN 확인:** N01~N12+Q13의13개와1차34개 재실행. nonce·lease·기존 journal/bridge/executor 합성 회귀, 공개 잠금과 source/epoch 검증도 통과해야 한다.
- [ ] **2차 마감:** 원장 바이트/스키마/정리 정책 변경0, 신규 결과 출처/보상 파서0, 고장 중 실제 가짜 소비 호출 수가 기대값을 넘지 않음을 보고한다. 상태 DTO/신규 method 이름을1차와 대조하고3차 승인 전 UI를 연결하지 않는다.

## 3차 — ERGON UI 연결

### Task 4: 간결한 사용자 확인·보류·정정·복원

**Create:** `components/iris/DesktopErgonResultConfirmation.tsx`, `components/iris/useErgonProgress.ts`, `tests/iris-ergon-progress.browser.mjs`, `tests/iris-ergon-progress-lifecycle.browser.mjs`.
**Modify:** `components/iris/DesktopErgon.tsx`, `DesktopErgonExecution.tsx`, `DesktopErgonQueue.tsx`, `DesktopErgonPlanRow.tsx`, `lib/irisErgonCraftGoal.ts`, `app/iris/desktop/desktop.css`. 종료/미저장 조정의 실제 진입점 `app/iris/desktop/page.tsx`의 requestClose/beforeunload/onBeforeApply에 새 진행 저장/입력 상태를 함께 대조하고, 새로운 별도 종료 관리자를 만들지 않는다. 기존 `useErgonSession.ts` 계획 저장 키/형식은 유지한다.

**Interfaces:** hook은 phase2 store API의 ACK 읽기 모델을 반환한다. `DesktopErgonResultConfirmation`은 request별 미저장 입력과 callback만 가지며 공식 수량처럼 표시하지 않는다. 새 capability가 없으면 로컬 진척 fallback 없이 기능 안내/차단한다.

- [ ] **실패 시험 작성:** `result_input_empty_vs_zero`, `saved_user_three_of_four`, `save_failure_preserves_draft`, `late_ack_does_not_cross_character`, `correction_reopens_shortage`, `restart_restores_paused_goal`, `delete_plan_keeps_audit`, `separate_homework_and_progress_dirty_states`.
- [ ] **RED 확인:** 기존 실제 React fixture+합성 bridge로 새 브라우저2개 실행. 실제 계정/서버/게임 없이 예상값·문구·저장 성공 시점을 확인한다.
- [ ] **최소 UI:** `목표 지정 → 생산 → 결과 확인 → 부족분 재계산 → 계속 진행` 흐름을 유지한다. 현재 자동 보상 확인은 검증되지 않아 completed 뒤 사용자 확인을 요구한다. 입력 기본값 빈칸,0개/초과/정정의 명시 확인, 출처 `사용자 확인`을 간결하게 표시하고 저장 기술 설명은 기본 화면에 늘어놓지 않는다.
- [ ] **복원·후속 준비:** source scope/goalId와 원장 대조 뒤 목표·확인량·보류/미확인 요청을 복원한다. 계속하기는 유효한 최신 재고/예약 재계산과 직접 준비까지이며 game confirm/소비는 하지 않는다. 아직 연결하지 못한 기능은 동작 버튼으로 표시하지 않는다. 자동 파서가 생기면 동일 수량 확인 계약에 native 증거만 주입하며 UI를 건너뛸 수 있게 경계를 유지한다.
- [ ] **정정·삭제·종료:** 새 확인은 저장 ACK 후 반영. native 비활성 ACK 후 계획 제거, 실패 단계별로 구분. 삭제/미저장 버리기/캐릭터 이동이 다른 목표·원장·기존 숙제 자료를 삭제하지 않아야 한다. 별도 서버 쓰기나 추가 생활 폴링을 만들지 않는다.
- [ ] **GREEN 확인:** L01~L12+I03/I08의14개, 그리고 UI 의미를 가진 Q 사례도 실제 화면에서 재확인.320/390/768/1280과글자18/20/22에서 수량·오류·버튼·포커스/닫기 동작 검증.
- [ ] **3차 마감:** 사용자는 저장/원장 구조를 이해하지 않고도 확인·나중에 확인·보류·정정을 사용할 수 있어야 한다. 자동 재계획/반복 가공·주간 루틴·원격 작업 구현은 하지 않는다.

### Task 5: 최종 통합61개·기존 기능 회귀·인계 준비

**Files:** 각 단계의 시험 파일과 검증 결과 문서만. 실패를 숨기려고 범위 밖 제품 코드를 수정하지 않는다.

- [ ] 61개 ID별로 단계 결과와 **최종 통합 결과**를 별도 기록한다. 동일 ID의 모든 원래 기대값이 확인돼야 하며 단계1의 합성 데이터 통과를 UI/native 통합 통과로 대신하지 않는다.
- [ ] `node --test tests/*.test.mjs`, 새 native 저장/연결 시험과 기존 `desktop-life-executor.tests.ps1`, `desktop-life-journal.tests.ps1`, `desktop-life-quantity.tests.ps1`, `desktop-life-actions-bridge.tests.ps1`를 실행한다. 모두 합성 루트/IO인지 먼저 확인한다.
- [ ] 새 브라우저2개와 기존 craft-goal/list-progress/final-reservation/goal-workbench/prerequisite-quantity/edit-during-action/guided-flow/quantity/release-lock·현재 floating save-strip/save-overlay를 직렬 실행한다. 패키지 경로는 실행 환경의 설치 경로를 인자로 주고 개인 경로를 시험 소스에 새로 하드코딩하지 않는다.
- [ ] scoped ESLint, 환경 파일을 복사하지 않는 `node tests/iris-isolated-build.mjs`, 생성된 격리 폴더에서 별도 `tsc --noEmit --incremental false`, `git diff --check`를 실행한다. 프로젝트 빌드가 타입 검사를 생략하므로 별도 tsc 결과가 필요하다.
- [ ] 기존 IRIS 탐색/잠금 가정 시험 및 버스 lint의 알려진 실패는 같은 기준 소스와 비교해 명시한다. 전체 PASS를 허위 보고하지 않는다. 실제 게임 성공/공개 설치본 적용과 분리한다.
- [ ] 기존 개인/1차 수정의 해시·삭제 상태와 staged diff·비밀정보/실데이터 제외를 확인한다. 승인 없는 commit/push 없이 한설에게 결과·남은 위험·정확한 미전송 범위를 보고한다.

## 장기 보존의 구현/보류 경계

기존 원장 정리 정책을 변경하지 않고 최소 종료 증거를 요청당1개 보존하는 것까지만2차 후보에 넣는다. 활성/보류 목표의 필수 기록은 자동 정리하지 않고 기존 총량 한도로 통제한다. 사용자 확인으로 복구 가능한 것은 수량 진술·과거 확인 이력/보류 표시이며 실행 종료·비용·소유권·unknown 해제·자동 실행 허가가 아니다.

원장 누락 뒤 새로운 검토 진술을 저장하는 별도 UX, 증거만으로 활성 목표를 재개시키는 새 정책, 원장 pinning, 기록 아카이브/삭제·다른 PC 이동은 이번3단계 범위에 넣지 않는다. 기본 N08 차단을 완화하려면 다시 승인받는다.

## 1차 시작을 위한 최소 승인 제안과 위험

**최소 범위:** Task 1·2의 신규5파일 및 합성 테스트만. 기존 실행기/bridge/UI/보호 원장/숙제 저장 파일 변경0. Store를 실제 앱에 연결하지 않으며 실제 사용자 파일/CLI/DB 접근0.

**위험과 완화:** 원자 교체·ACK 유실→고장 주입/새 인스턴스 확인; 중복·정정→request별 최신값+operationId/CAS; 저장 한도→종료 슬롯 예약/실행 전 차단; 스키마/복구→원본 보존·미지원 차단; 도메인 시험을 실제 종료 검증으로 오인→실제 증거 권위는2차까지 미연결로 보고.

1차만 승인해도2차/3차나 실제 게임·전송 승인은 생기지 않는다. 사용량과 인터페이스 연속성을 고려하면 **영겁이 현재 대화에서 직접 단계별 실행**하는 방식을 권장한다. 본 계획을 검토하고1차 시작과 실행 방식을 확인받기 전에는 구현하지 않는다.
