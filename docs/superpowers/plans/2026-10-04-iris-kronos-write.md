# IRIS 크로노스 체크 저장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 확인한 본인 캐릭터의 숙제를 Windows 체크보드에서 수정하고 명시적으로 생텀에 저장한다.

**Architecture:** 기존 browser/native capability 경계 안에 메모리 변경 큐를 추가한다. 수정 허용된 브라우저만 same-origin 인증 API를 호출하며 서버는 최신 체크값과 비교해 변경 항목만 저장한다. 게임 조작과 시낙시스는 별도 범위다.

**Tech Stack:** Next.js App Router, TypeScript, Supabase 기존 서버 클라이언트, Node.js ESM/node:test, Windows PowerShell 5.1/C# WinForms.

**Spec:** `docs/superpowers/specs/2026-10-04-iris-kronos-write-design.md`

상태: 한설 `작업진행해줘 왠만하면 쭉 해줘`로 현 대화 직접 실행 승인. Task1~4 로컬 구현·합성 검증 완료(161/161·타입·범위 린트·웹빌드), Task4 Step7 실제 운영 저장 대상 승인/사용자 대조는 별도 대기. 독립 agent 리뷰·commit/push/배포 없음. 아래 체크 목록은 실행 절차 원문이며 실제 증거/인터페이스 차이는 HANDOFF 최신 검증 절과 ignored `.superpowers/sdd/2026-10-04-iris-kronos-write/progress.md`에 기록한다.

## Global Constraints

- 첫 출시 범위는 **명시적 저장 버튼**이다. 자동 저장은 이 설계에서 활성화하지 않는다.
- 큐는 최대 200항목, 요청 본문은 기존 64KiB 제한을 따른다. 초과 시 저장을 막고 안내하며 자르지 않는다.
- 큐는 메모리만 사용하며 재연결 후 자동 재생하지 않는다.
- 최신 저장값이 기준값과 다르고 원하는 값도 아니라면 409 충돌로 반환한다.
- 항목별 직렬 저장 결과를 반환한다. 여러 항목의 원자적 일괄 성공을 약속하지 않는다.
- 운영 스키마/RLS/권한 변경 없이 기존 체크 필드만 사용한다.
- 자동 검증에 실제 운영 DB 쓰기와 게임 조작은 포함하지 않는다.
- 승인 브라우저 탭을 닫으면 저장할 수 없다. 새로운 동반 인증 체계는 추가하지 않는다.
- 클래스 레벨 수정, 전체 완료 버튼, 배경 자동 완료는 제외한다.
- commit/push/배포·공지·게임 조작·수령/채집/가공 자동화·시낙시스 신청/취소는 이번 범위가 아니다.
- 현재 dirty 변경을 보존한다. 실행 시작 시 using-git-worktrees 규칙에 따라 기존 적합한 checkout 재사용 여부를 확인하고, 무단 reset/복사/commit은 하지 않는다.
- 권장 실행은 영겁이 이 대화에서 순서대로 직접 수행하는 방식이다. 별도 에이전트 리뷰는 사용자 요청 전까지 하지 않는다.

## Review Focus

1. 한국 일/주간 경계와 모호한 구형 반복 슬롯: 이전 기간 요청은 거절하고 기록을 초기화하지 않는다(Task1).
2. 저장 성공 응답 유실: 최신값을 재조회하여 확인하고 자동 POST 재전송하지 않는다(Task3).
3. 승인 취소·계정 변경 도중 저장: 새 저장을 차단하고 이전 결과를 다른 계정에 표시하지 않는다(Task2~3).
4. 조회 주기가 미저장 화면을 덮음: 최초 기준과 로컬 최종값을 유지하고 충돌을 표시한다(Task2~4).
5. 숨김·위젯 닫기와 앱 종료 혼동: 숨김은 큐 보존, 실제 종료는 미저장 경고(Task4).

## 파일 책임과 공통 계약

