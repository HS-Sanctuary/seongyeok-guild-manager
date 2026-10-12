# IRIS 설치 글꼴 자동 목록 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after user plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 각 PC의 설치 글꼴을 검색·선택하고 새로고침할 수 있게 한다.
**Architecture:** 네이티브는 이름만 비동기로 읽고 실행 중 캐시한다. 고정 WebView bridge로 제한된 목록을 전달하며 설정은 기존 로컬 키를 사용한다. 구 native/조회 실패는 기존 글꼴 설정과 직접입력을 보존한다.
**Tech Stack:** .NET Framework/WinForms InstalledFontCollection, WebView2, TypeScript/React.
**Spec:** `docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md` §0.

## Global Constraints

- 목록 최대2048개, 이름80자, 제어문자/경로/외부 URL 없음. 최초 필요 시1회, 새로고침만 재열거.
- 6~22pt/기존18·20·22px와 환경별 로컬 설정 유지. 다운로드/설치/DB·웹전역 설정 변경 없음.
- 기존 사용자 dirty·버전/패키지 보존, push/운영 배포 별도 승인.

## Review Focus

1. 오래된 native는 자동목록 실패를 표시하지만 기존 글꼴을 지우지 않는다.
2. 반복 settings mount는 동일 캐시를 쓰고 새로고침 연타는 단일 진행이다.
3. malformed/과대 이름·응답은 안전 실패, 검색어가 CSS/파일 입력이 되지 않는다.
4. epoch 변경/문서 이동 뒤 늦은 목록은 UI를 갱신하지 않는다.
5. 큰 글자·긴 이름·빈 검색은 읽을 수 있으며 Escape/바깥 클릭으로 닫힌다.

### Task 1: 네이티브 캐시·고정 목록 bridge

**Files:** Create `iris/desktop-fonts.cs`, `iris/desktop-fonts.tests.ps1`; Modify `iris/desktop-bridge.cs`, `iris/desktop-webview.cs`, `iris/desktop.ps1`, `iris/build-beta.ps1`, `iris/desktop-grip.tests.ps1`, `iris/desktop-webview.tests.ps1`, `iris/desktop-startup-close.tests.ps1`; Test `iris/desktop-bridge.tests.ps1`.
**Interfaces:** `DesktopInstalledFonts.ReadAsync(bool refresh):Task<object>` → `{fonts:string[]}`. `DesktopBridge.BindFonts(Func<bool,Task<object>> read)`. Methods `window.fonts.list` and `window.fonts.refresh`, payload null only. Async result validates epoch without sharing/clearing gameBusy; duplicate font reads are guarded independently.

- [ ] RED: injected OS enumeration count is1 after two normal reads,2 after refresh; duplicate/oversized/unsafe names filtered or fail boundedly. Foreign source/extra payload/stale epoch never invokes enumeration; pending result after Revoke is rejected.
- [ ] Run `powershell -NoProfile -STA -ExecutionPolicy Bypass -File iris/desktop-fonts.tests.ps1` and bridge tests; observe missing API/behavior failure.
- [ ] Implement cached sorted names using InstalledFontCollection, dispose collection/family resources, hold strings only. Bind read callback to host and update every host source inclusion list without publishing a ZIP.
- [ ] Re-run fonts/bridge/grip/WebView/startup-close tests; expected PASS with no real game or font installation.
- [ ] Review diff and stage only this task's owned files if committing; do not stage unrelated dirty. Commit label: `feat(iris): read cached installed font names`.

### Task 2: 검색 가능한 테마 글꼴 선택

**Files:** Create `components/iris/DesktopFontPicker.tsx`, `components/iris/useDesktopFonts.ts`, `tests/iris-installed-fonts.test.mjs`, `tests/iris-installed-fonts.browser.mjs`; Modify `lib/irisDesktopStore.ts`, `components/iris/DesktopAddonSettings.tsx`, `app/iris/desktop/page.tsx`, `app/iris/desktop/desktop.css`, `tests/iris-window-appearance.browser.mjs`.
**Interfaces:** store `fonts():Promise<string[]>`, `refreshFonts():Promise<string[]>` validates exact `{fonts}`. Hook `useDesktopFonts(store,environment,active)` → `{fonts,busy,error,refresh}`. Picker consumes that result plus `value:string`, `onChoose(name:string):boolean`; emits no network writes.

- [ ] RED: fixed bridge methods reject malformed/foreign replies; settings open/reopen sends one read; refresh single-flight. Browser search selects actual supplied name, preserves reload/6~22pt and input fallback; empty/long result, keyboard/Escape/outside dismissal, stale epoch and blocked storage cases.
- [ ] Run `node --test tests/iris-installed-fonts.test.mjs tests/iris-appearance.test.mjs`; expected new behavior fails before implementation.
- [ ] Implement controlled combobox/listbox with local search, bounded scroll and theme variables; keep manual fallback. Root page owns cache lifetime so settings remount cannot poll OS.
- [ ] Run related Node/actual-page synthetic browser, `npx tsc --noEmit`, targeted ESLint and `git diff --check`; all PASS. No actual server/game writes.
- [ ] Inspect screenshot at360/390px and6/13.5/22pt. Review own diff/optional scoped commit `feat(iris): choose installed local fonts`; update HANDOFF/relay with measured results.
