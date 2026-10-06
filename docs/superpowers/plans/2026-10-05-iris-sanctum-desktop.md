# IRIS SANCTUM Desktop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 외부 브라우저 승인 대신 앱 내 생텀 로그인·캐릭터 선택과 캐릭터별 15초 자동저장을 제공한다.

**Architecture:** 앱 전용 웹 화면이 인증·편집·저장 큐를 소유하고 기존 같은-origin 서버 API에 접근한다. Windows 호스트는 내장 화면·보호된 대기함·창 제어만 담당한다. 게임 읽기 위젯은 보존한다.

**Tech Stack:** 기존 Next.js/React/TypeScript, Node test runner, Windows PowerShell/WinForms. WebView2는 Task 1의 실행 가능성 검증 후보이며 아직 채택 완료가 아니다.

**Spec:** `docs/superpowers/specs/2026-10-05-iris-sanctum-desktop-design.md` (한설 검토 승인: 2026-10-05, “좋아”).

상태: 2026-10-05 한설이 계획 실행·기존 폴더 작업 및 공식 WebView2 SDK 프로젝트 내 확보를 승인했다. Task1 실제 내장 후보의 합성 페이지·process 종료/재실행 쿠키 유지·외부 이동 차단 통과, Task2 큐18 tests 통과, Task3 adapter/controller16 tests 통과. Tasks4–8 미착수. OS 설치·운영 데이터 변경·배포 승인은 아니다.

## Global Constraints

- 현재 미커밋 IRIS 및 웹 변경을 보존한다. 작업 시작/공식 push 전 릴레이 규칙을 따른다.
- 운영 DB 구조·RLS·권한·데이터 변경, 접속 코드 대리 입력, 게임 조작, commit/push·배포·자동 시작 설정은 실행하지 않는다. 이 계획의 서버 검증은 합성 DB만 사용한다.
- 체크포인트는 diff와 검증 기록이다. 각 Task 뒤 자동 commit하지 않는다.
- 새 로그인/쓰기 흐름에 외부 브라우저 relay나 별도 읽기/쓰기 동의를 요구하지 않는다. 서버 인증·소유권 보호는 유지한다.
- 현재 WebView2 Runtime 154.0.4258.53 및 사용자 승인으로 확보한 프로젝트 SDK 1.0.4258.31의 net462 assembly가 기존 PowerShell에서 실행됨을 확인했다. .NET SDK/OS 설치는 하지 않았다. 기존 호스트 기본 경로는 사용자 수동 검증 전 전환하지 않는다.
- 기존 실행본 교체는 중복 프로세스가 없는지 확인하고 한설의 정상 종료 후 진행한다. 기존 경로 삭제는 새 경로 수동 검증 이후 별도 판단한다.
- 제품 화면은 `rem`, 전역 6테마, 긴 닉네임 전체 표시, 둥근 카드/버튼을 적용한다. 전체 게임 위젯 재디자인은 포함하지 않는다.

## Review Focus

1. 다른 캐릭터로 바뀐 뒤 원래 캐릭터 저장/늦은 응답 격리: Task 2, 3, 6의 fake-clock·deferred-response 테스트.
2. 계정 전환·로그아웃·만료 중 다른 계정 쿠키로 저장: Task 3, 5의 epoch 및 전환 잠금 테스트.
3. 06시 경계·웹 동시 수정·불명확 POST 반복: Task 3, 4, 7의 기간/CAS/reconcile-only 테스트.
4. 재시작·암호화 대기함·외부 origin 브리지: Task 1, 5, 7의 손상·프로필 격리·허용 목록 테스트.
5. 체크보드 깜빡임·15초 유휴 쓰기·느린 저장 표시: Task 2, 6, 8의 행 identity·네트워크 횟수·지연 측정.

## File / responsibility map