- `lib/irisKronosWrite.ts`(신규): 입력 검증·기간 키·원래 체크 형식 보존한 단일 항목 변경 계산. DB 및 native 의존 없는 순수 로직.
- `lib/server/irisKronosWrite.ts`(신규): 인증된 소유 캐릭터의 읽기→비교→조건부 쓰기 어댑터.
- `app/api/iris/kronos/route.ts`: 기존 GET 보존, 최소 POST 추가. GET에 `writeContext:{periodKeys:{daily,weekly,abyss,raid}}`를 추가하고 구형 수신자는 무시 가능하게 한다.
- `iris/kronos-edits.mjs`(신규): 메모리 큐와 요청/결과 검증.
- `iris/connection-state.mjs`, `iris/connection-http.mjs`: 큐·수정 허용을 기존 연결 세대에 귀속.
- `lib/irisRelay.ts`, `app/iris/page.tsx`: 별도 수정 동의·직렬 저장·결과 전달.
- `iris/overlay-support.cs`, `iris/overlay-checkboard.cs`, `iris/overlay.ps1`: typed 변경 이벤트·표시·사용자 확인·native HTTP 배선.

공통 타입:

```ts
type Category = 'daily'|'weekly'|'abyss'|'raid';
type Edit = {requestId:string;generation:number;selectionVersion:number;
  accountId:string;characterId:string;category:Category;taskId:string;
  baseCompleted:number;desiredCompleted:number;periodKey:string};
type EditResult = {requestId:string;status:'saved'|'conflict'|'failed'|'unknown';
  completed:number|null};
```

`requestId`는 로컬 생성 UUID, ID는 기존 읽기 계약의 최대100자 비공백 문자열이다. 수치는 안전한 정수0..항목total이며 실제 total은 서버 catalog에서 계산한다. 일반 항목은0/1이다. periodKey는 서버가 GET에서 제공하는 한국 날짜/주차 키이며 native가 날짜를 만들어 대체하지 않는다. 서버는 이를 매 POST의 현재 기간과 비교한다. 브라우저/node/C#는 위 타입 이름·필드를 동일하게 사용한다.

## Task 1: 부분 변경 계산과 인증된 서버 저장

**Files:** Create `lib/irisKronosWrite.ts`, `lib/server/irisKronosWrite.ts`, `tests/iris-kronos-write.test.mjs`; Modify `app/api/iris/kronos/route.ts`; Extend `tests/iris-api.test.mjs`.

**Interfaces:**
- `getIrisPeriodKeys(now:Date): Record<Category,string>` — 기존 웹 reset 기준을 조사해 한국 시간 기준으로 구현. reset 시각을 임의로 새로 정하지 않는다.
- `computeIrisKronosEdit(character,catalog,edit:Edit,now:Date): {field:'daily_checks'|'weekly_checks'|'raid_checks';baseRaw:unknown;nextRaw:unknown;completed:number;changed:boolean}` — 잘못된 입력400, 기간/최신값 경쟁409, 의미 불명 레거시503에 대응하는 typed 오류.
- `saveIrisKronosEdit(db,account,edit:Edit,now:Date): Promise<EditResult>` — 서버 세션 account 사용, 본문 accountId와 불일치 거절. 소유권은 실제 owner 일치만 쓰기를 허용한다. GET의 owner 없는 구형 대표 읽기 호환을 쓰기 권한으로 확대하지 않는다.
- POST는 `{edit:Edit}` 한 항목만 받아 `{result:EditResult}`를 반환한다. 쿠키 인증 실패401/소유권403/입력400/경쟁409/조회 실패503. 원본 프로필이나 raw 체크를 반환하지 않는다.

