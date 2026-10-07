# IRIS Class Level Editing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 선택한 본인 캐릭터의 생텀 저장 클래스 레벨을 직접 수정하고 기존 숙제와 같은 15초 자동저장·지금 저장·보호 보관을 제공한다.

**Architecture:** 기존 단일 controller/queue의 편집 종류를 task/class로 확장한다. 서버는 클래스 한 키만 원본 비교 후 저장하며 native 보관은 v1을 보존하는 v2 전환으로 처리한다. 입력 초안은 저장 큐와 분리하고 오류 초안이 있는 캐릭터의 전송을 잠근다.

**Tech Stack:** Next.js App Router, TypeScript, React, Supabase 기존 JSONB, Windows C#/PowerShell DPAPI, Node test runner, 합성 브라우저 fixture.

**Spec:** `docs/superpowers/specs/2026-10-07-iris-class-level-editing-design.md`

## Global Constraints

- 현재 영겁 폴더에서 직접 구현한다. 기존 미커밋 작업을 보존하며 새 worktree나 무관한 리팩터링을 만들지 않는다.
- 마지막 유효 수정 후15초 자동저장. 캐릭터를 떠날 때 이전 캐릭터 대기를15초로 재설정한다. 지금 저장/버리기는 선택 캐릭터만 대상으로 한다.
- 유효 클래스 레벨은 정수1~1000, 실제 미등록 기준값은null이다. 삭제·빈값 저장·자동0/1 변환·닉네임 재확인 창은 없다.
- 클래스는 영구값, 숙제만 일간06시/주간 월요일06시 기간을 적용한다. 단일 inflight·500항목·1MiB·계정/캐릭터/환경 격리를 유지한다.
- 게임 명령·로그인 입력·실제 보호 대기함 추출·운영 DB 데이터/구조/RLS 변경·Git commit/push·배포·공지는 실행하지 않는다. 실제 저장 검증은 한설이 직접 한다.
- 모든 파일 편집은 apply_patch. 테스트는 합성 데이터와 전용 임시 디렉터리만 사용한다. 개발 서버/앱 재시작은 사용자 정상 종료 후 진행한다.
- 클래스 입력은 기존 아코디언·6테마·rem·320px 기준을 따른다. 스탯/시낙시스/게임 전체 클래스 자동조회는 이번 범위가 아니다.
- 각 Task 종료는 로컬 diff/검증 체크포인트이며 commit을 뜻하지 않는다. 제품 완료 전 verification-before-completion 및 변경 TSX의 react-best-practices 점검을 적용한다.

## Review Focus

1. 유효값 입력 뒤 빈칸/소수로 바꾼 상태: 이전 유효값도 자동 전송되지 않아야 한다(Task 4/5).
2. v2 저장 직후 v1 백업 이동 실패: 두 활성 파일에서 아무 변경도 자동 전송하지 않아야 한다(Task 3).
3. 다른 클래스/알 수 없는 키가 동시에 수정됨: 해당 키를 보존하고 CAS 실패는409로 멈춰야 한다(Task 1).
4. A 저장 응답이 B 선택/다른 계정 로그인 뒤 도착함: B 화면과 확인 시각을 바꾸지 않아야 한다(Task 4).
5. 기준값null처럼 보이는 잘못된 DB 원본: 미등록과 구분하고 덮어쓰기를 막아야 한다(Task 1/5).

---

## File Responsibilities

- `lib/irisClassWrite.ts`: 클래스 요청과 원본의 순수 검증·병합.
- `lib/server/irisClassWrite.ts`, `app/api/iris/classes/route.ts`: 기존 세션·소유권·활성 클래스·CAS 저장 경계.
- `app/api/iris/kronos/route.ts`, `lib/irisDesktopTransport.ts`: 기존 조회에 클래스 쓰기 문맥 추가, 종류별 전송/응답 검증.
- `lib/irisDesktopQueue.ts`: schema2 discriminated union, 공통 대기·복구 규칙.
- `iris/desktop-store.cs`, `lib/irisDesktopStore.ts`: DPAPI v2/구버전 전환 및 native 응답 검증.
- `lib/irisDesktopController.ts`: 단일 저장 실행·입력 보류·계정/선택 격리·성공 확인 시각.
- `lib/irisDesktopPresentation.ts`, `components/iris/DesktopCheckboard.tsx`, `DesktopCenter.tsx`, `DesktopSaveStatus.tsx`, `app/iris/desktop/page.tsx`, `desktop.css`: 종류별 요약과 작은 수동 입력, 오류·버튼 범위 안내.

