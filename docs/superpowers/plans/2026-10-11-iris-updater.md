# IRIS Automatic Updater Implementation Plan

**Execution status (2026-10-11 KST):** 로컬 후보 구현·회귀 검증 완료. 세부 체크리스트의 실행/RED→GREEN 증거와 fresh reviewer2건 수정은 `.superpowers/sdd/2026-10-11-iris-updater/progress.md` 및 `docs/HANDOFF.md` 최신 항목에 기록했다. 공개 ZIP·버전·push·운영 배포 및 실제 사용자 앱 업그레이드는 아직 미실행이다. 아래 항목을 새 작업처럼 반복하지 않는다.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 native 버전이 있을 때만 버튼을 표시하고 사용자 클릭으로 보호 보관 후 내부 업데이트·재시작한다.
**Architecture:** 고정 metadata/ZIP native reader → 엄격한 패키지 검증 → 별도 helper 백업/교체/재시작. 웹은 경로/명령을 전달하지 않고 기존 종료·보호 큐를 사용한다.
**Tech Stack:** 기존 .NET Framework C#/WebView2, PowerShell 빌드, React/TypeScript, Node·PowerShell fixture.
**Spec:** docs/superpowers/specs/2026-10-11-iris-updater-design.md

## Global Constraints

Windows x64 production only; schemaVersion1/updaterVersion1/minUpdaterVersion1/queueSchemaVersion3; 무료 unsigned; ZIP32MiB/metadata64KiB/uncompressed96MiB; 30분 native cooldown; payload9+manifest1; 개발/DB/게임 조작·push·공개 ZIP 교체 없음. 사용자 지시로 같은 대화 직접 실행, 별도 승인 대기 생략. 기존 기능 브랜치/dirty 변경 보존, 묶음 검증 후 로컬 상태로 남긴다.

## Review Focus

- 원본 파일이 staging 이후 다른 프로그램에 의해 변경: hash mismatch에서 중단, 덮어쓰기 없음.
- ZIP metadata와 실제 payload의 불일치·추가/중복·경로 탈출: 설치 전에 거부.
- 부모가 종료되지 않음/다른 앱 중복 실행: 실행 중 EXE를 바꾸지 않음.
- class draft/보관 실패·파티 쓰기 중 업데이트: 입력 복구 가능 상태로 유지, 강제 버리기 없음.
- 네트워크가 없는 새 native 앱: native 초기화로 성공 판정, 웹 장애만으로 rollback하지 않음.

### Task 1: native release policy 및 패키지 검증

**Files:** iris/desktop-update-policy.cs, iris/desktop-update.tests.ps1, iris/desktop-update.fixture.cs
**Interfaces:** DesktopUpdateRelease.Parse(json, archiveMetadata), CompareVersions(a,b), ValidateArchive(zip,stage,release). 고정 Names·Limits; hash helper.
- [ ] 제한된 임시 ZIP 정상/변조/traversal/duplicate/unknown/inner mismatch fixture 작성 후 실패 확인.
- [ ] parser와 추출 검증 구현.
- [ ] powershell -NoProfile -File iris/desktop-update.tests.ps1 → PASS; 실제 파일 hash/side effect 확인.

### Task 2: transactional install/helper 및 network manager

**Files:** iris/desktop-update-install.cs, iris/desktop-update-helper.cs, iris/desktop-update.cs, iris/desktop-release.cs, iris/build-beta.ps1, iris/desktop-update.fixture.cs, iris/release-package.tests.ps1
**Interfaces:** Prepare(zip,release,installDir) → transaction directory; Apply(transaction,parentProcess)·Recover(transaction)·MarkReady(transaction). DesktopUpdater.State/CheckAsync/PrepareAsync/Apply/EventChanged.
- [ ] baseline hash 변경/partial replacement rollback/부모 미종료/handshake 임시 프로세스 fixture RED.
- [ ] journal/원자 교체·복원·정확한 PID/start identity/backup helper/restart 구현.
- [ ] native HTTP fixed origin/no redirects·32MiB bounded IO·cooldown/단일 작업 및 상태 구현.
- [ ] build에서 버전정보 앱/helper에 동시 포함, manifest와 download.json 신규 필드 출력. 공개 -PrepareDownload는 실행하지 않음.
- [ ] native fixture 및 release-package test → PASS.

### Task 3: scoped bridge + version/update UI

**Files:** iris/desktop-bridge.cs, iris/desktop-webview.cs, iris/desktop.ps1, lib/irisDesktopStore.ts, lib/irisDesktopUpdate.ts, components/iris/DesktopUpdater.tsx, components/iris/DesktopTitlebar.tsx, app/iris/desktop/page.tsx, app/iris/desktop/desktop.css, tests/iris-updater.test.mjs, tests/iris-updater.browser.mjs
**Interfaces:** update.state/check/prepare/apply(null only), window.update.changed scoped event. exact DesktopUpdateState; component accepts native store & onBeforeApply():Promise<boolean>.
- [ ] 실제 store 호출/늦은 epoch/구형 지원 없음·installed vs web version/버전별 button fixture RED.
- [ ] native bridge bind (생산 release만), async marker와 event scoping, 장기 prepare timeout 구현.
- [ ] 앱 header에 installed version·조건부 버튼, 확인 dialog·progress/error/노트·취소·중복 방지. parent의 controller.shutdown('keep') 성공 후만 apply; native apply 실패 때 자동 편집 재개 금지, 정상 재실행 안내.
- [ ] native 초기 startup marker recover 및 ready 연결, 개발 호스트는 updater unsupported 유지.
- [ ] Node/narrow browser/native bridge·webview fixture → PASS.

### Task 4: 묶음 검증·기록·최종 리뷰

**Files:** docs/HANDOFF.md, docs/BETA_FEEDBACK.md, docs/DECISIONS.md, app/SANCTUM_MASTER_GUID.md, iris/README.md, docs/IRIS_UPDATE_POST.md
- [ ] 전체 Node·tsc·변경 TSX lint·분리 webpack build·native/release/bridge fixture 실행 및 결과 확인.
- [ ] fresh reviewer로 새 updater 경계/기존 dirty 변경 별도 검토. 중요한 문제만 RED→GREEN 수정.
- [ ] 실제 보호 큐/게임/공개 배포에 손대지 않았음을 확인, 설치된 구형 앱의 최초 수동 교체 필요·실PC 검증 대기 기록.
- [ ] git diff --check; 사용자 확인 URL과 미배포·미검증 범위를 보고.
