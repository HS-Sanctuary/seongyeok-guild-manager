# IRIS Compact Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. User previously selected inline execution in the current checkout; do not spawn implementers or create a worktree automatically.

**Goal:** Make the authenticated IRIS center a compact, recoverable game overlay without replacing the existing protected homework save engine.

**Architecture:** Reuse DesktopController/Queue/Transport/Store and the existing dedicated WebView2 profile. A pure presentation projection supplies compact status; a React shell supplies narrow single-panel interaction; a native overlay coordinator owns window policy/hotkeys and exposes only bounded bridge methods. This is phase1 of the approved spec; phase2 stats persistence requires a separate contract-grounded plan after Task5 investigation.

**Tech Stack:** Next.js16.2.10, React19.2.4, TypeScript, Tailwind CSSv4, Windows PowerShell/WinForms, pinned project-local WebView2 SDK1.0.4258.31.

**Spec:** `docs/superpowers/specs/2026-10-06-iris-compact-overlay-stats-design.md` (user approved written spec 2026-10-06).

## Global Constraints

- Preserve current checkout/uncommitted changes, session profile and protected homework queue. No commit/push/deployment, operational DB mutation/schema/RLS change, secret/cookie extraction, game actions or OS installation.
- One process/queue/hotkey owner; retain the legacy execution lock and rollback path. Do not start both launchers.
- Last user operation/character leave after15seconds; manual save/discard; account isolation; KST06/Monday06 homework periods remain unchanged.
- Ctrl+Alt+I visibility; Ctrl+Alt+O click-through. Disable click-through if both shortcuts cannot be acquired; tray must recover interactive state.
- Native candidate width320~480px, height constrained to working area; 6themes, rem font scaling, full12-character nicknames, stable DOM/focus/scroll/collapse.
- Only phase1 UI/native behavior may be implemented from this plan. Stats write authorization does not override missing identity/field support. No invented game fields or fabricated Synaxis data.
- Checkpoint each task by tests/diff/ledger rather than unauthorized commits. Do not restart or forcibly terminate the user's running app or erase pending changes.

## Review Focus

1. Child WebView HWND still receives clicks despite parent style changes: Task3 must prove underlying synthetic target receives the click.
2. User editing auth code/save dialog loses input during a background update or click-through toggle: Tasks2/4 assert focus and recovery, never log code.
3. Unknown/conflicting work is hidden by summary/remaining filter: Tasks1/2 keep paused work discoverable and recovery actions reachable.
4. Changing monitor/DPI restores a window offscreen or with clipped controls: Tasks3/4 clamp bounds and verify320/390px/layout visibility.
5. Native reload/handle recreation leaves stale bridge commands or competing shortcuts active: Tasks3/4 assert epoch rejection and owner release/reacquisition.

## File Map

- Create `lib/irisDesktopPresentation.ts`: pure status projection, no IO/auth/store changes.
- Modify `components/iris/DesktopSaveStatus.tsx`: summary and expandable named recovery rows; preserve close dialog.
- Create `components/iris/DesktopCenter.tsx`: compact tab/character shell and local preferences; no independent save timer.
- Modify `components/iris/DesktopCheckboard.tsx`: single-column label/checkbox rows, compact repeated counters, remaining filter.
- Modify `app/iris/desktop/page.tsx`, `app/iris/desktop/desktop.css`: wire shell around unchanged controller and six-theme tokens.
- Create `iris/desktop-overlay.cs`: native policy/coordinator, hotkeys/position/input recovery.
- Modify `iris/desktop-webview.cs`, `iris/desktop-bridge.cs`, `iris/desktop.ps1`, `lib/irisDesktopStore.ts`: attach bounded overlay controls/tray; preserve origin/epoch/durability.
- Tests follow existing `tests/load-ts.mjs`, synthetic browser script and native `.tests.ps1` fixtures. Do not add third-party dependencies.

### Task 1: Named compact save projection

**Files:** create presentation helper; modify SaveStatus; create `tests/iris-desktop-presentation.test.mjs`; update UI/browser tests.

**Interfaces:** consumes `PendingEdit[]`, `DesktopCharacter[]`, selected `DesktopDetails|null`, now milliseconds. Produces `summarizeDesktopEdits(entries,characters,selected,now): {groups: Array<{characterId:string,nickname:string,count:number,remainingSeconds:number|null,phase:string}>,items:Array<{requestId:string,characterId:string,taskName:string,phase:string}>,total:number}`. Unknown names use `캐릭터 확인 필요`/`항목 확인 필요`, never pretend an internal ID is a nickname. Priority unknown/conflict/expired before inflight/pending; pending deadline is the nearest per-character deadline.

