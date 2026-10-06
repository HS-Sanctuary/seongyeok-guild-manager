# IRIS Processing Grid Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans.

**Goal:** 6가지 시설을3×2로 읽기 표시하고 완료 개수 비율/남은 시간을 구분한다.
**Architecture:** existing reader allowlist unchanged; facility normalization adds total/remainingSeconds. SnapshotDisplay exposes six rows/counts; ModuleWindow optional six-field grid uses same recovery/positions/lifetime.
**Tech Stack:** node:test, C#/WinForms, PowerShell.
**Spec:** docs/superpowers/specs/2026-10-03-iris-processing-grid-design.md

## Global Constraints
- 읽기 전용, 개인정보/DisplayName 미전송, 시간 퍼센트 추정 금지.
- 조회 실패/연결 끊김은 기존 값 제거, 가공 없는 정상 응답과 구분.
- dirty checkout 유지, commit/push 없음.

## Review Focus
- 누락/잘못된 remainingSeconds는 시간 미상, null을0으로 만들지 않음.
- 시설명 미확인은 다른 시설로 합치지 않음.
- malformed count는 게이지0과 명시 미확인, 이전 값 제거.
- 3열 위젯 확장/축소 뒤 expanded bounds 화면 보정.
- 센터6테마 적용은 ProgressBar·새 label과 충돌하지 않음.

### Task 1: normalized facility queue
Files: iris/reader.mjs + reader.test.mjs; overlay-support.cs + overlay-support.tests.ps1.
Interfaces: facility.total int; facility.remainingSeconds null|number; SnapshotDisplay ProcessingValues string[6], ProcessingCompleted/ProcessingTotal int[6].
- [x] RED test per-facility total and earliest positive remaining; no name/private leakage.
- [x] RED C# test fixed category map, count/time formatting, failed/cleared rows.
- [x] Implement and run node --test.

### Task 2: 3×2 native grid
Files: overlay-modules.cs, overlay.ps1, overlay-support.tests.ps1.
Interface: ModuleWindow(title,fields,owner,bool grid); SetProcessing(values,completed,total).
- [x] RED real control layout/gauge bounds, collapse/restore, missing count clears gauge.
- [x] Implement grid430×240 with six cells; actual shared timer uses six-field processing module and SnapshotDisplay rows/counts; timer fixture updated to real grid with 1/3→33%→disconnect0.
- [x] Full node suite93/93/diff + fresh reviewer; record live rendering unchecked.

## Ledger
- Ruling: do not add an inactive/fake collect button; explicit game-action boundary is a separate plan. No game write is executed.
- Pre-flight: Task2 consumes Task1 exact arrays, existing SetValues(null) also clears grid gauges.
- Task1 complete: reader test RED missing total/time→GREEN; C# rows missing→GREEN.
- Task2 complete: missing constructor RED→grid/gauges GREEN; full91/91 then added malformed-list and unicode whitespace RED→GREEN full93/93.
- Final review: processing_review static review; independent runtime unavailable due System.Web.Extensions.dll resolution, parent actually ran C# compilation/fullsuite. No operating game or DB interaction.
- Final: fixed malformed dictionary list misreported idle — IList requirement RED→GREEN. Added actual timer six-grid integration.
- Final: Ruling: reviewer labeled whitespace mismatch Minor; regraded Important because active processing can be falsely shown as idle, not merely cosmetic. Fixed tab/NBSP case RED→Regex whitespace→GREEN. Cost if wrong: permissive whitespace normalization only, no cross-category mapping.
- Final: Ruling: real game/DPI/font/6theme visual quality deferred — no native UI automation surface and user away; manually verify after restart, do not claim complete. Cost if wrong: rendering/recovery follow-up needed.
- Ruling: PS test file is UTF8 without BOM; Korean fixture literals caused parser error in Windows PowerShell default encoding. Replaced test literals with Unicode codepoints before proper RED run; product script retains existing encoding. No weakening of fixture/expected behavior.

## Follow-up: individual capsules (user requested)

- Task follow-up complete: ProcessingSlots type absence RED→GREEN, 7 total/5 complete produces7 slots with5bright2dim. Bounded14slot render, explicit remaining count for largerqueues, no fake extra slots. Synthetic bitmap verifies2 bright/1dim/no4th.
- Fresh node --test95/95 and diff-check pass. slots_review read-only static verdict Critical/Important none, did not independently rerun tests.
- Final: minor (deferred): fixedorange/alpha80 waitingcapsules need brighttheme visual contrast check.
- Final: minor (deferred): >14 countsummary replaces remaining-time secondline; exacttotal is retained and documented.
- Ruling: reviewer deferred actual liveUI/gameactions/environment/auth — these remain unimplemented or unverified and not partofcapsulefeature; cost ifwrong is usability followup, never claim allautomationcomplete.