### Task 1: 안전한 클래스 저장 API와 조회 문맥

**Files:** Create `lib/irisClassWrite.ts`, `lib/server/irisClassWrite.ts`, `app/api/iris/classes/route.ts`, `tests/iris-class-write.test.mjs`. Modify/Test `app/api/iris/kronos/route.ts`, `tests/iris-api.test.mjs`. Existing read-only `IrisClassDetail` 계약은 유지한다.

**Interfaces:**
- Produces `ClassEditRequest = {requestId:string;accountId:string;characterId:string;classId:string;baseLevel:number|null;desiredLevel:number}`.
- Produces `ClassWriteContext = {classId:string;editable:boolean;baseLevel:number|null}`; GET의 `writeContext.classes: ClassWriteContext[]`는 활성 클래스와 1:1이며 malformed 원본은 editable=false다.
- Produces `validateClassEdit(value:unknown): ClassEditRequest`, `mergeClassLevel(raw:unknown,className:string,baseLevel:number|null,desiredLevel:number): {levels:Record<string,unknown>;changed:boolean}`. 오류는 기존 `IrisWriteError` 경계를 재사용한다.
- Produces `saveIrisClassEdit(db, account:{id:string;nickname:string}, value:unknown): Promise<{requestId:string;status:'saved';level:number}>`; db 타입은 기존 서버 저장 모듈 패턴을 따른다.
- POST `/api/iris/classes` body `{edit:ClassEditRequest}`, 성공 `{result:{requestId,status:'saved',level}}`.

- [x] **1. RED 테스트 작성:** `class edits preserve unrelated keys and reject stale/malformed baselines`: `deepEqual(result.levels,{전사:54,마법사:65,숨김:7,legacy:{x:1}})`, stale base→409, 배열/string/선택키0→거절, 진짜null→등록, 감소 허용, 이미desired→writes.length===0. 타인/계정 불일치/비활성 클래스/카탈로그 실패도 거절한다.
- [x] **2. RED 확인:** `node --test tests/iris-class-write.test.mjs tests/iris-api.test.mjs`에서 새 테스트만 의도한 미구현 경계로 실패하는지 확인한다.
- [x] **3. 순수 계약 구현:** strict 6개 필드·UUID/ID·정수 검증, 객체/null 원본 구분, own-property 키 조회와 한 키 병합을 구현한다. 알 수 없는 키는 복사 보존한다.
- [x] **4. 서버/API 구현:** 세션 소유자 id+owner 조건, 활성 ID→서버 이름, null IS NULL/원본 JSONB CAS, 0행409를 적용한다. 기존 POST와 같은 출처·JSON·64KiB 스트림 제한,401/403/409/503/no-store를 적용한다. GET에 읽기 정규화와 별개의 editable 문맥을 추가한다.
- [x] **5. 경계 GREEN 확인:** 병합 직후 경쟁 수정을 주입해 writes가 덮어쓰지 않는지, malformed/null 문맥 차이, 잘못된 출처/추가필드/큰 chunked body까지 위 테스트로 확인한다. `git diff --check` 후 Task 체크포인트를 기록한다.

### Task 2: task/class schema2 통합 큐

**Files:** Modify/Test `lib/irisDesktopQueue.ts`, `tests/iris-desktop-queue.test.mjs`.

**Interfaces:**
- Consumes Task 1 `ClassEditRequest`의 ID/base/desired 의미.
- Produces `TaskPendingEdit` = 기존 PendingEdit 필드 + `kind:'task'`; `ClassPendingEdit` = 공통 Scope/requestId/revision/deadlineAt/phase + `kind:'class';classId:string;baseLevel:number|null;desiredLevel:number` (category/taskId/periodKey 없음).
- Produces `PendingEdit = TaskPendingEdit | ClassPendingEdit`, `QueueSnapshot={schemaVersion:2;entries:PendingEdit[]}`.
- Retains `TaskKey`와 기존 task `edit` 인터페이스. Adds `editClass(scope:Scope,classId:string,baseLevel:number|null,desiredLevel:number):void`, `due(accountId:string,blockedCharacterIds?:ReadonlySet<string>):PendingEdit[]`.
- Produces `migrateDesktopQueueV1(value:unknown,environment:string):QueueSnapshot`; 원래 strict schema1을 별도 검증 후 kind만 추가한다.

