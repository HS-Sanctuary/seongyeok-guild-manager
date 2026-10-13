# ERGON 조회·재고·작업 계획 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. 순월이 직접 구현하고 마지막에 독립 리뷰1회. 작업 단위별 RED→GREEN, 아래 체크리스트로 진행한다.

**Goal:** 에르곤에서 실제 생활 재료/레시피/가공 현황을 읽고 계산·계획을 이 PC에 저장할 수 있게 한다.

**Architecture:** 기존 native 문서 bridge에 고정된 읽기 기능만 추가하고 별도1MiB 생활 reader로 정규화한다. 클라이언트는 기존 nativeReads 직렬화 경로를 공유하고 환경/계정/선택 캐릭터 변경 후 이전 응답을 버린다. 순수 계산기와 로컬 계획 저장은 크로노스 보호 큐 및 DB에서 분리한다.

**Tech Stack:** Next.js/React/TypeScript, 기존 .NET Framework4 C# / WebView2 / PowerShell, theme CSS. 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-13-ergon-life-manager-design.md` — 2026-10-13 한설 승인.

## 단계와 승인 경계

이 계획은 승인 설계의 **조회·계획 단위**를 완성한다. 실제 소모 행동/보호 원장/제한 큐는 별도 실행 계획으로 이어가며 누락하지 않는다. 조회가 검증되기 전에 소모 명령을 노출하지 않는다. 현재 자동 실행/작업 기록 영역은 ‘아직 연결 전’임을 표시한다.

## Global Constraints

- DB/RLS/서버·음악/모바일원격/독립HUD/게임 행동 변경 없음. 임의 명령/경로/인자 bridge 없음.
- 생활 읽기1MiB/8초/깊이16/2048행/문자열160자. 기존 stats/currency64KB 계약 유지.
- source는 official-cli, 관측 시각 포함. unknown/null을0 또는 안전 상태로 바꾸지 않는다.
- 창고/잠김 재료 분리, MissingIngredients는 현재1회 부족분. 전체BOM/정확한소량채집/제작maxCount를 발명하지 않는다.
- 계획 최대50항목, 환경/생텀 계정별 이 PC에만 저장. 실행/조회값 자동 복원·자동게임명령0.
- 활성 가공 목록만10초 단일 flight. 숨김/최소화/문서·계정전환·닫기/업데이트 중 호출 중단, 이전 결과 폐기.
- **5시간 또는 주간 잔여3% 이하**이면 신규 구현 중단/인계/승인 체크포인트push. 진행 중 불완전 행동을 운영 배포하지 않는다.5% 근처에서 미리 정리 시간을 확보한다.
- 사용자 dirty/미ACK 누적 보존. 앱 강제종료0. 새native 적용에는 사용자 정상종료 확인 필요.

## Review Focus

- 전체 목록117KB/80KB가 작은 기존reader로 잘리거나 일부성공으로 보이면 안 됨 → Task1/2 대목록 경계 시험.
- 같은 클릭/동시 스탯·재화 읽기가 CLI 중복 호출/자동재시도를 만들면 안 됨 → Task2/4 단일flight/직렬화.
- 같은 계정의 캐릭터 전환·다른 환경의 늦은 응답이 현재재고로 남으면 안 됨 → Task4 context세대 시험.
- 재료/산출 일부 누락으로 가능한 횟수·총비용을 확정하면 안 됨 → Task1/3 null/BOM/채집 cap 시험.
- 손상되거나 차단된 로컬 계획을 자동 빈값으로 덮어쓰면 안 됨 → Task3/4 손상·실패 시험.

## Task 1 — 순수 조회 모델·정규화

**Files:** Create `lib/irisErgonRead.ts`, `tests/iris-ergon-read.test.mjs`.

