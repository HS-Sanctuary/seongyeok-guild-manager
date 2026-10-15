# ERGON 통합 대기열 B1 구현 계획

Goal: 여러 추가 생산 목표의 재고 예약·부족 경로·시설 완료 상황을 한 화면에서 확인한다.
Architecture: 기존 순수 supply planner에 공유 컨텍스트를 추가하고, 시설 관측 모델과 읽기전용 통합 큐 UI를 기존 관제실에 연결한다. 기존 실행/native/보호 원장은 변경하지 않는다.
Tech Stack: TypeScript, React19, 기존 Ergon session/native read bridge, Node test, 실제 React 합성 browser fixture.
Spec: `docs/superpowers/specs/2026-10-13-ergon-quantity-stop-design.md` §6 B1.

## Global Constraints

- 사용자 즉시 구현 지시에 따라 이 계획을 작성하고 직접 실행한다. 별도 승인 대기를 반복하지 않는다. 기존 기능 checkout 유지 선호와 개인 파일 보존을 따른다.
- 목표 추가1..1,000,000/계획50, 통합32노드·4깊이, 기존 단일 preview32노드·8깊이. 설치 참고는 complete:false 유지, 총예산 실행 권위로 승격하지 않는다.
- 신규 소비·stop·unknown 해제·운영DB/배포0. CLI/native 행동 계약/공개 버전 유지. 공식 snapshot15초 유효/기존10초 idle 조회·계정경계/실행중 조회차단 유지.
- 변경 경로는 lib/irisErgonSupply.ts, 새 lib/irisErgonFacilities.ts, 새 components/iris/DesktopErgonQueue.tsx, DesktopErgon.tsx/Workbench.tsx, scoped desktop.css 및 관련 tests/docs. 개인 dirty는 제외한다.
- 5시간 잔여15%면 새 작업 중단, 필요한 검증·문서 인계·정상 기능브랜치 push. 실게임은 영겁의 별도 최종 동의 시험이며 자동시험과 구분한다.

## Review Focus

1. 공유 재고와 예상 산출/최종 목표를 섞어 과소 생산하는 경우.
2. 깊이/노드 제한 뒤 일부 목표가 완료로 보이거나 부분 재료표가 실행 권위가 되는 경우.
3. 계정/캐릭터 전환·잠금·늦은 참고응답이 다음 범위에 남는 경우.
4. 등록 작업 수를 정원으로 오인하거나 미확인 완료·시설 전체수령 범위를 숨기는 경우.
5. 기존 실행 컴포넌트 재생성/목표 편집이 승인된 실행을 바꾸거나 idle 조회가 게임 동의와 경합하는 경우.

## Task 1: 공유 재고를 사용하는 통합 공급 미리보기

Files: lib/irisErgonSupply.ts, tests/iris-ergon-supply.test.mjs.
Interfaces: 기존 buildErgonSupplyPreview(input) 계약 유지. 새 buildErgonSupplyBatchPreview(input: Omit<ErgonSupplyInput,'kind'|'displayName'|'additionalQuantity'> & {plans:ErgonPlanItem[]}):ErgonSupplyPreview. 단일과 통합은 동일 공급 계산을 재사용하되 통합은4깊이 제한.

1. 두 목표 공유통나무5/필요4+4=부족3, root추가수량 보유품 제외, 예상 잔량만 공유, 32노드/4깊이·빈/50초과를 테스트로 먼저 작성.
2. `node --test tests/iris-ergon-supply.test.mjs` → 신규 함수/행동 부재 FAIL 확인.
3. 공유 컨텍스트/명시적 경계·기존 단일 결과 유지 구현.
4. 동일 명령 → 전체 PASS, 기존 단일 계산 회귀0.
5. 작업별 커밋 대신 최종 인계 커밋에 허용 파일만 묶는다(공유 checkout의 미완료 사용자 변경을 보호).
Whole-task verification: `node --test tests/iris-ergon-supply.test.mjs`.

## Task 2: 시설별 등록·완료·수령 검토 모델

Files: lib/irisErgonFacilities.ts, tests/iris-ergon-facilities.test.mjs.
Interfaces: summarizeErgonFacilities(snapshot:ErgonSnapshot<'works'>|null|undefined,now:number) → {fresh:boolean,facilities:{name,registered,completed,pending,unknown,nextReadySeconds,reviewCollection,capacity:null}[]}. 등록수≠정원/조회실패≠0.

1. 등록7/완료4→검토, 완료3→대기, 모름/오래됨→검토false, 2시설 분리·최소 남은시간과 다른품목 범위 테스트 작성.
2. `node --test tests/iris-ergon-facilities.test.mjs` → 함수 부재 FAIL.
3. 순수 모델 구현, 완료목록·안내만 제공/게임 명령 없음.
4. 동일 명령 → PASS.
Whole-task verification: `node --test tests/iris-ergon-facilities.test.mjs`.

## Task 3: 기존 관제실에 통합 큐·시설 관측 연결