- [x] **1. RED 테스트 작성:** `task and class share 15000ms scope debounce`: 두 종류 deadline이 마지막 유효 수정+15000, 원복 entries.length===0, nullable base 허용/목표0 거절, 클래스에 period 필드 추가 시 거절. 500/1MiB·중복ID/같은 identity·단일inflight 경계를 유지한다.
- [x] **2. RED 확인:** `node --test tests/iris-desktop-queue.test.mjs`에서 새 union/메서드 미구현 실패를 확인한다.
- [x] **3. 큐 구현:** 종류별 identity·기준/목표 선택만 분기하고 기존 merge/claim/settle/recover/leaveCharacter/saveNow/discard를 공유한다. `SaveOutcome`은 `{kind:'saved';value:number}|{kind:'unknown'|'conflict'|'expired'}`로 통일한다. class에는 기간 만료를 적용하지 않는다.
- [x] **4. GREEN 확인:** restore pending/inflight→unknown, blocked 캐릭터 전체 due 제외/다른 캐릭터 due 유지, v1 변환의 기존 12필드 strictness 및 무손실 task 변환을 검사한다. 위 테스트와 `git diff --check`를 통과시킨다.

### Task 3: DPAPI v2 전환과 구버전 실패 잠금

**Files:** Modify/Test `iris/desktop-store.cs`, `iris/desktop-store.tests.ps1`, `lib/irisDesktopStore.ts`, `tests/iris-desktop-store.test.mjs`; bridge payload 회귀는 `iris/desktop-bridge.tests.ps1`에서 검사하며 필요할 때만 `iris/desktop-bridge.cs`를 수정한다.

**Interfaces:**
- Consumes Task 2 schema2 exact fields/validation. Native `DesktopStore.Load()/Replace(string json)` 외부 호출 계약은 유지한다.
- Produces `pending-v2.dpapi`, entropy `SANCTUM:IRIS:DesktopQueue:v2:<environment>`; 기존 v1 entropy는 migration read-only로 유지한다.
- TS store `load():Promise<QueueSnapshot|null>`, `replace(value:QueueSnapshot):Promise<void>`은 schema2만 허용한다. bridge version1/epoch/origin은 변경하지 않는다.

- [x] **1. RED 테스트 작성:** 전용 임시 루트의 합성 v1을 읽어 strict 변환→v2 복호화 재검증→v1 `pending-v1.recovery-<GUID>.dpapi` 이동 순서를 검증한다. 원본 값/항목 수 동일, production/development 격리를 assert한다.
- [x] **2. RED 확인:** `powershell.exe -NoProfile -File iris/desktop-store.tests.ps1` 및 `node --test tests/iris-desktop-store.test.mjs`에서 v2 미구현 실패를 확인한다. 실제 앱 profile/root를 fixture로 사용하지 않는다.
- [x] **3. native 전환 구현:** 기존 공유 단일 실행 잠금 범위에서 v2 원자 저장·재확인 뒤 v1 이동한다. v1/v2 동시 활성, 암호문/JSON 오류, 이동 실패는 명시 오류로 잠그고 살아 있는 원본을 삭제/덮어쓰지 않는다. v2 역변환은 없다.
- [x] **4. 실패 주입 GREEN:** v2 저장 전/후 및 백업 이동 실패, 손상/추가필드/두 inflight/큰파일, 복원 unknown, 구 native UI 버전 불일치 실패를 검사한다. 기존 bridge epoch/출처 테스트도 통과시키고 diff 체크포인트를 남긴다.

### Task 4: 단일 controller 전송·복구와 입력 초안 보류

**Files:** Modify/Test `lib/irisDesktopTransport.ts`, `lib/irisDesktopController.ts`, `tests/iris-desktop-transport.test.mjs`, `tests/iris-desktop-controller.test.mjs`.

