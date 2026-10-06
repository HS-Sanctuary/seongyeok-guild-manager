# IRIS Overnight Implementation Plan

> **For agentic workers:** Use superpowers:executing-plans directly, sequentially. User requested autonomous progress without intermediate questions. Do not delegate or commit.

**Goal:** 안전한 커넥터 작업 기반과 정돈된 단일 센터를 로컬 구현한다.

**Architecture:** 게임 실행과 독립된 순수 메모리 큐를 먼저 검증한다. 기존 Windows 센터만 정돈하여 현재 위젯 진입을 유지한다. 지원되지 않은 기능은 명시적으로 남긴다.

**Tech Stack:** Node ESM/node:test, PowerShell, Windows Forms C#.

**Spec:** docs/superpowers/specs/2026-10-04-iris-overnight-design.md

## Global Constraints

- 2026-10-05 03:00 이후 새 구현 시작 금지. 00:27 한 번 재개 예약 iris-00-27.
- 실제 게임 명령/운영 DB 쓰기·구조·RLS·권한 변경/로그인 입력/비밀값/commit/push/배포 금지.
- 기존 dirty 보존, 자체 구현, 타 도구 코드·레시피·그림 복사 없음.
- 메모리 큐: 최대100 작업, 수량1~100, 최대3600초, freshness15초, 과적 상한50~95%.
- 기존 읽기/수정 동의와 CAS/GET 확인 경로는 유지.

## Review Focus

- 응답 잃음: claim된 작업 unknown, 재전송 없음.
- 중지 도중 응답: 아직 실행 중일 수 있으며 완료 전 새 claim 금지.
- 캐릭터 변경: 기존 작업 자동 실행 금지.
- snapshot 미래/오래됨/비정상 수치: 동작 거부.
- 반복 poll/빠른 클릭: 동일 job을 중복 claim하지 않음.

### Task 1: Pure automation queue

**Files:** Create iris/action-queue.mjs, iris/action-queue.test.mjs.
**Interfaces:** AutomationQueue({supportedCommands, now}); enqueue({kind,target,quantity}); start({characterKey,maxSeconds,inventoryLimit}); claim(snapshot); settle(id,status); stop(); snapshot(). No actual executor.

- [ ] Write tests for disabled defaults, unsupported input, bounds, serial claim, accepted vs complete, lost response, stop, expiry, inventory, identity, malformed snapshots.
- [ ] Run node --test iris/action-queue.test.mjs: expected missing constructor/function failure.
- [ ] Implement pure validation and finite-state queue; no subprocess or network.
- [ ] Run focused and whole node --test; expected all pass. Record exact results and limitations.

### Task 2: Center category layout

**Files:** Modify iris/overlay.ps1; Test iris/overlay-support.tests.ps1 and existing wrappers.
**Interfaces:** Existing modules[0..4], all handlers/appearance/shortcuts preserved.

- [ ] Read existing controller extraction tests. Add behavioral layout/restore test before modifying center.
- [ ] Run focused native tests, verify RED.
- [ ] Divide center into clear game widgets and Sanctum/Kronos group without new child centers; improve accessible names/spacing and theme contrast. No fake functional Synaxis/Gnosis controls.
- [ ] Native compile and synthesized render, focused + whole Node. Record real DPI unverified.

### Task 3: Next parity checkpoint

**Files:** docs/IRIS_AUTOMATION_PARITY.md, docs/HANDOFF.md, docs/relay/TO_SOONWOL.md.

- [ ] Review implemented versus UI-wired versus actual game-tested capability separately.
- [ ] Investigate current safe contracts for next facility collect adapter/Synaxis read; never execute game action or write DB.
- [ ] Add only a bounded implementation when source contract and tests are clear; otherwise record exact remaining interface without guessing.
- [ ] Final diff review and tests. Hand off before03:00. Delete once-only automation when it fires.

## Progress

1차 결과: Task1/2/4/5 구현과 RED→GREEN 검증 완료, Task3 읽기 조사·인계 완료. 전체178/178, tsc/대상lint/build/diff exit0. 실제 게임 실행/설정 모달/DB 저장 미검증. 체크리스트의 실행 상세는 .superpowers/sdd/2026-10-04-iris-overnight/progress.md와 HANDOFF 최신 절을 우선한다.

00:27 후속은 위젯 설정 조작 합성 검증/테마 가독성·가공 밀도 개선/본인 시낙시스 상태 읽기 설계·합성 테스트부터 계속한다. 새 구현은03시 이전에만 시작하며 운영DB·게임 명령 검증을 대신하지 않는다. 채집 임의 수량 및 낚시 자동중단은 지원 계약이 확보되기 전 실행 배선 금지.

### Task 5: CLI request/result contract (pure)

**Files:** iris/action-contract.mjs, iris/action-contract.test.mjs.
**Interfaces:** planAction(job,catalog,{now,maxWingCost}) returns ok/command/body/estimatedWingCost or reason. classifyActionResult(kind,response) returns completed/registered/running/stopped/blocked/failed/unknown only. No executor.

- [ ] RED gather100 vs unsupported20; exact catalog match/tool; process1; craft count/crafting unlock/produced count; collect completed DisplayName from selected facility; stale catalog/cost cap.
- [ ] Implement from verified CLI metadata. Names verbatim, no shell strings.
- [ ] RED accepted without final body, timeout/malformed and started registration vs production.
- [ ] Focused + full suite, source review. Actual game action remains unimplemented.

### Task 4: Per-widget opacity

**Files:** iris/overlay-support.cs WidgetDisplayPreferences; iris/overlay.ps1 appearance/dialog; iris/overlay-support.tests.ps1, iris/overlay-checkboard.tests.ps1.
**Interfaces:** WidgetDisplayPreferences.Parse(json), SetOpacity(id,percent), GetOpacity(id,fallback), Reset(), Save(path,preferences). Known ids center/stats/processing/missions/kronos/checkboard only. Defaults preserve global opacity.

- [ ] RED malformed/unknown keys/out-of-range, independent opacity/default fallback, reset and safe roundtrip; runtime Apply-IrisAppearance test with two widgets and distinct opacity.
- [ ] Implement allowlisted data class and startup parse; fixed default setting path widget-display-settings.json; no credentials/character data.
- [ ] Dialog target selector, all resets overrides, selected target persists only its value; 40~100% and cancel no effect.
- [ ] Whole Node/native compile, type and changed lint. Actual dialog/DPI remains user check.

- 21:xx: plan prepared; existing 161 tests from preceding task are historical baseline, not this run.
