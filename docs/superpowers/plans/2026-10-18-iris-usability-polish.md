# IRIS Usability Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox syntax for tracking.

**Goal:** 한설이 지적한 크기·경계·추천 잘림을 해결하고 현재 IRIS에서 근거가 확인된 조작 불편을 자율 개선한다.

**Architecture:** 기존 React 화면과 native floating coordinator를 재사용한다. 독립 영역의 읽기 전용 점검 뒤 root가 단일 checkout에서 구현하며 게임 명령·종료 보호·기록은 변경하지 않는다.

**Tech Stack:** Next.js/React/TypeScript/CSS, Windows .NET Framework WinForms/WebView2, native fixture와 합성 React browser tests.

**Spec:** 2026-10-18 한설의 채팅 요구: 로고를 G버튼 크기에 가깝게, 키캡 글자/여백 축소, 로고 기준 좌우 끝·키캡 안쪽 보정, 플로팅 추천 선택버튼 무스크롤, 일반창 기존 중앙모달, 호버확장 안함. 추가로 명백한 IRIS 불편은 판단대로 개선/추가확인 불필요.

## Global Constraints

- 현재 폴더와 기존 미커밋 변경/개인 dirty 보존. 새 push/운영 배포/공개 ZIP/DB·권한·게임소비 없음.
- 로고 기본36DIP, 기본 키캡57×20DIP·간격2DIP. 이전v1/2의52만36으로 일회 이전, 사용자 지정 다른 크기/위치/키/투명도·창모드 설정 유지.
- 메뉴 크기·위치와 labels를 읽기 쉽게 유지하되 hover 확장/반복회전 없음.
- 정상 종료는 사용자 확인 후 한 번만 재실행, 강제종료 금지.

## Review Focus

1. 다중DPI·좌우끝·긴단축키: 로고가끝까지가며키캡은화면안에남는다. native fixture의96/144/192모서리/긴문구반례로검사.
2. v1/2/3설정:52기본만이전하고v3에서직접선택한52는다시바꾸지않는다. 저장/재로드fixture검사.
3. 일반창↔플로팅:추천중복/임의선택없고normalmodal배경보호·floating비모달유지. 실Reactmode전환검사.
4. 짧은패널·큰글자:180px추천영역에모든선택버튼이무스크롤표시. 실React18/20/22검사.
5. 추가UX수정은실행보호·설정/원장보존을우회하지않는다. 관련기존suite와단위/실React회귀검사.

### Task 1: 요청된 compact·경계·설정 이전

**Files:** iris/desktop-floating.cs, desktop-floating-host.cs, desktop-floating-store.cs, lib/irisFloating.ts, components/iris/floating-hub.css; tests iris/desktop-floating.fixture.cs, tests/iris-floating-keycap.browser.mjs.

**Interfaces:** 기존 FloatingLayout.Calculate/Geometry, prefs DTO와 파일경로 유지. 내부저장version3.

- [x] 로고기준left8/right1272·독립badge정렬·36/57×20/gap2·old52이전RED확인.
- [x] 최소코드와새기본값, v1/2읽기/v3쓰기·old52만이전구현.
- [x] v3직접52재선택/긴shortcut/DPI/기존native·browser최종회귀(별도addon기준코드실패는QA에보존).

### Task 2: 추천 표시·내용

**Files:** components/iris/DesktopNotificationHost.tsx, useIrisNotifications.tsx, DesktopCharacterWatch.tsx, DesktopStatsSession.tsx, notification-bubble.css; tests/iris-character-notice-placement.browser.mjs, iris-character-compact.browser.mjs.

**Interfaces:** CharacterNotice.compactContent?/dismissDisabled? 추가, 기존 content와선택콜백유지.

- [x] 정상중앙dialog·inert복원/180px무스크롤버튼RED확인.
- [x] normalFocusDialog·floatingcompact분리/중복내용축약/confirm중접기보호.
- [x] 기존character/notification시험을각모드에맞게확인하고소리요청경로보존·알림10초·사용자선택보호검사(실청취별도).

### Task 3: 명백한 불편 점검·최소 수정

**Files:** 읽기전용 audit가 특정하는 기존 IRIS 파일. 새 하위시스템 없음.

**Interfaces:** 기존 props/native 계약 재사용, 불편별 근거/수정/검증을 QA문서에 기록.

- [x] native배치와내부workflow를독립읽기점검/구체적3건씩접수.
- [x] 조작방해·잘림·중복설명·낡은도움말 우선 선택, 불필요확장은보류.
- [x] 선택한문제마다실패하는관련시험→최소수정→PASS. 문구만수정은별도소스assertion시험을만들지않음. 전범위관측불가영역명시.

### Task 4: 검증·인계

- [x] Node전체/tsc/변경lint/nativepolicy·chrome·addon/비공개compile/실React회귀와독립코드검토. addon시험실패/기준HEAD동일재현으로전체nativePASS아님을기록.
- [x] 실패/skip·실게임미검증/실행앱미적용구분·QA/HANDOFF/master/relay기록. 요청없는commit/push없음.
- [x] 사용자가정상종료하면 최신Development한번재실행·오류로그/응답상태확인, 확인할화면안내. 16:40KST Development29208/응답true/로그0; 실제화면·게임위조작/소리는사용자확인대기.
