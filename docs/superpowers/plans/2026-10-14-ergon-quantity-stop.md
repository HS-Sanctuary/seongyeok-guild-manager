# ERGON 추가 수량·현재 채집 중지 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 추가 채집 수량을 감시하고 승인한 현재 채집을 실제로 중지하며 실행 화면을 간결하게 만든다.

**Architecture:** 기존 native executor/DPAPI 원장/nonce를 확장한다. 긴 채집 CLI와 분리된 제한 control 경로가 재고·활동을 확인하고 stop_action을 전송하며 원래 실행 응답까지 잠금을 유지한다. 구앱 응답 파서는 보존하고 새 capabilities가 있는 앱에만 수량 기능을 연다.

**Tech Stack:** .NET Framework C#, Windows WebView2, React, TypeScript, Node test, PowerShell synthetic fixtures.

**Spec:** docs/superpowers/specs/2026-10-13-ergon-quantity-stop-design.md (한설 2026-10-14 진행 승인, 직접 구현)

## Global Constraints

- A만 구현: 통나무 allowlist, 추가수량 1..100, 소비명령 1회/날개5. 자동 다음 소비명령 없음.
- stop_action 작업 ID 부재: 자동중지 별도 동의, 다른 앱/수동 행동 교체·미확인 상태에는 전송0. 정확 개수 보장 없음.
- 약1초 single-flight 감시, CLI 읽기8초/1MiB, stop 최대3회/10초; invalid_state만 새 활동 Stop에서 재시도.
- 요청ID/계정/캐릭터/epoch를 검사. 원래 perform 종료 즉시 inflight 해제, 후속조회 동안 늦은 stop 전송0.
- 기존 원장/미확정 보호와 개인 dirty 보존. 운영DB/공개ZIP/배포/추가실게임시험 없음.
- 기존 공유 작업폴더/기능브랜치 선호 유지. 새 승인 단계 없이 직접 구현; push는 사용자 체크포인트 지시에 따른 별도 마감.

## Review Focus

- perform 종료와 stop 전송 경합: 후속 재고조회 중 다른 게임 행동을 멈추지 않는다.
- 사용자 탭 왕복/숨김: 이미 승인한 목표감시는 native에서 유지된다.
- 잠긴/동명 다른분류/중복 재고: 0 또는 목표달성으로 해석하지 않는다.
- 읽기/중지 응답 불명: 자동중지와 다음 실행을 막고 원장을 보존한다.
- 구형 앱/원장: 읽기는 유지하되 새 수량 실행은 지원하지 않는다.

### Task 1: Native 목표 감시·중지와 보호 원장

**Files:** iris/desktop-life-policy.cs, desktop-life-executor.cs, desktop-life-cli.cs, desktop-life-journal.cs; new desktop-life-quantity.fixture.cs / desktop-life-quantity.tests.ps1; existing executor/CLI/journal tests.

**Interfaces:** PrepareAsync gathering intent optional additionalQuantity:number/allowAutoStop:boolean; StopAsync({requestId,accountId,characterId}); schema2 preview/current gathering:{additionalQuantity,beforeOwned,targetOwned,currentOwned,stopReason,stopState}; terminal stopped.

- [x] Write/run RED synthetic actor tests: 45+15→60; 61 yields16/extra1; scoped manual/auto stop; wrong account/ID0; completion/late stop0; unknown read/changed activity0; original CLI held→busy; stopped/unknown journal persistence.
- [x] Implement goal validation and strict Ingredient inventory reads; native monitor and independent bounded stop; fixed CLI StopAsync() with no caller command/body.
- [x] Add schema2 journal optional gathering metadata and stopped; preserve schema1/entropy/path/inflight recovery.
- [x] Run Windows PowerShell native quantity/executor/CLI/journal tests; all PASS, no live action CLI.

### Task 2: Typed bridge/client contracts

**Files:** iris/desktop-bridge.cs, iris/desktop-webview.cs, lib/irisErgonActions.ts, lib/irisDesktopStore.ts; tests/iris-ergon-actions.test.mjs, iris/desktop-life-actions-bridge.tests.ps1.

**Interfaces:** capabilities schema2 quantityGathering/currentStop; request game.life.actions.stop with scoped requestId; separate control busy from ordinary gameBusy; parsers accept old schema1 and strict new schema2.

- [x] Write/run RED: stop reachable during ordinary busy, foreign source/epoch/extra payload denied, client ID validation, malformed goal and unknown unblocked rejected.
- [x] Implement contracts; native final prompt includes additional target, initial stock, cost and auto-stop impact.
- [x] Run Node action tests and native bridge tests; all PASS.

### Task 3: Compact execution UI

