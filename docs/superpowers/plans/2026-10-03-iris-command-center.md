# IRIS Command Center Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox tracking.

**Goal:** 안전하게 숨기고 복구하는 관리창, 확인 종료와 로컬 표시 설정을 제공한다.
**Architecture:** 기존 단일 shortcut owner/공유 timer를 유지한다. PowerShell의 사용자 종료 경계와 C# 표시 설정 allowlist를 별도로 테스트한다.
**Tech Stack:** Windows PowerShell STA, WinForms, C#, node:test.
**Spec:** docs/superpowers/specs/2026-10-03-iris-command-center-design.md

## Global Constraints
- ×는 숨기기, 전체 종료 기본 응답 No, OS 종료는 막지 않는다.
- 불투명도 40~100%, 표시 설정만 저장한다.
- 기존 미커밋 작업 유지, commit/push/운영 변경 없음.

## Review Focus
- 센터만 숨겨도 다른 창 갱신 유지: 실제 함수 호출로 modes.Hidden=false 검사.
- 종료 취소/재진입: false 응답 및 중첩 확인에서 닫기 0회 검사.
- 손상 설정: 잘못된 테마/범위/형식 거절.
- 트레이 및 단축키 복구: 동일 복구 함수 연결 검토와 수동 확인.
- 밝은 테마 대비: 실제 생텀 색 토큰 사용 및 6테마 직접 확인 대기.

### Task 1: center close safety
Files: iris/overlay.ps1, iris/overlay-support.tests.ps1.
Interfaces: Hide-IrisCommandCenter(), Confirm-IrisExit()->bool, Request-IrisExit(), Handle-IrisClosing(sender,event).
- [x] Actual AST function tests: hide releases capture without global hide; false confirm leaves open; true confirm closes once; UserClosing cancels unless exitConfirmed.
- [x] Run node --test iris/overlay.test.mjs: RED missing three functions observed.
- [x] Implement and route both exit buttons through Request-IrisExit; center × hides; shortcut restores hidden center first.
- [x] Rerun green suite: 26/26.

### Task 2: display settings
Files: iris/overlay-support.cs, iris/overlay.ps1, iris/overlay-support.tests.ps1.
Interfaces: Iris.DisplayPreferences.Parse/Save, Theme string + OpacityPercent int; Apply-IrisAppearance().
- [x] Test invalid inputs, roundtrip ignores extra secrets; all real module Opacity and palette application.
- [x] Run RED missing DisplayPreferences/Apply-IrisAppearance, implement allowlist + atomic write and theme/opacity controls, run GREEN 28/28.
- [x] Run full node suite 88/88 + git diff --check; fresh reviewer; document exact unfinished features.

## Ledger
- Ruling: existing dirty checkout continued per user's explicit continuous local implementation request; do not auto-commit or create a checkout missing dependencies.
- Ruling: focus this plan on safety/display settings; other large integrations need their own authorization/data boundary/testable plans, not non-working placeholder controls.
- Pre-flight: task 2 consumes task 1's center lifecycle without altering poller/selection. No conflicting interface.
- Task 1 complete: AST behavior tests RED→GREEN 26/26, no commits per current authorization.
- Task 2 complete: two behavior tests RED→GREEN 28/28, full node --test88/88. Fresh reviewer center_review independently ran28/28, Critical/Important none.
- Final: minor (deferred): appearance test named readable proves distinct colors/application, not visual contrast; actual palette values verified from globals.css, future contrast tests and live review remain.
- Final: Ruling: reviewer deferred live modal shortcuts/tray/theme contrast — manual verification needed because native UI control unavailable, do not claim verified; cost if wrong: recovery/contrast usability needs follow-up.
- Final: Ruling: reviewer deferred other integrations and existing base redesign — separate roadmap/known unchanged boundaries, not implemented by this plan; cost if wrong: delayed features rather than hidden placeholder controls.