- [ ] Step 1: 순수 계산 실패 테스트 작성. `rejects_out_of_range`, `preserves_unrelated_and_legacy_checks`, `already_desired_is_noop`, `conflicting_latest_rejected`, `korean_period_boundary_rejected`, `ambiguous_legacy_repeat_preserved`를 정의한다. 검은 구멍/결계/브리치의 synthetic ID9900~9902도 현재 catalog와 같은 규칙으로 확인한다.
- [ ] Step 2: `node --test tests/iris-kronos-write.test.mjs` 실행, 신규 export/계산이 없어서 실패함을 확인한다.
- [ ] Step 3: 위 순수 함수 구현. `lib/matchingUtils.ts`의 `setTaskChecked`/`setChecklistField`를 재사용하고, 반복 슬롯은 기존 웹 표현을 조사해 해당 항목만 변환한다. 반복 daily 표현이 현재 reader와 다르면 조용히 쓰지 말고 해당 표현의 호환 테스트와 읽기 수정 범위를 기록한다.
- [ ] Step 4: fake DB 기반 API 실패 테스트 작성: 무인증·승인대기·다른 소유자·owner 없는 대표·Origin 불일치·숨긴 항목·과대한 본문·임의 프로필 필드·CAS 경합 거절. 최신값=desired이면 UPDATE 호출0, 정상 변경은 owner/id/기존 체크 조건이 모두 붙으며 반환 completed가 일치함을 assert한다.
- [ ] Step 5: 서버 어댑터와 POST 구현. session/ownership/catalog 검증 후 조건부 단일 필드 UPDATE와 반환행 검사. GET periodKeys 추가. DB migration/RPC 새로 만들지 않는다.
- [ ] Step 6: `node --test tests/iris-kronos-write.test.mjs tests/iris-api.test.mjs`에서 모두 PASS 확인. 기존 GET 계약과 member-mutations 회귀를 실행한다. 제품 코드 구현 전 Supabase 스킬의 현재 문서 확인 절차를 수행한다.
- [ ] Step 7: Task1 diff 자체 검토와 완료 기록. commit은 하지 않는다.

## Task 2: 승인·선택에 묶인 메모리 변경 큐

**Files:** Create `iris/kronos-edits.mjs`, `iris/kronos-edits.test.mjs`; Modify `iris/connection-state.mjs`, `iris/connection-http.mjs`; Extend 각 기존 `.test.mjs`.

**Interfaces:**
- `KronosEditQueue`에 `stage(edit:Edit)`, `submit():Edit[]`, `pending():Edit[]`, `applyResult(result:EditResult)`, `discard()`, `snapshot()`를 제공한다. snapshot은 미저장/제출 중/불명/충돌 상태와 건수를 포함하고 비밀값은 포함하지 않는다.
- 기존 연결 상태에 `writeAllowed:boolean`(기본false)와 `writeContext` 추가. begin/disconnect/account change로 수정 승인 해제, 만료 때 쓰기 차단. 미저장 큐는 UI에 폐기 여부를 알릴 수 있도록 해당 원래 identity를 보존하지만 실행 가능한 새 연결 큐로 옮기지 않는다.
- 새 native `POST edits`(stage), `POST edits/submit`, `POST edits/discard`; browser `POST write-consent`({allowed:boolean,generation}), `GET edits`, `PUT edits/results`({generation,selectionVersion,results}) 경로를 기존 `/api/connection/{native|browser}/` 아래 둔다. native POST 선택/새 연결에는 `discardPending:true`가 없으면 미저장409.
- browser GET edits는 제출된 것만 반환하며 조회할 때 제거하지 않는다. saved 결과도 Task3 재조회 검증 후에만 전달받는다.

- [ ] Step 1: 실패 테스트 `repeated_edits_keep_first_base_and_final_target`, `return_to_base_removes_pending`, `submit_does_not_duplicate`, `201st_item_rejected_without_truncation`, `poll_does_not_replace_pending`, `partial_success_only_removes_saved` 작성. 예: stage0→1→2 결과 base0/desired2, 저장 전2→0은 큐0건.
- [ ] Step 2: `node --test iris/kronos-edits.test.mjs` RED 확인.
- [ ] Step 3: 큐 구현. 제출 중 항목 재수정은 거절해 첫 범위에서 edit revision 경쟁을 만들지 않는다. failed/conflict는 명시 재시도, unknown은 재조회 필요 상태로 남긴다.
- [ ] Step 4: 역할·Origin·capability·세대·선택·쓰기 승인·61초 만료·계정 변경 테스트를 기존 state/HTTP 테스트에 추가한다. forged result, wrong requestId, 잘못된 periodKeys와 과대64KiB도 거절한다.
- [ ] Step 5: HTTP/state 배선 구현. 기존 읽기 동의로 writeAllowed가 true가 되지 않게 하고 결과 적용 전에 원래 identity와 현재 연결 모두 검사한다.
- [ ] Step 6: `node --test iris/kronos-edits.test.mjs iris/connection-state.test.mjs iris/connection-http.test.mjs` 모두 PASS 및 기존 읽기/clear 회귀 확인.
- [ ] Step 7: Task2 diff 자체 검토와 완료 기록. commit은 하지 않는다.

