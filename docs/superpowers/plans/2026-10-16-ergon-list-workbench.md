# ERGON List Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. 현재 세션에서 직접 구현하는 방식을 권장한다. 실행계획 사용자 검토 전에는 제품 코드를 수정하지 않는다.

**Goal:** 항상 보이는 작업 목록에서 수량·품목·제거를 편집하고, 즐겨찾기·재료·진행 상황을 한 작업대에서 확인한다.

**Architecture:** 기존 session.plans/Queue 공유 예약/Execution 관측/원클릭 수령 조정기를 재사용한다. 순수 편집·즐겨찾기 저장 모듈과 작은 행/품목 선택 컴포넌트를 추가하고 기존 편집 중복·드롭다운만 대체한다. native 소비/API/운영 DB는 변경하지 않는다.

**Tech Stack:** 기존 Next.js/React/TypeScript·CSS 역할 토큰·node:test/loadTS·기존 실제 React Playwright fixture. 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-16-ergon-list-workbench-design.md` (상세 설계 사용자 승인, 실행계획 검토 전).

## Global Constraints

- 기존1~1,000,000 정수/최대50계획/32KiB 계약과 계획 schema1 유지. 수량은 추가 생산 수량이다.
- 즐겨찾기 최대200개/32KiB, schema1, 환경/계정별 분류+정확한 이름만 저장. 손상 원본 자동 덮어쓰기 금지.
- 기존 idle15초 직렬 조회/숨김·준비·실행 pause/복귀·종료 즉시 갱신과 실행관측2초/신선도15초 유지.
- 320/390/768/1280px, 글자18/20/22px 검증. PC는 rem, 모바일 보조글 최소12px. 긴 이름/수치 가로 넘침 금지.
- 가방·계정창고·캐릭터창고를 분리한다. 원격 조건은 전송기·부스러기·주간창이며 비용4 고정추정/무료합산/모달 자동승인 금지.
- 목표/품목 수정으로 옛 진척을 새 목표에 넘기지 않는다. 준비/동의/실행/관측 중 충돌 편집 차단, unknown 원본 보존.
- 새 native 명령/전체 자동chain/시설 재등록/Chronos 가져오기/총보유목표 모드/PC알림은 이번 범위 밖이다.
- 실제 게임 시험은 직전 질문→승인→1회→결과 질문. 정상 재시작·앱 실수령 검증은 별도 사용자 확인 없이는 진행하지 않는다.
- 최신 사용자 요청에 따라15% 중단 약속은 다시 말하기 전까지 해제. 운영main/ZIP/DB/공지·강제앱종료·개인dirty 변경·무단push 금지.

## Review Focus

1. 입력Enter와 blur 연속 발생 시 저장2회·실행버튼 전파가 없어야 한다 → Task2 실제React시험.
2. 교체 검색 중 계정/캐릭터 전환 후 늦은 목록 응답이 새 scope에 적용되지 않아야 한다 → Task3 지연응답시험.
3. 실행 시작과 편집 적용이 같은 틱에 겹쳐도 요청의 품목/수량이 바뀌지 않아야 한다 → Task3 경합시험.
4. 진행 있는 행을 같은 분류/품목의 기존 행으로 교체해도 중복예약·진척 병합이 없어야 한다 → Task1/3시험.
5. 손상/쓰기차단 즐겨찾기 및50개 계획 상태에서도 기존 저장 원본과 현재 선택을 잃지 않아야 한다 → Task1/3시험.

## File Map

- 새 `lib/irisErgonPlanEdit.ts`: 기존 parseErgonPlans를 이용한 순수 편집/중복 결과.
- 새 `lib/irisErgonFavorites.ts`: 제한된 로컬 schema 저장·검증·scope 키.
- 새 `components/iris/DesktopErgonPlanRow.tsx`: 수량draft/키보드·선택/교체/제거 한 행.
- 새 `components/iris/DesktopErgonCatalog.tsx`: 분류·검색·전체/별 필터·별/담기/교체 적용.
- 수정 `DesktopErgonQueue.tsx`: 기본 노출 행 재사용 + 통합부족분 접기; 저장/진척 계산은 기존 단일 경로.
- 수정 `DesktopErgon.tsx`: 편집·선택/카탈로그 조정과 기존 소비경계 연결; 중복드롭다운/보관편집 제거.
- 수정 `DesktopErgonWorkbench.tsx`, `app/iris/desktop/desktop.css`: 재료별 위치·원격 조건/반응형3영역/역할색.
- 기존 `useErgonSession.ts`, `irisErgonPlan.ts`, `irisErgonCraftGoal.ts`, `irisErgonSupply.ts`는 계약 재사용. 필요 이상 구조변경 금지.

## Task 1: 순수 계획 편집·즐겨찾기 저장

**Files:** Create 위 lib2개, `tests/iris-ergon-plan-edit.test.mjs`, `tests/iris-ergon-favorites.test.mjs`.

**Interfaces:**
- `PlanEdit = {type:'quantity';id:string;quantity:number}|{type:'replace';id:string;kind:ErgonPlanItem['kind'];displayName:string;newId:string}|{type:'remove';id:string}`.
- `editErgonPlans(items:ErgonPlanItem[],edit:PlanEdit):{items:ErgonPlanItem[];selectedId:string|null;duplicateId:string|null}`. 검증실패는 throw/입력불변. replace 중복은 입력 그대로+duplicateId, 자기 동일품목은no-op, 정상교체는newId/옛추가수량 유지. 제거는다음행→이전행→null. 수량 변경은기존ID유지/부모goal계약으로옛진척제외.
- `ErgonFavorite={kind:ErgonPlanItem['kind'];displayName:string}`; `parseErgonFavorites(value:unknown):ErgonFavorite[]`는 정확 `{schemaVersion:1,items}`만 허용.
- `FavoriteStorage=Pick<Storage,'getItem'|'setItem'>`; `readErgonFavorites(storage:FavoriteStorage,environment:string,accountId:string):{items:ErgonFavorite[];persistent:boolean;unreadable:boolean}` / `writeErgonFavorites(storage:FavoriteStorage,environment:string,accountId:string,items:ErgonFavorite[]):boolean`. key는 spec 그대로 encodeURIComponent scope, 손상값은 덮어쓰지 않는다.

- [ ] RED시험: quantity0/1.5/1000001 거부·원본불변, replace(newId) 옛수량유지/중복시불변, 마지막제거null, favorites201개/32KiB초과·중복·제어문자·추가필드거부, 계정/환경분리·손상원본/쓰기실패 보존. 기존50개·진척있는 중복행도 입력 그대로인 assertion 추가.

```js
const original=[{id:'a',kind:'crafting',displayName:'검',targetQuantity:20}];
assert.throws(()=>editErgonPlans(original,{type:'quantity',id:'a',quantity:0}));
assert.equal(original[0].targetQuantity,20);
const next=editErgonPlans(original,{type:'replace',id:'a',kind:'altering',displayName:'목재',newId:'b'});
assert.deepEqual(next.items,[{id:'b',kind:'altering',displayName:'목재',targetQuantity:20}]);
assert.equal(editErgonPlans(original,{type:'remove',id:'a'}).selectedId,null);
```
- [ ] `node --test tests/iris-ergon-plan-edit.test.mjs tests/iris-ergon-favorites.test.mjs` → 의미 있는 동작 부재로 FAIL 확인.
- [ ] 명시한 순수 함수·schema만 구현. native API/재고/원장 접근 없음.
- [ ] 같은 명령 및 기존 plan/craft-goal unit → PASS, 실패를 제품가드 완화로 고치지 않는다.
- [ ] 명시한4파일만 diff확인/로컬 commit `feat(iris): add scoped workbench editing and favorites`.

## Task 2: 기본 노출 작업목록과 안전한 행 편집

**Files:** Create PlanRow; Modify Queue; Create `tests/iris-ergon-list.browser.mjs`; Modify `tests/iris-ergon-queue.browser.mjs` (기존 보호 assertion 보존).

**Interfaces:**
- `DesktopErgonPlanRow({item,selected,disabled,confirmed,onSelect,onQuantity,onReplace,onRemove})`: item=ErgonPlanItem, selected/disabled:boolean, confirmed:number, onQuantity:(number)=>void, 나머지()=>void. 콜백은 유효한 commit 한 번만 호출.
- Queue Props에 `presentation?:'disclosure'|'workbench'`, `selectedId?:string`, `onReplace?:(id:string)=>void` 추가. default disclosure 유지로 standalone 기존호출 호환, workbench는 목록기본노출/통합계산접기. 기존 goals/snapshots/scope/onChangePlans/onSelect 계약 유지.

- [ ] 실제React fixture에 RED: 기본노출목록의 수량draft(빈값/0/최대), Enter+blur 저장1회/소비0, Escape원복, 선택명확/마지막제거/disabled입력콜백0/긴이름 접근가능. 확인진척은 기존identity조건을 지키는 assertion 추가.

```js
await page.getByLabel('검 추가 수량',{exact:true}).fill('20');
await page.getByLabel('검 추가 수량',{exact:true}).press('Enter');
await page.getByRole('button',{name:'검 선택',exact:true}).focus();
assert.equal(await page.evaluate(()=>window.trial.quantityCommits.length),1);
assert.equal(await page.evaluate(()=>window.trial.commands.length),0);
```
- [ ] Moon 번들 Playwright를 인자로 전달하여 `node tests/iris-ergon-list.browser.mjs C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json` → FAIL 확인. 이 인자형식은 기존 createRequire fixture 관례를 따른다.
- [ ] 행 UI를 구현하고 기존 Queue 행map을 재사용하도록 변경. 복제계획state/새진척계산 금지. 기존 참조조회32/직렬화/scope폐기 유지.
- [ ] 새 list 및 기존 queue/final-reservation browser를 같은 번들 인자로 실행 → PASS/console오류0/소비0. DOM선택자만 새표시계약에 맞추고 재료예약검증은 삭제하지 않는다.
- [ ] Task2 변경만 diff확인/commit `feat(iris): expose editable work list without duplicated queue state`.

## Task 3: 카탈로그·즐겨찾기·품목교체·3영역 통합

**Files:** Create Catalog; Modify DesktopErgon/Workbench/desktop.css; Create `tests/iris-ergon-catalog.browser.mjs`; Modify list 및 기존 workspace/goal-workbench/guided/remote-stock browser 기대표시.

**Interfaces:**
- `DesktopErgonCatalog({kind,search,items,favorites,onlyFavorites,disabled,replacing,onKindChange,onSearchChange,onFavoritesOnlyChange,onToggleFavorite,onChoose,onCancelReplace})`: kind=ErgonPlanItem['kind'], search:string, items:{name:string;available:boolean|null}[], favorites:ErgonFavorite[], onlyFavorites/disabled/replacing:boolean, onKindChange:(kind:ErgonPlanItem['kind'])=>void, onSearchChange:(value:string)=>void, onFavoritesOnlyChange:(value:boolean)=>void, onToggleFavorite/onChoose:(item:ErgonFavorite)=>void, onCancelReplace:()=>void. 통합부는 현재 유효한 공식 목록만 전달하고 미확인 즐겨찾기는 표시만 하며 실행하지 않는다.
- DesktopErgon은 Task1 편집결과→기존save→rootPlan 선택을 단일 경로로 사용한다. 즐겨찾기 state는 scope와 함께 보관하고 다른 scope의 값은 동기적으로 숨긴다. 즐겨찾기 조작은 게임 조회를 하지 않으며 현재 분류만 읽고 통합 참고조회 예산은 유지한다.

- [ ] 실제React RED: 드롭다운 없음/3영역, 같은분류·이름담기는선택만/수량불변, 교체는수량유지·새ID·옛goal미사용, 중복교체병합없음, 수량변경옛진척제외, 계정전환즐겨찾기분리·손상/쓰기실패원본보존, 50행선택/제거가능을 assertion으로 명시한다.

```js
assert.equal(await page.getByLabel('작업 계획',{exact:true}).count(),0);
assert.equal(await page.getByRole('region',{name:'전체 작업 대기열',exact:true}).isVisible(),true);
const before=await page.evaluate(()=>window.trial.reads.length);
await page.getByRole('button',{name:'검 즐겨찾기',exact:true}).click();
assert.equal(await page.evaluate(()=>window.trial.reads.length),before);
```
- [ ] 같은 시험에 Review Focus5 경합/예외를 추가한다: 이전scope지연목록응답/같은tick실행과교체/Enter후소비0/진척있는중복목표/쓰기제한즐겨찾기. 합성 행동spy0을 확인하고 native 수명은 기존collection회귀로 검증한다.
- [ ] 새catalog/list가 기존제품에서FAIL함을 확인한 뒤 Catalog와 단일선택/편집경로를 구현한다. 준비/확인/실행/미확정관측에 handler진입점도busy재확인하고disabled만믿지않는다. 드롭다운/중복편집기를 제거하되 history/materials진입점은보존한다.
- [ ] 기존 포커스 대화상자 또는 닫을 수 있는 inline패널로 교체한다. 바깥클릭/Escape/닫기후원래버튼초점복귀, 금/청록/중립/빨강/주황역할색+문자. 넓은창은공통현황후catalog/list/detail3열, 좁은창은list/detail우선·catalog펼침, 긴글은줄바꿈하고말줄임하지않는다.
- [ ] Workbench에서location별창고수량과미확인/잠김을분리한다. 기존조건부원격프리뷰와`전송기·부스러기·게임 확인 필요`, 비용미확인/참고불완전표시를유지한다. 행렌더에조회호출을넣지않는다.
- [ ] 새2browser와기존queue/final-reservation/workspace/workbench/guided-flow/remote-stock/polling/craft-goal/goal-workbench/quantity/collection을각각동일Moon인자로실행 → PASS. 15초조회/숨김정지/복귀중복없음/즐겨찾기조회0/늦은receipt가새잠금해제하지않음을검증한다.
- [ ] Task3에열거한제품/테스트만스테이징·diff확인후commit `feat(iris): integrate list-first catalog and compact workbench`.

## Task 4: 종합 검증·실화면 후보·인계

**Files:** Modify docs/BETA_FEEDBACK.md, DECISIONS.md, HANDOFF.md, relay/TO_SOONWOL.md, app/SANCTUM_MASTER_GUID.md. 릴리즈노트는 공식push 요청 때 갱신. 새 정책·설계승인/최신15%해제 기록.

- [ ] React 다중TSX 변경 후 react-best-practices checklist 적용. 전체 `rg --files tests -g '*.test.mjs'` 목록을 `node --test`에 전달, `npx tsc --noEmit`, 변경TS/TSX `npx eslint` → exit0/제외시험이 있으면 개수·이유 명시.
- [ ] 기존 iris-ui.fixture와격리build관례로비밀env없는사본 webpackbuild, 실제구동dev는오염하지않는다. 공식환경파일/서비스키복사·새의존성설치 금지.
- [ ] `powershell.exe -NoProfile -File iris/desktop-life-collection.tests.ps1` 및 executor/workspace bridge smoke → PASS, 합성결과를 실제게임성공으로 표현하지 않는다. native 제품변경 없이 지나는지diff확인.
- [ ] 320/390/768/1280·html18/20/22의긴품목/큰수치/빈목록/미확인/느린로딩·밝고어두운테마 캡처 확인, scrollWidth≤clientWidth/조작가능/포커스·Escape·바깥닫힘 확인. 실제화면은 `/iris/desktop`→에르곤→작업계획.
- [ ] 최종독립검토는 requesting-code-review 절차로한번, 중요사항재현/수정/관련회귀. 실제게임/원격모달/시설정원계약은검토로증명한것아니라명시.
- [ ] 앱 native 실수령은 사용자 직전승인·정상재시작 없이 실행하지 않는다. 현재UI만보기로검증가능한것과 native실검증대기를분리한다. 실제게임승인없음은 자동해결하지않고필요한시점에질문.
- [ ] 문서에변경·검증·미완료/최신사용량정책·금지사항기록,개인dirty미스테이징확인. 완료보고는확인된범위만,공식push/운영배포는새승인전0.

## 자체 검토 및 실행 인계

- Spec의편집/기존상태재사용=Tasks1~3,즐겨찾기=1/3,재료·원격조건/시인성/반응형=3/4,조회·소비보호=2~4,실검증경계=4로매핑.
- Review Focus5항목은Task1/2/3에명시시험추가. 계획schema1/기존goalidentity/소비API보존.
- 이계획은순서의존작업4개라현재세션직접구현을권장. 사용자계획검토뒤executing-plans로진행한다. 아직실행체크없음/제품변경없음.