**Interfaces:**
- `ErgonReadKind = 'activity'|'inventory'|'works'|'materials'|'gathering'|'altering'|'crafting'`.
- `ErgonSnapshot<K>` = `{schemaVersion:1,kind:K,observedAt:number,source:'official-cli',data:ErgonData[K]}`.
- `ErgonData`의 고정 형태 (모든 name은 공식 DisplayName 그대로):
  - activity: `{autoPlaying,autoTraveling,dead,reviving,inCombat,dialoguePlaying,waitingForSelection,inBattlefield,tutorialPlaying,inScenario,sequencePlaying,performancePlaying,minigame,housingEdit:boolean|null;dungeonState:string|null}`.
  - inventory: `{weight:number|null,maxWeight:number|null}` (Decimal 값).
  - works: `{completedCount:number|null,items:{name:string,facility:string,state:string|null,completed:boolean|null,remainingSeconds:number|null}[]}`.
  - materials: `{items:{name:string,category:string,categoryName:string|null,location:'inventory'|'account_storage'|'character_storage',count:number|null,locked:boolean|null}[]}`.
  - gathering: `{items:{name:string,toolOk:boolean|null}[]}`.
  - altering/crafting: `{unlocked:boolean|null,items:{name:string,available:boolean|null,producedPerUnit:number|null,reason:string|null,missing:{name:string,required:number|null,owned:number|null}[]|null}[]}`. 가공 unlocked는 null, 제작은 craftingUnlocked에 대응. MissingIngredients 자체가 누락되면 null, 명시 빈 배열만 []로 표시.
- `parseErgonSnapshot(kind:ErgonReadKind,value:unknown):ErgonSnapshot`, `ergonReadKinds`, `ergonSnapshotStale(snapshot,now):boolean` (15초).

- [ ] RED: unknown kind/추가 envelopefield/잘못된시각/NaN·음수/0산출/누락nullable/unknownstate/동명/잠김/위치 분리/2048↔2049행/160↔161자 시험. 작성 후 `node --test tests/iris-ergon-read.test.mjs` → 처음FAIL 확인.
- [ ] GREEN: 숫자는 유한·안전 비음수 정수 또는 nullable. 무게만 유한소수 허용. 산출0은 보존하되 Task3 계산불가. 불완전하지만 알려진 nullable는 보존, 잘못된 타입은 전체 응답 거부. 동명은 실행 가능한 고유ID로 승격하지 않음.
- [ ] Verify: 동일명령PASS, UI 전체 test command도 마감 전에 실행. 좁은 단위 로컬 commit.

## Task 2 — 고정 native 읽기·bridge 연결

**Files:** Create `iris/desktop-life-read.cs`, `iris/desktop-life-read.tests.ps1`, `tests/iris-ergon-bridge.test.mjs`. Modify `iris/desktop-bridge.cs`, `iris/desktop-webview.cs`, `iris/desktop.ps1`, `iris/build-beta.ps1`, `lib/irisDesktopStore.ts`, 기존 WebView compile fixture의 `iris/desktop-webview.tests.ps1`, `iris/desktop-startup-close.tests.ps1`, `iris/desktop-grip.tests.ps1`.

**Interfaces:**
- C# `DesktopLifeReader.ReadAsync(string kind):Task<object>` / `Normalize(string kind,string json):object`가 Task1 canonical envelope를 반환. 읽기 종류→고정 CLI: get_activity/get_inventory/get_altering_works/get_items(고정 Ingredient필터)/get_gatherable_items/get_alterable_items/get_craftable_items.
- `DesktopBridge.BindLifeRead(Func<string,Task<object>>)`은 callback만 참조해 기존 독립bridge compile시험 보존.
- `game.life.capabilities` payloadnull→`{schemaVersion:1,readOnly:true,kinds:[...7]}`. `game.life.read` payload정확히`{kind}`만 허용. 기존 gameBusy/origin/epoch/id 잠금 공유, revoke후 응답 거부.
- `createDesktopStore.lifeCapabilities():Promise<void>` / `readLife(kind:ErgonReadKind):Promise<ErgonSnapshot>`; epoch별caps캐시, Task1 parser 재검증. 구앱에는 정상재시작 안내. 기존 protectedqueue schema3 변경없음.