Files: components/iris/DesktopErgonQueue.tsx, DesktopErgon.tsx, DesktopErgonWorkbench.tsx, app/iris/desktop/desktop.css, tests/iris-ergon-queue.browser.mjs.
Interfaces: Queue는 plans/snapshots/now/scope/active/readReference/onChangePlans/onSelect를 소비, SupplyBatchPreview/FacilitySummary를 사용한다. 선택 작업의 기존 Execution 인스턴스는 그대로 유지한다. 참고 조회는32개 직렬/범위별 캐시/늦은 응답 폐기/자동실행0.

1. 실제 React 합성 시험에서 두 목표 전체의 부족분, 수량 수정/선택/제거, 늦은 참고응답 범위 격리, 잠금 시 신규 조회0, 시설 안내/320·390·720·1240 및 글자18/20/22 테스트 작성.
2. `node tests/iris-ergon-queue.browser.mjs <bundled packages package.json>` → 큐 UI 부재 FAIL.
3. 컴팩트 큐/시설 요약을 연결, 보관한 계획 원본·현재 실행 보호 유지.
4. 새 browser + 기존 workspace/workbench/craft/quantity/supply 실제React PASS, 전체 Node/tsc/관련lint·격리build 검증. native미변경은 관련 기존 회귀로 검증한다.
Whole-task verification: `node tests/iris-ergon-queue.browser.mjs C:/Users/sungw/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json`.

## 마감

2026-10-15 마감: Tasks1..5 자동시험 완료, 단일fresh review Important1(완료최종품 재할당) unit+실제Queue RED→GREEN 수정/재리뷰0. 최종629/626PASS3skip·독립타입/관련lint0·수정본격리58PASS/native기존회귀·privatecompilePASS. 실게임/전체자동chain/B2·실제unknown복구/공개운영배포는 미완료. 상세판단·검증·집순서는HANDOFF/IRIS_YEONGGEOP_HANDOFF. 신규기능확대없이사용량잔여19%부터인계push마감준비.

한 번의 fresh 최종 리뷰(이번498e254 이후 범위만), 중요 지적 한 번 RED→GREEN 수정. 실제 게임·보호 복구·자동 생산chain 미완료를 숨기지 않는다. 인계 문서4개/REA_SETUP·수신ACK 포함, 공개버전·main·패키지·공지 유지. 영겁에게 정확한 HEAD/시험/남은 실검증을 전달한다.

## Task 4: 큰 추가 제작 목표의 확인된 진척·수동 다음 묶음

Files: 새 lib/irisErgonCraftGoal.ts, components/iris/DesktopErgonExecution.tsx, tests/iris-ergon-craft-goal.test.mjs, tests/iris-ergon-craft-goal.browser.mjs.
Interfaces: pure create/next/attach/observe/stop/renew 제작목표 상태. 기존 legacy ErgonRunQueue 유지; quantityCrafting native에는 최대5회만 전달하며 native 계약 변경 없음.

1. 목표20/산출1→요청5, 실제completed5→남은15/중복응답0추가, 산출3/목표7→3회9개, cost/metadata/scope 불일치·unknown→차단, 진행중후속0, 5분/5명령/25날개·메뉴중지/새묶음진척보존 시험 작성.
2. `node --test tests/iris-ergon-craft-goal.test.mjs` → 행동 부재 FAIL.
3. 순수 목표 모델 최소 구현→같은 시험 PASS.
4. 실제 React 목표20→요청5→완료5/남은15→수동 다음5, 자동실행0/완료목표 중복차단/기존3개·null장비/느린동의·범위변경 보존 시험. 신규 browser RED→GREEN 후 전체 Node/tsc/lint/관련React 재검.
Whole-task verification: `node --test tests/iris-ergon-craft-goal.test.mjs` + `node tests/iris-ergon-craft-goal.browser.mjs`.

## Task 5: 확인된 제작량을 통합 대기열·남은 필요 재료에 반영

Files: DesktopErgonExecution.tsx, DesktopErgon.tsx, DesktopErgonQueue.tsx, irisErgonCraftGoal.ts, 새 tests/iris-ergon-goal-workbench.browser.mjs.
Interfaces: Execution은 현재 goal의 planId/identity/confirmedOutput만 typed onCraftProgress로 전달, 부모는 환경·계정·캐릭터 범위에서 보관 목표 원본과 별도 메모리 진척을 유지한다. Queue/Workbench는 남은 목표를 사용하고 저장된 원본 추가 수량은 바꾸지 않는다.

1. 실제 integrated React 목표20/완료5→큐 제작15/재료60, 원본20 유지; 완료20→부족분 작업없음/명시적 새 추가 목표→20 복구, 목표수정→새 목표/계정분리 검증. 먼저 기존 동작 FAIL.
2. native 완료 이벤트→typed 메모리 진척→남은 목표 계산 연결. 회당 산출·동일planId/원래목표/캐릭터 일치할 때만 적용. 편집·새 목표는 명시적으로 재설정, 과거 이력은 사용하지 않는다.
3. 새 통합 browser→PASS, 기존 새/구 관제실·수량·craft-goal 회귀 PASS.
Whole-task verification: `node tests/iris-ergon-goal-workbench.browser.mjs`.