**Interfaces:**
- Consumes Tasks 1–3 class API/writeContext/schema2/store.
- Produces transport `save(e:PendingEdit):Promise<DesktopSaveResult>`; 성공 `{kind:'saved';value:number}`, 기존 오류 kind는 유지한다. class 전송은 strict6필드, task는 기존 wire contract를 유지한다.
- Controller adds `setClassDraft(classId:string,text:string):void`, `revertClassDraft(classId:string):void`; state adds `classDrafts:Record<string,{text:string;error:string|null}>`, `hasInvalidClassDraft:boolean`. 기존 task edit/saveNow/discard/selectCharacter/tick 메서드를 유지한다.
- Controller가 원문 초안을 계정/캐릭터/classID로 구분해 메모리에 보관한다. 초안 오류 시 해당 캐릭터의 전체 due/지금 저장/전환을 막고 안내한다. 보관된 유효 큐는 유지한다. 정상 종료 시 오류 초안의 정정/되돌리기를 요구한다; 재실행 복원 큐는 unknown이므로 자동 전송하지 않는다.

- [x] **1. RED 테스트 작성:** `valid then invalid draft never sends old value`: 54 입력→빈칸→15000ms 뒤 POST0, B의 유효 pending은 전송, 오류 정정→15초 재설정. `selectCharacter`는 오류 초안이면 A 유지, revert 후 전환 허용한다.
- [x] **2. RED 확인:** `node --test tests/iris-desktop-controller.test.mjs tests/iris-desktop-transport.test.mjs`에서 새 state/분기 실패를 확인한다.
- [x] **3. transport/controller 구현:** 종류별 현재 값 조회·base 비교·ack baseline 갱신을 추가한다. 하나의 serial IO/단일flight/epoch·ownership 검사/확인 시각 로직을 유지한다. 클래스를task로 캐스팅하거나 별도 timer를 만들지 않는다.
- [x] **4. GREEN 확인:** A class ack 뒤 B/다른계정 화면 및 시각 불변, 추가 유효 edit 중 flight 완료, 두 종류 부분 성공,401·응답 유실unknown·명시 복구GET·conflict no retry·숙제기간 만료/클래스 무만료를 assert한다. class wrong requestId/level 응답은unknown, malformed context는편집불가. 지금 저장/버리기 선택 범위 및 원복 POST0을 확인한다.

### Task 5: 작고 안정적인 클래스 입력과 저장 피드백

**Files:** Modify/Test `components/iris/DesktopCheckboard.tsx`, `components/iris/DesktopCenter.tsx`, `components/iris/DesktopSaveStatus.tsx`, `app/iris/desktop/page.tsx`, `app/iris/desktop/desktop.css`, `lib/irisDesktopPresentation.ts`, `tests/iris-desktop-ui.test.mjs`, `tests/iris-desktop-presentation.test.mjs`, `tests/iris-desktop-ui.browser.mjs`.

**Interfaces:**
- Consumes Task 4 state/callbacks. Checkboard/Center props add `classDrafts`, `onClassDraft(classId:string,text:string):void`, `onRevertClassDraft(classId:string):void`.
- Presentation retains summary groups/items API; class items resolve `classId` from selected classes, task items alone index tasks/category. Pending UI uses controller drafts/desired then confirmed baseline without resetting input on ticks.

- [x] **1. RED 테스트 작성:** `class inputs use saved defaults and preserve invalid text`: DB53→input53, 미등록null→빈칸/미등록, malformed→disabled/웹 관리 안내, decimal→오류/저장disabled. `class summary never indexes task category`를 assert한다.
- [x] **2. RED 확인:** `node --test tests/iris-desktop-ui.test.mjs tests/iris-desktop-presentation.test.mjs`의 새 입력 계약 실패를 확인한다.
- [x] **3. UI 구현:** 기존 클래스 아코디언에 label·작은 text input(inputMode numeric)·aria-invalid/error 연결·되돌리기를 넣는다. 문구는 “생텀에 저장된 레벨 · 직접 수정”, “마지막 유효 수정 후 15초 자동저장”, “지금 저장과 변경 버리기는 선택 캐릭터에 적용돼요.”로 구분한다. 기존 확인 시각을 유지한다.
- [x] **4. browser fixture 복구:** 현재 로그인 SecretCodeInput의 실제 accessible label/type를 확인하고 기존 password 선택자 timeout을 합성 fixture 안에서 재현→정확한 locator로 수정한다. 실제 로그인이나 쿠키를 사용하지 않는다.
- [x] **5. GREEN 눈 검증:** 합성 browser에서 입력 포커스/커서·초안·아코디언·스크롤이 저장tick으로 바뀌지 않는지,15초/지금 저장·캐릭터 전환·오류 정정을 검사한다. 6테마×320/390/768/1280×3 PC 글자 설정의 기존72 layout 조합을 재실행하고 가로 넘침/버튼 잘림이0인지 확인한다.