## Task 3: 웹 수정 동의와 직렬 저장 중계

**Files:** Modify `lib/irisRelay.ts`, `app/iris/page.tsx`; Extend `tests/iris-relay.test.mjs`; Create `tests/iris-write-relay.test.mjs`.

**Interfaces:**
- `IrisRelay.setWriteAllowed(allowed:boolean):Promise<void>` — 별도 사용자 동의 후 browser write-consent 호출. 승인 실패 시false 유지.
- 기존 cycle 안에서 제출 큐를 확인하고 Task1 POST를 항목별 직렬 호출한다. 새 parallel interval/poll loop를 만들지 않는다. 읽기15초와 직렬 순서를 공유하고 변경 조회도 본문64KiB/8초 제한을 유지한다.
- 각 POST 후 해당 캐릭터 GET의 completed와 identity/period를 대조한 결과만 Task2 results로 돌려준다. 확인 전 native saved 금지. GET 실패는unknown, 최신=desired는saved, 최신=base는failed(사용자 재시도 가능), 다른 값은conflict.

- [ ] Step 1: fake fetch 테스트 `no_write_before_separate_consent`, `serial_one_post_per_request`, `timeout_requeries_without_repost`, `partial_batch_results`, `consent_revoked_mid_batch`, `account_switch_stops_remaining`, `wrong_generation_ack_ignored` 작성. timeout 후 POST 호출1, 재조회 일치 뒤 saved1회임을 assert한다.
- [ ] Step 2: `node --test tests/iris-write-relay.test.mjs` RED 확인.
- [ ] Step 3: relay 구현. 기존 bare-call fetch/timer wrapper 유지. 조회 실패/취소/계정 변경 시 잔여 POST 중단; 이미 서버에 도달한 요청을 취소했다고 주장하지 않는다. 숨김 중 조회 정지 규칙이 저장 중계를 중간에 끊으면 unknown으로 남기고 복원 때 재조회한다.
- [ ] Step 4: `app/iris/page.tsx`에 명확한 수정 동의/중단 버튼·탭을 유지해야 한다는 안내 추가. 읽기 승인 자동 확장 금지. 실제 세션 만료 시 로그인 요구와 저장 실패를 구분하고 raw 서버 오류/토큰을 출력하지 않는다.
- [ ] Step 5: `node --test tests/iris-write-relay.test.mjs tests/iris-relay.test.mjs` 모두 PASS. 웹 UI 확인은 합성 상태로만 수행하고 실제 저장 버튼은 승인 전 누르지 않는다.
- [ ] Step 6: Task3 diff 자체 검토와 완료 기록. commit은 하지 않는다.

## Task 4: native 체크 조작·저장 상태·전환 확인과 인계

**Files:** Modify `iris/overlay-checkboard.cs`, `iris/overlay-support.cs`, `iris/overlay.ps1`; Extend `iris/overlay-checkboard.tests.ps1`, `iris/overlay-checkboard.test.mjs`, `iris/overlay-support.tests.ps1`, `iris/overlay.test.mjs`; Modify `iris/README.md`, `iris/ARCHITECTURE.md`, `docs/HANDOFF.md`, `docs/IRIS_WIDGET_ROADMAP.md`, `app/SANCTUM_MASTER_GUID.md`, `docs/relay/TO_SOONWOL.md`.

