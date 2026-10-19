# IRIS floating dialogs and workspace repair

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Execute inline under the user's standing request to continue without confirmation gates.

**Goal:** Confirmation dialogs never force IRIS out of floating mode; ERGON's explicit wide-workspace control works from floating mode.

**Architecture:** Keep native mode, anchor and selected module separate from a temporary modal input region. Use the existing shared focus dialog for all desktop confirmations and position its body portal within the native panel. Expand the floating panel, rather than leaving floating mode, for ERGON's wide workspace.

**Tech Stack:** React/TypeScript, WinForms/WebView2, synthetic Playwright/native fixtures.

**Spec:** Latest two user reports in this chat (2026-10-18): stats update confirmation must preserve floating; wide workspace button must work when invoked from floating.

## Global constraints

- Work in current checkout per explicit user choice; preserve all previous and personal dirty files.
- No real DB write, game action, release, public ZIP, push, forced restart, or automatic confirmation.
- Preserve busy/close protection, normal bounds, module state, focus trap, Escape/backdrop dismissal and keyboard accessibility.
- New native capability is optional; old native states remain parseable.

## Review focus

- Icon-only close/account dialogs receive a native hit region without revealing the old addon bar.
- Nested dialogs keep only the top dialog interactive and restore focus.
- Dialog clicks/Escape cannot also close the underlying floating module.
- Compact game bounds and changed DPI cannot clip the dialog's controls.
- Wide→small and mode transitions preserve normal bounds and never permit hidden/busy game operations.

### Task 1: Repair common floating modal lifecycle

**Files:** `lib/irisFloating.ts`, `lib/irisDesktopStore.ts`, `components/iris/useDesktopFloating.ts`, `DesktopFloatingHub.tsx`, `DesktopFocusDialog.tsx`, `focus-dialog.css`, `DesktopStatsConfirmation.tsx`, `DesktopCurrencyAppearance.tsx`, `DesktopSaveStatus.tsx`, `DesktopSynaxisSurface.tsx`, native floating host/bridge/webview, new browser test and existing native grip/parser tests.

**Interfaces:** Optional `FloatingState.dialogOpen:boolean`; validated internal `dialog-open`/`dialog-close` commands. Common dialog surface context supplies floating panel rectangle; native panel exists during modal even if surface is `none`. Existing public dialog callbacks and close-decision guard remain unchanged.

- [ ] Add behavioral parser/browser/native tests: real stats confirmation opens/cancels with mode/module retained, inside/backdrop/Escape behavior, nested account dialog, busy close, icon-only native close panel and restoration. Watch expected failures.
- [ ] Implement optional modal capability, serial native synchronization and shared modal positioning/focus handling. Migrate remaining desktop custom confirmations to shared FocusDialog without changing their business actions.
- [ ] Run focused browser, parser, bridge and native chrome regressions.

### Task 2: Repair floating wide workspace and finish

**Files:** `iris/desktop-webview.cs`, `iris/desktop-floating-host.cs`, `components/iris/DesktopErgon.tsx` (error copy only), `iris/desktop-grip.tests.ps1`, handoff/QA/feedback/decision documents.

**Interfaces:** Existing `setWorkspace(expanded:boolean):{expanded:boolean}`; floating preferred panel width `980` vs `420` DIP, constrained to game client. No API/schema change to ERGON.

- [ ] Add native owned-window test: ready visible floating ERGON expands beyond compact width, contracts, stays floating, retains anchor, and rejects expansion during close/hidden/unfinished startup. Watch expected failure.
- [ ] Implement native floating-aware width policy and preserve normal-window restoration across mode transitions. Replace obsolete smallbar-only error guidance.
- [ ] Run complete Node suite, independent typecheck, touched lint, relevant browser/native regressions and private compilation. Record any pre-existing failures explicitly.
- [ ] Obtain one fresh focused code review of this repair only, address important findings with RED→GREEN, and record handoff. Actual app validation requires normal restart if native changed; never force-close it.

Local commit/push deferred: no new push request; retain verified changes for user inspection and next official handoff.

### Task 3: Follow-up character bubble and opacity requests

**Spec addendum:** User asks to remove empty space below character choices, move “아니요, 직접 선택” to the left, enlarge the nickname, remove the black corner; manual character picker must remain floating. Separate normal/addon opacity from floating opacity.

**Interfaces:** Existing `window.floating.notice` gains optional bounded integer `height` (80..360 DIP). New host capability is co-shipped with optional dialogOpen; old hosts retain fixed bubble layout. Hub ResizeObserver measures notice content and sends size only when changed. Floating opacity applies to all floating surfaces, not only the collapsed logo; the normal/addon setting remains independent.

- [ ] Add RED behavioral tests for native bubble height/rounded hit region, actual initial recommendation action order/name sizing and independent module opacity.
- [ ] Implement measured bounded notification geometry, compact actions and explicit independent setting labels. Keep game identity recheck/manual-selection callbacks unchanged.
- [ ] Run relevant notice/character/settings, complete suites and fresh focused review alongside Tasks 1–2.