- [ ] Write `groups same-character edits once and exposes paused rows` with five edits for character84/name화연: one group count5, deadline7000 at now0→7seconds, unknown item reachable; no raw ID in visible markup. Assert another account is absent after caller filtering and missing name produces the explicit fallback.
- [ ] Run `node --test tests/iris-desktop-presentation.test.mjs tests/iris-desktop-ui.test.mjs`; new behavior must fail before implementation.
- [ ] Implement projection and update SaveStatus props with `characters`/`selected`; keep existing manual buttons, 15초 explanation in a small expandable help area, per-request recovery semantics unchanged. Show one status line per character, details expand only on request/error.
- [ ] Run those tests and browser check; check empty/pending/inflight/unknown/conflict/expired, now beyond deadline→0, multiple characters, full nickname and no repeated status blocks.
- [ ] Review diff and append evidence/ruling to `.superpowers/sdd/2026-10-06-iris-compact-overlay/progress.md`; do not commit.

### Task 2: Compact single-panel center

**Files:** Center, Checkboard, page/css; `tests/iris-desktop-ui.test.mjs`, `tests/iris-desktop-ui.browser.mjs`.

**Interfaces:** `DesktopCenter({account,characters,selected,pending,locked,saveStatus,accountPanel,onSelectCharacter,onEdit})`, values reuse existing transport/queue types; `saveStatus`/`accountPanel` are ReactNode. Local tab union `homework|stats|synaxis|settings`. Extend Checkboard with `remainingOnly?:boolean`; reuse `desktopRows` and stable task keys. No second controller/store instance.

- [ ] Write browser scenarios `one compact pane and one-click homework edit`: selected character button opens the character list; selecting closes it; category label preserves collapse; clicking check row/Space causes exactly one logical toggle, clicking checkbox does not double-toggle; repeated +/- stays separately focusable.
- [ ] Add `remaining filter preserves paused recoverability`: completed rows hidden only by explicit filter; paused/error entries stay visible in save status. Existing optimistic rows/limits/late acknowledgments remain covered.
- [ ] Run new browser scenario against old UI and record expected failing interaction; do not assert only source/class names.
- [ ] Implement narrow header/character picker, one visible tab panel, compact1column checklist. Put saved class levels in an expandable homework section. Stats/Synaxis panes explicitly say game/status integration is unavailable at this phase rather than inventing data. Settings reuses auth controls and6theme selection; keep read-only retry and storage-failure exit accessible.
- [ ] Run `node --test tests/iris-desktop-ui.test.mjs tests/iris-desktop-controller.test.mjs tests/iris-desktop-presentation.test.mjs`, `npx tsc --noEmit`, then `node tests/iris-desktop-ui.browser.mjs C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json`. Browser requests are synthetic/intercepted;72width/font/theme cases, external abort, errors0, stable focus/DOM/scroll/collapse, outside/Escape settings dismissal.
- [ ] Record screenshots/evidence in ignored ledger directory, checkpoint diff. Layout change does not imply native overlay complete.

### Task 3: Recoverable native overlay owner

**Files:** overlay coordinator, native WebView/bridge/launcher, store client; create `iris/desktop-overlay.tests.ps1` and synthetic `iris/desktop-overlay.fixture.cs`; extend bridge/store tests.

**Interfaces:** `DesktopOverlayCoordinator(Form window, Control browser)` owns IDisposable hotkeys, emits `StateChanged`, exposes `SetClickThrough(bool):bool`, `SetOpacityPercent(int):bool`, `RestoreInteractive():void`, `ToggleVisibility():void`, `ClampBounds(Rectangle requested,Rectangle workingArea):Rectangle`, and bounded state `{clickThrough,shortcutsAvailable,opacityPercent}`. `DesktopWebView` creates/disposes it on owner UI thread. Reuse existing shortcut registry policy rather than duplicate hotkey IDs.

Bridge additions only: `overlay.state` null payload; `overlay.input` payload `{clickThrough:boolean}`; `overlay.opacity` payload `{percent:integer}` restricted50~100. Typed client methods `overlayState()`, `setClickThrough(enabled:boolean)`, `setOpacityPercent(percent:number)` share existing message IDs/epoch and no generic invocation. Drag/resize stays native/client-area system hit testing, not arbitrary bridge command execution.