**Interfaces:**
- `CheckboardWindow.EditRequested`(category,taskId,desiredCompleted)、`SaveRequested`、`DiscardRequested` 이벤트. C# 이벤트는 controller에 HTTP 권한을 넘기지 않고 UI intent만 전달한다.
- `ConnectionDisplay`에 `WriteAllowed`, `PeriodKeys`, `PendingEdits`, `SaveState`, `PendingCount` 추가. 숫자·identity 검증 실패는 수정 잠금.
- `CheckboardWindow.SetWriteState(ConnectionDisplay display)`는 선택 캐릭터·동의·큐 상태에 따라 컨트롤을 enable하고 미저장 최종값과 합계를 표시한다. 기존 `SetPalette`/readonly Render 경로는 유지한다.
- PowerShell은 Edit→native stage, 저장→submit만 호출한다. native에서 서버 DB URL 직접 호출 금지. 변경/종료/새 연결은 기본 No 폐기 확인, 위젯 닫기와 숨김은 큐 유지.

- [ ] Step 1: synthetic Windows 테스트 `readonly_controls_disabled`, `ordinary_toggle_and_repeat_bounds`, `pending_values_survive_refresh`, `save_blocks_double_click`, `failed_is_not_saved`, `hide_and_close_preserve_queue`, `exit_or_selection_requires_discard_confirmation`, `six_theme_editable_rows` 작성. 반복0에서−/total에서+는 disabled, 수정 취소0건, 새 캐릭터 늦은결과 무시를 assert한다.
- [ ] Step 2: `node --test iris/overlay-checkboard.test.mjs iris/overlay.test.mjs` RED 확인. 테스트에서 실게임/native 소유 서버 대신 합성 endpoint 응답 사용.
- [ ] Step 3: typed display/events와 체크·−/+·저장/폐기·상태 구현. 화면보다 긴 목록은 내부 세로 스크롤,120자 이름 전체 표시 유지. 완료 필터는 로컬 변경 기준 합계를 보여주되 미저장 표시를 숨기지 않는다.
- [ ] Step 4: PowerShell 배선과 확인 메시지 구현. 동일 Add-Type assembly compile 유지. 위젯 hiding과 IRIS 종료를 분리하고 OS 강제종료 복구 보장 문구 금지.
- [ ] Step 5: 관련 Windows 테스트 PASS 확인 후 `node --test`, `npx tsc --noEmit`, `npm run build`, `npx eslint lib/irisKronosWrite.ts lib/server/irisKronosWrite.ts lib/irisRelay.ts app/api/iris/kronos/route.ts app/iris/page.tsx`, `git diff --check` 실행. 기존 경고는 새 오류와 구분 기록하며 실패를 통과로 보고하지 않는다.
- [ ] Step 6: 전체 diff 자체 점검 및 실제 결과만 문서 반영. 시낙시스/자동화/실제 운영 저장은 미완료로 유지한다. 현 작업에 대한 독립 리뷰는 수행하지 않았다고 명시한다.
- [ ] Step 7: 한설에게 테스트할 localhost `/iris`와 오버레이 센터→숙제 경로 안내. 실제 저장 검증은 대상 항목을 별도 승인받은 뒤 한설이 수행한다. 체크→저장→웹대조→새로고침 유지→무관 항목 보존을 확인한다. 코드·자동 검증 완료와 사용자 실동작 확인을 나눠 인계한다.

## 작성자 검토와 실행 인계

- 설계의 동의/명시 저장/부분 변경/경쟁/타임아웃/상태/기간/전환/숨김/종료 요구를 Task1~4에 대응했다.
- 큐의 프로세스 메모리 지속성과 앱 강제종료 미보장, DB 원자적 일괄 저장 미보장을 명시했다.
- 추가 스키마 변경이 필요한 상황은 실행 중단·별도 승인 조건이다. 현재 범위에서 신규 의존성·새 인증·운영 SQL을 설치/실행하지 않는다.
- 실행 권장: **영겁이 현재 대화에서 직접 순차 구현**, 각 Task RED→GREEN과 자체 점검. 사용자 계획 승인 뒤 executing-plans 스킬로 시작한다. 에이전트 리뷰는 별도 승인 없으므로 제외했다.
- 이 계획을 작성한 것은 구현 완료가 아니며 테스트 명령은 아직 실행한 결과가 아니다.