| 파일 | 책임 |
| --- | --- |
| `iris/desktop-probe.ps1`, `iris/desktop-host.cs`, `iris/desktop-webview.cs`, native tests | 런타임 게이트, origin 제한, 앱 프로필; singleton 및 브리지는 후속 |
| `lib/irisDesktopQueue.ts`, `tests/iris-desktop-queue.test.mjs` | IO 없는 캐릭터별 debounce·revision·상태 전이 |
| `lib/irisDesktopController.ts`, `tests/iris-desktop-controller.test.mjs` | 인증 epoch, 직렬 전송, 조회/복구, 전환 잠금 |
| `lib/irisDesktopTransport.ts`, `tests/iris-desktop-transport.test.mjs` | 기존 auth/IRIS API adapter, 응답 검증 |
| `lib/server/irisKronosWrite.ts`, `tests/iris-kronos-write.test.mjs` | 기존 소유권·기간·조건부 저장 재사용/회귀 |
| `iris/desktop-store.cs`, `iris/desktop-store.tests.ps1` | CurrentUser 암호화·원자적 대기함 교체 |
| `app/iris/desktop/page.tsx`, `app/iris/desktop/components/` | 앱 전용 로그인·계정·캐릭터·체크보드 |
| `iris/overlay.ps1`, `iris/README.md`, `iris/ARCHITECTURE.md` | 제한된 실행 연결·전환 안내, 기존 읽기 위젯 보존 |

컴포넌트는 `DesktopLogin.tsx`, `DesktopAccountPanel.tsx`, `DesktopCheckboard.tsx`, `DesktopSaveStatus.tsx`로 분리한다. 기존 `/iris` relay 화면은 유지한다. 새 route는 기본 layout/auth 쿠키를 재사용한다.

## Shared interfaces

Task 2에서 아래 계약을 먼저 고정하고 이후 작업은 이를 공유한다.

```ts
type Scope = { environment: string; accountId: string; characterId: string };
type TaskKey = { category: 'daily'|'weekly'|'abyss'|'raid'; taskId: string; periodKey: string };
type PendingEdit = Scope & TaskKey & {
  requestId: string; revision: number; baseCompleted: number; desiredCompleted: number; deadlineAt: number;
  phase: 'pending'|'inflight'|'unknown'|'conflict'|'expired';
};
type QueueSnapshot = { schemaVersion: 1; entries: PendingEdit[] };
```

- `createDesktopQueue({ now, id, environment }): DesktopQueue`: `edit(scope,key,base,desired)`, `leaveCharacter(scope)`, `saveNow(scope)`, `discard(scope)`, `due(accountId)`, `claim(requestId)`, `settle(requestId,outcome)`, `snapshot()`, `restore(snapshot)`。`now():number`은 ms, 자동저장 상수는 `15_000`이다. 반환 상태는 detached snapshot으로 UI에 전달한다. due/claim은 생성 시 environment를 강제한다. restore의 pending/inflight는 unknown으로 전환되어 자동 재생하지 않는다.
- `createDesktopController({ queue, transport, store, environment })`: `start()`, `selectCharacter(id)`, `edit(key,base,desired)`, `saveNow()`, `discard()`, `tick()`, `switchAccount(id)`, `logout(disposition)`, `shutdown(disposition)`, `state()`; disposition은 `save|keep|discard`。queue 내부 clock을 재사용하고 비어 있는 큐에도 정확한 환경을 공급한다.
- `DesktopTransport`: `session()`, `characters(accountId)`, `details(accountId,characterId)`, `save(edit)`, `switchAccount(id)`, `logout()`。응답 소유 identity는 요청 accountId와 비교한다. `save` 결과는 `saved|conflict|unauthorized|unknown|rejected` union; status 503/응답 유실은 무조건 안전한 실패로 가정하지 않는다.
- `DesktopStore`: `load():Promise<QueueSnapshot|null>`, `replace(snapshot):Promise<void>`。웹 브리지는 `store.load/store.replace/window.hide`만 허용하고 메시지 `version:1,id,epoch,method,payload`와 응답 id/epoch를 검증한다. cookie/code/token 관련 메시지는 없다.
- 각 편집의 서버 payload는 기존 `IrisEdit`로 adapter가 변환한다. legacy `generation/selectionVersion`은 호환 식별값일 뿐 소유권 인증 근거가 아니다. 서버 인증은 요청의 실제 세션·accountId·characterId로 확인한다.

## Task 1 — 내장 화면 실행 가능성 게이트

Files: create `iris/desktop-probe.ps1`, `iris/desktop-host.cs`, `iris/desktop-host.tests.ps1`; modify `iris/ARCHITECTURE.md`의 후보 검증 기록만.

