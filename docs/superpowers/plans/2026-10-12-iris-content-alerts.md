# IRIS 콘텐츠 알림·소리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after user plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 크로노스 알림에서4종 출현/제보·기본ON 알림/소리·제보를 제공한다.
**Architecture:** 생텀 홈의 시간 계산을 공통 순수 함수로 분리, 앱 단일 owner가 제보 subscription과 로컬 timer/경고 dedupe를 관리한다. 실제 제보는 기존 API, 소리는 제한된 네이티브 자체 벨을 쓴다.
**Tech Stack:** React/TypeScript, existing Supabase read/Realtime + `/api/reports`, WinForms SoundPlayer.
**Spec:** `docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md` §2.

## Global Constraints

- 필드보스12/15/18/20/22시·2분 전·30분 활성; 결계매시00분 임박/02~04분 활성; 승인 어비스2분 전/15분 활성. KST.
- 심층00/30은제보초기화, 어비스36시간15분 기본은예상. 확정 출현으로 단정하지 않는다.
- 각콘텐츠 `{enabled:boolean,sound:boolean}` 기본둘다true; 알림OFF이면소리0. 로컬환경별 저장, 외부음원·OS볼륨 변경0.
- 같은경고1회/소리1회, 동시modal금지/늦은과거알림몰아띄움금지; 매초DB조회0. 새Schema/RLS·실제시험제보0.

## Review Focus

1. 시간대·자정·경계119초 등 기존홈 숫자와 phase가 바뀌지 않는다.
2. pending/rejected/expired/없는제보는 승인 출현으로 울리지 않는다.
3. initial/reconnect/계정·캐릭터변경·중복event가 옛 알림을 재생하지 않는다.
4. 알림OFF·soundOFF·저장차단/다른modal중에 의도치 않은 소리/중복창 없음.
5. 제보 응답유실/구독실패·구native 소리실패는 안내와 기존설정/다른기능을 보존한다.

### Task 1: 공통 시간·로컬 설정·경고 정책

**Files:** Create `lib/sanctumEventTimes.ts`, `lib/irisContentAlerts.ts`, `tests/sanctum-event-times.test.mjs`, `tests/iris-content-alerts.test.mjs`; Modify `app/page.tsx` only existing timer calculation.
**Interfaces:** `calculateSanctumEvents(nowMs:number,approvedReports:AbyssReport[])` returns fieldBoss/barrier/abyss phases and next deep reset. Preserve existing display units/default-cycle math. `IrisAlertSettings` maps fieldBoss/barrier/abyss/deep to `{enabled,sound}`. `createContentAlertTracker(now:number)` processes stable event `{key,type,at,phase,confirmed}` and yields deduplicated eligible alerts.

- [ ] RED: KST boss11:58→imminent/12:00→active/12:30→waiting, barrier00:00→119sec/02:00→active/04:00→waiting, abyss approved2min/15min expiry; pending/default not confirmed. Deep period00/30 boundary only resets. Corrupt storage fallback/no overwrite·all defaultON·off/old/duplicate events0.
- [ ] Run both new Node tests; expected missing functions failure.
- [ ] Implement pure calculations and bounded settings validation/storage; update home to consume shared calculations without changing rendering/API/DB.
- [ ] Run new+existinghome/IRIS tests/tsc; expected PASS, no DB work from tick.
- [ ] Review own diff/optional commit `feat(iris): share content alert timing and preferences`.

### Task 2: 4개 카드·단일 알림창·기존 제보·벨 소리

**Files:** Create `components/iris/DesktopContentAlerts.tsx`, `components/iris/useDesktopContentAlerts.ts`, `components/iris/DesktopContentReport.tsx`, `iris/desktop-alert-sound.cs`, `iris/desktop-alert-sound.tests.ps1`, `tests/iris-content-alerts.browser.mjs`; Modify page/Center/FeaturePicker/CSS/store/bridge/webview/host source lists.
**Interfaces:** hook owner `(accountId,environment,blocked)` returns reports/events/settings/setSettings/refresh/error/nextAlert/dismiss. One app-level owner, no per-tab duplicate subscription. Native `DesktopAlertSound.Play():bool`, bridge `BindAlertSound(Func<bool> play)` and `window.alert.sound` payload null only. Fixed tone <1sec, rate limit2sec, no supplied media/volume/path. store `playAlertSound():Promise<void>`.

- [ ] RED: eighth '알림' visible; 4SVG cards/toggles defaultON; disabledalert sends no sound, soundOFF stillshowsmodal. Actual shared modal queued while anotherdialog exists, stable ID once, account/logout/late response isolation. Existing reports POST exact deep zone/count0~3 or abyssminutes pending; foreignsession/duplicate/unknown noauto repeat. Native wrong payload/stale epoch/rate spam rejected; WAV/sink test silent.
- [ ] Run new browser/native tests before implementation and observe failure.
- [ ] Check current Supabase docs/changelog per skill before wiring existing client. Query initial bounded columns/subscribe once to existing tables, clean up channels/late results; local timer only. Reuse known zones/approved-report rules and SVGs. Existing cookie-authenticated `/api/reports` only on explicit submit; label outcomes truthfully. Use existing FocusDialog and compact panel-height synchronization. Build owned short bell in memory/SoundPlayer with disposal, no external assets.
- [ ] Run synthetic browserclock/report/IO tests and native bridge/audio tests; no audible test playback/no live report. Verify clear failure status, readback/manual retry after unknown submission, missing native sound leaves modal intact.
- [ ] Inspect capture, relatedregressions/diff/optional commit `feat(iris): add configurable content alerts and chime`. Sound defaults documented asON; user can mute percontent.