- [ ] RED: native Normalize 실제1MiB/8초/2048/nullable 경계, CLI결과 game_off/권한거부/오류를 성공으로 만들지 않음. delegate 시험에서 unknown kind·extra payload·foreign origin·replay·stale epoch0호출, 동일gameBusy 동시1호출, 117KB/80KB 응답wholePASS, revoke후okfalse. `powershell -NoProfile -File iris/desktop-life-read.tests.ps1` 및 새Node bridge시험FAIL 확인.
- [ ] GREEN: shell없는 fixedexe Path검증/UTF8/크기한도, command별개별normalize. life만1MiB, 과도응답/timeout은오류. lifecycle source목록에새CS 추가. WebView의 실제 Visible/WindowState/닫기 상태를 callback에서 재확인해 숨겨진 호스트의 CLI 읽기도 거부한다. native는읽기callback만노출하고execute/stop/storelife action은제공하지 않음.
- [ ] Verify: 위Native/Node 및 기존 `iris/desktop-bridge.tests.ps1`, `iris/desktop-webview.tests.ps1`, protectedstore/liveupdate기존회귀. 실행 fixture는실제게임행동0, launcher강제종료0. 로컬commit.

## Task 3 — 계산·로컬 계획 저장

**Files:** Create `lib/irisErgonPlan.ts`, `tests/iris-ergon-plan.test.mjs`.

**Interfaces:**
- `ErgonPlanItem={id:string,kind:'gathering'|'altering'|'crafting',displayName:string,targetQuantity:number}` (목표1~1000000).
- `parseErgonPlans(value:unknown):ErgonPlanItem[]`, `readErgonPlans(storage,environment,accountId):{items:ErgonPlanItem[],persistent:boolean,unreadable:boolean}`, `writeErgonPlans(...items):boolean`. 저장키`iris_ergon_plans:v1:<environment>:<encoded accountId>`, envelope정확히`{schemaVersion:1,items}`/32KiB/50개/uniqueid/이름160자.
- `calculateErgonPlan(item,catalog,now):{requiredRuns:number|null,wingMinimum:number|null,wingMaximum:number|null,outputPerRun:number|null,missingScope:'one-unit-only'|'unavailable',reasons:string[]}`. 제작/가공의확인된산출량으로ceil계산, 산출모름계산불가. 채집100은한계이지확정산출이아님: 최소예상호출·날개만표시/최대null. 전체BOM미지원사유보존.

- [ ] RED: 목표0/NaN/소수/한도/Produced0·null/ceil/채집목표20/현재1회부족분/동명/stale, invalidstorage버전/초과크기/51개/환경계정분리/손상내용보존/차단저장세션유지. `node --test tests/iris-ergon-plan.test.mjs` → FAIL 확인.
- [ ] GREEN: 저장은의도만, 레시피현황·재고·실행상태·토큰미포함. 손상raw는unreadable로알리고명시초기화전overwrite하지 않음. 미래실행은이계획을신뢰하지않고다시검증한다.
- [ ] Verify: 관련시험PASS, 로컬commit.

## Task 4 — 실제 에르곤 조회·계획 화면

**Files:** Create `components/iris/useErgonSession.ts`, `components/iris/DesktopErgonMaterials.tsx`, `components/iris/DesktopErgonPlanning.tsx`, `tests/iris-ergon-session.test.mjs`, `tests/iris-ergon-read-planning.browser.mjs`. Modify `components/iris/DesktopErgon.tsx`, `components/iris/DesktopCenter.tsx`, `app/iris/desktop/page.tsx`, `app/iris/desktop/desktop.css`.