- [x] RED/Run: 정책 missing 구현 및 실제 내장 host missing 구현 실패 확인.
- [x] Implement: policy16 검증, 사용자 승인된 pinned 프로젝트 SDK, 기존 PowerShell/net462 실행 후보. 별도 desktop-webview.cs로 IO 분리.
- [x] GREEN: 실제 WebView2 합성 localhost 페이지 로딩·첫 browser process 종료·다른 process cookie 복원·HttpOnly 접근 차단·외부 navigation/frame/new-window/redirect 차단 통과.
- [x] Gate/checkpoint: Runtime/SDK 호환 gate 통과. OS 설치/기존 overlay 교체 없음. 실제 생텀 로그인과 제품 전환은 수동 검증 대기.

## Task 2 — 캐릭터별 15초 pure queue (검증 완료, 미커밋)

Files: create `lib/irisDesktopQueue.ts`, `tests/iris-desktop-queue.test.mjs`; reuse `tests/load-ts.mjs`.

- [x] RED: fake-clock 테스트 `A switch schedules A independently of B`를 작성한다. `edit(A,...,0,1)` at 0ms, `leaveCharacter(A)` at 2s, B edit at 10s 후 `assert.equal(queue.due('account')[0].characterId,'A')` at 17s. 16,999ms에는 A가 due가 아니어야 한다.
- [x] Run: `node --test tests/iris-desktop-queue.test.mjs`; 최초15개 missing implementation assertion 실패 확인.
- [x] Implement: 상수 `15_000`, scope+task+period별 병합, 원래 base 유지, 원래 값 복귀 시 제거, 캐릭터별 deadline, 즉시 저장/미전송만 버리기. in-flight와 다음 revision을 구분하며 결과는 원래 scope/revision에만 적용한다.
- [x] GREEN: 18/18. 0쓰기, A→B→A, B 편집 독립성, late ack, 저장 중 다음 편집, serializable snapshot, pending만 discard 및 malformed period/UUID 추가 RED→GREEN.
- [x] Checkpoint: 인터페이스 export 및 테스트 목록을 기록하고 diff 확인. 전체210/210·tsc 통과, UI/네트워크 연결은 없음.

## Task 3 — API adapter와 인증/저장 controller

Files: create `lib/irisDesktopTransport.ts`, `lib/irisDesktopController.ts`, `tests/iris-desktop-transport.test.mjs`, `tests/iris-desktop-controller.test.mjs`.

- [x] RED/Run: transport6/controller7 missing 구현 실패; 종료-save 잠금 및 저장 대기 중 선택 경쟁 추가 RED 확인.
- [x] Implement: 같은-origin cookie, strict 응답 identity/schema, timeout unknown, 단일 durable claim→GET→POST, 계정 epoch/전환 잠금/만료 전송 중지.
- [x] GREEN: transport6/controller10 통과. unknown desired 제거/base 보류/다른 값 conflict/기간 expired; late A ack가 B view에 적용되지 않음. 보호 store 대기 중 이전 선택은 최신 선택을 덮어쓰지 않는다.
- [x] Checkpoint: idle60초0 POST·지금 저장 즉시 POST·부분 성공 ack만 제거, protected store 실패 전송0. 전체226/226, 타입 검사 통과. 실제 DPAPI store/UI/API에는 아직 연결하지 않았다.

## Task 4 — 기존 서버 저장 계약의 desktop 호환 검증

Files: modify `tests/iris-kronos-write.test.mjs`, `tests/iris-api.test.mjs`; 필요 최소 수정만 `lib/server/irisKronosWrite.ts`, `app/api/iris/kronos/route.ts`.