### Task 6: 통합 검증과 사용자 인계

**Files:** Modify `docs/HANDOFF.md`, `docs/BETA_FEEDBACK.md`, `docs/DECISIONS.md`, `app/SANCTUM_MASTER_GUID.md`, 이 계획의 진행 체크박스. 운영 스키마 변경은 없으므로 마이그레이션/권한 문서를 추측해 바꾸지 않는다.

**Interfaces:** Consumes Tasks 1–5 전체 흐름. Produces 증거 기반 로컬 검증 결과와 실제 사용자 확인 대기 목록. 공식 버전/공지/릴레이 push 갱신은 별도 push 요청 때 수행한다.

- [x] **1. 전체 Node/타입 확인:** `node --test`, `npx.cmd tsc --noEmit`을 실행하고 exit0/failed0을 기록한다. 기존 성공273개에 새 회귀를 추가하며 skip/미실행을 숨기지 않는다.
- [x] **2. native 합성 확인:** `iris/desktop-store.tests.ps1`, `desktop-bridge.tests.ps1`, `desktop-host.tests.ps1`, `desktop-lifecycle.tests.ps1`, `desktop-overlay.tests.ps1`, `desktop-webview.tests.ps1`를 각각 `powershell.exe -NoProfile -File`로 실행한다. 임시 합성 큐/단일 실행/정상 종료와 UI native 조합을 확인한다.
- [x] **3. browser/분리 빌드 확인:** 기존 의존성 경로로 `node tests/iris-desktop-ui.browser.mjs C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json` 실행. 빌드는 package.json/기존 분리 빌드 방식 확인 후 실행하여 실행 중 dev .next를 덮어쓰지 않는다. 빌드/fixture 실패는 완료를 선언하지 않고 안전하게 원인 수정 후 재검증한다.
- [x] **4. 직접 전체 diff 리뷰:** union exhaustive 분기, 서버 소유권/CAS, 원본보존, migration 실패 잠금, 입력 보류/계정 격리/추가 GET 없는지 검토한다. `git diff --check`, 무관한 기존 변경 보존을 확인한다. 한 번 더 무관한 기능/자동 게임 명령이 추가되지 않았는지 확인한다.
- [x] **5. 문서/인계:** 닉네임 재확인 없는 최신 결정과 새 API/큐v2 구조를 기록한다. 웹의 기존 전체levels 저장 이후 덮어쓰기 위험, 구버전 롤백 제한, 자동 검증과 실제 사용자 검증을 구분한다.
- [ ] **6. 한설 수동 확인 안내:** 기존 IRIS 정상 종료 확인 후 개발앱을 열어 같은 계정/캐릭터 현재값 확인→클래스1개 변경→15초→웹값 비교 순으로 한 단계씩 안내한다. 이어 지금 저장·캐릭터변경 전 값 보관을 확인한다. 운영 미푸시/미배포 상태를 명시한다.

## Self-review / Execution Gate

- Spec coverage: 수동 DB 기본값/입력(Task 5), 서버 보존/CAS(Task 1), 단일 저장·기간/복구(Task 2/4), 구버전 보관(Task 3), 자동·수동 검증과 제한(Task 6)으로 모두 대응한다.
- Type consistency: class 요청은6필드, 내부 queue에만 kind/환경/revision/phase를 추가한다. 저장 결과 value는 두 종류 모두 number, 미등록null은 baseline에만 허용한다. 모든 task-only category 접근은 union 분기로 제한한다.
- Review Focus 다섯 항목은 해당 Task의 명시 실패 테스트에 배정했다. 과도한 기능 확대/독립 저장 엔진/DB 구조 변경은 없다.
- 계획 검토 확인 후 기존 선택대로 영겁이 현재 폴더에서 직접 실행한다. 이 문서 작성만으로 제품 구현·운영 데이터 쓰기·push를 시작하지 않는다.
