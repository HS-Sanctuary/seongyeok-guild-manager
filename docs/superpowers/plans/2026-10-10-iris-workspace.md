# IRIS Workspace Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 상점·임무의 기존 생텀 기록을 IRIS에서 안전하게 수정한다.
**Architecture:** 인증된 workspace API의 절대값 CAS와 기존 native 보호 큐를 연결한다. 하나의 compact 목록 컴포넌트가 종류별 카드 내용을 표시한다.
**Tech Stack:** Next.js/React/TypeScript, 기존 Supabase 서버 클라이언트, Windows C# DPAPI.
**Spec:** docs/superpowers/specs/2026-10-10-iris-workspace-design.md

## Global Constraints

- 운영 DB 구조/권한 변경, push/배포/공개 게시, 실게임 조작과 시험용 운영 쓰기는 제외한다.
- 마지막 수정 15초/지금 저장과 보호 대기함을 재사용한다.
- count와 bookmark는 독립된 편집 차원이다.
- 과거 대기함은 보존하고 새 native 지원 확인 전 편집 금지.
- 기존 미커밋 IRIS 변경을 보존하는 현재 codex/iris-checkboard-classes에서 계속한다. 추가 체크아웃/설계 승인 대기는 한설의 무인 진행 위임에 따라 생략한다.

## Review Focus

- 없는 진행 행의 동시 생성: 중복 PK는 확인 필요이며 기존 행을 덮어쓰지 않는다.
- 지난 기간 기록과 bookmark 유지: count만 초기화하며 별표는 보존한다.
- 계정당 품목을 다른 본인 캐릭터에서 편집: 동일 의도는 하나로 합치고 다른 계정은 격리한다.
- 결과 불명 뒤 재시작: 서버 재조회 전 자동 쓰기 금지.
- 12자 닉네임/장문/9999/320px: 가로 넘침·버튼 한 글자씩 세로 쌓임 금지.

### Task 1: 모델·인증 API

**Files:** lib/irisWorkspace.ts, lib/server/irisWorkspaceWrite.ts, app/api/iris/workspace/route.ts, tests/iris-workspace.test.mjs
**Interfaces:** buildWorkspaceDetails/validateWorkspaceEdit/WorkspaceKey/WorkspaceRow; readIrisWorkspace/saveIrisWorkspaceEdit. 기존 /api/iris/kronos GET의 선택 정보에 optional workspace를 추가.
- [x] 모델/기간/소유권/CAS/다른 차원 보존/모호한 결과 회귀를 먼저 작성.
- [x] `node --test tests/iris-workspace.test.mjs` 실패 확인.
- [x] 기존 schema의 private progress 대상에 절대값 CAS 구현, 카탈로그 지문과 현재 기간 비교.
- [x] 같은 테스트 GREEN 확인. DB 직접 적용 없음.

### Task 2: 큐·native·전송·controller

**Files:** lib/irisDesktop{Queue,Controller,Transport,Store,Presentation}.ts, iris/desktop-{store,bridge}.cs, 관련 tests
**Interfaces:** WorkspaceKey={itemKind,itemId,field,scope,periodKey,catalogKey}; workspace 편집의 baseCompleted/desiredCompleted는 count 또는 bookmark(0/1).
- [x] 15초/계정당 병합/unknown 복구/native 지원 거부 테스트 RED.
- [x] workspace kind와 독립 field 식별, 기존 저장·확인 경로 확장.
- [x] 관련 Node 및 native fixture GREEN 확인.

### Task 3: compact 목록·통합·검증

**Files:** components/iris/DesktopWorkspace.tsx, workspace CSS, DesktopCenter.tsx, app/iris/desktop/page.tsx, 관련 UI tests
- [x] 실제 React 동작에 검색·별표·계정당 표시·조작 콜백/긴문구 폭 회귀 RED.
- [x] 두 탭 활성화, 큐 overlay/15초·지금 저장 공통 상태 사용, 숨은 탭 조회 반복 없음.
- [x] 관련 테스트/타입·전체 Node 한 번/가능한 native·UI 검증. 실패 이름/범위를 기록.
- [x] 독립 최종 리뷰 후 핸드오프 기록. 외부 배포·운영 쓰기 없음.

## 실행 기록

- 영겁: 원격 main pull 최신(a36a2c2), 기존 dirty IRIS/즐겨찾기/개인 파일 변경 보존.
- 승인: 한설의 자율 구현 위임에 따라 inline 실행. 최종 검증 전 완료 주장하지 않는다.
- 2026-10-10 06:56 KST: workspace16회귀·protected-store7회귀·native/브라우저 검증 완료. 후속 Synaxis 포함 최종 전체Node481(478통과/3skip), 타입·격리56경로빌드 통과. 독립 리뷰 지적 수정 및 재리뷰 blocker0. 실제 운영 DB 쓰기·게임·native 실사용은 미검증/미배포로 HANDOFF에 기록.
