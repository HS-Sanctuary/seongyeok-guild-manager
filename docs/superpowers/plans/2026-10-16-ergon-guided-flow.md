# ERGON 현황·연속 작업 구현 계획

> **For agentic workers:** Use superpowers:executing-plans. Direct execution was requested; preserve the current feature checkout.

**Goal:** 현황3칸/15초 직렬 조회와 원래 목표를 유지하는 부족분 다음단계 동선을 구현한다.
**Architecture:** 기존 session 읽기와 Execution 인스턴스를 유지한다. 일반조회 scheduling만 단일 hook으로 분리하고 순수 next-step 계산을 기존 Workbench에 연결한다.
**Tech Stack:** React19, TypeScript, 기존 native action bridge, Node/실제React 합성시험.
**Spec:** docs/superpowers/specs/2026-10-16-ergon-guided-flow-design.md

## Global Constraints
- 공개버전/DB/native 소비계약/보호원본 변경 없음. snapshot15초, action관측2초 유지.
- 시작 때15% 중단을 철회했지만 후속 한설 지시로 이번5시간 잔여15% 중단·인계·기능브랜치push를 다시 적용한다. 최근 잔여58% 확인. 개인dirty 제외. 사용자 기존 지시에 따라 승인 대기를 반복하지 않고 직접 실행.
- 실제 게임 성공은 합성시험과 별도이며 자동소비/반복등록으로 과장하지 않는다.

## Review Focus
1. 숨김/잠금/범위변경 뒤 이전 조회가 다시 시작하거나 다른 계정값을 노출하는 경우.
2. 진행 중 등록품을 보유재고로 세거나 재등록해 과다생산하는 경우.
3. 선행 작업의 진척이 최종목표에 더해지거나 최종목표를 덮어쓰는 경우.
4. 오래된 다음단계/불명확경로를 클릭해 잘못된 품목·수량이 준비되는 경우.
5. 화면의 준비대기가 실행 차단과 서로 얽혀 최종확인/취소를 막는 경우.

## Task 1: 컴팩트 현황과 단일 일반조회
Files: DesktopErgon.tsx, DesktopErgonWorkbench.tsx, DesktopErgonExecution.tsx, useErgonSession.ts, 새 useErgonPolling.ts, desktop.css, tests/iris-ergon-polling.browser.mjs.
- [ ] 실제React 경계fixture로 15초이전0/15초후1묶음·중복0·숨김/준비/실행0·복귀즉시/3칸을 RED로 확인.
- [ ] 단일 polling hook/준비 중 일반조회 pause를 연결한다. 표시만 짧게 변경하고 안전관측주기는 유지.
- [ ] 같은browser 및 기존 workspace/collection 회귀 GREEN.

## Task 2: 가공대기/수령을 포함한 다음단계 계산
Files: 새 lib/irisErgonNextStep.ts, tests/iris-ergon-next-step.test.mjs.
Interface: selectErgonNextStep(preview, snapshots, now) -> 작업/대기/수령/확인필요. 공급미리보기의 순서대로 첫 미완료 단계만 반환, fresh근거 및 native 지원 범위 검사.
- [ ] 통나무 부족·가공 등록중대기·완료품수령·불명/오래됨·수량한도·막힌선행·중복경로 시험 RED.
- [ ] 순수 계산 구현. 등록품은 보유량으로 쓰지 않고 해당가공 등록을 중단하고 대기/수령 권유.
- [ ] node --test tests/iris-ergon-next-step.test.mjs GREEN.

## Task 3: 원래목표를 보존한 선행작업 연결
Files: DesktopErgon.tsx, DesktopErgonWorkbench.tsx, DesktopErgonSupplyPanel.tsx, 새 tests/iris-ergon-guided-flow.browser.mjs.
- [ ] 실제React 루트제작3/부족6→통나무준비·최종목표보존·돌아가기·계정/목표변경·unknown차단 RED.
- [ ] 다음단계를 펼친상태에서 보여주고 준비버튼으로 임시선행계획 연결. 기존 native최종동의 유지. 가공대기/수령 안내와 실제 완료후조회로 재계산.
- [ ] 신규/기존React 회귀·전체Node·타입/lint·build. 단일fresh최종리뷰/중요한지적 RED→GREEN 한 번. HANDOFF/릴레이 기록.

작업별commit 대신 완료시 허용파일만 checkpoint한다. 최신 사용자 지시에 따라 잔여15%에서 검증·인계를 마감하고 기능브랜치를 정상push한다.
