# IRIS 애드온 바 탐색 정리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 7개 크로노스 기능을 보존하고 현재 기능 + 묶음 선택 패널로 탐색 화면을 정리한다.

**Architecture:** 기능 이름·그룹·초점 동작을 작은 `DesktopFeaturePicker`로 분리한다. `DesktopCenter`는 기존 활성 기능과 패널 수명을 유지하며 캐릭터·상위 메뉴·설정과 선택 패널의 열림 상태를 조정한다. native/API/DB는 변경하지 않는다.

**Tech Stack:** 기존 React 19 / TypeScript / 테마 CSS / 합성 React fixture / Playwright. 새 의존성 없음.

**Spec:** `docs/superpowers/specs/2026-10-11-iris-navigation-design.md`

**Status:** 한설이 계획대로 이 세션에서 직접 구현하는 Native 방식을 승인했다. 화면 변경과 회귀 테스트가 같은 상태 흐름에 의존하므로 작업별 에이전트를 늘리지 않는다. 제품 구현/검증 완료와 별개다.

## Global Constraints

- 기존 DesktopTab ID 7개와 크로노스/시낙시스·아이콘·제목·버전·캐릭터·계정/홈/설정 위치 유지.
- DB/API/권한·보호 기록 형식·native bridge·게임 조작·새 라이브러리 변경 없음.
- 클래스 초안/보호 대기함/미저장 기록 유지. 숨긴 기존 본문을 불필요하게 unmount하지 않는다.
- 320/390/768/1280px, PC 18/20/22px 기본 글자, 6테마·rem·12자 닉네임 보존.
- 패널 바깥 클릭/Escape/선택 닫힘·초점 복귀·잠금 방어. 메뉴 열기만으로 IO 호출 없음.
- 사용자 기존 미커밋 파일 제외. 새 버전·외부 push·운영 쓰기·공개 공지 제외.

## Review Focus

1. 같은 기능 재선택: 조회/저장이 중복 실행되지 않는다. Task 1.
2. 메뉴를 연 채 잠금·캐릭터·상위 메뉴·설정 변경: 남은 패널/초점이 다른 조작을 방해하지 않는다. Task 1.
3. 클래스 편집 중 기능 왕복: 입력/초안/보호 기록이 사라지지 않는다. Task 2.
4. 숨긴 패널: Tab으로 진입하거나 선택 버튼이 중복 조회되지 않는다. Task 1.
5. 큰 글자·긴 이름·작은 높이: 패널 안에서 읽고 조작할 수 있고 본문 가로 넘침이 없다. Task 2.

## File Structure

- Create `components/iris/DesktopFeaturePicker.tsx`: 7개 이름/3그룹·선택 패널·열기/닫기/초점.
- Modify `components/iris/DesktopCenter.tsx`: 기존 tab 전환 유지, picker 열림 조정, 필요한 경우 내부 prop `contextPanelOpen?: boolean` 추가.
- Modify `app/iris/desktop/page.tsx`: 위 prop이 필요하면 `accountOpen || settingsOpen` 연결만 추가.
- Modify `app/iris/desktop/desktop.css`: 선택 줄·패널·그룹 스타일만 범위 한정 추가.
- Modify `tests/iris-synaxis.fixture.mjs`: 합성 잠금/탭 변경 로그/캐릭터 변경 제어 추가.
- Modify `tests/iris-navigation.browser.mjs`: 기존 직접 탭 클릭을 선택 도우미로 바꾸고 아래 회귀 추가.
- Modify `tests/iris-workspace-ui.test.mjs` 및 다른 실제 탭 사용 시험: 탐색 진입 부분만 새 구조에 맞춘다.

### Task 1: 선택 패널과 기존 전환 연결

**Interfaces:** `KronosTab = 'homework'|'classes'|'stats'|'currencies'|'barter'|'shop'|'missions'`; 기존 이름과 ID를 `DesktopFeaturePicker`에서 export한다. Props는 `{value:KronosTab;disabled:boolean;open:boolean;onOpenChange(open:boolean):void;onChoose(tab:KronosTab):void}`. 현재 기능은 항상 표시하고 호출 버튼의 접근성 이름은 `기능 선택`이다.

- [x] 브라우저 시험 `grouped feature selection preserves all seven IDs`를 먼저 추가한다. `await page.getByRole('button',{name:'기능 선택',exact:true}).click()` 후 3개 그룹과 7개 버튼을 확인하고, 선택 후 `data-active-tab` 및 패널 닫힘을 검사한다. 현재 코드에서는 호출 버튼이 없어 실패해야 한다.
- [x] 기존 fixture 실행 경로로 실패를 확인한다: `node tests/iris-navigation.browser.mjs C:/Users/Moon/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/package.json`.
- [x] 컴포넌트 구현·`DesktopCenter` 연결. `choose`의 실제 변경 시 1회 callback, 패널 mount 유지, 마지막 kronosTab 기억을 보존한다. 선택 메뉴를 열면 캐릭터 메뉴를 닫고 그 반대도 닫는다.
- [x] 시험 `picker dismissal, focus and hidden keyboard controls` 추가: Escape는 호출 버튼 복귀, 선택 후 현재 기능 위치 복귀, 외부 클릭은 클릭 대상 조작 허용, 닫힌 목록은 Tab에 잡히지 않음.
- [x] 시험 `picker closes on context transitions and lock` 추가: 캐릭터/시낙시스/설정/계정/잠금 변경마다 닫힘; 잠금 중 선택 불가. 선택 함수 호출 기록은 같은 기능 재선택/열기·닫기에 추가되지 않아야 한다.
- [x] 위 브라우저 명령 재실행 PASS 확인. 해당 Task 파일만 diff 후 로컬 commit한다. 운영 push하지 않는다.