**Interfaces:**
- `useErgonSession({environment,accountId,characterId,active,locked,read(kind),getContextVersion})` exposes `snapshots`, `loadingKind`, `notice`, `plans`, `persistent`, `unreadable`, `refresh(kind)`, `addPlan`, `removePlan`, `updateTarget`, `resetUnreadablePlans`.
- `DesktopErgon`은 같은 세션 props를 받고 네 메뉴를 관리한다. Center에 `ergonPanel?:(active:boolean)=>ReactNode`를 추가해 기존 panel active 형태로 연결한다. page는 로그인 계정이 있을 때만 `environment:accountId:characterId` key로 화면을 만든다.
- page의 `readLife`는 기존 nativeReads 직렬 실행과 kind별 중복 합치기를 공유한다. 시작/완료 시 context를 확인하고 무효화된 응답을 현재 값으로 표시하지 않는다. 잠금/팝업/hidden/게임 최소화 중에는 새 조회를 시작하지 않는다.

- [ ] RED: 실제 React fixture(합성 IO만)에서 같은 kind 새로고침 연속2회→1호출, class→ergon→class 초안 유지, 두 캐릭터/계정의 늦은 응답 폐기, hidden0poll, works10초 중복 없음, 실패 시 이전 값 stale 표시. 계획 생성/재시작/저장 실패/손상 기록 보존, 불완전 recipe의 총소모량 확정 표시 금지를 시험한다.
- [ ] GREEN: 재료검색/위치필터/잠김/무게/가공시설별목록과조회상태, 경로별레시피검색·목표·1회부족분/계산/계획50개. 지금저장은로컬계획임을명확히표시. DB쓰기는0. 자동실행/원장은미연결상태표시유지.
- [ ] Verify: 실제320/360/390/720px·6/13.5/22pt·6테마/Escape/밖클릭/긴이름2048목록내부스크롤. `node tests/iris-ergon-read-planning.browser.mjs <playwright package.json>` → PASS, `node --test tests/iris-ergon-*.test.mjs` → PASS. 같은3011 fixture는순차실행. 로컬commit.

## Task 5 — 묶음 마감·다음 실행 단계 인계

**Files:** Update `docs/HANDOFF.md`, `docs/RELEASE_NOTES.md`, `app/SANCTUM_MASTER_GUID.md`, `docs/relay/TO_YEONGGEOP.md`, `docs/DECISIONS.md`, 현재설계/계획진행기록. 실제변경한nativepackaging검증은별도scratch출력.

- [ ] 모든 Task관련실제명령결과/knownfail/skips를읽고기록. 전체 `node --test --test-concurrency=1 tests/*.test.mjs`, `npx tsc --noEmit`, 관련eslint, 격리webpackbuild 및nativecompile/패키지회귀→성공확인. 사용중.next·설치본을덮어쓰지않음.
- [ ] requesting-code-review로마지막fresh검토1회(구현분만). Important를실패시험RED→GREEN으로고치고전체검증. 새리뷰 반복하지않음.
- [ ] 실제사용자앱native적용은정상종료확인후. 읽기만확인/게임명령0. 실제시각과조회cache/support상태를보여준다.
- [ ] 에르곤행동별후속실행계획(시설하나수령→가공/제작1회→일반채집→제한큐/보호원장)을작성·검토받는다. 이번readonly완료를남은전체생활완료로표현하지않음.
- [ ] 잔여사용량조건시마감commit/인계branch일반push. 충돌/인증은우회하지않음. WIP는main운영에합치지않고정확한branch/commit명시. 일반기능배포/공개패키지/공지출시는완료검증후마감승인별도.

## 계획 자체 점검·진행 상태

- spec의조회/재고/계산/계획은Tasks1~4, 보관·배포경계는Task5에대응. 행동/원장/제한큐는별도하위프로젝트로후속계획을남겨승인순서를보존.
- 인터페이스명/nullable/stale 규칙은 전체 task에서 일치한다. 추측한 BOM·quantity 인자·일반 shell dispatch를 넣지 않았다.
- 2026-10-13 한설 ‘PC 작업부터…구현 최대한’으로 이 계획 실행 승인. 직접 진행 중. Task1~4 코드와 시험을 연결했으며 최종 독립 검토·추가 경계 시험·새소스 격리 빌드를 진행한다. 행동 endpoint는 아직 없음.
- 사용량기준확인시5시간잔여55%/주간19%였으며3%조건미충족. UI후속은별도계획에검증완료되어반복하지않는다.