- [ ] Write native tests for acquire both shortcuts or reject click-through, child HWND click routed to synthetic underlying window, restore tray/input, hide/show without queue reset, cleanup/handle recreation, clamped bounds at changed working areas, opacity50/100 accepted and49/101 rejected. Use only synthetic windows, not game inputs.
- [ ] Run `powershell -NoProfile -STA -File iris/desktop-overlay.tests.ps1`; expect RED missing coordinator or incorrect child click delivery. Existing bridge tests must reject additional methods before implementation.
- [ ] Implement coordinator, borderless compact default window, draggable header/system resize, TopMost, protected tray restore, settings bridge and truthful shortcut state. Non-input display must not steal focus; auth/edit mode may activate. If opacity/rounding conflicts with WebView rendering, leave that specific feature disabled with explanation, never sacrifice interaction/storage recovery.
- [ ] Run overlay/bridge/store/WebView/shared-lock native tests. Reject foreign origin/path/epoch, malformed payload, extra properties and out-of-range opacity. Failed command must not leave click-through enabled without recovery; dialog and tray remain usable.
- [ ] Checkpoint diff/ledger; retain legacy default until Task4 manual approval. No click/game process/window inspection in these automated tests.

### Task 4: Whole-candidate verification and user handoff

**Files:** browser/native fixtures as needed, `iris/README.md`, `iris/ARCHITECTURE.md`, `docs/HANDOFF.md`, `docs/BETA_FEEDBACK.md`, relevant master guide section. No public release note/post without deployment.

**Interfaces:** uses Tasks1~3. Native candidate remains `powershell -NoProfile -STA -File iris/desktop.ps1 -Development`; one owned process/profile/queue. Production remains unshipped.

- [ ] Add integration test preserving synthetic HttpOnly login and protected queue when hiding/restoring/toggling input/reloading; stale epoch cannot change overlay state. Closing with save/keep/unknown/error retains existing guarded flow.
- [ ] Run `node --test tests/*.test.mjs iris/*.test.mjs`, independent `npx tsc --noEmit`, synthetic browser and native overlay/store/bridge/WebView/lifecycle/shared-lock tests. Record all failures, including unrelated ones. Use safe separated build output/source snapshot if live dev server is still running; do not erase `.next` or force-stop user app.
- [ ] Review full changed diff for UI/controller coupling, duplicate timers, ownership/epoch leakage, protected storage and real child-window click behavior. Requesting a final fresh review follows the executing-plans policy; no automatic parallel implementers.
- [ ] Show local `/iris/desktop` candidate and ask user one step at a time: compact center, actual game-window overlay, shortcuts/click-through recovery, unchanged account,15second save/now save/web reflection. Developer does not enter credentials or operate game. DPI/monitor/opacity and game fullscreen limitations remain explicit where not tested.
- [ ] Update handoff/docs/ledger with automated vs manual results; preserve original launcher until acceptance, no commits/push. Mark phase1 complete only for gates actually passed.

### Task 5: Read-only stats contract gate for separate phase2 plan

**Files:** create `docs/IRIS_STATS_CONTRACT.md`; refer to `iris/reader.mjs`, `docs/SUPABASE_SCHEMA.md` and existing character/profile save paths without changing them.

**Interfaces:** outputs an evidence table for identity, CombatScore, LivingScore, AttractivenessScore, ArcaneResistance, guild contribution: exact official field/type/unit, current normalizer support, DB mapping, status `verified|unsupported|unverified`. No stats persistence code is produced by this task.

- [ ] Read official installed CLI documentation/capability contract without executing game actions or dumping private payloads. Verify exact character identity/all-character/guild-contribution support; absent support stays disabled. No guessed field mapping or game-mode change.
- [ ] Read existing schema/save paths under Supabase skill; map the four supported stats to existing columns and verify actual app number/updated-time semantics. Do not execute operational writes/SQL or fetch secrets.
- [ ] Document safe identity/epoch/freshness and schema1→versioned protected store strategy for phase2; explicitly preserve0/decreases, null/missing, owner checks, CAS races, partial success, timer non-starvation and restore-paused rules from spec.
- [ ] Self-review evidence, then write a separate phase2 implementation plan only for verified capabilities using writing-plans. If no reliable game identity exists, stats writes remain blocked and explain the missing contract to user; phase1 may proceed. A manually approved binding alternative requires revised written design, not silent weakening.

## Coverage / Approval

Spec1~4 and compact portion6→Tasks1~4. Spec5/7 plus stats portions6→Task5 investigation followed by separately reviewed phase2 plan. No claim that this first plan implements all stats storage. Spec8 manual/automation gates→Task4 and later phase2 tests.

Status 2026-10-06: user approved inline/current-folder execution and rounded button/accordion refinement. Tasks1~3 implemented and checkpointed by tests; Task4 automatic/native verification and final review in progress, actual game/DPI acceptance pending. Task5 contract evidence recorded in docs/IRIS_STATS_CONTRACT.md; no reliable game identity exists, so stats writes and a speculative phase2 implementation plan remain blocked. Ledger records exact commands and limitations; no commit/push/deployment.