### Task 2: 테마·회귀·시각 확인

**Interfaces:** Task 1의 picker props와 `기능 선택` 접근성 이름을 재사용한다. 시험 helper `async function chooseFeature(page,name)`는 호출 버튼을 열고 정확한 기능 버튼을 선택한다. 기존 기능 검증의 의도/IO assertion은 바꾸지 않는다.

- [x] 시험 `class draft survives feature and section round trips` 추가: 클래스 초안을 바꾸고 다른 기능/시낙시스/설정 왕복 후 같은 값과 pending 기록을 확인한다. 초안 유실 또는 불필요한 IO는 실패다.
- [x] `tests/iris-navigation.browser.mjs`의 기존 SVG/확인창 검증을 보존하며 호출 진입만 helper로 변경한다. 관련 다른 브라우저/DOM 시험의 직접 탭 사용도 찾아 같은 방법으로 변경한다.
- [x] 선택 줄과 선택 패널 CSS를 추가한다. 3그룹이 동시에 보이고 그룹별 재진입은 없으며, 좁은 높이에는 내부 스크롤이 적용된다.
- [x] 시험 `group picker layout and contrast`에서 320/390/768/1280px·PC 18/20/22px·6테마를 확인한다. 가로 넘침/클리핑 없는지, 선택·초점 대비, 짧은 높이의 마지막 버튼 도달을 검사한다.
- [x] `node --test tests/iris-desktop-controller.test.mjs tests/iris-desktop-queue.test.mjs tests/iris-workspace-ui.test.mjs tests/iris-workspace-queue.test.mjs tests/iris-hotfix-display.test.mjs` PASS. 시험의 탭 구조 assertion만 변경하고 기존 저장/수치 검증은 완화하지 않는다.
- [x] `npx tsc --noEmit`, 브라우저 시험, `npm run build` 각각 종료 코드 0 확인. 개발 서버가 쓰는 빌드 폴더와 충돌하면 기존 격리 빌드 절차를 적용하며 실행 중 앱을 종료하지 않는다.
- [x] 밝은/어두운 390px 화면을 눈으로 확인하고 합성 데이터임을 표시한다. 변경 diff·문서 검증 상태를 보고하고 로컬 commit한다. 실제 앱/운영 계정 시험과 배포는 별도다.

## 사용자 확인

설계 승인 후 작성된 계획이다. 사용자에게 이 계획과 직접 구현(Native) 권장 방식을 한 번 확인받은 뒤 실행한다. 미래 HUD 설계 문서는 보관용이며 이 계획과 섞어서 구현하지 않는다.

## 실행 결과 — 2026-10-11, 로컬 완료

- 한설의 설계·직접 실행 승인 후 Task1 `6fd6d3d`로 구현했다. 외부 push/새 버전/게임·DB 쓰기는 없다.
- RED: 기존 상시 탭, 짧은 높이의 내부 스크롤 부재, Elysium 선택 글자 대비2.10을 각각 실패로 확인한 뒤 수정했다. 최종 리뷰의 실제 상단 위치를 무시한 높이 제한도 내부 스크롤만으로 마지막 버튼이 화면 밖임을 확인한 뒤 수정했다.
- 최종 새 합성 브라우저5그룹 PASS: 7개 ID/그룹·동일 기능 재선택 IO0, 닫힘/키보드/상호 배타성, 문맥 전환/잠금, 클래스 초안 유지, 4폭·PC3글자·6테마·짧은 높이. 기존 SVG/확인창6그룹도 PASS. 밝고 어두운390px 캡처를 눈으로 확인했다. 캡처는 합성 데이터다.
- 전체 Node415 중412 PASS·3 skipped·0 fail, 독립 TypeScript exit0, 격리 webpack build57 exit0 (`sanctum-iris-build-zHNLOM`). 다른6개 브라우저 진입부를 변경했으나 모두 실행하지는 않았다. 실제 사용자 앱·게임·다른 PC 시험은 별도다.
- 검토는 새 독립 리뷰어1회, 중요 문제1개 RED→GREEN 수정과 최종 검증으로 종료했다. CSS 테마 전환이 끝난 후 대비/캡처를 측정했다. 합성 시험 같은3011포트 병행 실패는 순차 재실행으로 해소했다.

### 실행 중 판단과 비용

1. 기존 호스트/공유 작업 폴더·기능 브랜치를 유지했다. 사용자 미커밋 파일을 제외한 경로별 커밋으로 보존한다. 별도 worktree보다 같은 브랜치를 공유하는 위험이 있다.
2. 상호작용 시험을 별도 `iris-feature-picker.browser.mjs`로 분리해 픽셀 시험 반복을 줄였다. 시험 진입점이 둘이 되는 유지 비용이 있다.
3. Task1에 작은 CSS와 집중5시험을 포함해 먼저 usable하게 했다. Task2와 CSS 작업 경계가 겹치지만 제품 범위는 늘리지 않았다.

후속5설계/49항목은 `docs/IRIS_FORWARD_DESIGNS.md`에서 보관한다. 현재 후보는 로컬 브랜치에 유지하며 통합/배포 선택은 한설에게 맡긴다.