- [ ] RED: 표시 선택이 B이어도 세션 소유 A의 정확한 편집이 저장되는 adapter→실제 handler 합성 테스트. 타 계정 accountId/타인 characterId는 거절한다. 같은 JSON field의 동시 변경은 `assert.equal(status,409)` 및 update 0 assertion을 추가한다.
- [ ] Run: `node --test tests/iris-api.test.mjs tests/iris-kronos-write.test.mjs`.
- [ ] Implement: 기존 `saveIrisKronosEdit`를 사용하고 허용 값·streamed body 제한·Origin 검사를 유지한다. 서버 소유권 조회와 update predicate 일치 여부를 점검한다. 한 항목 POST씩 직렬 처리하는 초기 버전으로 batch API를 추가하지 않는다.
- [ ] GREEN: 위 명령 + 일/주간 05:59→06:00, 월요일 경계, 같은 desired의 idempotent 결과, 다른 완료 항목 보존을 검증한다.
- [ ] Checkpoint: DB migration 없음. N개 변경의 POST/조회 수를 기록하며 비용 문제가 확인되면 batch 개선을 별도 설계한다. 검증 상수와 catalog 정책을 임의 완화하지 않는다.

## Task 5 — 보호된 대기함과 재시작/계정 복구

Files: create `iris/desktop-store.cs`, `iris/desktop-store.tests.ps1`; modify `iris/desktop-host.cs`, `lib/irisDesktopController.ts`, controller tests.

- [ ] RED: 저장 파일에 sentinel 문자열이 평문으로 남지 않는지, 잘린 데이터는 rejected, old inflight 복원은 unknown, 다른 환경 대기함은 로드되지 않는지 테스트한다. `Assert-False($bytesText.Contains('sentinel-task'))`.
- [ ] Run: `powershell -NoProfile -File iris/desktop-store.tests.ps1` 및 controller tests.
- [ ] Implement: Windows DPAPI CurrentUser, 환경별 경로, 입력 schema/상한 1MiB·entries 500 검증, 같은 디렉터리 임시 파일→원자적 교체. 브리지 origin/id/epoch 검증 후 저장. 실패하면 durability 오류 표시 및 종료 경고; 성공한 척하지 않는다.
- [ ] GREEN: 손상 파일은 격리·사용자 안내(조용히 삭제하지 않음), atomic replace 실패 시 이전 파일 보존, 다른 계정 pause, 인증/소유권/기간/최신값 확인 전 자동 재생 0POST, 재시작 unknown reconcile 테스트.
- [ ] Checkpoint: 앱 상태에 코드/쿠키/키가 없고 origin 변경 시 브리지 폐쇄. 대기함 저장 실패 후 추가 편집 가능 여부를 명확히 잠금/경고로 표시한다.

## Task 6 — 앱 로그인·계정·캐릭터·둥근 체크보드 화면

Files: create `app/iris/desktop/page.tsx`, 위 map의 components 4개; create `tests/iris-desktop-ui.test.mjs`; modify controller 필요 최소 범위.

- [ ] RED: renderer/controller 합성 테스트로 `A 저장 완료` 응답이 B 화면 값을 바꾸지 않음, 저장 busy와 background GET 중 task row key가 유지됨, 안내 문구/지금 저장/변경 버리기 표시 assertion을 추가한다. 문자열 검사만으로 깜빡임 검증 완료라고 하지 않는다.
- [ ] Run: `node --test tests/iris-desktop-ui.test.mjs`.
- [ ] Implement: 기존 auth API 로그인/유효 session 복원; 계정 메뉴에 저장된 계정 표시(표시 정보만, 쿠키 접근 금지), 추가 계정 로그인/전환/로그아웃. 선택 캐릭터·다른 캐릭터 pending 수·상태/countdown. row key는 category+taskId이며 배경 조회로 전체 tree를 교체하지 않는다.
- [ ] GREEN: 위 명령 + `npx tsc --noEmit`. 실제 로컬 browser에서 focus/scroll/collapse 유지, 키보드 및 Escape/바깥 닫기, 계정 패널 상호 배타 확인. 브라우저 도구를 쓸 때 해당 skill을 먼저 읽는다.
- [ ] Checkpoint: 320/390/768/1280 폭, PC 글자 3단계, 6테마, 12자 닉네임 확인. 접속 코드 입력/실제 서버 저장은 한설 수동 검증으로 남긴다.

## Task 7 — native 센터 연결·singleton·안전 종료

Files: modify `iris/desktop-host.cs`, `iris/desktop-host.tests.ps1`, `iris/overlay.ps1`; create `iris/desktop-lifecycle.tests.ps1`.

