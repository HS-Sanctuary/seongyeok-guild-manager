# IRIS 축소바·둥근 창 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans after user plan review. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** □접기/펼치기·게임 전체화면 자동 축소·실제 둥근 모서리를 제공한다.
**Architecture:** 순수 presentation 상태와 Windows 배치를 분리한다. 기존 addon 상태 계약은 그대로 두고 별도 제한 presentation bridge를 사용한다. UI는 본문을 unmount하지 않고 축소/임시 패널을 제어한다.
**Tech Stack:** .NET Framework/WinForms window region, Win32 read-only game geometry, WebView2, React/CSS.
**Spec:** `docs/superpowers/specs/2026-10-12-iris-compact-alerts-character-design.md` §1.

## Global Constraints

- 수동360~720 폭/기존 최소화·바탕화면·같은 층/입력 초점 보존; 게임 창 조작 없음.
- 일반 메뉴는 상시 버튼, 축소만 임시 펼침. 원래 수동접힘/명시적 이동 존중.
- 추천·알림·계정·편집·종료 패널은 읽을 수 있는 임시 높이 확보. 새 DB/권한/배포 없음.

## Review Focus

1. 이미 수동 접힘이면 전체화면 복귀가 강제로 펼치지 않는다.
2. 전체화면에서 사용자가 □/드래그한 선택은 반복250ms 관측으로 덮어쓰지 않는다.
3. frame/권한/PID가 불명확하면 자동 축소·종료로 추정하지 않는다.
4. 모달/긴 폰트/낮은 모니터 높이에서 버튼이 네이티브 창 밖에 잘리지 않는다.
5. region 갱신은 모서리를 실제 잘라도 가운데 resize grip/초안·큐를 깨뜨리지 않는다.

### Task 1: presentation 상태·네이티브 배치·둥근 모서리

**Files:** Create `iris/desktop-presentation.cs`, `iris/desktop-presentation.tests.ps1`; Modify `iris/desktop-addon.cs`, `iris/desktop-webview.cs`, `iris/desktop-bridge.cs`, host source lists from font task; Test addon/grip/bridge scripts.
**Interfaces:** `DesktopPresentationState` owns `Compact`, `Automatic`, `PanelOpen`; methods `Toggle()`, `ObserveFullscreen(bool? active)`, `SetPanelOpen(bool open)`, `RecordManualMove()`. Persist manual compact choice separately as `{version:1,compact:bool}`. Bridge `window.presentation.state`/`toggle` payload null, `window.presentation.panel` payload `{open:bool}`, output exact `{compact,automatic,panelOpen}`. Event `window.presentation.changed` uses existing source/epoch/environment guard.

- [ ] RED: manual/automatic entry·exit, user override during fullscreen, null observation, repeated observations, manual position and separate persistence. Native compact height ignores game height; width/restored docking survives. Modal temporarily expands within work area and closes back. Rounded region excludes physical corners but includes center/edge grip at multiple sizes.
- [ ] Run new native tests and addon/grip/bridge; observe missing behavior failure.
- [ ] Implement IsZoomed/known monitor-filling frame detection without game writes. Enter auto state once, anchor game monitor corner unless moved; restore normal placement on exit. Compact/temporary-panel placements use own content height instead of normal game-height force. Rounded GraphicsPath window region is disposed/rebuilt on real size/DPI changes, radius bounded by size.
- [ ] Run presentation/addon/grip/bridge/WebView/startup-close; all PASS, including taskbar/desktop/focus/unknown process cases. Do not start a second user app.
- [ ] Inspect scoped diff/optional commit `feat(iris): add compact rounded addon window`; keep saved width/preferences/auth/queue formats unchanged.

### Task 2: □ 버튼·축소 본문·임시 펼침

**Files:** Create `components/iris/useDesktopPresentation.ts`, `tests/iris-compact-window.test.mjs`, `tests/iris-compact-window.browser.mjs`; Modify `lib/irisDesktopStore.ts`, `DesktopTitlebar.tsx`, `DesktopCenter.tsx`, `app/iris/desktop/page.tsx`, desktop.css, existing navigation browser fixtures.
**Interfaces:** `DesktopPresentation={compact:boolean;automatic:boolean;panelOpen:boolean}`; store `presentationState()`, `togglePresentation()`, `setPresentationPanel(open:boolean)` return that type. Hook exposes state/busy/error/toggle/panel synchronization. Titlebar consumes `compact:boolean`, optional `onToggleCompact()`, disabled for unsupported native. Center consumes `compact:boolean`, `onPanelOpenChange(open:boolean)`.

- [ ] RED: □ between −/×, toggles without minimize/close; unsupported native retains ordinary UI. Compact closed contains identity/tools/thin menus, feature click temporarily exposes selected pane; Escape/outside closes. Same feature reopen does not duplicate tab refresh. Draft53·pending homework remain through compact/settings/section/character modal transitions.
- [ ] Run new Node/browser tests; expected missing behavior failure.
- [ ] Implement hidden-body preservation, mutually exclusive temporary panel/dismissal, aggregate modal/temporary-panel state for native height (one owner, transition-only messages). Parse exact presentation replies/events and discard stale generations; existing addon event schema stays unchanged.
- [ ] Run synthetic browser360/390/720×6/13.5/22pt, short height and bright/dark themes; native/window return tests PASS, no horizontal overflow/one-character nickname columns.
- [ ] Review screenshot/diff/optional commit `feat(iris): fold addon panes without losing drafts`. Actual Windows game/maximize/corner checks are only after normal restart authorized by user.