**Files:** components/iris/DesktopErgonExecution.tsx, DesktopErgon.tsx, app/iris/desktop/desktop.css; new tests/iris-ergon-quantity.browser.mjs; existing action browser fixture.

**Interfaces:** new optional Api.stopLifeAction; capabilities return {quantityGathering,currentStop}; frozen current goal independent of draft edits.

- [x] Write/run RED real React fixture: quantity stepper/auto-stop consent, request payload, current progress/remaining; busy stop works; old capability disables quantity gathering; details collapsed. Overshoot covered by native fixture and UI derives same frozen goal; existing craft ABA and hidden gather native ownership checked.
- [x] Implement compact card and main action, preserve craft budget/deadline/ABA guards; remove obsolete native-unconnected preflight from connected execution view.
- [x] Run browser quantity + existing action fixture, 320/390/720px, themes/font checks; PASS/no overflow.

### Task 4: Integration and handoff

**Files:** specs status, HANDOFF, BETA_FEEDBACK, MASTER_GUID and relevant relay.

- [x] Run whole Node suite, independent tsc/lint, native tests and isolated build/package compile.
- [x] One fresh review of changed native/control/client/UI contracts; fix important findings with RED→GREEN.
- [x] Record actual evidence and remaining live-game validation; review scoped diff and preserve personal files. No production publish without separate approval.

## Execution ledger

- Baseline e5b4ed6; ff-only pull up-to-date. Node existing actions/run queue11/11 PASS.
- Ruling: preserve established shared feature checkout; unrelated dirty has no overlap with this task. Existing skill workspace scripts are shell-oriented, use equivalent scoped apply_patch ledger here.
- Interfaces preflight: Task1 schema2 gathering→Task2 strict parser→Task3 card; Task1 StopAsync→Task2 independent bridge→Task3 busy stop. Names and optional old-schema compatibility match.
- Plan self-review: A coverage complete; B recipe chain intentionally separate. User '진행하자' authorizes this implementation; no repeated approval gate.
- Task1 RED: new quantity prepare rejected life_invalid. GREEN: native quantity fixture + old executor/journal PASS. Additional RED reproduced revoked-document stop; fixed by frozen run epoch. Stop response race held until control response completes, terminal stopped durable.
- Task2 RED: quantity parsers rejected / stop API missing / ordinary busy stop denied. GREEN: Node actions7/7, native bridge PASS, independent tsc exit0.
- Task3 RED: real React missing quantity input (localhost initially sandbox blocked, allowed local retry). GREEN: quantity browser PASS, existing craft budget/menu/ABA/deadline regression PASS; 320/390/720 font widths no overflow.
- Ruling: preserve existing craft bounded queue quantity semantics in A; the final-product additional-quantity conversion belongs to B's recipe-chain contract. Changing it now would mix this current-gather stop fix with the separate dependency plan.
- Ruling: stop accepted receipt without an error means request acknowledged only. Terminal requires original CLI stopped/completed + stock/currency + idle activity; a stop response alone never completes the job. Official local capabilities returned game_off, so exact live response remains a required user-approved test.
- Final fresh review: Critical0/Important3/Minor1. Important race reproduced with completed original task while its continuation waits on state gate → retain task and check IsCompleted after journal IO immediately before stop. Important hidden/expired gather recovery reproduced → explicit 새 계획 reset. Important unknown inventory location reproduced → recognized-location validation (valid named-empty/storage-only0 preserved).
- Final re-grade: delayed stop UI response reproduces overwriting verified terminal progress. Important for truthful current-action UX → generation/request and observation-revision guard; real React RED reproduced before fix. No deferred minor remains.
- Final review declined to judge: actual game semantics/production behavior/build. Ruling: this is a local synthetic candidate; no live completion or public release claim. Isolated build exit0/58 pages separately verified, exact native/game result remains pending explicit test.
- Existing dry-run browser failed from incomplete old activity fixture (abyssSequence/interactionType/mainButtonState absent). Updated the fixture to the canonical complete response; unchanged production reader/preflight, retry PASS.
- Final tree: Node499/496PASS/3skip/0fail; independent tsc/lint exit0; native quantity (3-attempt invalid_state/accepted+error unknown/auto-off included), old actor/journal/CLI/bridge/reader/startup/grip22 PASS; real quantity/craft/dry-run browsers PASS; final isolated webpack58 exit0; native scratch EXE/ZIP compile exit0. Screenshot inspected as synthetic UI only.
- Finishing decision: keep existing feature branch and personal working files, local scoped commit only. No merge/publish/push until existing user checkpoint condition or separate request. Normal developer IRIS started only after page+6scripts HTTP200; real game action0 and user-screen confirmation pending.