- [ ] RED: 두 번째 체크보드 열기는 기존 창 활성화만 해야 함; 미저장 keep 종료→재시작 snapshot 동일, 저장 중 종료는 unknown 보관 테스트. `Assert-Equal 1 $createdWindowCount`.
- [ ] Run: `powershell -NoProfile -File iris/desktop-lifecycle.tests.ps1`.
- [ ] Implement: 센터의 캐릭터/숙제 진입은 Task 1 승인된 host를 단일 소유자로 연다. 기존 게임 read widgets/단축키 보존; native legacy edit queue와 새 queue를 동시에 활성화하지 않는다. 종료 save/keep/discard 선택, in-flight 기록 durable 보관 후 종료한다.
- [ ] GREEN: 위 명령 + host/store 테스트. 창 닫기/트레이 복구/중복 시작/owned 서버 종료 합성 확인. 실제 게임 조작 대신 일반 테스트 창을 사용한다.
- [ ] Checkpoint: Task 1 실패 시 이 Task 실행 금지. 기존 기본 실행 경로를 바꾸기 전 한설 수동 검증 필요. 게임 자동실행/OS 시작 설정 추가 없음.

## Task 8 — 전체 회귀·직접 리뷰·수동 인계

Files: modify `docs/HANDOFF.md`, `docs/BETA_FEEDBACK.md`, `docs/DECISIONS.md`, `docs/PROJECT_IRIS.md`, `iris/README.md`, `iris/ARCHITECTURE.md`; 구조 변경 사실에 맞춰 `app/SANCTUM_MASTER_GUID.md` 갱신.

- [ ] RED checklist: spec 9절의 각 경계 사례에 test name 또는 미완료 수동 항목을 연결한다. 빠진 항목은 테스트/검증 항목을 먼저 추가한다.
- [ ] Run: `node --test tests/*.test.mjs iris/*.test.mjs`, `npx tsc --noEmit`, 모든 새 native tests와 기존 `iris/overlay-support.tests.ps1`, `iris/overlay-checkboard.tests.ps1`, `git diff --check`. production build는 별도 로컬 출력에서 수행하고 dev 실행본과 충돌하지 않는다.
- [ ] Review: 변경 diff를 인증/계정 격리→queue revision→CAS/기간→unknown복구→DOM identity 순서로 직접 검토한다. 독립 검토를 사용하려면 사용자가 선택한 실행 방식 및 skill 지침을 따른다.
- [ ] GREEN evidence: mock RTT에서 edit→화면 반영, 지금 저장→POST 시작, POST→ack 시간을 각각 기록한다. 자동저장 15초와 네트워크 소요를 분리하고 운영 저장 1초를 보장하지 않는다. 유휴/연속 편집 요청 수도 보고한다.
- [ ] Manual: 한설에게 한 단계씩 앱 로그인 입력→재실행 유지→캐릭터 A 체크/B 전환→15초 뒤 A 웹 반영→지금 저장→계정 전환→로그아웃을 안내한다. 실제 변경은 한설이 선택한 본인 항목만 사용한다.
- [ ] Handoff: 구현됨/합성 통과/실제 미검증/미지원 구분. 설치물이 없거나 runtime gate 미통과면 앱 완성으로 보고하지 않는다. 공식 push 및 배포는 별도 명시 요청 전 하지 않는다.

## Plan self-review / execution handoff

- 설계의 인증·독립 timer·불명확 저장·06시·보호 저장·종료·UI·기존 읽기 보존에 담당 Task가 있다.
- 이전 화면 선택 version을 인증으로 쓰지 않고 서버 실제 session/ownership을 사용한다.
- 현재 SDK 없음과 WebView2 미확인을 첫 게이트로 표시했다. 설치 권한을 구현 승인과 혼동하지 않는다.
- batch·게임 자동 시작·전체 위젯 redesign을 첫 구현의 필수 항목으로 확대하지 않았다.
- 권장 실행 방식은 같은 대화에서 직접 Task 순서대로 구현하고 체크포인트마다 검증하는 방식이다. 인증/Windows host 경계가 결합되어 있어 지금은 파일별 병렬 구현보다 interface를 먼저 고정하는 편이 적절하다.
- 한설의 계획 검토 및 실행 방식 승인 후 Task 1부터 진행한다.
